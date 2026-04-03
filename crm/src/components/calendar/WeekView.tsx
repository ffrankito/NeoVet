"use client";

import { CalendarAppointment, AppointmentCard } from "./AppointmentCard";
import { ScheduleBlockCard } from "./ScheduleBlock";
import { ScheduleBlock } from "@/db/schema";
import type { Feriado } from "@/lib/feriados";
import { isFeriado } from "@/lib/feriados";
import {
  generateDaySlots,
  getWeekDays,
  formatDayHeader,
  formatDateKey,
  toMinutes,
} from "@/lib/calendar-utils";

const SLOT_HEIGHT = 56;
const BREAK_HEIGHT = 32;

type Props = {
  weekStart: Date;
  appointments: CalendarAppointment[];
  blocks: ScheduleBlock[];
  feriados: Feriado[];
  onAppointmentClick: (appointment: CalendarAppointment) => void;
  onDeleteBlock: (id: string) => void;
};

export function WeekView({ weekStart, appointments, blocks, feriados, onAppointmentClick, onDeleteBlock }: Props) {
  const days = getWeekDays(weekStart);
  const slots = generateDaySlots();
  const today = formatDateKey(new Date());

  const appointmentsByDay: Record<string, CalendarAppointment[]> = {};
  for (const appt of appointments) {
    const key = formatDateKey(new Date(appt.scheduledAt));
    if (!appointmentsByDay[key]) appointmentsByDay[key] = [];
    appointmentsByDay[key].push(appt);
  }

  return (
    <div className="flex overflow-x-auto">
      <div className="flex-shrink-0 w-16 border-r border-gray-200">
        <div className="h-10 border-b border-gray-200" />
        {slots.map((slot) => (
          <div
            key={slot.label}
            style={{ height: slot.isBreak ? BREAK_HEIGHT : SLOT_HEIGHT }}
            className={`flex items-start justify-end pr-2 pt-1 border-b ${
              slot.isBreak ? "border-gray-200 bg-gray-50" : "border-gray-100"
            }`}
          >
            {!slot.isBreak && (
              <span className="text-xs text-gray-400">{slot.label}</span>
            )}
          </div>
        ))}
      </div>

      {days.map((day) => {
        const dayKey = formatDateKey(day);
        const isToday = dayKey === today;
        const esFeriado = isFeriado(dayKey, feriados);
        const feriadoInfo = feriados.find((f) => f.fecha === dayKey);
        const dayAppts = appointmentsByDay[dayKey] ?? [];

        const dayBlocks = blocks.filter(
          (b) => b.startDate <= dayKey && b.endDate >= dayKey
        );

        return (
          <div key={dayKey} className="flex-1 min-w-[100px] border-r border-gray-200 last:border-r-0">
            <div
              className={`h-10 flex flex-col items-center justify-center border-b border-gray-200 sticky top-0 z-10 ${
                isToday
                  ? "bg-blue-50 text-blue-700"
                  : esFeriado
                  ? "bg-amber-50 text-amber-700"
                  : "bg-white text-gray-600"
              }`}
            >
              <span className="text-xs font-medium">{formatDayHeader(day)}</span>
              {esFeriado && (
                <span className="text-[10px] truncate max-w-[90px] px-1 text-amber-600">
                  {feriadoInfo?.nombre ?? "Feriado"}
                </span>
              )}
            </div>

            <div className="relative">
              {dayBlocks.map((block) => (
                <ScheduleBlockCard
                  key={block.id}
                  block={block}
                  slotHeight={SLOT_HEIGHT}
                  totalSlots={slots.length}
                  onDelete={onDeleteBlock}
                />
              ))}

              {slots.map((slot) => {
                if (slot.isBreak) {
                  return (
                    <div
                      key={`break-${slot.label}`}
                      style={{ height: BREAK_HEIGHT }}
                      className="border-b border-gray-200 bg-gray-50 flex items-center justify-center"
                    >
                      <span className="text-xs text-gray-400 italic">— descanso —</span>
                    </div>
                  );
                }

                const slotMinutes = toMinutes(slot.hour, slot.minute);

                const apptAtSlot = dayAppts.find((a) => {
                  const d = new Date(a.scheduledAt);
                  return toMinutes(d.getHours(), d.getMinutes()) === slotMinutes;
                });

                const slotCovered = dayAppts.some((a) => {
                  const d = new Date(a.scheduledAt);
                  const start = toMinutes(d.getHours(), d.getMinutes());
                  const duration = (a.durationMinutes ?? 30) + (a.blockDurationMinutes ?? 0);
                  const end = start + duration;
                  return slotMinutes > start && slotMinutes < end;
                });

                if (slotCovered) {
                  return (
                    <div
                      key={slot.label}
                      style={{ height: SLOT_HEIGHT }}
                      className={`border-b border-gray-100 ${esFeriado ? "bg-amber-50/30" : ""}`}
                    />
                  );
                }

                return (
                  <div
                    key={slot.label}
                    style={{ height: SLOT_HEIGHT }}
                    className={`relative border-b border-gray-100 ${esFeriado ? "bg-amber-50/30" : ""}`}
                  >
                    {apptAtSlot && (
                      <AppointmentCard
                        appointment={apptAtSlot}
                        slotHeight={SLOT_HEIGHT}
                        onClick={onAppointmentClick}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}