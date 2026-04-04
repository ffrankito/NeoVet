import { notFound } from "next/navigation";
import { getPatient } from "../actions";
import { getConsultationsByPatient } from "@/app/dashboard/consultations/actions";
import { getVaccinationsByPatient } from "@/app/dashboard/patients/vaccination-actions";
import { getDewormingByPatient } from "@/app/dashboard/patients/deworming-actions";
import { getDocumentsByPatient } from "@/app/dashboard/patients/document-actions";
import { getGroomingProfile, getGroomingSessions } from "@/app/dashboard/grooming/actions";
import { db } from "@/db";
import { appointments } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { getRole } from "@/lib/auth";
import { buttonVariants } from "@/components/ui/button-variants";
import { DeletePatientButton } from "@/components/admin/patients/delete-patient-button";
import { VaccinationSection } from "@/components/admin/patients/vaccination-section";
import { DewormingSection } from "@/components/admin/patients/deworming-section";
import { DocumentSection } from "@/components/admin/patients/document-section";
import { GroomingSection } from "@/components/admin/patients/grooming-section";
import { TabNav } from "@/components/admin/patients/tab-nav";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type TabValue = "informacion" | "historia" | "vacunas" | "desparasitaciones" | "documentos" | "peluqueria";

const VALID_TABS: TabValue[] = [
  "informacion",
  "historia",
  "vacunas",
  "desparasitaciones",
  "documentos",
  "peluqueria",
];

function resolveTab(raw: string | undefined): TabValue {
  if (raw && (VALID_TABS as string[]).includes(raw)) {
    return raw as TabValue;
  }
  return "informacion";
}

interface Props {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}

export default async function PatientDetailPage({ params, searchParams }: Props) {
  const { id } = await params;
  const { tab: rawTab } = await searchParams;
  const activeTab = resolveTab(rawTab);

  const role = await getRole();

  // Check if patient has any grooming appointments (determines tab visibility)
  const [groomingAptCheck] = await db
    .select({ id: appointments.id })
    .from(appointments)
    .where(and(eq(appointments.patientId, id), eq(appointments.appointmentType, "grooming")))
    .limit(1);

  const hasGroomingHistory = !!groomingAptCheck;
  const showGrooming = hasGroomingHistory && (role === "admin" || role === "owner" || role === "groomer");

  const [patient, consultationHistory, vaccinationHistory, dewormingHistory, documentHistory] =
    await Promise.all([
      getPatient(id),
      getConsultationsByPatient(id),
      getVaccinationsByPatient(id),
      getDewormingByPatient(id),
      getDocumentsByPatient(id),
    ]);

  if (!patient) notFound();

  // Fetch grooming data only if the tab is active and visible
  const [groomingProfile, groomingSessions] =
    activeTab === "peluqueria" && showGrooming
      ? await Promise.all([getGroomingProfile(id), getGroomingSessions(id)])
      : [null, []];

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    confirmed: "bg-blue-100 text-blue-800",
    completed: "bg-green-100 text-green-800",
    cancelled: "bg-red-100 text-red-800",
  };

  const statusLabels: Record<string, string> = {
    pending: "Pendiente",
    confirmed: "Confirmado",
    completed: "Completado",
    cancelled: "Cancelado",
  };

  return (
    <div className="space-y-6">
      {/* Header — always visible */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          {patient.avatarUrl ? (
            <img
              src={patient.avatarUrl}
              alt={patient.name}
              className="size-16 rounded-full object-cover shrink-0"
            />
          ) : (
            <div className="size-16 rounded-full bg-muted flex items-center justify-center shrink-0">
              <span className="text-xl font-semibold text-muted-foreground">
                {patient.name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">{patient.name}</h1>
              {patient.deceased && (
                <Badge variant="destructive">Fallecido</Badge>
              )}
            </div>
            <p className="mt-1 text-muted-foreground">
              Mascota de{" "}
              <a
                href={`/dashboard/clients/${patient.clientId}`}
                className="text-primary hover:underline"
              >
                {patient.client?.name}
              </a>
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <a
            href={`/dashboard/patients/${id}/edit`}
            className={buttonVariants({ variant: "outline" })}
          >
            Editar
          </a>
          <DeletePatientButton patientId={id} />
        </div>
      </div>

      <Separator />

      {/* Tab navigation */}
      <TabNav activeTab={activeTab} patientId={id} showGrooming={showGrooming} />

      {/* Tab: Información */}
      {activeTab === "informacion" && (
        <div className="space-y-8">
          {/* Patient info grid */}
          <div className="grid gap-6 sm:grid-cols-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Especie</p>
              <p className="mt-1 capitalize">{patient.species}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Raza</p>
              <p className="mt-1">{patient.breed ?? "—"}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Nacimiento</p>
              <p className="mt-1">
                {patient.dateOfBirth
                  ? new Date(patient.dateOfBirth).toLocaleDateString("es-AR")
                  : "—"}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Castrado/a</p>
              <p className="mt-1">{patient.neutered ? "Sí" : patient.neutered === false ? "No" : "—"}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Turnos</p>
              <p className="mt-1">{patient.appointments.length}</p>
            </div>
          </div>

          <Separator />

          {/* Appointments */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Turnos</h2>
              <a
                href={`/dashboard/appointments/new?patientId=${id}`}
                className={buttonVariants({ size: "sm" })}
              >
                + Nuevo turno
              </a>
            </div>

            {patient.appointments.length === 0 ? (
              <div className="rounded-lg border border-dashed py-8 text-center text-muted-foreground">
                No hay turnos registrados para esta mascota.
              </div>
            ) : (
              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Duración</TableHead>
                      <TableHead>Motivo</TableHead>
                      <TableHead>Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {patient.appointments.map((apt) => (
                      <TableRow key={apt.id}>
                        <TableCell>
                          <a
                            href={`/dashboard/appointments/${apt.id}`}
                            className="text-primary hover:underline"
                          >
                            {new Date(apt.scheduledAt).toLocaleString("es-AR", {
                              timeZone: "America/Argentina/Buenos_Aires",
                              dateStyle: "short",
                              timeStyle: "short",
                            })}
                          </a>
                        </TableCell>
                        <TableCell>{apt.durationMinutes} min</TableCell>
                        <TableCell>{apt.reason ?? "—"}</TableCell>
                        <TableCell>
                          <span
                            className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[apt.status] ?? ""}`}
                          >
                            {statusLabels[apt.status] ?? apt.status}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab: Historia clínica */}
      {activeTab === "historia" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Historia clínica</h2>
            <a
              href={`/dashboard/consultations/new?patientId=${id}`}
              className={buttonVariants({ size: "sm" })}
            >
              + Nueva consulta
            </a>
          </div>

          {consultationHistory.length === 0 ? (
            <div className="rounded-lg border border-dashed py-8 text-center text-muted-foreground">
              No hay consultas registradas para este paciente.
            </div>
          ) : (
            <div className="space-y-3">
              {consultationHistory.map((c) => (
                <a
                  key={c.id}
                  href={`/dashboard/consultations/${c.id}`}
                  className="block rounded-lg border p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">
                        {c.assessment ?? "Sin diagnóstico registrado"}
                      </p>
                      {c.subjective && (
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {c.subjective}
                        </p>
                      )}
                    </div>
                    <p className="shrink-0 text-xs text-muted-foreground">
                      {new Date(c.createdAt).toLocaleDateString("es-AR", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab: Vacunas */}
      {activeTab === "vacunas" && (
        <VaccinationSection patientId={id} vaccinations={vaccinationHistory} />
      )}

      {/* Tab: Desparasitaciones */}
      {activeTab === "desparasitaciones" && (
        <DewormingSection patientId={id} records={dewormingHistory} />
      )}

      {/* Tab: Documentos */}
      {activeTab === "documentos" && (
        <DocumentSection patientId={id} documents={documentHistory} />
      )}

      {/* Tab: Peluquería */}
      {activeTab === "peluqueria" && showGrooming && (
        <GroomingSection
          patientId={id}
          profile={groomingProfile}
          sessions={groomingSessions}
          canEdit={role === "admin" || role === "owner" || role === "groomer"}
        />
      )}

      {/* Back link */}
      <a
        href={`/dashboard/clients/${patient.clientId}`}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        ← Volver a {patient.client?.name}
      </a>
    </div>
  );
}
