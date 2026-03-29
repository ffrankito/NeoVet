# NeoVet Chatbot — Documentación de Versiones

| Campo | Valor |
|---|---|
| **Proyecto** | NeoVet Chatbot |
| **Cliente** | Paula Silveira — NeoVet |
| **Tech lead** | Franco Zancocchia |
| **Product lead** | Tomás Pinolini |
| **Versión del doc** | 2.0 |
| **Última actualización** | 2026-03-29 |
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

> Nota: el tech spec menciona Next.js 14 pero el `package.json` tiene Next.js 16. El código es la fuente de verdad.

| Área | Estado real en código |
|---|---|
| Auth + middleware con roles | ✅ `src/lib/supabase/middleware.ts` — roles `admin`, `vet`, `groomer` |
| Schema DB (11+ tablas) | ✅ `clients`, `patients`, `appointments`, `consultations`, `treatment_items`, `vaccinations`, `deworming_records`, `documents`, `staff`, `grooming_profiles`, `grooming_sessions`, `settings` |
| CRUD clientes y pacientes | ✅ Con Zod, server actions, shadcn/ui |
| Calendario de turnos | ✅ Con filtros, paginación, tipos `veterinary` / `grooming`, asignación de staff |
| Historial clínico SOAP | ✅ Con vitales, plan de tratamiento, toggle de estado |
| Vacunaciones y desparasitaciones | ✅ CRUD inline en detalle de paciente |
| Almacenamiento de documentos | ✅ Supabase Storage con signed URLs |
| Dashboard home | ✅ Cards de resumen + turnos del día + acciones inline |
| Importación desde Geovet | ✅ 1.771 clientes · 1.380 pacientes · ~1.300 consultas migradas |
| Módulo de peluquería (perfiles + sesiones) | ✅ `grooming_profiles`, `grooming_sessions`, fotos antes/después, hallazgos, precios por tier |
| Gestión de staff (admin) | ✅ CRUD de miembros, roles, activación/desactivación vía Supabase Auth Admin |
| Control de acceso por rol (vets, groomers) | ✅ Middleware + filtros por tipo de turno en UI |
| Facturación / AFIP | 🔲 Pendiente confirmación de Paula (Fase D del CRM) |
| API REST pública | 🔲 No existe — se construye en paralelo con v2 del chatbot |
| Catálogo de servicios | 🔲 Pendiente (Fase G del CRM) |
| Vista de calendario semanal | 🔲 Pendiente (Fase H del CRM) |
| Recordatorios por email | 🔲 Pendiente (Fase I del CRM) |

### Chatbot — lo que hay realmente en el código

| Área | Estado real |
|---|---|
| Scaffold Next.js 16 | ✅ |
| Dependencias AI | ✅ `ai@4` · `@ai-sdk/anthropic@1` · `@ai-sdk/react@1` |
| API route `/api/chat` | ✅ `streamText()` con `claude-sonnet-4-6` |
| Widget de chat con quick replies | ✅ Streaming en tiempo real |
| System prompt con datos reales | ✅ Dirección, horarios, servicios, WhatsApp de la clínica |
| Documentación de versiones | ✅ Este documento |

v1 completo y funcionando en local. Pendiente: deploy a Vercel y aprobación del system prompt por Paula.

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
    └── CRM: necesita API REST expuesta + Fases E y G completas

v3  Canales adicionales + stock
    └── TikTok DMs · stock farmacia/pet shop · recordatorios de vacunas
    └── CRM: necesita inventario construido (Fase v2 del roadmap del CRM)
```

| Versión | Estado chatbot | Blocker principal |
|---|---|---|
| v1 | ✅ Completo en local | Deploy a Vercel · aprobación de Paula |
| v2 | 🔲 Pendiente | CRM API REST expuesta · Kapso configurado · Fases E + G del CRM |
| v3 | 🔲 Pendiente | v2 estable · inventario en CRM |

---

## 4. v1 — Web widget FAQ estático (extra)

### Descripción

Widget de chat embebible en la landing de NeoVet. Responde preguntas frecuentes de forma stateless — sin DB, sin auth, sin llamadas al CRM. Es un extra útil, no el producto central.

### Arquitectura

```
Cliente (browser)
    │
    ▼
Web Chat Widget (Next.js 16)
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
└── src/app/page.tsx                   ← página con el widget
```

### Stack

| Capa | Herramienta |
|---|---|
| Framework | Next.js 16 App Router + TypeScript |
| AI / LLM | `ai@4` + `@ai-sdk/anthropic@1` · `claude-sonnet-4-6` |
| Estilo | Tailwind CSS |
| Hosting | Vercel |

### Features incluidas

| Feature | Detalle |
|---|---|
| FAQ stateless | Horarios, servicios, ubicación, cómo sacar turno |
| Respuesta en streaming | `streamText()` vía Vercel AI SDK |
| System prompt seeded | Datos reales de Paula — horarios, servicios, WhatsApp |
| Widget embebible | URL standalone o iframe en la landing |
| Español argentino | Tono de clínica de razas braquicéfalas |
| Sin persistencia | Sesión independiente, sin historial |

### Features fuera de scope

- WhatsApp o cualquier otro canal de mensajería
- Booking de turnos
- Sistema de urgencias
- Integración con CRM
- Base de datos propia
- Análisis de imágenes

### Variables de entorno

```bash
ANTHROPIC_API_KEY=
NEXT_PUBLIC_APP_URL=
```

### Pendientes para go-live

| # | Tarea | Responsable |
|---|---|---|
| P1 | Paula aprueba el contenido del system prompt | Tomás + Paula |
| P2 | Definir dónde se embebe el widget (landing, iframe) | Tomás |
| P3 | Deploy a Vercel | Franco |

### Criterios de éxito

- El bot responde correctamente las preguntas frecuentes principales en español argentino.
- Tiempo de respuesta menor a 3 segundos en el 95% de los mensajes.
- Paula revisó y aprobó las respuestas antes del lanzamiento.

---

## 5. v2 — Bot de WhatsApp (producto principal)

### Descripción

El canal principal de comunicación de la clínica con sus clientes. El bot recibe mensajes de WhatsApp vía Kapso, persiste conversaciones, detecta urgencias y permite al staff gestionar todo desde una sección integrada dentro del CRM existente.

**Importante:** el dashboard admin del bot vive dentro del CRM — no es una app separada. Se agrega como sección en `crm/src/app/dashboard/bot/`. El staff ya está en el CRM todo el día; el auth y los roles son los mismos.

### Prerrequisitos

- v1 live y aprobado por Paula.
- CRM con API REST expuesta (nueva — no existe aún).
- CRM Fase E completa (roles `vet` / `groomer` con RBAC UI).
- CRM Fase G completa (catálogo de servicios con duraciones).
- Kapso configurado con el número de WhatsApp Business de Paula.
- Migraciones `bot_*` ejecutadas en el mismo Supabase del CRM.

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
CRM API REST (nueva — crm/src/app/api/bot/)
    │  Lectura/escritura de clientes, pacientes, turnos
    ▼
Supabase PostgreSQL (mismo proyecto que el CRM)
    │
    ▼
Kapso → sendMessage() → Usuario
```

### Schema propio del chatbot

Tablas en el mismo Supabase del CRM con prefijo `bot_` para evitar colisiones:

| Tabla | Descripción |
|---|---|
| `bot_contacts` | Clientes identificados por número de WhatsApp |
| `bot_conversations` | Threads con estado y nivel de urgencia |
| `bot_messages` | Mensajes con metadata de análisis AI |
| `bot_escalations` | Log de escalaciones con acciones del staff |
| `bot_availability_rules` | Slots configurables desde el dashboard |
| `bot_business_context` | FAQ/horarios/precios editables por Paula |

> El prefijo `bot_` evita colisiones con las tablas del CRM (`clients`, `appointments`, etc.) que ya existen en el mismo Supabase.

### Sistema de urgencias L1–L4

| Nivel | Trigger | Acción del bot |
|---|---|---|
| L1 | Info general, precios, ubicación | Responde automáticamente |
| L2 | Booking de turno | Ejecuta flujo de reserva vía CRM API |
| L3 | Descripción de síntomas | AI analiza → flag para revisión veterinaria |
| L4 | Keywords de emergencia | Fast-path pre-AI, escalación inmediata |

**Regla de seguridad crítica:** `urgencyLevel` solo sube, nunca baja automáticamente. Solo el staff puede bajar el nivel desde el dashboard del CRM.

**Keywords L4 (español argentino):** convulsión, no respira, atropellado, envenenado, sangrado, no reacciona, desmayado, golpe fuerte, obstrucción, emergencia, urgente, se está muriendo.

**Por qué el fast-path es crítico:** La clínica atiende razas braquicéfalas con alta predisposición a emergencias respiratorias. El keyword check corre antes del agente, sin excepciones, sin depender de la disponibilidad de la API de AI.

### Herramientas del agente

| Tool | Descripción | API del CRM que usa |
|---|---|---|
| `get_business_context` | Lee FAQ/horarios desde `bot_business_context` | — (tabla propia del bot) |
| `get_client` | Busca cliente existente por teléfono | `GET /api/bot/clients?phone=` |
| `get_availability` | Consulta slots disponibles | `GET /api/bot/availability` |
| `book_appointment` | Crea turno en el CRM | `POST /api/bot/appointments` |
| `cancel_appointment` | Cancela turno existente | `PATCH /api/bot/appointments/:id` |
| `escalate_to_human` | Crea escalación en `bot_escalations` | — (tabla propia del bot) |

### Dashboard admin del bot (dentro del CRM)

Ubicación: `crm/src/app/dashboard/bot/`

| Sección | Features |
|---|---|
| Conversaciones | Lista con badges L1–L4, vista de thread completo |
| Escalaciones | Log con acciones: resolver, llamar, descartar |
| Business context | Editor de FAQ, horarios, precios — Paula sin tocar código |
| Disponibilidad | Configuración de slots y bloqueos por fecha |

**Auth:** mismo Supabase SSR del CRM. Solo accesible para roles `admin`.

### Recordatorios automáticos

| Trigger | Momento | Canal |
|---|---|---|
| Recordatorio de turno | 48h antes | WhatsApp vía Kapso |
| Recordatorio de turno | 24h antes | WhatsApp vía Kapso |
| Recordatorio especial peluquería | 24h antes | WhatsApp — "venir con correa, collar, sin garrapatas" |

Los recordatorios los dispara un cron job en Vercel que consulta la tabla `appointments` del CRM.

### Tipos de turno reconocidos por el bot

Confirmados por Paula en la entrevista:

| Tipo | Duración base | Nota |
|---|---|---|
| Consulta general | 30 min | — |
| Cirugía | Variable | Bloqueo extra de 2hs post-cirugía |
| Estética / peluquería | Variable | Perfil del paciente define duración |
| Colocación de collar | 15 min | — |
| Colocación de correa | 15 min | — |
| Antiparasitario | 15 min | — |

**Guardia pasiva dominical:** la clínica tiene guardia pasiva los domingos de 9:00 a 20:00. El bot informa esto pero no toma turnos domingos.

### Variables de entorno requeridas

```bash
# Reutilizar del CRM
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
DATABASE_URL=

# Nuevas para el bot
ANTHROPIC_API_KEY=
KAPSO_API_KEY=
KAPSO_WEBHOOK_SECRET=
WHATSAPP_PHONE_NUMBER_ID=
NEXT_PUBLIC_APP_URL=
CLINIC_EMERGENCY_PHONE=
```

### Pendientes para arrancar v2

| # | Tarea | Responsable |
|---|---|---|
| P4 | Confirmar que Paula tiene WhatsApp Business activo | Tomás |
| P5 | Tomás inicia proceso de onboarding en Kapso | Tomás |
| P6 | Definir qué hace el bot con L3 — ¿deriva a WhatsApp o abre turno urgente? | Tomás + Paula |
| P7 | Definir L4 — ¿notifica solo a Paula o hay guardia rotativa? | Tomás + Paula |
| P8 | Fases E + G del CRM completas | Franco |
| P9 | CRM API REST diseñada y expuesta | Franco |
| P10 | Migraciones `bot_*` ejecutadas en Supabase del CRM | Franco |

### Criterios de éxito

- Mensajes de WhatsApp persistidos correctamente en DB.
- Fast-path L4 escala en menos de 200ms sin pasar por AI.
- Staff gestiona conversaciones y escalaciones desde el dashboard del CRM.
- Paula edita el FAQ del bot sin tocar código.
- Booking crea turno directamente en el calendario del CRM.
- Recordatorios se envían 48h y 24h antes del turno.
- Clientes existentes en el CRM son reconocidos por número de teléfono.

---

## 6. v3 — Canales adicionales + stock

### Descripción

Se agregan canales nuevos (TikTok DMs) y el bot gana acceso al inventario del CRM para responder consultas de stock de farmacia y pet shop. También se activan los recordatorios automáticos de vacunas.

### Prerrequisitos

- v2 estable en producción — mínimo 2 semanas sin incidentes críticos.
- CRM con módulo de inventario construido (Fase v2 del roadmap del CRM).
- TikTok Business API configurada.

### Features incluidas

| Feature | Detalle | Dato del CRM que usa |
|---|---|---|
| TikTok DMs | Tercer canal — consultas de ubicación y servicios | — |
| Consulta de stock | Farmacia y pet shop desde el bot | Inventario del CRM (Fase v2 CRM) |
| Recordatorios de vacunas | Alertas automáticas por WhatsApp | `vaccinations.next_due_at` |
| Seguimiento post-consulta | Mensaje de seguimiento automático | `consultations.plan` + `appointments` |

### Features fuera de scope en v3

- Historial clínico completo accesible desde el bot
- Facturación vía bot
- Portal del cliente / app

### Criterios de éxito

- TikTok DMs responden correctamente preguntas de ubicación y servicios.
- Consulta de stock devuelve resultado correcto del inventario del CRM.
- Recordatorios de vacunas se envían 7 días antes del vencimiento de `next_due_at`.
- Sin regresiones en el flujo de WhatsApp v2.

---

## 7. Dependencias y blockers por versión

### v1

| # | Blocker | Responsable | Estado |
|---|---|---|---|
| B1 | Dependencias AI instaladas | Franco | ✅ `ai@4` · `@ai-sdk/anthropic@1` · `@ai-sdk/react@1` |
| B2 | Paula aprueba contenido del system prompt | Tomás + Paula | 🔲 Pendiente |
| B3 | Definir dónde se embebe el widget en la landing | Tomás | 🔲 Pendiente |
| B4 | Deploy a Vercel | Franco | 🔲 Pendiente |

### v2

| # | Blocker | Responsable | Estado |
|---|---|---|---|
| B5 | v1 live y aprobado | Franco | 🔲 Pendiente |
| B6 | Supabase del CRM reutilizado — credenciales disponibles | Franco | ✅ Desbloqueado |
| B7 | CRM Fase E completa (roles RBAC + UI) | Franco | 🔲 En progreso |
| B8 | CRM Fase G completa (catálogo de servicios) | Franco | 🔲 Pendiente |
| B9 | CRM API REST diseñada, implementada y documentada | Franco | 🔲 Pendiente — no existe aún |
| B10 | Migraciones `bot_*` ejecutadas en Supabase del CRM | Franco | 🔲 Pendiente |
| B11 | Paula confirma número de WhatsApp Business | Tomás + Paula | 🔲 Pendiente |
| B12 | Onboarding en Kapso iniciado — aprobación Meta puede tardar semanas | Tomás | 🔲 Pendiente |
| B13 | `KAPSO_WEBHOOK_SECRET` generado y configurado | Franco | 🔲 Pendiente |
| B14 | Seeding inicial de `bot_business_context` con datos reales de Paula | Tomás + Paula | 🔲 Pendiente |

### v3

| # | Blocker | Responsable | Estado |
|---|---|---|---|
| B15 | v2 estable — mínimo 2 semanas sin incidentes críticos | Franco | 🔲 Pendiente |
| B16 | CRM con módulo de inventario construido | Franco | 🔲 Pendiente — Fase v2 del CRM |
| B17 | TikTok Business API configurada y aprobada | Tomás | 🔲 Pendiente |

---

## 8. Criterios de paso entre versiones

### v1 → v2

- [ ] Widget deployado en Vercel y funcionando.
- [ ] Paula aprobó respuestas FAQ en español argentino.
- [ ] Bot responde en menos de 3s en el 95% de los casos.
- [ ] Sin errores críticos durante al menos 1 semana.
- [ ] CRM Fases E + G completas.
- [ ] CRM API REST expuesta y documentada (B9).
- [ ] Kapso configurado con webhook URL y secret (B12, B13).
- [ ] Migraciones `bot_*` ejecutadas en Supabase del CRM (B10).

### v2 → v3

- [ ] Mensajes de WhatsApp persistidos correctamente en DB.
- [ ] Fast-path L4 escala en menos de 200ms — verificado con keyword de prueba.
- [ ] Paula usa el dashboard del bot en el CRM sin incidentes críticos.
- [ ] Booking end-to-end funciona: creación, confirmación, cancelación.
- [ ] Turnos del bot aparecen en el calendario del CRM.
- [ ] Recordatorios de 48h y 24h funcionando en producción.
- [ ] Business context editor en uso por el equipo.
- [ ] Sin incidentes críticos durante 2 semanas con tráfico real.
- [ ] CRM con inventario construido (B16).

---

## 9. Relación chatbot ↔ CRM por versión

| Versión | Relación | Detalle |
|---|---|---|
| v1 | Ninguna | Bot stateless. System prompt con datos estáticos. CRM no sabe que el bot existe. |
| v2 | Integración vía API REST | Bot lee/escribe en CRM. Turnos del bot → `appointments` del CRM. Dashboard del bot vive dentro del CRM. |
| v3 | Integración extendida | v2 + stock de inventario + vacunas + TikTok DMs. |

### Tablas del CRM que el chatbot toca por versión

| Tabla CRM | v1 | v2 | v3 |
|---|---|---|---|
| `clients` | — | Lectura (match por `phone`) | Lectura |
| `patients` | — | Lectura (mascotas del cliente) | Lectura |
| `appointments` | — | Escritura (turnos del bot) | Escritura |
| `vaccinations` | — | — | Lectura (`next_due_at` para alertas) |
| `consultations` | — | — | Lectura (seguimiento post-consulta) |
| `staff` | — | Lectura (a quién escalar) | Lectura |
| Inventario (futuro) | — | — | Lectura (stock farmacia/pet shop) |

### Endpoints del CRM que el bot consume en v2

Estos endpoints son **nuevos** — no existen en el CRM hoy. Se construyen en paralelo:

| Endpoint | Método | Descripción |
|---|---|---|
| `/api/bot/clients` | GET | Buscar cliente por `phone` |
| `/api/bot/availability` | GET | Consultar slots disponibles por fecha y servicio |
| `/api/bot/appointments` | POST | Crear turno |
| `/api/bot/appointments/:id` | PATCH | Cancelar / confirmar turno |
| `/api/bot/services` | GET | Listar servicios activos con duración |

Todos los endpoints del bot requieren autenticación por API key en headers. No usan Supabase SSR — son llamadas server-to-server desde el proceso Express del bot.

---

## Apéndice — Stack de referencia

| Capa | Herramienta | Scope |
|---|---|---|
| Widget web (v1) | Next.js 16 App Router + TypeScript | `chatbot/` |
| Bot server (v2+) | TypeScript + Express | `chatbot/` — proceso separado |
| AI / LLM (intents) | Claude Haiku — `@anthropic-ai/sdk` | v2+ |
| AI / LLM (respuestas) | Claude Sonnet — `claude-sonnet-4-6` | Todas las versiones |
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
| Technical spec del CRM | `crm/docs/v1/technical-spec.md` |
| ADR-002 WhatsApp Kapso | `crm/docs/v1/architecture/ADR-002-whatsapp-kapso.md` |
| ADR-004 Base de datos | `crm/docs/v1/architecture/ADR-004-database-drizzle-supabase.md` |
| Contexto general del negocio | `CLAUDE.md` (raíz del monorepo) |