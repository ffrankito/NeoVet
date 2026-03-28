/**
 * Backfill appointments from imported consultations
 *
 * For every consultation where appointmentId IS NULL:
 *   1. Check if an appointment already exists for that patient on that day (dedup).
 *   2. Insert a new appointment (status = completed, scheduledAt = consultation.createdAt).
 *   3. Update the consultation to link back to the new appointment.
 *
 * Usage:
 *   npx tsx scripts/backfill-appointments-from-consultations.ts
 *   npx tsx scripts/backfill-appointments-from-consultations.ts --dry-run
 */

import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";

// ---------------------------------------------------------------------------
// ID helper (mirrors src/lib/ids.ts — no runtime import needed in scripts)
// ---------------------------------------------------------------------------
function createId(prefix: string): string {
  return `${prefix}_${randomUUID().replace(/-/g, "").slice(0, 16)}`;
}

// ---------------------------------------------------------------------------
// Extract the "Motivo: X" line from subjective (set by import-visitas.ts)
// ---------------------------------------------------------------------------
function extractReason(subjective: string | null): string | null {
  if (!subjective) return null;
  const match = subjective.match(/^Motivo:\s*(.+?)(\n|$)/);
  return match ? match[1].trim() : null;
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
  const dryRun = args["dry-run"] === true;

  if (dryRun) console.log("🔍 DRY RUN — no data will be written.\n");

  loadEnv();

  const { DATABASE_URL } = process.env;
  if (!DATABASE_URL) {
    console.error("Error: DATABASE_URL environment variable is not set.");
    process.exit(1);
  }

  const { default: postgres } = await import("postgres");
  const { drizzle } = await import("drizzle-orm/postgres-js");
  const { appointments, consultations } = await import("../src/db/schema/index.js");
  const { eq, and, isNull, sql } = await import("drizzle-orm");

  const pg = postgres(DATABASE_URL, { max: 1 });
  const db = drizzle(pg, { schema: { appointments, consultations } });

  // Fetch all consultations without a linked appointment
  const pending = await db
    .select()
    .from(consultations)
    .where(isNull(consultations.appointmentId));

  console.log(`Consultas sin turno vinculado: ${pending.length}\n`);

  let created = 0;
  let skipped = 0;

  for (const consultation of pending) {
    // Dedup: skip if an appointment already exists for this patient on this day
    const visitDateStr = consultation.createdAt.toISOString().slice(0, 10);
    const existing = await db
      .select({ id: appointments.id })
      .from(appointments)
      .where(
        and(
          eq(appointments.patientId, consultation.patientId),
          sql`DATE(${appointments.scheduledAt} AT TIME ZONE 'America/Argentina/Buenos_Aires') = ${visitDateStr}::date`,
        )
      )
      .limit(1);

    if (existing.length) {
      skipped++;
      continue;
    }

    if (dryRun) {
      console.log(
        `  [dry-run] Crearía turno para paciente ${consultation.patientId} — ${consultation.createdAt.toISOString().slice(0, 10)}`
      );
      created++;
      continue;
    }

    const newAppointmentId = createId("apt");

    // 1. Insert the appointment
    await db.insert(appointments).values({
      id:              newAppointmentId,
      patientId:       consultation.patientId,
      scheduledAt:     consultation.createdAt,
      durationMinutes: 30,
      reason:          extractReason(consultation.subjective),
      status:          "completed",
      staffNotes:      consultation.notes ?? null,
      createdAt:       consultation.createdAt,
      updatedAt:       consultation.createdAt,
    });

    // 2. Link the consultation back to the new appointment
    await db
      .update(consultations)
      .set({ appointmentId: newAppointmentId })
      .where(eq(consultations.id, consultation.id));

    created++;
  }

  console.log("\n--- Resultado ---");
  console.log(`✓ ${created} turnos creados`);
  console.log(`↷ ${skipped} omitidos (ya existía un turno para ese paciente ese día)`);

  await pg.end();
}

main().catch((err) => {
  console.error("Error fatal:", err);
  process.exit(1);
});
