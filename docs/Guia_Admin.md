# Guía para Administradores — NeoVet

Hola. Soy Paula. Esta guía es para vos y para cualquiera que tenga acceso administrativo al sistema NeoVet. Necesito que entiendas cómo funciona cada sección, porque de ustedes depende que tengamos un registro completo y unificado de todo lo que pasa en la clínica.

---

## 1. Acceso y Primer Ingreso

**URL:** Ingresá a `https://neovet.veterinaria.ar` (o el dominio que tengamos)

**Login:**
- Abrí la URL en cualquier navegador (Chrome, Safari, Firefox — funciona en desktop y mobile)
- Ingresá con tu email y contraseña
- Si es la primera vez, te llegará un link de confirmación por email — hacé clic en él

**Cambiar contraseña:**
- Hacé clic en tu nombre/avatar en la esquina superior derecha
- Seleccioná "Configuración" o "Cambiar contraseña"
- Seguí los pasos

💡 **Por qué importa:** El acceso de admin es sensible. Cuida tu contraseña como cuidas los datos de los clientes.

---

## 2. El Dashboard

Cuando ingresas, ves el dashboard. Acá está el corazón de la operación del día.

### Barra superior (arriba a la derecha)
- Tu email + badge con tu rol (Admin).
- Clic en tu avatar para cerrar sesión.

### Panel de control — Tarjetas del día (fila de 4 tarjetas)
Las tarjetas reflejan lo que está pasando **hoy**, no totales históricos:
- **Turnos hoy:** total del día, con sub-línea *"X completados · Y pendientes"*
- **En espera:** cuántos pacientes están confirmados y esperando; muestra *"Próximo: HH:MM · <Nombre>"*
- **Urgentes:** se pone roja cuando hay ≥ 1. Si dice "Sin urgencias", respirá tranquila.
- **Caja:** dice "Abierta desde HH:MM" o "Cerrada" (en ámbar). Clic para ir a la vista de caja.

Cada tarjeta es clickeable — te lleva a la lista completa del dato que mostra.

### Tira de alertas (debajo de las tarjetas, solo admin/dueño)
Dos pastillas chicas que pasan a ámbar cuando hay algo pendiente:
- **Deudores:** cantidad de clientes con cuentas sin pagar (pendiente o parcial). Clic para ir a Deudores.
- **Stock bajo:** productos activos que tocaron el mínimo. Clic para ir a Pet Shop.

Si las dos están grises → "todo tranquilo". Si alguna está ámbar → tocarla y resolver.

### Acciones rápidas (fila de 3 botones)
- **Nuevo cliente** — alta de cliente + primera mascota.
- **Nuevo turno programado** — agendar con fecha y hora.
- **Agregar a sala de espera** — abre un panel lateral para registrar un paciente que llegó sin turno (o uno que atendieron por urgencia y ahora registrás). Dentro del panel: un solo buscador que acepta nombre de mascota **o** dueño.

### Sala de espera
Pacientes confirmados que están en la clínica ahora. Ordenados: primero los urgentes (fondo rojo + barra roja a la izquierda), después por hora. Cada fila:
- Punto de color por tipo de servicio, hora, mascota, dueño, motivo, veterinario asignado, estado.
- Pasar el mouse por arriba → fondo clarito, indica que es accionable.
- Botones al final de cada fila para confirmar, completar, cancelar o marcar "no se presentó".

### Turnos programados
Todavía no confirmados (pending) para hoy, por hora. Misma estructura que sala de espera.

### Completados
Los que ya se atendieron, o se cancelaron, o no se presentaron. Aparecen en gris (60% opacidad) — están ahí para consulta, no para acción.

💡 **Por qué importa:** El dashboard es tu panel de control. Miralo cada mañana. Las tarjetas te dicen qué está pasando, la tira de alertas te avisa qué quedó pendiente, y sala de espera te muestra quién está adentro ahora.

---

## 3. Gestión de Clientes

### Buscar un Cliente Existente
**Opción 1: Desde el menú principal**
- Hacé clic en "Clientes" en la navegación
- Ves la lista de todos los clientes
- Usá el buscador (arriba) — escribí el nombre, teléfono o email
- Hacé clic en el cliente para abrir su ficha

**Opción 2: Desde un turno**
- En el dashboard, hacé clic en un turno
- Ves el nombre del cliente — hacé clic en él para ir a su ficha

### Crear un Cliente Nuevo
- Hacé clic en "Clientes" → "Nuevo cliente" (o botón "+")
- Completá los campos:
  - **Nombre:** Nombre y apellido (ej: "María García")
  - **Email:** Email del cliente (importante para los recordatorios)
  - **Teléfono WhatsApp:** El número que usamos para contactar (con código de país: +54 9 ... )
  - **Dirección:** Calle, número, piso/departamento, ciudad
  - **Teléfono alternativo** (opcional)
  - **Notas** (opcional): Cualquier detalle que debas recordar
- Hacé clic en "Guardar"

⚠️ **Importante:** El email es crítico. Si está mal, no llegan los recordatorios de turnos y los clientes se pierden las citas. El teléfono de WhatsApp es importante para el contacto manual, pero los recordatorios automáticos se envían por email.

### Editar Datos del Cliente
- Abrí la ficha del cliente (hacé clic en su nombre)
- Hacé clic en el botón "Editar"
- Modificá lo que necesites
- Guardá los cambios

### Ver la Ficha del Cliente
Dentro de la ficha del cliente ves:
- **Información personal:** Datos de contacto y dirección
- **Pacientes asociados:** Lista de mascotas que tiene registradas
- **Próximos turnos:** Los siguientes 5 turnos del cliente
- **Historial de turnos:** Todos los turnos pasados, con fechas y estados
- **Notas internas:** Espacio para comentarios de la clínica (no visible para el cliente)

---

## 4. Gestión de Pacientes

### Crear un Paciente Nuevo
**Desde la ficha del cliente:**
- Abrí al cliente → botón "Nuevo paciente" (o "+")
- Completá los datos:
  - **Nombre:** Nombre de la mascota (ej: "Bulldog Romeo")
  - **Especie:** Perro / Gato / Otro
  - **Raza:** La raza específica (importante para detectar braquicéfalos)
  - **Fecha de nacimiento:** Mes/año
  - **Sexo:** Macho / Hembra
  - **Microchip** (opcional): Número si tiene
  - **Foto/Avatar:** Subí una foto — ayuda a identificar rápido
- Hacé clic en "Guardar"

💡 **Por qué importa:** La raza es crítica. Si es bulldog u otra raza braquicéfala, el sistema te muestra una alerta cada vez que veas ese paciente. Eso puede salvar una vida si hay una crisis respiratoria.

### Editar Datos del Paciente
- Abrí la ficha del paciente
- Hacé clic en "Editar"
- Actualizá lo necesario (edad, microchip, notas, etc.)
- Guardá

### Subir Foto/Avatar
- En la ficha del paciente, hacé clic en el área de la foto (o botón "Cambiar foto")
- Subí una imagen clara del paciente
- Se guardará automáticamente

### Marcar un Paciente como Fallecido
- Abrí la ficha del paciente
- En el botón de menú (⋮ o similar), seleccioná "Marcar como fallecido"
- El paciente quedará desactivado — no se puede crear turnos nuevos, pero el historial se mantiene

### Navegar las Pestañas de un Paciente

**Pestaña Información:**
- Datos del paciente, foto, cliente asociado, microchip, notas

**Pestaña Historia Clínica:**
- Listado de todas las consultas registradas por los veterinarios
- Cada consulta muestra: fecha, veterinario, motivo (SOAP)
- Hacé clic para ver detalles

**Pestaña Vacunas:**
- Historial de vacunas aplicadas
- Próximas dosis esperadas
- Fechas de vencimiento
- El sistema envía recordatorio automático 7 días antes de la próxima dosis

**Pestaña Desparasitaciones:**
- Registro de desparasitantes aplicados, fechas, próximas dosis

**Pestaña Documentos:**
- Análisis de laboratorio, radiografías, ecografías — cualquier estudio
- Hacé clic para descargar

**Pestaña Estética:**
- Historial de sesiones de estética
- Perfil de estética: comportamiento, tipo de pelaje, dificultades
- Hallazgos registrados por el esteticista (nódulos, parasitosis, etc.)

**Pestaña Internaciones:**
- Pacientes que estuvieron o están internados
- Cada internación muestra: fecha de admisión, motivo, observaciones diarias, estado (internado / dado de alta)
- Hacé clic para ver las observaciones detalladas (signos vitales + notas clínicas)

**Pestaña Procedimientos:**
- Cirugías y procedimientos realizados al paciente
- Cada procedimiento muestra: fecha, cirujano, anestesiólogo, insumos consumidos
- El consumo de insumos descuenta stock del inventario automáticamente

---

## 5. Turnos

### Crear un Turno
**Desde el menú "Turnos":**
- Hacé clic en "Nuevo turno" (o "+")
- Paso 1: Seleccioná el cliente (buscá por nombre o teléfono)
- Paso 2: Seleccioná el paciente (la mascota)
- Paso 3: Tipo de turno: Veterinario / Estética
- Paso 4: Profesional asignado (tu nombre, el veterinario, el esteticista)
- Paso 5: Servicio (ej: "Revisación general", "Estética completa", etc.)
- Paso 6: Fecha y hora (hacé clic en el calendario)
- Paso 7: ¿Enviar recordatorios? Activá si querés que se envíen emails de confirmación 48h y 24h antes
- Paso 8: Guardá

⚠️ **Importante:** Si activás "Enviar recordatorios", el cliente recibirá emails automáticos. Asegurate de que el email del cliente esté correcto.

### Crear un Turno Desde el Calendario
- Hacé clic en "Calendario"
- Hacé clic en un horario libre del día que querés
- Se abre el formulario de nuevo turno (pasos como arriba)

### Confirmar un Turno
- Desde el dashboard, encontrá el turno (estará en gris si no está confirmado)
- Hacé clic en el turno
- Hacé clic en botón "Confirmar"
- Se marca como confirmado y el cliente recibe un email de confirmación (si lo activaste)

### Cancelar un Turno
- Abrí el turno
- Hacé clic en "Cancelar"
- Elegí el motivo de cancelación (ej: "Cliente solicitó", "Profesional indisponible", etc.)
- Escribí una nota (opcional)
- El sistema envía automáticamente un email al cliente informando la cancelación

⚠️ **Importante:** Al cancelar, los recordatorios programados se cancelan también.

### Marcar "No se Presentó" (No-show)
- Abrí un turno pasado que no fue completado
- Hacé clic en "Marcar como no se presentó"
- Se registra en el historial del cliente

### Completar un Turno
- Abrí el turno
- Hacé clic en "Completar"
- Se abre el formulario para registrar qué pasó (consulta clínica, sesión de estética, etc.)
- El veterinario o esteticista completa los detalles
- Se marca como hecho

💡 **Por qué importa:** Completar los turnos es cómo registramos el trabajo. Sin eso, no sabemos si atendimos al paciente o qué se hizo. Es el registro legal de la clínica.

---

## 6. Calendario

**Acceso:** Hacé clic en "Calendario" en la navegación principal

### Vista
- **Desktop:** Vista semanal (lunes a viernes, con franjas horarias)
- **Mobile:** Vista diaria (se adapta a la pantalla chica)

### Filtrar por Profesional
- Arriba ves checkboxes con los nombres de cada profesional
- Desactivá un nombre para ver solo sus turnos (o los de otros)
- Desactivá todos para ver solo los bloques de cirugía y suspensiones

### Crear un Turno Desde el Calendario
- Hacé clic en un horario libre
- Se abre el formulario de nuevo turno
- Completá como se describe arriba

### Bloqueos de Cirugía
- Aparecen en rojo, ocupan franjas horarias
- No se pueden crear turnos sobre un bloqueo de cirugía
- Si ves un bloqueo, significa que ese profesional está en quirófano

### Ver y Gestionar Suspensiones de Agenda
- Si hay un día/horario bloqueado, aparece una etiqueta o color diferente
- Hacé clic para ver detalles de la suspensión
- Solo admin puede crear o editar suspensiones (ver sección 7)

---

## 7. Suspensión de Agenda

Use esto cuando un profesional se toma vacaciones, enfermedad, o formación.

### Crear una Suspensión
- Hacé clic en "Calendario" → "Suspensiones" (o similar)
- Botón "Nueva suspensión"
- Elegí el profesional
- Elegí las fechas (desde / hasta)
- Seleccioná los horarios específicos (si querés bloquear solo part-time)
- Hacé clic en "Guardar"

### Qué Pasa con los Turnos Afectados
- Los turnos existentes durante esas fechas se **cancelan automáticamente**
- El cliente recibe un email informando la cancelación
- Podés crear turnos para ese profesional en otros horarios sin problema

⚠️ **Importante:** Planificá las suspensiones con anticipación. Si las creas tarde, puede haber conflicto con turnos ya confirmados.

---

## 8. Pet Shop

### Proveedores
**Crear un proveedor:**
- Menú "Pet shop" → "Proveedores" → "Nuevo proveedor"
- Nombre, email, teléfono, dirección
- Guardá

**Editar o desactivar:**
- Hacé clic en el proveedor
- "Editar" para cambiar datos
- "Desactivar" para que no aparezca en las selecciones nuevas (pero el historial se mantiene)

### Productos
**Crear un producto:**
- "Pet shop" → "Productos" → "Nuevo producto"
- Nombre (ej: "Alimento Royal Canin Medium", "Collar antipulgas")
- Categoría (alimento, medicamento, accesorios, etc.)
- Precio por unidad
- Stock mínimo (ej: 5 — te avisa cuando baja de eso)
- Código de proveedor (opcional, para control interno)
- Guardá

**Editar:**
- Hacé clic en el producto → "Editar"
- Podés cambiar precio, stock mínimo, etc.

**Desactivar:**
- Si un producto ya no se vende, desactivalo — desaparece de las selecciones nuevas

**Badge "Bajo stock":**
- Si el stock cae por debajo del mínimo, aparece un badge rojo/naranja
- Es una alerta: tenés que reabastecer

### Entradas de Stock
**Registrar una compra (entrada):**
- "Pet shop" → "Stock" → "Nueva entrada"
- Seleccioná los productos que compraste
- Ingresá cantidad para cada uno
- Proveedor (de quién compraste)
- Fecha de compra
- Precio de compra total (para registrar en contabilidad)
- Guardá

El stock se actualiza automáticamente.

### Ventas
**Registrar una venta:**
- "Pet shop" → "Ventas" → "Nueva venta" (o "Carrito")
- Buscá y agregá productos al carrito (cantidad para cada uno)
- El precio total se calcula automáticamente
- Seleccioná cliente (o déjalo vacío si es cliente anónimo)
- Método de pago: Efectivo / Tarjeta / Transferencia
- Hacé clic en "Confirmar venta"

**El ingreso se registra automáticamente en la caja** — no necesitás hacer nada más.

💡 **Por qué importa:** El stock es dinero. Si no registras las entradas y salidas, no sabés cuánto tenés, cuándo reabastecer, y perdés plata.

---

## 9. Caja

**Acceso:** "Caja" en la navegación

### Abrir Sesión de Caja
- Botón "Abrir caja"
- Ingresá monto inicial de efectivo (ej: $5000)
- Fecha/hora: se pone automáticamente, pero podés cambiarla
- Hacé clic en "Abrir"

La caja queda abierta para todo el día. Todos los ingresos y egresos se registran acá.

### Registrar Movimiento Manual
**Ingreso (dinero que entra):**
- Botón "+ Ingreso"
- Descripción: "Dinero de boca en boca", "Pago anterior", etc.
- Monto
- Método de pago: Efectivo / Tarjeta / Transferencia
- Hacé clic en "Guardar"

**Egreso (dinero que sale):**
- Botón "+ Egreso"
- Descripción: "Alquiler", "Suministros", "Pago de staff", etc.
- Monto
- Método de pago
- Hacé clic en "Guardar"

### Ver Balance y Desglose
- En el widget de caja, ves el balance total
- Hacé clic para ver desglose por método de pago (Efectivo / Tarjeta / Transferencia)

### Registros Automáticos
**Estos se registran solos, sin que hagas nada:**
- Ventas del pet shop → ingresan automáticamente (Efectivo o Tarjeta, según lo que pusiste)
- Sesiones de estética → ingresan automáticamente

### Cerrar Sesión de Caja
- Botón "Cerrar caja"
- Ingresá el monto de efectivo que contaste físicamente
- Si no cuadra con el balance de efectivo del sistema, el sistema te avisa la diferencia
- Notas: escribí cualquier observación (ej: "Falta $100, no sé dónde", "Todo cuadra perfecto")
- Hacé clic en "Confirmar cierre"

**Después de cerrar:**
- La sesión se guarda como historial
- No podés editar movimientos de una sesión cerrada
- Podés ver sesiones pasadas en "Historial de caja"

⚠️ **Importante:** Nunca cierres con diferencia sin investigar. Puede ser error de digitación, robo, o simple descuido. Encontrá la causa.

---

## 10. Internaciones

**Acceso:** "Internaciones" en la navegación (admin y veterinarios)

### Admitir un Paciente
- Botón "Nueva internación"
- Seleccioná el paciente
- Ingresá el motivo de internación (ej: "Cirugía de urgencia", "Observación post-operatoria")
- Notas iniciales (estado al ingreso, indicaciones)
- Vinculación opcional a una consulta previa
- Hacé clic en "Admitir"

⚠️ **Importante:** Solo puede haber una internación activa por paciente. Si el paciente ya está internado, primero hay que darle el alta.

### Registrar Observaciones Diarias
Mientras el paciente esté internado, registrá observaciones periódicas:
- Botón "+ Observación" en la internación activa
- **Signos vitales:** Peso (kg), temperatura (°C), frecuencia cardíaca (bpm), frecuencia respiratoria (rpm)
- **Notas clínicas:** Alimentación, hidratación, medicación administrada, orina, heces, estado general
- Podés registrar varias observaciones por día

### Dar de Alta
- Botón "Dar de alta" en la internación activa
- Notas de alta (indicaciones, medicación a continuar, seguimiento)
- El paciente pasa a estado "Dado de alta"
- La internación queda en el historial del paciente

### Ver Internaciones
- **Vista lista:** Todas las internaciones con filtro: Internados / Dados de alta / Todos
- Desde la ficha del paciente, pestaña "Internaciones" — ves el historial completo

---

## 11. Procedimientos

**Acceso:** Desde la ficha del paciente → pestaña "Procedimientos" (admin y veterinarios)

### Registrar un Procedimiento
- Botón "Nuevo procedimiento"
- Seleccioná el cirujano y el anestesiólogo (del staff)
- Descripción del procedimiento
- Vinculación opcional a una internación
- Guardá

### Agregar Insumos
- Dentro del procedimiento, botón "+ Agregar insumo"
- Seleccioná el producto del inventario (pet shop)
- Cantidad utilizada
- El stock del producto se **descuenta automáticamente**
- Si eliminás un insumo, el stock se **restaura**

### Seguimiento Post-Procedimiento
- Botón "Agendar seguimiento" dentro del procedimiento
- Funciona igual que el seguimiento post-consulta — crea un follow-up programado
- El sistema envía recordatorio por email en la fecha indicada

💡 **Por qué importa:** El registro de insumos es control de costos. Cada gasa, cada sutura, cada medicamento que se use en una cirugía queda documentado y descontado del stock.

---

## 12. Documentos de Consentimiento

**Acceso:** Desde la ficha del paciente → pestaña "Documentos" o sección "Consentimientos" (admin y veterinarios)

### Generar un Consentimiento
- Botón "Nuevo consentimiento"
- Elegí el tipo:
  - **Autorización de cirugía y hospitalización** — el dueño autoriza el procedimiento quirúrgico
  - **Acta de eutanasia** — incluye diagnóstico y matrícula del veterinario
  - **Acuerdo de asesoría reproductiva (GenetiCan)** — documento de 2 páginas con texto legal

### Datos Auto-llenados
El sistema completa automáticamente:
- Nombre del paciente, especie, raza, color de pelaje
- Nombre y DNI del cliente
- Nombre y matrícula del veterinario
- Fecha actual

Solo necesitás completar los campos específicos de cada documento (ej: diagnóstico para eutanasia, tipo de cirugía para autorización).

### Descargar el PDF
- Hacé clic en "Generar PDF"
- El documento se genera y se guarda en Supabase Storage
- Hacé clic en "Descargar" — se abre/descarga el PDF
- El link de descarga es válido por 60 segundos — si expiró, hacé clic de nuevo

💡 **Por qué importa:** Los consentimientos son documentos legales. Tenerlos generados digitalmente con todos los datos correctos es más rápido, más prolijo y más seguro que llenarlos a mano.

---

## 13. Cargos y Deudores

**Acceso:** "Deudores" en la navegación (solo admin)

### Cargos Automáticos
El sistema genera cargos automáticamente cuando se registran:
- **Consultas** — si el turno tiene un servicio con precio base
- **Sesiones de estética** — si el precio final es mayor a $0
- **Ventas del pet shop** — si la venta está vinculada a un paciente
- **Procedimientos** — por los insumos consumidos

No necesitás hacer nada para que se generen — aparecen solos.

### Crear un Cargo Manual
- Desde la ficha del cliente o desde "Deudores" → "Nuevo cargo"
- Seleccioná el cliente
- Descripción (ej: "Deuda pendiente de consulta anterior")
- Monto
- Categoría: consulta / estética / procedimiento / venta / internación / otro
- Guardá

### Registrar un Pago
- Abrí el detalle de deuda del cliente (desde "Deudores" o ficha del cliente)
- En la tabla de cargos pendientes, hacé clic en "Pagar"
- Ingresá el monto del pago
  - Si es menor al total → el cargo pasa a estado **"Parcial"**
  - Si cubre el total → el cargo pasa a estado **"Pagado"**
- Seleccioná método de pago
- Guardá

### Página "Deudores"
- Muestra todos los clientes con saldo pendiente
- Ordenados por monto de deuda (de mayor a menor)
- Buscable por nombre de cliente
- Hacé clic en un cliente para ver el detalle: resumen por categoría + tabla de todos los cargos

⚠️ **Importante:** Revisá la página de deudores regularmente. Los cargos se acumulan automáticamente — es tu responsabilidad gestionar los cobros.

---

## 14. Gestión de Staff (Solo Admin)

**Acceso:** "Configuración" → "Staff" (solo vos y otros admins)

### Crear una Cuenta de Staff
- Botón "Nuevo staff"
- Email (único — es la contraseña de acceso)
- Nombre completo
- Rol:
  - **Admin:** Acceso total (caja, staff, configuración, todo)
  - **Vet:** Solo gestión de pacientes y consultas clínicas
  - **Groomer:** Solo estética y sus propios turnos
- Hacé clic en "Guardar"

El staff recibe un email con un link para activar su cuenta.

### Editar Datos de Staff
- Hacé clic en el staff
- "Editar" para cambiar nombre, email, rol
- Guardá

### Desactivar una Cuenta
- "Desactivar" — la cuenta se bloquea, pero el historial se mantiene
- Podés reactivarla después si es necesario
- No se borra nada

---

## 15. Configuración

**Acceso:** "Configuración" (solo admin)

### Precios de Estética por Nivel
- "Configuración" → "Precios de estética"
- Ves tres niveles: Mínimo / Medio / Difícil
- Edita los precios — el sistema los usa para calcular automáticamente el costo de cada sesión
- Guardá

**Cómo funciona:**
- Cuando el esteticista registra una sesión, elige el tipo de servicio y el nivel de dificultad
- El sistema calcula el precio base según el servicio y la dificultad
- El esteticista puede ajustar manualmente si es necesario

### Catálogo de Servicios
- "Configuración" → "Servicios"
- Ves todos los servicios disponibles (ej: "Revisación general", "Estética completa", "Ecografía", etc.)

**Crear un servicio nuevo:**
- Botón "Nuevo servicio"
- Nombre (ej: "Consulta dermatológica")
- Tipo: Veterinario / Estética
- Duración estimada en minutos (para calcular citas)
- Hacé clic en "Guardar"

**Editar o desactivar:**
- Hacé clic en el servicio
- "Editar" para cambiar duración o nombre
- "Desactivar" si ya no se ofrece

💡 **Por qué importa:** Los servicios definen qué puede agendar cada profesional. Si algo no está en el catálogo, no se puede crear un turno para eso.

---

## 16. Recordatorios por Email — Automáticos

**Importante:** El staff no necesita hacer nada. Estos se envían solos:

| Recordatorio | Cuándo se envía | Quién recibe |
|---|---|---|
| Confirmación | Cuando vos creas y confirmas el turno | Cliente |
| 48 horas antes | 2 días antes del turno (8 AM) | Cliente |
| 24 horas antes | 1 día antes del turno (8 AM) | Cliente |
| Vacunas | 7 días antes de la próxima dosis | Cliente |
| Seguimiento post-consulta | En la fecha programada por el veterinario | Cliente (si se agendó seguimiento) |

**Cómo activarlos:**
- Al crear un turno, hay un toggle "Enviar recordatorios"
- Si lo activás, los emails se envían automáticamente
- Si lo desactivás, no se envía nada

**Requisitos:**
- El cliente debe tener email válido en el sistema
- El turno debe estar confirmado
- El profesional debe estar activo

⚠️ **Importante:** Si un cliente no recibe un recordatorio, verifica:
1. ¿El email está correcto en la ficha del cliente?
2. ¿El turno está confirmado?
3. ¿Activaste "Enviar recordatorios" al crear?

Si todo está bien, el email se envió. Tal vez fue a spam — pedile al cliente que revise.

---

## Resumen Final

Como administrador, tu rol es **garantizar que la información esté completa y correcta**. Cada dato que ingresés — un teléfono, una fecha, un estado — es parte del registro oficial de la clínica.

- **Clientes y pacientes:** Datos correctos, fotos, microchips.
- **Turnos:** Confirmados a tiempo, con recordatorios activos.
- **Internaciones:** Observaciones registradas diariamente mientras el paciente esté internado.
- **Procedimientos:** Cada cirugía con cirujano, anestesiólogo e insumos documentados.
- **Consentimientos:** Generados antes de cada cirugía, eutanasia o acuerdo reproductivo.
- **Caja:** Abierta cada mañana, cerrada cada noche con arqueo.
- **Pet shop:** Stock actualizado, bajo stock vigilado.
- **Deudores:** Revisados regularmente, pagos registrados a tiempo.
- **Staff:** Roles claros, activos cuando corresponde.

Esto es lo que permite que Paula tenga un registro completo, que los clientes no se pierdan turnos, que las deudas estén controladas, y que todo fluya sin caos.

Gracias por mantener el sistema limpio.
