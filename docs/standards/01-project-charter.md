# Project Charter
<!--
  INSTRUCTIONS FOR USE
  ────────────────────
  Fill this document during or immediately after the discovery call.
  It becomes the written contract between the agency and the client
  BEFORE any code is written. Both parties should review and sign off.

  Fields marked [REQUIRED] must be completed before the build phase begins.
  Fields marked [OPTIONAL] should be filled when the information is available.

  Store this file at: docs/charter.md in the project repository.
-->

---

## 1. Project Identity

| Field | Value |
|---|---|
| **Project name** | <!-- e.g., "AI Receptionist for Acme Dental" --> |
| **Client company** | |
| **Client contact** | <!-- Name, role, email, phone --> |
| **Internal owner** | <!-- Team member responsible for delivery --> |
| **Project ID** | <!-- e.g., PRJ-2026-001 — assign from your internal registry --> |
| **Start date** | <!-- YYYY-MM-DD --> |
| **Target delivery date** | <!-- YYYY-MM-DD --> |
| **Charter version** | 1.0 |
| **Last updated** | <!-- YYYY-MM-DD --> |

---

## 2. Problem Statement [REQUIRED]

<!--
  Describe the specific problem the client has today in 2–4 sentences.
  Write this from the client's perspective, not the solution perspective.
  This section is the "why we're building this." If you can't fill it,
  you need another discovery call.
-->

> *Example: "Acme Dental's front desk receives 80+ calls per day, 40% of which are appointment bookings. Receptionists spend 3 hours daily on phone handling instead of in-clinic support. After hours, calls go unanswered and potential patients are lost."*

**Problem:**


---

## 3. Proposed Solution [REQUIRED]

<!--
  Describe what you are building in plain language.
  One paragraph. No technical jargon.
-->

**Solution:**


---

## 4. Scope [REQUIRED]

### 4.1 In scope

<!--
  List every feature or capability that is explicitly included.
  Be specific — vague scope leads to scope creep disputes.
  Example items:
  - Voice bot that handles appointment booking, cancellation, and rescheduling
  - Integration with Jane App scheduling system via REST API
  - Spanish and English language support
  - Handoff to human agent when confidence < threshold
-->

-
-
-

### 4.2 Out of scope

<!--
  Explicitly list what is NOT included.
  This is as important as what IS included.
  Example items:
  - No live human escalation queue (clients handles this separately)
  - No integration with billing or insurance systems
  - No mobile app — web dashboard only
-->

-
-
-

### 4.3 Assumptions

<!--
  List assumptions the project relies on.
  If any assumption turns out to be false, scope or timeline may change.
  Example:
  - Client's scheduling system has a documented REST API with sandbox environment
  - Client will provide test credentials within 5 business days of contract signing
  - Client's call volume does not exceed 200 calls/day during the project
-->

-
-
-

---

## 5. Deliverables [REQUIRED]

<!--
  Each deliverable should be concrete, testable, and have an owner and due date.
-->

| # | Deliverable | Description | Owner | Due date | Status |
|---|---|---|---|---|---|
| D1 | | | | | Pending |
| D2 | | | | | Pending |
| D3 | | | | | Pending |

---

## 6. Budget & Billing [REQUIRED]

| Field | Value |
|---|---|
| **Billing model** | <!-- Fixed fee / Time & materials / Retainer / Milestone --> |
| **Agreed total fee** | <!-- e.g., USD 8,500 --> |
| **Currency** | |
| **Payment schedule** | <!-- e.g., 50% upfront, 50% on delivery --> |
| **Invoice cadence** | <!-- e.g., Monthly / On milestone / On delivery --> |
| **Late payment terms** | <!-- e.g., Net 15, 1.5% monthly interest --> |

### 6.1 Milestone payments (if applicable)

| Milestone | Amount | Trigger condition | Due date |
|---|---|---|---|
| Kickoff / Upfront | | Contract signed | |
| Mid-project | | | |
| Delivery | | Client acceptance | |

### 6.2 Out-of-scope billing

<!--
  Describe how out-of-scope work will be handled.
  Example: "Additional work outside this scope will be quoted separately
  at $X/hour and requires written approval before execution."
-->


---

## 7. Timeline [REQUIRED]

<!--
  High-level phases. Detailed tasks belong in the project management tool.
-->

| Phase | Description | Start | End | Status |
|---|---|---|---|---|
| Discovery | Requirements finalization, access setup | | | |
| Design | Technical spec, architecture decisions | | | |
| Build | Development sprints | | | |
| QA | Internal testing, bug fixes | | | |
| UAT | Client acceptance testing | | | |
| Launch | Production deployment | | | |
| Handoff | Documentation, training, support period | | | |

---

## 8. Stakeholders & Communication

| Role | Name | Contact | Responsibilities |
|---|---|---|---|
| Client decision maker | | | Final approval, scope changes |
| Client technical contact | | | API access, system credentials |
| Agency project lead | | | Day-to-day delivery, client comms |
| Agency tech lead | | | Architecture, code review |

### 8.1 Communication cadence

| Channel | Frequency | Purpose |
|---|---|---|
| <!-- e.g., Slack / WhatsApp --> | | Daily async updates |
| Video call | <!-- e.g., Weekly --> | Sprint review, blockers |
| Email | As needed | Formal decisions, scope changes |

---

## 9. Risks [REQUIRED]

<!--
  Identify risks early. Each risk needs a likelihood, impact, and mitigation.
-->

| # | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| R1 | Client API or integration not available as expected | Medium | High | Require sandbox access before build phase starts |
| R2 | Scope expansion without formal change request | Medium | High | Any new request triggers a written change order |
| R3 | | | | |
| R4 | | | | |

---

## 10. Success Criteria [REQUIRED]

<!--
  How do we know the project succeeded? Be measurable.
  These criteria define when the client signs off and the final payment is triggered.
  Example:
  - Bot handles appointment booking end-to-end with < 5% error rate in UAT
  - Response time < 2s for 95th percentile of requests
  - Client completes UAT checklist with no P1 bugs open
-->

-
-
-

---

## 11. Change Management

<!--
  Any change to scope, timeline, or budget must follow this process.
-->

Changes are defined as any addition, removal, or modification to the scope defined in Section 4. The process is:

1. Client or agency identifies a change and describes it in writing (email or message thread).
2. Agency estimates impact on timeline and cost within 2 business days.
3. Both parties sign off on the change in writing before any work begins.
4. This charter is updated (version bumped) to reflect the approved change.

---

## 12. Sign-off

| Role | Name | Date | Signature |
|---|---|---|---|
| Client | | | |
| Agency | | | |

---

*This charter supersedes all prior verbal agreements. Changes require a new version with both parties' written approval.*
