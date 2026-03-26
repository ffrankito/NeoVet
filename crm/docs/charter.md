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
| **Last updated** | 2026-03-26 |

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
- Patient (pet) CRUD: name, species, breed, linked to owner
- Clinical history per patient
- Appointment management: create, view, update, cancel
- Email login for staff (Supabase Auth)
- One-time data import from Geovet Excel exports

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
| D1 | Staff can log in and manage clients/patients | Franco | Pending |
| D2 | Appointment calendar with CRUD | Franco | Pending |
| D3 | Data imported from Geovet export | Franco + Paula | Pending |

---

## Timeline

| Phase | Description | Status |
|---|---|---|
| Discovery | Data model requirements, Geovet export analysis | Pending |
| Build | CRM implementation | Pending |
| QA | Internal testing with real clinic data | Pending |
| UAT | Paula and team acceptance testing | Pending |
| Launch | Deploy to Vercel | Pending |

---

## Risks

| # | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| R1 | Geovet export format is inconsistent or incomplete | Medium | Medium | Analyze export early; build flexible import parser |
| R2 | Scope creep into chatbot API integration | Medium | High | Enforce v1 boundary — no public API until v2 |

---

## Success Criteria

- Paula and her team can fully manage clients, patients, and appointments without using Geovet
- Historical data imported from Geovet with no data loss
- <!-- TODO: add measurable acceptance criteria with Paula -->
