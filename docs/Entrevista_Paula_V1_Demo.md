# Guía de Entrevista — Demo V1 y Preview V2

**Reunión con:** Paula Silveira — NeoVet Centro Veterinario
**Conducida por:** Tomás Pinolini
**Duración estimada:** 90 minutos
**Formato:** Presencial o videollamada con pantalla compartida
**Objetivo:** Mostrar el estado real de lo construido en v1, recoger feedback, presentar el roadmap de v2, y abrir la conversación de partnership.

---

## Antes de la reunión — Checklist de preparación

- [ ] El CRM está deployado en producción (o en staging con datos reales importados de GVet)
- [ ] Tenés una cuenta admin activa para hacer la demo
- [ ] El chatbot está live en `neo-vet-widget.vercel.app`
- [ ] La landing está deployada
- [ ] Imprimiste o enviaste el Folleto Comercial (`docs/Folleto_Comercial.html`) para que Paula lo tenga
- [ ] Revisaste los pendientes de la última reunión (`docs/paula-meeting.md`)
- [ ] Preparaste un paciente de demo con historial realista (no usar datos reales de clientes en pantalla compartida si no es necesario)

---

## Estructura de la reunión

| Bloque | Duración | Qué pasa |
|--------|----------|----------|
| Apertura | 5 min | Contexto y objetivo de la reunión |
| Demo V1 — CRM | 35 min | Recorrido completo del sistema |
| Demo V1 — Chatbot y Landing | 10 min | Las otras dos herramientas |
| Momento de feedback | 15 min | Paula habla, vos escuchás |
| Preview V2 | 10 min | Qué se viene y cuándo |
| Kickoff UAT + Próximos pasos | 10 min | Entrega de guía de testeo, inicio de la semana de UAT |

---

## Bloque 1 — Apertura (5 min)

### Objetivo del bloque
Ubicar a Paula en el punto de partida y en el destino. Que entienda que no es una presentación — es una demo de algo que ya existe y que ella va a empezar a usar.

### Script sugerido

> "Paula, hace X semanas arrancamos a construir esto. Hoy te lo quiero mostrar funcionando — no en un PowerPoint, sino en vivo. Todo lo que veas en esta reunión ya existe y está corriendo. Al final de la reunión quiero que me digas qué funciona, qué falta, y quiero contarte lo que se viene."

> "También hay algo más que te quiero proponer hoy, pero lo dejamos para el final."

---

## Bloque 2 — Demo V1: CRM (35 min)

Hacé el recorrido en este orden. No saltes entre secciones — el flujo importa.

---

### 2.1 — Dashboard (3 min)

**Mostrá:**
- El dashboard con los turnos del día
- El widget de caja (abierta/cerrada)
- El filtro por rol — "Paula como admin ve todo; un vet solo ve sus turnos"

**Punto de conversación:**
> "Este es lo primero que ve cada persona cuando entra. El admin ve todo; el veterinario solo sus turnos; el peluquero solo los suyos."

---

### 2.2 — Clientes y pacientes (5 min)

**Mostrá:**
- Buscar un cliente de los importados de GVet — que Paula reconozca el nombre
- Abrir la ficha del cliente: pacientes asociados, próximos turnos
- Abrir la ficha de un paciente: avatar, datos, pestañas

**Punto de conversación:**
> "Todo lo que estaba en GVet está acá — 1.771 clientes y 1.380 pacientes importados. No empezás desde cero."

**Pregunta para Paula:**
> "¿Hay datos que no te llegaron o que querés que aparezcan diferente?"

---

### 2.3 — Historia clínica (8 min)

**Mostrá:**
- Abrir la pestaña "Historia clínica" de un paciente con consultas importadas
- Abrir una consulta SOAP — mostrar los campos: motivo, hallazgos, diagnóstico, plan, signos vitales
- Mostrar el plan de tratamiento: medicamento, dosis, frecuencia, duración, estado
- Pestaña Vacunas — historial y próxima fecha
- Pestaña Documentos — subir y descargar un archivo (mostrar categorías)
- Métodos complementarios — mostrar un informe de ecografía si hay uno

**Punto de conversación:**
> "Cada vez que un vet registra una consulta, esto queda acá. Cualquier veterinario de la clínica puede ver el historial completo del paciente antes de atenderlo."

**Pregunta para Paula:**
> "¿Las consultas importadas de GVet tienen el nivel de detalle que esperabas?"

---

### 2.4 — Turnos y calendario (7 min)

**Mostrá:**
- Crear un turno en vivo: elegir cliente → paciente → tipo (veterinario) → profesional → servicio → fecha → toggle de recordatorios
- El calendario semanal — colores por tipo de servicio
- Abrir el detalle de un turno desde el calendario — mostrar el resumen del paciente (última consulta, vacunas vencidas, alerta braquicéfalo)
- Mostrar el botón "No se presentó" en un turno pasado
- Mostrar el flujo de cancelación con motivo

**Punto de conversación:**
> "Cuando creás el turno con recordatorios activados, el cliente recibe un email de confirmación inmediato, y otro 48h y 24h antes. Nada de esto requiere que nadie se acuerde de enviarlo."

**Pregunta para Paula:**
> "¿Los tipos de servicio y las duraciones son los que vos manejas?"

---

### 2.5 — Módulo de peluquería (5 min)

**Mostrá:**
- Pestaña "Peluquería" en la ficha de un paciente — perfil (comportamiento, pelaje)
- Crear una sesión de peluquería: fotos antes/después, hallazgos, nivel de dificultad, precio, método de pago
- Mostrar que al guardar la sesión, aparece automáticamente en la caja

**Punto de conversación:**
> "Los hallazgos que registre el peluquero — nódulos, parasitosis, otitis — van a poder ser vistos por los vets. En la próxima versión, el sistema va a alertar automáticamente al vet cuando encuentren algo."

**Pregunta para Paula:**
> "¿Los tres niveles de dificultad (mín, medio, difícil) reflejan cómo lo manejan hoy? ¿Los precios base están bien configurados?"

---

### 2.6 — Pet shop y caja (5 min)

**Mostrá:**
- Catálogo de productos con badge de bajo stock
- Registrar una venta con carrito multi-ítem
- Abrir la caja: balance, movimientos, desglose por método de pago
- Cerrar la caja

**Punto de conversación:**
> "Todo lo que entra por ventas del pet shop y por sesiones de peluquería queda registrado automáticamente en la caja. Al cerrar el día, el balance ya está calculado."

---

### 2.7 — Roles y staff (2 min)

**Mostrá:**
- La página de gestión de staff (admin only)
- Los tres roles: admin, veterinario, peluquero

**Punto de conversación:**
> "Vos como admin podés crear las cuentas del equipo. Cada persona solo ve lo que necesita para su rol."

**Acción pendiente:**
> "Cuando arranquemos, necesito que me confirmes los emails de cada uno para crear sus cuentas."

---

## Bloque 3 — Demo V1: Chatbot y Landing (10 min)

---

### 3.1 — Chatbot web (5 min)

**Mostrá:**
- Abrir `neo-vet-widget.vercel.app` en el navegador
- Hacer las 4 preguntas de los quick replies — mostrar las respuestas
- Hacer una pregunta libre: "¿Cuándo trabajan los feriados?"
- Mostrar cómo deriva a WhatsApp cuando no puede ayudar más

**Punto de conversación:**
> "Este bot está activo 24/7. Cuando alguien te pregunta a qué hora abren el domingo a las 2am, el bot responde. Nadie de tu equipo necesita hacer nada."

**Pregunta para Paula:**
> "¿Hay preguntas frecuentes de tus clientes que el bot no está respondiendo bien? Dame ejemplos y lo ajustamos."

---

### 3.2 — Landing page (5 min)

**Mostrá:**
- Abrir la landing en el navegador (mostrar URL)
- Scrollear por las secciones: hero, USP cards, servicios, about, reseñas, horarios, formulario
- Mostrar el chatbot integrado como iframe
- Mostrar en mobile (DevTools o celular real)

**Punto de conversación:**
> "Esta es la cara de NeoVet en internet. Cualquier cliente que busque tu clínica en Google llega acá."

**Preguntas para Paula (abrir la checklist de contenido pendiente):**
> "Hay algunas cosas que necesito de tu parte para terminarla:"
- [ ] El logo real de la clínica (para favicons y OG images)
- [ ] La URL de tu perfil de Google Business (para las reseñas en vivo)
- [ ] Más fotos de la clínica o del equipo si tenés
- [ ] Revisión del texto de la sección "About" — ¿refleja bien tu historia?

---

## Bloque 4 — Momento de feedback (15 min)

### Objetivo
Escuchar. No defender. Tomar notas.

### Cómo manejarlo

Empezá con una pregunta abierta:
> "Viste todo lo que construimos. ¿Qué te genera dudas? ¿Qué cambiarías? ¿Qué falta?"

Después preguntas específicas si el silencio se extiende:
- "¿Hay algo del flujo de turnos que no refleja cómo lo manejan hoy?"
- "¿Los campos de la historia clínica son los que usás?"
- "¿Algún flujo que sentís que le falta un paso?"
- "¿Hay algo que hacían en GVet que acá no está?"

### Cómo tomar notas
Clasificar cada punto como:
- **Bug** — algo que no funciona como debería
- **Ajuste** — algo que funciona pero podría ser diferente
- **Feature faltante** — algo que GVet tenía y acá no está (puede ser v1 o v2)
- **Contenido** — información que hay que cargar (precios, servicios, staff)

---

## Bloque 5 — Preview V2 (15 min)

### Objetivo
Que Paula entienda que lo que vio hoy es el punto de partida, no el techo. Que la haga sentir que el sistema va a crecer con su clínica.

### Cómo presentarlo

> "Lo que te mostré hoy es la versión 1. Ya funciona, ya lo podés usar. Pero hay una segunda versión en la que estamos trabajando, y quiero que sepas lo que viene."

**Los tres ejes de v2:**

**1. WhatsApp de verdad**
> "Hoy el bot responde preguntas en la web. En v2, ese mismo bot va a estar en WhatsApp. Tus clientes no van a tener que ir a tu página — te van a escribir como siempre, y el bot va a responder."

**2. Tus clientes sacan sus propios turnos**
> "El bot va a poder mostrar disponibilidad real y crear el turno directamente desde el chat. Sin llamar, sin que la recepcionista intervenga. El cliente escribe 'quiero turno el jueves', el bot le muestra los horarios libres, y el turno queda agendado."

**3. Triage de urgencias**
> "Para tu clínica esto es especialmente importante. Cuando alguien escriba 'mi bulldog no respira' o 'está convulsionando', el bot va a detectarlo antes de que intervenga cualquier inteligencia artificial — en milisegundos — y va a enviar el número de urgencias de forma inmediata. No como una sugerencia. Como la primera respuesta."

**Para la landing:**
> "La página también va a crecer. Vamos a agregar páginas específicas por servicio — ecografía, braquicéfalos, peluquería — que van a ayudar a que tu clínica aparezca mejor en Google cuando alguien busca esos servicios en Rosario. Y cuando tengamos el WhatsApp activo, la página va a tener un botón de 'sacá tu turno' que va directamente al bot."

---

## Bloque 6 — Kickoff UAT + Próximos pasos (10 min)

### Objetivo
Que Paula salga de la reunión con acceso al sistema, una guía de testeo en la mano, y una fecha de cierre clara. Hoy arranca la semana de UAT.

### Cómo presentarlo

> "Todo lo que viste hoy ya está funcionando y es tuyo. Ahora necesito que durante esta semana lo pruebes vos sola, con tus datos reales, y me digas si algo no funciona o no tiene sentido."

### Qué le entregás en este momento
- **Acceso al CRM en producción** — su cuenta admin ya creada
- **Guía de testeo** (`docs/Guia_Testeo_UAT.md`) — 15-20 escenarios concretos para que verifique
- **Guías de usuario** por rol (Admin, Veterinario, Peluquero) — para que entienda cómo funciona cada cosa

### El acuerdo de la semana de UAT

> "Tenés hasta el miércoles 15 para probarlo. Cualquier cosa que encuentres — algo que no funciona, algo que no se entiende, algo que falta — me lo mandás por WhatsApp y lo resolvemos. El jueves 16 nos juntamos de nuevo, y si estás conforme, cerramos la entrega formal y arrancás a operar con NeoVet."

### Confirmación de próximos pasos

Antes de terminar, dejar acordado:

- [ ] Paula tiene acceso al CRM con cuenta admin
- [ ] Paula confirma los emails del equipo para crear las cuentas → fecha: ________
- [ ] Paula envía el logo de la clínica → fecha: ________
- [ ] Paula confirma la URL de Google Business → fecha: ________
- [ ] Paula revisa el texto de la sección About de la landing → fecha: ________
- [ ] Fecha de reunión de entrega formal: **jueves 16 de abril**
- [ ] Fecha objetivo de corte seco de Geovet: **16 de abril** (tras la entrega formal)

### Frase de cierre

> "Gracias por el tiempo. Todo lo que me digas esta semana lo resolvemos antes del jueves. El objetivo es que el 16, cuando firmemos la entrega, ya estés operando 100% en NeoVet sin necesidad de abrir GVet."

---

## Notas de la reunión

*[Completar durante o después de la reunión]*

**Bugs encontrados:**

**Ajustes pedidos:**

**Features faltantes:**

**Contenido pendiente:**

**Decisión de partnership:**

**Próxima reunión:**
