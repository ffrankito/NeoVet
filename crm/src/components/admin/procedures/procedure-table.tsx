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
import { Badge } from "@/components/ui/badge";

interface ProcedureRow {
  id: string;
  patientName: string;
  clientName: string;
  procedureDate: Date;
  description: string;
  type: string | null;
  surgeonNames: string;
}

interface ProcedureTableProps {
  data: ProcedureRow[];
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

export function ProcedureTable({
  data,
  total,
  page,
  totalPages,
}: ProcedureTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  function goToPage(p: number) {
    startTransition(() => {
      const params = new URLSearchParams(searchParams);
      params.set("page", String(p));
      router.push(`/dashboard/procedures?${params.toString()}`);
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-end">
        <span className="ml-auto text-sm text-muted-foreground">
          {total} procedimiento{total !== 1 ? "s" : ""}
        </span>
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead>Paciente</TableHead>
              <TableHead>Dueño</TableHead>
              <TableHead>Procedimiento</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Cirujano</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="py-8 text-center text-muted-foreground"
                >
                  No hay procedimientos registrados.
                </TableCell>
              </TableRow>
            ) : (
              data.map((p) => (
                <TableRow
                  key={p.id}
                  className="cursor-pointer"
                  onClick={() =>
                    router.push(`/dashboard/procedures/${p.id}`)
                  }
                >
                  <TableCell className="text-muted-foreground">
                    {formatDateAR(p.procedureDate)}
                  </TableCell>
                  <TableCell className="font-medium">
                    {p.patientName}
                  </TableCell>
                  <TableCell>{p.clientName}</TableCell>
                  <TableCell>{p.description}</TableCell>
                  <TableCell>
                    {p.type ? (
                      <Badge variant="secondary">{p.type}</Badge>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {p.surgeonNames || "—"}
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
