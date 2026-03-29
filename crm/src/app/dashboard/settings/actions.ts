"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { settings } from "@/db/schema";

export async function upsertGroomingPrices(formData: FormData) {
  const min = (formData.get("grooming_price_min") as string)?.trim() ?? "";
  const mid = (formData.get("grooming_price_mid") as string)?.trim() ?? "";
  const hard = (formData.get("grooming_price_hard") as string)?.trim() ?? "";

  const entries = [
    { key: "grooming_price_min", value: min },
    { key: "grooming_price_mid", value: mid },
    { key: "grooming_price_hard", value: hard },
  ];

  for (const entry of entries) {
    await db
      .insert(settings)
      .values({ key: entry.key, value: entry.value, updatedAt: new Date() })
      .onConflictDoUpdate({
        target: settings.key,
        set: { value: entry.value, updatedAt: new Date() },
      });
  }

  revalidatePath("/dashboard/settings");
  return { success: true };
}
