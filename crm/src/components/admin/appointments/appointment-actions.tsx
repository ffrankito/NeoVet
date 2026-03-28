"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
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
import { updateAppointmentStatus } from "@/app/dashboard/appointments/actions";
import { cn } from "@/lib/utils";

interface AppointmentActionsProps {
  appointmentId: string;
  status: "pending" | "confirmed" | "cancelled" | "completed";
}

export function AppointmentActions({ appointmentId, status }: AppointmentActionsProps) {
  const [isPending, setIsPending] = useState(false);

  async function handleConfirm() {
    setIsPending(true);
    await updateAppointmentStatus(appointmentId, "confirmed");
    setIsPending(false);
  }

  async function handleCancel() {
    setIsPending(true);
    await updateAppointmentStatus(appointmentId, "cancelled");
    setIsPending(false);
  }

  if (status === "completed" || status === "cancelled") {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      {status === "pending" && (
        <Button
          size="sm"
          variant="outline"
          disabled={isPending}
          onClick={handleConfirm}
        >
          Confirmar
        </Button>
      )}

      <AlertDialog>
        <AlertDialogTrigger
          disabled={isPending}
          className={cn(
            "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all",
            "h-8 px-3",
            "text-destructive hover:bg-destructive/10",
            "disabled:pointer-events-none disabled:opacity-50"
          )}
        >
          Cancelar
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Cancelar turno?</AlertDialogTitle>
            <AlertDialogDescription>
              El turno quedará marcado como cancelado.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Volver</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancel}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              Sí, cancelar turno
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
