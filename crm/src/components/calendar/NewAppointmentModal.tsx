// src/components/calendar/NewAppointmentModal.tsx
"use client";

import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { TimeSlot } from "@/lib/calendar-utils";

type Props = {
  date: Date | null;
  slot: TimeSlot | null;
  onClose: () => void;
  onCreated: () => void;
};

export function NewAppointmentModal({ date, slot, onClose, onCreated }: Props) {
  if (!date || !slot) return null;

  // Construimos la URL a la página de nuevo turno con fecha/hora precargada
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const hh = String(slot.hour).padStart(2, "0");
  const min = String(slot.minute).padStart(2, "0");
  const preloadedDate = `${yyyy}-${mm}-${dd}`;
  const preloadedTime = `${hh}:${min}`;

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl h-[80vh] p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle>
            Nuevo turno — {preloadedDate} a las {preloadedTime}
          </DialogTitle>
        </DialogHeader>
        <iframe
          src={`/dashboard/appointments/new?date=${preloadedDate}&time=${preloadedTime}&modal=1`}
          className="w-full flex-1 border-0"
          style={{ height: "calc(80vh - 80px)" }}
          title="Nuevo turno"
        />
      </DialogContent>
    </Dialog>
  );
}