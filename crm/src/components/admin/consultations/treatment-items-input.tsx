"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface Item {
  key: string; // local-only key for React rendering
  description: string;
}

interface TreatmentItemsInputProps {
  defaultItems?: { description: string }[];
}

export function TreatmentItemsInput({ defaultItems = [] }: TreatmentItemsInputProps) {
  const [items, setItems] = useState<Item[]>(
    defaultItems.map((item, i) => ({ key: String(i), description: item.description })),
  );

  function addItem() {
    setItems((prev) => [...prev, { key: crypto.randomUUID(), description: "" }]);
  }

  function removeItem(key: string) {
    setItems((prev) => prev.filter((item) => item.key !== key));
  }

  function updateItem(key: string, description: string) {
    setItems((prev) =>
      prev.map((item) => (item.key === key ? { ...item, description } : item)),
    );
  }

  // Serialize the list as JSON into a hidden input so the server action can read it
  const serialized = JSON.stringify(items.map(({ description }) => ({ description })));

  return (
    <div className="space-y-3">
      <input type="hidden" name="treatmentItems" value={serialized} />

      {items.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No hay ítems de tratamiento. Hacé clic en "Agregar ítem" para añadir uno.
        </p>
      )}

      {items.map((item, index) => (
        <div key={item.key} className="flex items-center gap-2">
          <span className="w-5 shrink-0 text-right text-sm text-muted-foreground">
            {index + 1}.
          </span>
          <Input
            value={item.description}
            onChange={(e) => updateItem(item.key, e.target.value)}
            placeholder="Ej: Amoxicilina 500mg cada 12hs por 7 días"
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => removeItem(item.key)}
            className="shrink-0 text-muted-foreground hover:text-destructive"
          >
            ✕
          </Button>
        </div>
      ))}

      <Button type="button" variant="outline" size="sm" onClick={addItem}>
        + Agregar ítem
      </Button>
    </div>
  );
}
