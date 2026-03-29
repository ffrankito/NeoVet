"use client";

interface Tab {
  label: string;
  value: string;
}

const BASE_TABS: Tab[] = [
  { label: "Información", value: "informacion" },
  { label: "Historia clínica", value: "historia" },
  { label: "Vacunas", value: "vacunas" },
  { label: "Desparasitaciones", value: "desparasitaciones" },
  { label: "Documentos", value: "documentos" },
];

const GROOMING_TAB: Tab = { label: "Peluquería", value: "peluqueria" };

interface TabNavProps {
  activeTab: string;
  patientId: string;
  showGrooming?: boolean;
}

export function TabNav({ activeTab, patientId, showGrooming = false }: TabNavProps) {
  const tabs = showGrooming ? [...BASE_TABS, GROOMING_TAB] : BASE_TABS;

  return (
    <nav className="flex gap-1 border-b mb-6" aria-label="Secciones del paciente">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.value;
        const href =
          tab.value === "informacion"
            ? `/dashboard/patients/${patientId}`
            : `/dashboard/patients/${patientId}?tab=${tab.value}`;

        return (
          <a
            key={tab.value}
            href={href}
            className={
              isActive
                ? "px-3 py-2 text-sm border-b-2 border-primary font-medium text-foreground -mb-px"
                : "px-3 py-2 text-sm text-muted-foreground hover:text-foreground"
            }
            aria-current={isActive ? "page" : undefined}
          >
            {tab.label}
          </a>
        );
      })}
    </nav>
  );
}
