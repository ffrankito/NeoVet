"use server";

import { revalidatePath } from "next/cache";
import * as Sentry from "@sentry/nextjs";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { clients } from "@/db/schema";
import { clientId } from "@/lib/ids";
import { eq, ilike, or, sql, desc, and, gte, ne, asc, count, inArray } from "drizzle-orm";
import {
  patients,
  appointments,
  services,
  staff,
  consultations,
  hospitalizations,
  procedures,
  groomingSessions,
  charges,
} from "@/db/schema";
import { z } from "zod";
import { isAdminLevel } from "@/lib/auth";

const clientSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio."),
  phone: z.string().min(1, "El teléfono es obligatorio."),
  email: z.string().email("El email no es válido.").optional().or(z.literal("")),
  dni: z.string().optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
});

export async function getClients(opts?: {
  search?: string;
  page?: number;
  limit?: number;
}) {
  const page = opts?.page ?? 1;
  const limit = opts?.limit ?? 20;
  const offset = (page - 1) * limit;

  const conditions = opts?.search
    ? or(
        ilike(clients.name, `%${opts.search}%`),
        ilike(clients.phone, `%${opts.search}%`),
        ilike(clients.email, `%${opts.search}%`),
        sql`EXISTS (SELECT 1 FROM patients WHERE patients.client_id = clients.id AND patients.name ILIKE ${"%" + opts.search + "%"})`
      )
    : undefined;

  const [data, countResult] = await Promise.all([
    db
      .select({
        id: clients.id,
        name: clients.name,
        phone: clients.phone,
        email: clients.email,
        importedFromGvet: clients.importedFromGvet,
        createdAt: clients.createdAt,
        patientCount: sql<number>`(
          SELECT COUNT(*) FROM patients WHERE patients.client_id = clients.id
        )`.as("patient_count"),
      })
      .from(clients)
      .where(conditions)
      .orderBy(desc(clients.createdAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)` })
      .from(clients)
      .where(conditions),
  ]);

  return {
    data,
    total: Number(countResult[0].count),
    page,
    limit,
    totalPages: Math.ceil(Number(countResult[0].count) / limit),
  };
}

export async function getClient(id: string) {
  const [client] = await db
    .select()
    .from(clients)
    .where(eq(clients.id, id))
    .limit(1);

  if (!client) return null;

  const clientPatients = await db
    .select()
    .from(patients)
    .where(eq(patients.clientId, id));

  return { ...client, patients: clientPatients };
}

export async function createClient(formData: FormData) {
  const raw = {
    name: (formData.get("name") as string)?.trim() ?? "",
    phone: (formData.get("phone") as string)?.trim() ?? "",
    email: (formData.get("email") as string)?.trim() ?? "",
    dni: (formData.get("dni") as string)?.trim() ?? "",
    address: (formData.get("address") as string)?.trim() ?? "",
  };

  const parsed = clientSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors;
    return {
      errors: {
        name: fieldErrors.name?.[0],
        phone: fieldErrors.phone?.[0],
        email: fieldErrors.email?.[0],
        dni: fieldErrors.dni?.[0],
        address: fieldErrors.address?.[0],
      },
    };
  }

  let id: string;
  try {
    id = clientId();
    await db.insert(clients).values({
      id,
      name: parsed.data.name,
      phone: parsed.data.phone,
      email: parsed.data.email || null,
      dni: parsed.data.dni || null,
      address: parsed.data.address || null,
    });
  } catch (err) {
    Sentry.captureException(err);
    return { error: "Ocurrió un error inesperado. Intenta de nuevo." };
  }

  revalidatePath("/dashboard/clients");
  redirect(`/dashboard/clients/${id}`);
}

export async function updateClient(id: string, formData: FormData) {
  const raw = {
    name: (formData.get("name") as string)?.trim() ?? "",
    phone: (formData.get("phone") as string)?.trim() ?? "",
    email: (formData.get("email") as string)?.trim() ?? "",
    dni: (formData.get("dni") as string)?.trim() ?? "",
    address: (formData.get("address") as string)?.trim() ?? "",
  };

  const parsed = clientSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors;
    return {
      errors: {
        name: fieldErrors.name?.[0],
        phone: fieldErrors.phone?.[0],
        email: fieldErrors.email?.[0],
        dni: fieldErrors.dni?.[0],
        address: fieldErrors.address?.[0],
      },
    };
  }

  try {
    await db
      .update(clients)
      .set({
        name: parsed.data.name,
        phone: parsed.data.phone,
        email: parsed.data.email || null,
        dni: parsed.data.dni || null,
        address: parsed.data.address || null,
        updatedAt: new Date(),
      })
      .where(eq(clients.id, id));
  } catch (err) {
    Sentry.captureException(err);
    return { error: "Ocurrió un error inesperado. Intenta de nuevo." };
  }

  revalidatePath("/dashboard/clients");
  redirect(`/dashboard/clients/${id}`);
}

export type ClientDeletePreview = {
  patients: number;
  consultations: number;
  appointments: number;
  hospitalizations: number;
  procedures: number;
  groomingSessions: number;
  pendingCharges: number;
};

/**
 * Counts the records that will be permanently destroyed by deleteClient(id).
 * Walks through patients to also count their cascade impact (consultations,
 * appointments, hospitalizations, etc.). Used to populate the confirmation
 * dialog so admins see what they're about to wipe before confirming.
 *
 * Admin / owner only.
 */
export async function getClientDeletePreview(
  id: string,
): Promise<ClientDeletePreview> {
  if (!(await isAdminLevel())) {
    throw new Error("No autorizado");
  }

  const patientRows = await db
    .select({ id: patients.id })
    .from(patients)
    .where(eq(patients.clientId, id));
  const patientIds = patientRows.map((p) => p.id);

  // Empty IN () is invalid SQL — short-circuit when the client has no pets.
  const noPatients = patientIds.length === 0;

  const [
    [{ n: pendingChargesCount } = { n: 0 }],
    [{ n: consultationsCount } = { n: 0 }],
    [{ n: appointmentsCount } = { n: 0 }],
    [{ n: hospitalizationsCount } = { n: 0 }],
    [{ n: proceduresCount } = { n: 0 }],
    [{ n: groomingCount } = { n: 0 }],
  ] = await Promise.all([
    db
      .select({ n: count() })
      .from(charges)
      .where(and(eq(charges.clientId, id), inArray(charges.status, ["pending", "partial"]))),
    noPatients
      ? Promise.resolve([{ n: 0 }])
      : db.select({ n: count() }).from(consultations).where(inArray(consultations.patientId, patientIds)),
    noPatients
      ? Promise.resolve([{ n: 0 }])
      : db.select({ n: count() }).from(appointments).where(inArray(appointments.patientId, patientIds)),
    noPatients
      ? Promise.resolve([{ n: 0 }])
      : db.select({ n: count() }).from(hospitalizations).where(inArray(hospitalizations.patientId, patientIds)),
    noPatients
      ? Promise.resolve([{ n: 0 }])
      : db.select({ n: count() }).from(procedures).where(inArray(procedures.patientId, patientIds)),
    noPatients
      ? Promise.resolve([{ n: 0 }])
      : db.select({ n: count() }).from(groomingSessions).where(inArray(groomingSessions.patientId, patientIds)),
  ]);

  return {
    patients: patientIds.length,
    consultations: Number(consultationsCount),
    appointments: Number(appointmentsCount),
    hospitalizations: Number(hospitalizationsCount),
    procedures: Number(proceduresCount),
    groomingSessions: Number(groomingCount),
    pendingCharges: Number(pendingChargesCount),
  };
}

export async function deleteClient(id: string) {
  // Hard delete cascades to patients, consultations, appointments,
  // hospitalizations, procedures, consent_documents, vaccinations,
  // grooming_sessions, follow_ups. Admin / owner only.
  if (!(await isAdminLevel())) {
    throw new Error("No autorizado");
  }
  await db.delete(clients).where(eq(clients.id, id));
  revalidatePath("/dashboard/clients");
  redirect("/dashboard/clients");
}

export async function getUpcomingAppointmentsByClientId(clientId: string) {
  return db
    .select({
      id: appointments.id,
      scheduledAt: appointments.scheduledAt,
      status: appointments.status,
      patientName: patients.name,
      serviceName: services.name,
      assignedStaffName: staff.name,
    })
    .from(appointments)
    .innerJoin(patients, eq(appointments.patientId, patients.id))
    .leftJoin(services, eq(appointments.serviceId, services.id))
    .leftJoin(staff, eq(appointments.assignedStaffId, staff.id))
    .where(
      and(
        eq(patients.clientId, clientId),
        gte(appointments.scheduledAt, new Date()),
        ne(appointments.status, "cancelled")
      )
    )
    .orderBy(asc(appointments.scheduledAt))
    .limit(10);
}
