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


#### Notas de la Entrevista:

    Consolidación de plataformas: Se eliminarán páginas web antiguas para centralizar información en una landing page sencilla y funcional.
    Desarrollo de CRM integrado: Se implementará un CRM en tres versiones, centralizando datos de clientes, mascotas, turnos y documentos.
    Historia clínica digital: Se seguirá el método SOAP para registrar información médica, favoreciendo la comunicación con los tutores via WhatsApp.
    Gestión de turnos: Se configurarán duraciones específicas para turnos, implementando auto-confirmaciones para reducir ausencias.
    Facturación electrónica: Se emitirá facturación electrónica con límites por usuario, mejorando el control financiero y evitando problemas fiscales.
    Chatbot automatizado: Se integrará un chatbot para gestionar consultas, agendar turnos y clasificar urgencias eficientemente.


Notes
Integración y Simplificación Digital

El equipo apunta a consolidar múltiples herramientas y sistemas en una única plataforma integrada para optimizar la gestión y reducir la carga operativa (00:01).

    Eliminación de plataformas antiguas y consolidación en landing page (00:01)
        Se busca eliminar las dos páginas web antiguas para centralizar toda la información en una landing page funcional y sencilla.
        La landing page será informativa, mostrando servicios, veterinarios con especialidades, horarios, ubicación y reseñas.
        Se conectará con Google Maps para facilitar la localización y con WhatsApp para la comunicación directa.
        La idea es que el negocio use sólo esta plataforma para evitar dispersión y redundancia.

    Desarrollo y fases del CRM integrado (07:18)
        El CRM se está desarrollando en tres versiones, iniciando con la integración total de datos actuales de GVET, incluyendo clientes, mascotas, turnos y documentos.
        La versión 1 replicará la funcionalidad actual de GVET, para que el equipo empiece a usarlo sin inconvenientes.
        Se planea que el CRM permita manejar roles diferenciados para administración, veterinarios y peluqueros, con accesos y permisos específicos.
        La meta es que el sistema sea una “burbuja única” para turnos, agendas, comunicación y gestión, eliminando la necesidad de usar múltiples herramientas.

    Automatización y conexión con WhatsApp (07:18)
        Se busca conectar el CRM con WhatsApp para que el chatbot pueda gestionar consultas, agendar turnos y enviar recordatorios directamente.
        La integración permitirá enviar informes, resultados y alertas automáticas, disminuyendo la carga manual en veterinarios y administrativos.
        El chatbot responderá preguntas frecuentes y derivará consultas urgentes a veterinarios, mejorando la atención y el filtrado de casos.

    Personalización y control de roles dentro del sistema (16:51)
        Se diseñarán perfiles con permisos específicos para cada rol: veterinarios, administrativos y peluqueros.
        Veterinarios no tendrán acceso a caja o facturación, mientras que administrativos sí controlarán ventas, compras y caja.
        Se implementará auditoría para registrar quién realiza cambios o agrega información, reforzando la trazabilidad.
        Esto busca mejorar la seguridad interna y la eficiencia operativa con controles claros.

Historia Clínica y Flujo Médico Estructurado

Se está diseñando un sistema de historia clínica digital que refleje el flujo profesional veterinario, con estructura clara y soporte para seguimiento (09:25).

    Implementación del método SOAP adaptado (09:25)
        La historia clínica seguirá el método SOAP: subjetivo (lo que informa el dueño), objetivo (observaciones médicas), diagnóstico y plan/tratamiento.
        Se incluirán signos vitales y detalles de cada consulta para un registro clínico completo.
        Se promoverá que los tratamientos se envíen directamente al tutor vía WhatsApp para mejorar la comunicación y evitar errores de interpretación.
        El sistema permitirá adjuntar documentos, ecografías y otros archivos relacionados para facilitar el acceso a estudios.

    Funcionalidades para seguimiento y recordatorios automáticos (01:04:45)
        El sistema podrá generar recordatorios automáticos por WhatsApp y mail para controles, vacunaciones y seguimientos post consulta.
        Se implementará la posibilidad de enviar mensajes de seguimiento para verificar la evolución de cada paciente.
        Se planea que los tratamientos prescritos se trasladen automáticamente a consultas posteriores para facilitar controles continuos.
        Esto busca mejorar la adherencia de los clientes y la calidad del cuidado veterinario.

    Gestión de casos especiales y control de pacientes (21:08)
        Se incluirá una función para marcar mascotas como fallecidas y mantener el historial sin confusión.
        Se permitirá organizar la historia clínica de forma cronológica, con subcategorías para estudios específicos como ecografías o resonancias.
        La estructura permitirá diferenciar tipos de consultas: virtual, a domicilio o en clínica, adaptando el flujo según el contexto.
        Se busca evitar la dispersión de información y facilitar el acceso rápido a datos relevantes.

    Automatización futura con entrada por voz y análisis avanzado (01:30:23)
        A largo plazo se planea incorporar entrada por voz para agilizar el llenado de consultas y sugerencias automáticas para el veterinario.
        Se contempla un sistema de business intelligence para analizar datos de consultas, rentabilidad de servicios y comportamiento de clientes.
        Esto permitirá tomar decisiones estratégicas basadas en información real y mejorar la oferta de servicios.
        También se prevé automatizar pagos online vinculados a las consultas para optimizar la gestión financiera.

Gestión de Turnos, Servicios y Operaciones

La plataforma integrará una agenda con asignación automatizada y control detallado de servicios, tiempos y disponibilidad para mejorar la eficiencia (22:59).

    Calendario y asignación de turnos con duración variable (22:59)
        Se configurarán duraciones específicas para cada tipo de turno, por ejemplo 20 minutos para cardiología, para evitar superposiciones y optimizar agenda.
        Se prevé que la asignación de turnos pueda ser automática o manual, según criterios definidos por administración, como asignar vacunas a ciertos veterinarios.
        El sistema permitirá bloquear horarios para cirugías u otros procedimientos que requieran tiempo extendido, evitando solapamientos.
        Esto reducirá tiempos muertos y mejorará la experiencia tanto para clientes como para el equipo.

    Confirmaciones, recordatorios y gestión de cancelaciones (29:12)
        Se implementarán mensajes automáticos para confirmación de turnos y cobro de seña para reducir no-shows, con un monto accesible sugerido.
        Los recordatorios se enviarán con anticipación de 48 y 24 horas para asegurar compromiso de los clientes.
        Se permitirá modificar o cancelar turnos fácilmente a través del chatbot, manteniendo actualizado el calendario en tiempo real.
        Esto disminuirá la carga administrativa y mejorará la tasa de asistencia.

    Registro y perfil detallado para peluquería canina (01:23:24)
        Se creará un perfil específico para peluqueros con información de comportamiento del perro, uso de bozal, tipo de pelaje y dificultades.
        El peluquero podrá registrar observaciones como presencia de pulgas, tumores o dermatitis con fotos antes y después.
        El sistema permitirá ajustar la duración y precio del servicio según el comportamiento y necesidades del perro.
        Esto profesionalizará la peluquería y mejorará la comunicación con los clientes.

    Material multimedia y comunicación en sala de espera (37:59)
        Se desarrollará una pizarra digital para transmitir videos y mensajes relacionados con servicios en la sala de espera.
        Esto servirá para promocionar especialistas, campañas y educar a los clientes mientras esperan.
        Se aprovecharán contenidos ya existentes en redes sociales para alimentar esta comunicación.
        La iniciativa busca mejorar la percepción del servicio y fidelizar clientes.

Facturación y Control Financiero

Se diseñan controles financieros integrados con seguimiento de facturación, métodos de pago y límites para mantener orden y evitar errores (58:18).

    Facturación electrónica y control de montos por usuario (58:18)
        El sistema emitirá facturas electrónicas tipo A, B o C según necesidad y se integrarán listas de precios actualizadas.
        Se establecerán límites de facturación por usuario para controlar gastos y evitar recategorizaciones fiscales.
        Se notificará cuando un usuario esté cerca de exceder su límite, con alertas visibles en rojo.
        Esto ayudará a mantener la contabilidad en orden y evitará problemas legales o fiscales.

    Métodos de pago y conciliación (59:36)
        Se manejarán pagos en efectivo, transferencia, tarjeta de débito y crédito, y billetera virtual, con registro detallado.
        La conciliación permitirá tener claridad sobre cuánto efectivo y cuánto digital se ha recibido.
        Se vincularán pagos online con las consultas para facilitar el cobro y evitar pérdidas.
        Esto mejorará el control financiero y la transparencia en ingresos.

    Control de deudas y seguimiento de pagos (34:55)
        Se implementará un sistema para registrar deudas y enviar alertas a clientes con pagos pendientes.
        Aunque no se permite crédito habitual, se controla y gestiona la deuda incobrable cuando ocurre.
        Se generarán informes financieros para analizar ingresos, costos y flujo de caja.
        Esto permitirá tener una visión clara del estado financiero y tomar decisiones oportunas.

Chatbot y Atención Automatizada

La incorporación del chatbot busca resolver preguntas frecuentes, gestionar turnos y filtrar emergencias para mejorar la atención al cliente (44:30).

    Chatbot básico en landing page y WhatsApp (44:30)
        El chatbot responderá preguntas comunes sobre horarios, servicios y ubicación, reduciendo la carga de consultas repetitivas.
        Permitirá agendar turnos desde la página web o WhatsApp, integrándose con el sistema de agenda.
        El bot entenderá incluso mensajes con errores ortográficos o de redacción, mejorando la experiencia del usuario.
        Su uso estará orientado a liberar tiempo del personal y agilizar la atención inicial.

    Gestión de urgencias y triage automatizado (39:30)
        El chatbot clasificará mensajes según niveles de urgencia para derivar casos graves a veterinarios rápidamente.
        Consultas no urgentes serán atendidas por el bot, mientras que emergencias serán notificadas al personal humano.
        Se respetará la política de no ofrecer consultas virtuales sin pago previo, limitando respuestas clínicas directas.
        Esto mejora la seguridad y la calidad de la atención, evitando malentendidos y retrasos.

    Optimización de turnos vía chatbot (42:28)
        El chatbot podrá ofrecer automáticamente el primer turno disponible en caso de cancelaciones.
        Permitirá que los clientes busquen y seleccionen horarios según disponibilidad en tiempo real.
        Se implementarán recordatorios para confirmar o modificar turnos, reduciendo ausencias.
        Esto simplifica la experiencia del cliente y mejora la gestión de la agenda.

    Futuras mejoras con integración de voz y multimedia (01:20:19)
        Se contempla integración de reconocimiento de voz para consultas y agendamientos más rápidos.
        El chatbot podrá manejar audios para facilitar la comunicación de clientes con dificultades para escribir.
        Se buscará ampliar funcionalidades para incluir promociones, recordatorios y encuestas de satisfacción.
        Estas mejoras aumentarán la accesibilidad y el engagement con los clientes.

Personalización y Escalabilidad del Sistema

El proyecto prioriza la flexibilidad para adaptarse a necesidades específicas y el crecimiento futuro con nuevas funciones y sucursales (01:27:24).

    Versiones escalonadas y pruebas con usuarios reales (01:28:42)
        Se divide el desarrollo en tres fases progresivas, iniciando con funcionalidades básicas y escalando a automatizaciones avanzadas.
        Se enfatiza probar con casos reales para ajustar y mejorar la plataforma según el uso cotidiano.
        Se espera que la plataforma pueda ser replicada para otros veterinarios, ampliando el mercado potencial.
        Esto genera aprendizaje práctico y asegura que la solución sea efectiva y adaptable.

    Control detallado de inventarios y recepción de productos (01:13:37)
        Se planifica implementar escaneo y registro fotográfico de lotes de productos para mejorar el control de stock.
        Se busca evitar errores en la recepción y registro, que actualmente causan desajustes y pérdidas.
        Se integrará la gestión de vencimientos, precios y cantidades con alertas para renovar stock.
        Esto optimizará la operación de farmacia y pet shop dentro de la veterinaria.

    Adaptación para servicios específicos y perfiles de especialistas (01:07:43)
        La página mostrará perfiles profesionales personalizados, sin usar títulos incorrectos para reflejar la formación real.
        Se incluirán servicios especializados como guardia obstétrica, con acceso restringido y control de pacientes propios.
        Se diseñará contenido para educar al cliente sobre servicios y especialidades, mejorando la información disponible.
        Esto fortalece la imagen profesional y facilita la segmentación de pacientes.

    Soporte para múltiples dispositivos y acceso móvil (18:13)
        El sistema se diseñará para funcionar tanto en computadoras como en celulares, facilitando el acceso del equipo en cualquier lugar.
        Se considerarán limitaciones operativas para ciertos dispositivos, priorizando funcionalidades críticas.
        Se anticipa que la mayoría de la interacción ocurrirá vía WhatsApp móvil, por lo que se optimizará esa experiencia.
        Esto garantiza flexibilidad operacional y mejora la respuesta en campo.


Action items
Nosotros
    Solicitar logo, fotos, dirección, mail, horarios y datos de veterinarios para personalizar la landing page (05:46)
    Cargar y migrar clientes, mascotas, historiales clínicos, turnos y documentos desde GVET al nuevo CRM (08:38)
    Definir estructura y detalles para ficha clínica basada en método SOAP o alternativo adaptado (10:25)
    Incorporar roles y permisos para administración, veterinarios y peluquería según definición, y configurar control de accesos (16:51)
    Definir criterios para asignación automática de turnos a veterinarios, incluyendo duración y tipo de consulta (54:29)
    Elaborar lista de servicios con tiempos estimados por tipo y subcategorías
    Proveer detalles para automatización de vacunación, recordatorios y seguimiento (01:11:00)
    Definir procesos de facturación, métodos de pago y segmentación contable para servicios veterinarios y peluquería (58:18)
    Preparar información para digitalización de inventario recibido mediante foto y código de barras (01:15:18)
    Coordinar estudios con personal de stock y peluquería para adaptar sistema a necesidades específicas (01:27:24)

Paula

    Validar estructura clínica y uso del sistema, proporcionando accesos y credenciales para evaluar GVET y versiones piloto del CRM (27:50)
    Definir contenido y estilo para biografías y perfiles de veterinarios y especialistas (01:07:43)
    Participar en definición de criterios para uso del chatbot y niveles de urgencia para respuestas diferenciadas (38:00)
    Colaborar con el equipo para probar el chatbot, recopilar feedback y ajustar funcionalidades (45:21)
    Informar días y horarios para guardias, vacíos o bloqueos en agenda para optimizar calendario (01:21:48)


