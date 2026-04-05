import Link from "next/link";
import { notFound } from "next/navigation";
import { getAppointment, updateAppointmentStatus, getAllStaffForSelect, getPatientMiniSummary } from "../actions";
import { getRole } from "@/lib/auth";
import { formatART } from "@/lib/timezone";
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
  no_show: "No se presentó",
};

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
  no_show: "bg-orange-100 text-orange-800",
};

const typeLabels: Record<string, string> = {
  veterinary: "Veterinario",
  grooming: "Peluquería",
};

const typeColors: Record<string, string> = {
  veterinary: "bg-violet-100 text-violet-800",
  grooming: "bg-pink-100 text-pink-800",
};

const consultationTypeLabels: Record<string, string> = {
  clinica: "En clínica",
  virtual: "Virtual",
  domicilio: "A domicilio",
};

export default async function AppointmentDetailPage({ params }: Props) {
  const { id } = await params;
  const [apt, role] = await Promise.all([getAppointment(id), getRole()]);

  if (!apt) notFound();

  const isAdmin = role === "admin" || role === "owner";
  const [allStaff, patientSummary] = await Promise.all([
    isAdmin ? getAllStaffForSelect() : Promise.resolve([]),
    getPatientMiniSummary(apt.patientId),
  ]);

  const nextStatuses: Record<string, { value: string; label: string }[]> = {
    confirmed: [
      { value: "completed", label: "Completar" },
    ],
    completed: [],
    cancelled: [],
    no_show: [],
  };

  const actions = nextStatuses[apt.status] ?? [];
  const showNoShow = apt.status === "confirmed" && new Date(apt.scheduledAt) < new Date();


  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Turno —{" "}
            {formatART(apt.scheduledAt, {
              dateStyle: "long",
              timeStyle: "short",
            })}
          </h1>
          <p className="mt-1 text-muted-foreground">
            {apt.patientName} ({apt.patientSpecies}) — dueño:{" "}
            <Link
              href={`/dashboard/clients/${apt.clientId}`}
              className="text-primary hover:underline"
            >
              {apt.clientName}
            </Link>
          </p>
        </div>

        {isAdmin && (
          <Link
            href={`/dashboard/appointments/${id}/edit`}
            className={buttonVariants({ variant: "outline" })}
          >
            Editar
          </Link>
        )}
      </div>

      <Separator />

      <div className="grid gap-6 sm:grid-cols-4">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Estado</p>
          <span
            className={`mt-1 inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[apt.status] ?? ""}`}
          >
            {statusLabels[apt.status] ?? apt.status}
          </span>
        </div>

        <div>
          <p className="text-sm font-medium text-muted-foreground">Tipo</p>
          <span
            className={`mt-1 inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${typeColors[apt.appointmentType] ?? ""}`}
          >
            {typeLabels[apt.appointmentType] ?? apt.appointmentType}
          </span>
        </div>

        {apt.appointmentType === "veterinary" && apt.consultationType && (
          <div>
            <p className="text-sm font-medium text-muted-foreground">Modalidad</p>
            <p className="mt-1">
              {consultationTypeLabels[apt.consultationType] ?? apt.consultationType}
            </p>
          </div>
        )}

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
              appointmentType={apt.appointmentType}
              allStaff={allStaff}
            />
          ) : (
            <p className="mt-1">{apt.assignedStaffName ?? "—"}</p>
          )}
        </div>
      </div>

      {/* Patient mini-summary */}
      <div className="rounded-lg border bg-muted/30 p-4 space-y-2">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold">Resumen del paciente</h3>
          {patientSummary.isBrachycephalic && (
            <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
              Braquicéfalo
            </span>
          )}
          {patientSummary.isDeceased && (
            <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800">
              Fallecido
            </span>
          )}
        </div>

        {patientSummary.lastConsultation ? (
          <p className="text-sm text-muted-foreground">
            <strong>Última consulta:</strong>{" "}
            {new Date(patientSummary.lastConsultation.createdAt).toLocaleDateString("es-AR")}
            {patientSummary.lastConsultation.assessment && (
              <> — {patientSummary.lastConsultation.assessment.slice(0, 120)}{patientSummary.lastConsultation.assessment.length > 120 ? "..." : ""}</>
            )}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">Sin consultas previas.</p>
        )}

        {patientSummary.overdueVaccines.length > 0 && (
          <p className="text-sm text-red-600">
            <strong>Vacunas vencidas:</strong>{" "}
            {patientSummary.overdueVaccines.map((v) => v.name).join(", ")}
          </p>
        )}

        <Link
          href={`/dashboard/patients/${apt.patientId}`}
          className="text-xs text-primary hover:underline"
        >
          Ver historial completo →
        </Link>
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

      {apt.cancellationReason && (
        <>
          <Separator />
          <div>
            <p className="text-sm font-medium text-muted-foreground">Motivo de cancelación</p>
            <p className="mt-1 whitespace-pre-wrap">{apt.cancellationReason}</p>
          </div>
        </>
      )}

      {(actions.length > 0 || apt.status === "confirmed") && (
        <>
          <Separator />
          <div className="space-y-3">
            <p className="text-sm font-medium text-muted-foreground">Cambiar estado</p>
            <div className="flex gap-2">
              {actions.map((action) => (
                <form
                  key={action.value}
                  action={async () => {
                    "use server";
                    await updateAppointmentStatus(
                      id,
                      action.value as "pending" | "confirmed" | "cancelled" | "completed" | "no_show"
                    );
                  }}
                >
                  <Button variant="outline">{action.label}</Button>
                </form>
              ))}
              {showNoShow && (
                <form
                  action={async () => {
                    "use server";
                    await updateAppointmentStatus(id, "no_show");
                  }}
                >
                  <Button variant="outline" className="text-orange-700 border-orange-300 hover:bg-orange-50">
                    No se presentó
                  </Button>
                </form>
              )}
              {apt.status === "confirmed" && (
                <CancelAppointmentButton appointmentId={id} />
              )}
            </div>
          </div>
        </>
      )}

      {apt.status === "completed" && apt.appointmentType !== "grooming" && (
        <>
          <Separator />
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Historia clínica</h2>

              {apt.consultationId ? (
                <Link
                  href={`/dashboard/consultations/${apt.consultationId}/edit`}
                  className={buttonVariants({ variant: "outline", size: "sm" })}
                >
                  Editar consulta
                </Link>
              ) : (
                <Link
                  href={`/dashboard/consultations/new?patientId=${apt.patientId}&appointmentId=${id}`}
                  className={buttonVariants({ size: "sm" })}
                >
                  + Registrar consulta
                </Link>
              )}
            </div>

            {apt.consultationId ? (
              <div className="space-y-6 rounded-lg border p-4">
                {(apt.consultationWeightKg ||
                  apt.consultationTemperature ||
                  apt.consultationHeartRate ||
                  apt.consultationRespRate) && (
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

      {apt.status === "completed" && apt.appointmentType === "grooming" && (
        <>
          <Separator />
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Sesión de peluquería</h2>
              <Link
                href={`/dashboard/patients/${apt.patientId}/grooming/new?appointmentId=${id}`}
                className={buttonVariants({ size: "sm" })}
              >
                + Registrar sesión
              </Link>
            </div>

            <div className="rounded-lg border border-dashed py-6 text-center text-sm text-muted-foreground">
              Registrá los detalles de la sesión desde el perfil del paciente.
            </div>
          </div>
        </>
      )}

      <Link
        href="/dashboard/appointments"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        ← Volver a turnos
      </Link>
    </div>
  );
}