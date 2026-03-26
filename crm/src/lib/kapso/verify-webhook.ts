import { createHmac, timingSafeEqual } from "crypto";

/**
 * Verifies the HMAC-SHA256 signature sent by Kapso on every webhook request.
 *
 * Kapso signs the raw request body with KAPSO_WEBHOOK_SECRET and sends the
 * result as the "x-kapso-signature" header. We recompute the same HMAC on
 * our end and compare — if they don't match, the request is not from Kapso.
 *
 * timingSafeEqual is used to prevent timing attacks (an attacker guessing the
 * secret one byte at a time by measuring response time).
 */
export function verifyKapsoWebhook(
  rawBody: string,
  signatureHeader: string | null
): boolean {
  if (!signatureHeader) return false;

  const secret = process.env.KAPSO_WEBHOOK_SECRET;
  if (!secret) {
    console.error("[kapso] KAPSO_WEBHOOK_SECRET is not set");
    return false;
  }

  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");

  // Signatures may be prefixed with "sha256=" — strip it if present
  const received = signatureHeader.replace(/^sha256=/, "");

  try {
    return timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(received, "hex"));
  } catch {
    // Buffer lengths don't match → invalid signature
    return false;
  }
}
