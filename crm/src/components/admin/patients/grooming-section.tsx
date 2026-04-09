import { buttonVariants } from "@/components/ui/button-variants";
import { Separator } from "@/components/ui/separator";
import { GroomingProfileForm } from "@/components/admin/grooming/grooming-profile-form";
import type { GroomingProfile } from "@/db/schema";

const tierLabels: Record<string, string> = {
  min: "Tranquilo",
  mid: "Normal",
  hard: "Difícil",
};

const FINDINGS_LABELS: Record<string, string> = {
  pulgas: "Pulgas",
  garrapatas: "Garrapatas",
  tumores: "Tumores",
  otitis: "Otitis",
  dermatitis: "Dermatitis",
};

type SessionWithStaff = {
  id: string;
  patientId: string;
  appointmentId: string | null;
  serviceId: string | null;
  serviceName: string | null;
  priceTier: "min" | "mid" | "hard" | null;
  finalPrice: string | null;
  beforePhotoPath: string | null;
  afterPhotoPath: string | null;
  findings: string[] | null;
  notes: string | null;
  createdAt: Date;
  groomedByName: string | null;
};

interface Props {
  patientId: string;
  profile: GroomingProfile | null;
  sessions: SessionWithStaff[];
  canEdit: boolean;
}

function serviceLabel(session: SessionWithStaff): string {
  if (session.serviceName) return session.serviceName;
  if (session.priceTier) return tierLabels[session.priceTier] ?? session.priceTier;
  return "—";
}

export function GroomingSection({ patientId, profile, sessions, canEdit }: Props) {
  const lastSession = sessions[0] ?? null;

  return (
    <div className="space-y-8">
      {/* Profile */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Perfil de estética</h2>
          {canEdit && (
            <a
              href={`/dashboard/patients/${patientId}/grooming/new`}
              className={buttonVariants({ size: "sm" })}
            >
              + Registrar sesión
            </a>
          )}
        </div>

        {canEdit ? (
          <GroomingProfileForm patientId={patientId} profile={profile} />
        ) : (
          profile ? (
            <div className="grid gap-4 rounded-lg border p-4 sm:grid-cols-3">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Comportamiento</p>
                <p className="mt-1">{profile.behaviorScore ? `${profile.behaviorScore}/10` : "—"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Tipo de pelaje</p>
                <p className="mt-1">{profile.coatType ?? "—"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Tiempo estimado</p>
                <p className="mt-1">{profile.estimatedMinutes ? `${profile.estimatedMinutes} min` : "—"}</p>
              </div>
              {profile.behaviorNotes && (
                <div className="sm:col-span-3">
                  <p className="text-sm font-medium text-muted-foreground">Notas de comportamiento</p>
                  <p className="mt-1 text-sm">{profile.behaviorNotes}</p>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Sin perfil de estética aún.</p>
          )
        )}
      </div>

      <Separator />

      {/* Last session */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Última sesión</h2>
        {lastSession ? (
          <div className="space-y-3 rounded-lg border p-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Fecha</p>
                <p className="mt-0.5 text-sm">
                  {new Date(lastSession.createdAt).toLocaleDateString("es-AR", { dateStyle: "long" })}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Esteticista</p>
                <p className="mt-0.5 text-sm">{lastSession.groomedByName ?? "—"}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Servicio</p>
                <p className="mt-0.5 text-sm">{serviceLabel(lastSession)}</p>
              </div>
              {lastSession.finalPrice && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Precio final</p>
                  <p className="mt-0.5 text-sm">${lastSession.finalPrice}</p>
                </div>
              )}
            </div>
            {lastSession.findings && lastSession.findings.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground">Hallazgos</p>
                <div className="mt-1 flex flex-wrap gap-1">
                  {lastSession.findings.map((f) => (
                    <span key={f} className="rounded-full bg-orange-100 px-2 py-0.5 text-xs text-orange-800">
                      {FINDINGS_LABELS[f] ?? f}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {lastSession.notes && (
              <div>
                <p className="text-xs font-medium text-muted-foreground">Observaciones</p>
                <p className="mt-0.5 text-sm">{lastSession.notes}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed py-6 text-center text-sm text-muted-foreground">
            No hay sesiones registradas aún.
          </div>
        )}
      </div>

      {/* Session history */}
      {sessions.length > 1 && (
        <>
          <Separator />
          <div className="space-y-3">
            <h2 className="text-lg font-semibold">Historial de sesiones</h2>
            <div className="overflow-hidden rounded-lg border">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium">Fecha</th>
                    <th className="px-4 py-3 text-left font-medium">Esteticista</th>
                    <th className="px-4 py-3 text-left font-medium">Servicio</th>
                    <th className="px-4 py-3 text-left font-medium">Precio</th>
                    <th className="px-4 py-3 text-left font-medium">Hallazgos</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {sessions.slice(1).map((s) => (
                    <tr key={s.id}>
                      <td className="px-4 py-3">
                        {new Date(s.createdAt).toLocaleDateString("es-AR")}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{s.groomedByName ?? "—"}</td>
                      <td className="px-4 py-3">{serviceLabel(s)}</td>
                      <td className="px-4 py-3">{s.finalPrice ? `$${s.finalPrice}` : "—"}</td>
                      <td className="px-4 py-3">
                        {s.findings && s.findings.length > 0
                          ? s.findings.map((f) => FINDINGS_LABELS[f] ?? f).join(", ")
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
