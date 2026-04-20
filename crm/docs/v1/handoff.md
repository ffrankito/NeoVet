# Entrega del Proyecto — NeoVet CRM v1

| Campo | Valor |
|---|---|
| **Proyecto** | NeoVet CRM |
| **Cliente** | Paula Silveyra — NeoVet |
| **Agencia** | Tomás Pinolini / Franco Zancocchia |
| **URL de producción** | https://neo-vet-eta.vercel.app/dashboard |
| **Estado del proyecto** | En desarrollo — UAT postpuesto tras relevamiento con el equipo |
| **Fecha de entrega formal** | Pendiente — proyecto en fase de desarrollo, re-scope activo |
| **Fin del período de garantía** | Pendiente (60 días desde la entrega) |
| **Especificación técnica** | `crm/docs/v1/technical-spec.md` |
| **Charter del proyecto** | `crm/docs/v1/charter.md` |

---

## 1. Lista de verificación pre-lanzamiento

### Seguridad
- [x] Todas las credenciales de Supabase configuradas en Vercel
- [x] `CRON_SECRET` y `BOT_API_KEY` rotados 2026-04-20 (valores históricos del checklist archivados fuera del repo)
- [ ] Sin secretos commiteados al repositorio (`git grep -r "service_role"`)
- [x] `.env.example` actualizado con todas las variables requeridas
- [x] HTTPS activo (Vercel por defecto)
- [ ] Rutas protegidas por autenticación verificadas en producción
- [ ] `npm audit` ejecutado — sin vulnerabilidades altas o críticas

### Observabilidad
- [x] Sentry integrado en el CRM (`@sentry/nextjs`) — Phase T1a, 2026-04-20. Proyecto `ravena/neovet-crm`. Event flow verificado vía issue `NEOVET-CRM-2`.
- [ ] Sentry en el chatbot (Phase T1b — pendiente)
- [ ] Sentry en el landing Astro (Phase T1c — pendiente)
- [ ] Langfuse en el chatbot para traces de Claude (Phase T2 — pendiente)

### Funcionalidad
- [ ] Todos los entregables del charter probados en producción (D1–D14)
- [ ] Paula y el equipo completaron el UAT (postpuesto — pendiente re-planificar)
- [ ] Flujo de consulta completo probado: crear turno → confirmar → completar → registrar consulta → agregar ítems de tratamiento → métodos complementarios → agendar seguimiento
- [ ] Flujo de peluquería completo probado: crear turno → asignar peluquero → registrar sesión → fotos subidas → hallazgos → ingreso en caja automático
- [ ] Cada rol probado en aislamiento (vet, peluquero)
- N/A ~~Flujo de facturación probado~~ — Fase D diferida
- [x] Catálogo de servicios configurado
- [ ] Vista semanal de calendario verificada con feriados resaltados
- [x] Feriados integrados con API ArgentinaDatos — calendario y chatbot
- [ ] Recordatorios por email probados: turno 48h/24h, vacunas, seguimiento
- [ ] Email de confirmación probado al crear turno
- [ ] Email de cancelación probado al cancelar turno
- [ ] No-show: marcar turno como "no se presentó"
- [ ] Ficha del cliente muestra próximos turnos inline
- [x] Dashboard admin muestra widget de caja abierta/cerrada
- [ ] Pet shop: crear producto → stock → venta → stock baja
- [ ] Caja: abrir → movimientos → cerrar
- [ ] Documentos de consentimiento: generar PDF → descargar
- [x] Selector cliente → paciente en hospitalizaciones, procedimientos y consentimientos
- [ ] UI verificada en mobile

### Datos
- [x] Migraciones 0001–0031 aplicadas en Supabase producción
- [x] Importación de GVet completada (2097 clientes, 2291 pacientes)
- [x] Importación scrapeada de GVet: internaciones, procedimientos, deudores
- [x] `bot_business_context` seeded (11 registros)
- [x] Settings de horarios seeded
- [ ] Templates de consentimiento seeded (`scripts/seed-consent-templates.ts`)
- [ ] Bucket `consent-documents` creado en Supabase Storage (privado)
- [ ] Backups automáticos de Supabase habilitados

### Documentación
- [x] Este documento de entrega actualizado
- [ ] `crm/README.md` actualizado y preciso
- [ ] Paula tiene cuenta admin en el CRM

### Transferencia de accesos
- [ ] Paula tiene acceso admin en Vercel
- [ ] Paula tiene acceso admin en Supabase
- [x] Paula tiene cuenta en el CRM con rol `admin`
- [ ] El acceso de la agencia fue reducido según el acuerdo

---

## 2. ¿Qué hace el sistema?

### Descripción general

NeoVet CRM es la herramienta interna de la clínica para gestionar toda la operación diaria sin depender de GVet.

- **Clientes y pacientes** — buscar cualquier dueño, ver sus mascotas, editar datos de contacto.
- **Turnos** — crear turnos veterinarios o de peluquería. Al crear: selector cliente → paciente → servicio → profesional → fecha. 5 estados: `pendiente`, `confirmado`, `completado`, `cancelado`, `no se presentó`. Cancelación con motivo. Vista semanal con feriados resaltados en ámbar (API ArgentinaDatos). Al crear → email de confirmación; al cancelar → email de notificación.
- **Catálogo de servicios** — lista de servicios con duración predeterminada.
- **Historia clínica** — SOAP, signos vitales, plan de tratamiento, vacunas, desparasitaciones, documentos (lab, rx, eco, foto), métodos complementarios.
- **Internaciones** — admitir paciente, observaciones diarias, alta. Accesible desde el menú o desde la ficha del paciente.
- **Procedimientos** — registrar cirugías y procedimientos con cirujano(s) y anestesiólogo(s). Selector cliente → paciente al crear desde el menú.
- **Documentos de consentimiento** — generar PDFs firmados (cirugía, eutanasia, acuerdo reproductivo). Selector cliente → paciente. Requiere bucket `consent-documents` en Supabase Storage.
- **Estética** — historial completo de sesiones de peluquería accesible desde el menú lateral.
- **Peluquería** — perfil del paciente (comportamiento, pelaje), sesiones con fotos antes/después, hallazgos, precio, método de pago. Ingreso automático en caja.
- **Pet shop** — catálogo con 9 categorías, proveedores, ingresos de stock, ventas con carrito. Stock automático.
- **Caja** — apertura/cierre, movimientos, desglose por método de pago. Ventas y peluquería incorporadas automáticamente.
- **Deudores** — cargos pendientes por cliente, importados de GVet o creados manualmente.
- **Recordatorios por email** — turno 48h/24h, vacunas 7 días antes, seguimiento post-consulta (Vercel Cron, 12pm UTC).
- **Horarios dinámicos** — configurables desde `/dashboard/settings`. Sin hardcodeos. Se reflejan en el calendario y en el bot de disponibilidad.
- **Feriados** — detectados automáticamente via API ArgentinaDatos. El calendario los resalta en ámbar con el nombre. El chatbot informa horario reducido en feriados.
- **Staff y accesos** — cada integrante tiene su usuario con rol. El dashboard filtra turnos por rol.

### ¿Quién usa qué?

| Rol | Qué puede hacer |
|---|---|
| **Admin / Owner** (Paula) | Todo — clientes, pacientes, turnos, historia clínica, internaciones, procedimientos, consentimientos, estética, pet shop, caja, deudores, staff, configuración |
| **Veterinario/a** | Ver clientes · Ver y editar pacientes · Ver turnos veterinarios asignados · Registrar y editar consultas · Internaciones · Procedimientos · Consentimientos |
| **Peluquero/a** | Ver turnos de peluquería asignados · Registrar sesiones de peluquería · Editar perfil de peluquería |

### ¿Qué es automático vs. manual?

| Acción | Modo | Responsable |
|---|---|---|
| Confirmar turno | Manual | Recepción / admin |
| Asignar profesional al turno | Manual | Recepción / admin |
| Registrar consulta | Manual | Veterinario/a |
| Registrar sesión de peluquería | Manual | Peluquero/a |
| Registrar venta en pet shop | Manual | Admin |
| Abrir/cerrar caja | Manual | Admin |
| Marcar ausencia (no-show) | Manual | Recepción / admin |
| Cancelar turno con motivo | Manual | Recepción / admin |
| Generar documento de consentimiento | Manual | Vet / admin |
| Stock sube al registrar entrada | Automático | Sistema |
| Stock baja al registrar venta | Automático | Sistema |
| Ingreso de peluquería → caja | Automático | Sistema (si hay caja abierta) |
| Email de confirmación al crear turno | Automático | Sistema |
| Email de cancelación al cancelar turno | Automático | Sistema |
| Recordatorio de turno 48h/24h | Automático (Vercel Cron) | Sistema |
| Recordatorio de vacuna 7 días antes | Automático (Vercel Cron) | Sistema |
| Seguimiento post-consulta | Automático (fecha programada) | Sistema |
| Detección de feriados | Automático (API ArgentinaDatos) | Sistema |
| Horario reducido en feriados | Automático (settings + feriados API) | Sistema |
| Notificaciones por WhatsApp | ❌ No disponible en v1 | — (v2) |

---

## 3. Credenciales y accesos

> ⚠️ Nunca compartir credenciales por email o WhatsApp. Usar 1Password o Bitwarden.

| Sistema | Tipo de cuenta | Quién la tiene |
|---|---|---|
| Vercel | Admin | Tomás + Paula |
| Supabase | Admin | Tomás + Paula |
| ARCA (certificado digital) | Titular | Paula (pendiente) |

### Variables de entorno en producción

| Variable | Propósito |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clave anónima (auth client-side) |
| `SUPABASE_SERVICE_ROLE_KEY` | Clave de servicio (Storage admin, consent PDFs) |
| `DATABASE_URL` | Conexión PostgreSQL |
| `NEXT_PUBLIC_APP_URL` | URL pública del CRM (links en emails) |
| `RESEND_API_KEY` | API key de Resend para emails |
| `EMAIL_FROM` | Remitente de emails |
| `CRON_SECRET` | Protege rutas de cron y admin |
| `BOT_API_KEY` | Protege endpoints `/api/bot/*` |

---

## 4. Manual de operaciones

### Cómo agregar un nuevo usuario del staff

1. Entrar al CRM con cuenta admin.
2. Ir a **Configuración → Staff**.
3. Hacer clic en **Nuevo miembro**.
4. Completar nombre, email y rol.
5. El usuario recibe email para definir contraseña.

### Cómo cambiar los horarios de la clínica

1. Ir a **Configuración → Horarios de atención**.
2. Editar los horarios de mañana, tarde y feriados.
3. Hacer clic en **Guardar horarios**.
4. Los cambios se reflejan inmediatamente en el calendario y en el bot de disponibilidad.

### Cómo aplicar una migración de base de datos

```bash
cd crm
$env:DATABASE_URL="postgresql://..."; npx drizzle-kit push
```

### Cómo correr los crons manualmente

```powershell
Invoke-WebRequest -Uri "https://neo-vet-eta.vercel.app/api/cron/appointment-reminders" -Headers @{"Authorization"="Bearer CRON_SECRET"} -UseBasicParsing
```

### Cómo restaurar un backup

1. Supabase → tu proyecto → **Backups**.
2. Seleccionar la fecha.
3. **Restore**. Tarda ~5 minutos.

---

## 5. Problemas frecuentes

| Síntoma | Causa probable | Solución |
|---|---|---|
| "No autorizado" al entrar | Sesión expirada | Cerrar sesión y volver a ingresar |
| No aparece botón "Registrar consulta" | Turno no está en estado "Completado" | Marcar el turno como completado primero |
| Un archivo no se puede descargar | URL firmada expirada (60 segundos) | Hacer clic en descargar de nuevo |
| El peluquero no ve sus turnos | Turno no tipificado como "grooming" o no asignado | Admin edita el turno |
| Ingreso de peluquería no aparece en caja | No había caja abierta | Abrir caja antes de registrar sesiones |
| No llegó el email de confirmación | `sendReminders` desactivado o cliente sin email | Verificar toggle y email del cliente |
| Error al generar consentimiento | Bucket `consent-documents` no creado o `SUPABASE_SERVICE_ROLE_KEY` no configurada | Crear bucket en Storage y verificar env var |
| No hay plantillas de consentimiento | Seed no ejecutado | Correr `npx tsx scripts/seed-consent-templates.ts` |
| Feriado no detectado | API ArgentinaDatos no responde | El sistema usa fallback silencioso — no hay error visible |
| Error de conexión a DB en local | Red sin soporte IPv6 | Usar Session pooler (puerto 5432) en `DATABASE_URL` |

---

## 6. Limitaciones conocidas de v1

| Comportamiento | Explicación | Alternativa |
|---|---|---|
| Sin integración con el chatbot | CRM y chatbot son independientes en v1 | Gestionar turnos manualmente desde el CRM |
| Sin recordatorios por WhatsApp | WhatsApp es v2 | Recordatorios llegan por email |
| Los hallazgos del peluquero no alertan al veterinario | Pendiente de v2 | El peluquero avisa manualmente |
| Sin impresión de recetas | v2 | El vet dicta el plan de tratamiento |
| Sin log de auditoría | v2 | Campos `createdBy` y `updatedAt` dan visibilidad parcial |
| Sin reportes ni analíticas | v3 | Exportar datos desde Supabase |
| Facturación ARCA pendiente | Fase D diferida | Paula sigue facturando manualmente |
| Importación GVet: solo 10 registros por sección | HTMLs descargados tenían solo la primera página | Descargar todas las páginas y re-correr el parser |

---

## 7. Próximas versiones

### v2 — Chatbot + WhatsApp + Automatización
- Integración CRM ↔ chatbot (turnos online, API pública)
- Canal WhatsApp vía Kapso
- Recordatorios de turno, peluquería y vacunas por WhatsApp
- Alertas al veterinario por hallazgos del peluquero

### v3 — Inteligencia y automatización avanzada
- Dictado por voz para historia clínica
- Business intelligence y reportes
- Pagos online (Mercado Pago / QR)
- Portal del tutor / app para clientes

---

## 8. Firma de entrega

| Rol | Nombre | Fecha | Firma |
|---|---|---|---|
| Agencia — entregado por | Tomás Pinolini / Franco Zancocchia | | |
| Cliente — recibido por | Paula Silveyra | | |
