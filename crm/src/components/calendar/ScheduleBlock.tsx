"use client";

import { ScheduleBlock } from "@/db/schema";
import { X, Lock } from "lucide-react";


type Props = {
  block: ScheduleBlock;
  slotHeight: number;
  totalSlots: number;
  onDelete: (id: string) => void;
};

export function ScheduleBlockCard({ block, slotHeight, totalSlots, onDelete }: Props) {
  const isAllDay = !block.startTime || !block.endTime;
  const totalHeight = slotHeight * totalSlots;

  let height: number;
  let top = 0;

  if (isAllDay) {
    height = totalHeight;
    top = 0;
  } else {
    const [sh, sm] = block.startTime!.split(":").map(Number);
    const [eh, em] = block.endTime!.split(":").map(Number);
    // Clínica empieza a las 9:30 — slot 0
    const clinicStartMinutes = 9 * 60 + 30;
    const startMinutes = sh * 60 + sm;
    const endMinutes = eh * 60 + em;
    top = ((startMinutes - clinicStartMinutes) / 30) * slotHeight;
    height = ((endMinutes - startMinutes) / 30) * slotHeight;
  }

  return (
    <div
      style={{ height, top, left: 0, right: 0 }}
      className="absolute z-10 bg-gray-200/80 border-l-4 border-gray-400 flex items-start justify-between px-2 pt-1 pointer-events-auto"
    >
      <span className="text-xs text-gray-600 font-medium leading-tight flex items-center gap-1">
    <Lock className="h-3 w-3 flex-shrink-0" />
        {block.reason ?? "No disponible"}
        </span>
      <button
        onClick={() => onDelete(block.id)}
        className="ml-1 text-gray-500 hover:text-destructive flex-shrink-0 mt-0.5"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );
}