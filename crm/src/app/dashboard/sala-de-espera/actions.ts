"use server";

import { revalidatePath } from "next/cache";
import * as Sentry from "@sentry/nextjs";
import { and, asc, eq, inArray, ne } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { z } from "zod";
import { db } from "@/db";
import {
  appointments,
  clients,
  patients,
  retornoQueue,
  staff,
} from "@/db/schema";
import { getSessionStaffId, hasRole } from "@/lib/auth";
import { retornoQueueId } from "@/lib/ids";
import {
  validateTransition,
  type RetornoStatus,
} from "@/lib/retorno/transitions";

const taskTypes = [
  "sacar_sangre",
  "ecografia",
  "curacion",
  "aplicar_medicacion",
  "radiografia",
  "control_signos_vitales",
  "otro",
] as const;

const createRetornoSchema = z.object({
  taskType: z.enum(taskTypes, {
    message: "Seleccioná un tipo de tarea.",
  }),
  notes: z.string().max(1000).nullable().optional(),
});

export async function getRetornoQueue() {
  const canView = await hasRole("admin", "owner", "vet");
  if (!canView) return [];

  const createdBy = alias(staff, "created_by");
  const assignedTo = alias(staff, "assigned_to");
  const performedBy = alias(staff, "performed_by");

  return db
    .select({
      id: retornoQueue.id,
      taskType: retornoQueue.taskType,
      notes: retornoQueue.notes,
      status: retornoQueue.status,
      startedAt: retornoQueue.startedAt,
      completedAt: retornoQueue.completedAt,
      createdAt: retornoQueue.createdAt,
      patientId: patients.id,
      patientName: patients.name,
      patientSpecies: patients.species,
      clientId: clients.id,
      clientName: clients.name,
      appointmentId: retornoQueue.appointmentId,
      createdByStaffName: createdBy.name,
      assignedToStaffId: retornoQueue.assignedToStaffId,
      assignedToStaffName: assignedTo.name,
      performedByStaffName: performedBy.name,
    })
    .from(retornoQueue)
    .innerJoin(patients, eq(retornoQueue.patientId, patients.id))
    .innerJoin(clients, eq(patients.clientId, clients.id))
    .innerJoin(createdBy, eq(retornoQueue.createdByStaffId, createdBy.id))
    .leftJoin(assignedTo, eq(retornoQueue.assignedToStaffId, assignedTo.id))
    .leftJoin(performedBy, eq(retornoQueue.performedByStaffId, performedBy.id))
    .where(ne(retornoQueue.status, "completed"))
    .orderBy(asc(retornoQueue.createdAt));
}

export async function getWalkInsInQueue() {
  const canView = await hasRole("admin", "owner", "vet");
  if (!canView) return [];

  const walkInAssigned = alias(staff, "walkin_assigned");

  return db
    .select({
      id: appointments.id,
      patientId: patients.id,
      patientName: patients.name,
      patientSpecies: patients.species,
      clientId: clients.id,
      clientName: clients.name,
      reason: appointments.reason,
      createdAt: appointments.createdAt,
      status: appointments.status,
      isUrgent: appointments.isUrgent,
      assignedStaffName: walkInAssigned.name,
    })
    .from(appointments)
    .innerJoin(patients, eq(appointments.patientId, patients.id))
    .innerJoin(clients, eq(patients.clientId, clients.id))
    .leftJoin(
      walkInAssigned,
      eq(appointments.assignedStaffId, walkInAssigned.id),
    )
    .where(
      and(
        eq(appointments.isWalkIn, true),
        eq(appointments.appointmentType, "veterinary"),
        inArray(appointments.status, ["pending", "confirmed"]),
      ),
    )
    .orderBy(asc(appointments.createdAt));
}

export async function getAssignableStaff() {
  const canView = await hasRole("admin", "owner", "vet");
  if (!canView) return [];

  return db
    .select({ id: staff.id, name: staff.name, role: staff.role })
    .from(staff)
    .where(eq(staff.isActive, true))
    .orderBy(asc(staff.name));
}

export async function createRetorno(
  appointmentIdArg: string,
  formData: FormData,
) {
  const canCreate = await hasRole("admin", "owner", "vet");
  if (!canCreate) return { error: "No autorizado." };

  const staffMemberId = await getSessionStaffId();
  if (!staffMemberId)
    return { error: "No se pudo identificar al usuario." };

  const raw = {
    taskType: ((formData.get("taskType") as string) || "").trim(),
    notes: ((formData.get("notes") as string) || "").trim() || null,
  };

  const parsed = createRetornoSchema.safeParse(raw);
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const [apt] = await db
    .select({
      id: appointments.id,
      status: appointments.status,
      patientId: appointments.patientId,
      appointmentType: appointments.appointmentType,
    })
    .from(appointments)
    .where(eq(appointments.id, appointmentIdArg))
    .limit(1);

  if (!apt) return { error: "El turno no existe." };
  if (apt.appointmentType !== "veterinary") {
    return {
      error:
        "Sólo turnos veterinarios pueden enviar pacientes a sala de espera.",
    };
  }
  if (apt.status !== "completed") {
    return {
      error:
        "El turno debe estar completado antes de enviar a sala de espera.",
    };
  }

  try {
    await db.insert(retornoQueue).values({
      id: retornoQueueId(),
      patientId: apt.patientId,
      appointmentId: apt.id,
      taskType: parsed.data.taskType,
      notes: parsed.data.notes,
      createdByStaffId: staffMemberId,
    });
  } catch (err) {
    Sentry.captureException(err);
    return { error: "Ocurrió un error inesperado. Intenta de nuevo." };
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/sala-de-espera");
  revalidatePath(`/dashboard/appointments/${appointmentIdArg}`);
  return { success: true as const };
}

async function getCurrentStatus(id: string): Promise<RetornoStatus | null> {
  const [row] = await db
    .select({ status: retornoQueue.status })
    .from(retornoQueue)
    .where(eq(retornoQueue.id, id))
    .limit(1);
  return row?.status ?? null;
}

export async function startRetorno(id: string) {
  const canAct = await hasRole("admin", "owner", "vet");
  if (!canAct) return { error: "No autorizado." };

  const staffMemberId = await getSessionStaffId();
  if (!staffMemberId)
    return { error: "No se pudo identificar al usuario." };

  const current = await getCurrentStatus(id);
  if (!current) return { error: "El retorno no existe." };

  const check = validateTransition(current, "in_progress");
  if (!check.ok) return { error: check.error };

  try {
    await db
      .update(retornoQueue)
      .set({
        status: "in_progress",
        startedAt: new Date(),
        performedByStaffId: staffMemberId,
        updatedAt: new Date(),
      })
      .where(eq(retornoQueue.id, id));
  } catch (err) {
    Sentry.captureException(err);
    return { error: "Ocurrió un error inesperado. Intenta de nuevo." };
  }

  revalidatePath("/dashboard/sala-de-espera");
  return { success: true as const };
}

export async function completeRetorno(id: string) {
  const canAct = await hasRole("admin", "owner", "vet");
  if (!canAct) return { error: "No autorizado." };

  const current = await getCurrentStatus(id);
  if (!current) return { error: "El retorno no existe." };

  const check = validateTransition(current, "completed");
  if (!check.ok) return { error: check.error };

  try {
    await db
      .update(retornoQueue)
      .set({
        status: "completed",
        completedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(retornoQueue.id, id));
  } catch (err) {
    Sentry.captureException(err);
    return { error: "Ocurrió un error inesperado. Intenta de nuevo." };
  }

  revalidatePath("/dashboard/sala-de-espera");
  return { success: true as const };
}

export async function assignRetorno(id: string, staffId: string | null) {
  const canAct = await hasRole("admin", "owner", "vet");
  if (!canAct) return { error: "No autorizado." };

  try {
    await db
      .update(retornoQueue)
      .set({
        assignedToStaffId: staffId,
        updatedAt: new Date(),
      })
      .where(eq(retornoQueue.id, id));
  } catch (err) {
    Sentry.captureException(err);
    return { error: "Ocurrió un error inesperado. Intenta de nuevo." };
  }

  revalidatePath("/dashboard/sala-de-espera");
  return { success: true as const };
}
