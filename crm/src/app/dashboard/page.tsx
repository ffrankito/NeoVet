export default function DashboardHome() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Panel de control</h1>
        <p className="text-muted-foreground">
          Bienvenido al sistema de gestión de NeoVet.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <DashboardCard
          title="Clientes"
          description="Gestionar dueños de mascotas"
          href="/dashboard/clients"
          icon="👤"
        />
        <DashboardCard
          title="Turnos"
          description="Ver y gestionar citas"
          href="/dashboard/appointments"
          icon="📅"
        />
      </div>
    </div>
  );
}

function DashboardCard({
  title,
  description,
  href,
  icon,
}: {
  title: string;
  description: string;
  href: string;
  icon: string;
}) {
  return (
    <a
      href={href}
      className="group rounded-xl border bg-card p-6 transition-colors hover:bg-accent"
    >
      <div className="text-3xl">{icon}</div>
      <h2 className="mt-3 font-semibold">{title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </a>
  );
}
