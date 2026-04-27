import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { clients, patients } from "@/db/schema";
import { eq } from "drizzle-orm";
import { verifyBotApiKey } from "@/lib/bot-auth";
import { revalidateBotMutation } from "@/lib/bot-revalidate";
import { z } from "zod";
import { clientId as genClientId, patientId as genPatientId } from "@/lib/ids";

const createClientSchema = z.object({
  name: z.string().min(1),
  phone: z.string().min(1),
  dni: z.string().optional(),
  source: z.enum(["whatsapp", "web", "manual"]).default("whatsapp"),
  patient: z.object({
    name: z.string().min(1),
    species: z.enum(["canine", "feline", "other"]),
    breed: z.string().nullable().optional(),
    sex: z.enum(["macho", "hembra", "desconocido"]).default("desconocido"),
    dateOfBirth: z.string().nullable().optional(),
  }),
});

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

export async function POST(req: NextRequest) {
  const authError = verifyBotApiKey(req);
  if (authError) return authError;

  const body = await req.json();
  const parsed = createClientSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos inválidos", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { name, phone, dni, source, patient } = parsed.data;
  const normalizedPhone = phone.replace(/\D/g, "");

  // Verificar si ya existe un cliente con ese teléfono
  const [existing] = await db
    .select()
    .from(clients)
    .where(eq(clients.phone, normalizedPhone))
    .limit(1);

  if (existing) {
    return NextResponse.json(
      { error: "Ya existe un cliente con ese teléfono", clientId: existing.id },
      { status: 409 }
    );
  }

  // Crear cliente. Race: a concurrent POST for the same phone may pass the
  // SELECT check above and then lose to us (or vice versa) at INSERT — the
  // new clients_phone_unique_idx (migration 0035) makes that DB-level. If we
  // lose, re-query and return the winning client's id with 409.
  const newClientId = genClientId();
  try {
    await db.insert(clients).values({
      id: newClientId,
      name,
      phone: normalizedPhone,
      dni: dni ?? null,
      source,
      importedFromGvet: false,
    });
  } catch (err) {
    if (err && typeof err === "object" && "code" in err && err.code === "23505") {
      const [winner] = await db
        .select()
        .from(clients)
        .where(eq(clients.phone, normalizedPhone))
        .limit(1);
      if (winner) {
        return NextResponse.json(
          { error: "Ya existe un cliente con ese teléfono", clientId: winner.id },
          { status: 409 }
        );
      }
    }
    throw err;
  }

  // Crear paciente
  const newPatientId = genPatientId();
  await db.insert(patients).values({
    id: newPatientId,
    clientId: newClientId,
    name: patient.name,
    species: patient.species,
    breed: patient.breed ?? null,
    sex: patient.sex,
    dateOfBirth: patient.dateOfBirth ?? null,
  });

  revalidateBotMutation();

  return NextResponse.json(
    { clientId: newClientId, patientId: newPatientId, ok: true },
    { status: 201 }
  );
}