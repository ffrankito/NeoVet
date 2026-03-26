"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { patients, clients, appointments } from "@/db/schema";
import { patientId } from "@/lib/ids";
import { eq, desc } from "drizzle-orm";

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
  const clientId = formData.get("clientId") as string;
  const name = formData.get("name") as string;
  const species = formData.get("species") as string;
  const breed = (formData.get("breed") as string) || null;
  const dateOfBirth = (formData.get("dateOfBirth") as string) || null;

  if (!name?.trim() || !species?.trim() || !clientId) {
    return { error: "Nombre y especie son obligatorios." };
  }

  const id = patientId();

  await db.insert(patients).values({
    id,
    clientId,
    name: name.trim(),
    species: species.trim(),
    breed: breed?.trim() || null,
    dateOfBirth: dateOfBirth || null,
  });

  revalidatePath(`/dashboard/clients/${clientId}`);
  revalidatePath(`/dashboard/patients/${id}`);
  redirect(`/dashboard/patients/${id}`);
}

export async function updatePatient(id: string, formData: FormData) {
  const name = formData.get("name") as string;
  const species = formData.get("species") as string;
  const breed = (formData.get("breed") as string) || null;
  const dateOfBirth = (formData.get("dateOfBirth") as string) || null;

  if (!name?.trim() || !species?.trim()) {
    return { error: "Nombre y especie son obligatorios." };
  }

  const [patient] = await db
    .select({ clientId: patients.clientId })
    .from(patients)
    .where(eq(patients.id, id))
    .limit(1);

  await db
    .update(patients)
    .set({
      name: name.trim(),
      species: species.trim(),
      breed: breed?.trim() || null,
      dateOfBirth: dateOfBirth || null,
      updatedAt: new Date(),
    })
    .where(eq(patients.id, id));

  revalidatePath(`/dashboard/clients/${patient?.clientId}`);
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
