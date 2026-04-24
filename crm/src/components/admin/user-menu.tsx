"use client";

import { logout } from "@/app/login/actions";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { StaffRole } from "@/db/schema";

const ROLE_LABELS: Record<StaffRole, string> = {
  admin: "Admin",
  owner: "Dueño",
  vet: "Vet",
  groomer: "Peluquero/a",
};

export function UserMenu({
  email,
  role,
}: {
  email: string;
  role: StaffRole | null;
}) {
  const initial = (email[0] ?? "?").toUpperCase();
  const handle = email.split("@")[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-2 rounded-full border bg-background py-1 pl-1 pr-3 text-sm transition-colors hover:bg-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
          {initial}
        </span>
        <span className="hidden max-w-[160px] truncate text-foreground sm:inline">
          {handle}
        </span>
        {role && (
          <Badge variant="secondary" className="hidden font-normal lg:inline-flex">
            {ROLE_LABELS[role]}
          </Badge>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="font-normal">
            <p className="truncate text-sm font-medium">{email}</p>
            {role && (
              <p className="text-xs text-muted-foreground">{ROLE_LABELS[role]}</p>
            )}
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <form action={logout}>
          <button
            type="submit"
            className="relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent focus:bg-accent"
          >
            Cerrar sesión
          </button>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
