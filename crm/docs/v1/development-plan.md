# Plan de Desarrollo — NeoVet CRM v1

| Campo | Valor |
|---|---|
| **Proyecto** | NeoVet CRM |
| **Autor** | Tomás Pinolini |
| **Estado** | Activo |
| **Última actualización** | 2026-04-02 |
| **Roadmap completo** | `crm/docs/roadmap.md` |
| **Docs relacionados** | `charter.md`, `technical-spec.md`, `../../docs/paula-meeting.md` |

---

## Objetivo v1

Paula puede gestionar clientes, pacientes, turnos e historia clínica desde NeoVet sin necesidad de abrir GVet para las operaciones del día a día.

**Exit criteria:** Paula usa NeoVet como herramienta principal.

---

## Stack

Next.js **16.1.6** + React 19 + TypeScript + Tailwind CSS + shadcn/ui + Drizzle ORM + Supabase (PostgreSQL + Auth + Storage).

> El charter original y el tech spec referenciaban Next.js 14 — la versión instalada es 16. El código manda.

---

## Fases

Cada fase debe estar completa antes de iniciar la siguiente.

---

### Fase A — Fundación + CRUD básico ✅ Completada

Schema DB (`clients`, `patients`, `appointments`) + Drizzle ORM + migraciones. Auth Supabase SSR con middleware. Login por email. Shell del dashboard con nav lateral. CRUD completo de clientes, pacientes y turnos. Componentes base shadcn/ui.

---

### Fase B — Calidad, Dashboard e Importación ✅ Completada

Validación Zod server-side en todos los formularios con errores de campo. `loading.tsx` + skeletons. AlertDialog de confirmación en acciones destructivas. Dashboard home con 3 cards resumen + turnos del día. Scripts `import-gvet.ts` y `dedupe-patients.ts` — 1.771 clientes y 1.380 pacientes importados.

---

### Fase C — Historia Clínica ✅ Completada

**C.1** — Flag `deceased` + badge "Fallecido" + upload de avatar a Supabase Storage (`patient-avatars`).

**C.2** — Tabla `consultations` (SOAP + signos vitales + notes). Formulario de creación, detalle, edición. Sección "Historia clínica" en detalle del paciente. Botón "Registrar consulta" en turno completado.

**C.3** — Tabla `treatment_items` (lista ordenada por consulta, estados `pending`/`active`/`completed`). Lista dinámica en formulario + toggle de estado inline.

**C.4** — Tablas `vaccinations` y `deworming_records`. CRUD bajo detalle del paciente.

**C.5** — Tabla `documents` + bucket `clinical-documents` (privado, signed URLs 60s). Upload, descarga y eliminación.

**C.6** — Rediseño UI del detalle del paciente en pestañas: Información · Historia clínica · Vacunas · Desparasitaciones · Documentos. Tab activo en `?tab=`.

**Scripts de importación:** `import-visitas.ts` (~1.300 consultas) + `backfill-appointments-from-consultations.ts` (turnos retroactivos).

---

### Fase D — Facturación Electrónica 🔲 Pendiente de build

**Objetivo:** Los admins pueden registrar pagos y generar comprobantes electrónicos (ARCA) de forma opcional, con control de límites por entidad fiscal.

#### Contexto de negocio

- Paula factura manualmente, dos días a fin de mes. La facturación en el CRM es **opcional** — no obligatoria en cada transacción.
- Existen **dos entidades fiscales separadas** que se deben gestionar de forma independiente:
  - **Paula Silveira** — servicios veterinarios (monotributo)
  - **Miguel** — peluquería canina y pet shop (monotributo separado)
- Control crítico: no superar el límite de facturación anual para no ser recategorizado como responsable inscripto.
- **MercadoPago** → siempre debe generar comprobante (transacción digital rastreable).
- **Efectivo** → no es obligatorio facturar.

#### D.1 — Registro de pagos

| Entregable | Notas |
|---|---|
| Registrar un pago contra una consulta o sesión de peluquería | |
| Métodos de pago: efectivo, transferencia, débito, crédito, Mercado Pago | |
| Regla automática: pago por Mercado Pago → fuerza generación de comprobante | |
| Campo opcional para asociar el pago a una entidad fiscal (Paula / Miguel) | |

#### D.2 — Gestión de entidades fiscales

| Entregable | Notas |
|---|---|
| Dos entidades configurables con CUIT, razón social, punto de venta y credenciales ARCA | |
| Contador mensual de facturación por entidad | |
| Admin puede editar límite anual configurable por entidad | |

#### D.3 — Generación de comprobantes (ARCA)

| Entregable | Notas |
|---|---|
| Tipos de comprobante: Factura A, Factura B, Factura C | |
| Integración con ARCA (ex-AFIP) — web service WSFE | |
| Flujo de autorización CAE | |
| PDF del comprobante generado y almacenado por factura | |

> ⚠️ **Pendiente:** Durante la semana de la reunión, Paula iba a pedir datos sobre cómo integrar con ARCA. Confirmar endpoint, certificado digital y punto de venta antes de iniciar D.3.

#### D.4 — Control de límites de facturación

| Entregable | Notas |
|---|---|
| Widget en el dashboard mostrando monto facturado en el mes por entidad | |
| Alerta visual en rojo cuando se supera el 80% del límite configurado | |
| Bloqueo suave al 100% con mensaje explicativo | |

#### D.5 — Historial de facturas

| Entregable | Notas |
|---|---|
| Lista de comprobantes por paciente / consulta | |
| Filtros por entidad, rango de fechas, estado (autorizado / pendiente / anulado) | |

#### Checklist de verificación Fase D

- [ ] Credenciales ARCA configuradas en Vercel (producción)
- [ ] Certificado digital de Paula activo y cargado
- [ ] Punto de venta registrado en ARCA para cada entidad
- [ ] Pago MercadoPago fuerza comprobante — testeado end-to-end
- [ ] Pago en efectivo no fuerza comprobante
- [ ] Generación de Factura A, B y C — todos los tipos funcionan en producción
- [ ] CAE recibido correctamente y almacenado en DB
- [ ] Límite de facturación muestra alerta en rojo al llegar al 80%
- [ ] PDF del comprobante generado y descargable

---

### Fase E — Staff y Control de Acceso ✅ Completada

**E.1** — Roles: `admin` (todo) · `vet` (clientes read, pacientes read+edit, turnos veterinarios, consultas CRUD) · `groomer` (turnos grooming, sesiones, perfil peluquería). Middleware de redirección por rol. Columnas `appointmentType` y `assignedStaffId` en `appointments`.

**E.2** — Gestión de staff (admin only): `/dashboard/settings/staff` — crear, editar, desactivar miembros.

**E.3** — Tabla `grooming_profiles` (una por paciente, auto-creada). Pestaña "Peluquería" en detalle del paciente. Campos: `behaviorScore`, `coatType`, `coatDifficulties`, `behaviorNotes`, `estimatedMinutes`.

**E.4** — Tabla `grooming_sessions`. Bucket `grooming-photos` (privado). Formulario de sesión con fotos antes/después, hallazgos (checkboxes), `priceTier` (`min`/`mid`/`hard`), precio final, `createdById`.

**E.5** — Tabla `settings` (clave/valor). Página `/dashboard/settings` con precios de peluquería por tier (admin only).

---

### Fase F — Ampliaciones de Historia Clínica ✅ Completada

**F.1** — Enum `consultation_type` (`clinica`/`virtual`/`domicilio`) en tabla `appointments`. Selector en formulario de turno (solo veterinarios).

**F.2** — Campos nuevos en `treatment_items`: `medication`, `dose`, `frequency`, `durationDays`.

**F.3** — Tabla `complementary_methods` (texto + tipo de estudio + foto adjunta). Formulario inline en detalle de consulta. Historial por tipo de estudio en pestaña "Historia clínica".

**F.4** — Campo `category` enum en tabla `documents` (`laboratorio`/`radiografia`/`ecografia`/`foto`/`otro`). Selector y filtro por categoría.

---

### Fase G — Catálogo de Servicios ✅ Completada

Tabla `services` con `name`, `category` (9 categorías), `defaultDurationMinutes`, `blockDurationMinutes`, `basePrice`, `isActive`. Página `/dashboard/settings/services` (admin only). Selector de servicio al crear turno con duración pre-cargada. Seed con los 9 servicios de Paula.

---

### Fase H — Agenda y Vista de Calendario ✅ Completada

**H.1** — Vista `/dashboard/calendar` — semanal (desktop), diaria (mobile). Colores por categoría de servicio. Clic en turno → modal con detalle. Cancelación desde modal. Filtro por profesional.

**H.2** — Bloqueo visual de tiempo extra para cirugías (`blockDurationMinutes`).

**H.3** — Suspensión de agenda. Tabla `schedule_blocks` (`staffId`, `startDate`, `endDate`, horario opcional, motivo). APIs REST para CRUD de bloqueos. Modal de creación desde el calendario. Bloqueos visibles con ícono de candado. Cada profesional gestiona solo sus propios bloqueos. Cancelación automática de turnos afectados.

---

### Fase I — Automatización y Recordatorios ✅ Completada

**Stack:** Resend (email) + Vercel Cron Jobs. Sin cola de mensajes externa.

**I.1** — Recordatorios de turno 48h y 24h. Solo para `status = confirmed` y `sendReminders = true`. Idempotencia vía tabla `email_logs`. Templates en español argentino. UI toggle `sendReminders` en formulario de turno.

**I.2** — Recordatorios de vacunas. Cron detecta `nextDueAt` a 7 días. Idempotente.

**I.3** — Seguimiento post-consulta. Tabla `follow_ups` (`patientId`, `consultationId`, `scheduledDate`, `reason`, `sentAt`). Cron diario. UI para programar seguimiento desde formulario de consulta.

**I.4** — Infraestructura. Crons configurados en `vercel.json` (`0 12 * * *`). Conexión a Supabase vía connection pooler. Variables `RESEND_API_KEY`, `EMAIL_FROM`, `CLINIC_ADDRESS`, `CRON_SECRET` en Vercel. Middleware excluye `/api/cron/` de autenticación.

> **Pendiente:** Verificación end-to-end en Vercel (emails llegan correctamente en producción).

---

### Fase J — Diseño Mobile Responsive ✅ Completada

Sidebar → menú hamburguesa en mobile. Tablas adaptadas. Formularios sin overflow en 375px. Calendario con vista de día en mobile. Pestañas con scroll horizontal. Botones con mínimo 44px (accesibilidad táctil). Probado en iPhone SE (375px), iPhone 14 (390px) y Android (360px).

---

### Fase K — Pet Shop: Inventario y Ventas ✅ Completada

**K.1** — 5 tablas: `products` (`prd_`), `providers` (`prv_`), `stock_entries` (`ste_`), `sales` (`sal_`), `sale_items` (`sli_`).

**K.2** — Sidebar "Pet Shop" + hub `/dashboard/petshop` con cards (admin only).

**K.3** — CRUD proveedores con baja lógica.

**K.4** — CRUD productos con 9 categorías, badge rojo "Bajo" cuando `currentStock <= minStock`, baja lógica.

**K.5** — Entradas de stock: `currentStock += quantity` y `costPrice` se actualizan al confirmar.

**K.6** — Ventas: carrito multi-ítem, `currentStock -= quantity` por ítem, snapshots de precio e IVA en `sale_items`, `paymentId` preparado para Fase D.

**K.7** — Scripts: `import-products.ts` (~413 productos con categoría auto-detectada), `cleanup-imported-visits.ts`, `import-turnos-futuros.ts`, progress bar en `import-gvet.ts`, `pending-gvet-exports.md`.

**Control de acceso:** Solo admin accede al módulo Pet Shop completo.

---

### Fase K.B — Caja ✅ Completada

Tablas `cash_sessions` (`csh_`) y `cash_movements` (`cmv_`). Sidebar "Caja" (admin only). Abrir caja con monto inicial, registrar movimientos (ingresos/egresos por método de pago), cerrar con efectivo contado + notas. Validación: solo una caja abierta a la vez. Balance = inicial + ventas del período + ingresos extra − egresos. 10 sesiones históricas importadas desde GVet.

---

## Preguntas abiertas

| # | Pregunta | Bloquea |
|---|---|---|
| OQ-D1 | ¿Cómo integra ARCA el certificado digital? Paula envía los datos durante la semana | Fase D.3 |
| OQ-D2 | ¿Cuál es el límite anual de facturación de Paula y de Miguel? | D.4 — alerta de límite |
| OQ-D3 | ¿El punto de venta de Paula y Miguel es el mismo o diferente? | D.2 — configuración ARCA |
| OQ-E1 | ¿Cuáles son los precios base de peluquería por tier (min/mid/hard)? | E.5 seed |
| OQ-E2 | Hallazgos del peluquero → ¿cómo debe notificarse al veterinario? (pendiente entrevista con peluquero) | Futura feature en v2 |
| OQ-G1 | ¿Cuál es la duración por defecto y el bloqueo extra para cirugías? | G.1 seed de servicios |
| OQ-I1 | ¿Desde qué dirección de email deben salir los recordatorios? (dominio verificado en Resend) | I.4 |

---

## Permanentemente fuera de alcance en v1

- Cancelación de turnos desde chatbot — v2 (en v1 solo desde el CRM).
- Notificación de suspensión de agenda por WhatsApp — v2.
- Integración Geovet — no existe API.
- API pública del CRM — CRM y chatbot son independientes hasta v2.
- Recordatorios por WhatsApp — v2 (en v1 solo email).
- Mensajes masivos por WhatsApp — v2.
- Encuestas de satisfacción — v3.
- Portal del tutor / app para clientes — v3.
- Reportes y analíticas — v3.
- Alertas automáticas de hallazgos del peluquero al veterinario — v2.
