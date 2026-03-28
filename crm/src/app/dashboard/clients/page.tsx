import { Suspense } from "react";
import { getClients } from "./actions";
import { ClientTable } from "@/components/admin/clients/client-table";
import { buttonVariants } from "@/components/ui/button-variants";
import { Skeleton } from "@/components/ui/skeleton";

interface Props {
  searchParams: Promise<{ search?: string; page?: string }>;
}

export default async function ClientsPage({ searchParams }: Props) {
  const params = await searchParams;
  const search = params.search;
  const page = Number(params.page) || 1;

  const result = await getClients({ search, page });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Clientes</h1>
          <p className="text-muted-foreground">Dueños de mascotas registrados</p>
        </div>
        <a href="/dashboard/clients/new" className={buttonVariants()}>
          + Nuevo cliente
        </a>
      </div>

      <Suspense fallback={<Skeleton className="h-96 w-full" />}>
        <ClientTable
          data={result.data}
          total={result.total}
          page={result.page}
          totalPages={result.totalPages}
        />
      </Suspense>
    </div>
  );
}
