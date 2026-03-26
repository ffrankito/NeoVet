# Documentation Structure — Design Spec

**Date:** 2026-03-22
**Status:** Approved
**Author:** Tomas

---

## Context

NeoVet is a WhatsApp chatbot and appointment management system for a veterinary clinic specializing in brachycephalic breeds (bulldogs). The project is at the end of Week 1 of a 4-week MVP plan. A documentation audit of a sibling project (bot_admin) identified critical gaps — missing developer setup guide, no ADRs for key decisions, corrupted root README, incomplete `.env.example` — all of which are avoidable here by establishing the right structure from the start.

**Audience:** The primary developer (Tomas) + one technical collaborator joining the project.

---

## Goals

- A new technical collaborator can go from zero to running locally without asking Tomas anything
- Every significant architectural decision is recorded in an ADR at the time it is made
- The planning paradigm (research → spec → plan → execute) is established from Week 1
- The structure mirrors the bot_admin docs (proven) but is right-sized for the current stage

---

## Language Policy

| Document type | Language |
|---|---|
| Architecture, ADRs, domain maps, developer setup, roadmap | English |
| Schema changelog, session logs | Spanish |

This policy is documented in `docs/README.md`. Each file spec below notes the expected language at the point of use.

---

## Directory Structure

```
docs/
├── README.md                          ← project index + language policy
├── developer-setup.md                 ← onboarding guide
├── roadmap.md                         ← phase status + tech debt backlog
├── schema-changelog.md                ← DB migration history (Spanish)
│
├── architecture/
│   ├── README.md                      ← ADR index table
│   ├── template.md                    ← ADR template
│   ├── workspace.dsl                  ← C4 architecture diagram (Structurizr DSL)
│   ├── ADR-001-ai-provider-claude.md
│   ├── ADR-002-whatsapp-kapso.md
│   ├── ADR-003-webhook-fast-200-pattern.md
│   ├── ADR-004-database-drizzle-supabase.md
│   ├── ADR-005-urgency-system-l1-l4.md
│   └── ADR-006-auth-supabase-ssr.md
│
├── domain/
│   ├── README.md                      ← domain map index
│   ├── entity-map.md                  ← ER diagram (Mermaid)
│   ├── whatsapp-webhook-flow.md       ← webhook pipeline flow
│   ├── agent-conversation-flow.md     ← placeholder (Week 2)
│   └── escalation-flow.md             ← placeholder (Week 2)
│
└── superpowers/
    ├── README.md                      ← planning paradigm description
    ├── research/
    │   └── README.md                  ← research log index (placeholder)
    ├── specs/
    │   └── README.md                  ← spec index (placeholder)
    └── plans/
        └── architecture-phase1.md     ← moved from docs/plans/
```

---

## File Specifications

### `docs/README.md`
**Language:** English

The entry point for any collaborator. Contains:
- 2-sentence description of what the project is
- Current phase and completion status (e.g., "Phase 1 — Week 1/4 complete")
- Language policy table (reproduced from this spec)
- Navigation table: section name / file path / what it contains

### `docs/developer-setup.md`
**Language:** English

The highest-value document. A technical collaborator must be able to run the project locally using only this file. Sections:

1. **What this project is** — 2-sentence description of the system
2. **Repository structure** — annotated tree of `src/`, `docs/`, config files at the project root
3. **Prerequisites** — Node.js 22+, npm, Supabase account, Kapso account
4. **Environment variables** — full table with columns: `Variable` / `Purpose` / `How to obtain` / `Required?`. Variables: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `KAPSO_WEBHOOK_SECRET`, `ANTHROPIC_API_KEY`, and any others present in the actual `.env.local`
5. **Database setup** — create a Supabase project, run `npx drizzle-kit migrate`, verify the 7 tables appear in the Supabase dashboard
6. **Running locally** — `npm install`, `npm run dev`, expected output (Next.js dev server on port 3000)
7. **Kapso webhook setup** — how to configure Kapso to POST to `<your-url>/api/webhook`, how to set the HMAC secret, how to verify the signature is working (expected log output on a test message)
8. **Running tests** — what tests exist, how to run them (`npm test`), note that tests run against a real Supabase database and `SUPABASE_SERVICE_ROLE_KEY` must be set
9. **Deploying** — *stub at this stage*: note that deployment is via Vercel, link to Vercel docs for env var setup, and state that a full deployment runbook will be added when the project reaches production

### `docs/roadmap.md`
**Language:** English

Contains:
- Phase status table with columns: Phase / Description / Status (✅ / ⏳ / 🔜)
  - Phase 1: WhatsApp webhook + DB schema + Kapso integration
  - Phase 2: AI agent core (conversation, FAQ, booking flow)
  - Phase 3: Admin dashboard
  - Phase 4: Appointment sync + G-Vet integration
- Tech debt backlog table with columns: ID / Description / Severity / Status / Recommended action

### `docs/schema-changelog.md`
**Language:** Spanish

Chronological log of every database migration. One entry per migration with: date, migration filename, description of what changed, and reason for the change.

### `docs/architecture/README.md`
**Language:** English

An index table of all ADRs with columns: ADR number / title / status / date. One row per ADR file. Updated every time a new ADR is added.

### `docs/architecture/template.md`
**Language:** English

Standard ADR template with the following sections:
- Title (as `# ADR-NNN — Title`)
- Date
- Status (one of: `Proposed` / `Accepted` / `Implemented` / `Deferred` / `Deprecated`)
- Context — the situation that forced this decision
- Decision — what was decided, stated clearly
- Alternatives Considered — what else was evaluated and why it was not chosen
- Consequences — what becomes easier, what becomes harder, any known limitations

Status definitions:
- `Proposed` — decision under consideration, not yet committed
- `Accepted` — decision made, not yet implemented
- `Implemented` — decision made and fully deployed to production
- `Deferred` — decision made but implementation is pending a future phase
- `Deprecated` — superseded by a newer ADR (note the superseding ADR number)

### `docs/architecture/workspace.dsl`
**Language:** English (Structurizr DSL)

A C4 model diagram using Structurizr DSL syntax. Scope: system context and container level for Phase 1. Contains:
- **People:** Clinic staff (WhatsApp), Admin (web dashboard — future)
- **External systems:** WhatsApp (via Kapso), Anthropic Claude API, Supabase
- **Software system:** NeoVet
- **Containers:** Next.js App (web + API), Supabase PostgreSQL database, Kapso webhook layer

This file is a living document — updated as new containers are added (e.g., the admin dashboard in Phase 3). It is rendered via the Structurizr CLI or the Structurizr online editor.

### Seed ADRs
**Language:** English

All six ADRs follow the template defined in `docs/architecture/template.md`.

| File | Decision | Status | Key content note |
|------|----------|--------|-----------------|
| ADR-001-ai-provider-claude.md | Vercel AI SDK + Claude claude-sonnet-4-6 | Accepted | Rationale: native TypeScript SDK, streaming support, tool use for agent phase |
| ADR-002-whatsapp-kapso.md | Kapso as WhatsApp integration layer | Accepted | Rationale: webhook-based, no polling required, HMAC verification built in |
| ADR-003-webhook-fast-200-pattern.md | Fast-200 return + `waitUntil()` for background processing | Accepted | Must include known limitation: currently awaited inline in `src/app/api/webhook/route.ts:44`; true background execution requires explicit Vercel edge runtime declaration |
| ADR-004-database-drizzle-supabase.md | Drizzle ORM + Supabase PostgreSQL | Accepted | Rationale: type-safe schema, migration-first workflow, Supabase for managed Postgres + realtime |
| ADR-005-urgency-system-l1-l4.md | Urgency levels L1–L4, one-directional, L4 keyword fast-path | Accepted | Must document: levels can only increase, never auto-downgrade; L4 bypasses AI entirely for speed |
| ADR-006-auth-supabase-ssr.md | Supabase SSR Auth for admin dashboard | Proposed | Decision made in architecture plan but not yet implemented; implementation begins Phase 3 |

### `docs/domain/README.md`
**Language:** English

An index of all domain map files. One table with columns: file / what it shows / status (complete / placeholder). Updated as new flows are added.

### `docs/domain/entity-map.md`
**Language:** English

A Mermaid `erDiagram` covering all 7 current tables:
- `contacts`
- `conversations`
- `messages`
- `appointments`
- `availability_rules`
- `business_context`
- `urgency_escalations`

Include foreign key relationships:
- `contacts` 1--N `conversations`
- `conversations` 1--N `messages`
- `contacts` N--N `appointments` (via contact_id)
- `conversations` N--N `appointments` (via conversation_id)
- `conversations` 1--N `urgency_escalations`
- `messages` N--N `urgency_escalations`

Include a lifecycle note: urgency level is one-directional (L1 → L4 only, never downgraded).

### `docs/domain/whatsapp-webhook-flow.md`
**Language:** English

A Mermaid `flowchart` or `sequenceDiagram` covering the current webhook pipeline:
1. Kapso receives WhatsApp message → POSTs to `/api/webhook`
2. HMAC-SHA256 signature verified
3. Return `200 OK` immediately (fast-200 pattern)
4. Background: upsert contact, upsert conversation, insert message
5. Background: (stub) agent processing — to be expanded Week 2

Include an "Open Questions" section noting what is deferred to Week 2: agent response, outbound Kapso message send.

### `docs/domain/agent-conversation-flow.md` and `docs/domain/escalation-flow.md`
**Language:** English

Both are scaffolded as placeholder files at this stage. Content:
```
# [Flow Name]

**Status:** Placeholder — to be written in Week 2 when the agent module is built.
```

### `docs/superpowers/README.md`
**Language:** English

Describes the planning paradigm used for all features from Week 2 onward:

1. **Research** — analysis of options, security review, architecture evaluation. Saved to `superpowers/research/YYYY-MM-DD-<topic>.md`
2. **Spec** — approved design document. Saved to `superpowers/specs/YYYY-MM-DD-<topic>-design.md`
3. **Plan** — implementation plan with tasks and checkbox subtasks. Saved to `superpowers/plans/YYYY-MM-DD-<topic>.md`
4. **Execute** — implementation against the plan

Include a note: "Every feature of non-trivial scope (more than a single file change) goes through this process."

### `docs/superpowers/research/README.md` and `docs/superpowers/specs/README.md`
**Language:** English

Both are scaffold placeholders at this stage. Content:
```
# [Research|Specs] Index

| File | Topic | Date |
|------|-------|------|
| (none yet) | | |
```
Updated as files are added to each directory.

### `docs/superpowers/plans/architecture-phase1.md`
The existing file at `docs/plans/architecture-phase1.md` is moved to `docs/superpowers/plans/architecture-phase1.md` without content changes. No new content is written — this is a file move only. After the move, `docs/plans/` is deleted.

### `.env.example` (project root)
**Language:** English

Documents all required and optional environment variables. Format: one variable per line with an inline comment. Groups separated by blank lines with a section comment. Required variables have placeholder values (e.g., `your-supabase-url-here`). Optional variables are commented out.

```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-project-url.supabase.co   # REQUIRED
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key             # REQUIRED
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key         # REQUIRED

# Kapso (WhatsApp)
KAPSO_WEBHOOK_SECRET=your-hmac-secret                   # REQUIRED

# Anthropic (AI)
ANTHROPIC_API_KEY=your-api-key                          # REQUIRED
```

Must stay in sync with the environment variables table in `docs/developer-setup.md`.

---

## What is NOT included (intentionally deferred)

- `docs/sessions/` directory — created when the first significant development session happens
- `docs/references/` directory — created when there is a reference document to store
- Phase 2–4 ADRs — written at the time each decision is made
- Content for `agent-conversation-flow.md` and `escalation-flow.md` — written in Week 2

---

## Success Criteria

- A technical collaborator with zero prior context can run the project locally using only `docs/developer-setup.md`
- Every architectural decision made from this point onward has an ADR written at the time of the decision
- The planning paradigm is used for every feature of non-trivial scope from Week 2 onward
- All cross-document ADR references use the format `ADR-NNN` and match a file that exists in `docs/architecture/`
