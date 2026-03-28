"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  createVaccination,
  updateVaccination,
  deleteVaccination,
} from "@/app/dashboard/patients/vaccination-actions";
import type { Vaccination } from "@/db/schema";

type ActionResult = { errors: Record<string, string[] | undefined> } | { error: string } | undefined;

function VaccinationForm({
  patientId,
  vaccination,
  onCancel,
}: {
  patientId: string;
  vaccination?: Vaccination;
  onCancel: () => void;
}) {
  const isEdit = !!vaccination;

  const action = async (_prev: ActionResult, formData: FormData) => {
    if (isEdit) return updateVaccination(vaccination.id, patientId, formData);
    return createVaccination(patientId, formData);
  };

  const [result, dispatch, isPending] = useActionState(action, undefined);

  const errors = (result && "errors" in result ? result.errors : {}) ?? {};
  const globalError = result && "error" in result ? result.error : null;

  return (
    <form action={dispatch} className="rounded-lg border p-4 space-y-4 bg-muted/30">
      {globalError && (
        <p className="text-sm text-destructive">{globalError}</p>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="vaccineName">Vacuna *</Label>
          <Input
            id="vaccineName"
            name="vaccineName"
            placeholder="Antirrábica"
            defaultValue={vaccination?.vaccineName ?? ""}
            aria-invalid={!!errors.vaccineName}
          />
          {errors.vaccineName && <p className="text-xs text-destructive">{errors.vaccineName[0]}</p>}
        </div>
        <div className="space-y-1">
          <Label htmlFor="batchNumber">N° de lote</Label>
          <Input
            id="batchNumber"
            name="batchNumber"
            placeholder="LOT-2024-001"
            defaultValue={vaccination?.batchNumber ?? ""}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="appliedAt">Fecha de aplicación *</Label>
          <Input
            id="appliedAt"
            name="appliedAt"
            type="date"
            defaultValue={vaccination?.appliedAt ?? ""}
            aria-invalid={!!errors.appliedAt}
          />
          {errors.appliedAt && <p className="text-xs text-destructive">{errors.appliedAt[0]}</p>}
        </div>
        <div className="space-y-1">
          <Label htmlFor="nextDueAt">Próximo refuerzo</Label>
          <Input
            id="nextDueAt"
            name="nextDueAt"
            type="date"
            defaultValue={vaccination?.nextDueAt ?? ""}
          />
        </div>
      </div>
      <div className="space-y-1">
        <Label htmlFor="notes">Notas</Label>
        <Textarea
          id="notes"
          name="notes"
          rows={2}
          placeholder="Observaciones opcionales..."
          defaultValue={vaccination?.notes ?? ""}
        />
      </div>
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending ? "Guardando..." : isEdit ? "Guardar cambios" : "Registrar vacuna"}
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}

function VaccinationRow({
  vaccination,
  patientId,
}: {
  vaccination: Vaccination;
  patientId: string;
}) {
  const [editing, setEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  if (editing) {
    return (
      <VaccinationForm
        patientId={patientId}
        vaccination={vaccination}
        onCancel={() => setEditing(false)}
      />
    );
  }

  return (
    <div className="flex items-start justify-between gap-4 rounded-lg border p-3">
      <div className="space-y-0.5">
        <p className="font-medium text-sm">{vaccination.vaccineName}</p>
        <p className="text-xs text-muted-foreground">
          Aplicada: {new Date(vaccination.appliedAt).toLocaleDateString("es-AR")}
          {vaccination.nextDueAt && (
            <> · Próximo: {new Date(vaccination.nextDueAt).toLocaleDateString("es-AR")}</>
          )}
          {vaccination.batchNumber && (
            <> · Lote: {vaccination.batchNumber}</>
          )}
        </p>
        {vaccination.notes && (
          <p className="text-xs text-muted-foreground">{vaccination.notes}</p>
        )}
      </div>
      <div className="flex gap-1 shrink-0">
        <Button size="sm" variant="ghost" onClick={() => setEditing(true)}>
          Editar
        </Button>
        <Button
          size="sm"
          variant="ghost"
          disabled={isDeleting}
          onClick={async () => {
            setIsDeleting(true);
            await deleteVaccination(vaccination.id, patientId);
          }}
          className="text-destructive hover:text-destructive"
        >
          Eliminar
        </Button>
      </div>
    </div>
  );
}

interface VaccinationSectionProps {
  patientId: string;
  vaccinations: Vaccination[];
}

export function VaccinationSection({ patientId, vaccinations }: VaccinationSectionProps) {
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Vacunas</h2>
        {!showForm && (
          <Button size="sm" variant="outline" onClick={() => setShowForm(true)}>
            + Agregar vacuna
          </Button>
        )}
      </div>

      {showForm && (
        <VaccinationForm patientId={patientId} onCancel={() => setShowForm(false)} />
      )}

      {vaccinations.length === 0 && !showForm ? (
        <div className="rounded-lg border border-dashed py-6 text-center text-sm text-muted-foreground">
          No hay vacunas registradas.
        </div>
      ) : (
        <div className="space-y-2">
          {vaccinations.map((v) => (
            <VaccinationRow key={v.id} vaccination={v} patientId={patientId} />
          ))}
        </div>
      )}
    </div>
  );
}
