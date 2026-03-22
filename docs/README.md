# NeoVet — Documentation

NeoVet is a WhatsApp chatbot and appointment management system for a veterinary clinic in Argentina specializing in bulldogs and brachycephalic breeds. This folder contains all project documentation.

**Current status:** Phase 1 — Week 1 complete (webhook + DB schema + Kapso integration)

---

## Language policy

| Document type | Language |
|---|---|
| Architecture, ADRs, domain maps, developer setup, roadmap | English |
| Schema changelog, session logs | Spanish |

---

## Structure

### `architecture/`
Architecture Decision Records (ADRs) — permanent records of every significant technical decision made in the project. Each ADR documents what was decided, why, and what alternatives were considered.

Start here if you want to understand *why* the project is built the way it is.

→ [ADR index](./architecture/README.md)

### `plans/`
Implementation plans and handoff documents.

| File | Description |
|------|-------------|
| [architecture-phase1.md](./plans/architecture-phase1.md) | Full Phase 1 blueprint: stack, schema, message flow, build order, environment variables |
| [week1-handoff.md](./plans/week1-handoff.md) | Step-by-step infrastructure setup guide for new developers |

### `superpowers/`
Planning artifacts following the **research → spec → plan → execute** paradigm. Every feature of non-trivial scope goes through this process before implementation begins.

| Folder | Contains |
|--------|----------|
| `research/` | Analysis documents: options reviewed, security assessments, architecture evaluations |
| `specs/` | Approved design specifications |
| `plans/` | Implementation plans with tasks and subtasks |

### `blueprints/` *(empty — reserved)*
Will contain reusable design blueprints for recurring patterns (e.g. new agent tools, new admin pages).

### `tools/` *(empty — reserved)*
Will contain documentation for developer tooling, scripts, and custom CLI commands.

---

## Where to start

| I want to... | Go to |
|---|---|
| Set up the project locally | [plans/week1-handoff.md](./plans/week1-handoff.md) |
| Understand the system architecture | [plans/architecture-phase1.md](./plans/architecture-phase1.md) |
| Understand a technical decision | [architecture/README.md](./architecture/README.md) |
| See what's planned for a new feature | [superpowers/specs/](./superpowers/specs/) |
