import Link from "next/link";
import { getRecentGroomingSessions } from "./actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface Props {
  searchParams: Promise<{ q?: string }>;
}

export default async function GroomingPage({ searchParams }: Props) {
  const params = await searchParams;
  const q = params.q ?? "";
  const sessions = await getRecentGroomingSessions({ search: q });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Estética</h1>
        <p className="text-muted-foreground">Historial de sesiones de peluquería</p>
      </div>

      <form action="/dashboard/grooming" method="GET" className="flex flex-wrap items-end gap-3">
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground" htmlFor="grooming-search">
            Buscar
          </label>
          <Input
            id="grooming-search"
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Mascota, dueño, DNI, teléfono, dirección"
            className="w-60"
          />
        </div>
        <Button type="submit" variant="outline">
          Buscar
        </Button>
        <span className="ml-auto text-sm text-muted-foreground">
          {sessions.length} {sessions.length === 1 ? "sesión" : "sesiones"}
          {q ? ` para "${q}"` : ""}
        </span>
      </form>

      {sessions.length === 0 ? (
        <div className="rounded-lg border border-dashed py-10 text-center text-muted-foreground">
          {q
            ? `No se encontraron sesiones que coincidan con "${q}".`
            : "No hay sesiones de estética registradas."}
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
