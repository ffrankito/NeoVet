import { notFound } from "next/navigation";
import { getClient } from "../../actions";
import { ClientForm } from "@/components/admin/clients/client-form";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditClientPage({ params }: Props) {
  const { id } = await params;
  const client = await getClient(id);

  if (!client) notFound();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Editar cliente</h1>
        <p className="text-muted-foreground">{client.name}</p>
      </div>
      <ClientForm client={client} />
    </div>
  );
}
