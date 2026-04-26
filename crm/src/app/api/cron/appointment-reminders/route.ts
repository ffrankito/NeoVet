import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { appointments, patients, clients, services } from "@/db/schema";
import { and, eq, gte, lte } from "drizzle-orm";
import { AppointmentReminderEmail } from "@/lib/email/templates/appointment-reminder";
import { render } from "@react-email/render";
import { sendAndLogEmail } from "@/lib/email/send-email";
import { assertCronSecret } from "@/lib/cron-secret";

const CLINIC_ADDRESS = process.env.CLINIC_ADDRESS ?? "Morrow 4064, Rosario";

function getWindowStart(hoursFromNow: number): Date {
  const d = new Date();
  d.setHours(d.getHours() + hoursFromNow - 1);
  return d;
}

function getWindowEnd(hoursFromNow: number): Date {
  const d = new Date();
  d.setHours(d.getHours() + hoursFromNow + 1);
  return d;
}

export async function GET(req: NextRequest) {
  const guard = assertCronSecret(req);
  if (guard) return guard;

  const results = { sent48h: 0, sent24h: 0, skipped: 0, errors: 0 };

  for (const { hours, type, label } of [
    { hours: 48, type: "appointment_reminder_48h", label: "48 horas" },
    { hours: 24, type: "appointment_reminder_24h", label: "24 horas" },
  ]) {
    const upcoming = await db
      .select({
        id: appointments.id,
        scheduledAt: appointments.scheduledAt,
        sendReminders: appointments.sendReminders,
        patientName: patients.name,
        clientName: clients.name,
        clientEmail: clients.email,
        serviceName: services.name,
      })
      .from(appointments)
      .leftJoin(patients, eq(appointments.patientId, patients.id))
      .leftJoin(clients, eq(patients.clientId, clients.id))
      .leftJoin(services, eq(appointments.serviceId, services.id))
      .where(
        and(
          gte(appointments.scheduledAt, getWindowStart(hours)),
          lte(appointments.scheduledAt, getWindowEnd(hours)),
          eq(appointments.status, "confirmed"),
          eq(appointments.sendReminders, true)
        )
      );

    for (const appt of upcoming) {
      if (!appt.clientEmail) { results.skipped++; continue; }

      try {
        const html = await render(
          AppointmentReminderEmail({
            patientName: appt.patientName ?? "su mascota",
            clientName: appt.clientName ?? "Cliente",
            scheduledAt: new Date(appt.scheduledAt),
            serviceName: appt.serviceName,
            clinicAddress: CLINIC_ADDRESS,
            hoursBeforeLabel: label,
          })
        );

        const sent = await sendAndLogEmail({
          to: appt.clientEmail,
          subject: `Recordatorio de turno en ${label} — NeoVet`,
          html,
          logType: type,
          referenceId: appt.id,
        });

        if (sent) {
          hours === 48 ? results.sent48h++ : results.sent24h++;
        } else {
          results.skipped++;
        }
      } catch {
        results.errors++;
      }
    }
  }

  return NextResponse.json({ ok: true, ...results });
}