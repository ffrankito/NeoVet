import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { settings } from "@/db/schema";
import { assertCronSecret } from "@/lib/cron-secret";

const INITIAL_SETTINGS = [
  { key: "clinic_hours_weekday_morning_start", value: "09:30" },
  { key: "clinic_hours_weekday_morning_end", value: "12:30" },
  { key: "clinic_hours_weekday_afternoon_start", value: "16:30" },
  { key: "clinic_hours_weekday_afternoon_end", value: "20:00" },
  { key: "clinic_hours_holiday_start", value: "10:00" },
  { key: "clinic_hours_holiday_end", value: "13:00" },
];

export async function POST(req: NextRequest) {
  const guard = assertCronSecret(req);
  if (guard) return guard;

  let inserted = 0;
  for (const setting of INITIAL_SETTINGS) {
    await db
      .insert(settings)
      .values({ key: setting.key, value: setting.value })
      .onConflictDoNothing();
    inserted++;
  }

  return NextResponse.json({ ok: true, inserted });
}