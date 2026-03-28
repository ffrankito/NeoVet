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
// Column mapping — adjust these strings to match your actual GVet CSV headers
// ---------------------------------------------------------------------------
const CLIENT_MAP = {
  name: "Nombre",
  phone: "Teléfono",
  email: "Email",
} as const;

const PATIENT_MAP = {
  ownerName: "Propietario", // used to look up the client FK by name
  name: "Nombre",
  species: "Especie",
  breed: "Raza",
  dob: "Fecha de nacimiento",
} as const;

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

  const headers = splitCSVLine(lines[0]);
  const rows: Array<Record<string, string>> = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values = splitCSVLine(line);
    const row: Record<string, string> = {};
    headers.forEach((header, idx) => {
      row[header.trim()] = (values[idx] ?? "").trim();
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
  const { eq, sql } = await import("drizzle-orm");

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

      const name = row[CLIENT_MAP.name];
      const phone = row[CLIENT_MAP.phone];
      const email = row[CLIENT_MAP.email] || null;

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
        importedFromGvet: true,
      });

      clientsInserted++;
    }
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

      const ownerName = row[PATIENT_MAP.ownerName];
      const name = row[PATIENT_MAP.name];
      const species = row[PATIENT_MAP.species];
      const breed = row[PATIENT_MAP.breed] || null;
      const dobRaw = row[PATIENT_MAP.dob] || null;

      if (!name) {
        console.warn(`  ⚠️  Fila ${rowNum}: nombre de mascota vacío — omitiendo.`);
        patientsSkipped++;
        continue;
      }
      if (!species) {
        console.warn(`  ⚠️  Fila ${rowNum}: especie vacía (mascota: "${name}") — omitiendo.`);
        patientsSkipped++;
        continue;
      }
      if (!ownerName) {
        console.warn(`  ⚠️  Fila ${rowNum}: propietario vacío (mascota: "${name}") — omitiendo.`);
        patientsSkipped++;
        continue;
      }

      // Normalize date — try to parse various formats
      let dateOfBirth: string | null = null;
      if (dobRaw) {
        const parsed = new Date(dobRaw);
        if (!isNaN(parsed.getTime())) {
          dateOfBirth = parsed.toISOString().split("T")[0];
        } else {
          console.warn(
            `  ⚠️  Fila ${rowNum}: fecha de nacimiento inválida "${dobRaw}" (mascota: "${name}") — ignorando fecha.`
          );
        }
      }

      if (dryRun) {
        console.log(
          `  [dry-run] Insertaría paciente: "${name}" (${species}) — dueño: "${ownerName}"`
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

      await db.insert(patients).values({
        id: createId("pat"),
        clientId,
        name,
        species: species.toLowerCase(),
        breed,
        dateOfBirth,
      });

      patientsInserted++;
    }
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
