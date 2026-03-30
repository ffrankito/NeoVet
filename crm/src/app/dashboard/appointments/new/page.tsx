import { getAllPatientsForSelect, getAllClientsForSelect } from "../actions";
import { getActiveServices } from "@/app/dashboard/settings/services/actions";
import { AppointmentForm } from "@/components/admin/appointments/appointment-form";

interface Props {
  searchParams: Promise<{ patientId?: string; date?: string; time?: string }>;
}

export default async function NewAppointmentPage({ searchParams }: Props) {
  const params = await searchParams;
  const [allPatients, allClients, activeServices] = await Promise.all([
    getAllPatientsForSelect(),
    getAllClientsForSelect(),
    getActiveServices(),
  ]);

  // Construimos el defaultScheduledAt si vienen date y time desde el calendario
  let defaultScheduledAt: string | undefined;
  if (params.date && params.time) {
    defaultScheduledAt = `${params.date}T${params.time}`;
  }

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
        defaultScheduledAt={defaultScheduledAt}
      />
    </div>
  );
}