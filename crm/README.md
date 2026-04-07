# NeoVet CRM

Internal staff tool for the NeoVet veterinary clinic. Manages clients (pet owners), patients (pets), clinical history, appointments, grooming sessions, pet shop inventory, cash register, and email notifications.

**Used by:** Paula Silveira and the clinic team (5 vets, 2 receptionists, 1 groomer).
**Not public-facing.**

---

## Stack

- Next.js 16 App Router + TypeScript
- Tailwind CSS + shadcn/ui
- Drizzle ORM + Supabase (PostgreSQL)
- Supabase Auth (email login) + Supabase Storage (photos, documents)
- Resend + Vercel Cron (email notifications)
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

Fill in `.env.local`:

| Variable | Source | Required |
|----------|--------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Settings → API → Project URL | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Settings → API → anon public | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API → service_role | Yes |
| `DATABASE_URL` | Supabase → Settings → Database → Transaction mode (port 6543) | Yes |
| `RESEND_API_KEY` | [resend.com](https://resend.com) → API Keys | Yes |
| `CRON_SECRET` | Any random string (protects cron endpoints) | Yes |
| `BOT_API_KEY` | Any random string (protects bot API endpoints) | Yes |
| `EMAIL_FROM` | Verified sender in Resend | No (defaults to `onboarding@resend.dev`) |
| `CLINIC_ADDRESS` | Clinic address for email templates | No (defaults to `Morrow 4064, Rosario`) |

> `drizzle-kit` requires `DATABASE_URL` in **Session mode** (port 5432) for migrations. See `docs/v1/handoff.md` for the full setup guide.

### 3. Run database migrations

```bash
npm run db:migrate
```

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
│   │   ├── appointments/     # Appointment CRUD + detail + no-show + cancel with reason
│   │   ├── calendar/         # Weekly/daily calendar view with surgery blocks
│   │   ├── cash/             # Cash register — open/close sessions, movements
│   │   ├── clients/          # Client CRUD + upcoming appointments
│   │   ├── consultations/    # SOAP consultations + vitals + treatments + follow-up shortcut
│   │   ├── grooming/         # Grooming profiles + sessions (auto-posts to cash)
│   │   ├── patients/         # Patient CRUD + vaccinations + deworming + documents
│   │   ├── petshop/          # Products, providers, stock entries, sales
│   │   └── settings/         # Grooming prices, service catalog, staff management, clinic hours
│   ├── api/
│   │   ├── bot/              # 6 REST endpoints for v2 chatbot integration
│   │   ├── cron/             # Scheduled jobs: appointment reminders, vaccine reminders, follow-ups
│   │   └── admin/            # Seed routes for bot context and settings
│   └── login/                # Auth page
├── components/
│   ├── ui/                   # shadcn/ui primitives
│   └── admin/                # Feature-specific components (appointments, clients, consultations, grooming, patients)
├── db/
│   ├── index.ts              # Drizzle client singleton
│   └── schema/               # 27 table definitions (one file per domain)
├── lib/
│   ├── auth.ts               # getRole(), hasRole(), getSessionStaffId()
│   ├── ids.ts                # Prefixed ID generators (apt_, cli_, pat_, etc.)
│   ├── timezone.ts           # Argentina timezone helpers
│   ├── email/
│   │   ├── resend.ts         # Resend client
│   │   ├── send-email.ts     # Shared send + dedup helper
│   │   └── templates/        # 5 email templates (confirmation, cancellation, reminders, follow-up, vaccine)
│   └── supabase/             # Supabase client helpers + auth middleware
drizzle/
└── migrations/               # 20 SQL migration files (0000–0019)
scripts/
├── import-gvet.ts            # Client/patient import from GVet CSV
├── import-visitas.ts         # Consultation import from GVet CSV
├── import-products.ts        # Product catalog import from GVet price list CSV
├── import-turnos-futuros.ts  # Future appointments import from GVet TXT
├── dedupe-patients.ts        # Patient deduplication cleanup
├── cleanup-imported-visits.ts # Nuclear cleanup of all consultations + backfilled appointments
├── backfill-appointments-from-consultations.ts  # Create appointments from imported consultations
└── seed-user.ts              # Create staff user (Supabase Auth + DB row)
```

---

## v1 Scope

**Phases A–L complete.** Phase D (ARCA billing) is the only v1 deliverable remaining — blocked on Paula's credentials.

- **Clients & patients** — CRUD, avatars, deceased flag. 1,771 clients + 1,380 patients imported from Geovet.
- **Clinical history** — SOAP consultations + vitals + treatment plans (medication/dose/frequency/duration) + vaccines + deworming + documents (5 categories) + complementary methods (study reports + photos)
- **Appointments** — create, confirm, complete, cancel (with reason), no-show. Weekly calendar + surgery blocks + schedule suspension. Booking confirmation + cancellation emails.
- **Grooming** — per-patient profiles + session records with before/after photos, findings, 3-tier pricing. Auto-posts revenue to cash register.
- **Pet shop** — products (9 categories), providers, stock entries, sales with multi-item cart + 5 payment methods
- **Cash register** — daily sessions, income/expense movements, breakdown by payment method. Includes pet shop sales + grooming revenue.
- **Email notifications** — booking confirmation, cancellation, 48h/24h reminders, vaccine due in 7 days, post-consultation follow-ups. All via Resend + Vercel Cron.
- **Dashboard** — role-filtered today's appointments (admin sees all, vet sees own, groomer sees own). Cash register status widget (admin).
- **Roles** — `admin` / `owner` (full access), `vet` (clinical), `groomer` (grooming only)
- **Patient summary on appointments** — last consultation, overdue vaccines, brachycephalic breed alert
- **Follow-up shortcut** — "Agendar turno de seguimiento" from consultation detail
- **Mobile responsive** — hamburger nav, adapted tables, 44px touch targets

No public API (except bot endpoints for v2). No chatbot integration. No WhatsApp (v2). See `docs/v1/charter.md` for full scope.

---

## Data Migration (Nuke & Reseed)

To do a clean re-import from Geovet (e.g., before handoff):

### 1. Export fresh data from Geovet

Place CSVs in `scripts/data/`:
- `Lista de clientes.csv`
- `Lista de pacientes.csv`
- `Visitas-MM-YYYY.csv` (one per month)
- `lista_precios YYYY-MM-DD-HH-mm-ss.csv`
- `turnos_futuros.txt`

### 2. Nuke the database

Run this SQL in Supabase SQL Editor (preserves `staff` and `services`):

```sql
-- Leaves first, roots last
DELETE FROM treatment_items;
DELETE FROM complementary_methods;
DELETE FROM vaccinations;
DELETE FROM deworming_records;
DELETE FROM documents;
DELETE FROM follow_ups;
DELETE FROM email_logs;
DELETE FROM bot_messages;
DELETE FROM bot_escalations;
DELETE FROM sale_items;
DELETE FROM consultations;
DELETE FROM grooming_sessions;
DELETE FROM sales;
DELETE FROM cash_movements;
DELETE FROM bot_conversations;
DELETE FROM appointments;
DELETE FROM stock_entries;
DELETE FROM grooming_profiles;
DELETE FROM schedule_blocks;
DELETE FROM patients;
DELETE FROM bot_contacts;
DELETE FROM cash_sessions;
DELETE FROM bot_business_context;
DELETE FROM clients;
DELETE FROM providers;
DELETE FROM products;
DELETE FROM settings;
```

### 3. Re-import in order

```bash
npx tsx scripts/import-gvet.ts --clients scripts/data/"Lista de clientes.csv" --patients scripts/data/"Lista de pacientes.csv"
npx tsx scripts/dedupe-patients.ts
npx tsx scripts/import-products.ts scripts/data/"lista_precios YYYY-MM-DD-HH-mm-ss.csv"
npx tsx scripts/import-visitas.ts --file scripts/data/Visitas-03-2026.csv
npx tsx scripts/import-visitas.ts --file scripts/data/Visitas-04-2026.csv
npx tsx scripts/backfill-appointments-from-consultations.ts
npx tsx scripts/import-turnos-futuros.ts
```

### 4. Create users (if needed)

```bash
npx tsx scripts/seed-user.ts --email admin@example.com --password "..." --name "Name" --role admin
```

> All import scripts support `--dry-run`. Use it first to verify before writing to the database.
