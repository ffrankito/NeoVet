"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const PAYMENT_LABELS: Record<string, string> = {
  efectivo: "Efectivo",
  transferencia: "Transferencia",
  tarjeta_debito: "Débito",
  tarjeta_credito: "Crédito",
  mercadopago: "MercadoPago",
};

interface SaleRow {
  id: string;
  paymentMethod: string;
  notes: string | null;
  createdAt: Date;
  itemCount: number;
  total: number;
}

interface SaleTableProps {
  data: SaleRow[];
  total: number;
  page: number;
  totalPages: number;
}

export function SaleTable({ data, total, page, totalPages }: SaleTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  function goToPage(p: number) {
    startTransition(() => {
      const params = new URLSearchParams(searchParams);
      params.set("page", String(p));
      router.push(`/dashboard/petshop/sales?${params.toString()}`);
    });
  }

  function formatDate(date: Date) {
    return new Date(date).toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end">
        <span className="text-sm text-muted-foreground">
          {total} venta{total !== 1 ? "s" : ""}
        </span>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead>Método de pago</TableHead>
              <TableHead className="text-center">Ítems</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                  No hay ventas registradas todavía.
                </TableCell>
              </TableRow>
            ) : (
              data.map((sale) => (
                <TableRow
                  key={sale.id}
                  className="cursor-pointer"
                  onClick={() => router.push(`/dashboard/petshop/sales/${sale.id}`)}
                >
                  <TableCell className="text-muted-foreground text-sm">
                    {formatDate(sale.createdAt)}
                  </TableCell>
                  <TableCell>
                    {PAYMENT_LABELS[sale.paymentMethod] ?? sale.paymentMethod}
                  </TableCell>
                  <TableCell className="text-center">{sale.itemCount}</TableCell>
                  <TableCell className="text-right font-medium">
                    ${Number(sale.total).toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell className="text-right">
                    <a
                      href={`/dashboard/petshop/sales/${sale.id}`}
                      className="inline-flex h-7 items-center rounded-lg px-2.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Ver
                    </a>
                  </TableCell>
                </TableRow>
              ))
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
