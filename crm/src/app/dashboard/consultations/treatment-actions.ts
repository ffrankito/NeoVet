"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { treatmentItems, consultations } from "@/db/schema";
import { treatmentItemId } from "@/lib/ids";
import { eq, asc } from "drizzle-orm";
import { z } from "zod";

const treatmentItemSchema = z.object({
  description: z.string().min(1, "La descripción es obligatoria."),
});

export async function getTreatmentItems(consultationId: string) {
  return db
    .select()
    .from(treatmentItems)
    .where(eq(treatmentItems.consultationId, consultationId))
    .orderBy(asc(treatmentItems.order), asc(treatmentItems.createdAt));
}

export async function saveTreatmentItems(
  consultationId: string,
  items: { description: string }[],
) {
  // Replace all items for this consultation atomically:
  // delete existing ones, insert the new list with updated order.
  await db
    .delete(treatmentItems)
    .where(eq(treatmentItems.consultationId, consultationId));

  if (items.length === 0) return;

  await db.insert(treatmentItems).values(
    items.map((item, index) => ({
      id:             treatmentItemId(),
      consultationId,
      description:    item.description.trim(),
      status:         "pending" as const,
      order:          index,
    })),
  );
}

export async function updateTreatmentItemStatus(
  id: string,
  status: "pending" | "active" | "completed",
) {
  const [item] = await db
    .select({ consultationId: treatmentItems.consultationId })
    .from(treatmentItems)
    .where(eq(treatmentItems.id, id))
    .limit(1);

  await db
    .update(treatmentItems)
    .set({ status, updatedAt: new Date() })
    .where(eq(treatmentItems.id, id));

  // Get the patientId so we can revalidate the patient page too
  if (item?.consultationId) {
    const [consultation] = await db
      .select({ patientId: consultations.patientId })
      .from(consultations)
      .where(eq(consultations.id, item.consultationId))
      .limit(1);

    revalidatePath(`/dashboard/consultations/${item.consultationId}`);
    if (consultation?.patientId) {
      revalidatePath(`/dashboard/patients/${consultation.patientId}`);
    }
  }
}

export async function deleteTreatmentItem(id: string) {
  const [item] = await db
    .select({ consultationId: treatmentItems.consultationId })
    .from(treatmentItems)
    .where(eq(treatmentItems.id, id))
    .limit(1);

  await db.delete(treatmentItems).where(eq(treatmentItems.id, id));

  if (item?.consultationId) {
    revalidatePath(`/dashboard/consultations/${item.consultationId}`);
  }
}
