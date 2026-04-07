# NeoVet Chatbot v1 — Reverse Engineering Report

| Campo | Valor |
|---|---|
| **Generado** | 2026-04-05 |
| **Método** | Lectura completa de los 7 archivos fuente (303 líneas totales). Zero confianza en documentación previa. |
| **Alcance** | `chatbot/` completo — API route, componentes, prompt, config, assets |

> Este documento describe lo que el chatbot **realmente es** según el código, no lo que los planes dicen que debería ser.

---

## 1. Lo Que Es

Un widget de chat web con 303 líneas de código que envuelve Claude Sonnet con un system prompt fijo sobre la clínica NeoVet. Sin base de datos, sin autenticación, sin persistencia. Cualquiera con la URL puede usarlo.

**7 archivos fuente:**

```
src/
├── app/
│   ├── api/chat/route.ts        → POST endpoint, streamText con Claude
│   ├── globals.css               → Tailwind imports + variables CSS
│   ├── layout.tsx                → Metadata + font Geist
│   └── page.tsx                  → Shell del widget (header + logo)
├── components/
│   └── chat-widget.tsx           → UI del chat (mensajes, input, quick replies)
└── lib/
    └── prompts/
        └── system.ts             → System prompt con datos de la clínica
```

---

## 2. Arquitectura Real

### Request lifecycle

```
Usuario escribe mensaje
  → useChat() hook (AI SDK React)
    → POST /api/chat { messages }
      → getFeriadoHoy() → fetch argentinadatos.com API
      → Concatena system prompt + fecha + nota de feriado (si hay)
      → streamText({ model: claude-sonnet-4-6, maxTokens: 1024 })
      → toDataStreamResponse() → streaming SSE al browser
    → useChat() recibe chunks → actualiza UI progresivamente
```

### Componentes clave

| Archivo | Responsabilidad | Líneas |
|---------|----------------|--------|
| `api/chat/route.ts` | Endpoint único — arma prompt, llama a Claude, devuelve stream | 54 |
| `chat-widget.tsx` | Estado del chat, mensajes, input, quick replies, markdown render | 144 |
| `lib/prompts/system.ts` | System prompt con toda la info de la clínica hardcodeada | 59 |
| `page.tsx` | Shell visual — header con logo, online indicator | 26 |
| `layout.tsx` | Metadata HTML, font Geist, lang="es" | 25 |

---

## 3. Stack Real (verificado en package.json)

| Dependencia | Versión | Para qué |
|-------------|---------|----------|
| `next` | 16.2.1 | Framework |
| `react` / `react-dom` | 19.2.4 | UI |
| `ai` | ^4.3.19 | Vercel AI SDK — `streamText()` |
| `@ai-sdk/anthropic` | ^1.2.12 | Provider de Claude para AI SDK |
| `@ai-sdk/react` | ^1.2.12 | `useChat()` hook |
| `react-markdown` | ^10.1.0 | Render markdown en respuestas del bot |
| `tailwindcss` | ^4 | Estilos |

**Total: 7 runtime deps.** App mínima.

---

## 4. El System Prompt — Datos de la Clínica Hardcodeados

**Archivo:** `src/lib/prompts/system.ts`

Todo lo que el bot "sabe" está en este archivo. No hay base de datos, no hay API al CRM. Estos datos son estáticos:

### Datos de contacto
- **Nombre:** NeoVet Centro Veterinario
- **Veterinaria:** Paula Silveyra (Matrícula 2046)
- **Dirección:** Morrow 4064, Rosario, Santa Fe
- **Teléfono/WhatsApp:** +54 9 341 310-1194
- **Email:** veterinarianeo@gmail.com

### Horarios
- Lunes–Sábado: 9:30–12:30, 16:30–20:00
- Feriados: 10:00–13:00
- Domingos: 9:00–20:00 (guardia pasiva, llamar para confirmar)
- Urgencia obstétrica: 24/7

### Especialidades (3)
1. Ecografía de alta complejidad (clínica y a domicilio)
2. Razas braquicéfalas (cirugía y clínica)
3. Reproducción y neonatología

### Servicios (11)
Consultas, cirugía general, ecografía, cardiología, vacunación y desparasitación, radiografía, internación, certificados, alimento y pet shop, peluquería canina

### Reglas de comportamiento (8)
1. Siempre en español argentino, tono amigable
2. Usar "vos" en vez de "tú"
3. Solo responder sobre la clínica
4. Derivar precios y disponibilidad exacta a WhatsApp
5. Nunca inventar información
6. No dar diagnósticos ni consejos médicos
7. Ser breve y directo
8. No responder preguntas off-topic

### Modificaciones en runtime
- **Fecha actual** se agrega al prompt: `"Hoy es domingo, 5 de abril de 2026"`
- **Si es feriado** (consultado a `api.argentinadatos.com`): se agrega nota con horario reducido 10:00–13:00

---

## 5. Variables de Entorno

| Variable | Requerida | Default | Dónde se usa |
|----------|-----------|---------|-------------|
| `ANTHROPIC_API_KEY` | Sí | — | `api/chat/route.ts:6` — crea el cliente Anthropic |

**Una sola variable.** Si falta, el error aparece al recibir el primer mensaje (runtime, no build time).

Variables en `.env.example` para v2 (no usadas):
- `NEXT_PUBLIC_APP_URL` — URL de la app
- `KAPSO_API_KEY` — WhatsApp (v2)
- `KAPSO_WEBHOOK_SECRET` — webhook WhatsApp (v2)
- `WHATSAPP_PHONE_NUMBER_ID` — ID del número (v2)

---

## 6. UI del Chat — Comportamiento Exacto

### Estado inicial (sin mensajes)
- Emoji de patita (🐾)
- Texto: "¡Hola! Soy el asistente de NeoVet."
- Subtexto: "¿En qué te puedo ayudar?"
- 4 botones de quick reply:
  - "¿Cuáles son los horarios?"
  - "¿Cómo saco un turno?"
  - "¿Qué servicios ofrecen?"
  - "¿Dónde están ubicados?"

### Mensajes
- **Usuario:** burbuja derecha, fondo `zinc-900`, texto blanco
- **Asistente:** burbuja izquierda, fondo `zinc-100`, texto `zinc-800`, renderizado con react-markdown
- Markdown soportado: `<p>`, `<strong>`, `<ul>/<li>`, `<a>` (abre en nueva pestaña)
- Auto-scroll al último mensaje

### Indicador de carga
- 3 puntos rebotando con animación staggered (0ms, 150ms, 300ms)
- Se muestra cuando `status === "streaming" || status === "submitted"`

### Input
- Placeholder: "Escribí tu consulta..."
- Deshabilitado mientras el bot responde
- Botón de envío (SVG flecha) deshabilitado si input vacío o loading

---

## 7. Integración como iframe

El chatbot se embebe en la landing page como iframe:

```html
<iframe src="https://neo-vet-widget.vercel.app" />
```

**Funciona porque:**
- El iframe carga la página completa del chatbot (same-origin dentro del iframe)
- Las requests a `/api/chat` son same-origin desde el punto de vista del iframe
- No necesita CORS headers

**No hay CORS headers explícitos** en el API route. Si alguien intentara llamar al endpoint desde otro dominio con JavaScript (no iframe), fallaría.

---

## 8. Dependencia Externa — API de Feriados

**URL:** `https://api.argentinadatos.com/v1/feriados/{año}`

**Comportamiento:**
- Se llama en **cada request** (cada mensaje del usuario)
- No hay cache — fetch fresco cada vez
- Si la API falla o no responde, se ignora silenciosamente (`catch → return null`)
- Solo se usa para agregar una nota al prompt: "Hoy es feriado ({nombre}), horario reducido 10:00–13:00"

**Riesgo:** Si la API de argentinadatos.com se cae o cambia su formato, los feriados simplemente no se detectan. No afecta la funcionalidad core.

---

## 9. Lo Que NO Tiene

| Feature | Estado | Nota |
|---------|--------|------|
| Base de datos | No existe | Stateless — los mensajes desaparecen al cerrar |
| Autenticación | No existe | Cualquiera con la URL puede chatear |
| Rate limiting | No existe | Solo el timeout de Vercel (30s) |
| Persistencia de conversaciones | No existe | Ni localStorage — refresh = chat vacío |
| Tools / function calling | No existe | Solo text streaming |
| Urgency triage (L1–L4) | No existe | Es v2 |
| Booking de turnos | No existe | Dice "contactanos por WhatsApp" |
| Integración con CRM | No existe | Es v2 |
| Error handling visible | No existe | Si falla, el usuario no ve nada |
| Logs de conversación | No existe | No hay forma de ver qué pregunta la gente |
| Analytics | No existe | No hay tracking de uso |
| Validation en API route | No existe | Asume JSON válido |
| CORS headers | No existen | Funciona solo por iframe same-origin |
| vercel.json | No existe | Sin security headers, sin cron, sin rewrites |

---

## 10. Reglas de Negocio Implícitas

### En el código (no documentadas en ningún ADR)

1. **maxTokens: 1024** — el bot no puede responder más de ~750 palabras. Si alguien pide una lista larga de servicios con detalles, se corta.

2. **Feriados se consultan en cada mensaje** — no hay cache. En una conversación de 10 mensajes, se hacen 10 fetches a la API de feriados. Ineficiente pero funcional.

3. **El modelo es claude-sonnet-4-6** — no configurable por env var. Cambiar el modelo requiere editar código.

4. **No hay throttling** — un usuario puede enviar 100 mensajes por minuto. Cada uno genera una llamada a la API de Anthropic (con costo). No hay protección contra abuso.

5. **Quick replies no aparecen después del primer mensaje** — solo se muestran en el estado vacío. Una vez que hay mensajes, no hay forma de volver a verlos.

6. **El apellido en el prompt es "Silveyra"** — en el CRM y otros docs se usa "Silveira". Posible inconsistencia pendiente de confirmar con Paula.

---

## 11. Assets Estáticos

| Archivo | Usado | Tamaño | Nota |
|---------|-------|--------|------|
| `neovet-logo-transparent.png` | Sí | ~6.3 MB | **Muy pesado** para una imagen de 36x36px en la UI |
| `file.svg` | No | — | Template de Next.js, no referenciado |
| `globe.svg` | No | — | Template de Next.js, no referenciado |
| `next.svg` | No | — | Template de Next.js, no referenciado |
| `vercel.svg` | No | — | Template de Next.js, no referenciado |
| `window.svg` | No | — | Template de Next.js, no referenciado |

**5 archivos SVG no usados** — residuos del template de Next.js.

**El logo de 6.3 MB se sirve sin optimización** — `page.tsx` usa `<img>` nativo, no `<Image>` de Next.js. Se descarga completo en cada visita.

---

## 12. Superficies de Fragilidad

### Alto riesgo
- **Sin rate limiting + sin auth = abuso abierto.** Cualquiera puede scriptear POST requests a `/api/chat` y generar costos ilimitados en la API de Anthropic. Un loop de 1000 requests = ~$5–10 USD en API costs.
- **`ANTHROPIC_API_KEY` expuesta si se filtra** — no hay rotación ni key scoping. La key tiene acceso completo a la cuenta de Anthropic.
- **Sin `vercel.json` security headers** — a diferencia de la landing, el chatbot no tiene CSP, HSTS, ni X-Frame-Options.

### Medio riesgo
- **Logo de 6.3 MB** — en conexiones móviles argentinas, puede tardar 5–10 segundos en cargar. Peor en 3G.
- **Sin persistencia** — si el usuario cierra la pestaña o refreshea, pierde toda la conversación. En mobile esto pasa frecuentemente.
- **Holiday API sin cache** — 10 mensajes = 10 fetches. Si la API tiene rate limiting propio, podría empezar a fallar en conversaciones largas.
- **Sin error feedback** — si la API de Anthropic falla (rate limit, timeout, key inválida), el usuario ve el input disabled y los dots parpadeando indefinidamente.

### Bajo riesgo
- **SVGs no usados** — no afectan funcionalidad, solo agregan ~4KB al deployment.
- **Inconsistencia "Silveyra" vs "Silveira"** — afecta la credibilidad del bot si un cliente nota la diferencia.
- **Font Geist declarada pero overrideada** — `layout.tsx` carga Geist, pero `globals.css` setea `font-family: Arial, Helvetica, sans-serif`. Geist se descarga pero no se usa visualmente.

---

## 13. Comparación Plan vs Realidad

### Lo que el charter/CLAUDE.md dice vs lo que el código hace

| Doc dice | Código hace | Match? |
|----------|------------|--------|
| "Next.js 14" | Next.js 16.2.1 | No — actualizado pero docs no reflejaban (corregido hoy) |
| "AI SDK + Claude claude-sonnet-4-6" | `anthropic("claude-sonnet-4-6")` con AI SDK v4 | Sí |
| "Stateless, no DB" | Correcto — 0 tablas, 0 persistence | Sí |
| "Answers FAQs only" | Correcto — system prompt limita a info de la clínica | Sí |
| "No tools, no function calling" | Correcto — solo `streamText`, sin tools | Sí |
| "Web widget or embedded on landing" | Iframe en landing, standalone URL funciona también | Sí |
| "No WhatsApp / Kapso" | Correcto — env vars preparadas pero no usadas | Sí |
| "No user data stored" | Correcto — ni localStorage ni cookies propias | Sí |

**El chatbot es fiel al plan.** Las únicas discrepancias son la versión de Next.js y el apellido de Paula.

---

## Resumen

| Métrica | Valor |
|---------|-------|
| Líneas de código fuente | 303 |
| Archivos fuente | 7 |
| Endpoints | 1 (`POST /api/chat`) |
| Variables de entorno | 1 requerida (`ANTHROPIC_API_KEY`) |
| Dependencias runtime | 7 |
| Base de datos | Ninguna |
| Autenticación | Ninguna |
| Rate limiting | Ninguno |
| Security headers | Ninguno |
| Archivos no usados | 5 SVGs del template |
| Logo sin optimizar | 6.3 MB servido como `<img>` |
| Costo por mensaje (estimado) | ~$0.003–0.01 USD (Claude Sonnet, 1024 max tokens) |
| Riesgo principal | Abuso sin rate limiting → costos de API incontrolados |
