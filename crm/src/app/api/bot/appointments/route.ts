import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { appointments, patients, clients, services } from "@/db/schema";
import { eq, and, gte, lte, ne } from "drizzle-orm";
import { appointmentId } from "@/lib/ids";
import { verifyBotApiKey } from "@/lib/bot-auth";
import { z } from "zod";

const createSchema = z.object({
  patientId: z.string().min(1),
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
    return NextResponse.json({ error: "Datos inválidos", details: parsed.error.flatten() }, { status: 400 });
  }

  const { patientId, serviceId, scheduledAt, reason } = parsed.data;

  let durationMinutes = 30;
  if (serviceId) {
    const [service] = await db.select().from(services).where(eq(services.id, serviceId)).limit(1);
    if (service) durationMinutes = service.defaultDurationMinutes;
  }

  const id = appointmentId();
  await db.insert(appointments).values({
    id,
    patientId,
    serviceId: serviceId ?? null,
    scheduledAt: new Date(scheduledAt),
    durationMinutes,
    status: "confirmed",
    appointmentType: "veterinary",
    reason: reason ?? null,
    sendReminders: true,
  });

  return NextResponse.json({ id, ok: true }, { status: 201 });
}