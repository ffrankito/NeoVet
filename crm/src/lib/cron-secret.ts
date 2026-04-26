import { type NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";

/**
 * Validates the `Authorization: Bearer <token>` header against `CRON_SECRET`.
 *
 * Returns `null` if authorized — caller proceeds.
 * Returns a `NextResponse` if not authorized — caller should `return guard`.
 *
 * Fails closed: if `CRON_SECRET` is unset (env var missing in Vercel),
 * returns 500 instead of accepting the request. This prevents the
 * `undefined === undefined → true` bypass that the original
 * `secret !== process.env.CRON_SECRET` pattern produced.
 *
 * Comparison uses `timingSafeEqual` to avoid leaking the secret length
 * through timing — overkill for a long random token, but cheap.
 *
 * Used by `/api/cron/*` (Vercel Cron) and `/api/admin/seed-*` (one-shot
 * admin seeding). Both surfaces share the same secret today; if/when they
 * split, swap the env-var name per call site.
 */
export function assertCronSecret(req: NextRequest): NextResponse | null {
  const expected = process.env.CRON_SECRET;
  if (!expected) {
    return NextResponse.json(
      { error: "Server misconfigured: CRON_SECRET not set" },
      { status: 500 },
    );
  }

  const provided = req.headers.get("authorization")?.replace("Bearer ", "") ?? "";
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  return null;
}
