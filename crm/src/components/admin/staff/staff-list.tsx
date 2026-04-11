"use client";

import { useTransition } from "react";
import { buttonVariants } from "@/components/ui/button-variants";
import { Button } from "@/components/ui/button";
import { deactivateStaffMember, reactivateStaffMember } from "@/app/dashboard/settings/staff/actions";
import type { Staff } from "@/db/schema";

const roleLabels: Record<string, string> = {
  admin: "Admin",
  owner: "Dueña / Veterinaria",
  vet: "Veterinario/a",
  groomer: "Esteticista",
};

function ToggleActiveButton({ member }: { member: Staff }) {
  const [isPending, startTransition] = useTransition();

  function handleToggle() {
    startTransition(async () => {
      if (member.isActive) {
        await deactivateStaffMember(member.id);
      } else {
        await reactivateStaffMember(member.id);
      }
    });
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleToggle}
      disabled={isPending}
      className={member.isActive ? "text-destructive hover:text-destructive" : "text-muted-foreground"}
    >
      {member.isActive ? "Desactivar" : "Reactivar"}
    </Button>
  );
}

export function StaffList({ members }: { members: Staff[] }) {
  if (members.length === 0) {
    return (
      <div className="rounded-lg border border-dashed py-12 text-center text-sm text-muted-foreground">
        No hay miembros del equipo. Creá el primero.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 text-muted-foreground">
          <tr>
            <th className="px-4 py-3 text-left font-medium">Nombre</th>
            <th className="px-4 py-3 text-left font-medium">Email</th>
            <th className="px-4 py-3 text-left font-medium">Rol</th>
            <th className="px-4 py-3 text-left font-medium">Estado</th>
            <th className="px-4 py-3 text-right font-medium">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {members.map((member) => (
            <tr key={member.id} className={member.isActive ? "" : "opacity-50"}>
              <td className="px-4 py-3 font-medium">{member.name}</td>
              <td className="px-4 py-3 text-muted-foreground">{member.email}</td>
              <td className="px-4 py-3 text-muted-foreground">{roleLabels[member.role] ?? member.role}</td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${member.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}`}>
                    {member.isActive ? "Activo" : "Inactivo"}
                  </span>
                  {member.isExternal && (
                    <span className="inline-flex rounded-full px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800">
                      Externo
                    </span>
                  )}
                </div>
              </td>
              <td className="px-4 py-3 text-right">
                <div className="flex items-center justify-end gap-2">
                  <a
                    href={`/dashboard/settings/staff/${member.id}/edit`}
                    className={buttonVariants({ variant: "ghost", size: "sm" })}
                  >
                    Editar
                  </a>
                  <ToggleActiveButton member={member} />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
