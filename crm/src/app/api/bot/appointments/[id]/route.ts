import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { appointments } from "@/db/schema";
import { eq } from "drizzle-orm";
import { verifyBotApiKey } from "@/lib/bot-auth";
import { z } from "zod";

const updateSchema = z.object({
  status: z.enum(["confirmed", "cancelled"]).optional(),
  scheduledAt: z.string().refine((v) => !isNaN(Date.parse(v))).optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = verifyBotApiKey(req);
  if (authError) return authError;

  const { id } = await params;
  const body = await req.json();
  const parsed = updateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  const updates: Record<string, unknown> = { updatedAt: new Date() };
  if (parsed.data.status) updates.status = parsed.data.status;
  if (parsed.data.scheduledAt) updates.scheduledAt = new Date(parsed.data.scheduledAt);

  await db.update(appointments).set(updates).where(eq(appointments.id, id));

  return NextResponse.json({ ok: true });
}