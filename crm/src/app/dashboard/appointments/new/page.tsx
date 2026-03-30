import { getAllPatientsForSelect, getAllClientsForSelect } from "../actions";
import { getActiveServices } from "@/app/dashboard/settings/services/actions";
import { AppointmentForm } from "@/components/admin/appointments/appointment-form";

interface Props {
  searchParams: Promise<{ patientId?: string }>;
}

export default async function NewAppointmentPage({ searchParams }: Props) {
  const params = await searchParams;
  const [allPatients, allClients, activeServices] = await Promise.all([
    getAllPatientsForSelect(),
    getAllClientsForSelect(),
    getActiveServices(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Nuevo turno</h1>
        <p className="text-muted-foreground">Agendá una nueva cita veterinaria</p>
      </div>
      <AppointmentForm
        patients={allPatients}
        clients={allClients}
        services={activeServices}
        defaultPatientId={params.patientId}
      />
    </div>
  );
}