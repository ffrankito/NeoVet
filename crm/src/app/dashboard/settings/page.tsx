import { db } from "@/db";
import { settings } from "@/db/schema";
import { buttonVariants } from "@/components/ui/button-variants";
import { ClinicHoursForm } from "@/components/admin/settings/clinic-hours-form";

export default async function SettingsPage() {
  const rows = await db.select().from(settings);
  const s = Object.fromEntries(rows.map((r) => [r.key, r.value]));

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Configuración</h1>
        <p className="text-muted-foreground">Ajustes generales del sistema.</p>
      </div>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Equipo</h2>
            <p className="text-sm text-muted-foreground">Usuarios del sistema y sus roles.</p>
          </div>
          <a href="/dashboard/settings/staff" className={buttonVariants({ variant: "outline" })}>
            Gestionar equipo →
          </a>
        </div>
      </section>

      <div className="border-t" />

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Catálogo de servicios</h2>
            <p className="text-sm text-muted-foreground">Servicios disponibles para agendar turnos.</p>
          </div>
          <a href="/dashboard/settings/services" className={buttonVariants({ variant: "outline" })}>
            Gestionar servicios →
          </a>
        </div>
      </section>

      <div className="border-t" />

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Horarios de atención</h2>
          <p className="text-sm text-muted-foreground">
            Configurá los horarios de la clínica. Se usan en la agenda y en el bot.
          </p>
        </div>
        <ClinicHoursForm
          weekdayMorningStart={s["clinic_hours_weekday_morning_start"] ?? "09:30"}
          weekdayMorningEnd={s["clinic_hours_weekday_morning_end"] ?? "12:30"}
          weekdayAfternoonStart={s["clinic_hours_weekday_afternoon_start"] ?? "16:30"}
          weekdayAfternoonEnd={s["clinic_hours_weekday_afternoon_end"] ?? "20:00"}
          holidayStart={s["clinic_hours_holiday_start"] ?? "10:00"}
          holidayEnd={s["clinic_hours_holiday_end"] ?? "13:00"}
        />
      </section>

    </div>
  );
}