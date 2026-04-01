"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button-variants";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createProvider, updateProvider } from "@/app/dashboard/petshop/providers/actions";
import type { Provider } from "@/db/schema";

type FieldErrors = { name?: string; email?: string };
type ActionResult = { errors: FieldErrors } | { error: string } | undefined;

function getFieldErrors(result: ActionResult): FieldErrors {
  if (result && "errors" in result) return result.errors;
  return {};
}

function getGlobalError(result: ActionResult): string | null {
  if (result && "error" in result) return result.error;
  return null;
}

interface ProviderFormProps {
  provider?: Provider;
}

export function ProviderForm({ provider }: ProviderFormProps) {
  const isEdit = !!provider;

  const action = isEdit
    ? async (_prev: ActionResult, formData: FormData) => updateProvider(provider!.id, formData)
    : async (_prev: ActionResult, formData: FormData) => createProvider(formData);

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
          defaultValue={provider?.name ?? ""}
          placeholder="Distribuidora Ejemplo S.A."
          aria-invalid={!!errors.name}
        />
        {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">Teléfono</Label>
        <Input
          id="phone"
          name="phone"
          type="tel"
          defaultValue={provider?.phone ?? ""}
          placeholder="+54 341 123 4567"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          defaultValue={provider?.email ?? ""}
          placeholder="contacto@proveedor.com"
          aria-invalid={!!errors.email}
        />
        {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">Dirección</Label>
        <Input
          id="address"
          name="address"
          defaultValue={provider?.address ?? ""}
          placeholder="Av. Belgrano 1234, Rosario"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="cuit">CUIT</Label>
        <Input
          id="cuit"
          name="cuit"
          defaultValue={provider?.cuit ?? ""}
          placeholder="30-12345678-9"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notas</Label>
        <Textarea
          id="notes"
          name="notes"
          defaultValue={provider?.notes ?? ""}
          placeholder="Condiciones de pago, contacto preferido, etc."
          rows={3}
        />
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending
            ? isEdit ? "Guardando..." : "Creando..."
            : isEdit ? "Guardar cambios" : "Crear proveedor"}
        </Button>
        <a
          href={isEdit ? `/dashboard/petshop/providers/${provider!.id}` : "/dashboard/petshop/providers"}
          className={buttonVariants({ variant: "outline" })}
        >
          Cancelar
        </a>
      </div>
    </form>
  );
}
