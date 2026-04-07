# NeoVet CRM v1 — Reverse Engineering Report

| Campo | Valor |
|---|---|
| **Generado** | 2026-04-05 |
| **Método** | Inspección de código, esquema, imports, y configuración. Zero confianza en documentación previa. |
| **Alcance** | `crm/` completo — schema, server actions, middleware, crons, storage, env vars |

> Este documento describe lo que el sistema **realmente es** según el código, no lo que los planes dicen que debería ser. Si hay contradicción entre este doc y el charter/tech-spec/development-plan, el código manda.

---

## 1. Modelo de Datos Real

### 27 tablas, 20 migraciones (0000–0019)

**Dominio clínico (8 tablas):**
`clients` → `patients` → `consultations` → `treatment_items`
                       → `vaccinations`
                       → `deworming_records`
                       → `documents`
                       → `complementary_methods`

**Dominio operativo (7 tablas):**
`appointments`, `services`, `schedule_blocks`, `staff`, `settings`, `follow_ups`, `email_logs`

**Dominio peluquería (2 tablas):**
`grooming_profiles`, `grooming_sessions`

**Dominio pet shop (5 tablas):**
`products`, `providers`, `stock_entries`, `sales`, `sale_items`

**Dominio caja (2 tablas):**
`cash_sessions`, `cash_movements`

**Dominio bot — preparado para v2 (5 tablas, sin UI):**
`bot_contacts`, `bot_conversations`, `bot_messages`, `bot_escalations`, `bot_business_context`

### Comportamiento de cascada — qué se borra y qué se huérfana

**Borrar un cliente** cascadea a: pacientes → consultas → items de tratamiento → vacunas → desparasitaciones → documentos → métodos complementarios → perfil de peluquería → sesiones de peluquería → follow-ups. **Una sola operación DELETE borra toda la historia clínica.**

**Borrar una consulta** huérfana (set null): vacunas, desparasitaciones, documentos y follow-ups pierden su `consultationId` pero siguen existiendo. Items de tratamiento y métodos complementarios **sí se borran** (cascade).

**Borrar un turno** huérfana la consulta vinculada y la sesión de peluquería (set null). No se pierden datos clínicos.

**Borrar un staff member** cascadea sus schedule_blocks. Turnos asignados quedan sin asignar (set null).

### Enums reales en la DB

| Enum | Valores |
|------|---------|
| `appointment_status` | `pending`, `confirmed`, `completed`, `cancelled`, `no_show` |
| `appointment_type` | `veterinary`, `grooming` |
| `consultation_type` | `clinica`, `virtual`, `domicilio` |
| `price_tier` | `min`, `mid`, `hard` |
| `cash_movement_type` | `ingreso`, `egreso` |

### Enums simulados (text con validación Zod, no pgEnum)

| Campo | Valores | Archivo |
|-------|---------|---------|
| `staff.role` | `admin`, `owner`, `vet`, `groomer` | `schema/staff.ts:8` |
| `documents.category` | `laboratorio`, `radiografia`, `ecografia`, `foto`, `otro` | `document-actions.ts:32` |
| `products.category` | 9 valores (medicamento, vacuna, insumo_clinico, etc.) | `petshop/products/actions.ts:13` |
| `sales.paymentMethod` | `efectivo`, `transferencia`, `tarjeta_debito`, `tarjeta_credito`, `mercadopago` | `petshop/sales/actions.ts:21` |
| `email_logs.type` | 6 valores (`appointment_reminder_48h`, `_24h`, `vaccine_reminder`, `follow_up`, `booking_confirmation`, `cancellation`) | `email_logs.ts:5` |

---

## 2. Arquitectura Real

### Request lifecycle

```
Browser → Vercel Edge → middleware.ts
  ├── No user → redirect /login
  ├── User on /login → redirect /dashboard
  ├── User disabled or no role → redirect /login
  └── User OK → set x-user-role header → server component renders
        ├── getRole() → reads x-user-role header
        ├── getSessionStaffId() → queries staff table by auth user ID
        └── DB queries via Drizzle ORM → Supabase PostgreSQL
```

### Cross-module dependencies (imports between dashboard modules)

```
dashboard/page.tsx ──imports──→ cash/actions (getOpenSession)
appointments/new   ──imports──→ settings/services/actions
patients/[id]      ──imports──→ consultations/actions
                               grooming/actions
                               patients/vaccination-actions
                               patients/deworming-actions
                               patients/document-actions
grooming/actions   ──writes──→ cash_movements (cross-domain write)
```

**La dependencia más fuerte** es `grooming → cash`: al crear una sesión de peluquería, se inserta directamente un movimiento de caja. No hay evento, no hay bus — es un write directo en la misma transacción.

**La dependencia más frágil** es `patients/[id]` que importa de 5 módulos distintos. Si cualquiera de esos módulos cambia su API, la página de paciente se rompe.

### Cron jobs (3 endpoints, todos a las 12:00 UTC / 9:00 ARG)

| Endpoint | Qué hace | Ventana |
|----------|----------|---------|
| `/api/cron/appointment-reminders` | Envía email 48h y 24h antes del turno confirmado | ±1 hora del target |
| `/api/cron/vaccine-reminders` | Envía email si `nextDueAt` ≤ 7 días desde hoy | Vacunas con fecha texto YYYY-MM-DD |
| `/api/cron/follow-ups` | Envía email de seguimiento si `scheduledDate` = hoy | Follow-ups no enviados |

**Protección:** Todos validan `Authorization: Bearer {CRON_SECRET}`. Sin ese header, devuelven 401.

---

## 3. Reglas de Negocio Implícitas

Estas reglas no están documentadas en ningún ADR ni charter. Están hardcodeadas en el código.

### Turnos
- Los turnos se crean con estado `confirmed` (no `pending`). Archivo: `appointments/actions.ts:228`.
- La cancelación acepta un motivo opcional (`cancellationReason`), pero no es obligatorio.
- El botón "No se presentó" solo aparece para turnos `confirmed` cuya hora ya pasó. No hay botón para turnos `pending`.
- Un turno cancelado no se puede reactivar desde la UI (no hay transición `cancelled → confirmed`).

### Emails
- El email de confirmación se envía **sincrónicamente** dentro de `createAppointment`. Si Resend está lento, el turno tarda más en crearse.
- El email de cancelación se envía dentro de `updateAppointmentStatus`. Misma observación.
- Si el email falla, el turno/cancelación **sí se completa** (el try/catch está alrededor del email, no de la operación principal).
- Idempotencia: si ya existe un log en `email_logs` con el mismo `(referenceId, type)`, el email no se re-envía.

### Peluquería y caja
- Al guardar una sesión con `finalPrice > 0` y hay caja abierta, se crea un movimiento de ingreso automáticamente.
- Si no hay caja abierta, la sesión se guarda igual pero **no se registra el ingreso**. No hay advertencia en la UI.
- El método de pago del movimiento de caja viene del formulario de peluquería (`paymentMethod`, default `"efectivo"`).
- La descripción del movimiento es: `"Peluquería — {nombre_paciente}"`.

### Pacientes y breeds
- Se detectan razas braquicéfalas por substring match case-insensitive contra una lista de 9 breeds. Si la raza del paciente contiene "bulldog" en cualquier parte, se marca como braquicéfalo.
- Lista hardcodeada: `bulldog, bulldog inglés, bulldog francés, pug, boston terrier, boxer, shih tzu, cavalier king charles, pekinés`.

### Archivos
- Avatar: máximo **2 MB**, solo JPG/PNG/WebP. Se sube a `patient-avatars/{patientId}/{filename}`.
- Documentos clínicos: se acceden con signed URLs de **60 segundos**. Si el usuario tarda más, debe hacer clic de nuevo.
- Fotos de peluquería: signed URLs de **5 minutos** (300 segundos).
- Si un upload falla (storage error), la operación principal continúa sin la foto. **Fallo silencioso.**

### IVA y precios
- Los productos solo permiten IVA 0% o 21%. No hay tasas intermedias.
- Los sale_items guardan un snapshot de `unitPrice` y `taxRate` al momento de la venta. Si el precio del producto cambia después, las ventas históricas no se alteran.

---

## 4. Mapa de Variables de Entorno

| Variable | Requerida | Default | Dónde se usa |
|----------|-----------|---------|-------------|
| `DATABASE_URL` | Sí | — | `db/index.ts` — conexión Drizzle |
| `NEXT_PUBLIC_SUPABASE_URL` | Sí | — | Todos los clientes Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Sí | — | Clientes browser + server |
| `SUPABASE_SERVICE_ROLE_KEY` | Sí | — | Uploads de storage, admin ops |
| `RESEND_API_KEY` | Sí | — | `lib/email/resend.ts` |
| `CRON_SECRET` | Sí | — | Protege endpoints de cron y seed |
| `BOT_API_KEY` | Sí | — | Protege endpoints `/api/bot/*` |
| `EMAIL_FROM` | No | `onboarding@resend.dev` | Sender de todos los emails |
| `CLINIC_ADDRESS` | No | `Morrow 4064, Rosario` | Templates de email |

**7 variables sin default** → si falta alguna, el sistema falla en runtime sin mensaje claro.

---

## 5. Storage (Supabase)

| Bucket | Acceso | TTL de URL | Qué guarda |
|--------|--------|------------|------------|
| `patient-avatars` | Público (getPublicUrl) | ∞ | Fotos de perfil de pacientes |
| `clinical-documents` | Privado (signedUrl) | 60 seg | Lab, RX, eco, fotos clínicas |
| `grooming-photos` | Privado (signedUrl) | 5 min | Fotos antes/después de peluquería |

**Path pattern:** `{patientId}/{tipo}_{uuid}.{ext}` (e.g., `pat_abc123/before_def456.jpg`)

---

## 6. Gaps entre Plan y Realidad

### Planeado y construido diferente

| Plan decía | Código hace |
|------------|-------------|
| Phase L.1: "Toggle 'Ver todos' para admin" | No existe — admin siempre ve todo |
| Phase L.5: "Advertencia si no hay caja abierta" | No hay advertencia — el ingreso simplemente no se registra |
| Phase L.7: "Batch de emails por suspensión de agenda" | Solo la cancelación manual envía email — la suspensión no notifica |
| Phase L.9: "Pre-llena mismo profesional" | Solo pre-llena paciente y motivo — no profesional ni servicio |
| Development plan: migration output `supabase/migrations/` | Real path: `drizzle/migrations/` |
| Dev plan: "4 roles: admin, vet, groomer" | Existen 4: `admin`, `owner`, `vet`, `groomer` — `owner` no está documentado en el plan |

### Planeado y no construido

| Feature | Estado | Bloqueador |
|---------|--------|-----------|
| Phase D — ARCA billing completo | No construido | Credenciales de Paula |
| Email domain verificado en Resend | No configurado | Tomás/Franco deben verificar |
| Precios de peluquería seeded | No configurado | Paula debe definir precios |
| Deploy a Vercel producción | No realizado | DNS + config |
| 9 cuentas de staff | No creadas | Post-deploy |

### Construido y no planeado

| Feature | Dónde |
|---------|-------|
| Bot API endpoints (`/api/bot/*`, 6 rutas) | Phase K agregó esto para preparar v2 |
| `owner` role (alias de admin) | `schema/staff.ts` — no documentado originalmente |
| Argentina holidays API integration | Calendario usa API de feriados argentinos |
| Dynamic calendar hours from settings | Horarios del calendario configurables desde settings |

---

## 7. Validación — Qué Tiene y Qué No

### Server actions CON validación Zod (17 archivos)
Appointments, cash, clients, consultations, grooming sessions, grooming profiles, patients, vaccinations, deworming, documents, petshop products, petshop providers, petshop sales, petshop stock entries, services, staff.

### Server actions SIN validación Zod
- `settings/actions.ts` — `upsertGroomingPrices()`: acepta FormData sin schema. Podría recibir strings no numéricos.
- `settings/clinic-hours-actions.ts` — `updateClinicHours()`: no valida formato de hora. Podría recibir `"25:99"`.
- Delete actions (follow-ups, complementary methods): no validan ownership ni role.

---

## 8. Manejo de Errores — Patrones Observados

| Patrón | Dónde se usa | Comportamiento |
|--------|-------------|----------------|
| Try/catch genérico | Todos los CRUD actions | Catch silencioso → `{ error: "Ocurrió un error inesperado" }` |
| Zod field errors | Todos los formularios con validación | `{ errors: { campo: ["mensaje"] } }` |
| Dedup idempotente | Emails (cron + send-email.ts) | Si ya se envió, skip silencioso |
| Fallo silencioso en uploads | Grooming photos, document uploads | Si el upload falla, la operación principal continúa sin la foto |
| No hay error codes | Todo el sistema | Sin `{ code: "NOT_FOUND" }` — solo strings en español |

**Consecuencia:** Si algo falla en producción, el usuario ve "Ocurrió un error inesperado" sin contexto. El error real solo aparece en los logs de Vercel.

---

## 9. Superficies de Fragilidad

### Alto riesgo
- **Borrar un cliente borra TODA la historia clínica** (cascade chain). No hay soft-delete para clientes. No hay confirmación extra más allá del AlertDialog.
- **7 env vars sin default** — si falta `RESEND_API_KEY`, el build falla al importar el módulo. Si falta `DATABASE_URL`, toda la app crashea.
- **Grooming → cash write es cross-domain** — si cambia la tabla `cash_movements`, el módulo de grooming se rompe.
- **Signed URL de 60 segundos** para documentos clínicos — en conexiones lentas o si el vet se distrae, el link expira.

### Medio riesgo
- **Email sending sincrónico** en `createAppointment` — si Resend está lento, el turno tarda en crearse.
- **Patient detail page importa de 5 módulos** — alto acoplamiento, fácil de romper al refactorear.
- **Brachycephalic breed detection por substring** — si un nuevo breed tiene "bulldog" en el nombre pero no es braquicéfalo, se marca incorrectamente. Pero esto es un caso borde extremo.

### Bajo riesgo
- **Avatar upload no revalida** la página del paciente — el usuario tiene que navegar de vuelta para ver la foto nueva.
- **Settings actions sin Zod** — solo accesible por admins, pero un admin podría meter datos inválidos.
