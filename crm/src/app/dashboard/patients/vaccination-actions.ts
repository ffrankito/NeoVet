"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { vaccinations } from "@/db/schema";
import { vaccinationId } from "@/lib/ids";
import { eq } from "drizzle-orm";
import { z } from "zod";

const vaccinationSchema = z.object({
  vaccineName: z.string().min(1, "El nombre de la vacuna es obligatorio."),
  appliedAt: z.string().min(1, "La fecha de aplicación es obligatoria."),
  nextDueAt: z.string().optional(),
  batchNumber: z.string().optional(),
  notes: z.string().optional(),
});

export async function getVaccinationsByPatient(patientId: string) {
  return db
    .select()
    .from(vaccinations)
    .where(eq(vaccinations.patientId, patientId))
    .orderBy(vaccinations.appliedAt);
}

export async function createVaccination(patientId: string, formData: FormData) {
  const raw = {
    vaccineName:  (formData.get("vaccineName") as string)?.trim() ?? "",
    appliedAt:    (formData.get("appliedAt") as string)?.trim() ?? "",
    nextDueAt:    (formData.get("nextDueAt") as string)?.trim() || undefined,
    batchNumber:  (formData.get("batchNumber") as string)?.trim() || undefined,
    notes:        (formData.get("notes") as string)?.trim() || undefined,
  };

  const parsed = vaccinationSchema.safeParse(raw);
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const d = parsed.data;

  try {
    await db.insert(vaccinations).values({
      id:          vaccinationId(),
      patientId,
      vaccineName: d.vaccineName,
      appliedAt:   d.appliedAt,
      nextDueAt:   d.nextDueAt || null,
      batchNumber: d.batchNumber || null,
      notes:       d.notes || null,
    });
  } catch {
    return { error: "Ocurrió un error inesperado. Intenta de nuevo." };
  }

  revalidatePath(`/dashboard/patients/${patientId}`);
  redirect(`/dashboard/patients/${patientId}`);
}

export async function updateVaccination(id: string, patientId: string, formData: FormData) {
  const raw = {
    vaccineName:  (formData.get("vaccineName") as string)?.trim() ?? "",
    appliedAt:    (formData.get("appliedAt") as string)?.trim() ?? "",
    nextDueAt:    (formData.get("nextDueAt") as string)?.trim() || undefined,
    batchNumber:  (formData.get("batchNumber") as string)?.trim() || undefined,
    notes:        (formData.get("notes") as string)?.trim() || undefined,
  };

  const parsed = vaccinationSchema.safeParse(raw);
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const d = parsed.data;

  try {
    await db
      .update(vaccinations)
      .set({
        vaccineName: d.vaccineName,
        appliedAt:   d.appliedAt,
        nextDueAt:   d.nextDueAt || null,
        batchNumber: d.batchNumber || null,
        notes:       d.notes || null,
        updatedAt:   new Date(),
      })
      .where(eq(vaccinations.id, id));
  } catch {
    return { error: "Ocurrió un error inesperado. Intenta de nuevo." };
  }

  revalidatePath(`/dashboard/patients/${patientId}`);
  redirect(`/dashboard/patients/${patientId}`);
}

export async function deleteVaccination(id: string, patientId: string) {
  await db.delete(vaccinations).where(eq(vaccinations.id, id));
  revalidatePath(`/dashboard/patients/${patientId}`);
}
