# Project Charter — NeoVet CRM

| Field | Value |
|---|---|
| **Project name** | NeoVet CRM |
| **Client** | NeoVet (Paula Silveira) |
| **Client contact** | Paula Silveira — clinic owner |
| **Internal owner** | Tomás Pinolini |
| **Tech lead** | Franco Zancocchia |
| **Start date** | <!-- YYYY-MM-DD --> |
| **Target delivery (v1)** | <!-- YYYY-MM-DD --> |
| **Charter version** | 1.0 |
| **Last updated** | 2026-03-28 |

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
- Appointment management: create, view, update, cancel, complete
- Appointment → consultation flow (complete a visit and register clinical notes inline)
- Email login for staff (Supabase Auth)
- One-time data import from Geovet CSV exports (clients, patients, consultations)

### Out of scope (v1)

- Public API (no chatbot integration)
- Automation or notifications
- Reporting or analytics
- Multi-clinic or multi-location support

### Assumptions

- Paula will provide a Geovet Excel export for data migration testing
- Staff will access the CRM via desktop browser — no mobile app required in v1

---

## Deliverables

| # | Deliverable | Owner | Status |
|---|---|---|---|
| D1 | Staff can log in and manage clients/patients | Franco | ✅ Done |
| D2 | Appointment calendar with CRUD | Franco | ✅ Done |
| D3 | Data imported from Geovet export | Franco + Paula | ✅ Done (1,771 clients · 1,380 patients · ~1,300 consultations) |
| D4 | Clinical history: SOAP consultations + treatment plans | Franco | ✅ Done |
| D5 | Vaccinations, deworming records, document storage | Franco | ✅ Done |
| D6 | Billing / AFIP integration | Franco | 🔲 Pending Paula confirmation |
| D7 | Staff profiles and role-based access control | Franco | 🔲 Pending Paula confirmation |

---

## Timeline

| Phase | Description | Status |
|---|---|---|
| Discovery | Data model requirements, Geovet export analysis | ✅ Done |
| Build — Phases A–C | Foundation, CRUD, clinical records, data import | ✅ Done |
| Build — Phase D | Billing + AFIP integration | 🔲 Blocked on Paula meeting |
| Build — Phase E | Staff + access control | 🔲 Blocked on Paula meeting |
| QA | Internal testing with real clinic data | 🔄 In progress |
| UAT | Paula and team acceptance testing | 🔲 Pending |
| Launch | Deploy to Vercel | 🔲 Pending |

---

## Risks

| # | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| R1 | Geovet export format is inconsistent or incomplete | Medium | Medium | Analyze export early; build flexible import parser |
| R2 | Scope creep into chatbot API integration | Medium | High | Enforce v1 boundary — no public API until v2 |

---

## Success Criteria

- Paula uses NeoVet as her primary tool for daily operations (replaces Geovet)
- Historical data imported from Geovet with no data loss
- Paula can register a full clinic visit (consultation + SOAP + vitals + treatments + vaccination) in one flow
