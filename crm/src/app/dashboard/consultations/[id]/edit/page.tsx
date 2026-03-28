import { notFound } from "next/navigation";
import { getConsultation } from "../../actions";
import { getTreatmentItems } from "../../treatment-actions";
import { ConsultationForm } from "@/components/admin/consultations/consultation-form";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditConsultationPage({ params }: Props) {
  const { id } = await params;
  const [consultation, items] = await Promise.all([
    getConsultation(id),
    getTreatmentItems(id),
  ]);

  if (!consultation) notFound();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Editar consulta</h1>
        <p className="text-muted-foreground">{consultation.patient?.name}</p>
      </div>
      <ConsultationForm
        consultation={consultation}
        patientId={consultation.patientId}
        treatmentItems={items}
      />
    </div>
  );
}
