"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { Input } from "@/components/ui/input";
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

interface ClientRow {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  importedFromGvet: boolean;
  createdAt: Date;
  patientCount: number;
}

interface ClientTableProps {
  data: ClientRow[];
  total: number;
  page: number;
  totalPages: number;
}

export function ClientTable({ data, total, page, totalPages }: ClientTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState(searchParams.get("search") ?? "");

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    startTransition(() => {
      const params = new URLSearchParams(searchParams);
      if (search) {
        params.set("search", search);
      } else {
        params.delete("search");
      }
      params.delete("page");
      router.push(`/dashboard/clients?${params.toString()}`);
    });
  }

  function goToPage(p: number) {
    startTransition(() => {
      const params = new URLSearchParams(searchParams);
      params.set("page", String(p));
      router.push(`/dashboard/clients?${params.toString()}`);
    });
  }

  return (
    <div className="space-y-4">
      {/* Search + count */}
      <div className="flex items-center justify-between gap-4">
        <form onSubmit={handleSearch} className="flex gap-2">
          <Input
            placeholder="Buscar por nombre, teléfono, email o mascota..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full max-w-80"
          />
          <Button variant="outline" type="submit" disabled={isPending}>
            Buscar
          </Button>
        </form>
        <span className="text-sm text-muted-foreground">
          {total} cliente{total !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Teléfono</TableHead>
              <TableHead>Email</TableHead>
              <TableHead className="text-center">Mascotas</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                  {searchParams.get("search")
                    ? "No se encontraron clientes con ese criterio."
                    : "No hay clientes todavía. ¡Creá el primero!"}
                </TableCell>
              </TableRow>
            ) : (
              data.map((client) => (
                <TableRow
                  key={client.id}
                  className="cursor-pointer"
                  onClick={() => router.push(`/dashboard/clients/${client.id}`)}
                >
                  <TableCell className="font-medium">
                    {client.name}
                    {client.importedFromGvet && (
                      <Badge variant="outline" className="ml-2 text-xs">
                        Geovet
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>{client.phone}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {client.email ?? "—"}
                  </TableCell>
                  <TableCell className="text-center">{client.patientCount}</TableCell>
                  <TableCell className="text-right">
                    <a
                      href={`/dashboard/clients/${client.id}`}
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

      {/* Pagination */}
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
