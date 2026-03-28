"use client";

interface Tab {
  label: string;
  value: string;
}

const TABS: Tab[] = [
  { label: "Información", value: "informacion" },
  { label: "Historia clínica", value: "historia" },
  { label: "Vacunas", value: "vacunas" },
  { label: "Desparasitaciones", value: "desparasitaciones" },
  { label: "Documentos", value: "documentos" },
];

interface TabNavProps {
  activeTab: string;
  patientId: string;
}

export function TabNav({ activeTab, patientId }: TabNavProps) {
  return (
    <nav className="flex gap-1 border-b mb-6" aria-label="Secciones del paciente">
      {TABS.map((tab) => {
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
