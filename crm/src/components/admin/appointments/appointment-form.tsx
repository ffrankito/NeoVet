"use client";

import { useActionState, useState } from "react";
import { buttonVariants } from "@/components/ui/button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createAppointment, updateAppointment } from "@/app/dashboard/appointments/actions";

type FieldErrors = { patientId?: string; scheduledAt?: string; durationMinutes?: string };
type ActionResult =
  | { errors: FieldErrors }
  | { error: string }
  | undefined;

function getFieldErrors(result: ActionResult): FieldErrors {
  if (result && "errors" in result) return result.errors;
  return {};
}

function getGlobalError(result: ActionResult): string | null {
  if (result && "error" in result) return result.error;
  return null;
}

interface PatientOption {
  id: string;
  name: string;
  species: string;
  clientName: string;
}

interface AppointmentData {
  id: string;
  scheduledAt: Date;
  durationMinutes: number;
  reason: string | null;
  staffNotes: string | null;
  status: string;
  patientId: string;
}

interface AppointmentFormProps {
  appointment?: AppointmentData;
  patients: PatientOption[];
  defaultPatientId?: string;
}

function formatDateTimeLocal(date: Date): string {
  const d = new Date(date);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function AppointmentForm({ appointment, patients, defaultPatientId }: AppointmentFormProps) {
  const isEdit = !!appointment;
  const [selectedPatient, setSelectedPatient] = useState(appointment?.patientId ?? defaultPatientId ?? "");
  const [status, setStatus] = useState(appointment?.status ?? "pending");

  const action = isEdit
    ? async (_prev: ActionResult, formData: FormData) => {
        formData.set("status", status);
        return updateAppointment(appointment!.id, formData);
      }
    : async (_prev: ActionResult, formData: FormData) => {
        formData.set("patientId", selectedPatient);
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
        <div className="space-y-2">
          <Label>Paciente *</Label>
          <Select value={selectedPatient} onValueChange={(v) => v && setSelectedPatient(v)}>
            <SelectTrigger className="w-full" aria-invalid={!!errors.patientId}>
              <SelectValue placeholder="Seleccioná un paciente" />
            </SelectTrigger>
            <SelectContent>
              {patients.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name} ({p.species}) — {p.clientName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.patientId && (
            <p className="text-sm text-destructive mt-1">{errors.patientId}</p>
          )}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="scheduledAt">Fecha y hora *</Label>
        <Input
          id="scheduledAt"
          name="scheduledAt"
          type="datetime-local"
          defaultValue={appointment ? formatDateTimeLocal(appointment.scheduledAt) : ""}
          aria-invalid={!!errors.scheduledAt}
        />
        {errors.scheduledAt && (
          <p className="text-sm text-destructive mt-1">{errors.scheduledAt}</p>
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
          defaultValue={appointment?.durationMinutes ?? 30}
          aria-invalid={!!errors.durationMinutes}
        />
        {errors.durationMinutes && (
          <p className="text-sm text-destructive mt-1">{errors.durationMinutes}</p>
        )}
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
              <SelectItem value="pending">Pendiente</SelectItem>
              <SelectItem value="confirmed">Confirmado</SelectItem>
              <SelectItem value="completed">Completado</SelectItem>
              <SelectItem value="cancelled">Cancelado</SelectItem>
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
        <Button disabled={isPending}>
          {isPending
            ? isEdit ? "Guardando..." : "Creando..."
            : isEdit ? "Guardar cambios" : "Crear turno"}
        </Button>
        <a
          href={isEdit ? `/dashboard/appointments/${appointment!.id}` : "/dashboard/appointments"}
          className={buttonVariants({ variant: "outline" })}
        >
          Cancelar
        </a>
      </div>
    </form>
  );
}
