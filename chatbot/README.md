# NeoVet Chatbot — Documentación de Versiones

| Campo | Valor |
|---|---|
| **Proyecto** | NeoVet Chatbot |
| **Cliente** | Paula Silveyra — NeoVet |
| **Tech lead** | Franco Zancocchia |
| **Product lead** | Tomás Pinolini |
| **Versión del doc** | 3.0 |
| **Última actualización** | 2026-04-02 |
| **Fuente de verdad** | Código real de `crm/` + `chatbot/` en rama `main` |

---

## Índice

1. [Estado actual de ambos proyectos](#1-estado-actual-de-ambos-proyectos)
2. [Filosofía de versionado](#2-filosofía-de-versionado)
3. [Roadmap general v1–v3](#3-roadmap-general-v1v3)
4. [v1 — Web widget FAQ estático (extra)](#4-v1--web-widget-faq-estático-extra)
5. [v2 — Bot de WhatsApp (producto principal)](#5-v2--bot-de-whatsapp-producto-principal)
6. [v3 — Canales adicionales + stock](#6-v3--canales-adicionales--stock)
7. [Dependencias y blockers por versión](#7-dependencias-y-blockers-por-versión)
8. [Criterios de paso entre versiones](#8-criterios-de-paso-entre-versiones)
9. [Relación chatbot ↔ CRM por versión](#9-relación-chatbot--crm-por-versión)

---

## 1. Estado actual de ambos proyectos

### CRM — lo que hay realmente en el código

| Área | Estado real en código |
|---|---|
| Auth + middleware con roles | ✅ roles `admin`, `owner`, `vet`, `groomer` |
| Schema DB (27 tablas) | ✅ `clients`, `patients`, `appointments`, `consultations`, `treatment_items`, `vaccinations`, `deworming_records`, `documents`, `complementary_methods`, `staff`, `grooming_profiles`, `grooming_sessions`, `settings`, `services`, `schedule_blocks`, `follow_ups`, `email_logs`, `products`, `providers`, `sales`, `sale_items`, `stock_entries`, `cash_sessions`, `cash_movements`, `bot_contacts`, `bot_conversations`, `bot_messages`, `bot_escalations`, `bot_business_context` |
| CRUD clientes y pacientes | ✅ Con Zod, server actions, shadcn/ui |
| Calendario de turnos (semanal + diario) | ✅ Con filtros, bloqueos, asignación de staff |
| Historial clínico SOAP | ✅ Con vitales, plan de tratamiento, métodos complementarios |
| Vacunaciones y desparasitaciones | ✅ CRUD inline en detalle de paciente |
| Almacenamiento de documentos | ✅ Supabase Storage con signed URLs |
| Dashboard home | ✅ Cards de resumen + turnos del día |
| Importación desde Geovet | ✅ 1.771 clientes · 1.380 pacientes · ~1.300 consultas migradas |
| Módulo de peluquería | ✅ Perfiles, sesiones, fotos antes/después |
| Gestión de staff | ✅ CRUD, roles, activación/desactivación |
| Catálogo de servicios | ✅ Con duraciones y categorías |
| Suspensión de agenda (H.3) | ✅ `schedule_blocks` — bloqueos por día/horario |
| Recordatorios por email (Fase I) | ✅ Crons 48h/24h turno, 7d vacuna, seguimiento post-consulta |
| Seguimientos post-consulta | ✅ UI desde consulta + cron diario |
| Mobile responsive (Fase J) | ✅ Sidebar hamburguesa + drawer |
| API REST del bot (Fase K) | ✅ `/api/bot/*` — 6 endpoints con auth por API key |
| Schemas `bot_*` | ✅ `bot_contacts`, `bot_conversations`, `bot_messages`, `bot_escalations`, `bot_business_context` |
| Módulo petshop | ✅ Productos, proveedores, ventas, stock |
| Módulo caja | ✅ Sesiones de caja, movimientos |
| Fase L — Day-one readiness | ✅ Dashboard filtrado por rol, no-show, cancel con motivo, emails de confirmación/cancelación, peluquería en caja, resumen de paciente en turno, atajo de seguimiento, widget de caja |
| Facturación / AFIP | 🔲 Pendiente confirmación de Paula (Fase D) |
| Dashboard bot en CRM | 🔲 Pendiente (Fase K) |
| Seed `bot_business_context` en producción | 🔲 Pendiente |

### Chatbot — lo que hay realmente en el código

| Área | Estado real |
|---|---|
| Scaffold Next.js 16 | ✅ |
| Dependencias AI | ✅ `ai@4` · `@ai-sdk/anthropic@1` · `@ai-sdk/react@1` |
| API route `/api/chat` | ✅ `streamText()` con `claude-sonnet-4-6` |
| Widget de chat con quick replies | ✅ Streaming en tiempo real |
| System prompt con datos reales | ✅ Paula Silveyra Mat. 2046, especialidades, horarios, servicios |
| Logo NeoVet en header | ✅ |
| Deploy en Vercel | ✅ `neo-vet-widget.vercel.app` |
| Integrado en landing como iframe flotante | ✅ |

v1 completo y deployado. Pendiente: aprobación del system prompt por Paula.

---

## 2. Filosofía de versionado

**El producto principal es el bot de WhatsApp.** El widget web (v1) es un extra para la landing — no el foco del proyecto.

Cada feature pasa tres filtros antes de entrar en scope:

1. **¿Es bloqueante?** ¿Los usuarios pueden obtener valor sin ella? Si sí → diferir.
2. **¿Es reversible?** ¿Se puede agregar después sin romper nada? Si sí → diferir.
3. **¿Está validada?** ¿Sabemos que el usuario la necesita, o lo asumimos? Si se asume → diferir.

---

## 3. Roadmap general v1–v3
```
v1  Web widget FAQ estático (extra para la landing)
    └── streamText() + system prompt fijo · sin DB · sin CRM
    └── CRM: independiente — no requiere nada del CRM

v2  Bot de WhatsApp (producto principal)
    └── TypeScript + Express · Kapso · Supabase del CRM · Claude AI
    └── Booking de turnos · urgencias L1–L4 · recordatorios · dashboard en CRM
    └── CRM: API REST expuesta ✅ · Kapso pendiente

v3  Canales adicionales + stock
    └── TikTok DMs · stock farmacia/pet shop · recordatorios de vacunas
    └── CRM: inventario ya construido ✅
```

| Versión | Estado chatbot | Blocker principal |
|---|---|---|
| v1 | ✅ Live en `neo-vet-widget.vercel.app` | Aprobación de Paula |
| v2 | 🔲 Pendiente | Kapso configurado · seed `bot_business_context` · dashboard bot en CRM |
| v3 | 🔲 Pendiente | v2 estable |

---

## 4. v1 — Web widget FAQ estático (extra)

### Descripción

Widget de chat embebible en la landing de NeoVet. Responde preguntas frecuentes de forma stateless — sin DB, sin auth, sin llamadas al CRM. Es un extra útil, no el producto central.

### Arquitectura
```
Cliente (browser)
    │
    ▼
Web Chat Widget (Next.js 16) — neo-vet-widget.vercel.app
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

### Archivos relevantes
```
chatbot/
├── src/app/api/chat/route.ts          ← streamText() con system prompt
├── src/components/chat-widget.tsx     ← UI con quick replies y streaming
├── src/lib/prompts/system.ts          ← datos reales de NeoVet
└── src/app/page.tsx                   ← página con el widget + logo
```

### Stack

| Capa | Herramienta |
|---|---|
| Framework | Next.js 16 App Router + TypeScript |
| AI / LLM | `ai@4` + `@ai-sdk/anthropic@1` · `claude-sonnet-4-6` |
| Estilo | Tailwind CSS |
| Hosting | Vercel — `neo-vet-widget.vercel.app` |

### Features incluidas

| Feature | Estado |
|---|---|
| FAQ stateless — horarios, servicios, ubicación, turnos | ✅ |
| Respuesta en streaming | ✅ |
| System prompt con datos reales de Paula Silveyra | ✅ |
| Widget embebido en landing como iframe flotante | ✅ |
| Logo NeoVet en header | ✅ |
| Español argentino | ✅ |
| Sin persistencia | ✅ |

### Variables de entorno
```bash
ANTHROPIC_API_KEY=
NEXT_PUBLIC_APP_URL=
```

### Pendientes para cierre formal de v1

| # | Tarea | Responsable |
|---|---|---|
| P1 | Paula aprueba el contenido del system prompt | Tomás + Paula |

---

## 5. v2 — Bot de WhatsApp (producto principal)

### Descripción

El canal principal de comunicación de la clínica con sus clientes. El bot recibe mensajes de WhatsApp vía Kapso, persiste conversaciones, detecta urgencias y permite al staff gestionar todo desde una sección integrada dentro del CRM existente.

**Importante:** el dashboard admin del bot vive dentro del CRM — no es una app separada. Se agrega como sección en `crm/src/app/dashboard/bot/`.

### Prerrequisitos

- v1 live y aprobado por Paula. ✅
- CRM con API REST expuesta. ✅ (`/api/bot/*`)
- Migraciones `bot_*` ejecutadas en Supabase del CRM. ✅
- Seed `bot_business_context` ejecutado en producción. 🔲
- Kapso configurado con el número de WhatsApp Business de Paula. 🔲
- Dashboard bot en CRM construido. 🔲

### Arquitectura
```
Cliente (WhatsApp)
    │
    ▼
Kapso Platform — POST /api/webhook
    │
    ▼
Bot Server (TypeScript + Express — app separada en chatbot/)
    1. Verificar HMAC Kapso
    2. Retornar 200 inmediatamente (timeout Kapso: 5s)
    3. Background:
       a. Upsert bot_contact
       b. Upsert bot_conversation
       c. Persistir mensaje
       d. Fast-path L4 → si match: escalación inmediata, skip AI
       e. Parseo de intents (Claude Haiku)
       f. State machine / herramientas del agente
    │
    ▼
CRM API REST — crm/src/app/api/bot/ ✅
    │  Lectura/escritura de clientes, pacientes, turnos
    ▼
Supabase PostgreSQL (mismo proyecto que el CRM)
    │
    ▼
Kapso → sendMessage() → Usuario
```

### API REST del CRM disponible para el bot

| Endpoint | Método | Estado |
|---|---|---|
| `/api/bot/clients` | GET | ✅ |
| `/api/bot/availability` | GET | ✅ |
| `/api/bot/appointments` | POST | ✅ |
| `/api/bot/appointments/:id` | PATCH | ✅ |
| `/api/bot/services` | GET | ✅ |
| `/api/bot/context` | GET | ✅ |

Autenticación: `Authorization: Bearer BOT_API_KEY` en todos los endpoints.

### Schema `bot_*` en Supabase

| Tabla | Estado |
|---|---|
| `bot_contacts` | ✅ Migrada |
| `bot_conversations` | ✅ Migrada |
| `bot_messages` | ✅ Migrada |
| `bot_escalations` | ✅ Migrada |
| `bot_business_context` | ✅ Migrada — seed pendiente en producción |

### Sistema de urgencias L1–L4

| Nivel | Trigger | Acción del bot |
|---|---|---|
| L1 | Info general, precios, ubicación | Responde automáticamente |
| L2 | Booking de turno | Ejecuta flujo de reserva vía CRM API |
| L3 | Descripción de síntomas | AI analiza → flag para revisión veterinaria |
| L4 | Keywords de emergencia | Fast-path pre-AI, escalación inmediata |

**Regla de seguridad crítica:** `urgencyLevel` solo sube, nunca baja automáticamente. Solo el staff puede bajar el nivel desde el dashboard del CRM.

**Keywords L4:** convulsión, no respira, atropellado, envenenado, sangrado, no reacciona, desmayado, golpe fuerte, obstrucción, emergencia, urgente, se está muriendo.

### Pendientes para arrancar v2

| # | Tarea | Responsable |
|---|---|---|
| P2 | Seed `bot_business_context` en producción | Franco |
| P3 | `BOT_API_KEY` configurada en Vercel | Franco |
| P4 | Dashboard bot en CRM (`/dashboard/bot/`) | Franco |
| P5 | Confirmar que Paula tiene WhatsApp Business activo | Tomás |
| P6 | Onboarding en Kapso iniciado | Tomás |
| P7 | Definir qué hace el bot con L3 | Tomás + Paula |
| P8 | Definir L4 — ¿notifica solo a Paula o hay guardia rotativa? | Tomás + Paula |

---

## 6. v3 — Canales adicionales + stock

### Descripción

Se agregan canales nuevos (TikTok DMs) y el bot gana acceso al inventario del CRM. También se activan los recordatorios automáticos de vacunas vía WhatsApp.

### Prerrequisitos

- v2 estable en producción — mínimo 2 semanas sin incidentes críticos.
- TikTok Business API configurada.

### Features incluidas

| Feature | Detalle | Dato del CRM que usa |
|---|---|---|
| TikTok DMs | Tercer canal | — |
| Consulta de stock | Farmacia y pet shop desde el bot | `products`, `stock_entries` ✅ ya existe |
| Recordatorios de vacunas vía WhatsApp | Alertas 7 días antes | `vaccinations.next_due_at` |
| Seguimiento post-consulta vía WhatsApp | Mensaje automático | `follow_ups` ✅ ya existe |

---

## 7. Dependencias y blockers por versión

### v1

| # | Blocker | Responsable | Estado |
|---|---|---|---|
| B1 | Dependencias AI instaladas | Franco | ✅ |
| B2 | Deploy a Vercel | Franco | ✅ `neo-vet-widget.vercel.app` |
| B3 | Widget embebido en landing | Franco | ✅ iframe flotante |
| B4 | Paula aprueba system prompt | Tomás + Paula | 🔲 Pendiente |

### v2

| # | Blocker | Responsable | Estado |
|---|---|---|---|
| B5 | v1 live | Franco | ✅ |
| B6 | Supabase del CRM reutilizado | Franco | ✅ |
| B7 | CRM API REST expuesta | Franco | ✅ 6 endpoints `/api/bot/*` |
| B8 | Migraciones `bot_*` ejecutadas | Franco | ✅ |
| B9 | Seed `bot_business_context` en producción | Franco | 🔲 Pendiente |
| B10 | `BOT_API_KEY` en Vercel | Franco | 🔲 Pendiente |
| B11 | Dashboard bot en CRM | Franco | 🔲 Pendiente |
| B12 | Paula confirma WhatsApp Business | Tomás + Paula | 🔲 Pendiente |
| B13 | Onboarding en Kapso iniciado | Tomás | 🔲 Pendiente |
| B14 | `KAPSO_WEBHOOK_SECRET` configurado | Franco | 🔲 Pendiente |

### v3

| # | Blocker | Responsable | Estado |
|---|---|---|---|
| B15 | v2 estable 2 semanas | Franco | 🔲 Pendiente |
| B16 | TikTok Business API configurada | Tomás | 🔲 Pendiente |

---

## 8. Criterios de paso entre versiones

### v1 → v2

- [x] Widget deployado en Vercel y funcionando.
- [x] CRM API REST expuesta y documentada.
- [x] Migraciones `bot_*` ejecutadas en Supabase.
- [ ] Paula aprobó respuestas FAQ en español argentino.
- [ ] Seed `bot_business_context` en producción.
- [ ] Kapso configurado con webhook URL y secret.

### v2 → v3

- [ ] Mensajes de WhatsApp persistidos correctamente en DB.
- [ ] Fast-path L4 escala en menos de 200ms.
- [ ] Paula usa el dashboard del bot en el CRM sin incidentes.
- [ ] Booking end-to-end funciona: creación, confirmación, cancelación.
- [ ] Recordatorios de 48h y 24h funcionando en producción.
- [ ] Sin incidentes críticos durante 2 semanas con tráfico real.

---

## 9. Relación chatbot ↔ CRM por versión

| Versión | Relación | Detalle |
|---|---|---|
| v1 | Ninguna | Bot stateless. System prompt con datos estáticos. |
| v2 | Integración vía API REST | Bot lee/escribe en CRM. Dashboard del bot en CRM. |
| v3 | Integración extendida | v2 + stock + vacunas + TikTok DMs. |

### Endpoints del CRM disponibles para el bot

| Endpoint | Método | Descripción | Estado |
|---|---|---|---|
| `/api/bot/clients` | GET | Buscar cliente por `phone` | ✅ |
| `/api/bot/availability` | GET | Slots disponibles por fecha y servicio | ✅ |
| `/api/bot/appointments` | POST | Crear turno | ✅ |
| `/api/bot/appointments/:id` | PATCH | Cancelar / modificar turno | ✅ |
| `/api/bot/services` | GET | Listar servicios activos | ✅ |
| `/api/bot/context` | GET | Leer `bot_business_context` | ✅ |

---

## Apéndice — Stack de referencia

| Capa | Herramienta | Scope |
|---|---|---|
| Widget web (v1) | Next.js 16 App Router + TypeScript | `chatbot/` |
| Bot server (v2+) | TypeScript + Express | `chatbot/` — proceso separado |
| AI / LLM (respuestas) | Claude Sonnet — `claude-sonnet-4-6` | Todas las versiones |
| AI / LLM (intents v2+) | Claude Haiku | v2+ |
| Base de datos | Supabase PostgreSQL — mismo proyecto que CRM | v2+ |
| ORM | Drizzle ORM | v2+ |
| Auth (dashboard bot) | Supabase SSR — mismo que CRM | v2+ |
| WhatsApp | Kapso SDK | v2+ |
| Estilo | Tailwind CSS | `chatbot/` |
| Hosting | Vercel | Todas las versiones |

## Apéndice — Documentos relacionados

| Documento | Ubicación |
|---|---|
| Charter del CRM | `crm/docs/v1/charter.md` |
| Plan de desarrollo del CRM v1 | `crm/docs/v1/development-plan.md` |
| Roadmap del CRM | `crm/docs/roadmap.md` |
| ADR-002 WhatsApp Kapso | `crm/docs/v1/architecture/ADR-002-whatsapp-kapso.md` |
| ADR-004 Base de datos | `crm/docs/v1/architecture/ADR-004-database-drizzle-supabase.md` |
| Contexto general del negocio | `CLAUDE.md` (raíz del monorepo) |