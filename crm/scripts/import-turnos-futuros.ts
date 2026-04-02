/**
 * Import future appointments from turnos_futuros.txt
 *
 * Format (tab-separated, multi-line per appointment):
 *   Line 1: Date \t Type \t Client Name \t Patient Name \t Phone \t Staff Name
 *   Line 2: Reason/details
 *   Line 3 (optional): "Un recordatorio automático" (ignored)
 *
 * Usage:
 *   npx tsx scripts/import-turnos-futuros.ts --dry-run
 *   npx tsx scripts/import-turnos-futuros.ts
 */

import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";
import dotenv from "dotenv";

dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("ERROR: DATABASE_URL not set in .env.local");
  process.exit(1);
}

function createId(prefix: string): string {
  return `${prefix}_${randomUUID().replace(/-/g, "").slice(0, 16)}`;
}

// ---------------------------------------------------------------------------
// Spanish date parser
// "miércoles, 1 de abril de 2026" or "sábado, 4 de abril de 2026, 10:00"
// ---------------------------------------------------------------------------
const MONTHS: Record<string, string> = {
  enero: "01", febrero: "02", marzo: "03", abril: "04",
  mayo: "05", junio: "06", julio: "07", agosto: "08",
  septiembre: "09", octubre: "10", noviembre: "11", diciembre: "12",
};

function parseSpanishDate(raw: string): { date: string; time: string | null } | null {
  // Remove day name prefix: "miércoles, 1 de abril de 2026, 10:00" → "1 de abril de 2026, 10:00"
  const withoutDay = raw.replace(/^[a-záéíóúñü]+,\s*/i, "").trim();

  // Match: "1 de abril de 2026" or "1 de abril de 2026, 10:00"
  const match = withoutDay.match(/^(\d{1,2})\s+de\s+(\w+)\s+de\s+(\d{4})(?:,?\s*(\d{1,2}:\d{2}))?/i);
  if (!match) return null;

  const day = match[1].padStart(2, "0");
  const monthName = match[2].toLowerCase();
  const year = match[3];
  const time = match[4] || null;
  const month = MONTHS[monthName];

  if (!month) return null;

  return { date: `${year}-${month}-${day}`, time };
}

// ---------------------------------------------------------------------------
// Type mapping
// ---------------------------------------------------------------------------
function mapType(raw: string): { appointmentType: string; serviceCategory: string | null } {
  const lower = raw.toLowerCase().trim();
  if (lower === "vacuna") return { appointmentType: "veterinary", serviceCategory: "vacunacion" };
  if (lower === "desparasitación") return { appointmentType: "veterinary", serviceCategory: null };
  return { appointmentType: "veterinary", serviceCategory: null };
}

// ---------------------------------------------------------------------------
// Parse the file into appointment records
// ---------------------------------------------------------------------------
interface RawAppointment {
  dateStr: string;
  type: string;
  clientName: string;
  patientName: string;
  phone: string;
  staffName: string;
  reason: string;
}

function parseFile(content: string): RawAppointment[] {
  const lines = content.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
  const appointments: RawAppointment[] = [];

  let i = 0;
  // Skip header line
  if (lines[0]?.includes("Fecha") && lines[0]?.includes("Tipo")) i = 1;

  while (i < lines.length) {
    const line = lines[i]?.trim();
    if (!line) { i++; continue; }

    // Check if this line has tab-separated appointment data (date + type + names)
    const parts = line.split("\t").map((s) => s.trim()).filter(Boolean);

    if (parts.length >= 4 && parseSpanishDate(parts[0])) {
      const dateStr = parts[0];
      const type = parts[1];
      const clientName = parts[2];
      const patientName = parts[3];
      const phone = parts[4] || "";
      const staffName = parts[5] || "";

      // Next line is the reason
      i++;
      let reason = "";
      if (i < lines.length) {
        const nextLine = lines[i]?.trim();
        if (nextLine && !nextLine.includes("Un recordatorio automático") && !parseSpanishDate(nextLine.split("\t")[0]?.trim() || "")) {
          reason = nextLine;
          i++;
        }
      }

      // Skip "Un recordatorio automático" line if present
      if (i < lines.length && lines[i]?.trim() === "Un recordatorio automático") {
        i++;
      }

      appointments.push({ dateStr, type, clientName, patientName, phone, staffName, reason });
    } else {
      i++;
    }
  }

  return appointments;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const filePath = path.resolve(__dirname, "data/turnos_futuros.txt");

  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    process.exit(1);
  }

  const content = fs.readFileSync(filePath, "utf-8");
  const rawAppointments = parseFile(content);
  console.log(`Turnos parseados: ${rawAppointments.length}`);

  const { default: postgres } = await import("postgres");
  const { drizzle } = await import("drizzle-orm/postgres-js");
  const { clients, patients, appointments, staff } = await import("../src/db/schema/index.js");
  const { eq, sql, and } = await import("drizzle-orm");

  const pg = postgres(DATABASE_URL!, { max: 1 });
  const db = drizzle(pg, { schema: { clients, patients, appointments, staff } });

  // Pre-load staff for matching
  const allStaff = await db.select({ id: staff.id, name: staff.name }).from(staff);
  const staffByName: Record<string, string> = {};
  for (const s of allStaff) {
    staffByName[s.name.toLowerCase()] = s.id;
  }

  // Create missing staff as placeholders
  const missingStaff = new Set<string>();
  for (const apt of rawAppointments) {
    if (apt.staffName && !staffByName[apt.staffName.toLowerCase()]) {
      missingStaff.add(apt.staffName);
    }
  }

  if (missingStaff.size > 0) {
    console.log(`\nCreando ${missingStaff.size} staff placeholder(s):`);
    for (const name of missingStaff) {
      const id = createId("stf");
      const email = `${name.toLowerCase().replace(/\s+/g, ".")}@placeholder.neovet`;
      const userId = `placeholder_${name.toLowerCase().replace(/\s+/g, "_")}`;

      if (!dryRun) {
        await db.insert(staff).values({ id, userId, email, name, role: "vet" });
      }
      staffByName[name.toLowerCase()] = id;
      console.log(`  + ${name} (${id}) — rol: vet`);
    }
  }

  let inserted = 0;
  let skipped = 0;

  for (let idx = 0; idx < rawAppointments.length; idx++) {
    const apt = rawAppointments[idx];
    const pct = Math.round(((idx + 1) / rawAppointments.length) * 100);
    process.stdout.write(`\r  [${pct}%] ${idx + 1}/${rawAppointments.length} — insertados: ${inserted}, omitidos: ${skipped}   `);

    const parsed = parseSpanishDate(apt.dateStr);
    if (!parsed) {
      console.log(`\n  ⚠️  Fecha inválida: "${apt.dateStr}" — omitiendo.`);
      skipped++;
      continue;
    }

    const scheduledAt = parsed.time
      ? new Date(`${parsed.date}T${parsed.time}:00-03:00`)
      : new Date(`${parsed.date}T09:00:00-03:00`); // default 9am if no time

    // Find client by phone (primary) or name (fallback)
    let clientRows = apt.phone
      ? await db.select({ id: clients.id }).from(clients).where(eq(clients.phone, apt.phone)).limit(1)
      : [];

    if (clientRows.length === 0) {
      clientRows = await db
        .select({ id: clients.id })
        .from(clients)
        .where(sql`lower(${clients.name}) = lower(${apt.clientName})`)
        .limit(1);
    }

    if (clientRows.length === 0) {
      console.log(`\n  ⚠️  Cliente no encontrado: "${apt.clientName}" (${apt.phone}) — omitiendo.`);
      skipped++;
      continue;
    }

    const clientId = clientRows[0].id;

    // Find patient by name under client
    const patientRows = await db
      .select({ id: patients.id })
      .from(patients)
      .where(and(
        eq(patients.clientId, clientId),
        sql`lower(${patients.name}) = lower(${apt.patientName})`
      ))
      .limit(1);

    if (patientRows.length === 0) {
      console.log(`\n  ⚠️  Paciente "${apt.patientName}" no encontrado bajo cliente "${apt.clientName}" — omitiendo.`);
      skipped++;
      continue;
    }

    const patientId = patientRows[0].id;
    const staffId = apt.staffName ? staffByName[apt.staffName.toLowerCase()] ?? null : null;
    const { appointmentType } = mapType(apt.type);

    // Dedup: skip if appointment already exists for this patient on this date
    const existing = await db
      .select({ id: appointments.id })
      .from(appointments)
      .where(and(
        eq(appointments.patientId, patientId),
        sql`DATE(${appointments.scheduledAt} AT TIME ZONE 'America/Argentina/Buenos_Aires') = ${parsed.date}`
      ))
      .limit(1);

    if (existing.length > 0) {
      skipped++;
      continue;
    }

    if (dryRun) {
      console.log(`\n  [dry-run] ${parsed.date} | ${apt.patientName} (${apt.clientName}) | ${apt.type} | ${apt.reason}`);
      inserted++;
      continue;
    }

    await db.insert(appointments).values({
    id: createId("apt"),
    patientId,
    appointmentType: appointmentType as "veterinary" | "grooming",
    assignedStaffId: staffId,
    scheduledAt,
    durationMinutes: 30,
   reason: apt.reason || `${apt.type} — ${apt.patientName}`,
   status: "confirmed",
   sendReminders: true,
    });

    inserted++;
  }

  console.log(`\n\n--- Resultado ---`);
  console.log(`✓ ${inserted} turnos insertados`);
  console.log(`↷ ${skipped} omitidos`);

  await pg.end();
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
