"use client";

import { CalendarAppointment, AppointmentCard } from "./AppointmentCard";
import {
  generateDaySlots,
  toMinutes,
} from "@/lib/calendar-utils";

const SLOT_HEIGHT = 64;

type Props = {
  date: Date;
  appointments: CalendarAppointment[];
  onAppointmentClick: (appointment: CalendarAppointment) => void;
};

export function DayView({ date, appointments, onAppointmentClick }: Props) {
  const slots = generateDaySlots();

  return (
    <div className="flex">
      <div className="flex-shrink-0 w-16 border-r border-gray-200">
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

      <div className="flex-1">
        {slots.map((slot) => {
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
    </div>
  );
}