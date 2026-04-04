import { db } from "@/db";
import { staff, settings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { CalendarClient } from "@/components/calendar/CalendarClient";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getFeriados } from "@/lib/feriados";
import type { ClinicHours } from "@/lib/calendar-utils";

export default async function CalendarPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const year = new Date().getFullYear();

  const [allActiveStaff, feriados, allSettings] = await Promise.all([
    db.select({ id: staff.id, name: staff.name, role: staff.role }).from(staff).where(eq(staff.isActive, true)),
    getFeriados(year),
    db.select().from(settings),
  ]);

  // Only show assignable roles in the staff filter (exclude admin/receptionist)
  const staffList = allActiveStaff
    .filter((s) => ["vet", "owner", "groomer"].includes(s.role))
    .map(({ id, name }) => ({ id, name }));

  const getSetting = (key: string, fallback: string) =>
    allSettings.find((s) => s.key === key)?.value ?? fallback;

  const clinicHours: ClinicHours = {
    morningStart:    getSetting("clinic_hours_weekday_morning_start", "09:30"),
    morningEnd:      getSetting("clinic_hours_weekday_morning_end", "12:30"),
    afternoonStart:  getSetting("clinic_hours_weekday_afternoon_start", "16:30"),
    afternoonEnd:    getSetting("clinic_hours_weekday_afternoon_end", "20:00"),
  };

  const holidayHours = `${getSetting("clinic_hours_holiday_start", "10:00")} a ${getSetting("clinic_hours_holiday_end", "13:00")} hs`;

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] space-y-4 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Agenda</h1>
        <p className="text-muted-foreground">Vista de turnos por semana</p>
      </div>
      <CalendarClient
        staffList={staffList}
        feriados={feriados}
        clinicHours={clinicHours}
        holidayHours={holidayHours}
      />
    </div>
  );
}