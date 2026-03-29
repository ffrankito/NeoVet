# NeoVet CRM

Internal staff tool for the NeoVet veterinary clinic. Manages clients (pet owners), patients (pets), clinical history, appointments, grooming sessions, and billing.

**Used by:** Paula Silveira and the clinic reception team.
**Not public-facing.**

---

## Stack

- Next.js 16 App Router + TypeScript
- Tailwind CSS + shadcn/ui
- Drizzle ORM + Supabase (PostgreSQL)
- Supabase Auth (email login)
- Resend + Vercel Cron (email reminders)
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
│   ├── dashboard/
│   │   ├── appointments/     # Appointment CRUD + detail + inline consultation view
│   │   ├── clients/          # Client CRUD
│   │   ├── consultations/    # Clinical consultation CRUD (SOAP + vitals + treatments)
│   │   ├── grooming/         # Grooming profiles + session records
│   │   ├── patients/         # Patient CRUD + vaccinations + deworming + documents
│   │   ├── billing/          # Payments + ARCA electronic invoicing
│   │   ├── settings/         # Grooming pricing tiers + service catalog
│   │   └── staff/            # Staff management (admin only)
│   └── login/                # Auth page
├── components/
│   ├── ui/                   # shadcn/ui primitives
│   └── admin/
│       ├── appointments/
│       ├── clients/
│       ├── consultations/
│       ├── grooming/
│       └── patients/
├── db/
│   ├── index.ts              # Drizzle client singleton
│   └── schema/               # Table definitions (one file per domain)
├── lib/
│   ├── ids.ts                # Prefixed ID generators
│   └── supabase/             # Supabase client helpers
scripts/
├── import-gvet.ts            # One-time client/patient import from GVet CSV
├── import-visitas.ts         # One-time consultation import from GVet Visitas CSV
├── dedupe-patients.ts        # Deduplication cleanup for imported patients
└── backfill-appointments-from-consultations.ts  # Creates appointments from imported consultations
```

---

## v1 Scope

Staff-only tool covering:

- **Clients & patients** — CRUD, avatars, deceased flag
- **Clinical history** — SOAP consultations + vitals + treatment plans + vaccines + deworming + documents + complementary studies
- **Appointments** — create, confirm, complete, assign to staff; weekly calendar with free-slot view; service catalog with block durations for surgeries
- **Grooming module** — per-patient profile (behavior, coat, estimated time) + session records (photos, findings, 3-tier pricing)
- **Billing** — payment registration + ARCA electronic invoicing (Factura A/B/C); two fiscal entities
- **Roles** — admin / vet / groomer with isolated access
- **Email reminders** — appointment (48h/24h), vaccine (7 days before), post-consultation follow-ups via Resend + Vercel Cron
- **Data import** — one-time migration from Geovet CSV exports

No public API. No chatbot integration. No WhatsApp (v2). See `docs/v1/charter.md` for full scope.
