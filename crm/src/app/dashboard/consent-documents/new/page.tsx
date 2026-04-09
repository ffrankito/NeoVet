import Link from "next/link";
import { getConsentTemplates } from "../actions";
import { getPatient } from "@/app/dashboard/patients/actions";
import { getSessionStaffId } from "@/lib/auth";
import { db } from "@/db";
import { staff } from "@/db/schema";
import { eq } from "drizzle-orm";
import { ConsentForm } from "@/components/admin/consent-documents/consent-form";
import { getAllClientsForSelect, getAllPatientsForSelect } from "@/app/dashboard/appointments/actions";

interface Props {
  searchParams: Promise<{
    patientId?: string;
    procedureId?: string;
    hospitalizationId?: string;
  }>;
}

export default async function NewConsentDocumentPage({ searchParams }: Props) {
  const params = await searchParams;
  const patientId = params.patientId ?? "";
  const procedureId = params.procedureId ?? "";
  const hospitalizationId = params.hospitalizationId ?? "";

  const [templates, staffMemberId, clients, patients] = await Promise.all([
    getConsentTemplates(),
    getSessionStaffId(),
    getAllClientsForSelect(),
    getAllPatientsForSelect(),
  ]);

  let patientName: string | null = null;
  if (patientId) {
    const patient = await getPatient(patientId);
    if (patient) {
      patientName = `${patient.name} (${patient.species ?? "—"})`;
    }
  }

  let staffName: string | undefined;
  let staffLicenseNumber: string | undefined;
  if (staffMemberId) {
    const [staffRow] = await db
      .select({ name: staff.name, licenseNumber: staff.licenseNumber })
      .from(staff)
      .where(eq(staff.id, staffMemberId))
      .limit(1);
    if (staffRow) {
      staffName = staffRow.name;
      staffLicenseNumber = staffRow.licenseNumber ?? undefined;
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/dashboard/consent-documents"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          ← Volver a documentos de consentimiento
        </Link>
        <h1 className="mt-2 text-2xl font-bold tracking-tight">
          Generar documento de consentimiento
        </h1>
        <p className="text-muted-foreground">
          Seleccioná la plantilla y completá los datos para generar el PDF
        </p>
      </div>

      {patientName && (
        <div className="rounded-lg border bg-muted/50 px-4 py-3">
          <p className="text-sm font-medium text-muted-foreground">Paciente</p>
          <p className="mt-1 font-medium">{patientName}</p>
        </div>
      )}

      <ConsentForm
        templates={templates}
        clients={clients}
        patients={patients}
        patientId={patientId || undefined}
        patientName={patientName || undefined}
        procedureId={procedureId || undefined}
        hospitalizationId={hospitalizationId || undefined}
        staffName={staffName}
        staffLicenseNumber={staffLicenseNumber}
      />
    </div>
  );
}