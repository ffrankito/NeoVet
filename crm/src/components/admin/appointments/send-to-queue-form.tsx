"use client";

import { useRef, useState, useTransition } from "react";
import { createRetorno } from "@/app/dashboard/sala-de-espera/actions";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const TASK_TYPES = [
  { value: "sacar_sangre", label: "Sacar sangre" },
  { value: "ecografia", label: "Ecografía" },
  { value: "curacion", label: "Curación" },
  { value: "aplicar_medicacion", label: "Aplicar medicación" },
  { value: "radiografia", label: "Radiografía" },
  { value: "control_signos_vitales", label: "Control de signos vitales" },
  { value: "otro", label: "Otro" },
];

type Message = { type: "success" | "error"; text: string };

export function SendToQueueForm({ appointmentId }: { appointmentId: string }) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<Message | null>(null);
  const [taskType, setTaskType] = useState("");
  const formRef = useRef<HTMLFormElement>(null);

  const onSubmit = (formData: FormData) => {
    formData.set("taskType", taskType);
    setMessage(null);
    startTransition(async () => {
      const result = await createRetorno(appointmentId, formData);
      if ("error" in result && result.error) {
        setMessage({ type: "error", text: result.error });
      } else if ("errors" in result && result.errors) {
        const first = Object.values(result.errors).flat()[0] as
          | string
          | undefined;
        setMessage({ type: "error", text: first ?? "Datos inválidos." });
      } else {
        setMessage({ type: "success", text: "Enviado a sala de espera." });
        setTaskType("");
        formRef.current?.reset();
      }
    });
  };

  return (
    <form
      ref={formRef}
      action={onSubmit}
      className="space-y-3 rounded-lg border border-dashed p-4"
    >
      <h3 className="text-sm font-semibold">
        Enviar a sala de espera (retorno)
      </h3>

      <div className="grid gap-3 sm:grid-cols-[minmax(180px,1fr)_2fr_auto] sm:items-end">
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">
            Tarea
          </label>
          <Select
            value={taskType}
            onValueChange={(value) => setTaskType(value ?? "")}
          >
            <SelectTrigger className="h-9">
              <SelectValue placeholder="Seleccionar..." />
            </SelectTrigger>
            <SelectContent>
              {TASK_TYPES.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label
            htmlFor={`retorno-notes-${appointmentId}`}
            className="mb-1 block text-xs font-medium text-muted-foreground"
          >
            Notas (opcional)
          </label>
          <textarea
            id={`retorno-notes-${appointmentId}`}
            name="notes"
            rows={1}
            maxLength={1000}
            className="block w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            placeholder="Ej: pedido por Facu"
          />
        </div>
        <Button type="submit" disabled={isPending || !taskType}>
          {isPending ? "Enviando..." : "Enviar"}
        </Button>
      </div>

      {message && (
        <p
          className={`text-xs ${
            message.type === "success" ? "text-green-700" : "text-red-600"
          }`}
        >
          {message.text}
        </p>
      )}
    </form>
  );
}
