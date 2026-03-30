// src/components/calendar/StaffFilter.tsx
"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type StaffOption = { id: string; name: string };

type Props = {
  staffList: StaffOption[];
  selectedStaffId: string | null;
  onChange: (id: string | null) => void;
};

export function StaffFilter({ staffList, selectedStaffId, onChange }: Props) {
  return (
    <Select
      value={selectedStaffId ?? "all"}
      onValueChange={(v) => onChange(v === "all" ? null : v)}
    >
      <SelectTrigger className="w-48">
        <SelectValue placeholder="Todos los profesionales" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">Todos los profesionales</SelectItem>
        {staffList.map((s) => (
          <SelectItem key={s.id} value={s.id}>
            {s.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}