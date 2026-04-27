"use server";

import { revalidatePath } from "next/cache";
import * as Sentry from "@sentry/nextjs";
import { redirect } from "next/navigation";
import { db } from "@/db";
import {
  consentTemplates,
  consentDocuments,
  patients,
  clients,
  procedures,
  staff,
} from "@/db/schema";
import { consentDocumentId as genConsentDocumentId } from "@/lib/ids";
import { eq, desc, and, sql } from "drizzle-orm";
import { z } from "zod";
import { getSessionStaffId, hasRole, isAdminLevel } from "@/lib/auth";
import { buildPatientAwareSearchClause } from "@/lib/search/patient-aware-search";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  renderConsentPdf,
  type ConsentTemplateType,
} from "@/lib/pdf/render-consent";
import type { SurgeryConsentProps } from "@/lib/pdf/templates/surgery-consent";
import type { EuthanasiaConsentProps } from "@/lib/pdf/templates/euthanasia-consent";
import type { ReproductiveAgreementProps } from "@/lib/pdf/templates/reproductive-agreement";
import type { SedationConsentProps } from "@/lib/pdf/templates/sedation-consent";
import { formatDateART } from "@/lib/timezone";

// ── Queries ──────────────────────────────────────────────────────────────────

export async function getConsentTemplates() {
  return db
    .select({ id: consentTemplates.id, name: consentTemplates.name })
    .from(consentTemplates)
    .where(eq(consentTemplates.isActive, true))
    .orderBy(consentTemplates.name);
}

export async function getConsentDocuments(opts?: {
  page?: number;
  limit?: number;
  patientId?: string;
  search?: string;
}) {
  const page = opts?.page ?? 1;
  const limit = opts?.limit ?? 20;
  const offset = (page - 1) * limit;

  const conditions = [];
  if (opts?.patientId) {
    conditions.push(eq(consentDocuments.patientId, opts.patientId));
  }

  const searchClause = buildPatientAwareSearchClause(opts?.search);
  if (searchClause) conditions.push(searchClause);

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [data, countResult] = await Promise.all([
    db
      .select({
        id: consentDocuments.id,
        templateName: consentTemplates.name,
        patientName: patients.name,
        clientName: clients.name,
        generatedAt: consentDocuments.generatedAt,
        storagePath: consentDocuments.storagePath,
      })
      .from(consentDocuments)
      .leftJoin(
        consentTemplates,
        eq(consentDocuments.templateId, consentTemplates.id)
      )
      .innerJoin(patients, eq(consentDocuments.patientId, patients.id))
      .leftJoin(clients, eq(consentDocuments.clientId, clients.id))
      .where(whereClause)
      .orderBy(desc(consentDocuments.generatedAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)` })
      .from(consentDocuments)
      .innerJoin(patients, eq(consentDocuments.patientId, patients.id))
      .leftJoin(clients, eq(consentDocuments.clientId, clients.id))
      .where(whereClause),
  ]);

  return {
    data,
    total: Number(countResult[0].count),
    page,
    limit,
    totalPages: Math.ceil(Number(countResult[0].count) / limit),
  };
}

export async function getConsentDocumentsByPatient(patientId: string) {
  return db
    .select({
      id: consentDocuments.id,
      templateName: consentTemplates.name,
      generatedAt: consentDocuments.generatedAt,
      storagePath: consentDocuments.storagePath,
    })
    .from(consentDocuments)
    .leftJoin(
      consentTemplates,
      eq(consentDocuments.templateId, consentTemplates.id)
    )
    .where(eq(consentDocuments.patientId, patientId))
    .orderBy(desc(consentDocuments.generatedAt));
}

// ── Generate consent document ────────────────────────────────────────────────

const generateSchema = z.object({
  templateId: z.string().min(1, "La plantilla es obligatoria."),
  patientId: z.string().min(1, "El paciente es obligatorio."),
  procedureId: z.string().optional(),
  hospitalizationId: z.string().optional(),
  customFields: z.string().optional(),
});

export async function generateConsentDocument(formData: FormData) {
  const canGenerate = await hasRole("admin", "owner", "vet");
  if (!canGenerate) return { error: "No autorizado." };

  const staffMemberId = await getSessionStaffId();
  if (!staffMemberId) return { error: "No se pudo identificar al usuario." };

  const raw = {
    templateId: (formData.get("templateId") as string)?.trim() ?? "",
    patientId: (formData.get("patientId") as string)?.trim() ?? "",
    procedureId: (formData.get("procedureId") as string)?.trim() || undefined,
    hospitalizationId:
      (formData.get("hospitalizationId") as string)?.trim() || undefined,
    customFields:
      (formData.get("customFields") as string)?.trim() || undefined,
  };

  const parsed = generateSchema.safeParse(raw);
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const d = parsed.data;

  // Parse custom fields JSON
  let customFields: Record<string, string> = {};
  if (d.customFields) {
    try {
      customFields = JSON.parse(d.customFields);
    } catch (err) {
      Sentry.captureException(err);
      return { error: "Campos personalizados con formato inválido." };
    }
  }

  // Fetch template
  const [template] = await db
    .select({
      id: consentTemplates.id,
      name: consentTemplates.name,
      bodyTemplate: consentTemplates.bodyTemplate,
    })
    .from(consentTemplates)
    .where(eq(consentTemplates.id, d.templateId))
    .limit(1);

  if (!template) return { error: "Plantilla no encontrada." };

  // Fetch patient + client data
  const [patient] = await db
    .select({
      id: patients.id,
      name: patients.name,
      species: patients.species,
      sex: patients.sex,
      breed: patients.breed,
      coatColor: patients.coatColor,
      weightKg: patients.weightKg,
      dateOfBirth: patients.dateOfBirth,
      gvetHistoryNumber: patients.gvetHistoryNumber,
      clientId: patients.clientId,
    })
    .from(patients)
    .where(eq(patients.id, d.patientId))
    .limit(1);

  if (!patient) return { error: "Paciente no encontrado." };

  const [client] = await db
    .select({
      id: clients.id,
      name: clients.name,
      dni: clients.dni,
      address: clients.address,
      phone: clients.phone,
      email: clients.email,
    })
    .from(clients)
    .where(eq(clients.id, patient.clientId))
    .limit(1);

  if (!client) return { error: "Cliente (dueño) no encontrado." };

  // Fetch procedure description if procedureId provided
  let procedureDescription: string | null = null;
  if (d.procedureId) {
    const [proc] = await db
      .select({ description: procedures.description })
      .from(procedures)
      .where(eq(procedures.id, d.procedureId))
      .limit(1);
    procedureDescription = proc?.description ?? null;
  }

  // Determine template type from the template name
  const nameLower = template.name.toLowerCase();
  let templateType: ConsentTemplateType;
  if (nameLower.includes("cirugía") || nameLower.includes("cirugia")) {
    templateType = "surgery_consent";
  } else if (nameLower.includes("eutanasia")) {
    templateType = "euthanasia_consent";
  } else if (nameLower.includes("reproductiva")) {
    templateType = "reproductive_agreement";
  } else if (nameLower.includes("sedaci\u00f3n") || nameLower.includes("sedacion")) {
    templateType = "sedation_consent";
  } else {
    templateType = "surgery_consent"; // fallback
  }

  // Fetch staff info for euthanasia template (vet name + license)
  let staffRow: { name: string; licenseNumber: string | null } | null = null;
  if (templateType === "euthanasia_consent") {
    const [row] = await db
      .select({ name: staff.name, licenseNumber: staff.licenseNumber })
      .from(staff)
      .where(eq(staff.id, staffMemberId))
      .limit(1);
    staffRow = row ?? null;
  }

  // Build typed props for each template
  const todayFormatted = formatDateART(new Date());
  const patientSpeciesAndSex = [patient.species, patient.sex]
    .filter(Boolean)
    .join(" ");

  let pdfBuffer: Buffer;

  let documentId: string;

  try {
    // Generate PDF with correctly typed props per template
    if (templateType === "surgery_consent") {
      const props: SurgeryConsentProps = {
        clientName: client.name,
        clientDni: client.dni ?? "",
        clientAddress: client.address ?? "",
        patientName: patient.name,
        patientSpecies: patientSpeciesAndSex,
        patientBreed: patient.breed ?? "",
        patientCoatColor: patient.coatColor ?? "",
        patientWeight: patient.weightKg ?? "",
        patientDob: patient.dateOfBirth ?? "",
        historyNumber: patient.gvetHistoryNumber ?? undefined,
        date: todayFormatted,
        procedureDescription:
          customFields.procedureDescription ??
          procedureDescription ??
          undefined,
      };
      pdfBuffer = await renderConsentPdf("surgery_consent", props);
    } else if (templateType === "euthanasia_consent") {
      const props: EuthanasiaConsentProps = {
        clientName: client.name,
        clientDni: client.dni ?? "",
        clientAddress: client.address ?? "",
        patientName: patient.name,
        patientSpecies: patientSpeciesAndSex,
        patientBreed: patient.breed ?? "",
        patientCoatColor: patient.coatColor ?? "",
        patientWeight: patient.weightKg ?? "",
        patientDob: patient.dateOfBirth ?? "",
        historyNumber: patient.gvetHistoryNumber ?? undefined,
        date: todayFormatted,
        vetName: customFields.vetName ?? staffRow?.name ?? "",
        vetLicenseNumber:
          customFields.vetLicenseNumber ?? staffRow?.licenseNumber ?? "",
        diagnosis: customFields.diagnosis ?? "",
      };
      pdfBuffer = await renderConsentPdf("euthanasia_consent", props);
    } else if (templateType === "sedation_consent") {
      const props: SedationConsentProps = {
        clientName: client.name,
        clientDni: client.dni ?? "",
        clientAddress: client.address ?? "",
        patientName: patient.name,
        patientSpecies: patientSpeciesAndSex,
        patientBreed: patient.breed ?? "",
        patientCoatColor: patient.coatColor ?? "",
        patientWeight: patient.weightKg ?? "",
        patientDob: patient.dateOfBirth ?? "",
        historyNumber: patient.gvetHistoryNumber ?? undefined,
        date: todayFormatted,
        sedationReason:
          customFields.sedationReason ??
          procedureDescription ??
          undefined,
      };
      pdfBuffer = await renderConsentPdf("sedation_consent", props);
    } else {
      // reproductive_agreement
      const props: ReproductiveAgreementProps = {
        clientName: client.name,
        clientDni: client.dni ?? "",
        clientAddress: client.address ?? "",
        clientPhone: client.phone ?? "",
        clientEmail: client.email ?? "",
        patientName: patient.name,
        patientAge: patient.dateOfBirth ?? "",
        patientBreedAndCoat: [patient.breed, patient.coatColor]
          .filter(Boolean)
          .join(" — "),
        patientPedigree: customFields.patientPedigree ?? undefined,
        historyNumber: patient.gvetHistoryNumber ?? undefined,
        date: todayFormatted,
      };
      pdfBuffer = await renderConsentPdf("reproductive_agreement", props);
    }

    documentId = genConsentDocumentId();
    const storagePath = `${patient.id}/${documentId}.pdf`;

    // Upload to Supabase Storage
    const supabase = createAdminClient();
    const { error: uploadError } = await supabase.storage
      .from("consent-documents")
      .upload(storagePath, pdfBuffer, { contentType: "application/pdf" });

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      return { error: "Error al subir el documento. Intenta de nuevo." };
    }

    // Insert into DB
    await db.insert(consentDocuments).values({
      id: documentId,
      templateId: template.id,
      patientId: patient.id,
      clientId: client.id,
      procedureId: d.procedureId || null,
      hospitalizationId: d.hospitalizationId || null,
      storagePath,
      customFields: Object.keys(customFields).length > 0 ? customFields : null,
      generatedAt: new Date(),
      createdById: staffMemberId,
    });
  } catch (err) {
    Sentry.captureException(err);
    return { error: "Ocurrió un error inesperado. Intenta de nuevo." };
  }

  revalidatePath("/dashboard/consent-documents");
  revalidatePath(`/dashboard/patients/${patient.id}`);
  redirect(`/dashboard/consent-documents`);
}

// ── Download URL ─────────────────────────────────────────────────────────────

export async function getConsentDocumentDownloadUrl(id: string) {
  const canView = await hasRole("admin", "owner", "vet");
  if (!canView) return { error: "No autorizado." };

  const [doc] = await db
    .select({ storagePath: consentDocuments.storagePath })
    .from(consentDocuments)
    .where(eq(consentDocuments.id, id))
    .limit(1);

  if (!doc || !doc.storagePath) {
    return { error: "Documento no encontrado." };
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase.storage
    .from("consent-documents")
    .createSignedUrl(doc.storagePath, 60);

  if (error || !data?.signedUrl) {
    console.error("Signed URL error:", error);
    return { error: "Error al generar enlace de descarga." };
  }

  return { url: data.signedUrl };
}

// ── Delete ───────────────────────────────────────────────────────────────────

export async function deleteConsentDocument(id: string) {
  const canDelete = await isAdminLevel();
  if (!canDelete) return { error: "Solo administradores pueden eliminar documentos." };

  const [doc] = await db
    .select({
      storagePath: consentDocuments.storagePath,
      patientId: consentDocuments.patientId,
    })
    .from(consentDocuments)
    .where(eq(consentDocuments.id, id))
    .limit(1);

  if (!doc) return { error: "Documento no encontrado." };

  try {
    // Delete from Storage
    if (doc.storagePath) {
      const supabase = createAdminClient();
      await supabase.storage
        .from("consent-documents")
        .remove([doc.storagePath]);
    }

    // Delete from DB
    await db
      .delete(consentDocuments)
      .where(eq(consentDocuments.id, id));
  } catch (err) {
    Sentry.captureException(err);
    return { error: "Ocurrió un error inesperado. Intenta de nuevo." };
  }

  revalidatePath("/dashboard/consent-documents");
  revalidatePath(`/dashboard/patients/${doc.patientId}`);
  return { success: true };
}
