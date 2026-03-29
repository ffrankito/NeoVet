"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button-variants";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createStaffMember, updateStaffMember } from "@/app/dashboard/settings/staff/actions";
import { useState } from "react";
import type { Staff } from "@/db/schema";

type FieldErrors = { name?: string[]; email?: string[]; password?: string[]; role?: string[] };
type ActionResult = { errors?: FieldErrors; error?: string; success?: boolean } | undefined;

interface Props {
  member?: Staff;
}

export function StaffForm({ member }: Props) {
  const isEdit = !!member;
  const router = useRouter();
  const [role, setRole] = useState(member?.role ?? "vet");

  const action = isEdit
    ? async (_prev: ActionResult, formData: FormData) => {
        formData.set("role", role);
        const result = await updateStaffMember(member!.id, formData);
        if (result?.success) router.push("/dashboard/settings/staff");
        return result;
      }
    : async (_prev: ActionResult, formData: FormData) => {
        formData.set("role", role);
        const result = await createStaffMember(formData);
        if (result?.success) router.push("/dashboard/settings/staff");
        return result;
      };

  const [result, dispatch, isPending] = useActionState<ActionResult, FormData>(action, undefined);

  const fieldErrors: FieldErrors = result && "errors" in result ? (result.errors as FieldErrors) ?? {} : {};
  const globalError = result && "error" in result ? result.error : null;

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
          defaultValue={member?.name ?? ""}
          placeholder="Nombre completo"
          aria-invalid={!!fieldErrors.name}
        />
        {fieldErrors.name?.[0] && <p className="text-sm text-destructive">{fieldErrors.name[0]}</p>}
      </div>

      {!isEdit && (
        <>
          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="nombre@neovet.com"
              aria-invalid={!!fieldErrors.email}
            />
            {fieldErrors.email?.[0] && <p className="text-sm text-destructive">{fieldErrors.email[0]}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Contraseña inicial *</Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="Mínimo 8 caracteres"
              aria-invalid={!!fieldErrors.password}
            />
            {fieldErrors.password?.[0] && <p className="text-sm text-destructive">{fieldErrors.password[0]}</p>}
          </div>
        </>
      )}

      <div className="space-y-2">
        <Label>Rol *</Label>
        <Select value={role} onValueChange={(v) => v && setRole(v)}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="admin" label="Admin">Admin — acceso completo</SelectItem>
            <SelectItem value="vet" label="Veterinario/a">Veterinario/a — historia clínica</SelectItem>
            <SelectItem value="groomer" label="Peluquero/a">Peluquero/a — peluquería</SelectItem>
          </SelectContent>
        </Select>
        {fieldErrors.role?.[0] && <p className="text-sm text-destructive">{fieldErrors.role[0]}</p>}
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Guardando..." : isEdit ? "Guardar cambios" : "Crear miembro"}
        </Button>
        <a href="/dashboard/settings/staff" className={buttonVariants({ variant: "outline" })}>
          Cancelar
        </a>
      </div>
    </form>
  );
}
