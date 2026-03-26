# ADR-006 — Auth: Supabase SSR Auth

**Date:** 2026-03-22
**Status:** Proposed

---

## Context

The admin dashboard (Phase 4) requires authentication to protect staff-only routes — conversation threads, escalation logs, business context editor, and availability calendar. The project already uses Supabase for the database, which includes Auth as part of its platform. A simple email-based login is sufficient for the initial staff (2–3 people).

## Decision

Use Supabase SSR Auth (`@supabase/ssr`) for the admin dashboard. Authentication will be email-based with an allowlist of permitted addresses. Route protection will be handled via Next.js middleware.

## Alternatives Considered

| Option | Why rejected |
|--------|-------------|
| NextAuth.js v5 + Google OAuth | Adds a dependency for a feature already covered by Supabase; Google OAuth adds friction for non-Google staff accounts |
| Custom JWT auth | Unnecessary complexity for a 2–3 person internal tool |
| No auth (IP allowlist only) | Insufficient security for a system containing patient contact data |

## Consequences

**Easier:** Auth is included in the existing Supabase project — no additional service or billing. SSR helpers integrate cleanly with Next.js App Router server components.

**Harder:** Supabase Auth adds surface area to the Supabase dependency. If the project migrates databases, auth must also migrate.

**Known limitations:** This decision is Proposed — implementation begins in Phase 4 (Week 4). The `src/lib/supabase/` helpers and `src/middleware.ts` do not yet exist.
