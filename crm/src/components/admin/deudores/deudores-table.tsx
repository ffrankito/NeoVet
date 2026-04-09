"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface DeudorRow {
  clientId: string;
  clientName: string;
  clientPhone: string | null;
  totalBalance: number;
  chargeCount: number;
}

interface DeudoresTableProps {
  data: DeudorRow[];
  total: number;
  page: number;
  totalPages: number;
}

function formatCurrency(amount: number): string {
  return amount.toLocaleString("es-AR", {
    style: "currency",
    currency: "ARS",
  });
}

export function DeudoresTable({
  data,
  total,
  page,
  totalPages,
}: DeudoresTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState(searchParams.get("search") ?? "");

  function goToPage(p: number) {
    startTransition(() => {
      const params = new URLSearchParams(searchParams);
      params.set("page", String(p));
      router.push(`/dashboard/deudores?${params.toString()}`);
    });
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    startTransition(() => {
      const params = new URLSearchParams(searchParams);
      if (search.trim()) {
        params.set("search", search.trim());
      } else {
        params.delete("search");
      }
      params.delete("page");
      router.push(`/dashboard/deudores?${params.toString()}`);
    });
  }

  return (
    <div className="space-y-4">
      {/* Search form */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <Input
          placeholder="Buscar por nombre de cliente..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <Button type="submit" variant="outline" disabled={isPending}>
          Buscar
        </Button>
      </form>

      <div className="flex items-end">
        <span className="ml-auto text-sm text-muted-foreground">
          {total} deudor{total !== 1 ? "es" : ""}
        </span>
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cliente</TableHead>
              <TableHead>Teléfono</TableHead>
              <TableHead className="text-right">Saldo pendiente</TableHead>
              <TableHead className="text-right">Cargos pendientes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="py-8 text-center text-muted-foreground"
                >
                  No hay clientes con saldo pendiente.
                </TableCell>
              </TableRow>
            ) : (
              data.map((d) => (
                <TableRow
                  key={d.clientId}
                  className="cursor-pointer"
                  onClick={() =>
                    router.push(`/dashboard/deudores/${d.clientId}`)
                  }
                >
                  <TableCell className="font-medium">
                    {d.clientName}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {d.clientPhone ?? "—"}
                  </TableCell>
                  <TableCell className="text-right font-semibold text-destructive">
                    {formatCurrency(d.totalBalance)}
                  </TableCell>
                  <TableCell className="text-right">
                    {d.chargeCount}
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
