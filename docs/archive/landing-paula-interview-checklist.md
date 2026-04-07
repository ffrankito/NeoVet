# Entrevista con Paula — Checklist para la Landing Page

> ⚠️ **Este archivo fue reemplazado.** La fuente única de verdad para la reunión con Paula está en [`docs/paula-meeting.md`](../../docs/paula-meeting.md) en la raíz del monorepo. Ese archivo incluye tanto las preguntas de la landing como las del CRM.
>
> No agregar preguntas aquí — usar el archivo raíz.

---

## ❗ Críticos (bloquean el reemplazo de contenido — Fase 4)

- [ ] **Dirección actual** — Se mudaron de Morrow 4100. ¿Cuál es la nueva dirección?
- [ ] **Teléfono / WhatsApp** — ¿Sigue siendo 3413101194?
- [ ] **Email** — ¿Sigue siendo veterinarianeo@gmail.com?
- [ ] **Horarios de atención** — ¿Siguen siendo Lunes-Sábado 9:30-12:30 / 16:30-20:00? ¿Domingo cerrado?
- [ ] **Lista de servicios** — Confirmar los servicios actuales. ¿Agregar o quitar alguno de esta lista?
  - Cirugía General
  - Consultas Reproductivas
  - Pet Shop y Farmacia
  - Cardiología
  - Peluquería Canina
  - Vacunación y Desparasitación
  - Veterinaria a Domicilio
- [ ] **Biografía de Paula** — ¿Reescribir, pulir la del sitio anterior, o redactar una nueva?
- [ ] **Nombre de la clínica** — ¿Sigue siendo "NeoVet — Centro Reproductivo Canino Veterinario" o cambió?
- [ ] **Apellido correcto** — "Silveyra" (sitio viejo) vs "Silveira" (docs internos) — ¿cuál es el correcto?

## 📌 Decisiones técnicas (necesitan input de Paula)

- [ ] **Formulario de contacto — destino de los envíos** — El formulario de contacto está armado pero no envía a ningún lado. Opciones para decidir:
  - **Opción A: Email (Resend)** — Los envíos llegan como email a la casilla de la clínica. Requiere agregar una función serverless en Vercel. Ya usamos Resend en el CRM.
  - **Opción B: Formspree** — Servicio externo gratuito (50 envíos/mes) que reenvía a email. Cero código backend, se implementa en 5 minutos.
  - **Opción C: WhatsApp** — El formulario arma un mensaje de WhatsApp con los datos y lo abre. El usuario tiene que enviar manualmente. Sin dependencias externas.
  - **Pregunta para Paula:** ¿Prefiere recibir las consultas por email, por WhatsApp, o ambos? ¿Cuántas consultas estima por mes?

## 📌 Importantes (se pueden publicar con placeholders)

- [ ] **Logo** — ¿Tienen un archivo de logo? ¿En qué formato? (SVG es lo ideal)
- [ ] **Preferencias de color** — ¿Hay colores de marca existentes que respetar, o definimos nosotros?
- [ ] **Fotos** — Exterior/interior de la clínica, fotos del equipo, fotos de mascotas para la galería
- [ ] **Testimonios** — ¿Mantener los 3 del sitio anterior? ¿Quiere agregar nuevos?
- [ ] **Sección de especialistas** — ¿Hay otros veterinarios o personal para listar?
- [ ] **Información de emergencia** — ¿Se sigue ofreciendo guardia obstétrica? ¿Otros servicios de urgencia?
- [ ] **Redes sociales** — ¿Instagram, Facebook u otros links para incluir?
- [ ] **Dominio** — ¿En qué dominio va a vivir la nueva landing?

## 💡 Deseables (pulido v1)

- [ ] **Mapa de Google** — Confirmar la nueva dirección para embeber el mapa
- [ ] **Galería de fotos** — ¿Cuántas fotos? ¿Alguna categoría específica?
- [ ] **Palabras clave para SEO** — ¿Qué buscan los clientes? ("veterinaria rosario", "bulldog veterinario", etc.)
- [ ] **Titular / eslogan** — El placeholder actual es: "Cuidamos a tu mascota como parte de nuestra familia" — ¿se mantiene, se cambia, o lo propone Paula?

---

## Notas

- El sitio anterior (neovet.netlify.app) fue hecho por Brandon Acosta, quien dejó de responderle a Paula. Estamos reconstruyendo desde cero con Astro.
- Todo el texto visible para el usuario está en español argentino.
- La landing es un sitio estático de una sola página con navegación por anclas.
- WhatsApp es el llamado a la acción (CTA) principal en toda la página.
