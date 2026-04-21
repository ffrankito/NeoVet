import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// Routes each role is blocked from accessing (prefix match)
const ROLE_BLOCKS: Record<string, string[]> = {
  vet: [
    "/dashboard/settings",
    "/dashboard/billing",
    "/dashboard/grooming",
    "/dashboard/deudores",
    "/dashboard/petshop",
    "/dashboard/cash",
  ],
  groomer: [
    "/dashboard/settings",
    "/dashboard/billing",
    "/dashboard/clients",
    "/dashboard/patients",
    "/dashboard/consultations",
    "/dashboard/hospitalizations",
    "/dashboard/procedures",
    "/dashboard/consent-documents",
    "/dashboard/deudores",
    "/dashboard/petshop",
    "/dashboard/cash",
    "/dashboard/sala-de-espera",
  ],
};

export async function proxy(request: NextRequest) {
  // Excluir rutas de cron y bot de la autenticación
  if (
    request.nextUrl.pathname.startsWith("/api/cron/") ||
    request.nextUrl.pathname.startsWith("/api/bot/") ||
    request.nextUrl.pathname.startsWith("/api/admin/")
  ) {
    return NextResponse.next();
  }
  const response = await updateSession(request);

  // updateSession returns a redirect for unauthenticated/no-role users — pass it through
  if (response.status !== 200) return response;

  const role = response.headers.get("x-user-role");
  const pathname = request.nextUrl.pathname;

  if (role && role !== "admin") {
    const blocked = ROLE_BLOCKS[role] ?? [];
    const isBlocked = blocked.some((prefix) => pathname.startsWith(prefix));
    if (isBlocked) {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!monitoring|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};