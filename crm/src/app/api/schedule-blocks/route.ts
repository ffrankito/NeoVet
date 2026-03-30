import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { scheduleBlocks, staff, appointments } from "@/db/schema";
import { eq, and, gte, lte } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";
import { scheduleBlockId } from "@/lib/ids";

// GET — listar bloqueos del staff logueado en un rango de fechas
export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const staffMember = await db
    .select()
    .from(staff)
    .where(eq(staff.userId, user.id))
    .limit(1);

  if (!staffMember[0]) return NextResponse.json([]);

  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  if (!from || !to) {
    return NextResponse.json({ error: "Parámetros from/to requeridos" }, { status: 400 });
  }

  const blocks = await db
    .select()
    .from(scheduleBlocks)
    .where(
      and(
        eq(scheduleBlocks.staffId, staffMember[0].id),
        lte(scheduleBlocks.startDate, to),
        gte(scheduleBlocks.endDate, from)
      )
    );

  return NextResponse.json(blocks);
}

// POST — crear un bloqueo
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const staffMember = await db
    .select()
    .from(staff)
    .where(eq(staff.userId, user.id))
    .limit(1);

  if (!staffMember[0]) {
    return NextResponse.json({ error: "Staff no encontrado" }, { status: 404 });
  }

  const body = await req.json();
  const { startDate, endDate, startTime, endTime, reason } = body;

  if (!startDate || !endDate) {
    return NextResponse.json({ error: "startDate y endDate son requeridos" }, { status: 400 });
  }

  const block = await db
    .insert(scheduleBlocks)
    .values({
      id: scheduleBlockId(),
      staffId: staffMember[0].id,
      startDate,
      endDate,
      startTime: startTime || null,
      endTime: endTime || null,
      reason: reason || null,
    })
    .returning();

  // Cancelar turnos existentes en el rango bloqueado
  await db
    .update(appointments)
    .set({ status: "cancelled" })
    .where(
      and(
        eq(appointments.assignedStaffId, staffMember[0].id),
        gte(appointments.scheduledAt, new Date(`${startDate}T00:00:00.000Z`)),
        lte(appointments.scheduledAt, new Date(`${endDate}T23:59:59.999Z`))
      )
    );

  return NextResponse.json(block[0]);
}