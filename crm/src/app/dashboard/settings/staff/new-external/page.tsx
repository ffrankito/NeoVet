"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createExternalSpecialist } from "../actions";

type ActionResult =
  | { errors?: Record<string, string | string[] | undefined>; error?: string; success?: boolean }
  | undefined;

export default function NewExternalSpecialistPage() {
  const [result, dispatch, isPending] = useActionState(
    (_prev: ActionResult, formData: FormData) => createExternalSpecialist(formData),
    undefined
  );

  const error = result && "error" in result ? result.error : null;
  const errors =
    result && "errors" in result
      ? (result.errors ?? {})
      : ({} as Record<string, string | string[] | undefined>);

  if (result?.success) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Especialista creado</h1>
          <p className="text-muted-foreground mt-2">
            El especialista externo fue registrado. Ahora aparecerá en las listas de personal para procedimientos.
          </p>
        </div>
        <Link
          href="/dashboard/settings/staff"
          className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90"
        >
          Volver al equipo
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/dashboard/settings/staff"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Volver al equipo
        </Link>
        <h1 className="mt-4 text-2xl font-bold tracking-tight">Nuevo especialista externo</h1>
        <p className="text-muted-foreground">
          Registrá un especialista externo (cardiólogo, dermatólogo, etc.) que no necesita acceso al sistema.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <form action={dispatch} className="max-w-md space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Nombre *</Label>
          <Input
            id="name"
            name="name"
            required
            placeholder="Dr./Dra. Nombre Apellido"
            aria-invalid={!!errors?.name}
          />
          {errors?.name && (
            <p className="text-xs text-destructive">{errors.name}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="licenseNumber">Matrícula</Label>
          <Input
            id="licenseNumber"
            name="licenseNumber"
            placeholder="Número de matrícula (opcional)"
          />
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="submit" disabled={isPending}>
            {isPending ? "Guardando..." : "Registrar especialista"}
          </Button>
          <Link
            href="/dashboard/settings/staff"
            className="inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-4 text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground"
          >
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  );
}
