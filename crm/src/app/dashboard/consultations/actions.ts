"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { consultations, patients, appointments, services } from "@/db/schema";
import { consultationId } from "@/lib/ids";
import { eq, desc } from "drizzle-orm";
import { z } from "zod";
import { saveTreatmentItems } from "./treatment-actions";
import { createChargeForSource } from "@/app/dashboard/deudores/actions";
import { getSessionStaffId } from "@/lib/auth";

const consultationSchema = z.object({
  patientId: z.string().min(1, "El paciente es obligatorio."),
  appointmentId: z.string().optional(),
  subjective: z.string().optional(),
  objective: z.string().optional(),
  assessment: z.string().optional(),
  plan: z.string().optional(),
  notes: z.string().optional(),
  weightKg: z
    .string()
    .optional()
    .refine((v) => !v || !isNaN(parseFloat(v)), { message: "El peso no es válido." }),
  temperature: z
    .string()
    .optional()
    .refine((v) => !v || !isNaN(parseFloat(v)), { message: "La temperatura no es válida." }),
  heartRate: z
    .string()
    .optional()
    .refine((v) => !v || !isNaN(parseFloat(v)), { message: "La frecuencia cardíaca no es válida." }),
  respiratoryRate: z
    .string()
    .optional()
    .refine((v) => !v || !isNaN(parseFloat(v)), { message: "La frecuencia respiratoria no es válida." }),
});

export async function getConsultation(id: string) {
  const [consultation] = await db
    .select()
    .from(consultations)
    .where(eq(consultations.id, id))
    .limit(1);

  if (!consultation) return null;

  const [patient] = await db
    .select({ id: patients.id, name: patients.name, clientId: patients.clientId })
    .from(patients)
    .where(eq(patients.id, consultation.patientId))
    .limit(1);

  let appointment = null;
  if (consultation.appointmentId) {
    const [apt] = await db
      .select()
      .from(appointments)
      .where(eq(appointments.id, consultation.appointmentId))
      .limit(1);
    appointment = apt ?? null;
  }

  return { ...consultation, patient, appointment };
}

export async function getConsultationsByPatient(patientId: string) {
  return db
    .select()
    .from(consultations)
    .where(eq(consultations.patientId, patientId))
    .orderBy(desc(consultations.createdAt));
}

export async function createConsultation(formData: FormData) {
  const raw = {
    patientId:       (formData.get("patientId") as string)?.trim() ?? "",
    appointmentId:   (formData.get("appointmentId") as string)?.trim() || undefined,
    subjective:      (formData.get("subjective") as string)?.trim() || undefined,
    objective:       (formData.get("objective") as string)?.trim() || undefined,
    assessment:      (formData.get("assessment") as string)?.trim() || undefined,
    plan:            (formData.get("plan") as string)?.trim() || undefined,
    notes:           (formData.get("notes") as string)?.trim() || undefined,
    weightKg:        (formData.get("weightKg") as string)?.trim() || undefined,
    temperature:     (formData.get("temperature") as string)?.trim() || undefined,
    heartRate:       (formData.get("heartRate") as string)?.trim() || undefined,
    respiratoryRate: (formData.get("respiratoryRate") as string)?.trim() || undefined,
  };

  const parsed = consultationSchema.safeParse(raw);
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const d = parsed.data;

  let itemsRaw: { description: string; medication?: string | null; dose?: string | null; frequency?: string | null; durationDays?: number | null }[] = [];
  try {
    const json = formData.get("treatmentItems") as string | null;
    if (json) itemsRaw = JSON.parse(json);
  } catch { /* malformed JSON — treat as empty list */ }

  let id: string;
  try {
    id = consultationId();
    await db.insert(consultations).values({
      id,
      patientId:       d.patientId,
      appointmentId:   d.appointmentId || null,
      subjective:      d.subjective || null,
      objective:       d.objective || null,
      assessment:      d.assessment || null,
      plan:            d.plan || null,
      notes:           d.notes || null,
      weightKg:        d.weightKg || null,
      temperature:     d.temperature || null,
      heartRate:       d.heartRate || null,
      respiratoryRate: d.respiratoryRate || null,
    });
    await saveTreatmentItems(id, itemsRaw.filter((i) => i.description?.trim()));
  } catch {
    return { error: "Ocurrió un error inesperado. Intenta de nuevo." };
  }

  // Auto-create charge from service basePrice if appointment has a linked service
  try {
    if (d.appointmentId) {
      const [apt] = await db
        .select({ serviceId: appointments.serviceId })
        .from(appointments)
        .where(eq(appointments.id, d.appointmentId))
        .limit(1);

      if (apt?.serviceId) {
        const [svc] = await db
          .select({ basePrice: services.basePrice, name: services.name })
          .from(services)
          .where(eq(services.id, apt.serviceId))
          .limit(1);

        const price = svc?.basePrice ? Number(svc.basePrice) : 0;
        if (price > 0) {
          const [pat] = await db
            .select({ clientId: patients.clientId, name: patients.name })
            .from(patients)
            .where(eq(patients.id, d.patientId))
            .limit(1);

          if (pat?.clientId) {
            const staffId = await getSessionStaffId();
            await createChargeForSource(
              "consultation",
              id,
              pat.clientId,
              `Consulta — ${svc.name ?? "Veterinaria"} — ${pat.name}`,
              price,
              staffId ?? ""
            );
          }
        }
      }
    }
  } catch {
    // Charge creation failure should not block the consultation save
  }

  revalidatePath(`/dashboard/patients/${d.patientId}`);
  revalidatePath("/dashboard/deudores");
  if (d.appointmentId) revalidatePath(`/dashboard/appointments/${d.appointmentId}`);
  redirect(`/dashboard/consultations/${id}`);
}

export async function updateConsultation(id: string, formData: FormData) {
  const [existing] = await db
    .select({ patientId: consultations.patientId, appointmentId: consultations.appointmentId })
    .from(consultations)
    .where(eq(consultations.id, id))
    .limit(1);

  const raw = {
    patientId:       existing?.patientId ?? "",
    appointmentId:   existing?.appointmentId ?? undefined,
    subjective:      (formData.get("subjective") as string)?.trim() || undefined,
    objective:       (formData.get("objective") as string)?.trim() || undefined,
    assessment:      (formData.get("assessment") as string)?.trim() || undefined,
    plan:            (formData.get("plan") as string)?.trim() || undefined,
    notes:           (formData.get("notes") as string)?.trim() || undefined,
    weightKg:        (formData.get("weightKg") as string)?.trim() || undefined,
    temperature:     (formData.get("temperature") as string)?.trim() || undefined,
    heartRate:       (formData.get("heartRate") as string)?.trim() || undefined,
    respiratoryRate: (formData.get("respiratoryRate") as string)?.trim() || undefined,
  };

  const parsed = consultationSchema.safeParse(raw);
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const d = parsed.data;

  let itemsRaw: { description: string; medication?: string | null; dose?: string | null; frequency?: string | null; durationDays?: number | null }[] = [];
  try {
    const json = formData.get("treatmentItems") as string | null;
    if (json) itemsRaw = JSON.parse(json);
  } catch { /* malformed JSON — treat as empty list */ }

  try {
    await db
      .update(consultations)
      .set({
        subjective:      d.subjective || null,
        objective:       d.objective || null,
        assessment:      d.assessment || null,
        plan:            d.plan || null,
        notes:           d.notes || null,
        weightKg:        d.weightKg || null,
        temperature:     d.temperature || null,
        heartRate:       d.heartRate || null,
        respiratoryRate: d.respiratoryRate || null,
        updatedAt:       new Date(),
      })
      .where(eq(consultations.id, id));
    await saveTreatmentItems(id, itemsRaw.filter((i) => i.description?.trim()));
  } catch {
    return { error: "Ocurrió un error inesperado. Intenta de nuevo." };
  }

  revalidatePath(`/dashboard/consultations/${id}`);
  revalidatePath(`/dashboard/patients/${existing?.patientId}`);
  if (existing?.appointmentId) revalidatePath(`/dashboard/appointments/${existing.appointmentId}`);
  redirect(`/dashboard/consultations/${id}`);
}

export async function deleteConsultation(id: string) {
  const [existing] = await db
    .select({ patientId: consultations.patientId })
    .from(consultations)
    .where(eq(consultations.id, id))
    .limit(1);

  await db.delete(consultations).where(eq(consultations.id, id));

  revalidatePath(`/dashboard/patients/${existing?.patientId}`);
  redirect(`/dashboard/patients/${existing?.patientId}`);
}
