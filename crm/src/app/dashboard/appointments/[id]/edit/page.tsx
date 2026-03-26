import { notFound } from "next/navigation";
import { getAppointment, getAllPatientsForSelect } from "../../actions";
import { AppointmentForm } from "@/components/admin/appointments/appointment-form";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditAppointmentPage({ params }: Props) {
  const { id } = await params;
  const [apt, patients] = await Promise.all([
    getAppointment(id),
    getAllPatientsForSelect(),
  ]);

  if (!apt) notFound();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Editar turno</h1>
        <p className="text-muted-foreground">
          {apt.patientName} — {new Date(apt.scheduledAt).toLocaleDateString("es-AR")}
        </p>
      </div>
      <AppointmentForm appointment={apt} patients={patients} />
    </div>
  );
}
