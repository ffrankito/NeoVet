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
import { createAppointment, updateAppointment, createClientAndPatient, createPatientInline } from "@/app/dashboard/appointments/actions";
import type { Service } from "@/db/schema";
import { SearchableSelect } from "@/components/ui/searchable-select";

const NEW_CLIENT_VALUE = "__new__";
const NEW_PATIENT_VALUE = "__new__";

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
  const tz = "America/Argentina/Buenos_Aires";
  const d = new Date(date);
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(d);

  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "00";
  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}`;
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

  // Inline creation state
  const isNewClient = selectedClient === NEW_CLIENT_VALUE;
  const isNewPatient = selectedPatient === NEW_PATIENT_VALUE;
  const [newClientName, setNewClientName] = useState("");
  const [newClientPhone, setNewClientPhone] = useState("");
  const [newClientEmail, setNewClientEmail] = useState("");
  const [newPatientName, setNewPatientName] = useState("");
  const [newPatientSpecies, setNewPatientSpecies] = useState("perro");
  const [newPatientBreed, setNewPatientBreed] = useState("");
  const [newPatientSex, setNewPatientSex] = useState("macho");
  const [inlineErrors, setInlineErrors] = useState<Record<string, string>>({});

  const filteredPatients = isNewClient
    ? []
    : patients.filter((p) => p.clientId === selectedClient);

  const clientOptions = [
    { value: NEW_CLIENT_VALUE, label: "+ Nuevo cliente" },
    ...clients.map((c) => ({ value: c.id, label: c.name })),
  ];

  function handleClientChange(clientId: string) {
    setSelectedClient(clientId);
    setSelectedPatient("");
    setInlineErrors({});
    if (clientId !== NEW_CLIENT_VALUE) {
      setNewClientName("");
      setNewClientPhone("");
      setNewClientEmail("");
    }
  }

  function handlePatientChange(patientId: string) {
    setSelectedPatient(patientId);
    setInlineErrors({});
    if (patientId !== NEW_PATIENT_VALUE) {
      setNewPatientName("");
      setNewPatientSpecies("perro");
      setNewPatientBreed("");
      setNewPatientSex("macho");
    }
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
        setInlineErrors({});

        let patientId = selectedPatient;

        // Case 1: New client + new patient
        if (isNewClient) {
          const result = await createClientAndPatient({
            clientName: newClientName,
            clientPhone: newClientPhone,
            clientEmail: newClientEmail,
            patientName: newPatientName,
            patientSpecies: newPatientSpecies,
            patientBreed: newPatientBreed,
            patientSex: newPatientSex as "macho" | "hembra",
          });

          if ("errors" in result && result.errors) {
            const flat: Record<string, string> = {};
            for (const [key, msgs] of Object.entries(result.errors)) {
              if (Array.isArray(msgs) && msgs[0]) flat[key] = msgs[0];
            }
            setInlineErrors(flat);
            return { error: "Completá los datos del nuevo cliente/paciente." };
          }
          if ("error" in result && result.error) return { error: result.error };
          if ("patientId" in result && result.patientId) patientId = result.patientId;
        }
        // Case 2: Existing client + new patient
        else if (isNewPatient) {
          const result = await createPatientInline({
            clientId: selectedClient,
            patientName: newPatientName,
            patientSpecies: newPatientSpecies,
            patientBreed: newPatientBreed,
            patientSex: newPatientSex as "macho" | "hembra",
          });

          if ("errors" in result && result.errors) {
            const flat: Record<string, string> = {};
            for (const [key, msgs] of Object.entries(result.errors)) {
              if (Array.isArray(msgs) && msgs[0]) flat[key] = msgs[0];
            }
            setInlineErrors(flat);
            return { error: "Completá los datos de la nueva mascota." };
          }
          if ("error" in result && result.error) return { error: result.error };
          if ("patientId" in result && result.patientId) patientId = result.patientId;
        }

        formData.set("patientId", patientId);
        formData.set("appointmentType", appointmentType);
        formData.set("consultationType", consultationType);
        formData.set("serviceId", selectedServiceId);
        formData.set("sendReminders", sendReminders ? "true" : "false");
        return createAppointment(formData);
      };

  const [result, dispatch, isPending] = useActionState(action, undefined);

  const errors = getFieldErrors(result);
  const globalError = getGlobalError(result);

  // Whether to show inline patient creation fields
  const showNewPatientFields = isNewClient || isNewPatient;

  return (
    <form action={dispatch} className="max-w-lg space-y-6">
      {globalError && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {globalError}
        </div>
      )}

      {!isEdit && (
        <>
          {/* Client selection */}
          <div className="space-y-2">
            <Label>Cliente *</Label>
            <SearchableSelect
              options={clientOptions}
              value={selectedClient}
              onChange={handleClientChange}
              placeholder="Seleccioná un cliente"
              searchPlaceholder="Buscar cliente..."
              emptyMessage="No se encontró ningún cliente."
            />
          </div>

          {/* Inline new client fields */}
          {isNewClient && (
            <div className="space-y-4 rounded-lg border border-dashed border-primary/30 bg-primary/5 p-4">
              <p className="text-sm font-medium text-primary">Nuevo cliente</p>
              <div className="space-y-2">
                <Label htmlFor="newClientName">Nombre completo *</Label>
                <Input
                  id="newClientName"
                  value={newClientName}
                  onChange={(e) => setNewClientName(e.target.value)}
                  placeholder="Nombre del dueño"
                  aria-invalid={!!inlineErrors.clientName}
                />
                {inlineErrors.clientName && <p className="text-sm text-destructive">{inlineErrors.clientName}</p>}
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="newClientPhone">Teléfono *</Label>
                  <Input
                    id="newClientPhone"
                    type="tel"
                    value={newClientPhone}
                    onChange={(e) => setNewClientPhone(e.target.value)}
                    placeholder="341 310-1194"
                    aria-invalid={!!inlineErrors.clientPhone}
                  />
                  {inlineErrors.clientPhone && <p className="text-sm text-destructive">{inlineErrors.clientPhone}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newClientEmail">Email <span className="text-xs text-muted-foreground">(opcional)</span></Label>
                  <Input
                    id="newClientEmail"
                    type="email"
                    value={newClientEmail}
                    onChange={(e) => setNewClientEmail(e.target.value)}
                    placeholder="email@ejemplo.com"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Patient selection — only for existing clients */}
          {selectedClient !== "" && !isNewClient && (
            <div className="space-y-2">
              <Label>Paciente *</Label>
              {filteredPatients.length === 0 ? (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Este cliente no tiene pacientes.
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handlePatientChange(NEW_PATIENT_VALUE)}
                  >
                    + Nueva mascota
                  </Button>
                </div>
              ) : (
                <SearchableSelect
                  options={[
                    { value: NEW_PATIENT_VALUE, label: "+ Nueva mascota" },
                    ...filteredPatients.map((p) => ({
                      value: p.id,
                      label: p.name,
                      sublabel: p.species,
                    })),
                  ]}
                  value={selectedPatient}
                  onChange={handlePatientChange}
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

          {/* Inline new patient fields */}
          {showNewPatientFields && (
            <div className="space-y-4 rounded-lg border border-dashed border-primary/30 bg-primary/5 p-4">
              <p className="text-sm font-medium text-primary">Nueva mascota</p>
              <div className="space-y-2">
                <Label htmlFor="newPatientName">Nombre *</Label>
                <Input
                  id="newPatientName"
                  value={newPatientName}
                  onChange={(e) => setNewPatientName(e.target.value)}
                  placeholder="Nombre de la mascota"
                  aria-invalid={!!inlineErrors.patientName}
                />
                {inlineErrors.patientName && <p className="text-sm text-destructive">{inlineErrors.patientName}</p>}
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label>Especie *</Label>
                  <Select value={newPatientSpecies} onValueChange={(v) => v && setNewPatientSpecies(v)}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="perro" label="Perro">Perro</SelectItem>
                      <SelectItem value="gato" label="Gato">Gato</SelectItem>
                      <SelectItem value="otro" label="Otro">Otro</SelectItem>
                    </SelectContent>
                  </Select>
                  {inlineErrors.patientSpecies && <p className="text-sm text-destructive">{inlineErrors.patientSpecies}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPatientBreed">Raza</Label>
                  <Input
                    id="newPatientBreed"
                    value={newPatientBreed}
                    onChange={(e) => setNewPatientBreed(e.target.value)}
                    placeholder="Bulldog, etc."
                  />
                </div>
                <div className="space-y-2">
                  <Label>Sexo *</Label>
                  <Select value={newPatientSex} onValueChange={(v) => v && setNewPatientSex(v)}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="macho" label="Macho">Macho</SelectItem>
                      <SelectItem value="hembra" label="Hembra">Hembra</SelectItem>
                    </SelectContent>
                  </Select>
                  {inlineErrors.patientSex && <p className="text-sm text-destructive">{inlineErrors.patientSex}</p>}
                </div>
              </div>
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
