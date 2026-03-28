import { notFound } from "next/navigation";
import { getClient } from "../actions";
import { buttonVariants } from "@/components/ui/button-variants";
import { DeleteClientButton } from "@/components/admin/clients/delete-client-button";
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

export default async function ClientDetailPage({ params }: Props) {
  const { id } = await params;
  const client = await getClient(id);

  if (!client) notFound();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">{client.name}</h1>
            {client.importedFromGvet && (
              <Badge variant="outline">Importado de Geovet</Badge>
            )}
          </div>
          <p className="mt-1 text-muted-foreground">
            Cliente desde {new Date(client.createdAt).toLocaleDateString("es-AR")}
          </p>
        </div>
        <div className="flex gap-2">
          <a
            href={`/dashboard/clients/${id}/edit`}
            className={buttonVariants({ variant: "outline" })}
          >
            Editar
          </a>
          <DeleteClientButton clientId={id} />
        </div>
      </div>

      <Separator />

      {/* Contact info */}
      <div className="grid gap-6 sm:grid-cols-3">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Teléfono</p>
          <p className="mt-1">{client.phone}</p>
        </div>
        <div>
          <p className="text-sm font-medium text-muted-foreground">Email</p>
          <p className="mt-1">{client.email ?? "—"}</p>
        </div>
        <div>
          <p className="text-sm font-medium text-muted-foreground">Mascotas</p>
          <p className="mt-1">{client.patients.length}</p>
        </div>
      </div>

      <Separator />

      {/* Patients list */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Mascotas</h2>
          <a
            href={`/dashboard/clients/${id}/patients/new`}
            className={buttonVariants({ size: "sm" })}
          >
            + Nueva mascota
          </a>
        </div>

        {client.patients.length === 0 ? (
          <div className="rounded-lg border border-dashed py-8 text-center text-muted-foreground">
            Este cliente no tiene mascotas registradas todavía.
          </div>
        ) : (
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Especie</TableHead>
                  <TableHead>Raza</TableHead>
                  <TableHead>Nacimiento</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {client.patients.map((patient) => (
                  <TableRow key={patient.id}>
                    <TableCell className="font-medium">
                      <a
                        href={`/dashboard/patients/${patient.id}`}
                        className="text-primary hover:underline"
                      >
                        {patient.name}
                      </a>
                    </TableCell>
                    <TableCell className="capitalize">{patient.species}</TableCell>
                    <TableCell>{patient.breed ?? "—"}</TableCell>
                    <TableCell>
                      {patient.dateOfBirth
                        ? new Date(patient.dateOfBirth).toLocaleDateString("es-AR")
                        : "—"}
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
        href="/dashboard/clients"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        ← Volver a clientes
      </a>
    </div>
  );
}
