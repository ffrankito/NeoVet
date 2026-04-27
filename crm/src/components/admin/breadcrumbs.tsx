"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// Top-level dashboard areas → human label.
// Pulled from the sidebar nav. If a segment lands here without a mapping,
// we fall back to the raw segment so it's still visible (helpful in dev).
const TOP_LEVEL_LABELS: Record<string, string> = {
  clients: "Clientes",
  patients: "Pacientes",
  appointments: "Turnos",
  calendar: "Agenda",
  grooming: "Estética",
  hospitalizations: "Internaciones",
  "sala-de-espera": "Sala de espera",
  procedures: "Procedimientos",
  consultations: "Consultas",
  "consent-documents": "Consentimientos",
  precios: "Precios",
  petshop: "Pet Shop",
  deudores: "Deudores",
  cash: "Caja",
  settings: "Configuración",
};

export function Breadcrumbs() {
  const pathname = usePathname();

  // No crumb on the dashboard home — it's the root, the topbar sits on top of it.
  if (pathname === "/dashboard") return null;

  // /dashboard/<area>[/...rest] — collapse to two levels: Inicio · <area label>.
  // Deeper context (patient name, "nuevo", "editar", etc.) is the page heading's job.
  const segments = pathname.split("/").filter(Boolean);
  const topLevel = segments[1];
  if (!topLevel) return null;

  const label = TOP_LEVEL_LABELS[topLevel] ?? topLevel;

  return (
    <nav
      aria-label="Breadcrumb"
      className="flex items-center text-sm text-muted-foreground"
    >
      <Link
        href="/dashboard"
        className="transition-colors hover:text-foreground"
      >
        Inicio
      </Link>
      <span className="mx-2 text-muted-foreground/60">/</span>
      <span className="font-medium text-foreground">{label}</span>
    </nav>
  );
}
