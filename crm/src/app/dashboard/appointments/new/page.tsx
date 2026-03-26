import { getAllPatientsForSelect } from "../actions";
import { AppointmentForm } from "@/components/admin/appointments/appointment-form";

interface Props {
  searchParams: Promise<{ patientId?: string }>;
}

export default async function NewAppointmentPage({ searchParams }: Props) {
  const params = await searchParams;
  const patients = await getAllPatientsForSelect();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Nuevo turno</h1>
        <p className="text-muted-foreground">Agendá una nueva cita veterinaria</p>
      </div>
      <AppointmentForm patients={patients} defaultPatientId={params.patientId} />
    </div>
  );
}
