# ADR-005 — Urgency System: L1–L4 One-Directional with L4 Keyword Fast-Path

**Date:** 2026-03-22
**Status:** Accepted

---

## Context

The clinic handles brachycephalic breeds that are prone to respiratory emergencies. A missed or delayed emergency escalation is a patient safety risk. The bot must reliably distinguish between general FAQ queries and life-threatening situations, and it must do so without depending on AI availability — if the AI is slow or unavailable, emergencies must still be detected.

## Decision

Implement a four-level urgency system (L1–L4) where:
- Levels can only increase, never auto-decrease (only staff can downgrade via the dashboard)
- L4 (emergency) is detected via a hardcoded keyword fast-path that runs **before** the AI agent, guaranteeing immediate escalation regardless of AI latency or availability

Levels:
| Level | Trigger | Bot action |
|-------|---------|------------|
| L1 | General info, prices, location | Answers automatically |
| L2 | Appointment booking | Runs booking flow |
| L3 | Symptom description or image | AI analyzes, flags for vet review |
| L4 | Emergency keywords | Keyword fast-path, immediate escalation, sends emergency contact |

L4 keywords (Spanish, Argentina): convulsión, no respira, atropellado, envenenado, sangrado, no reacciona, desmayado, golpe fuerte, obstrucción, emergencia, urgente, se está muriendo.

## Alternatives Considered

| Option | Why rejected |
|--------|-------------|
| AI-only triage (no keyword fast-path) | AI latency (1–3s) is unacceptable for life-threatening situations; AI could also misjudge or be unavailable |
| Single escalation flag (no levels) | Too coarse — staff need to prioritize their review queue |
| Bidirectional urgency (auto-downgrade after inactivity) | Risk of masking a real emergency; downgrade must be a conscious human decision |

## Consequences

**Easier:** L4 emergencies are guaranteed to escalate within milliseconds. The one-directional rule means the urgency state is always a conservative worst-case.

**Harder:** Staff must manually downgrade conversations after resolution. The keyword list requires maintenance as new emergency terms emerge.

**Known limitations:** The keyword list is hardcoded in Spanish (Argentina). Misspellings or alternate phrasings may bypass the fast-path. L3 AI-based triage is not yet implemented — deferred to Week 3.
