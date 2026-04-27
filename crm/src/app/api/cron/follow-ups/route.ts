import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { followUps, patients, clients, emailLogs } from "@/db/schema";
import { and, eq, isNull, lte } from "drizzle-orm";
import { getResend, getEmailFrom } from "@/lib/email/resend";
import { FollowUpEmail } from "@/lib/email/templates/follow-up";
import { render } from "@react-email/render";
import { assertCronSecret } from "@/lib/cron-secret";
import { todayARTAsDateString } from "@/lib/timezone";
import * as Sentry from "@sentry/nextjs";

const CLINIC_ADDRESS = process.env.CLINIC_ADDRESS ?? "Morrow 4064, Rosario";

export async function GET(req: NextRequest) {
  const guard = assertCronSecret(req);
  if (guard) return guard;

  const today = todayARTAsDateString();

  const pending = await db
    .select({
      id: followUps.id,
      reason: followUps.reason,
      patientName: patients.name,
      clientName: clients.name,
      clientEmail: clients.email,
    })
    .from(followUps)
    .leftJoin(patients, eq(followUps.patientId, patients.id))
    .leftJoin(clients, eq(patients.clientId, clients.id))
    .where(
      and(
        lte(followUps.scheduledDate, today),
        isNull(followUps.sentAt),
        eq(followUps.status, "pending")
      )
    );

  const results = { sent: 0, skipped: 0, errors: 0 };

  for (const fu of pending) {
    if (!fu.clientEmail) { results.skipped++; continue; }

    try {
      const html = await render(
        FollowUpEmail({
          patientName: fu.patientName ?? "su mascota",
          clientName: fu.clientName ?? "Cliente",
          reason: fu.reason,
          clinicAddress: CLINIC_ADDRESS,
        })
      );

      await getResend().emails.send({
        from: getEmailFrom(),
        to: fu.clientEmail,
        subject: `Control programado para su mascota — NeoVet`,
        html,
      });

      await db
        .update(followUps)
        .set({ sentAt: new Date() })
        .where(eq(followUps.id, fu.id));

      results.sent++;
    } catch (err) {
      Sentry.captureException(err);
      results.errors++;
    }
  }

  return NextResponse.json({ ok: true, ...results });
}