"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import {
  hospitalizations,
  hospitalizationObservations,
  patients,
  clients,
  staff,
} from "@/db/schema";
import {
  hospitalizationId,
  hospitalizationObservationId,
} from "@/lib/ids";
import { eq, desc, and, isNull, sql } from "drizzle-orm";
import { z } from "zod";
import { getSessionStaffId, hasRole } from "@/lib/auth";
import { buildPatientAwareSearchClause } from "@/lib/search/patient-aware-search";

// ── Schemas ──────────────────────────────────────────────────────────────────

const createHospitalizationSchema = z.object({
  patientId: z.string().min(1, "El paciente es obligatorio."),
  consultationId: z.string().optional(),
  reason: z.string().optional(),
  notes: z.string().optional(),
});

const observationSchema = z.object({
  weightKg: z
    .string()
    .optional()
    .refine((v) => !v || !isNaN(parseFloat(v)), {
      message: "El peso no es válido.",
    }),
  temperature: z
    .string()
    .optional()
    .refine((v) => !v || !isNaN(parseFloat(v)), {
      message: "La temperatura no es válida.",
    }),
  heartRate: z
    .string()
    .optional()
    .refine((v) => !v || !isNaN(parseFloat(v)), {
      message: "La frecuencia cardíaca no es válida.",
    }),
  respiratoryRate: z
    .string()
    .optional()
    .refine((v) => !v || !isNaN(parseFloat(v)), {
      message: "La frecuencia respiratoria no es válida.",
    }),
  capillaryRefillTime: z
    .enum(["< 2 seg", "2-3 seg", "> 3 seg", ""])
    .optional()
    .transform((v) => v || undefined),
  mucousMembranes: z
    .enum(["Rosadas", "Pálidas", "Cianóticas", "Ictéricas", "Congestionadas", ""])
    .optional()
    .transform((v) => v || undefined),
  sensorium: z
    .enum(["Alerta", "Semicomatoso", "Comatoso", ""])
    .optional()
    .transform((v) => v || undefined),
  feeding: z.string().optional(),
  hydration: z.string().optional(),
  medication: z.string().optional(),
  urineOutput: z.string().optional(),
  fecesOutput: z.string().optional(),
  notes: z.string().optional(),
});

// ── Queries ──────────────────────────────────────────────────────────────────

export async function getHospitalizations(opts?: {
  status?: "active" | "discharged" | "all";
  search?: string;
  page?: number;
  limit?: number;
}) {
  const page = opts?.page ?? 1;
  const limit = opts?.limit ?? 20;
  const offset = (page - 1) * limit;
  const status = opts?.status ?? "all";

  const conditions = [];

  if (status === "active") {
    conditions.push(isNull(hospitalizations.dischargedAt));
  } else if (status === "discharged") {
    conditions.push(
      sql`${hospitalizations.dischargedAt} IS NOT NULL`
    );
  }

  const searchClause = buildPatientAwareSearchClause(opts?.search);
  if (searchClause) conditions.push(searchClause);

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [data, countResult] = await Promise.all([
    db
      .select({
        id: hospitalizations.id,
        patientId: hospitalizations.patientId,
        patientName: patients.name,
        patientSpecies: patients.species,
        clientId: clients.id,
        clientName: clients.name,
        clientPhone: clients.phone,
        admittedAt: hospitalizations.admittedAt,
        dischargedAt: hospitalizations.dischargedAt,
        reason: hospitalizations.reason,
        notes: hospitalizations.notes,
        createdAt: hospitalizations.createdAt,
      })
      .from(hospitalizations)
      .innerJoin(patients, eq(hospitalizations.patientId, patients.id))
      .innerJoin(clients, eq(patients.clientId, clients.id))
      .where(whereClause)
      .orderBy(desc(hospitalizations.admittedAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)` })
      .from(hospitalizations)
      .innerJoin(patients, eq(hospitalizations.patientId, patients.id))
      .innerJoin(clients, eq(patients.clientId, clients.id))
      .where(whereClause),
  ]);

  return {
    data,
    total: Number(countResult[0].count),
    page,
    limit,
    totalPages: Math.ceil(Number(countResult[0].count) / limit),
  };
}

export async function getHospitalization(id: string) {
  const admittedByStaff = db.$with("admitted_by_staff").as(
    db.select({ id: staff.id, name: staff.name }).from(staff)
  );
  const dischargedByStaff = db.$with("discharged_by_staff").as(
    db.select({ id: staff.id, name: staff.name }).from(staff)
  );

  const [row] = await db
    .with(admittedByStaff, dischargedByStaff)
    .select({
      id: hospitalizations.id,
      patientId: hospitalizations.patientId,
      consultationId: hospitalizations.consultationId,
      admittedAt: hospitalizations.admittedAt,
      dischargedAt: hospitalizations.dischargedAt,
      admittedById: hospitalizations.admittedById,
      admittedByName: admittedByStaff.name,
      dischargedById: hospitalizations.dischargedById,
      dischargedByName: dischargedByStaff.name,
      reason: hospitalizations.reason,
      notes: hospitalizations.notes,
      createdAt: hospitalizations.createdAt,
      updatedAt: hospitalizations.updatedAt,
      patientName: patients.name,
      patientSpecies: patients.species,
      patientBreed: patients.breed,
      clientId: clients.id,
      clientName: clients.name,
      clientPhone: clients.phone,
    })
    .from(hospitalizations)
    .innerJoin(patients, eq(hospitalizations.patientId, patients.id))
    .innerJoin(clients, eq(patients.clientId, clients.id))
    .leftJoin(
      admittedByStaff,
      eq(hospitalizations.admittedById, admittedByStaff.id)
    )
    .leftJoin(
      dischargedByStaff,
      eq(hospitalizations.dischargedById, dischargedByStaff.id)
    )
    .where(eq(hospitalizations.id, id))
    .limit(1);

  if (!row) return null;

  const recordedByStaff = db.$with("recorded_by_staff").as(
    db.select({ id: staff.id, name: staff.name }).from(staff)
  );

  const observations = await db
    .with(recordedByStaff)
    .select({
      id: hospitalizationObservations.id,
      hospitalizationId: hospitalizationObservations.hospitalizationId,
      recordedAt: hospitalizationObservations.recordedAt,
      recordedById: hospitalizationObservations.recordedById,
      recordedByName: recordedByStaff.name,
      weightKg: hospitalizationObservations.weightKg,
      temperature: hospitalizationObservations.temperature,
      heartRate: hospitalizationObservations.heartRate,
      respiratoryRate: hospitalizationObservations.respiratoryRate,
      capillaryRefillTime: hospitalizationObservations.capillaryRefillTime,
      mucousMembranes: hospitalizationObservations.mucousMembranes,
      sensorium: hospitalizationObservations.sensorium,
      feeding: hospitalizationObservations.feeding,
      hydration: hospitalizationObservations.hydration,
      medication: hospitalizationObservations.medication,
      urineOutput: hospitalizationObservations.urineOutput,
      fecesOutput: hospitalizationObservations.fecesOutput,
      notes: hospitalizationObservations.notes,
      createdAt: hospitalizationObservations.createdAt,
    })
    .from(hospitalizationObservations)
    .leftJoin(
      recordedByStaff,
      eq(hospitalizationObservations.recordedById, recordedByStaff.id)
    )
    .where(eq(hospitalizationObservations.hospitalizationId, id))
    .orderBy(desc(hospitalizationObservations.recordedAt));

  return { ...row, observations };
}

export async function getActiveHospitalizationByPatient(patientId: string) {
  const [row] = await db
    .select()
    .from(hospitalizations)
    .where(
      and(
        eq(hospitalizations.patientId, patientId),
        isNull(hospitalizations.dischargedAt)
      )
    )
    .limit(1);

  return row ?? null;
}

export async function getHospitalizationsByPatient(patientId: string) {
  return db
    .select()
    .from(hospitalizations)
    .where(eq(hospitalizations.patientId, patientId))
    .orderBy(desc(hospitalizations.admittedAt));
}

// ── Mutations ────────────────────────────────────────────────────────────────

export async function createHospitalization(formData: FormData) {
  const canManage = await hasRole("admin", "owner", "vet");
  if (!canManage) return { error: "No autorizado." };

  const staffMemberId = await getSessionStaffId();
  if (!staffMemberId) return { error: "No se pudo identificar al usuario." };

  const raw = {
    patientId: (formData.get("patientId") as string)?.trim() ?? "",
    consultationId:
      (formData.get("consultationId") as string)?.trim() || undefined,
    reason: (formData.get("reason") as string)?.trim() || undefined,
    notes: (formData.get("notes") as string)?.trim() || undefined,
  };

  const parsed = createHospitalizationSchema.safeParse(raw);
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const d = parsed.data;

  // Check that the patient doesn't already have an active hospitalization
  const existing = await getActiveHospitalizationByPatient(d.patientId);
  if (existing) {
    return {
      error: "Este paciente ya tiene una internación activa.",
    };
  }

  let id: string;
  try {
    id = hospitalizationId();
    await db.insert(hospitalizations).values({
      id,
      patientId: d.patientId,
      consultationId: d.consultationId || null,
      admittedAt: new Date(),
      admittedById: staffMemberId,
      reason: d.reason || null,
      notes: d.notes || null,
    });
  } catch {
    return { error: "Ocurrió un error inesperado. Intenta de nuevo." };
  }

  revalidatePath("/dashboard/hospitalizations");
  revalidatePath(`/dashboard/patients/${d.patientId}`);
  redirect(`/dashboard/hospitalizations/${id}`);
}

export async function dischargeHospitalization(
  id: string,
  formData: FormData
) {
  const canManage = await hasRole("admin", "owner", "vet");
  if (!canManage) return { error: "No autorizado." };

  const staffMemberId = await getSessionStaffId();
  if (!staffMemberId) return { error: "No se pudo identificar al usuario." };

  const dischargeNotes =
    (formData.get("notes") as string)?.trim() || null;

  try {
    const [existing] = await db
      .select({
        patientId: hospitalizations.patientId,
        dischargedAt: hospitalizations.dischargedAt,
      })
      .from(hospitalizations)
      .where(eq(hospitalizations.id, id))
      .limit(1);

    if (!existing) {
      return { error: "Internación no encontrada." };
    }

    if (existing.dischargedAt) {
      return { error: "Esta internación ya fue dada de alta." };
    }

    await db
      .update(hospitalizations)
      .set({
        dischargedAt: new Date(),
        dischargedById: staffMemberId,
        notes: dischargeNotes,
        updatedAt: new Date(),
      })
      .where(eq(hospitalizations.id, id));

    revalidatePath("/dashboard/hospitalizations");
    revalidatePath(`/dashboard/hospitalizations/${id}`);
    revalidatePath(`/dashboard/patients/${existing.patientId}`);
  } catch {
    return { error: "Ocurrió un error inesperado. Intenta de nuevo." };
  }

  return { success: true };
}

export async function addObservation(
  hospitalizationId_: string,
  formData: FormData
) {
  const canManage = await hasRole("admin", "owner", "vet");
  if (!canManage) return { error: "No autorizado." };

  const staffMemberId = await getSessionStaffId();
  if (!staffMemberId) return { error: "No se pudo identificar al usuario." };

  const raw = {
    weightKg:
      (formData.get("weightKg") as string)?.trim() || undefined,
    temperature:
      (formData.get("temperature") as string)?.trim() || undefined,
    heartRate:
      (formData.get("heartRate") as string)?.trim() || undefined,
    respiratoryRate:
      (formData.get("respiratoryRate") as string)?.trim() || undefined,
    capillaryRefillTime:
      (formData.get("capillaryRefillTime") as string)?.trim() || undefined,
    mucousMembranes:
      (formData.get("mucousMembranes") as string)?.trim() || undefined,
    sensorium:
      (formData.get("sensorium") as string)?.trim() || undefined,
    feeding:
      (formData.get("feeding") as string)?.trim() || undefined,
    hydration:
      (formData.get("hydration") as string)?.trim() || undefined,
    medication:
      (formData.get("medication") as string)?.trim() || undefined,
    urineOutput:
      (formData.get("urineOutput") as string)?.trim() || undefined,
    fecesOutput:
      (formData.get("fecesOutput") as string)?.trim() || undefined,
    notes:
      (formData.get("notes") as string)?.trim() || undefined,
  };

  const parsed = observationSchema.safeParse(raw);
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const d = parsed.data;

  try {
    // Verify the hospitalization exists and is active
    const [hosp] = await db
      .select({ dischargedAt: hospitalizations.dischargedAt })
      .from(hospitalizations)
      .where(eq(hospitalizations.id, hospitalizationId_))
      .limit(1);

    if (!hosp) {
      return { error: "Internación no encontrada." };
    }

    if (hosp.dischargedAt) {
      return {
        error:
          "No se pueden agregar observaciones a una internación dada de alta.",
      };
    }

    await db.insert(hospitalizationObservations).values({
      id: hospitalizationObservationId(),
      hospitalizationId: hospitalizationId_,
      recordedAt: new Date(),
      recordedById: staffMemberId,
      weightKg: d.weightKg || null,
      temperature: d.temperature || null,
      heartRate: d.heartRate || null,
      respiratoryRate: d.respiratoryRate || null,
      capillaryRefillTime: d.capillaryRefillTime || null,
      mucousMembranes: d.mucousMembranes || null,
      sensorium: d.sensorium || null,
      feeding: d.feeding || null,
      hydration: d.hydration || null,
      medication: d.medication || null,
      urineOutput: d.urineOutput || null,
      fecesOutput: d.fecesOutput || null,
      notes: d.notes || null,
    });
  } catch {
    return { error: "Ocurrió un error inesperado. Intenta de nuevo." };
  }

  revalidatePath(`/dashboard/hospitalizations/${hospitalizationId_}`);
  return { success: true };
}

export async function deleteObservation(id: string) {
  const canManage = await hasRole("admin", "owner", "vet");
  if (!canManage) return { error: "No autorizado." };

  try {
    const [existing] = await db
      .select({
        hospitalizationId: hospitalizationObservations.hospitalizationId,
      })
      .from(hospitalizationObservations)
      .where(eq(hospitalizationObservations.id, id))
      .limit(1);

    if (!existing) {
      return { error: "Observación no encontrada." };
    }

    await db
      .delete(hospitalizationObservations)
      .where(eq(hospitalizationObservations.id, id));

    revalidatePath(
      `/dashboard/hospitalizations/${existing.hospitalizationId}`
    );
  } catch {
    return { error: "Ocurrió un error inesperado. Intenta de nuevo." };
  }

  return { success: true };
}
