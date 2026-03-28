/**
 * Deduplicate patients within the same client
 *
 * Usage:
 *   npx tsx scripts/dedupe-patients.ts             # shows duplicates + deletes them
 *   npx tsx scripts/dedupe-patients.ts --dry-run   # shows duplicates only, no writes
 *
 * "Duplicate" = same clientId + same name (case-insensitive).
 * Keep rule: highest completeness score (gvetId, dateOfBirth, breed, microchip, weightKg = 1pt each).
 * Tie-break: oldest createdAt.
 */

import fs from "fs";
import path from "path";

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
// Load .env.local
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
      if (!(key in process.env)) process.env[key] = value;
    }
    break;
  }
}

// ---------------------------------------------------------------------------
// Completeness score — higher = more data = prefer to keep
// ---------------------------------------------------------------------------
function score(p: {
  gvetId: string | null;
  dateOfBirth: string | null;
  breed: string | null;
  microchip: string | null;
  weightKg: string | null;
}): number {
  return (
    (p.gvetId ? 1 : 0) +
    (p.dateOfBirth ? 1 : 0) +
    (p.breed ? 1 : 0) +
    (p.microchip ? 1 : 0) +
    (p.weightKg ? 1 : 0)
  );
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  const args = parseArgs(process.argv.slice(2));
  const dryRun = args["dry-run"] === true;

  if (dryRun) {
    console.log("🔍 DRY RUN — no data will be deleted.\n");
  }

  loadEnv();

  const { DATABASE_URL } = process.env;
  if (!DATABASE_URL) {
    console.error("Error: DATABASE_URL environment variable is not set.");
    process.exit(1);
  }

  const { default: postgres } = await import("postgres");
  const { drizzle } = await import("drizzle-orm/postgres-js");
  const { patients, clients } = await import("../src/db/schema/index.js");
  const { eq, sql, and } = await import("drizzle-orm");

  const pg = postgres(DATABASE_URL, { max: 1 });
  const db = drizzle(pg, { schema: { patients, clients } });

  // Fetch all patients with their client name (for display)
  const allPatients = await db
    .select({
      id: patients.id,
      clientId: patients.clientId,
      clientName: clients.name,
      name: patients.name,
      species: patients.species,
      breed: patients.breed,
      dateOfBirth: patients.dateOfBirth,
      gvetId: patients.gvetId,
      microchip: patients.microchip,
      weightKg: patients.weightKg,
      createdAt: patients.createdAt,
    })
    .from(patients)
    .innerJoin(clients, eq(patients.clientId, clients.id))
    .orderBy(patients.clientId, patients.name, patients.createdAt);

  // Group by (clientId, name.toLowerCase())
  const groups = new Map<string, typeof allPatients>();
  for (const p of allPatients) {
    const key = `${p.clientId}::${p.name.toLowerCase()}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(p);
  }

  // Find groups with more than 1 entry
  const duplicateGroups = [...groups.values()].filter((g) => g.length > 1);

  if (duplicateGroups.length === 0) {
    console.log("✅ No se encontraron pacientes duplicados.");
    await pg.end();
    return;
  }

  console.log(`Encontrados ${duplicateGroups.length} grupos con duplicados:\n`);

  const toDelete: string[] = [];

  for (const group of duplicateGroups) {
    // Sort: highest score first, then oldest createdAt first (tie-break)
    const sorted = [...group].sort((a, b) => {
      const scoreDiff = score(b) - score(a);
      if (scoreDiff !== 0) return scoreDiff;
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });

    const keep = sorted[0];
    const discard = sorted.slice(1);

    console.log(
      `  Cliente: "${keep.clientName}" — Mascota: "${keep.name}" (${group.length} copias)`
    );
    console.log(
      `    ✔ Conservar  [${keep.id}]  score=${score(keep)}  gvetId=${keep.gvetId ?? "—"}  dob=${keep.dateOfBirth ?? "—"}`
    );
    for (const d of discard) {
      console.log(
        `    ✖ Eliminar   [${d.id}]  score=${score(d)}  gvetId=${d.gvetId ?? "—"}  dob=${d.dateOfBirth ?? "—"}`
      );
      toDelete.push(d.id);
    }
    console.log();
  }

  console.log(`Total a eliminar: ${toDelete.length} paciente(s) duplicado(s).`);

  if (dryRun) {
    console.log("\n🔍 DRY RUN completado — no se eliminó nada.");
    await pg.end();
    return;
  }

  // Delete duplicates one by one so FK constraints are respected
  let deleted = 0;
  for (const id of toDelete) {
    await db.delete(patients).where(eq(patients.id, id));
    deleted++;
  }

  console.log(`\n✅ ${deleted} paciente(s) duplicado(s) eliminado(s).`);
  await pg.end();
}

main().catch((err) => {
  console.error("Error fatal:", err);
  process.exit(1);
});
