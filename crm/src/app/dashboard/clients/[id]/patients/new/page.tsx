import { notFound } from "next/navigation";
import { getClient } from "../../../actions";
import { PatientForm } from "@/components/admin/patients/patient-form";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function NewPatientPage({ params }: Props) {
  const { id } = await params;
  const client = await getClient(id);

  if (!client) notFound();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Nueva mascota</h1>
        <p className="text-muted-foreground">
          Registrá una mascota para {client.name}
        </p>
      </div>
      <PatientForm clientId={id} />
    </div>
  );
}
