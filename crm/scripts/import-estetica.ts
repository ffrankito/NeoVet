/**
 * GVet estética CSV → NeoVet grooming sessions import
 *
 * Usage:
 *   npx tsx scripts/import-estetica.ts --file docs/estetica.csv --staff <staff_id>
 *   npx tsx scripts/import-estetica.ts --file docs/estetica.csv --staff <staff_id> --dry-run
 *
 * The --staff argument is required: it must be the ID of an existing staff member
 * who will be recorded as the groomer for all imported sessions (since GVet's
 * "Usuario" field is not mapped to NeoVet staff).
 *
 * Expected CSV columns: Fecha, Cliente, Paciente, Tipo, Usuario, ¿Está pagado?, Costo
 *
 * Design decisions:
 *   - Ignores "Usuario" field — not mapped to NeoVet staff.
 *   - All sessions imported as paid (no charges created — historical data).
 *   - Original GVet "Tipo" stored in notes for traceability.
 *   - Argentine date formats parsed (DD/MM/YYYY, DD-MM-YYYY).
 *   - Currency parsed: optional $ sign, dots as thousands separator, comma as decimal.
 *   - Auto-creates grooming profile if one doesn't exist for the patient.
 *   - Dedup: skips if a grooming session already exists for that patient on that date.
 */

import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";

// ---------------------------------------------------------------------------
// Column map — matched to GVet estética CSV headers
// ---------------------------------------------------------------------------
const COL = {
  date:        "Fecha",
  clientName:  "Cliente",
  patientName: "Paciente",
  tipo:        "Tipo",
  usuario:     "Usuario",   // ignored — not mapped to staff
  paid:        "¿Está pagado?",
  cost:        "Costo",
} as const;

// ---------------------------------------------------------------------------
// ID helper (mirrors src/lib/ids.ts — inline to avoid tsconfig path issues)
// ---------------------------------------------------------------------------
function createId(prefix: string): string {
  return `${prefix}_${randomUUID().replace(/-/g, "").slice(0, 16)}`;
}

// ---------------------------------------------------------------------------
// CSV parser (handles quoted fields, multiline-safe for simple CSVs)
// ---------------------------------------------------------------------------
function parseCSV(content: string): Array<Record<string, string>> {
  const lines = content.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
  if (lines.length < 2) return [];

  const rawHeaders = splitCSVLine(lines[0]);
  const headers = rawHeaders.map((h) => h.trim());

  const rows: Array<Record<string, string>> = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const values = splitCSVLine(line);
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      row[h] = (values[idx] ?? "").trim();
    });
    rows.push(row);
  }
  return rows;
}

function splitCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

// ---------------------------------------------------------------------------
// Date parsing — handles Argentine formats: DD/MM/YYYY, DD-MM-YYYY
// Falls back to native Date parse for other formats.
// ---------------------------------------------------------------------------
function parseArgDate(raw: string): Date | null {
  if (!raw) return null;

  // DD/MM/YYYY or DD-MM-YYYY
  const ddmmyyyy = raw.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (ddmmyyyy) {
    const [, dd, mm, yyyy] = ddmmyyyy;
    return new Date(`${yyyy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}T12:00:00-03:00`);
  }

  // Fallback: native Date parse (e.g. YYYY-MM-DD)
  const d = new Date(raw);
  return isNaN(d.getTime()) ? null : d;
}

// ---------------------------------------------------------------------------
// Currency parsing — handles "$1.500,50", "1500.50", "1500,50", "1500"
// Returns a string suitable for Drizzle numeric columns, or null.
// ---------------------------------------------------------------------------
function parseCurrency(raw: string): string | null {
  if (!raw) return null;
  // Strip $ and whitespace
  let s = raw.replace(/[$\s]/g, "");
  if (!s) return null;

  // If there's both a dot and a comma, determine which is decimal
  const hasDot   = s.includes(".");
  const hasComma = s.includes(",");

  if (hasDot && hasComma) {
    // e.g. "1.500,50" → dot is thousands separator, comma is decimal
    s = s.replace(/\./g, "").replace(",", ".");
  } else if (hasComma && !hasDot) {
    // e.g. "1500,50" → comma is decimal
    s = s.replace(",", ".");
  }
  // else dot is already decimal (e.g. "1500.50") or no separators (e.g. "1500")

  const n = parseFloat(s);
  return isNaN(n) ? null : String(Math.round(n * 100) / 100);
}

// ---------------------------------------------------------------------------
// Arg parsing
// ---------------------------------------------------------------------------
function parseArgs(argv: string[]) {
  const args: Record<string, string | boolean> = {};
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg.startsWith("--")) {
      const key = arg.slice(2);
      const next = argv[i + 1];
      if (!next || next.startsWith("--")) {
        args[key] = true;
      } else {
        args[key] = next;
        i++;
      }
    }
  }
  return args;
}

// ---------------------------------------------------------------------------
// .env.local loader
// ---------------------------------------------------------------------------
function loadEnv() {
  for (const envFile of [".env.local", ".env"]) {
    const envPath = path.resolve(process.cwd(), envFile);
    if (!fs.existsSync(envPath)) continue;
    for (const line of fs.readFileSync(envPath, "utf-8").split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx === -1) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      const value = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, "");
      if (!(key in process.env)) process.env[key] = value;
    }
    break;
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  const args = parseArgs(process.argv.slice(2));
  const file      = args["file"]   as string | undefined;
  const staffId   = args["staff"]  as string | undefined;
  const dryRun    = args["dry-run"] === true;

  if (!file) {
    console.error("Error: provide --file <path.csv>");
    console.error("Usage: npx tsx scripts/import-estetica.ts --file docs/estetica.csv --staff <staff_id>");
    process.exit(1);
  }
  if (!staffId) {
    console.error("Error: provide --staff <staff_id> (the fallback groomer for all imported sessions)");
    console.error("Tip: run `npx tsx -e \"import('../src/db/schema/index.js').then(async s => { ... })\"` to list staff IDs,");
    console.error("     or check the staff table in your Supabase dashboard.");
    process.exit(1);
  }

  if (dryRun) console.log("DRY RUN — no data will be written.\n");

  loadEnv();

  const { DATABASE_URL } = process.env;
  if (!DATABASE_URL) {
    console.error("Error: DATABASE_URL environment variable is not set.");
    process.exit(1);
  }

  const filePath = path.resolve(process.cwd(), file);
  if (!fs.existsSync(filePath)) {
    console.error(`Error: file not found: ${filePath}`);
    process.exit(1);
  }

  const { default: postgres }  = await import("postgres");
  const { drizzle }             = await import("drizzle-orm/postgres-js");
  const { clients, patients, groomingSessions, groomingProfiles, services, staff } =
    await import("../src/db/schema/index.js");
  const { eq, and, sql } = await import("drizzle-orm");

  const pg = postgres(DATABASE_URL, { max: 1 });
  const db = drizzle(pg, {
    schema: { clients, patients, groomingSessions, groomingProfiles, services, staff },
  });

  // Verify staff ID exists before processing anything
  const staffRow = await db
    .select({ id: staff.id, name: staff.name })
    .from(staff)
    .where(eq(staff.id, staffId))
    .limit(1);

  if (!staffRow.length) {
    console.error(`Error: staff member with ID "${staffId}" not found in the database.`);
    await pg.end();
    process.exit(1);
  }
  console.log(`Groomer de fallback: ${staffRow[0].name} (${staffRow[0].id})\n`);

  // Load all estética services upfront to avoid N+1 lookups
  const esteticaServices = await db
    .select({ id: services.id, name: services.name })
    .from(services)
    .where(eq(services.category, "estetica"));

  console.log(`Servicios de estética encontrados: ${esteticaServices.length}`);
  if (esteticaServices.length > 0) {
    for (const s of esteticaServices) {
      console.log(`  - ${s.name} (${s.id})`);
    }
  }
  console.log();

  const content = fs.readFileSync(filePath, "utf-8");
  const rows = parseCSV(content);

  console.log(`Procesando: ${filePath}`);
  console.log(`Filas encontradas: ${rows.length}\n`);

  let inserted = 0;
  let skipped  = 0;
  let warnings = 0;

  for (let i = 0; i < rows.length; i++) {
    const row    = rows[i];
    const rowNum = i + 2; // 1-indexed + skip header

    const dateRaw     = row[COL.date];
    const clientName  = row[COL.clientName];
    const patientName = row[COL.patientName];
    const tipo        = row[COL.tipo] || null;
    const costRaw     = row[COL.cost] || null;

    // --- Basic validation ---
    if (!dateRaw) {
      console.warn(`  WARN  Fila ${rowNum}: fecha vacía — omitiendo.`);
      warnings++; skipped++; continue;
    }
    if (!patientName) {
      console.warn(`  WARN  Fila ${rowNum}: nombre de paciente vacío — omitiendo.`);
      warnings++; skipped++; continue;
    }
    if (!clientName) {
      console.warn(`  WARN  Fila ${rowNum}: nombre de cliente vacío (paciente: "${patientName}") — omitiendo.`);
      warnings++; skipped++; continue;
    }

    // --- Parse date ---
    const sessionDate = parseArgDate(dateRaw);
    if (!sessionDate) {
      console.warn(`  WARN  Fila ${rowNum}: fecha inválida "${dateRaw}" — omitiendo.`);
      warnings++; skipped++; continue;
    }
    const dateISO = sessionDate.toISOString().split("T")[0]; // YYYY-MM-DD for dedup query

    // --- Parse cost ---
    const finalPrice = parseCurrency(costRaw ?? "");

    // --- Match service by tipo ---
    let serviceId: string | null = null;
    if (tipo) {
      const matched = esteticaServices.find(
        (s) => s.name.toLowerCase() === tipo.toLowerCase()
      );
      if (matched) {
        serviceId = matched.id;
      } else {
        // Not a blocking error — store tipo in notes, leave serviceId null
        console.log(
          `  INFO  Fila ${rowNum}: tipo "${tipo}" no coincide con ningún servicio de estética — serviceId quedará null.`
        );
      }
    }

    if (dryRun) {
      console.log(
        `  [dry-run] Fila ${rowNum}: "${patientName}" (${clientName}) — ${dateRaw} — tipo: "${tipo ?? "(vacío)"}" — costo: ${finalPrice ?? "(sin precio)"}`
      );
      inserted++;
      continue;
    }

    // --- Find client by name (case-insensitive) ---
    const clientRows = await db
      .select({ id: clients.id })
      .from(clients)
      .where(sql`lower(${clients.name}) = lower(${clientName})`)
      .limit(1);

    if (!clientRows.length) {
      console.warn(
        `  WARN  Fila ${rowNum}: cliente no encontrado ("${clientName}") — paciente: "${patientName}" — omitiendo.`
      );
      warnings++; skipped++; continue;
    }

    const clientId = clientRows[0].id;

    // --- Find patient by name + clientId ---
    const patientRows = await db
      .select({ id: patients.id })
      .from(patients)
      .where(
        and(
          eq(patients.clientId, clientId),
          sql`lower(${patients.name}) = lower(${patientName})`,
        )
      )
      .limit(1);

    if (!patientRows.length) {
      console.warn(
        `  WARN  Fila ${rowNum}: paciente "${patientName}" no encontrado bajo el cliente "${clientName}" — omitiendo.`
      );
      warnings++; skipped++; continue;
    }

    const patientId = patientRows[0].id;

    // --- Dedup: skip if a grooming session already exists for this patient on this date ---
    const existing = await db
      .select({ id: groomingSessions.id })
      .from(groomingSessions)
      .where(
        and(
          eq(groomingSessions.patientId, patientId),
          sql`DATE(${groomingSessions.createdAt} AT TIME ZONE 'America/Argentina/Buenos_Aires') = ${dateISO}`,
        )
      )
      .limit(1);

    if (existing.length) {
      skipped++;
      continue;
    }

    // --- Auto-create grooming profile if it doesn't exist ---
    const profileRows = await db
      .select({ id: groomingProfiles.id })
      .from(groomingProfiles)
      .where(eq(groomingProfiles.patientId, patientId))
      .limit(1);

    if (!profileRows.length) {
      await db.insert(groomingProfiles).values({
        id:        createId("gpr"),
        patientId,
        createdAt: sessionDate,
        updatedAt: sessionDate,
      });
    }

    // --- Build notes for traceability ---
    const notes = tipo
      ? `Importado de GVet. Tipo original: "${tipo}"`
      : "Importado de GVet.";

    // --- Insert grooming session ---
    await db.insert(groomingSessions).values({
      id:          createId("gss"),
      patientId,
      groomedById: staffId,
      serviceId,
      finalPrice,
      notes,
      createdAt:   sessionDate,
      updatedAt:   sessionDate,
    });

    inserted++;
  }

  console.log("\n--- Resultado ---");
  console.log(`TOTAL  ${inserted} sesiones de estética insertadas`);
  console.log(`SKIP   ${skipped} omitidas (ya existían o datos inválidos)`);
  if (warnings > 0) {
    console.log(`WARN   ${warnings} advertencias — revisar clientes/pacientes no encontrados`);
  }

  await pg.end();
}

main().catch((err) => {
  console.error("Error fatal:", err);
  process.exit(1);
});
