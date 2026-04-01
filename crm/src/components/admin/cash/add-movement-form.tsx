"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { addCashMovement } from "@/app/dashboard/cash/actions";

const PAYMENT_METHODS = [
  { value: "efectivo", label: "Efectivo" },
  { value: "transferencia", label: "Transferencia" },
  { value: "tarjeta_debito", label: "Tarjeta de débito" },
  { value: "tarjeta_credito", label: "Tarjeta de crédito" },
  { value: "mercadopago", label: "MercadoPago" },
];

type ActionResult = {
  errors?: { amount?: string; description?: string; paymentMethod?: string };
  error?: string;
} | undefined;

interface AddMovementFormProps {
  sessionId: string;
}

export function AddMovementForm({ sessionId }: AddMovementFormProps) {
  const action = async (_prev: ActionResult, formData: FormData) =>
    addCashMovement(sessionId, formData);
  const [result, dispatch, isPending] = useActionState(action, undefined);

  const error = result && "error" in result ? result.error : null;
  const errors = result && "errors" in result ? result.errors ?? {} : {} as Record<string, string | undefined>;

  return (
    <form action={dispatch} className="space-y-4">
      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="type">Tipo *</Label>
        <select
          id="type"
          name="type"
          defaultValue="egreso"
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          <option value="ingreso">Ingreso</option>
          <option value="egreso">Egreso</option>
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="movAmount">Monto ($) *</Label>
        <Input
          id="movAmount"
          name="amount"
          type="number"
          step="0.01"
          min="0.01"
          placeholder="0"
          aria-invalid={!!errors?.amount}
        />
        {errors?.amount && <p className="text-sm text-destructive">{errors.amount}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="movPaymentMethod">Método de pago *</Label>
        <select
          id="movPaymentMethod"
          name="paymentMethod"
          defaultValue="efectivo"
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          aria-invalid={!!errors?.paymentMethod}
        >
          {PAYMENT_METHODS.map((m) => (
            <option key={m.value} value={m.value}>{m.label}</option>
          ))}
        </select>
        {errors?.paymentMethod && <p className="text-sm text-destructive">{errors.paymentMethod}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="movDescription">Descripción *</Label>
        <Input
          id="movDescription"
          name="description"
          placeholder="Pago proveedor, retiro de efectivo, etc."
          aria-invalid={!!errors?.description}
        />
        {errors?.description && <p className="text-sm text-destructive">{errors.description}</p>}
      </div>

      <Button type="submit" disabled={isPending}>
        {isPending ? "Registrando..." : "Registrar movimiento"}
      </Button>
    </form>
  );
}
