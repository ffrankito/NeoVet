"use server";

import { revalidatePath } from "next/cache";
import * as Sentry from "@sentry/nextjs";
import { redirect } from "next/navigation";
import { db } from "@/db";
import {
  patients,
  clients,
  appointments,
  consultations,
  hospitalizations,
  procedures,
  vaccinations,
  groomingSessions,
} from "@/db/schema";
import { patientId } from "@/lib/ids";
import { eq, desc, count } from "drizzle-orm";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import { isAdminLevel } from "@/lib/auth";

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024;

function getServiceRoleClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

export async function uploadPatientAvatar(patientId: string, formData: FormData) {
  const file = formData.get("avatar") as File | null;
  if (!file || file.size === 0) return { error: "No se recibió ningún archivo." };

  if (!ALLOWED_MIME_TYPES.includes(file.type))
    return { error: "Solo se aceptan imágenes JPG, PNG o WebP." };

  if (file.size > MAX_FILE_SIZE_BYTES)
    return { error: "La imagen no puede superar 2 MB." };

  const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const path = `${patientId}/avatar.${ext}`;

  const supabase = getServiceRoleClient();
  const { error: storageError } = await supabase.storage
    .from("patient-avatars")
    .upload(path, file, { upsert: true, contentType: file.type });

  if (storageError) {
    console.error("[uploadPatientAvatar]", storageError);
    return { error: "No se pudo subir la imagen. Intenta de nuevo." };
  }

  const { data } = supabase.storage.from("patient-avatars").getPublicUrl(path);
  return { url: data.publicUrl };
}

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
      neutered: formData.get("neutered") === "true",
    });
  } catch (err) {
    Sentry.captureException(err);
    return { error: "Ocurrió un error inesperado. Intenta de nuevo." };
  }

  revalidatePath(`/dashboard/clients/${parsed.data.clientId}`);
  revalidatePath(`/dashboard/patients/${id}`);
  redirect(`/dashboard/patients/${id}`);
}

export async function updatePatient(
  id: string,
  formData: FormData,
  avatarUrl?: string | null,
) {
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

  const deceased = formData.get("deceased") === "true";
  const neutered = formData.get("neutered") === "true";

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
        deceased,
        neutered,
        ...(avatarUrl !== undefined ? { avatarUrl } : {}),
        updatedAt: new Date(),
      })
      .where(eq(patients.id, id));
  } catch (err) {
    Sentry.captureException(err);
    return { error: "Ocurrió un error inesperado. Intenta de nuevo." };
  }

  revalidatePath(`/dashboard/clients/${existing?.clientId}`);
  revalidatePath(`/dashboard/patients/${id}`);
  redirect(`/dashboard/patients/${id}`);
}

export async function deletePatientAvatar(patientId: string) {
  await db
    .update(patients)
    .set({ avatarUrl: null, updatedAt: new Date() })
    .where(eq(patients.id, patientId));

  revalidatePath(`/dashboard/patients/${patientId}`);
}

export type PatientDeletePreview = {
  consultations: number;
  appointments: number;
  hospitalizations: number;
  procedures: number;
  vaccinations: number;
  groomingSessions: number;
};

/**
 * Counts the records that will be permanently destroyed by deletePatient(id).
 * Used to populate the confirmation dialog so admins see what they're about
 * to wipe before confirming. Admin / owner only.
 */
export async function getPatientDeletePreview(
  id: string,
): Promise<PatientDeletePreview> {
  if (!(await isAdminLevel())) {
    throw new Error("No autorizado");
  }

  const [
    [{ n: consultationsCount } = { n: 0 }],
    [{ n: appointmentsCount } = { n: 0 }],
    [{ n: hospitalizationsCount } = { n: 0 }],
    [{ n: proceduresCount } = { n: 0 }],
    [{ n: vaccinationsCount } = { n: 0 }],
    [{ n: groomingCount } = { n: 0 }],
  ] = await Promise.all([
    db.select({ n: count() }).from(consultations).where(eq(consultations.patientId, id)),
    db.select({ n: count() }).from(appointments).where(eq(appointments.patientId, id)),
    db.select({ n: count() }).from(hospitalizations).where(eq(hospitalizations.patientId, id)),
    db.select({ n: count() }).from(procedures).where(eq(procedures.patientId, id)),
    db.select({ n: count() }).from(vaccinations).where(eq(vaccinations.patientId, id)),
    db.select({ n: count() }).from(groomingSessions).where(eq(groomingSessions.patientId, id)),
  ]);

  return {
    consultations: Number(consultationsCount),
    appointments: Number(appointmentsCount),
    hospitalizations: Number(hospitalizationsCount),
    procedures: Number(proceduresCount),
    vaccinations: Number(vaccinationsCount),
    groomingSessions: Number(groomingCount),
  };
}

export async function deletePatient(id: string) {
  // Hard delete cascades to consultations, appointments, hospitalizations,
  // procedures, vaccinations, deworming records, consent documents,
  // grooming sessions, follow-ups, retorno queue. Admin / owner only.
  if (!(await isAdminLevel())) {
    throw new Error("No autorizado");
  }

  const [patient] = await db
    .select({ clientId: patients.clientId })
    .from(patients)
    .where(eq(patients.id, id))
    .limit(1);

  await db.delete(patients).where(eq(patients.id, id));

  revalidatePath(`/dashboard/clients/${patient?.clientId}`);
  redirect(`/dashboard/clients/${patient?.clientId}`);
}
