# Guía de Entrevista — Demo V1 y Preview V2

> **⚠️ Estado (2026-04-18):** Este documento fue escrito como guion para la demo del 9 de abril. Esa reunión se hizo y el UAT que se iba a arrancar al final **quedó postpuesto**: el relevamiento con Valdemar y Fernanda reveló gaps funcionales que bloquean el reemplazo de Geovet, y el proyecto volvió a fase de desarrollo activa. Se mantiene este guion como referencia histórica — los tiempos, fechas y bloque 6 (kickoff UAT) ya no aplican. Para el estado actual ver `crm/docs/v1/development-plan.md`.

**Reunión con:** Paula Silveyra — NeoVet Centro Veterinario
**Conducida por:** Tomás Pinolini
**Duración estimada:** 90 minutos
**Formato:** Presencial o videollamada con pantalla compartida
**Objetivo:** Mostrar el estado real de lo construido en v1, recoger feedback, presentar el roadmap de v2, y arrancar la semana de UAT.

---

## Antes de la reunión — Checklist de preparación

- [ ] El CRM está deployado en producción (`https://neo-vet-eta.vercel.app`)
- [ ] Tenés una cuenta admin activa (`zfi1811@gmail.com`)
- [ ] El chatbot está live en `neo-vet-widget.vercel.app`
- [ ] La landing está deployada en `neo-vet-landing.vercel.app`
- [ ] Los templates de consentimiento están seeded (`npx tsx scripts/seed-consent-templates.ts`)
- [ ] El bucket `consent-documents` está creado en Supabase Storage (privado)
- [ ] Revisaste el checklist pre-lanzamiento (`docs/Checklist_PreLanzamiento.md`)
- [ ] Preparaste un paciente de demo con historial realista

---

## Estructura de la reunión

| Bloque | Duración | Qué pasa |
|--------|----------|----------|
| Apertura | 5 min | Contexto y objetivo |
| Demo V1 — CRM | 40 min | Recorrido completo del sistema |
| Demo V1 — Chatbot y Landing | 10 min | Las otras dos herramientas |
| Momento de feedback | 15 min | Paula habla, vos escuchás |
| Preview V2 | 10 min | Qué se viene |
| Kickoff UAT + Próximos pasos | 10 min | Acceso, guía de testeo, fechas |

---

## Bloque 1 — Apertura (5 min)

> "Paula, hace unas semanas arrancamos a construir esto. Hoy te lo quiero mostrar funcionando — no en un PowerPoint, sino en vivo. Todo lo que veas en esta reunión ya existe y está corriendo. Al final quiero que me digas qué funciona, qué falta, y te cuento lo que se viene."

---

## Bloque 2 — Demo V1: CRM (40 min)

### 2.1 — Dashboard (3 min)

**Mostrá:**
- El dashboard con la fecha de hoy y los turnos del día
- El widget de caja (abierta/cerrada)
- El nombre del profesional asignado en cada turno

> "Este es lo primero que ve cada persona cuando entra. El admin ve todo; el veterinario solo sus turnos; el peluquero solo los suyos."

---

### 2.2 — Clientes y pacientes (5 min)

**Mostrá:**
- Buscar un cliente de los importados de GVet — que Paula reconozca el nombre
- Abrir la ficha: pacientes asociados, próximos turnos
- Abrir la ficha de un paciente: datos, pestañas

> "Todo lo que estaba en GVet está acá — 2097 clientes y 2291 pacientes importados."

**Pregunta:** "¿Hay datos que no te llegaron o que querés que aparezcan diferente?"

---

### 2.3 — Historia clínica (8 min)

**Mostrá:**
- Pestaña "Historia clínica" con consultas importadas
- Consulta SOAP: motivo, hallazgos, diagnóstico, plan, signos vitales
- Plan de tratamiento: medicamento, dosis, frecuencia, duración
- Pestaña Vacunas — historial y próxima fecha
- Pestaña Documentos — subir y descargar un archivo
- Métodos complementarios

**Pregunta:** "¿Las consultas importadas de GVet tienen el nivel de detalle que esperabas?"

---

### 2.4 — Turnos y calendario (8 min)

**Mostrá:**
- Crear un turno en vivo: cliente → paciente (selector, no ID) → servicio (nombre del servicio, no código) → profesional → fecha
- El calendario semanal — colores por tipo de servicio
- **Feriados resaltados en ámbar** con el nombre del feriado
- Detalle de un turno desde el calendario — resumen del paciente
- Botón "No se presentó"
- Cancelación con motivo

> "Cuando creás el turno con recordatorios activados, el cliente recibe un email de confirmación inmediato, y otro 48h y 24h antes."

**Pregunta:** "¿Los tipos de servicio y las duraciones son los que vos manejas?"

---

### 2.5 — Internaciones y procedimientos (5 min)

**Mostrá:**
- Ir a "Internaciones" → crear nueva: buscar cliente → seleccionar paciente
- Ir a "Procedimientos" → crear nuevo: buscar cliente → seleccionar paciente
- Mostrar que en ambos casos se busca por nombre, no por ID

> "Estos módulos reemplazaron completamente a lo que hacían en GVet para seguimiento de cirugías e internaciones."

---

### 2.6 — Documentos de consentimiento (5 min)

**Mostrá:**
- Ir a "Consentimientos" → generar uno
- Buscar cliente → seleccionar paciente → elegir plantilla (cirugía, eutanasia, acuerdo reproductivo)
- Generar el PDF y descargarlo

> "El PDF se genera automáticamente con los datos del cliente y del paciente. Lo podés descargar e imprimir para que el dueño firme."

---

### 2.7 — Configuración de horarios (3 min)

**Mostrá:**
- Ir a "Configuración" → sección "Horarios de atención"
- Editar un horario y guardarlo
- Mostrar que el calendario se actualiza inmediatamente

> "Si cambiás los horarios acá, el calendario y el bot de WhatsApp (cuando esté listo) los usan automáticamente. Sin tener que pedirle nada a nadie."

---

### 2.8 — Módulo de peluquería y estética (4 min)

**Mostrá:**
- Menú "Estética" — historial de todas las sesiones
- Pestaña "Peluquería" en la ficha de un paciente
- Crear una sesión: fotos, hallazgos, precio, método de pago
- Mostrar que al guardar aparece en la caja

---

### 2.9 — Pet shop y caja (4 min)

**Mostrá:**
- Catálogo de productos con badge de bajo stock
- Registrar una venta con carrito
- Abrir la caja: balance, movimientos
- Cerrar la caja

---

### 2.10 — Roles y staff (1 min)

**Mostrá:**
- Configuración → Staff
- Los cuatro roles: admin, owner, veterinario, peluquero

> "Cuando quieras crear las cuentas del equipo, lo hacemos desde acá. Cada persona solo ve lo que necesita."

---

## Bloque 3 — Demo V1: Chatbot y Landing (10 min)

### 3.1 — Chatbot web (5 min)

**Mostrá:**
- Abrir la landing → botón "Chat"
- Las 4 preguntas de los quick replies
- Pregunta libre: "¿abren hoy?" — el bot sabe si es feriado y da el horario correcto
- Pregunta: "¿Cuáles son los servicios?"
- Cerrar con "Cerrar"

> "Este bot sabe si hoy es feriado. Si es Viernes Santo y alguien pregunta si abren, responde con el horario reducido automáticamente."

**Pregunta:** "¿Hay preguntas frecuentes que el bot no está respondiendo bien?"

---

### 3.2 — Landing page (5 min)

**Mostrá:**
- Secciones: hero, servicios, especialidades, about Paula, reseñas, horarios
- El chatbot integrado como iframe flotante
- En mobile

---

## Bloque 4 — Momento de feedback (15 min)

> "Viste todo lo que construimos. ¿Qué te genera dudas? ¿Qué cambiarías? ¿Qué falta?"

Preguntas específicas:
- "¿Hay algo del flujo de turnos que no refleja cómo lo manejan hoy?"
- "¿Los campos de la historia clínica son los que usás?"
- "¿Hay algo que hacían en GVet que acá no está?"

Clasificar cada punto como: **Bug / Ajuste / Feature faltante / Contenido**

---

## Bloque 5 — Preview V2 (10 min)

> "Lo que te mostré hoy es la versión 1. Ya funciona, ya lo podés usar. Pero hay una segunda versión en la que estamos trabajando."

**1. WhatsApp de verdad**
> "Hoy el bot responde en la web. En v2, ese mismo bot va a estar en WhatsApp. Tus clientes te van a escribir como siempre, y el bot va a responder."

**2. Tus clientes sacan sus propios turnos**
> "El bot va a mostrar disponibilidad real y crear el turno desde el chat. Sin llamar, sin que la recepcionista intervenga."

**3. Triage de urgencias**
> "Para tu clínica esto es especialmente importante. Cuando alguien escriba 'mi bulldog no respira', el bot va a detectarlo en milisegundos y va a enviar el número de urgencias de forma inmediata."

---

## Bloque 6 — Kickoff UAT + Próximos pasos (10 min)

> "Todo lo que viste hoy ya está funcionando y es tuyo. Ahora necesito que durante esta semana lo pruebes vos sola, con tus datos reales, y me digas si algo no funciona."

**Qué le entregás:**
- Acceso al CRM con cuenta admin
- Guía de testeo (`docs/Guia_Testeo_UAT.md`) — 18 escenarios
- Guías de usuario por rol (Admin, Veterinario, Peluquero)

> "Tenés hasta el miércoles 15 para probarlo. El jueves 16 nos juntamos y, si estás conforme, cerramos la entrega formal."

### Confirmación de próximos pasos

- [ ] Paula tiene acceso al CRM con cuenta admin
- [ ] Paula confirma los emails del equipo → fecha: ________
- [ ] Paula envía el logo real de la clínica → fecha: ________
- [ ] Paula confirma la URL de Google Business → fecha: ________
- [ ] Fecha de reunión de entrega formal: **jueves 16 de abril**
- [ ] Fecha de corte de Geovet: **16 de abril**

---

## Notas de la reunión

*[Completar durante o después de la reunión]*

**Bugs encontrados:**

**Ajustes pedidos:**

**Features faltantes:**

**Contenido pendiente:**

**Próxima reunión:** jueves 16 de abril (entrega formal)
