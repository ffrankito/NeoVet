"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { buttonVariants } from "@/components/ui/button";
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
import { createAppointment, updateAppointment } from "@/app/dashboard/appointments/actions";
import type { Service } from "@/db/schema";
import { SearchableSelect } from "@/components/ui/searchable-select";

type FieldErrors = {
  patientId?: string;
  scheduledAt?: string;
  durationMinutes?: string;
  status?: string;
  appointmentType?: string;
  consultationType?: string;
  serviceId?: string;
  sendReminders?: string;
  reason?: string;
  staffNotes?: string;
};

type ActionResult =
  | { errors: FieldErrors; error?: never }
  | { error: string; errors?: never }
  | undefined;

function getFieldErrors(result: ActionResult): FieldErrors {
  if (result && "errors" in result) return result.errors ?? {};
  return {};
}

function getGlobalError(result: ActionResult): string | null {
  if (result && "error" in result) return result.error ?? null;
  return null;
}

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

interface AppointmentData {
  id: string;
  scheduledAt: Date;
  durationMinutes: number;
  reason: string | null;
  staffNotes: string | null;
  status: string;
  patientId: string;
  appointmentType: string;
  consultationType: string | null;
  serviceId?: string | null;
  sendReminders?: boolean;
}

interface AppointmentFormProps {
  appointment?: AppointmentData;
  patients: PatientOption[];
  clients?: ClientOption[];
  services?: Service[];
  defaultPatientId?: string;
  defaultScheduledAt?: string;
}

function formatDateTimeLocal(date: Date): string {
  const d = new Date(date);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function AppointmentForm({
  appointment,
  patients,
  clients = [],
  services = [],
  defaultPatientId,
  defaultScheduledAt,
}: AppointmentFormProps) {
  const isEdit = !!appointment;

  const defaultClientId = defaultPatientId
    ? (patients.find((p) => p.id === defaultPatientId)?.clientId ?? "")
    : "";

  const [selectedPatient, setSelectedPatient] = useState(
    appointment?.patientId ?? defaultPatientId ?? ""
  );
  const [selectedClient, setSelectedClient] = useState(defaultClientId);
  const [status, setStatus] = useState(appointment?.status ?? "confirmed");
  const [appointmentType, setAppointmentType] = useState(
    appointment?.appointmentType ?? "veterinary"
  );
  const [consultationType, setConsultationType] = useState(
    appointment?.consultationType ?? "clinica"
  );
  const [selectedServiceId, setSelectedServiceId] = useState<string>(
    appointment?.serviceId ?? ""
  );
  const [durationMinutes, setDurationMinutes] = useState(
    appointment?.durationMinutes ?? 30
  );
  const [sendReminders, setSendReminders] = useState(
    appointment?.sendReminders ?? true
  );

  const filteredPatients = patients.filter((p) => p.clientId === selectedClient);

  function handleClientChange(clientId: string) {
    setSelectedClient(clientId);
    setSelectedPatient("");
  }

  function handleServiceChange(serviceId: string) {
    setSelectedServiceId(serviceId);
    const service = services.find((s) => s.id === serviceId);
    if (service) {
      setDurationMinutes(service.defaultDurationMinutes);
      if (service.category === "peluqueria") {
        setAppointmentType("grooming");
        setConsultationType("clinica");
      } else {
        setAppointmentType("veterinary");
      }
    }
  }

  const action = isEdit
    ? async (_prev: ActionResult, formData: FormData) => {
        formData.set("status", status);
        formData.set("appointmentType", appointmentType);
        formData.set("consultationType", consultationType);
        formData.set("serviceId", selectedServiceId);
        formData.set("sendReminders", sendReminders ? "true" : "false");
        return updateAppointment(appointment.id, formData);
      }
    : async (_prev: ActionResult, formData: FormData) => {
        formData.set("patientId", selectedPatient);
        formData.set("appointmentType", appointmentType);
        formData.set("consultationType", consultationType);
        formData.set("serviceId", selectedServiceId);
        formData.set("sendReminders", sendReminders ? "true" : "false");
        return createAppointment(formData);
      };

  const [result, dispatch, isPending] = useActionState(action, undefined);

  const errors = getFieldErrors(result);
  const globalError = getGlobalError(result);

  return (
    <form action={dispatch} className="max-w-lg space-y-6">
      {globalError && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {globalError}
        </div>
      )}

      {!isEdit && (
        <>
          <div className="space-y-2">
            <Label>Cliente *</Label>
            <SearchableSelect
              options={clients.map((c) => ({ value: c.id, label: c.name }))}
              value={selectedClient}
              onChange={handleClientChange}
              placeholder="Seleccioná un cliente"
              searchPlaceholder="Buscar cliente..."
              emptyMessage="No se encontró ningún cliente."
            />
          </div>

          {selectedClient !== "" && (
            <div className="space-y-2">
              <Label>Paciente *</Label>
              {filteredPatients.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Este cliente no tiene pacientes.{" "}
                  <Link href="/dashboard/patients/new" className="underline">
                    Creá uno primero.
                  </Link>
                </p>
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
              {errors.patientId && (
                <p className="mt-1 text-sm text-destructive">{errors.patientId}</p>
              )}
            </div>
          )}
        </>
      )}

      {services.length > 0 && (
        <div className="space-y-2">
          <Label>Servicio</Label>
          <Select
            value={selectedServiceId}
            onValueChange={(v) => v && handleServiceChange(v)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Seleccioná un servicio (opcional)" />
            </SelectTrigger>
            <SelectContent>
              {services.map((s) => (
                <SelectItem key={s.id} value={s.id} label={s.name}>
                  {s.name} — {s.defaultDurationMinutes} min
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedServiceId && (
            <p className="text-xs text-muted-foreground">
              Duración y tipo de turno precargados desde el servicio.
            </p>
          )}
        </div>
      )}

      {!selectedServiceId && (
        <div className="space-y-2">
          <Label>Tipo de turno</Label>
          <Select
            value={appointmentType}
            onValueChange={(v) => {
              if (!v) return;
              setAppointmentType(v);
              if (v === "grooming") setConsultationType("clinica");
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="veterinary" label="Veterinario">Veterinario</SelectItem>
              <SelectItem value="grooming" label="Peluquería">Peluquería</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {appointmentType === "veterinary" && (
        <div className="space-y-2">
          <Label>Modalidad</Label>
          <Select
            value={consultationType}
            onValueChange={(v) => v && setConsultationType(v)}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="clinica" label="En clínica">En clínica</SelectItem>
              <SelectItem value="virtual" label="Virtual">Virtual</SelectItem>
              <SelectItem value="domicilio" label="A domicilio">A domicilio</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="scheduledAt">Fecha y hora *</Label>
        <Input
          id="scheduledAt"
          name="scheduledAt"
          type="datetime-local"
          defaultValue={
            appointment
              ? formatDateTimeLocal(appointment.scheduledAt)
              : (defaultScheduledAt ?? "")
          }
          aria-invalid={!!errors.scheduledAt}
        />
        {errors.scheduledAt && (
          <p className="mt-1 text-sm text-destructive">{errors.scheduledAt}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="durationMinutes">Duración (minutos)</Label>
        <Input
          id="durationMinutes"
          name="durationMinutes"
          type="number"
          min={5}
          max={480}
          value={durationMinutes}
          onChange={(e) => setDurationMinutes(Math.max(5, Number(e.target.value) || 5))}
          aria-invalid={!!errors.durationMinutes}
        />
        {errors.durationMinutes && (
          <p className="mt-1 text-sm text-destructive">{errors.durationMinutes}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="sendReminders">Recordatorios automáticos</Label>
        <div className="flex items-center gap-3 rounded-lg border px-3 py-3">
          <input
            id="sendReminders"
            name="sendReminders"
            type="checkbox"
            checked={sendReminders}
            onChange={(e) => setSendReminders(e.target.checked)}
            className="h-4 w-4 rounded border-input"
          />
          <div className="space-y-1">
            <p className="text-sm font-medium leading-none">
              Enviar recordatorios por email
            </p>
            <p className="text-xs text-muted-foreground">
              Si está activado, este turno recibirá recordatorios automáticos por email.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="reason">Motivo</Label>
        <Input
          id="reason"
          name="reason"
          defaultValue={appointment?.reason ?? ""}
          placeholder="Consulta general, vacunación, etc."
        />
      </div>

      {isEdit && (
        <div className="space-y-2">
          <Label>Estado</Label>
          <Select value={status} onValueChange={(v) => v && setStatus(v)}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending" label="Pendiente">Pendiente</SelectItem>
              <SelectItem value="confirmed" label="Confirmado">Confirmado</SelectItem>
              <SelectItem value="completed" label="Completado">Completado</SelectItem>
              <SelectItem value="cancelled" label="Cancelado">Cancelado</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="staffNotes">Notas del staff</Label>
        <Textarea
          id="staffNotes"
          name="staffNotes"
          defaultValue={appointment?.staffNotes ?? ""}
          placeholder="Notas internas..."
          rows={3}
        />
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending
            ? isEdit ? "Guardando..." : "Creando..."
            : isEdit ? "Guardar cambios" : "Crear turno"}
        </Button>
        <Link
          href={isEdit ? `/dashboard/appointments/${appointment.id}` : "/dashboard/appointments"}
          className={buttonVariants({ variant: "outline" })}
        >
          Cancelar
        </Link>
      </div>
    </form>
  );
}