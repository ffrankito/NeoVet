"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button-variants";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createStockEntry } from "@/app/dashboard/petshop/stock-entries/actions";

type FieldErrors = { productId?: string; quantity?: string; costPrice?: string };
type ActionResult = { errors: FieldErrors } | { error: string } | undefined;

function getFieldErrors(result: ActionResult): FieldErrors {
  if (result && "errors" in result) return result.errors;
  return {};
}

function getGlobalError(result: ActionResult): string | null {
  if (result && "error" in result) return result.error;
  return null;
}

interface StockEntryFormProps {
  products: { id: string; name: string }[];
  providers: { id: string; name: string }[];
}

export function StockEntryForm({ products, providers }: StockEntryFormProps) {
  const action = async (_prev: ActionResult, formData: FormData) => createStockEntry(formData);
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
        <Label htmlFor="productId">Producto *</Label>
        <select
          id="productId"
          name="productId"
          defaultValue=""
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          aria-invalid={!!errors.productId}
        >
          <option value="" disabled>Seleccioná un producto</option>
          {products.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
        {errors.productId && <p className="text-sm text-destructive">{errors.productId}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="providerId">Proveedor (opcional)</Label>
        <select
          id="providerId"
          name="providerId"
          defaultValue=""
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          <option value="">Sin proveedor</option>
          {providers.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="quantity">Cantidad *</Label>
          <Input
            id="quantity"
            name="quantity"
            type="number"
            step="1"
            min="1"
            placeholder="10"
            aria-invalid={!!errors.quantity}
          />
          {errors.quantity && <p className="text-sm text-destructive">{errors.quantity}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="costPrice">Precio de costo ($)</Label>
          <Input
            id="costPrice"
            name="costPrice"
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            aria-invalid={!!errors.costPrice}
          />
          {errors.costPrice && <p className="text-sm text-destructive">{errors.costPrice}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="expirationDate">Fecha de vencimiento</Label>
        <Input
          id="expirationDate"
          name="expirationDate"
          type="date"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notas</Label>
        <Textarea
          id="notes"
          name="notes"
          placeholder="Número de remito, observaciones, etc."
          rows={3}
        />
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Registrando..." : "Registrar ingreso"}
        </Button>
        <a
          href="/dashboard/petshop/stock-entries"
          className={buttonVariants({ variant: "outline" })}
        >
          Cancelar
        </a>
      </div>
    </form>
  );
}
