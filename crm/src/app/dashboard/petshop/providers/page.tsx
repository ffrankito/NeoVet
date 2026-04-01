import Link from "next/link";
import { Suspense } from "react";
import { getProviders } from "./actions";
import { ProviderTable } from "@/components/admin/providers/provider-table";
import { buttonVariants } from "@/components/ui/button-variants";
import { Skeleton } from "@/components/ui/skeleton";

interface Props {
  searchParams: Promise<{ search?: string; page?: string }>;
}

export default async function ProvidersPage({ searchParams }: Props) {
  const params = await searchParams;
  const search = params.search;
  const page = Number(params.page) || 1;

  const result = await getProviders({ search, page });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Proveedores</h1>
          <p className="text-muted-foreground">Proveedores de productos e insumos</p>
        </div>
        <Link href="/dashboard/petshop/providers/new" className={buttonVariants()}>
          + Nuevo proveedor
        </Link>
      </div>

      <Suspense fallback={<Skeleton className="h-96 w-full" />}>
        <ProviderTable
          data={result.data}
          total={result.total}
          page={result.page}
          totalPages={result.totalPages}
        />
      </Suspense>
    </div>
  );
}
