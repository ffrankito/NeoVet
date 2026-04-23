import Link from "next/link";
import { Suspense } from "react";
import { getHospitalizations } from "./actions";
import { getRole } from "@/lib/auth";
import { HospitalizationTable } from "@/components/admin/hospitalizations/hospitalization-table";
import { buttonVariants } from "@/components/ui/button-variants";
import { Skeleton } from "@/components/ui/skeleton";

interface Props {
  searchParams: Promise<{ status?: string; page?: string; q?: string }>;
}

export default async function HospitalizationsPage({ searchParams }: Props) {
  const params = await searchParams;
  const page = Number(params.page) || 1;
  const role = await getRole();

  const statusParam = params.status as "active" | "discharged" | "all" | undefined;
  const result = await getHospitalizations({
    status: statusParam,
    search: params.q,
    page,
  });

  const isAdmin = role === "admin" || role === "owner";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Hospitalizaciones</h1>
          <p className="text-muted-foreground">Internaciones y altas de pacientes</p>
        </div>

        {(isAdmin || role === "vet") && (
          <Link href="/dashboard/hospitalizations/new" className={buttonVariants()}>
            + Admitir paciente
          </Link>
        )}
      </div>

      <Suspense fallback={<Skeleton className="h-96 w-full" />}>
        <HospitalizationTable
          data={result.data}
          total={result.total}
          page={result.page}
          totalPages={result.totalPages}
        />
      </Suspense>
    </div>
  );
}
