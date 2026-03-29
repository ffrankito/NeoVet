"use client";

import { useTransition } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { assignStaffToAppointment } from "@/app/dashboard/appointments/actions";

interface Props {
  appointmentId: string;
  currentStaffId: string | null;
  currentStaffName: string | null;
  allStaff: { id: string; name: string; role: string }[];
}

export function AssignStaffSelect({ appointmentId, currentStaffId, allStaff }: Props) {
  const [isPending, startTransition] = useTransition();

  function handleChange(value: string | null) {
    const resolved = !value || value === "none" ? null : value;
    startTransition(async () => {
      await assignStaffToAppointment(appointmentId, resolved);
    });
  }

  return (
    <Select
      defaultValue={currentStaffId ?? "none"}
      onValueChange={handleChange}
      disabled={isPending}
    >
      <SelectTrigger className="mt-1 h-8 w-full text-sm">
        <SelectValue placeholder="Sin asignar" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="none" label="Sin asignar">Sin asignar</SelectItem>
        {allStaff.map((s) => (
          <SelectItem key={s.id} value={s.id} label={s.name}>
            {s.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
