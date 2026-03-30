import { notFound } from "next/navigation";
import { db } from "@/db";
import { services } from "@/db/schema";
import { eq } from "drizzle-orm";
import { ServiceForm } from "@/components/admin/services/service-form";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditServicePage({ params }: Props) {
  const { id } = await params;
  const [service] = await db
    .select()
    .from(services)
    .where(eq(services.id, id))
    .limit(1);

  if (!service) notFound();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Editar servicio</h1>
        <p className="text-muted-foreground">{service.name}</p>
      </div>
      <ServiceForm service={service} />
    </div>
  );
}