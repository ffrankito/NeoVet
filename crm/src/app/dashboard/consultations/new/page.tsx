import { notFound } from "next/navigation";
import { db } from "@/db";
import { patients, clients } from "@/db/schema";
import { eq } from "drizzle-orm";
import { ConsultationForm } from "@/components/admin/consultations/consultation-form";

interface Props {
  searchParams: Promise<{ patientId?: string; appointmentId?: string }>;
}

export default async function NewConsultationPage({ searchParams }: Props) {
  const { patientId, appointmentId } = await searchParams;

  if (!patientId) notFound();

  const [patient] = await db
    .select({ id: patients.id, name: patients.name, clientId: patients.clientId })
    .from(patients)
    .where(eq(patients.id, patientId))
    .limit(1);

  if (!patient) notFound();

  const [client] = await db
    .select({ name: clients.name })
    .from(clients)
    .where(eq(clients.id, patient.clientId))
    .limit(1);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Nueva consulta</h1>
        <p className="text-muted-foreground">
          {patient.name} · {client?.name}
        </p>
      </div>
      <ConsultationForm
        patientId={patientId}
        appointmentId={appointmentId}
      />
    </div>
  );
}
