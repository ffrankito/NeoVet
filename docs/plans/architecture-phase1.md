# NeoVet — Architecture Plan (Phase 1 MVP)

## Context

Paula Silveira runs a veterinary clinic in Argentina specializing in bulldogs and brachycephalic breeds. She's losing time answering repetitive WhatsApp questions and managing appointment bookings manually. The existing CRM (G-Vet) has no API. This project builds a WhatsApp chatbot + appointment system that runs parallel to G-Vet and reduces the manual load on her team.

**This is Phase 1 (MVP)**. The goal: a live bot that handles FAQ, books appointments, detects urgencies, and gives staff a dashboard to manage escalations.

---

## Stack

| Layer | Tool | Reason |
|---|---|---|
| Framework | Next.js 14 App Router + TypeScript | User's primary stack |
| WhatsApp | Kapso SDK | TypeScript-first, AI SDK compatible, free tier (2k msgs/mo) |
| AI | Vercel AI SDK (`ai`) + Claude claude-sonnet-4-6 | Multimodal, tool calling, user requested ai-sdk |
| Database | Supabase (PostgreSQL) + Drizzle ORM | Free tier, Auth included, same ORM as bot_admin |
| Hosting | Vercel | Free/hobby tier sufficient for MVP |
| UI components | shadcn/ui + Tailwind | User's stack |

---

## Project Structure

```
neovet/
├── src/
│   ├── app/
│   │   ├── (admin)/                     # Auth-protected dashboard
│   │   │   ├── layout.tsx
│   │   │   ├── dashboard/page.tsx       # Conversation list + urgency overview
│   │   │   ├── conversations/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [id]/page.tsx
│   │   │   ├── appointments/page.tsx
│   │   │   ├── business-context/page.tsx  # Editable FAQ/hours for staff
│   │   │   └── escalations/page.tsx
│   │   ├── (auth)/login/page.tsx
│   │   └── api/
│   │       ├── webhook/route.ts         # Kapso webhook entry point
│   │       ├── appointments/route.ts
│   │       ├── conversations/route.ts
│   │       └── business-context/route.ts
│   ├── agent/                           # Framework-agnostic AI core
│   │   ├── index.ts                     # buildAgent() — generateText() with tools
│   │   ├── prompts/
│   │   │   ├── system.ts               # Injects business context from DB
│   │   │   └── triage.ts
│   │   ├── tools/
│   │   │   ├── index.ts                # Tool registry
│   │   │   ├── get-availability.ts
│   │   │   ├── book-appointment.ts
│   │   │   ├── cancel-appointment.ts
│   │   │   ├── get-business-context.ts
│   │   │   ├── escalate-to-human.ts    # ← most safety-critical
│   │   │   └── analyze-image.ts
│   │   └── triage.ts                   # Urgency classifier (L1–L4)
│   ├── db/
│   │   ├── index.ts                    # Drizzle client singleton
│   │   └── schema/
│   │       ├── index.ts
│   │       ├── contacts.ts
│   │       ├── conversations.ts
│   │       ├── messages.ts
│   │       ├── appointments.ts
│   │       ├── business-context.ts
│   │       └── urgency-escalations.ts
│   ├── lib/
│   │   ├── kapso/
│   │   │   ├── client.ts
│   │   │   ├── verify-webhook.ts       # HMAC — first thing that runs
│   │   │   └── types.ts
│   │   ├── supabase/
│   │   │   ├── server.ts
│   │   │   └── client.ts
│   │   └── auth.ts
│   ├── components/
│   │   ├── ui/                         # shadcn/ui primitives
│   │   └── admin/
│   │       ├── conversation-list.tsx
│   │       ├── urgency-badge.tsx       # L1/L2/L3/L4 color-coded
│   │       ├── escalation-card.tsx
│   │       └── business-context-form.tsx
│   ├── types/
│   │   ├── agent.ts
│   │   ├── whatsapp.ts
│   │   └── urgency.ts                  # UrgencyLevel enum
│   └── middleware.ts                   # Protect (admin) routes
├── drizzle.config.ts
├── .env.example
└── package.json
```

---

## Database Schema (Drizzle + Supabase PostgreSQL)

### contacts
```ts
{ id, whatsappId (unique), displayName, phone, email, petNames (array),
  importedFromGvet, createdAt, updatedAt }
```

### conversations
```ts
{ id, contactId, whatsappThreadId (unique),
  status: 'open'|'resolved'|'escalated'|'pending_vet',
  urgencyLevel: 'L1'|'L2'|'L3'|'L4',  // never auto-downgraded
  urgencyDetectedAt, assignedToStaff, summary, lastMessageAt, createdAt, updatedAt }
```

### messages
```ts
{ id, conversationId, whatsappMessageId (unique — idempotency),
  senderType: 'contact'|'bot'|'staff',
  messageType: 'text'|'image'|'audio'|'document'|'location',
  body, mediaUrl (Supabase Storage — permanent), mediaType,
  aiAnalysis, urgencySignal, sentAt, createdAt }
```

### appointments
```ts
{ id, contactId, conversationId, petName, petSpecies, reason,
  status: 'pending_confirmation'|'confirmed'|'cancelled'|'completed'|'no_show',
  scheduledAt, durationMinutes (default 30), staffNotes, reminderSentAt,
  createdAt, updatedAt }
```

### availability_rules
```ts
{ id, dayOfWeek: 0-6 | null,  // null = specific date override
  specificDate: date | null,   // for blocking a specific day
  startTime: time,             // e.g. '09:00'
  endTime: time,               // e.g. '13:00'
  slotDurationMinutes: int (default 30),
  isAvailable: boolean,        // false = blocked (holiday, etc.)
  label: text | null,          // e.g. "Mañana", "Tarde", "Peluquería"
  createdBy, createdAt, updatedAt }
```

### business_context
```ts
{ id, category: 'faq'|'hours'|'services'|'prices'|'location'|'emergency',
  key (unique), title (human label), content (actual answer), isActive,
  updatedBy, createdAt, updatedAt }
```

### urgency_escalations
```ts
{ id, conversationId, messageId, urgencyLevel, triggerReason, aiSummary,
  action: 'notified_staff'|'vet_called'|'emergency_contact_sent'|'resolved'|'dismissed',
  actionTakenBy, actionTakenAt, resolvedAt, createdAt }
```

---

## Message Flow

```
WhatsApp User
    │
    ▼
Kapso Platform
    │  POST /api/webhook
    ▼
webhook/route.ts
    1. Verify HMAC → 401 if invalid
    2. Return 200 immediately (Kapso has 5s timeout)
    3. waitUntil() background work:
       a. Upsert contact
       b. Upsert conversation
       c. Download media → Supabase Storage (WhatsApp CDN URLs expire)
       d. Persist message row
       e. L4 keyword fast-path (convulsión, no respira, atropellado...)
          └─ if L4: create escalation immediately, skip AI
       f. Hand off to agent/index.ts
    │
    ▼
agent/index.ts (buildAgent)
    1. Load last N messages from DB (conversation history)
    2. buildSystemPrompt() → queries business_context table (5min cache)
    3. Run triage classifier → urgencySignal
    4. generateText({ model: claude-sonnet-4-6, tools: [...], messages })
    5. Claude reasons + calls tools as needed
    6. Update conversation.urgencyLevel in DB
    7. Persist bot message row
    │
    ▼
kapso/client.ts → sendMessage()
    │
    ▼
WhatsApp User receives reply
```

---

## Urgency System

| Level | Trigger | Bot action |
|---|---|---|
| L1 | General info, prices, location | Answers automatically |
| L2 | Appointment booking | Runs booking flow |
| L3 | Symptom description or image | AI analyzes + creates escalation, flags for vet review |
| L4 | Emergency keywords | Keyword fast-path (pre-AI), immediate escalation, sends emergency contact |

**Rule**: `conversation.urgencyLevel` is only ever set upward (L1→L2→L3→L4). Only a staff member can downgrade it via the admin dashboard.

**L4 keywords (Spanish, Argentina)**: convulsión, no respira, atropellado, envenenado, sangrado, no reacciona, desmayado, golpe fuerte, obstrucción, emergencia, urgente, se está muriendo.

---

## Phase 1 — Build Order

**Week 1: Foundation**
- `create-next-app` scaffold + Drizzle + Supabase connection + shadcn/ui
- Run all migrations (including `availability_rules`)
- Kapso webhook endpoint with HMAC verification
- Persist incoming messages to DB (no AI yet)

**Week 2: Agent Core**
- System prompt builder with business_context injection
- `get_business_context` + `escalate_to_human` tools
- Wire Vercel AI SDK → Claude claude-sonnet-4-6
- Seed business_context with Paula's real data
- Test FAQ responses end-to-end

**Week 3: Appointments + Triage**
- `get_availability` tool
- `book_appointment` + `cancel_appointment` tools
- Urgency classifier (L1–L4)
- L4 emergency keyword fast-path
- Image handling: CDN download → Supabase Storage → Claude vision

**Week 4: Admin Dashboard**
- Supabase Auth (email login)
- Conversation list with urgency badges + thread viewer
- Escalation log with action buttons
- Business context editor
- Availability calendar
- Deploy to Vercel + connect domain

---

## Environment Variables

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

ANTHROPIC_API_KEY=

KAPSO_API_KEY=
KAPSO_WEBHOOK_SECRET=
WHATSAPP_PHONE_NUMBER_ID=

NEXT_PUBLIC_APP_URL=
NEXT_PUBLIC_CLINIC_EMERGENCY_PHONE=
```

---

## Infrastructure Blockers (needed from dev team)

1. **Supabase project** — needs to be created and connected. Once ready, provide:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - Connection string for Drizzle migrations (`DATABASE_URL`)
2. **Kapso account** — needs to be created and a WhatsApp number connected. Once ready, provide:
   - `KAPSO_API_KEY`
   - `KAPSO_WEBHOOK_SECRET`
   - `WHATSAPP_PHONE_NUMBER_ID`

---

## Pre-Implementation Blockers (needed from Paula)

1. Complete FAQ list (for `business_context` seed)
2. Services + prices
3. Exact hours (weekdays, weekends, holiday hours)
4. Minimum data required for a booking
5. XLSX export from G-Vet for contact seeding
6. Phone number the bot will use (existing WhatsApp Business number?)

---

## Verification Plan

1. **Webhook**: Send a Kapso test event → verify message persisted in DB, 200 returned in <200ms
2. **Agent FAQ**: Send "¿Cuáles son los horarios?" → verify correct hours returned
3. **Booking flow**: Send "quiero sacar un turno para mi perro mañana" → verify appointment created
4. **Urgency L4**: Send "mi perro tuvo una convulsión" → verify escalation created immediately (no AI delay)
5. **Image analysis**: Send a photo → verify Supabase Storage URL saved, aiAnalysis populated
6. **Admin dashboard**: Log in as Paula → verify conversations visible with correct urgency badges
