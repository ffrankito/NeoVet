import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { vaccinations, patients, clients } from "@/db/schema";
import { and, eq, isNotNull } from "drizzle-orm";
import { VaccineReminderEmail } from "@/lib/email/templates/vaccine-reminder";
import { render } from "@react-email/render";
import { sendAndLogEmail } from "@/lib/email/send-email";
import { assertCronSecret } from "@/lib/cron-secret";

const CLINIC_ADDRESS = process.env.CLINIC_ADDRESS ?? "Morrow 4064, Rosario";

export async function GET(req: NextRequest) {
  const guard = assertCronSecret(req);
  if (guard) return guard;

  // Fecha de 7 días desde hoy en formato YYYY-MM-DD
  const in7Days = new Date();
  in7Days.setDate(in7Days.getDate() + 7);
  const target = in7Days.toISOString().split("T")[0];

  const upcoming = await db
    .select({
      id: vaccinations.id,
      vaccineName: vaccinations.vaccineName,
      nextDueAt: vaccinations.nextDueAt,
      patientName: patients.name,
      clientName: clients.name,
      clientEmail: clients.email,
    })
    .from(vaccinations)
    .leftJoin(patients, eq(vaccinations.patientId, patients.id))
    .leftJoin(clients, eq(patients.clientId, clients.id))
    .where(
      and(
        eq(vaccinations.nextDueAt, target),
        isNotNull(vaccinations.nextDueAt)
      )
    );

  const results = { sent: 0, skipped: 0, errors: 0 };

  for (const vac of upcoming) {
    if (!vac.clientEmail || !vac.nextDueAt) { results.skipped++; continue; }

    try {
      const html = await render(
        VaccineReminderEmail({
          patientName: vac.patientName ?? "su mascota",
          clientName: vac.clientName ?? "Cliente",
          vaccineName: vac.vaccineName,
          dueDate: new Date(vac.nextDueAt),
          clinicAddress: CLINIC_ADDRESS,
        })
      );

      const sent = await sendAndLogEmail({
        to: vac.clientEmail,
        subject: `Vacuna próxima a vencer — ${vac.vaccineName} — NeoVet`,
        html,
        logType: "vaccine_reminder",
        referenceId: vac.id,
      });

      sent ? results.sent++ : results.skipped++;
    } catch {
      results.errors++;
    }
  }

  return NextResponse.json({ ok: true, ...results });
}