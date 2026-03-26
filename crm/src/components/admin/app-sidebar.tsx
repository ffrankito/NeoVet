"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/app/login/actions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { User } from "@supabase/supabase-js";

const navItems = [
  { href: "/dashboard", label: "Inicio", icon: "🏠" },
  { href: "/dashboard/clients", label: "Clientes", icon: "👤" },
  { href: "/dashboard/appointments", label: "Turnos", icon: "📅" },
];

export function AppSidebar({ user }: { user: User }) {
  const pathname = usePathname();

  return (
    <aside className="flex w-60 flex-col border-r border-sidebar-border bg-sidebar">
      {/* Brand */}
      <div className="flex h-14 items-center border-b border-sidebar-border px-4">
        <Link href="/dashboard" className="text-lg font-bold tracking-tight">
          NeoVet CRM
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-2 py-4">
        {navItems.map((item) => {
          const isActive =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User info + logout */}
      <div className="border-t border-sidebar-border p-4">
        <p className="truncate text-xs text-muted-foreground">{user.email}</p>
        <form action={logout}>
          <Button variant="ghost" size="sm" className="mt-2 w-full justify-start">
            Cerrar sesión
          </Button>
        </form>
      </div>
    </aside>
  );
}
