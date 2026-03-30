"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

interface Item {
  key: string;
  description: string;
  medication: string;
  dose: string;
  frequency: string;
  durationDays: string;
}

interface TreatmentItemsInputProps {
  defaultItems?: {
    description: string;
    medication?: string | null;
    dose?: string | null;
    frequency?: string | null;
    durationDays?: number | null;
  }[];
}

export function TreatmentItemsInput({ defaultItems = [] }: TreatmentItemsInputProps) {
  const [items, setItems] = useState<Item[]>(
    defaultItems.map((item, i) => ({
      key: String(i),
      description: item.description,
      medication: item.medication ?? "",
      dose: item.dose ?? "",
      frequency: item.frequency ?? "",
      durationDays: item.durationDays != null ? String(item.durationDays) : "",
    })),
  );

  function addItem() {
    setItems((prev) => [
      ...prev,
      { key: crypto.randomUUID(), description: "", medication: "", dose: "", frequency: "", durationDays: "" },
    ]);
  }

  function removeItem(key: string) {
    setItems((prev) => prev.filter((item) => item.key !== key));
  }

  function updateItem(key: string, field: keyof Omit<Item, "key">, value: string) {
    setItems((prev) =>
      prev.map((item) => (item.key === key ? { ...item, [field]: value } : item)),
    );
  }

  const serialized = JSON.stringify(
    items.map(({ description, medication, dose, frequency, durationDays }) => ({
      description,
      medication: medication || null,
      dose: dose || null,
      frequency: frequency || null,
      durationDays: durationDays ? parseInt(durationDays, 10) : null,
    })),
  );

  return (
    <div className="space-y-4">
      <input type="hidden" name="treatmentItems" value={serialized} />

      {items.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No hay ítems de tratamiento. Hacé clic en &quot;Agregar ítem&quot; para añadir uno.
        </p>
      )}

      {items.map((item, index) => (
        <div key={item.key} className="rounded-lg border p-3 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">Ítem {index + 1}</span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => removeItem(item.key)}
              className="h-6 text-muted-foreground hover:text-destructive"
            >
              ✕
            </Button>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Descripción</Label>
            <Input
              value={item.description}
              onChange={(e) => updateItem(item.key, "description", e.target.value)}
              placeholder="Ej: Amoxicilina"
            />
          </div>

          <div className="grid gap-2 sm:grid-cols-3">
            <div className="space-y-1">
              <Label className="text-xs">Dosis</Label>
              <Input
                value={item.dose}
                onChange={(e) => updateItem(item.key, "dose", e.target.value)}
                placeholder="Ej: 5mg/kg"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Frecuencia</Label>
              <Input
                value={item.frequency}
                onChange={(e) => updateItem(item.key, "frequency", e.target.value)}
                placeholder="Ej: cada 12hs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Duración (días)</Label>
              <Input
                type="number"
                min={1}
                value={item.durationDays}
                onChange={(e) => updateItem(item.key, "durationDays", e.target.value)}
                placeholder="Ej: 7"
              />
            </div>
          </div>
        </div>
      ))}

      <Button type="button" variant="outline" size="sm" onClick={addItem}>
        + Agregar ítem
      </Button>
    </div>
  );
}