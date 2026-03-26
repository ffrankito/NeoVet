# NeoVet

Software product for a veterinary clinic in Argentina. Monorepo with 3 independent apps.

---

## Apps

| App | Stack | Description | README |
|-----|-------|-------------|--------|
| `crm/` | Next.js 14, Drizzle, Supabase | Internal staff tool — clients, patients, appointments | [→ crm/README.md](./crm/README.md) |
| `chatbot/` | Next.js 14, Vercel AI SDK, Claude | Conversational FAQ assistant (web widget) | [→ chatbot/README.md](./chatbot/README.md) |
| `landing/` | Astro 6, Tailwind CSS 4 | Single-page marketing site (anchor nav, WhatsApp CTAs) | [→ landing/README.md](./landing/README.md) |

Each app is independent. Set up and run them separately.

---

## Docs

| Location | Contents |
|----------|----------|
| `docs/standards/` | Documentation templates — charter, technical spec, ADR, handoff |
| `chatbot/docs/` | Chatbot architecture, ADRs, charter, technical spec |
| `crm/docs/` | CRM charter, technical spec |
| `landing/docs/` | Paula interview checklist, optimization overview, ADRs |

---

## Key Decisions

- **v1:** Each app works standalone, no cross-app integrations
- **v2:** Chatbot ↔ CRM API + WhatsApp channel
- All user-facing text is in Argentine Spanish
- See root `CLAUDE.md` for full business context and constraints
