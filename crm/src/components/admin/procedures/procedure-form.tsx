"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createProcedure } from "@/app/dashboard/procedures/actions";

type ActionResult =
  | {
      errors?: Record<string, string | string[] | undefined>;
      error?: string;
    }
  | undefined;

interface ProcedureFormProps {
  staffList: Array<{ id: string; name: string }>;
  defaultPatientId?: string;
  defaultPatientName?: string;
  defaultHospitalizationId?: string;
}

export function ProcedureForm({
  staffList,
  defaultPatientId,
  defaultPatientName,
  defaultHospitalizationId,
}: ProcedureFormProps) {
  const action = async (_prev: ActionResult, formData: FormData) =>
    createProcedure(formData);
  const [result, dispatch, isPending] = useActionState(action, undefined);

  const error = result && "error" in result ? result.error : null;
  const errors =
    result && "errors" in result
      ? (result.errors ?? {})
      : ({} as Record<string, string | string[] | undefined>);

  return (
    <form action={dispatch} className="max-w-xl space-y-4">
      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Patient ID — hidden if pre-filled */}
      {defaultPatientId ? (
        <input type="hidden" name="patientId" value={defaultPatientId} />
      ) : (
        <div className="space-y-2">
          <Label htmlFor="patientId">ID del paciente *</Label>
          <Input
            id="patientId"
            name="patientId"
            required
            placeholder="pat_..."
            aria-invalid={!!errors?.patientId}
          />
          {errors?.patientId && (
            <p className="text-xs text-destructive">{errors.patientId}</p>
          )}
        </div>
      )}

      {/* Hospitalization ID — hidden if pre-filled */}
      {defaultHospitalizationId && (
        <input
          type="hidden"
          name="hospitalizationId"
          value={defaultHospitalizationId}
        />
      )}

      <div className="space-y-2">
        <Label htmlFor="procedureDate">Fecha y hora *</Label>
        <Input
          id="procedureDate"
          name="procedureDate"
          type="datetime-local"
          required
          aria-invalid={!!errors?.procedureDate}
        />
        {errors?.procedureDate && (
          <p className="text-xs text-destructive">{errors.procedureDate}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Descripción *</Label>
        <Textarea
          id="description"
          name="description"
          required
          placeholder="Descripción del procedimiento..."
          rows={3}
          aria-invalid={!!errors?.description}
        />
        {errors?.description && (
          <p className="text-xs text-destructive">{errors.description}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="type">Tipo</Label>
        <Input
          id="type"
          name="type"
          placeholder="Ej: cirugía, dental, endoscopía..."
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">Cirujano(s)</legend>
          <div className="space-y-1 rounded-md border p-3">
            {staffList.map((s) => (
              <label key={s.id} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-muted/50 rounded px-1 py-0.5">
                <input type="checkbox" name="surgeonIds" value={s.id} className="rounded" />
                {s.name}
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">Anestesiólogo(s)</legend>
          <div className="space-y-1 rounded-md border p-3">
            {staffList.map((s) => (
              <label key={s.id} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-muted/50 rounded px-1 py-0.5">
                <input type="checkbox" name="anesthesiologistIds" value={s.id} className="rounded" />
                {s.name}
              </label>
            ))}
          </div>
        </fieldset>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notas</Label>
        <Textarea
          id="notes"
          name="notes"
          placeholder="Observaciones adicionales..."
          rows={3}
        />
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Guardando..." : "Registrar procedimiento"}
        </Button>
        <Link
          href="/dashboard/procedures"
          className="inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-4 text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground"
        >
          Cancelar
        </Link>
      </div>
    </form>
  );
}
