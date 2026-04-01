"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { closeCashSession } from "@/app/dashboard/cash/actions";

type ActionResult = { errors?: { closingAmount?: string }; error?: string } | undefined;

interface CloseCashFormProps {
  sessionId: string;
}

export function CloseCashForm({ sessionId }: CloseCashFormProps) {
  const action = async (_prev: ActionResult, formData: FormData) =>
    closeCashSession(sessionId, formData);
  const [result, dispatch, isPending] = useActionState(action, undefined);

  const error = result && "error" in result ? result.error : null;
  const fieldError = result && "errors" in result ? result.errors?.closingAmount : null;

  return (
    <form action={dispatch} className="space-y-4">
      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="closingAmount">Efectivo contado ($) *</Label>
        <Input
          id="closingAmount"
          name="closingAmount"
          type="number"
          step="0.01"
          min="0"
          placeholder="0"
          aria-invalid={!!fieldError}
        />
        {fieldError && <p className="text-sm text-destructive">{fieldError}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="closeNotes">Notas de cierre</Label>
        <Textarea
          id="closeNotes"
          name="notes"
          placeholder="Observaciones del cierre..."
          rows={2}
        />
      </div>

      <Button type="submit" variant="destructive" disabled={isPending}>
        {isPending ? "Cerrando..." : "Cerrar caja"}
      </Button>
    </form>
  );
}
