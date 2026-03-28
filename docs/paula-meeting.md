# Reunión con Paula — Preparación y Temas Pendientes

> Documento de trabajo para la reunión con Paula. Actualizar después de cada encuentro.

---

## Estado

| Reunión | Fecha | Estado |
|---|---|---|
| Reunión 1 — CRM: avance y preguntas | Por confirmar | Pendiente |

---

## ¿Dónde estamos?

Ya tenés un sistema funcionando. Esto es lo que podés hacer hoy:

**Clientes y pacientes**
Todos los datos que tenías en GVet ya están cargados — 1.771 clientes y 1.380 pacientes migrados. Podés buscar cualquier cliente, ver sus pacientes y editar la información desde la web.

**Turnos**
El sistema tiene un calendario de turnos. Desde el dashboard del día podés ver qué turnos hay, confirmarlos, marcarlos como completados y registrar una consulta directamente desde ahí.

**Historia clínica**
Cada paciente tiene ahora una ficha clínica completa:
- Podés registrar consultas con notas estructuradas (Subjetivo / Objetivo / Diagnóstico / Plan) y signos vitales (peso, temperatura, frecuencia cardíaca y respiratoria).
- Cada consulta tiene su lista de ítems de tratamiento, con estado (pendiente / en curso / completado).
- Registro de vacunas y desparasitaciones por paciente, con fechas y próximas aplicaciones.
- Carga de documentos adjuntos (radiografías, estudios, etc.).
- La página del paciente está organizada en pestañas: Información, Historia clínica, Vacunas, Desparasitaciones y Documentos.
- Podés marcar un paciente como fallecido y subir una foto de perfil.

**Lo que viene**
Las dos fases grandes que siguen son: facturación (conexión con AFIP) y control de acceso por roles (para que cada persona del equipo tenga su propio usuario). Necesitamos tu input para arrancar con esas.

---

## Lo que necesitamos de vos

---

### Bloqueantes — sin esto no podemos seguir

Estas preguntas frenan el desarrollo de las próximas fases. Cuanto antes las tengamos, mejor.

**Facturación (Fase D)**

- [ ] **¿Facturación desde el día 1?** — ¿Necesitás poder emitir facturas electrónicas (AFIP) desde NeoVet desde el primer momento que lo empezás a usar, o podés seguir facturando por GVet un tiempo más mientras lo construimos?
- [ ] **¿Facturás en cada consulta o solo a pedido?** — ¿Cómo es el flujo habitual? ¿El cliente siempre pide factura, o es algo ocasional?
- [ ] **¿Qué tipo de comprobante emitís?** — ¿Factura A, B, C? ¿Monotributo o responsable inscripto?
- [ ] **¿Cómo cobran?** — ¿Efectivo, transferencia, tarjeta? ¿Usás MercadoPago?

**Equipo y accesos (Fase E)**

- [ ] **¿Quiénes van a usar el sistema?** — ¿Solo vos, o también recepcionistas u otros veterinarios? ¿Cuántas personas en total?
- [ ] **¿Qué puede ver cada uno?** — ¿Las recepcionistas necesitan ver la historia clínica, o solo los turnos y datos de contacto? ¿Hay información que solo debería ver la veterinaria?

**Transición desde GVet**

- [ ] **¿Corte o paralelo?** — ¿Estás dispuesta a usar NeoVet y GVet en paralelo durante un tiempo (NeoVet para turnos nuevos, GVet para facturar hasta que lo tengamos listo), o preferís un reemplazo total de una sola vez?

**Landing — Datos de contacto**

- [ ] **Dirección** — Se mudaron de Morrow 4100. ¿Cuál es la nueva dirección?
- [ ] **Teléfono / WhatsApp** — ¿Sigue siendo 3413101194?
- [ ] **Email** — ¿Sigue siendo veterinarianeo@gmail.com?
- [ ] **Horarios** — ¿Siguen siendo Lunes-Sábado 9:30-12:30 / 16:30-20:00? ¿Domingo cerrado?
- [ ] **Apellido correcto** — En el sitio viejo figura "Silveyra", en los documentos internos usamos "Silveira". ¿Cuál es el correcto?

---

### Importantes — impactan el diseño del sistema

Estas preguntas afectan cómo funciona la historia clínica y los flujos de trabajo. No bloquean la siguiente fase, pero sí cómo se va a sentir el sistema cuando lo uses.

**Historia clínica — Formulario de consulta**

- [ ] **¿Los campos SOAP te sirven?** — El formulario tiene cuatro secciones: Subjetivo, Objetivo, Diagnóstico y Plan. ¿Te resultan útiles con esos nombres, o preferís etiquetas distintas?
- [ ] **¿Las notas libres siempre visibles?** — Además del SOAP, hay un campo de notas libres. ¿Preferís que siempre aparezca junto al SOAP, o que sea una opción alternativa cuando no usás la estructura?
- [ ] **¿Registrás frecuencia cardíaca y respiratoria de rutina?** — Ahora el formulario tiene campos para FC y FR además de peso y temperatura. ¿Los usás en todas las consultas, o solo en casos puntuales?

**Historia clínica — Tratamientos**

- [ ] **¿Los ítems de tratamiento pasan a la siguiente consulta?** — Cuando una consulta termina y quedan ítems pendientes, ¿querés que aparezcan automáticamente en la próxima consulta de ese paciente, o cada lista es independiente?

**Historia clínica — Turnos**

- [ ] **¿Completar el turno al registrar una consulta?** — Si registrás una consulta vinculada a un turno, ¿el turno debería marcarse como "completado" automáticamente, o preferís hacerlo a mano?

**Historia clínica — Pacientes**

- [ ] **¿"Fallecido" alcanza o necesitás "inactivo"?** — Ahora podés marcar un paciente como fallecido. ¿Hay pacientes que no fallecieron pero dejaron de venir y querés distinguirlos de los activos? Por ejemplo: un paciente que se mudó o un cliente que no volvió.

**Landing — Contenido**

- [ ] **Lista de servicios** — ¿Están bien los servicios actuales, o hay que agregar o sacar alguno?
  - Cirugía General
  - Consultas Reproductivas
  - Pet Shop y Farmacia
  - Cardiología
  - Peluquería Canina
  - Vacunación y Desparasitación
  - Veterinaria a Domicilio
- [ ] **Biografía** — ¿Reescribimos, usamos la del sitio anterior, o redactamos una nueva?
- [ ] **¿Hay otros veterinarios o personal para listar?**
- [ ] **Guardia obstétrica** — ¿Se sigue ofreciendo? ¿Hay otros servicios de urgencia para mencionar?

---

### Deseables — pueden esperar

Estas preguntas no bloquean nada ahora, pero las vamos a necesitar en algún momento.

**Sistema**

- [ ] **¿Cómo querés que funcione la vacunación automática?** — Hay registro de vacunas con fecha del próximo refuerzo. ¿Seguís un esquema estándar donde el sistema podría calcular esa fecha solo, o cada vacuna tiene su propio cronograma?
- [ ] **¿Qué archivos y tamaño necesitás para documentos clínicos?** — ¿Subís solo PDFs y fotos, o también videos? ¿Hay un límite de peso que te parezca razonable?
- [ ] **¿Qué pasa cuando "borrás" un cliente o paciente?** — ¿Preferís que quede archivado (recuperable) o eliminado definitivamente?
- [ ] **Stock e inventario** — ¿Gestionás el stock de medicamentos y productos desde GVet? ¿Es algo que necesitás en NeoVet, o puede esperar?
- [ ] **Recordatorios automáticos por WhatsApp** — ¿Te gustaría que el sistema mande un mensaje automático al cliente recordándole el turno? (esto va en una etapa posterior, pero sirve saber si lo priorizamos)

**Landing**

- [ ] **Logo** — ¿Tienen un archivo de logo? (SVG es lo ideal)
- [ ] **Colores** — ¿Hay colores de marca que respetar, o lo definimos nosotros?
- [ ] **Fotos** — Exterior/interior de la clínica, fotos del equipo, fotos de mascotas
- [ ] **Testimonios** — ¿Mantenemos los del sitio anterior? ¿Querés agregar nuevos?
- [ ] **Redes sociales** — ¿Instagram, Facebook u otros links para incluir?
- [ ] **Dominio** — ¿En qué dominio va a vivir el nuevo sitio?
- [ ] **Titular / eslogan** — El placeholder actual es: "Cuidamos a tu mascota como parte de nuestra familia". ¿Lo mantenemos?

---

## Notas de contexto

- GVet no tiene API. La migración de datos fue una exportación manual de Excel, ya completada (1.771 clientes, 1.380 pacientes).
- La landing anterior (neovet.netlify.app) fue hecha por Brandon Acosta. Estamos reconstruyendo desde cero.
- WhatsApp es el canal principal de comunicación con clientes. El chatbot (v2) va a integrarse ahí.
- Todo el texto visible para el usuario está en español argentino.
