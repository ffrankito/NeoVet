// src/app/api/appointments/[id]/cancel/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { appointments } from "@/db/schema";
import { eq } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  await db
    .update(appointments)
    .set({ status: "cancelled" })
    .where(eq(appointments.id, params.id));

  return NextResponse.json({ ok: true });
}