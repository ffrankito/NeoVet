"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { products } from "@/db/schema";
import { productId } from "@/lib/ids";
import { eq, ilike, or, sql, desc } from "drizzle-orm";
import { z } from "zod";

const productSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio."),
  category: z.enum([
    "medicamento", "vacuna", "insumo_clinico", "higiene",
    "accesorio", "juguete", "alimento", "transporte", "otro",
  ], { message: "Categoría inválida." }),
  sellPrice: z.coerce.number().min(0, "El precio debe ser mayor o igual a 0."),
  taxRate: z.coerce.number().refine((v) => v === 0 || v === 21, {
    message: "El IVA debe ser 0% o 21%.",
  }),
  minStock: z.coerce.number().min(0, "El stock mínimo debe ser mayor o igual a 0."),
});

export async function getProducts(opts?: {
  search?: string;
  page?: number;
  limit?: number;
  includeInactive?: boolean;
}) {
  const page = opts?.page ?? 1;
  const limit = opts?.limit ?? 20;
  const offset = (page - 1) * limit;

  const conditions = [];
  if (!opts?.includeInactive) {
    conditions.push(eq(products.isActive, true));
  }
  if (opts?.search) {
    conditions.push(ilike(products.name, `%${opts.search}%`));
  }

  const where = conditions.length > 0
    ? conditions.reduce((a, b) => sql`${a} AND ${b}`)
    : undefined;

  const [data, countResult] = await Promise.all([
    db.select().from(products).where(where).orderBy(desc(products.createdAt)).limit(limit).offset(offset),
    db.select({ count: sql<number>`count(*)` }).from(products).where(where),
  ]);

  return {
    data,
    total: Number(countResult[0].count),
    page,
    limit,
    totalPages: Math.ceil(Number(countResult[0].count) / limit),
  };
}

export async function getProduct(id: string) {
  const [product] = await db
    .select()
    .from(products)
    .where(eq(products.id, id))
    .limit(1);

  return product ?? null;
}

export async function createProduct(formData: FormData) {
  const raw = {
    name: (formData.get("name") as string)?.trim() ?? "",
    category: (formData.get("category") as string) ?? "otro",
    sellPrice: formData.get("sellPrice") as string,
    taxRate: formData.get("taxRate") as string,
    minStock: formData.get("minStock") as string,
  };

  const parsed = productSchema.safeParse(raw);
  if (!parsed.success) {
    const fe = parsed.error.flatten().fieldErrors;
    return {
      errors: {
        name: fe.name?.[0],
        category: fe.category?.[0],
        sellPrice: fe.sellPrice?.[0],
        taxRate: fe.taxRate?.[0],
        minStock: fe.minStock?.[0],
      },
    };
  }

  let id: string;
  try {
    id = productId();
    await db.insert(products).values({
      id,
      name: parsed.data.name,
      category: parsed.data.category,
      sellPrice: String(parsed.data.sellPrice),
      taxRate: parsed.data.taxRate,
      minStock: String(parsed.data.minStock),
    });
  } catch {
    return { error: "Ocurrió un error inesperado. Intenta de nuevo." };
  }

  revalidatePath("/dashboard/petshop/products");
  redirect(`/dashboard/petshop/products/${id}`);
}

export async function updateProduct(id: string, formData: FormData) {
  const raw = {
    name: (formData.get("name") as string)?.trim() ?? "",
    category: (formData.get("category") as string) ?? "otro",
    sellPrice: formData.get("sellPrice") as string,
    taxRate: formData.get("taxRate") as string,
    minStock: formData.get("minStock") as string,
  };

  const parsed = productSchema.safeParse(raw);
  if (!parsed.success) {
    const fe = parsed.error.flatten().fieldErrors;
    return {
      errors: {
        name: fe.name?.[0],
        category: fe.category?.[0],
        sellPrice: fe.sellPrice?.[0],
        taxRate: fe.taxRate?.[0],
        minStock: fe.minStock?.[0],
      },
    };
  }

  try {
    await db
      .update(products)
      .set({
        name: parsed.data.name,
        category: parsed.data.category,
        sellPrice: String(parsed.data.sellPrice),
        taxRate: parsed.data.taxRate,
        minStock: String(parsed.data.minStock),
        updatedAt: new Date(),
      })
      .where(eq(products.id, id));
  } catch {
    return { error: "Ocurrió un error inesperado. Intenta de nuevo." };
  }

  revalidatePath("/dashboard/petshop/products");
  redirect(`/dashboard/petshop/products/${id}`);
}

export async function deactivateProduct(id: string) {
  await db
    .update(products)
    .set({ isActive: false, updatedAt: new Date() })
    .where(eq(products.id, id));

  revalidatePath("/dashboard/petshop/products");
  redirect("/dashboard/petshop/products");
}
