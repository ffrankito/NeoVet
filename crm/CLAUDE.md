# CRM — Claude Instructions

> This app is part of the NeoVet monorepo. Read the root `CLAUDE.md` first — it contains business context, the v1/v2/v3 rule, the language policy, and cross-cutting constraints that apply here.

---

## What This App Is

Internal staff tool for the NeoVet clinic. CRUD for clients (pet owners), patients (pets), clinical history (SOAP), appointments, hospitalizations (with daily observation logs), surgical/medical procedures (with supply consumption), grooming sessions, pet shop inventory/sales, cash register, consent document generation (PDF), charges & debtors, and email notifications. Role-based access control for admin, owner, vet, and groomer. Used by Paula and her clinic team (9 people) — not exposed to the public.

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
| Error tracking | Sentry (`@sentry/nextjs`) | 11.x |
| Testing | Vitest | 4.1.5 |

---

## v1 Scope — Current State

**Phases A–L complete.** Phase D (ARCA billing) is the only remaining v1 deliverable — blocked on Paula's credentials.

### What's built

- **Clients & patients** — full CRUD, avatar upload, deceased flag, GVet import flag. DB is currently populated with smoke-test data only (12 clients / 15 patients / 22 appointments as of 2026-04-24) — Paula is not yet live on the new system. Historical GVet imports (1,771 clients / 1,380 patients) were exploratory and have been cleared.
- **Clinical history** — SOAP consultations with vitals, treatment items (medication/dose/frequency/duration), vaccinations, deworming records, documents (5 categories + Supabase Storage), complementary methods (study reports + photos).
- **Appointments** — create/confirm/complete/cancel/no-show. 5 statuses: `pending`, `confirmed`, `completed`, `cancelled`, `no_show`. Cancellation captures optional reason. Types: `veterinary` / `grooming`. Consultation types: `clinica` / `virtual` / `domicilio`.
- **Calendar** — weekly view (desktop) / daily (mobile), color-coded services, surgery blocks, free-slot visualization, staff filter, schedule suspension with auto-cancel.
- **Service catalog** — 9 categories, default duration + surgery block duration.
- **Estética** — per-patient profiles (behavior/coat/time estimate) + session records with configurable service types (Baño, Corte, Corte sanitario, Limpieza dental, Baño sanitario, Baño y corte, Baño sanitario y corte), before/after photos, findings checkboxes, per-service base pricing with manual override, payment method. Sessions auto-post revenue to the open cash register. Auto-creates charge for the client. Paula can add new service types from the services settings.
- **Pet shop** — products (9 categories), providers (soft-delete), stock entries (auto-increment), sales with multi-item cart + 5 payment methods. Sales linked to a patient auto-create a charge for the client.
- **Cash register** — open/close sessions, income/expense movements, breakdown by payment method. Balance = initial + pet shop sales + grooming revenue + extra income - expenses.
- **Email notifications** — booking confirmation (on create), cancellation notification (on cancel), reminders 48h/24h, vaccine due in 7 days, post-consultation follow-ups. All via Resend + Vercel Cron (`0 12 * * *`). Idempotent via `email_logs` table.
- **Dashboard** — role-filtered "today's appointments" (admin sees all, vet sees own vet appointments, groomer sees own grooming appointments). Summary cards (clients, patients, today's count). Cash register open/closed widget (admin only).
- **Staff & access** — 4 roles: `admin` (full), `owner` (full), `vet` (clinical), `groomer` (grooming only). Middleware sets `x-user-role` header. Staff CRUD (admin only).
- **Patient detail tabs** — 8 tabs: Información, Historia clínica, Internaciones, Procedimientos, Vacunas, Desparasitaciones, Documentos, Peluquería. Internaciones/Procedimientos tabs show history with links to detail pages and quick-create buttons.
- **Patient summary on appointments** — mini card with last consultation, overdue vaccines, brachycephalic breed alert, deceased flag.
- **Client detail** — shows upcoming appointments inline.
- **Follow-up shortcut** — "Agendar turno de seguimiento" button on consultation detail, pre-fills patient + reason.
- **Mobile responsive** — sidebar collapses to hamburger, tables adapt to 375px, 44px touch targets.
- **Hospitalizations** — patient admissions with daily observation logs (vitals: weight, temp, HR, RR + clinical: feeding, hydration, medication, urine/feces output). One active per patient. Linked optionally to consultation. Discharge tracking.
- **Procedures** — surgical/medical procedures with multiple surgeons + anesthesiologists (join table `procedure_staff`). Supply consumption from products (decrements stock). Follow-up reminders via `follow_ups` table (added `procedureId` FK). Linked optionally to hospitalization.
- **Consent documents** — template-based PDF generation via `@react-pdf/renderer`. 3 templates: surgery authorization, euthanasia consent, reproductive agreement (GenetiCan 1). Auto-fills patient/client data. Stored in Supabase Storage (`consent-documents` bucket). Signed URL downloads (60s expiry).
- **Charges & deudores** — every billable event creates a charge. Auto-charge hooks on: consultations (service basePrice), grooming sessions (finalPrice), pet shop sales (item totals). Partial payments supported. "Deudores" page shows clients with unpaid balances, category breakdown (consulta/peluquería/procedimiento/venta/internación/otro), inline payment recording. Admin/owner only.
- **Seguimientos management** — rendered inline on `/dashboard` (below Sala de espera, hidden for groomer) with 3 tabs (Pendientes / Atendidos / Descartados, URL-driven via `?followUpsTab=`) and per-row actions: *Marcar atendido* / *Descartar* / *Reabrir*. Status is a new enum (`pending | done | dismissed`, migration `0034`) that the reminder cron respects — dismissed follow-ups stop auto-mailing. Admin dashboard alert chip (`Seguimientos vencidos`) anchor-scrolls to the section; count = `scheduledDate ≤ today AND status = 'pending'`. Server actions live at `src/app/dashboard/follow-ups-actions.ts` (no separate route).
- **Precios (vet read-only)** — `/dashboard/precios` — two-table read-only reference of service basePrices and product sellPrices for admin / owner / vet (not groomer). Single text-search across both. Costs (`costPrice`) deliberately hidden. Built so vets can answer "¿esto cuánto sale?" mid-consult without interrupting reception.
- **Bot API endpoints** — `/api/bot/*` (6 routes, `BOT_API_KEY` auth) consumed by the v2 WhatsApp bot that Franco shipped 2026-04-22. Routes: `availability`, `appointments`, `clients` (GET by phone + POST to register new client+first pet from WhatsApp), `context`, `services`. See `chatbot/src/lib/whatsapp/tools/` for the live consumers.
- **`clients.source`** — new column added 2026-04-22 (migration `0033_add_source_to_clients`). Enum values: `whatsapp | web | manual`, default `manual`. Set to `whatsapp` by the bot's `POST /api/bot/clients` path when it registers a new client from a WhatsApp conversation. Existing rows default to `manual`; GVet-imported rows also `manual` (not backfilled to `gvet` — if that distinction matters later, the `importedFromGvet` boolean still tracks it).

### What's NOT built (v1 remaining)

- **Phase D — ARCA billing** — payment registration, Factura A/B/C, CAE authorization, fiscal entity management, limit control. Blocked on Paula providing ARCA certificate + CUIT + punto de venta.

### Hard boundaries for v1

- No public API beyond `BOT_API_KEY`-guarded `/api/bot/*` endpoints. Those endpoints are now consumed in production by the v2 WhatsApp bot (see `chatbot/` app) — scope is still narrow and auth-gated, but the "chatbot and CRM are independent" framing no longer applies to the WhatsApp channel.
- No outbound WhatsApp from the CRM — email only (Resend). WhatsApp reminders remain v2.
- No reporting or analytics
- No audit log — `createdBy` + `updatedAt` provide partial traceability
- No prescription printout — treatment plans viewable in-app but not exportable

---

## Key File Paths

### Schema
- `src/db/schema/` — 34 tables. Index at `src/db/schema/index.ts`.
- Key schemas: `appointments.ts`, `consultations.ts`, `staff.ts`, `cash_sessions.ts`, `grooming_sessions.ts`, `email_logs.ts`, `hospitalizations.ts`, `hospitalization_observations.ts`, `procedures.ts`, `procedure_supplies.ts`, `consent_templates.ts`, `consent_documents.ts`, `charges.ts`, `retorno_queue.ts`

### Auth
- `src/lib/supabase/middleware.ts` — auth middleware, reads role from JWT `app_metadata`, sets `x-user-role` header
- `src/lib/auth.ts` — `getRole()`, `hasRole()`, `isAdminLevel()`, `getSessionStaffId()`

### Email
- `src/lib/email/resend.ts` — Resend client via `getResend()` lazy getter (constructed on first call; throws if `RESEND_API_KEY` is absent). Never import a pre-built `resend` singleton — always call `getResend()` at the send site.
- `src/lib/email/send-email.ts` — shared `sendAndLogEmail()` helper with idempotency
- `src/lib/email/templates/` — 5 JSX templates (appointment-reminder, booking-confirmation, cancellation-notification, follow-up, vaccine-reminder)

### Observability (Sentry)
- `src/instrumentation.ts` — Next.js runtime hook; loads the right Sentry config per `NEXT_RUNTIME`. Also exports `onRequestError` for unhandled server errors.
- `src/instrumentation-client.ts` — browser SDK init. Session replay **off** (CRM handles PHI). `sendDefaultPii: false`.
- `src/sentry.server.config.ts` — Node runtime. `sendDefaultPii: false`, `includeLocalVariables: false`, `beforeSend` drops `NEXT_REDIRECT` / `NEXT_NOT_FOUND` control-flow noise.
- `src/sentry.edge.config.ts` — edge runtime (proxy.ts, edge route handlers).
- `src/app/global-error.tsx` — React render-crash boundary (mandatory `"use client"`).
- `next.config.ts` wraps in `withSentryConfig` with `tunnelRoute: "/monitoring"`; `src/proxy.ts` matcher excludes `monitoring` so tunneled events skip auth.

### Utilities
- `src/lib/ids.ts` — prefixed ID generators (`apt_`, `cli_`, `pat_`, `con_`, `gss_`, `csh_`, `cmv_`, `log_`, `hos_`, `hob_`, `prc_`, `psu_`, `ctm_`, `cdc_`, `chg_`, etc.)
- `src/lib/timezone.ts` — Argentina timezone helpers (`todayStartART`, `todayEndART`, `formatART`, `parseDateTimeAsART`, etc.)
- `src/lib/search/patient-aware-search.ts` — reusable Drizzle predicate for list-page search. `buildPatientAwareSearchClause(term)` returns an `ilike(... or ...)` across `patients.name`, `clients.name`, `clients.dni`, `clients.phone`, `clients.address`. Returns `undefined` for empty/whitespace terms (no filter). Unit-tested against compiled SQL via `PgDialect.sqlToQuery` in `src/lib/search/patient-aware-search.test.ts`.

### PDF Generation
- `src/lib/pdf/render-consent.ts` — entry point: `renderConsentPdf(templateType, data)` → Buffer
- `src/lib/pdf/styles.ts` — shared A4 styles for consent PDFs
- `src/lib/pdf/clinic-header.tsx` — shared clinic header component (NeoVet branding)
- `src/lib/pdf/templates/` — 3 templates: `surgery-consent.tsx`, `euthanasia-consent.tsx`, `reproductive-agreement.tsx`

### Dashboard modules
- `src/app/dashboard/` — 15 modules: appointments, calendar, cash, clients, consent-documents, consultations, deudores, grooming, hospitalizations, patients, petshop, precios, procedures, sala-de-espera, settings (follow-ups is rendered inline on the dashboard, no separate route)

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
- **External SDK clients**: lazy-init any SDK that validates credentials in its constructor (Resend, Stripe, etc.) behind a `getXxx()` getter. Never export a pre-built singleton at module load — a missing env var will crash any route that transitively imports the module, even routes that never use the SDK. See `src/lib/email/resend.ts` for the pattern.
- **Patient-aware list search**: when adding text search to any list-page action whose entity has a `patients` + `clients` relationship (appointments, hospitalizations, procedures, consent documents, grooming), use `buildPatientAwareSearchClause(term)` from `src/lib/search/patient-aware-search.ts` rather than rolling a new `ilike` chain. **Important:** the count query in the same action must also `innerJoin(patients).innerJoin(clients)`, otherwise the search predicate references out-of-scope columns and the count breaks.

---

## Database & Migrations

This app currently runs against a single Supabase project (no preview branch yet — see root `CLAUDE.md`). A dev branch is planned before Paula goes live.

**Current state:** 35 migrations (latest: `0034_parallel_terror` — `follow_up_status` enum + `follow_ups.status` column with default `pending`), 35 tables.

**Migration workflow:**
- Write schema changes in `src/db/schema/`
- Run `npm run db:generate` to generate the SQL migration file in `drizzle/migrations/`
- Commit the migration file and push — Supabase applies it on deploy.
- **Important:** If Drizzle generates CREATE TABLE statements for tables that already exist in the DB (happened with bot tables in migration 0019), manually strip them from the SQL file before committing.

**Local env setup** — `.env.local` is the active env. Copy canonical values from `.env.prod`:
```bash
cp .env.prod .env.local
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
