import { type NextRequest } from "next/server";
import type { StaffRole } from "@/db/schema";

/**
 * Reads the role that the middleware attached to the request as the
 * `x-user-role` header. Returns null if the header is absent or holds an
 * unexpected value.
 */
export function getRole(request: NextRequest): StaffRole | null {
  const role = request.headers.get("x-user-role");
  const valid: StaffRole[] = ["admin", "owner", "vet", "groomer"];
  if (valid.includes(role as StaffRole)) return role as StaffRole;
  return null;
}
