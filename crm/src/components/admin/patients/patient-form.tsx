"use client";

import { useActionState, useState } from "react";
import { buttonVariants } from "@/components/ui/button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createPatient, updatePatient } from "@/app/dashboard/patients/actions";
import type { Patient } from "@/db/schema";

type FieldErrors = { name?: string; species?: string; clientId?: string; dateOfBirth?: string };
type ActionResult =
  | { errors: FieldErrors }
  | { error: string }
  | undefined;

function getFieldErrors(result: ActionResult): FieldErrors {
  if (result && "errors" in result) return result.errors;
  return {};
}

function getGlobalError(result: ActionResult): string | null {
  if (result && "error" in result) return result.error;
  return null;
}

interface PatientFormProps {
  patient?: Patient;
  clientId: string;
}

export function PatientForm({ patient, clientId }: PatientFormProps) {
  const isEdit = !!patient;
  const [species, setSpecies] = useState(patient?.species ?? "");

  const action = isEdit
    ? async (_prev: ActionResult, formData: FormData) => {
        formData.set("species", species);
        return updatePatient(patient!.id, formData);
      }
    : async (_prev: ActionResult, formData: FormData) => {
        formData.set("species", species);
        formData.set("clientId", clientId);
        return createPatient(formData);
      };

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
        <Label htmlFor="name">Nombre de la mascota *</Label>
        <Input
          id="name"
          name="name"
          defaultValue={patient?.name ?? ""}
          placeholder="Luna"
          aria-invalid={!!errors.name}
        />
        {errors.name && (
          <p className="text-sm text-destructive mt-1">{errors.name}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label>Especie *</Label>
        <Select value={species} onValueChange={(v) => v && setSpecies(v)}>
          <SelectTrigger aria-invalid={!!errors.species}>
            <SelectValue placeholder="Seleccioná la especie" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="perro" label="Perro">Perro</SelectItem>
            <SelectItem value="gato" label="Gato">Gato</SelectItem>
            <SelectItem value="otro" label="Otro">Otro</SelectItem>
          </SelectContent>
        </Select>
        {errors.species && (
          <p className="text-sm text-destructive mt-1">{errors.species}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="breed">Raza</Label>
        <Input
          id="breed"
          name="breed"
          defaultValue={patient?.breed ?? ""}
          placeholder="Bulldog Inglés"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="dateOfBirth">Fecha de nacimiento</Label>
        <Input
          id="dateOfBirth"
          name="dateOfBirth"
          type="date"
          defaultValue={patient?.dateOfBirth ?? ""}
          aria-invalid={!!errors.dateOfBirth}
        />
        {errors.dateOfBirth && (
          <p className="text-sm text-destructive mt-1">{errors.dateOfBirth}</p>
        )}
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending
            ? isEdit
              ? "Guardando..."
              : "Creando..."
            : isEdit
              ? "Guardar cambios"
              : "Registrar mascota"}
        </Button>
        <a
          href={isEdit ? `/dashboard/patients/${patient!.id}` : `/dashboard/clients/${clientId}`}
          className={buttonVariants({ variant: "outline" })}
        >
          Cancelar
        </a>
      </div>
    </form>
  );
}
