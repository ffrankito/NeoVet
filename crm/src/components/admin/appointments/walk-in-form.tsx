"use client";

import { useActionState, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { createWalkIn } from "@/app/dashboard/appointments/actions";

type ActionResult =
  | { error?: string; success?: boolean }
  | undefined;

interface WalkInFormProps {
  clients: Array<{ id: string; name: string }>;
  patients: Array<{ id: string; name: string; species: string; clientId: string; clientName: string }>;
  services: Array<{ id: string; name: string; category: string | null }>;
  defaultPatientId?: string;
}

export function WalkInForm({ clients, patients, services, defaultPatientId }: WalkInFormProps) {
  const defaultPatient = defaultPatientId ? patients.find((p) => p.id === defaultPatientId) : undefined;
  const [isOpen, setIsOpen] = useState(!!defaultPatientId);
  const [selectedClient, setSelectedClient] = useState(defaultPatient?.clientId ?? "");
  const [selectedPatient, setSelectedPatient] = useState(defaultPatientId ?? "");
  const [selectedService, setSelectedService] = useState("");

  const filteredPatients = patients.filter((p) => p.clientId === selectedClient);

  const action = async (_prev: ActionResult, formData: FormData) => {
    formData.set("patientId", selectedPatient);
    if (selectedService) formData.set("serviceId", selectedService);
    return createWalkIn(formData);
  };

  const [result, dispatch, isPending] = useActionState(action, undefined);

  // On success, reset form and close
  useEffect(() => {
    if (result?.success) {
      setSelectedClient("");
      setSelectedPatient("");
      setSelectedService("");
      setIsOpen(false);
    }
  }, [result]);

  if (!isOpen) {
    return (
      <Button variant="outline" onClick={() => setIsOpen(true)}>
        + Agregar a sala de espera
      </Button>
    );
  }

  const error = result && "error" in result ? result.error : null;

  return (
    <div className="rounded-lg border bg-muted/30 p-4 space-y-4">
      <h3 className="text-sm font-semibold">Agregar paciente a sala de espera</h3>

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <form action={dispatch} className="space-y-4">
        {/* Client selector */}
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

        {/* Patient selector — only show when client selected */}
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
                  sublabel: p.clientName,
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

        {/* Service selector — optional */}
        <div className="space-y-2">
          <Label>Servicio</Label>
          <SearchableSelect
            options={services.map((s) => ({ value: s.id, label: s.name }))}
            value={selectedService}
            onChange={setSelectedService}
            placeholder="Seleccionar servicio (opcional)"
            searchPlaceholder="Buscar servicio..."
            emptyMessage="No se encontró ningún servicio."
          />
        </div>

        {/* Reason — optional */}
        <div className="space-y-2">
          <Label htmlFor="walkInReason">Motivo</Label>
          <Input
            id="walkInReason"
            name="reason"
            placeholder="Motivo de consulta..."
          />
        </div>

        {/* Urgent checkbox */}
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" name="isUrgent" className="rounded" />
          <span className="text-sm font-medium text-red-600">Urgente</span>
        </label>

        {/* Buttons */}
        <div className="flex gap-3">
          <Button type="submit" disabled={isPending || !selectedPatient}>
            {isPending ? "Agregando..." : "Agregar"}
          </Button>
          <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
            Cancelar
          </Button>
        </div>
      </form>
    </div>
  );
}
