# NeoVet — Week 1 Handoff (Infrastructure Setup)

This document covers everything the dev team needs to do to get the foundation running.
Code is already scaffolded. You just need to connect the services.

---

## 1. Supabase Project

1. Go to [supabase.com](https://supabase.com) → New project
2. Name: `neovet` / Region: closest to Argentina (São Paulo or US East)
3. Once created, grab the following from **Project Settings → API**:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
4. Grab the DB connection string from **Project Settings → Database → Connection string → URI**
   - Use **Transaction mode** (port 6543)
   - Copy it into `DATABASE_URL` in `.env.local`

---

## 2. Local Environment

```bash
cp .env.example .env.local
```

Fill in `.env.local` with the values from step 1. Leave Kapso/Anthropic keys empty for now — not needed for migrations.

---

## 3. Run Migrations

```bash
npm run db:generate   # generates SQL in drizzle/migrations/
npm run db:migrate    # applies migrations to Supabase
```

**Verify**: open Supabase dashboard → Table Editor. You should see these 7 tables:
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
3. From the Kapso dashboard, grab:
   - `KAPSO_API_KEY`
   - `KAPSO_WEBHOOK_SECRET` — you set this value; use a strong random string (e.g. `openssl rand -hex 32`)
   - `WHATSAPP_PHONE_NUMBER_ID`
4. Set the webhook URL in Kapso to `https://[your-domain]/api/webhook`

   During local dev, expose localhost with [ngrok](https://ngrok.com):
   ```bash
   ngrok http 3000
   # set webhook URL in Kapso to: https://[ngrok-id].ngrok.io/api/webhook
   ```

---

## 5. Remaining `.env.local` Values

```
ANTHROPIC_API_KEY         → from console.anthropic.com
NEXT_PUBLIC_APP_URL       → http://localhost:3000 for dev
NEXT_PUBLIC_CLINIC_EMERGENCY_PHONE  → Paula's emergency contact number
```

---

## 6. Verify Dev Server

```bash
npm run dev
```

Visit `http://localhost:3000` — should load without errors in the terminal.

---

## 7. Verify Webhook (once Kapso + ngrok are running)

Send a WhatsApp message to the connected number. Then check Supabase → Table Editor:

| Table | Expected |
|---|---|
| `contacts` | New row with sender's WhatsApp ID |
| `conversations` | New row linked to that contact |
| `messages` | Message body stored |

---

## What's NOT needed yet

- Anthropic API key (Week 2 — agent core)
- Supabase Auth setup (Week 4 — admin dashboard)
- Vercel deployment (Week 4 — go live)
