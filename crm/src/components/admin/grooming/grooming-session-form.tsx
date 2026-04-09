"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button-variants";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createGroomingSession } from "@/app/dashboard/grooming/actions";

const FINDINGS = [
  { value: "pulgas", label: "Pulgas" },
  { value: "garrapatas", label: "Garrapatas" },
  { value: "tumores", label: "Tumores" },
  { value: "otitis", label: "Otitis" },
  { value: "dermatitis", label: "Dermatitis" },
];

type ActionResult = { success?: boolean; errors?: Record<string, string[]>; error?: string } | undefined;

type EsteticaService = {
  id: string;
  name: string;
  basePrice: string | null;
};

interface Props {
  patientId: string;
  appointmentId: string | null;
  groomers: { id: string; name: string }[];
  esteticaServices: EsteticaService[];
}

export function GroomingSessionForm({ patientId, appointmentId, groomers, esteticaServices }: Props) {
  const router = useRouter();
  const [serviceId, setServiceId] = useState("");
  const [groomedById, setGroomedById] = useState("");
  const [selectedFindings, setSelectedFindings] = useState<string[]>([]);

  const selectedService = esteticaServices.find((s) => s.id === serviceId);

  function toggleFinding(value: string) {
    setSelectedFindings((prev) =>
      prev.includes(value) ? prev.filter((f) => f !== value) : [...prev, value]
    );
  }

  const action = async (_prev: ActionResult, formData: FormData) => {
    formData.set("groomedById", groomedById);
    formData.set("serviceId", serviceId);
    selectedFindings.forEach((f) => formData.append("findings", f));
    const result = await createGroomingSession(patientId, appointmentId, formData);
    if (result?.success) {
      router.push(`/dashboard/patients/${patientId}?tab=estetica`);
    }
    return result;
  };

  const [result, dispatch, isPending] = useActionState<ActionResult, FormData>(action, undefined);
  const fieldErrors = result && "errors" in result ? (result.errors ?? {}) : {};
  const globalError = result && "error" in result ? (result.error as string) : null;

  return (
    <form action={dispatch} className="max-w-lg space-y-6">
      {globalError && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {globalError}
        </div>
      )}

      <div className="space-y-2">
        <Label>Esteticista *</Label>
        <Select value={groomedById} onValueChange={(v) => v && setGroomedById(v)}>
          <SelectTrigger className="w-full" aria-invalid={!!fieldErrors.groomedById}>
            <SelectValue placeholder="Seleccioná un/a esteticista" />
          </SelectTrigger>
          <SelectContent>
            {groomers.map((g) => (
              <SelectItem key={g.id} value={g.id} label={g.name}>{g.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {fieldErrors.groomedById?.[0] && (
          <p className="text-sm text-destructive">{fieldErrors.groomedById[0]}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label>Tipo de servicio *</Label>
        <Select value={serviceId} onValueChange={(v) => v && setServiceId(v)}>
          <SelectTrigger className="w-full" aria-invalid={!!fieldErrors.serviceId}>
            <SelectValue placeholder="Seleccioná un servicio" />
          </SelectTrigger>
          <SelectContent>
            {esteticaServices.map((s) => (
              <SelectItem key={s.id} value={s.id} label={s.name}>
                {s.name}{s.basePrice ? ` — $${s.basePrice}` : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {fieldErrors.serviceId?.[0] && (
          <p className="text-sm text-destructive">{fieldErrors.serviceId[0]}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="finalPrice">Precio final</Label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
          <Input
            id="finalPrice"
            name="finalPrice"
            type="number"
            min={0}
            step="0.01"
            defaultValue={selectedService?.basePrice ?? ""}
            key={serviceId}
            className="pl-7"
            placeholder="0.00"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="paymentMethod">Método de pago</Label>
        <Select name="paymentMethod" defaultValue="efectivo">
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="efectivo" label="Efectivo">Efectivo</SelectItem>
            <SelectItem value="transferencia" label="Transferencia">Transferencia</SelectItem>
            <SelectItem value="tarjeta_debito" label="Tarjeta débito">Tarjeta débito</SelectItem>
            <SelectItem value="tarjeta_credito" label="Tarjeta crédito">Tarjeta crédito</SelectItem>
            <SelectItem value="mercadopago" label="MercadoPago">MercadoPago</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3">
        <Label>Hallazgos</Label>
        <div className="flex flex-wrap gap-2">
          {FINDINGS.map((f) => {
            const selected = selectedFindings.includes(f.value);
            return (
              <button
                key={f.value}
                type="button"
                onClick={() => toggleFinding(f.value)}
                className={`rounded-full border px-3 py-1 text-sm transition-colors ${
                  selected
                    ? "border-orange-400 bg-orange-100 text-orange-800"
                    : "border-input bg-background text-muted-foreground hover:border-orange-300"
                }`}
              >
                {f.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="beforePhoto">Foto antes</Label>
        <Input id="beforePhoto" name="beforePhoto" type="file" accept="image/jpeg,image/png,image/webp" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="afterPhoto">Foto después</Label>
        <Input id="afterPhoto" name="afterPhoto" type="file" accept="image/jpeg,image/png,image/webp" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Observaciones</Label>
        <Textarea
          id="notes"
          name="notes"
          placeholder="Notas adicionales sobre la sesión..."
          rows={3}
        />
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Guardando..." : "Registrar sesión"}
        </Button>
        <a
          href={`/dashboard/patients/${patientId}?tab=estetica`}
          className={buttonVariants({ variant: "outline" })}
        >
          Cancelar
        </a>
      </div>
    </form>
  );
}
