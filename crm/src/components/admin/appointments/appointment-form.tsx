"use client";

import { useState } from "react";
import { buttonVariants } from "@/components/ui/button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createAppointment, updateAppointment } from "@/app/dashboard/appointments/actions";

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

export function AppointmentForm({ appointment, patients, defaultPatientId }: AppointmentFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(appointment?.patientId ?? defaultPatientId ?? "");
  const [status, setStatus] = useState(appointment?.status ?? "pending");
  const isEdit = !!appointment;

  function formatDateTimeLocal(date: Date): string {
    const d = new Date(date);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    if (!isEdit) formData.set("patientId", selectedPatient);
    if (isEdit) formData.set("status", status);
    const result = isEdit
      ? await updateAppointment(appointment!.id, formData)
      : await createAppointment(formData);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  return (
    <form action={handleSubmit} className="max-w-lg space-y-6">
      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {!isEdit && (
        <div className="space-y-2">
          <Label>Paciente *</Label>
          <Select value={selectedPatient} onValueChange={(v) => v && setSelectedPatient(v)} required>
            <SelectTrigger className="w-full">
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
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="scheduledAt">Fecha y hora *</Label>
        <Input
          id="scheduledAt"
          name="scheduledAt"
          type="datetime-local"
          required
          defaultValue={appointment ? formatDateTimeLocal(appointment.scheduledAt) : ""}
        />
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
        />
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
        <Button disabled={loading}>
          {loading
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
