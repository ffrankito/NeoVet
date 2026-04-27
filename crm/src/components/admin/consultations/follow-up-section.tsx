"use client";

import { useTransition, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createFollowUp, deleteFollowUp } from "@/app/dashboard/consultations/follow-up-actions";
import type { FollowUp } from "@/db/schema";
import { Trash2 } from "lucide-react";
import { todayARTAsDateString } from "@/lib/timezone";

type Props = {
  consultationId: string;
  patientId: string;
  followUps: FollowUp[];
};

export function FollowUpSection({ consultationId, patientId, followUps }: Props) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await createFollowUp(patientId, consultationId, formData);
      if ("errors" in result) {
        const messages = Object.values(result.errors).flat();
        setError(messages[0] ?? "Error al guardar.");
      }
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      await deleteFollowUp(id, consultationId);
    });
  }

  return (
    <div className="space-y-4">
      {followUps.length > 0 && (
        <div className="space-y-2">
          {followUps.map((fu) => (
            <div
              key={fu.id}
              className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm"
            >
              <div>
                <span className="font-medium">
                  {new Date(fu.scheduledDate + "T00:00:00").toLocaleDateString("es-AR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </span>
                <span className="ml-2 text-muted-foreground">— {fu.reason}</span>
                {fu.sentAt && (
                  <span className="ml-2 text-xs text-green-600">✓ Email enviado</span>
                )}
              </div>
              <button
                onClick={() => handleDelete(fu.id)}
                disabled={isPending}
                className="text-muted-foreground hover:text-destructive disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      <form action={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label htmlFor="scheduledDate">Fecha del control</Label>
            <Input
              id="scheduledDate"
              name="scheduledDate"
              type="date"
              min={todayARTAsDateString()}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="reason">Motivo</Label>
            <Input
              id="reason"
              name="reason"
              placeholder="Ej: Control post-cirugía"
            />
          </div>
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button type="submit" variant="outline" size="sm" disabled={isPending}>
          {isPending ? "Guardando..." : "+ Programar control"}
        </Button>
      </form>
    </div>
  );
}