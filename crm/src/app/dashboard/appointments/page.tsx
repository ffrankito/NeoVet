import { Suspense } from "react";
import { getAppointments } from "./actions";
import { AppointmentTable } from "@/components/admin/appointments/appointment-table";
import { buttonVariants } from "@/components/ui/button-variants";
import { Skeleton } from "@/components/ui/skeleton";

interface Props {
  searchParams: Promise<{ status?: string; from?: string; to?: string; page?: string }>;
}

export default async function AppointmentsPage({ searchParams }: Props) {
  const params = await searchParams;
  const page = Number(params.page) || 1;

  const result = await getAppointments({
    status: params.status,
    from: params.from,
    to: params.to,
    page,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Turnos</h1>
          <p className="text-muted-foreground">Gestión de citas veterinarias</p>
        </div>
        <a href="/dashboard/appointments/new" className={buttonVariants()}>
          + Nuevo turno
        </a>
      </div>

      <Suspense fallback={<Skeleton className="h-96 w-full" />}>
        <AppointmentTable
          data={result.data}
          total={result.total}
          page={result.page}
          totalPages={result.totalPages}
        />
      </Suspense>
    </div>
  );
}
