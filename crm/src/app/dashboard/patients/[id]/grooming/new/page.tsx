import { notFound } from "next/navigation";
import { getPatient } from "@/app/dashboard/patients/actions";
import { getGroomersForSelect, getEsteticaServicesForSelect } from "@/app/dashboard/grooming/actions";
import { GroomingSessionForm } from "@/components/admin/grooming/grooming-session-form";

interface Props {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ appointmentId?: string }>;
}

export default async function NewGroomingSessionPage({ params, searchParams }: Props) {
  const { id } = await params;
  const { appointmentId } = await searchParams;

  const [patient, groomers, esteticaServices] = await Promise.all([
    getPatient(id),
    getGroomersForSelect(),
    getEsteticaServicesForSelect(),
  ]);

  if (!patient) notFound();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Registrar sesión de estética</h1>
        <p className="text-muted-foreground">{patient.name}</p>
      </div>
      <GroomingSessionForm
        patientId={id}
        appointmentId={appointmentId ?? null}
        groomers={groomers}
        esteticaServices={esteticaServices}
      />
    </div>
  );
}
