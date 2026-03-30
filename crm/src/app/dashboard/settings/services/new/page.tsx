import { ServiceForm } from "@/components/admin/services/service-form";

export default function NewServicePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Nuevo servicio</h1>
        <p className="text-muted-foreground">
          Agregá un servicio al catálogo de la clínica.
        </p>
      </div>
      <ServiceForm />
    </div>
  );
}