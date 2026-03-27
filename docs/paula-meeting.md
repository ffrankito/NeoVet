# Reunión con Paula — Preguntas y Temas Pendientes

> Fuente única de verdad para todo lo que necesitamos resolver con Paula antes de avanzar.
> Agregar preguntas aquí a medida que surjan durante el desarrollo.

---

## Estado

| Reunión | Fecha | Estado |
|---|---|---|
| Reunión 1 — Landing + CRM | Por confirmar | Pendiente |

---

## 🔴 Bloqueantes (no podemos avanzar sin esto)

### CRM — Estrategia de transición

- [ ] **Corte o paralelo** — ¿Está dispuesta a usar NeoVet y GVet en paralelo durante algunas semanas (NeoVet para turnos nuevos, GVet para facturación), o prefiere un corte limpio donde NeoVet lo reemplaza todo de una vez?
- [ ] **Facturación en día 1** — ¿Necesita poder emitir facturas electrónicas (AFIP) desde NeoVet desde el primer día, o puede seguir usando GVet para facturar temporalmente mientras construimos esa funcionalidad?

### CRM — Migración de datos

- [ ] **Exportación de GVet** — Confirmar que puede exportar: clientes, pacientes, historial de turnos. ¿Hay otros datos críticos que exportar? (e.g., historial clínico, stock)
- [ ] **Prioridad de migración** — ¿Qué datos son más urgentes? ¿Clientes + pacientes activos, o también el historial completo de turnos pasados?

### Landing — Datos básicos

- [ ] **Dirección actual** — Se mudaron de Morrow 4100. ¿Cuál es la nueva dirección?
- [ ] **Teléfono / WhatsApp** — ¿Sigue siendo 3413101194?
- [ ] **Email** — ¿Sigue siendo veterinarianeo@gmail.com?
- [ ] **Horarios de atención** — ¿Siguen siendo Lunes-Sábado 9:30-12:30 / 16:30-20:00? ¿Domingo cerrado?
- [ ] **Nombre de la clínica** — ¿Sigue siendo "NeoVet — Centro Reproductivo Canino Veterinario" o cambió?
- [ ] **Apellido correcto** — "Silveyra" (sitio viejo) vs "Silveira" (docs internos) — ¿cuál es el correcto?

---

## 🟡 Importantes (impactan el diseño del producto)

### CRM — Flujo de trabajo diario

- [ ] **¿Quién usa el CRM?** — ¿Solo Paula, o también recepcionistas y otros veterinarios? ¿Cuántas personas en total?
- [ ] **Roles y accesos** — ¿Necesita que recepcionistas vean todo, o hay información (ej. notas clínicas) que solo debería ver la veterinaria?
- [ ] **Tipos de turno** — ¿Qué tipos de turnos maneja? (consulta general, cirugía, vacunación, peluquería, guardia, etc.) ¿Tienen duraciones distintas?
- [ ] **Historial clínico** — ¿Cómo registra actualmente las consultas? ¿Notas libres, o tiene una estructura fija (síntomas, diagnóstico, tratamiento)?

### CRM — Facturación

- [ ] **Frecuencia de facturación** — ¿Factura en cada consulta, o solo a pedido del cliente?
- [ ] **Tipos de comprobante** — ¿Emite facturas A, B, C? ¿Tiene monotributo o responsable inscripto?
- [ ] **Forma de cobro** — ¿Efectivo, transferencia, tarjeta? ¿Usa MercadoPago?

### Landing — Contenido

- [ ] **Lista de servicios** — Confirmar los servicios actuales. ¿Agregar o quitar alguno?
  - Cirugía General
  - Consultas Reproductivas
  - Pet Shop y Farmacia
  - Cardiología
  - Peluquería Canina
  - Vacunación y Desparasitación
  - Veterinaria a Domicilio
- [ ] **Biografía de Paula** — ¿Reescribir, pulir la del sitio anterior, o redactar una nueva?
- [ ] **Sección de especialistas** — ¿Hay otros veterinarios o personal para listar?
- [ ] **Información de emergencia** — ¿Se sigue ofreciendo guardia obstétrica? ¿Otros servicios de urgencia?

---

## 🟢 Deseables (se pueden resolver después)

### CRM

- [ ] **Archivo vs. eliminación** — Cuando se "borra" un cliente o paciente, ¿prefiere que quede archivado (recuperable) o eliminado definitivamente?
- [ ] **Stock e inventario** — ¿Gestiona el stock de medicamentos y productos desde GVet? ¿Es importante tener eso en NeoVet desde el inicio?
- [ ] **Recordatorios automáticos** — ¿Le gustaría que el sistema envíe recordatorios de turno por WhatsApp automáticamente? (esto es v2, pero importante para priorizar)
- [ ] **Vacunación / desparasitación** — ¿Lleva un registro de próximas vacunas por paciente? ¿Le parece útil que el sistema genere alertas?

### Landing

- [ ] **Logo** — ¿Tienen un archivo de logo? ¿En qué formato? (SVG es lo ideal)
- [ ] **Preferencias de color** — ¿Hay colores de marca existentes que respetar, o definimos nosotros?
- [ ] **Fotos** — Exterior/interior de la clínica, fotos del equipo, fotos de mascotas para la galería
- [ ] **Testimonios** — ¿Mantener los 3 del sitio anterior? ¿Quiere agregar nuevos?
- [ ] **Redes sociales** — ¿Instagram, Facebook u otros links para incluir?
- [ ] **Dominio** — ¿En qué dominio va a vivir la nueva landing?
- [ ] **Mapa de Google** — Confirmar la nueva dirección para embeber el mapa
- [ ] **Palabras clave para SEO** — ¿Qué buscan los clientes? ("veterinaria rosario", "bulldog veterinario", etc.)
- [ ] **Titular / eslogan** — El placeholder actual es: "Cuidamos a tu mascota como parte de nuestra familia" — ¿se mantiene?

---

## Notas de contexto

- El CRM actual (GVet / Geovet) no tiene API — la única migración posible es por exportación manual de Excel.
- La landing anterior (neovet.netlify.app) fue hecha por Brandon Acosta, quien dejó de responderle a Paula. Estamos reconstruyendo desde cero.
- Todo el texto visible para el usuario está en español argentino.
- WhatsApp es el canal principal de comunicación con clientes.
