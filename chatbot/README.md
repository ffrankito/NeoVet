# NeoVet Chatbot — Documentación de Versiones

| Campo | Valor |
|---|---|
| **Proyecto** | NeoVet Chatbot |
| **Cliente** | Paula Silveira — NeoVet |
| **Tech lead** | Franco Zancocchia |
| **Product lead** | Tomás Pinolini |
| **Versión del doc** | 1.2 |
| **Última actualización** | 2026-03-28 |
| **Fuente de verdad** | Código real de `crm/` + `chatbot/` en rama `main` |

---

## Índice

1. [Estado actual de ambos proyectos](#1-estado-actual-de-ambos-proyectos)
2. [Filosofía de versionado](#2-filosofía-de-versionado)
3. [Roadmap general v1–v4](#3-roadmap-general-v1v4)
4. [v1 — Web widget FAQ estático](#4-v1--web-widget-faq-estático)
5. [v2 — Bot con DB + dashboard admin](#5-v2--bot-con-db--dashboard-admin)
6. [v3 — WhatsApp + integración CRM](#6-v3--whatsapp--integración-crm)
7. [v4 — Automatización avanzada](#7-v4--automatización-avanzada)
8. [Dependencias y blockers por versión](#8-dependencias-y-blockers-por-versión)
9. [Criterios de paso entre versiones](#9-criterios-de-paso-entre-versiones)
10. [Relación chatbot ↔ CRM por versión](#10-relación-chatbot--crm-por-versión)

---

## 1. Estado actual de ambos proyectos

### CRM — lo que hay realmente en el código

> Nota: los docs del CRM mencionan Next.js 14 pero el `package.json` tiene Next.js 16. El código es la fuente de verdad.

| Área | Estado real en código |
|---|---|
| Auth + middleware con roles | ✅ Implementado — `src/lib/supabase/middleware.ts`, `src/lib/role.ts` |
| Schema completo (9 tablas) | ✅ `clients`, `patients`, `appointments`, `consultations`, `treatment_items`, `vaccinations`, `deworming_records`, `documents`, `staff` |
| CRUD clientes y pacientes | ✅ Implementado con Zod, server actions, shadcn/ui |
| Calendario de turnos | ✅ Con filtros, paginación, estado inline |
| Historial clínico SOAP | ✅ Con vitales, plan de tratamiento, toggle de estado |
| Vacunaciones y desparasitaciones | ✅ CRUD inline en detalle de paciente |
| Almacenamiento de documentos | ✅ Supabase Storage con signed URLs |
| Dashboard home | ✅ Cards de resumen + turnos del día + acciones inline |
| Importación desde Geovet | ✅ Scripts en `scripts/` — 1.771 clientes, 1.380 pacientes, ~1.300 consultas migradas |
| Schema `staff` con roles | ✅ Definido en código — `admin` / `receptionist` |
| Control de acceso por rol | 🔲 Schema listo, implementación UI pendiente (Fase E) |
| Facturación / AFIP | 🔲 Pendiente confirmación de Paula (Fase D) |

**Campos extra en `patients` no documentados en el tech spec:**
`sex`, `neutered`, `weightKg`, `microchip`, `gvetId`, `gvetHistoryNumber` — provienen del import de Geovet.

### Chatbot — lo que hay realmente en el código

| Área | Estado real |
|---|---|
| Scaffold Next.js | ✅ |
| Dependencias AI (`ai`, `@ai-sdk/anthropic`, `@ai-sdk/react`) | ✅ ai@4 · @ai-sdk/anthropic@1 · @ai-sdk/react@1 |
| API route `/api/chat` | ✅ streamText() con Claude claude-sonnet-4-6 |
| Widget de chat | ✅ Con quick replies y streaming |
| System prompt | ✅ Datos reales de NeoVet |
| Lógica de negocio v1 | ✅ FAQ stateless completo |

v1 completo y funcionando en local. Pendiente deploy a Vercel y aprobación de Paula.

---

## 2. Filosofía de versionado

Cada feature pasa tres filtros antes de entrar en scope:

1. **¿Es bloqueante?** ¿Los usuarios pueden obtener valor sin ella? Si sí → diferir.
2. **¿Es reversible?** ¿Se puede agregar después sin romper nada? Si sí → diferir.
3. **¿Está validada?** ¿Sabemos que el usuario la necesita, o lo asumimos? Si se asume → diferir.

---

## 3. Roadmap general v1–v4

```
v1  Web widget FAQ estático
    └── Instalar ai + @ai-sdk/anthropic · API route · widget · system prompt
    └── CRM: independiente — no requiere nada del CRM

v2  Bot con DB + dashboard admin
    └── Supabase del CRM reutilizado · schema propio · urgencias L1–L4 · booking
    └── CRM: Fases A–C completas ✅ · Supabase activo ✅

v3  WhatsApp + integración CRM
    └── Kapso live · chatbot lee/escribe en CRM via API · análisis de imágenes
    └── CRM: API REST expuesta · Fase E (roles) implementada

v4  Automatización avanzada
    └── CRM como sistema central · historial clínico accesible desde el bot
    └── CRM: Fase D (facturación) definida · sistema 100% validado por Paula
```

| Versión | Estado chatbot | Blocker principal |
|---|---|---|
| v1 | ✅ Completo en local | Deploy a Vercel · aprobación de Paula |
| v2 | 🔲 Pendiente | v1 live · Kapso configurado |
| v3 | 🔲 Pendiente | v2 estable · CRM API expuesta · Fase E del CRM |
| v4 | Sin fecha | v3 validado · CRM Fase D definida |

---

## 4. v1 — Web widget FAQ estático

### Descripción

Widget de chat embebible que responde preguntas frecuentes de los clientes. Completamente stateless — sin DB, sin auth, sin llamadas al CRM. El system prompt se arma con los datos reales de la clínica.

### Lo que hay que construir (desde cero)

```
chatbot/
├── package.json          ← agregar: ai, @ai-sdk/anthropic
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── chat/
│   │   │       └── route.ts     ← streamText() con system prompt
│   │   ├── page.tsx             ← reemplazar placeholder con widget
│   │   └── globals.css
│   └── components/
│       └── chat-widget.tsx      ← UI del chat
└── src/lib/
    └── prompts/
        └── system.ts            ← system prompt con datos de Paula
```

### Stack

| Capa | Herramienta |
|---|---|
| Framework | Next.js 16 App Router + TypeScript |
| AI / LLM | Vercel AI SDK (`ai@4`) + `@ai-sdk/anthropic@1` · `claude-sonnet-4-6` |
| Estilo | Tailwind CSS |
| Hosting | Vercel |

### Features incluidas

| Feature | Detalle |
|---|---|
| FAQ stateless | Horarios, precios, servicios, ubicación, cómo sacar turno |
| Respuesta en streaming | `streamText()` via Vercel AI SDK |
| System prompt seeded | Datos reales de Paula — horarios, servicios, precios |
| Widget embebible | Standalone URL o iframe en landing |
| Español argentino | Tono clínica de bulldogs y razas braquicéfalas |
| Sin persistencia | Sesión independiente, sin historial |

### Features fuera de scope

- WhatsApp
- Booking de turnos
- Integración con CRM
- Sistema de urgencias L1–L4
- Análisis de imágenes
- Base de datos
- Autenticación

### Arquitectura

```
Cliente (browser)
    │
    ▼
Web Chat Widget (Next.js)
    │  POST /api/chat
    ▼
API Route — streamText()
    │
    ▼
Claude claude-sonnet-4-6 (Anthropic API)
    │  stream
    ▼
Respuesta renderizada al usuario
```

### Variables de entorno requeridas

```bash
ANTHROPIC_API_KEY=
NEXT_PUBLIC_APP_URL=
```

### Criterios de éxito

- El bot responde correctamente al menos 10 preguntas frecuentes en español argentino.
- Tiempo de respuesta menor a 3 segundos en el 95% de los mensajes.
- Paula revisa y aprueba las respuestas antes del lanzamiento.

---

## 5. v2 — Bot con DB + dashboard admin

### Descripción

El chatbot deja de ser stateless y persiste conversaciones, detecta urgencias y permite al staff gestionar escalaciones desde un dashboard. La infraestructura Supabase ya existe — fue creada por el CRM.

### Prerrequisitos

- v1 live y aprobado por Paula.
- Proyecto Supabase ya creado y activo ✅ (existe por el CRM).
- Kapso configurado con número de WhatsApp.
- Migraciones del chatbot ejecutadas en el mismo Supabase del CRM.

### Schema propio del chatbot

Estas tablas son del chatbot — se crean en el mismo Supabase del CRM pero con prefijos distintos para evitar colisiones:

| Tabla | Descripción |
|---|---|
| `bot_contacts` | Clientes identificados por WhatsApp ID |
| `bot_conversations` | Threads con estado y nivel de urgencia |
| `bot_messages` | Mensajes con análisis AI |
| `bot_appointments` | Turnos creados por el bot — pendientes de sync con CRM en v3 |
| `availability_rules` | Slots configurables por el staff |
| `business_context` | FAQ editable por Paula desde el dashboard |
| `urgency_escalations` | Log de escalaciones con acciones del staff |

> El prefijo `bot_` evita colisiones con las tablas del CRM (`clients`, `appointments`, etc.) que ya existen en el mismo Supabase.

### Sistema de urgencias L1–L4

| Nivel | Trigger | Acción del bot |
|---|---|---|
| L1 | Info general, precios, ubicación | Responde automáticamente |
| L2 | Booking de turno | Ejecuta flujo de reserva |
| L3 | Descripción de síntomas | AI analiza, flag para revisión veterinaria |
| L4 | Keywords de emergencia | Fast-path pre-AI, escalación inmediata |

**Regla de seguridad crítica:** `urgencyLevel` solo sube, nunca baja automáticamente. Solo el staff puede bajar el nivel desde el dashboard.

**Keywords L4 (español argentino):** convulsión, no respira, atropellado, envenenado, sangrado, no reacciona, desmayado, golpe fuerte, obstrucción, emergencia, urgente, se está muriendo.

**Por qué el fast-path es crítico:** La clínica atiende razas braquicéfalas con alta predisposición a emergencias respiratorias. El keyword check corre antes del agente, sin excepciones, sin depender de la disponibilidad de la AI.

### Herramientas del agente

| Tool | Descripción |
|---|---|
| `get_business_context` | Lee FAQ/horarios/precios desde `business_context` |
| `get_availability` | Consulta slots desde `availability_rules` |
| `book_appointment` | Crea turno en `bot_appointments` |
| `cancel_appointment` | Cancela turno existente |
| `escalate_to_human` | Crea escalación y notifica al staff |

### Flujo de mensajes

```
Usuario
    │
    ▼
Kapso Platform — POST /api/webhook
    │
    ▼
webhook/route.ts
    1. Verificar HMAC → 401 si inválido
    2. Retornar 200 inmediatamente (timeout Kapso: 5s)
    3. waitUntil() — background:
       a. Upsert bot_contact
       b. Upsert bot_conversation
       c. Descargar media → Supabase Storage
       d. Persistir mensaje
       e. Fast-path L4 → si match: escalación inmediata, skip AI
       f. Handoff al agente
    │
    ▼
agent/index.ts
    1. Cargar historial desde DB
    2. buildSystemPrompt() → consulta business_context (cache 5min)
    3. Clasificador de urgencia
    4. generateText({ model: claude-sonnet-4-6, tools })
    5. Actualizar urgencyLevel en DB
    6. Persistir respuesta
    │
    ▼
kapso/client.ts → sendMessage() → Usuario
```

### Dashboard admin

| Sección | Features |
|---|---|
| Conversaciones | Lista con badges L1–L4, vista de thread completo |
| Escalaciones | Log con acciones: resolver, llamar, descartar |
| Business context | Editor de FAQ, horarios, precios — Paula sin tocar código |
| Disponibilidad | Configuración de slots y bloqueos por fecha |

### Auth

Supabase SSR — mismo proveedor que el CRM. El CRM ya tiene `staff` table con roles `admin` / `receptionist`. El chatbot dashboard usa el mismo sistema de auth.

### Variables de entorno requeridas

```bash
# Ya existen — reutilizar del CRM
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
DATABASE_URL=

# Nuevas para el chatbot
ANTHROPIC_API_KEY=
KAPSO_API_KEY=
KAPSO_WEBHOOK_SECRET=
WHATSAPP_PHONE_NUMBER_ID=
NEXT_PUBLIC_APP_URL=
NEXT_PUBLIC_CLINIC_EMERGENCY_PHONE=
```

### Criterios de éxito

- Mensajes persistidos correctamente en DB.
- Fast-path L4 escala en menos de 200ms sin pasar por AI.
- Staff gestiona conversaciones y escalaciones desde el dashboard.
- Paula edita el FAQ sin tocar código.
- Booking crea turno y staff puede confirmarlo.

---

## 6. v3 — WhatsApp + integración CRM

### Descripción

El chatbot se conecta con el CRM via API interna. Los contactos del bot se cruzan con los `clients` reales del CRM. Los turnos creados por el bot aparecen en el calendario del CRM (`appointments`). Se activa el análisis de imágenes (triage L3) y recordatorios automáticos.

### Qué tiene el CRM que el chatbot puede usar en v3

| Tabla CRM | Qué le sirve al chatbot |
|---|---|
| `clients` | Match por `phone` para identificar clientes existentes |
| `patients` | Consultar mascotas del cliente identificado |
| `appointments` | Crear/cancelar turnos directamente en el CRM |
| `vaccinations` | Consultar próximas vacunas (alertas automatizadas) |
| `documents` | Adjuntar fotos de síntomas al paciente |
| `staff` | Saber a quién escalar según el rol |

### Prerrequisitos

- v2 estable en producción — mínimo 2 semanas sin incidentes.
- CRM con API REST expuesta (no existe en v1 del CRM — se construye en paralelo).
- Fase E del CRM (roles + RBAC UI) implementada.
- Kapso outbound activo y testeado.
- Número de WhatsApp definitivo confirmado por Paula.

### Features incluidas

| Feature | Detalle |
|---|---|
| Canal WhatsApp activo | Kapso outbound — mensajes reales a clientes |
| Chatbot ↔ CRM API | Contactos y turnos sincronizados |
| Análisis de imágenes (L3) | Claude vision — foto de síntomas → triage + escalación |
| Recordatorios de turnos | WhatsApp 24hs antes del turno |
| Reportes básicos | Métricas de uso, distribución de urgencias |

### Criterios de éxito

- WhatsApp responde en menos de 5 segundos.
- Fotos generan análisis AI y escalación L3 visible en dashboard.
- Turnos del bot aparecen en el calendario del CRM.
- Recordatorios automáticos se envían 24hs antes del turno.
- Clientes existentes en CRM son reconocidos por número de teléfono (`clients.phone`).

---

## 7. v4 — Automatización avanzada

### Descripción

El CRM es el sistema central único. El bot accede al historial clínico del paciente para contextualizar respuestas. Flujos end-to-end automatizados.

### Prerrequisitos

- v3 estable mínimo 2–3 meses en producción.
- CRM Fase D (facturación/AFIP) definida.
- Paula usa el CRM como único sistema.

### Features contempladas (sin fecha)

| Feature | Dato del CRM que usa |
|---|---|
| Historial clínico via bot | `consultations`, `treatment_items` |
| Alertas de vacunas próximas | `vaccinations.next_due_at` |
| Re-engagement de clientes inactivos | `appointments.scheduled_at` + `patients` |
| Seguimiento post-consulta | `consultations.plan` + `appointments` |
| Integración facturación | Fase D del CRM (AFIP) |

---

## 8. Dependencias y blockers por versión

### v1

| # | Blocker | Responsable | Estado |
|---|---|---|---|
| B1 | Instalar dependencias AI | Franco | ✅ Hecho — ai@4 · @ai-sdk/anthropic@1 · @ai-sdk/react@1 |
| B2 | Paula aprueba contenido del system prompt | Tomás + Paula | 🔲 Pendiente |
| B3 | Definir dónde se embebe el widget | Tomás | 🔲 Pendiente |

### v2

| # | Blocker | Responsable | Estado |
|---|---|---|---|
| B4 | v1 live y aprobado | Franco | 🔲 Pendiente |
| B5 | Supabase ya existe por el CRM — reutilizar credenciales | Franco | ✅ Desbloqueado |
| B6 | Migraciones del chatbot (`bot_*` tablas) ejecutadas en Supabase del CRM | Franco | 🔲 Pendiente |
| B7 | Cuenta Kapso creada con número de WhatsApp conectado | Tomás + Paula | 🔲 Pendiente |
| B8 | `KAPSO_WEBHOOK_SECRET` generado y configurado | Franco | 🔲 Pendiente |
| B9 | Número de WhatsApp definitivo de la clínica | Paula | 🔲 Pendiente |
| B10 | Seeding inicial de `business_context` con datos reales | Tomás + Paula | 🔲 Pendiente |

### v3

| # | Blocker | Responsable | Estado |
|---|---|---|---|
| B11 | v2 estable — mínimo 2 semanas sin incidentes críticos | Franco | 🔲 Pendiente |
| B12 | CRM API REST documentada y expuesta | Franco | 🔲 Pendiente |
| B13 | Fase E del CRM (roles + RBAC UI) implementada — pendiente reunión con Paula | Tomás + Paula | 🔲 Bloqueado |
| B14 | Kapso outbound activo y testeado | Franco | 🔲 Pendiente |

### v4

| # | Blocker | Responsable | Estado |
|---|---|---|---|
| B15 | v3 validado en producción por Paula | Tomás + Paula | Sin fecha |
| B16 | CRM Fase D (facturación/AFIP) definida o descartada formalmente | Franco + Paula | 🔲 Bloqueado |

---

## 9. Criterios de paso entre versiones

### v1 → v2

- [ ] Widget deployado en Vercel y funcionando.
- [ ] Paula aprobó respuestas FAQ en español argentino.
- [ ] Bot responde en menos de 3s en el 95% de los casos.
- [ ] Sin errores críticos en producción durante al menos 1 semana.
- [ ] Migraciones `bot_*` ejecutadas en Supabase del CRM (B6).
- [ ] Kapso configurado con webhook URL y secret (B7, B8).

### v2 → v3

- [ ] Mensajes persistidos correctamente en DB.
- [ ] Fast-path L4 escala en menos de 200ms — verificado con keyword de prueba.
- [ ] Paula usa el dashboard admin diariamente sin incidentes críticos.
- [ ] Booking end-to-end funciona: creación, confirmación, cancelación.
- [ ] Business context editor en uso por el equipo.
- [ ] Sin incidentes críticos durante 2 semanas con tráfico real.
- [ ] CRM API REST expuesta y documentada (B12).
- [ ] Fase E del CRM (roles) implementada (B13).

### v3 → v4

- [ ] v3 en producción mínimo 2–3 meses sin incidentes críticos.
- [ ] WhatsApp con volumen real de mensajes de clientes.
- [ ] Paula usa el CRM como sistema principal.
- [ ] CRM Fase D definida o descartada formalmente.

---

## 10. Relación chatbot ↔ CRM por versión

| Versión | Relación | Detalle |
|---|---|---|
| v1 | Ninguna | Bot stateless. System prompt con datos estáticos. CRM no sabe que el bot existe. |
| v2 | Infraestructura compartida | Mismo Supabase, schemas separados (`bot_*` vs tablas del CRM). Sin llamadas entre apps. |
| v3 | Integración real via API | Bot lee/escribe en CRM. Turnos del bot → `appointments`. Fotos → `documents`. |
| v4 | Sistema unificado | Bot opera sobre datos del CRM directamente. Historial clínico como contexto. |

### Tablas del CRM que el chatbot toca por versión

| Tabla CRM | v1 | v2 | v3 | v4 |
|---|---|---|---|---|
| `clients` | — | — | Lectura (match por `phone`) | Lectura + escritura |
| `patients` | — | — | Lectura (mascotas del cliente) | Lectura + contexto clínico |
| `appointments` | — | — | Escritura (turnos del bot) | Escritura + follow-up |
| `consultations` | — | — | — | Lectura (historial para contexto) |
| `vaccinations` | — | — | — | Lectura (alertas de vencimiento) |
| `documents` | — | — | Escritura (fotos de síntomas) | Lectura + escritura |
| `staff` | — | — | Lectura (a quién escalar) | Lectura |

---

## Apéndice — Stack de referencia

| Capa | Herramienta | Scope |
|---|---|---|
| Framework | Next.js 16 App Router + TypeScript | `chatbot/` |
| AI / LLM | Vercel AI SDK + Claude claude-sonnet-4-6 | `chatbot/` |
| Base de datos | Supabase PostgreSQL — mismo proyecto que CRM | v2+ |
| ORM | Drizzle ORM | v2+ |
| Auth | Supabase SSR — mismo proveedor que CRM | v2+ |
| WhatsApp | Kapso SDK | v3 |
| Estilo | Tailwind CSS | `chatbot/` |
| Hosting | Vercel | Todas las versiones |

## Apéndice — Documentos relacionados

| Documento | Ubicación |
|---|---|
| Charter del chatbot | `chatbot/docs/charter.md` |
| Technical spec del chatbot | `chatbot/docs/technical-spec.md` |
| Architecture Phase 1 Blueprint | `chatbot/docs/architecture-phase1.md` |
| ADR-001 AI provider | `chatbot/docs/architecture/ADR-001-ai-provider-claude.md` |
| ADR-003 Webhook strategy | `chatbot/docs/architecture/ADR-003-webhook-response-strategy.md` |
| ADR-005 Urgency system | `chatbot/docs/architecture/ADR-005-urgency-system-l1-l4.md` |
| ADR-006 Auth | `chatbot/docs/architecture/ADR-006-auth-supabase-ssr.md` |
| Charter del CRM | `crm/docs/charter.md` |
| Technical spec del CRM | `crm/docs/technical-spec.md` |
| Plan de desarrollo del CRM | `crm/docs/development-plan.md` |
| Contexto general del negocio | `CLAUDE.md` (raíz del monorepo) |