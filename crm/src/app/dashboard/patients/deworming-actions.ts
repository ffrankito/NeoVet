"use server";

import { revalidatePath } from "next/cache";
import * as Sentry from "@sentry/nextjs";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { dewormingRecords } from "@/db/schema";
import { dewormingId } from "@/lib/ids";
import { eq } from "drizzle-orm";
import { z } from "zod";

const dewormingSchema = z.object({
  product:   z.string().min(1, "El nombre del producto es obligatorio."),
  appliedAt: z.string().min(1, "La fecha de aplicación es obligatoria."),
  nextDueAt: z.string().optional(),
  dose:      z.string().optional(),
  notes:     z.string().optional(),
});

export async function getDewormingByPatient(patientId: string) {
  return db
    .select()
    .from(dewormingRecords)
    .where(eq(dewormingRecords.patientId, patientId))
    .orderBy(dewormingRecords.appliedAt);
}

export async function createDeworming(patientId: string, formData: FormData) {
  const raw = {
    product:   (formData.get("product") as string)?.trim() ?? "",
    appliedAt: (formData.get("appliedAt") as string)?.trim() ?? "",
    nextDueAt: (formData.get("nextDueAt") as string)?.trim() || undefined,
    dose:      (formData.get("dose") as string)?.trim() || undefined,
    notes:     (formData.get("notes") as string)?.trim() || undefined,
  };

  const parsed = dewormingSchema.safeParse(raw);
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const d = parsed.data;

  try {
    await db.insert(dewormingRecords).values({
      id:        dewormingId(),
      patientId,
      product:   d.product,
      appliedAt: d.appliedAt,
      nextDueAt: d.nextDueAt || null,
      dose:      d.dose || null,
      notes:     d.notes || null,
    });
  } catch (err) {
    Sentry.captureException(err);
    return { error: "Ocurrió un error inesperado. Intenta de nuevo." };
  }

  revalidatePath(`/dashboard/patients/${patientId}`);
  redirect(`/dashboard/patients/${patientId}`);
}

export async function updateDeworming(id: string, patientId: string, formData: FormData) {
  const raw = {
    product:   (formData.get("product") as string)?.trim() ?? "",
    appliedAt: (formData.get("appliedAt") as string)?.trim() ?? "",
    nextDueAt: (formData.get("nextDueAt") as string)?.trim() || undefined,
    dose:      (formData.get("dose") as string)?.trim() || undefined,
    notes:     (formData.get("notes") as string)?.trim() || undefined,
  };

  const parsed = dewormingSchema.safeParse(raw);
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const d = parsed.data;

  try {
    await db
      .update(dewormingRecords)
      .set({
        product:   d.product,
        appliedAt: d.appliedAt,
        nextDueAt: d.nextDueAt || null,
        dose:      d.dose || null,
        notes:     d.notes || null,
        updatedAt: new Date(),
      })
      .where(eq(dewormingRecords.id, id));
  } catch (err) {
    Sentry.captureException(err);
    return { error: "Ocurrió un error inesperado. Intenta de nuevo." };
  }

  revalidatePath(`/dashboard/patients/${patientId}`);
  redirect(`/dashboard/patients/${patientId}`);
}

export async function deleteDeworming(id: string, patientId: string) {
  await db.delete(dewormingRecords).where(eq(dewormingRecords.id, id));
  revalidatePath(`/dashboard/patients/${patientId}`);
}
