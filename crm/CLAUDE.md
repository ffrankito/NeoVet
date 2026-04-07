# CRM — Claude Instructions

> This app is part of the NeoVet monorepo. Read the root `CLAUDE.md` first — it contains business context, the v1/v2/v3 rule, the language policy, and cross-cutting constraints that apply here.

---

## What This App Is

Internal staff tool for the NeoVet clinic. CRUD for clients (pet owners), patients (pets), clinical history (SOAP), appointments, grooming sessions, pet shop inventory/sales, cash register, and email notifications. Role-based access control for admin, owner, vet, and groomer. Used by Paula and her clinic team (9 people) — not exposed to the public.

---

## Stack

| Layer | Tool | Version |
|-------|------|---------|
| Framework | Next.js App Router + TypeScript | 16.1.6 |
| Styling | Tailwind CSS + shadcn/ui | 4 / 4.0.6 |
| ORM | Drizzle ORM | 0.45.1 |
| Database | Supabase (PostgreSQL) | — |
| Auth | Supabase SSR | 0.9.0 |
| Email | Resend + Vercel Cron | 6.10.0 |
| Validation | Zod | 4.3.6 |
| Hosting | Vercel | — |

---

## v1 Scope — Current State

**Phases A–L complete.** Phase D (ARCA billing) is the only remaining v1 deliverable — blocked on Paula's credentials.

### What's built

- **Clients & patients** — full CRUD, avatar upload, deceased flag, GVet import flag. 1,771 clients + 1,380 patients imported.
- **Clinical history** — SOAP consultations with vitals, treatment items (medication/dose/frequency/duration), vaccinations, deworming records, documents (5 categories + Supabase Storage), complementary methods (study reports + photos).
- **Appointments** — create/confirm/complete/cancel/no-show. 5 statuses: `pending`, `confirmed`, `completed`, `cancelled`, `no_show`. Cancellation captures optional reason. Types: `veterinary` / `grooming`. Consultation types: `clinica` / `virtual` / `domicilio`.
- **Calendar** — weekly view (desktop) / daily (mobile), color-coded services, surgery blocks, free-slot visualization, staff filter, schedule suspension with auto-cancel.
- **Service catalog** — 9 categories, default duration + surgery block duration.
- **Grooming** — per-patient profiles (behavior/coat/time estimate) + session records with before/after photos, findings checkboxes, 3-tier pricing, payment method. Sessions auto-post revenue to the open cash register.
- **Pet shop** — products (9 categories), providers (soft-delete), stock entries (auto-increment), sales with multi-item cart + 5 payment methods.
- **Cash register** — open/close sessions, income/expense movements, breakdown by payment method. Balance = initial + pet shop sales + grooming revenue + extra income - expenses.
- **Email notifications** — booking confirmation (on create), cancellation notification (on cancel), reminders 48h/24h, vaccine due in 7 days, post-consultation follow-ups. All via Resend + Vercel Cron (`0 12 * * *`). Idempotent via `email_logs` table.
- **Dashboard** — role-filtered "today's appointments" (admin sees all, vet sees own vet appointments, groomer sees own grooming appointments). Summary cards (clients, patients, today's count). Cash register open/closed widget (admin only).
- **Staff & access** — 4 roles: `admin` (full), `owner` (full), `vet` (clinical), `groomer` (grooming only). Middleware sets `x-user-role` header. Staff CRUD (admin only).
- **Patient summary on appointments** — mini card with last consultation, overdue vaccines, brachycephalic breed alert, deceased flag.
- **Client detail** — shows upcoming appointments inline.
- **Follow-up shortcut** — "Agendar turno de seguimiento" button on consultation detail, pre-fills patient + reason.
- **Mobile responsive** — sidebar collapses to hamburger, tables adapt to 375px, 44px touch targets.
- **Bot API endpoints** — `/api/bot/*` (6 routes, API key auth) ready for v2 chatbot integration.

### What's NOT built (v1 remaining)

- **Phase D — ARCA billing** — payment registration, Factura A/B/C, CAE authorization, fiscal entity management, limit control. Blocked on Paula providing ARCA certificate + CUIT + punto de venta.

### Hard boundaries for v1

- No public API beyond bot endpoints — CRM and chatbot are independent in v1
- No WhatsApp notifications — email only; WhatsApp reminders are v2
- No reporting or analytics
- No audit log — `createdBy` + `updatedAt` provide partial traceability
- No prescription printout — treatment plans viewable in-app but not exportable

---

## Key File Paths

### Schema
- `src/db/schema/` — 27 tables. Index at `src/db/schema/index.ts`.
- Key schemas: `appointments.ts`, `consultations.ts`, `staff.ts`, `cash_sessions.ts`, `grooming_sessions.ts`, `email_logs.ts`

### Auth
- `src/lib/supabase/middleware.ts` — auth middleware, reads role from JWT `app_metadata`, sets `x-user-role` header
- `src/lib/auth.ts` — `getRole()`, `hasRole()`, `isAdminLevel()`, `getSessionStaffId()`

### Email
- `src/lib/email/resend.ts` — Resend client init
- `src/lib/email/send-email.ts` — shared `sendAndLogEmail()` helper with idempotency
- `src/lib/email/templates/` — 5 JSX templates (appointment-reminder, booking-confirmation, cancellation-notification, follow-up, vaccine-reminder)

### Utilities
- `src/lib/ids.ts` — prefixed ID generators (`apt_`, `cli_`, `pat_`, `con_`, `gss_`, `csh_`, `cmv_`, `log_`, etc.)
- `src/lib/timezone.ts` — Argentina timezone helpers (`todayStartART`, `todayEndART`, `formatART`, `parseDateTimeAsART`, etc.)

### Dashboard modules
- `src/app/dashboard/` — 9 modules: appointments, calendar, cash, clients, consultations, grooming, patients, petshop, settings

### API routes
- `src/app/api/cron/` — 3 cron jobs (appointment-reminders, follow-ups, vaccine-reminders)
- `src/app/api/bot/` — 6 bot endpoints (availability, appointments, clients, context, services)
- `src/app/api/admin/` — 2 seed routes (bot-context, settings)

---

## Patterns to Follow

- Use **shadcn/ui** primitives for all UI — do not install other component libraries
- Use **Drizzle ORM** for all DB operations — no raw SQL unless Drizzle cannot express it
- **Server components by default** — use client components only when interactivity requires it
- Protect all routes via Supabase SSR middleware
- **Server actions** pattern: `"use server"` in `actions.ts` files, accept `FormData`, validate with Zod, return `{ errors }` or `{ error }` or `{ success }`, call `revalidatePath()` before `redirect()`
- **ID generation**: always use prefixed IDs from `src/lib/ids.ts` (e.g., `appointmentId()` → `apt_abc123`)
- **Timezone**: always use helpers from `src/lib/timezone.ts` for Argentina time — never use raw `new Date()` for display
- **Email sending**: use `sendAndLogEmail()` from `src/lib/email/send-email.ts` — it handles Resend + dedup via `email_logs`

---

## Database & Migrations

This app uses **Supabase branching** — see root `CLAUDE.md` for the full strategy.

**Current state:** 20 migrations (0000–0019), 27 tables.

**Migration workflow:**
- Write schema changes in `src/db/schema/`
- Run `npm run db:generate` to generate the SQL migration file in `drizzle/migrations/`
- Commit the migration file and push — Supabase branching applies it to the appropriate DB
- **Important:** If Drizzle generates CREATE TABLE statements for tables that already exist in the DB (happened with bot tables in migration 0019), manually strip them from the SQL file before committing.

**Switching environments locally** — `.env.local` is the active env, swap it by copying:
```bash
cp .env.dev .env.local           # → preview DB (dev branch)
cp .env.production  .env.local   # → production DB (careful)
```

**Supabase CLI** is configured in `supabase/` and linked to project ref `ajpzsmcqlbbuzimjjwyi`.

---

## Documentation Standards

Before creating any documentation artifact for this app, use the templates from `docs/standards/` at the monorepo root:

| When | Template | Output |
|------|----------|--------|
| New project or major initiative | `01-project-charter.md` | `crm/docs/v{N}/charter.md` |
| Technical design phase | `02-technical-spec.md` | `crm/docs/v{N}/technical-spec.md` |
| Significant technical decision | `03-adr-template.md` | `crm/docs/v{N}/architecture/ADR-NNN-title.md` |
| Project delivery | `04-client-handoff.md` | `crm/docs/v{N}/handoff.md` |

A decision is "significant" if making it differently would change the architecture, cost structure, or maintenance burden. Check `crm/docs/v1/architecture/` for existing ADRs before proposing new approaches.
