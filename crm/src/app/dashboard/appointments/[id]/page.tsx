import { notFound } from "next/navigation";
import { getAppointment, updateAppointmentStatus, getAllStaffForSelect, assignStaffToAppointment } from "../actions";
import { getRole } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button-variants";
import { Separator } from "@/components/ui/separator";
import { CancelAppointmentButton } from "@/components/admin/appointments/cancel-appointment-button";
import { AssignStaffSelect } from "@/components/admin/appointments/assign-staff-select";

interface Props {
  params: Promise<{ id: string }>;
}

const statusLabels: Record<string, string> = {
  pending: "Pendiente",
  confirmed: "Confirmado",
  completed: "Completado",
  cancelled: "Cancelado",
};

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

const typeLabels: Record<string, string> = {
  veterinary: "Veterinario",
  grooming: "Peluquería",
};

const typeColors: Record<string, string> = {
  veterinary: "bg-violet-100 text-violet-800",
  grooming: "bg-pink-100 text-pink-800",
};

export default async function AppointmentDetailPage({ params }: Props) {
  const { id } = await params;
  const [apt, role] = await Promise.all([getAppointment(id), getRole()]);

  if (!apt) notFound();

  const isAdmin = role === "admin";
  const allStaff = isAdmin ? await getAllStaffForSelect() : [];

  const nextStatuses: Record<string, { value: string; label: string }[]> = {
    pending: [
      { value: "confirmed", label: "Confirmar" },
      { value: "cancelled", label: "Cancelar" },
    ],
    confirmed: [
      { value: "completed", label: "Completar" },
      { value: "cancelled", label: "Cancelar" },
    ],
    completed: [],
    cancelled: [],
  };

  const actions = nextStatuses[apt.status] ?? [];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Turno — {new Date(apt.scheduledAt).toLocaleString("es-AR", {
              dateStyle: "long",
              timeStyle: "short",
            })}
          </h1>
          <p className="mt-1 text-muted-foreground">
            {apt.patientName} ({apt.patientSpecies}) — dueño:{" "}
            <a href={`/dashboard/clients/${apt.clientId}`} className="text-primary hover:underline">
              {apt.clientName}
            </a>
          </p>
        </div>
        {isAdmin && (
          <a
            href={`/dashboard/appointments/${id}/edit`}
            className={buttonVariants({ variant: "outline" })}
          >
            Editar
          </a>
        )}
      </div>

      <Separator />

      {/* Info grid */}
      <div className="grid gap-6 sm:grid-cols-4">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Estado</p>
          <span className={`mt-1 inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[apt.status] ?? ""}`}>
            {statusLabels[apt.status] ?? apt.status}
          </span>
        </div>
        <div>
          <p className="text-sm font-medium text-muted-foreground">Tipo</p>
          <span className={`mt-1 inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${typeColors[apt.appointmentType] ?? ""}`}>
            {typeLabels[apt.appointmentType] ?? apt.appointmentType}
          </span>
        </div>
        <div>
          <p className="text-sm font-medium text-muted-foreground">Duración</p>
          <p className="mt-1">{apt.durationMinutes} minutos</p>
        </div>
        <div>
          <p className="text-sm font-medium text-muted-foreground">Motivo</p>
          <p className="mt-1">{apt.reason ?? "—"}</p>
        </div>
        <div>
          <p className="text-sm font-medium text-muted-foreground">Teléfono dueño</p>
          <p className="mt-1">{apt.clientPhone}</p>
        </div>
        <div>
          <p className="text-sm font-medium text-muted-foreground">Profesional asignado</p>
          {isAdmin ? (
            <AssignStaffSelect
              appointmentId={id}
              currentStaffId={apt.assignedStaffId ?? null}
              currentStaffName={apt.assignedStaffName ?? null}
              allStaff={allStaff}
            />
          ) : (
            <p className="mt-1">{apt.assignedStaffName ?? "—"}</p>
          )}
        </div>
      </div>

      {apt.staffNotes && (
        <>
          <Separator />
          <div>
            <p className="text-sm font-medium text-muted-foreground">Notas del staff</p>
            <p className="mt-1 whitespace-pre-wrap">{apt.staffNotes}</p>
          </div>
        </>
      )}

      {/* Status actions */}
      {actions.length > 0 && (
        <>
          <Separator />
          <div className="space-y-3">
            <p className="text-sm font-medium text-muted-foreground">Cambiar estado</p>
            <div className="flex gap-2">
              {actions.map((action) => {
                if (action.value === "cancelled") {
                  return <CancelAppointmentButton key="cancel" appointmentId={id} />;
                }
                return (
                  <form
                    key={action.value}
                    action={async () => {
                      "use server";
                      await updateAppointmentStatus(
                        id,
                        action.value as "pending" | "confirmed" | "cancelled" | "completed"
                      );
                    }}
                  >
                    <Button variant="outline">{action.label}</Button>
                  </form>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* Consultation — only for completed veterinary appointments */}
      {apt.status === "completed" && apt.appointmentType !== "grooming" && (
        <>
          <Separator />
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Historia clínica</h2>
              {apt.consultationId ? (
                <a
                  href={`/dashboard/consultations/${apt.consultationId}/edit`}
                  className={buttonVariants({ variant: "outline", size: "sm" })}
                >
                  Editar consulta
                </a>
              ) : (
                <a
                  href={`/dashboard/consultations/new?patientId=${apt.patientId}&appointmentId=${id}`}
                  className={buttonVariants({ size: "sm" })}
                >
                  + Registrar consulta
                </a>
              )}
            </div>

            {apt.consultationId ? (
              <div className="space-y-6 rounded-lg border p-4">
                {/* Vitals */}
                {(apt.consultationWeightKg || apt.consultationTemperature || apt.consultationHeartRate || apt.consultationRespRate) && (
                  <div className="grid gap-4 sm:grid-cols-4">
                    {apt.consultationWeightKg && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground">Peso</p>
                        <p className="mt-0.5 text-sm">{apt.consultationWeightKg} kg</p>
                      </div>
                    )}
                    {apt.consultationTemperature && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground">Temperatura</p>
                        <p className="mt-0.5 text-sm">{apt.consultationTemperature} °C</p>
                      </div>
                    )}
                    {apt.consultationHeartRate && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground">FC</p>
                        <p className="mt-0.5 text-sm">{apt.consultationHeartRate} lpm</p>
                      </div>
                    )}
                    {apt.consultationRespRate && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground">FR</p>
                        <p className="mt-0.5 text-sm">{apt.consultationRespRate} rpm</p>
                      </div>
                    )}
                  </div>
                )}

                {/* SOAP */}
                {[
                  { label: "Subjetivo", value: apt.consultationSubjective },
                  { label: "Objetivo", value: apt.consultationObjective },
                  { label: "Diagnóstico", value: apt.consultationAssessment },
                  { label: "Plan", value: apt.consultationPlan },
                  { label: "Notas", value: apt.consultationNotes },
                ]
                  .filter((f) => f.value)
                  .map((f) => (
                    <div key={f.label}>
                      <p className="text-sm font-semibold">{f.label}</p>
                      <p className="mt-0.5 whitespace-pre-wrap text-sm">{f.value}</p>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed py-6 text-center text-sm text-muted-foreground">
                No hay consulta registrada para este turno.
              </div>
            )}
          </div>
        </>
      )}

      {/* Grooming session — only for completed grooming appointments */}
      {apt.status === "completed" && apt.appointmentType === "grooming" && (
        <>
          <Separator />
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Sesión de peluquería</h2>
              <a
                href={`/dashboard/patients/${apt.patientId}/grooming/new?appointmentId=${id}`}
                className={buttonVariants({ size: "sm" })}
              >
                + Registrar sesión
              </a>
            </div>
            <div className="rounded-lg border border-dashed py-6 text-center text-sm text-muted-foreground">
              Registrá los detalles de la sesión desde el perfil del paciente.
            </div>
          </div>
        </>
      )}

      {/* Back link */}
      <a
        href="/dashboard/appointments"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        ← Volver a turnos
      </a>
    </div>
  );
}
