# NeoVet Chatbot

Conversational assistant for NeoVet clinic clients. Answers FAQs about the clinic — hours, services, location, and how to book.

**v1 delivery:** Web chat widget.
**v2:** WhatsApp via Kapso.

---

## Stack

- Next.js 14 App Router + TypeScript
- Tailwind CSS
- Vercel AI SDK + Claude claude-sonnet-4-6
- Deployed to Vercel

---

## Local Setup

### Prerequisites

- Node.js 18+
- An Anthropic API key ([console.anthropic.com](https://console.anthropic.com))

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env.local
```

Fill in `.env.local` with your credentials. See `.env.example` for descriptions.

### 3. Start the dev server

```bash
npm run dev
```

App runs at [http://localhost:3000](http://localhost:3000).

---

## v1 Scope

FAQ only — the chatbot answers questions and makes zero changes to any system. No appointment booking. No WhatsApp. No CRM integration. See `docs/charter.md` for full scope definition.
