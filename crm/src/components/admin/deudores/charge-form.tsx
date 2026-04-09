"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createCharge } from "@/app/dashboard/deudores/actions";

type ActionResult =
  | {
      errors?: Record<string, string | string[] | undefined>;
      error?: string;
    }
  | undefined;

interface ChargeFormProps {
  defaultClientId?: string;
  defaultClientName?: string;
}

export function ChargeForm({
  defaultClientId,
  defaultClientName,
}: ChargeFormProps) {
  const action = async (_prev: ActionResult, formData: FormData) =>
    createCharge(formData);
  const [result, dispatch, isPending] = useActionState(action, undefined);

  const error = result && "error" in result ? result.error : null;
  const errors =
    result && "errors" in result
      ? (result.errors ?? {})
      : ({} as Record<string, string | string[] | undefined>);

  return (
    <form action={dispatch} className="max-w-xl space-y-4">
      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Client ID */}
      {defaultClientId ? (
        <>
          <input type="hidden" name="clientId" value={defaultClientId} />
          {defaultClientName && (
            <p className="text-sm text-muted-foreground">
              Cliente:{" "}
              <span className="font-medium text-foreground">
                {defaultClientName}
              </span>
            </p>
          )}
        </>
      ) : (
        <div className="space-y-2">
          <Label htmlFor="clientId">ID del cliente *</Label>
          <Input
            id="clientId"
            name="clientId"
            required
            placeholder="cli_..."
            aria-invalid={!!errors?.clientId}
          />
          {errors?.clientId && (
            <p className="text-xs text-destructive">{errors.clientId}</p>
          )}
        </div>
      )}

      {/* Source type */}
      <div className="space-y-2">
        <Label htmlFor="sourceType">Tipo de cargo *</Label>
        <Select name="sourceType" required>
          <SelectTrigger id="sourceType" aria-invalid={!!errors?.sourceType}>
            <SelectValue placeholder="Seleccionar tipo..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="consultation">Consulta</SelectItem>
            <SelectItem value="grooming">Peluquería</SelectItem>
            <SelectItem value="procedure">Procedimiento</SelectItem>
            <SelectItem value="sale">Venta</SelectItem>
            <SelectItem value="hospitalization">Internación</SelectItem>
            <SelectItem value="other">Otro</SelectItem>
          </SelectContent>
        </Select>
        {errors?.sourceType && (
          <p className="text-xs text-destructive">{errors.sourceType}</p>
        )}
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">Descripción *</Label>
        <Textarea
          id="description"
          name="description"
          required
          placeholder="Descripción del cargo..."
          rows={3}
          aria-invalid={!!errors?.description}
        />
        {errors?.description && (
          <p className="text-xs text-destructive">{errors.description}</p>
        )}
      </div>

      {/* Amount */}
      <div className="space-y-2">
        <Label htmlFor="amount">Monto (ARS) *</Label>
        <Input
          id="amount"
          name="amount"
          type="number"
          min="0.01"
          step="0.01"
          required
          placeholder="0,00"
          aria-invalid={!!errors?.amount}
        />
        {errors?.amount && (
          <p className="text-xs text-destructive">{errors.amount}</p>
        )}
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Guardando..." : "Registrar cargo"}
        </Button>
        <Link
          href="/dashboard/deudores"
          className="inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-4 text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground"
        >
          Cancelar
        </Link>
      </div>
    </form>
  );
}
