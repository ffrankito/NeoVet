# Project Charter — NeoVet CRM

| Field | Value |
|---|---|
| **Project name** | NeoVet CRM |
| **Client** | NeoVet (Paula Silveira) |
| **Client contact** | Paula Silveira — clinic owner |
| **Internal owner** | Tomás Pinolini |
| **Tech lead** | Franco Zancocchia |
| **Start date** | 2026-03-01 |
| **Target delivery (v1)** | 2026-04-20 (UAT: 2026-04-13 a 2026-04-17) |
| **Charter version** | 1.3 |
| **Last updated** | 2026-04-09 |

---

## Problem Statement

The clinic currently manages clients, patients, and appointments using Geovet — a CRM with no API and no automation. Appointment management is duplicated across Geovet and an external calendar. There is no way to programmatically read or write to Geovet, and no integration path with the chatbot. The team needs a custom CRM they fully control.

---

## Proposed Solution

A staff-only internal tool for managing clients (pet owners), patients (pets), clinical history, appointments, grooming, pet shop, cash register, and email reminders. It replaces Geovet as the system of record for the clinic's operational data. No chatbot integration in v1.

---

## Scope

### In scope (v1)

- Client (owner) CRUD: name, contact info, WhatsApp number
- Patient (pet) CRUD: name, species, breed, avatar, deceased flag — linked to owner
- Clinical history: SOAP consultations with vitals, treatment plans (medication, dose, frequency, duration), vaccinations, deworming records
- Complementary methods: inline reports per consultation (ultrasound, blood work, etc.) with optional photo attachments
- Document storage per patient (Supabase Storage, signed-URL downloads) with categories (laboratorio, radiografia, ecografia, foto, otro)
- Appointment management: create, view, update, cancel, complete; typed as `veterinary` or `grooming`; assignable to a staff member; consultation type (clínica / virtual / domicilio)
- Appointment → consultation flow (complete a visit and register clinical notes inline)
- Service catalog: configurable list of services with default duration and surgery block time
- Calendar: weekly view (desktop) / daily view (mobile) with color-coded services, surgery blocks, and staff filter
- Schedule blocks: professionals can block their own schedule by day(s) or time range; auto-cancels affected appointments
- Grooming module: per-patient grooming profile (behavior, coat, estimated time); grooming session records (before/after photos, findings, pricing tiers); 3-tier pricing configured by admin
- Email reminders via Resend + Vercel Cron: appointment 48h/24h before, vaccine 7 days before, post-consultation follow-ups
- Pet shop: product catalog (9 categories), providers, stock entries, sales with multi-item cart, payment methods; stock auto-updates on entry/sale
- Cash register: daily open/close sessions, income/expense movements, breakdown by payment method
- Hospitalizations: admission with reason/notes, daily observations (vitals + clinical), discharge. One active hospitalization per patient
- Procedures: registration with surgeon/anesthesiologist, supply consumption from inventory (auto-decrements stock), post-procedure follow-ups
- Consent documents: PDF generation via templates (surgery authorization, euthanasia certificate, reproductive agreement) with auto-filled patient/client/vet data. Stored in Supabase Storage
- Charges & debtors: polymorphic charges per consultation/grooming/procedure/sale/hospitalization, partial/total payments, debtors dashboard sorted by outstanding balance. Auto-charge on consultation, grooming session, and pet shop sale
- Billing (Phase D — deferred to post-launch): payment registration, ARCA electronic invoicing (Factura A/B/C), two fiscal entities, billing limit controls
- Role-based access control: `admin` (full access), `owner` (full access, same as admin), `vet` (clinical records only), `groomer` (grooming appointments and sessions only)
- Staff management UI (admin only): create/edit/deactivate staff accounts and assign roles
- Settings page (admin only): configurable grooming base prices per tier
- Mobile-responsive UI for all main flows
- Email login for staff (Supabase Auth)
- One-time data import from Geovet CSV exports (clients, patients, consultations, products)

### Out of scope (v1)

- Public API (no chatbot integration)
- WhatsApp notifications (v2 — email only in v1)
- Reporting or analytics
- Multi-clinic or multi-location support
- Grooming findings → vet escalation (pending groomer interview — v2)

### Assumptions

- Paula will provide a Geovet Excel export for data migration testing
- Staff will access the CRM via desktop browser and mobile browser — responsive UI, no native app
- Each staff member is created by an admin — no self-registration

---

## Deliverables

| # | Deliverable | Owner | Status |
|---|---|---|---|
| D1 | Staff can log in and manage clients/patients | Franco | ✅ Done |
| D2 | Appointment calendar with CRUD | Franco | ✅ Done |
| D3 | Data imported from Geovet export | Franco + Paula | ✅ Done (1,771 clients · 1,380 patients · ~1,300 consultations · ~413 products) |
| D4 | Clinical history: SOAP consultations + treatment plans + complementary methods | Franco | ✅ Done |
| D5 | Vaccinations, deworming records, document storage with categories | Franco | ✅ Done |
| D6 | Role-based access control (admin / vet / groomer) + staff management UI | Franco | ✅ Done |
| D7 | Grooming module: profiles, sessions, photos, findings, pricing tiers | Franco | ✅ Done |
| D8 | Service catalog with default durations and surgery blocks | Franco | ✅ Done |
| D9 | Weekly calendar view with surgery blocks, schedule suspensions, staff filter | Franco | ✅ Done |
| D10 | Email reminders: appointment 48h/24h, vaccine 7d, post-consultation follow-ups | Franco | ✅ Done |
| D11 | Mobile-responsive UI | Franco | ✅ Done |
| D12 | Pet shop: products, providers, stock entries, sales | Franco | ✅ Done |
| D13 | Cash register: sessions, movements, payment method breakdown | Franco | ✅ Done |
| D14 | Billing: ARCA electronic invoicing (Factura A/B/C), two fiscal entities, limit controls | Franco | 🔲 Deferred to post-launch (blocked on ARCA credentials) |
| D15 | Hospitalizations: admission, daily observations (vitals + clinical), discharge | Franco | ✅ Done |
| D16 | Procedures: registration with surgeon/anesthesiologist, supply consumption from inventory, post-procedure follow-ups | Franco | ✅ Done |
| D17 | Consent documents: PDF generation (surgery authorization, euthanasia certificate, reproductive agreement) with auto-filled data | Franco | ✅ Done |
| D18 | Charges & debtors: polymorphic charges per consultation/grooming/procedure/sale/hospitalization, partial/total payments, debtors dashboard | Franco | ✅ Done |
| D19 | Delivery documentation: admin user guide, UAT testing guide, pre-launch checklist, v1/v2 brochures | Tomás | ✅ Done |

---

## Timeline

| Phase | Description | Status |
|---|---|---|
| Discovery | Data model requirements, Geovet export analysis | ✅ Done |
| Build — Phases A–C | Foundation, CRUD, clinical records, data import | ✅ Done |
| Build — Phase E | Staff + access control + grooming module | ✅ Done |
| Build — Phase F | Clinical history enhancements (consultation types, treatment fields, complementary methods, document categories) | ✅ Done |
| Build — Phase G | Service catalog | ✅ Done |
| Build — Phase H | Calendar view + surgery blocks + schedule suspensions | ✅ Done |
| Build — Phase I | Email reminders (appointment, vaccine, follow-up) | ✅ Done |
| Build — Phase J | Mobile-responsive UI | ✅ Done |
| Build — Phase K | Pet shop (products, providers, stock, sales) | ✅ Done |
| Build — Phase K.B | Cash register (sessions, movements) | ✅ Done |
| Build — Phase L | Day-one preparation (dashboard filtering, no-show, cancellation reason, email notifications, etc.) | ✅ Done |
| Build — Phase M | Hospitalizations, procedures, consent documents (PDF), charges & debtors | ✅ Done |
| Build — Phase D | Billing + ARCA integration | 🔲 Deferred to post-launch — blocked on ARCA credentials |
| QA | Internal testing with real clinic data | ✅ Done (core features) |
| Demo | Presentation to Paula with v2 preview | ✅ Done (2026-04-09) |
| UAT | Paula and team acceptance testing | 🔲 2026-04-13 a 2026-04-17 |
| Delivery | Formal handoff to Paula | 🔲 Scheduled 2026-04-20 |
| Warranty | 60-day bug-fix guarantee | 🔲 2026-04-20 → 2026-06-19 |

---

## Risks

| # | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| R1 | Geovet export format is inconsistent or incomplete | Medium | Medium | ✅ Resolved — export analyzed and imported successfully |
| R2 | Scope creep into chatbot API integration | Medium | High | Enforce v1 boundary — no public API until v2 |
| R3 | ARCA billing complexity delays v1 launch | High | Medium | Phase D is the only remaining v1 deliverable. All core operational features (Phases A–L) are complete and usable without billing. Phase D is blocked on Paula providing ARCA credentials and certificate. |
| R4 | Grooming findings escalation logic undefined | Medium | Low | Deferred pending groomer interview — checkboxes built, alerting logic is v2 |

---

## Success Criteria

- Paula uses NeoVet as her primary tool for daily operations (replaces Geovet)
- Historical data imported from Geovet with no data loss
- Paula can register a full clinic visit (consultation + SOAP + vitals + treatments + vaccination) in one flow
- Groomers can register a full grooming session (profile, findings, photos, pricing) independently
- Each staff role only sees and can do what their role requires — no overpermissioned access
- Pet shop stock is accurate: entries increase stock, sales decrease stock, low-stock alerts visible
- Cash register sessions can be opened, movements tracked, and closed with accurate totals
- Email reminders arrive on time for appointments, vaccines, and follow-ups
