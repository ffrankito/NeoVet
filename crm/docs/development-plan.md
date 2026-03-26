# CRM Development Plan

| Field | Value |
|---|---|
| **Project** | NeoVet CRM |
| **Version** | v1 |
| **Author** | Technical Writer + Workflow Optimizer agents |
| **Status** | Active |
| **Last updated** | 2026-03-26 |
| **Related docs** | `charter.md`, `technical-spec.md` |

---

## Current State

The project has scaffolding but **no implementation**. All `src/` directories are empty.

### What exists

| Asset | Status |
|---|---|
| Next.js 16 project + configs | ✅ Installed |
| Tailwind CSS 4 + PostCSS | ✅ Configured |
| shadcn/ui v4 (base-nova) | ✅ `components.json` ready |
| Drizzle ORM + drizzle-kit | ✅ `drizzle.config.ts` ready |
| Supabase SSR + supabase-js | ✅ Installed |
| `.env.local` with credentials | ✅ Configured |
| `src/app/`, `src/components/`, `src/db/`, `src/lib/` | ❌ Empty |
| DB migrations | ❌ None |
| shadcn/ui components | ❌ None installed |

### Correction from docs

The charter and tech spec reference **Next.js 14**. The installed version is **Next.js 16.1.6** with **React 19**. Per project doctrine, code is truth — this plan targets Next.js 16.

---

## Scope Recap (v1)

From `charter.md`:

- **In scope**: Client CRUD, Patient CRUD, Appointment CRUD, email login, Geovet data import
- **Out of scope**: Public API, chatbot integration, automation, notifications, reporting, analytics
- **Deferred**: Clinical history (open question — structured vs free-text, pending Paula's input)

---

## Phase Overview

| Phase | Name | Effort | Deliverable | Depends on |
|---|---|---|---|---|
| 0 | Foundation | ~2h | DB schema, Supabase helpers, auth middleware, base layout, login | Nothing |
| 1 | Clients CRUD | ~3h | List, create, view, edit, delete clients | Phase 0 |
| 2 | Patients CRUD | ~3h | List, create, view, edit, delete patients (linked to client) | Phase 1 |
| 3 | Appointments CRUD | ~3h | List, create, view, edit, cancel appointments | Phase 2 |
| 4 | Polish & QA | ~2h | Validation, error states, responsive, docs update | Phases 1–3 |

**Total estimated effort: ~13h**

Clinical history and Geovet import are out of this plan — they depend on open questions from Paula.

---

## Phase 0 — Foundation

> **Goal**: You can log in, see a dashboard shell, and the database schema exists.

### 0.1 — Drizzle Schema

Create `src/db/schema/` with table definitions matching the tech spec:

| Table | Columns | Notes |
|---|---|---|
| `clients` | id (`cli_` prefix), name, phone, email, imported_from_gvet, created_at, updated_at | Owner of patients |
| `patients` | id (`pat_` prefix), client_id (FK), name, species, breed, date_of_birth, created_at, updated_at | Linked to one client |
| `appointments` | id (`apt_` prefix), patient_id (FK), scheduled_at, duration_minutes, reason, status (enum), staff_notes, created_at, updated_at | Status: pending/confirmed/cancelled/completed |

**Files**:
- `src/db/schema/clients.ts`
- `src/db/schema/patients.ts`
- `src/db/schema/appointments.ts`
- `src/db/schema/index.ts` (barrel export)

### 0.2 — Drizzle Client

Create `src/db/index.ts` — singleton Drizzle client using `postgres` driver and `DATABASE_URL`.

### 0.3 — Supabase Helpers

Create client utilities for Next.js 16 + Supabase SSR:

| File | Purpose |
|---|---|
| `src/lib/supabase/client.ts` | Browser client (used in client components) |
| `src/lib/supabase/server.ts` | Server client (used in server components + route handlers) |

### 0.4 — Auth Middleware

Create `src/middleware.ts` — protect all `/(admin)` routes. Redirect unauthenticated users to `/login`.

### 0.5 — Global Styles + Base Layout

| File | Purpose |
|---|---|
| `src/app/globals.css` | Tailwind CSS imports + shadcn/ui theme variables |
| `src/app/layout.tsx` | Root layout — html lang="es", metadata, font |
| `src/app/(auth)/login/page.tsx` | Email/password login form |
| `src/app/(admin)/layout.tsx` | Dashboard shell — sidebar nav + content area |
| `src/app/(admin)/page.tsx` | Dashboard home (redirect or summary) |

### 0.6 — Core shadcn/ui Components

Install the primitives needed across all phases:

```
button, input, label, card, table, dialog, dropdown-menu,
select, textarea, badge, separator, skeleton, toast, form,
sidebar, sheet
```

### 0.7 — Verification

- [ ] `npm run dev` starts without errors
- [ ] `/login` renders the login form
- [ ] Auth middleware redirects unauthenticated requests to `/login`
- [ ] `npm run db:generate` produces migration SQL from the schema
- [ ] `npm run db:migrate` applies migrations to Supabase (tables visible in Table Editor)

**Exit criteria**: You can log in with a Supabase email user and see the empty dashboard.

---

## Phase 1 — Clients CRUD

> **Goal**: Staff can create, view, list, edit, and delete pet owners.

### 1.1 — Server Actions

Create `src/app/(admin)/clients/actions.ts`:

| Action | Input | Output |
|---|---|---|
| `getClients()` | search?, page?, limit? | Paginated client list |
| `getClient(id)` | client ID | Single client with patients |
| `createClient(data)` | name, phone, email? | Created client |
| `updateClient(id, data)` | partial client fields | Updated client |
| `deleteClient(id)` | client ID | Void (or soft-delete) |

### 1.2 — Pages

| Route | Component | Description |
|---|---|---|
| `/(admin)/clients/page.tsx` | Client list | Searchable table with name, phone, email, patient count |
| `/(admin)/clients/new/page.tsx` | Create form | Name, phone, email fields + validation |
| `/(admin)/clients/[id]/page.tsx` | Detail view | Client info + linked patients list |
| `/(admin)/clients/[id]/edit/page.tsx` | Edit form | Pre-filled form + save/cancel |

### 1.3 — UI Components

| Component | Purpose |
|---|---|
| `src/components/admin/clients/client-table.tsx` | Data table with search + pagination |
| `src/components/admin/clients/client-form.tsx` | Reusable create/edit form |

### 1.4 — Verification

- [ ] Create a client from the UI → appears in Supabase Table Editor
- [ ] List shows all clients with search filtering
- [ ] Edit saves changes
- [ ] Delete removes (or soft-deletes) the client

**Exit criteria**: Full CRUD cycle works for clients.

---

## Phase 2 — Patients CRUD

> **Goal**: Staff can manage pets linked to their owners.

### 2.1 — Server Actions

Create `src/app/(admin)/patients/actions.ts`:

| Action | Input | Output |
|---|---|---|
| `getPatientsByClient(clientId)` | client ID | Patient list for that owner |
| `getPatient(id)` | patient ID | Single patient with client info + appointments |
| `createPatient(data)` | client_id, name, species, breed?, dob? | Created patient |
| `updatePatient(id, data)` | partial patient fields | Updated patient |
| `deletePatient(id)` | patient ID | Void |

### 2.2 — Pages

| Route | Component | Description |
|---|---|---|
| `/(admin)/clients/[id]/patients/new/page.tsx` | Create patient | Linked to the parent client |
| `/(admin)/patients/[id]/page.tsx` | Patient detail | Info + appointments list |
| `/(admin)/patients/[id]/edit/page.tsx` | Edit patient | Pre-filled form |

Patients are accessed via client detail view (Phase 1.2) — no standalone patients list needed in v1.

### 2.3 — Verification

- [ ] Create a patient linked to a client
- [ ] Patient appears in the client detail view
- [ ] Edit patient info
- [ ] Delete patient

**Exit criteria**: Full CRUD cycle works for patients, accessible from client detail.

---

## Phase 3 — Appointments CRUD

> **Goal**: Staff can schedule and manage appointments for patients.

### 3.1 — Server Actions

Create `src/app/(admin)/appointments/actions.ts`:

| Action | Input | Output |
|---|---|---|
| `getAppointments()` | date range?, status?, patient_id? | Filtered appointment list |
| `getAppointment(id)` | appointment ID | Single appointment with patient + client info |
| `createAppointment(data)` | patient_id, scheduled_at, duration, reason?, status | Created appointment |
| `updateAppointment(id, data)` | partial fields | Updated appointment |
| `cancelAppointment(id)` | appointment ID | Status → cancelled |

### 3.2 — Pages

| Route | Component | Description |
|---|---|---|
| `/(admin)/appointments/page.tsx` | Appointment list | Filterable by date, status; shows patient + client name |
| `/(admin)/appointments/new/page.tsx` | Create form | Patient picker, datetime, duration, reason |
| `/(admin)/appointments/[id]/page.tsx` | Detail view | Full info + status controls |
| `/(admin)/appointments/[id]/edit/page.tsx` | Edit form | Pre-filled + status change |

### 3.3 — UI Components

| Component | Purpose |
|---|---|
| `src/components/admin/appointments/appointment-table.tsx` | List with date/status filters |
| `src/components/admin/appointments/appointment-form.tsx` | Create/edit form with patient picker |
| `src/components/admin/appointments/status-badge.tsx` | Color-coded status badge |

### 3.4 — Verification

- [ ] Create an appointment for a patient
- [ ] Appointment appears in the list with correct patient/client info
- [ ] Filter by date range and status
- [ ] Change status (pending → confirmed → completed, or → cancelled)

**Exit criteria**: Full appointment lifecycle works from the UI.

---

## Phase 4 — Polish & QA

> **Goal**: The CRM is production-ready for Paula and her team.

### 4.1 — Validation & Error Handling

- Form validation on all create/edit forms (required fields, phone format, date validation)
- Server-side validation in all server actions
- User-friendly error messages in Spanish
- Loading states (skeletons) for all data-fetching pages
- Empty states with clear CTAs ("No hay clientes todavía — crear el primero")

### 4.2 — Responsive & Accessibility

- Sidebar collapses on mobile
- Tables scroll horizontally on small screens
- All interactive elements keyboard-accessible
- ARIA labels on icon-only buttons

### 4.3 — Dashboard Home

- Summary cards: total clients, total patients, today's appointments, upcoming appointments
- Quick action buttons: new client, new appointment

### 4.4 — Documentation Update

- Update `crm/README.md` with actual project structure
- Update `crm/CLAUDE.md` with current status
- Update `crm/docs/technical-spec.md` to reflect Next.js 16 (not 14)
- Update `crm/docs/charter.md` deliverable statuses

### 4.5 — Verification

- [ ] `npm run build` passes clean
- [ ] All CRUD operations work end-to-end
- [ ] Auth protects all admin routes
- [ ] No console errors or warnings
- [ ] Spanish copy throughout the UI

**Exit criteria**: CRM is deployable to Vercel and ready for Paula UAT.

---

## Deferred Items

These are explicitly **not in this plan** and require input before starting:

| Item | Blocker | Planned for |
|---|---|---|
| Clinical history | Open question: structured vs free-text (tech-spec #2) | After Paula input |
| Geovet data import | Need Excel export sample from Paula (charter R1) | After Paula provides file |
| Soft-delete policy | Open question (tech-spec #3) | Decide at Phase 1 start |
| Calendar view | Nice-to-have — list view sufficient for v1 | v1 polish or v2 |

---

## Dependency Graph

```
Phase 0 (Foundation)
  ├── 0.1 Schema
  ├── 0.2 Drizzle Client ← 0.1
  ├── 0.3 Supabase Helpers
  ├── 0.4 Middleware ← 0.3
  ├── 0.5 Layout + Login ← 0.3, 0.4, 0.6
  ├── 0.6 shadcn/ui Components
  └── 0.7 Verification ← all above

Phase 1 (Clients) ← Phase 0
  ├── 1.1 Server Actions ← 0.2
  ├── 1.2 Pages ← 1.1, 0.5
  ├── 1.3 UI Components ← 0.6
  └── 1.4 Verification ← all above

Phase 2 (Patients) ← Phase 1
  ├── 2.1 Server Actions ← 0.2
  ├── 2.2 Pages ← 2.1, 1.2
  └── 2.3 Verification ← all above

Phase 3 (Appointments) ← Phase 2
  ├── 3.1 Server Actions ← 0.2
  ├── 3.2 Pages ← 3.1
  ├── 3.3 UI Components ← 0.6
  └── 3.4 Verification ← all above

Phase 4 (Polish) ← Phases 1–3
```

---

## Sprint Prioritization (Impact / Effort Matrix)

| Task | Impact | Effort | Priority Score | Phase |
|---|---|---|---|---|
| DB schema + migrations | Critical | Low | ★★★ | 0 |
| Auth middleware + login | Critical | Low | ★★★ | 0 |
| Dashboard layout | High | Low | ★★★ | 0 |
| Client CRUD | Critical | Medium | ★★☆ | 1 |
| Patient CRUD | High | Medium | ★★☆ | 2 |
| Appointment CRUD | High | Medium | ★★☆ | 3 |
| Form validation | High | Low | ★★★ | 4 |
| Error/empty states | Medium | Low | ★★☆ | 4 |
| Dashboard summary | Medium | Low | ★★☆ | 4 |
| Responsive polish | Medium | Low | ★★☆ | 4 |
| Docs update | Low | Low | ★★☆ | 4 |

**Key insight**: Phase 0 has the best impact/effort ratio — it unblocks everything. Phase 4 quick wins (validation, empty states) have high impact for low effort.

---

## Risk Register

| # | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| R1 | Supabase free tier limits hit during development | Low | Low | Monitor usage; paid tier is $25/mo if needed |
| R2 | Next.js 16 + React 19 have breaking changes vs docs/examples | Medium | Medium | Test early; pin versions; consult Next.js 16 migration guide |
| R3 | shadcn/ui v4 component APIs differ from online examples | Medium | Low | Use `shadcn` CLI for installation; check shadcn/ui changelog |
| R4 | Soft-delete vs hard-delete decision deferred too long | Low | Medium | Decide at Phase 1 start; use boolean flag if soft-delete |
| R5 | Scope creep into chatbot API | Low | High | Enforce v1 boundary per charter — no public API |
