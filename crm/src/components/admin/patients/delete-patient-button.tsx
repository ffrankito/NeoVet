"use client";

import { useEffect, useState } from "react";
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
import {
  deletePatient,
  getPatientDeletePreview,
  type PatientDeletePreview,
} from "@/app/dashboard/patients/actions";
import { cn } from "@/lib/utils";

interface DeletePatientButtonProps {
  patientId: string;
}

const ROW_LABELS: Array<{ key: keyof PatientDeletePreview; label: string }> = [
  { key: "consultations", label: "Consultas" },
  { key: "appointments", label: "Turnos" },
  { key: "hospitalizations", label: "Internaciones" },
  { key: "procedures", label: "Procedimientos" },
  { key: "vaccinations", label: "Vacunas" },
  { key: "groomingSessions", label: "Sesiones de peluquería" },
];

export function DeletePatientButton({ patientId }: DeletePatientButtonProps) {
  const [open, setOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [preview, setPreview] = useState<PatientDeletePreview | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setPreview(null);
    setPreviewError(null);
    let cancelled = false;
    getPatientDeletePreview(patientId)
      .then((p) => {
        if (!cancelled) setPreview(p);
      })
      .catch(() => {
        if (!cancelled) setPreviewError("No se pudo calcular el impacto.");
      });
    return () => {
      cancelled = true;
    };
  }, [open, patientId]);

  async function handleConfirm() {
    setIsPending(true);
    await deletePatient(patientId);
  }

  const visibleRows = preview
    ? ROW_LABELS.filter(({ key }) => preview[key] > 0)
    : [];

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger
        disabled={isPending}
        className={cn(
          "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all",
          "h-9 px-4 py-2",
          "bg-destructive text-white shadow-xs hover:bg-destructive/90",
          "disabled:pointer-events-none disabled:opacity-50",
        )}
      >
        {isPending ? "Eliminando..." : "Eliminar"}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Eliminar paciente?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta acción no se puede deshacer. Se eliminarán permanentemente:
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="text-sm">
          {previewError ? (
            <p className="text-destructive">{previewError}</p>
          ) : preview ? (
            visibleRows.length > 0 ? (
              <ul className="list-disc space-y-1 pl-5">
                {visibleRows.map(({ key, label }) => (
                  <li key={key}>
                    <span className="font-semibold tabular-nums">
                      {preview[key]}
                    </span>{" "}
                    {label.toLowerCase()}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground">
                Este paciente no tiene registros asociados.
              </p>
            )
          ) : (
            <p className="text-muted-foreground">Calculando impacto…</p>
          )}
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={!preview && !previewError}
            className="bg-destructive text-white hover:bg-destructive/90"
          >
            Sí, eliminar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
