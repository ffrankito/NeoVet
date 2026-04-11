"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createProcedure } from "@/app/dashboard/procedures/actions";
import { SearchableSelect } from "@/components/ui/searchable-select";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type ActionResult =
  | {
      errors?: Record<string, string | string[] | undefined>;
      error?: string;
    }
  | undefined;

interface PatientOption {
  id: string;
  name: string;
  species: string;
  clientId: string;
  clientName: string;
}

interface ClientOption {
  id: string;
  name: string;
}

const ASA_OPTIONS = [
  { value: "1", label: "ASA 1 — Sano" },
  { value: "2", label: "ASA 2 — Enfermedad sistémica leve" },
  { value: "3", label: "ASA 3 — Enfermedad sistémica grave" },
  { value: "4", label: "ASA 4 — Amenaza de vida" },
  { value: "5", label: "ASA 5 — Moribundo" },
  { value: "1E", label: "ASA 1E — Sano (emergencia)" },
  { value: "2E", label: "ASA 2E — Enf. leve (emergencia)" },
  { value: "3E", label: "ASA 3E — Enf. grave (emergencia)" },
  { value: "4E", label: "ASA 4E — Amenaza de vida (emergencia)" },
  { value: "5E", label: "ASA 5E — Moribundo (emergencia)" },
] as const;

interface ProcedureFormProps {
  staffList: Array<{ id: string; name: string }>;
  clients?: ClientOption[];
  patients?: PatientOption[];
  defaultPatientId?: string;
  defaultPatientName?: string;
  defaultHospitalizationId?: string;
}

export function ProcedureForm({
  staffList,
  clients = [],
  patients = [],
  defaultPatientId,
  defaultPatientName,
  defaultHospitalizationId,
}: ProcedureFormProps) {
  const [selectedClient, setSelectedClient] = useState("");
  const [selectedPatient, setSelectedPatient] = useState(defaultPatientId ?? "");

  const filteredPatients = patients.filter((p) => p.clientId === selectedClient);

  const action = async (_prev: ActionResult, formData: FormData) => {
    formData.set("patientId", selectedPatient || defaultPatientId || "");
    return createProcedure(formData);
  };

  const [result, dispatch, isPending] = useActionState(action, undefined);

  const error = result && "error" in result ? result.error : null;
  const errors =
    result && "errors" in result
      ? (result.errors ?? {})
      : ({} as Record<string, string | string[] | undefined>);

  return (
    <form action={dispatch} className="max-w-2xl space-y-4">
      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {defaultPatientId ? (
        <input type="hidden" name="patientId" value={defaultPatientId} />
      ) : (
        <>
          <div className="space-y-2">
            <Label>Cliente *</Label>
            <SearchableSelect
              options={clients.map((c) => ({ value: c.id, label: c.name }))}
              value={selectedClient}
              onChange={(v) => { setSelectedClient(v); setSelectedPatient(""); }}
              placeholder="Seleccioná un cliente"
              searchPlaceholder="Buscar cliente..."
              emptyMessage="No se encontró ningún cliente."
            />
          </div>

          {selectedClient && (
            <div className="space-y-2">
              <Label>Paciente *</Label>
              {filteredPatients.length === 0 ? (
                <p className="text-sm text-muted-foreground">Este cliente no tiene pacientes.</p>
              ) : (
                <SearchableSelect
                  options={filteredPatients.map((p) => ({
                    value: p.id,
                    label: p.name,
                    sublabel: p.species,
                  }))}
                  value={selectedPatient}
                  onChange={setSelectedPatient}
                  placeholder="Seleccioná un paciente"
                  searchPlaceholder="Buscar paciente..."
                  emptyMessage="No se encontró ningún paciente."
                />
              )}
            </div>
          )}
        </>
      )}

      {defaultHospitalizationId && (
        <input type="hidden" name="hospitalizationId" value={defaultHospitalizationId} />
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

      <div className="space-y-2">
        <Label htmlFor="asaScore">Valoración ASA</Label>
        <Select name="asaScore">
          <SelectTrigger id="asaScore">
            <SelectValue placeholder="Seleccionar..." />
          </SelectTrigger>
          <SelectContent>
            {ASA_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
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

        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">Ayudante(s)</legend>
          <div className="space-y-1 rounded-md border p-3">
            {staffList.map((s) => (
              <label key={s.id} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-muted/50 rounded px-1 py-0.5">
                <input type="checkbox" name="assistantIds" value={s.id} className="rounded" />
                {s.name}
              </label>
            ))}
          </div>
        </fieldset>
      </div>

      {/* Pre-procedure vitals */}
      <div className="space-y-2">
        <p className="text-sm font-medium">Signos vitales al inicio</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="space-y-1">
            <Label htmlFor="preWeightKg" className="text-xs">Peso (kg)</Label>
            <Input id="preWeightKg" name="preWeightKg" type="number" step="0.01" min="0" placeholder="0.00" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="preTemperature" className="text-xs">Temp. (&deg;C)</Label>
            <Input id="preTemperature" name="preTemperature" type="number" step="0.1" min="30" max="45" placeholder="38.5" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="preHeartRate" className="text-xs">FC (lpm)</Label>
            <Input id="preHeartRate" name="preHeartRate" type="number" step="1" min="0" placeholder="80" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="preRespiratoryRate" className="text-xs">FR (rpm)</Label>
            <Input id="preRespiratoryRate" name="preRespiratoryRate" type="number" step="1" min="0" placeholder="20" />
          </div>
        </div>
      </div>

      {/* Post-procedure vitals */}
      <div className="space-y-2">
        <p className="text-sm font-medium">Signos vitales al cierre</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="space-y-1">
            <Label htmlFor="postWeightKg" className="text-xs">Peso (kg)</Label>
            <Input id="postWeightKg" name="postWeightKg" type="number" step="0.01" min="0" placeholder="0.00" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="postTemperature" className="text-xs">Temp. (&deg;C)</Label>
            <Input id="postTemperature" name="postTemperature" type="number" step="0.1" min="30" max="45" placeholder="38.5" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="postHeartRate" className="text-xs">FC (lpm)</Label>
            <Input id="postHeartRate" name="postHeartRate" type="number" step="1" min="0" placeholder="80" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="postRespiratoryRate" className="text-xs">FR (rpm)</Label>
            <Input id="postRespiratoryRate" name="postRespiratoryRate" type="number" step="1" min="0" placeholder="20" />
          </div>
        </div>
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
        <Button type="submit" disabled={isPending || (!defaultPatientId && !selectedPatient)}>
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