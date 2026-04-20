# NeoVet CRM — Roadmap

| Field | Value |
|---|---|
| **Project** | NeoVet CRM |
| **Última actualización** | 2026-04-20 |

Este documento describe el plan de largo plazo del CRM en tres versiones. Cada versión tiene su propio plan detallado en `crm/docs/vN/development-plan.md`.

> **Nota 2026-04-20:** El alcance de v1 fue re-escopado el 2026-04-19 tras entrevistas post-demo con el equipo de la clínica (ver `crm/docs/v1/charter.md` — actualización a v1.5 pendiente). Cambios principales: la facturación ARCA (antes Fase D en v1) se movió a v2; se agregaron 9 features nuevas a v1 (fluidoterapia + timeline de internaciones, agenda compartida entre vets, consent de sedación, retorno del consultorio, endocrinología, búsqueda por nombre de mascota, auto-charge desde tratamientos, acceso read-only a precios para vets, stopgap WhatsApp); y se agregó un workpackage de observabilidad (Sentry + Langfuse + PostHog) — Sentry en el CRM shippado 2026-04-20. El tablero de status actual vive fuera del repo.

---

## Criterio de versión

Antes de incluir cualquier feature en una versión, debe pasar estas tres preguntas:

1. **¿Es bloqueante?** ¿El usuario puede obtener valor sin esto? Si sí → diferir.
2. **¿Es reversible?** ¿Se puede agregar después sin romper nada? Si sí → diferir.
3. **¿Está validado?** ¿Sabemos que los usuarios lo necesitan, o lo estamos asumiendo? Si asumimos → diferir.

---

## v1 — Paula reemplaza GVet

> **Exit criteria:** Paula usa NeoVet como herramienta principal para las operaciones diarias sin abrir GVet.

**Plan detallado:** `crm/docs/v1/development-plan.md`

| Área | Qué se construye |
|---|---|
| Clientes y pacientes | CRUD completo, avatar, flag de fallecido |
| Turnos | Creación, confirmación, cancelación, asignación de profesional; tipos veterinario / estética; modalidad (clínica / virtual / domicilio) |
| Historia clínica | Consultas SOAP + signos vitales + plan de tratamiento (con dosis, frecuencia, duración) + vacunas + desparasitaciones + documentos (con categorías) + métodos complementarios |
| Estética | Perfil de estética por paciente, registro de sesiones con fotos y hallazgos, tipos de servicio configurables con precio base por servicio y override manual |
| Facturación | *Diferido a v2 tras el re-scope 2026-04-19 — el flujo manual actual (caja diaria → contadora mensual → ARCA) es funcional y no bloquea el reemplazo de Geovet.* |
| Observabilidad | Sentry en CRM (errores server/edge/browser) — Phase T1a shippado 2026-04-20. Chatbot y landing pendientes (T1b/T1c). |
| Catálogo de servicios | Tabla de servicios con duración predeterminada y bloqueo por cirugía |
| Calendario semanal | Vista semanal con slots libres, bloqueos de cirugía y suspensión de agenda por profesional |
| Recordatorios por email | Turno 48h/24h antes, vacunas 7 días antes, seguimiento post-consulta — vía Resend + Vercel Cron |
| Staff y accesos | Roles admin / veterinario / esteticista, gestión de staff por admin, `createdBy` en registros clave |
| Pet shop | Catálogo de productos (9 categorías), proveedores, entradas de stock, ventas con carrito multi-ítem y métodos de pago |
| Caja | Apertura/cierre de sesiones de caja, movimientos (ingresos/egresos), desglose por método de pago |
| Diseño mobile | UI responsive para uso desde celular |
| Migración de datos | Importación one-time desde exportaciones CSV de GVet |
| **Day-one readiness** | Dashboard filtrado por rol, estado no-show, motivo de cancelación, turnos próximos en ficha del cliente, estética en caja, confirmación/cancelación por email, resumen de paciente en turno, atajo de seguimiento, widget de caja en dashboard |

**Fuera de alcance en v1:**
- API pública (sin integración con chatbot)
- Recordatorios por WhatsApp (son v2 — en v1 se usan emails)
- Reportes y analíticas
- Integración Geovet (no existe API — solo exportación manual)
- Facturación ARCA (movida a v2 el 2026-04-19 — el flujo manual actual no es el cuello de botella)

---

## v2 — Chatbot + WhatsApp + Automatización

> **Exit criteria:** Los clientes interactúan con el chatbot; el staff maneja menos tareas manuales.
> **Empieza:** Solo después de que v1 esté estable y Paula use NeoVet como herramienta primaria.

**Plan detallado:** `crm/docs/v2/development-plan.md` *(a crear cuando v1 haya cerrado los gaps de desarrollo y esté listo para UAT)*

| Feature | Área |
|---|---|
| **Facturación electrónica ARCA (Factura A/B/C)** — dos entidades fiscales, control de límites, integración con la contadora (migrado desde v1 el 2026-04-19) | Facturación |
| Langfuse en el chatbot — traces de Claude, evals, versionado de prompts (Phase T2) | Observabilidad |
| PostHog en landing + CRM — funnel de conversión, analíticas de uso (Phase T3) | Observabilidad |
| API pública del CRM — endpoints para que el chatbot lea/escriba turnos | Integración |
| Autogestión de turnos online vía chatbot | Scheduling |
| WhatsApp bidireccional (provider TBD — evaluar Kapso, Twilio, Meta Cloud API) | Comunicación |
| Recordatorios de turno por WhatsApp — 24h y 1h antes | Comunicación |
| Confirmación de turno por WhatsApp | Comunicación |
| Recordatorios de estética por WhatsApp ("hace dos semanas...") | Comunicación |
| Recordatorios de vacunas por WhatsApp | Comunicación |
| Mensajes de seguimiento post-consulta por WhatsApp | Comunicación |
| Alertas del esteticista al veterinario por hallazgos clínicos | Clínica |
| Cancelación y reagendamiento con auditoría | Scheduling |
| Flags de razas braquicéfalas — triage de urgencia elevada | Triage |
| Seguimiento de gastos | Facturación |
| Reportes financieros | Reportes |
| Analíticas de turnos | Reportes |
| Log de auditoría — todos los cambios con usuario + timestamp | Operaciones |
| Sincronización con calendario (Google / iCal) | Integración |
| Gestión de recetas — impresión y exportación de prescripciones | Clínica |
| Resultados de laboratorio | Clínica |
| Registros de anestesia | Clínica |
| Resúmenes de alta / internación | Clínica |
| Analíticas del chatbot | Reportes |
| Pizarrón digital — estado en tiempo real de la clínica | Operaciones |
| Inventario: consumo ligado a consultas | Inventario |
| Inventario: seguimiento de vencimientos | Inventario |
| Inventario: órdenes de compra | Inventario |
| CRM: módulo `/dashboard/bot` — conversaciones, escalaciones, vinculación de contactos | CRM + Chatbot |

> **Chatbot v2** tiene su propio roadmap detallado en `chatbot/docs/roadmap.md` con fases A–D (fundación, WhatsApp, tools transaccionales, urgency triage).

> **Nota:** Los siguientes ítems se movieron a v1 Fase L (day-one readiness): seguimiento de ausencias (no-shows), confirmación de turno por email, cancelación con motivo por email. Gestión de recetas se mantiene en v2 (impresión full con formato legal); v1 Phase L solo agrega un resumen de historial en el turno.

---

## v3 — Inteligencia y Automatización Avanzada

> **Exit criteria:** Decisiones basadas en datos; carga administrativa manual casi nula.
> **Empieza:** Solo después de que v2 esté estable. Requiere datos de uso validados de v1/v2.

**Plan detallado:** `crm/docs/v3/development-plan.md` *(a crear cuando v2 esté listo para UAT)*

| Feature | Área |
|---|---|
| Dictado por voz para historia clínica (SOAP) | IA Clínica |
| Resúmenes automáticos de ficha para veterinarios derivantes | IA Clínica |
| Sugerencias automáticas de diagnóstico / tratamiento | IA Clínica |
| Tiempo estimado de estética calculado automáticamente por historial | IA Operaciones |
| Dashboards de ingresos — por período, veterinario, servicio | BI |
| Métricas de retención de pacientes | BI |
| Constructor de reportes personalizados | BI |
| Business intelligence — análisis de tendencias, proyecciones | BI |
| Pagos online — MercadoPago / QR | Facturación |
| Soporte de reclamos de seguros | Facturación |
| Exportación a software contable (Contabilium, Xero) | Integración |
| Portal / app del tutor | Cliente |
| Mensajes de cumpleaños | Comunicación |
| Campañas de email | Comunicación |
| Reservas de internación | Scheduling |
| Turnos de estética online (autogestión del cliente) | Scheduling |
| Gestión de turnos del staff / guardias | Operaciones |
| Soporte multi-sede | Operaciones |
| Registro de sustancias controladas | Inventario |
| Reglas de reposición automática | Inventario |
| Integraciones de laboratorio (IDEXX, Antech) | Integración |
| Sistemas de imágenes (DICOM) | Integración |

---

## Permanentemente fuera de alcance

- Integración con Geovet — no existe API. Solo exportación manual de Excel, una sola vez.
- WhatsApp en v1 — el chatbot funciona solo vía web widget hasta v2.
- API pública del CRM en v1 — CRM y chatbot son independientes hasta v2.
