# CRM — Claude Instructions

> This app is part of the NeoVet monorepo. Read the root `CLAUDE.md` first — it contains business context, the v1/v2/v3 rule, the language policy, and cross-cutting constraints that apply here.

---

## What This App Is

Internal staff tool for the NeoVet clinic. CRUD for clients (pet owners), patients (pets), clinical history, appointments, grooming sessions, and billing. Role-based access control for admin, vet, and groomer. Email reminders via Resend. Used by Paula and her clinic team — not exposed to the public.

---

## Stack

| Layer | Tool |
|-------|------|
| Framework | Next.js 16 App Router + TypeScript |
| Styling | Tailwind CSS + shadcn/ui |
| ORM | Drizzle ORM |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase SSR |
| Email | Resend + Vercel Cron |
| Hosting | Vercel |

---

## v1 Scope

- Staff-only CRUD: clients, patients, clinical history (SOAP + vitals + treatment + vaccines + deworming + documents)
- Appointment calendar with weekly view and free-slot visualization; service catalog with block durations for surgeries
- Role-based access control: `admin` (full), `vet` (clinical records), `groomer` (grooming only)
- Staff management UI (admin only)
- Grooming module: per-patient grooming profile + session records with before/after photos and findings; 3-tier pricing
- Billing: payment registration + ARCA electronic invoicing (Factura A/B/C); two fiscal entities; MercadoPago payments require invoice
- Email reminders via Resend + Vercel Cron: appointment 48h/24h, vaccine 7 days before, post-consultation follow-ups
- Pet shop module: product catalog, providers, stock entries, sales with multi-item cart, payment methods
- Cash register: daily open/close sessions, income/expense movements, breakdown by payment method
- Mobile-responsive UI
- Email login via Supabase Auth
- One-time data import from Geovet Excel exports

**Hard boundaries for v1 — do not implement without explicitly upgrading the version target:**

- No public API — the CRM exposes no endpoints to the chatbot or any external system
- No chatbot integration — the CRM and chatbot are fully independent in v1
- No WhatsApp notifications — email only in v1; WhatsApp reminders are v2
- No reporting or analytics

---

## Patterns to Follow

- Use **shadcn/ui** primitives for all UI — do not install other component libraries
- Use **Drizzle ORM** for all DB operations — no raw SQL unless Drizzle cannot express it
- **Server components by default** — use client components only when interactivity requires it
- Protect all routes via Supabase SSR middleware

---

## Database & Migrations

This app uses **Supabase branching** — see root `CLAUDE.md` for the full strategy.

**Migration workflow:**
- Write schema changes in `src/db/schema/`
- Run `npm run db:generate` to generate the SQL migration file in `supabase/migrations/`
- Commit the migration file and push to `dev` — then run `npm run db:migrate` against the preview DB to apply it
- When merging to `main`, run `npm run db:migrate` against production

**Switching environments locally** — `.env.local` is the active env, swap it by copying:
```bash
cp .env.development .env.local   # → preview DB (dev branch)
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
