import { getServices } from "./actions";
import { ServiceList } from "@/components/admin/services/service-list";
import { buttonVariants } from "@/components/ui/button-variants";

export default async function ServicesPage() {
  const allServices = await getServices();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Catálogo de servicios
          </h1>
          <p className="text-muted-foreground">
            Servicios disponibles para agendar turnos.
          </p>
        </div>
        <a href="/dashboard/settings/services/new" className={buttonVariants()}>
          + Nuevo servicio
        </a>
      </div>
      <ServiceList services={allServices} />
    </div>
  );
}