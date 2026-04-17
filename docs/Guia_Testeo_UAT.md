# Guía de Testeo — NeoVet CRM v1

**Para:** Paula Silveyra
**Fecha:** Pendiente — UAT no iniciado (re-planificación en curso tras relevamiento con el equipo)
**Objetivo:** Verificar que el sistema funciona correctamente con tus datos reales antes de la entrega formal.

> **⚠️ Estado (2026-04-17):** Esta guía fue escrita asumiendo un UAT entre el 9 y el 15 de abril. Ese UAT no se ejecutó. Las entrevistas con Paula y los veterinarios (Valdemar, Fernanda) revelaron gaps funcionales que bloquean el reemplazo de Geovet. Antes de relanzar el UAT hay que: (1) cerrar o re-scopar los gaps, (2) entrevistar a recepción/administración, (3) definir nuevas fechas. Los escenarios siguientes siguen siendo válidos como base pero pueden requerir actualización cuando se cierre el re-scope.

---

## Cómo usar esta guía

Cada escenario te dice qué hacer y qué debería pasar. Si algo no funciona como se describe, anotalo y mandáselo a Tomás por WhatsApp. No hace falta que hagas todo en un solo día — tenés una semana.

**Cuando termines cada escenario, marcá el checkbox.**

---

## 1. Acceso y login

- [ ] Ingresá a `https://neo-vet-eta.vercel.app` con tu email y contraseña
- [ ] Verificá que ves el dashboard con los turnos del día y el widget de caja
- [ ] **¿Ves la fecha de hoy** arriba del panel?

---

## 2. Buscar un cliente real

- [ ] Andá a "Clientes" y buscá un cliente que conozcas
- [ ] **¿Los datos son correctos?** Nombre, teléfono, email
- [ ] **¿Tiene sus mascotas asociadas?**

---

## 3. Revisar la ficha de un paciente

- [ ] Desde el cliente anterior, abrí la ficha de una mascota
- [ ] Verificá: nombre, raza, sexo, edad
- [ ] Navegá las pestañas: Historia clínica, Vacunas, Desparasitaciones, Documentos, Peluquería, Internaciones, Procedimientos
- [ ] Si tiene consultas importadas de GVet, abrí una. **¿El contenido tiene sentido?**

---

## 4. Crear un turno nuevo

- [ ] Andá a "Turnos" → "Nuevo turno"
- [ ] Seleccioná un **cliente** (buscá por nombre)
- [ ] Seleccioná el **paciente** de ese cliente
- [ ] Elegí un **servicio** (verificá que muestre el nombre, no un código)
- [ ] Elegí una **fecha y hora** futura
- [ ] Activá "Enviar recordatorios" y guardá
- [ ] **¿El turno aparece en el dashboard y en el calendario?**
- [ ] **¿Llegó un email de confirmación?**

---

## 5. Confirmar y completar un turno

- [ ] Buscá el turno que creaste
- [ ] Hacé clic en "Confirmar". **¿Cambió el estado?**
- [ ] Hacé clic en "Completar". **¿Se abre el formulario de consulta?**
- [ ] Completá los campos SOAP y guardá
- [ ] **¿La consulta aparece en la historia clínica del paciente?**

---

## 6. Cancelar un turno

- [ ] Creá un turno nuevo de prueba
- [ ] Cancelalo con un motivo
- [ ] **¿El turno aparece como cancelado?**
- [ ] **¿Se envió email de cancelación?**

---

## 7. Marcar "No se presentó"

- [ ] Buscá un turno confirmado cuya hora ya pasó
- [ ] Marcalo como "No se presentó"
- [ ] **¿Cambió el estado correctamente?**

---

## 8. Calendario semanal

- [ ] Andá a "Agenda"
- [ ] **¿Ves los turnos distribuidos en la semana?**
- [ ] **¿Los feriados aparecen resaltados en color ámbar** con el nombre del feriado?
- [ ] Usá el filtro de profesional y verificá que filtra correctamente

---

## 9. Configuración de horarios

- [ ] Andá a "Configuración"
- [ ] **¿Ves la sección "Horarios de atención"?**
- [ ] Verificá que los horarios sean los correctos (9:30 a 12:30 y 16:30 a 20:00)
- [ ] **¿Están configurados los horarios de feriado?** (10:00 a 13:00)

---

## 10. Internaciones

- [ ] Andá a "Internaciones"
- [ ] Hacé clic en "+ Admitir paciente"
- [ ] **¿Podés buscar el cliente y luego seleccionar el paciente?** (sin necesidad de ingresar un ID)
- [ ] Completá el formulario y guardá
- [ ] **¿Aparece en la lista de internaciones activas?**

---

## 11. Procedimientos

- [ ] Andá a "Procedimientos"
- [ ] Hacé clic en "+ Nuevo procedimiento"
- [ ] **¿Podés buscar el cliente y luego seleccionar el paciente?**
- [ ] Completá la fecha, descripción y cirujano
- [ ] **¿Aparece en la lista de procedimientos?**

---

## 12. Documentos de consentimiento

- [ ] Andá a "Consentimientos"
- [ ] Hacé clic en "+ Generar consentimiento"
- [ ] **¿Podés buscar el cliente y luego seleccionar el paciente?**
- [ ] **¿Aparecen las plantillas disponibles** (cirugía, eutanasia, acuerdo reproductivo)?
- [ ] Seleccioná una plantilla y generá el documento
- [ ] **¿Podés descargarlo?**

---

## 13. Estética

- [ ] Andá a "Estética" en el menú lateral
- [ ] **¿Ves el historial de sesiones de peluquería?**

---

## 14. Peluquería — perfil y sesión

- [ ] Buscá un paciente que vaya a peluquería
- [ ] Abrí su pestaña "Peluquería"
- [ ] Registrá una sesión: foto, hallazgo, precio, método de pago
- [ ] Guardá. **¿La sesión aparece en el historial?**
- [ ] **¿El ingreso aparece en la caja?** (la caja tiene que estar abierta)

---

## 15. Pet shop y caja

- [ ] Andá a "Pet shop" → registrá una venta de prueba
- [ ] **¿El stock bajó?**
- [ ] Abrí la caja — **¿aparece la venta como movimiento?**
- [ ] Cerrá la caja con el monto de efectivo
- [ ] **¿El sistema calcula el balance?**

---

## 16. Roles

- [ ] Pedile a un veterinario que entre con su cuenta. **¿Solo ve sus turnos?** **¿No ve caja ni pet shop?**
- [ ] Pedile al peluquero que entre. **¿Solo ve turnos de peluquería?**

---

## 17. Chatbot web

- [ ] Abrí la landing en `neo-vet-landing.vercel.app`
- [ ] Hacé clic en el botón "Chat"
- [ ] Preguntale: **"¿abren hoy?"** — **¿responde con el horario correcto?**
- [ ] Si hoy es feriado, **¿menciona el horario reducido?**
- [ ] Preguntale: **"¿Cuáles son los servicios?"**
- [ ] Cerrá el chat con el botón "Cerrar"

---

## 18. Recordatorios automáticos

- [ ] Creá un turno para dentro de 48 horas con recordatorios activados y tu email
- [ ] Al día siguiente — **¿llegó el recordatorio de 48h?**
- [ ] Al otro día — **¿llegó el de 24h?**
