import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { appointments, services } from "@/db/schema";
import { and, eq, gte, lte, ne } from "drizzle-orm";
import { appointmentId } from "@/lib/ids";
import { verifyBotApiKey, verifyPhoneOwnsPatient } from "@/lib/bot-auth";
import { revalidateBotMutation } from "@/lib/bot-revalidate";
import { z } from "zod";

const createSchema = z.object({
  patientId: z.string().min(1),
  // Tenant isolation: phone of the WhatsApp conversation's sender. The CRM
  // verifies this phone owns the patientId before accepting the booking.
  phone: z.string().min(1),
  serviceId: z.string().optional(),
  scheduledAt: z.string().refine((v) => !isNaN(Date.parse(v))),
  reason: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const authError = verifyBotApiKey(req);
  if (authError) return authError;

  const body = await req.json();
  const parsed = createSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos inválidos", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { patientId, phone, serviceId, scheduledAt, reason } = parsed.data;

  // Tenant isolation — confirm the conversation's phone owns this patient.
  const ownership = await verifyPhoneOwnsPatient(patientId, phone);
  if (!ownership.ok) return ownership.response;

  // Resolve service duration up-front so the slot-conflict check uses the
  // right window (a 60-minute service can't slot into a 30-minute gap).
  let durationMinutes = 30;
  if (serviceId) {
    const [service] = await db
      .select()
      .from(services)
      .where(eq(services.id, serviceId))
      .limit(1);
    if (service) durationMinutes = service.defaultDurationMinutes;
  }

  // Slot-conflict check — reject if any non-cancelled appointment overlaps
  // the requested time window. Same overlap predicate the availability
  // route uses to filter free slots; here we use it in reverse to refuse.
  const newStart = new Date(scheduledAt);
  const newEnd = new Date(newStart.getTime() + durationMinutes * 60 * 1000);
  // Day window is wide enough to catch any overlap that touches `newStart`.
  const dayStart = new Date(newStart);
  dayStart.setUTCHours(0, 0, 0, 0);
  const dayEnd = new Date(newStart);
  dayEnd.setUTCHours(23, 59, 59, 999);

  const sameDay = await db
    .select({
      id: appointments.id,
      scheduledAt: appointments.scheduledAt,
      durationMinutes: appointments.durationMinutes,
    })
    .from(appointments)
    .where(
      and(
        gte(appointments.scheduledAt, dayStart),
        lte(appointments.scheduledAt, dayEnd),
        ne(appointments.status, "cancelled"),
      ),
    );

  const conflict = sameDay.find((a) => {
    const apptStart = new Date(a.scheduledAt);
    const apptEnd = new Date(
      apptStart.getTime() + (a.durationMinutes ?? 30) * 60 * 1000,
    );
    // Strict less-than: back-to-back appointments don't count as conflicts.
    return apptStart < newEnd && apptEnd > newStart;
  });

  if (conflict) {
    return NextResponse.json(
      {
        error: "El horario solicitado ya está ocupado",
        conflictAt: conflict.scheduledAt,
      },
      { status: 409 },
    );
  }

  const id = appointmentId();
  await db.insert(appointments).values({
    id,
    patientId,
    serviceId: serviceId ?? null,
    scheduledAt: newStart,
    durationMinutes,
    status: "confirmed",
    appointmentType: "veterinary",
    reason: reason ?? null,
    sendReminders: true,
  });

  revalidateBotMutation();

  return NextResponse.json({ id, ok: true }, { status: 201 });
}
