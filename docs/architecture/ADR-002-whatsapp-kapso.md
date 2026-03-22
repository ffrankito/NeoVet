# ADR-002 — WhatsApp Integration: Kapso

**Date:** 2026-03-22
**Status:** Accepted

---

## Context

The bot must receive and send WhatsApp messages on behalf of Paula's clinic. WhatsApp Business requires either the official Cloud API (Meta) or a third-party BSP (Business Solution Provider). Direct Meta integration involves significant setup complexity and approval processes. A TypeScript-first SDK was preferred to match the project stack.

## Decision

Use Kapso as the WhatsApp integration layer. Kapso handles the Meta BSP relationship, provides a webhook-based incoming message flow, and offers a TypeScript SDK compatible with the Vercel AI SDK.

## Alternatives Considered

| Option | Why rejected |
|--------|-------------|
| Meta WhatsApp Cloud API (direct) | Requires Meta Business verification, more complex setup, no managed TypeScript SDK |
| Twilio WhatsApp | Higher cost, heavier abstraction, less AI-SDK compatible |
| Baileys (unofficial WA library) | Unofficial, violates WhatsApp TOS, risk of number ban |

## Consequences

**Easier:** Webhook delivery, HMAC signature verification, and message formatting are handled by Kapso. Free tier covers 2,000 messages/month — sufficient for MVP.

**Harder:** Dependency on a third-party BSP. If Kapso changes pricing or API, migration effort required.

**Known limitations:** Kapso free tier limit (2k msgs/mo) must be monitored. Outbound message sending (`kapso/client.ts`) is not yet implemented — deferred to Week 2.
