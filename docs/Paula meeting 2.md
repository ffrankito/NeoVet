# Reunión con Paula — Preparación Reunión 2

> Documento de trabajo generado el 2026-03-28. Fuentes: `CLAUDE.md`, `crm/docs/charter.md`, `crm/docs/technical-spec.md`, `chatbot/docs/charter.md`, `chatbot/docs/technical-spec.md`, `chatbot/docs/architecture-phase1.md`, `landing/docs/paula-interview-checklist.md`, `landing/docs/optimization-overview.md`.

---

## Estado general

| Proyecto | Versión actual | Estado | Bloqueado por |
|---|---|---|---|
| CRM | v1 completo · v1.5 QA | ✅ / 🔄 | — |
| CRM v2 (AFIP) | — | 🔲 Bloqueado | Paula meeting |
| CRM v3 (roles) | — | 🔲 Bloqueado | Paula meeting |
| Chatbot v1 (widget web) | v1 completo | ✅ | — |
| Chatbot v2 (WhatsApp) | — | 🔲 Futuro | CRM v3 + Kapso |
| Chatbot v3 (auto + IA) | — | 🔲 Futuro | Chatbot v2 |
| Landing v1 | — | 🔲 Bloqueado | Datos de contacto Paula |
| Landing v2 (chatbot) | — | 🔲 Futuro | Chatbot v2 |
| Landing v3 (SEO + turnos) | — | 🔲 Futuro | CRM v2 + Chatbot v2 |

---

## Agenda sugerida

| # | Bloque | Tiempo |
|---|---|---|
| 1 | Demo del CRM en vivo — que Paula busque un cliente real | ~8 min |
| 2 | Presentar el plan: 3 proyectos, versiones claras | ~5 min |
| 3 | Preguntas bloqueantes — Facturación y Equipo | ~10 min |
| 4 | Chatbot — qué es y qué necesitamos de Paula | ~7 min |
| 5 | Landing — datos críticos y logo | ~5 min |
| 6 | Cierre y próximos pasos | ~5 min |

---

## Preguntas bloqueantes

> Sin estas respuestas no se puede arrancar ninguna de las fases siguientes.

### CRM — Fase D: Facturación AFIP
*Fuente: `crm/docs/charter.md` · Deliverable D6*

- [ ] **¿Facturación desde el día 1 en NeoVet?** — ¿Necesitás emitir facturas AFIP desde NeoVet desde el primer momento, o podés seguir con GVet mientras lo construimos?
- [ ] **¿Facturás en cada consulta o solo a pedido?** — ¿El cliente siempre pide factura, o es algo ocasional?
- [ ] **¿Qué tipo de comprobante emitís?** — ¿Factura A, B o C? ¿Monotributo o responsable inscripto?
- [ ] **¿Cómo cobran?** — ¿Efectivo, transferencia, tarjeta? ¿Usás MercadoPago?

### CRM — Fase E: Equipo y roles
*Fuente: `crm/docs/charter.md` · Deliverable D7*

- [ ] **¿Quiénes van a usar NeoVet?** — ¿Solo vos, o también recepcionistas u otros veterinarios? ¿Cuántas personas en total?
- [ ] **¿Qué puede ver cada rol?** — ¿Las recepcionistas acceden a la historia clínica (SOAP, vitales), o solo a turnos y datos de contacto?

### CRM — Open question del tech-spec
*Fuente: `crm/docs/technical-spec.md` · Open question Q3*

- [ ] **¿Borrado definitivo o archivado (recuperable)?** — Hoy el sistema hace hard-delete. Si querés poder recuperar clientes o pacientes borrados, hay que cambiar a soft-delete antes de que haya datos reales en producción.

### CRM — Transición desde GVet

- [ ] **¿Corte total o uso en paralelo?** — ¿NeoVet y GVet en paralelo (NeoVet para turnos, GVet para facturar) o reemplazo total de una sola vez?

### Chatbot — Contenido FAQ para seeder el system prompt
*Fuente: `chatbot/docs/charter.md` · Deliverable D3 pendiente · `chatbot/docs/technical-spec.md` · system prompt strategy*

> El widget web (v1) está construido. Lo que falta es seedear el system prompt con datos reales de la clínica antes de publicarlo.

- [ ] **¿Cuáles son los horarios exactos de atención?** — ¿Lunes-Sábado 9:30-12:30 / 16:30-20:00 sigue siendo así? ¿Domingo cerrado?
- [ ] **¿Cuáles son los precios de consulta?** — El bot responde preguntas de precios automáticamente. Necesitamos los valores reales para seeder el system prompt.
- [ ] **¿Cuáles son las preguntas más frecuentes que reciben por WhatsApp?** — El bot v1 responde FAQs estáticas. Necesitamos las 10 preguntas reales para armar el contenido.
- [ ] **¿Cuál es el teléfono de emergencia de la clínica?** — El sistema L4 (`NEXT_PUBLIC_CLINIC_EMERGENCY_PHONE`) lo envía automáticamente ante keywords como *convulsión, no respira, atropellado*. Ver `CLAUDE.md` — urgency system L4.
- [ ] **¿El widget de chat va embebido en la landing o en una URL propia?** — Open question Q1 del `chatbot/docs/technical-spec.md`. Define cómo se despliega.

### Landing — Datos críticos
*Fuente: `landing/docs/paula-interview-checklist.md` · Fase 4 críticos*

- [ ] **Nueva dirección** — Se mudaron de Morrow 4100. ¿Cuál es la dirección actual? (también para el mapa de Google)
- [ ] **Teléfono/WhatsApp y email** — ¿Sigue siendo 341-310-1194 / veterinarianeo@gmail.com?
- [ ] **Apellido correcto** — "Silveyra" (sitio viejo) vs "Silveira" (docs internos). ¿Cuál es el correcto?
- [ ] **Nombre de la clínica** — ¿Sigue siendo "NeoVet — Centro Reproductivo Canino Veterinario"?

---

## Preguntas importantes

> No bloquean la siguiente fase, pero afectan el diseño del sistema.

### CRM — Historia clínica
*Fuente: `crm/docs/technical-spec.md` · tablas `consultations` y `treatment_items`*

- [ ] **¿Los campos SOAP te sirven?** — El schema tiene: `subjective`, `objective`, `assessment`, `plan` — todos opcionales, con `notes` como fallback libre. ¿Estas etiquetas están bien?
- [ ] **¿Registrás FC y FR de rutina?** — El schema tiene campos opcionales `heart_rate` (bpm) y `respiratory_rate` (rpm). ¿Los usás en todas las consultas o solo en casos puntuales?
- [ ] **¿Los tratamientos pendientes pasan a la siguiente consulta?** — Los `treatment_items` tienen status: `pending / active / completed`. ¿Querés que los ítems sin completar aparezcan automáticamente en la próxima consulta del mismo paciente?

### Landing — Contenido
*Fuente: `landing/docs/paula-interview-checklist.md` · sección importantes*

- [ ] **¿La lista de servicios está bien?** — Cirugía General (featured) · Consultas Reproductivas (featured) · Pet Shop · Cardiología · Peluquería · Vacunación · A domicilio. ¿Agregamos o sacamos algo? ¿Sigue la guardia obstétrica?
- [ ] **Biografía y equipo** — ¿Reescribimos la bio, usamos la del sitio anterior o redactamos una nueva? ¿Hay otros veterinarios o personal para listar?

---

## Preguntas deseables

> No bloquean nada ahora, pero sirven para avanzar en paralelo.

### Landing — Assets
*Fuente: `landing/docs/optimization-overview.md`*

- [ ] **Logo en SVG o PNG** — El favicon y las OG images usan 🐾 como placeholder. Con el logo real se regeneran con el script ya disponible en `scripts/generate_favicons.py` y `scripts/generate_og_images.py`.
- [ ] **Fotos de la clínica, equipo y mascotas** — Prioridad alta según `optimization-overview.md`. Fotos reales son clave para que el sitio no parezca generado por IA. Agregar en `src/assets/` (ver `src/assets/README.md`).
- [ ] **Redes sociales, dominio y testimonios** — ¿Instagram, Facebook? ¿En qué dominio va el sitio? ¿Mantenemos los 3 testimonios del sitio anterior?
- [ ] **Palabras clave SEO** — ¿Qué buscan los clientes? Ej: "veterinaria rosario", "bulldog veterinario", "veterinaria braquicéfala". La landing ya tiene meta tags configurados en `Base.astro`.
- [ ] **¿El eslogan está bien?** — Placeholder actual: *"Cuidamos a tu mascota como parte de nuestra familia"*. ¿Se mantiene, se cambia, o lo propone Paula?

---

## Versiones de cada proyecto

### CRM
*Fuente: `crm/docs/charter.md` · `crm/docs/technical-spec.md` · `CLAUDE.md`*

| Versión | Estado | Descripción |
|---|---|---|
| **v1** | ✅ Completo | Sistema base: clientes, pacientes, historia clínica, turnos, documentos. 1.771 clientes · 1.380 pacientes migrados. |
| **v1.5** | 🔄 QA en curso | Polish: validaciones Zod, loading states, AlertDialog en acciones destructivas, dashboard home. |
| **v2** | 🔲 Bloqueado D6 | Facturación AFIP: factura electrónica A/B/C integrada al flujo de consulta. |
| **v3** | 🔲 Bloqueado D7 | Roles y accesos: veterinaria, recepcionista. Prerequisito para Chatbot v2. |

### Chatbot
*Fuente: `chatbot/docs/charter.md` · `chatbot/docs/technical-spec.md` · `chatbot/docs/architecture-phase1.md` · `CLAUDE.md`*

| Versión | Estado | Descripción |
|---|---|---|
| **v1** | ✅ Completo | Widget web FAQ. Stateless, read-only, sin WhatsApp, sin CRM. System prompt seeded con datos reales de Paula. Claude claude-sonnet-4-6 via Vercel AI SDK. |
| **v2** | 🔲 Futuro | WhatsApp via Kapso SDK. Sistema de urgencias L1–L4 (L4 keyword fast-path pre-AI). Booking de turnos. Admin dashboard. Requiere CRM v3. |
| **v3** | 🔲 Futuro | Automatización avanzada: recordatorios automáticos, análisis de imágenes médicas (L3), reportes. Requiere validación clínica para imágenes (clínica brachycephalic). |

> **Nota de seguridad:** la clínica atiende bulldogs y razas braquicéfalas, propensas a emergencias respiratorias. El sistema L4 corre un keyword fast-path antes de la IA. La urgencia solo sube, nunca baja automáticamente. Solo un humano puede degradarla desde el dashboard. Ver `CLAUDE.md` — Urgency System y `chatbot/docs/architecture/ADR-005`.

### Landing
*Fuente: `landing/docs/paula-interview-checklist.md` · `landing/docs/optimization-overview.md` · `CLAUDE.md`*

| Versión | Estado | Descripción |
|---|---|---|
| **v1** | 🔲 Bloqueado Fase 4 | Sitio base en Astro 6. Ya tiene: diseño anti-slop (DM Sans, layouts asimétricos), meta tags, OG images, favicons, PWA manifest. Falta: contenido real de Paula. |
| **v2** | 🔲 Futuro | Integración con chatbot: widget embebido y/o CTA WhatsApp conectado al bot v2. Requiere Chatbot v2. |
| **v3** | 🔲 Futuro | SEO local Rosario, galería de fotos, formulario de turno online conectado al CRM. Requiere CRM v2 + API pública. |

---

## Dependencias

| Proyecto | Depende de |
|---|---|
| CRM v2 (AFIP) | Respuestas de Paula: tipo contribuyente, forma de cobro, urgencia |
| CRM v3 (roles) | Respuestas de Paula: lista de usuarios y permisos por rol |
| Chatbot v1 (widget) | Contenido FAQ completo de Paula: horarios, precios, FAQs, teléfono emergencia |
| Chatbot v2 (WhatsApp) | CRM v3 activo + Kapso SDK configurado |
| Chatbot v3 (auto + IA) | Chatbot v2 activo + validación clínica para análisis de imágenes |
| Landing v1 | Datos de contacto + logo + fotos de Paula |
| Landing v2 | Chatbot v1 deployado en Vercel |
| Landing v3 | CRM v2 con API pública + Chatbot v2 activo |

---

## Próximas reuniones

| Reunión | Objetivo | Estado |
|---|---|---|
| **Reunión 2 — hoy** | Desbloquear D6, D7, contenido FAQ, datos landing | Pendiente |
| **Reunión 3 — UAT CRM** | Paula usa NeoVet como herramienta principal. Criterio de éxito: reemplaza GVet para operaciones diarias. | Por coordinar |
| **Reunión 4 — Demo chatbot v1** | Paula aprueba las respuestas del bot antes del launch (criterio de éxito del charter). | Por coordinar |
| **Reunión 5 — Landing + facturación** | Revisión del sitio con datos reales y validación del flujo AFIP antes de producción. | Por coordinar |

---

*Actualizar este archivo después de cada reunión. Fuente única de verdad: `docs/paula-meeting.md` en la raíz del monorepo.*