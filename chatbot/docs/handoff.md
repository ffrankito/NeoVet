# Entrega del Proyecto — NeoVet Chatbot

| Campo | Valor |
|---|---|
| **Proyecto** | NeoVet Chatbot |
| **Cliente** | Paula Silveira — NeoVet |
| **Agencia** | Tomás Pinolini / Franco Zancocchia |
| **URL de producción** | `neo-vet-widget.vercel.app` |
| **Embebido en** | Landing page (`neovet-landing.vercel.app`) como iframe bottom-right |
| **Fecha de entrega** | <!-- AAAA-MM-DD --> |
| **Fin del período de soporte** | <!-- AAAA-MM-DD --> |
| **Especificación técnica** | `chatbot/docs/technical-spec.md` |
| **Charter del proyecto** | `chatbot/docs/charter.md` |

---

## 1. Lista de verificación pre-lanzamiento

### Seguridad
- [x] `ANTHROPIC_API_KEY` configurada en Vercel (producción)
- [ ] Clave rotada a valor exclusivo de producción (no compartir con desarrollo)
- [ ] Sin secretos commiteados al repositorio
- [x] HTTPS activo (Vercel por defecto)
- [x] Rate limiting activo en `/api/chat` (20 req/min por IP)

### Funcionalidad
- [x] Bot responde correctamente a preguntas frecuentes en español argentino
- [x] Respuestas en formato "vos" (no "tú")
- [x] Errores muestran mensajes en español, no stack traces
- [x] Quick replies (4 sugerencias) visibles al abrir el widget
- [x] Detección de feriados funciona (horarios modificados)
- [ ] Paula revisó y aprobó todas las respuestas del bot
- [ ] Tiempo de respuesta < 3s (95%) — verificación formal pendiente

### Datos del prompt
- [x] Horarios correctos (L-S 9:30–12:30 / 16:30–20:00, feriados 10:00–13:00)
- [x] Dirección correcta (Morrow 4064, Rosario, Santa Fe)
- [x] Teléfono/WhatsApp correcto (+54 9 341 310-1194)
- [x] Email correcto (veterinarianeo@gmail.com)
- [x] 10 servicios listados
- [x] Guardia obstétrica 24hs mencionada
- [ ] Paula confirmó que todos los datos del prompt son correctos y vigentes

### Documentación
- [x] Este documento de entrega completo
- [x] `chatbot/README.md` actualizado
- [x] `chatbot/docs/technical-spec.md` refleja la implementación final

### Transferencia de accesos
- [ ] Paula tiene acceso al proyecto en Vercel
- [ ] Paula tiene acceso a la consola de Anthropic (titular de la API key)

---

## 2. ¿Qué hace el sistema?

### Descripción general

El chatbot de NeoVet es un asistente virtual que responde preguntas frecuentes de los clientes de la clínica. Está disponible como un widget de chat en la página web de la clínica (esquina inferior derecha).

**Lo que puede hacer:**
- Responder sobre horarios de atención (incluyendo feriados)
- Informar qué servicios ofrece la clínica
- Dar la dirección y datos de contacto
- Explicar cómo sacar turno (por WhatsApp o teléfono)
- Informar sobre la guardia obstétrica 24hs
- Responder sobre especialidades (ecografía, braquicéfalos, reproducción)

**Lo que NO puede hacer (v1):**
- No puede sacar turnos — le indica al cliente que contacte por WhatsApp o teléfono
- No recuerda conversaciones anteriores — cada sesión empieza de cero
- No puede enviar imágenes ni recibir fotos
- No accede a datos del CRM (turnos, historial, etc.)

### ¿Cómo funciona?

1. El cliente abre la página web de la clínica y hace clic en el botón de chat (esquina inferior derecha).
2. El widget muestra 4 preguntas sugeridas para empezar.
3. El cliente escribe una pregunta.
4. El bot responde en español argentino usando la información cargada sobre la clínica.
5. Si el bot no puede responder algo, le sugiere al cliente que contacte a la clínica por WhatsApp o teléfono.

---

## 3. Credenciales y accesos

> ⚠️ Nunca compartir credenciales por email o WhatsApp. Usar 1Password o Bitwarden.

| Sistema | Tipo de cuenta | Quién la tiene | Dónde está |
|---|---|---|---|
| Vercel | Admin | Tomás + Paula | 1Password — entregar al momento de la firma |
| Anthropic (API key) | Titular | Tomás | 1Password — transferir titularidad a Paula |

### Variables de entorno en producción

| Variable | Descripción |
|---|---|
| `ANTHROPIC_API_KEY` | Clave de API de Anthropic para Claude |

Configurada en Vercel → Configuración → Variables de entorno.

---

## 4. Manual de operaciones

### Cómo actualizar el contenido del bot (horarios, servicios, precios)

El contenido que el bot conoce está en un archivo de texto dentro del código:

1. Editar `chatbot/src/lib/prompts/system.ts`.
2. Modificar los datos (horarios, servicios, dirección, etc.).
3. Hacer commit y push a `main`.
4. Vercel redespliega automáticamente.

> **Importante:** Este archivo es código — requiere un desarrollador para editarlo. En v2, los datos vendrán del CRM y se actualizarán solos.

### Cómo hacer un redeploy manual

1. Ir a Vercel → proyecto NeoVet Chatbot → pestaña **Deployments**.
2. Hacer clic en los tres puntos del deploy más reciente → **Redeploy**.

### Cómo rotar la API key de Anthropic

1. Generar una nueva clave en `console.anthropic.com`.
2. Actualizar `ANTHROPIC_API_KEY` en Vercel → Configuración → Variables de entorno.
3. Hacer un redeploy.
4. Verificar que el bot responda correctamente.
5. Revocar la clave vieja en la consola de Anthropic.

---

## 5. Problemas frecuentes

| Síntoma | Causa probable | Solución |
|---|---|---|
| El bot no responde | API key inválida o expirada | Verificar `ANTHROPIC_API_KEY` en Vercel y rotar si es necesario |
| "Demasiadas solicitudes" / error 429 | Rate limit alcanzado (20 req/min por IP) | Esperar un minuto e intentar de nuevo. Si es recurrente, ajustar el límite en `src/lib/rate-limit.ts` |
| El bot responde con información incorrecta | Datos desactualizados en el prompt del sistema | Actualizar `src/lib/prompts/system.ts` y redesplegar |
| El widget no aparece en la landing | Error de carga del iframe o CSP bloqueando | Verificar que `neo-vet-widget.vercel.app` esté en la lista de CSP en `landing/vercel.json` |
| El bot muestra horarios normales en feriado | La API de feriados (`argentinadatos.com`) no responde | El bot funciona con horarios normales como fallback. Verificar que la API externa esté disponible. |
| Respuestas muy lentas (> 5s) | Latencia de Anthropic API | Verificar estado en `status.anthropic.com`. No hay acción local posible. |

### Cuándo contactar a la agencia

Durante el período de soporte, contactarnos ante:
- El bot está completamente caído y el redeploy no lo resolvió
- El bot responde de forma inapropiada o peligrosa
- Vulnerabilidades de seguridad

**Contacto durante el período de soporte:**
- Tomás Pinolini: <!-- email -->
- Franco Zancocchia: <!-- email -->
- Tiempo de respuesta: <!-- ej: días hábiles, dentro de 4hs para P0 -->

---

## 6. Limitaciones conocidas de v1

| Comportamiento | Explicación | Alternativa por ahora |
|---|---|---|
| No puede sacar turnos | La reserva de turnos es v2 — el bot indica al cliente que llame o escriba por WhatsApp | El cliente contacta a la clínica directamente |
| Sin WhatsApp | Solo web widget en v1. WhatsApp (via Kapso) es v2 | Los clientes usan el widget en la web o contactan por WhatsApp manualmente |
| Sin memoria entre sesiones | Cada conversación empieza de cero — el bot no recuerda conversaciones anteriores | El cliente repite su consulta si vuelve a entrar |
| Contenido estático | Los datos del bot están escritos en código — si cambian los horarios o servicios, hay que actualizar el código | Un desarrollador actualiza el prompt y redespliega |
| Sin conexión al CRM | El bot no sabe qué turnos hay disponibles ni puede ver historiales | En v2 el chatbot se conecta al CRM via API |
| Depende de API externa para feriados | Si `argentinadatos.com` no responde, el bot no detecta el feriado | Funciona con horarios normales como fallback |

---

## 7. Próximas versiones

### v2 — WhatsApp + Turnos + Urgencias
- Canal WhatsApp vía Kapso
- Reserva de turnos desde el chat (conectado al CRM)
- Sistema de urgencias L1–L4 con escalación automática
- Base de datos para persistir conversaciones
- Panel de administración para ver conversaciones y escalaciones

### v3 — Inteligencia avanzada
- Análisis de imágenes para triage
- Recomendaciones basadas en historial del paciente
- Multi-idioma

Ver roadmap completo en `chatbot/docs/roadmap.md`.

---

## 8. Firma de entrega

| Rol | Nombre | Fecha | Firma |
|---|---|---|---|
| Agencia — entregado por | Tomás Pinolini / Franco Zancocchia | | |
| Cliente — recibido por | Paula Silveira | | |

*Ambas partes confirman que todos los entregables listados en el charter fueron entregados, probados y aceptados.*
