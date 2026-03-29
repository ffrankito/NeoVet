"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createComplementaryMethod, deleteComplementaryMethod } from "@/app/dashboard/consultations/complementary-actions";
import type { ComplementaryMethod } from "@/db/schema";

interface ComplementaryMethodsSectionProps {
  consultationId: string;
  methods: ComplementaryMethod[];
}

export function ComplementaryMethodsSection({ consultationId, methods }: ComplementaryMethodsSectionProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setError(null);

    startTransition(async () => {
      const result = await createComplementaryMethod(consultationId, formData);
      if (result && "error" in result) {
        setError(result.error ?? null);
        return;
      }
      setIsAdding(false);
      (e.target as HTMLFormElement).reset();
    });
  }

  function handleDelete(id: string) {
    if (!confirm("¿Eliminar este método complementario?")) return;
    startTransition(async () => {
      await deleteComplementaryMethod(id, consultationId);
    });
  }

  return (
    <div className="space-y-3">
      {methods.length === 0 && !isAdding && (
        <p className="text-sm text-muted-foreground">No hay métodos complementarios registrados.</p>
      )}

      {methods.map((method) => (
        <div key={method.id} className="rounded-lg border p-3 space-y-1">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">{method.studyType}</p>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => handleDelete(method.id)}
              disabled={isPending}
              className="h-6 text-muted-foreground hover:text-destructive"
            >
              Eliminar
            </Button>
          </div>
          <p className="whitespace-pre-wrap text-sm text-muted-foreground">{method.content}</p>
          <p className="text-xs text-muted-foreground">
            {new Date(method.createdAt).toLocaleDateString("es-AR", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </p>
        </div>
      ))}

      {isAdding ? (
        <form onSubmit={handleSubmit} className="rounded-lg border p-3 space-y-3">
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="space-y-1">
            <Label htmlFor="studyType" className="text-xs">Tipo de estudio</Label>
            <Input
              id="studyType"
              name="studyType"
              placeholder="Ej: Hemograma, Ecografía, Rx tórax"
              required
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="content" className="text-xs">Informe</Label>
            <Textarea
              id="content"
              name="content"
              placeholder="Resultados e interpretación..."
              rows={4}
              required
            />
          </div>
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={isPending}>
              {isPending ? "Guardando..." : "Guardar"}
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={() => setIsAdding(false)}>
              Cancelar
            </Button>
          </div>
        </form>
      ) : (
        <Button type="button" variant="outline" size="sm" onClick={() => setIsAdding(true)}>
          + Agregar método complementario
        </Button>
      )}
    </div>
  );
}
