"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

interface HospitalizationRow {
  id: string;
  patientName: string;
  clientName: string;
  admittedAt: Date;
  dischargedAt: Date | null;
  reason: string | null;
}

interface HospitalizationTableProps {
  data: HospitalizationRow[];
  total: number;
  page: number;
  totalPages: number;
}

function formatDateAR(date: Date): string {
  return new Date(date).toLocaleString("es-AR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Argentina/Buenos_Aires",
  });
}

export function HospitalizationTable({
  data,
  total,
  page,
  totalPages,
}: HospitalizationTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [statusFilter, setStatusFilter] = useState(
    searchParams.get("status") ?? "all"
  );
  const [searchTerm, setSearchTerm] = useState(searchParams.get("q") ?? "");

  function buildParams(overrides: { status?: string; q?: string | null }) {
    const params = new URLSearchParams();
    const effectiveStatus = overrides.status ?? statusFilter;
    if (effectiveStatus && effectiveStatus !== "all") params.set("status", effectiveStatus);
    const effectiveQ = overrides.q === null ? "" : (overrides.q ?? searchTerm.trim());
    if (effectiveQ) params.set("q", effectiveQ);
    return params;
  }

  function applyStatusFilter(value: string) {
    setStatusFilter(value);
    startTransition(() => {
      const params = buildParams({ status: value });
      router.push(`/dashboard/hospitalizations?${params.toString()}`);
    });
  }

  function applySearch() {
    startTransition(() => {
      const params = buildParams({ q: searchTerm.trim() });
      router.push(`/dashboard/hospitalizations?${params.toString()}`);
    });
  }

  function goToPage(p: number) {
    startTransition(() => {
      const params = new URLSearchParams(searchParams);
      params.set("page", String(p));
      router.push(`/dashboard/hospitalizations?${params.toString()}`);
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Buscar</label>
          <Input
            type="search"
            placeholder="Mascota, dueño, DNI, teléfono, dirección"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") applySearch();
            }}
            className="w-60"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Estado</label>
          <Select value={statusFilter} onValueChange={(v) => v && applyStatusFilter(v)}>
          <SelectTrigger className="w-44">
           <SelectValue />
          </SelectTrigger>
          <SelectContent>
          <SelectItem value="all">Todos</SelectItem>
         <SelectItem value="active">Internados</SelectItem>
          <SelectItem value="discharged">Dados de alta</SelectItem>
          </SelectContent>
          </Select>
          </div>

        <Button variant="outline" onClick={applySearch} disabled={isPending}>
          Buscar
        </Button>

        <span className="ml-auto text-sm text-muted-foreground">
          {total} internación{total !== 1 ? "es" : ""}
        </span>
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Paciente</TableHead>
              <TableHead>Dueño</TableHead>
              <TableHead>Ingreso</TableHead>
              <TableHead>Alta</TableHead>
              <TableHead>Motivo</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                  No hay internaciones que coincidan con los filtros.
                </TableCell>
              </TableRow>
            ) : (
              data.map((h) => (
                <TableRow
                  key={h.id}
                  className="cursor-pointer"
                  onClick={() => router.push(`/dashboard/hospitalizations/${h.id}`)}
                >
                  <TableCell className="font-medium">{h.patientName}</TableCell>
                  <TableCell>{h.clientName}</TableCell>
                  <TableCell>{formatDateAR(h.admittedAt)}</TableCell>
                  <TableCell>
                    {h.dischargedAt ? (
                      <span className="text-muted-foreground">
                        {formatDateAR(h.dischargedAt)}
                      </span>
                    ) : (
                      <span className="inline-flex rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                        Internado
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {h.reason ?? "—"}
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
