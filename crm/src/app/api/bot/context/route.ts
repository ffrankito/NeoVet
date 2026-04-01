import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { botBusinessContext } from "@/db/schema";
import { eq } from "drizzle-orm";
import { verifyBotApiKey } from "@/lib/bot-auth";

export async function GET(req: NextRequest) {
  const authError = verifyBotApiKey(req);
  if (authError) return authError;

  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");

  const rows = category
    ? await db.select().from(botBusinessContext).where(eq(botBusinessContext.category, category as "faq" | "horarios" | "precios" | "servicios" | "contacto"))
    : await db.select().from(botBusinessContext);

  return NextResponse.json(rows);
}