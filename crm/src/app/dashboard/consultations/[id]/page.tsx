import { notFound } from "next/navigation";
import { getConsultation } from "../actions";
import { getTreatmentItems } from "../treatment-actions";
import { getComplementaryMethods } from "../complementary-actions";
import { buttonVariants } from "@/components/ui/button-variants";
import { Separator } from "@/components/ui/separator";
import { DeleteConsultationButton } from "@/components/admin/consultations/delete-consultation-button";
import { TreatmentItemToggle } from "@/components/admin/consultations/treatment-item-toggle";
import { ComplementaryMethodsSection } from "@/components/admin/consultations/complementary-methods-section";

interface Props {
  params: Promise<{ id: string }>;
}

function VitalRow({ label, value, unit }: { label: string; value: string | null; unit: string }) {
  if (!value) return null;
  return (
    <div>
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <p className="mt-1">{value} {unit}</p>
    </div>
  );
}

function SoapSection({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <div className="space-y-1">
      <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">{label}</p>
      <p className="whitespace-pre-wrap text-sm leading-relaxed">{value}</p>
    </div>
  );
}

export default async function ConsultationDetailPage({ params }: Props) {
  const { id } = await params;
  const [consultation, items, methods] = await Promise.all([
    getConsultation(id),
    getTreatmentItems(id),
    getComplementaryMethods(id),
  ]);

  if (!consultation) notFound();

  const hasVitals =
    consultation.weightKg ||
    consultation.temperature ||
    consultation.heartRate ||
    consultation.respiratoryRate;

  const hasSoap =
    consultation.subjective ||
    consultation.objective ||
    consultation.assessment ||
    consultation.plan;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Consulta clínica</h1>
          <p className="mt-1 text-muted-foreground">
            {new Date(consultation.createdAt).toLocaleDateString("es-AR", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}{" "}
            ·{" "}
            <a
              href={`/dashboard/patients/${consultation.patientId}`}
              className="text-primary hover:underline"
            >
              {consultation.patient?.name}
            </a>
          </p>
        </div>
        <div className="flex gap-2">
          <a
            href={`/dashboard/consultations/${id}/edit`}
            className={buttonVariants({ variant: "outline" })}
          >
            Editar
          </a>
          <DeleteConsultationButton consultationId={id} />
        </div>
      </div>

      <Separator />

      {/* Vitals */}
      {hasVitals && (
        <>
          <div>
            <h2 className="mb-4 text-lg font-semibold">Signos vitales</h2>
            <div className="grid gap-4 sm:grid-cols-4">
              <VitalRow label="Peso" value={consultation.weightKg} unit="kg" />
              <VitalRow label="Temperatura" value={consultation.temperature} unit="°C" />
              <VitalRow label="Frec. cardíaca" value={consultation.heartRate} unit="lpm" />
              <VitalRow label="Frec. respiratoria" value={consultation.respiratoryRate} unit="rpm" />
            </div>
          </div>
          <Separator />
        </>
      )}

      {/* SOAP */}
      {hasSoap && (
        <>
          <div className="space-y-6">
            <h2 className="text-lg font-semibold">Historia SOAP</h2>
            <SoapSection label="Subjetivo" value={consultation.subjective} />
            <SoapSection label="Objetivo" value={consultation.objective} />
            <SoapSection label="Diagnóstico" value={consultation.assessment} />
            <SoapSection label="Plan" value={consultation.plan} />
          </div>
          <Separator />
        </>
      )}

      {/* Free-text notes */}
      {consultation.notes && (
        <>
          <div className="space-y-2">
            <h2 className="text-lg font-semibold">Notas</h2>
            <p className="whitespace-pre-wrap text-sm leading-relaxed">{consultation.notes}</p>
          </div>
          <Separator />
        </>
      )}

      {/* Treatment plan */}
      {items.length > 0 && (
        <>
          <div className="space-y-3">
            <h2 className="text-lg font-semibold">Plan de tratamiento</h2>
            <div className="space-y-2">
              {items.map((item) => (
                <div key={item.id} className="space-y-1">
                  <TreatmentItemToggle item={item} />
                  {(item.dose || item.frequency || item.durationDays) && (
                    <p className="pl-7 text-xs text-muted-foreground">
                      {[
                        item.dose,
                        item.frequency,
                        item.durationDays ? `${item.durationDays} días` : null,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
          <Separator />
        </>
      )}

      {/* Complementary methods */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Métodos complementarios</h2>
        <ComplementaryMethodsSection consultationId={id} methods={methods} />
      </div>

      <Separator />

      {/* Linked appointment */}
      {consultation.appointment && (
        <div>
          <p className="text-sm font-medium text-muted-foreground">Turno vinculado</p>
          <a
            href={`/dashboard/appointments/${consultation.appointment.id}`}
            className="mt-1 text-sm text-primary hover:underline"
          >
            {new Date(consultation.appointment.scheduledAt).toLocaleString("es-AR", {
              dateStyle: "short",
              timeStyle: "short",
            })}
          </a>
        </div>
      )}

      {/* Back link */}
      <a
        href={`/dashboard/patients/${consultation.patientId}`}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        ← Volver a {consultation.patient?.name}
      </a>
    </div>
  );
}
