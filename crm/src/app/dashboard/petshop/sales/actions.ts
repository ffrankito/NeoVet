"use server";

import { revalidatePath } from "next/cache";
import * as Sentry from "@sentry/nextjs";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { sales, saleItems, products } from "@/db/schema";
import { saleId, saleItemId } from "@/lib/ids";
import { eq, sql, desc } from "drizzle-orm";
import { z } from "zod";
import { getSessionStaffId, isAdminLevel } from "@/lib/auth";
import { createChargeForSource } from "@/lib/charges/create";
import { patients } from "@/db/schema";

const saleItemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.coerce.number().positive(),
  unitPrice: z.coerce.number().min(0),
  taxRate: z.coerce.number(),
});

const saleSchema = z.object({
  patientId: z.string().optional().or(z.literal("")),
  paymentMethod: z.enum(["efectivo", "transferencia", "tarjeta_debito", "tarjeta_credito", "mercadopago"], {
    message: "Seleccioná un método de pago.",
  }),
  notes: z.string().optional().or(z.literal("")),
  items: z.array(saleItemSchema).min(1, "Agregá al menos un producto."),
});

export async function getSales(opts?: {
  page?: number;
  limit?: number;
}) {
  const page = opts?.page ?? 1;
  const limit = opts?.limit ?? 20;
  const offset = (page - 1) * limit;

  const [data, countResult] = await Promise.all([
    db
      .select({
        id: sales.id,
        paymentMethod: sales.paymentMethod,
        notes: sales.notes,
        createdAt: sales.createdAt,
        itemCount: sql<number>`(SELECT COUNT(*) FROM sale_items WHERE sale_items.sale_id = sales.id)`,
        total: sql<number>`(
          SELECT COALESCE(SUM(
            sale_items.unit_price::numeric * sale_items.quantity::numeric *
            (1 + sale_items.tax_rate::numeric / 100)
          ), 0)
          FROM sale_items WHERE sale_items.sale_id = sales.id
        )`,
      })
      .from(sales)
      .orderBy(desc(sales.createdAt))
      .limit(limit)
      .offset(offset),
    db.select({ count: sql<number>`count(*)` }).from(sales),
  ]);

  return {
    data,
    total: Number(countResult[0].count),
    page,
    limit,
    totalPages: Math.ceil(Number(countResult[0].count) / limit),
  };
}

export async function getSale(id: string) {
  const [sale] = await db
    .select()
    .from(sales)
    .where(eq(sales.id, id))
    .limit(1);

  if (!sale) return null;

  const items = await db
    .select({
      id: saleItems.id,
      productId: saleItems.productId,
      productName: products.name,
      quantity: saleItems.quantity,
      unitPrice: saleItems.unitPrice,
      taxRate: saleItems.taxRate,
    })
    .from(saleItems)
    .innerJoin(products, eq(saleItems.productId, products.id))
    .where(eq(saleItems.saleId, id));

  return { ...sale, items };
}

export async function getActiveProductsForSale() {
  return db
    .select({
      id: products.id,
      name: products.name,
      sellPrice: products.sellPrice,
      taxRate: products.taxRate,
      currentStock: products.currentStock,
    })
    .from(products)
    .where(eq(products.isActive, true))
    .orderBy(products.name);
}

export async function createSale(data: {
  patientId?: string;
  paymentMethod: string;
  notes?: string;
  items: { productId: string; quantity: number; unitPrice: number; taxRate: number }[];
}) {
  if (!(await isAdminLevel())) return { error: "No autorizado." };

  const parsed = saleSchema.safeParse(data);
  if (!parsed.success) {
    const fe = parsed.error.flatten();
    return { error: fe.fieldErrors.items?.[0] ?? fe.fieldErrors.paymentMethod?.[0] ?? "Datos inválidos." };
  }

  const staffId = await getSessionStaffId();
  if (!staffId) {
    return { error: "No se pudo identificar al usuario." };
  }

  let id: string;
  try {
    id = saleId();

    // Atomic: sale row + sale_items rows + stock decrements all-or-nothing.
    // Without a transaction, a mid-loop crash leaves stock decremented for
    // items that lost their sale_items row.
    await db.transaction(async (tx) => {
      await tx.insert(sales).values({
        id,
        patientId: parsed.data.patientId || null,
        soldById: staffId,
        createdById: staffId,
        paymentMethod: parsed.data.paymentMethod,
        notes: parsed.data.notes || null,
      });

      for (const item of parsed.data.items) {
        await tx.insert(saleItems).values({
          id: saleItemId(),
          saleId: id,
          productId: item.productId,
          quantity: String(item.quantity),
          unitPrice: String(item.unitPrice),
          taxRate: item.taxRate,
        });

        await tx
          .update(products)
          .set({
            currentStock: sql`${products.currentStock}::numeric - ${item.quantity}`,
            updatedAt: new Date(),
          })
          .where(eq(products.id, item.productId));
      }
    });
  } catch (err) {
    Sentry.captureException(err);
    return { error: "Ocurrió un error inesperado. Intenta de nuevo." };
  }

  // Auto-create charge if sale is linked to a patient (has a client)
  try {
    const saleTotal = parsed.data.items.reduce(
      (sum, item) => sum + item.unitPrice * item.quantity * (1 + item.taxRate / 100),
      0
    );

    if (saleTotal > 0 && parsed.data.patientId) {
      const [pat] = await db
        .select({ clientId: patients.clientId, name: patients.name })
        .from(patients)
        .where(eq(patients.id, parsed.data.patientId))
        .limit(1);

      if (pat?.clientId) {
        await createChargeForSource(
          "sale",
          id,
          pat.clientId,
          `Venta pet shop — ${pat.name}`,
          Math.round(saleTotal * 100) / 100,
          staffId
        );
      }
    }
  } catch (err) {
    // Charge creation failure should not block the sale
    Sentry.captureException(err);
  }

  revalidatePath("/dashboard/petshop/sales");
  revalidatePath("/dashboard/petshop/products");
  revalidatePath("/dashboard/deudores");
  redirect(`/dashboard/petshop/sales/${id}`);
}
