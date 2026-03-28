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

### Phase C — Clinical Records 🔲 Ready to build

> Open questions for Paula meeting listed below. Schema is designed; SOAP field labels and some UX decisions pending her input before C.2 UI is built. C.1 can start immediately.

**Goal:** Paula can record and retrieve full clinical history per patient from NeoVet.

---

#### C.1 — Patient status + avatar ✅ Done

**Migrations:** add `deceased boolean NOT NULL DEFAULT false` and `avatar_url text` to `patients`.

| Deliverable | Status |
|---|---|
| `deceased` flag + "Fallecido" badge on patient detail and client detail | ✅ |
| Avatar upload to Supabase Storage (`patient-avatars` bucket, public read) | ✅ |
| Deceased patients dimmed/badged on patient list | ✅ |

---

#### C.2 — Consultations + SOAP + vitals ✅ Done

**New table:** `consultations` — links to patient + optional appointment; SOAP fields (all optional) + free-text `notes` fallback + vitals (weight, temperature, heart rate, respiratory rate) + diagnosis.

| Deliverable | Status |
|---|---|
| `consultations` schema + migration | ✅ |
| `/dashboard/consultations/new?patientId=` — create form | ✅ |
| `/dashboard/consultations/[id]` — detail page | ✅ |
| `/dashboard/consultations/[id]/edit` — edit page | ✅ |
| Patient detail: "Historia clínica" section with timeline | ✅ |
| Appointment detail: "Registrar consulta" button when status=completed | ✅ |

---

#### C.3 — Treatment plan

**New table:** `treatment_items` — ordered list scoped to a consultation; status: `pending` / `active` / `completed`.

| Deliverable | Status |
|---|---|
| `treatment_items` schema + `treatment_status` enum + migration | 🔲 |
| Dynamic treatment item list inside consultation form | 🔲 |
| Inline status toggle on consultation detail page | 🔲 |

---

#### C.4 — Vaccinations and deworming

**New tables:** `vaccinations`, `deworming_records` — both scoped to patient; optionally linked to a consultation.

| Deliverable | Status |
|---|---|
| `vaccinations` + `deworming_records` schemas + migration | 🔲 |
| Vaccination CRUD under patient detail (table + create/edit forms) | 🔲 |
| Deworming CRUD under patient detail (table + create/edit forms) | 🔲 |

---

#### C.5 — Document storage

**New table:** `documents` — file metadata; files stored in Supabase Storage (`clinical-documents` bucket, authenticated access + signed URLs for download).

| Deliverable | Status |
|---|---|
| `documents` schema + migration | 🔲 |
| `clinical-documents` Storage bucket + RLS policy | 🔲 |
| Document upload on consultation detail page | 🔲 |
| Document upload on patient detail page (patient-level docs) | 🔲 |
| Signed-URL download + delete | 🔲 |

---

#### C.6 — Patient detail page tab redesign

UI-only refactor — no new data. Consolidates the patient detail page (which by C.5 is very long) into tabs: Información · Historia clínica · Vacunas · Desparasitaciones · Documentos. Active tab reflected in `?tab=` query param for deep-linking.

---

#### New schema files

| File | Tables |
|---|---|
| `src/db/schema/consultations.ts` | `consultations` |
| `src/db/schema/treatment_items.ts` | `treatmentStatusEnum`, `treatmentItems` |
| `src/db/schema/vaccinations.ts` | `vaccinations` |
| `src/db/schema/deworming_records.ts` | `dewormingRecords` |
| `src/db/schema/documents.ts` | `documents` |

New ID prefixes to add to `src/lib/ids.ts`: `con_`, `trt_`, `vac_`, `dew_`, `doc_`.

#### New Supabase Storage buckets

| Bucket | Access | Max size |
|---|---|---|
| `patient-avatars` | Public read / auth write | 2 MB |
| `clinical-documents` | Auth only (signed URLs) | 10 MB |

---

#### Open questions for Paula (before building C.2 UI)

| # | Question | Blocks |
|---|---|---|
| OQ-C1 | Do all four SOAP fields work for her, or does she prefer different labels (e.g. "Motivo + Hallazgos + Plan")? | C.2 form labels |
| OQ-C2 | Should free-text `notes` always be visible alongside SOAP, or only as a fallback? | C.2 form layout |
| OQ-C3 | Are heart rate and respiratory rate routinely recorded, or mostly weight + temperature? | C.2 vitals UI prominence |
| OQ-C4 | Treatment items: should pending items carry forward to the next consultation, or is each list independent? | C.3 model |
| OQ-C5 | Does the clinic follow a standard vaccination schedule that could auto-populate "next due date"? | C.4 UX |
| OQ-C6 | Are 10 MB per document and 50 MB total Storage (free tier) sufficient? | C.5 limits |
| OQ-C7 | "Fallecido" vs "inactivo" — is there a meaningful distinction, or is one flag enough? | C.1 schema |
| OQ-C8 | When a consultation is linked to an appointment, should saving the consultation auto-mark the appointment as `completed`? | C.2 actions |

---

#### Phase C verification checklist

- [ ] `npm run build` passes after each sub-phase migration
- [ ] All CRUD flows for consultations, vaccinations, deworming, documents work end-to-end
- [ ] Deceased flag shows badge in all relevant places; does not delete data
- [ ] Avatar upload and replacement work; broken images never appear
- [ ] SOAP fields all optional — consultation with only `notes` saves correctly
- [ ] Vital signs save as correct numeric types
- [ ] Treatment item status toggle works without full page reload
- [ ] Documents: upload, download (signed URL), and delete all work; large/invalid files rejected
- [ ] `?tab=` deep-links open the correct tab on patient detail
- [ ] All new server actions protected by Supabase session (no unprotected routes)
- [ ] All Zod errors display in Spanish under the correct fields
- [ ] Migration files committed and sequential in `drizzle/migrations/`
- [ ] Paula UAT: full visit (consultation + SOAP + vitals + 2 treatment items + 1 vaccination + 1 document) created and viewable

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
