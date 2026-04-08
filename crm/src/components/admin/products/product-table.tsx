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

const CATEGORY_LABELS: Record<string, string> = {
  medicamento: "Medicamento",
  vacuna: "Vacuna",
  insumo_clinico: "Insumo clínico",
  higiene: "Higiene",
  accesorio: "Accesorio",
  juguete: "Juguete",
  alimento: "Alimento",
  transporte: "Transporte",
  otro: "Otro",
};

interface ProductRow {
  id: string;
  name: string;
  category: string;
  currentStock: string;
  minStock: string;
  sellPrice: string;
  taxRate: number;
  isActive: boolean;
}

interface ProductTableProps {
  data: ProductRow[];
  total: number;
  page: number;
  totalPages: number;
}

export function ProductTable({ data, total, page, totalPages }: ProductTableProps) {
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
      router.push(`/dashboard/petshop/products?${params.toString()}`);
    });
  }

  function goToPage(p: number) {
    startTransition(() => {
      const params = new URLSearchParams(searchParams);
      params.set("page", String(p));
      router.push(`/dashboard/petshop/products?${params.toString()}`);
    });
  }

  function isLowStock(row: ProductRow) {
    return Number(row.currentStock) <= Number(row.minStock);
  }

  function formatPrice(value: string) {
    return `$${Number(value).toLocaleString("es-AR", { minimumFractionDigits: 2 })}`;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <form onSubmit={handleSearch} className="flex gap-2">
          <Input
            placeholder="Buscar por nombre..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full max-w-80"
          />
          <Button variant="outline" type="submit" disabled={isPending}>
            Buscar
          </Button>
        </form>
        <span className="text-sm text-muted-foreground">
          {total} producto{total !== 1 ? "s" : ""}
        </span>
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Categoría</TableHead>
              <TableHead className="text-right">Stock</TableHead>
              <TableHead className="text-right">Precio</TableHead>
              <TableHead className="text-center">IVA</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                  {searchParams.get("search")
                    ? "No se encontraron productos con ese criterio."
                    : "No hay productos todavía."}
                </TableCell>
              </TableRow>
            ) : (
              data.map((product) => (
                <TableRow
                  key={product.id}
                  className="cursor-pointer"
                  onClick={() => router.push(`/dashboard/petshop/products/${product.id}`)}
                >
                  <TableCell className="font-medium">
                    {product.name}
                    {!product.isActive && (
                      <Badge variant="outline" className="ml-2 text-xs">Inactivo</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {CATEGORY_LABELS[product.category] ?? product.category}
                  </TableCell>
                  <TableCell className="text-right">
                    <span className={isLowStock(product) ? "font-semibold text-destructive" : ""}>
                      {Number(product.currentStock)}
                    </span>
                    {isLowStock(product) && (
                      <Badge variant="destructive" className="ml-2 text-xs">Bajo</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">{formatPrice(product.sellPrice)}</TableCell>
                  <TableCell className="text-center text-muted-foreground">
                    {product.taxRate}%
                  </TableCell>
                  <TableCell className="text-right">
                    <a
                      href={`/dashboard/petshop/products/${product.id}`}
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
