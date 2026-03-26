# NeoVet — Project Instructions for Claude

## Business Context

NeoVet is a software product being built for a veterinary clinic in Argentina. The clinic specializes in bulldogs and brachycephalic breeds and currently operates with heavy manual processes. The goal is to modernize through automation and better tooling.

### The Clinic

- A veterinary clinic run by **Paula Silveira**, the business owner and primary stakeholder.
- Specializes in **bulldogs and brachycephalic breeds** — breeds prone to respiratory emergencies. This is medically significant and affects urgency triage design.
- The clinic currently uses **Geovet** (also referred to as G-Vet) as their CRM.
- Appointments (turnos) are managed manually and duplicated across Geovet and an external calendar, creating operational overhead.
- The primary communication channel with clients is **WhatsApp**.

### Hard Constraint: Geovet Has No Integration Path

Geovet is functional and well-organized, but it has **no API, no webhooks, and no programmatic access of any kind**. This means:

- No real-time sync with Geovet is possible — ever, until the new CRM is live and replaces it.
- The only way to migrate data out of Geovet is via **manual Excel exports**.
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
- **Paula Silveira** — Clinic owner/manager. Primary end-user of the CRM and source of business requirements.

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
| `crm/` | Next.js 14 App Router, TypeScript, Tailwind, Drizzle ORM | Internal staff tool. CRUD for clients/patients, clinical history, appointment calendar. |
| `chatbot/` | Next.js 14 App Router, TypeScript, Tailwind | Conversational assistant. Web-first v1, WhatsApp via Kapso in v2. |
| `landing/` | **Astro**, TypeScript, Tailwind | Static marketing site. Services, team, location, contact. No server-side logic. |

**Critical:** `landing/` is Astro, not Next.js. Do not generate Next.js code, `app/` directory structure, or server components for the landing. It uses `.astro` files and Astro's static output mode.

---

## Versioning Strategy (v1 / v2 / v3 Rule)

Every feature must pass 3 questions before entering v1 scope:

1. **Is it blocking?** Can users get value without it? If yes → defer.
2. **Is it reversible?** Can it be added later without breaking anything? If yes → defer.
3. **Is it validated?** Do we *know* users need it, or are we assuming? If assuming → defer.

**Version targets:**
- **v1** — Works, manually operated, no cross-app integrations. Each app is useful on its own.
- **v2** — Cross-app integrations (chatbot ↔ CRM API). WhatsApp channel live.
- **v3** — Automation, reporting, advanced features.

When suggesting features or scope, always flag which version they belong to. Never add v2/v3 features to v1 without explicitly calling it out.

---

## What Is Explicitly Out of Scope Right Now

These are **hard prohibitions** for current work. Do not implement, wire up, or scaffold unless a version target is explicitly upgraded:

- **No chatbot ↔ CRM integration in v1.** The chatbot and CRM are independent in v1. No API calls between them.
- **No WhatsApp in v1.** The chatbot delivers via web widget only. WhatsApp (Kapso) is v2.
- **No AI image analysis in v1.** Image triage (L3) is deferred. Do not implement `analyze-image` tool or L3 logic.
- **No Geovet integration, ever.** No sync, no scraping, no API calls to Geovet. Data migration is Excel-only, one-time.
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

The clinic treats brachycephalic breeds. A missed L4 escalation is a life-threatening failure. The conservative design (one-directional, keyword fast-path) is intentional. See `docs/architecture/ADR-005-urgency-system-l1-l4.md`.

---

## Data Migration Notes

- Patient and client data can be exported from Geovet as Excel files (one-time migration only).
- When building or modifying the CRM data model, ensure it can import this data cleanly.
- Key fields: patient name, species, breed, owner name, owner contact (phone/WhatsApp), appointment history.
- The `contacts` schema includes an `importedFromGvet` flag for traceability.

---

## Documentation — Read Before Proposing Decisions

Each app owns its docs. **Before proposing any architectural or technical decision, check whether it has already been decided in the relevant app's docs folder.**

| Location | Contents |
|----------|----------|
| `chatbot/docs/architecture/` | ADRs for the chatbot — AI provider, WhatsApp, webhook, DB, urgency system, auth |
| `chatbot/docs/architecture-phase1.md` | Full chatbot Phase 1 blueprint: stack, schema, message flow, build order |
| `chatbot/docs/charter.md` | Chatbot project scope, deliverables, success criteria |
| `chatbot/docs/technical-spec.md` | Chatbot technical specification |
| `crm/docs/charter.md` | CRM project scope, deliverables, success criteria |
| `crm/docs/technical-spec.md` | CRM technical specification |
| `docs/standards/` | Agency documentation templates (charter, technical spec, ADR, handoff) |
| `landing/docs/` | Paula interview checklist, optimization overview, ADRs |

If you are about to suggest something that touches the stack, database schema, WhatsApp integration, AI provider, auth system, or urgency model — read the relevant ADR in `chatbot/docs/architecture/` first.

---

## Stack Reference

| Layer | Tool | Scope |
|-------|------|-------|
| CRM framework | Next.js 14 App Router + TypeScript | `crm/` only |
| Chatbot framework | Next.js 14 App Router + TypeScript | `chatbot/` only |
| Landing framework | **Astro 6** + TypeScript + Tailwind CSS 4 | `landing/` only |
| Styling | Tailwind CSS | All apps |
| ORM | Drizzle ORM | `crm/` (and chatbot once DB is added) |
| Database | Supabase (PostgreSQL) | `crm/` |
| Auth | Supabase SSR | `crm/` |
| WhatsApp | Kapso SDK | `chatbot/` — v2 only |
| AI | Vercel AI SDK + Claude claude-sonnet-4-6 | `chatbot/` |
| UI components | shadcn/ui | `crm/` |
| Hosting | Vercel | All apps |
| Monorepo | Plain folders | No Turborepo |
