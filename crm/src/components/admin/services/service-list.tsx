"use client";

import { useTransition } from "react";
import { buttonVariants } from "@/components/ui/button-variants";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toggleServiceActive, deleteService } from "@/app/dashboard/settings/services/actions";
import type { Service } from "@/db/schema";

const CATEGORY_LABELS: Record<string, string> = {
  cirugia: "Cirugía",
  consulta: "Consulta",
  reproduccion: "Reproducción",
  cardiologia: "Cardiología",
  peluqueria: "Peluquería",
  vacunacion: "Vacunación",
  petshop: "Pet Shop",
  otro: "Otro",
};

function ToggleActiveButton({ service }: { service: Service }) {
  const [isPending, startTransition] = useTransition();

  function handleToggle() {
    startTransition(async () => {
      await toggleServiceActive(service.id, !service.isActive);
    });
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleToggle}
      disabled={isPending}
      className={
        service.isActive
          ? "text-destructive hover:text-destructive"
          : "text-muted-foreground"
      }
    >
      {service.isActive ? "Desactivar" : "Activar"}
    </Button>
  );
}

function DeleteServiceButton({ service }: { service: Service }) {
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    startTransition(async () => {
      await deleteService(service.id);
    });
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger
        className="inline-flex items-center justify-center rounded-lg px-3 py-1.5 text-sm text-destructive hover:bg-destructive/10 disabled:opacity-50 disabled:pointer-events-none"
        disabled={isPending}
      >
        Eliminar
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Eliminar "{service.name}"?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta acción no se puede deshacer. El servicio será eliminado permanentemente
            y dejará de estar disponible para nuevos turnos.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} disabled={isPending}>
            Sí, eliminar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

interface Props {
  services: Service[];
}

export function ServiceList({ services }: Props) {
  if (services.length === 0) {
    return (
      <div className="rounded-lg border border-dashed py-12 text-center text-sm text-muted-foreground">
        No hay servicios registrados. Creá el primero.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 text-muted-foreground">
          <tr>
            <th className="px-4 py-3 text-left font-medium">Nombre</th>
            <th className="px-4 py-3 text-left font-medium">Categoría</th>
            <th className="px-4 py-3 text-left font-medium">Duración</th>
            <th className="px-4 py-3 text-left font-medium">Bloqueo</th>
            <th className="px-4 py-3 text-left font-medium">Estado</th>
            <th className="px-4 py-3 text-right font-medium">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {services.map((service) => (
            <tr key={service.id} className={service.isActive ? "" : "opacity-50"}>
              <td className="px-4 py-3 font-medium">{service.name}</td>
              <td className="px-4 py-3 text-muted-foreground">
                {CATEGORY_LABELS[service.category] ?? service.category}
              </td>
              <td className="px-4 py-3">{service.defaultDurationMinutes} min</td>
              <td className="px-4 py-3">
                {service.blockDurationMinutes
                  ? `${service.blockDurationMinutes} min`
                  : "—"}
              </td>
              <td className="px-4 py-3">
                <span
                  className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                    service.isActive
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {service.isActive ? "Activo" : "Inactivo"}
                </span>
              </td>
              <td className="px-4 py-3 text-right">
                <div className="flex items-center justify-end gap-2">
                  
                    <a href={`/dashboard/settings/services/${service.id}/edit`}
                    className={buttonVariants({ variant: "ghost", size: "sm" })}
                  >
                    Editar
                  </a>
                  <ToggleActiveButton service={service} />
                  <DeleteServiceButton service={service} />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}