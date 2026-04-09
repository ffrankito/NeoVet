import Link from "next/link";
import { getPatient } from "@/app/dashboard/patients/actions";
import { getStaffForProcedure } from "../actions";
import { ProcedureForm } from "@/components/admin/procedures/procedure-form";
import { getAllClientsForSelect, getAllPatientsForSelect } from "@/app/dashboard/appointments/actions";

interface Props {
  searchParams: Promise<{
    patientId?: string;
    hospitalizationId?: string;
  }>;
}

export default async function NewProcedurePage({ searchParams }: Props) {
  const params = await searchParams;
  const patientId = params.patientId ?? "";
  const hospitalizationId = params.hospitalizationId ?? "";

  const [staffList, clients, patients] = await Promise.all([
    getStaffForProcedure(),
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
          href="/dashboard/procedures"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          ← Volver a procedimientos
        </Link>
        <h1 className="mt-2 text-2xl font-bold tracking-tight">
          Nuevo procedimiento
        </h1>
        <p className="text-muted-foreground">
          Registrar una cirugía o procedimiento médico
        </p>
      </div>

      {patientLabel && (
        <div className="rounded-lg border bg-muted/50 px-4 py-3">
          <p className="text-sm font-medium text-muted-foreground">Paciente</p>
          <p className="mt-1 font-medium">{patientLabel}</p>
        </div>
      )}

      <ProcedureForm
        staffList={staffList}
        clients={clients}
        patients={patients}
        defaultPatientId={patientId || undefined}
        defaultPatientName={patientLabel || undefined}
        defaultHospitalizationId={hospitalizationId || undefined}
      />
    </div>
  );
}