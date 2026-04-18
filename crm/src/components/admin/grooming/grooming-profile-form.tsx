"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { upsertGroomingProfile, type GroomingProfileData } from "@/app/dashboard/grooming/actions";

type ActionResult = { success?: boolean; errors?: Record<string, string[]> } | undefined;

interface Props {
  patientId: string;
  profile: GroomingProfileData | null;
}

export function GroomingProfileForm({ patientId, profile }: Props) {
  const action = async (_prev: ActionResult, formData: FormData) =>
    upsertGroomingProfile(patientId, formData);

  const [result, dispatch, isPending] = useActionState(action, undefined);

  return (
    <form action={dispatch} className="space-y-4 rounded-lg border p-4">
      {result?.success && (
        <p className="text-sm text-green-600">Perfil actualizado.</p>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="behaviorScore">Comportamiento (1–10)</Label>
          <Input
            id="behaviorScore"
            name="behaviorScore"
            type="number"
            min={1}
            max={10}
            defaultValue={profile?.behaviorScore ?? ""}
            placeholder="—"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="coatType">Tipo de pelaje</Label>
          <Input
            id="coatType"
            name="coatType"
            defaultValue={profile?.coatType ?? ""}
            placeholder="Liso, rizado, doble capa..."
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="estimatedMinutes">Tiempo estimado (min)</Label>
          <Input
            id="estimatedMinutes"
            name="estimatedMinutes"
            type="number"
            min={5}
            defaultValue={profile?.estimatedMinutes ?? ""}
            placeholder="—"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="coatDifficulties">Dificultades del pelaje</Label>
        <Input
          id="coatDifficulties"
          name="coatDifficulties"
          defaultValue={profile?.coatDifficulties ?? ""}
          placeholder="Nudos, doble capa, etc."
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="behaviorNotes">Notas de comportamiento</Label>
        <Textarea
          id="behaviorNotes"
          name="behaviorNotes"
          defaultValue={profile?.behaviorNotes ?? ""}
          placeholder="Se porta bien, necesita bozal, muerde las tijeras..."
          rows={2}
        />
      </div>

      <Button type="submit" size="sm" disabled={isPending}>
        {isPending ? "Guardando..." : "Guardar perfil"}
      </Button>
    </form>
  );
}
