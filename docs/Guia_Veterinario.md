# Guía para Veterinarios — NeoVet

Hola. Te escribo porque necesito que registres cada consulta en el sistema. No es un formulario más que llenar — es el historial clínico del paciente. Si el próximo veterinario de la clínica (o vos mismo en tres meses) necesita saber qué pasó con una mascota, va a buscar acá. Gracias por ser riguroso.

---

## 1. Acceso

**URL:** `https://neovet.veterinaria.ar`

**Login:**
- Ingresá con tu email y contraseña
- El sistema funciona en desktop y mobile — podés usar el celular en la clínica

**Permisos:**
- Tenés acceso a pacientes y su historial clínico
- Solo ves los turnos asignados a vos (aunque podés buscar cualquier paciente si es necesario)
- No podés editar caja, staff, ni configuración — eso es tarea de admin

---

## 2. El Dashboard

Cuando ingresás, ves **"Tus turnos de hoy"** — solo los que están asignados a vos, ordenados por hora.

### Leer un Turno
- **Paciente:** Nombre de la mascota
- **Cliente:** Nombre del dueño (nombre y teléfono)
- **Hora:** A qué hora está programado
- **Servicio:** Qué tipo de consulta es (ej: "Revisación", "Cirugía", "Seguimiento")
- **Estado:** Por confirmar / Confirmado / Completado / No se presentó

### Resumen del Paciente (en la tarjeta del turno)
Ves un mini-resumen:
- Edad del paciente
- Última consulta: fecha y motivo
- Vacunas vencidas (si las hay)
- Alerta braquicéfalo (si es un bulldog u otra raza de riesgo)

💡 **Por qué importa:** Ese resumen te prepara. Si ves una alerta, sabés que hay riesgo respiratorio. Si hay vacunas vencidas, podés ofrecerlas en esta cita.

---

## 3. Buscar un Paciente

### Opción 1: Desde el Menú
- Hacé clic en "Pacientes" en la navegación
- Usá el buscador (arriba) — escribí el nombre del paciente o del cliente
- Hacé clic en el resultado para abrir la ficha

### Opción 2: Desde un Turno
- En el dashboard, hacé clic en el paciente/cliente del turno
- Te lleva a la ficha del paciente

---

## 4. Ver la Ficha del Paciente

Abrí la ficha. Verás varios tabs:

### Tab "Información"
- Datos del paciente: nombre, raza, sexo, edad, microchip, foto
- Cliente asociado: nombre, teléfono, email
- Notas (si admin las escribió)
- Fecha de última consulta

### Tab "Historia Clínica"
Acá está el corazón. Es la lista de todas las consultas registradas.

**Cómo leer una consulta:**
- Fecha y hora
- Veterinario que atendió
- **SOAP:**
  - **S (Subjetivo):** Motivo de consulta — lo que el dueño cuenta ("Tiene tos", "No come bien")
  - **O (Objetivo):** Hallazgos — lo que vos encontraste (FC, FR, temperatura, palpación, auscultación)
  - **A (Evaluación):** Diagnóstico o impresión clínica
  - **P (Plan):** Tratamiento, medicamentos, seguimiento

**Para leer una consulta anterior:**
- Hacé clic en la consulta
- Se expande mostrando todos los detalles
- Ves tratamientos, métodos complementarios (eco, análisis), documentos

⚠️ **Importante:** Cada registro que ves es trabajo previo. Úsalo como contexto para esta consulta.

### Tab "Vacunas"
- Historial: qué vacunas se aplicaron, cuándo, próxima dosis esperada
- Próximas vacunas: cuáles vencen pronto
- El sistema envía recordatorio al cliente 7 días antes de la próxima dosis (automático)

### Tab "Desparasitaciones"
- Historial de desparasitantes aplicados, fechas, próxima dosis

### Tab "Documentos"
- Análisis de laboratorio, radiografías, ecografías — archivos subidos
- Cada documento se descarga con un link firmado (válido 60 segundos, privado)

### Tab "Peluquería"
- Historial de sesiones de grooming
- Hallazgos clínicos registrados por el peluquero (nódulos, parasitosis, heridas, etc.)
- Perfil de grooming: nivel de comportamiento, tipo de pelaje, dificultades

💡 **Por qué importa:** El peluquero es los ojos de la clínica. Si encontró un nódulo, sangrado, o sospecha de otitis, eso está aquí. Revisalo.

---

## 5. Completar un Turno / Registrar una Consulta

Este es el momento donde registras qué hiciste y qué encontraste.

### Abrir el Formulario de Consulta
- Desde el turno, hacé clic en "Completar" o "Registrar consulta"
- Se abre un formulario de varias secciones

### Paso 1: Tipo de Consulta
- **Clínica:** Consulta presencial en la clínica
- **Virtual:** Videollamada
- **Domicilio:** Visitaste al cliente en su casa

### Paso 2: SOAP (Lo más importante)

**Subjetivo (S):**
- ¿Cuál fue el motivo de consulta? ¿Qué dice el dueño?
- Ej: "Tose hace 3 días. Le cuesta respirar después de jugar."

**Objetivo (O):**
- Hallazgos físicos: peso, temperatura, FC, FR
- Palpación, auscultación, inspección
- Ej: "Peso: 28 kg. Temp: 38.5°C. FC: 95 bpm, FR: 25 rpm. Estertores bilaterales a la auscultación."

**Evaluación (A):**
- Tu diagnóstico o impresión clínica
- Ej: "Probable traqueobronquitis infecciosa. Descartar EPI."

**Plan (P):**
- Qué vas a hacer ahora
- Medicamentos, dosis, duración
- Estudios complementarios
- Seguimiento
- Ej: "Iniciar amoxicilina 500 mg c/8h x 7 días. Reposo. Volver en 3 días si persiste. Considerar radiografía torácica si no mejora."

### Paso 3: Signos Vitales
- Peso (kg)
- Temperatura (°C)
- Frecuencia cardíaca (bpm)
- Frecuencia respiratoria (rpm)
- Notas adicionales (hidratación, mucosas, estado general, etc.)

### Paso 4: Agregar Tratamiento
- Botón "+ Agregar medicamento/tratamiento"
- **Medicamento:** Nombre (ej: "Amoxicilina")
- **Dosis:** Cantidad + unidad (ej: "500 mg")
- **Frecuencia:** Cada cuántas horas (ej: "Cada 8 horas")
- **Duración:** Días (ej: "7 días")
- **Estado:** Pendiente / Activo / Completado
- Podés agregar múltiples medicamentos en la misma consulta

### Paso 5: Métodos Complementarios
- Botón "+ Agregar método complementario"
- **Tipo:** Ecografía / Radiografía / Análisis / Otro
- **Descripción:** Qué se hizo (ej: "Eco abdominal")
- **Hallazgos:** Resultados (ej: "Hígado normal, sin líquido libre")
- **Fotos/Documentos:** Podés subir imágenes de estudios
- Guardá

### Paso 6: Guardar la Consulta
- Hacé clic en "Guardar"
- La consulta queda registrada en el historial del paciente

⚠️ **Importante:** Una vez que guardas, la consulta está en el sistema para siempre. Verificá que todo esté correcto antes de guardar. Si necesitás editar después, podés — pero mejor hacerlo bien a la primera.

---

## 6. Registrar Vacunas

Cuando aplicás una vacuna en una consulta.

**Dentro del formulario de consulta:**
- Sección "Vacunas"
- Botón "+ Agregar vacuna"
- **Nombre:** Qué vacuna (ej: "Quíntuple", "Rabia")
- **Fecha:** Cuándo se aplicó (hoy por defecto)
- **Próxima dosis:** Cuándo debería venir de nuevo (ej: "30 días", "1 año")
- **Notas:** Lote, contraindicaciones (opcional)
- Guardá

**El sistema automáticamente:**
- Registra la vacuna en el historial del paciente
- Calcula la próxima dosis
- 7 días antes de esa fecha, envía un recordatorio al cliente por email

💡 **Por qué importa:** Las vacunas son críticas, pero los dueños olvidan. Si las registrás, el sistema no olvida.

---

## 7. Registrar Desparasitaciones

Similar a las vacunas.

**Dentro del formulario de consulta:**
- Sección "Desparasitaciones"
- Botón "+ Agregar"
- **Producto:** Nombre del desparasitante (ej: "Ivermectina")
- **Fecha:** Cuándo se aplicó
- **Próxima dosis:** Cuándo se repite (ej: "30 días")
- **Notas:** Dosis, vía de administración (opcional)
- Guardá

---

## 8. Subir Documentos

Análisis de laboratorio, radiografías, ecografías.

**Dentro del formulario de consulta:**
- Sección "Documentos"
- Botón "+ Agregar documento"
- **Categoría:** Laboratorio / Radiografía / Ecografía / Foto / Otro
- **Descripción:** Qué es (ej: "Hemograma - Laboratorio XYZ")
- **Archivo:** Subí la imagen/PDF
- **Notas:** Resultados o interpretación (opcional)
- Guardá

**El documento se guarda de forma segura:**
- Solo vos y otros staff de la clínica podéis verlo
- Acceso con link firmado (válido 60 segundos)
- Queda en el historial del paciente para siempre

---

## 9. Agendar Seguimiento

Después de completar una consulta, podés agendar automáticamente el próximo turno del paciente.

**Desde la consulta completada:**
- Botón "Agendar seguimiento"
- Se abre el formulario de nuevo turno
- **Cliente:** Se completa automáticamente
- **Paciente:** Se completa automáticamente
- **Motivo:** Se pre-llena con "Seguimiento de [diagnóstico anterior]" — podés editarlo
- **Fecha/Hora:** Vos elegís cuándo
- **Profesional:** Vos u otro veterinario
- Completá y guardá

**Por qué es importante:**
- El seguimiento queda registrado como turno en el sistema — no depende de una nota en papel
- El cliente recibe recordatorio automático
- Paula puede ver que está agendado
- Si el dueño se olvida, el sistema lo avisa

---

## 10. Por Qué Registrar Todo — La Perspectiva de Paula

Soy Paula. Necesito que registres cada consulta por varias razones:

**Continuidad clínica:** Si Romeo (el bulldog del cliente) viene con una herida infectada, yo o cualquier otro vet de la clínica debería poder abrir su ficha y saber: "Ah, hace 2 meses tuvo una cirugía, le pusieron puntos de absorción, no volvió al seguimiento." Eso cambia la decisión clínica.

**Responsabilidad legal:** Si pasa algo y el cliente cuestiona qué se hizo en la consulta anterior, yo tengo el registro. Si no está escrito, no pasó.

**Información para el equipo:** Si el peluquero encuentra un nódulo, el vet de turno lo ve. Si el vet diagnostica otitis, yo puedo decirle al peluquero "revisá los oídos en la próxima sesión." Todo esto requiere que esté registrado.

**Automatización futura:** Los recordatorios de vacunas, los seguimientos — todo depende de que vosotros registréis completo. Si falta información, el sistema no puede ayudar.

---

## Resumen

Tu rol acá es **clínico y administrativo a la vez:**

1. **Leé el historial del paciente** antes de cada consulta.
2. **Registrá SOAP completo** — motivo, hallazgos, diagnóstico, plan.
3. **Cargá signos vitales, medicamentos, vacunas** — todo en el mismo lugar.
4. **Subí documentos** — análisis, radiografías, fotos.
5. **Agendá seguimientos** — no dependa de un papel perdido.
6. **Completá el turno** — así Paula sabe que lo atendiste.

Es lo que permite que el equipo trabaje unificado. Gracias.
