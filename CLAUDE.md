# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## NeoVet — Project Instructions for Claude

## Business Context

NeoVet is a software product being built for a veterinary clinic in Argentina. The clinic specializes in bulldogs and brachycephalic breeds and currently operates with heavy manual processes. The goal is to modernize through automation and better tooling.

### The Clinic

- A veterinary clinic run by **Paula Silveyra** (Mat. 2046), the business owner and primary stakeholder.
- Specializes in **bulldogs and brachycephalic breeds** — breeds prone to respiratory emergencies. This is medically significant and affects urgency triage design.
- The clinic currently uses **Geovet** (also referred to as G-Vet) as their CRM.
- Appointments (turnos) are managed manually and duplicated across Geovet and an external calendar, creating operational overhead.
- The primary communication channel with clients is **WhatsApp**.

### Hard Constraint: Geovet Has No Integration Path

Geovet is functional and well-organized, but it has **no API, no webhooks, and no programmatic access of any kind**. This means:

- No real-time sync with Geovet is possible — ever, until the new CRM is live and replaces it.
- The only way to migrate data out of Geovet is via **manual Excel exports** or **HTML scraping**.
- All automation must be built on top of the new NeoVet system, not layered onto Geovet.

This constraint is load-bearing. Do not propose or implement any solution that assumes Geovet integration.

### Pain Points

- High manual workload on receptionists (scheduling, answering FAQs, confirming appointments).
- No automation or notifications — everything depends on human intervention.
- Duplicated appointment management across Geovet and an external calendar.
- Inability to programmatically read or write to the current CRM.

### Goals

1. Reduce receptionist workload through automation.
2. Give clients a self-service channel (chatbot) to get answers and eventually book appointments.
3. Build a custom CRM that the team fully controls and can integrate with the chatbot.
4. Eventually move appointment management fully into the new system, replacing Geovet.

### Team

- **Tomás Pinolini** — Product/development lead. Owns scope, roadmap, and client relationship.
- **Franco Zancocchia** — Developer. Leads technical implementation, bot architecture, and integrations.
- **Paula Silveyra** — Clinic owner/manager. Primary end-user of the CRM and source of business requirements.

---

## Language Policy

**All user-facing text must be in Spanish (Argentina).** This includes:

- Chatbot messages and replies
- UI labels, buttons, navigation
- Error messages, empty states, loading text
- Confirmation dialogs and notifications
- Email and WhatsApp copy

Developer-facing content (code comments, variable names, documentation, ADRs, commit messages) is written in English.

When generating any UI copy, chatbot prompts, or user-visible strings, **always default to Argentine Spanish** unless the context explicitly says otherwise.

---

## Project Overview

NeoVet is a monorepo composed of 3 independent apps:

| App | Stack | Description |
|-----|-------|-------------|
| `crm/` | Next.js 16 App Router, TypeScript, Tailwind, Drizzle ORM, Resend, @react-pdf/renderer | Internal staff tool. Clients/patients, clinical history (SOAP), appointment calendar, hospitalizations, procedures, grooming module, pet shop + cash register, consent document PDFs, charges & debtors, email reminders, role-based access (admin/owner/vet/groomer). |
| `chatbot/` | Next.js 16 App Router, TypeScript, Tailwind, AI SDK, Claude Sonnet | Conversational assistant. Web-first v1 (deployed), WhatsApp via Kapso in v2. Consulta API de feriados ArgentinaDatos en tiempo real. |
| `landing/` | **Astro**, TypeScript, Tailwind | Static marketing site. Services, team, location, contact. Chatbot integrado como iframe flotante. |

**Critical:** `landing/` is Astro, not Next.js. Do not generate Next.js code, `app/` directory structure, or server components for the landing. It uses `.astro` files and Astro's static output mode.

---

## Versioning Strategy (v1 / v2 / v3 Rule)

Every feature must pass 3 questions before entering v1 scope:

1. **Is it blocking?** Can users get value without it? If yes → defer.
2. **Is it reversible?** Can it be added later without breaking anything? If yes → defer.
3. **Is it validated?** Do we *know* users need it, or are we assuming? If assuming → defer.

**Version targets:**
- **v1** — Works standalone, no cross-app integrations in the web widget (the v2 WhatsApp bot is the narrow exception — see Architecture note). CRM includes email reminders. **STATUS (2026-04-23): En fase de desarrollo. UAT postpuesto. v1 stopgap WhatsApp auto-reply cancelado — Paula ya tiene uno configurado en WhatsApp Business (revelado en la reunión del 2026-04-22). Ese hallazgo liberó capacidad de v1 y Franco aceleró la v2 del chatbot: el 2026-04-22 shipeó el MVP de WhatsApp-Kapso (agente, sesión, 5 tools, webhook, L4 fast-path) + endpoint nuevo `/api/bot/clients` en el CRM + columna `source` en clients (migración 0033). Status actual de los 10 items: 6 shippados, 2 parciales, 1 cancelado (#9 stopgap), 1 observability multi-fase (T1a CRM verificado; T1b chatbot + T1c landing merged, runtime pendiente de env vars en Vercel). Pendiente de Tomás: lista ampliada de keywords L4 dictada por Paula en la reunión (respira mal/agitado, mucosas azules, no puede hacer pis/caca, trauma, hemorragia activa) que hay que reconciliar con las 15 actuales en `chatbot/src/lib/whatsapp/agent.ts`.**
- **v2** — Cross-app integrations (chatbot ↔ CRM API). WhatsApp channel live. Automated reminders via WhatsApp.
- **v3** — AI, reporting, advanced automation.

When suggesting features or scope, always flag which version they belong to. Never add v2/v3 features to v1 without explicitly calling it out.

---

## What Is Explicitly Out of Scope Right Now

These are **hard prohibitions** for current work. Do not implement, wire up, or scaffold unless a version target is explicitly upgraded:

- **The v1 web widget must stay independent from the CRM.** No API calls from [chatbot/src/app/api/chat/route.ts](chatbot/src/app/api/chat/route.ts) or [chatbot/src/app/page.tsx](chatbot/src/app/page.tsx) to the CRM. The v2 WhatsApp bot is the only channel allowed to cross that line (via `BOT_API_KEY`-guarded `/api/bot/*`).
- **No WhatsApp reminders from the CRM yet.** CRM still emails via Resend in v1. Outbound WhatsApp (appointment/vaccine/follow-up reminders) is future v2 work — the v2 chatbot currently only handles *inbound* WhatsApp.
- **No AI image analysis.** Image triage (L3) is deferred. Do not implement `analyze-image` tool or L3 logic.
- **No Geovet integration, ever.** No sync, no scraping, no API calls to Geovet. Data migration is Excel/HTML-only, one-time.
- **No automated urgency downgrade.** Urgency level can only go up automatically. Only a human staff member can downgrade it via the dashboard.

---

## Urgency System (L1–L4) — Behavioral Constraint

The chatbot uses a four-level urgency system. **This is a patient safety feature, not just UI state.**

| Level | Trigger | Bot action |
|-------|---------|------------|
| L1 | General info, prices, location | Answers automatically |
| L2 | Appointment booking | Runs booking flow |
| L3 | Symptom description or image | AI analyzes, flags for vet review |
| L4 | Emergency keywords | Keyword fast-path (pre-AI), immediate escalation, sends emergency contact |

**Rules that must never be violated:**

1. **Urgency only goes up.** `conversation.urgencyLevel` is only ever set to a higher level. It is never auto-decremented by the bot, a timer, inactivity, or any automated process.
2. **Only humans downgrade.** A staff member must explicitly downgrade urgency via the admin dashboard.
3. **L4 bypasses AI.** L4 detection runs on a hardcoded keyword list *before* the AI agent is called. This guarantees sub-millisecond escalation regardless of AI latency or availability.
4. **L4 keywords are in Argentine Spanish.** Canonical list lives in [chatbot/src/lib/whatsapp/agent.ts](chatbot/src/lib/whatsapp/agent.ts) (`L4_KEYWORDS` array) and is **mirrored** in [chatbot/src/lib/prompts/whatsapp-system.ts](chatbot/src/lib/prompts/whatsapp-system.ts) and [chatbot/src/lib/prompts/system.ts](chatbot/src/lib/prompts/system.ts). All three must stay in sync by hand. Current seed list: *convulsión, no respira, atropellado, envenenado, sangrado, no reacciona, desmayado, golpe fuerte, obstrucción, emergencia, urgente, se está muriendo, ahogando, sin pulso* (plus accentless variants). **Expansion pending from 2026-04-22 Paula meeting:** *respira mal, respira agitado, mucosas azules, no puede hacer pis, no puede hacer caca, trauma, hemorragia activa, gato obstruido*. When updating the list, update all three files in the same commit.

The clinic treats brachycephalic breeds. A missed L4 escalation is a life-threatening failure. The conservative design (one-directional, keyword fast-path) is intentional.

---

## Data Migration Notes

- Data is imported from Geovet via manual CSV exports and HTML scraping (Geovet has no API).
- Import scripts live in `crm/scripts/`: `import-gvet.ts`, `import-visitas.ts`, `import-products.ts`, `import-turnos-futuros.ts`, `dedupe-patients.ts`, `backfill-appointments-from-consultations.ts`, `cleanup-imported-visits.ts`, `seed-user.ts`, `import-gvet-scraped.ts`, `parse-gvet-html.ts`, `import-estetica.ts`.
- HTML scraping workflow: save GVet pages as `.htm` files → run `parse-gvet-html.ts` → run `import-gvet-scraped.ts`.
- The `clients` table includes an `importedFromGvet` boolean flag and `gvetId` for traceability.

---

## Key Implementation Details (v1)

### Timezone
- All dates stored in UTC. Argentina is always UTC-3 (no DST).
- Use helpers in `crm/src/lib/timezone.ts`: `parseDateTimeAsART()`, `todayStartART()`, `todayEndART()`, `formatART()`, `formatDateART()`, `formatTimeART()`.
- Never use `new Date()` directly for day boundaries — always use the ART helpers.

### Settings (Dynamic Configuration)
- Clinic hours stored in `settings` table (key/value).
- Keys: `clinic_hours_weekday_morning_start`, `clinic_hours_weekday_morning_end`, `clinic_hours_weekday_afternoon_start`, `clinic_hours_weekday_afternoon_end`, `clinic_hours_holiday_start`, `clinic_hours_holiday_end`.
- Editable from `/dashboard/settings` — changes reflected immediately in calendar and bot availability.

### Feriados (Public Holidays)
- API: `https://api.argentinadatos.com/v1/feriados/{año}` — format `{ fecha: "YYYY-MM-DD", tipo, nombre }`.
- Helper: `crm/src/lib/feriados.ts` — `getFeriados(year)` and `isFeriado(date, feriados)`.
- Used in: calendar (visual highlight), bot availability endpoint, chatbot web (system prompt injection).
- Chatbot checks feriado at request time and injects into system prompt dynamically.

### SelectItem Components
- Do NOT use `label="..."` prop on `SelectItem` from shadcn/ui — it is not supported and causes the component to display the `value` instead of the text when selected.
- Always use only the children: `<SelectItem value="foo">Foo</SelectItem>`.

### Bot API
- Endpoints under `/api/bot/*` protected by `BOT_API_KEY` header.
- Middleware excludes `/api/cron/`, `/api/bot/`, `/api/admin/` from auth.
- `bot_business_context` table seeded with clinic info for v2 WhatsApp bot.

### PDF Generation
- Consent documents generated with `@react-pdf/renderer`.
- Upload to Supabase Storage bucket `consent-documents` (private).
- Requires `SUPABASE_SERVICE_ROLE_KEY` env var and `createAdminClient()`.
- Templates seeded via `scripts/seed-consent-templates.ts`.

### Role-Based Access
- Roles: `admin`, `owner`, `vet`, `groomer`.
- Dashboard filters appointments by role: groomers see only grooming, vets see only their assigned appointments.
- Sidebar items filtered by role via `roles` array in `ALL_NAV_ITEMS`.

---

## Stack Reference

| Layer | Tool | Scope |
|-------|------|-------|
| CRM framework | Next.js 16 App Router + TypeScript | `crm/` only |
| Chatbot framework | Next.js 16 App Router + TypeScript + AI SDK | `chatbot/` only |
| Landing framework | **Astro 6** + TypeScript + Tailwind CSS 4 | `landing/` only |
| Database | Supabase (PostgreSQL) + Drizzle ORM | `crm/` |
| Auth | Supabase Auth + SSR | `crm/` |
| Email | Resend | `crm/` |
| PDF | @react-pdf/renderer | `crm/` |
| Storage | Supabase Storage | `crm/` (grooming photos, consent PDFs) |
| AI | Anthropic Claude Sonnet 4.6 via AI SDK | `chatbot/` |
| Error tracking | Sentry | `crm/` + `chatbot/` — `@sentry/nextjs`; `landing/` — `@sentry/astro`. T1a CRM verified; T1b/T1c runtime verification pending Vercel env vars. |
| Deployment | Vercel | All apps |

---

## Commands

All commands run from inside the app directory (`crm/`, `chatbot/`, `landing/`). There is no root-level package.json.

### crm/
- `npm run dev` — Next.js dev server
- `npm run build` / `npm start` — production build / serve
- `npm run lint` — ESLint
- `npm test` — Vitest (watch) · `npm run test:run` — single run
- Run a single test file: `npx vitest run path/to/file.test.ts` · single test name: `npx vitest run -t "test name"`
- `npm run db:generate` — generate Drizzle migration from schema changes
- `npm run db:migrate` — apply pending migrations (uses `DATABASE_URL` from `.env.local`)
- `npm run db:studio` — open Drizzle Studio
- `npm run db:seed:services` — seed clinical services catalog
- Data import scripts: `npx tsx scripts/<script>.ts` (see Data Migration Notes)

### chatbot/
- `npm run dev` / `npm run build` / `npm start` / `npm run lint` — standard Next.js
- No test suite yet.

### landing/
- `npm run dev` / `npm run build` / `npm run preview` — Astro
- No lint or test scripts.

---

## Code Architecture

### crm/ (Next.js App Router)
- `src/app/dashboard/*` — staff-facing UI, organized by domain (clients, patients, appointments, hospitalizations, procedures, estetica, petshop, caja, debtors, settings). Each route is a server component by default; mutations go through Server Actions colocated under `actions.ts`.
- `src/app/api/bot/*` — integration surface for the v2 WhatsApp bot, guarded by `BOT_API_KEY` header. 6 routes: `availability`, `appointments`, `clients`, `context`, `services`. The `clients` route gained a `POST` handler on 2026-04-22 so the WhatsApp bot can register new clients + first pets. `clients.source` column (values: `whatsapp | web | manual`, default `manual`) tracks acquisition channel — added in migration `0033`. `src/app/api/cron/*` — Vercel Cron jobs (email reminders). Middleware in `src/middleware.ts` enforces Supabase auth but excludes `/api/cron`, `/api/bot`, `/api/admin`.
- `src/db/schema/*` — Drizzle schema (one file per aggregate). `src/db/index.ts` exports the `db` client. `src/db/seed/` and `src/db/seeds/` hold seeders. Generated migrations live in `crm/drizzle/migrations/`.
- `src/lib/` — cross-cutting helpers. Key files: `timezone.ts` (ART helpers — always use these, never `new Date()` for day boundaries), `feriados.ts` (ArgentinaDatos holiday API), `supabase/` (server + admin clients), `auth.ts` + `role.ts` (role gating), `bot-auth.ts` (`BOT_API_KEY` guard for `/api/bot/*`).
- `src/components/ui/` — shadcn primitives. Domain components live next to their routes.
- `scripts/` — one-shot data import scripts from Geovet (see Data Migration Notes).

### chatbot/ (Next.js App Router + AI SDK)
Two active channels share this app:
- **Web widget (v1, shipped):** [src/app/page.tsx](chatbot/src/app/page.tsx) — UI that `landing/` embeds as iframe. [src/app/api/chat/route.ts](chatbot/src/app/api/chat/route.ts) — streaming endpoint (`streamText`). L4 keyword fast-path runs **before** the model is called. Feriados injected at request time. System prompt: [src/lib/prompts/system.ts](chatbot/src/lib/prompts/system.ts). Rate limit: [src/lib/rate-limit.ts](chatbot/src/lib/rate-limit.ts).
- **WhatsApp bot (v2, MVP shipped 2026-04-22, in active development):** [src/app/api/whatsapp/webhook/route.ts](chatbot/src/app/api/whatsapp/webhook/route.ts) — Kapso webhook (GET health / POST inbound). Agent: [src/lib/whatsapp/agent.ts](chatbot/src/lib/whatsapp/agent.ts) (uses `generateText` with 5 tools). Session persistence against CRM's Supabase via service-role client: [src/lib/whatsapp/session.ts](chatbot/src/lib/whatsapp/session.ts). Tools in [src/lib/whatsapp/tools/](chatbot/src/lib/whatsapp/tools/) all call the CRM's bot API.

L4 keyword lists live in two files (agent.ts + whatsapp-system.ts) and must be kept in sync by hand. End-to-end verification against Paula's production number is still pending — Franco is prototyping on his own cell.

### landing/ (Astro)
- `src/pages/index.astro` — single-page site with anchor nav. Chatbot mounted as floating iframe pointing to the chatbot app.
- Static output only — no SSR, no API routes.

### Cross-cutting
- Three apps, three Vercel projects, three deployments. They do not share code or types — any "shared type" is duplicated intentionally (e.g., the `clients.source` enum lives in the CRM Drizzle schema and is re-declared in the chatbot's Zod validator).
- **v1 independence rule is narrowed, not dropped.** The v1 web widget is still isolated from the CRM. The v2 WhatsApp bot *does* call the CRM (via `/api/bot/*` with `BOT_API_KEY`), which is the only cross-app dependency. Both apps still have independent Supabase access — the chatbot's session layer writes to `bot_*` tables directly via service-role, while clinical data (appointments, patients) flows through the CRM API.
- Sentry is wired per-app with its own DSN.

---

## Git & Database Branching Strategy

| Branch | Supabase DB | Purpose |
|--------|-------------|---------| 
| `main` | Production DB | Stable, production-ready code. |
| `dev` | Preview DB (Supabase Branch) | Active development and testing. |

**Local env setup:**
```bash
cp crm/.env.prod crm/.env.local    # → point to production DB
cp crm/.env.dev crm/.env.local     # → point to dev DB
```

Database URL format for migrations (session mode, port 5432):
```
postgresql://postgres.PROJECT_ID:PASSWORD@aws-X-us-east-1.pooler.supabase.com:5432/postgres
```

Note: Local networks may not support IPv6 (Supabase default). Use Session pooler (port 5432) for local dev if Transaction pooler (port 6543) times out.

---

## Documentation

| Location | Contents |
|----------|----------|
| `crm/docs/v1/handoff.md` | Delivery checklist and operations manual |
| `crm/docs/v1/development-plan.md` | CRM v1 phase-by-phase build plan |
| `crm/docs/v1/charter.md` | CRM v1 project scope |
| `crm/docs/v1/technical-spec.md` | CRM v1 technical specification |
| `docs/Guia_Admin.md` | Admin user guide (Paula) |
| `docs/Guia_Veterinario.md` | Vet user guide |
| `docs/Guia_Peluquero.md` | Groomer user guide |
| `docs/Guia_Testeo_UAT.md` | UAT test scenarios |
| `docs/Entrevista_Paula_V1_Demo.md` | Demo script for Paula meeting |
