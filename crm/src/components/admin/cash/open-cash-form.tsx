"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button-variants";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { openCashSession } from "@/app/dashboard/cash/actions";

type ActionResult = { errors?: { initialAmount?: string }; error?: string } | undefined;

export function OpenCashForm() {
  const action = async (_prev: ActionResult, formData: FormData) => openCashSession(formData);
  const [result, dispatch, isPending] = useActionState(action, undefined);

  const error = result && "error" in result ? result.error : null;
  const fieldError = result && "errors" in result ? result.errors?.initialAmount : null;

  return (
    <form action={dispatch} className="max-w-sm space-y-6">
      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="name">Nombre de la caja (opcional)</Label>
        <Input
          id="name"
          name="name"
          placeholder="Caja principal"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="initialAmount">Monto inicial en efectivo ($) *</Label>
        <Input
          id="initialAmount"
          name="initialAmount"
          type="number"
          step="0.01"
          min="0"
          defaultValue="0"
          aria-invalid={!!fieldError}
        />
        {fieldError && <p className="text-sm text-destructive">{fieldError}</p>}
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Abriendo..." : "Abrir caja"}
        </Button>
        <a href="/dashboard/cash" className={buttonVariants({ variant: "outline" })}>
          Cancelar
        </a>
      </div>
    </form>
  );
}
