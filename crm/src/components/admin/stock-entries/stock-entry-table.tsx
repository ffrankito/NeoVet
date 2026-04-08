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

interface StockEntryRow {
  id: string;
  quantity: string;
  costPrice: string | null;
  notes: string | null;
  createdAt: Date;
  productId: string;
  productName: string;
  providerId: string | null;
  providerName: string | null;
}

interface StockEntryTableProps {
  data: StockEntryRow[];
  total: number;
  page: number;
  totalPages: number;
}

export function StockEntryTable({ data, total, page, totalPages }: StockEntryTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  function goToPage(p: number) {
    startTransition(() => {
      const params = new URLSearchParams(searchParams);
      params.set("page", String(p));
      router.push(`/dashboard/petshop/stock-entries?${params.toString()}`);
    });
  }

  function formatPrice(value: string | null) {
    if (!value) return "—";
    return `$${Number(value).toLocaleString("es-AR", { minimumFractionDigits: 2 })}`;
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
          {total} ingreso{total !== 1 ? "s" : ""}
        </span>
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead>Producto</TableHead>
              <TableHead>Proveedor</TableHead>
              <TableHead className="text-right">Cantidad</TableHead>
              <TableHead className="text-right">Costo unit.</TableHead>
              <TableHead>Notas</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                  No hay ingresos de stock todavía.
                </TableCell>
              </TableRow>
            ) : (
              data.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell className="text-muted-foreground text-sm">
                    {formatDate(entry.createdAt)}
                  </TableCell>
                  <TableCell className="font-medium">
                    <a
                      href={`/dashboard/petshop/products/${entry.productId}`}
                      className="text-primary hover:underline"
                    >
                      {entry.productName}
                    </a>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {entry.providerName ?? "—"}
                  </TableCell>
                  <TableCell className="text-right">{Number(entry.quantity)}</TableCell>
                  <TableCell className="text-right">{formatPrice(entry.costPrice)}</TableCell>
                  <TableCell className="text-muted-foreground text-sm max-w-48 truncate">
                    {entry.notes ?? "—"}
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
