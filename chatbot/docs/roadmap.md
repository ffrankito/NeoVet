# NeoVet Chatbot — Roadmap

| Campo | Valor |
|---|---|
| **Proyecto** | NeoVet Chatbot |
| **Última actualización** | 2026-04-05 |
| **Roadmap del CRM** | `crm/docs/roadmap.md` — las versiones del chatbot están sincronizadas con las del CRM |

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

## v2 — WhatsApp + Turnos + Triage

> **Exit criteria:** Los clientes sacan y cancelan turnos por WhatsApp sin llamar a la clínica. Las emergencias se detectan y escalan en sub-segundo.
> **Empieza:** Solo después de que CRM v1 esté estable y desplegado en producción.
> **Depende de:** CRM v2 (API pública + WhatsApp reminders)

### Decisiones de diseño (resueltas)

| Decisión | Resolución |
|---|---|
| Base de datos | Supabase compartida con el CRM — tablas `bot_*` ya existen en producción |
| System prompt | Dinámico desde `bot_business_context` vía CRM API, cacheado en cold start |
| WhatsApp provider | **TBD** — evaluar Kapso, Twilio y Meta Cloud API antes de Fase B |
| Web widget en v2 | Upgrades menores: prompt dinámico + localStorage. Sin booking. |
| WhatsApp en v2 | Transaccional completo: booking, cancelación, triage |
| Admin UI | Dentro del CRM en `/dashboard/bot` — no app separada |
| Conversaciones | Timeout 4h inactividad, staff puede cerrar, grace period 24h para reabrir, contexto de 20 mensajes a Claude |
| Resolución de contacto | Auto-match por teléfono → si no hay match, bot pide nombre y staff vincula manualmente |
| Contactos no vinculados | Pueden recibir FAQ pero no pueden hacer booking ("no encontramos tu ficha") |
| Escalación L4 (v2) | Muestra info de emergencia + "llamá YA" + deja de responder |

### Fases

---

#### Fase A — Fundación

| Entregable | Notas |
|---|---|
| Chatbot conecta a Supabase del CRM | Usa las tablas `bot_contacts`, `bot_conversations`, `bot_messages` existentes |
| Persistencia de conversaciones | Cada mensaje se guarda en `bot_messages`. Historial se carga al reconectar. |
| Resolución de contacto por teléfono | Auto-match contra `clients.phone`. Si no hay match → `bot_contacts` sin `client_id`. |
| System prompt dinámico | Fetch a `/api/bot/context` en cold start, cache en memoria. Paula actualiza desde CRM admin. |
| Web widget: localStorage persistence | Mensajes sobreviven refresh. ID de conversación en localStorage. |
| Web widget: prompt dinámico | Misma fuente que WhatsApp — `bot_business_context` en vez de hardcoded |
| CRM: `/dashboard/bot` — lista de conversaciones | Admin ve threads, estado, urgency level, contacto vinculado/no vinculado |
| CRM: vinculación manual de contacto → cliente | Admin puede vincular un `bot_contact` a un `client` existente o crear cliente nuevo |
| **Evaluación de provider WhatsApp** | Comparar Kapso vs Twilio vs Meta Cloud API. Decidir antes de empezar Fase B. |

---

#### Fase B — Canal WhatsApp

**Requiere:** Fase A completa + provider WhatsApp seleccionado.

| Entregable | Notas |
|---|---|
| Integración con WhatsApp Business API | SDK del provider elegido |
| Webhook receiver para mensajes entrantes | Endpoint en chatbot que recibe mensajes de WhatsApp, crea/continúa conversación |
| Routing unificado web + WhatsApp | Mismo "cerebro" (Claude + tools), diferente canal. `bot_conversations.channel` = `web` o `whatsapp`. |
| Envío de respuestas por WhatsApp | Bot responde al número del cliente vía API del provider |
| Lifecycle de conversación | Timeout 4h inactividad → cierre automático. Reapertura si mensaje dentro de 24h. Staff puede cerrar manualmente. |

---

#### Fase C — Herramientas transaccionales

**Requiere:** Fase A + Fase B completas.

| Entregable | Notas |
|---|---|
| AI function calling: `check_availability` | `GET /api/bot/availability` — "¿Tenés turno el jueves?" → slots libres |
| AI function calling: `book_appointment` | `POST /api/bot/appointments` — "Quiero turno el jueves a las 10" → crea turno |
| AI function calling: `cancel_appointment` | `DELETE /api/bot/appointments/[id]` — "Quiero cancelar mi turno" → cancela |
| AI function calling: `get_services` | `GET /api/bot/services` — "¿Qué servicios ofrecen?" → lista live |
| AI function calling: `get_client_appointments` | `GET /api/bot/clients?phone={phone}` — "¿Cuándo es mi próximo turno?" |
| Guard para contactos no vinculados | Si `bot_contact.client_id` es null → "no encontramos tu ficha, un miembro del equipo te va a contactar" |
| CRM: recordatorios por WhatsApp | Confirmación, 24h/1h antes, vacunas, peluquería, seguimiento post-consulta — vía provider de WhatsApp |
| Web widget: sin tools | El widget web sigue siendo FAQ-only. Solo WhatsApp tiene herramientas transaccionales. |

---

#### Fase D — Urgency triage (L1–L4)

**Requiere:** Fase A + Fase B completas. Independiente de Fase C (se puede hacer en paralelo).

| Entregable | Notas |
|---|---|
| L4 keyword fast-path | Lista hardcodeada de 12 keywords en español argentino. Se ejecuta **antes** del AI. Sub-milisegundo. |
| L1–L3 clasificación por AI | Claude evalúa el nivel de urgencia en cada mensaje. `bot_conversations.urgency_level` se actualiza. |
| Urgency solo sube, nunca baja automáticamente | Solo un staff member puede bajar el nivel desde el dashboard. |
| L4 → info de emergencia + stop | Bot muestra teléfono de emergencia + "llamá YA" + deja de responder. No notifica al staff en v2. |
| Escalation records | Se crea registro en `bot_escalations` con reason + urgency_level. |
| CRM: cola de escalaciones en `/dashboard/bot` | Admin ve escalaciones pendientes, puede resolver con notas. |

**Keywords L4 (español argentino):** convulsión, no respira, atropellado, envenenado, sangrado, no reacciona, desmayado, golpe fuerte, obstrucción, emergencia, urgente, se está muriendo.

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
