# Plan de Desarrollo — NeoVet CRM v1

| Campo | Valor |
|---|---|
| **Proyecto** | NeoVet CRM |
| **Autor** | Tomás Pinolini |
| **Estado** | Activo |
| **Última actualización** | 2026-03-30 |
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

> Completada en commit `9fe42ba`.

| Entregable | Estado |
|---|---|
| Schema DB: clients, patients, appointments | ✅ |
| Cliente Drizzle + migraciones | ✅ |
| Auth Supabase SSR + middleware | ✅ |
| Login por email (`/login`) | ✅ |
| Shell del dashboard + nav lateral | ✅ |
| CRUD de Clientes (lista, crear, ver, editar, eliminar) | ✅ |
| CRUD de Pacientes (vinculado a cliente) | ✅ |
| CRUD de Turnos (lista, crear, ver, editar, cancelar) | ✅ |
| Componentes base shadcn/ui | ✅ |

---

### Fase B — Calidad, Dashboard e Importación ✅ Completada

**Objetivo:** El CRM es de calidad de producción y los datos de Paula están migrados.

| Entregable | Estado |
|---|---|
| Validación Zod server-side en todos los formularios | ✅ |
| Errores de campo bajo cada input | ✅ |
| `loading.tsx` + skeletons en páginas de lista y detalle | ✅ |
| AlertDialog de confirmación en todas las acciones destructivas | ✅ |
| Dashboard home: 3 cards resumen + lista de turnos del día + acciones inline | ✅ |
| Script `import-gvet.ts` — importación one-time desde CSV de GVet | ✅ |
| Script `dedupe-patients.ts` — limpieza de pacientes duplicados | ✅ |
| 1.771 clientes y 1.380 pacientes importados | ✅ |

---

### Fase C — Historia Clínica ✅ Completada

**Objetivo:** Paula puede registrar y consultar la historia clínica completa de cada paciente.

#### C.1 — Estado del paciente + avatar ✅

| Entregable | Estado |
|---|---|
| Flag `deceased` + badge "Fallecido" en detalle y lista | ✅ |
| Upload de avatar a Supabase Storage (`patient-avatars`, público) | ✅ |
| Pacientes fallecidos atenuados en la lista | ✅ |

#### C.2 — Consultas + SOAP + signos vitales ✅

**Nueva tabla:** `consultations` — vinculada a paciente + turno opcional; campos SOAP (todos opcionales) + `notes` como fallback + signos vitales.

| Entregable | Estado |
|---|---|
| Schema `consultations` + migración | ✅ |
| Formulario de creación `/dashboard/consultations/new` | ✅ |
| Página de detalle `/dashboard/consultations/[id]` | ✅ |
| Página de edición `/dashboard/consultations/[id]/edit` | ✅ |
| Sección "Historia clínica" en detalle del paciente | ✅ |
| Botón "Registrar consulta" en turno completado | ✅ |
| Vista inline de consulta dentro del turno | ✅ |

#### C.3 — Plan de tratamiento ✅

**Nueva tabla:** `treatment_items` — lista ordenada por consulta; estados: `pending` / `active` / `completed`.

| Entregable | Estado |
|---|---|
| Schema `treatment_items` + enum + migración | ✅ |
| Lista dinámica de ítems dentro del formulario de consulta | ✅ |
| Toggle de estado inline en el detalle de consulta | ✅ |

#### C.4 — Vacunas y desparasitaciones ✅

| Entregable | Estado |
|---|---|
| Schemas `vaccinations` + `deworming_records` + migraciones | ✅ |
| CRUD de vacunas bajo detalle del paciente | ✅ |
| CRUD de desparasitaciones bajo detalle del paciente | ✅ |

#### C.5 — Almacenamiento de documentos ✅

| Entregable | Estado |
|---|---|
| Schema `documents` + migración | ✅ |
| Bucket `clinical-documents` (privado, Supabase Storage) | ✅ |
| Upload de documentos en detalle del paciente | ✅ |
| Descarga por URL firmada (60s) + eliminación | ✅ |

#### C.6 — Rediseño en pestañas del detalle del paciente ✅

Refactor UI — sin datos nuevos. Pestañas: Información · Historia clínica · Vacunas · Desparasitaciones · Documentos. Tab activo reflejado en `?tab=` para deep-linking.

#### Scripts de importación histórica ✅

| Script | Descripción | Estado |
|---|---|---|
| `import-visitas.ts` | Importa ~1.300 consultas históricas desde `Visitas-03-2026.csv` | ✅ |
| `backfill-appointments-from-consultations.ts` | Crea turnos retroactivos para cada consulta importada | ✅ |

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

**Objetivo:** Cada integrante del equipo tiene un usuario con acceso correspondiente a su rol. La peluquería tiene su propio módulo dentro del CRM.

#### E.1 — Roles y permisos

**Actualización del enum `role`:** `admin | receptionist` → `admin | vet | groomer`

| Rol | Acceso |
|---|---|
| **admin** | Todo — clientes, pacientes, turnos, historia clínica, peluquería, facturación, staff, configuración |
| **vet** | Leer clientes · Leer y editar pacientes · Ver turnos veterinarios · CRUD completo de consultas |
| **groomer** | Ver turnos de peluquería · CRUD de sesiones de peluquería · Editar perfil de peluquería del paciente |

| Entregable | Estado |
|---|---|
| Migración: actualizar enum `role` en tabla `staff` | ✅ |
| Middleware: redirigir según rol al acceder a rutas no autorizadas | ✅ |
| Vistas filtradas por tipo de turno (vet ve solo veterinarios, groomer ve solo grooming) | ✅ |
| Columna `appointmentType` (`veterinary \| grooming`) en tabla `appointments` | ✅ |
| Columna `assignedStaffId` (nullable FK → staff) en tabla `appointments` | ✅ |
| UI de asignación de profesional en detalle del turno (solo admin) | ✅ |

#### E.2 — Gestión de staff (admin only)

| Entregable | Estado |
|---|---|
| Página `/dashboard/settings/staff` — lista de miembros del equipo | ✅ |
| Crear nuevo miembro: nombre, email, rol → crea cuenta en Supabase Auth | ✅ |
| Editar nombre y rol de un miembro existente | ✅ |
| Desactivar acceso (no eliminar — preservar datos históricos) | ✅ |

#### E.3 — Perfil de peluquería por paciente

**Nueva tabla:** `grooming_profiles` — una fila por paciente; se crea automáticamente en el primer turno de peluquería.

| Campo | Tipo | Descripción |
|---|---|---|
| `patientId` | FK → patients (unique) | |
| `behaviorScore` | integer (1–10) | Puntaje de comportamiento general |
| `coatType` | text | Tipo de pelaje |
| `coatDifficulties` | text | Nudos, doble capa, etc. |
| `behaviorNotes` | text | "Se porta bien", "muerde", "necesita bozal" |
| `estimatedMinutes` | integer | Tiempo estimado manual (automático en v3) |

| Entregable | Estado |
|---|---|
| Schema `grooming_profiles` + migración | ✅ |
| Pestaña "Peluquería" en detalle del paciente — solo visible si tuvo al menos un turno de peluquería | ✅ |
| Formulario de edición del perfil (admin y groomer) | ✅ |

#### E.4 — Sesiones de peluquería

**Nueva tabla:** `grooming_sessions` — un registro por visita de peluquería.

| Campo | Tipo | Descripción |
|---|---|---|
| `patientId` | FK → patients (cascade) | |
| `appointmentId` | FK → appointments (set null) | |
| `groomedById` | FK → staff | Peluquero que atendió |
| `priceTier` | enum `min \| mid \| hard` | Nivel de dificultad |
| `finalPrice` | numeric | Precio final (puede diferir del base del tier) |
| `beforePhotoPath` | text (nullable) | Path en Supabase Storage |
| `afterPhotoPath` | text (nullable) | Path en Supabase Storage |
| `findings` | text[] | Checkboxes: pulgas, garrapatas, tumores, otitis, dermatitis |
| `notes` | text | Otras observaciones libres |
| `createdById` | FK → staff | Para auditoría ligera |

| Entregable | Estado |
|---|---|
| Schema `grooming_sessions` + migración | ✅ |
| Bucket `grooming-photos` en Supabase Storage (privado, signed URLs) | ✅ |
| Formulario de registro de sesión (groomer lo completa al finalizar) | ✅ |
| Vista de última sesión en el perfil de peluquería del paciente | ✅ |
| Historial de sesiones anteriores (lista cronológica) | ✅ |

#### E.5 — Precios de peluquería (configuración)

**Nueva tabla:** `settings` — clave/valor para configuración del sistema.

| Clave | Valor por defecto |
|---|---|
| `grooming_price_min` | (a definir con Paula) |
| `grooming_price_mid` | (a definir con Paula) |
| `grooming_price_hard` | (a definir con Paula) |

| Entregable | Estado |
|---|---|
| Schema `settings` + seed con las 3 claves de precios | ✅ |
| Página `/dashboard/settings` — configuración general (admin only) | ✅ |
| Sección "Precios de peluquería" con los tres niveles editables | ✅ |

#### Checklist de verificación Fase E

- [x] Migración de enum `role` aplicada sin romper datos existentes
- [x] Un vet logueado no puede acceder a `/dashboard/clients/new` ni `/dashboard/appointments/new`
- [x] Un groomer logueado solo ve turnos de tipo `grooming`
- [x] Admin puede asignar profesional a cualquier turno
- [x] Perfil de peluquería no aparece en pacientes sin turnos de peluquería
- [x] Groomer puede registrar sesión con fotos, hallazgos y precio final
- [x] Admin ve precios base configurados y puede editarlos
- [x] `createdById` guardado correctamente en sesiones de peluquería

---

### Fase F — Ampliaciones de Historia Clínica ✅ Completada

**Objetivo:** El formulario de consulta refleja exactamente lo que Paula registra en la práctica.

> Estas son adiciones a tablas ya construidas. Requieren migraciones sobre `consultations` y `treatment_items`.

#### F.1 — Modalidad de turno

> **Decisión de diseño:** Tras análisis, `consultationType` se movió a la tabla `appointments` (no `consultations`). La modalidad es información de agendamiento, no clínica. Los turnos de peluquería siempre son `clinica`. Las consultas sin turno (pacientes en espera) también son siempre `clinica` por definición. Los campos `mucosas`, `ganglios` y `objectiveParticular` se omitieron — Paula no los usa en la práctica.

| Entregable | Estado |
|---|---|
| Enum `consultation_type` (`clinica \| virtual \| domicilio`) en tabla `appointments` | ✅ |
| Selector de modalidad en formulario de turno (solo visible para turnos veterinarios) | ✅ |
| Modalidad visible en el detalle del turno | ✅ |

#### F.2 — Ítems de tratamiento con dosis y duración

Ampliar `treatment_items` con campos farmacológicos.

| Campo nuevo | Tipo | Descripción |
|---|---|---|
| `medication` | text | Nombre del medicamento (puede ser el mismo que description) |
| `dose` | text | Dosis (ej: "5mg/kg") |
| `frequency` | text | Frecuencia (ej: "cada 12hs") |
| `durationDays` | integer | Duración en días |

| Entregable | Estado |
|---|---|
| Migración: nuevos campos en `treatment_items` | ✅ |
| Formulario de tratamiento actualizado con los 4 campos nuevos | ✅ |
| Vista de detalle muestra dosis, frecuencia y duración | ✅ |

#### F.3 — Métodos complementarios e informes

Nueva sección dentro de la consulta para redactar informes de estudios (ecografías, análisis de sangre, etc.) con posibilidad de adjuntar fotos.

| Entregable | Notas |
|---|---|
| Nueva tabla `complementary_methods` — texto + tipo de estudio + foto adjunta opcional | ✅ |
| Formulario inline dentro del detalle de consulta | ✅ |
| Vista de historial por tipo de estudio en la pestaña "Historia clínica" | ✅ |

#### F.4 — Categorías de documentos

Ampliar la tabla `documents` con un campo `category`.

| Categoría | Descripción |
|---|---|
| `laboratorio` | Análisis de sangre, orina, etc. |
| `radiografia` | Placas de rayos X |
| `ecografia` | Imágenes ecográficas |
| `foto` | Fotografías clínicas |
| `otro` | Cualquier otro archivo |

| Entregable | Estado |
|---|---|
| Migración: campo `category` enum en tabla `documents` | ✅ |
| Selector de categoría en el formulario de carga + asignación post-carga inline | ✅ |
| Filtro por categoría en la pestaña "Documentos" del paciente | ✅ |

#### Checklist de verificación Fase F

- [x] Migración aplicada sin pérdida de datos
- [x] Modalidad de turno aparece en el formulario y en el detalle (solo veterinarios)
- [x] Tratamiento guarda dosis, frecuencia y duración correctamente
- [x] Se puede crear un informe complementario desde el detalle de consulta
- [x] Los documentos se pueden filtrar por categoría
- [x] La categoría se puede asignar al subir o editar inline después

---

### Fase G — Catálogo de Servicios ✅ Completada

**Objetivo:** La clínica tiene un listado de sus servicios configurable, conectado a los turnos y a la facturación.

> Este catálogo es prerequisito de la Fase D (facturación) — los comprobantes necesitan referirse a un servicio.

#### G.1 — Schema y gestión de servicios

**Nueva tabla:** `services`

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | text (`svc_`) | |
| `name` | text | Nombre del servicio |
| `category` | enum | `cirugia \| consulta \| reproduccion \| cardiologia \| peluqueria \| vacunacion \| domicilio \| petshop \| otro` |
| `defaultDurationMinutes` | integer | Duración por defecto al agendar |
| `blockDurationMinutes` | integer nullable | Tiempo extra bloqueado (ej: cirugías) |
| `basePrice` | numeric nullable | Precio base referencial |
| `isActive` | boolean | Para desactivar sin eliminar |

| Entregable | Estado |
|---|---|
Schema services + migración + seed con los 9 servicios de Paula ✅
Página /dashboard/settings/services — CRUD de servicios (admin only) ✅
Selector de servicio al crear un turno ✅
durationMinutes del turno pre-cargado desde el servicio seleccionado ✅

#### Checklist de verificación Fase G

- [x] Los 9 servicios de Paula cargados en el seed
- [x] Al crear un turno y elegir "Cirugía", la duración se pre-carga con el valor del servicio
- [x] Admin puede agregar, editar y desactivar servicios
- [x] Servicios desactivados no aparecen al agendar un turno nuevo

---

### Fase H — Agenda y Vista de Calendario ✅ Completada

**Objetivo:** El staff puede ver los turnos en formato calendario, identificar espacios libres y bloquear tiempo para cirugías.

#### H.1 — Vista de calendario semanal

| Entregable | Notas |
|---|---|
| Vista `/dashboard/calendar` — calendario semanal (desktop) y diaria (mobile) | ✅ |
| Colores por categoría de servicio | ✅ |
| Clic en turno → modal con detalle completo | ✅ |
| Cancelación de turno desde el modal con confirmación | ✅ |
| Turnos cancelados no aparecen en el calendario — slot queda libre | ✅ |
| Filtro por profesional asignado | ✅ |

#### H.2 — Bloqueo de tiempo para cirugías

| Entregable | Notas |
|---|---|
| Al agendar un servicio con `blockDurationMinutes`, bloquear ese tiempo extra en la vista | ✅ |
| Indicador visual diferenciado para cirugías en el calendario | ✅ |

### H.3 — Suspensión de agenda 🔲 Pendiente
Objetivo: El admin puede bloquear días, semanas u horarios específicos. El chatbot notifica automáticamente a los pacientes con turnos afectados.

| Entregable | Notas |
|---|---|
| Nueva tabla `schedule_blocks` (desde, hasta, horario opcional, motivo, creadoPor) | |
| UI en `/dashboard/calendar` para crear/ver/eliminar bloqueos | Solo admin |
| Bloqueos visibles en el calendario (franja gris con motivo) | |
| Chatbot v2 consulta bloqueos antes de confirmar un turno | |
| Chatbot v2 notifica por WhatsApp a pacientes con turnos en el rango bloqueado | Pendiente chatbot v2 |

#### Checklist de verificación Fase H

- [✅] Vista semanal muestra todos los turnos con nombre del paciente y tipo de servicio
- [✅ ] Espacio libre es visualmente distinguible de los turnos ocupados
- [✅] Clic en espacio libre abre el formulario de turno con fecha/hora pre-cargada
- [✅] Cirugía muestra bloqueo visual del tiempo extra configurado
- [ ] H.3 Suspensión de agenda — pendiente

---

### Fase I — Recordatorios por Email 🔲 Pendiente

**Objetivo:** El sistema envía emails automáticos para turnos, vacunas y seguimientos. WhatsApp se suma en v2.

> **Stack:** Resend (email) + Vercel Cron Jobs (scheduler). Sin cola de mensajes externa — suficiente para v1.

#### I.1 — Recordatorios de turno

| Entregable | Notas |
|---|---|
| Email automático 48h antes de cada turno confirmado | Cron job diario que busca turnos en `NOW() + 48h` |
| Email automático 24h antes | Segundo cron |
| Contenido: nombre del paciente, fecha, hora, dirección de la clínica | |
| Admin puede desactivar recordatorios por turno | Flag `sendReminders` en appointments |

> **Nota:** La cancelación de turnos desde el chatbot (v2) debe registrarse en la tabla `appointments` con `status = cancelled` para mantener la auditoría del historial del paciente. El slot queda disponible automáticamente.

#### I.2 — Recordatorios de vacunas

| Entregable | Notas |
|---|---|
| Email automático cuando `next_due_at` de una vacuna está a 7 días | Cron job diario |
| Si no hay respuesta (no se agenda turno en 3 días), reenvío automático una vez | |
| Contenido: nombre de la vacuna, fecha de vencimiento, cómo agendar | |

#### I.3 — Seguimiento post-consulta

| Entregable | Notas |
|---|---|
| Nueva tabla `follow_ups` — `patientId`, `consultationId`, `scheduledDate`, `reason`, `sentAt` | |
| Desde el formulario de consulta: programar un control ("en 7 días por vómitos") | |
| Cron job diario envía email en la fecha programada | |
| Contenido: motivo del control, datos de la clínica, cómo contactar | |

#### I.4 — Configuración de email

| Entregable | Notas |
|---|---|
| Variable de entorno `RESEND_API_KEY` + dominio verificado en Resend | |
| Templates de email en español argentino | |
| Log de emails enviados en DB (no reenviar si ya se envió) | Idempotencia |

#### Checklist de verificación Fase I

- [ ] Email de 48h y 24h llegan correctamente al cliente del turno de prueba
- [ ] Email de vacuna llega 7 días antes del vencimiento
- [ ] Reenvío de vacuna ocurre solo si no se agendó turno en 3 días
- [ ] Desde una consulta se puede programar un seguimiento y el email llega en esa fecha
- [ ] Los emails no se duplican si el cron se ejecuta dos veces (idempotencia)
- [ ] Admin puede desactivar recordatorios por turno individualmente

---

### Fase J — Diseño Mobile Responsive 🔲 Pendiente

**Objetivo:** Paula y su equipo pueden usar el CRM desde el celular sin fricción.

> No es una fase de features nuevas — es adaptar el CSS y los layouts existentes para pantallas pequeñas.

| Área | Trabajo |
|---|---|
| Sidebar de navegación | Convertir a menú hamburguesa en mobile |
| Tablas de lista (clientes, pacientes, turnos) | Convertir a cards apiladas en mobile |
| Formularios | Verificar que los inputs no queden cortados en pantallas de 375px |
| Vista de calendario | Layout alternativo simplificado en mobile (vista de día en lugar de semana) |
| Detalle de paciente (pestañas) | Pestañas con scroll horizontal en mobile |
| Botones de acción | Tamaño mínimo de 44px (accesibilidad táctil) |

#### Checklist de verificación Fase J

- [ ] Probado en iPhone SE (375px) y iPhone 14 (390px)
- [ ] Probado en Android (360px)
- [ ] Sidebar colapsa correctamente en mobile
- [ ] Formularios completos sin overflow horizontal
- [ ] Calendario usable desde celular

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
