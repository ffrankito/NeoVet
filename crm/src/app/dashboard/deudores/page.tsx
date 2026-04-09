import Link from "next/link";
import { Suspense } from "react";
import { getDeudores } from "./actions";
import { getRole } from "@/lib/auth";
import { DeudoresTable } from "@/components/admin/deudores/deudores-table";
import { buttonVariants } from "@/components/ui/button-variants";
import { Skeleton } from "@/components/ui/skeleton";

interface Props {
  searchParams: Promise<{ page?: string; search?: string }>;
}

export default async function DeudoresPage({ searchParams }: Props) {
  const params = await searchParams;
  const page = Number(params.page) || 1;
  const search = params.search ?? "";
  const role = await getRole();

  const result = await getDeudores({ page, search });

  const isAdmin = role === "admin" || role === "owner";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Deudores</h1>
          <p className="text-muted-foreground">
            Clientes con saldo pendiente
          </p>
        </div>

        {isAdmin && (
          <Link
            href="/dashboard/deudores/new-charge"
            className={buttonVariants()}
          >
            + Nuevo cargo
          </Link>
        )}
      </div>

      <Suspense fallback={<Skeleton className="h-96 w-full" />}>
        <DeudoresTable
          data={result.data}
          total={result.total}
          page={result.page}
          totalPages={result.totalPages}
        />
      </Suspense>
    </div>
  );
}
