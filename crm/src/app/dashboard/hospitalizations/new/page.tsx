import Link from "next/link";
import { getPatient } from "@/app/dashboard/patients/actions";
import { AdmissionForm } from "@/components/admin/hospitalizations/admission-form";
import { getAllClientsForSelect, getAllPatientsForSelect } from "@/app/dashboard/appointments/actions";

interface Props {
  searchParams: Promise<{
    patientId?: string;
    consultationId?: string;
  }>;
}

export default async function NewHospitalizationPage({ searchParams }: Props) {
  const params = await searchParams;
  const patientId = params.patientId ?? "";
  const consultationId = params.consultationId ?? "";

  const [clients, patients] = await Promise.all([
    getAllClientsForSelect(),
    getAllPatientsForSelect(),
  ]);

  let patientLabel: string | null = null;
  if (patientId) {
    const patient = await getPatient(patientId);
    if (patient) {
      patientLabel = `${patient.name} (${patient.species ?? "—"})`;
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/dashboard/hospitalizations"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          ← Volver a internaciones
        </Link>
        <h1 className="mt-2 text-2xl font-bold tracking-tight">
          Admitir paciente
        </h1>
        <p className="text-muted-foreground">
          Registrar una nueva internación
        </p>
      </div>

      {patientLabel && (
        <div className="rounded-lg border bg-muted/50 px-4 py-3">
          <p className="text-sm font-medium text-muted-foreground">Paciente</p>
          <p className="mt-1 font-medium">{patientLabel}</p>
        </div>
      )}

      <AdmissionForm
        patientId={patientId}
        consultationId={consultationId}
        clients={clients}
        patients={patients}
      />
    </div>
  );
}