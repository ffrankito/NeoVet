"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { stockEntries, products, providers } from "@/db/schema";
import { stockEntryId } from "@/lib/ids";
import { eq, sql, desc } from "drizzle-orm";
import { z } from "zod";
import { getSessionStaffId } from "@/lib/auth";

const stockEntrySchema = z.object({
  productId: z.string().min(1, "Seleccioná un producto."),
  providerId: z.string().optional().or(z.literal("")),
  quantity: z.coerce.number().positive("La cantidad debe ser mayor a 0."),
  costPrice: z.coerce.number().min(0, "El precio debe ser mayor o igual a 0.").optional(),
  notes: z.string().optional().or(z.literal("")),
});

export async function getStockEntries(opts?: {
  page?: number;
  limit?: number;
  productId?: string;
}) {
  const page = opts?.page ?? 1;
  const limit = opts?.limit ?? 20;
  const offset = (page - 1) * limit;

  const where = opts?.productId
    ? eq(stockEntries.productId, opts.productId)
    : undefined;

  const [data, countResult] = await Promise.all([
    db
      .select({
        id: stockEntries.id,
        quantity: stockEntries.quantity,
        costPrice: stockEntries.costPrice,
        notes: stockEntries.notes,
        createdAt: stockEntries.createdAt,
        productId: stockEntries.productId,
        productName: products.name,
        providerId: stockEntries.providerId,
        providerName: providers.name,
      })
      .from(stockEntries)
      .innerJoin(products, eq(stockEntries.productId, products.id))
      .leftJoin(providers, eq(stockEntries.providerId, providers.id))
      .where(where)
      .orderBy(desc(stockEntries.createdAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)` })
      .from(stockEntries)
      .where(where),
  ]);

  return {
    data,
    total: Number(countResult[0].count),
    page,
    limit,
    totalPages: Math.ceil(Number(countResult[0].count) / limit),
  };
}

export async function getActiveProducts() {
  return db
    .select({ id: products.id, name: products.name })
    .from(products)
    .where(eq(products.isActive, true))
    .orderBy(products.name);
}

export async function getActiveProviders() {
  return db
    .select({ id: providers.id, name: providers.name })
    .from(providers)
    .where(eq(providers.isActive, true))
    .orderBy(providers.name);
}

export async function createStockEntry(formData: FormData) {
  const raw = {
    productId: (formData.get("productId") as string) ?? "",
    providerId: (formData.get("providerId") as string) ?? "",
    quantity: formData.get("quantity") as string,
    costPrice: (formData.get("costPrice") as string) || undefined,
    notes: (formData.get("notes") as string)?.trim() ?? "",
  };

  const parsed = stockEntrySchema.safeParse(raw);
  if (!parsed.success) {
    const fe = parsed.error.flatten().fieldErrors;
    return {
      errors: {
        productId: fe.productId?.[0],
        quantity: fe.quantity?.[0],
        costPrice: fe.costPrice?.[0],
      },
    };
  }

  const staffId = await getSessionStaffId();
  if (!staffId) {
    return { error: "No se pudo identificar al usuario." };
  }

  try {
    const id = stockEntryId();
    const costPriceStr = parsed.data.costPrice != null ? String(parsed.data.costPrice) : null;

    await db.insert(stockEntries).values({
      id,
      productId: parsed.data.productId,
      providerId: parsed.data.providerId || null,
      quantity: String(parsed.data.quantity),
      costPrice: costPriceStr,
      notes: parsed.data.notes || null,
      createdById: staffId,
    });

    // Update product stock and cost price
    await db
      .update(products)
      .set({
        currentStock: sql`${products.currentStock}::numeric + ${parsed.data.quantity}`,
        ...(costPriceStr ? { costPrice: costPriceStr } : {}),
        updatedAt: new Date(),
      })
      .where(eq(products.id, parsed.data.productId));
  } catch {
    return { error: "Ocurrió un error inesperado. Intenta de nuevo." };
  }

  revalidatePath("/dashboard/petshop/stock-entries");
  revalidatePath("/dashboard/petshop/products");
  redirect("/dashboard/petshop/stock-entries");
}
