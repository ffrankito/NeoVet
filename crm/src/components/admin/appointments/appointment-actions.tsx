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
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";

interface AppointmentActionsProps {
  appointmentId: string;
  patientId: string;
  status: "pending" | "confirmed" | "cancelled" | "completed" | "no_show";
}

export function AppointmentActions({ appointmentId, patientId, status }: AppointmentActionsProps) {
  const [isPending, setIsPending] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  async function handleConfirm() {
    setIsPending(true);
    await updateAppointmentStatus(appointmentId, "confirmed");
    setIsPending(false);
  }

  async function handleComplete() {
    setIsPending(true);
    await updateAppointmentStatus(appointmentId, "completed");
    setIsPending(false);
  }

  async function handleCancel() {
    setIsPending(true);
    await updateAppointmentStatus(appointmentId, "cancelled", cancelReason || undefined);
    setIsPending(false);
  }

  if (status === "cancelled" || status === "no_show") return null;

  if (status === "completed") {
    return (
      <a
        href={`/dashboard/consultations/new?patientId=${patientId}&appointmentId=${appointmentId}`}
        className={buttonVariants({ size: "sm" })}
      >
        Registrar consulta
      </a>
    );
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

      {status === "confirmed" && (
        <Button
          size="sm"
          variant="outline"
          disabled={isPending}
          onClick={handleComplete}
        >
          Completar
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
            <textarea
              className="mt-2 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground"
              placeholder="Motivo de cancelación (opcional)"
              rows={2}
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
            />
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
