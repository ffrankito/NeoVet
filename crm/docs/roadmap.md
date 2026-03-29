# NeoVet CRM — Roadmap

| Field | Value |
|---|---|
| **Project** | NeoVet CRM |
| **Última actualización** | 2026-03-30 |

Este documento describe el plan de largo plazo del CRM en tres versiones. Cada versión tiene su propio plan detallado en `crm/docs/vN/development-plan.md`.

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
| Turnos | Creación, confirmación, cancelación, asignación de profesional; tipos veterinario / peluquería |
| Historia clínica | Consultas SOAP + signos vitales + plan de tratamiento + vacunas + desparasitaciones + documentos + métodos complementarios |
| Peluquería | Perfil de peluquería por paciente, registro de sesiones con fotos y hallazgos, precios por nivel de dificultad |
| Facturación | Registro de pagos, facturación electrónica ARCA (Factura A/B/C), dos entidades fiscales, control de límites por entidad |
| Catálogo de servicios | Tabla de servicios con duración predeterminada y bloqueo por cirugía |
| Calendario semanal | Vista semanal con slots libres y bloqueos de cirugía |
| Recordatorios por email | Turno 48h/24h antes, vacunas 7 días antes, seguimiento post-consulta — vía Resend + Vercel Cron |
| Staff y accesos | Roles admin / veterinario / peluquero, gestión de staff por admin, `createdBy` en registros clave |
| Diseño mobile | UI responsive para uso desde celular |
| Migración de datos | Importación one-time desde exportaciones CSV de GVet |

**Fuera de alcance en v1:**
- API pública (sin integración con chatbot)
- Recordatorios por WhatsApp (son v2 — en v1 se usan emails)
- Reportes y analíticas
- Integración Geovet (no existe API — solo exportación manual)

---

## v2 — Chatbot + WhatsApp + Automatización

> **Exit criteria:** Los clientes interactúan con el chatbot; el staff maneja menos tareas manuales.
> **Empieza:** Solo después de que v1 esté estable y Paula use NeoVet como herramienta primaria.

**Plan detallado:** `crm/docs/v2/development-plan.md` *(a crear cuando v1 esté en UAT)*

| Feature | Área |
|---|---|
| API pública del CRM — endpoints para que el chatbot lea/escriba turnos | Integración |
| Autogestión de turnos online vía chatbot | Scheduling |
| WhatsApp bidireccional (Kapso) | Comunicación |
| Recordatorios de turno por WhatsApp — 24h y 1h antes | Comunicación |
| Confirmación de turno por WhatsApp | Comunicación |
| Recordatorios de peluquería por WhatsApp ("hace dos semanas...") | Comunicación |
| Recordatorios de vacunas por WhatsApp | Comunicación |
| Mensajes de seguimiento post-consulta por WhatsApp | Comunicación |
| Alertas del peluquero al veterinario por hallazgos clínicos | Clínica |
| Seguimiento de ausencias (no-shows) | Scheduling |
| Cancelación y reagendamiento con auditoría | Scheduling |
| Flags de razas braquicéfalas — triage de urgencia elevada | Triage |
| Seguimiento de gastos | Facturación |
| Reportes financieros | Reportes |
| Analíticas de turnos | Reportes |
| Log de auditoría — todos los cambios con usuario + timestamp | Operaciones |
| Sincronización con calendario (Google / iCal) | Integración |
| Gestión de recetas | Clínica |
| Resultados de laboratorio | Clínica |
| Registros de anestesia | Clínica |
| Resúmenes de alta | Clínica |
| Analíticas del chatbot | Reportes |
| Pizarrón digital — estado en tiempo real de la clínica | Operaciones |
| Inventario: consumo ligado a consultas | Inventario |
| Inventario: seguimiento de vencimientos | Inventario |
| Inventario: órdenes de compra | Inventario |

---

## v3 — Inteligencia y Automatización Avanzada

> **Exit criteria:** Decisiones basadas en datos; carga administrativa manual casi nula.
> **Empieza:** Solo después de que v2 esté estable. Requiere datos de uso validados de v1/v2.

**Plan detallado:** `crm/docs/v3/development-plan.md` *(a crear cuando v2 esté en UAT)*

| Feature | Área |
|---|---|
| Dictado por voz para historia clínica (SOAP) | IA Clínica |
| Resúmenes automáticos de ficha para veterinarios derivantes | IA Clínica |
| Sugerencias automáticas de diagnóstico / tratamiento | IA Clínica |
| Tiempo estimado de peluquería calculado automáticamente por historial | IA Operaciones |
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
| Turnos de peluquería online (autogestión del cliente) | Scheduling |
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
