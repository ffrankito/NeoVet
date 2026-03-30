"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button-variants";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createService, updateService } from "@/app/dashboard/settings/services/actions";
import type { Service } from "@/db/schema";

const CATEGORY_LABELS: Record<string, string> = {
  cirugia: "Cirugía",
  consulta: "Consulta",
  reproduccion: "Reproducción",
  cardiologia: "Cardiología",
  peluqueria: "Peluquería",
  vacunacion: "Vacunación",
  petshop: "Pet Shop",
  otro: "Otro",
};

type FieldErrors = Record<string, string[] | undefined>;
type ActionResult =
  | { errors?: FieldErrors; error?: string; success?: boolean }
  | undefined;

interface Props {
  service?: Service;
}

export function ServiceForm({ service }: Props) {
  const isEdit = !!service;
  const router = useRouter();
  const [category, setCategory] = useState(service?.category ?? "consulta");

  const action = async (_prev: ActionResult, formData: FormData) => {
    formData.set("category", category);
    const result = isEdit
      ? await updateService(service!.id, formData)
      : await createService(formData);
    if (result?.success) router.push("/dashboard/settings/services");
    return result;
  };

  const [result, dispatch, isPending] = useActionState<ActionResult, FormData>(
    action,
    undefined
  );

  const fieldErrors =
    result && "errors" in result ? (result.errors ?? {}) : {};
  const globalError =
    result && "error" in result ? result.error : null;

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
          defaultValue={service?.name ?? ""}
          placeholder="Ej: Consulta general"
          aria-invalid={!!fieldErrors.name}
        />
        {fieldErrors.name?.[0] && (
          <p className="text-sm text-destructive">{fieldErrors.name[0]}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label>Categoría *</Label>
        <Select value={category} onValueChange={(v) => v && setCategory(v)}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value} label={label}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="defaultDurationMinutes">
          Duración por defecto (minutos) *
        </Label>
        <Input
          id="defaultDurationMinutes"
          name="defaultDurationMinutes"
          type="number"
          min={5}
          defaultValue={service?.defaultDurationMinutes ?? 30}
          aria-invalid={!!fieldErrors.defaultDurationMinutes}
        />
        {fieldErrors.defaultDurationMinutes?.[0] && (
          <p className="text-sm text-destructive">
            {fieldErrors.defaultDurationMinutes[0]}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="blockDurationMinutes">
          Bloqueo extra post-servicio (minutos)
        </Label>
        <p className="text-xs text-muted-foreground">
          Solo para cirugías. El calendario bloqueará este tiempo adicional
          después del turno.
        </p>
        <Input
          id="blockDurationMinutes"
          name="blockDurationMinutes"
          type="number"
          min={0}
          defaultValue={service?.blockDurationMinutes ?? ""}
          placeholder="—"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="basePrice">Precio base (opcional)</Label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
            $
          </span>
          <Input
            id="basePrice"
            name="basePrice"
            type="number"
            min={0}
            step="0.01"
            defaultValue={service?.basePrice ?? ""}
            placeholder="0.00"
            className="pl-7"
          />
        </div>
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending
            ? isEdit
              ? "Guardando..."
              : "Creando..."
            : isEdit
              ? "Guardar cambios"
              : "Crear servicio"}
        </Button>
        
          <a href="/dashboard/settings/services" className={buttonVariants({ variant: "outline" })}>
          Cancelar
        </a>
      </div>
    </form>
  );
}