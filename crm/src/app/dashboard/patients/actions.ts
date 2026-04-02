"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { patients, clients, appointments } from "@/db/schema";
import { patientId } from "@/lib/ids";
import { eq, desc } from "drizzle-orm";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";

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
