"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
import { dischargeHospitalization } from "@/app/dashboard/hospitalizations/actions";

interface DischargeButtonProps {
  hospitalizationId: string;
}

export function DischargeButton({ hospitalizationId }: DischargeButtonProps) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState("");

  async function handleDischarge() {
    setIsPending(true);
    setError(null);

    const formData = new FormData();
    if (notes.trim()) {
      formData.set("notes", notes.trim());
    }

    const result = await dischargeHospitalization(hospitalizationId, formData);

    if (result && "error" in result && result.error) {
      setError(result.error);
      setIsPending(false);
      return;
    }

    router.refresh();
  }

  return (
    <>
      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <AlertDialog>
        <AlertDialogTrigger
          render={
            <Button variant="outline" disabled={isPending}>
              Dar de alta
            </Button>
          }
        />
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              ¿Dar de alta al paciente?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Se registrará la fecha y hora actual como momento del alta. Esta
              acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-2 py-2">
            <Label htmlFor="discharge-notes">Notas de alta (opcional)</Label>
            <Textarea
              id="discharge-notes"
              rows={3}
              placeholder="Indicaciones al alta, estado del paciente, etc."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDischarge} disabled={isPending}>
              {isPending ? "Procesando..." : "Sí, dar de alta"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
