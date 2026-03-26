"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { appointments, patients, clients } from "@/db/schema";
import { appointmentId } from "@/lib/ids";
import { eq, desc, and, gte, lte, sql } from "drizzle-orm";

export async function getAppointments(opts?: {
  status?: string;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}) {
  const page = opts?.page ?? 1;
  const limit = opts?.limit ?? 20;
  const offset = (page - 1) * limit;

  const conditions = [];
  if (opts?.status) {
    conditions.push(eq(appointments.status, opts.status as "pending" | "confirmed" | "cancelled" | "completed"));
  }
  if (opts?.from) {
    conditions.push(gte(appointments.scheduledAt, new Date(opts.from)));
  }
  if (opts?.to) {
    conditions.push(lte(appointments.scheduledAt, new Date(opts.to)));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [data, countResult] = await Promise.all([
    db
      .select({
        id: appointments.id,
        scheduledAt: appointments.scheduledAt,
        durationMinutes: appointments.durationMinutes,
        reason: appointments.reason,
        status: appointments.status,
        staffNotes: appointments.staffNotes,
        patientId: appointments.patientId,
        patientName: patients.name,
        patientSpecies: patients.species,
        clientId: clients.id,
        clientName: clients.name,
        clientPhone: clients.phone,
      })
      .from(appointments)
      .innerJoin(patients, eq(appointments.patientId, patients.id))
      .innerJoin(clients, eq(patients.clientId, clients.id))
      .where(whereClause)
      .orderBy(desc(appointments.scheduledAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)` })
      .from(appointments)
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

export async function getAppointment(id: string) {
  const [row] = await db
    .select({
      id: appointments.id,
      scheduledAt: appointments.scheduledAt,
      durationMinutes: appointments.durationMinutes,
      reason: appointments.reason,
      status: appointments.status,
      staffNotes: appointments.staffNotes,
      patientId: appointments.patientId,
      createdAt: appointments.createdAt,
      updatedAt: appointments.updatedAt,
      patientName: patients.name,
      patientSpecies: patients.species,
      clientId: clients.id,
      clientName: clients.name,
      clientPhone: clients.phone,
    })
    .from(appointments)
    .innerJoin(patients, eq(appointments.patientId, patients.id))
    .innerJoin(clients, eq(patients.clientId, clients.id))
    .where(eq(appointments.id, id))
    .limit(1);

  return row ?? null;
}

export async function createAppointment(formData: FormData) {
  const patientId = formData.get("patientId") as string;
  const scheduledAt = formData.get("scheduledAt") as string;
  const durationMinutes = Number(formData.get("durationMinutes")) || 30;
  const reason = (formData.get("reason") as string) || null;
  const staffNotes = (formData.get("staffNotes") as string) || null;

  if (!patientId || !scheduledAt) {
    return { error: "Paciente y fecha/hora son obligatorios." };
  }

  const id = appointmentId();

  await db.insert(appointments).values({
    id,
    patientId,
    scheduledAt: new Date(scheduledAt),
    durationMinutes,
    reason: reason?.trim() || null,
    staffNotes: staffNotes?.trim() || null,
    status: "pending",
  });

  revalidatePath("/dashboard/appointments");
  revalidatePath(`/dashboard/patients/${patientId}`);
  redirect(`/dashboard/appointments/${id}`);
}

export async function updateAppointment(id: string, formData: FormData) {
  const scheduledAt = formData.get("scheduledAt") as string;
  const durationMinutes = Number(formData.get("durationMinutes")) || 30;
  const reason = (formData.get("reason") as string) || null;
  const staffNotes = (formData.get("staffNotes") as string) || null;
  const status = formData.get("status") as string;

  if (!scheduledAt) {
    return { error: "Fecha/hora es obligatoria." };
  }

  await db
    .update(appointments)
    .set({
      scheduledAt: new Date(scheduledAt),
      durationMinutes,
      reason: reason?.trim() || null,
      staffNotes: staffNotes?.trim() || null,
      status: (status as "pending" | "confirmed" | "cancelled" | "completed") ?? "pending",
      updatedAt: new Date(),
    })
    .where(eq(appointments.id, id));

  revalidatePath("/dashboard/appointments");
  redirect(`/dashboard/appointments/${id}`);
}

export async function updateAppointmentStatus(id: string, status: "pending" | "confirmed" | "cancelled" | "completed") {
  await db
    .update(appointments)
    .set({ status, updatedAt: new Date() })
    .where(eq(appointments.id, id));

  revalidatePath("/dashboard/appointments");
  revalidatePath(`/dashboard/appointments/${id}`);
}

export async function getAllPatientsForSelect() {
  return db
    .select({
      id: patients.id,
      name: patients.name,
      species: patients.species,
      clientName: clients.name,
    })
    .from(patients)
    .innerJoin(clients, eq(patients.clientId, clients.id))
    .orderBy(clients.name, patients.name);
}
