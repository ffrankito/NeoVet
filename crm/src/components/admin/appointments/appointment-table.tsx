"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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

interface AppointmentRow {
  id: string;
  scheduledAt: Date;
  durationMinutes: number;
  reason: string | null;
  status: string;
  patientName: string;
  patientSpecies: string;
  clientName: string;
  clientPhone: string;
}

interface AppointmentTableProps {
  data?: AppointmentRow[];
  total: number;
  page: number;
  totalPages: number;
}

export function AppointmentTable({
  data = [],
  total,
  page,
  totalPages,
}: AppointmentTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") ?? "all");
  const [from, setFrom] = useState(searchParams.get("from") ?? "");
  const [to, setTo] = useState(searchParams.get("to") ?? "");

  const statusLabels: Record<string, string> = {
    pending: "Pendiente",
    confirmed: "Confirmado",
    completed: "Completado",
    cancelled: "Cancelado",
    no_show: "No se presentó",
  };

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    confirmed: "bg-blue-100 text-blue-800",
    completed: "bg-green-100 text-green-800",
    cancelled: "bg-red-100 text-red-800",
    no_show: "bg-orange-100 text-orange-800",
  };

  function applyFilters() {
    startTransition(() => {
      const params = new URLSearchParams();
      if (statusFilter && statusFilter !== "all") params.set("status", statusFilter);
      if (from) params.set("from", from);
      if (to) params.set("to", to);
      router.push(`/dashboard/appointments?${params.toString()}`);
    });
  }

  function goToPage(p: number) {
    startTransition(() => {
      const params = new URLSearchParams(searchParams);
      params.set("page", String(p));
      router.push(`/dashboard/appointments?${params.toString()}`);
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Estado</label>
          <Select value={statusFilter} onValueChange={(v) => v && setStatusFilter(v)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" label="Todos">
                Todos
              </SelectItem>
              <SelectItem value="pending" label="Pendiente">
                Pendiente
              </SelectItem>
              <SelectItem value="confirmed" label="Confirmado">
                Confirmado
              </SelectItem>
              <SelectItem value="completed" label="Completado">
                Completado
              </SelectItem>
              <SelectItem value="cancelled" label="Cancelado">
                Cancelado
              </SelectItem>
              <SelectItem value="no_show" label="No se presentó">
                No se presentó
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Desde</label>
          <Input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="w-40"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Hasta</label>
          <Input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="w-40"
          />
        </div>

        <Button variant="outline" onClick={applyFilters} disabled={isPending}>
          Filtrar
        </Button>

        <span className="ml-auto text-sm text-muted-foreground">
          {total} turno{total !== 1 ? "s" : ""}
        </span>
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead>Paciente</TableHead>
              <TableHead>Dueño</TableHead>
              <TableHead>Motivo</TableHead>
              <TableHead>Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                  No hay turnos que coincidan con los filtros.
                </TableCell>
              </TableRow>
            ) : (
              data.map((apt) => (
                <TableRow
                  key={apt.id}
                  className="cursor-pointer"
                  onClick={() => router.push(`/dashboard/appointments/${apt.id}`)}
                >
                  <TableCell>
                    {new Date(apt.scheduledAt).toLocaleString("es-AR", {
                      dateStyle: "short",
                      timeStyle: "short",
                      timeZone: "America/Argentina/Buenos_Aires",
                    })}
                  </TableCell>
                  <TableCell className="font-medium">
                    {apt.patientName}
                    <span className="ml-1 text-xs text-muted-foreground capitalize">
                      ({apt.patientSpecies})
                    </span>
                  </TableCell>
                  <TableCell>{apt.clientName}</TableCell>
                  <TableCell className="text-muted-foreground">{apt.reason ?? "—"}</TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                        statusColors[apt.status] ?? ""
                      }`}
                    >
                      {statusLabels[apt.status] ?? apt.status}
                    </span>
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