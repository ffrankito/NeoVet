# Project Standards

This folder contains the documentation standards used by the agency for all client-facing AI projects. Every new project should produce at least the documents marked **required** before entering the build phase.

## Contents

| Document | Purpose | Required |
|---|---|---|
| `01-project-charter.md` | Defines scope, stakeholders, budget, and success criteria before any work begins | Yes |
| `02-technical-spec.md` | Defines the system architecture, integrations, data model, and delivery contracts | Yes |
| `03-adr-template.md` | Architecture Decision Record — documents every significant technical decision | Per decision |
| `04-client-handoff.md` | Deployment checklist, credentials handover, and post-launch support boundaries | Yes |

## When to use each

```
Discovery call
    └── fill 01-project-charter.md (scope, budget, timeline)
        └── Technical design
            └── fill 02-technical-spec.md
                └── One ADR (03) per major architectural decision
                    └── Build phase
                        └── At launch: fill 04-client-handoff.md
```

## Standards that apply across all projects

- All dates in ISO 8601 (YYYY-MM-DD or YYYY-MM-DDTHH:mm:ssZ).
- All monetary values stored as integer cents in the database; displayed as formatted currency in the UI.
- All database IDs are prefixed strings (e.g., `co_`, `prj_`, `mtg_`), never auto-increment integers.
- Soft deletes (`deleted_at timestamptz`) for all user-facing entities.
- Every async background task must have: idempotency guard, status field, and a `failed` terminal state visible to the user.
- Secrets never committed to git. All secrets documented in `.env.example` with placeholder values and a description comment.
