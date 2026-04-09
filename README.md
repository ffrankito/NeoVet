# NeoVet

Software product for a veterinary clinic in Argentina. Monorepo with 3 independent apps.

---

## Apps

| App | Stack | Description | README |
|-----|-------|-------------|--------|
| `crm/` | Next.js 16, Drizzle, Supabase, Resend | Internal staff tool — clients, patients, appointments, hospitalizations, procedures, clinical history, estética, pet shop, cash register, consent documents, charges & debtors, email reminders | [→ crm/README.md](./crm/README.md) |
| `chatbot/` | Next.js 16, Vercel AI SDK, Claude | Conversational FAQ assistant (web widget, deployed) | [→ chatbot/README.md](./chatbot/README.md) |
| `landing/` | Astro 6, Tailwind CSS 4 | Single-page marketing site (anchor nav, WhatsApp CTAs) | [→ landing/README.md](./landing/README.md) |

Each app is independent. Set up and run them separately.

---

## Docs

| Location | Contents |
|----------|----------|
| `docs/standards/` | Documentation templates — charter, technical spec, ADR, handoff |
| `chatbot/docs/` | Chatbot architecture, ADRs, charter, technical spec |
| `crm/docs/roadmap.md` | CRM multi-version roadmap (v1 / v2 / v3) |
| `crm/docs/v1/` | CRM v1 charter, technical spec, development plan, handoff |
| `landing/docs/` | Paula interview checklist, optimization overview, ADRs |

---

## Key Decisions

- **v1:** Each app works standalone, no cross-app integrations
- **v2:** Chatbot ↔ CRM API + WhatsApp channel
- All user-facing text is in Argentine Spanish
- See root `CLAUDE.md` for full business context and constraints
