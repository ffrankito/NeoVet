/**
 * GVet → NeoVet CSV Import Script
 *
 * Usage:
 *   npx tsx scripts/import-gvet.ts --clients clientes.csv --patients pacientes.csv
 *   npx tsx scripts/import-gvet.ts --clients clientes.csv --patients pacientes.csv --dry-run
 *
 * Adjust COLUMN_MAP below to match the actual GVet CSV headers after inspecting the files.
 */

import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";

// ---------------------------------------------------------------------------
// Column mapping — matched to actual GVet CSV headers
// ---------------------------------------------------------------------------
const CLIENT_MAP = {
  name: "Nombre",
  phone: "Teléfono móvil", // primary; falls back to "Teléfono" if empty
  phoneFallback: "Teléfono",
  email: "E-mail",
  address: "Dirección",
  gvetId: "Identificación",
} as const;

// Patients CSV has duplicate column names: "Nombre" and "Identificación" each
// appear twice (patient fields first, owner fields second). The parser renames
// duplicates by appending _2, _3, etc., so owner name becomes "Nombre_2".
const PATIENT_MAP = {
  gvetId: "Identificación",           // GVet patient ID (1st occurrence)
  gvetHistoryNumber: "Historia N°",
  name: "Nombre",                     // patient name (1st occurrence)
  sex: "Sexo",                        // "Macho" | "Hembra"
  dob: "Fecha de nacimiento",         // format: DD/MM/YYYY
  species: "Especie",
  breed: "Raza",
  weightKg: "Peso",
  microchip: "Chip",
  neutered: "Está castrado",          // "Sí" → true, "No" → false
  deceased: "Falleció",               // "Sí" → skip
  ownerName: "Nombre_2",             // owner name (2nd occurrence — used to look up client FK)
} as const;

// GVet species values → NeoVet schema values
const SPECIES_MAP: Record<string, string> = {
  canino: "perro",
  felino: "gato",
  // anything else falls through to "otro"
};

// ---------------------------------------------------------------------------
// ID helpers (mirrors src/lib/ids.ts — kept inline to avoid tsconfig path issues)
// ---------------------------------------------------------------------------
function createId(prefix: string): string {
  return `${prefix}_${randomUUID().replace(/-/g, "").slice(0, 16)}`;
}

// ---------------------------------------------------------------------------
// Minimal CSV parser (handles quoted fields with commas, no external dep)
// ---------------------------------------------------------------------------
function parseCSV(content: string): Array<Record<string, string>> {
  const lines = content.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
  if (lines.length < 2) return [];

  // Handle duplicate headers by appending _2, _3, etc.
  const rawHeaders = splitCSVLine(lines[0]);
  const headerCounts: Record<string, number> = {};
  const headers = rawHeaders.map((h) => {
    const key = h.trim();
    if (headerCounts[key] === undefined) {
      headerCounts[key] = 1;
      return key;
    } else {
      headerCounts[key]++;
      return `${key}_${headerCounts[key]}`;
    }
  });

  const rows: Array<Record<string, string>> = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values = splitCSVLine(line);
    const row: Record<string, string> = {};
    headers.forEach((header, idx) => {
      row[header] = (values[idx] ?? "").trim();
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
        // Escaped quote
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
// Main
// ---------------------------------------------------------------------------
async function main() {
  const args = parseArgs(process.argv.slice(2));

  const clientsFile = args["clients"] as string | undefined;
  const patientsFile = args["patients"] as string | undefined;
  const dryRun = args["dry-run"] === true;

  if (!clientsFile && !patientsFile) {
    console.error(
      "Error: provide at least --clients <file.csv> or --patients <file.csv>"
    );
    process.exit(1);
  }

  if (dryRun) {
    console.log("🔍 DRY RUN — no data will be written to the database.\n");
  }

  // Load .env.local for DATABASE_URL
  loadEnv();

  const { DATABASE_URL } = process.env;
  if (!DATABASE_URL) {
    console.error("Error: DATABASE_URL environment variable is not set.");
    process.exit(1);
  }

  // Dynamically import postgres + drizzle after env is loaded
  const { default: postgres } = await import("postgres");
  const { drizzle } = await import("drizzle-orm/postgres-js");
  const { clients, patients } = await import("../src/db/schema/index.js");
  const { eq, sql, and } = await import("drizzle-orm");

  const client = postgres(DATABASE_URL, { max: 1 });
  const db = drizzle(client, { schema: { clients, patients } });

  let clientsInserted = 0;
  let clientsSkipped = 0;
  let patientsInserted = 0;
  let patientsSkipped = 0;

  // -------------------------------------------------------------------------
  // Import clients
  // -------------------------------------------------------------------------
  if (clientsFile) {
    const filePath = path.resolve(process.cwd(), clientsFile);
    if (!fs.existsSync(filePath)) {
      console.error(`Error: file not found: ${filePath}`);
      process.exit(1);
    }

    console.log(`Procesando clientes desde: ${filePath}`);
    const content = fs.readFileSync(filePath, "utf-8");
    const rows = parseCSV(content);
    console.log(`  Filas encontradas: ${rows.length}`);

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 2; // +2 because 1-indexed + skip header
      const pct = Math.round(((i + 1) / rows.length) * 100);
      process.stdout.write(`\r  [${pct}%] ${i + 1}/${rows.length} — insertados: ${clientsInserted}, omitidos: ${clientsSkipped}   `);

      const name = row[CLIENT_MAP.name];
      const phone = row[CLIENT_MAP.phone] || row[CLIENT_MAP.phoneFallback];
      const email = row[CLIENT_MAP.email] || null;
      const address = row[CLIENT_MAP.address] || null;
      const gvetId = row[CLIENT_MAP.gvetId] || null;

      if (!name) {
        console.warn(`  ⚠️  Fila ${rowNum}: nombre vacío — omitiendo.`);
        clientsSkipped++;
        continue;
      }
      if (!phone) {
        console.warn(`  ⚠️  Fila ${rowNum}: teléfono vacío (cliente: "${name}") — omitiendo.`);
        clientsSkipped++;
        continue;
      }

      if (dryRun) {
        console.log(`  [dry-run] Insertaría cliente: "${name}" / ${phone}`);
        clientsInserted++;
        continue;
      }

      // Upsert by phone: skip if phone already exists
      const existing = await db
        .select({ id: clients.id })
        .from(clients)
        .where(eq(clients.phone, phone))
        .limit(1);

      if (existing.length > 0) {
        clientsSkipped++;
        continue;
      }

      await db.insert(clients).values({
        id: createId("cli"),
        name,
        phone,
        email,
        address,
        gvetId,
        importedFromGvet: true,
      });

      clientsInserted++;
    }
    console.log(); // newline after progress bar
  }

  // -------------------------------------------------------------------------
  // Import patients
  // -------------------------------------------------------------------------
  if (patientsFile) {
    const filePath = path.resolve(process.cwd(), patientsFile);
    if (!fs.existsSync(filePath)) {
      console.error(`Error: file not found: ${filePath}`);
      process.exit(1);
    }

    console.log(`\nProcesando pacientes desde: ${filePath}`);
    const content = fs.readFileSync(filePath, "utf-8");
    const rows = parseCSV(content);
    console.log(`  Filas encontradas: ${rows.length}`);

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 2;
      const pct = Math.round(((i + 1) / rows.length) * 100);
      process.stdout.write(`\r  [${pct}%] ${i + 1}/${rows.length} — insertados: ${patientsInserted}, omitidos: ${patientsSkipped}   `);

      const ownerName = row[PATIENT_MAP.ownerName];
      const name = row[PATIENT_MAP.name];
      const speciesRaw = row[PATIENT_MAP.species];
      const breed = row[PATIENT_MAP.breed] || null;
      const dobRaw = row[PATIENT_MAP.dob] || null;
      const deceased = row[PATIENT_MAP.deceased];
      const gvetId = row[PATIENT_MAP.gvetId] || null;
      const gvetHistoryNumber = row[PATIENT_MAP.gvetHistoryNumber] || null;
      const sex = row[PATIENT_MAP.sex]?.toLowerCase() || null; // "macho" | "hembra"
      const weightRaw = row[PATIENT_MAP.weightKg];
      let weightKg: string | null = null;
      if (weightRaw) {
        const raw = parseFloat(weightRaw.replace(",", "."));
        if (!isNaN(raw) && raw > 0) {
          // GVet stores some weights in grams — if > 500, assume grams and convert
          const kg = raw > 500 ? raw / 1000 : raw;
          weightKg = String(Math.round(kg * 100) / 100);
        }
      }
      const microchip = row[PATIENT_MAP.microchip] || null;
      const neuteredRaw = row[PATIENT_MAP.neutered];
      const neutered = neuteredRaw ? neuteredRaw.toLowerCase() === "sí" : null;

      // Skip deceased patients
      if (deceased && deceased.toLowerCase() === "sí") {
        console.log(`  ↷  Fila ${rowNum}: "${name}" falleció — omitiendo.`);
        patientsSkipped++;
        continue;
      }

      if (!name) {
        console.warn(`  ⚠️  Fila ${rowNum}: nombre de mascota vacío — omitiendo.`);
        patientsSkipped++;
        continue;
      }
      if (!speciesRaw) {
        console.warn(`  ⚠️  Fila ${rowNum}: especie vacía (mascota: "${name}") — omitiendo.`);
        patientsSkipped++;
        continue;
      }
      if (!ownerName) {
        console.warn(`  ⚠️  Fila ${rowNum}: propietario vacío (mascota: "${name}") — omitiendo.`);
        patientsSkipped++;
        continue;
      }

      // Map GVet species ("Canino" → "perro", "Felino" → "gato", else "otro")
      const species = SPECIES_MAP[speciesRaw.toLowerCase()] ?? "otro";

      // Parse DD/MM/YYYY date format from GVet
      let dateOfBirth: string | null = null;
      if (dobRaw) {
        const ddmmyyyy = dobRaw.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
        if (ddmmyyyy) {
          dateOfBirth = `${ddmmyyyy[3]}-${ddmmyyyy[2]}-${ddmmyyyy[1]}`;
        } else {
          // Fallback: try native Date parse
          const parsed = new Date(dobRaw);
          if (!isNaN(parsed.getTime())) {
            dateOfBirth = parsed.toISOString().split("T")[0];
          } else {
            console.warn(
              `  ⚠️  Fila ${rowNum}: fecha de nacimiento inválida "${dobRaw}" (mascota: "${name}") — ignorando fecha.`
            );
          }
        }
      }

      if (dryRun) {
        console.log(
          `  [dry-run] Insertaría paciente: "${name}" (${speciesRaw} → ${species}) — dueño: "${ownerName}"`
        );
        patientsInserted++;
        continue;
      }

      // Look up client by owner name (case-insensitive, exact match)
      const matchingClients = await db
        .select({ id: clients.id })
        .from(clients)
        .where(sql`lower(${clients.name}) = lower(${ownerName})`)
        .limit(1);

      if (matchingClients.length === 0) {
        console.warn(
          `  ⚠️  Fila ${rowNum}: no se encontró cliente con nombre "${ownerName}" (mascota: "${name}") — omitiendo.`
        );
        patientsSkipped++;
        continue;
      }

      const clientId = matchingClients[0].id;

      // Skip if already imported (safe to re-run).
      // Primary key: gvetId (exact match). Fallback for rows without a gvetId:
      // composite check on clientId + name + species (case-insensitive).
      if (gvetId) {
        const existingPatient = await db
          .select({ id: patients.id })
          .from(patients)
          .where(eq(patients.gvetId, gvetId))
          .limit(1);
        if (existingPatient.length > 0) {
          patientsSkipped++;
          continue;
        }
      } else {
        const existingPatient = await db
          .select({ id: patients.id })
          .from(patients)
          .where(
            and(
              eq(patients.clientId, clientId),
              sql`lower(${patients.name}) = lower(${name})`,
              eq(patients.species, species),
            ),
          )
          .limit(1);
        if (existingPatient.length > 0) {
          patientsSkipped++;
          continue;
        }
      }

      await db.insert(patients).values({
        id: createId("pat"),
        clientId,
        name,
        species,
        breed,
        dateOfBirth,
        sex,
        neutered,
        weightKg,
        microchip,
        gvetHistoryNumber,
        gvetId,
      });

      patientsInserted++;
    }
    console.log(); // newline after progress bar
  }

  // -------------------------------------------------------------------------
  // Summary
  // -------------------------------------------------------------------------
  console.log("\n--- Resultado ---");
  if (clientsFile) {
    console.log(
      `✓ ${clientsInserted} clientes insertados · ${clientsSkipped} omitidos (ya existían o datos inválidos)`
    );
  }
  if (patientsFile) {
    console.log(
      `✓ ${patientsInserted} pacientes insertados · ${patientsSkipped} omitidos (cliente no encontrado o datos inválidos)`
    );
  }

  await client.end();
}

// ---------------------------------------------------------------------------
// Load .env.local (simple version — no external dotenv dep)
// ---------------------------------------------------------------------------
function loadEnv() {
  const envFiles = [".env.local", ".env"];
  for (const envFile of envFiles) {
    const envPath = path.resolve(process.cwd(), envFile);
    if (!fs.existsSync(envPath)) continue;

    const content = fs.readFileSync(envPath, "utf-8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx === -1) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      const value = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, "");
      if (!(key in process.env)) {
        process.env[key] = value;
      }
    }
    break;
  }
}

main().catch((err) => {
  console.error("Error fatal:", err);
  process.exit(1);
});
