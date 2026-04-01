import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { clients, patients } from "@/db/schema";
import { eq } from "drizzle-orm";
import { verifyBotApiKey } from "@/lib/bot-auth";

export async function GET(req: NextRequest) {
  const authError = verifyBotApiKey(req);
  if (authError) return authError;

  const { searchParams } = new URL(req.url);
  const phone = searchParams.get("phone");

  if (!phone) {
    return NextResponse.json({ error: "Parámetro phone requerido" }, { status: 400 });
  }

  const normalizedPhone = phone.replace(/\D/g, "");

  const [client] = await db
    .select()
    .from(clients)
    .where(eq(clients.phone, normalizedPhone))
    .limit(1);

  if (!client) {
    return NextResponse.json(null);
  }

  const clientPatients = await db
    .select({
      id: patients.id,
      name: patients.name,
      species: patients.species,
      breed: patients.breed,
    })
    .from(patients)
    .where(eq(patients.clientId, client.id));

  return NextResponse.json({ ...client, patients: clientPatients });
}