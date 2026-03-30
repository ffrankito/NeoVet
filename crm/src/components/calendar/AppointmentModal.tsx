"use client";

import { useState, useRef } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { CalendarAppointment } from "./AppointmentCard";
import { getServiceColors } from "@/lib/calendar-utils";

type Props = {
  appointment: CalendarAppointment | null;
  onClose: () => void;
  onCancelled: (id: string) => void;
};

export function AppointmentModal({ appointment, onClose, onCancelled }: Props) {
  const [cancelling, setCancelling] = useState(false);
  // Guardamos el id en un ref para que el closure de handleCancel no lo pierda
  const appointmentIdRef = useRef<string | null>(null);
  if (appointment) appointmentIdRef.current = appointment.id;

  if (!appointment) return null;

  const colors = getServiceColors(appointment.serviceCategory);

  const scheduledAt = new Date(appointment.scheduledAt);
  const dateStr = scheduledAt.toLocaleDateString("es-AR", {
    weekday: "long", day: "numeric", month: "long",
  });
  const timeStr = scheduledAt.toLocaleTimeString("es-AR", {
    hour: "2-digit", minute: "2-digit",
  });

  async function handleCancel() {
    const id = appointmentIdRef.current;
    if (!id) return;
    setCancelling(true);
    try {
      const res = await fetch(`/api/appointments/${id}/cancel`, {
        method: "PATCH",
      });
      if (res.ok) {
        onCancelled(id);
        onClose();
      }
    } finally {
      setCancelling(false);
    }
  }

  const isCancelled = appointment.status === "cancelled";

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className={`w-3 h-3 rounded-full border-2 ${colors.border} ${colors.bg}`} />
            {appointment.patientName ?? "Sin paciente"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Fecha</span>
            <span className="font-medium capitalize">{dateStr}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Hora</span>
            <span className="font-medium">{timeStr}</span>
          </div>
          {appointment.clientName && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tutor</span>
              <span className="font-medium">{appointment.clientName}</span>
            </div>
          )}
          {appointment.serviceName && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Servicio</span>
              <Badge variant="outline" className={`${colors.bg} ${colors.text} ${colors.border}`}>
                {appointment.serviceName}
              </Badge>
            </div>
          )}
          {appointment.staffName && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Profesional</span>
              <span className="font-medium">{appointment.staffName}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-muted-foreground">Estado</span>
            <Badge variant={isCancelled ? "destructive" : "secondary"}>
              {isCancelled ? "Cancelado" : appointment.status}
            </Badge>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            Cerrar
          </Button>
          {!isCancelled && (
            <AlertDialog>
              <AlertDialogTrigger
                disabled={cancelling}
                className="flex-1 inline-flex items-center justify-center rounded-lg border border-transparent bg-destructive px-4 py-2 text-sm font-medium text-white shadow-xs hover:bg-destructive/90 disabled:pointer-events-none disabled:opacity-50"
              >
                Cancelar turno
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Cancelar este turno?</AlertDialogTitle>
                  <AlertDialogDescription>
                    El turno de <strong>{appointment.patientName}</strong> el{" "}
                    {dateStr} a las {timeStr} será marcado como cancelado.
                    Esta acción no se puede deshacer.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Volver</AlertDialogCancel>
                  <AlertDialogAction onClick={handleCancel} disabled={cancelling}>
                    Sí, cancelar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}