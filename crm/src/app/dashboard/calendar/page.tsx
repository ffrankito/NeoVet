import { db } from "@/db";
import { staff } from "@/db/schema";
import { eq } from "drizzle-orm";
import { CalendarClient } from "@/components/calendar/CalendarClient";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getFeriados } from "@/lib/feriados";

export default async function CalendarPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const year = new Date().getFullYear();

  const [staffList, feriados] = await Promise.all([
    db.select({ id: staff.id, name: staff.name }).from(staff).where(eq(staff.isActive, true)),
    getFeriados(year),
  ]);

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] space-y-4 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Agenda</h1>
        <p className="text-muted-foreground">Vista de turnos por semana</p>
      </div>
      <CalendarClient staffList={staffList} feriados={feriados} />
    </div>
  );
}