# Revisión de Documentación — Flags

*Generado: Abril 2026 · No eliminar archivos hasta confirmación de Tomás*

Este documento marca los archivos de documentación que requieren atención. Los archivos no fueron modificados — solo se señalan acá para que decidas qué hacer con cada uno.

---

## 🔴 Obsoletos — Eliminar o consolidar

Estos archivos duplican información que existe mejor en otro lado, tienen referencias rotas, o describen un estado que ya no existe.

| Archivo | Problema | Acción sugerida |
|---------|----------|----------------|
| `docs/GVet_Research_and_Benchmarking.md` | Duplicado exacto del archivo en la raíz (`/GVet_Research_and_Benchmarking.md`). Dos copias del mismo documento. | Eliminar este — conservar el de raíz |
| `landing/docs/paula-interview-checklist.md` | El archivo referencia a `/docs/paula-meeting.md` como su reemplazo — apunta a sí mismo de forma incorrecta. Contenido redundante con `docs/paula-meeting.md`. | Eliminar — `docs/paula-meeting.md` lo reemplaza |
| `chatbot/docs/handoff.md` | Template de entrega con todos los campos vacíos. Sin fecha de handoff definida. Si se usa, debería completarse en el momento del deploy. | Eliminar o mover a `docs/standards/` como template |
| `crm/docs/v1/handoff.md` | Mismo caso — template vacío, sin datos reales cargados. | Igual que arriba |

---

## 🟡 Stale — Revisar y actualizar o archivar

Estos archivos tienen contenido válido pero parcialmente desactualizado. No engañan activamente, pero pueden confundir si alguien los lee como documentación vigente.

| Archivo | Problema | Acción sugerida |
|---------|----------|----------------|
| `GVet_Research_and_Benchmarking.md` (raíz) | Investigación de marzo 2026, antes de que el sistema estuviera construido. El análisis de GVet sigue siendo válido; el contexto de "lo que podría ser NeoVet" quedó desactualizado. Supersedido por `NeoVet_Pricing_Research_and_Budget_Proposal.md` para fines comerciales. | Agregar un header `> ⚠️ Documento de referencia histórica — ver NeoVet_Pricing_Research_and_Budget_Proposal.md para la versión actualizada` |
| `docs/Investigacion_Software_Veterinario_Paula.md` | Documento de marzo 2026 escrito para Paula en tono de "esto es lo que podríamos construir". El sistema ya existe. Útil como contexto histórico pero no como presentación actual. | Archivar — reemplazado por `docs/Folleto_Comercial.html` para el uso con Paula |
| `chatbot/docs/architecture-phase1.md` | Plan de arquitectura de Fase 1 anterior al código real. El estado real está documentado con más precisión en `chatbot/docs/reverse-engineering.md`. | Agregar header indicando que fue superado por el reverse-engineering doc |
| `chatbot/docs/week1-handoff.md` | Guía de setup de infraestructura de la semana 1. La infraestructura ya está configurada. Solo relevante si se onboardea un dev nuevo desde cero. | Mover a `chatbot/docs/archive/` o agregar header "Setup completado — documento histórico" |

---

## 🔵 Históricos — Archivar, no eliminar

Estos archivos documentan trabajo completado. No están desactualizados de forma problemática — son registros de decisiones y fases pasadas. Vale la pena conservarlos pero señalar que son archivos históricos.

| Archivo | Contenido | Acción sugerida |
|---------|-----------|----------------|
| `crm/docs/superpowers/plans/2026-03-31-phase-k-petshop.md` | Plan de implementación de la Fase K (Pet Shop). Completada. | Mover a `crm/docs/archive/` |
| `crm/docs/superpowers/specs/2026-03-31-petshop-phase-k-design.md` | Spec de diseño del Pet Shop. Completada. | Mover a `crm/docs/archive/` |
| `chatbot/specs/2026-03-22-documentation-structure-design.md` | Spec de cómo organizar la documentación del chatbot. Ejecutada. | Mover a `chatbot/docs/archive/` |
| `docs/superpowers/specs/2026-03-27-crm-phase4-import-design.md` | Spec de importación de datos desde GVet. Completada (1.771 clientes, 1.380 pacientes importados). | Mover a `docs/archive/` |
| `chatbot/docs/curso/` (9 archivos) | Materiales educativos sobre AI SDK, LLMs, streaming, agentes. No son documentación operativa — son recursos de aprendizaje. | Mover a `chatbot/docs/learning/` para separar de docs operativas |

---

## ✅ Documentos vigentes — No tocar

Para referencia, estos son los documentos que están en buen estado y son los que hay que priorizar si se busca contexto:

| Archivo | Para qué sirve |
|---------|---------------|
| `CLAUDE.md` (raíz) | Contexto del negocio, restricciones, versioning strategy — fuente de verdad principal |
| `crm/docs/v1/development-plan.md` | Estado fase por fase del CRM — el más actualizado |
| `crm/docs/roadmap.md` | Roadmap v1/v2/v3 del CRM |
| `chatbot/docs/roadmap.md` | Roadmap v1/v2/v3 del chatbot — actualizado 2026-04-05 |
| `chatbot/docs/reverse-engineering.md` | Estado real del código del chatbot v1 |
| `crm/docs/v1/reverse-engineering.md` | Estado real del schema del CRM (27 tablas, 20 migraciones) |
| `docs/paula-meeting.md` | Notas y pendientes de reuniones con Paula |
| `NeoVet_Pricing_Research_and_Budget_Proposal.md` | Investigación comparativa + estrategia de pricing |
| `NeoVet_Propuesta_Partner_Paula.md` | Propuesta de partnership para Paula |
| `docs/Folleto_Comercial.html` | One-pager comercial antes/después |
| `docs/Guia_Admin.md` | Guía de usuario para administradores |
| `docs/Guia_Veterinario.md` | Guía de usuario para veterinarios |
| `docs/Guia_Peluquero.md` | Guía de usuario para peluqueros |
