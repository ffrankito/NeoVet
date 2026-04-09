"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createHospitalization } from "@/app/dashboard/hospitalizations/actions";
import { SearchableSelect } from "@/components/ui/searchable-select";

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

interface AdmissionFormProps {
  patientId?: string;
  consultationId?: string;
  clients?: ClientOption[];
  patients?: PatientOption[];
}

export function AdmissionForm({
  patientId: defaultPatientId = "",
  consultationId,
  clients = [],
  patients = [],
}: AdmissionFormProps) {
  const [selectedClient, setSelectedClient] = useState("");
  const [selectedPatient, setSelectedPatient] = useState(defaultPatientId);

  const filteredPatients = patients.filter((p) => p.clientId === selectedClient);

  const action = async (_prev: ActionResult, formData: FormData) => {
    formData.set("patientId", selectedPatient || defaultPatientId);
    return createHospitalization(formData);
  };

  const [result, dispatch, isPending] = useActionState(action, undefined);
  const error = result && "error" in result ? result.error : null;

  return (
    <form action={dispatch} className="max-w-xl space-y-4">
      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {!defaultPatientId && (
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
        <Button type="submit" disabled={isPending || (!defaultPatientId && !selectedPatient)}>
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