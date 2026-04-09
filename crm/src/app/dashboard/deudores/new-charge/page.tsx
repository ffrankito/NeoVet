import Link from "next/link";
import { ChargeForm } from "@/components/admin/deudores/charge-form";
import { buttonVariants } from "@/components/ui/button-variants";

interface Props {
  searchParams: Promise<{ clientId?: string; clientName?: string }>;
}

export default async function NewChargePage({ searchParams }: Props) {
  const params = await searchParams;
  const clientId = params.clientId;
  const clientName = params.clientName;

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/dashboard/deudores"
          className={buttonVariants({ variant: "ghost", size: "sm" })}
        >
          ← Volver a deudores
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold tracking-tight">Nuevo cargo</h1>
        <p className="text-muted-foreground">
          Registrar un cargo manual a un cliente
        </p>
      </div>

      {clientName && (
        <p className="text-sm text-muted-foreground">
          Cliente: <span className="font-medium text-foreground">{clientName}</span>
        </p>
      )}

      <ChargeForm
        defaultClientId={clientId}
        defaultClientName={clientName}
      />
    </div>
  );
}
