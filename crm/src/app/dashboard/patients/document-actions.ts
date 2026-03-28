"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { documents } from "@/db/schema";
import { documentId } from "@/lib/ids";
import { eq } from "drizzle-orm";
import { createClient } from "@supabase/supabase-js";

const BUCKET = "clinical-documents";

function getServiceRoleClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

export async function getDocumentsByPatient(patientId: string) {
  return db
    .select()
    .from(documents)
    .where(eq(documents.patientId, patientId))
    .orderBy(documents.createdAt);
}

export async function uploadDocument(patientId: string, formData: FormData) {
  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) return { error: "No se recibió ningún archivo." };

  const storagePath = `${patientId}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_")}`;

  const supabase = getServiceRoleClient();
  const { error: storageError } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, file, { contentType: file.type, upsert: false });

  if (storageError) {
    console.error("[uploadDocument]", storageError);
    return { error: "No se pudo subir el archivo. Intenta de nuevo." };
  }

  try {
    await db.insert(documents).values({
      id:          documentId(),
      patientId,
      fileName:    file.name,
      storagePath,
      mimeType:    file.type || "application/octet-stream",
      sizeBytes:   file.size,
    });
  } catch {
    // If DB insert fails, clean up the uploaded file
    await supabase.storage.from(BUCKET).remove([storagePath]);
    return { error: "No se pudo guardar el documento. Intenta de nuevo." };
  }

  revalidatePath(`/dashboard/patients/${patientId}`);
  return { success: true };
}

export async function getSignedDownloadUrl(documentId: string): Promise<{ url: string } | { error: string }> {
  const [doc] = await db
    .select()
    .from(documents)
    .where(eq(documents.id, documentId))
    .limit(1);

  if (!doc) return { error: "Documento no encontrado." };

  const supabase = getServiceRoleClient();
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(doc.storagePath, 60); // 60 seconds

  if (error || !data) {
    console.error("[getSignedDownloadUrl]", error);
    return { error: "No se pudo generar el enlace de descarga." };
  }

  return { url: data.signedUrl };
}

export async function deleteDocument(id: string, patientId: string) {
  const [doc] = await db
    .select()
    .from(documents)
    .where(eq(documents.id, id))
    .limit(1);

  if (!doc) return { error: "Documento no encontrado." };

  const supabase = getServiceRoleClient();
  await supabase.storage.from(BUCKET).remove([doc.storagePath]);
  await db.delete(documents).where(eq(documents.id, id));

  revalidatePath(`/dashboard/patients/${patientId}`);
}
