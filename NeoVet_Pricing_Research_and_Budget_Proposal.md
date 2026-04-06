# NeoVet — Investigación Comparativa de Mercado y Propuesta de Precio

*Abril 2026 · Preparado por Tomás Pinolini*

Este documento presenta un análisis comparativo del mercado de software veterinario — argentino y global — seguido de una estrategia de pricing y una propuesta de presupuesto lista para presentar a clínicas veterinarias en Argentina.

> **Nota de honestidad sobre el estado del producto:** Este documento distingue entre lo que NeoVet tiene *hoy* (v1 construida y casi lista), lo que estará disponible próximamente (v2 en roadmap) y lo que es largo plazo (v3). Las propuestas comerciales deben reflejar esta distinción.

---

## Tabla de Contenidos

1. [Estado actual del producto](#1-estado-actual-del-producto)
2. [Contexto del mercado argentino](#2-contexto-del-mercado-argentino)
3. [Benchmarking — Mercado local](#3-benchmarking--mercado-local)
4. [Benchmarking — Mercado global (referencia)](#4-benchmarking--mercado-global-referencia)
5. [Herramientas de chatbot y WhatsApp](#5-herramientas-de-chatbot-y-whatsapp)
6. [Análisis de posicionamiento](#6-análisis-de-posicionamiento)
7. [Estrategia de pricing recomendada](#7-estrategia-de-pricing-recomendada)
8. [Propuesta de presupuesto (template para clientes)](#8-propuesta-de-presupuesto-template-para-clientes)

---

## 1. Estado actual del producto

Antes de hablar de pricing, es crítico tener claridad sobre qué existe hoy y qué es roadmap.

### 1.1 CRM — Estado v1

El CRM es la pieza más completa. Se construyó en 12 fases (A–L), casi todas completadas.

| Fase | Contenido | Estado |
|------|-----------|--------|
| A | Auth (Supabase), CRUD clientes / pacientes / turnos, dashboard base | ✅ Completa |
| B | Validaciones, skeletons, importación GVet (1.771 clientes, 1.380 pacientes) | ✅ Completa |
| C | Historia clínica SOAP, tratamientos, vacunas, desparasitaciones, documentos, UI en tabs | ✅ Completa |
| D | Facturación electrónica ARCA (Factura A/B/C), registro de pagos, control de límites | 🔲 Pendiente — bloqueada por credenciales ARCA de Paula |
| E | Roles (admin/vet/peluquero), gestión de staff, módulo de peluquería (perfil + sesiones + fotos) | ✅ Completa |
| F | Tipo de consulta (clínica/virtual/domicilio), dosis en tratamientos, métodos complementarios, categorías en documentos | ✅ Completa |
| G | Catálogo de servicios con duración y bloqueo por cirugía | ✅ Completa |
| H | Calendario semanal/diario, bloqueo por cirugía, suspensión de agenda con cancelación automática | ✅ Completa |
| I | Recordatorios email: turno 48h/24h, vacunas 7 días, seguimiento post-consulta (Resend + Vercel Cron) | ✅ Completa |
| J | UI mobile responsive (iPhone SE 375px hasta desktop) | ✅ Completa |
| K | Pet shop: catálogo, proveedores, stock, ventas multi-ítem; importación de ~413 productos | ✅ Completa |
| K.B | Caja: apertura/cierre, movimientos, métodos de pago, histórico importado | ✅ Completa |
| L | Day-one readiness: dashboard por rol, estado no-show, motivo de cancelación, turnos próximos en ficha del cliente, peluquería integrada en caja, confirmación/cancelación por email, resumen de paciente en turno, atajo de seguimiento, widget de caja | ✅ Completa (2026-04-05) |
| Pre-Launch | Deploy a Vercel producción, cuentas de staff, verificación Resend, crons | 🔲 Pendiente |

**Resumen CRM:** El 95% del v1 está construido y funcional. El único bloque abierto es la integración ARCA (Phase D), que depende de que Paula gestione sus credenciales con el contador. El sistema puede operar perfectamente sin Fase D — simplemente sin factura electrónica.

**Stack verificado en código:** Next.js 16.1.6, React 19, TypeScript, Tailwind CSS, shadcn/ui, Drizzle ORM, Supabase (PostgreSQL + Auth + Storage), Resend, Vercel Cron.

---

### 1.2 Chatbot — Estado v1

El chatbot web está **live y deployado** en `neo-vet-widget.vercel.app`. Se embebe como iframe en la landing page. El roadmap de v1 está completo — 12 componentes, todos verificados.

**Lo que tiene hoy (v1 completa):**

| Feature | Estado |
|---------|--------|
| Chat web con Claude Sonnet 4-6 vía Vercel AI SDK + streaming | ✅ |
| System prompt con datos de la clínica (horarios, servicios, contacto, especialidades) | ✅ |
| Quick replies iniciales (4 preguntas frecuentes) | ✅ |
| Detección de feriados argentinos — ajusta horarios automáticamente | ✅ |
| Markdown rendering en respuestas | ✅ |
| Rate limiting (20 req/min por IP) — protege contra abuso de API | ✅ |
| Validación de requests (400 / 429 con feedback al usuario) | ✅ |
| Security headers en `vercel.json` (CSP, HSTS, X-Frame-Options) | ✅ |
| Logo optimizado vía Next.js `<Image>` | ✅ |
| Error feedback visible al usuario (banner rojo en fallo o rate limit) | ✅ |
| Respuestas en español argentino (voseo) | ✅ |
| Embebido como iframe en landing | ✅ |

**Fuera de alcance en v1 — es v2:**

| Feature | Versión |
|---------|---------|
| Persistencia de conversaciones (DB) | v2 Fase A |
| System prompt dinámico desde el CRM | v2 Fase A |
| Canal WhatsApp | v2 Fase B |
| Booking, cancelación y consulta de turnos (function calling) | v2 Fase C — solo por WhatsApp |
| Recordatorios automáticos por WhatsApp | v2 Fase C |
| Triage L1–L4 (keyword fast-path + clasificación AI) | v2 Fase D |
| Analytics de conversaciones | v3 |

**Nota de diseño importante para la propuesta comercial:** el widget web **no tendrá herramientas transaccionales ni en v2**. El booking y la cancelación de turnos funcionan exclusivamente por WhatsApp. El widget web sigue siendo FAQ en v1 y v2; en v2 solo gana persistencia y system prompt dinámico. Esta distinción es relevante para no sobre-prometer en la venta.

---

### 1.3 Landing — Roadmap completo

La landing está **deployada y funcional**, con redesign completo el 2026-04-04. Evoluciona en tres versiones alineadas con el CRM y el chatbot.

**Stack:** Astro 6, TypeScript, Tailwind CSS 4 — modo estático. Páginas adicionales en v2 (rutas Astro) sin backend necesario.

#### Landing v1 — "Encontranos y contactanos"

| Componente | Estado |
|-----------|--------|
| Hero con imagen real, full-bleed + overlay | ✅ |
| 4 USP Cards (Especialistas, Ecografía, Guardia 24hs, Atención personalizada) | ✅ |
| Sección servicios con especialidades destacadas (iconos SVG) | ✅ |
| Sección About con fotos reales de Paula | ✅ |
| Testimonios / reseñas | ✅ Estructura — contenido real de Paula pendiente |
| Horarios y ubicación | ✅ |
| Formulario de contacto | ✅ Estructura — backend pendiente (WhatsApp deep link o Resend) |
| Chatbot embebido como iframe | ✅ |
| SEO: meta tags, OG images, favicons, PWA manifest | ✅ Placeholders — regenerar con logo real |
| Mobile responsive + animaciones scroll | ✅ |
| Logo optimizado (18 KB vs 6.2 MB original) | ✅ |
| **Banner de emergencia** — sticky "Urgencia obstétrica 24hs — llamá al +54 9 341 310-1194" | 🔲 Pendiente |
| **Google Reviews widget en vivo** — reemplaza placeholder por reviews reales | 🔲 Pendiente (URL de Google Business pendiente) |
| **Cards de servicios expandidas** — párrafo descriptivo + diferenciador por servicio | 🔲 Pendiente (SEO + conversión) |

#### Landing v2 — "Sacá turno sin llamar"

Cuando el chatbot pueda gestionar turnos por WhatsApp, la landing pasa de ser una tarjeta de presentación a un **funnel de autogestión**.

| Feature | Depende de |
|---------|-----------|
| CTA "Sacá tu turno por WhatsApp" — reemplaza el genérico "Contactanos" | Chatbot v2 Fase C |
| Preview de disponibilidad — "Próximos turnos: Jueves 10, Viernes 14..." | CRM v2 API (`/api/bot/availability`) |
| QR code de WhatsApp — scaneable, sin tipear el número | Nada — asset estático |
| Páginas de servicio dedicadas (`/ecografia`, `/braquicefalos`, `/peluqueria`) — info detallada + CTA de booking, enorme para SEO | Astro static pages — sin backend |
| Blog veterinario — "5 señales de que tu bulldog necesita cirugía", "Cuándo vacunar tu cachorro" — posiciona a Paula como referente, genera tráfico orgánico | Contenido de Paula |
| Testimonios con foto — dueños con sus bulldogs, mucho más fuerte que reseñas de texto | Contenido de Paula |

#### Landing v3 — "Tu clínica, online"

Cuando el sistema tenga portal del tutor, IA y pagos, la landing evoluciona de sitio de marketing a **gateway del cliente**.

| Feature | Depende de |
|---------|-----------|
| Link al portal del tutor — "Ingresá a tu cuenta", historial de vacunas, próximos turnos | CRM v3 (portal del tutor) |
| Pago online — "Pagá tu consulta" vía MercadoPago QR o link | CRM v3 (pagos online) |
| Captura de leads para recordatorio de vacunas — "Dejá tu WhatsApp y te avisamos" | Chatbot v2 WhatsApp + CRM v2 |
| Blog con sugerencias de contenido por IA — basado en preguntas frecuentes del chatbot | Chatbot v3 analytics |
| Indicador de estado en tiempo real — "Estamos abiertos / Cerrados" basado en settings del CRM | CRM v3 + bot_business_context |
| Toggle multi-idioma (portugués para clientes en zonas fronterizas) | Chatbot v3 multi-language |

---

### 1.4 Resumen ejecutivo del estado del producto

| App | Estado real | Listo para vender |
|-----|------------|-------------------|
| CRM | 95% completo — falta ARCA y pre-launch | ✅ Sí (sin facturación electrónica) |
| Chatbot web v1 | Live, completo — FAQ + rate limiting + security headers | ✅ Sí |
| Landing page | Live, redesign completo | ✅ Sí — pendientes menores |
| WhatsApp (chatbot) | No iniciado — provider TBD (Kapso / Twilio / Meta Cloud API) | ❌ Es v2 |
| Triage L1–L4 | No iniciado — diseño resuelto, build pendiente | ❌ Es v2 |
| Booking de turnos vía chat | No iniciado — exclusivo de WhatsApp en v2 | ❌ Es v2 |
| API CRM pública | No iniciada | ❌ Es v2 |
| /dashboard/bot en CRM | No iniciado — gestión de conversaciones y escalaciones | ❌ Es v2 |

---

## 2. Contexto del mercado argentino

### El cliente objetivo

Una clínica veterinaria pequeña en Argentina tiene, en promedio:

- 1 a 3 veterinarios
- 1 a 2 recepcionistas
- Presupuesto de software estimado: **$50–$200 USD/mes**
- Canal de comunicación principal con clientes: **WhatsApp**
- Facturación: requiere integración **ARCA/AFIP** para facturas electrónicas
- Software actual: en muchos casos GVet, planillas de Excel, o nada sistematizado

### Consideraciones de pricing para Argentina

| Factor | Implicancia para NeoVet |
|--------|------------------------|
| Inflación persistente | Cotizar en **USD** para proteger el valor del servicio |
| Informalidad frecuente | Ofrecer medios de pago flexibles: transferencia bancaria, MercadoPago |
| Sensibilidad al precio | El precio necesita justificarse con valor concreto, no solo funcionalidades |
| Desconfianza al "contactar para precio" | Transparencia en planes y precios genera más confianza |
| Preferencia por soporte local | Ventaja competitiva fuerte sobre herramientas globales sin soporte en español |

---

## 3. Benchmarking — Mercado local

### 3.1 GVet (gvetsoft.com) — El referente del mercado argentino

GVet es el software veterinario más adoptado en Argentina.

| Atributo | Detalle |
|----------|---------|
| **Precio** | No publicado — contacto directo requerido |
| **Prueba gratuita** | 3 meses versión GOLD con registro |
| **Modelo de cobro** | Por sucursal / clínica |
| **Incluye** | Clientes, pacientes, historia clínica, turnos, facturación AFIP, control de stock, app móvil para staff y clientes |
| **No incluye** | API, chatbot, WhatsApp bidireccional, integración con otros sistemas |
| **Debilidades clave** | Sin API ni webhooks → cero automatización externa posible |

---

### 3.2 MyVete (myvete.com)

| Atributo | Detalle |
|----------|---------|
| **Precio** | ~$3.990 ARS/mes (precio histórico, hoy erosionado por inflación) |
| **Prueba gratuita** | 30 días, sin tarjeta de crédito |
| **Incluye** | Historia clínica, turnos, facturación, acceso para clientes |
| **Debilidades** | Sin chatbot, sin WhatsApp bidireccional, precio ARS desactualizado |

---

### 3.3 Volki (volki.vet)

| Atributo | Detalle |
|----------|---------|
| **Precio** | En pesos argentinos; no publicado |
| **Planes** | Starter y Full |
| **Target** | Clínicas pequeñas y veterinarios ambulantes |
| **Debilidades** | Sin chatbot, sin WhatsApp bidireccional, sin API pública |

---

### 3.4 Iveter (iveter.com)

| Atributo | Detalle |
|----------|---------|
| **Precio** | Cotización personalizada |
| **Prueba gratuita** | 3 meses sin compromiso, con migración de datos incluida |
| **Incluye** | Protocolos clínicos, turnos, app clientes, recordatorios WhatsApp saliente |
| **Debilidades** | Sin chatbot con IA; WhatsApp solo unidireccional (recordatorios) |

---

### 3.5 Wakyma Vets (wakyma.com)

| Atributo | Detalle |
|----------|---------|
| **Precio** | **€49/mes** (~$53 USD) — todo incluido |
| **Transparencia** | Precio público, sin planes ocultos |
| **Incluye** | Gestión clínica, comunicación, facturación, inventario, análisis |
| **Debilidades** | Europeo — sin soporte ARCA/AFIP, sin integración WhatsApp Argentina |

Wakyma es el benchmark de precio más claro: €49/mes por una suite completa.

---

### 3.6 Ponkis (ponkis.com)

| Atributo | Detalle |
|----------|---------|
| **Precio** | No publicado |
| **Incluye** | Historia clínica personalizable, almacenamiento ilimitado, **integración WhatsApp**, recetas electrónicas, módulo de peluquería y hospedaje |
| **Posicionamiento** | All-in-one más completo del mercado local |
| **Debilidades** | Sin chatbot con IA confirmado; proceso de ventas manual |

Ponkis es el competidor local más cercano a NeoVet en features. No publica precios, lo que sugiere un proceso de venta consultivo.

---

### 3.7 Tabla resumen — Mercado argentino

| Software | Precio/mes | ARCA | WhatsApp | Chatbot IA | API | Soporte local |
|----------|-----------|------|----------|-----------|-----|--------------|
| GVet | Opaco | ✅ | ⚠️ Saliente | ❌ | ❌ | ✅ |
| MyVete | ARS (erosionado) | ✅ | ❌ | ❌ | ❌ | ✅ |
| Volki | ARS (no publicado) | ? | ❌ | ❌ | ❌ | ✅ |
| Iveter | Cotización | ? | ⚠️ Saliente | ❌ | ❌ | ✅ |
| Wakyma | €49 (~$53 USD) | ❌ | ❌ | ❌ | ? | ❌ |
| Ponkis | Opaco | ? | ✅ | ❌ | ❌ | ✅ |
| **NeoVet v1** | **Ver §7** | **🔲 En desarrollo** | **❌ v2** | **✅ básico** | **❌ v2** | **✅** |
| **NeoVet v2** | **Ver §7** | **✅** | **✅** | **✅ completo** | **✅** | **✅** |

---

## 4. Benchmarking — Mercado global (referencia)

Estas plataformas no compiten directamente en Argentina hoy, pero definen el techo de valor al que puede aspirar NeoVet.

| Plataforma | Precio/mes | Modelo | Diferenciador |
|-----------|-----------|--------|---------------|
| **Digitail** | $240–$300 por vet | Por veterinario | 20+ flujos de IA, SOAP dictado por voz |
| **ezyVet** | $299–$379 por user + $2.500 setup | Por usuario | Automatización de workflows, marketplace de integraciones |
| **Provet Cloud** | $150–$330 (1–5 users) | Por usuario | BI avanzado, soporte multi-país |
| **DaySmart Vet** | $116–$565 | Por usuario | Fácil adopción, transparent pricing |
| **IDEXX Neo** | $119–$250 | Por clínica o vet | Integración directa laboratorios IDEXX |

**Lectura:** El precio de mercado global para un PIMS en clínicas chicas es $150–$400/mes. NeoVet puede posicionarse por debajo de ese rango con ventaja local.

---

## 5. Herramientas de chatbot y WhatsApp

| Herramienta | Precio/mes | WhatsApp | IA triage | Vet-específico |
|-------------|-----------|----------|-----------|---------------|
| **Aurora Inbox** | $99–$329 | ✅ | ✅ keywords | ✅ |
| **Emitrr AI** | $159–$499 | ✅ | ✅ | ✅ |
| **Chatfuel** | $49–$149 | ✅ (add-on) | ❌ | ❌ |
| **Agentive AIQ** | $39–$449 | ✅ | ❌ | ❌ |
| **NeoVet Chatbot v1** | incluido | ❌ | ❌ | ✅ |
| **NeoVet Chatbot v2** | incluido | ✅ | ✅ L1–L4 | ✅ |

**Dato clave:** Aurora Inbox — el chatbot de WhatsApp más comparable a lo que NeoVet tendrá en v2 — cobra $99–$329/mes **solo por el chatbot**, sin CRM. NeoVet lo incluirá en el bundle.

---

## 6. Análisis de posicionamiento

### 6.1 El hueco de mercado

No existe hoy en Argentina ninguna solución que combine:

- CRM veterinario con historia clínica SOAP completa + pet shop + caja
- Facturación electrónica ARCA/AFIP nativa
- Chatbot con IA (FAQ hoy, triage completo en v2)
- WhatsApp bidireccional como canal principal (v2)
- Landing page profesional que evoluciona en paralelo con el sistema
- API abierta para integraciones futuras (v2)
- Soporte local en español rioplatense

### 6.2 Diferenciadores reales por versión

**Hoy (v1):**

| Diferenciador | Detalle |
|---------------|---------|
| CRM completo con peluquería y caja | Casi ningún competidor local incluye pet shop + caja integrada |
| Módulo de peluquería con fotos y niveles de dificultad | Único o muy raro en el mercado local |
| Importación desde GVet vía Excel | Elimina la fricción de migración |
| Chatbot web 24/7 con rate limiting y security headers | Ningún competidor local lo incluye en el bundle |
| Landing page profesional con chatbot embebido | La mayoría de las clínicas no tiene presencia web — NeoVet la entrega lista |
| Banner de emergencia en landing | "Urgencia obstétrica 24hs — llamá YA" — visible sin scrollear |
| Cards de servicios con contenido SEO | Posiciona a la clínica en búsquedas locales ("ecografía veterinaria Rosario") |

**En v2:**

| Diferenciador | Detalle |
|---------------|---------|
| Triage L4 keyword fast-path | Detección de emergencias pre-IA, sub-milisegundo — crítico para braquicéfalos |
| WhatsApp bidireccional | Canal primario de comunicación en Argentina |
| Booking de turnos desde WhatsApp | El cliente autogestiona sin llamar ni esperar |
| Landing como funnel de autogestión | CTA "Sacá tu turno", preview de disponibilidad, QR de WhatsApp |
| Páginas de servicio dedicadas | `/ecografia`, `/braquicefalos`, `/peluqueria` — SEO masivo |
| Blog veterinario | Posiciona a la clínica como referente, genera tráfico orgánico |
| CRM ↔ Chatbot integrados | API pública — imposible con GVet |

**En v3:**

| Diferenciador | Detalle |
|---------------|---------|
| Portal del tutor desde la landing | Historial de vacunas, próximos turnos — sin llamar a la clínica |
| Captura de leads para recordatorios | "Dejá tu WhatsApp" — convierte visitantes en clientes |
| Pago online integrado | MercadoPago QR directo desde la landing |
| Blog con IA | Contenido generado a partir de preguntas frecuentes del chatbot |

### 6.3 Posicionamiento en precio

```
                    PRECIO ALTO
                         │
        ezyVet           │          Digitail
        Provet Cloud     │
                         │
─── FEATURES BAJOS ──────────────────── FEATURES ALTOS ───
                         │
        Wakyma €49       │     ◀◀ NeoVet v1 (objetivo)
        Iveter           │         ◀◀◀ NeoVet v2
        GVet             │              Ponkis
                         │
                    PRECIO BAJO
```

NeoVet debe ubicarse en **precio medio / features altos** — mejor que los locales en casi todo, accesible frente a los globales.

---

## 7. Estrategia de pricing recomendada

### 7.1 Principios

1. **Cotizar en USD** — protege el valor ante la inflación; estándar en tech B2B argentino.
2. **Flat rate por clínica**, no por usuario — más predecible para el cliente.
3. **Precios transparentes y públicos** — diferenciador frente a GVet, Ponkis, Iveter.
4. **Setup fee separado** — cubre implementación y migración sin elevar la mensualidad.
5. **Contrato anual con descuento** — mejora retención y cash flow.
6. **Honestidad sobre roadmap** — no vender v2 como si estuviera disponible hoy.

---

### 7.2 Planes

#### Plan Esencial — CRM completo
**$75 USD/mes** · Setup: $350 USD (único)

**Lo que incluye hoy (v1):**
- CRUD completo de clientes y pacientes con avatar
- Historia clínica SOAP: consultas, signos vitales, tratamientos con dosis/frecuencia/duración
- Vacunas, desparasitaciones, métodos complementarios, documentos por categoría
- Turnos con calendario semanal/diario, tipos de consulta (clínica/virtual/domicilio)
- Catálogo de servicios configurable con duraciones y bloqueos por cirugía
- Suspensión de agenda con cancelación automática y notificación al cliente
- Módulo de peluquería: perfil, sesiones con fotos antes/después, hallazgos, niveles de dificultad
- Pet shop: catálogo, proveedores, stock, ventas con carrito multi-ítem
- Caja: apertura/cierre, movimientos, métodos de pago, integración con ventas y peluquería
- Recordatorios automáticos por email: confirmación de turno, 48h/24h antes, vacunas 7 días, seguimiento post-consulta
- Control de acceso por roles (admin / veterinario / peluquero)
- UI mobile-responsive
- Migración de datos desde GVet incluida en el setup
- Hasta 5 usuarios staff

**Lo que viene en v2 (incluido sin costo adicional cuando esté disponible):**
- Facturación electrónica ARCA — actualmente en desarrollo (bloqueada por credenciales)

**Para quién:** Clínicas que quieren reemplazar GVet con una herramienta moderna, sin chatbot.

---

#### Plan Profesional — CRM + Chatbot web
**$110 USD/mes** · Setup: $450 USD (único)

**Incluye todo lo de Esencial, más:**
- Chatbot web embebido en su sitio o landing page, activo 24/7
- Responde automáticamente: horarios, servicios, cómo sacar turno, ubicación, consultas frecuentes
- Detección automática de feriados argentinos (ajusta horarios en el bot)
- Derivación a WhatsApp para consultas que requieren atención humana
- Hasta 8 usuarios staff

**A tener en cuenta:** El chatbot v1 es un asistente de FAQ con seguridad de producción (rate limiting, security headers, validación). El booking de turnos y el triage de urgencias son v2 — y se activarán exclusivamente por WhatsApp, no por el widget web.

**Para quién:** Clínicas que quieren reducir el volumen de mensajes de WhatsApp repetitivos sin intervención humana.

---

#### Plan Completo — CRM + Chatbot + Landing
**$160 USD/mes** · Setup: $650 USD (único)

**Incluye todo lo de Profesional, más:**
- Landing page profesional personalizada (Astro) — servicios, equipo, horarios, ubicación, chatbot integrado, mobile-first, optimizada para SEO
- Banner de emergencia sticky — número de urgencias visible sin scrollear
- Cards de servicios con descripción SEO-friendly por especialidad
- Formulario de contacto conectado — deriva a WhatsApp o email según el caso
- Google Reviews widget en vivo — integración con las reseñas reales de Google Business
- Usuarios ilimitados
- Onboarding remoto de 2 horas incluido

**Roadmap v2 incluido sin costo adicional:**
- **WhatsApp bidireccional** — el mismo chatbot en el canal que ya usan sus clientes
- **Booking de turnos por WhatsApp** — el cliente saca, consulta y cancela turnos sin llamar
- **Triage de urgencias L1–L4** — ante keywords de emergencia ("convulsión", "no respira", "atropellado"), el bot responde en sub-milisegundo con el contacto de urgencias y deja de responder
- **Recordatorios automáticos por WhatsApp** — turno 24h antes, vacunas próximas, seguimiento post-consulta
- **Dashboard de conversaciones en el CRM** — el equipo gestiona threads, escalaciones y vincula contactos
- **Landing → funnel de autogestión** — CTA "Sacá tu turno por WhatsApp", preview de disponibilidad, QR code de WhatsApp scaneable
- **Páginas de servicio dedicadas** — `/ecografia`, `/braquicefalos`, `/peluqueria` con info detallada y CTA de booking (SEO masivo local)
- **Blog veterinario** — posiciona a la clínica como referente y genera tráfico orgánico desde Google

**Roadmap v3 incluido sin costo adicional:**
- Portal del tutor desde la landing — historial de vacunas y próximos turnos sin llamar a la clínica
- Captura de leads para recordatorios de vacunas — "Dejá tu WhatsApp y te avisamos"
- Pago online desde la landing vía MercadoPago
- Indicador "Estamos abiertos / Cerrados" en tiempo real

**Para quién:** Clínicas que quieren automatización progresiva — empiezan con lo que existe hoy y reciben cada mejora del roadmap sin costo adicional.

---

### 7.3 Tabla comparativa de planes

| | Esencial | Profesional | Completo |
|--|---------|------------|---------|
| **Precio mensual** | $75 USD | $110 USD | $160 USD |
| **Setup (único)** | $350 USD | $450 USD | $650 USD |
| **Precio anual** (2 meses gratis) | $750 USD | $1.100 USD | $1.600 USD |
| CRM completo | ✅ | ✅ | ✅ |
| Peluquería + Pet shop + Caja | ✅ | ✅ | ✅ |
| Recordatorios email | ✅ | ✅ | ✅ |
| Facturación ARCA | 🔲 v1 próximo | 🔲 v1 próximo | 🔲 v1 próximo |
| Chatbot web FAQ 24/7 | ❌ | ✅ | ✅ |
| Triage de urgencias L1–L4 | ❌ | 🔲 v2 | 🔲 v2 |
| WhatsApp bidireccional + booking | ❌ | ❌ | 🔲 v2 |
| Recordatorios por WhatsApp | ❌ | ❌ | 🔲 v2 |
| Landing page profesional | ❌ | ❌ | ✅ |
| Banner de emergencia en landing | ❌ | ❌ | ✅ |
| Cards de servicios con SEO | ❌ | ❌ | ✅ |
| Google Reviews en vivo | ❌ | ❌ | ✅ |
| Páginas de servicio (/ecografia, etc.) | ❌ | ❌ | 🔲 v2 |
| Blog veterinario | ❌ | ❌ | 🔲 v2 |
| Portal del tutor + pago online | ❌ | ❌ | 🔲 v3 |
| Usuarios | 5 | 8 | Ilimitados |
| Migración desde GVet | ✅ | ✅ | ✅ |

> **Leyenda:** ✅ Disponible hoy · 🔲 En roadmap, incluido sin costo extra cuando esté listo · ❌ No incluido en este plan

---

### 7.4 Análisis de costo vs. alternativas

| Escenario | Herramientas | Costo/mes |
|-----------|-------------|-----------|
| GVet (actual) solo | GVet | ~$50–80 USD estimado |
| Wakyma (competidor más comparable) | Wakyma | $53 USD |
| GVet + Aurora Inbox (chatbot WhatsApp externo) | 2 herramientas separadas | ~$150–$410 USD |
| Digitail solo (PIMS global, sin WhatsApp) | Digitail | $240–$300 USD |
| **NeoVet Completo** | **Todo integrado** | **$160 USD** |

---

### 7.5 Estructura de costos estimada (COGS por cliente)

| Componente | Esencial | Profesional | Completo |
|------------|---------|------------|---------|
| Supabase | ~$15 | ~$15 | ~$15 |
| Vercel | ~$8 | ~$8 | ~$8 |
| Resend (email) | ~$5 | ~$5 | ~$5 |
| Claude API (chatbot) | — | ~$15 | ~$20 |
| WhatsApp provider v2 (TBD) | — | — | ~$30–50 |
| **COGS estimado** | **~$28** | **~$43** | **~$83** |
| **Margen bruto** | **~63%** | **~61%** | **~48%** |

> Con arquitectura multi-tenant (varios clientes en una instancia), los costos de Supabase y Vercel se distribuyen y el margen mejora notablemente en los planes Esencial y Profesional.

---

## 8. Propuesta de presupuesto (template para clientes)

> Documento listo para presentar a una clínica prospecto. Adaptar los campos `[entre corchetes]`.

---

### PROPUESTA COMERCIAL — NeoVet

**Para:** `[Nombre de la clínica]`
**Contacto:** `[Nombre del/la veterinario/a]`
**Fecha:** `[Fecha]`
**Preparado por:** Tomás Pinolini — NeoVet

---

#### ¿Qué es NeoVet?

NeoVet es un sistema de gestión veterinaria construido específicamente para clínicas argentinas. Combina un **CRM completo**, un **chatbot con inteligencia artificial** y una **presencia web profesional** — todo integrado, en español, con soporte local.

---

#### El problema que resolvemos

| Problema frecuente | Lo que hace NeoVet |
|--------------------|-------------------|
| Turnos gestionados a mano o en planillas | Calendario digital con recordatorios automáticos por email |
| El WhatsApp del consultorio lleno de consultas repetidas | Chatbot que responde FAQ automáticamente, 24/7 |
| Sin presencia web profesional | Landing page diseñada para tu clínica |
| Historia clínica dispersa o en papel | Todo el historial del paciente en un solo lugar, accesible desde celular |
| Pet shop y caja sin sistema | Control de stock, ventas y caja integrados al CRM |

---

#### Plan recomendado para `[Nombre de la clínica]`

`[Elegir la opción que corresponda según el perfil del cliente]`

---

##### ▸ Opción A — Plan Esencial · $75 USD/mes

Ideal para clínicas que buscan **reemplazar GVet o su sistema actual** con una herramienta moderna y completa.

**Incluye:**
- Clientes y pacientes — CRUD completo, foto, flag de fallecido
- Historia clínica SOAP: consultas, signos vitales, tratamientos (medicamento, dosis, frecuencia, duración), vacunas, desparasitaciones, métodos complementarios, documentos con categorías
- Turnos con calendario semanal/diario, tipos de consulta, asignación de profesional
- Suspensión de agenda con cancelación automática y notificación por email al cliente
- Módulo de peluquería: perfil por paciente, sesiones con fotos antes/después, hallazgos, niveles de dificultad
- Pet shop: catálogo de productos (9 categorías), proveedores, control de stock, ventas con carrito multi-ítem
- Caja: apertura/cierre de sesión, movimientos por método de pago, integración con ventas y peluquería
- Recordatorios automáticos por email: confirmación al crear turno, 48h/24h antes, vacunas 7 días, seguimiento post-consulta
- Control de acceso por roles (admin / veterinario / peluquero) + gestión de staff
- UI mobile-responsive — funciona en celular sin app nativa
- Migración de datos desde GVet (exportación Excel) incluida en el setup

**Inversión inicial (única):** $350 USD — configuración, migración de datos y capacitación remota (1 hora).

---

##### ▸ Opción B — Plan Profesional · $110 USD/mes

Ideal para clínicas que quieren **reducir el volumen de consultas manuales** y atender a los clientes fuera del horario hábil.

**Incluye todo lo de la Opción A, más:**
- Chatbot web con IA activo 24 horas, 7 días — embebido en su sitio o landing page
- Responde automáticamente: horarios, servicios, cómo sacar turno, ubicación
- Detecta automáticamente si hay feriados argentinos y ajusta la información de horarios
- Deriva a WhatsApp cuando la consulta requiere atención humana

**Inversión inicial (única):** $450 USD

---

##### ▸ Opción C — Plan Completo · $160 USD/mes ⭐ Más completo

Ideal para clínicas que quieren **presencia digital profesional** y que el sistema crezca con ellas.

**Incluye todo lo de la Opción B, más:**
- Landing page personalizada — servicios, equipo, horarios, ubicación, formulario conectado a WhatsApp, chatbot integrado, mobile-first, optimizada para Google
- **Banner de emergencia** — "Urgencia obstétrica 24hs — llamá al [número]" sticky en el tope de la página, visible sin scrollear
- **Servicios con descripción SEO** — cada servicio explicado con los diferenciadores propios de la clínica
- **Google Reviews en vivo** — reseñas reales de Google Business integradas y actualizadas

**Roadmap v2 — incluido sin costo adicional cuando esté disponible:**
- **WhatsApp bidireccional** — el mismo chatbot activo en el canal que ya usan sus clientes
- **Booking de turnos por WhatsApp** — el cliente saca, consulta y cancela turnos sin llamar ni esperar
- **Triage de urgencias** — ante keywords de emergencia ("convulsión", "no respira", "atropellado"), el bot detecta la situación antes de que intervenga la IA, envía el contacto de urgencias de forma instantánea y deja de responder
- **Recordatorios automáticos por WhatsApp** — turno 24h antes, vacunas próximas, seguimiento post-consulta
- **Landing → funnel de turnos** — CTA "Sacá tu turno por WhatsApp", disponibilidad visible, QR scaneable para agregar el número sin tipear
- **Páginas de servicio** — `/ecografia`, `/braquicefalos`, `/peluqueria` — info detallada + botón de reserva directo (posicionamiento masivo en búsquedas locales)
- **Blog veterinario** — posiciona a la clínica como referente de la especialidad y genera tráfico orgánico desde Google

**Roadmap v3 — incluido sin costo adicional cuando esté disponible:**
- Portal del tutor — los clientes ven historial de vacunas y próximos turnos sin llamar
- Pago online — MercadoPago QR o link directo desde la página
- Captura de leads — "Dejá tu WhatsApp y te avisamos cuando toque la próxima vacuna"

**Inversión inicial (única):** $650 USD — incluye diseño, configuración y publicación de la landing page.

---

#### Comparativa directa

| | GVet | Wakyma | GVet + chatbot externo | **NeoVet Completo** |
|--|------|--------|----------------------|-------------------|
| CRM veterinario completo | ✅ | ✅ | ✅ | ✅ |
| Pet shop + Caja integrada | ❌ | ? | ❌ | ✅ |
| Módulo de peluquería | ❌ | ❌ | ❌ | ✅ |
| Chatbot web con IA 24/7 | ❌ | ❌ | ✅ (externo) | ✅ (integrado) |
| Triage de urgencias L4 | ❌ | ❌ | ❌ | 🔲 v2 |
| WhatsApp bidireccional + booking | ❌ | ❌ | ✅ (externo) | 🔲 v2 |
| Landing page profesional | ❌ | ❌ | ❌ | ✅ |
| Banner de emergencia | ❌ | ❌ | ❌ | ✅ |
| Páginas de servicio SEO | ❌ | ❌ | ❌ | 🔲 v2 |
| Blog veterinario | ❌ | ❌ | ❌ | 🔲 v2 |
| Soporte en español AR | ✅ | ❌ | Depende | ✅ |
| Migración desde GVet | Manual | Manual | Manual | ✅ Asistida |
| **Precio mensual** | **Opaco** | **~$53 USD** | **~$150–$410 USD** | **$160 USD** |

---

#### Cómo es la implementación

| Etapa | Qué pasa | Tiempo |
|-------|----------|--------|
| Kick-off | Reunión inicial, recopilación de datos de la clínica | Semana 1 |
| Configuración | Setup del CRM, usuarios, servicios, precios | Semana 1–2 |
| Migración | Importación de clientes, pacientes y consultas desde el sistema actual | Semana 2 |
| Capacitación | Sesión remota con el equipo (1–2 horas según plan) | Semana 2–3 |
| Go-live | La clínica empieza a usar NeoVet en producción | Semana 3–4 |
| Seguimiento | Check-in a las 2 semanas para resolver dudas | Mes 2 |

---

#### Condiciones comerciales

- **Contrato mensual:** sin permanencia mínima.
- **Contrato anual:** **2 meses gratis** al pagar por adelantado.
- **Roadmap incluido:** las funcionalidades de v2 (WhatsApp, booking de turnos, triage de urgencias, dashboard de conversaciones en CRM) se habilitan cuando estén disponibles sin costo adicional para clientes activos en Plan Completo.
- **Soporte:** WhatsApp y email en horario hábil, respuesta en menos de 24h hábiles.
- **Medios de pago:** transferencia bancaria (ARS o USD), MercadoPago.
- **Precios en USD:** protegen el valor del servicio ante variaciones cambiarias.

---

#### Próximos pasos

1. Definir qué plan se ajusta mejor a la clínica
2. Llamada de 30 minutos para responder preguntas
3. Firma de propuesta y pago del setup para iniciar implementación

**Contacto:** Tomás Pinolini · tomaspinolini2003@gmail.com · `[WhatsApp]`

*Esta propuesta tiene validez de 30 días desde la fecha de emisión.*

---

## Apéndice — Fuentes de investigación

- [GVet — Capterra](https://www.capterra.com/p/249875/GVET/)
- [MyVete — Comparasoftware AR](https://www.comparasoftware.com.ar/myvete-gestion-veterinaria)
- [Volki — Comparasoftware AR](https://www.comparasoftware.com.ar/volki)
- [Iveter — Comparasoftware](https://www.comparasoftware.com/iveter-gestion-veterinaria)
- [Wakyma Vets — Comparasoftware AR](https://www.comparasoftware.com.ar/wakyma-vets)
- [Ponkis](https://ponkis.com/)
- [Digitail Pricing](https://digitail.com/pricing/)
- [ezyVet US Pricing](https://www.ezyvet.com/pricing/us)
- [Aurora Inbox — Veterinary WhatsApp Chatbot](https://www.aurorainbox.com/en/2026/02/17/chatbot-veterinary-whatsapp/)
- [Comparasoftware AR — Veterinario](https://www.comparasoftware.com.ar/veterinario)
- [Emitrr AI for Veterinarians](https://emitrr.com/blog/ai-answering-service-for-veterinarians)
