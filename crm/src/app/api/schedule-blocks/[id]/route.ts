import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { scheduleBlocks, staff } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const staffMember = await db
    .select()
    .from(staff)
    .where(eq(staff.userId, user.id))
    .limit(1);

  if (!staffMember[0]) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;

  // Solo puede eliminar sus propios bloqueos
  await db
    .delete(scheduleBlocks)
    .where(
      and(
        eq(scheduleBlocks.id, id),
        eq(scheduleBlocks.staffId, staffMember[0].id)
      )
    );

  return NextResponse.json({ ok: true });
}