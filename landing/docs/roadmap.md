# NeoVet Landing — Roadmap

| Campo | Valor |
|---|---|
| **Proyecto** | NeoVet Landing Page |
| **Última actualización** | 2026-04-21 (reconciliado post commit `49c161b`) |
| **Roadmap del CRM** | `crm/docs/roadmap.md` |
| **Roadmap del Chatbot** | `chatbot/docs/roadmap.md` |

Este documento describe features potenciales para la landing page, sincronizadas con las versiones del CRM y chatbot. Muchos ítems están marcados como **TBD** (to be decided) — requieren validación con Paula antes de implementar.

> [!info] Auditoría 2026-04-21
> El 2026-04-21 se hizo un reality check contra código post commit `49c161b` (Franco). El commit shippeó contenido significativo pero no actualizó este roadmap. Esta revisión reconcilia el estado. Bugs encontrados y findings detallados en [[wiki/lint/2026-04-21-landing-audit]] (vault). Hygiene (`landing.zip`, desktop hero): [[wiki/lint/2026-04-21-landing-hygiene]].

---

## v1 — "Encontranos y contactanos" (actual)

> **Exit criteria:** Un cliente potencial encuentra la clínica online, entiende qué hace, y contacta por WhatsApp.

### Completado

| Componente | Estado |
|---|---|
| Single-page con anchor navigation (#inicio, #especialidades, #servicios, #nosotros, #resenas, #contacto, #horarios, #ubicacion) | ✅ |
| Hero con CTAs (WhatsApp primario, formulario secundario, chat widget terciario) | ✅ |
| 4 USP cards (propuestas de valor) | ✅ |
| Sección de servicios (3 destacados + 8 estándar) | ✅ |
| Sección nosotros, reseñas, horarios, ubicación, footer | ✅ |
| Chat widget embebido (iframe a chatbot) | ✅ |
| Scroll animations (IntersectionObserver) | ✅ |
| Mobile responsive | ✅ |
| Security headers (CSP, HSTS, etc.) | ✅ |
| Redesign v2 (BakerStreet-inspired hero) | ✅ |
| **Sección Horarios como componente dedicado** (2026-04-21) | ✅ |
| **Sección Ubicación como componente dedicado con mapa embebido** (2026-04-21) | ✅ |
| **Sección Reseñas con testimonios reales (3 cards)** (2026-04-21) | ✅ |
| **Dirección final**: Morrow 4064 (entre Robles y Forner), Rosario, Santa Fe | ✅ |
| **Teléfono + email consistentes**: (341) 310-1194 / veterinarianeo@gmail.com | ✅ |
| **Lista de servicios finalizada en código** (pending Paula review) | 🟡 |
| **Datos de horarios en código** (pending Paula confirmation — PLACEHOLDER aún presente) | 🟡 |
| **Links a redes sociales parcial**: Instagram + TikTok ✅ | 🟡 |
| **Fotos Paula + paciente en hero y about** | 🟡 (parciales — falta desktop hero) |

### Pendiente — Content swap (bloqueado por Paula)

| Entregable | Estado | Notas |
|---|---|---|
| Logo real (SVG ideal) | 🔲 | Paula debe proveer. `public/neovet-logo.png` sigue siendo placeholder. |
| Bios de veterinarios + especialidades | 🔲 | Solo Paula está en About. Confirmar si quiere sumar a Valdemar/Fernanda/Rocío o mantener personal brand. |
| **Confirmación de horarios** | 🔲 | Datos ya están (L-S 9:30-12:30/16:30-20:00), falta sign-off de Paula + borrar PLACEHOLDER en `Hours.astro:23`. |
| **Google Business Profile URL real** | 🔲 | Link en `Reviews.astro:66` es `maps.app.goo.gl/NeoVetRosario` — **URL inventada, va a 404**. |
| **Facebook correcto** | 🔲 | Link actual apunta a `CriaderoTiaClarita/` — confirmar si es intencional. |
| **X / Twitter** | 🔲 | `href="#"` en Footer. Paula provee URL o borramos el ícono. |
| Favicons + OG images regenerados con logo real | 🔲 | Post-logo. Actualmente generados Mar 26–31 desde placeholder. |
| Dominio asignado | 🔲 | Paula debe decidir. |

### Pendiente — Mejoras técnicas (no requieren a Paula)

| Entregable | Estado | Notas |
|---|---|---|
| Conectar formulario de contacto a backend | 🔲 | Opciones: Formspree, Resend, o deep link a WhatsApp. **TBD** — confirmar con Paula qué prefiere. |
| QR de WhatsApp | 🔲 **TBD** | Código QR escaneable. Simple pero confirmar si Paula lo quiere. |

### Bugs y hygiene encontrados en auditoría 2026-04-21

Ver detalle en [[wiki/lint/2026-04-21-landing-audit]] (vault):

- **P0 typo**: `Contactoa` en `ContactForm.astro:32` (visible a todo visitante).
- **P0 fake URL**: Google Reviews link inventado.
- **P0 URL sospechosa**: Facebook apunta a criadero, no clínica.
- **P2 archivo huérfano**: `pau_vete_perri.jpeg` (227 KB) agregado en `49c161b` pero no importado por ningún componente.
- **P3 design tokens**: `ServiceCard.astro` usa colores hardcoded (#e660a3/#46f5ac, text-blue-*) que rompen el sistema de tokens.
- **P3 UX**: Navbar 2 links vs Footer 7 links — inconsistencia de navegación.

Ver también [[wiki/lint/2026-04-21-landing-hygiene]] por `landing.zip` (~84 MiB en git root) y desktop hero.

---

## v2 — "Sacá turno sin llamar" (alineada con CRM v2 + Chatbot v2)

> **Exit criteria:** La landing dirige clientes hacia autogestión de turnos y refleja que la clínica es digitalmente moderna.
> **Empieza:** Cuando CRM v2 y Chatbot v2 estén estables.

| Feature | Depende de | Estado |
|---|---|---|
| CTA específico "Sacá turno por WhatsApp" | Chatbot v2 Fase C (tools transaccionales) | 🔲 **TBD** — Paula debe confirmar si quiere que cualquier visitante pueda agendar, o solo clientes existentes |
| Preview de disponibilidad ("Próximos turnos disponibles") | CRM v2 bot API (`/api/bot/availability`) | 🔲 **TBD** — ¿Mostrar slots abiertos públicamente? Paula debe decidir |
| Banner de emergencia sticky | Nada técnico | 🔲 **TBD** — "Urgencia obstétrica 24hs — llamá al ..." dismissible en top. Útil para braquicéfalos pero puede ser visualmente invasivo |
| Páginas de servicio individuales (`/ecografia`, `/braquicefalos`, `/peluqueria`) | Nada técnico — Astro static pages | 🔲 **TBD** — Cada servicio con descripción detallada, fotos, rango de precios, CTA de WhatsApp. Fuerte para SEO. Requiere contenido de Paula. |
| Blog / contenido educativo | Nada técnico — Astro content collections | 🔲 **TBD** — "5 señales de que tu bulldog necesita cirugía respiratoria", "Cuándo vacunar a tu cachorro". SEO + autoridad. Requiere que Paula escriba o valide artículos. |
| Testimonios con fotos de mascotas | Paula provee contenido | 🔲 **TBD** — Fotos o videos de clientes reales con sus bulldogs. Más fuerte que reseñas de texto. |
| Signup para recordatorio de vacunas | Chatbot v2 WhatsApp + CRM v2 vaccine reminders | 🔲 **TBD** — "Dejá tu WhatsApp y te avisamos cuando toque la próxima vacuna". Lead capture para no-clientes. Paula debe decidir si quiere captar leads así. |

---

## v3 — "Tu clínica, online" (alineada con CRM v3 + Chatbot v3)

> **Exit criteria:** La landing es el punto de entrada para clientes que gestionan todo online.
> **Empieza:** Cuando CRM v3 y Chatbot v3 estén estables.

| Feature | Depende de | Estado |
|---|---|---|
| Link al portal del cliente ("Ingresá a tu cuenta") | CRM v3 (portal del tutor) | 🔲 **TBD** — Clientes ven vacunas, turnos, historial. Paula debe decidir qué datos exponer. |
| Pago online (MercadoPago QR o link) | CRM v3 (pagos online) | 🔲 **TBD** — "Pagá tu consulta" desde la landing. Paula debe decidir si quiere cobrar online. |
| Estado en tiempo real ("Estamos abiertos / Cerrados") | CRM settings + bot_business_context | 🔲 **TBD** — Indicador live basado en horarios del CRM + feriados. |
| Blog con contenido sugerido por analytics del chatbot | Chatbot v3 analytics | 🔲 **TBD** — Artículos basados en preguntas frecuentes reales del chatbot. |
| Toggle multi-idioma (portugués) | Chatbot v3 multi-language | 🔲 **TBD** — Para clientes brasileños en zona fronteriza. Depende de si Paula tiene ese público. |

---

## Permanentemente fuera de alcance

- Tienda online / e-commerce — el pet shop es solo interno (CRM).
- Sistema de turnos propio en la landing — los turnos se gestionan por WhatsApp (chatbot) o CRM.
- Login de clientes en la landing — si hay portal, será un link al CRM v3, no una app en la landing.
- Cualquier backend o base de datos en la landing — Astro static output, siempre.

---

## Preguntas para Paula (antes de priorizar v2)

1. ¿Querés que cualquier persona pueda sacar turno desde la web/WhatsApp, o solo clientes ya registrados?
2. ¿Querés mostrar disponibilidad de turnos públicamente en la web?
3. ¿Te interesa un blog con artículos sobre salud animal? ¿Escribirías vos o delegarías?
4. ¿Querés captar WhatsApp de visitantes para recordatorios de vacunas (lead capture)?
5. ¿Te interesa un banner de emergencia visible en la web?
6. ¿Querés páginas individuales por servicio (ecografía, braquicéfalos, peluquería)?
7. ¿Tenés fotos/videos de clientes con sus mascotas que podamos usar como testimonios?
8. ¿Te interesaría cobrar online (MercadoPago) en el futuro?
9. ¿Tenés clientes brasileños o de habla portuguesa?
