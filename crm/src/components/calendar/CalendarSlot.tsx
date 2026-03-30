// src/components/calendar/CalendarSlot.tsx
"use client";

import { TimeSlot } from "@/lib/calendar-utils";

type Props = {
  slot: TimeSlot;
  date: Date;
  height: number;
  hasAppointment: boolean;
  onClick: (date: Date, slot: TimeSlot) => void;
};

export function CalendarSlot({ slot, date, height, hasAppointment, onClick }: Props) {
  if (hasAppointment) {
    return <div style={{ height }} className="relative border-b border-gray-100" />;
  }

  return (
    <div
      style={{ height }}
      onClick={() => onClick(date, slot)}
      className="
        relative border-b border-gray-100 cursor-pointer
        hover:bg-blue-50 transition-colors group
      "
    >
      <span className="
        absolute inset-0 flex items-center justify-center
        text-xs text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity
      ">
        + Nuevo turno
      </span>
    </div>
  );
}