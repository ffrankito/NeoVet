"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { appointments, patients, clients, consultations, staff, services, vaccinations } from "@/db/schema";
import { appointmentId } from "@/lib/ids";
import { eq, desc, and, gte, lte, sql, asc } from "drizzle-orm";
import { z } from "zod";
import { parseDateTimeAsART, dateToStartART, dateToEndART } from "@/lib/timezone";
import { hasRole, getSessionStaffId } from "@/lib/auth";
import { sendAndLogEmail } from "@/lib/email/send-email";
import { BookingConfirmationEmail } from "@/lib/email/templates/booking-confirmation";
import { CancellationNotificationEmail } from "@/lib/email/templates/cancellation-notification";
import { render } from "@react-email/render";

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
    conditions.push(gte(appointments.scheduledAt, dateToStartART(opts.from)));
  }

  if (opts?.to) {
    conditions.push(lte(appointments.scheduledAt, dateToEndART(opts.to)));
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
      cancellationReason: appointments.cancellationReason,
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
      scheduledAt: parseDateTimeAsART(parsed.data.scheduledAt),
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

  // Send booking confirmation email if reminders enabled
  if (parsed.data.sendReminders) {
    try {
      const [emailData] = await db
        .select({
          clientEmail: clients.email,
          clientName: clients.name,
          patientName: patients.name,
        })
        .from(patients)
        .innerJoin(clients, eq(patients.clientId, clients.id))
        .where(eq(patients.id, parsed.data.patientId))
        .limit(1);

      if (emailData?.clientEmail) {
        const [serviceRow] = parsed.data.serviceId
          ? await db.select({ name: services.name }).from(services).where(eq(services.id, parsed.data.serviceId)).limit(1)
          : [null];

        const html = await render(
          BookingConfirmationEmail({
            patientName: emailData.patientName ?? "su mascota",
            clientName: emailData.clientName ?? "Cliente",
            scheduledAt: parseDateTimeAsART(parsed.data.scheduledAt),
            serviceName: serviceRow?.name,
            staffName: null,
            clinicAddress: process.env.CLINIC_ADDRESS ?? "Morrow 4064, Rosario",
          })
        );

        await sendAndLogEmail({
          to: emailData.clientEmail,
          subject: "Turno confirmado — NeoVet",
          html,
          logType: "booking_confirmation",
          referenceId: createdId,
        });
      }
    } catch {
      // Email failure should not block appointment creation
    }
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
        scheduledAt: parseDateTimeAsART(parsed.data.scheduledAt),
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
  status: "pending" | "confirmed" | "cancelled" | "completed" | "no_show",
  cancellationReason?: string
) {
  const updateData: Record<string, unknown> = { status, updatedAt: new Date() };
  if (status === "cancelled" && cancellationReason) {
    updateData.cancellationReason = cancellationReason.trim();
  }

  await db
    .update(appointments)
    .set(updateData)
    .where(eq(appointments.id, id));

  // Send cancellation notification email
  if (status === "cancelled") {
    try {
      const [aptData] = await db
        .select({
          scheduledAt: appointments.scheduledAt,
          patientName: patients.name,
          clientName: clients.name,
          clientEmail: clients.email,
          serviceName: services.name,
          sendReminders: appointments.sendReminders,
        })
        .from(appointments)
        .innerJoin(patients, eq(appointments.patientId, patients.id))
        .innerJoin(clients, eq(patients.clientId, clients.id))
        .leftJoin(services, eq(appointments.serviceId, services.id))
        .where(eq(appointments.id, id))
        .limit(1);

      if (aptData?.clientEmail && aptData.sendReminders) {
        const html = await render(
          CancellationNotificationEmail({
            patientName: aptData.patientName ?? "su mascota",
            clientName: aptData.clientName ?? "Cliente",
            scheduledAt: new Date(aptData.scheduledAt),
            serviceName: aptData.serviceName,
            cancellationReason: cancellationReason || null,
            clinicAddress: process.env.CLINIC_ADDRESS ?? "Morrow 4064, Rosario",
          })
        );

        await sendAndLogEmail({
          to: aptData.clientEmail,
          subject: "Turno cancelado — NeoVet",
          html,
          logType: "cancellation",
          referenceId: id,
        });
      }
    } catch {
      // Email failure should not block status update
    }
  }

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

// --- Inline client + patient creation (reusable for chatbot v2) ---

const inlineClientSchema = z.object({
  clientName: z.string().min(1, "El nombre del cliente es obligatorio."),
  clientPhone: z.string().min(1, "El teléfono es obligatorio."),
  clientEmail: z.string().email("El email no es válido.").optional().or(z.literal("")),
  patientName: z.string().min(1, "El nombre de la mascota es obligatorio."),
  patientSpecies: z.string().min(1, "La especie es obligatoria."),
  patientBreed: z.string().optional().or(z.literal("")),
  patientSex: z.enum(["macho", "hembra"], { message: "El sexo es obligatorio." }),
});

export type InlineClientData = z.infer<typeof inlineClientSchema>;

/**
 * Creates a client and patient in a single operation.
 * Designed to be reusable from the chatbot API in v2.
 *
 * @returns { clientId, patientId } on success, or { error } / { errors } on failure
 */
export async function createClientAndPatient(data: InlineClientData) {
  const parsed = inlineClientSchema.safeParse(data);
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const { clientId: genClientId, patientId: genPatientId } = await import("@/lib/ids");

  const newClientId = genClientId();
  const newPatientId = genPatientId();

  try {
    await db.insert(clients).values({
      id: newClientId,
      name: parsed.data.clientName,
      phone: parsed.data.clientPhone,
      email: parsed.data.clientEmail || null,
    });

    await db.insert(patients).values({
      id: newPatientId,
      clientId: newClientId,
      name: parsed.data.patientName,
      species: parsed.data.patientSpecies,
      breed: parsed.data.patientBreed || null,
      sex: parsed.data.patientSex,
    });
  } catch {
    return { error: "Error al crear el cliente y paciente." };
  }

  revalidatePath("/dashboard/clients");
  revalidatePath("/dashboard/patients");

  return { clientId: newClientId, patientId: newPatientId };
}

const inlinePatientSchema = z.object({
  clientId: z.string().min(1),
  patientName: z.string().min(1, "El nombre de la mascota es obligatorio."),
  patientSpecies: z.string().min(1, "La especie es obligatoria."),
  patientBreed: z.string().optional().or(z.literal("")),
  patientSex: z.enum(["macho", "hembra"], { message: "El sexo es obligatorio." }),
});

export type InlinePatientData = z.infer<typeof inlinePatientSchema>;

/**
 * Creates a patient for an existing client.
 */
export async function createPatientInline(data: InlinePatientData) {
  const parsed = inlinePatientSchema.safeParse(data);
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const { patientId: genPatientId } = await import("@/lib/ids");
  const newPatientId = genPatientId();

  try {
    await db.insert(patients).values({
      id: newPatientId,
      clientId: parsed.data.clientId,
      name: parsed.data.patientName,
      species: parsed.data.patientSpecies,
      breed: parsed.data.patientBreed || null,
      sex: parsed.data.patientSex,
    });
  } catch {
    return { error: "Error al crear el paciente." };
  }

  revalidatePath("/dashboard/patients");
  return { patientId: newPatientId };
}

const BRACHYCEPHALIC_BREEDS = [
  "bulldog", "bulldog inglés", "bulldog francés", "pug", "boston terrier",
  "boxer", "shih tzu", "cavalier king charles", "pekinés",
];

export async function getPatientMiniSummary(patientId: string) {
  const [lastConsultation] = await db
    .select({
      id: consultations.id,
      assessment: consultations.assessment,
      createdAt: consultations.createdAt,
    })
    .from(consultations)
    .where(eq(consultations.patientId, patientId))
    .orderBy(desc(consultations.createdAt))
    .limit(1);

  // Get today's date in Argentina timezone (YYYY-MM-DD)
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "America/Argentina/Buenos_Aires" });
  const overdueVaccines = await db
    .select({ name: vaccinations.vaccineName, nextDueAt: vaccinations.nextDueAt })
    .from(vaccinations)
    .where(
      and(
        eq(vaccinations.patientId, patientId),
        lte(vaccinations.nextDueAt, today)
      )
    );

  const [patient] = await db
    .select({
      breed: patients.breed,
      deceased: patients.deceased,
    })
    .from(patients)
    .where(eq(patients.id, patientId))
    .limit(1);

  const isBrachycephalic = patient?.breed
    ? BRACHYCEPHALIC_BREEDS.some((b) => patient.breed!.toLowerCase().includes(b))
    : false;

  return {
    lastConsultation: lastConsultation ?? null,
    overdueVaccines,
    isDeceased: patient?.deceased ?? false,
    isBrachycephalic,
  };
}

export async function getServicesForWalkIn() {
  return db
    .select({
      id: services.id,
      name: services.name,
      category: services.category,
    })
    .from(services)
    .where(eq(services.isActive, true))
    .orderBy(services.name);
}

export async function createWalkIn(formData: FormData) {
  const canManage = await hasRole("admin", "owner", "vet", "groomer");
  if (!canManage) return { error: "No autorizado." };

  const staffMemberId = await getSessionStaffId();
  if (!staffMemberId) return { error: "No se pudo identificar al usuario." };

  const patientId = (formData.get("patientId") as string)?.trim();
  if (!patientId) return { error: "El paciente es obligatorio." };

  const serviceId = (formData.get("serviceId") as string)?.trim() || null;
  const reason = (formData.get("reason") as string)?.trim() || null;
  const isUrgent = formData.get("isUrgent") === "on";

  try {
    await db.insert(appointments).values({
      id: appointmentId(),
      patientId,
      appointmentType: "veterinary",
      assignedStaffId: staffMemberId,
      serviceId,
      scheduledAt: new Date(),
      durationMinutes: 30,
      reason,
      status: "confirmed",
      isWalkIn: true,
      isUrgent,
      sendReminders: false,
    });
  } catch {
    return { error: "Ocurrió un error inesperado. Intenta de nuevo." };
  }

  revalidatePath("/dashboard");
  return { success: true };
}