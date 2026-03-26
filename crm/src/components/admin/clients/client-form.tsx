"use client";

import { useState } from "react";
import { buttonVariants } from "@/components/ui/button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient, updateClient } from "@/app/dashboard/clients/actions";
import type { Client } from "@/db/schema";

interface ClientFormProps {
  client?: Client;
}

export function ClientForm({ client }: ClientFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const isEdit = !!client;

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    const result = isEdit
      ? await updateClient(client!.id, formData)
      : await createClient(formData);
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
        <Label htmlFor="name">Nombre completo *</Label>
        <Input
          id="name"
          name="name"
          required
          defaultValue={client?.name ?? ""}
          placeholder="Juan Pérez"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">Teléfono (WhatsApp) *</Label>
        <Input
          id="phone"
          name="phone"
          type="tel"
          required
          defaultValue={client?.phone ?? ""}
          placeholder="+54 341 123 4567"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          defaultValue={client?.email ?? ""}
          placeholder="juan@email.com"
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
              : "Crear cliente"}
        </Button>
        <a
          href={isEdit ? `/dashboard/clients/${client!.id}` : "/dashboard/clients"}
          className={buttonVariants({ variant: "outline" })}
        >
          Cancelar
        </a>
      </div>
    </form>
  );
}
