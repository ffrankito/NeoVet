/**
 * Cleanup imported visits — deletes consultations and backfilled appointments
 *
 * Strategy:
 *   1. Find all consultations that were linked to a backfilled appointment
 *      (appointments with reason starting with the pattern from import-visitas.ts)
 *   2. Unlink consultations from their appointments (set appointmentId = NULL)
 *   3. Delete the backfilled appointments (status = completed, created by backfill)
 *   4. Delete all consultations (imported ones have no manual data worth keeping)
 *
 * WARNING: This deletes ALL consultations and their linked backfilled appointments.
 *          Only run this if you intend to re-import everything from CSV.
 *
 * Usage:
 *   npx tsx scripts/cleanup-imported-visits.ts --dry-run
 *   npx tsx scripts/cleanup-imported-visits.ts
 */

import path from "path";
import dotenv from "dotenv";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { sql } from "drizzle-orm";

dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("ERROR: DATABASE_URL not set in .env.local");
  process.exit(1);
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");

  const pg = postgres(DATABASE_URL!);
  const db = drizzle(pg);

  // Count what we're about to delete
  const [consultationCount] = await db.execute<{ count: string }>(
    sql`SELECT COUNT(*) as count FROM consultations`
  );
  const [appointmentCount] = await db.execute<{ count: string }>(
    sql`SELECT COUNT(*) as count FROM appointments WHERE status = 'completed' AND id IN (
      SELECT appointment_id FROM consultations WHERE appointment_id IS NOT NULL
    )`
  );

  console.log(`Consultas a borrar: ${consultationCount.count}`);
  console.log(`Turnos backfilled a borrar: ${appointmentCount.count}`);

  if (dryRun) {
    console.log("\n[DRY RUN] No se borró nada.");
    await pg.end();
    return;
  }

  // Step 1: Delete treatment items linked to consultations
  const [treatmentResult] = await db.execute<{ count: string }>(
    sql`WITH deleted AS (
      DELETE FROM treatment_items WHERE consultation_id IN (SELECT id FROM consultations)
      RETURNING id
    ) SELECT COUNT(*) as count FROM deleted`
  );
  console.log(`\nTreatment items borrados: ${treatmentResult.count}`);

  // Step 2: Delete complementary methods linked to consultations
  const [compMethodResult] = await db.execute<{ count: string }>(
    sql`WITH deleted AS (
      DELETE FROM complementary_methods WHERE consultation_id IN (SELECT id FROM consultations)
      RETURNING id
    ) SELECT COUNT(*) as count FROM deleted`
  );
  console.log(`Complementary methods borrados: ${compMethodResult.count}`);

  // Step 3: Delete follow-ups linked to consultations
  const [followUpResult] = await db.execute<{ count: string }>(
    sql`WITH deleted AS (
      DELETE FROM follow_ups WHERE consultation_id IN (SELECT id FROM consultations)
      RETURNING id
    ) SELECT COUNT(*) as count FROM deleted`
  );
  console.log(`Follow-ups borrados: ${followUpResult.count}`);

  // Step 4: Collect appointment IDs linked to consultations before deleting them
  const linkedAppointmentIds = await db.execute<{ appointment_id: string }>(
    sql`SELECT DISTINCT appointment_id FROM consultations WHERE appointment_id IS NOT NULL`
  );

  // Step 5: Delete all consultations
  const [conResult] = await db.execute<{ count: string }>(
    sql`WITH deleted AS (
      DELETE FROM consultations RETURNING id
    ) SELECT COUNT(*) as count FROM deleted`
  );
  console.log(`Consultas borradas: ${conResult.count}`);

  // Step 6: Delete backfilled appointments (only those that were linked to consultations)
  if (linkedAppointmentIds.length > 0) {
    const ids = linkedAppointmentIds.map((r) => r.appointment_id);
    const [aptResult] = await db.execute<{ count: string }>(
      sql`WITH deleted AS (
        DELETE FROM appointments WHERE id = ANY(${sql.raw(`ARRAY[${ids.map((id) => `'${id}'`).join(",")}]`)}::text[]) AND status = 'completed'
        RETURNING id
      ) SELECT COUNT(*) as count FROM deleted`
    );
    console.log(`Turnos backfilled borrados: ${aptResult.count}`);
  }

  console.log("\nLimpieza completa. Ahora podés re-importar con:");
  console.log('  npx tsx scripts/import-visitas.ts --file "scripts/data/Visitas-03-2026.csv"');
  console.log('  npx tsx scripts/import-visitas.ts --file "scripts/data/Visitas-04-2026.csv"');
  console.log("  npx tsx scripts/backfill-appointments-from-consultations.ts");

  await pg.end();
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
