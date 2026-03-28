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
import { deleteConsultation } from "@/app/dashboard/consultations/actions";

interface Props {
  consultationId: string;
}

export function DeleteConsultationButton({ consultationId }: Props) {
  const [isPending, setIsPending] = useState(false);

  async function handleDelete() {
    setIsPending(true);
    await deleteConsultation(consultationId);
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger
        render={
          <Button variant="destructive" disabled={isPending}>
            Eliminar
          </Button>
        }
      />
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Eliminar consulta?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta acción no se puede deshacer. La consulta y toda su información clínica serán eliminadas permanentemente.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} disabled={isPending}>
            Sí, eliminar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
