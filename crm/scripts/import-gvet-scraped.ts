/**
 * Import scraped GVet data into NeoVet DB
 *
 * Reads JSON files from scripts/gvet-data/ (produced by parse-gvet-html.ts)
 * and inserts into the NeoVet database.
 *
 * Usage:
 *   npx tsx scripts/import-gvet-scraped.ts
 *   npx tsx scripts/import-gvet-scraped.ts --sections internaciones,procedimientos,deudores
 *   npx tsx scripts/import-gvet-scraped.ts --dry-run
 *
 * Requires: DATABASE_URL in .env.local
 */

import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";

const DATA_DIR = path.resolve(process.cwd(), "scripts/gvet-data");

// ---------------------------------------------------------------------------
// ID helpers (same as src/lib/ids.ts — inline to avoid tsconfig issues)
// ---------------------------------------------------------------------------
function createId(prefix: string): string {
  return `${prefix}_${randomUUID().replace(/-/g, "").slice(0, 16)}`;
}

// ---------------------------------------------------------------------------
// Date parsing — GVet format: "31 mar 2026, 10:59"
// ---------------------------------------------------------------------------
const MONTHS: Record<string, string> = {
  ene: "01", feb: "02", mar: "03", abr: "04", may: "05", jun: "06",
  jul: "07", ago: "08", sep: "09", oct: "10", nov: "11", dic: "12",
};

function parseGvetDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  // Format: "31 mar 2026, 10:59" or "28 mar 2026, 12:00"
  const match = dateStr.match(/^(\d{1,2})\s+(\w{3})\s+(\d{4}),?\s*(\d{1,2}):(\d{2})$/);
  if (!match) return null;

  const [, day, monthStr, year, hour, minute] = match;
  const month = MONTHS[monthStr.toLowerCase()];
  if (!month) return null;

  // Argentina is UTC-3
  return new Date(`${year}-${month}-${day.padStart(2, "0")}T${hour.padStart(2, "0")}:${minute}:00-03:00`);
}

function parseAmount(s: string | number): number {
  if (typeof s === "number") return s;
  const cleaned = s.replace(/[$\s]/g, "").replace(/,/g, "");
  return Number(cleaned) || 0;
}

// ---------------------------------------------------------------------------
// Load env
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
// Main
// ---------------------------------------------------------------------------
async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const sectionsIdx = args.indexOf("--sections");
  const sections = sectionsIdx !== -1 && args[sectionsIdx + 1]
    ? args[sectionsIdx + 1].split(",").map((s) => s.trim())
    : ["internaciones", "procedimientos", "deudores"];

  console.log("📥 Importación de datos scrapeados de GVet");
  console.log(`   Secciones: ${sections.join(", ")}`);
  if (dryRun) console.log("   🔍 DRY RUN — no se escribirán datos.\n");
  else console.log();

  loadEnv();
  const { DATABASE_URL } = process.env;
  if (!DATABASE_URL) {
    console.error("Error: DATABASE_URL no configurada.");
    process.exit(1);
  }

  const { default: postgres } = await import("postgres");
  const { drizzle } = await import("drizzle-orm/postgres-js");
  const schema = await import("../src/db/schema/index.js");
  const { eq, sql, and } = await import("drizzle-orm");

  const client = postgres(DATABASE_URL, { max: 1 });
  const db = drizzle(client, { schema });

  // ── Helper: find patient by gvetId ──
  async function findPatientByGvetId(gvetId: string) {
    if (!gvetId) return null;
    const [row] = await db
      .select({ id: schema.patients.id, clientId: schema.patients.clientId })
      .from(schema.patients)
      .where(eq(schema.patients.gvetId, gvetId))
      .limit(1);
    return row ?? null;
  }

  // ── Helper: find client by gvetId ──
  async function findClientByGvetId(gvetId: string) {
    if (!gvetId) return null;
    const [row] = await db
      .select({ id: schema.clients.id })
      .from(schema.clients)
      .where(eq(schema.clients.gvetId, gvetId))
      .limit(1);
    return row ?? null;
  }

  // ── Helper: find client by name (case-insensitive) ──
  async function findClientByName(name: string) {
    if (!name) return null;
    const [row] = await db
      .select({ id: schema.clients.id })
      .from(schema.clients)
      .where(sql`lower(${schema.clients.name}) = lower(${name})`)
      .limit(1);
    return row ?? null;
  }

  // ── Helper: find staff by name (case-insensitive, partial match) ──
  async function findStaffByName(name: string) {
    if (!name || name === "---" || name === "-") return null;
    const normalized = name.trim().toLowerCase();
    const rows = await db
      .select({ id: schema.staff.id, name: schema.staff.name })
      .from(schema.staff)
      .where(eq(schema.staff.isActive, true));

    // Try exact match first, then partial
    const exact = rows.find((r) => r.name.toLowerCase() === normalized);
    if (exact) return exact;
    const partial = rows.find((r) =>
      normalized.includes(r.name.toLowerCase()) || r.name.toLowerCase().includes(normalized)
    );
    return partial ?? null;
  }

  // =========================================================================
  // Import Internaciones
  // =========================================================================
  if (sections.includes("internaciones")) {
    const filePath = path.join(DATA_DIR, "internaciones.json");
    if (!fs.existsSync(filePath)) {
      console.log("⚠️  internaciones.json no encontrado, omitiendo.");
    } else {
      const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
      console.log(`\n🏥 Internaciones — ${data.length} registros`);
      let inserted = 0, skipped = 0;

      for (const row of data) {
        const patient = await findPatientByGvetId(row.pacienteGvetId);
        if (!patient) {
          console.log(`   ⚠️  Paciente no encontrado: "${row.paciente}" (gvetId: ${row.pacienteGvetId}) — omitiendo.`);
          skipped++;
          continue;
        }

        const admittedAt = parseGvetDate(row.entrada);
        if (!admittedAt) {
          console.log(`   ⚠️  Fecha inválida: "${row.entrada}" — omitiendo.`);
          skipped++;
          continue;
        }

        // Check if already imported (by checking for a hospitalization at the same time for same patient)
        const [existing] = await db
          .select({ id: schema.hospitalizations.id })
          .from(schema.hospitalizations)
          .where(
            and(
              eq(schema.hospitalizations.patientId, patient.id),
              eq(schema.hospitalizations.admittedAt, admittedAt)
            )
          )
          .limit(1);

        if (existing) {
          skipped++;
          continue;
        }

        if (dryRun) {
          console.log(`   [dry-run] Insertaría internación: "${row.paciente}" — ${row.entrada}`);
          inserted++;
          continue;
        }

        // Determine if discharged: "Caducó" or empty string means different things
        const isDischargedText = row.altaParametros.toLowerCase();
        const isDischarged = isDischargedText === "caducó" || isDischargedText.includes("alta");

        await db.insert(schema.hospitalizations).values({
          id: createId("hos"),
          patientId: patient.id,
          admittedAt,
          dischargedAt: isDischarged ? admittedAt : null, // If discharged, use same date (exact time unknown)
          reason: null,
          notes: row.altaParametros || null,
        });

        inserted++;
      }

      console.log(`   ✅ ${inserted} insertadas, ${skipped} omitidas`);
    }
  }

  // =========================================================================
  // Import Procedimientos
  // =========================================================================
  if (sections.includes("procedimientos")) {
    const filePath = path.join(DATA_DIR, "procedimientos.json");
    if (!fs.existsSync(filePath)) {
      console.log("⚠️  procedimientos.json no encontrado, omitiendo.");
    } else {
      const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
      console.log(`\n🔬 Procedimientos — ${data.length} registros`);
      let inserted = 0, skipped = 0;

      for (const row of data) {
        const patient = await findPatientByGvetId(row.pacienteGvetId);
        if (!patient) {
          console.log(`   ⚠️  Paciente no encontrado: "${row.paciente}" (gvetId: ${row.pacienteGvetId}) — omitiendo.`);
          skipped++;
          continue;
        }

        const procedureDate = parseGvetDate(row.fecha);
        if (!procedureDate) {
          console.log(`   ⚠️  Fecha inválida: "${row.fecha}" — omitiendo.`);
          skipped++;
          continue;
        }

        // Dedup: same patient + same date + same description
        const [existing] = await db
          .select({ id: schema.procedures.id })
          .from(schema.procedures)
          .where(
            and(
              eq(schema.procedures.patientId, patient.id),
              eq(schema.procedures.procedureDate, procedureDate),
              eq(schema.procedures.description, row.procedimiento)
            )
          )
          .limit(1);

        if (existing) {
          skipped++;
          continue;
        }

        if (dryRun) {
          console.log(`   [dry-run] Insertaría procedimiento: "${row.paciente}" — ${row.procedimiento}`);
          inserted++;
          continue;
        }

        const procId = createId("prc");
        const reminders = row.recordatorios === "Ninguna" ? null : row.recordatorios;

        await db.insert(schema.procedures).values({
          id: procId,
          patientId: patient.id,
          procedureDate,
          description: row.procedimiento,
          type: null,
          notes: reminders ? `Recordatorios GVet: ${reminders}` : null,
        });

        // Resolve and insert surgeons (may be multiple, separated by " y ")
        const surgeonNames = row.cirujano.split(/\s+y\s+/i).map((s: string) => s.trim()).filter((s: string) => s && s !== "---" && s !== "-");
        for (const sName of surgeonNames) {
          const staffMember = await findStaffByName(sName);
          if (staffMember) {
            await db.insert(schema.procedureStaff).values({
              id: createId("pst"),
              procedureId: procId,
              staffId: staffMember.id,
              role: "surgeon",
            });
          }
        }

        // Resolve and insert anesthesiologists
        const anesthNames = row.anestesiologo.split(/\s+y\s+/i).map((s: string) => s.trim()).filter((s: string) => s && s !== "---" && s !== "-");
        for (const aName of anesthNames) {
          const staffMember = await findStaffByName(aName);
          if (staffMember) {
            await db.insert(schema.procedureStaff).values({
              id: createId("pst"),
              procedureId: procId,
              staffId: staffMember.id,
              role: "anesthesiologist",
            });
          }
        }

        inserted++;
      }

      console.log(`   ✅ ${inserted} insertados, ${skipped} omitidos`);
    }
  }

  // =========================================================================
  // Import Deudores (as charges)
  // =========================================================================
  if (sections.includes("deudores")) {
    const filePath = path.join(DATA_DIR, "deudores.json");
    if (!fs.existsSync(filePath)) {
      console.log("⚠️  deudores.json no encontrado, omitiendo.");
    } else {
      const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
      console.log(`\n💳 Deudores — ${data.length} registros`);
      let inserted = 0, skipped = 0;

      for (const row of data) {
        // Find client by gvetId or name
        let clientRecord = await findClientByGvetId(row.clienteGvetId);
        if (!clientRecord) {
          clientRecord = await findClientByName(row.clienteNombre);
        }

        if (!clientRecord) {
          console.log(`   ⚠️  Cliente no encontrado: "${row.clienteNombre}" (gvetId: ${row.clienteGvetId}) — omitiendo.`);
          skipped++;
          continue;
        }

        const total = parseAmount(row.total);
        if (total <= 0) {
          skipped++;
          continue;
        }

        // Check if a charge from GVet import already exists for this client
        const [existing] = await db
          .select({ id: schema.charges.id })
          .from(schema.charges)
          .where(
            and(
              eq(schema.charges.clientId, clientRecord.id),
              eq(schema.charges.sourceType, "other"),
              sql`${schema.charges.description} LIKE '%Importado de GVet%'`
            )
          )
          .limit(1);

        if (existing) {
          skipped++;
          continue;
        }

        if (dryRun) {
          console.log(`   [dry-run] Insertaría deuda: "${row.clienteNombre}" — $${total}`);
          inserted++;
          continue;
        }

        // Create individual charges per category that has a balance
        const categories = [
          { type: "sale" as const, amount: parseAmount(row.ventas), desc: "Ventas" },
          { type: "consultation" as const, amount: parseAmount(row.deudasVisitas), desc: "Deudas de visitas" },
          { type: "grooming" as const, amount: parseAmount(row.deudasEstetica), desc: "Deudas de estética" },
          { type: "other" as const, amount: parseAmount(row.deudaGuarderia), desc: "Deuda de guardería" },
          { type: "other" as const, amount: parseAmount(row.cuentaActual), desc: "Cuenta actual" },
        ];

        // Only create charges for categories with non-zero amounts
        // But avoid double-counting: if all categories are 0 but total > 0, create a single "other" charge
        const nonZeroCategories = categories.filter((c) => c.amount > 0);

        if (nonZeroCategories.length === 0 && total > 0) {
          // Total exists but no category breakdown — create single charge
          await db.insert(schema.charges).values({
            id: createId("chg"),
            clientId: clientRecord.id,
            sourceType: "other",
            description: `Importado de GVet — Deuda total`,
            amount: String(total),
            paidAmount: "0",
            status: "pending",
          });
        } else {
          for (const cat of nonZeroCategories) {
            await db.insert(schema.charges).values({
              id: createId("chg"),
              clientId: clientRecord.id,
              sourceType: cat.type,
              description: `Importado de GVet — ${cat.desc}`,
              amount: String(cat.amount),
              paidAmount: "0",
              status: "pending",
            });
          }
        }

        inserted++;
      }

      console.log(`   ✅ ${inserted} clientes con deuda importados, ${skipped} omitidos`);
    }
  }

  console.log("\n✅ Importación completa.");
  await client.end();
}

main().catch((err) => {
  console.error("❌ Error fatal:", err);
  process.exit(1);
});
