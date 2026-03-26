# Architecture Decision Record (ADR) Template
<!--
  INSTRUCTIONS FOR USE
  ────────────────────
  Create one ADR per significant technical decision.
  "Significant" means: if this decision were made differently,
  it would change the architecture, the cost structure, or the
  maintenance burden of the project.

  Trivial decisions (which library to use for date formatting,
  how to name a variable) do NOT need ADRs.

  Good candidates for ADRs:
  - Choice of database or ORM
  - Choice of AI provider or model
  - Authentication strategy
  - How background tasks are handled
  - How external integrations are polled vs. webhook-driven
  - Any decision where you rejected a reasonable alternative

  Naming convention: ADR-NNN-short-kebab-title.md
  Store in: docs/architecture/

  Once accepted, an ADR is immutable. If the decision changes,
  write a NEW ADR that supersedes the old one. Never edit a past ADR.
-->

---

# ADR-NNN — [Short Title]

| Field | Value |
|---|---|
| **Date** | <!-- YYYY-MM-DD --> |
| **Author** | |
| **Status** | <!-- Proposed / Accepted / Superseded by ADR-NNN --> |
| **Supersedes** | <!-- ADR-NNN or "None" --> |
| **Deciders** | <!-- Names of people involved in this decision --> |

---

## Context

<!--
  Describe the situation that requires a decision.
  What problem are we solving? What constraints exist?
  What was the specific trigger for this decision now?

  Write in past/present tense. This is the "why we needed to decide."
  Be specific — vague context makes the ADR useless as future reference.

  Example:
  "Fireflies.ai does not provide a webhook endpoint for new transcript
  notifications. The only integration option is polling their GraphQL API.
  We need to decide how often to poll, how to avoid processing duplicates,
  and how to handle the case where Fireflies is temporarily unavailable."
-->


---

## Decision

<!--
  State the decision clearly and directly. One or two sentences.
  This is the "what we decided."

  Example:
  "We will poll the Fireflies GraphQL API every 10 minutes using a
  Trigger.dev scheduled task. Deduplication is handled via
  onConflictDoNothing on the transcript ID column."
-->


---

## Alternatives Considered

<!--
  List every reasonable alternative you evaluated.
  For each: what it is, why it was appealing, and why it was rejected.
  The rejection rationale is what makes this section valuable —
  it prevents the same conversation from happening again in 6 months.
-->

### Option A — [Name]
**Description:**
**Why appealing:**
**Why rejected:**

### Option B — [Name]
**Description:**
**Why appealing:**
**Why rejected:**

---

## Consequences

<!--
  What are the trade-offs of the chosen approach?
  Be honest about the downsides — every decision has them.
  List both positive and negative consequences.
-->

**Positive:**
-
-

**Negative / Trade-offs:**
-
-

**Risks and mitigations:**
-
-

---

## Implementation Notes

<!--
  Optional. Concrete implementation details that aren't obvious.
  Code snippets, migration steps, or pointers to relevant files.
-->


---

## References

<!--
  Links to relevant documentation, tickets, discussions, or prior art.
-->

-
