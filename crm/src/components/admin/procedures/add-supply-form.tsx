"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { addProcedureSupply } from "@/app/dashboard/procedures/actions";

type ActionResult =
  | {
      errors?: Record<string, string | string[] | undefined>;
      error?: string;
      success?: boolean;
    }
  | undefined;

interface AddSupplyFormProps {
  procedureId: string;
  products: Array<{
    id: string;
    name: string;
    currentStock: string;
    costPrice: string | null;
  }>;
}

export function AddSupplyForm({ procedureId, products }: AddSupplyFormProps) {
  const action = async (_prev: ActionResult, formData: FormData) =>
    addProcedureSupply(procedureId, formData);
  const [result, dispatch, isPending] = useActionState(action, undefined);

  const error = result && "error" in result ? result.error : null;
  const errors =
    result && "errors" in result
      ? (result.errors ?? {})
      : ({} as Record<string, string | string[] | undefined>);

  return (
    <form action={dispatch} className="space-y-3">
      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1 space-y-1">
          <Label htmlFor="productId" className="text-xs">
            Producto
          </Label>
          <Select name="productId">
            <SelectTrigger id="productId">
              <SelectValue placeholder="Seleccionar producto..." />
            </SelectTrigger>
            <SelectContent>
              {products.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name} (stock: {p.currentStock})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors?.productId && (
            <p className="text-xs text-destructive">{errors.productId}</p>
          )}
        </div>

        <div className="w-32 space-y-1">
          <Label htmlFor="quantity" className="text-xs">
            Cantidad
          </Label>
          <Input
            id="quantity"
            name="quantity"
            type="number"
            step="0.01"
            min="0.01"
            placeholder="1"
            aria-invalid={!!errors?.quantity}
          />
          {errors?.quantity && (
            <p className="text-xs text-destructive">{errors.quantity}</p>
          )}
        </div>

        <Button type="submit" disabled={isPending} size="sm">
          {isPending ? "Agregando..." : "Agregar"}
        </Button>
      </div>
    </form>
  );
}
