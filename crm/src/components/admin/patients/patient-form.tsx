"use client";

import { useActionState, useRef, useState } from "react";
import { buttonVariants } from "@/components/ui/button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createPatient, updatePatient, uploadPatientAvatar } from "@/app/dashboard/patients/actions";
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

const MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024; // 2 MB
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];


interface PatientFormProps {
  patient?: Patient;
  clientId: string;
}

export function PatientForm({ patient, clientId }: PatientFormProps) {
  const isEdit = !!patient;
  const [species, setSpecies] = useState(patient?.species ?? "");

  // Edit-only state
  const [fileError, setFileError] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editFieldErrors, setEditFieldErrors] = useState<FieldErrors>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  // --- CREATE path: keep original useActionState pattern ---
  const createAction = async (_prev: ActionResult, formData: FormData) => {
    formData.set("species", species);
    formData.set("clientId", clientId);
    return createPatient(formData);
  };

  const [createResult, createDispatch, isCreatePending] = useActionState(
    createAction,
    undefined,
  );

  // --- EDIT path: manual submit handler ---
  async function handleEditSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFileError(null);
    setUploadError(null);
    setEditFieldErrors({});

    const form = e.currentTarget;
    const formData = new FormData(form);
    formData.set("species", species);

    const file = fileInputRef.current?.files?.[0] ?? null;

    // Client-side file validation
    if (file) {
      if (file.size > MAX_FILE_SIZE_BYTES) {
        setFileError("La imagen no puede superar 2 MB.");
        return;
      }
      if (!ALLOWED_MIME_TYPES.includes(file.type)) {
        setFileError("Solo se aceptan imágenes JPG, PNG o WebP.");
        return;
      }
    }

    setIsSubmitting(true);

    let newAvatarUrl: string | null | undefined = undefined;

    if (file) {
      const avatarFormData = new FormData();
      avatarFormData.set("avatar", file);
      const uploadResult = await uploadPatientAvatar(patient!.id, avatarFormData);
      if ("error" in uploadResult) {
        setUploadError(uploadResult.error ?? null);
        setIsSubmitting(false);
        return;
      }
      newAvatarUrl = uploadResult.url;
    }

    const result = await updatePatient(patient!.id, formData, newAvatarUrl);
    setIsSubmitting(false);

    if (!result) {
      // redirect() was called inside the action — navigation handled server-side
      return;
    }

    if ("errors" in result) {
      setEditFieldErrors(result.errors as FieldErrors);
      return;
    }

    if ("error" in result) {
      setUploadError(result.error);
      return;
    }

    // Successful update without redirect (shouldn't happen given current action,
    // but handle gracefully)
    window.location.href = `/dashboard/patients/${patient!.id}`;
  }

  // --- Shared field error / global error sources ---
  const errors = isEdit ? editFieldErrors : getFieldErrors(createResult);
  const globalError = isEdit
    ? (uploadError ?? null)
    : getGlobalError(createResult);
  const isPending = isEdit ? isSubmitting : isCreatePending;

  // --- CREATE form ---
  if (!isEdit) {
    return (
      <form action={createDispatch} className="max-w-lg space-y-6">
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
            defaultValue=""
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
            defaultValue=""
            placeholder="Bulldog Inglés"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="dateOfBirth">Fecha de nacimiento</Label>
          <Input
            id="dateOfBirth"
            name="dateOfBirth"
            type="date"
            defaultValue=""
            aria-invalid={!!errors.dateOfBirth}
          />
          {errors.dateOfBirth && (
            <p className="text-sm text-destructive mt-1">{errors.dateOfBirth}</p>
          )}
        </div>

        <div className="flex items-center gap-2">
          <input
            id="neutered-create"
            type="checkbox"
            name="neutered"
            value="true"
            className="size-4 rounded border-gray-300"
          />
          <Label htmlFor="neutered-create">Castrado/a</Label>
        </div>

        <div className="flex gap-3">
          <Button type="submit" disabled={isPending}>
            {isPending ? "Creando..." : "Registrar mascota"}
          </Button>
          <a
            href={`/dashboard/clients/${clientId}`}
            className={buttonVariants({ variant: "outline" })}
          >
            Cancelar
          </a>
        </div>
      </form>
    );
  }

  // --- EDIT form ---
  return (
    <form
      ref={formRef}
      onSubmit={handleEditSubmit}
      className="max-w-lg space-y-6"
    >
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
          defaultValue={patient.name}
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
          defaultValue={patient.breed ?? ""}
          placeholder="Bulldog Inglés"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="dateOfBirth">Fecha de nacimiento</Label>
        <Input
          id="dateOfBirth"
          name="dateOfBirth"
          type="date"
          defaultValue={patient.dateOfBirth ?? ""}
          aria-invalid={!!errors.dateOfBirth}
        />
        {errors.dateOfBirth && (
          <p className="text-sm text-destructive mt-1">{errors.dateOfBirth}</p>
        )}
      </div>

      {/* Avatar upload */}
      <div className="space-y-2">
        <Label htmlFor="avatar">Foto del paciente</Label>
        {patient.avatarUrl && (
          <div className="mb-2">
            <img
              src={patient.avatarUrl}
              alt={patient.name}
              className="size-16 rounded-full object-cover"
            />
          </div>
        )}
        <Input
          id="avatar"
          name="avatar"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          ref={fileInputRef}
          onChange={() => setFileError(null)}
        />
        {fileError && (
          <p className="text-sm text-destructive mt-1">{fileError}</p>
        )}
      </div>

      {/* Neutered toggle */}
      <div className="flex items-center gap-2">
        <input
          id="neutered"
          type="checkbox"
          name="neutered"
          value="true"
          defaultChecked={patient.neutered ?? false}
          className="size-4 rounded border-gray-300"
        />
        <Label htmlFor="neutered">Castrado/a</Label>
      </div>

      {/* Deceased toggle */}
      <div className="space-y-3 border-t pt-4">
        <div className="flex items-center gap-2">
          <input
            id="deceased"
            type="checkbox"
            name="deceased"
            value="true"
            defaultChecked={patient.deceased ?? false}
            className="size-4 rounded border-gray-300 accent-destructive"
          />
          <Label htmlFor="deceased">Paciente fallecido</Label>
        </div>
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Guardando..." : "Guardar cambios"}
        </Button>
        <a
          href={`/dashboard/patients/${patient.id}`}
          className={buttonVariants({ variant: "outline" })}
        >
          Cancelar
        </a>
      </div>
    </form>
  );
}
