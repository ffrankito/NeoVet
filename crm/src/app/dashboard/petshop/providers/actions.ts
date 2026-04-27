"use server";

import { revalidatePath } from "next/cache";
import * as Sentry from "@sentry/nextjs";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { providers } from "@/db/schema";
import { providerId } from "@/lib/ids";
import { eq, ilike, or, sql, desc } from "drizzle-orm";
import { z } from "zod";
import { isAdminLevel } from "@/lib/auth";

const providerSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio."),
  phone: z.string().optional().or(z.literal("")),
  email: z.string().email("El email no es válido.").optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
  cuit: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
});

export async function getProviders(opts?: {
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
    conditions.push(eq(providers.isActive, true));
  }
  if (opts?.search) {
    conditions.push(
      or(
        ilike(providers.name, `%${opts.search}%`),
        ilike(providers.phone, `%${opts.search}%`),
        ilike(providers.email, `%${opts.search}%`),
        ilike(providers.cuit, `%${opts.search}%`)
      )
    );
  }

  const where = conditions.length > 0
    ? conditions.reduce((a, b) => sql`${a} AND ${b}`)
    : undefined;

  const [data, countResult] = await Promise.all([
    db.select().from(providers).where(where).orderBy(desc(providers.createdAt)).limit(limit).offset(offset),
    db.select({ count: sql<number>`count(*)` }).from(providers).where(where),
  ]);

  return {
    data,
    total: Number(countResult[0].count),
    page,
    limit,
    totalPages: Math.ceil(Number(countResult[0].count) / limit),
  };
}

export async function getProvider(id: string) {
  const [provider] = await db
    .select()
    .from(providers)
    .where(eq(providers.id, id))
    .limit(1);

  return provider ?? null;
}

export async function createProvider(formData: FormData) {
  if (!(await isAdminLevel())) return { error: "No autorizado." };

  const raw = {
    name: (formData.get("name") as string)?.trim() ?? "",
    phone: (formData.get("phone") as string)?.trim() ?? "",
    email: (formData.get("email") as string)?.trim() ?? "",
    address: (formData.get("address") as string)?.trim() ?? "",
    cuit: (formData.get("cuit") as string)?.trim() ?? "",
    notes: (formData.get("notes") as string)?.trim() ?? "",
  };

  const parsed = providerSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors;
    return {
      errors: {
        name: fieldErrors.name?.[0],
        email: fieldErrors.email?.[0],
      },
    };
  }

  let id: string;
  try {
    id = providerId();
    await db.insert(providers).values({
      id,
      name: parsed.data.name,
      phone: parsed.data.phone || null,
      email: parsed.data.email || null,
      address: parsed.data.address || null,
      cuit: parsed.data.cuit || null,
      notes: parsed.data.notes || null,
    });
  } catch (err) {
    Sentry.captureException(err);
    return { error: "Ocurrió un error inesperado. Intenta de nuevo." };
  }

  revalidatePath("/dashboard/petshop/providers");
  redirect(`/dashboard/petshop/providers/${id}`);
}

export async function updateProvider(id: string, formData: FormData) {
  if (!(await isAdminLevel())) return { error: "No autorizado." };

  const raw = {
    name: (formData.get("name") as string)?.trim() ?? "",
    phone: (formData.get("phone") as string)?.trim() ?? "",
    email: (formData.get("email") as string)?.trim() ?? "",
    address: (formData.get("address") as string)?.trim() ?? "",
    cuit: (formData.get("cuit") as string)?.trim() ?? "",
    notes: (formData.get("notes") as string)?.trim() ?? "",
  };

  const parsed = providerSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors;
    return {
      errors: {
        name: fieldErrors.name?.[0],
        email: fieldErrors.email?.[0],
      },
    };
  }

  try {
    await db
      .update(providers)
      .set({
        name: parsed.data.name,
        phone: parsed.data.phone || null,
        email: parsed.data.email || null,
        address: parsed.data.address || null,
        cuit: parsed.data.cuit || null,
        notes: parsed.data.notes || null,
        updatedAt: new Date(),
      })
      .where(eq(providers.id, id));
  } catch (err) {
    Sentry.captureException(err);
    return { error: "Ocurrió un error inesperado. Intenta de nuevo." };
  }

  revalidatePath("/dashboard/petshop/providers");
  redirect(`/dashboard/petshop/providers/${id}`);
}

export async function deactivateProvider(id: string) {
  if (!(await isAdminLevel())) return { error: "No autorizado." };

  await db
    .update(providers)
    .set({ isActive: false, updatedAt: new Date() })
    .where(eq(providers.id, id));

  revalidatePath("/dashboard/petshop/providers");
  redirect("/dashboard/petshop/providers");
}
