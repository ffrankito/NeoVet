import type { User } from "@supabase/supabase-js";
import type { StaffRole } from "@/db/schema";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { staff } from "@/db/schema";
import { eq } from "drizzle-orm";

const VALID_ROLES: readonly StaffRole[] = [
  "admin",
  "owner",
  "vet",
  "groomer",
] as const;

/**
 * Extracts a validated StaffRole from a Supabase user's JWT app_metadata.
 * Returns null if: no user, user is `disabled`, role is missing, or role
 * is not a known StaffRole.
 *
 * Use this directly in API route handlers that already called
 * `supabase.auth.getUser()` to avoid a second auth round-trip.
 */
export function roleFromUser(user: User | null): StaffRole | null {
  if (!user) return null;
  const meta = user.app_metadata ?? {};
  if (meta.disabled === true) return null;
  const role = meta.role;
  if (typeof role !== "string") return null;
  if (!VALID_ROLES.includes(role as StaffRole)) return null;
  return role as StaffRole;
}

/**
 * Resolves the current user's role by re-verifying the Supabase JWT and
 * reading `app_metadata.role` directly. Does not trust the `x-user-role`
 * request header (which is forgeable by any client).
 *
 * Only valid in server components and server actions.
 */
export async function getRole(): Promise<StaffRole | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return roleFromUser(user);
}

/**
 * Returns true if the current user has one of the given roles.
 */
export async function hasRole(...roles: StaffRole[]): Promise<boolean> {
  const role = await getRole();
  return role !== null && roles.includes(role);
}

/**
 * Returns true if the current user has admin-level permissions (admin or owner).
 */
export async function isAdminLevel(): Promise<boolean> {
  return hasRole("admin", "owner");
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
