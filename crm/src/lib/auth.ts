import { headers } from "next/headers";
import type { StaffRole } from "@/db/schema";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { staff } from "@/db/schema";
import { eq } from "drizzle-orm";

/**
 * Reads the current user's role from the x-user-role header set by middleware.
 * Only valid in server components and server actions.
 */
export async function getRole(): Promise<StaffRole | null> {
  const headersList = await headers();
  const role = headersList.get("x-user-role");
  return (role as StaffRole) ?? null;
}

/**
 * Returns true if the current user has one of the given roles.
 */
export async function hasRole(...roles: StaffRole[]): Promise<boolean> {
  const role = await getRole();
  return role !== null && roles.includes(role);
}

/**
 * Resolves the staff ID for the currently authenticated user.
 * Returns null if the user is not authenticated or has no staff record.
 */
export async function getSessionStaffId(): Promise<string | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const [row] = await db
    .select({ id: staff.id })
    .from(staff)
    .where(eq(staff.userId, user.id))
    .limit(1);

  return row?.id ?? null;
}
