"use client";

import { useActionState, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SearchableSelect } from "@/components/ui/searchable-select";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { createWalkIn } from "@/app/dashboard/appointments/actions";

type ActionResult =
  | { error?: string; success?: boolean }
  | undefined;

interface WalkInFormProps {
  patients: Array<{ id: string; name: string; species: string; clientId: string; clientName: string }>;
  services: Array<{ id: string; name: string; category: string | null }>;
  defaultPatientId?: string;
}

export function WalkInForm({ patients, services, defaultPatientId }: WalkInFormProps) {
  const [open, setOpen] = useState(!!defaultPatientId);
  const [selectedPatient, setSelectedPatient] = useState(defaultPatientId ?? "");
  const [selectedService, setSelectedService] = useState("");

  const action = async (_prev: ActionResult, formData: FormData) => {
    formData.set("patientId", selectedPatient);
    if (selectedService) formData.set("serviceId", selectedService);
    return createWalkIn(formData);
  };

  const [result, dispatch, isPending] = useActionState(action, undefined);

  // On success, reset form and close
  useEffect(() => {
    if (result?.success) {
      setSelectedPatient("");
      setSelectedService("");
      setOpen(false);
    }
  }, [result]);

  const error = result && "error" in result ? result.error : null;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button variant="outline">Agregar a sala de espera</Button>
        }
      />
      <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
        <SheetHeader className="border-b">
          <SheetTitle>Agregar a sala de espera</SheetTitle>
          <SheetDescription>
            Registrá un paciente que llega sin turno previo.
          </SheetDescription>
        </SheetHeader>

        <form action={dispatch} className="flex min-h-0 flex-1 flex-col">
          <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
            {error && (
              <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            )}

            {/* Patient search — finds by patient name OR owner name */}
            <div className="space-y-2">
              <Label>Paciente *</Label>
              <SearchableSelect
                options={patients.map((p) => ({
                  value: p.id,
                  label: p.name,
                  sublabel: p.clientName,
                }))}
                value={selectedPatient}
                onChange={setSelectedPatient}
                placeholder="Seleccioná un paciente"
                searchPlaceholder="Buscar mascota o dueño..."
                emptyMessage="No se encontró ningún paciente."
              />
            </div>

            {/* Service selector — optional */}
            <div className="space-y-2">
              <Label>Servicio</Label>
              <SearchableSelect
                options={services.map((s) => ({ value: s.id, label: s.name }))}
                value={selectedService}
                onChange={setSelectedService}
                placeholder="Seleccionar servicio (opcional)"
                searchPlaceholder="Buscar servicio..."
                emptyMessage="No se encontró ningún servicio."
              />
            </div>

            {/* Reason — optional */}
            <div className="space-y-2">
              <Label htmlFor="walkInReason">Motivo</Label>
              <Input
                id="walkInReason"
                name="reason"
                placeholder="Motivo de consulta..."
              />
            </div>

            {/* Urgent checkbox */}
            <label className="flex cursor-pointer items-center gap-2">
              <input type="checkbox" name="isUrgent" className="rounded" />
              <span className="text-sm font-medium text-red-600">Urgente</span>
            </label>
          </div>

          <SheetFooter className="flex-row justify-end gap-3 border-t p-4">
            <SheetClose
              render={<Button type="button" variant="outline">Cancelar</Button>}
            />
            <Button type="submit" disabled={isPending || !selectedPatient}>
              {isPending ? "Agregando..." : "Agregar"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
