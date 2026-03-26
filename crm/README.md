# NeoVet CRM

Internal staff tool for the NeoVet veterinary clinic. Manages clients (pet owners), patients (pets), clinical history, and appointments.

**Used by:** Paula Silveira and the clinic reception team.
**Not public-facing.**

---

## Stack

- Next.js 14 App Router + TypeScript
- Tailwind CSS + shadcn/ui
- Drizzle ORM + Supabase (PostgreSQL)
- Supabase Auth (email login)
- Deployed to Vercel

---

## Local Setup

### Prerequisites

- Node.js 18+
- A Supabase project ([supabase.com](https://supabase.com))

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env.local
```

Fill in `.env.local` with values from your Supabase project (**Settings → API**):
- `NEXT_PUBLIC_SUPABASE_URL` — Project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — anon public key
- `SUPABASE_SERVICE_ROLE_KEY` — service_role key
- `DATABASE_URL` — Transaction mode connection string (port 6543)

> `drizzle-kit` requires a separate `.env` file (not `.env.local`) with `DATABASE_URL` in **Session mode** (port 5432). See `docs/week1-handoff.md` for the full setup guide.

### 3. Run database migrations

```bash
npm run db:migrate
```

Verify in Supabase → Table Editor that the tables were created.

### 4. Start the dev server

```bash
npm run dev
```

App runs at [http://localhost:3000](http://localhost:3000).

---

## Project Structure

```
src/
├── app/
│   ├── (admin)/          # Auth-protected staff dashboard
│   └── (auth)/           # Login page
├── components/
│   ├── ui/               # shadcn/ui primitives
│   └── admin/            # CRM-specific components
├── db/
│   ├── index.ts          # Drizzle client singleton
│   └── schema/           # Table definitions
└── lib/                  # Utilities and helpers
```

---

## v1 Scope

Staff-only CRUD — clients, patients, clinical history, appointments. No public API. No chatbot integration. See `docs/charter.md` for full scope definition.
