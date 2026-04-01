import Link from "next/link";
import { Suspense } from "react";
import { getStockEntries } from "./actions";
import { StockEntryTable } from "@/components/admin/stock-entries/stock-entry-table";
import { buttonVariants } from "@/components/ui/button-variants";
import { Skeleton } from "@/components/ui/skeleton";

interface Props {
  searchParams: Promise<{ page?: string }>;
}

export default async function StockEntriesPage({ searchParams }: Props) {
  const params = await searchParams;
  const page = Number(params.page) || 1;

  const result = await getStockEntries({ page });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Ingresos de stock</h1>
          <p className="text-muted-foreground">Historial de entradas de mercadería</p>
        </div>
        <Link href="/dashboard/petshop/stock-entries/new" className={buttonVariants()}>
          + Nuevo ingreso
        </Link>
      </div>

      <Suspense fallback={<Skeleton className="h-96 w-full" />}>
        <StockEntryTable
          data={result.data}
          total={result.total}
          page={result.page}
          totalPages={result.totalPages}
        />
      </Suspense>
    </div>
  );
}
