"use client";

import { CalendarAppointment, AppointmentCard } from "./AppointmentCard";
import { ScheduleBlockCard } from "./ScheduleBlock";
import { ScheduleBlock } from "@/db/schema";
import type { Feriado } from "@/lib/feriados";
import { isFeriado } from "@/lib/feriados";
import type { ClinicHours } from "@/lib/calendar-utils";
import {
  generateDaySlots,
  toMinutes,
  formatDateKey,
} from "@/lib/calendar-utils";

const SLOT_HEIGHT = 64;
const BREAK_HEIGHT = 32;

type Props = {
  date: Date;
  appointments: CalendarAppointment[];
  blocks: ScheduleBlock[];
  feriados: Feriado[];
  clinicHours: ClinicHours;
  holidayHours: string;
  onAppointmentClick: (appointment: CalendarAppointment) => void;
  onDeleteBlock: (id: string) => void;
};

export function DayView({ date, appointments, blocks, feriados, clinicHours, holidayHours, onAppointmentClick, onDeleteBlock }: Props) {
  const slots = generateDaySlots(clinicHours);
  const dayKey = formatDateKey(date);
  const esFeriado = isFeriado(dayKey, feriados);
  const feriadoInfo = feriados.find((f) => f.fecha === dayKey);

  const dayBlocks = blocks.filter(
    (b) => b.startDate <= dayKey && b.endDate >= dayKey
  );

  return (
    <div className="flex flex-col">
      {esFeriado && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-sm text-amber-700 font-medium">
          🗓 Feriado: {feriadoInfo?.nombre ?? "Feriado nacional"} — Horario reducido {holidayHours}
        </div>
      )}
      <div className="flex">
        <div className="flex-shrink-0 w-16 border-r border-gray-200">
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

        <div className="flex-1 relative">
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

            const apptAtSlot = appointments.find((a) => {
              const d = new Date(a.scheduledAt);
              return toMinutes(d.getHours(), d.getMinutes()) === slotMinutes;
            });

            const slotCovered = appointments.some((a) => {
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
    </div>
  );
}