"use client";

import { useTransition, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateClinicHours } from "@/app/dashboard/settings/clinic-hours-actions";

type Props = {
  weekdayMorningStart: string;
  weekdayMorningEnd: string;
  weekdayAfternoonStart: string;
  weekdayAfternoonEnd: string;
  holidayStart: string;
  holidayEnd: string;
};

export function ClinicHoursForm({
  weekdayMorningStart,
  weekdayMorningEnd,
  weekdayAfternoonStart,
  weekdayAfternoonEnd,
  holidayStart,
  holidayEnd,
}: Props) {
  const [isPending, startTransition] = useTransition();
  const [success, setSuccess] = useState(false);

  function handleSubmit(formData: FormData) {
    setSuccess(false);
    startTransition(async () => {
      await updateClinicHours(formData);
      setSuccess(true);
    });
  }

  return (
    <form action={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Lunes a sábado — Mañana
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label htmlFor="weekday_morning_start">Apertura</Label>
            <Input
              id="weekday_morning_start"
              name="weekday_morning_start"
              type="time"
              defaultValue={weekdayMorningStart}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="weekday_morning_end">Cierre</Label>
            <Input
              id="weekday_morning_end"
              name="weekday_morning_end"
              type="time"
              defaultValue={weekdayMorningEnd}
            />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Lunes a viernes — Tarde
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label htmlFor="weekday_afternoon_start">Apertura</Label>
            <Input
              id="weekday_afternoon_start"
              name="weekday_afternoon_start"
              type="time"
              defaultValue={weekdayAfternoonStart}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="weekday_afternoon_end">Cierre</Label>
            <Input
              id="weekday_afternoon_end"
              name="weekday_afternoon_end"
              type="time"
              defaultValue={weekdayAfternoonEnd}
            />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Feriados
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label htmlFor="holiday_start">Apertura</Label>
            <Input
              id="holiday_start"
              name="holiday_start"
              type="time"
              defaultValue={holidayStart}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="holiday_end">Cierre</Label>
            <Input
              id="holiday_end"
              name="holiday_end"
              type="time"
              defaultValue={holidayEnd}
            />
          </div>
        </div>
      </div>

      {success && (
        <p className="text-sm text-green-600">✓ Horarios guardados correctamente.</p>
      )}

      <Button type="submit" disabled={isPending}>
        {isPending ? "Guardando..." : "Guardar horarios"}
      </Button>
    </form>
  );
}