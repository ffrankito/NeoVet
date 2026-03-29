import { headers } from "next/headers";
import type { StaffRole } from "@/db/schema";

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
