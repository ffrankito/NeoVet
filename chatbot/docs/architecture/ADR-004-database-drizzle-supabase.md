# ADR-004 — Database: Drizzle ORM + Supabase PostgreSQL

**Date:** 2026-03-22
**Status:** Accepted

---

## Context

The project needs a relational database to store contacts, conversations, messages, appointments, and urgency escalations. The team has prior experience with Drizzle ORM and Supabase from the bot_admin project. Type safety and a migration-first workflow were requirements. Free tier availability was a constraint for the MVP phase.

## Decision

Use Drizzle ORM against a Supabase-hosted PostgreSQL database. Drizzle handles schema definition, type generation, and migrations. Supabase provides managed PostgreSQL, Auth (used in Phase 4), and Realtime (potential future use).

## Alternatives Considered

| Option | Why rejected |
|--------|-------------|
| Prisma + Supabase | Heavier runtime, slower cold starts on serverless, less explicit SQL control |
| Drizzle + PlanetScale (MySQL) | MySQL lacks PostgreSQL features needed for future phases (pgvector for semantic search) |
| Drizzle + Neon | Valid alternative, but Supabase Auth inclusion reduces future work for the admin dashboard |

## Consequences

**Easier:** Full type safety from schema to query. Migration files are plain SQL — easy to review and audit. Same stack as bot_admin reduces context switching.

**Harder:** Two separate `DATABASE_URL` values required: Session mode (port 5432) for `drizzle-kit` migrations, Transaction mode (port 6543) for the Next.js app runtime. This trips up new developers — documented in `docs/plans/week1-handoff.md`.

**Known limitations:** Supabase free tier has connection limits. If connection pool exhaustion becomes an issue, `DB_POOL_MAX` should be added to `.env.example` and tuned per environment.
