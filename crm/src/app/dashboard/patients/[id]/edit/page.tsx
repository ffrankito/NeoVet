import { notFound } from "next/navigation";
import { getPatient } from "../../actions";
import { PatientForm } from "@/components/admin/patients/patient-form";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditPatientPage({ params }: Props) {
  const { id } = await params;
  const patient = await getPatient(id);

  if (!patient) notFound();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Editar mascota</h1>
        <p className="text-muted-foreground">{patient.name}</p>
      </div>
      <PatientForm patient={patient} clientId={patient.clientId} />
    </div>
  );
}
