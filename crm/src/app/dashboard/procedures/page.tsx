import Link from "next/link";
import { Suspense } from "react";
import { getProcedures } from "./actions";
import { getRole } from "@/lib/auth";
import { ProcedureTable } from "@/components/admin/procedures/procedure-table";
import { buttonVariants } from "@/components/ui/button-variants";
import { Skeleton } from "@/components/ui/skeleton";

interface Props {
  searchParams: Promise<{ page?: string }>;
}

export default async function ProceduresPage({ searchParams }: Props) {
  const params = await searchParams;
  const page = Number(params.page) || 1;
  const role = await getRole();

  const result = await getProcedures({ page });

  const canCreate = role === "admin" || role === "owner" || role === "vet";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Procedimientos</h1>
          <p className="text-muted-foreground">
            Cirugías y procedimientos médicos
          </p>
        </div>

        {canCreate && (
          <Link href="/dashboard/procedures/new" className={buttonVariants()}>
            + Nuevo procedimiento
          </Link>
        )}
      </div>

      <Suspense fallback={<Skeleton className="h-96 w-full" />}>
        <ProcedureTable
          data={result.data}
          total={result.total}
          page={result.page}
          totalPages={result.totalPages}
        />
      </Suspense>
    </div>
  );
}
