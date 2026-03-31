import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { vaccinations, patients, clients, emailLogs } from "@/db/schema";
import { and, eq, isNotNull } from "drizzle-orm";
import { sql } from "drizzle-orm";
import { resend, EMAIL_FROM } from "@/lib/email/resend";
import { VaccineReminderEmail } from "@/lib/email/templates/vaccine-reminder";
import { render } from "@react-email/render";

const CLINIC_ADDRESS = process.env.CLINIC_ADDRESS ?? "Morrow 4064, Rosario";

async function alreadySent(referenceId: string, type: string): Promise<boolean> {
  const logs = await db
    .select()
    .from(emailLogs)
    .where(and(eq(emailLogs.referenceId, referenceId), eq(emailLogs.type, type)))
    .limit(1);
  return logs.length > 0;
}

async function logEmail(referenceId: string, type: string, sentTo: string) {
  const { randomUUID } = await import("crypto");
  await db.insert(emailLogs).values({
    id: `log_${randomUUID().replace(/-/g, "").slice(0, 16)}`,
    type,
    referenceId,
    sentTo,
  });
}

export async function GET(req: NextRequest) {
  const secret = req.headers.get("authorization")?.replace("Bearer ", "");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

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
    if (await alreadySent(vac.id, "vaccine_reminder")) { results.skipped++; continue; }

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

      await resend.emails.send({
        from: EMAIL_FROM,
        to: vac.clientEmail,
        subject: `Vacuna próxima a vencer — ${vac.vaccineName} — NeoVet`,
        html,
      });

      await logEmail(vac.id, "vaccine_reminder", vac.clientEmail);
      results.sent++;
    } catch {
      results.errors++;
    }
  }

  return NextResponse.json({ ok: true, ...results });
}