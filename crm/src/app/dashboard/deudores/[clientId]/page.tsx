import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getClientCharges, getClientDebtSummary } from "../actions";
import { buttonVariants } from "@/components/ui/button-variants";
import { ChargeTable } from "@/components/admin/deudores/charge-table";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { db } from "@/db";
import { clients } from "@/db/schema";
import { eq } from "drizzle-orm";

interface Props {
  params: Promise<{ clientId: string }>;
  searchParams: Promise<{ page?: string; status?: string }>;
}

const sourceTypeLabels: Record<string, string> = {
  consultation: "Consulta",
  grooming: "Estética",
  procedure: "Procedimiento",
  sale: "Venta",
  hospitalization: "Internación",
  other: "Otro",
};

function formatCurrency(amount: number): string {
  return amount.toLocaleString("es-AR", {
    style: "currency",
    currency: "ARS",
  });
}

export default async function ClientDebtDetailPage({
  params,
  searchParams,
}: Props) {
  const { clientId } = await params;
  const sp = await searchParams;
  const page = Number(sp.page) || 1;
  const status = (sp.status as "pending" | "partial" | "paid" | "all") ?? "all";

  const [client] = await db
    .select({ name: clients.name, phone: clients.phone, email: clients.email })
    .from(clients)
    .where(eq(clients.id, clientId))
    .limit(1);

  if (!client) notFound();

  const [summary, charges] = await Promise.all([
    getClientDebtSummary(clientId),
    getClientCharges(clientId, { page, status }),
  ]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <Link
          href="/dashboard/deudores"
          className={buttonVariants({ variant: "ghost", size: "sm" })}
        >
          ← Volver a deudores
        </Link>
      </div>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {client.name}
          </h1>
          <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
            {client.phone && <span>Tel: {client.phone}</span>}
            {client.email && <span>{client.email}</span>}
          </div>
        </div>
      </div>

      <Separator />

      {/* Summary card */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl border bg-card p-6">
          <p className="text-sm text-muted-foreground">Saldo total</p>
          <p
            className={`mt-1 text-3xl font-bold ${
              summary.totalBalance > 0 ? "text-destructive" : "text-foreground"
            }`}
          >
            {formatCurrency(summary.totalBalance)}
          </p>
        </div>

        {summary.byCategory.map((cat) => (
          <div key={cat.sourceType} className="rounded-xl border bg-card p-6">
            <p className="text-sm text-muted-foreground">
              {sourceTypeLabels[cat.sourceType] ?? cat.sourceType}
            </p>
            <p className="mt-1 text-xl font-semibold">
              {formatCurrency(cat.total)}
            </p>
          </div>
        ))}
      </div>

      <Separator />

      {/* Charges table */}
      <div>
        <h2 className="mb-4 text-lg font-semibold">Detalle de cargos</h2>
        <Suspense fallback={<Skeleton className="h-96 w-full" />}>
          <ChargeTable
            data={charges.data.map((c) => ({
              ...c,
              description: c.description ?? "",
              amount: Number(c.amount),
              paidAmount: Number(c.paidAmount),
            }))}
            total={charges.total}
            page={charges.page}
            totalPages={charges.totalPages}
          />
        </Suspense>
      </div>
    </div>
  );
}
