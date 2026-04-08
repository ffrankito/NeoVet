"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { staff } from "@/db/schema";
import { staffId as generateStaffId } from "@/lib/ids";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdminLevel } from "@/lib/auth";

const createStaffSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio."),
  email: z.string().email("El email no es válido."),
  role: z.enum(["admin", "owner", "vet", "groomer"], { message: "El rol es inválido." }),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres."),
});

const updateStaffSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio."),
  role: z.enum(["admin", "owner", "vet", "groomer"], { message: "El rol es inválido." }),
});

export async function getAllStaff() {
  return db.select().from(staff).orderBy(staff.name);
}

export async function createStaffMember(formData: FormData) {
  if (!(await isAdminLevel())) return { error: "No autorizado." };

  const raw = {
    name: (formData.get("name") as string)?.trim() ?? "",
    email: (formData.get("email") as string)?.trim() ?? "",
    role: (formData.get("role") as string) ?? "",
    password: (formData.get("password") as string) ?? "",
  };

  const parsed = createStaffSchema.safeParse(raw);
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const supabaseAdmin = createAdminClient();

  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: parsed.data.email,
    password: parsed.data.password,
    app_metadata: { role: parsed.data.role },
    email_confirm: true,
  });

  if (authError || !authData.user) {
    return { error: authError?.message ?? "Error al crear el usuario." };
  }

  try {
    await db.insert(staff).values({
      id: generateStaffId(),
      userId: authData.user.id,
      email: parsed.data.email,
      name: parsed.data.name,
      role: parsed.data.role,
      isActive: true,
    });
  } catch {
    await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
    return { error: "Error al guardar el miembro del equipo." };
  }

  revalidatePath("/dashboard/settings/staff");
  return { success: true };
}

export async function updateStaffMember(id: string, formData: FormData) {
  if (!(await isAdminLevel())) return { error: "No autorizado." };

  const raw = {
    name: (formData.get("name") as string)?.trim() ?? "",
    role: (formData.get("role") as string) ?? "",
  };

  const parsed = updateStaffSchema.safeParse(raw);
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const [existing] = await db.select({ userId: staff.userId }).from(staff).where(eq(staff.id, id)).limit(1);
  if (!existing) return { error: "Miembro no encontrado." };

  const supabaseAdmin = createAdminClient();
  await supabaseAdmin.auth.admin.updateUserById(existing.userId, {
    app_metadata: { role: parsed.data.role },
  });

  await db
    .update(staff)
    .set({ name: parsed.data.name, role: parsed.data.role, updatedAt: new Date() })
    .where(eq(staff.id, id));

  revalidatePath("/dashboard/settings/staff");
  return { success: true };
}

export async function deactivateStaffMember(id: string) {
  if (!(await isAdminLevel())) return { error: "No autorizado." };

  const [existing] = await db.select({ userId: staff.userId }).from(staff).where(eq(staff.id, id)).limit(1);
  if (!existing) return { error: "Miembro no encontrado." };

  const supabaseAdmin = createAdminClient();
  await supabaseAdmin.auth.admin.updateUserById(existing.userId, {
    app_metadata: { disabled: true },
  });

  await db.update(staff).set({ isActive: false, updatedAt: new Date() }).where(eq(staff.id, id));
  revalidatePath("/dashboard/settings/staff");
  return { success: true };
}

export async function reactivateStaffMember(id: string) {
  if (!(await isAdminLevel())) return { error: "No autorizado." };

  const [existing] = await db.select({ userId: staff.userId }).from(staff).where(eq(staff.id, id)).limit(1);
  if (!existing) return { error: "Miembro no encontrado." };

  const supabaseAdmin = createAdminClient();
  await supabaseAdmin.auth.admin.updateUserById(existing.userId, {
    app_metadata: { disabled: false },
  });

  await db.update(staff).set({ isActive: true, updatedAt: new Date() }).where(eq(staff.id, id));
  revalidatePath("/dashboard/settings/staff");
  return { success: true };
}
