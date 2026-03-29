# Client Handoff — NeoVet CRM v1

| Field | Value |
|---|---|
| **Project** | NeoVet CRM |
| **Client** | Paula Silveira — NeoVet |
| **Agency** | Tomás Pinolini / Franco Zancocchia |
| **Production URL** | <!-- TODO: add Vercel URL at deploy --> |
| **Handoff date** | <!-- YYYY-MM-DD --> |
| **Support period ends** | <!-- YYYY-MM-DD --> |
| **Technical spec** | `crm/docs/v1/technical-spec.md` |
| **Charter** | `crm/docs/v1/charter.md` |

---

## 1. Pre-Launch Checklist

### Security
- [ ] All Supabase credentials rotated to production values
- [ ] No secrets committed to the repository (`git grep -r "service_role"`)
- [ ] `.env.example` up to date with all required variables
- [ ] HTTPS enforced (Vercel default — confirm in production)
- [ ] Auth-protected routes verified in production (try accessing `/dashboard` while logged out)
- [ ] `npm audit` run — no high/critical vulnerabilities

### Functionality
- [ ] All deliverables from charter tested in production (D1–D8)
- [ ] Paula and team completed UAT
- [ ] Full visit flow tested: create appointment → confirm → complete → register consultation → add treatment items
- [ ] Full grooming flow tested: create grooming appointment → assign groomer → groomer fills session → photos uploaded
- [ ] Each role tested in isolation (log in as vet, as groomer — verify blocked routes redirect)
- [ ] Billing flow tested: generate invoice, submit to AFIP, receive CAE

### Data
- [ ] All migrations (0001–latest) applied to production Supabase
- [ ] Geovet import completed and verified (client/patient counts match)
- [ ] Backfill script run (appointments created from imported consultations)
- [ ] Supabase automatic backups enabled (Settings → Backups in Supabase dashboard)

### Documentation
- [ ] This handoff document completed
- [ ] `crm/README.md` accurate
- [ ] `crm/docs/v1/technical-spec.md` reflects final implementation
- [ ] All ADRs in `crm/docs/v1/architecture/` up to date

### Access Transfer
- [ ] Paula has admin access to Vercel project
- [ ] Paula has admin access to Supabase project
- [ ] Paula has her own CRM staff account with `admin` role
- [ ] AFIP credentials configured in production environment variables
- [ ] Agency access downgraded or removed per agreement

---

## 2. Sistema — Descripción para Paula

### Qué hace el sistema

NeoVet CRM es la herramienta interna de la clínica para gestionar toda la operación diaria sin depender de GVet. Desde acá podés:

- **Clientes y pacientes** — buscar cualquier dueño, ver sus mascotas, editar datos de contacto.
- **Turnos** — crear turnos veterinarios o de peluquería, asignarlos a un profesional, confirmarlos y marcarlos como completados.
- **Historia clínica** — registrar cada consulta con notas SOAP, signos vitales, plan de tratamiento, vacunas y desparasitaciones. Los documentos (radiografías, estudios) se pueden adjuntar a la ficha.
- **Peluquería** — cada perro que pasa por peluquería tiene su perfil propio (comportamiento, tipo de pelaje, tiempo estimado). El peluquero registra cada sesión con fotos antes/después, hallazgos y precio final.
- **Facturación** — emitir facturas electrónicas (AFIP) desde el CRM directamente.
- **Staff y accesos** — cada integrante del equipo tiene su propio usuario con el acceso que le corresponde según su rol.

### Quién usa qué

| Rol | Qué puede hacer |
|---|---|
| **Admin** (Paula, recepción) | Todo — clientes, pacientes, turnos, historia clínica, peluquería, facturación, staff, configuración |
| **Veterinario/a** | Ver clientes, ver y editar pacientes, ver turnos veterinarios, registrar y editar consultas |
| **Peluquero/a** | Ver turnos de peluquería, registrar sesiones de peluquería, editar perfil de peluquería del paciente |

### Qué es automático vs. manual

| Acción | Modo | Quién lo hace |
|---|---|---|
| Confirmar turno | Manual | Recepción / admin |
| Asignar profesional al turno | Manual | Recepción / admin |
| Registrar consulta | Manual | Veterinario/a |
| Registrar sesión de peluquería | Manual | Peluquero/a |
| Emitir factura | Manual | Admin |
| Notificaciones / recordatorios por WhatsApp | ❌ No disponible en v1 | — (v2) |

---

## 3. Credenciales y Accesos

> ⚠️ Nunca compartir credenciales por email o WhatsApp. Usar 1Password o Bitwarden.

| Sistema | Tipo de cuenta | Quién la tiene | Dónde está |
|---|---|---|---|
| Vercel | Admin | Tomás + Paula | 1Password / entregar al handoff |
| Supabase | Admin | Tomás + Paula | 1Password / entregar al handoff |
| AFIP (certificado digital) | Titular | Paula | <!-- TODO --> |
| Dominio | Registrar | <!-- TODO --> | <!-- TODO --> |

### Variables de entorno en producción

Todas las variables están en Vercel → Settings → Environment Variables. La lista completa está en `.env.example` en el repositorio.

**Nunca** agregar o cambiar variables directamente en la base de datos — siempre usar el panel de Vercel.

---

## 4. Runbook — Operaciones comunes

### Cómo agregar un nuevo usuario del staff

1. Entrá al CRM con una cuenta de admin.
2. Navegá a **Configuración → Staff**.
3. Hacé clic en **Nuevo miembro**.
4. Completá nombre, email y rol.
5. El sistema crea la cuenta y el usuario recibe un email para definir su contraseña.

### Cómo aplicar una migración de base de datos tras un deploy

```bash
cd crm
npm run db:migrate
```

> Requiere `DATABASE_URL` en modo sesión (puerto 5432). Ver `crm/README.md`.

### Cómo hacer un redeploy manual

1. En Vercel → proyecto NeoVet CRM → pestaña **Deployments**.
2. Clic en los tres puntos del deploy más reciente → **Redeploy**.

### Cómo rotar una credencial

1. Generar la nueva clave en el dashboard del proveedor.
2. Actualizar la variable de entorno en Vercel → Settings → Environment Variables.
3. Triggerear un nuevo deploy.
4. Verificar que el sistema funcione correctamente.
5. Revocar la clave vieja en el dashboard del proveedor.

### Cómo restaurar un backup de la base de datos

1. En Supabase → tu proyecto → **Backups**.
2. Seleccionar el backup de la fecha deseada.
3. Hacer clic en **Restore**. El proceso tarda ~5 minutos.
4. Verificar que los datos estén correctos en el CRM.

---

## 5. Problemas comunes

| Síntoma | Causa probable | Solución |
|---|---|---|
| "No autorizado" al entrar al dashboard | Sesión expirada o cookies borradas | Cerrar sesión y volver a ingresar |
| No aparece "Registrar consulta" en un turno | El turno no está en estado "Completado" | Marcar el turno como completado primero |
| Un archivo no se puede descargar | URL firmada expirada (60 segundos) | Hacer clic en descargar de nuevo |
| El peluquero no ve sus turnos | El turno no está tipificado como "grooming" o no está asignado | Un admin edita el turno y cambia el tipo / asignación |
| Error al emitir factura AFIP | Certificado digital vencido o credenciales incorrectas | Verificar las variables `AFIP_*` en Vercel y renovar certificado si aplica |

### Cuándo contactar a la agencia

Durante el período de soporte, contactarnos para:
- Vulnerabilidades de seguridad o pérdida de datos (contacto inmediato)
- El sistema está completamente caído y el redeploy no lo resolvió
- Un bug presente al momento del lanzamiento no detectado en UAT

**Contacto durante el período de soporte:**
- Tomás Pinolini: <!-- email -->
- Franco Zancocchia: <!-- email -->
- Tiempo de respuesta: <!-- e.g., días hábiles, dentro de 4hs para P0 -->

---

## 6. Limitaciones conocidas (v1)

| Comportamiento | Explicación | Solución alternativa |
|---|---|---|
| Sin integración con el chatbot | CRM y chatbot son independientes en v1 | Gestión manual de turnos desde el CRM |
| Sin notificaciones automáticas | No hay recordatorios por WhatsApp | Enviar mensajes manualmente desde WhatsApp |
| Los hallazgos del peluquero no alertan al veterinario | Pendiente de entrevista con peluquero para definir el flujo | El peluquero notifica al veterinario manualmente |
| Sin reportes ni analíticas | Funcionalidades de v3 | Exportar datos desde Supabase si se necesita un análisis puntual |

---

## 7. Próximas versiones

### v2 — Chatbot + WhatsApp + Automatización
- Integración CRM ↔ chatbot (API pública para turnos online)
- Canal WhatsApp via Kapso
- Recordatorios automáticos de turno (24h y 1h antes)
- Recordatorios automáticos de peluquería
- Alertas del peluquero al veterinario por hallazgos clínicos

### v3 — Inteligencia y automatización avanzada
- Dictado por voz para historia clínica
- Business intelligence y reportes de rentabilidad
- Tiempo estimado de peluquería calculado automáticamente por historial
- Portal del tutor / app para clientes

---

## 8. Firma de entrega

| Rol | Nombre | Fecha | Firma |
|---|---|---|---|
| Agencia — entregado por | Tomás Pinolini / Franco Zancocchia | | |
| Cliente — recibido por | Paula Silveira | | |

*Ambas partes confirman que todos los entregables listados en el charter fueron entregados, probados y aceptados.*
