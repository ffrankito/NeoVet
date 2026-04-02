import Link from "next/link";
import { Suspense } from "react";
import { getProducts } from "./actions";
import { ProductTable } from "@/components/admin/products/product-table";
import { buttonVariants } from "@/components/ui/button-variants";
import { Skeleton } from "@/components/ui/skeleton";

interface Props {
  searchParams: Promise<{ search?: string; page?: string }>;
}

export default async function ProductsPage({ searchParams }: Props) {
  const params = await searchParams;
  const search = params.search;
  const page = Number(params.page) || 1;

  const result = await getProducts({ search, page });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Productos</h1>
          <p className="text-muted-foreground">Catálogo de productos del pet shop</p>
        </div>
        <Link href="/dashboard/petshop/products/new" className={buttonVariants()}>
          + Nuevo producto
        </Link>
      </div>

      <Suspense fallback={<Skeleton className="h-96 w-full" />}>
        <ProductTable
          data={result.data}
          total={result.total}
          page={result.page}
          totalPages={result.totalPages}
        />
      </Suspense>
    </div>
  );
}
