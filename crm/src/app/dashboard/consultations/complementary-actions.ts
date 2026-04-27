"use server";

import { revalidatePath } from "next/cache";
import * as Sentry from "@sentry/nextjs";
import { db } from "@/db";
import { complementaryMethods, consultations } from "@/db/schema";
import { complementaryMethodId } from "@/lib/ids";
import { eq, asc } from "drizzle-orm";
import { z } from "zod";

const complementaryMethodSchema = z.object({
  studyType: z.string().min(1, "El tipo de estudio es obligatorio."),
  content: z.string().min(1, "El contenido es obligatorio."),
});

export async function getComplementaryMethods(consultationId: string) {
  return db
    .select()
    .from(complementaryMethods)
    .where(eq(complementaryMethods.consultationId, consultationId))
    .orderBy(asc(complementaryMethods.createdAt));
}

export async function createComplementaryMethod(consultationId: string, formData: FormData) {
  const raw = {
    studyType: (formData.get("studyType") as string)?.trim() ?? "",
    content: (formData.get("content") as string)?.trim() ?? "",
  };

  const parsed = complementaryMethodSchema.safeParse(raw);
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const [consultation] = await db
    .select({ patientId: consultations.patientId })
    .from(consultations)
    .where(eq(consultations.id, consultationId))
    .limit(1);

  try {
    await db.insert(complementaryMethods).values({
      id: complementaryMethodId(),
      consultationId,
      studyType: parsed.data.studyType,
      content: parsed.data.content,
    });
  } catch (err) {
    Sentry.captureException(err);
    return { error: "Ocurrió un error inesperado. Intenta de nuevo." };
  }

  revalidatePath(`/dashboard/consultations/${consultationId}`);
  if (consultation?.patientId) {
    revalidatePath(`/dashboard/patients/${consultation.patientId}`);
  }
}

export async function deleteComplementaryMethod(id: string, consultationId: string) {
  await db.delete(complementaryMethods).where(eq(complementaryMethods.id, id));
  revalidatePath(`/dashboard/consultations/${consultationId}`);
}
