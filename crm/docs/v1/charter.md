# Project Charter — NeoVet CRM

| Field | Value |
|---|---|
| **Project name** | NeoVet CRM |
| **Client** | NeoVet (Paula Silveyra) |
| **Client contact** | Paula Silveyra — clinic owner, Mat. 2046 |
| **Internal owner** | Tomás Pinolini |
| **Tech lead** | Franco Zancocchia |
| **Start date** | 2026-03-01 |
| **Target delivery (v1)** | Pendiente — proyecto en fase de desarrollo post re-scope. UAT sigue postpuesto hasta cerrar los 2 items parciales y el 1 bloqueado restantes de los 8 Paula-facing additions. |
| **Charter version** | 1.5 |
| **Last updated** | 2026-04-23 |

---

## Scope updates since v1.4 (2026-04-17 → 2026-04-23)

Three substantive updates are folded into this revision. See `neovet-vault` for decision-trail detail.

1. **Phase D (ARCA electronic invoicing) moved from v1 to v2.** Decided 2026-04-19, approved by Paula same day via WhatsApp. Rationale: current Virginia-led month-end workflow (daily caja → month-end proportion calculation by contracted estudio → Gabriela generates invoices in ARCA) is functional and not the urgency bottleneck. Virginia reliability validated via Gabriela. D14 is re-classified from "deferred within v1" to "v2 scope".

2. **Nine Paula-facing v1 additions added 2026-04-19.** Surfaced from post-demo interviews with Valdemar, Fernanda, Rocío, and Gabriela. Approved by Paula via WhatsApp ("Dale!"). Detail under Deliverables below (D20–D27). Originally 10 additions including a WhatsApp stopgap auto-reply — see #3.

3. **WhatsApp stopgap auto-reply cancelled 2026-04-22.** At the Paula post-interview sync, Paula revealed her WhatsApp Business number already had a Welcome Message covering horarios, dirección, booking link, emergencia-call, and a no-presupuestos-por-WhatsApp line. The stopgap was solving an already-solved problem. Freed capacity went to accelerating the v2 WhatsApp chatbot — MVP shipped the same afternoon (see §Adjacent v2 work below).

---

## Problem Statement

The clinic currently manages clients, patients, and appointments using Geovet — a CRM with no API and no automation. Appointment management is duplicated across Geovet and an external calendar. There is no way to programmatically read or write to Geovet, and no integration path with the chatbot. The team needs a custom CRM they fully control.

---

## Proposed Solution

A staff-only internal tool for managing clients (pet owners), patients (pets), clinical history, appointments, estética, pet shop, cash register, and email reminders. It replaces Geovet as the system of record for the clinic's operational data.

The v1 web-widget chatbot (FAQ-only) remains architecturally independent from the CRM. The v2 WhatsApp chatbot — which is out of v1 scope but materially in development as of 2026-04-22 — is the only system allowed to consume the CRM, via `BOT_API_KEY`-guarded `/api/bot/*` endpoints.

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
- Estética module: per-patient estética profile (behavior, coat, estimated time); estética session records (before/after photos, findings, configurable service types); per-service base pricing with manual override, configured by admin
- Email reminders via Resend + Vercel Cron: appointment 48h/24h before, vaccine 7 days before, post-consultation follow-ups
- Pet shop: product catalog (9 categories), providers, stock entries, sales with multi-item cart, payment methods; stock auto-updates on entry/sale
- Cash register: daily open/close sessions, income/expense movements, breakdown by payment method
- Hospitalizations: admission with reason/notes, daily observations (vitals + clinical), discharge. One active hospitalization per patient
- Procedures: registration with surgeon/anesthesiologist, supply consumption from inventory (auto-decrements stock), post-procedure follow-ups
- Consent documents: PDF generation via templates (surgery authorization, euthanasia certificate, reproductive agreement) with auto-filled patient/client/vet data. Stored in Supabase Storage
- Charges & debtors: polymorphic charges per consultation/estética/procedure/sale/hospitalization, partial/total payments, debtors dashboard sorted by outstanding balance. Auto-charge on consultation, estética session, and pet shop sale
- Billing (Phase D — deferred to post-launch): payment registration, ARCA electronic invoicing (Factura A/B/C), two fiscal entities, billing limit controls
- Role-based access control: `admin` (full access), `owner` (full access, same as admin), `vet` (clinical records only), `groomer` (estética appointments and sessions only)
- Staff management UI (admin only): create/edit/deactivate staff accounts and assign roles
- Settings page (admin only): configurable estética service types
- Mobile-responsive UI for all main flows
- Email login for staff (Supabase Auth)
- One-time data import from Geovet CSV exports (clients, patients, consultations, products)

### Added 2026-04-19 (v1.5 re-scope)

Nine Paula-facing additions approved via WhatsApp. Stopgap #9 cancelled 2026-04-22 (see Scope Updates §3). Status as of 2026-04-23:

- **A1 — Fluidoterapia + chronological internación timeline.** 🟡 Partial — observation columns done; fluidoterapia as structured data + timeline UI still pending.
- **A2 — Shared calendar between Paula and Fernanda.** ✅ Shipped — multi-staff calendar visibility already worked via the existing staff-filter.
- **A3 — Sedación consent PDF template.** ✅ Shipped 2026-04-13. Pending: Paula's Spanish paragraph for the consent body.
- **A4 — Retorno del consultorio.** ✅ Shipped 2026-04-21 (commit `5803409`, migration `0032`). `retorno_queue` table + 9 state-machine tests + unified sala-de-espera (walk-ins + retornos).
- **A5 — Endocrinología as a service type.** ✅ Shipped 2026-04-20 (migration `0031`). `serviceCategoryEnum` extended.
- **A6 — Pet-name search.** ✅ Done (2026-04-23) — rescoped after audit: *"any entity where the patient is the protagonist must be searchable by pet name"*. Shared `buildPatientAwareSearchClause` helper (searches `patients.name`, `clients.name`, `clients.dni`, `clients.phone`, `clients.address`), with 9 pure unit tests covering each column and empty-input guards. Applied across all 5 patient-centric list pages: **appointments, hospitalizations, procedures, consent-documents, grooming**. Each list page got a "Buscar" input with placeholder *"Mascota, dueño, DNI, teléfono, dirección"*; results paginate correctly under search. Also surfaced a client-data gap — DNI and address fields weren't being captured by the client form; fixed (see A11).
- **A7 — Auto-charge from vet treatments.** 🟡 Partial — consultation-level auto-charge shipped (one line per consultation from service `basePrice`). Per-treatment-item line-charge (MyVete pattern) not built; requires treatment-item model evolution.
- **A8 — Vet read-only pricing.** ✅ Shipped 2026-04-20 (PR #16, commit `cb4dcd5`). `/dashboard/precios` page for admin/owner/vet; `costPrice` hidden.
- **~~A9 — WhatsApp stopgap auto-reply~~.** ❌ Cancelled 2026-04-22 — pre-existing Welcome Message on Paula's WhatsApp Business covered the same content.

### Added 2026-04-19 (engineering workpackage)

- **A10 — Observability (Sentry + Langfuse + PostHog).** 🟡 In progress. T1a (CRM Sentry) shipped + verified 2026-04-20. T1b (chatbot Sentry) + T1c (landing Sentry) code merged 2026-04-20; runtime verification pending Vercel env vars. T2 Langfuse + T3 PostHog queued.

### Added 2026-04-23 (surfaced during A6 smoke test)

- **A11 — Client data fields: DNI + address.** ✅ Shipped. The client form (create + edit) was only capturing name / phone / email, even though the schema has `dni` and `address` columns. Surfaced during smoke test of A6 pet-name search — a client couldn't be found by DNI because DNI was never stored. Added DNI + address inputs to the main client form, the client detail page, and the inline client creation used when creating an appointment for a new client. Paula mentioned at the 2026-04-22 sync that she searches by DNI regularly in GVet, so this is load-bearing for A6. No migration needed — columns already existed.

### Out of scope (v1)

- Public API to the outside world (no end-client facing API)
- Outbound WhatsApp from the CRM (email reminders only in v1; WhatsApp reminders remain v2)
- ARCA electronic invoicing (moved to v2 per Scope Updates §1)
- Reporting or analytics
- Multi-clinic or multi-location support
- Estética findings → vet escalation (pending esteticista interview — v2)
- v2 WhatsApp chatbot itself — *adjacent work* shipped 2026-04-22 but outside v1 scope; see §Adjacent v2 work below.

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
| D7 | Estética module: profiles, sessions, photos, findings, configurable service types | Franco | ✅ Done |
| D8 | Service catalog with default durations and surgery blocks | Franco | ✅ Done |
| D9 | Weekly calendar view with surgery blocks, schedule suspensions, staff filter | Franco | ✅ Done |
| D10 | Email reminders: appointment 48h/24h, vaccine 7d, post-consultation follow-ups | Franco | ✅ Done |
| D11 | Mobile-responsive UI | Franco | ✅ Done |
| D12 | Pet shop: products, providers, stock entries, sales | Franco | ✅ Done |
| D13 | Cash register: sessions, movements, payment method breakdown | Franco | ✅ Done |
| D14 | Billing: ARCA electronic invoicing (Factura A/B/C), two fiscal entities, limit controls | Franco | 🚫 **Moved to v2 (2026-04-19)** — see Scope Updates §1. Current Virginia-led month-end flow continues through v1 and into early v2. |
| D15 | Hospitalizations: admission, daily observations (vitals + clinical), discharge | Franco | ✅ Done |
| D16 | Procedures: registration with surgeon/anesthesiologist, supply consumption from inventory, post-procedure follow-ups | Franco | ✅ Done |
| D17 | Consent documents: PDF generation (surgery authorization, euthanasia certificate, reproductive agreement) with auto-filled data | Franco | ✅ Done |
| D18 | Charges & debtors: polymorphic charges per consultation/grooming/procedure/sale/hospitalization, partial/total payments, debtors dashboard | Franco | ✅ Done |
| D19 | Delivery documentation: admin user guide, UAT testing guide, pre-launch checklist, v1/v2 brochures | Tomás | ✅ Done |
| D20 | Fluidoterapia + internación timeline (A1) | Franco | 🟡 Partial — observation cols done; structured fluidoterapia + timeline UI pending |
| D21 | Shared calendar Paula ↔ Fernanda (A2) | Franco | ✅ Done — satisfied by existing multi-staff calendar; Fernanda walkthrough pending |
| D22 | Sedación consent PDF template (A3) | Franco | ✅ Done — commits `fc30587`, `f4b00f3`, `5c5606e`. Awaiting Paula's Spanish paragraph. |
| D23 | Retorno del consultorio (A4) | Franco | ✅ Done — commit `5803409`, migration `0032` |
| D24 | Endocrinología service type (A5) | Franco | ✅ Done — migration `0031` |
| D25 | Pet-name search (A6) | Franco / Tomás | ✅ Done 2026-04-23 — shared `buildPatientAwareSearchClause` helper + applied across 5 patient-centric list pages (appointments, hospitalizations, procedures, consent-documents, grooming). 9 unit tests covering all columns + guards. |
| D26 | Auto-charge from vet treatments (A7) | Franco | 🟡 Partial — consultation-level done; per-treatment-item line-charge not built |
| D27 | Vet read-only pricing (A8) | Franco | ✅ Done — PR #16, commit `cb4dcd5`, `/dashboard/precios` |
| D28 | Observability: Sentry on all 3 apps + Langfuse + PostHog (A10) | Tomás + Franco | 🟡 In progress — T1a ✅ verified; T1b + T1c code merged, runtime verification pending Vercel env vars; T2 + T3 queued |
| D29 | Client data fields — DNI + address (A11) | Tomás | ✅ Done 2026-04-23 — added to form, detail page, inline creation |

---

## Adjacent v2 work (informational, not v1 scope)

**v2 WhatsApp chatbot MVP shipped 2026-04-22.** Franco shipped the Kapso integration the same afternoon as the Paula post-interview sync, in 11 commits (`bd12b70` → `f2ddbe3`, +5182 lines). Webhook live; end-to-end verification against Paula's production number pending.

- **Chatbot side:** `chatbot/src/app/api/whatsapp/webhook/route.ts` + `chatbot/src/lib/whatsapp/{agent,session}.ts` + 5 tools (`buscarCliente`, `crearClienteYPaciente`, `obtenerServicios`, `verificarDisponibilidad`, `reservarTurno`).
- **CRM side (cross-app integration surface):** new `POST /api/bot/clients` endpoint + new `clients.source` column (enum: `whatsapp | web | manual`, migration `0033`). Guarded by `BOT_API_KEY`.
- **This does not alter v1's "no public API" stance.** The v1 web widget remains isolated. Only the v2 WhatsApp channel consumes the CRM. See ADR `2026-04-chatbot-crm-api-narrowed` in the vault for the reconciliation.

Listed here so v1 handoff audits don't miss that the CRM schema now has a `source` column that may show `whatsapp` values pre-v2-launch once Franco tests against his own cell.

---

## Timeline

| Phase | Description | Status |
|---|---|---|
| Discovery | Data model requirements, Geovet export analysis | ✅ Done |
| Build — Phases A–C | Foundation, CRUD, clinical records, data import | ✅ Done |
| Build — Phase E | Staff + access control + estética module | ✅ Done |
| Build — Phase F | Clinical history enhancements (consultation types, treatment fields, complementary methods, document categories) | ✅ Done |
| Build — Phase G | Service catalog | ✅ Done |
| Build — Phase H | Calendar view + surgery blocks + schedule suspensions | ✅ Done |
| Build — Phase I | Email reminders (appointment, vaccine, follow-up) | ✅ Done |
| Build — Phase J | Mobile-responsive UI | ✅ Done |
| Build — Phase K | Pet shop (products, providers, stock, sales) | ✅ Done |
| Build — Phase K.B | Cash register (sessions, movements) | ✅ Done |
| Build — Phase L | Day-one preparation (dashboard filtering, no-show, cancellation reason, email notifications, etc.) | ✅ Done |
| Build — Phase M | Hospitalizations, procedures, consent documents (PDF), charges & debtors | ✅ Done |
| Build — Phase D | Billing + ARCA integration | 🚫 Moved to v2 (2026-04-19) — see Scope Updates §1 |
| Build — Phase N | 2026-04-19 re-scope absorption: 8 Paula-facing additions (A1–A8) + engineering observability (A10) | 🟡 In progress — 6 shipped (A2, A3, A4, A5, A6, A8), 2 partial (A1 fluidoterapia, A7 auto-charge per-item), 1 cancelled (A9 stopgap), 1 blocked on Paula's sedación text |
| Demo | Presentation to Paula with v2 preview | ✅ Done (2026-04-09) |
| Post-demo interviews | Individual interviews with Valdemar, Fernanda, Rocío, Gabriela | ✅ Done (2026-04-14 / 04-17 / 04-18) |
| Paula sync — scope re-lock | Consolidation meeting with Paula on interview outcomes, scope confirmation, L4 keyword dictation | ✅ Done (2026-04-22) |
| QA | Internal testing with real clinic data | ✅ Done (core features); re-run needed for D20–D28 |
| UAT | Paula and team acceptance testing | 🔲 Postpuesto — reprogramable cuando A1 / A6 / A7 cierren (partials → shipped) y Paula entregue el párrafo de sedación (A3) |
| Delivery | Formal handoff to Paula | 🔲 Pendiente — TBD tras UAT |
| Warranty | 60-day bug-fix guarantee | 🔲 Pendiente — 60 días desde entrega |

---

## Risks

| # | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| R1 | Geovet export format is inconsistent or incomplete | Medium | Medium | ✅ Resolved — export analyzed and imported successfully |
| R2 | Scope creep from v2 work into v1 | Medium | High | The 2026-04-22 v2 WhatsApp bot MVP is tracked as *adjacent v2 work*, not v1 scope. v1's "no public API" rule narrows to "v1 web widget is isolated; v2 WhatsApp channel may consume `/api/bot/*` only". Ongoing enforcement: code reviews flag chatbot-side calls to the CRM from the web widget path. |
| R3 | ~~ARCA billing complexity delays v1 launch~~ | — | — | ✅ Neutralized — Phase D moved to v2 (see Scope Updates §1) |
| R4 | Estética findings escalation logic undefined | Medium | Low | Deferred pending esteticista interview — checkboxes built, alerting logic is v2. Esteticista slot currently vacant (Lautaro left); revisit when replacement hired. |
| R5 | v1 partial deliverables (A1, A6, A7) cause UAT slip | Medium | Medium | A1 fluidoterapia needs structured schema + timeline UI; A6 needs patient-directory search + booking pet-lookup; A7 needs treatment-item model evolution (coupled with A8 pricing visibility, already shipped). Timeboxed: if any of the three aren't closable in 1–2 sessions, descope to v1.5 follow-up. |
| R6 | Doc-lag between code and vault | High | Medium | Franco transitioning to direct vault contribution per Option C (2026-04-23). Fallback: ship-note ingest workflow (Option A). Monitored in [[wiki/people/franco-zancocchia]]. |

---

## Success Criteria

- Paula uses NeoVet as her primary tool for daily operations (replaces Geovet)
- Historical data imported from Geovet with no data loss
- Paula can register a full clinic visit (consultation + SOAP + vitals + treatments + vaccination) in one flow
- Esteticistas can register a full estética session (profile, findings, photos, pricing) independently
- Each staff role only sees and can do what their role requires — no overpermissioned access
- Pet shop stock is accurate: entries increase stock, sales decrease stock, low-stock alerts visible
- Cash register sessions can be opened, movements tracked, and closed with accurate totals
- Email reminders arrive on time for appointments, vaccines, and follow-ups
