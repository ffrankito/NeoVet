"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db";
import {
  groomingProfiles,
  groomingSessions,
  appointments,
  patients,
  clients,
  staff,
  settings,
  services,
  cashSessions,
  cashMovements,
} from "@/db/schema";
import { groomingProfileId, groomingSessionId, cashMovementId } from "@/lib/ids";
import { eq, desc, isNull } from "drizzle-orm";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createChargeForSource } from "@/app/dashboard/deudores/actions";
import { randomUUID } from "crypto";

// ── Grooming Profile ─────────────────────────────────────────────────────────

const profileSchema = z.object({
  behaviorScore: z.number().int().min(1).max(10).nullable().optional(),
  coatType: z.string().optional(),
  coatDifficulties: z.string().optional(),
  behaviorNotes: z.string().optional(),
  estimatedMinutes: z.number().int().positive().nullable().optional(),
});

export async function getGroomingProfile(patientId: string) {
  const [row] = await db
    .select()
    .from(groomingProfiles)
    .where(eq(groomingProfiles.patientId, patientId))
    .limit(1);
  return row ?? null;
}

export async function upsertGroomingProfile(patientId: string, formData: FormData) {
  const raw = {
    behaviorScore: formData.get("behaviorScore") ? Number(formData.get("behaviorScore")) : null,
    coatType: (formData.get("coatType") as string)?.trim() || undefined,
    coatDifficulties: (formData.get("coatDifficulties") as string)?.trim() || undefined,
    behaviorNotes: (formData.get("behaviorNotes") as string)?.trim() || undefined,
    estimatedMinutes: formData.get("estimatedMinutes") ? Number(formData.get("estimatedMinutes")) : null,
  };

  const parsed = profileSchema.safeParse(raw);
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  try {
    const existing = await getGroomingProfile(patientId);

    if (existing) {
      await db
        .update(groomingProfiles)
        .set({ ...parsed.data, updatedAt: new Date() })
        .where(eq(groomingProfiles.patientId, patientId));
    } else {
      await db.insert(groomingProfiles).values({
        id: groomingProfileId(),
        patientId,
        ...parsed.data,
      });
    }
  } catch {
    return { error: "Ocurrió un error al guardar el perfil de estética." };
  }

  revalidatePath(`/dashboard/patients/${patientId}`);
  return { success: true };
}

// ── Grooming Sessions ─────────────────────────────────────────────────────────

export async function getGroomingSessions(patientId: string) {
  const groomedBy = db.$with("groomed_by").as(
    db.select({ id: staff.id, name: staff.name }).from(staff)
  );

  return db
    .with(groomedBy)
    .select({
      id: groomingSessions.id,
      patientId: groomingSessions.patientId,
      appointmentId: groomingSessions.appointmentId,
      serviceId: groomingSessions.serviceId,
      serviceName: services.name,
      priceTier: groomingSessions.priceTier,
      finalPrice: groomingSessions.finalPrice,
      beforePhotoPath: groomingSessions.beforePhotoPath,
      afterPhotoPath: groomingSessions.afterPhotoPath,
      findings: groomingSessions.findings,
      notes: groomingSessions.notes,
      createdAt: groomingSessions.createdAt,
      groomedByName: groomedBy.name,
    })
    .from(groomingSessions)
    .leftJoin(groomedBy, eq(groomingSessions.groomedById, groomedBy.id))
    .leftJoin(services, eq(groomingSessions.serviceId, services.id))
    .where(eq(groomingSessions.patientId, patientId))
    .orderBy(desc(groomingSessions.createdAt));
}

export async function getEsteticaServicesForSelect() {
  return db
    .select({
      id: services.id,
      name: services.name,
      basePrice: services.basePrice,
    })
    .from(services)
    .where(eq(services.category, "estetica"))
    .orderBy(services.name);
}

const sessionSchema = z.object({
  groomedById: z.string().min(1, "El/la esteticista es obligatorio/a."),
  serviceId: z.string().min(1, "El tipo de servicio es obligatorio."),
  finalPrice: z.number().nonnegative("El precio debe ser mayor o igual a 0.").nullable().optional(),
  paymentMethod: z.string().optional(),
  notes: z.string().optional(),
  findings: z.array(z.string()).optional(),
});

export async function createGroomingSession(
  patientId: string,
  appointmentId: string | null,
  formData: FormData
) {
  const findingsRaw = formData.getAll("findings") as string[];

  const raw = {
    groomedById: (formData.get("groomedById") as string)?.trim() ?? "",
    serviceId: (formData.get("serviceId") as string)?.trim() ?? "",
    finalPrice: formData.get("finalPrice") ? Number(formData.get("finalPrice")) : null,
    paymentMethod: (formData.get("paymentMethod") as string)?.trim() || undefined,
    notes: (formData.get("notes") as string)?.trim() || undefined,
    findings: findingsRaw.length > 0 ? findingsRaw : undefined,
  };

  const parsed = sessionSchema.safeParse(raw);
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Resolve createdById from the auth user
  const [staffRow] = user
    ? await db.select({ id: staff.id }).from(staff).where(eq(staff.userId, user.id)).limit(1)
    : [null];

  // Handle photo uploads
  let beforePhotoPath: string | null = null;
  let afterPhotoPath: string | null = null;

  const beforeFile = formData.get("beforePhoto") as File | null;
  const afterFile = formData.get("afterPhoto") as File | null;

  if (beforeFile && beforeFile.size > 0) {
    const ext = beforeFile.name.split(".").pop();
    const path = `${patientId}/before_${randomUUID()}.${ext}`;
    const { error } = await supabase.storage
      .from("grooming-photos")
      .upload(path, beforeFile);
    if (!error) beforePhotoPath = path;
  }

  if (afterFile && afterFile.size > 0) {
    const ext = afterFile.name.split(".").pop();
    const path = `${patientId}/after_${randomUUID()}.${ext}`;
    const { error } = await supabase.storage
      .from("grooming-photos")
      .upload(path, afterFile);
    if (!error) afterPhotoPath = path;
  }

  const newSessionId = groomingSessionId();
  await db.insert(groomingSessions).values({
    id: newSessionId,
    patientId,
    appointmentId: appointmentId || null,
    groomedById: parsed.data.groomedById,
    serviceId: parsed.data.serviceId,
    priceTier: null,
    finalPrice: parsed.data.finalPrice ? String(parsed.data.finalPrice) : null,
    beforePhotoPath,
    afterPhotoPath,
    findings: parsed.data.findings ?? [],
    notes: parsed.data.notes ?? null,
    createdById: staffRow?.id ?? null,
  });

  // Auto-create grooming profile if it doesn't exist yet
  const existing = await getGroomingProfile(patientId);
  if (!existing) {
    await db.insert(groomingProfiles).values({
      id: groomingProfileId(),
      patientId,
    });
  }

  // Auto-post grooming revenue to open cash session
  const finalPriceNum = parsed.data.finalPrice;
  if (finalPriceNum && finalPriceNum > 0) {
    const [openSession] = await db
      .select({ id: cashSessions.id })
      .from(cashSessions)
      .where(isNull(cashSessions.closedAt))
      .limit(1);

    if (openSession) {
      // Fetch patient name for a descriptive movement
      const [pat] = await db
        .select({ name: patients.name })
        .from(patients)
        .where(eq(patients.id, patientId))
        .limit(1);

      await db.insert(cashMovements).values({
        id: cashMovementId(),
        sessionId: openSession.id,
        type: "ingreso",
        amount: String(finalPriceNum),
        paymentMethod: parsed.data.paymentMethod || "efectivo",
        description: `Estética — ${pat?.name ?? patientId}`,
        createdById: staffRow?.id ?? parsed.data.groomedById,
      });
    }
  }

  // Auto-create charge for the client
  if (finalPriceNum && finalPriceNum > 0) {
    try {
      const [pat] = await db
        .select({ clientId: patients.clientId, name: patients.name })
        .from(patients)
        .where(eq(patients.id, patientId))
        .limit(1);

      if (pat?.clientId) {
        await createChargeForSource(
          "grooming",
          newSessionId,
          pat.clientId,
          `Estética — ${pat.name}`,
          finalPriceNum,
          staffRow?.id ?? parsed.data.groomedById
        );
      }
    } catch {
      // Charge creation failure should not block the session save
    }
  }

  revalidatePath(`/dashboard/patients/${patientId}`);
  revalidatePath("/dashboard/cash");
  revalidatePath("/dashboard/deudores");
  return { success: true };
}

export async function getSignedPhotoUrl(path: string) {
  const supabase = await createClient();
  const { data } = await supabase.storage
    .from("grooming-photos")
    .createSignedUrl(path, 300); // 5 minutes
  return data?.signedUrl ?? null;
}

export async function getGroomersForSelect() {
  return db
    .select({ id: staff.id, name: staff.name })
    .from(staff)
    .where(eq(staff.isActive, true))
    .orderBy(staff.name);
}
