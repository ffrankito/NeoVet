# Guía de Testeo — NeoVet CRM v1

**Para:** Paula Silveira
**Fecha:** 13 de abril – 17 de abril 2026
**Objetivo:** Verificar que el sistema funciona correctamente con tus datos reales antes de la entrega formal del 20 de abril.

---

## Cómo usar esta guía

Cada escenario te dice qué hacer y qué debería pasar. Si algo no funciona como se describe, anotalo y mandáselo a Tomás por WhatsApp. No hace falta que hagas todo en un solo día — tenés una semana.

Si algo no sabés cómo hacerlo, consultá la **Guía de Administrador** que te entregamos junto con esta guía.

**Cuando termines cada escenario, marcá el checkbox.**

---

## 1. Acceso y login

- [ ] Ingresá a la URL del sistema con tu email y contraseña
- [ ] Verificá que ves el dashboard con los turnos del día y el widget de caja
- [ ] **¿Funciona?** Ves tu nombre arriba a la derecha y podés navegar por el menú

---

## 2. Buscar un cliente real

- [ ] Andá a "Clientes" y buscá un cliente que conozcas bien (alguien que atiendas seguido)
- [ ] Abrí su ficha. **¿Los datos son correctos?** Nombre, teléfono, email
- [ ] **¿Tiene sus mascotas asociadas?** Verificá que aparezcan los pacientes que conocés

---

## 3. Revisar la ficha de un paciente

- [ ] Desde el cliente anterior, abrí la ficha de una de sus mascotas
- [ ] Verificá los datos: nombre, raza, sexo, edad. **¿Son correctos?**
- [ ] Navegá las pestañas: Historia clínica, Vacunas, Desparasitaciones, Documentos
- [ ] Si el paciente tiene consultas importadas de GVet, abrí una. **¿El contenido tiene sentido?**

---

## 4. Crear un turno nuevo

- [ ] Andá a "Turnos" → "Nuevo turno"
- [ ] Seleccioná un cliente y un paciente
- [ ] Elegí tipo "Veterinario", un profesional, un servicio, y una fecha/hora futura
- [ ] Activá "Enviar recordatorios" y guardá
- [ ] **¿Funciona?** El turno aparece en el dashboard y en el calendario
- [ ] **¿Te llegó un email de confirmación?** (revisá la casilla del cliente — si pusiste tu email, revisá tu bandeja)

---

## 5. Confirmar y completar un turno

- [ ] Buscá el turno que creaste (o uno existente pendiente)
- [ ] Hacé clic en "Confirmar". **¿Cambió el estado?**
- [ ] Hacé clic en "Completar". **¿Se abre el formulario de consulta?**
- [ ] Completá los campos SOAP con datos de prueba (pueden ser inventados) y guardá
- [ ] **¿La consulta aparece en la historia clínica del paciente?**

---

## 6. Cancelar un turno

- [ ] Creá un turno nuevo de prueba
- [ ] Cancelalo con un motivo (ej: "Cliente reprogramó")
- [ ] **¿El turno aparece como cancelado?**
- [ ] **¿Se envió email de cancelación?** (verificá si el cliente tiene email cargado)

---

## 7. Marcar "No se presentó"

- [ ] Buscá un turno confirmado cuya hora ya pasó (o creá uno en el pasado)
- [ ] Marcalo como "No se presentó"
- [ ] **¿Funciona?** El estado cambia a "No se presentó"

---

## 8. Calendario semanal

- [ ] Andá a "Calendario"
- [ ] **¿Ves los turnos distribuidos en la semana?**
- [ ] Usá el filtro de profesional — desactivá uno y verificá que sus turnos desaparezcan
- [ ] Hacé clic en un horario libre — **¿se abre el formulario de nuevo turno?**

---

## 9. Registrar una vacuna

- [ ] Abrí la ficha de un paciente → pestaña "Vacunas"
- [ ] Agregá una vacuna de prueba (nombre, fecha de hoy, próxima dosis en 30 días)
- [ ] **¿Aparece en el historial de vacunas?**
- [ ] **¿Se muestra la próxima dosis?**

---

## 10. Subir un documento

- [ ] Abrí la ficha de un paciente → pestaña "Documentos"
- [ ] Subí un archivo de prueba (una foto cualquiera, un PDF) con categoría "Laboratorio"
- [ ] **¿Aparece en la lista?**
- [ ] Hacé clic para descargarlo. **¿Se descarga correctamente?**

---

## 11. Peluquería — perfil y sesión

- [ ] Buscá un paciente que vaya a peluquería y abrí su pestaña "Peluquería"
- [ ] **¿Tiene perfil de grooming?** Si no, creá uno (comportamiento, tipo de pelaje)
- [ ] Desde un turno de peluquería, registrá una sesión de prueba: subí una foto, marcá un hallazgo, elegí nivel de dificultad, poné un precio y un método de pago
- [ ] Guardá. **¿La sesión aparece en el historial del paciente?**

---

## 12. Pet shop — producto y venta

- [ ] Andá a "Pet shop" → "Productos". **¿Ves los productos cargados?**
- [ ] Registrá una venta de prueba: agregá un producto al carrito, seleccioná método de pago, confirmá
- [ ] **¿El stock bajó?**
- [ ] **¿El ingreso aparece en la caja?** (la caja tiene que estar abierta)

---

## 13. Caja — abrir, verificar, cerrar

- [ ] Si la caja no está abierta, abrila con un monto inicial (ej: $5000)
- [ ] Verificá que las ventas y sesiones de peluquería aparezcan como movimientos
- [ ] Registrá un egreso manual (ej: "Suministros de limpieza", $500)
- [ ] Cerrá la caja: ingresá el monto de efectivo que "contaste"
- [ ] **¿El sistema te muestra la diferencia si no coincide?**

---

## 14. Roles — verificar que cada rol ve lo que debe

- [ ] Pedile a un veterinario que entre con su cuenta. **¿Solo ve sus turnos?** **¿No ve caja ni pet shop?**
- [ ] Pedile al peluquero que entre con su cuenta. **¿Solo ve turnos de peluquería?**
- [ ] Si todavía no creaste las cuentas, creá al menos una de prueba desde Configuración → Staff

---

## 15. Recordatorios automáticos

- [ ] Creá un turno para dentro de 48 horas con recordatorios activados y un email que puedas verificar (podés usar el tuyo)
- [ ] Esperá al día siguiente — **¿llegó el recordatorio de 48h?**
- [ ] Al día siguiente — **¿llegó el de 24h?**

> Si no te llega, verificá: ¿el email del cliente es correcto? ¿El turno está confirmado? ¿Activaste el toggle de recordatorios?

---

## 16. Suspensión de agenda

- [ ] Desde el calendario, creá una suspensión de prueba para un profesional (un día futuro)
- [ ] **¿Se ve el bloqueo en el calendario?**
- [ ] Si había turnos en ese horario, **¿se cancelaron automáticamente?**

---

## 17. Mobile

- [ ] Abrí el sistema desde tu celular (Chrome o Safari)
- [ ] Navegá el dashboard, buscá un cliente, abrí el calendario
- [ ] **¿Se ve bien?** ¿Podés tocar los botones sin problemas?

---

## 18. Internaciones

- [ ] Andá a "Internaciones" → "Nueva internación"
- [ ] Seleccioná un paciente, ingresá un motivo (ej: "Observación post-operatoria") y guardá
- [ ] **¿El paciente aparece como internado?**
- [ ] Registrá una observación: cargá peso, temperatura, frecuencia cardíaca y una nota clínica
- [ ] **¿La observación aparece en la internación?**
- [ ] Dale el alta con notas de salida
- [ ] **¿El estado cambió a "Dado de alta"?**
- [ ] Volvé a la ficha del paciente → pestaña "Internaciones". **¿Aparece en el historial?**

---

## 19. Procedimientos

- [ ] Abrí la ficha de un paciente → pestaña "Procedimientos"
- [ ] Creá un procedimiento de prueba: elegí cirujano y anestesiólogo, escribí una descripción
- [ ] Agregá un insumo del inventario (ej: un producto del pet shop) con cantidad 1
- [ ] **¿El stock de ese producto bajó?**
- [ ] Eliminá el insumo. **¿El stock se restauró?**
- [ ] Desde el procedimiento, agendá un seguimiento para una fecha futura
- [ ] **¿Se creó el follow-up?**

---

## 20. Documentos de consentimiento

- [ ] Abrí la ficha de un paciente → "Nuevo consentimiento"
- [ ] Elegí "Autorización de cirugía y hospitalización"
- [ ] **¿Los datos del paciente, cliente y veterinario se llenaron solos?**
- [ ] Hacé clic en "Generar PDF" → descargá el PDF. **¿Se ve correcto?**
- [ ] Repetí con "Acta de eutanasia". **¿Incluye la matrícula del veterinario?**

---

## 21. Cargos y deudores

- [ ] Creá un cargo manual para un cliente: andá a "Deudores" → "Nuevo cargo", elegí un cliente, poné un monto y descripción
- [ ] **¿Aparece el cargo como "Pendiente"?**
- [ ] Registrá un pago parcial (menos del total). **¿El estado cambió a "Parcial"?**
- [ ] Registrá el pago restante. **¿El estado cambió a "Pagado"?**
- [ ] Andá a la página "Deudores". **¿Se ven los clientes con saldo pendiente, ordenados por deuda?**
- [ ] Verificá que una consulta o venta haya generado cargo automáticamente: completá un turno (o registrá una venta en pet shop) y fijate si aparece un cargo nuevo en la ficha del cliente

---

## 22. Datos de GVet

- [ ] Buscá 5 clientes que uses seguido en la clínica. **¿Están todos?** **¿Los datos son correctos?**
- [ ] Para cada uno, verificá que sus mascotas estén vinculadas
- [ ] Abrí el historial de un paciente con muchas consultas. **¿Se importaron?**
- [ ] Si encontrás datos faltantes o incorrectos, anotá cuáles son

---

## Cuando termines

Mandale a Tomás un resumen de lo que encontraste:

- **Funciona bien:** todo lo que probaste y anduvo sin problemas
- **No funciona:** algo que debería funcionar y no funciona (bug)
- **No se entiende:** algo que funciona pero es confuso
- **Falta:** algo que esperabas encontrar y no está

La reunión de entrega formal es el **lunes 20 de abril**. Antes de esa fecha, Tomás resuelve cualquier bug que hayas encontrado.
