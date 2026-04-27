# Chatbot — Claude Instructions

> This app is part of the NeoVet monorepo. Read the root `CLAUDE.md` first — it contains business context, the urgency system (L1–L4), the v1/v2/v3 rule, the language policy, and cross-cutting constraints that apply here.

---

## What This App Is

Conversational assistant for NeoVet clinic clients. Runs on two channels:

- **v1 web widget** — deployed at `neo-vet-widget.vercel.app`, embedded as iframe in `landing/`. FAQ-only, stateless.
- **v2 WhatsApp bot** — under active development since 2026-04-22. Transactional (real appointment booking against the CRM) via Kapso. The v2 scope was accelerated after the 2026-04-22 Paula meeting made the original v1 stopgap auto-reply redundant (her WhatsApp Business already has one).

Both channels share this app. Different entry points (`src/app/page.tsx` for the widget, `src/app/api/whatsapp/webhook/route.ts` for WhatsApp), different system prompts, different tool access.

---

## Stack

| Layer | Tool | Used by |
|-------|------|---------|
| Framework | Next.js 16 App Router + TypeScript | both |
| Styling | Tailwind CSS | web widget |
| AI | Vercel AI SDK + Claude claude-sonnet-4-6 | both |
| WhatsApp provider | Kapso (Meta Cloud API on top) | v2 only |
| Persistence | Supabase (shared with CRM — `bot_contacts`, `bot_conversations`, `bot_messages`) | v2 only |
| Hosting | Vercel | both |
| Error tracking | Sentry (`@sentry/nextjs`) — project `ravena/neovet-chatbot` | both |

**Still not in scope:**
- No Drizzle ORM — v2 uses `@supabase/supabase-js` directly (schema lives in the CRM app)
- No session replay on the widget (widget messages can include pet names / owner details)

---

## v1 web widget — deployed

Deployed at `neo-vet-widget.vercel.app`. Embedded as iframe on the landing page. Awaiting Paula's FAQ content approval.

- Bottom-right toggle on the landing page
- Answers FAQs only: clinic hours, services, location, how to book
- Stateless — refresh clears the chat
- Tells clients how to book (by phone/WhatsApp with staff) — does not book for them
- Uses AI SDK `streamText` with [src/lib/prompts/system.ts](src/lib/prompts/system.ts) as the hardcoded system prompt
- Rate limited (20 req/min/IP, in-memory) via [src/lib/rate-limit.ts](src/lib/rate-limit.ts)
- Endpoint: [src/app/api/chat/route.ts](src/app/api/chat/route.ts)

**Hard boundaries for the web widget:**
- No CRM API calls from the widget
- No booking from the widget (deliberate — keeps v1 safe while v2 builds)
- No urgency triage UI (the L1–L4 escalation story lives in the WhatsApp channel)

---

## v2 WhatsApp bot — under active development

Shipped MVP on 2026-04-22 across 11 commits (`bd12b70` … `f2ddbe3`). Webhook is live on Kapso, but we have not yet done end-to-end verification on Paula's production number — Franco is prototyping against his own number.

### Architecture

- **Entry point:** [src/app/api/whatsapp/webhook/route.ts](src/app/api/whatsapp/webhook/route.ts)
  - `GET` → health check (`{ ok: true, service: "NeoVet WhatsApp Bot" }`) — used by Kapso for webhook verification
  - `POST` → receives Kapso's webhook payload (`message`, `conversation`, `phone_number_id`), filters non-text messages, runs L4 fast-path, invokes the agent for L1–L3, sends reply back via Kapso API
- **Agent:** [src/lib/whatsapp/agent.ts](src/lib/whatsapp/agent.ts)
  - Uses AI SDK `generateText` (not `streamText` — WhatsApp isn't streaming)
  - `maxSteps: 10`, `maxTokens: 1024`
  - Injects the sender phone into the first user message so tools can auth against it
  - L4 keyword list hardcoded here — **15 keywords** (expanded from the 12 documented in the root CLAUDE.md: added `ahogando`, `sin pulso`, plus accentless variants `convulsion`, `obstruccion`, `se esta muriendo`). See the L4-keyword-expansion task — Paula dictated more symptom patterns at the 2026-04-22 meeting that still need to be merged in.
- **Session layer:** [src/lib/whatsapp/session.ts](src/lib/whatsapp/session.ts)
  - `getOrCreateSession(phone)` — finds or creates a `bot_contact`, then finds an active conversation newer than 60 min or creates one, then loads message history
  - `saveMessage(conversationId, role, content)` — persists each turn
  - `escalateConversation(conversationId)` — flips `status` to `escalated`, `urgency_level` to `4`
  - Uses **service-role** Supabase client — bypasses RLS
- **System prompt:** [src/lib/prompts/whatsapp-system.ts](src/lib/prompts/whatsapp-system.ts) — separate from the web widget prompt; describes the 4-step booking flow and the tool contract
- **Tools** (5, all in `src/lib/whatsapp/tools/`):
  - `buscarCliente` — lookup existing client by phone (calls CRM `GET /api/bot/clients?phone=…`)
  - `crearClienteYPaciente` — register new client + first pet (calls CRM `POST /api/bot/clients`)
  - `obtenerServicios` — list active services (calls CRM `GET /api/bot/services`)
  - `verificarDisponibilidad` — find open slots on a date (calls CRM `GET /api/bot/availability`)
  - `reservarTurno` — create the appointment (calls CRM `POST /api/bot/appointments`)

### Environment variables (v2 bot)

- `KAPSO_API_KEY` — sent as `X-API-Key` header when calling `api.kapso.ai`
- `CRM_URL` — base URL of the CRM deployment (the bot is a CRM client)
- `BOT_API_KEY` — `Authorization: Bearer <key>` for every CRM call
- `ANTHROPIC_API_KEY` — Claude Sonnet 4.6 via AI SDK
- `NEXT_PUBLIC_SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` — direct Supabase writes for the session layer

### Kapso notes (from Franco's 7 fix-commits on 2026-04-22)

- Send endpoint: `POST https://api.kapso.ai/meta/whatsapp/v24.0/{phone_number_id}/messages` (took several iterations to land on)
- Auth header is `X-API-Key` (NOT `Authorization: Bearer`)
- The `to` field must have all non-digits stripped (`phone.replace(/\D/g, "")`)
- Inbound payload shape: `{ message: { id, from, text: { body }, type, timestamp }, conversation: { id, status }, phone_number_id, test? }`
- The webhook returns the Kapso response status/body in its JSON — left in for observability, not a security issue because the endpoint is Kapso-only

### Hard boundaries (still in effect)

- No urgency auto-downgrade — `urgency_level` only ever goes up automatically (see root CLAUDE.md urgency rules)
- No L3 image analysis yet
- No reminder outbound (still email-only via Resend from the CRM)
- No admin UI in the CRM for conversation inspection — `/dashboard/bot` is Fase A work, not done

---

## Patterns to Follow

- All chatbot responses must be in **Argentine Spanish**
- Web widget: `streamText`; WhatsApp: `generateText` (no streaming on WhatsApp)
- Keep system prompts grounded in real clinic data — do not hallucinate services, hours, or prices
- L4 detection runs **before** the AI call. If you touch the keyword list in `agent.ts`, also update the system prompt's "Urgencias" section so the list matches — they are currently hand-kept in sync.
- Never block the L4 fast-path on telemetry, DB writes, or any I/O that can stall. L4 replies must be sub-second even if Supabase is down.
- CRM tool calls must use `Authorization: Bearer ${BOT_API_KEY}` — Franco's 2026-04-22 `fix(chatbot): fix auth header in all CRM tools` commit was a cleanup pass; keep the pattern consistent if you add tools.

---

## Observability (Sentry) — Phase T1b

Installed 2026-04-20 following the same privacy-first pattern as the CRM. Sentry org `ravena`, project `neovet-chatbot`. Tunnel route at `/monitoring` to survive ad-blockers on the embedded widget.

- `src/instrumentation.ts` — Next.js boot hook; loads the right config per `NEXT_RUNTIME` and re-exports `onRequestError`.
- `src/instrumentation-client.ts` — browser SDK. **No session replay** (widget messages may contain pet names / personal info), `sendDefaultPii: false`.
- `src/sentry.server.config.ts` — Node runtime. `sendDefaultPii: false`, `includeLocalVariables: false`, `beforeSend` drops Next.js control-flow errors (`NEXT_REDIRECT` / `NEXT_NOT_FOUND`).
- `src/sentry.edge.config.ts` — edge runtime.
- `src/app/global-error.tsx` — React render-crash boundary.
- `next.config.ts` wraps in `withSentryConfig`.

When turning on v2 features (L3 symptom analysis, user data), reconsider the `sendDefaultPii` and session-replay flags — the risk calculus changes once the widget handles medical content.

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
