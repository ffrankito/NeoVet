"use client";

import { CalendarAppointment, AppointmentCard } from "./AppointmentCard";
import {
  generateDaySlots,
  getWeekDays,
  formatDayHeader,
  formatDateKey,
  toMinutes,
} from "@/lib/calendar-utils";

const SLOT_HEIGHT = 56;

type Props = {
  weekStart: Date;
  appointments: CalendarAppointment[];
  onAppointmentClick: (appointment: CalendarAppointment) => void;
};

export function WeekView({ weekStart, appointments, onAppointmentClick }: Props) {
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
      {/* Columna de horas */}
      <div className="flex-shrink-0 w-16 border-r border-gray-200">
        <div className="h-10 border-b border-gray-200" />
        {slots.map((slot) => (
          <div
            key={slot.label}
            style={{ height: SLOT_HEIGHT }}
            className="flex items-start justify-end pr-2 pt-1 border-b border-gray-100"
          >
            <span className="text-xs text-gray-400">{slot.label}</span>
          </div>
        ))}
      </div>

      {/* Columnas por día */}
      {days.map((day) => {
        const dayKey = formatDateKey(day);
        const isToday = dayKey === today;
        const dayAppts = appointmentsByDay[dayKey] ?? [];

        return (
          <div key={dayKey} className="flex-1 min-w-[100px] border-r border-gray-200 last:border-r-0">
            <div
              className={`h-10 flex items-center justify-center border-b border-gray-200 text-xs font-medium sticky top-0 z-10 ${
                isToday ? "bg-blue-50 text-blue-700" : "bg-white text-gray-600"
              }`}
            >
              {formatDayHeader(day)}
            </div>

            {slots.map((slot) => {
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
                    className="border-b border-gray-100"
                  />
                );
              }

              return (
                <div
                  key={slot.label}
                  style={{ height: SLOT_HEIGHT }}
                  className="relative border-b border-gray-100"
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
        );
      })}
    </div>
  );
}