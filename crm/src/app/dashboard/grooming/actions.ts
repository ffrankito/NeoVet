"use server";

import { revalidatePath } from "next/cache";
import * as Sentry from "@sentry/nextjs";
import { db } from "@/db";
import {
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
import { groomingSessionId, cashMovementId } from "@/lib/ids";
import { eq, desc, isNull, and } from "drizzle-orm";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createChargeForSource } from "@/lib/charges/create";
import { randomUUID } from "crypto";
import { buildPatientAwareSearchClause } from "@/lib/search/patient-aware-search";

// ── Grooming Profile ─────────────────────────────────────────────────────────

const profileSchema = z.object({
  behaviorScore: z.number().int().min(1).max(10).nullable().optional(),
  coatType: z.string().optional(),
  coatDifficulties: z.string().optional(),
  behaviorNotes: z.string().optional(),
  estimatedMinutes: z.number().int().positive().nullable().optional(),
});

// Shape returned by getGroomingProfile — the embedded grooming fields
// projected from the patients row (post-Fix-1; no separate table).
export type GroomingProfileData = {
  patientId: string;
  behaviorScore: number | null;
  coatType: string | null;
  coatDifficulties: string | null;
  behaviorNotes: string | null;
  estimatedMinutes: number | null;
};

export async function getGroomingProfile(patientId: string) {
  const [row] = await db
    .select({
      patientId: patients.id,
      behaviorScore: patients.groomingBehaviorScore,
      coatType: patients.groomingCoatType,
      coatDifficulties: patients.groomingCoatDifficulties,
      behaviorNotes: patients.groomingBehaviorNotes,
      estimatedMinutes: patients.groomingEstimatedMinutes,
    })
    .from(patients)
    .where(eq(patients.id, patientId))
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
    // Only include fields that were explicitly provided (matches prior
    // upsert behaviour where empty strings from the form became `undefined`
    // and were treated as "leave unchanged"; `null` explicitly clears).
    const updates: Partial<typeof patients.$inferInsert> = {
      updatedAt: new Date(),
    };
    if (parsed.data.behaviorScore !== undefined) {
      updates.groomingBehaviorScore = parsed.data.behaviorScore;
    }
    if (parsed.data.coatType !== undefined) {
      updates.groomingCoatType = parsed.data.coatType;
    }
    if (parsed.data.coatDifficulties !== undefined) {
      updates.groomingCoatDifficulties = parsed.data.coatDifficulties;
    }
    if (parsed.data.behaviorNotes !== undefined) {
      updates.groomingBehaviorNotes = parsed.data.behaviorNotes;
    }
    if (parsed.data.estimatedMinutes !== undefined) {
      updates.groomingEstimatedMinutes = parsed.data.estimatedMinutes;
    }

    await db.update(patients).set(updates).where(eq(patients.id, patientId));
  } catch (err) {
    Sentry.captureException(err);
    return { error: "Ocurrió un error al guardar el perfil de estética." };
  }

  revalidatePath(`/dashboard/patients/${patientId}`);
  return { success: true };
}

// ── Grooming Sessions ─────────────────────────────────────────────────────────

export async function getRecentGroomingSessions(opts?: { search?: string; limit?: number }) {
  const limit = opts?.limit ?? 50;

  const groomedBy = db.$with("groomed_by").as(
    db.select({ id: staff.id, name: staff.name }).from(staff)
  );

  const searchClause = buildPatientAwareSearchClause(opts?.search);
  const whereClause = searchClause ? and(searchClause) : undefined;

  return db
    .with(groomedBy)
    .select({
      id: groomingSessions.id,
      patientId: groomingSessions.patientId,
      patientName: patients.name,
      clientName: clients.name,
      clientId: clients.id,
      serviceName: services.name,
      finalPrice: groomingSessions.finalPrice,
      createdAt: groomingSessions.createdAt,
      groomedByName: groomedBy.name,
    })
    .from(groomingSessions)
    .innerJoin(patients, eq(groomingSessions.patientId, patients.id))
    .innerJoin(clients, eq(patients.clientId, clients.id))
    .leftJoin(groomedBy, eq(groomingSessions.groomedById, groomedBy.id))
    .leftJoin(services, eq(groomingSessions.serviceId, services.id))
    .where(whereClause)
    .orderBy(desc(groomingSessions.createdAt))
    .limit(limit);
}

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
    } catch (err) {
      // Charge creation failure should not block the session save
      Sentry.captureException(err);
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
