# Project Charter — NeoVet CRM

| Field | Value |
|---|---|
| **Project name** | NeoVet CRM |
| **Client** | NeoVet (Paula Silveira) |
| **Client contact** | Paula Silveira — clinic owner |
| **Internal owner** | Tomás Pinolini |
| **Tech lead** | Franco Zancocchia |
| **Start date** | 2026-03-01 |
| **Target delivery (v1)** | TBD — pending Phase E completion and UAT |
| **Charter version** | 1.1 |
| **Last updated** | 2026-03-29 |

---

## Problem Statement

The clinic currently manages clients, patients, and appointments using Geovet — a CRM with no API and no automation. Appointment management is duplicated across Geovet and an external calendar. There is no way to programmatically read or write to Geovet, and no integration path with the chatbot. The team needs a custom CRM they fully control.

---

## Proposed Solution

A staff-only internal tool for managing clients (pet owners), patients (pets), clinical history, and appointments. v1 is purely manual — no automation, no notifications, no chatbot integration. It replaces Geovet as the system of record for the clinic's operational data.

---

## Scope

### In scope (v1)

- Client (owner) CRUD: name, contact info, WhatsApp number
- Patient (pet) CRUD: name, species, breed, avatar, deceased flag — linked to owner
- Clinical history: SOAP consultations with vitals, treatment plans, vaccinations, deworming records
- Document storage per patient (Supabase Storage, signed-URL downloads)
- Appointment management: create, view, update, cancel, complete; typed as `veterinary` or `grooming`; assignable to a staff member
- Appointment → consultation flow (complete a visit and register clinical notes inline)
- Grooming module: per-patient grooming profile (behavior, coat, estimated time); grooming session records (before/after photos, findings, pricing tiers); 3-tier pricing configured by admin
- Role-based access control: `admin` (full access), `vet` (clinical records only), `groomer` (grooming appointments and sessions only)
- Staff management UI (admin only): create/edit/delete staff accounts and assign roles
- Settings page (admin only): configurable grooming base prices per tier
- Email login for staff (Supabase Auth)
- One-time data import from Geovet CSV exports (clients, patients, consultations)

### Out of scope (v1)

- Public API (no chatbot integration)
- Automation or notifications (WhatsApp reminders are v2)
- Reporting or analytics
- Multi-clinic or multi-location support
- Grooming findings → vet escalation (pending groomer interview — v2)

### Assumptions

- Paula will provide a Geovet Excel export for data migration testing
- Staff will access the CRM via desktop browser — no mobile app required in v1
- Each staff member is created by an admin — no self-registration

---

## Deliverables

| # | Deliverable | Owner | Status |
|---|---|---|---|
| D1 | Staff can log in and manage clients/patients | Franco | ✅ Done |
| D2 | Appointment calendar with CRUD | Franco | ✅ Done |
| D3 | Data imported from Geovet export | Franco + Paula | ✅ Done (1,771 clients · 1,380 patients · ~1,300 consultations) |
| D4 | Clinical history: SOAP consultations + treatment plans | Franco | ✅ Done |
| D5 | Vaccinations, deworming records, document storage | Franco | ✅ Done |
| D6 | Role-based access control (admin / vet / groomer) + staff management UI | Franco | 🔄 In progress |
| D7 | Grooming module: profiles, sessions, photos, findings, pricing tiers | Franco | 🔄 In progress |
| D8 | Billing / AFIP electronic invoicing | Franco | 🔲 Confirmed in scope — pending build |

---

## Timeline

| Phase | Description | Status |
|---|---|---|
| Discovery | Data model requirements, Geovet export analysis | ✅ Done |
| Build — Phases A–C | Foundation, CRUD, clinical records, data import | ✅ Done |
| Build — Phase E | Staff + access control + grooming module | 🔄 In progress |
| Build — Phase D | Billing + AFIP integration | 🔲 Confirmed — pending Phase E completion |
| QA | Internal testing with real clinic data | 🔄 In progress |
| UAT | Paula and team acceptance testing | 🔲 Pending |
| Launch | Deploy to Vercel | 🔲 Pending |

---

## Risks

| # | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| R1 | Geovet export format is inconsistent or incomplete | Medium | Medium | Resolved — export analyzed and imported successfully |
| R2 | Scope creep into chatbot API integration | Medium | High | Enforce v1 boundary — no public API until v2 |
| R3 | AFIP billing complexity delays v1 launch | High | High | Paula confirmed billing is required for v1 — scope it carefully, certificate setup must be done early |
| R4 | Grooming findings escalation logic undefined | Medium | Low | Deferred pending groomer interview — checkboxes built, alerting logic is v2 |

---

## Success Criteria

- Paula uses NeoVet as her primary tool for daily operations (replaces Geovet)
- Historical data imported from Geovet with no data loss
- Paula can register a full clinic visit (consultation + SOAP + vitals + treatments + vaccination) in one flow
- Groomers can register a full grooming session (profile, findings, photos, pricing) independently
- Each staff role only sees and can do what their role requires — no overpermissioned access
