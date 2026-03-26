# Project Charter — NeoVet Chatbot

| Field | Value |
|---|---|
| **Project name** | NeoVet Chatbot |
| **Client** | NeoVet (Paula Silveira) |
| **Client contact** | Paula Silveira — clinic owner |
| **Internal owner** | Tomás Pinolini |
| **Tech lead** | Franco Zancocchia |
| **Start date** | 2026-03-01 |
| **Target delivery (v1)** | <!-- YYYY-MM-DD --> |
| **Charter version** | 1.0 |
| **Last updated** | 2026-03-26 |

---

## Problem Statement

Paula Silveira's veterinary clinic receives a high volume of repetitive WhatsApp messages daily — clients asking about hours, services, prices, and how to book appointments. Receptionists spend significant time answering the same questions manually, leaving less time for in-clinic patient care. There is no self-service channel for clients and no way to automate responses.

---

## Proposed Solution

An AI-powered conversational assistant that answers common client questions automatically. v1 delivers via a web chat widget. The bot handles FAQs (hours, services, location, how to book) and makes zero changes to any system — fully read-only and stateless. WhatsApp delivery and appointment booking are deferred to v2.

---

## Scope

### In scope (v1)

- Web chat widget
- FAQ responses: clinic hours, services offered, location, how to book, pricing
- Argentine Spanish responses
- Powered by Claude claude-sonnet-4-6 via Vercel AI SDK

### Out of scope (v1)

- WhatsApp channel (v2)
- Appointment booking or cancellation (v2)
- CRM integration or API calls (v2)
- User data storage or conversation history
- Urgency triage system (L1–L4) — v2
- Image analysis

### Assumptions

- Paula will provide the complete FAQ content (hours, services, prices, location) before the build phase begins
- The web widget will be embedded on the landing site or hosted at a standalone URL

---

## Deliverables

| # | Deliverable | Owner | Status |
|---|---|---|---|
| D1 | Web chat widget live at a public URL | Franco | Pending |
| D2 | Correct FAQ responses in Argentine Spanish | Franco | Pending |
| D3 | Seeded system prompt with Paula's real clinic data | Tomás + Paula | Pending |

---

## Timeline

| Phase | Description | Status |
|---|---|---|
| Discovery | Requirements, FAQ content gathering from Paula | In progress |
| Build | Chatbot implementation | Pending |
| QA | End-to-end FAQ testing | Pending |
| Launch | Deploy to Vercel | Pending |

---

## Risks

| # | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| R1 | Paula delays providing FAQ content | Medium | High | Block build phase until content is received |
| R2 | Scope creep into appointment booking | Medium | Medium | Enforce v1/v2 boundary, require explicit version upgrade to proceed |

---

## Success Criteria

- Bot responds correctly to at least 10 common FAQ questions in Argentine Spanish
- Response time under 3 seconds for 95% of messages
- Paula reviews and approves the FAQ responses before launch
