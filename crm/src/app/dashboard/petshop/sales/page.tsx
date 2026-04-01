import Link from "next/link";
import { Suspense } from "react";
import { getSales } from "./actions";
import { SaleTable } from "@/components/admin/sales/sale-table";
import { buttonVariants } from "@/components/ui/button-variants";
import { Skeleton } from "@/components/ui/skeleton";

interface Props {
  searchParams: Promise<{ page?: string }>;
}

export default async function SalesPage({ searchParams }: Props) {
  const params = await searchParams;
  const page = Number(params.page) || 1;

  const result = await getSales({ page });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Ventas</h1>
          <p className="text-muted-foreground">Registro de ventas del pet shop</p>
        </div>
        <Link href="/dashboard/petshop/sales/new" className={buttonVariants()}>
          + Nueva venta
        </Link>
      </div>

      <Suspense fallback={<Skeleton className="h-96 w-full" />}>
        <SaleTable
          data={result.data}
          total={result.total}
          page={result.page}
          totalPages={result.totalPages}
        />
      </Suspense>
    </div>
  );
}
