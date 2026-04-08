"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { cashSessions, cashMovements, sales, saleItems, staff } from "@/db/schema";
import { cashSessionId, cashMovementId } from "@/lib/ids";
import { eq, sql, desc, and, gte, lte, isNull } from "drizzle-orm";
import { z } from "zod";
import { getSessionStaffId, isAdminLevel } from "@/lib/auth";

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export async function getCashSessions(opts?: { page?: number; limit?: number }) {
  const page = opts?.page ?? 1;
  const limit = opts?.limit ?? 20;
  const offset = (page - 1) * limit;

  const [data, countResult] = await Promise.all([
    db
      .select({
        id: cashSessions.id,
        name: cashSessions.name,
        openedAt: cashSessions.openedAt,
        closedAt: cashSessions.closedAt,
        initialAmount: cashSessions.initialAmount,
        closingAmount: cashSessions.closingAmount,
        openedById: cashSessions.openedById,
        staffName: staff.name,
      })
      .from(cashSessions)
      .innerJoin(staff, eq(cashSessions.openedById, staff.id))
      .orderBy(desc(cashSessions.openedAt))
      .limit(limit)
      .offset(offset),
    db.select({ count: sql<number>`count(*)` }).from(cashSessions),
  ]);

  return {
    data,
    total: Number(countResult[0].count),
    page,
    limit,
    totalPages: Math.ceil(Number(countResult[0].count) / limit),
  };
}

export async function getCashSession(id: string) {
  const [session] = await db
    .select()
    .from(cashSessions)
    .where(eq(cashSessions.id, id))
    .limit(1);

  if (!session) return null;

  const movements = await db
    .select()
    .from(cashMovements)
    .where(eq(cashMovements.sessionId, id))
    .orderBy(desc(cashMovements.createdAt));

  // Sales during this session period
  const salesFilter = session.closedAt
    ? and(
        gte(sales.createdAt, session.openedAt),
        lte(sales.createdAt, session.closedAt)
      )
    : gte(sales.createdAt, session.openedAt);

  const sessionSales = await db
    .select({
      id: sales.id,
      paymentMethod: sales.paymentMethod,
      createdAt: sales.createdAt,
      total: sql<number>`(
        SELECT COALESCE(SUM(
          sale_items.unit_price::numeric * sale_items.quantity::numeric *
          (1 + sale_items.tax_rate::numeric / 100)
        ), 0)
        FROM sale_items WHERE sale_items.sale_id = sales.id
      )`,
    })
    .from(sales)
    .where(salesFilter)
    .orderBy(desc(sales.createdAt));

  return { ...session, movements, sales: sessionSales };
}

export async function getOpenSession() {
  const [session] = await db
    .select({ id: cashSessions.id })
    .from(cashSessions)
    .where(isNull(cashSessions.closedAt))
    .limit(1);

  return session ?? null;
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

const openSchema = z.object({
  initialAmount: z.coerce.number().min(0, "El monto debe ser mayor o igual a 0."),
  name: z.string().optional().or(z.literal("")),
});

export async function openCashSession(formData: FormData) {
  if (!(await isAdminLevel())) return { error: "No autorizado." };

  const raw = {
    initialAmount: formData.get("initialAmount") as string,
    name: (formData.get("name") as string)?.trim() ?? "",
  };

  const parsed = openSchema.safeParse(raw);
  if (!parsed.success) {
    const fe = parsed.error.flatten().fieldErrors;
    return { errors: { initialAmount: fe.initialAmount?.[0] } };
  }

  const staffId = await getSessionStaffId();
  if (!staffId) return { error: "No se pudo identificar al usuario." };

  // Check no open session exists
  const existing = await getOpenSession();
  if (existing) return { error: "Ya hay una caja abierta. Cerrala antes de abrir una nueva." };

  let id: string;
  try {
    id = cashSessionId();
    await db.insert(cashSessions).values({
      id,
      name: parsed.data.name || null,
      openedById: staffId,
      initialAmount: String(parsed.data.initialAmount),
    });
  } catch {
    return { error: "Ocurrió un error inesperado." };
  }

  revalidatePath("/dashboard/cash");
  redirect(`/dashboard/cash/${id}`);
}

const closeSchema = z.object({
  closingAmount: z.coerce.number().min(0, "El monto debe ser mayor o igual a 0."),
  notes: z.string().optional().or(z.literal("")),
});

export async function closeCashSession(id: string, formData: FormData) {
  if (!(await isAdminLevel())) return { error: "No autorizado." };

  const raw = {
    closingAmount: formData.get("closingAmount") as string,
    notes: (formData.get("notes") as string)?.trim() ?? "",
  };

  const parsed = closeSchema.safeParse(raw);
  if (!parsed.success) {
    const fe = parsed.error.flatten().fieldErrors;
    return { errors: { closingAmount: fe.closingAmount?.[0] } };
  }

  try {
    await db
      .update(cashSessions)
      .set({
        closedAt: new Date(),
        closingAmount: String(parsed.data.closingAmount),
        notes: parsed.data.notes || null,
      })
      .where(eq(cashSessions.id, id));
  } catch {
    return { error: "Ocurrió un error inesperado." };
  }

  revalidatePath("/dashboard/cash");
  redirect(`/dashboard/cash/${id}`);
}

const movementSchema = z.object({
  type: z.enum(["ingreso", "egreso"]),
  amount: z.coerce.number().positive("El monto debe ser mayor a 0."),
  paymentMethod: z.string().min(1, "Seleccioná un método de pago."),
  description: z.string().min(1, "La descripción es obligatoria."),
});

export async function addCashMovement(sessionId: string, formData: FormData) {
  if (!(await isAdminLevel())) return { error: "No autorizado." };

  const raw = {
    type: formData.get("type") as string,
    amount: formData.get("amount") as string,
    paymentMethod: formData.get("paymentMethod") as string,
    description: (formData.get("description") as string)?.trim() ?? "",
  };

  const parsed = movementSchema.safeParse(raw);
  if (!parsed.success) {
    const fe = parsed.error.flatten().fieldErrors;
    return {
      errors: {
        amount: fe.amount?.[0],
        description: fe.description?.[0],
        paymentMethod: fe.paymentMethod?.[0],
      },
    };
  }

  const staffId = await getSessionStaffId();
  if (!staffId) return { error: "No se pudo identificar al usuario." };

  try {
    await db.insert(cashMovements).values({
      id: cashMovementId(),
      sessionId,
      type: parsed.data.type,
      amount: String(parsed.data.amount),
      paymentMethod: parsed.data.paymentMethod,
      description: parsed.data.description,
      createdById: staffId,
    });
  } catch {
    return { error: "Ocurrió un error inesperado." };
  }

  revalidatePath(`/dashboard/cash/${sessionId}`);
  redirect(`/dashboard/cash/${sessionId}`);
}
