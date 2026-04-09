"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PaymentDialog } from "./payment-dialog";

interface ChargeRow {
  id: string;
  sourceType: string;
  sourceId: string | null;
  description: string;
  amount: number;
  paidAmount: number;
  status: string;
  createdAt: Date;
}

interface ChargeTableProps {
  data: ChargeRow[];
  total: number;
  page: number;
  totalPages: number;
}

const sourceTypeLabels: Record<string, string> = {
  consultation: "Consulta",
  grooming: "Peluquería",
  procedure: "Procedimiento",
  sale: "Venta",
  hospitalization: "Internación",
  other: "Otro",
};

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  pending: { label: "Pendiente", variant: "outline" },
  partial: { label: "Parcial", variant: "secondary" },
  paid: { label: "Pagado", variant: "default" },
};

function formatCurrency(amount: number): string {
  return amount.toLocaleString("es-AR", {
    style: "currency",
    currency: "ARS",
  });
}

function formatDateAR(date: Date): string {
  return new Date(date).toLocaleString("es-AR", {
    dateStyle: "short",
    timeZone: "America/Argentina/Buenos_Aires",
  });
}

function getSourceLink(sourceType: string, sourceId: string): string | null {
  switch (sourceType) {
    case "consultation":
      return `/dashboard/consultations/${sourceId}`;
    case "grooming":
      return `/dashboard/grooming/${sourceId}`;
    case "procedure":
      return `/dashboard/procedures/${sourceId}`;
    case "sale":
      return `/dashboard/petshop/sales/${sourceId}`;
    case "hospitalization":
      return `/dashboard/hospitalizations/${sourceId}`;
    default:
      return null;
  }
}

export function ChargeTable({
  data,
  total,
  page,
  totalPages,
}: ChargeTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const currentStatus = searchParams.get("status") ?? "all";

  function handleStatusChange(value: string) {
    startTransition(() => {
      const params = new URLSearchParams(searchParams);
      if (value === "all") {
        params.delete("status");
      } else {
        params.set("status", value);
      }
      params.delete("page");
      router.push(`?${params.toString()}`);
    });
  }

  function goToPage(p: number) {
    startTransition(() => {
      const params = new URLSearchParams(searchParams);
      params.set("page", String(p));
      router.push(`?${params.toString()}`);
    });
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Estado:</span>
          <Select value={currentStatus} onValueChange={(v) => v && handleStatusChange(v)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="pending">Pendientes</SelectItem>
              <SelectItem value="partial">Parciales</SelectItem>
              <SelectItem value="paid">Pagados</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <span className="text-sm text-muted-foreground">
          {total} cargo{total !== 1 ? "s" : ""}
        </span>
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead>Descripción</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead className="text-right">Monto</TableHead>
              <TableHead className="text-right">Pagado</TableHead>
              <TableHead className="text-right">Saldo</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="py-8 text-center text-muted-foreground"
                >
                  No hay cargos registrados.
                </TableCell>
              </TableRow>
            ) : (
              data.map((charge) => {
                const balance = charge.amount - charge.paidAmount;
                const cfg = statusConfig[charge.status] ?? {
                  label: charge.status,
                  variant: "outline" as const,
                };
                const sourceLink =
                  charge.sourceId
                    ? getSourceLink(charge.sourceType, charge.sourceId)
                    : null;

                return (
                  <TableRow key={charge.id}>
                    <TableCell className="text-muted-foreground">
                      {formatDateAR(charge.createdAt)}
                    </TableCell>
                    <TableCell>
                      {sourceLink ? (
                        <a
                          href={sourceLink}
                          className="font-medium underline underline-offset-4 hover:text-primary"
                        >
                          {charge.description}
                        </a>
                      ) : (
                        <span className="font-medium">
                          {charge.description}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {sourceTypeLabels[charge.sourceType] ??
                        charge.sourceType}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(charge.amount)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(charge.paidAmount)}
                    </TableCell>
                    <TableCell
                      className={`text-right font-semibold ${
                        balance > 0 ? "text-destructive" : ""
                      }`}
                    >
                      {formatCurrency(balance)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={cfg.variant}>{cfg.label}</Badge>
                    </TableCell>
                    <TableCell>
                      {(charge.status === "pending" ||
                        charge.status === "partial") && (
                        <PaymentDialog
                          chargeId={charge.id}
                          remainingBalance={balance}
                        />
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1 || isPending}
            onClick={() => goToPage(page - 1)}
          >
            ← Anterior
          </Button>

          <span className="text-sm text-muted-foreground">
            Página {page} de {totalPages}
          </span>

          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages || isPending}
            onClick={() => goToPage(page + 1)}
          >
            Siguiente →
          </Button>
        </div>
      )}
    </div>
  );
}
