"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { followUps } from "@/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { followUpId } from "@/lib/ids";

const followUpSchema = z.object({
  scheduledDate: z.string().min(1, "La fecha es obligatoria."),
  reason: z.string().min(1, "El motivo es obligatorio."),
});

export async function createFollowUp(
  patientId: string,
  consultationId: string,
  formData: FormData
): Promise<{ success: true } | { errors: Record<string, string[]> }> {
  const raw = {
    scheduledDate: (formData.get("scheduledDate") as string)?.trim() ?? "",
    reason: (formData.get("reason") as string)?.trim() ?? "",
  };

  const parsed = followUpSchema.safeParse(raw);
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  await db.insert(followUps).values({
    id: followUpId(),
    patientId,
    consultationId,
    scheduledDate: parsed.data.scheduledDate,
    reason: parsed.data.reason,
  });

  revalidatePath(`/dashboard/consultations/${consultationId}`);
  return { success: true };
}

export async function deleteFollowUp(id: string, consultationId: string) {
  await db.delete(followUps).where(eq(followUps.id, id));
  revalidatePath(`/dashboard/consultations/${consultationId}`);
}

export async function getFollowUpsByConsultation(consultationId: string) {
  return db
    .select()
    .from(followUps)
    .where(eq(followUps.consultationId, consultationId));
}