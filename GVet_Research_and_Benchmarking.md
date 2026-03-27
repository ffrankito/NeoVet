# NeoVet — Veterinary CRM Research & Benchmarking

*March 2026 · Prepared by Tomás Pinolini*

This document compiles a full capability audit of GVet (gvetsoft.com) — the CRM currently used by the clinic — followed by an extended feature taxonomy for veterinary systems in general, and concludes with a benchmarking review of leading vet CRM platforms to guide NeoVet's design decisions.

---

## Table of Contents

1. [GVet (gvetsoft.com) — Capability Audit](#1-gvet-gvetsoftcom--capability-audit)
2. [Extended Feature Taxonomy for Veterinary Systems](#2-extended-feature-taxonomy-for-veterinary-systems)
3. [Competitor CRM Benchmarking](#3-competitor-crm-benchmarking)
4. [Synthesis & NeoVet Design Implications](#4-synthesis--neovet-design-implications)

---

## 1. GVet (gvetsoft.com) — Capability Audit

GVet is an online veterinary practice management system developed in Argentina, currently used by Paula Silveira's clinic as their primary CRM. It is a cloud-based SaaS product accessible from any device with an internet connection — no installation required. The platform is specifically designed for the LATAM market and includes Argentina-specific features such as AFIP electronic billing integration.

> ⚠️ **Hard constraint for NeoVet:** GVet exposes no API, no webhooks, and no programmatic access of any kind. The only data migration path is a one-time manual Excel export.

---

### 1.1 Core Modules

#### Client & Patient Management

GVet's central module organizes all clinical and administrative data around the owner/patient pair.

| Feature | Description |
|---|---|
| Client records | Owner name, contact details, address, communication preferences |
| Patient records | Species, breed, date of birth, sex, microchip number, photo |
| Medical history | Full clinical history per patient, including consultations, diagnoses, and treatments |
| File attachments | Upload and associate files (images, lab results, PDFs) directly to a patient record |
| Complementary methods | Support for imaging and diagnostic data (X-rays, ultrasounds, etc.) |
| Admissions | Track and manage hospital admissions and in-clinic stays |

#### Appointment Scheduling

GVet includes a built-in scheduling module for managing clinic appointments (turnos).

| Feature | Description |
|---|---|
| Calendar view | Visual daily/weekly agenda for managing clinic slots |
| Appointment booking | Create and assign appointments to patients and staff members |
| Multi-resource | Supports scheduling across multiple veterinarians or rooms |
| Status tracking | Track appointment statuses (confirmed, pending, completed, cancelled) |
| WhatsApp notifications | Automatic client notifications for appointment reminders via WhatsApp |

#### Billing & Invoicing

GVet handles end-to-end billing, including Argentina's regulatory requirements.

| Feature | Description |
|---|---|
| Electronic billing (AFIP) | Direct integration with AFIP for legally valid digital invoices in Argentina |
| Invoice generation | Create and send invoices per consultation, product, or service |
| Payment tracking | Record and track payments, outstanding balances |
| Sales reports | View sales history and revenue breakdowns |
| Price lists | Configure service and product pricing |

#### Inventory & Stock Control

A complete module for managing clinic supplies, medications, and products.

| Feature | Description |
|---|---|
| Stock tracking | Real-time inventory levels per product |
| Sales tracking | Link product consumption to consultations and billing |
| Supplier management | Manage supplier contacts and purchase history |
| Stock alerts | Notifications when stock drops below defined thresholds |
| Product catalog | Full product list with pricing and category organization |

#### Mobile & Multi-device Access

| Feature | Description |
|---|---|
| Web application | Fully browser-based, no installation needed |
| Mobile app (staff) | iOS and Android app for staff — access records, agenda, and key functions on the go |
| Client mobile app | A separate app for pet owners to view their pet's records and receive notifications |
| Cross-device sync | All data synchronized in real time across devices |

#### Reporting & Analytics

| Feature | Description |
|---|---|
| Sales reports | Revenue and sales summaries filterable by period |
| Inventory reports | Stock movement and usage analysis |
| Patient activity | Consultation frequency and patient engagement metrics |

---

### 1.2 Notable Limitations (for NeoVet)

- No public API or webhook system — zero integration potential without rebuilding from scratch.
- No chatbot or automated conversational interface.
- No urgency triage or emergency escalation system.
- No native WhatsApp two-way messaging (outbound notifications only).
- No telemedicine or video consultation capabilities.
- No AI-powered features (SOAP notes, auto-summaries, diagnostics support).
- No multi-clinic or multi-location support reported.
- No boarding or grooming management module.
- Data export limited to manual Excel files — no automated sync.

---

## 2. Extended Feature Taxonomy for Veterinary Systems

The following section catalogues every significant functional area a modern veterinary practice management system could address. Each item is tagged with a suggested version target for NeoVet (v1 / v2 / v3) based on the project's versioning strategy.

> **Version targets:** v1 = works, manual, no cross-app integrations · v2 = chatbot ↔ CRM integration, WhatsApp live · v3 = automation, reporting, advanced features

---

### 2.1 Client & Patient Management

| Feature | Version |
|---|---|
| Owner profiles — full contact info, preferred communication channel, billing address | v1 |
| Pet profiles — species, breed, DOB, sex, weight, microchip, insurance | v1 |
| Multi-pet households — one owner linked to multiple patients | v1 |
| Photo / avatar — patient photo for quick identification | v1 |
| Medical history timeline — chronological view of all events per patient | v1 |
| Document storage — attach lab results, imaging, referral letters | v1 |
| Referral tracking — track referring vets and internal referrals | v2 |
| Deceased/inactive flag — soft-delete patients without losing history | v1 |
| Import from Excel (Geovet) — one-time migration of existing patient data | v1 |

### 2.2 Appointment & Scheduling

| Feature | Version |
|---|---|
| Calendar view (day/week/month) — visual agenda for the clinic | v1 |
| Online self-booking — clients book appointments via web or chatbot | v2 |
| Appointment types & durations — configure different slot types (consultation, surgery, etc.) | v1 |
| Resource management — assign vet, room, and equipment to each appointment | v1 |
| Waitlist management — queue clients when preferred slots are full | v2 |
| Recurring appointments — auto-create follow-up or vaccination appointments | v2 |
| Appointment status workflow — Booked → Confirmed → Checked-in → In consultation → Discharged | v1 |
| Automated reminders — SMS/WhatsApp/email reminders 24h and 1h before | v2 |
| Cancellation & rescheduling — client or staff can cancel/reschedule with audit trail | v2 |
| No-show tracking — flag missed appointments and follow up | v2 |
| Boarding reservations — manage multi-day in-clinic stays | v3 |
| Grooming bookings — separate slot type for grooming services | v3 |

### 2.3 Clinical Records (EMR/EHR)

| Feature | Version |
|---|---|
| SOAP notes — Subjective, Objective, Assessment, Plan per consultation | v1 |
| Vital signs — weight, temperature, heart rate, respiratory rate | v1 |
| Diagnosis coding — structured diagnoses (free text or ICD-10 equivalent) | v1 |
| Treatment plans — ordered list of treatments with status tracking | v1 |
| Prescription management — generate, track, and refill prescriptions | v2 |
| Vaccination records — log vaccines, lot numbers, expiry dates, next-due reminders | v1 |
| Deworming / parasite control — track preventive care schedules | v1 |
| Lab results — attach and display in-house and external lab results | v2 |
| Imaging — link X-rays, ultrasounds, and other imaging to the record | v2 |
| Dental charting — tooth-by-tooth dental assessment | v3 |
| Body condition maps — visual body scoring and lesion mapping | v3 |
| Anesthesia records — pre-anesthetic assessment and intraoperative logs | v2 |
| Discharge summaries — auto-generated client-facing discharge instructions | v2 |
| AI SOAP dictation — voice-to-text that auto-populates SOAP fields via AI | v3 |
| AI record summaries — auto-generated visit summaries for referring vets | v3 |

### 2.4 Communication & Client Engagement

| Feature | Version |
|---|---|
| WhatsApp two-way messaging — real-time conversation with clients via WhatsApp | v2 |
| Email campaigns — newsletters, health tips, seasonal reminders | v3 |
| Automated vaccination reminders — proactive alerts before vaccines are due | v2 |
| Birthday messages — auto-message on pet's birthday | v3 |
| Appointment confirmations — auto-confirm bookings via WhatsApp/SMS | v2 |
| Post-visit follow-up — check-in message 24-48h after consultation | v2 |
| Broadcast messaging — send updates to all clients (e.g., holiday hours) | v3 |
| Client satisfaction surveys — post-visit NPS or rating request | v3 |
| Pet parent portal / app — client-facing portal to view records and book appointments | v3 |
| Chatbot (FAQ & booking) — web chatbot for common questions and appointment booking | v1 (chatbot app) |
| Emergency escalation — chatbot detects emergency keywords and sends emergency contact | v1 (chatbot app) |

### 2.5 Billing & Financial Management

| Feature | Version |
|---|---|
| Invoice generation — create invoices per consultation or service bundle | v1 |
| Electronic billing (AFIP) — legally valid digital invoices connected to AFIP | v1 |
| Product & service pricing — configurable price lists with discounts and promotions | v1 |
| Payment recording — log payments (cash, card, transfer) and track balances | v1 |
| Outstanding balances — view and follow up on unpaid invoices | v1 |
| Expense tracking — record clinic operational expenses | v2 |
| Insurance claims — assist with pet insurance documentation | v3 |
| Financial reporting — revenue by period, vet, or service type | v2 |
| Online payments — accept payments via link or QR code | v3 |

### 2.6 Inventory & Pharmacy

| Feature | Version |
|---|---|
| Product catalog — medications, supplies, food, accessories | v1 |
| Stock levels & alerts — track quantity; alert on low stock | v1 |
| Consumption linked to consultations — auto-deduct stock when treatments are applied | v2 |
| Expiry date tracking — flag products nearing expiry | v2 |
| Supplier management — contact and order history per supplier | v1 |
| Purchase orders — create and approve purchase orders | v2 |
| Auto-reorder rules — trigger orders when stock falls below threshold | v3 |
| Internal pharmacy — dispense and track medications per patient | v2 |
| Controlled substance log — audit trail for regulated medications | v3 |

### 2.7 Staff & Operations

| Feature | Version |
|---|---|
| Staff profiles & roles — vets, nurses, receptionists with role-based permissions | v1 |
| Role-based access control — restrict data access by role | v1 |
| Audit log — track all record changes with user and timestamp | v2 |
| Staff scheduling / shifts — manage vet availability and shift planning | v3 |
| Task management — assign and track internal tasks | v2 |
| Digital whiteboard — real-time clinic-wide patient status board | v2 |
| Flowboard — visualize patient journey from check-in to discharge | v2 |
| Multi-location support — manage multiple clinic branches from one system | v3 |

### 2.8 Triage & Emergency

| Feature | Version |
|---|---|
| Urgency levels (L1–L4) — four-tier triage with behavior rules per level | v1 (chatbot) |
| Keyword fast-path (L4) — pre-AI emergency detection, instant escalation | v1 (chatbot) |
| Emergency contact dispatch — send emergency phone number immediately on L4 | v1 (chatbot) |
| Urgency escalation rules — urgency only goes up, never auto-decremented | v1 (chatbot) |
| Human downgrade only — staff must manually lower urgency via dashboard | v1 (chatbot) |
| Brachycephalic breed flags — heightened triage sensitivity for at-risk breeds | v2 |

### 2.9 Reporting & Analytics

| Feature | Version |
|---|---|
| Appointment analytics — volume, no-show rate, duration per type | v2 |
| Revenue dashboards — revenue by period, vet, service, and product | v2 |
| Patient retention metrics — return rates and time-between-visits analysis | v3 |
| Inventory turnover reports — consumption and waste analysis | v2 |
| Chatbot conversation analytics — message volume, urgency distribution, resolution rates | v2 |
| Custom report builder — user-configurable reports with filters and exports | v3 |
| Business intelligence (BI) — trend analysis, forecasting, benchmarking | v3 |

### 2.10 Integrations & Ecosystem

| Feature | Version |
|---|---|
| WhatsApp Business API (Kapso) — official WhatsApp integration for two-way messaging | v2 |
| Laboratory integrations — IDEXX, Antech, Zoetis — auto-import lab results | v3 |
| Imaging systems (DICOM) — connect to X-ray and ultrasound equipment | v3 |
| Payment gateways — MercadoPago, Stripe, or QR-based payments | v3 |
| Email providers — SendGrid, Mailgun for transactional email | v2 |
| Calendar sync (Google/iCal) — push appointments to external calendars | v2 |
| Insurance portals — connect to pet insurance providers | v3 |
| Accounting software — export to Contabilium, Xero, or similar | v3 |
| AI provider (Claude Sonnet) — power chatbot NLP and clinical AI features | v1 (chatbot) |

---

## 3. Competitor CRM Benchmarking

The following platforms represent the current state of the art in veterinary practice management. They are reviewed here as design inspiration for NeoVet — not as feature checklists to copy wholesale.

---

### 3.1 Global Leaders

#### ezyVet — [ezyvet.com](https://www.ezyvet.com)

Next-generation cloud PIMS, highly customizable. Best for large, multi-site, or specialty practices. The gold standard for deep workflow automation.

- Real-time appointment calendar with color-coded status flags
- Clinical decisions automatically drive invoices in real time
- Comprehensive template system with picklists and shorthand
- Automatic inventory tracking with min-level reorder rules
- Customer portal for online self-booking
- Extensive third-party integrations (labs, payments, comms)
- Detailed reporting and client engagement tools
- Wellness subscription module for preventive care plans

#### Digitail — [digitail.com](https://digitail.com)

AI-first, all-in-one cloud platform. Best for modern clinics that want cutting-edge automation. Strong focus on AI workflows and client communication.

- 20+ AI workflows including SOAP dictation and record summaries
- Voice-to-invoice: dictate treatments, AI creates the invoice
- Built-in telemedicine (chat and video) without leaving the record
- Pet Parent App for client self-service and messaging
- Real-time flowboard: visualize every patient's journey
- Automated intake forms sent before appointments
- IDEXX, Zoetis, Antech lab result auto-import
- Body maps, dental charts, and anesthesia records
- Customizable automated reminders (SMS, email, push)
- Online booking with automated triage at intake

#### Provet Cloud — [provet.cloud](https://provet.cloud)

Versatile cloud PIMS from Nordhealth. Excellent for clinics of all sizes. Strong in communications, analytics, and usability.

- Customizable clinical note templates and discharge instructions
- Appointment reminders via SMS and email
- Digital whiteboard for real-time clinic status overview
- Advanced business intelligence and reporting dashboards
- Two-way integrations with labs, imaging, and payment systems
- Local support teams in multiple countries
- Configurable workflows for different clinic specialties

#### Cornerstone (IDEXX) — [idexx.com](https://www.idexx.com)

The most widely deployed PIMS globally. Server-based, feature-rich, dominant in large hospitals. Deep IDEXX lab equipment integration is its key differentiator.

- Medical records, scheduling, billing, and inventory in one system
- Seamless integration with all IDEXX in-house analyzers
- Real-time lab results flowing directly into the patient record
- Comprehensive multi-doctor and multi-location support
- Extensive reporting suite for large practice management
- Industry-standard for specialty and referral hospitals

---

### 3.2 Communication-Focused Platforms

#### PetDesk — [petdesk.com](https://www.petdesk.com)

Client communication layer designed as an add-on or primary engagement tool. Not a full PIMS — focuses on reducing phone volume and improving retention.

- Automated appointment reminders that reduce no-shows
- Two-way SMS and in-app messaging with clients
- Online appointment request and self-booking
- Prescription refill requests via app
- Client-facing pet health records and care history
- Review collection for Google and Yelp
- Reported 50% reduction in inbound calls for partner clinics

#### Covetrus Pulse — [covetrus.com](https://covetrus.com)

Unified cloud platform for practices embedded in the Covetrus supply ecosystem. Strong pharmacy and supply chain integration.

- Electronic medical records integrated with client comms
- Online pharmacy with home delivery and Rx writeback
- Two-way client messaging
- Appointment scheduling and reminders
- Payment processing built in
- Supply ordering integrated with Covetrus distribution
- Reduces duplicate data entry across clinical and pharmacy workflows

---

### 3.3 AI & Automation-Focused Newcomers

#### ClinicWise — [clinicwise.vet](https://clinicwise.vet)

Veterinary booking and automation platform focused on reducing admin overhead. Newer entrant with strong automation and triage capabilities.

- Smart triage at booking: routes to right vet based on case type
- Automated intake forms and health questionnaires
- Queue management and real-time wait time tracking
- Multi-channel booking (web, WhatsApp, phone)
- Staff and resource scheduling

#### Aurora Inbox — [aurorainbox.com](https://aurorainbox.com)

Conversational AI chatbot layer for veterinary clinics. Handles FAQs, appointment booking, and vaccination reminders over WhatsApp.

- WhatsApp chatbot for appointment scheduling and reminders
- Vaccination and medication reminder automation
- Emergency triage via keyword detection
- Post-consultation follow-up messages
- Integration with existing PIMS via API

---

## 4. Synthesis & NeoVet Design Implications

### 4.1 Where GVet Falls Short

GVet covers the basics well — client records, scheduling, billing, and inventory — but it was designed as a standalone SaaS tool with no integration surface. For a clinic whose primary client communication channel is WhatsApp, the absence of two-way messaging is a significant gap. The lack of any API makes automation impossible on top of GVet, which is precisely why NeoVet must replace it rather than extend it.

### 4.2 What the Best Platforms Get Right

- Clinical decisions drive invoices automatically — no double-entry.
- AI reduces documentation burden (SOAP dictation, auto-summaries).
- The client communication layer is first-class, not an afterthought.
- Real-time visibility (flowboard / whiteboard) dramatically improves clinic coordination.
- Online self-booking shifts workload from reception to clients.
- Automated reminders (vaccination, appointment, follow-up) increase retention with zero effort.

### 4.3 Key Differentiators for NeoVet v1

| Differentiator | Why It Matters |
|---|---|
| Breed-aware triage | Brachycephalic flag that heightens urgency sensitivity — unique to this clinic's patient mix |
| L4 keyword fast-path | Sub-millisecond emergency escalation independent of AI availability |
| WhatsApp chatbot (v2) | The primary client channel — must be first-class, not bolted on |
| Clean data model | Designed from day 1 to import Geovet Excel exports cleanly |
| Staff-operated urgency | Only humans can downgrade urgency — a patient safety constraint |
| CRM API | Exposing a real API so the chatbot can read and write appointments in v2 |

> The competitive analysis confirms that no existing platform combines a WhatsApp-first chatbot, brachycephalic breed triage awareness, AFIP billing, and a clean API — all in a single product designed for the Argentine market. This is NeoVet's defensible space.
