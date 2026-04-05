/**
 * Simple in-memory rate limiter for Vercel serverless.
 *
 * On cold starts the map resets — this is acceptable for basic abuse prevention.
 * For production-grade limiting, use Upstash Redis or Vercel KV.
 */

const windowMs = 60_000; // 1 minute
const maxRequests = 20; // per window per IP

const hits = new Map<string, { count: number; resetAt: number }>();

export function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = hits.get(ip);

  if (!entry || now > entry.resetAt) {
    hits.set(ip, { count: 1, resetAt: now + windowMs });
    return false;
  }

  entry.count++;
  return entry.count > maxRequests;
}

// Periodic cleanup to avoid memory leak on long-lived instances
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of hits) {
    if (now > entry.resetAt) hits.delete(ip);
  }
}, 60_000);
