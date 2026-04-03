"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { settings } from "@/db/schema";

export async function updateClinicHours(formData: FormData) {
  const updates = [
    { key: "clinic_hours_weekday_morning_start", value: formData.get("weekday_morning_start") as string },
    { key: "clinic_hours_weekday_morning_end",   value: formData.get("weekday_morning_end") as string },
    { key: "clinic_hours_weekday_afternoon_start", value: formData.get("weekday_afternoon_start") as string },
    { key: "clinic_hours_weekday_afternoon_end",   value: formData.get("weekday_afternoon_end") as string },
    { key: "clinic_hours_holiday_start", value: formData.get("holiday_start") as string },
    { key: "clinic_hours_holiday_end",   value: formData.get("holiday_end") as string },
  ];

  for (const { key, value } of updates) {
    if (!value) continue;
    await db
      .insert(settings)
      .values({ key, value })
      .onConflictDoUpdate({ target: settings.key, set: { value, updatedAt: new Date() } });
  }

  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard/calendar");
}