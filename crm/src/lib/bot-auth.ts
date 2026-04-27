import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { appointments, clients, patients } from "@/db/schema";

/**
 * Validates the `Authorization: Bearer <token>` header against `BOT_API_KEY`.
 *
 * Note: when `BOT_API_KEY` is unset, `apiKey` is `undefined`. The leading
 * `!apiKey` check short-circuits to 401 in that case (vs. the bug pattern
 * we fixed in `cron-secret.ts` where `undefined === undefined` accepts).
 * Still — keep this in mind if you ever rewrite the comparison.
 */
export function verifyBotApiKey(req: NextRequest): NextResponse | null {
  const authHeader = req.headers.get("authorization");
  const apiKey = authHeader?.replace("Bearer ", "");

  if (!apiKey || apiKey !== process.env.BOT_API_KEY) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  return null;
}

/**
 * Tenant isolation: confirms that the patient `patientId` belongs to a
 * client whose phone matches the WhatsApp conversation's `senderPhone`.
 *
 * The bot's `BOT_API_KEY` proves the bot is the bot. This function answers
 * the second question: "is the bot allowed to operate on THIS specific
 * row?" — i.e. does the conversation's phone own the row?
 *
 * Returns `{ ok: true, clientId }` if ownership confirmed.
 * Returns `{ ok: false, response }` with a 404 (patient not found) or 403
 * (phone mismatch) — caller should `return result.response`.
 *
 * Phone comparison strips non-digits on both sides so formatting differences
 * (`+54 9 341…` vs `5493411…`) don't cause false negatives.
 */
export async function verifyPhoneOwnsPatient(
  patientId: string,
  senderPhone: string,
): Promise<
  | { ok: true; clientId: string }
  | { ok: false; response: NextResponse }
> {
  const [row] = await db
    .select({
      clientId: patients.clientId,
      clientPhone: clients.phone,
    })
    .from(patients)
    .innerJoin(clients, eq(clients.id, patients.clientId))
    .where(eq(patients.id, patientId))
    .limit(1);

  if (!row) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Paciente no encontrado" },
        { status: 404 },
      ),
    };
  }

  const normalizedSender = senderPhone.replace(/\D/g, "");
  const normalizedOwner = (row.clientPhone ?? "").replace(/\D/g, "");

  if (!normalizedSender || normalizedSender !== normalizedOwner) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Acceso denegado: el teléfono no coincide con el dueño" },
        { status: 403 },
      ),
    };
  }

  return { ok: true, clientId: row.clientId };
}

/**
 * Same as `verifyPhoneOwnsPatient`, but starts from an appointment ID.
 * Walks appointment → patient → client → phone.
 */
export async function verifyPhoneOwnsAppointment(
  appointmentId: string,
  senderPhone: string,
): Promise<
  | { ok: true; patientId: string; clientId: string }
  | { ok: false; response: NextResponse }
> {
  const [row] = await db
    .select({
      patientId: appointments.patientId,
      clientId: patients.clientId,
      clientPhone: clients.phone,
    })
    .from(appointments)
    .innerJoin(patients, eq(patients.id, appointments.patientId))
    .innerJoin(clients, eq(clients.id, patients.clientId))
    .where(eq(appointments.id, appointmentId))
    .limit(1);

  if (!row) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Turno no encontrado" },
        { status: 404 },
      ),
    };
  }

  const normalizedSender = senderPhone.replace(/\D/g, "");
  const normalizedOwner = (row.clientPhone ?? "").replace(/\D/g, "");

  if (!normalizedSender || normalizedSender !== normalizedOwner) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Acceso denegado: el teléfono no coincide con el dueño" },
        { status: 403 },
      ),
    };
  }

  return { ok: true, patientId: row.patientId, clientId: row.clientId };
}
