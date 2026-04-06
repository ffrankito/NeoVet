> 📦 **Documento archivado** — Marzo 2026. Escrito cuando el sistema aún no existía, en tono de "esto es lo que podríamos construir". El sistema ya fue construido. Para uso actual con Paula, ver [`Folleto_Comercial.html`](./Folleto_Comercial.html) y [`../NeoVet_Propuesta_Partner_Paula.md`](../NeoVet_Propuesta_Partner_Paula.md).

# Investigación de Software para Veterinarias
### Documento preparado para Paula Silveira — Marzo 2026

Este documento resume qué hace el software que usás hoy (GVet), qué cosas podría hacer un sistema moderno para una veterinaria, y qué hacen otras plataformas en el mundo que nos pueden servir de inspiración para NeoVet.

---

## 1. ¿Qué hace GVet hoy?

GVet es el sistema que usás actualmente para gestionar la clínica. Es un software argentino, accesible desde cualquier dispositivo con internet. A continuación, un resumen de todo lo que ofrece.

### Lo que GVet sí hace bien

**Fichas de clientes y pacientes**
Podés guardar toda la información del dueño (nombre, teléfono, dirección) y del paciente (especie, raza, fecha de nacimiento, microchip). También podés ver el historial clínico completo de cada animal y adjuntar archivos como radiografías o resultados de laboratorio.

**Turnos**
Tiene un calendario para organizar los turnos del día. Se pueden asignar por veterinario, ver el estado de cada turno (confirmado, pendiente, completado) y manda notificaciones a los clientes por WhatsApp como recordatorio.

**Facturación**
Genera facturas electrónicas conectadas directamente a la AFIP, que es lo que se necesita en Argentina para facturar legalmente. También registra pagos y lleva un historial de ventas.

**Stock e inventario**
Controlás los productos que tenés en la clínica (medicamentos, insumos, alimentos), las cantidades disponibles, y podés configurar alertas cuando algo se está por agotar.

**Aplicación móvil**
Tanto el personal como los clientes pueden usar GVet desde el celular. Los dueños tienen una app para ver la ficha de su mascota.

---

### Lo que GVet NO puede hacer (y por qué eso es un problema)

Acá está la parte importante. GVet es útil para el día a día, pero tiene límites grandes:

- **No se puede conectar con nada externo.** No tiene API ni ninguna forma de que otro sistema "hable" con él. Eso significa que es imposible automatizar cosas o conectarlo con un chatbot, por ejemplo.
- **No tiene chatbot ni respuestas automáticas por WhatsApp.** Todo tiene que ser respondido a mano por una persona.
- **No detecta emergencias.** Si un cliente manda un mensaje diciendo "mi perro no respira", el sistema no hace nada especial — depende de que alguien lo vea a tiempo.
- **No tiene WhatsApp bidireccional.** Solo manda recordatorios, pero no puede mantener una conversación real con el cliente.
- **No tiene inteligencia artificial** para ayudar con notas clínicas, resúmenes, ni nada por el estilo.
- **Los datos solo se pueden exportar como Excel**, de forma manual. No hay forma automática de migrar o sincronizar información.

> **En resumen:** GVet cubre las necesidades básicas, pero fue diseñado para trabajar solo, sin integrarse con nada. Por eso NeoVet necesita reemplazarlo y no simplemente "agregarle cosas encima".

---

## 2. ¿Qué podría hacer un sistema moderno para una veterinaria?

Acá listamos todo lo que un sistema completo podría ofrecer. Algunas cosas son para hacer desde el primer día (**v1**), otras son para una segunda etapa cuando el sistema esté andando bien (**v2**), y otras son mejoras avanzadas para más adelante (**v3**).

---

### Gestión de clientes y pacientes
- Ficha completa del dueño con datos de contacto y canal de comunicación preferido *(v1)*
- Ficha del paciente con especie, raza, fecha de nacimiento, peso, microchip *(v1)*
- Un dueño puede tener varios pacientes asociados *(v1)*
- Foto del paciente para reconocerlo rápido *(v1)*
- Historial clínico ordenado por fecha *(v1)*
- Posibilidad de adjuntar análisis, radiografías y documentos *(v1)*
- Marcar un paciente como fallecido sin perder el historial *(v1)*
- Importar los datos actuales de GVet desde un Excel *(v1)*

### Turnos y agenda
- Calendario con vista diaria, semanal y mensual *(v1)*
- Diferentes tipos de turno: consulta, cirugía, vacunación, etc. *(v1)*
- Estado del turno: reservado → confirmado → en sala → dado de alta *(v1)*
- Recordatorios automáticos por WhatsApp 24hs y 1hs antes del turno *(v2)*
- Los clientes pueden sacar turno solos por el chatbot o por la web *(v2)*
- Lista de espera cuando no hay turnos disponibles *(v2)*
- Seguimiento de ausencias (cuando el cliente no viene) *(v2)*
- Turnos para internación o peluquería *(v3)*

### Historia clínica
- Notas de la consulta organizadas por: qué dice el dueño, lo que examinó el vet, el diagnóstico y el tratamiento *(v1)*
- Registro de signos vitales: peso, temperatura, frecuencia cardíaca *(v1)*
- Plan de vacunación y antiparasitarios con fechas y recordatorios *(v1)*
- Recetas médicas *(v2)*
- Resultados de laboratorio adjuntos *(v2)*
- Resúmenes de alta automáticos para el dueño *(v2)*
- Fichas de anestesia para cirugías *(v2)*
- Dictado por voz con inteligencia artificial que completa la historia clínica sola *(v3)*

### Comunicación con los clientes
- WhatsApp de ida y vuelta con los clientes *(v2)*
- Recordatorios automáticos cuando se acercan las vacunas o los antiparasitarios *(v2)*
- Confirmación automática cuando se saca un turno *(v2)*
- Mensaje de seguimiento un día después de la consulta *(v2)*
- Mensajes de cumpleaños de la mascota *(v3)*
- Envíos masivos para avisar novedades de la clínica (ej. horarios de feriado) *(v3)*
- Encuestas de satisfacción después de la consulta *(v3)*
- **Chatbot que responde preguntas frecuentes** (precios, horarios, dirección) y permite sacar turnos *(v1 — chatbot)*
- **Sistema de emergencias:** si alguien escribe palabras como "convulsión", "no respira" o "atropellado", el chatbot lo detecta al instante y manda el número de emergencia *(v1 — chatbot)*

### Facturación y finanzas
- Facturas por consulta o servicio *(v1)*
- Integración con AFIP para factura electrónica *(v1)*
- Registro de pagos (efectivo, tarjeta, transferencia) *(v1)*
- Ver cuánto se debe y hacer seguimiento *(v1)*
- Informes de ingresos por período, veterinario o tipo de servicio *(v2)*
- Cobro online por link o QR *(v3)*

### Stock y farmacia
- Catálogo de productos con precios *(v1)*
- Control de stock con alertas de bajo nivel *(v1)*
- Gestión de proveedores *(v1)*
- Descuento automático de stock cuando se usa un producto en una consulta *(v2)*
- Control de vencimientos *(v2)*
- Órdenes de compra *(v2)*

### Personal y operaciones
- Perfiles del personal con roles (veterinario, recepcionista) *(v1)*
- Cada rol ve solo lo que necesita ver *(v1)*
- Registro de quién hizo cada cambio y cuándo *(v2)*
- Pizarra digital con el estado de todos los pacientes en tiempo real *(v2)*

---

## 3. ¿Qué hacen otros sistemas en el mundo?

Acá repasamos los sistemas más usados en veterinarias de otros países, para entender qué hacen bien y qué podemos tomar como inspiración.

---

### ezyVet
**País de uso principal:** Nueva Zelanda, EE.UU., Europa
**Para qué tipo de clínica:** Clínicas grandes o con varias sedes

Es uno de los sistemas más completos del mercado. Lo que más lo diferencia es que cuando el veterinario carga un tratamiento en la consulta, la factura se genera sola en tiempo real, sin tener que cargar los datos dos veces. También tiene un portal donde los clientes pueden sacar turno online directamente.

---

### Digitail
**País de uso principal:** EE.UU., Europa
**Para qué tipo de clínica:** Clínicas modernas que quieren usar inteligencia artificial

Es el más innovador del momento. El veterinario puede dictar la consulta por voz y la inteligencia artificial completa automáticamente la historia clínica. También tiene videollamadas con los dueños y una app para que los clientes vean la ficha de su mascota y le escriban al equipo de la clínica.

---

### Provet Cloud
**País de uso principal:** Europa, Australia
**Para qué tipo de clínica:** Todo tipo de clínicas

Muy fácil de usar y con buen soporte local. Tiene una pizarra digital para que todo el equipo vea en tiempo real qué pacientes están en la clínica y en qué estado están. También tiene buenas herramientas de análisis de negocio (cuántos turnos hubo, cuánto se facturó, etc.).

---

### PetDesk
**País de uso principal:** EE.UU.
**Para qué tipo de clínica:** Cualquier clínica que quiera reducir llamados telefónicos

No es un sistema completo de gestión, sino una capa de comunicación con los clientes. Manda recordatorios automáticos, permite turnos online y los clientes pueden pedir renovación de recetas desde la app. Las clínicas que lo usan reportan un 50% menos de llamados telefónicos.

---

### Aurora Inbox / Chatbots para veterinarias
**País de uso principal:** EE.UU., Europa
**Para qué tipo de clínica:** Clínicas que quieren automatizar WhatsApp

Son plataformas que ponen un chatbot sobre WhatsApp para responder preguntas frecuentes, confirmar turnos y detectar emergencias por palabras clave. Es exactamente lo que el chatbot de NeoVet va a hacer, pero adaptado a Argentina y a las razas braquicéfalas.

---

## 4. Conclusión: ¿Por qué NeoVet?

Ninguno de los sistemas que existen en el mercado sirve exactamente para lo que necesita la clínica:

- Ninguno tiene integración con WhatsApp + chatbot + facturación AFIP + un sistema de emergencias para razas braquicéfalas, todo junto y en un solo producto pensado para Argentina.
- GVet cubre lo básico pero no puede crecer ni conectarse con nada.
- Los sistemas internacionales son muy potentes pero no están adaptados al mercado argentino, no tienen AFIP, y el soporte es en inglés.

**NeoVet nace para cubrir exactamente ese espacio:** un sistema hecho a medida para la clínica, que empieza simple y puede crecer con el tiempo, sin depender de herramientas que no se pueden integrar entre sí.
