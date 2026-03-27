# CRM Development Plan

| Field | Value |
|---|---|
| **Project** | NeoVet CRM |
| **Author** | Tomás Pinolini |
| **Status** | Active |
| **Last updated** | 2026-03-27 |
| **Related docs** | `charter.md`, `technical-spec.md`, `../../GVet_Research_and_Benchmarking.md`, `../../docs/paula-meeting.md` |

---

## Goal per version

| Version | Definition | Exit criteria |
|---|---|---|
| **v1** | Paula can manage clients, patients, appointments, and clinical records from NeoVet without opening GVet for daily operations | Paula uses NeoVet as her primary tool |
| **v2** | Chatbot ↔ CRM integration live. WhatsApp channel active. Automated reminders and online booking | Clients interact with the chatbot; staff handles fewer manual tasks |
| **v3** | Intelligence, reporting, and advanced automation | Data-driven decisions; near-zero manual admin overhead |

---

## Stack (corrected from earlier docs)

Next.js **16.1.6** + React 19 + TypeScript + Tailwind CSS + shadcn/ui + Drizzle ORM + Supabase (PostgreSQL + Auth).

> The charter and original tech spec referenced Next.js 14 — the installed version is 16. Code is truth.

---

## v1 — Paula replaces GVet

v1 is divided into phases. Each phase must be complete before the next starts.

### Phase A — Foundation + Basic CRUD ✅ Done

> Completed in commit `9fe42ba`.

| Deliverable | Status |
|---|---|
| DB schema: clients, patients, appointments | ✅ |
| Drizzle client + migrations | ✅ |
| Supabase SSR auth + middleware | ✅ |
| Email login (`/login`) | ✅ |
| Dashboard shell + sidebar nav | ✅ |
| Clients CRUD (list, create, view, edit, delete) | ✅ |
| Patients CRUD (linked to client) | ✅ |
| Appointments CRUD (list, create, view, edit, cancel) | ✅ |
| shadcn/ui core components | ✅ |

---

### Phase B — Polish, Dashboard & Data Import 🔄 In progress

> Spec: `../../docs/superpowers/specs/2026-03-27-crm-phase4-import-design.md`

**Goal:** The CRM is production-quality and Paula's existing data is migrated.

#### B.1 — Form Validation
- Zod server-side validation on all create/edit actions
- Field-level error display under each input (replace single top-level error string)
- Validated fields: name, phone, date formats, required FKs

#### B.2 — Loading States
- `loading.tsx` files for all list and detail pages
- `TableSkeleton`, `DetailSkeleton`, `CardSkeleton` components in `src/components/admin/skeletons.tsx`

#### B.3 — Delete Confirmations
- shadcn/ui `AlertDialog` on every destructive action
- Client delete: warns that linked patients will also be removed (cascade)
- Patient delete: standard confirmation
- Appointment cancel: separate copy ("cancelar" not "eliminar")

#### B.4 — Dashboard Home
- 3 summary cards: total clients · total patients · today's appointments
- Quick-action buttons: Nuevo cliente · Nuevo turno
- Today's appointments list with inline Confirmar / Cancelar per row
- Empty state: "No hay turnos para hoy."

#### B.5 — CSV Import Script
- `scripts/import-gvet.ts` — CLI only, one-time use
- Supports `--clients` and `--patients` CSV flags
- Adjustable `COLUMN_MAP` config at top of file (mapped after reviewing actual GVet exports)
- `--dry-run` mode for safe preview before writing
- Sets `importedFromGvet: true` on all inserted rows
- Logs inserted / skipped counts

#### B.6 — Verification
- [ ] `npm run build` passes clean
- [ ] All CRUD flows work end-to-end
- [ ] Field errors appear under the correct inputs
- [ ] Skeletons show while data loads
- [ ] Delete dialogs fire before any destructive action
- [ ] Dashboard cards show correct counts
- [ ] Today's appointments list reflects real data
- [ ] CSV import runs with `--dry-run` without errors
- [ ] Deployed to Vercel, Paula can log in

---

### Phase C — Clinical Records 🔲 Pending design

> Blocked on: Paula interview (see `../../docs/paula-meeting.md` — clinical history format question)

**Goal:** Paula can record and retrieve full clinical history per patient from NeoVet.

| Feature | Notes |
|---|---|
| SOAP notes per consultation | Subjective, Objective, Assessment, Plan — structured or free-text (pending Paula) |
| Vital signs — weight, temperature, heart rate, respiratory rate | Logged per visit |
| Diagnosis — free text (ICD-10 optional) | |
| Treatment plan — ordered list with status | |
| Vaccination records — vaccine name, lot, date, next due | |
| Deworming / parasite control schedule | |
| Patient photo / avatar | Upload + display on patient detail |
| Deceased / inactive flag | Archive without data loss |
| Document storage — attach PDFs, lab results, images | |

---

### Phase D — Billing & Invoicing 🔲 Pending Paula confirmation

> Blocked on: Paula interview — does she need AFIP on day 1, or will she keep GVet for billing during parallel operation?

**Goal:** Paula can invoice clients and comply with AFIP requirements from NeoVet.

| Feature | Notes |
|---|---|
| Invoice generation per consultation or service bundle | |
| Electronic billing — AFIP integration | Argentina legal requirement |
| Product & service price list | Configurable by staff |
| Payment recording — cash, card, transfer | |
| Outstanding balances view | |

> ⚠️ AFIP integration is a significant engineering effort. If Paula confirms she can run GVet for billing during a parallel operation period, this phase can be deferred to after Phase C ships.

---

### Phase E — Staff & Access Control 🔲 Pending design

> Blocked on: Paula interview — how many staff members, what roles exist

**Goal:** Each staff member has an account with appropriate access level.

| Feature | Notes |
|---|---|
| Staff profiles — name, role, email | |
| Role-based access control — vet vs. receptionist vs. admin | Receptionist cannot access clinical notes |
| Role-scoped views | |

---

## v2 — Chatbot + WhatsApp + Automation

> Starts only after v1 is stable and Paula is using NeoVet as her primary tool.

| Feature | Area |
|---|---|
| CRM public API — endpoints for the chatbot to read/write appointments | Integration |
| Online self-booking via chatbot | Scheduling |
| WhatsApp two-way messaging (Kapso) | Communication |
| Automated appointment reminders — 24h and 1h before | Communication |
| Automated vaccination reminders | Communication |
| Appointment confirmations via WhatsApp | Communication |
| Post-visit follow-up messages | Communication |
| No-show tracking | Scheduling |
| Cancellation & rescheduling with audit trail | Scheduling |
| Brachycephalic breed flags — heightened urgency triage | Triage |
| Expense tracking | Billing |
| Financial reporting | Reporting |
| Appointment analytics | Reporting |
| Audit log — all record changes with user + timestamp | Operations |
| Calendar sync (Google / iCal) | Integration |
| Prescription management | Clinical |
| Lab results — attach and display | Clinical |
| Anesthesia records | Clinical |
| Discharge summaries | Clinical |
| Chatbot conversation analytics | Reporting |
| Digital whiteboard — real-time clinic status | Operations |
| Inventory: consumption linked to consultations | Inventory |
| Inventory: expiry date tracking | Inventory |
| Inventory: purchase orders | Inventory |

---

## v3 — Intelligence & Advanced Automation

> Starts only after v2 is stable. These features require validated usage data from v1/v2.

| Feature | Area |
|---|---|
| AI SOAP dictation — voice-to-text that populates SOAP fields | Clinical AI |
| AI record summaries for referring vets | Clinical AI |
| Revenue dashboards — by period, vet, service | BI |
| Patient retention metrics | BI |
| Custom report builder | BI |
| Business intelligence — trend analysis, forecasting | BI |
| Online payments — MercadoPago / QR | Billing |
| Insurance claims support | Billing |
| Pet parent portal / app | Client-facing |
| Birthday messages | Communication |
| Email campaigns | Communication |
| Boarding reservations | Scheduling |
| Grooming bookings | Scheduling |
| Staff scheduling / shifts | Operations |
| Multi-location support | Operations |
| Controlled substance log | Inventory |
| Auto-reorder rules | Inventory |
| Laboratory integrations (IDEXX, Antech) | Integration |
| Imaging systems (DICOM) | Integration |
| Accounting software export (Contabilium, Xero) | Integration |

---

## Open questions (resolve at Paula meeting)

Full list in `../../docs/paula-meeting.md`. Key blockers for this plan:

| Question | Blocks |
|---|---|
| Does she need AFIP billing from day 1? | Phase D priority vs. deferral |
| Parallel operation or hard cutover? | v1 launch strategy |
| Clinical history format — SOAP or free text? | Phase C design |
| How many staff members and what roles? | Phase E scope |
| Soft-delete or hard-delete preference? | Phase B B.3 dialog copy + schema |

---

## What is permanently out of scope

- Geovet integration — no API exists, no scraping, no sync. Excel export only.
- CRM ↔ chatbot integration in v1 — they are independent until v2.
- WhatsApp in v1 — chatbot delivers via web widget only.
