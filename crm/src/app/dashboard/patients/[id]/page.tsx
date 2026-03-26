import { notFound } from "next/navigation";
import { getPatient, deletePatient } from "../actions";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button";
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

interface Props {
  params: Promise<{ id: string }>;
}

export default async function PatientDetailPage({ params }: Props) {
  const { id } = await params;
  const patient = await getPatient(id);

  if (!patient) notFound();

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
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{patient.name}</h1>
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
        <div className="flex gap-2">
          <a
            href={`/dashboard/patients/${id}/edit`}
            className={buttonVariants({ variant: "outline" })}
          >
            Editar
          </a>
          <form
            action={async () => {
              "use server";
              await deletePatient(id);
            }}
          >
            <Button variant="destructive">Eliminar</Button>
          </form>
        </div>
      </div>

      <Separator />

      {/* Patient info */}
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
