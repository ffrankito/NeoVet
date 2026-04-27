import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { appointments } from "@/db/schema";
import { eq } from "drizzle-orm";
import { verifyBotApiKey, verifyPhoneOwnsAppointment } from "@/lib/bot-auth";
import { revalidateBotMutation } from "@/lib/bot-revalidate";
import { z } from "zod";

const updateSchema = z.object({
  // Tenant isolation: phone of the WhatsApp conversation's sender. The CRM
  // verifies this phone owns the appointment before accepting the update.
  phone: z.string().min(1),
  status: z.enum(["confirmed", "cancelled"]).optional(),
  scheduledAt: z
    .string()
    .refine((v) => !isNaN(Date.parse(v)))
    .optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const authError = verifyBotApiKey(req);
  if (authError) return authError;

  const { id } = await params;
  const body = await req.json();
  const parsed = updateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos inválidos", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { phone, status, scheduledAt } = parsed.data;

  // Tenant isolation — confirm the conversation's phone owns this appointment.
  const ownership = await verifyPhoneOwnsAppointment(id, phone);
  if (!ownership.ok) return ownership.response;

  const updates: Record<string, unknown> = { updatedAt: new Date() };
  if (status) updates.status = status;
  if (scheduledAt) updates.scheduledAt = new Date(scheduledAt);

  await db.update(appointments).set(updates).where(eq(appointments.id, id));

  revalidateBotMutation();

  return NextResponse.json({ ok: true });
}
