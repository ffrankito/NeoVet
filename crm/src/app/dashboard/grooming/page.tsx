import { db } from "@/db";
import { groomingSessions, patients, clients, staff, services } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import Link from "next/link";

async function getRecentGroomingSessions() {
  const groomedBy = db.$with("groomed_by").as(
    db.select({ id: staff.id, name: staff.name }).from(staff)
  );

  return db
    .with(groomedBy)
    .select({
      id: groomingSessions.id,
      patientId: groomingSessions.patientId,
      patientName: patients.name,
      clientName: clients.name,
      clientId: clients.id,
      serviceName: services.name,
      finalPrice: groomingSessions.finalPrice,
      createdAt: groomingSessions.createdAt,
      groomedByName: groomedBy.name,
    })
    .from(groomingSessions)
    .innerJoin(patients, eq(groomingSessions.patientId, patients.id))
    .innerJoin(clients, eq(patients.clientId, clients.id))
    .leftJoin(groomedBy, eq(groomingSessions.groomedById, groomedBy.id))
    .leftJoin(services, eq(groomingSessions.serviceId, services.id))
    .orderBy(desc(groomingSessions.createdAt))
    .limit(50);
}

export default async function GroomingPage() {
  const sessions = await getRecentGroomingSessions();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Estética</h1>
        <p className="text-muted-foreground">Historial de sesiones de peluquería</p>
      </div>

      {sessions.length === 0 ? (
        <div className="rounded-lg border border-dashed py-10 text-center text-muted-foreground">
          No hay sesiones de estética registradas.
        </div>
      ) : (
        <div className="rounded-lg border divide-y">
          {sessions.map((s) => (
            <div key={s.id} className="flex items-center gap-4 px-4 py-3">
              <div className="flex-1 min-w-0">
                <Link
                  href={`/dashboard/patients/${s.patientId}`}
                  className="font-medium hover:underline truncate block"
                >
                  {s.patientName}
                </Link>
                <p className="text-sm text-muted-foreground truncate">
                  <Link href={`/dashboard/clients/${s.clientId}`} className="hover:underline">
                    {s.clientName}
                  </Link>
                  {s.serviceName ? ` — ${s.serviceName}` : ""}
                  {s.groomedByName ? ` · ${s.groomedByName}` : ""}
                </p>
              </div>
              <div className="text-right shrink-0">
                {s.finalPrice && (
                  <p className="text-sm font-medium">
                    ${Number(s.finalPrice).toLocaleString("es-AR")}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  {new Date(s.createdAt).toLocaleDateString("es-AR", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                  })}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}