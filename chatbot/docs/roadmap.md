# NeoVet Chatbot — Roadmap

| Campo | Valor |
|---|---|
| **Proyecto** | NeoVet Chatbot |
| **Última actualización** | 2026-04-23 |
| **Roadmap del CRM** | `crm/docs/roadmap.md` — las versiones del chatbot están sincronizadas con las del CRM |

> [!info] Cambio de alcance 2026-04-22
> Tras la reunión con Paula del 2026-04-22, v1 fase WhatsApp stopgap se canceló (Paula ya tiene auto-respondedor en WhatsApp Business). Franco aceleró v2: shipeó MVP del bot WhatsApp-Kapso el mismo día (agente + sesión + 5 tools + webhook + L4 fast-path). Las fases A/B/C/D de v2 pasan de "planeadas" a "en progreso simultáneo" — ver marcas debajo.

Este documento describe el plan de largo plazo del chatbot en tres versiones. Cada versión se sincroniza con la versión equivalente del CRM.

---

## Criterio de versión

Mismo criterio que el CRM:

1. **¿Es bloqueante?** ¿El usuario puede obtener valor sin esto? Si sí → diferir.
2. **¿Es reversible?** ¿Se puede agregar después sin romper nada? Si sí → diferir.
3. **¿Está validado?** ¿Sabemos que los usuarios lo necesitan, o lo estamos asumiendo? Si asumimos → diferir.

---

## v1 — FAQ web widget ✅ Completada

> **Exit criteria:** Los clientes obtienen respuestas instantáneas a preguntas frecuentes sin llamar a la clínica.

**Deployed** en `neo-vet-widget.vercel.app`. Embebido como iframe en la landing page. Pendiente: aprobación de contenido FAQ por Paula.

| Componente | Estado | Notas |
|---|---|---|
| Web chat widget (standalone + iframe en landing) | ✅ | Bottom-right toggle en landing |
| System prompt con datos de la clínica | ✅ | Hardcodeado en `lib/prompts/system.ts` |
| Streaming de respuestas vía Claude Sonnet | ✅ | `streamText()` + AI SDK + `maxTokens: 1024` |
| Detección de feriados argentinos | ✅ | API argentinadatos.com, cacheado por día |
| Quick replies (horarios, turnos, servicios, ubicación) | ✅ | 4 botones en estado vacío |
| Markdown rendering en respuestas | ✅ | `react-markdown` — `<p>`, `<strong>`, `<ul>`, `<a>` |
| Rate limiting (20 req/min por IP) | ✅ | In-memory, protege contra abuso |
| Validación de requests | ✅ | JSON parse + array check, devuelve 400/429 |
| Security headers (CSP, HSTS, etc.) | ✅ | `vercel.json` — permite iframe desde `*.vercel.app` |
| Optimización de logo (Next.js `<Image>`) | ✅ | 6.3 MB → optimizado automáticamente |
| Error feedback al usuario | ✅ | Banner rojo en rate limit o fallo de API |
| Respuestas en español argentino (voseo) | ✅ | Regla en system prompt |

**Fuera de alcance en v1:**
- Sin base de datos — stateless
- Sin WhatsApp — solo web
- Sin integración con CRM — independiente
- Sin booking de turnos — deriva a WhatsApp
- Sin urgency triage (L1–L4) — es v2
- Sin persistencia de conversaciones — refresh = chat vacío

**Stack v1:** Next.js 16, Vercel AI SDK, Claude Sonnet, Tailwind CSS 4, Vercel hosting.

---

## v2 — WhatsApp + Turnos + Triage — 🟡 En desarrollo activo

> **Exit criteria:** Los clientes sacan y cancelan turnos por WhatsApp sin llamar a la clínica. Las emergencias se detectan y escalan en sub-segundo.
> **Estado (2026-04-23):** MVP shipeado 2026-04-22 (commits `bd12b70` → `f2ddbe3`). Webhook Kapso activo, end-to-end verification contra el número de producción de Paula **pendiente**. Franco prototipa contra su propio celular.

### Decisiones de diseño (resueltas)

| Decisión | Resolución |
|---|---|
| Base de datos | Supabase compartida con el CRM — tablas `bot_*`. Bot escribe vía `@supabase/supabase-js` con service-role (bypassa RLS). |
| System prompt | Hardcodeado en `src/lib/prompts/whatsapp-system.ts` (MVP). Migración a `bot_business_context` vía CRM API queda como Fase A.1 |
| WhatsApp provider | ✅ **Kapso** — seleccionado y en producción (commit `bd12b70`, 2026-04-22). Endpoint: `POST api.kapso.ai/meta/whatsapp/v24.0/{phone_number_id}/messages`, header `X-API-Key` |
| Web widget en v2 | Upgrades menores: prompt dinámico + localStorage. Sin booking. No empezado. |
| WhatsApp en v2 | Transaccional completo: booking, cancelación, triage |
| Admin UI | Dentro del CRM en `/dashboard/bot` — no app separada. No empezado. |
| Conversaciones | **MVP actual:** timeout 60min inactividad (`SESSION_TIMEOUT_MINUTES` en `session.ts`). Planeado: 4h + grace period 24h. |
| Resolución de contacto | Bot crea `bot_contact` con teléfono. Match a `client` existente se hace por teléfono vía `buscarCliente` tool → si no hay match, bot pide datos y usa `crearClienteYPaciente` (POST a `/api/bot/clients` del CRM). El campo `clients.source = "whatsapp"` marca el origen. |
| Contactos no vinculados | **MVP actual:** el bot crea cliente+paciente de una si el usuario quiere turno. Staff-linking manual queda para Fase A. |
| Escalación L4 (v2) | Muestra info de emergencia + "llamá YA" + deja de responder. Implementado en `agent.ts` + webhook L4 fast-path. |

### Fases

---

#### Fase A — Fundación — 🟡 Parcial

| Entregable | Estado | Notas |
|---|---|---|
| Chatbot conecta a Supabase del CRM | ✅ | `src/lib/whatsapp/session.ts` usa `@supabase/supabase-js` con service-role. Instalado en commit `f38a8c9`. |
| Persistencia de conversaciones | ✅ | `saveMessage()` escribe cada turno a `bot_messages`. Historial se carga con `getOrCreateSession()`. |
| Resolución de contacto por teléfono | 🟡 | `buscarCliente` tool hace match por teléfono via CRM. No hay `client_id` link en `bot_contacts` todavía. |
| System prompt dinámico | 🔲 | MVP usa `WHATSAPP_SYSTEM_PROMPT` hardcoded. Migrar a `bot_business_context` queda pendiente. |
| Web widget: localStorage persistence | 🔲 | No empezado |
| Web widget: prompt dinámico | 🔲 | No empezado |
| CRM: `/dashboard/bot` — lista de conversaciones | 🔲 | No empezado |
| CRM: vinculación manual de contacto → cliente | 🔲 | No empezado |
| **Evaluación de provider WhatsApp** | ✅ | **Kapso** elegido y en producción desde 2026-04-22 |

---

#### Fase B — Canal WhatsApp — 🟡 MVP shipeado

**Estado (2026-04-23):** MVP funcional vía Kapso. End-to-end contra Paula pendiente.

| Entregable | Estado | Notas |
|---|---|---|
| Integración con WhatsApp Business API | ✅ | Vía Kapso (`api.kapso.ai`). Header `X-API-Key`. 7 fix-commits el 2026-04-22 iterando sobre shape de payload y auth. |
| Webhook receiver para mensajes entrantes | ✅ | `src/app/api/whatsapp/webhook/route.ts`. GET = health check para verificación de Kapso. POST = mensajes. |
| Routing unificado web + WhatsApp | 🟡 | MVP: chat widget y WhatsApp usan endpoints y prompts separados. No hay todavía un "cerebro" único. |
| Envío de respuestas por WhatsApp | ✅ | `sendWhatsappReply()` en webhook llama a Kapso `POST /meta/whatsapp/v24.0/{phone_number_id}/messages`. |
| Lifecycle de conversación | 🟡 | MVP: timeout 60min. Planeado: 4h + grace period 24h. Staff close manual aún no implementado. |

---

#### Fase C — Herramientas transaccionales — 🟡 Parcial

**Estado (2026-04-23):** 5 de las 5 tools originales shipeadas (renombradas). Booking flow completo (buscar/crear cliente + disponibilidad + reservar). Cancelación y consulta de turnos existentes: no.

| Entregable | Estado | Notas |
|---|---|---|
| Tool `buscarCliente` | ✅ | `GET /api/bot/clients?phone=` — reemplaza `get_client_appointments` |
| Tool `crearClienteYPaciente` | ✅ | `POST /api/bot/clients` — nuevo endpoint 2026-04-22. Crea cliente con `source=whatsapp` + primera mascota |
| Tool `obtenerServicios` | ✅ | `GET /api/bot/services` |
| Tool `verificarDisponibilidad` | ✅ | `GET /api/bot/availability` — reemplaza `check_availability` |
| Tool `reservarTurno` | ✅ | `POST /api/bot/appointments` — reemplaza `book_appointment` |
| Tool `cancelarTurno` | 🔲 | No implementado todavía |
| Guard para contactos no vinculados | 🔲 | MVP actual crea cliente de una si el usuario da datos. No hay guard para "no encontramos tu ficha" |
| CRM: recordatorios por WhatsApp | 🔲 | No empezado — sigue siendo email-only vía Resend |
| Web widget: sin tools | ✅ | Sigue siendo FAQ-only |

---

#### Fase D — Urgency triage (L1–L4) — 🟡 L4 fast-path shipeado

| Entregable | Estado | Notas |
|---|---|---|
| L4 keyword fast-path | ✅ | 15 keywords hardcoded en `src/lib/whatsapp/agent.ts` (`L4_KEYWORDS`). Corre **antes** del AI. Mirror en `src/lib/prompts/whatsapp-system.ts`. |
| L1–L3 clasificación por AI | 🔲 | No implementado. El AI no asigna urgency_level; solo L4 vía keyword bump directo a 4. |
| Urgency solo sube, nunca baja automáticamente | ✅ | `escalateConversation()` solo hace update a `status=escalated, urgency_level=4`. No hay downgrade automático. |
| L4 → info de emergencia + stop | 🟡 | Responde con `L4_RESPONSE` ("Llamá ahora mismo al …"). Pero el bot NO deja de responder en mensajes subsiguientes — la conversación queda `escalated` pero el webhook sigue procesando. A revisar. |
| Escalation records | 🔲 | No hay tabla `bot_escalations`. El status `escalated` en `bot_conversations` es el único rastro. |
| CRM: cola de escalaciones en `/dashboard/bot` | 🔲 | No empezado |

**Keywords L4 actuales (15):** convulsión/convulsion, no respira, atropellado, envenenado, sangrado, no reacciona, desmayado, golpe fuerte, obstrucción/obstruccion, emergencia, urgente, se está muriendo / se esta muriendo, ahogando, sin pulso.

**Pendiente de merge (dictadas por Paula 2026-04-22):** respira mal, respira agitado, mucosas azules, no puede hacer pis, no puede hacer caca, trauma, hemorragia activa, gato obstruido. Ver [[wiki/gaps/l4-keyword-expansion-pending]] en el vault.

---

### Checklist de verificación v2

- [ ] Conversaciones persisten en DB y se recargan al reconectar
- [ ] System prompt se actualiza desde CRM sin redeploy
- [ ] Web widget sobrevive refresh (localStorage)
- [ ] WhatsApp: mensaje entrante → respuesta del bot en <3 segundos
- [ ] Contacto auto-vinculado cuando el teléfono coincide con un cliente
- [ ] Contacto no vinculado recibe FAQ pero no puede hacer booking
- [ ] Staff vincula contacto → cliente desde dashboard
- [ ] `check_availability` devuelve slots correctos
- [ ] `book_appointment` crea turno en CRM + envía confirmación por WhatsApp
- [ ] `cancel_appointment` cancela turno + envía notificación
- [ ] L4 keyword detectado → info de emergencia en <100ms
- [ ] Urgency level nunca baja automáticamente
- [ ] Escalaciones visibles en dashboard con cola de resolución
- [ ] Conversación se cierra después de 4h de inactividad
- [ ] Conversación se reabre si el cliente escribe dentro de 24h

---

## v3 — Inteligencia + Analytics

> **Exit criteria:** El equipo toma decisiones basadas en datos del chatbot. Las emergencias notifican al staff proactivamente.
> **Empieza:** Solo después de que v2 esté estable. Requiere datos de uso reales de v2.
> **Depende de:** CRM v3

| Feature | Área |
|---|---|
| Analytics de conversaciones — preguntas frecuentes, tasa de resolución, tiempo de respuesta | Analytics |
| Logs completos de conversaciones con búsqueda y filtros | Analytics |
| Dashboard de métricas del bot (volumen, escalaciones, satisfacción) | Analytics |
| L4 notificación automática al staff | Urgency — bot envía WhatsApp al número del staff de guardia |
| Triage con imágenes — cliente envía foto, AI analiza y clasifica (L3) | IA Clínica |
| Resúmenes automáticos de conversación para el vet | IA Clínica |
| Multi-idioma (portugués para clientes brasileños en zona fronteriza) | Comunicación |
| Campañas proactivas por WhatsApp (vacunas vencidas, peluquería, cumpleaños) | Comunicación |
| Encuestas de satisfacción post-consulta vía WhatsApp | Comunicación |
| Sugerencias de respuesta para staff en escalaciones | IA Operaciones |

---

## Permanentemente fuera de alcance

- Integración con Geovet — no existe API.
- Diagnósticos médicos por el bot — siempre deriva al veterinario.
- Recetas o prescripciones vía chatbot — requiere firma del profesional.
- Pagos o facturación vía chatbot — se hace desde el CRM.
- Acceso a historia clínica del paciente vía chatbot — por privacidad, solo visible desde el CRM.
