"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  createDeworming,
  updateDeworming,
  deleteDeworming,
} from "@/app/dashboard/patients/deworming-actions";
import type { DewormingRecord } from "@/db/schema";

type ActionResult = { errors: Record<string, string[] | undefined> } | { error: string } | undefined;

function DewormingForm({
  patientId,
  record,
  onCancel,
}: {
  patientId: string;
  record?: DewormingRecord;
  onCancel: () => void;
}) {
  const isEdit = !!record;

  const action = async (_prev: ActionResult, formData: FormData) => {
    if (isEdit) return updateDeworming(record.id, patientId, formData);
    return createDeworming(patientId, formData);
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
          <Label htmlFor="product">Producto *</Label>
          <Input
            id="product"
            name="product"
            placeholder="Bravecto, Nexgard..."
            defaultValue={record?.product ?? ""}
            aria-invalid={!!errors.product}
          />
          {errors.product && <p className="text-xs text-destructive">{errors.product[0]}</p>}
        </div>
        <div className="space-y-1">
          <Label htmlFor="dose">Dosis</Label>
          <Input
            id="dose"
            name="dose"
            placeholder="1 comprimido, 2.5ml..."
            defaultValue={record?.dose ?? ""}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="appliedAt">Fecha de aplicación *</Label>
          <Input
            id="appliedAt"
            name="appliedAt"
            type="date"
            defaultValue={record?.appliedAt ?? ""}
            aria-invalid={!!errors.appliedAt}
          />
          {errors.appliedAt && <p className="text-xs text-destructive">{errors.appliedAt[0]}</p>}
        </div>
        <div className="space-y-1">
          <Label htmlFor="nextDueAt">Próxima aplicación</Label>
          <Input
            id="nextDueAt"
            name="nextDueAt"
            type="date"
            defaultValue={record?.nextDueAt ?? ""}
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
          defaultValue={record?.notes ?? ""}
        />
      </div>
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending ? "Guardando..." : isEdit ? "Guardar cambios" : "Registrar desparasitación"}
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}

function DewormingRow({
  record,
  patientId,
}: {
  record: DewormingRecord;
  patientId: string;
}) {
  const [editing, setEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  if (editing) {
    return (
      <DewormingForm
        patientId={patientId}
        record={record}
        onCancel={() => setEditing(false)}
      />
    );
  }

  return (
    <div className="flex items-start justify-between gap-4 rounded-lg border p-3">
      <div className="space-y-0.5">
        <p className="font-medium text-sm">{record.product}</p>
        <p className="text-xs text-muted-foreground">
          Aplicada: {new Date(record.appliedAt).toLocaleDateString("es-AR")}
          {record.nextDueAt && (
            <> · Próxima: {new Date(record.nextDueAt).toLocaleDateString("es-AR")}</>
          )}
          {record.dose && <> · Dosis: {record.dose}</>}
        </p>
        {record.notes && (
          <p className="text-xs text-muted-foreground">{record.notes}</p>
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
            await deleteDeworming(record.id, patientId);
          }}
          className="text-destructive hover:text-destructive"
        >
          Eliminar
        </Button>
      </div>
    </div>
  );
}

interface DewormingSectionProps {
  patientId: string;
  records: DewormingRecord[];
}

export function DewormingSection({ patientId, records }: DewormingSectionProps) {
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Desparasitaciones</h2>
        {!showForm && (
          <Button size="sm" variant="outline" onClick={() => setShowForm(true)}>
            + Agregar desparasitación
          </Button>
        )}
      </div>

      {showForm && (
        <DewormingForm patientId={patientId} onCancel={() => setShowForm(false)} />
      )}

      {records.length === 0 && !showForm ? (
        <div className="rounded-lg border border-dashed py-6 text-center text-sm text-muted-foreground">
          No hay desparasitaciones registradas.
        </div>
      ) : (
        <div className="space-y-2">
          {records.map((r) => (
            <DewormingRow key={r.id} record={r} patientId={patientId} />
          ))}
        </div>
      )}
    </div>
  );
}
