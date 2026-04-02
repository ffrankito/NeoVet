import { notFound } from "next/navigation";
import { getProvider } from "../../actions";
import { ProviderForm } from "@/components/admin/providers/provider-form";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditProviderPage({ params }: Props) {
  const { id } = await params;
  const provider = await getProvider(id);

  if (!provider) notFound();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Editar proveedor</h1>
        <p className="text-muted-foreground">{provider.name}</p>
      </div>
      <ProviderForm provider={provider} />
    </div>
  );
}
