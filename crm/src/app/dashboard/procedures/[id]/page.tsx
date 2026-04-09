import Link from "next/link";
import { notFound } from "next/navigation";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { buttonVariants } from "@/components/ui/button-variants";
import { getProcedure, getActiveProductsForSupply } from "../actions";
import { AddSupplyForm } from "@/components/admin/procedures/add-supply-form";
import { DeleteSupplyButton } from "@/components/admin/procedures/delete-supply-button";

interface Props {
  params: Promise<{ id: string }>;
}

function formatDateAR(date: Date | string): string {
  return new Date(date).toLocaleString("es-AR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Argentina/Buenos_Aires",
  });
}

function formatCurrency(value: string | number | null): string {
  if (value === null || value === undefined) return "—";
  return Number(value).toLocaleString("es-AR", {
    style: "currency",
    currency: "ARS",
  });
}

function InfoCard({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  if (!value) return null;
  return (
    <div>
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <p className="mt-1">{value}</p>
    </div>
  );
}

export default async function ProcedureDetailPage({ params }: Props) {
  const { id } = await params;
  const procedure = await getProcedure(id);

  if (!procedure) notFound();

  const products = await getActiveProductsForSupply();

  // Calculate supplies total
  const suppliesTotal = procedure.supplies.reduce((sum, s) => {
    const qty = Number(s.quantity) || 0;
    const cost = Number(s.unitCost) || 0;
    return sum + qty * cost;
  }, 0);

  return (
    <div className="space-y-8">
      {/* Back link */}
      <Link
        href="/dashboard/procedures"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        ← Volver a procedimientos
      </Link>

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">
              {procedure.description}
            </h1>
            {procedure.type && (
              <Badge variant="secondary">{procedure.type}</Badge>
            )}
          </div>
          <p className="mt-1 text-muted-foreground">
            {formatDateAR(procedure.procedureDate)}
          </p>
        </div>
      </div>

      <Separator />

      {/* Info grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Paciente</p>
          <p className="mt-1">
            <Link
              href={`/dashboard/patients/${procedure.patientId}`}
              className="text-primary hover:underline"
            >
              {procedure.patientName}
            </Link>
          </p>
          <p className="text-sm text-muted-foreground">
            {procedure.patientSpecies}
            {procedure.patientBreed
              ? ` · ${procedure.patientBreed}`
              : ""}
          </p>
        </div>

        <div>
          <p className="text-sm font-medium text-muted-foreground">Dueño</p>
          <p className="mt-1">
            <Link
              href={`/dashboard/clients/${procedure.clientId}`}
              className="text-primary hover:underline"
            >
              {procedure.clientName}
            </Link>
          </p>
        </div>

        <InfoCard label="Cirujano(s)" value={procedure.surgeons.map((s) => s.staffName).join(", ") || null} />
        <InfoCard
          label="Anestesiólogo(s)"
          value={procedure.anesthesiologists.map((s) => s.staffName).join(", ") || null}
        />
      </div>

      {/* Notes */}
      {procedure.notes && (
        <div>
          <p className="text-sm font-medium text-muted-foreground">Notas</p>
          <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed">
            {procedure.notes}
          </p>
        </div>
      )}

      {/* Link to hospitalization */}
      {procedure.hospitalizationId && (
        <div>
          <p className="text-sm font-medium text-muted-foreground">
            Internación vinculada
          </p>
          <Link
            href={`/dashboard/hospitalizations/${procedure.hospitalizationId}`}
            className="mt-1 inline-flex text-sm text-primary hover:underline"
          >
            Ver internación →
          </Link>
        </div>
      )}

      <Separator />

      {/* Supplies section */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Insumos utilizados</h2>

        {/* Add supply inline form */}
        <div className="rounded-lg border bg-muted/30 p-4">
          <h3 className="mb-4 text-sm font-semibold">Agregar insumo</h3>
          <AddSupplyForm procedureId={id} products={products} />
        </div>

        {/* Supplies table */}
        {procedure.supplies.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No hay insumos registrados.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Producto</TableHead>
                  <TableHead className="text-right">Cantidad</TableHead>
                  <TableHead className="text-right">Costo unitario</TableHead>
                  <TableHead className="text-right">Subtotal</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {procedure.supplies.map((s) => {
                  const qty = Number(s.quantity) || 0;
                  const cost = Number(s.unitCost) || 0;
                  const subtotal = qty * cost;
                  return (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">
                        {s.productName}
                      </TableCell>
                      <TableCell className="text-right">{qty}</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(s.unitCost)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(subtotal)}
                      </TableCell>
                      <TableCell>
                        <DeleteSupplyButton supplyId={s.id} />
                      </TableCell>
                    </TableRow>
                  );
                })}
                {/* Total row */}
                <TableRow>
                  <TableCell
                    colSpan={3}
                    className="text-right font-semibold"
                  >
                    Total
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    {formatCurrency(suppliesTotal)}
                  </TableCell>
                  <TableCell />
                </TableRow>
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <Separator />

      {/* Follow-ups section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Seguimientos</h2>
          <Link
            href={`/dashboard/appointments/new?patientId=${procedure.patientId}&reason=Seguimiento+post-procedimiento:+${encodeURIComponent(procedure.description)}&procedureId=${id}`}
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            + Agendar seguimiento
          </Link>
        </div>

        {procedure.followUps.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            No hay seguimientos agendados.
          </p>
        ) : (
          <div className="space-y-2">
            {procedure.followUps.map((fu) => (
              <div
                key={fu.id}
                className="flex items-center justify-between rounded-lg border px-4 py-3"
              >
                <div>
                  <p className="text-sm font-medium">{fu.reason}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(fu.scheduledDate).toLocaleDateString("es-AR", {
                      dateStyle: "medium",
                      timeZone: "America/Argentina/Buenos_Aires",
                    })}
                  </p>
                </div>
                {fu.sentAt && (
                  <Badge variant="secondary">Enviado</Badge>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Link back to patient */}
      <Separator />
      <Link
        href={`/dashboard/patients/${procedure.patientId}`}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        ← Volver a {procedure.patientName}
      </Link>
    </div>
  );
}
