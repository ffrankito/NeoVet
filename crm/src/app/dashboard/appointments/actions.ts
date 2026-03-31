"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { appointments, patients, clients, consultations, staff } from "@/db/schema";
import { appointmentId } from "@/lib/ids";
import { eq, desc, and, gte, lte, sql, asc } from "drizzle-orm";
import { z } from "zod";

const appointmentSchema = z.object({
  patientId: z.string().min(1, "El paciente es obligatorio."),
  scheduledAt: z
    .string()
    .min(1, "La fecha y hora son obligatorias.")
    .refine((v) => !isNaN(Date.parse(v)), { message: "La fecha no es válida." }),
  durationMinutes: z
    .number()
    .int()
    .positive("La duración debe ser mayor a 0."),
  appointmentType: z.enum(["veterinary", "grooming"]).default("veterinary"),
  consultationType: z.enum(["clinica", "virtual", "domicilio"]).nullable().optional(),
  serviceId: z.string().nullable().optional(),
  sendReminders: z.boolean().default(true),
});

const appointmentUpdateSchema = z.object({
  scheduledAt: z
    .string()
    .min(1, "La fecha y hora son obligatorias.")
    .refine((v) => !isNaN(Date.parse(v)), { message: "La fecha no es válida." }),
  durationMinutes: z
    .number()
    .int()
    .positive("La duración debe ser mayor a 0."),
  appointmentType: z.enum(["veterinary", "grooming"]).default("veterinary"),
  consultationType: z.enum(["clinica", "virtual", "domicilio"]).nullable().optional(),
  serviceId: z.string().nullable().optional(),
  sendReminders: z.boolean().default(true),
});

export async function getAppointments(opts?: {
  status?: string;
  appointmentType?: "veterinary" | "grooming";
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
    conditions.push(
      eq(
        appointments.status,
        opts.status as "pending" | "confirmed" | "cancelled" | "completed"
      )
    );
  }

  if (opts?.appointmentType) {
    conditions.push(eq(appointments.appointmentType, opts.appointmentType));
  }

  if (opts?.from) {
    conditions.push(gte(appointments.scheduledAt, new Date(opts.from)));
  }

  if (opts?.to) {
    conditions.push(lte(appointments.scheduledAt, new Date(opts.to)));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const assignedStaff = db.$with("assigned_staff").as(
    db.select({ id: staff.id, name: staff.name }).from(staff)
  );

  const [data, countResult] = await Promise.all([
    db
      .with(assignedStaff)
      .select({
        id: appointments.id,
        scheduledAt: appointments.scheduledAt,
        durationMinutes: appointments.durationMinutes,
        reason: appointments.reason,
        status: appointments.status,
        staffNotes: appointments.staffNotes,
        appointmentType: appointments.appointmentType,
        consultationType: appointments.consultationType,
        assignedStaffId: appointments.assignedStaffId,
        assignedStaffName: assignedStaff.name,
        patientId: appointments.patientId,
        patientName: patients.name,
        patientSpecies: patients.species,
        clientId: clients.id,
        clientName: clients.name,
        clientPhone: clients.phone,
        sendReminders: appointments.sendReminders,
      })
      .from(appointments)
      .innerJoin(patients, eq(appointments.patientId, patients.id))
      .innerJoin(clients, eq(patients.clientId, clients.id))
      .leftJoin(assignedStaff, eq(appointments.assignedStaffId, assignedStaff.id))
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
  const assignedStaff = db.$with("assigned_staff").as(
    db.select({ id: staff.id, name: staff.name }).from(staff)
  );

  const [row] = await db
    .with(assignedStaff)
    .select({
      id: appointments.id,
      scheduledAt: appointments.scheduledAt,
      durationMinutes: appointments.durationMinutes,
      reason: appointments.reason,
      status: appointments.status,
      staffNotes: appointments.staffNotes,
      appointmentType: appointments.appointmentType,
      consultationType: appointments.consultationType,
      assignedStaffId: appointments.assignedStaffId,
      assignedStaffName: assignedStaff.name,
      serviceId: appointments.serviceId,
      patientId: appointments.patientId,
      createdAt: appointments.createdAt,
      updatedAt: appointments.updatedAt,
      sendReminders: appointments.sendReminders,
      patientName: patients.name,
      patientSpecies: patients.species,
      clientId: clients.id,
      clientName: clients.name,
      clientPhone: clients.phone,
      consultationId: consultations.id,
      consultationSubjective: consultations.subjective,
      consultationObjective: consultations.objective,
      consultationAssessment: consultations.assessment,
      consultationPlan: consultations.plan,
      consultationNotes: consultations.notes,
      consultationWeightKg: consultations.weightKg,
      consultationTemperature: consultations.temperature,
      consultationHeartRate: consultations.heartRate,
      consultationRespRate: consultations.respiratoryRate,
    })
    .from(appointments)
    .innerJoin(patients, eq(appointments.patientId, patients.id))
    .innerJoin(clients, eq(patients.clientId, clients.id))
    .leftJoin(consultations, eq(consultations.appointmentId, appointments.id))
    .leftJoin(assignedStaff, eq(appointments.assignedStaffId, assignedStaff.id))
    .where(eq(appointments.id, id))
    .limit(1);

  return row ?? null;
}

export async function getAppointmentById(id: string) {
  return getAppointment(id);
}

export async function createAppointment(formData: FormData) {
  const consultationTypeRaw = ((formData.get("consultationType") as string) || "").trim();
  const serviceIdRaw = ((formData.get("serviceId") as string) || "").trim();
  const reason = ((formData.get("reason") as string) || "").trim() || null;
  const staffNotes = ((formData.get("staffNotes") as string) || "").trim() || null;

  const raw = {
    patientId: (formData.get("patientId") as string)?.trim() ?? "",
    scheduledAt: (formData.get("scheduledAt") as string)?.trim() ?? "",
    durationMinutes: Number(formData.get("durationMinutes")),
    appointmentType: ((formData.get("appointmentType") as string) || "veterinary") as
      | "veterinary"
      | "grooming",
    consultationType: consultationTypeRaw || null,
    serviceId: serviceIdRaw || null,
    sendReminders: formData.get("sendReminders") === "true",
  };

  const parsed = appointmentSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors;
    return {
      errors: {
        patientId: fieldErrors.patientId?.[0],
        scheduledAt: fieldErrors.scheduledAt?.[0],
        durationMinutes: fieldErrors.durationMinutes?.[0],
        appointmentType: fieldErrors.appointmentType?.[0],
        consultationType: fieldErrors.consultationType?.[0],
        serviceId: fieldErrors.serviceId?.[0],
        sendReminders: fieldErrors.sendReminders?.[0],
      },
    };
  }

  let createdId: string;
  try {
    createdId = appointmentId();

    await db.insert(appointments).values({
      id: createdId,
      patientId: parsed.data.patientId,
      scheduledAt: new Date(parsed.data.scheduledAt),
      durationMinutes: parsed.data.durationMinutes,
      reason,
      staffNotes,
      status: "confirmed",
      appointmentType: parsed.data.appointmentType,
      consultationType: parsed.data.consultationType ?? null,
      serviceId: parsed.data.serviceId ?? null,
      sendReminders: parsed.data.sendReminders,
    });
  } catch {
    return { error: "Ocurrió un error inesperado. Intenta de nuevo." };
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/appointments");
  revalidatePath(`/dashboard/patients/${parsed.data.patientId}`);
  redirect(`/dashboard/appointments/${createdId}`);
}

export async function updateAppointment(id: string, formData: FormData) {
  const consultationTypeRaw = ((formData.get("consultationType") as string) || "").trim();
  const serviceIdRaw = ((formData.get("serviceId") as string) || "").trim();
  const reason = ((formData.get("reason") as string) || "").trim() || null;
  const staffNotes = ((formData.get("staffNotes") as string) || "").trim() || null;
  const status = ((formData.get("status") as string) || "").trim();

  const raw = {
    scheduledAt: (formData.get("scheduledAt") as string)?.trim() ?? "",
    durationMinutes: Number(formData.get("durationMinutes")),
    appointmentType: ((formData.get("appointmentType") as string) || "veterinary") as
      | "veterinary"
      | "grooming",
    consultationType: consultationTypeRaw || null,
    serviceId: serviceIdRaw || null,
    sendReminders: formData.get("sendReminders") === "true",
  };

  const parsed = appointmentUpdateSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors;
    return {
      errors: {
        scheduledAt: fieldErrors.scheduledAt?.[0],
        durationMinutes: fieldErrors.durationMinutes?.[0],
        appointmentType: fieldErrors.appointmentType?.[0],
        consultationType: fieldErrors.consultationType?.[0],
        serviceId: fieldErrors.serviceId?.[0],
        sendReminders: fieldErrors.sendReminders?.[0],
      },
    };
  }

  let patientId: string | undefined;
  try {
    const [existing] = await db
      .select({ patientId: appointments.patientId })
      .from(appointments)
      .where(eq(appointments.id, id))
      .limit(1);

    patientId = existing?.patientId;

    await db
      .update(appointments)
      .set({
        scheduledAt: new Date(parsed.data.scheduledAt),
        durationMinutes: parsed.data.durationMinutes,
        appointmentType: parsed.data.appointmentType,
        consultationType: parsed.data.consultationType ?? null,
        reason,
        staffNotes,
        serviceId: parsed.data.serviceId ?? null,
        sendReminders: parsed.data.sendReminders,
        status: (status as "pending" | "confirmed" | "cancelled" | "completed") ?? "pending",
        updatedAt: new Date(),
      })
      .where(eq(appointments.id, id));
  } catch {
    return { error: "Ocurrió un error inesperado. Intenta de nuevo." };
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/appointments");
  if (patientId) revalidatePath(`/dashboard/patients/${patientId}`);
  redirect(`/dashboard/appointments/${id}`);
}

export async function assignStaffToAppointment(id: string, staffId: string | null) {
  await db
    .update(appointments)
    .set({ assignedStaffId: staffId, updatedAt: new Date() })
    .where(eq(appointments.id, id));

  revalidatePath(`/dashboard/appointments/${id}`);
  revalidatePath("/dashboard/appointments");
  revalidatePath("/dashboard");
}

export async function getAllStaffForSelect() {
  return db
    .select({ id: staff.id, name: staff.name, role: staff.role, isActive: staff.isActive })
    .from(staff)
    .where(eq(staff.isActive, true))
    .orderBy(asc(staff.name));
}

export async function updateAppointmentStatus(
  id: string,
  status: "pending" | "confirmed" | "cancelled" | "completed"
) {
  await db
    .update(appointments)
    .set({ status, updatedAt: new Date() })
    .where(eq(appointments.id, id));

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/appointments");
  revalidatePath(`/dashboard/appointments/${id}`);
}

export async function getAppointmentsByPatientId(patientId: string) {
  return db
    .select()
    .from(appointments)
    .where(eq(appointments.patientId, patientId))
    .orderBy(desc(appointments.scheduledAt));
}

export async function getAllPatientsForSelect() {
  return db
    .select({
      id: patients.id,
      name: patients.name,
      species: patients.species,
      clientId: clients.id,
      clientName: clients.name,
    })
    .from(patients)
    .innerJoin(clients, eq(patients.clientId, clients.id))
    .orderBy(clients.name, patients.name);
}

export async function getAllClientsForSelect() {
  return db
    .select({ id: clients.id, name: clients.name })
    .from(clients)
    .orderBy(clients.name);
}