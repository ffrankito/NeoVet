"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button-variants";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createConsultation, updateConsultation } from "@/app/dashboard/consultations/actions";
import { TreatmentItemsInput } from "./treatment-items-input";
import type { Consultation, TreatmentItem } from "@/db/schema";

type FieldErrors = Record<string, string[] | undefined>;
type ActionResult = { errors: FieldErrors } | { error: string } | undefined;

function getFieldError(result: ActionResult, field: string): string | undefined {
  if (result && "errors" in result) return result.errors[field]?.[0];
}

function getGlobalError(result: ActionResult): string | null {
  if (result && "error" in result) return result.error;
  return null;
}

interface ConsultationFormProps {
  patientId: string;
  appointmentId?: string;
  consultation?: Consultation;
  treatmentItems?: TreatmentItem[];
}

export function ConsultationForm({ patientId, appointmentId, consultation, treatmentItems = [] }: ConsultationFormProps) {
  const isEdit = !!consultation;

  const action = async (_prev: ActionResult, formData: FormData) => {
    if (isEdit) return updateConsultation(consultation.id, formData);
    return createConsultation(formData);
  };

  const [result, dispatch, isPending] = useActionState(action, undefined);

  const globalError = getGlobalError(result);

  return (
    <form action={dispatch} className="max-w-2xl space-y-8">
      {/* Hidden fields */}
      <input type="hidden" name="patientId" value={patientId} />
      {appointmentId && <input type="hidden" name="appointmentId" value={appointmentId} />}

      {globalError && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {globalError}
        </div>
      )}

      {/* Vitals */}
      <div className="space-y-4">
        <h2 className="text-base font-semibold">Signos vitales</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="weightKg">Peso (kg)</Label>
            <Input
              id="weightKg"
              name="weightKg"
              type="number"
              step="0.01"
              min="0"
              placeholder="4.5"
              defaultValue={consultation?.weightKg ?? ""}
              aria-invalid={!!getFieldError(result, "weightKg")}
            />
            {getFieldError(result, "weightKg") && (
              <p className="text-sm text-destructive">{getFieldError(result, "weightKg")}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="temperature">Temperatura (°C)</Label>
            <Input
              id="temperature"
              name="temperature"
              type="number"
              step="0.1"
              min="0"
              placeholder="38.5"
              defaultValue={consultation?.temperature ?? ""}
              aria-invalid={!!getFieldError(result, "temperature")}
            />
            {getFieldError(result, "temperature") && (
              <p className="text-sm text-destructive">{getFieldError(result, "temperature")}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="heartRate">Frec. cardíaca (lpm)</Label>
            <Input
              id="heartRate"
              name="heartRate"
              type="number"
              step="1"
              min="0"
              placeholder="80"
              defaultValue={consultation?.heartRate ?? ""}
              aria-invalid={!!getFieldError(result, "heartRate")}
            />
            {getFieldError(result, "heartRate") && (
              <p className="text-sm text-destructive">{getFieldError(result, "heartRate")}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="respiratoryRate">Frec. respiratoria (rpm)</Label>
            <Input
              id="respiratoryRate"
              name="respiratoryRate"
              type="number"
              step="1"
              min="0"
              placeholder="20"
              defaultValue={consultation?.respiratoryRate ?? ""}
              aria-invalid={!!getFieldError(result, "respiratoryRate")}
            />
            {getFieldError(result, "respiratoryRate") && (
              <p className="text-sm text-destructive">{getFieldError(result, "respiratoryRate")}</p>
            )}
          </div>
        </div>
      </div>

      {/* SOAP */}
      <div className="space-y-4">
        <h2 className="text-base font-semibold">Historia SOAP</h2>

        <div className="space-y-2">
          <Label htmlFor="subjective">Subjetivo</Label>
          <p className="text-xs text-muted-foreground">Lo que refiere el dueño sobre el paciente.</p>
          <Textarea
            id="subjective"
            name="subjective"
            rows={3}
            placeholder="El dueño refiere que el paciente no comió en las últimas 24 hs..."
            defaultValue={consultation?.subjective ?? ""}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="objective">Objetivo</Label>
          <p className="text-xs text-muted-foreground">Hallazgos del examen físico.</p>
          <Textarea
            id="objective"
            name="objective"
            rows={3}
            placeholder="Al examen físico se observa mucosas pálidas, abdomen tenso..."
            defaultValue={consultation?.objective ?? ""}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="assessment">Diagnóstico</Label>
          <p className="text-xs text-muted-foreground">Impresión diagnóstica o diagnóstico definitivo.</p>
          <Textarea
            id="assessment"
            name="assessment"
            rows={2}
            placeholder="Gastroenteritis aguda. Descartar obstrucción."
            defaultValue={consultation?.assessment ?? ""}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="plan">Plan</Label>
          <p className="text-xs text-muted-foreground">Tratamiento, estudios, indicaciones al dueño.</p>
          <Textarea
            id="plan"
            name="plan"
            rows={3}
            placeholder="Ayuno 12 hs. Hidratación parenteral. Rx abdominal. Control en 48 hs."
            defaultValue={consultation?.plan ?? ""}
          />
        </div>
      </div>

      {/* Treatment plan */}
      <div className="space-y-4">
        <h2 className="text-base font-semibold">Plan de tratamiento</h2>
        <TreatmentItemsInput defaultItems={treatmentItems} />
      </div>

      {/* Free-text notes */}
      <div className="space-y-2">
        <Label htmlFor="notes">Notas adicionales</Label>
        <Textarea
          id="notes"
          name="notes"
          rows={3}
          placeholder="Cualquier observación que no encaje en los campos anteriores..."
          defaultValue={consultation?.notes ?? ""}
        />
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending
            ? isEdit ? "Guardando..." : "Registrando..."
            : isEdit ? "Guardar cambios" : "Registrar consulta"}
        </Button>
        <a
          href={isEdit
            ? `/dashboard/consultations/${consultation.id}`
            : `/dashboard/patients/${patientId}`}
          className={buttonVariants({ variant: "outline" })}
        >
          Cancelar
        </a>
      </div>
    </form>
  );
}
