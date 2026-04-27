"use server";

import { revalidatePath } from "next/cache";
import * as Sentry from "@sentry/nextjs";
import { db } from "@/db";
import { charges, clients } from "@/db/schema";
import { chargeId as genChargeId } from "@/lib/ids";
import { eq, desc, and, sql, ne, ilike } from "drizzle-orm";
import { z } from "zod";
import { getSessionStaffId, isAdminLevel, hasRole } from "@/lib/auth";

// ── Types ───────────────────────────────────────────────────────────────────

export type DeudorRow = {
  clientId: string;
  clientName: string;
  clientPhone: string | null;
  totalBalance: number;
  chargeCount: number;
};

export type DeudoresResult = {
  data: DeudorRow[];
  total: number;
  page: number;
  totalPages: number;
};

export type ClientChargeRow = {
  id: string;
  sourceType: string;
  sourceId: string | null;
  description: string | null;
  amount: string;
  paidAmount: string;
  status: string;
  createdAt: Date;
};

export type ClientDebtSummary = {
  totalBalance: number;
  byCategory: Array<{ sourceType: string; total: number }>;
};

// ── Zod Schemas ─────────────────────────────────────────────────────────────

const SOURCE_TYPES = [
  "consultation",
  "grooming",
  "procedure",
  "sale",
  "hospitalization",
  "other",
] as const;

const createChargeSchema = z.object({
  clientId: z.string().min(1, "El cliente es obligatorio."),
  sourceType: z.enum(SOURCE_TYPES, { message: "El tipo de origen es inv\u00e1lido." }),
  sourceId: z.string().optional(),
  description: z.string().min(1, "La descripci\u00f3n es obligatoria."),
  amount: z.coerce.number().positive("El monto debe ser mayor a 0."),
});

const recordPaymentSchema = z.object({
  paymentAmount: z.coerce.number().positive("El monto debe ser mayor a 0."),
});

// ── Queries ─────────────────────────────────────────────────────────────────

/**
 * Returns clients with unpaid balances (debtors), paginated.
 * Ordered by total balance descending (biggest debtors first).
 */
export async function getDeudores(opts?: {
  page?: number;
  limit?: number;
  search?: string;
}): Promise<DeudoresResult> {
  const page = opts?.page ?? 1;
  const limit = opts?.limit ?? 20;
  const offset = (page - 1) * limit;
  const search = opts?.search?.trim() ?? "";

  // Build WHERE conditions for the charges table
  const chargeConditions = [
    ne(charges.status, "paid"),
  ];

  // Base query: group charges by clientId, compute balance
  // We join clients for name/phone and optionally filter by search
  const balanceSql = sql<number>`SUM(${charges.amount}::numeric - ${charges.paidAmount}::numeric)`;
  const countSql = sql<number>`COUNT(${charges.id})::int`;

  const whereConditions = search
    ? and(...chargeConditions, ilike(clients.name, `%${search}%`))
    : and(...chargeConditions);

  const baseQuery = db
    .select({
      clientId: charges.clientId,
      clientName: clients.name,
      clientPhone: clients.phone,
      totalBalance: balanceSql,
      chargeCount: countSql,
    })
    .from(charges)
    .innerJoin(clients, eq(charges.clientId, clients.id))
    .where(whereConditions)
    .groupBy(charges.clientId, clients.name, clients.phone)
    .having(sql`SUM(${charges.amount}::numeric - ${charges.paidAmount}::numeric) > 0`);

  // Count total debtors for pagination
  const countQuery = db
    .select({ count: sql<number>`count(*)` })
    .from(
      db
        .select({ clientId: charges.clientId })
        .from(charges)
        .innerJoin(clients, eq(charges.clientId, clients.id))
        .where(whereConditions)
        .groupBy(charges.clientId, clients.name, clients.phone)
        .having(sql`SUM(${charges.amount}::numeric - ${charges.paidAmount}::numeric) > 0`)
        .as("debtors")
    );

  const [data, countResult] = await Promise.all([
    baseQuery
      .orderBy(sql`SUM(${charges.amount}::numeric - ${charges.paidAmount}::numeric) DESC`)
      .limit(limit)
      .offset(offset),
    countQuery,
  ]);

  const total = Number(countResult[0]?.count ?? 0);

  return {
    data: data.map((row) => ({
      clientId: row.clientId,
      clientName: row.clientName,
      clientPhone: row.clientPhone,
      totalBalance: Number(row.totalBalance),
      chargeCount: Number(row.chargeCount),
    })),
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}

/**
 * Returns paginated charges for a specific client.
 * Filter by status ('pending' | 'partial' | 'paid' | 'all').
 */
export async function getClientCharges(
  clientId: string,
  opts?: { page?: number; limit?: number; status?: string }
) {
  const page = opts?.page ?? 1;
  const limit = opts?.limit ?? 20;
  const offset = (page - 1) * limit;
  const status = opts?.status ?? "all";

  const conditions = [eq(charges.clientId, clientId)];
  if (status !== "all") {
    conditions.push(eq(charges.status, status));
  }

  const whereClause = and(...conditions);

  const [data, countResult] = await Promise.all([
    db
      .select({
        id: charges.id,
        sourceType: charges.sourceType,
        sourceId: charges.sourceId,
        description: charges.description,
        amount: charges.amount,
        paidAmount: charges.paidAmount,
        status: charges.status,
        createdAt: charges.createdAt,
      })
      .from(charges)
      .where(whereClause)
      .orderBy(desc(charges.createdAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)` })
      .from(charges)
      .where(whereClause),
  ]);

  const total = Number(countResult[0]?.count ?? 0);

  return {
    data,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}

/**
 * Returns a debt summary for a client: total balance + breakdown by sourceType.
 */
export async function getClientDebtSummary(
  clientId: string
): Promise<ClientDebtSummary> {
  const unpaidConditions = and(
    eq(charges.clientId, clientId),
    ne(charges.status, "paid")
  );

  const [totalResult, categoryResult] = await Promise.all([
    db
      .select({
        totalBalance: sql<number>`COALESCE(SUM(${charges.amount}::numeric - ${charges.paidAmount}::numeric), 0)`,
      })
      .from(charges)
      .where(unpaidConditions),
    db
      .select({
        sourceType: charges.sourceType,
        total: sql<number>`SUM(${charges.amount}::numeric - ${charges.paidAmount}::numeric)`,
      })
      .from(charges)
      .where(unpaidConditions)
      .groupBy(charges.sourceType)
      .having(sql`SUM(${charges.amount}::numeric - ${charges.paidAmount}::numeric) > 0`),
  ]);

  return {
    totalBalance: Number(totalResult[0]?.totalBalance ?? 0),
    byCategory: categoryResult.map((row) => ({
      sourceType: row.sourceType,
      total: Number(row.total),
    })),
  };
}

// ── Mutations ───────────────────────────────────────────────────────────────

/**
 * Creates a new charge manually. Admin/owner only.
 */
export async function createCharge(formData: FormData) {
  if (!(await isAdminLevel())) {
    return { error: "No autorizado." };
  }

  const raw = {
    clientId: (formData.get("clientId") as string)?.trim() ?? "",
    sourceType: (formData.get("sourceType") as string)?.trim() ?? "",
    sourceId: (formData.get("sourceId") as string)?.trim() || undefined,
    description: (formData.get("description") as string)?.trim() ?? "",
    amount: formData.get("amount") as string,
  };

  const parsed = createChargeSchema.safeParse(raw);
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const staffId = await getSessionStaffId();
  if (!staffId) {
    return { error: "No se pudo identificar al usuario." };
  }

  try {
    await db.insert(charges).values({
      id: genChargeId(),
      clientId: parsed.data.clientId,
      sourceType: parsed.data.sourceType,
      sourceId: parsed.data.sourceId ?? null,
      description: parsed.data.description,
      amount: String(parsed.data.amount),
      paidAmount: "0",
      status: "pending",
      createdById: staffId,
    });
  } catch (err) {
    Sentry.captureException(err);
    return { error: "Ocurri\u00f3 un error al crear el cargo." };
  }

  revalidatePath("/dashboard/deudores");
  return { success: true };
}

/**
 * Records a payment against a charge. Admin/owner only.
 * Updates paidAmount and status accordingly.
 */
export async function recordPayment(chargeId: string, formData: FormData) {
  if (!(await isAdminLevel())) {
    return { error: "No autorizado." };
  }

  const raw = {
    paymentAmount: formData.get("paymentAmount") as string,
  };

  const parsed = recordPaymentSchema.safeParse(raw);
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  // Fetch the current charge
  const [charge] = await db
    .select({
      amount: charges.amount,
      paidAmount: charges.paidAmount,
      status: charges.status,
    })
    .from(charges)
    .where(eq(charges.id, chargeId))
    .limit(1);

  if (!charge) {
    return { error: "El cargo no existe." };
  }

  if (charge.status === "paid") {
    return { error: "Este cargo ya est\u00e1 completamente pagado." };
  }

  const remaining = Number(charge.amount) - Number(charge.paidAmount);
  if (parsed.data.paymentAmount > remaining) {
    return {
      error: `El monto excede el saldo pendiente ($${remaining.toFixed(2)}).`,
    };
  }

  const newPaidAmount = Number(charge.paidAmount) + parsed.data.paymentAmount;
  const fullyPaid = newPaidAmount >= Number(charge.amount);

  try {
    await db
      .update(charges)
      .set({
        paidAmount: String(newPaidAmount),
        status: fullyPaid ? "paid" : "partial",
        paidAt: fullyPaid ? new Date() : null,
        updatedAt: new Date(),
      })
      .where(eq(charges.id, chargeId));
  } catch (err) {
    Sentry.captureException(err);
    return { error: "Ocurri\u00f3 un error al registrar el pago." };
  }

  revalidatePath("/dashboard/deudores");
  return { success: true };
}

/**
 * Deletes a pending charge. Admin only.
 * Cannot delete partially or fully paid charges.
 */
export async function deleteCharge(id: string) {
  if (!(await hasRole("admin"))) {
    return { error: "Solo administradores pueden eliminar cargos." };
  }

  // Verify the charge exists and is pending
  const [charge] = await db
    .select({ status: charges.status })
    .from(charges)
    .where(eq(charges.id, id))
    .limit(1);

  if (!charge) {
    return { error: "El cargo no existe." };
  }

  if (charge.status !== "pending") {
    return {
      error: "Solo se pueden eliminar cargos pendientes (sin pagos registrados).",
    };
  }

  try {
    await db.delete(charges).where(eq(charges.id, id));
  } catch (err) {
    Sentry.captureException(err);
    return { error: "Ocurri\u00f3 un error al eliminar el cargo." };
  }

  revalidatePath("/dashboard/deudores");
  return { success: true };
}

// ── Utility (non-form) ─────────────────────────────────────────────────────

