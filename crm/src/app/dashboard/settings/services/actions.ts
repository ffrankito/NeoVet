"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { services, serviceCategoryEnum } from "@/db/schema";
import { serviceId } from "@/lib/ids";
import { eq } from "drizzle-orm";
import { z } from "zod";

const serviceSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio."),
  category: z.enum(serviceCategoryEnum.enumValues),
  defaultDurationMinutes: z
    .number()
    .int()
    .positive("La duración debe ser mayor a 0."),
  blockDurationMinutes: z.number().int().positive().nullable().optional(),
  basePrice: z.string().optional().nullable(),
});

export async function getServices() {
  return db
    .select()
    .from(services)
    .orderBy(services.category, services.name);
}

export async function getActiveServices() {
  return db
    .select()
    .from(services)
    .where(eq(services.isActive, true))
    .orderBy(services.category, services.name);
}

export async function createService(formData: FormData) {
  const raw = {
    name: (formData.get("name") as string)?.trim() ?? "",
    category: (formData.get("category") as string) ?? "",
    defaultDurationMinutes: Number(formData.get("defaultDurationMinutes")),
    blockDurationMinutes: formData.get("blockDurationMinutes")
      ? Number(formData.get("blockDurationMinutes"))
      : null,
    basePrice: (formData.get("basePrice") as string)?.trim() || null,
  };

  const parsed = serviceSchema.safeParse(raw);
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  await db.insert(services).values({
    id: serviceId(),
    ...parsed.data,
  });

  revalidatePath("/dashboard/settings/services");
  return { success: true };
}

export async function updateService(id: string, formData: FormData) {
  const raw = {
    name: (formData.get("name") as string)?.trim() ?? "",
    category: (formData.get("category") as string) ?? "",
    defaultDurationMinutes: Number(formData.get("defaultDurationMinutes")),
    blockDurationMinutes: formData.get("blockDurationMinutes")
      ? Number(formData.get("blockDurationMinutes"))
      : null,
    basePrice: (formData.get("basePrice") as string)?.trim() || null,
  };

  const parsed = serviceSchema.safeParse(raw);
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  await db
    .update(services)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(services.id, id));

  revalidatePath("/dashboard/settings/services");
  return { success: true };
}

export async function toggleServiceActive(id: string, isActive: boolean) {
  await db
    .update(services)
    .set({ isActive, updatedAt: new Date() })
    .where(eq(services.id, id));

  revalidatePath("/dashboard/settings/services");
}
