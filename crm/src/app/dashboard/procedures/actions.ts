"use server";

import { revalidatePath } from "next/cache";
import * as Sentry from "@sentry/nextjs";
import { redirect } from "next/navigation";
import { db } from "@/db";
import {
  procedures,
  procedureStaff,
  procedureSupplies,
  patients,
  clients,
  staff,
  products,
  followUps,
} from "@/db/schema";
import {
  procedureId as genProcedureId,
  procedureStaffId,
  procedureSupplyId,
} from "@/lib/ids";
import { eq, desc, and, or, sql, inArray } from "drizzle-orm";
import { z } from "zod";
import { getSessionStaffId, hasRole } from "@/lib/auth";
import { parseDateTimeAsART } from "@/lib/timezone";
import { buildPatientAwareSearchClause } from "@/lib/search/patient-aware-search";

// ── Schemas ──────────────────────────────────────────────────────────────────

const procedureSchema = z.object({
  patientId: z.string().min(1, "El paciente es obligatorio."),
  hospitalizationId: z.string().optional(),
  procedureDate: z.string().min(1, "La fecha es obligatoria."),
  description: z.string().min(1, "La descripción es obligatoria."),
  type: z.string().optional(),
  notes: z.string().optional(),
  asaScore: z.enum(["1", "2", "3", "4", "5", "1E", "2E", "3E", "4E", "5E", ""]).optional().transform((v) => v || undefined),
  preWeightKg: z.string().optional().refine((v) => !v || !isNaN(parseFloat(v)), { message: "El peso no es válido." }),
  preTemperature: z.string().optional().refine((v) => !v || !isNaN(parseFloat(v)), { message: "La temperatura no es válida." }),
  preHeartRate: z.string().optional().refine((v) => !v || !isNaN(parseFloat(v)), { message: "La FC no es válida." }),
  preRespiratoryRate: z.string().optional().refine((v) => !v || !isNaN(parseFloat(v)), { message: "La FR no es válida." }),
  postWeightKg: z.string().optional().refine((v) => !v || !isNaN(parseFloat(v)), { message: "El peso no es válido." }),
  postTemperature: z.string().optional().refine((v) => !v || !isNaN(parseFloat(v)), { message: "La temperatura no es válida." }),
  postHeartRate: z.string().optional().refine((v) => !v || !isNaN(parseFloat(v)), { message: "La FC no es válida." }),
  postRespiratoryRate: z.string().optional().refine((v) => !v || !isNaN(parseFloat(v)), { message: "La FR no es válida." }),
});

const supplySchema = z.object({
  productId: z.string().min(1, "El producto es obligatorio."),
  quantity: z.coerce.number().positive("La cantidad debe ser mayor a 0."),
});

// ── Queries ──────────────────────────────────────────────────────────────────

export async function getProcedures(opts?: {
  page?: number;
  limit?: number;
  patientId?: string;
  search?: string;
}) {
  const page = opts?.page ?? 1;
  const limit = opts?.limit ?? 20;
  const offset = (page - 1) * limit;

  const conditions = [];
  if (opts?.patientId) {
    conditions.push(eq(procedures.patientId, opts.patientId));
  }

  const searchClause = buildPatientAwareSearchClause(opts?.search);
  if (searchClause) conditions.push(searchClause);

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [data, countResult] = await Promise.all([
    db
      .select({
        id: procedures.id,
        patientName: patients.name,
        clientName: clients.name,
        procedureDate: procedures.procedureDate,
        description: procedures.description,
        type: procedures.type,
      })
      .from(procedures)
      .innerJoin(patients, eq(procedures.patientId, patients.id))
      .innerJoin(clients, eq(patients.clientId, clients.id))
      .where(whereClause)
      .orderBy(desc(procedures.procedureDate))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)` })
      .from(procedures)
      .innerJoin(patients, eq(procedures.patientId, patients.id))
      .innerJoin(clients, eq(patients.clientId, clients.id))
      .where(whereClause),
  ]);

  // Fetch staff for each procedure
  const procedureIds = data.map((d) => d.id);
  const staffRows = procedureIds.length > 0
    ? await db
        .select({
          procedureId: procedureStaff.procedureId,
          staffName: staff.name,
          role: procedureStaff.role,
        })
        .from(procedureStaff)
        .innerJoin(staff, eq(procedureStaff.staffId, staff.id))
        .where(inArray(procedureStaff.procedureId, procedureIds))
    : [];

  const enriched = data.map((d) => {
    const myStaff = staffRows.filter((s) => s.procedureId === d.id);
    return {
      ...d,
      surgeonNames: myStaff.filter((s) => s.role === "surgeon").map((s) => s.staffName).join(", "),
      anesthesiologistNames: myStaff.filter((s) => s.role === "anesthesiologist").map((s) => s.staffName).join(", "),
    };
  });

  return {
    data: enriched,
    total: Number(countResult[0].count),
    page,
    limit,
    totalPages: Math.ceil(Number(countResult[0].count) / limit),
  };
}

export async function getProcedure(id: string) {
  const createdByStaff = db.$with("created_by_staff").as(
    db.select({ id: staff.id, name: staff.name }).from(staff)
  );

  const [row] = await db
    .with(createdByStaff)
    .select({
      id: procedures.id,
      patientId: procedures.patientId,
      hospitalizationId: procedures.hospitalizationId,
      procedureDate: procedures.procedureDate,
      description: procedures.description,
      type: procedures.type,
      notes: procedures.notes,
      asaScore: procedures.asaScore,
      preWeightKg: procedures.preWeightKg,
      preTemperature: procedures.preTemperature,
      preHeartRate: procedures.preHeartRate,
      preRespiratoryRate: procedures.preRespiratoryRate,
      postWeightKg: procedures.postWeightKg,
      postTemperature: procedures.postTemperature,
      postHeartRate: procedures.postHeartRate,
      postRespiratoryRate: procedures.postRespiratoryRate,
      createdById: procedures.createdById,
      createdAt: procedures.createdAt,
      updatedAt: procedures.updatedAt,
      patientName: patients.name,
      patientSpecies: patients.species,
      patientBreed: patients.breed,
      clientId: clients.id,
      clientName: clients.name,
      clientPhone: clients.phone,
      createdByName: createdByStaff.name,
    })
    .from(procedures)
    .innerJoin(patients, eq(procedures.patientId, patients.id))
    .innerJoin(clients, eq(patients.clientId, clients.id))
    .leftJoin(createdByStaff, eq(procedures.createdById, createdByStaff.id))
    .where(eq(procedures.id, id))
    .limit(1);

  if (!row) return null;

  // Fetch staff assignments (surgeons + anesthesiologists)
  const staffAssignments = await db
    .select({
      id: procedureStaff.id,
      staffId: procedureStaff.staffId,
      staffName: staff.name,
      role: procedureStaff.role,
    })
    .from(procedureStaff)
    .innerJoin(staff, eq(procedureStaff.staffId, staff.id))
    .where(eq(procedureStaff.procedureId, id));

  const surgeons = staffAssignments.filter((s) => s.role === "surgeon");
  const anesthesiologists = staffAssignments.filter((s) => s.role === "anesthesiologist");
  const assistants = staffAssignments.filter((s) => s.role === "assistant");

  // Fetch supplies with product names
  const supplies = await db
    .select({
      id: procedureSupplies.id,
      procedureId: procedureSupplies.procedureId,
      productId: procedureSupplies.productId,
      productName: products.name,
      quantity: procedureSupplies.quantity,
      unitCost: procedureSupplies.unitCost,
      createdAt: procedureSupplies.createdAt,
    })
    .from(procedureSupplies)
    .innerJoin(products, eq(procedureSupplies.productId, products.id))
    .where(eq(procedureSupplies.procedureId, id))
    .orderBy(procedureSupplies.createdAt);

  // Fetch linked follow-ups
  const linkedFollowUps = await db
    .select({
      id: followUps.id,
      scheduledDate: followUps.scheduledDate,
      reason: followUps.reason,
      sentAt: followUps.sentAt,
      createdAt: followUps.createdAt,
    })
    .from(followUps)
    .where(eq(followUps.procedureId, id))
    .orderBy(desc(followUps.scheduledDate));

  return { ...row, surgeons, anesthesiologists, assistants, supplies, followUps: linkedFollowUps };
}

export async function getProceduresByPatient(patientId: string) {
  const data = await db
    .select({
      id: procedures.id,
      procedureDate: procedures.procedureDate,
      description: procedures.description,
      type: procedures.type,
      notes: procedures.notes,
      createdAt: procedures.createdAt,
    })
    .from(procedures)
    .where(eq(procedures.patientId, patientId))
    .orderBy(desc(procedures.procedureDate));

  // Fetch surgeon names for each procedure
  const procIds = data.map((d) => d.id);
  const staffRows = procIds.length > 0
    ? await db
        .select({
          procedureId: procedureStaff.procedureId,
          staffName: staff.name,
          role: procedureStaff.role,
        })
        .from(procedureStaff)
        .innerJoin(staff, eq(procedureStaff.staffId, staff.id))
        .where(and(inArray(procedureStaff.procedureId, procIds), eq(procedureStaff.role, "surgeon")))
    : [];

  return data.map((d) => ({
    ...d,
    surgeonName: staffRows
      .filter((s) => s.procedureId === d.id)
      .map((s) => s.staffName)
      .join(", ") || null,
  }));
}

export async function getStaffForProcedure() {
  return db
    .select({
      id: staff.id,
      name: staff.name,
    })
    .from(staff)
    .where(
      and(
        inArray(staff.role, ["admin", "owner", "vet"]),
        or(eq(staff.isActive, true), eq(staff.isExternal, true))
      )
    )
    .orderBy(staff.name);
}

export async function getActiveProductsForSupply() {
  return db
    .select({
      id: products.id,
      name: products.name,
      currentStock: products.currentStock,
      costPrice: products.costPrice,
    })
    .from(products)
    .where(eq(products.isActive, true))
    .orderBy(products.name);
}

// ── Mutations ────────────────────────────────────────────────────────────────

export async function createProcedure(formData: FormData) {
  const canManage = await hasRole("admin", "owner", "vet");
  if (!canManage) return { error: "No autorizado." };

  const staffMemberId = await getSessionStaffId();
  if (!staffMemberId) return { error: "No se pudo identificar al usuario." };

  const raw = {
    patientId: (formData.get("patientId") as string)?.trim() ?? "",
    hospitalizationId:
      (formData.get("hospitalizationId") as string)?.trim() || undefined,
    procedureDate: (formData.get("procedureDate") as string)?.trim() ?? "",
    description: (formData.get("description") as string)?.trim() ?? "",
    type: (formData.get("type") as string)?.trim() || undefined,
    notes: (formData.get("notes") as string)?.trim() || undefined,
    asaScore: (formData.get("asaScore") as string)?.trim() || undefined,
    preWeightKg: (formData.get("preWeightKg") as string)?.trim() || undefined,
    preTemperature: (formData.get("preTemperature") as string)?.trim() || undefined,
    preHeartRate: (formData.get("preHeartRate") as string)?.trim() || undefined,
    preRespiratoryRate: (formData.get("preRespiratoryRate") as string)?.trim() || undefined,
    postWeightKg: (formData.get("postWeightKg") as string)?.trim() || undefined,
    postTemperature: (formData.get("postTemperature") as string)?.trim() || undefined,
    postHeartRate: (formData.get("postHeartRate") as string)?.trim() || undefined,
    postRespiratoryRate: (formData.get("postRespiratoryRate") as string)?.trim() || undefined,
  };

  // Parse staff IDs from form (comma-separated or multiple form entries)
  const surgeonIds = (formData.getAll("surgeonIds") as string[]).filter(Boolean);
  const anesthesiologistIds = (formData.getAll("anesthesiologistIds") as string[]).filter(Boolean);
  const assistantIds = (formData.getAll("assistantIds") as string[]).filter(Boolean);

  const parsed = procedureSchema.safeParse(raw);
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const d = parsed.data;

  let id: string;
  try {
    id = genProcedureId();
    await db.insert(procedures).values({
      id,
      patientId: d.patientId,
      hospitalizationId: d.hospitalizationId || null,
      procedureDate: parseDateTimeAsART(d.procedureDate),
      description: d.description,
      type: d.type || null,
      notes: d.notes || null,
      asaScore: d.asaScore || null,
      preWeightKg: d.preWeightKg || null,
      preTemperature: d.preTemperature || null,
      preHeartRate: d.preHeartRate || null,
      preRespiratoryRate: d.preRespiratoryRate || null,
      postWeightKg: d.postWeightKg || null,
      postTemperature: d.postTemperature || null,
      postHeartRate: d.postHeartRate || null,
      postRespiratoryRate: d.postRespiratoryRate || null,
      createdById: staffMemberId,
    });

    // Insert staff assignments
    for (const sId of surgeonIds) {
      await db.insert(procedureStaff).values({
        id: procedureStaffId(),
        procedureId: id,
        staffId: sId,
        role: "surgeon",
      });
    }
    for (const aId of anesthesiologistIds) {
      await db.insert(procedureStaff).values({
        id: procedureStaffId(),
        procedureId: id,
        staffId: aId,
        role: "anesthesiologist",
      });
    }
    for (const asId of assistantIds) {
      await db.insert(procedureStaff).values({
        id: procedureStaffId(),
        procedureId: id,
        staffId: asId,
        role: "assistant",
      });
    }
  } catch (err) {
    Sentry.captureException(err);
    return { error: "Ocurrió un error inesperado. Intenta de nuevo." };
  }

  revalidatePath("/dashboard/procedures");
  revalidatePath(`/dashboard/patients/${d.patientId}`);
  redirect(`/dashboard/procedures/${id}`);
}

export async function updateProcedure(id: string, formData: FormData) {
  const canManage = await hasRole("admin", "owner", "vet");
  if (!canManage) return { error: "No autorizado." };

  const raw = {
    patientId: (formData.get("patientId") as string)?.trim() ?? "",
    hospitalizationId:
      (formData.get("hospitalizationId") as string)?.trim() || undefined,
    procedureDate: (formData.get("procedureDate") as string)?.trim() ?? "",
    description: (formData.get("description") as string)?.trim() ?? "",
    type: (formData.get("type") as string)?.trim() || undefined,
    notes: (formData.get("notes") as string)?.trim() || undefined,
    asaScore: (formData.get("asaScore") as string)?.trim() || undefined,
    preWeightKg: (formData.get("preWeightKg") as string)?.trim() || undefined,
    preTemperature: (formData.get("preTemperature") as string)?.trim() || undefined,
    preHeartRate: (formData.get("preHeartRate") as string)?.trim() || undefined,
    preRespiratoryRate: (formData.get("preRespiratoryRate") as string)?.trim() || undefined,
    postWeightKg: (formData.get("postWeightKg") as string)?.trim() || undefined,
    postTemperature: (formData.get("postTemperature") as string)?.trim() || undefined,
    postHeartRate: (formData.get("postHeartRate") as string)?.trim() || undefined,
    postRespiratoryRate: (formData.get("postRespiratoryRate") as string)?.trim() || undefined,
  };

  const surgeonIds = (formData.getAll("surgeonIds") as string[]).filter(Boolean);
  const anesthesiologistIds = (formData.getAll("anesthesiologistIds") as string[]).filter(Boolean);
  const assistantIds = (formData.getAll("assistantIds") as string[]).filter(Boolean);

  const parsed = procedureSchema.safeParse(raw);
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const d = parsed.data;

  try {
    const [existing] = await db
      .select({ patientId: procedures.patientId })
      .from(procedures)
      .where(eq(procedures.id, id))
      .limit(1);

    if (!existing) {
      return { error: "Procedimiento no encontrado." };
    }

    await db
      .update(procedures)
      .set({
        patientId: d.patientId,
        hospitalizationId: d.hospitalizationId || null,
        procedureDate: parseDateTimeAsART(d.procedureDate),
        description: d.description,
        type: d.type || null,
        notes: d.notes || null,
        asaScore: d.asaScore || null,
        preWeightKg: d.preWeightKg || null,
        preTemperature: d.preTemperature || null,
        preHeartRate: d.preHeartRate || null,
        preRespiratoryRate: d.preRespiratoryRate || null,
        postWeightKg: d.postWeightKg || null,
        postTemperature: d.postTemperature || null,
        postHeartRate: d.postHeartRate || null,
        postRespiratoryRate: d.postRespiratoryRate || null,
        updatedAt: new Date(),
      })
      .where(eq(procedures.id, id));

    // Replace staff assignments: delete all, re-insert
    await db.delete(procedureStaff).where(eq(procedureStaff.procedureId, id));
    for (const sId of surgeonIds) {
      await db.insert(procedureStaff).values({
        id: procedureStaffId(),
        procedureId: id,
        staffId: sId,
        role: "surgeon",
      });
    }
    for (const aId of anesthesiologistIds) {
      await db.insert(procedureStaff).values({
        id: procedureStaffId(),
        procedureId: id,
        staffId: aId,
        role: "anesthesiologist",
      });
    }
    for (const asId of assistantIds) {
      await db.insert(procedureStaff).values({
        id: procedureStaffId(),
        procedureId: id,
        staffId: asId,
        role: "assistant",
      });
    }

    revalidatePath("/dashboard/procedures");
    revalidatePath(`/dashboard/procedures/${id}`);
    revalidatePath(`/dashboard/patients/${d.patientId}`);
    if (existing.patientId !== d.patientId) {
      revalidatePath(`/dashboard/patients/${existing.patientId}`);
    }
  } catch (err) {
    Sentry.captureException(err);
    return { error: "Ocurrió un error inesperado. Intenta de nuevo." };
  }

  return { success: true };
}

export async function addProcedureSupply(
  procedureId: string,
  formData: FormData
) {
  const canManage = await hasRole("admin", "owner", "vet");
  if (!canManage) return { error: "No autorizado." };

  const raw = {
    productId: (formData.get("productId") as string)?.trim() ?? "",
    quantity: (formData.get("quantity") as string)?.trim() ?? "",
  };

  const parsed = supplySchema.safeParse(raw);
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const d = parsed.data;

  try {
    // Look up the product to get its costPrice at time of insertion
    const [product] = await db
      .select({
        costPrice: products.costPrice,
        currentStock: products.currentStock,
      })
      .from(products)
      .where(eq(products.id, d.productId))
      .limit(1);

    if (!product) {
      return { error: "Producto no encontrado." };
    }

    // Insert the supply row
    await db.insert(procedureSupplies).values({
      id: procedureSupplyId(),
      procedureId,
      productId: d.productId,
      quantity: String(d.quantity),
      unitCost: product.costPrice,
    });

    // Decrement stock atomically
    await db
      .update(products)
      .set({
        currentStock: sql`${products.currentStock}::numeric - ${d.quantity}`,
        updatedAt: new Date(),
      })
      .where(eq(products.id, d.productId));
  } catch (err) {
    Sentry.captureException(err);
    return { error: "Ocurri\u00f3 un error inesperado. Intenta de nuevo." };
  }

  revalidatePath(`/dashboard/procedures/${procedureId}`);
  revalidatePath("/dashboard/petshop/products");
  return { success: true };
}

export async function deleteProcedureSupply(id: string) {
  const canManage = await hasRole("admin", "owner", "vet");
  if (!canManage) return { error: "No autorizado." };

  try {
    // Fetch the supply to know the product and quantity to restore
    const [supply] = await db
      .select({
        procedureId: procedureSupplies.procedureId,
        productId: procedureSupplies.productId,
        quantity: procedureSupplies.quantity,
      })
      .from(procedureSupplies)
      .where(eq(procedureSupplies.id, id))
      .limit(1);

    if (!supply) {
      return { error: "Insumo no encontrado." };
    }

    // Delete the supply row
    await db
      .delete(procedureSupplies)
      .where(eq(procedureSupplies.id, id));

    // Restore stock atomically
    await db
      .update(products)
      .set({
        currentStock: sql`${products.currentStock}::numeric + ${Number(supply.quantity)}`,
        updatedAt: new Date(),
      })
      .where(eq(products.id, supply.productId));

    revalidatePath(`/dashboard/procedures/${supply.procedureId}`);
    revalidatePath("/dashboard/petshop/products");
  } catch (err) {
    Sentry.captureException(err);
    return { error: "Ocurri\u00f3 un error inesperado. Intenta de nuevo." };
  }

  return { success: true };
}
