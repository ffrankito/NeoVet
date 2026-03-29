# Chatbot — Claude Instructions

> This app is part of the NeoVet monorepo. Read the root `CLAUDE.md` first — it contains business context, the urgency system (L1–L4), the v1/v2/v3 rule, the language policy, and cross-cutting constraints that apply here.

---

## What This App Is

Conversational assistant for NeoVet clinic clients. v1 delivers via a web widget. WhatsApp (via Kapso) is v2.

---

## Stack

| Layer | Tool |
|-------|------|
| Framework | Next.js 14 App Router + TypeScript |
| Styling | Tailwind CSS |
| AI | Vercel AI SDK + Claude claude-sonnet-4-6 |
| Hosting | Vercel |

**Not in this app's stack in v1:**
- No Drizzle ORM or database — the chatbot is stateless in v1
- No Kapso SDK — WhatsApp is v2 only

---

## v1 Scope

- Web chat widget (standalone URL or embedded on the landing page)
- Answers FAQs only: clinic hours, services, location, how to book
- Makes zero changes to any system — read-only, stateless
- Tells clients how to book (by phone/WhatsApp with staff) — does not book for them

**Hard boundaries for v1 — do not implement without explicitly upgrading the version target:**

- No WhatsApp / Kapso integration
- No CRM API calls
- No appointment booking or cancellation
- No user data stored
- No urgency triage (L1–L4 system is v2, when the chatbot gains a DB and can escalate to staff)

---

## Patterns to Follow

- All chatbot responses must be in **Argentine Spanish**
- Use Vercel AI SDK `streamText` for chat responses
- Keep the system prompt grounded in real clinic data — do not hallucinate services, hours, or prices
- No tools, function calling, or system integrations in v1

---

## Database

The chatbot has **no database in v1**. It is a stateless web widget.

When a DB is added (v2), it will use Supabase and follow the same branching strategy as the CRM. The env switch pattern will be identical:
```bash
cp .env.development .env.local   # → preview DB
cp .env.production  .env.local   # → production DB
```

See root `CLAUDE.md` for the full branching strategy.

---

## Documentation Standards

Before creating any documentation artifact for this app, use the templates from `docs/standards/` at the monorepo root:

| When | Template | Output |
|------|----------|--------|
| New project or major initiative | `01-project-charter.md` | `chatbot/docs/charter.md` |
| Technical design phase | `02-technical-spec.md` | `chatbot/docs/technical-spec.md` |
| Significant technical decision | `03-adr-template.md` | `chatbot/docs/architecture/ADR-NNN-title.md` |
| Project delivery | `04-client-handoff.md` | `chatbot/docs/handoff.md` |

Check `chatbot/docs/architecture/` for existing ADRs (ADR-001–006) before proposing new architectural approaches.
