"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { addObservation } from "@/app/dashboard/hospitalizations/actions";

type ActionResult =
  | {
      errors?: Record<string, string | string[] | undefined>;
      error?: string;
      success?: boolean;
    }
  | undefined;

const CAPILLARY_REFILL_OPTIONS = ["< 2 seg", "2-3 seg", "> 3 seg"] as const;
const MUCOUS_MEMBRANE_OPTIONS = ["Rosadas", "Pálidas", "Cianóticas", "Ictéricas", "Congestionadas"] as const;
const SENSORIUM_OPTIONS = ["Alerta", "Semicomatoso", "Comatoso"] as const;

interface ObservationFormProps {
  hospitalizationId: string;
}

export function ObservationForm({ hospitalizationId }: ObservationFormProps) {
  const action = async (_prev: ActionResult, formData: FormData) =>
    addObservation(hospitalizationId, formData);
  const [result, dispatch, isPending] = useActionState(action, undefined);

  const error = result && "error" in result ? result.error : null;
  const errors =
    result && "errors" in result
      ? (result.errors ?? {})
      : ({} as Record<string, string | string[] | undefined>);

  return (
    <form action={dispatch} className="space-y-4">
      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Signos vitales */}
      <div className="space-y-2">
        <p className="text-sm font-medium">Signos vitales</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="space-y-1">
            <Label htmlFor="weightKg" className="text-xs">
              Peso (kg)
            </Label>
            <Input
              id="weightKg"
              name="weightKg"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              aria-invalid={!!errors?.weightKg}
            />
            {errors?.weightKg && (
              <p className="text-xs text-destructive">{errors.weightKg}</p>
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor="temperature" className="text-xs">
              Temp. (&deg;C)
            </Label>
            <Input
              id="temperature"
              name="temperature"
              type="number"
              step="0.1"
              min="30"
              max="45"
              placeholder="38.5"
              aria-invalid={!!errors?.temperature}
            />
            {errors?.temperature && (
              <p className="text-xs text-destructive">{errors.temperature}</p>
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor="heartRate" className="text-xs">
              FC (lpm)
            </Label>
            <Input
              id="heartRate"
              name="heartRate"
              type="number"
              step="1"
              min="0"
              placeholder="80"
              aria-invalid={!!errors?.heartRate}
            />
            {errors?.heartRate && (
              <p className="text-xs text-destructive">{errors.heartRate}</p>
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor="respiratoryRate" className="text-xs">
              FR (rpm)
            </Label>
            <Input
              id="respiratoryRate"
              name="respiratoryRate"
              type="number"
              step="1"
              min="0"
              placeholder="20"
              aria-invalid={!!errors?.respiratoryRate}
            />
            {errors?.respiratoryRate && (
              <p className="text-xs text-destructive">
                {errors.respiratoryRate}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Examen físico */}
      <div className="space-y-2">
        <p className="text-sm font-medium">Examen físico</p>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="space-y-1">
            <Label htmlFor="capillaryRefillTime" className="text-xs">
              Llenado capilar
            </Label>
            <Select name="capillaryRefillTime">
              <SelectTrigger id="capillaryRefillTime">
                <SelectValue placeholder="Seleccionar..." />
              </SelectTrigger>
              <SelectContent>
                {CAPILLARY_REFILL_OPTIONS.map((opt) => (
                  <SelectItem key={opt} value={opt}>
                    {opt}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label htmlFor="mucousMembranes" className="text-xs">
              Mucosas
            </Label>
            <Select name="mucousMembranes">
              <SelectTrigger id="mucousMembranes">
                <SelectValue placeholder="Seleccionar..." />
              </SelectTrigger>
              <SelectContent>
                {MUCOUS_MEMBRANE_OPTIONS.map((opt) => (
                  <SelectItem key={opt} value={opt}>
                    {opt}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label htmlFor="sensorium" className="text-xs">
              Sensorio
            </Label>
            <Select name="sensorium">
              <SelectTrigger id="sensorium">
                <SelectValue placeholder="Seleccionar..." />
              </SelectTrigger>
              <SelectContent>
                {SENSORIUM_OPTIONS.map((opt) => (
                  <SelectItem key={opt} value={opt}>
                    {opt}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Observaciones clínicas */}
      <div className="space-y-2">
        <p className="text-sm font-medium">Observaciones clínicas</p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-1">
            <Label htmlFor="feeding" className="text-xs">
              Alimentación
            </Label>
            <Textarea
              id="feeding"
              name="feeding"
              rows={2}
              placeholder="Comió normalmente, sin apetito, etc."
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="hydration" className="text-xs">
              Hidratación
            </Label>
            <Textarea
              id="hydration"
              name="hydration"
              rows={2}
              placeholder="Toma agua, suero IV, etc."
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="medication" className="text-xs">
              Medicación
            </Label>
            <Textarea
              id="medication"
              name="medication"
              rows={2}
              placeholder="Medicamentos administrados..."
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="urineOutput" className="text-xs">
              Orina
            </Label>
            <Textarea
              id="urineOutput"
              name="urineOutput"
              rows={2}
              placeholder="Normal, escasa, sin orinar, etc."
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="fecesOutput" className="text-xs">
              Heces
            </Label>
            <Textarea
              id="fecesOutput"
              name="fecesOutput"
              rows={2}
              placeholder="Normal, diarrea, sin deposiciones, etc."
            />
          </div>
        </div>
      </div>

      {/* Notas generales */}
      <div className="space-y-1">
        <Label htmlFor="obs-notes" className="text-xs">
          Notas
        </Label>
        <Textarea
          id="obs-notes"
          name="notes"
          rows={3}
          placeholder="Observaciones generales del paciente..."
        />
      </div>

      <Button type="submit" disabled={isPending}>
        {isPending ? "Registrando..." : "Registrar observación"}
      </Button>
    </form>
  );
}
