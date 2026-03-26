# Client Handoff — NeoVet Chatbot

| Field | Value |
|---|---|
| **Project** | NeoVet Chatbot |
| **Client** | Paula Silveira |
| **Production URL** | <!-- TODO --> |
| **Handoff date** | <!-- YYYY-MM-DD --> |
| **Support period ends** | <!-- YYYY-MM-DD --> |

> This document is filled at project delivery. Most sections are placeholders until then.

---

## Pre-Launch Checklist

### Security
- [ ] `ANTHROPIC_API_KEY` rotated to production value
- [ ] No secrets committed to the repository
- [ ] `.env.example` up to date
- [ ] HTTPS enforced (Vercel default)
- [ ] Rate limiting in place on `/api/chat`

### Functionality
- [ ] Bot responds correctly to all FAQ categories in Argentine Spanish
- [ ] Response time under 3s for 95% of messages
- [ ] Error states show user-friendly Spanish messages, not stack traces
- [ ] Paula has reviewed and approved all FAQ responses

### Documentation
- [ ] This handoff document completed
- [ ] `README.md` accurate
- [ ] `technical-spec.md` reflects final implementation

### Access Transfer
- [ ] Paula has access to Vercel project
- [ ] Paula has access to Anthropic console (API key ownership)

---

## System Overview (for Paula)

<!-- TODO: fill at handoff -->

---

## Credentials

| System | Who holds it |
|---|---|
| Vercel | <!-- TODO --> |
| Anthropic API | <!-- TODO --> |

---

## Known Limitations (v1)

| Behavior | Explanation |
|---|---|
| Cannot book appointments | Appointment booking is v2. The bot tells clients to call or message the clinic directly. |
| WhatsApp not available | Web widget only in v1. WhatsApp is v2. |
| No conversation memory | Each session is stateless. The bot does not remember previous conversations. |
