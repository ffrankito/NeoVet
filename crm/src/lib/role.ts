import { type NextRequest } from "next/server";

export type UserRole = "admin" | "receptionist";

/**
 * Reads the role that the middleware attached to the request as the
 * `x-user-role` header. Returns null if the header is absent or holds an
 * unexpected value (which should not happen in a properly seeded system, but
 * is handled defensively here).
 *
 * Use this in server components and server actions — never in client
 * components (headers are not accessible there).
 */
export function getRole(request: NextRequest): UserRole | null {
  const role = request.headers.get("x-user-role");
  if (role === "admin" || role === "receptionist") return role;
  return null;
}
