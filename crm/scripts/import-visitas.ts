/**
 * Visitas CSV → NeoVet consultations import
 *
 * Usage:
 *   npx tsx scripts/import-visitas.ts --file docs/Visitas-03-2026.csv
 *   npx tsx scripts/import-visitas.ts --file docs/Visitas-03-2026.csv --dry-run
 *
 * Matching strategy:
 *   1. Find client by phone (primary) or name (fallback).
 *   2. Find patient by name + clientId.
 *   3. Dedup: skip if a consultation already exists for that patient on that date.
 */

import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";

// ---------------------------------------------------------------------------
// Column map — matched to Visitas-03-2026.csv headers
// ---------------------------------------------------------------------------
const COL = {
  date:          "Fecha",            // YYYY-MM-DD
  patientName:   "Paciente",
  breed:         "Raza",             // for display in warnings only
  vet:           "Usuario",          // vet name — stored in notes as context
  clientName:    "Nombre del cliente",
  clientPhone:   "Teléfono móvil",
  anamnesis:     "Anamnesis",        // → subjective
  reason:        "Motivo",           // → prepended to subjective
  diagnosis:     "Diagnóstico",      // → assessment
  pathology:     "Patología",        // → appended to assessment
  treatment:     "Tratamiento",      // → plan
  physicalExam:  "Examen físico",    // → objective
  weight:        "Peso",             // → weightKg
} as const;

// ---------------------------------------------------------------------------
// ID helper
// ---------------------------------------------------------------------------
function createId(prefix: string): string {
  return `${prefix}_${randomUUID().replace(/-/g, "").slice(0, 16)}`;
}

// ---------------------------------------------------------------------------
// CSV parser (handles multiline quoted fields)
// ---------------------------------------------------------------------------
function parseCSV(content: string): Array<Record<string, string>> {
  // Normalise line endings
  const text = content.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  const headers: string[] = [];
  const rows: Array<Record<string, string>> = [];

  let pos = 0;

  function parseField(): string {
    if (text[pos] === '"') {
      pos++; // skip opening quote
      let value = "";
      while (pos < text.length) {
        if (text[pos] === '"') {
          if (text[pos + 1] === '"') {
            value += '"';
            pos += 2;
          } else {
            pos++; // skip closing quote
            break;
          }
        } else {
          value += text[pos++];
        }
      }
      return value;
    }
    // Unquoted field — read until comma or newline
    let value = "";
    while (pos < text.length && text[pos] !== "," && text[pos] !== "\n") {
      value += text[pos++];
    }
    return value;
  }

  function parseLine(): string[] {
    const fields: string[] = [];
    while (pos < text.length && text[pos] !== "\n") {
      fields.push(parseField());
      if (text[pos] === ",") pos++; // skip comma
    }
    if (text[pos] === "\n") pos++; // skip newline
    return fields;
  }

  // Parse header row
  const rawHeaders = parseLine();
  rawHeaders.forEach((h) => headers.push(h.trim()));

  // Parse data rows
  while (pos < text.length) {
    if (text[pos] === "\n") { pos++; continue; } // skip blank lines
    const values = parseLine();
    if (values.every((v) => !v.trim())) continue; // skip fully empty rows
    const row: Record<string, string> = {};
    headers.forEach((h, i) => {
      row[h] = (values[i] ?? "").trim();
    });
    rows.push(row);
  }

  return rows;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function combine(...parts: (string | null | undefined)[]): string | null {
  const filled = parts.map((p) => p?.trim()).filter(Boolean);
  return filled.length ? filled.join("\n\n") : null;
}

function normalisePhone(raw: string): string {
  // Strip spaces and dashes; keep leading +
  return raw.replace(/[\s\-]/g, "");
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
  const file = args["file"] as string | undefined;
  const dryRun = args["dry-run"] === true;

  if (!file) {
    console.error("Error: provide --file <path.csv>");
    process.exit(1);
  }

  if (dryRun) console.log("🔍 DRY RUN — no data will be written.\n");

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

  const { default: postgres } = await import("postgres");
  const { drizzle } = await import("drizzle-orm/postgres-js");
  const { clients, patients, consultations } = await import("../src/db/schema/index.js");
  const { eq, and, sql } = await import("drizzle-orm");

  const pg = postgres(DATABASE_URL, { max: 1 });
  const db = drizzle(pg, { schema: { clients, patients, consultations } });

  const content = fs.readFileSync(filePath, "utf-8");
  const rows = parseCSV(content);

  console.log(`Procesando: ${filePath}`);
  console.log(`Filas encontradas: ${rows.length}\n`);

  let inserted = 0;
  let skipped = 0;
  let warnings = 0;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 2;

    const dateRaw      = row[COL.date];
    const patientName  = row[COL.patientName];
    const clientName   = row[COL.clientName];
    const clientPhone  = row[COL.clientPhone] ? normalisePhone(row[COL.clientPhone]) : null;
    const anamnesis    = row[COL.anamnesis] || null;
    const reason       = row[COL.reason] || null;
    const diagnosis    = row[COL.diagnosis] || null;
    const pathology    = row[COL.pathology] || null;
    const treatment    = row[COL.treatment] || null;
    const physicalExam = row[COL.physicalExam] || null;
    const weightRaw    = row[COL.weight] || null;
    const vet          = row[COL.vet] || null;

    // --- Basic validation ---
    if (!dateRaw) {
      console.warn(`  ⚠️  Fila ${rowNum}: fecha vacía — omitiendo.`);
      warnings++; skipped++; continue;
    }
    if (!patientName) {
      console.warn(`  ⚠️  Fila ${rowNum}: nombre de paciente vacío — omitiendo.`);
      warnings++; skipped++; continue;
    }
    if (!clientName && !clientPhone) {
      console.warn(`  ⚠️  Fila ${rowNum}: paciente "${patientName}" sin cliente identificable — omitiendo.`);
      warnings++; skipped++; continue;
    }

    // --- Parse date ---
    const visitDate = new Date(dateRaw);
    if (isNaN(visitDate.getTime())) {
      console.warn(`  ⚠️  Fila ${rowNum}: fecha inválida "${dateRaw}" — omitiendo.`);
      warnings++; skipped++; continue;
    }

    // --- Parse weight ---
    let weightKg: string | null = null;
    if (weightRaw) {
      const raw = parseFloat(weightRaw.replace(",", "."));
      if (!isNaN(raw) && raw > 0) {
        const kg = raw > 500 ? raw / 1000 : raw; // GVet grams guard
        weightKg = String(Math.round(kg * 100) / 100);
      }
    }

    // --- Build SOAP fields ---
    // Subjective: "Motivo: X\n\nAnamnesis: Y" — keep both if both exist
    const subjectiveParts: string[] = [];
    if (reason)    subjectiveParts.push(`Motivo: ${reason}`);
    if (anamnesis) subjectiveParts.push(anamnesis);
    const subjective = subjectiveParts.length ? subjectiveParts.join("\n\n") : null;

    // Assessment: "Diagnóstico + Patología"
    const assessmentParts: string[] = [];
    if (diagnosis)  assessmentParts.push(diagnosis);
    if (pathology)  assessmentParts.push(`(${pathology})`);
    const assessment = assessmentParts.length ? assessmentParts.join(" ") : null;

    const objective = physicalExam;
    const plan      = treatment;

    // Vet name in notes for traceability
    const notes = vet ? `Atendido por: ${vet}` : null;

    if (dryRun) {
      console.log(
        `  [dry-run] Fila ${rowNum}: "${patientName}" (${clientName ?? clientPhone}) — ${dateRaw}`
      );
      inserted++;
      continue;
    }

    // --- Find client: phone first, name fallback ---
    let clientId: string | null = null;

    if (clientPhone) {
      const byPhone = await db
        .select({ id: clients.id })
        .from(clients)
        .where(eq(clients.phone, clientPhone))
        .limit(1);
      if (byPhone.length) clientId = byPhone[0].id;
    }

    if (!clientId && clientName) {
      const byName = await db
        .select({ id: clients.id })
        .from(clients)
        .where(sql`lower(${clients.name}) = lower(${clientName})`)
        .limit(1);
      if (byName.length) clientId = byName[0].id;
    }

    if (!clientId) {
      console.warn(
        `  ⚠️  Fila ${rowNum}: cliente no encontrado (nombre: "${clientName}", tel: "${clientPhone}") — paciente: "${patientName}" — omitiendo.`
      );
      warnings++; skipped++; continue;
    }

    // --- Find patient: name + clientId ---
    const matchingPatient = await db
      .select({ id: patients.id })
      .from(patients)
      .where(
        and(
          eq(patients.clientId, clientId),
          sql`lower(${patients.name}) = lower(${patientName})`,
        )
      )
      .limit(1);

    if (!matchingPatient.length) {
      console.warn(
        `  ⚠️  Fila ${rowNum}: paciente "${patientName}" no encontrado bajo el cliente — omitiendo.`
      );
      warnings++; skipped++; continue;
    }

    const patientId = matchingPatient[0].id;

    // --- Dedup: skip if a consultation already exists for this patient on this date ---
    const existing = await db
      .select({ id: consultations.id })
      .from(consultations)
      .where(
        and(
          eq(consultations.patientId, patientId),
          sql`DATE(${consultations.createdAt} AT TIME ZONE 'America/Argentina/Buenos_Aires') = ${dateRaw}`,
        )
      )
      .limit(1);

    if (existing.length) {
      skipped++;
      continue;
    }

    // --- Insert ---
    await db.insert(consultations).values({
      id:          createId("con"),
      patientId,
      subjective,
      objective,
      assessment,
      plan,
      notes,
      weightKg,
      createdAt:   visitDate,
      updatedAt:   visitDate,
    });

    inserted++;
  }

  console.log("\n--- Resultado ---");
  console.log(`✓ ${inserted} consultas insertadas`);
  console.log(`↷ ${skipped} omitidas (ya existían o datos inválidos)`);
  if (warnings > 0) {
    console.log(`⚠️  ${warnings} advertencias — revisar clientes/pacientes no encontrados`);
  }

  await pg.end();
}

main().catch((err) => {
  console.error("Error fatal:", err);
  process.exit(1);
});
