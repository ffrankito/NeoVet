"use client";

import { useState } from "react";
import { buttonVariants } from "@/components/ui/button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createPatient, updatePatient } from "@/app/dashboard/patients/actions";
import type { Patient } from "@/db/schema";

interface PatientFormProps {
  patient?: Patient;
  clientId: string;
}

export function PatientForm({ patient, clientId }: PatientFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [species, setSpecies] = useState(patient?.species ?? "");
  const isEdit = !!patient;

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    formData.set("species", species);
    if (!isEdit) formData.set("clientId", clientId);
    const result = isEdit
      ? await updatePatient(patient!.id, formData)
      : await createPatient(formData);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  return (
    <form action={handleSubmit} className="max-w-lg space-y-6">
      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="name">Nombre de la mascota *</Label>
        <Input
          id="name"
          name="name"
          required
          defaultValue={patient?.name ?? ""}
          placeholder="Luna"
        />
      </div>

      <div className="space-y-2">
        <Label>Especie *</Label>
        <Select value={species} onValueChange={(v) => v && setSpecies(v)} required>
          <SelectTrigger>
            <SelectValue placeholder="Seleccioná la especie" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="perro">Perro</SelectItem>
            <SelectItem value="gato">Gato</SelectItem>
            <SelectItem value="otro">Otro</SelectItem>
          </SelectContent>
        </Select>
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
        />
      </div>

      <div className="flex gap-3">
        <Button disabled={loading}>
          {loading
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
