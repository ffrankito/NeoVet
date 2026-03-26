# NeoVet — Monorepo Documentation

NeoVet is a 3-app monorepo for a veterinary clinic in Argentina. This folder contains documentation that applies across the entire project.

**App-specific docs live inside each app:**
- `crm/docs/` — CRM architecture, charter, technical spec
- `chatbot/docs/` — Chatbot architecture, charter, technical spec, ADRs
- `landing/docs/` — Landing page decisions

---

## Language Policy

| Document type | Language |
|---|---|
| Architecture, ADRs, technical specs, developer setup | English |
| Session logs, client-facing content | Spanish |

---

## Structure

### `standards/`
Agency documentation templates. **Use these for every new project and every significant doc.**

| Template | Use when |
|----------|----------|
| [01-project-charter.md](./standards/01-project-charter.md) | Starting a new project or major initiative |
| [02-technical-spec.md](./standards/02-technical-spec.md) | Entering the design/build phase |
| [03-adr-template.md](./standards/03-adr-template.md) | Recording a significant technical decision |
| [04-client-handoff.md](./standards/04-client-handoff.md) | Delivering a project to the client |

### `superpowers/`
Planning artifacts: research → spec → plan → execute.

---

## Where to Start

| I want to... | Go to |
|---|---|
| Set up the chatbot locally | [chatbot/README.md](../chatbot/README.md) |
| Set up the CRM locally | [crm/README.md](../crm/README.md) |
| Understand chatbot architecture | [chatbot/docs/architecture-phase1.md](../chatbot/docs/architecture-phase1.md) |
| Understand chatbot technical decisions | [chatbot/docs/architecture/README.md](../chatbot/docs/architecture/README.md) |
| Understand the project scope | [chatbot/docs/charter.md](../chatbot/docs/charter.md) or [crm/docs/charter.md](../crm/docs/charter.md) |
