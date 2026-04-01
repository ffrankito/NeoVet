"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button-variants";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createProduct, updateProduct } from "@/app/dashboard/petshop/products/actions";
import type { Product } from "@/db/schema";

const CATEGORIES: { value: string; label: string }[] = [
  { value: "medicamento", label: "Medicamento" },
  { value: "vacuna", label: "Vacuna" },
  { value: "insumo_clinico", label: "Insumo clínico" },
  { value: "higiene", label: "Higiene" },
  { value: "accesorio", label: "Accesorio" },
  { value: "juguete", label: "Juguete" },
  { value: "alimento", label: "Alimento" },
  { value: "transporte", label: "Transporte" },
  { value: "otro", label: "Otro" },
];

type FieldErrors = {
  name?: string;
  category?: string;
  sellPrice?: string;
  taxRate?: string;
  minStock?: string;
};
type ActionResult = { errors: FieldErrors } | { error: string } | undefined;

function getFieldErrors(result: ActionResult): FieldErrors {
  if (result && "errors" in result) return result.errors;
  return {};
}

function getGlobalError(result: ActionResult): string | null {
  if (result && "error" in result) return result.error;
  return null;
}

interface ProductFormProps {
  product?: Product;
}

export function ProductForm({ product }: ProductFormProps) {
  const isEdit = !!product;

  const action = isEdit
    ? async (_prev: ActionResult, formData: FormData) => updateProduct(product!.id, formData)
    : async (_prev: ActionResult, formData: FormData) => createProduct(formData);

  const [result, dispatch, isPending] = useActionState(action, undefined);

  const errors = getFieldErrors(result);
  const globalError = getGlobalError(result);

  return (
    <form action={dispatch} className="max-w-lg space-y-6">
      {globalError && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {globalError}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="name">Nombre *</Label>
        <Input
          id="name"
          name="name"
          defaultValue={product?.name ?? ""}
          placeholder="Nombre del producto"
          aria-invalid={!!errors.name}
        />
        {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="category">Categoría *</Label>
        <select
          id="category"
          name="category"
          defaultValue={product?.category ?? "otro"}
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          aria-invalid={!!errors.category}
        >
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
        {errors.category && <p className="text-sm text-destructive">{errors.category}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="sellPrice">Precio de venta ($) *</Label>
          <Input
            id="sellPrice"
            name="sellPrice"
            type="number"
            step="0.01"
            min="0"
            defaultValue={product?.sellPrice ?? "0"}
            aria-invalid={!!errors.sellPrice}
          />
          {errors.sellPrice && <p className="text-sm text-destructive">{errors.sellPrice}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="taxRate">IVA *</Label>
          <select
            id="taxRate"
            name="taxRate"
            defaultValue={product?.taxRate ?? 0}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            aria-invalid={!!errors.taxRate}
          >
            <option value="0">0%</option>
            <option value="21">21%</option>
          </select>
          {errors.taxRate && <p className="text-sm text-destructive">{errors.taxRate}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="minStock">Stock mínimo</Label>
        <Input
          id="minStock"
          name="minStock"
          type="number"
          step="1"
          min="0"
          defaultValue={product?.minStock ?? "0"}
          aria-invalid={!!errors.minStock}
        />
        <p className="text-xs text-muted-foreground">
          Se mostrará una alerta cuando el stock actual sea menor o igual a este valor.
        </p>
        {errors.minStock && <p className="text-sm text-destructive">{errors.minStock}</p>}
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending
            ? isEdit ? "Guardando..." : "Creando..."
            : isEdit ? "Guardar cambios" : "Crear producto"}
        </Button>
        <a
          href={isEdit ? `/dashboard/petshop/products/${product!.id}` : "/dashboard/petshop/products"}
          className={buttonVariants({ variant: "outline" })}
        >
          Cancelar
        </a>
      </div>
    </form>
  );
}
