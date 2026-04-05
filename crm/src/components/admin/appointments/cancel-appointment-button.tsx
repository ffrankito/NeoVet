"use client";

import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { updateAppointmentStatus } from "@/app/dashboard/appointments/actions";
import { cn } from "@/lib/utils";

interface CancelAppointmentButtonProps {
  appointmentId: string;
  size?: "default" | "sm";
}

export function CancelAppointmentButton({ appointmentId, size = "default" }: CancelAppointmentButtonProps) {
  const [isPending, setIsPending] = useState(false);
  const [reason, setReason] = useState("");

  async function handleConfirm() {
    setIsPending(true);
    await updateAppointmentStatus(appointmentId, "cancelled", reason || undefined);
  }

  const sizeClasses = size === "sm" ? "h-8 px-3" : "h-9 px-4 py-2";

  return (
    <AlertDialog>
      <AlertDialogTrigger
        disabled={isPending}
        className={cn(
          "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all",
          sizeClasses,
          "bg-destructive text-white shadow-xs hover:bg-destructive/90",
          "disabled:pointer-events-none disabled:opacity-50"
        )}
      >
        {isPending ? "Cancelando..." : "Cancelar"}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Cancelar turno?</AlertDialogTitle>
          <AlertDialogDescription>
            El turno quedará marcado como cancelado.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-2">
          <Label htmlFor="cancel-reason">Motivo (opcional)</Label>
          <Textarea
            id="cancel-reason"
            placeholder="Ej: El cliente reprogramó para la semana que viene"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
          />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel>Volver</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            className="bg-destructive text-white hover:bg-destructive/90"
          >
            Sí, cancelar turno
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
