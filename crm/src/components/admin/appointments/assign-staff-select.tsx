"use client";

import { useTransition } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { assignStaffToAppointment } from "@/app/dashboard/appointments/actions";

interface Props {
  appointmentId: string;
  currentStaffId: string | null;
  currentStaffName: string | null;
  appointmentType: string;
  allStaff: { id: string; name: string; role: string }[];
}

/** Roles that can be assigned to each appointment type */
function getAssignableRoles(appointmentType: string): string[] {
  if (appointmentType === "grooming") return ["groomer"];
  return ["vet", "owner"];
}

export function AssignStaffSelect({ appointmentId, currentStaffId, appointmentType, allStaff }: Props) {
  const [isPending, startTransition] = useTransition();

  const assignableRoles = getAssignableRoles(appointmentType);
  const filteredStaff = allStaff.filter((s) => assignableRoles.includes(s.role));

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
        {filteredStaff.map((s) => (
          <SelectItem key={s.id} value={s.id} label={s.name}>
            {s.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
