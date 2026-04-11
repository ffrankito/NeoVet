import Link from "next/link";
import { notFound } from "next/navigation";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { getHospitalization } from "../actions";
import { ObservationForm } from "@/components/admin/hospitalizations/observation-form";
import { DischargeButton } from "@/components/admin/hospitalizations/discharge-button";
import { DeleteObservationButton } from "@/components/admin/hospitalizations/delete-observation-button";

interface Props {
  params: Promise<{ id: string }>;
}

function formatDateAR(date: Date | string): string {
  return new Date(date).toLocaleString("es-AR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Argentina/Buenos_Aires",
  });
}

function InfoCard({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  if (!value) return null;
  return (
    <div>
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <p className="mt-1">{value}</p>
    </div>
  );
}

function VitalItem({
  label,
  value,
  unit,
}: {
  label: string;
  value: string | null;
  unit: string;
}) {
  if (!value) return null;
  return (
    <div className="rounded-md border px-3 py-2">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm font-medium">
        {value} {unit}
      </p>
    </div>
  );
}

function ClinicalItem({
  label,
  value,
}: {
  label: string;
  value: string | null;
}) {
  if (!value) return null;
  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-0.5 whitespace-pre-wrap text-sm">{value}</p>
    </div>
  );
}

export default async function HospitalizationDetailPage({ params }: Props) {
  const { id } = await params;
  const hospitalization = await getHospitalization(id);

  if (!hospitalization) notFound();

  const isActive = !hospitalization.dischargedAt;

  return (
    <div className="space-y-8">
      {/* Back link */}
      <Link
        href="/dashboard/hospitalizations"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        ← Volver a internaciones
      </Link>

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">
              {hospitalization.patientName}
            </h1>
            {isActive ? (
              <Badge variant="default">Internado</Badge>
            ) : (
              <Badge variant="secondary">Alta</Badge>
            )}
          </div>
          <p className="mt-1 text-muted-foreground">
            {hospitalization.patientSpecies}
            {hospitalization.patientBreed
              ? ` · ${hospitalization.patientBreed}`
              : ""}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Dueño:{" "}
            <Link
              href={`/dashboard/clients/${hospitalization.clientId}`}
              className="text-primary hover:underline"
            >
              {hospitalization.clientName}
            </Link>
            {hospitalization.clientPhone
              ? ` · ${hospitalization.clientPhone}`
              : ""}
          </p>
        </div>

        {isActive && (
          <DischargeButton hospitalizationId={id} />
        )}
      </div>

      <Separator />

      {/* Info cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <InfoCard
          label="Ingreso"
          value={formatDateAR(hospitalization.admittedAt)}
        />
        <InfoCard
          label="Admitido por"
          value={hospitalization.admittedByName}
        />
        {hospitalization.dischargedAt && (
          <InfoCard
            label="Alta"
            value={formatDateAR(hospitalization.dischargedAt)}
          />
        )}
        {hospitalization.dischargedByName && (
          <InfoCard
            label="Alta dada por"
            value={hospitalization.dischargedByName}
          />
        )}
      </div>

      {hospitalization.reason && (
        <div>
          <p className="text-sm font-medium text-muted-foreground">Motivo</p>
          <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed">
            {hospitalization.reason}
          </p>
        </div>
      )}

      {hospitalization.notes && (
        <div>
          <p className="text-sm font-medium text-muted-foreground">Notas</p>
          <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed">
            {hospitalization.notes}
          </p>
        </div>
      )}

      <Separator />

      {/* Observations section */}
      <div className="space-y-6">
        <h2 className="text-lg font-semibold">Observaciones</h2>

        {/* Add observation form — only for active hospitalizations */}
        {isActive && (
          <div className="rounded-lg border bg-muted/30 p-4">
            <h3 className="mb-4 text-sm font-semibold">
              Nueva observación
            </h3>
            <ObservationForm hospitalizationId={id} />
          </div>
        )}

        {/* Observations timeline */}
        {hospitalization.observations.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No hay observaciones registradas.
          </p>
        ) : (
          <div className="space-y-4">
            {hospitalization.observations.map((obs) => {
              const hasVitals =
                obs.weightKg || obs.temperature || obs.heartRate || obs.respiratoryRate;
              const hasExam =
                obs.capillaryRefillTime || obs.mucousMembranes || obs.sensorium;
              const hasClinical =
                obs.feeding ||
                obs.hydration ||
                obs.medication ||
                obs.urineOutput ||
                obs.fecesOutput;

              return (
                <div key={obs.id} className="rounded-lg border p-4">
                  {/* Observation header */}
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium">
                        {formatDateAR(obs.recordedAt)}
                      </p>
                      {obs.recordedByName && (
                        <p className="text-xs text-muted-foreground">
                          {obs.recordedByName}
                        </p>
                      )}
                    </div>
                    <DeleteObservationButton observationId={obs.id} />
                  </div>

                  {/* Vitals grid */}
                  {hasVitals && (
                    <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                      <VitalItem label="Peso" value={obs.weightKg} unit="kg" />
                      <VitalItem
                        label="Temp."
                        value={obs.temperature}
                        unit="°C"
                      />
                      <VitalItem
                        label="FC"
                        value={obs.heartRate}
                        unit="lpm"
                      />
                      <VitalItem
                        label="FR"
                        value={obs.respiratoryRate}
                        unit="rpm"
                      />
                    </div>
                  )}

                  {/* Physical exam */}
                  {hasExam && (
                    <div className="mt-3 grid grid-cols-3 gap-2">
                      <VitalItem
                        label="Llenado capilar"
                        value={obs.capillaryRefillTime}
                        unit=""
                      />
                      <VitalItem
                        label="Mucosas"
                        value={obs.mucousMembranes}
                        unit=""
                      />
                      <VitalItem
                        label="Sensorio"
                        value={obs.sensorium}
                        unit=""
                      />
                    </div>
                  )}

                  {/* Clinical observations */}
                  {hasClinical && (
                    <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      <ClinicalItem
                        label="Alimentación"
                        value={obs.feeding}
                      />
                      <ClinicalItem
                        label="Hidratación"
                        value={obs.hydration}
                      />
                      <ClinicalItem
                        label="Medicación"
                        value={obs.medication}
                      />
                      <ClinicalItem label="Orina" value={obs.urineOutput} />
                      <ClinicalItem label="Heces" value={obs.fecesOutput} />
                    </div>
                  )}

                  {/* Notes */}
                  {obs.notes && (
                    <div className="mt-3">
                      <p className="text-xs font-medium text-muted-foreground">
                        Notas
                      </p>
                      <p className="mt-0.5 whitespace-pre-wrap text-sm">
                        {obs.notes}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Link to consultation if exists */}
      {hospitalization.consultationId && (
        <>
          <Separator />
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Consulta vinculada
            </p>
            <Link
              href={`/dashboard/consultations/${hospitalization.consultationId}`}
              className="mt-1 inline-flex text-sm text-primary hover:underline"
            >
              Ver consulta →
            </Link>
          </div>
        </>
      )}

      {/* Link to patient */}
      <Separator />
      <Link
        href={`/dashboard/patients/${hospitalization.patientId}`}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        ← Volver a {hospitalization.patientName}
      </Link>
    </div>
  );
}
