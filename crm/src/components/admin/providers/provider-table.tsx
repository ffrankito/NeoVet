"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface ProviderRow {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  cuit: string | null;
  isActive: boolean;
  createdAt: Date;
}

interface ProviderTableProps {
  data: ProviderRow[];
  total: number;
  page: number;
  totalPages: number;
}

export function ProviderTable({ data, total, page, totalPages }: ProviderTableProps) {
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
      router.push(`/dashboard/petshop/providers?${params.toString()}`);
    });
  }

  function goToPage(p: number) {
    startTransition(() => {
      const params = new URLSearchParams(searchParams);
      params.set("page", String(p));
      router.push(`/dashboard/petshop/providers?${params.toString()}`);
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <form onSubmit={handleSearch} className="flex gap-2">
          <Input
            placeholder="Buscar por nombre, teléfono, email o CUIT..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-80"
          />
          <Button variant="outline" type="submit" disabled={isPending}>
            Buscar
          </Button>
        </form>
        <span className="text-sm text-muted-foreground">
          {total} proveedor{total !== 1 ? "es" : ""}
        </span>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Teléfono</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>CUIT</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                  {searchParams.get("search")
                    ? "No se encontraron proveedores con ese criterio."
                    : "No hay proveedores todavía."}
                </TableCell>
              </TableRow>
            ) : (
              data.map((provider) => (
                <TableRow
                  key={provider.id}
                  className="cursor-pointer"
                  onClick={() => router.push(`/dashboard/petshop/providers/${provider.id}`)}
                >
                  <TableCell className="font-medium">
                    {provider.name}
                    {!provider.isActive && (
                      <Badge variant="outline" className="ml-2 text-xs">
                        Inactivo
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>{provider.phone ?? "—"}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {provider.email ?? "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {provider.cuit ?? "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <a
                      href={`/dashboard/petshop/providers/${provider.id}`}
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
