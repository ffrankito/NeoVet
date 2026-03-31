import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { followUps, patients, clients, emailLogs } from "@/db/schema";
import { and, eq, isNull, lte } from "drizzle-orm";
import { resend, EMAIL_FROM } from "@/lib/email/resend";
import { FollowUpEmail } from "@/lib/email/templates/follow-up";
import { render } from "@react-email/render";

const CLINIC_ADDRESS = process.env.CLINIC_ADDRESS ?? "Morrow 4064, Rosario";

export async function GET(req: NextRequest) {
  const secret = req.headers.get("authorization")?.replace("Bearer ", "");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const today = new Date().toISOString().split("T")[0];

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
        isNull(followUps.sentAt)
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

      await resend.emails.send({
        from: EMAIL_FROM,
        to: fu.clientEmail,
        subject: `Control programado para su mascota — NeoVet`,
        html,
      });

      await db
        .update(followUps)
        .set({ sentAt: new Date() })
        .where(eq(followUps.id, fu.id));

      results.sent++;
    } catch {
      results.errors++;
    }
  }

  return NextResponse.json({ ok: true, ...results });
}