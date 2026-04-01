import Link from "next/link";
import { notFound } from "next/navigation";
import { getProvider } from "../actions";
import { buttonVariants } from "@/components/ui/button-variants";
import { DeactivateProviderButton } from "@/components/admin/providers/deactivate-provider-button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ProviderDetailPage({ params }: Props) {
  const { id } = await params;
  const provider = await getProvider(id);

  if (!provider) notFound();

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">{provider.name}</h1>
            {!provider.isActive && <Badge variant="outline">Inactivo</Badge>}
          </div>
          <p className="mt-1 text-muted-foreground">
            Proveedor desde {new Date(provider.createdAt).toLocaleDateString("es-AR")}
          </p>
        </div>

        <div className="flex gap-2">
          <Link
            href={`/dashboard/petshop/providers/${id}/edit`}
            className={buttonVariants({ variant: "outline" })}
          >
            Editar
          </Link>
          {provider.isActive && <DeactivateProviderButton providerId={id} />}
        </div>
      </div>

      <Separator />

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Teléfono</p>
          <p className="mt-1">{provider.phone ?? "—"}</p>
        </div>
        <div>
          <p className="text-sm font-medium text-muted-foreground">Email</p>
          <p className="mt-1">{provider.email ?? "—"}</p>
        </div>
        <div>
          <p className="text-sm font-medium text-muted-foreground">CUIT</p>
          <p className="mt-1">{provider.cuit ?? "—"}</p>
        </div>
        <div>
          <p className="text-sm font-medium text-muted-foreground">Dirección</p>
          <p className="mt-1">{provider.address ?? "—"}</p>
        </div>
      </div>

      {provider.notes && (
        <>
          <Separator />
          <div>
            <p className="text-sm font-medium text-muted-foreground">Notas</p>
            <p className="mt-1 whitespace-pre-wrap">{provider.notes}</p>
          </div>
        </>
      )}

      <Link
        href="/dashboard/petshop/providers"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        ← Volver a proveedores
      </Link>
    </div>
  );
}
