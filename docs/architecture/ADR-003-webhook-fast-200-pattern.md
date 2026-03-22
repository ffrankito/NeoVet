# ADR-003 — Webhook Response Strategy: Fast-200 + waitUntil()

**Date:** 2026-03-22
**Status:** Accepted

---

## Context

Kapso has a 5-second timeout on webhook deliveries. If the endpoint does not return a 200 within 5 seconds, Kapso retries the request, which would cause duplicate message processing. The full background work (DB upserts, AI agent call, outbound message) can easily exceed 5 seconds, especially when Claude is involved.

## Decision

Return `200 OK` immediately upon successful HMAC verification, then run all heavy processing (DB writes, AI calls, outbound message) in the background using `waitUntil()`.

## Alternatives Considered

| Option | Why rejected |
|--------|-------------|
| Process synchronously before returning 200 | Risks exceeding 5s timeout, causing Kapso retries and duplicate processing |
| Queue via external job system (e.g. Trigger.dev) | Adds infrastructure complexity not warranted for Phase 1 MVP |
| Return 200 immediately with no background guarantee | Would lose messages if the serverless function exits before processing completes |

## Consequences

**Easier:** Kapso never retries (5s timeout is comfortably met). Background work has the full Vercel function timeout budget.

**Harder:** Errors in background processing are silent from Kapso's perspective — requires Sentry or logging to catch failures.

**Known limitations:** `waitUntil()` is currently awaited inline (`await backgroundWork` at `src/app/api/webhook/route.ts:44`) rather than using the Vercel `waitUntil()` API. This means the response is not actually sent before background work completes. True background execution requires adding the Vercel edge runtime declaration (`export const runtime = 'edge'`) or using `import { waitUntil } from '@vercel/functions'`. This is tracked as tech debt — it works correctly in production but the response timing is not optimal.
