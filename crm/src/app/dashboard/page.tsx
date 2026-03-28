import Link from "next/link";
import { db } from "@/db";
import { clients, patients, appointments } from "@/db/schema";
import { eq, sql, asc, and, gte, lt, ne } from "drizzle-orm";
import { Badge } from "@/components/ui/badge";
import { DashboardActions } from "@/components/admin/dashboard-actions";
import { CardSkeleton } from "@/components/admin/skeletons";
import { AppointmentActions } from "@/components/admin/appointments/appointment-actions";
import { Suspense } from "react";

const statusLabels: Record<string, string> = {
  pending: "Pendiente",
  confirmed: "Confirmado",
  completed: "Completado",
  cancelled: "Cancelado",
};

const statusVariants: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  pending: "secondary",
  confirmed: "default",
  completed: "outline",
  cancelled: "destructive",
};

async function DashboardContent() {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const [clientCountResult, patientCountResult, todayCountResult, todayAppointments] =
    await Promise.all([
      db.select({ count: sql<number>`count(*)` }).from(clients),
      db.select({ count: sql<number>`count(*)` }).from(patients),
      db
        .select({ count: sql<number>`count(*)` })
        .from(appointments)
        .where(
          and(
            gte(appointments.scheduledAt, todayStart),
            lt(appointments.scheduledAt, todayEnd),
            ne(appointments.status, "cancelled")
          )
        ),
      db
        .select({
          id: appointments.id,
          scheduledAt: appointments.scheduledAt,
          status: appointments.status,
          reason: appointments.reason,
          patientId: appointments.patientId,
          patientName: patients.name,
          clientName: clients.name,
          clientId: clients.id,
        })
        .from(appointments)
        .innerJoin(patients, eq(appointments.patientId, patients.id))
        .innerJoin(clients, eq(patients.clientId, clients.id))
        .where(
          and(
            gte(appointments.scheduledAt, todayStart),
            lt(appointments.scheduledAt, todayEnd)
          )
        )
        .orderBy(asc(appointments.scheduledAt)),
    ]);

  const clientCount = Number(clientCountResult[0].count);
  const patientCount = Number(patientCountResult[0].count);
  const todayCount = Number(todayCountResult[0].count);

  return (
    <div className="space-y-8">
      {/* Page title */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Panel de control</h1>
        <p className="text-muted-foreground">
          Bienvenido al sistema de gestión de NeoVet.
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <SummaryCard label="Clientes" count={clientCount} href="/dashboard/clients" />
        <SummaryCard label="Pacientes" count={patientCount} href="/dashboard/patients" />
        <SummaryCard label="Turnos hoy" count={todayCount} href="/dashboard/appointments" />
      </div>

      {/* Quick actions */}
      <DashboardActions />

      {/* Today's appointments */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Turnos de hoy</h2>

        {todayAppointments.length === 0 ? (
          <div className="rounded-lg border border-dashed py-10 text-center text-muted-foreground">
            No hay turnos para hoy.
          </div>
        ) : (
          <div className="rounded-lg border divide-y">
            {todayAppointments.map((apt) => (
              <div
                key={apt.id}
                className="flex items-center gap-4 px-4 py-3"
              >
                {/* Time */}
                <span className="w-14 shrink-0 text-sm font-mono font-medium text-muted-foreground">
                  {new Date(apt.scheduledAt).toLocaleTimeString("es-AR", {
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: false,
                  })}
                </span>

                {/* Patient + owner */}
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/dashboard/appointments/${apt.id}`}
                    className="font-medium hover:underline truncate block"
                  >
                    {apt.patientName}
                  </Link>
                  <p className="text-sm text-muted-foreground truncate">
                    <Link
                      href={`/dashboard/clients/${apt.clientId}`}
                      className="hover:underline"
                    >
                      {apt.clientName}
                    </Link>
                    {apt.reason ? ` — ${apt.reason}` : ""}
                  </p>
                </div>

                {/* Status badge */}
                <Badge variant={statusVariants[apt.status] ?? "secondary"}>
                  {statusLabels[apt.status] ?? apt.status}
                </Badge>

                {/* Inline actions */}
                <AppointmentActions
                  appointmentId={apt.id}
                  patientId={apt.patientId}
                  status={apt.status as "pending" | "confirmed" | "cancelled" | "completed"}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function SummaryCard({
  label,
  count,
  href,
}: {
  label: string;
  count: number;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-xl border bg-card p-6 transition-colors hover:bg-accent"
    >
      <p className="text-3xl font-bold tracking-tight">{count}</p>
      <p className="mt-1 text-sm text-muted-foreground">{label}</p>
    </Link>
  );
}

export default function DashboardHome() {
  return (
    <Suspense
      fallback={
        <div className="space-y-8">
          <div>
            <div className="h-8 w-48 bg-muted rounded animate-pulse" />
            <div className="h-4 w-64 bg-muted rounded animate-pulse mt-2" />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </div>
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}
