import * as Sentry from "@sentry/nextjs";
import { db } from "@/db";
import { emailLogs } from "@/db/schema";
import { emailLogId } from "@/lib/ids";
import { getResend, getEmailFrom } from "./resend";
import { and, eq } from "drizzle-orm";

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  /** Unique type for dedup (e.g. "booking_confirmation", "cancellation") */
  logType: string;
  /** Reference ID for dedup (e.g. appointment ID) */
  referenceId: string;
}

/**
 * Sends an email via Resend and logs it to email_logs for idempotency.
 * Returns true if sent, false if already sent or no recipient.
 */
export async function sendAndLogEmail({
  to,
  subject,
  html,
  logType,
  referenceId,
}: SendEmailOptions): Promise<boolean> {
  if (!to) return false;

  // Dedup check
  const [existing] = await db
    .select({ id: emailLogs.id })
    .from(emailLogs)
    .where(and(eq(emailLogs.referenceId, referenceId), eq(emailLogs.type, logType)))
    .limit(1);

  if (existing) return false;

  try {
    await getResend().emails.send({ from: getEmailFrom(), to, subject, html });
    await db.insert(emailLogs).values({
      id: emailLogId(),
      type: logType,
      referenceId,
      sentTo: to,
    });
    return true;
  } catch (err) {
    Sentry.captureException(err);
    return false;
  }
}
