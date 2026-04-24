import Link from "next/link";
import { db } from "@/db";
import { clients, patients, appointments, staff, services, charges, products } from "@/db/schema";
import { eq, asc, and, gte, lt, inArray, sql, type SQL } from "drizzle-orm";
import { getRole, getSessionStaffId } from "@/lib/auth";
import { todayStartART, todayEndART, formatDateART, formatTimeART } from "@/lib/timezone";
import { Badge } from "@/components/ui/badge";
import { DashboardActions } from "@/components/admin/dashboard-actions";
import { CardSkeleton } from "@/components/admin/skeletons";
import { AppointmentActions } from "@/components/admin/appointments/appointment-actions";
import { getOpenSession } from "@/app/dashboard/cash/actions";
import { getAllPatientsForSelect, getServicesForWalkIn } from "@/app/dashboard/appointments/actions";
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

async function getAdminAlerts() {
  const [unpaidResult, lowStockResult] = await Promise.all([
    db
      .select({ count: sql<number>`count(distinct ${charges.clientId})` })
      .from(charges)
      .where(inArray(charges.status, ["pending", "partial"])),
    db
      .select({ count: sql<number>`count(*)` })
      .from(products)
      .where(
        and(
          eq(products.isActive, true),
          sql`${products.minStock}::numeric > 0`,
          sql`${products.currentStock}::numeric <= ${products.minStock}::numeric`
        )
      ),
  ]);

  return {
    unpaidClients: Number(unpaidResult[0].count),
    lowStock: Number(lowStockResult[0].count),
  };
}

async function DashboardContent({ defaultWalkInPatientId }: { defaultWalkInPatientId?: string }) {
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

  const todayAppointments = await db
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
    .orderBy(asc(appointments.scheduledAt));

  const [openCashSession, adminAlerts, [walkInPatients, walkInServices]] =
    await Promise.all([
      isAdmin ? getOpenSession() : Promise.resolve(null),
      isAdmin ? getAdminAlerts() : Promise.resolve({ unpaidClients: 0, lowStock: 0 }),
      Promise.all([getAllPatientsForSelect(), getServicesForWalkIn()]),
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

  const todayCount = todayAppointments.filter((a) => a.status !== "cancelled").length;
  const completedCount = finished.filter((a) => a.status === "completed").length;
  const pendingCount = scheduled.length;
  const urgentCount = todayAppointments.filter(
    (a) => a.isUrgent && a.status !== "cancelled"
  ).length;
  const nextAppointment = waitingRoom[0];

  return (
    <div className="space-y-8">
      {/* Page title */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Panel de control</h1>
        <p className="text-muted-foreground capitalize">{todayLabel}</p>
      </div>

      {/* KPI row — today-scoped, role-aware */}
      <div className={cn(
        "grid gap-4 sm:grid-cols-2",
        isAdmin ? "lg:grid-cols-4" : "lg:grid-cols-3"
      )}>
        <KpiCard
          label="Turnos hoy"
          value={todayCount}
          sub={`${completedCount} completados · ${pendingCount} pendientes`}
          href="/dashboard/appointments"
        />
        <KpiCard
          label="En espera"
          value={waitingRoom.length}
          sub={
            nextAppointment
              ? `Próximo: ${formatTimeART(nextAppointment.scheduledAt, {
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: false,
                })} · ${nextAppointment.patientName}`
              : "Sin pacientes"
          }
          href="/dashboard/sala-de-espera"
        />
        <KpiCard
          label="Urgentes"
          value={urgentCount}
          sub={urgentCount > 0 ? "Atender primero" : "Sin urgencias"}
          tone={urgentCount > 0 ? "danger" : "default"}
          href="/dashboard/appointments"
        />
        {isAdmin && (
          <KpiCard
            label="Caja"
            value={openCashSession ? "Abierta" : "Cerrada"}
            sub={
              openCashSession
                ? `Desde ${formatTimeART(openCashSession.openedAt, {
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: false,
                  })}`
                : "Tocá para abrir"
            }
            tone={openCashSession ? "success" : "warning"}
            href="/dashboard/cash"
            isText
          />
        )}
      </div>

      {/* Alert strip — admin/owner only */}
      {isAdmin && (
        <div className="flex flex-wrap gap-2">
          <AlertChip
            label="Deudores"
            count={adminAlerts.unpaidClients}
            href="/dashboard/deudores"
          />
          <AlertChip
            label="Stock bajo"
            count={adminAlerts.lowStock}
            href="/dashboard/petshop/products"
          />
        </div>
      )}

      {/* Quick actions */}
      <div className="flex flex-wrap items-center gap-3">
        <DashboardActions />
        <WalkInForm
          patients={walkInPatients}
          services={walkInServices}
          defaultPatientId={defaultWalkInPatientId}
        />
      </div>

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

function AlertChip({
  label,
  count,
  href,
}: {
  label: string;
  count: number;
  href: string;
}) {
  const hasAlert = count > 0;
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-all hover:shadow-sm",
        hasAlert
          ? "border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100"
          : "border-border bg-background text-muted-foreground hover:bg-muted"
      )}
    >
      <span
        className={cn(
          "h-2 w-2 rounded-full",
          hasAlert ? "bg-amber-500" : "bg-muted-foreground/30"
        )}
      />
      <span className="font-medium">{label}</span>
      <span className="tabular-nums text-xs">· {count}</span>
    </Link>
  );
}

function KpiCard({
  label,
  value,
  sub,
  href,
  tone = "default",
  isText = false,
}: {
  label: string;
  value: number | string;
  sub?: string;
  href: string;
  tone?: "default" | "danger" | "success" | "warning";
  isText?: boolean;
}) {
  const toneClass = {
    default: "text-foreground",
    danger: "text-red-600",
    success: "text-green-700",
    warning: "text-amber-700",
  }[tone];

  return (
    <Link
      href={href}
      className="group rounded-xl border bg-card p-5 transition-all hover:border-foreground/20 hover:shadow-sm"
    >
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p
        className={cn(
          "mt-2 font-bold tracking-tight tabular-nums",
          isText ? "text-2xl" : "text-3xl",
          toneClass
        )}
      >
        {value}
      </p>
      {sub && (
        <p className="mt-1 truncate text-xs text-muted-foreground">{sub}</p>
      )}
    </Link>
  );
}

export default async function DashboardHome({
  searchParams,
}: {
  searchParams: Promise<{ walkInPatientId?: string }>;
}) {
  const params = await searchParams;
  return (
    <Suspense
      fallback={
        <div className="space-y-8">
          <div>
            <div className="h-8 w-48 bg-muted rounded animate-pulse" />
            <div className="h-4 w-64 bg-muted rounded animate-pulse mt-2" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </div>
        </div>
      }
    >
      <DashboardContent defaultWalkInPatientId={params.walkInPatientId} />
    </Suspense>
  );
}
