import Link from "next/link";
import { db } from "@/db";
import { clients, patients, appointments, staff, services } from "@/db/schema";
import { eq, sql, asc, and, gte, lt, ne, type SQL } from "drizzle-orm";
import { getRole, getSessionStaffId } from "@/lib/auth";
import { todayStartART, todayEndART, formatDateART, formatTimeART } from "@/lib/timezone";
import { Badge } from "@/components/ui/badge";
import { DashboardActions } from "@/components/admin/dashboard-actions";
import { CardSkeleton } from "@/components/admin/skeletons";
import { AppointmentActions } from "@/components/admin/appointments/appointment-actions";
import { getOpenSession } from "@/app/dashboard/cash/actions";
import { getAllClientsForSelect, getAllPatientsForSelect, getServicesForWalkIn } from "@/app/dashboard/appointments/actions";
import { WalkInForm } from "@/components/admin/appointments/walk-in-form";
import { Suspense } from "react";
import { getServiceColors } from "@/lib/calendar-utils";
import { cn } from "@/lib/utils";

const statusLabels: Record<string, string> = {
  pending: "Pendiente",
  confirmed: "Confirmado",
  completed: "Completado",
  cancelled: "Cancelado",
  no_show: "No se presentó",
};

const statusVariants: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  pending: "secondary",
  confirmed: "default",
  completed: "outline",
  cancelled: "destructive",
  no_show: "destructive",
};

function AppointmentRow({
  apt,
  dimmed = false,
}: {
  apt: {
    id: string;
    scheduledAt: Date;
    status: string;
    reason: string | null;
    patientId: string;
    patientName: string;
    clientName: string;
    clientId: string;
    assignedStaffName: string | null;
    appointmentType: string;
    serviceCategory: string | null;
    isWalkIn: boolean;
    isUrgent: boolean;
  };
  dimmed?: boolean;
}) {
  const colors = getServiceColors(apt.serviceCategory);

  return (
    <div
      className={cn(
        "flex items-center gap-4 px-4 py-3",
        dimmed && "opacity-50",
        apt.isUrgent && apt.status === "confirmed" && "bg-red-50 border-l-4 border-l-red-500"
      )}
    >
      {/* Service category dot */}
      <span
        className={cn("h-3 w-3 shrink-0 rounded-full border", colors.bg, colors.border)}
        title={apt.serviceCategory ?? "Sin servicio"}
      />

      {/* Time */}
      <span className="w-14 shrink-0 text-sm font-mono font-medium text-muted-foreground">
        {apt.isWalkIn
          ? "S/T"
          : formatTimeART(apt.scheduledAt, {
              hour: "2-digit",
              minute: "2-digit",
              hour12: false,
            })}
      </span>

      {/* Patient + owner + reason + staff */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <Link
            href={`/dashboard/appointments/${apt.id}`}
            className="font-medium hover:underline truncate"
          >
            {apt.patientName}
          </Link>
          {apt.isWalkIn && (
            <Badge variant="outline" className="text-xs">
              Sin turno
            </Badge>
          )}
          {apt.isUrgent && (
            <Badge variant="destructive" className="text-xs">
              Urgente
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground truncate">
          <Link
            href={`/dashboard/clients/${apt.clientId}`}
            className="hover:underline"
          >
            {apt.clientName}
          </Link>
          {apt.reason ? ` — ${apt.reason}` : ""}
          {apt.assignedStaffName ? (
            <span className="ml-2 text-xs text-primary-600">
              · {apt.assignedStaffName}
            </span>
          ) : null}
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
        status={apt.status as "pending" | "confirmed" | "cancelled" | "completed" | "no_show"}
      />
    </div>
  );
}

async function DashboardContent() {
  const [role, sessionStaffId] = await Promise.all([getRole(), getSessionStaffId()]);
  const isAdmin = role === "admin" || role === "owner";

  const todayStart = todayStartART();
  const todayEnd = todayEndART();

  const todayLabel = formatDateART(new Date(), {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  // Role-based filters: non-admins see only their assigned appointments
  const roleFilters: SQL[] = [];
  if (!isAdmin && sessionStaffId) {
    roleFilters.push(eq(appointments.assignedStaffId, sessionStaffId));
  }
  if (role === "groomer") {
    roleFilters.push(eq(appointments.appointmentType, "grooming"));
  }

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
            ne(appointments.status, "cancelled"),
            ...roleFilters
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
          assignedStaffName: staff.name,
          appointmentType: appointments.appointmentType,
          serviceCategory: services.category,
          isWalkIn: appointments.isWalkIn,
          isUrgent: appointments.isUrgent,
        })
        .from(appointments)
        .innerJoin(patients, eq(appointments.patientId, patients.id))
        .innerJoin(clients, eq(patients.clientId, clients.id))
        .leftJoin(staff, eq(appointments.assignedStaffId, staff.id))
        .leftJoin(services, eq(appointments.serviceId, services.id))
        .where(
          and(
            gte(appointments.scheduledAt, todayStart),
            lt(appointments.scheduledAt, todayEnd),
            ...roleFilters
          )
        )
        .orderBy(asc(appointments.scheduledAt)),
    ]);

  const clientCount = Number(clientCountResult[0].count);
  const patientCount = Number(patientCountResult[0].count);
  const todayCount = Number(todayCountResult[0].count);
  const openCashSession = isAdmin ? await getOpenSession() : null;

  const [walkInClients, walkInPatients, walkInServices] = await Promise.all([
    getAllClientsForSelect(),
    getAllPatientsForSelect(),
    getServicesForWalkIn(),
  ]);

  // Split into 3 sections
  const waitingRoom = todayAppointments
    .filter((apt) => apt.status === "confirmed")
    .sort((a, b) => {
      if (a.isUrgent && !b.isUrgent) return -1;
      if (!a.isUrgent && b.isUrgent) return 1;
      return new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime();
    });

  const scheduled = todayAppointments
    .filter((apt) => apt.status === "pending");

  const finished = todayAppointments
    .filter((apt) => apt.status === "completed" || apt.status === "no_show" || apt.status === "cancelled");

  return (
    <div className="space-y-8">
      {/* Page title */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Panel de control</h1>
        <p className="text-muted-foreground capitalize">{todayLabel}</p>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <SummaryCard label="Clientes" count={clientCount} href="/dashboard/clients" />
        <SummaryCard label="Pacientes" count={patientCount} href="/dashboard/patients" />
        <SummaryCard label="Turnos hoy" count={todayCount} href="/dashboard/appointments" />
      </div>

      {/* Quick actions */}
      <DashboardActions />

      {/* Cash register status — admin only */}
      {isAdmin && (
        <Link
          href="/dashboard/cash"
          className="group flex items-center gap-3 rounded-xl border bg-card p-4 transition-colors hover:bg-accent"
        >
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground">Caja</p>
            {openCashSession ? (
              <p className="text-sm font-semibold text-green-700">Abierta</p>
            ) : (
              <p className="text-sm font-semibold text-red-600">Cerrada</p>
            )}
          </div>
          <span className="text-xs text-muted-foreground group-hover:text-foreground">Ver →</span>
        </Link>
      )}

      {/* Walk-in form */}
      <WalkInForm
        clients={walkInClients}
        patients={walkInPatients}
        services={walkInServices}
      />

      {/* Sala de espera */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">
          Sala de espera
          {waitingRoom.length > 0 && (
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              ({waitingRoom.length})
            </span>
          )}
        </h2>
        {waitingRoom.length === 0 ? (
          <div className="rounded-lg border border-dashed py-6 text-center text-muted-foreground">
            No hay pacientes en espera.
          </div>
        ) : (
          <div className="rounded-lg border divide-y">
            {waitingRoom.map((apt) => (
              <AppointmentRow key={apt.id} apt={apt} />
            ))}
          </div>
        )}
      </div>

      {/* Turnos programados */}
      {scheduled.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">
            Turnos programados
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              ({scheduled.length})
            </span>
          </h2>
          <div className="rounded-lg border divide-y">
            {scheduled.map((apt) => (
              <AppointmentRow key={apt.id} apt={apt} />
            ))}
          </div>
        </div>
      )}

      {/* Completados */}
      {finished.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-muted-foreground">
            Completados
            <span className="ml-2 text-sm font-normal">
              ({finished.length})
            </span>
          </h2>
          <div className="rounded-lg border divide-y">
            {finished.map((apt) => (
              <AppointmentRow key={apt.id} apt={apt} dimmed />
            ))}
          </div>
        </div>
      )}
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
