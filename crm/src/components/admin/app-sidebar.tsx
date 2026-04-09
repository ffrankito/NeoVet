"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { logout } from "@/app/login/actions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { User } from "@supabase/supabase-js";
import type { StaffRole } from "@/db/schema";
import { CalendarDays, Menu, X } from "lucide-react";

type NavItem = {
  href: string;
  label: string;
  icon: string | React.ReactNode;
  roles?: string[];
};

const ALL_NAV_ITEMS: NavItem[] = [
  { href: "/dashboard",                   label: "Inicio",        icon: "🏠", roles: ["admin", "owner", "vet", "groomer"] },
  { href: "/dashboard/clients",           label: "Clientes",      icon: "👤", roles: ["admin", "owner", "vet"] },
  { href: "/dashboard/appointments",      label: "Turnos",        icon: "📅", roles: ["admin", "owner", "vet", "groomer"] },
  { href: "/dashboard/calendar",          label: "Agenda",        icon: <CalendarDays className="h-4 w-4" />, roles: ["admin", "owner", "vet", "groomer"] },
  { href: "/dashboard/hospitalizations",   label: "Internaciones", icon: "🏥", roles: ["admin", "owner", "vet"] },
  { href: "/dashboard/procedures",         label: "Procedimientos", icon: "🔬", roles: ["admin", "owner", "vet"] },
  { href: "/dashboard/petshop",            label: "Pet Shop",      icon: "🛒", roles: ["admin", "owner"] },
  { href: "/dashboard/cash",               label: "Caja",          icon: "💰", roles: ["admin", "owner"] },
  { href: "/dashboard/settings/services", label: "Servicios",     icon: "🩺", roles: ["admin", "owner"] },
  { href: "/dashboard/settings",          label: "Configuración", icon: "⚙️", roles: ["admin", "owner"] },
];

export function AppSidebar({ user, role }: { user: User; role: StaffRole | null }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = ALL_NAV_ITEMS.filter(
    (item) => !role || !item.roles || item.roles.includes(role)
  );

  const NavLinks = ({ onClickLink }: { onClickLink?: () => void }) => (
    <>
      {navItems.map((item) => {
        const isActive =
          item.href === "/dashboard"
            ? pathname === "/dashboard"
            : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onClickLink}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            )}
          >
            <span className="flex h-5 w-5 items-center justify-center text-base">
              {item.icon}
            </span>
            {item.label}
          </Link>
        );
      })}
    </>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-60 flex-col border-r border-sidebar-border bg-sidebar">
        <div className="flex h-14 items-center border-b border-sidebar-border px-4">
          <Link href="/dashboard" className="text-lg font-bold tracking-tight">
            NeoVet CRM
          </Link>
        </div>
        <nav className="flex-1 space-y-1 px-2 py-4">
          <NavLinks />
        </nav>
        <div className="border-t border-sidebar-border p-4">
          <p className="truncate text-xs text-muted-foreground">{user.email}</p>
          <form action={logout}>
            <Button type="submit" variant="ghost" size="sm" className="mt-2 w-full justify-start">
              Cerrar sesión
            </Button>
          </form>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 flex h-14 items-center justify-between border-b border-sidebar-border bg-sidebar px-4">
        <Link href="/dashboard" className="text-lg font-bold tracking-tight">
          NeoVet CRM
        </Link>
        <button
          onClick={() => setMobileOpen(true)}
          className="rounded-md p-2 text-sidebar-foreground hover:bg-sidebar-accent"
          aria-label="Abrir menú"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      {/* Mobile drawer overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-50 bg-black/50"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <div
        className={cn(
          "lg:hidden fixed top-0 left-0 z-50 h-full w-72 flex flex-col bg-sidebar border-r border-sidebar-border transition-transform duration-300",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-14 items-center justify-between border-b border-sidebar-border px-4">
          <Link href="/dashboard" className="text-lg font-bold tracking-tight">
            NeoVet CRM
          </Link>
          <button
            onClick={() => setMobileOpen(false)}
            className="rounded-md p-2 text-sidebar-foreground hover:bg-sidebar-accent"
            aria-label="Cerrar menú"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="flex-1 space-y-1 px-2 py-4">
          <NavLinks onClickLink={() => setMobileOpen(false)} />
        </nav>
        <div className="border-t border-sidebar-border p-4">
          <p className="truncate text-xs text-muted-foreground">{user.email}</p>
          <form action={logout}>
            <Button type="submit" variant="ghost" size="sm" className="mt-2 w-full justify-start">
              Cerrar sesión
            </Button>
          </form>
        </div>
      </div>
    </>
  );
}