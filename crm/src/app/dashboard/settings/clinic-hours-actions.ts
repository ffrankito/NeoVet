"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { settings } from "@/db/schema";
import { isAdminLevel } from "@/lib/auth";

// HH:MM (00:00 .. 23:59). Empty string allowed — empty values are skipped
// so admins can leave a field blank without erasing the existing value.
const timeOrEmpty = z.union([
  z.literal(""),
  z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Formato esperado HH:MM"),
]);

const FIELDS: ReadonlyArray<{ formKey: string; settingsKey: string }> = [
  { formKey: "weekday_morning_start",   settingsKey: "clinic_hours_weekday_morning_start" },
  { formKey: "weekday_morning_end",     settingsKey: "clinic_hours_weekday_morning_end" },
  { formKey: "weekday_afternoon_start", settingsKey: "clinic_hours_weekday_afternoon_start" },
  { formKey: "weekday_afternoon_end",   settingsKey: "clinic_hours_weekday_afternoon_end" },
  { formKey: "holiday_start",           settingsKey: "clinic_hours_holiday_start" },
  { formKey: "holiday_end",             settingsKey: "clinic_hours_holiday_end" },
];

export async function updateClinicHours(formData: FormData) {
  if (!(await isAdminLevel())) {
    throw new Error("No autorizado");
  }

  for (const { formKey, settingsKey } of FIELDS) {
    const raw = formData.get(formKey);
    const value = typeof raw === "string" ? raw : "";
    const parsed = timeOrEmpty.safeParse(value);
    if (!parsed.success) {
      throw new Error(`Valor inválido para ${formKey}: ${parsed.error.issues[0]?.message ?? "formato HH:MM"}`);
    }
    if (!parsed.data) continue; // empty → skip (don't overwrite with "")

    await db
      .insert(settings)
      .values({ key: settingsKey, value: parsed.data })
      .onConflictDoUpdate({
        target: settings.key,
        set: { value: parsed.data, updatedAt: new Date() },
      });
  }

  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard/calendar");
}
