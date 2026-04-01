import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { services } from "@/db/schema";
import { eq } from "drizzle-orm";
import { verifyBotApiKey } from "@/lib/bot-auth";

export async function GET(req: NextRequest) {
  const authError = verifyBotApiKey(req);
  if (authError) return authError;

  const activeServices = await db
    .select({
      id: services.id,
      name: services.name,
      category: services.category,
      defaultDurationMinutes: services.defaultDurationMinutes,
      blockDurationMinutes: services.blockDurationMinutes,
      basePrice: services.basePrice,
    })
    .from(services)
    .where(eq(services.isActive, true))
    .orderBy(services.category, services.name);

  return NextResponse.json(activeServices);
}