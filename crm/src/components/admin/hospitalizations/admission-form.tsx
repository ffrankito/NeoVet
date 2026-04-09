"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createHospitalization } from "@/app/dashboard/hospitalizations/actions";

type ActionResult =
  | {
      errors?: Record<string, string | string[] | undefined>;
      error?: string;
    }
  | undefined;

interface AdmissionFormProps {
  patientId: string;
  consultationId?: string;
}

export function AdmissionForm({
  patientId,
  consultationId,
}: AdmissionFormProps) {
  const action = async (_prev: ActionResult, formData: FormData) =>
    createHospitalization(formData);
  const [result, dispatch, isPending] = useActionState(action, undefined);

  const error = result && "error" in result ? result.error : null;

  return (
    <form action={dispatch} className="max-w-xl space-y-4">
      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <input type="hidden" name="patientId" value={patientId} />
      {consultationId && (
        <input type="hidden" name="consultationId" value={consultationId} />
      )}

      <div className="space-y-2">
        <Label htmlFor="reason">Motivo de internación</Label>
        <Textarea
          id="reason"
          name="reason"
          placeholder="Motivo por el que se interna al paciente..."
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notas adicionales</Label>
        <Textarea
          id="notes"
          name="notes"
          placeholder="Observaciones iniciales, indicaciones, etc."
          rows={3}
        />
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Admitiendo..." : "Admitir paciente"}
        </Button>
        <Link
          href="/dashboard/hospitalizations"
          className="inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-4 text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground"
        >
          Cancelar
        </Link>
      </div>
    </form>
  );
}
