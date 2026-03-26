# NeoVet — Week 1 Handoff (Infrastructure Setup)

This document covers everything the dev team needs to do to get the foundation running.
Code is already scaffolded. You just need to connect the services.

---

## 1. Supabase Project

1. Go to [supabase.com](https://supabase.com) → New project
2. Name: `neovet` / Region: closest to Argentina (São Paulo or US East)
3. Once created, grab the following from **Settings → API** (gear icon, bottom-left sidebar):
   - `NEXT_PUBLIC_SUPABASE_URL` — listed as "Project URL"
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` — listed as "anon public" under Project API keys
   - `SUPABASE_SERVICE_ROLE_KEY` — listed as "service_role" under Project API keys

   > Newer Supabase versions also have a **Connect** button at the top of the project dashboard that shows all keys and connection strings in one place.

---

## 2. Local Environment

```bash
cp .env.example .env.local
```

Fill in `.env.local` with the values from step 1. Leave `KAPSO_API_KEY` and `WHATSAPP_PHONE_NUMBER_ID` empty for now — not needed until Week 2.

---

## 3. Database Setup

Drizzle migrations require **two separate connection strings** — one for the CLI tool, one for the running app. Both point to the same database.

### 3.1 Get the connection strings from Supabase

Go to **Settings → Database → Connection string** (or use the **Connect** button at the top).

| Use | Mode | Port | Where to find it |
|-----|------|------|-----------------|
| Migrations (drizzle-kit) | Session | 5432 | "Session mode" tab |
| App runtime (.env.local) | Transaction | 6543 | "Transaction mode" tab |

> **Important:** The direct connection URL format (`db.[ref].supabase.co`) may not resolve on newer Supabase projects. Use the pooler URL — it looks like `aws-0-sa-east-1.pooler.supabase.com`. Copy it directly from the Supabase dashboard, don't type it manually.

### 3.2 Add DATABASE_URL to `.env` (not `.env.local`)

Create a `.env` file at the project root (separate from `.env.local`) and paste the **Session mode** connection string as `DATABASE_URL`.

> `drizzle-kit` does not read `.env.local` — that's a Next.js convention. It only reads `.env`.

Also add the **Transaction mode** connection string as `DATABASE_URL` inside `.env.local`.

Replace `[YOUR-PASSWORD]` in both URLs with your database password (set when you created the project). If you forgot it: **Settings → Database → Reset database password**.

### 3.3 Run migrations

```bash
npm run db:migrate
```

**Verify**: open Supabase → Table Editor. You should see these 7 tables:
- `contacts`
- `conversations`
- `messages`
- `appointments`
- `availability_rules`
- `business_context`
- `urgency_escalations`

---

## 4. Kapso Account (WhatsApp)

1. Create account at [kapso.io](https://kapso.io)
2. Connect a WhatsApp Business number (Paula's existing number or a new one)

### 4.1 Generate the webhook secret

`KAPSO_WEBHOOK_SECRET` is a value **you create** — not something Kapso generates. It's a shared secret that lets your app verify incoming requests are really from Kapso.

```bash
openssl rand -hex 32
```

Copy the output. Add it to both `.env` and `.env.local` as `KAPSO_WEBHOOK_SECRET`.

### 4.2 Configure the webhook in Kapso

1. In the Kapso dashboard, find the webhook configuration section
2. Paste the same secret value as the signing secret
3. Set the webhook URL to `https://[your-vercel-domain]/api/webhook`

### 4.3 Remaining Kapso credentials (grab from dashboard)

```
KAPSO_API_KEY=
WHATSAPP_PHONE_NUMBER_ID=
```

> These are only needed for Week 2 (outbound messages). Leave them empty for now.

---

## 5. Remaining `.env.local` Values

```
ANTHROPIC_API_KEY         → from console.anthropic.com
NEXT_PUBLIC_APP_URL       → https://[your-vercel-domain] (or http://localhost:3000 for dev)
NEXT_PUBLIC_CLINIC_EMERGENCY_PHONE  → Paula's emergency contact number
```

---

## 6. Vercel Deployment

The Kapso webhook requires a public URL — deploy to Vercel before testing with a real WhatsApp message.

1. Import the GitHub repo at [vercel.com](https://vercel.com) → New Project
2. Add all env variables in the Vercel dashboard (use Transaction mode `DATABASE_URL`, port 6543)
3. Deploy — Vercel auto-deploys on every push to `main`
4. Set the webhook URL in Kapso to `https://[your-vercel-domain]/api/webhook`

> Use the same Supabase project as the local setup — migrations have already been applied there.

**For local testing without Vercel:** expose localhost with [ngrok](https://ngrok.com):
```bash
npx ngrok http 3000
# set webhook URL in Kapso to: https://[ngrok-id].ngrok.io/api/webhook
```

---

## 7. Verify Dev Server

```bash
npm run dev
```

Visit `http://localhost:3000` — you'll see the default Next.js placeholder page. **This is expected.** The app UI is built in Week 4. The only active endpoint right now is `/api/webhook`.

---

## 8. Verify Webhook (once Kapso + Vercel/ngrok are running)

Send a WhatsApp message to the connected number. Then check Supabase → Table Editor:

| Table | Expected |
|---|---|
| `contacts` | New row with sender's WhatsApp ID |
| `conversations` | New row linked to that contact |
| `messages` | Message body stored |

---

## What's NOT needed yet

- `KAPSO_API_KEY` / `WHATSAPP_PHONE_NUMBER_ID` (Week 2 — outbound messages)
- `ANTHROPIC_API_KEY` active (Week 2 — agent core)
- Supabase Auth setup (Week 4 — admin dashboard)
