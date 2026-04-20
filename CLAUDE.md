# NeoVet — Project Instructions for Claude

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
- **v1** — Works standalone, no cross-app integrations. CRM includes email reminders; chatbot is a standalone web widget. **STATUS: En fase de desarrollo. UAT postpuesto. Entrevistas con Paula y veterinarios (Valdemar, Fernanda) revelaron gaps que bloquean el reemplazo de Geovet (detalle de internaciones/fluidoterapia, registro de procedimientos con ASA y roles, auto-carga de cargos desde tratamientos, agendas compartidas entre vets, acceso a costos/presupuestos desde rol vet). Re-scope y continúa el desarrollo. Pendiente entrevista con recepción/administración.**
- **v2** — Cross-app integrations (chatbot ↔ CRM API). WhatsApp channel live. Automated reminders via WhatsApp.
- **v3** — AI, reporting, advanced automation.

When suggesting features or scope, always flag which version they belong to. Never add v2/v3 features to v1 without explicitly calling it out.

---

## What Is Explicitly Out of Scope Right Now

These are **hard prohibitions** for current work. Do not implement, wire up, or scaffold unless a version target is explicitly upgraded:

- **No chatbot ↔ CRM integration in v1.** The chatbot and CRM are independent in v1. No API calls between them.
- **No WhatsApp in v1.** The chatbot delivers via web widget only. WhatsApp (Kapso) is v2. CRM reminders use email (Resend) in v1 — WhatsApp reminders are v2.
- **No AI image analysis in v1.** Image triage (L3) is deferred. Do not implement `analyze-image` tool or L3 logic.
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
4. **L4 keywords are in Argentine Spanish:** convulsión, no respira, atropellado, envenenado, sangrado, no reacciona, desmayado, golpe fuerte, obstrucción, emergencia, urgente, se está muriendo.

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
| Error tracking | Sentry (`@sentry/nextjs`) | `crm/` (chatbot + landing pending Phase T1b/T1c) |
| Deployment | Vercel | All apps |

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
