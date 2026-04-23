import Link from "next/link";
import { Suspense } from "react";
import { getAppointments } from "./actions";
import { getRole } from "@/lib/auth";
import { AppointmentTable } from "@/components/admin/appointments/appointment-table";
import { buttonVariants } from "@/components/ui/button-variants";
import { Skeleton } from "@/components/ui/skeleton";

interface Props {
  searchParams: Promise<{ status?: string; from?: string; to?: string; page?: string; type?: string; q?: string }>;
}

const subtitleByRole: Record<string, string> = {
  vet: "Turnos veterinarios",
  groomer: "Turnos de estética",
  admin: "Gestión de turnos",
  owner: "Gestión de turnos",
};

export default async function AppointmentsPage({ searchParams }: Props) {
  const params = await searchParams;
  const page = Number(params.page) || 1;
  const role = await getRole();

  const typeFilter =
    role === "vet" ? "veterinary" :
    role === "groomer" ? "grooming" :
    (params.type as "veterinary" | "grooming" | undefined) ?? undefined;

  const result = await getAppointments({
    status: params.status,
    appointmentType: typeFilter,
    from: params.from,
    to: params.to,
    search: params.q,
    page,
  });

  const isAdmin = role === "admin" || role === "owner";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Turnos</h1>
          <p className="text-muted-foreground">
            {subtitleByRole[role ?? "admin"] ?? "Gestión de turnos"}
          </p>
        </div>

        {isAdmin && (
          <Link href="/dashboard/appointments/new" className={buttonVariants()}>
            + Nuevo turno
          </Link>
        )}
      </div>

      <Suspense fallback={<Skeleton className="h-96 w-full" />}>
        <AppointmentTable
          data={result.data}
          total={result.total}
          page={result.page}
          totalPages={result.totalPages}
          typeFilter={params.type}
          showTypeFilter={isAdmin}
        />
      </Suspense>
    </div>
  );
}