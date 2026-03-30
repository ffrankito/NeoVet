// src/components/calendar/AppointmentCard.tsx
"use client";

import { getServiceColors } from "@/lib/calendar-utils";

export type CalendarAppointment = {
  id: string;
  scheduledAt: string;
  durationMinutes: number | null;
  status: string;
  patientName: string | null;
  clientName: string | null;
  serviceName: string | null;
  serviceCategory: string | null;
  blockDurationMinutes: number | null;
  staffName: string | null;
  appointmentType: string | null;
};

type Props = {
  appointment: CalendarAppointment;
  slotHeight: number; // px por slot de 30 min
  onClick: (appointment: CalendarAppointment) => void;
};

export function AppointmentCard({ appointment, slotHeight, onClick }: Props) {
  const colors = getServiceColors(appointment.serviceCategory);
  const duration = appointment.durationMinutes ?? 30;
  const block = appointment.blockDurationMinutes ?? 0;
  const totalMinutes = duration + block;
  const height = Math.max((totalMinutes / 30) * slotHeight - 4, slotHeight - 4);

  return (
    <div
      onClick={() => onClick(appointment)}
      style={{ height }}
      className={`
        absolute left-1 right-1 rounded-md border-l-4 px-1.5 py-1 cursor-pointer
        overflow-hidden select-none transition-opacity hover:opacity-80
        ${colors.bg} ${colors.border} ${colors.text}
      `}
    >
      <p className="text-xs font-semibold truncate leading-tight">
        {appointment.patientName ?? "Sin paciente"}
      </p>
      <p className="text-xs truncate opacity-75 leading-tight">
        {appointment.serviceName ?? appointment.appointmentType ?? "Turno"}
      </p>
      {block > 0 && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-red-300 opacity-60 rounded-b" />
      )}
    </div>
  );
}