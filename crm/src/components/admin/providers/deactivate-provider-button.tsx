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
import { deactivateProvider } from "@/app/dashboard/petshop/providers/actions";
import { cn } from "@/lib/utils";

interface DeactivateProviderButtonProps {
  providerId: string;
}

export function DeactivateProviderButton({ providerId }: DeactivateProviderButtonProps) {
  const [isPending, setIsPending] = useState(false);

  async function handleConfirm() {
    setIsPending(true);
    await deactivateProvider(providerId);
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger
        disabled={isPending}
        className={cn(
          "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all",
          "h-9 px-4 py-2",
          "bg-destructive text-white shadow-xs hover:bg-destructive/90",
          "disabled:pointer-events-none disabled:opacity-50"
        )}
      >
        {isPending ? "Desactivando..." : "Desactivar"}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Desactivar proveedor?</AlertDialogTitle>
          <AlertDialogDescription>
            El proveedor no se eliminará, pero dejará de aparecer en las listas. Los ingresos de stock asociados se conservan.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            className="bg-destructive text-white hover:bg-destructive/90"
          >
            Sí, desactivar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
