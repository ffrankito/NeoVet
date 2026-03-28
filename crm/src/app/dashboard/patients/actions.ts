"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { patients, clients, appointments } from "@/db/schema";
import { patientId } from "@/lib/ids";
import { eq, desc } from "drizzle-orm";
import { z } from "zod";

const patientSchema = z.object({
  name: z.string().min(1, "El nombre de la mascota es obligatorio."),
  species: z.string().min(1, "La especie es obligatoria."),
  clientId: z.string().min(1, "El cliente es obligatorio."),
  breed: z.string().optional(),
  dateOfBirth: z
    .string()
    .optional()
    .refine((v) => !v || !isNaN(Date.parse(v)), {
      message: "La fecha de nacimiento no es válida.",
    }),
});

export async function getPatientsByClient(clientId: string) {
  return db
    .select()
    .from(patients)
    .where(eq(patients.clientId, clientId))
    .orderBy(desc(patients.createdAt));
}

export async function getPatient(id: string) {
  const [patient] = await db
    .select()
    .from(patients)
    .where(eq(patients.id, id))
    .limit(1);

  if (!patient) return null;

  const [client] = await db
    .select()
    .from(clients)
    .where(eq(clients.id, patient.clientId))
    .limit(1);

  const patientAppointments = await db
    .select()
    .from(appointments)
    .where(eq(appointments.patientId, id))
    .orderBy(desc(appointments.scheduledAt));

  return { ...patient, client, appointments: patientAppointments };
}

export async function createPatient(formData: FormData) {
  const raw = {
    clientId: (formData.get("clientId") as string)?.trim() ?? "",
    name: (formData.get("name") as string)?.trim() ?? "",
    species: (formData.get("species") as string)?.trim() ?? "",
    breed: (formData.get("breed") as string)?.trim() ?? "",
    dateOfBirth: (formData.get("dateOfBirth") as string)?.trim() ?? "",
  };

  const parsed = patientSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors;
    return {
      errors: {
        name: fieldErrors.name?.[0],
        species: fieldErrors.species?.[0],
        clientId: fieldErrors.clientId?.[0],
        dateOfBirth: fieldErrors.dateOfBirth?.[0],
      },
    };
  }

  let id: string;
  try {
    id = patientId();
    await db.insert(patients).values({
      id,
      clientId: parsed.data.clientId,
      name: parsed.data.name,
      species: parsed.data.species,
      breed: parsed.data.breed || null,
      dateOfBirth: parsed.data.dateOfBirth || null,
    });
  } catch (err) {
    return { error: "Ocurrió un error inesperado. Intenta de nuevo." };
  }

  revalidatePath(`/dashboard/clients/${parsed.data.clientId}`);
  revalidatePath(`/dashboard/patients/${id}`);
  redirect(`/dashboard/patients/${id}`);
}

export async function updatePatient(id: string, formData: FormData) {
  const [existing] = await db
    .select({ clientId: patients.clientId })
    .from(patients)
    .where(eq(patients.id, id))
    .limit(1);

  const raw = {
    clientId: existing?.clientId ?? "",
    name: (formData.get("name") as string)?.trim() ?? "",
    species: (formData.get("species") as string)?.trim() ?? "",
    breed: (formData.get("breed") as string)?.trim() ?? "",
    dateOfBirth: (formData.get("dateOfBirth") as string)?.trim() ?? "",
  };

  const parsed = patientSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors;
    return {
      errors: {
        name: fieldErrors.name?.[0],
        species: fieldErrors.species?.[0],
        clientId: fieldErrors.clientId?.[0],
        dateOfBirth: fieldErrors.dateOfBirth?.[0],
      },
    };
  }

  try {
    await db
      .update(patients)
      .set({
        name: parsed.data.name,
        species: parsed.data.species,
        breed: parsed.data.breed || null,
        dateOfBirth: parsed.data.dateOfBirth || null,
        updatedAt: new Date(),
      })
      .where(eq(patients.id, id));
  } catch (err) {
    return { error: "Ocurrió un error inesperado. Intenta de nuevo." };
  }

  revalidatePath(`/dashboard/clients/${existing?.clientId}`);
  revalidatePath(`/dashboard/patients/${id}`);
  redirect(`/dashboard/patients/${id}`);
}

export async function deletePatient(id: string) {
  const [patient] = await db
    .select({ clientId: patients.clientId })
    .from(patients)
    .where(eq(patients.id, id))
    .limit(1);

  await db.delete(patients).where(eq(patients.id, id));

  revalidatePath(`/dashboard/clients/${patient?.clientId}`);
  redirect(`/dashboard/clients/${patient?.clientId}`);
}
