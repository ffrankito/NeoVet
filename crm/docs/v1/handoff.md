# Entrega del Proyecto — NeoVet CRM v1

| Campo | Valor |
|---|---|
| **Proyecto** | NeoVet CRM |
| **Cliente** | Paula Silveira — NeoVet |
| **Agencia** | Tomás Pinolini / Franco Zancocchia |
| **URL de producción** | https://neo-vet-eta.vercel.app/dashboard |
| **Inicio de UAT** | 2026-04-13 |
| **Fecha de entrega formal** | 2026-04-20 |
| **Fin del período de garantía** | 2026-06-19 (60 días desde la entrega) |
| **Especificación técnica** | `crm/docs/v1/technical-spec.md` |
| **Charter del proyecto** | `crm/docs/v1/charter.md` |

---

## 1. Lista de verificación pre-lanzamiento

### Seguridad
- [ ] Todas las credenciales de Supabase rotadas a valores de producción
- [ ] Sin secretos commiteados al repositorio (`git grep -r "service_role"`)
- [ ] `.env.example` actualizado con todas las variables requeridas
- [ ] HTTPS activo (Vercel por defecto — confirmar en producción)
- [ ] Rutas protegidas por autenticación verificadas en producción (intentar acceder a `/dashboard` sin sesión)
- [ ] `npm audit` ejecutado — sin vulnerabilidades altas o críticas

### Funcionalidad
- [ ] Todos los entregables del charter probados en producción (D1–D19, excepto D14)
- [ ] Paula y el equipo completaron el UAT
- [ ] Flujo de consulta completo probado: crear turno → confirmar → completar → registrar consulta → agregar ítems de tratamiento → métodos complementarios → agendar seguimiento
- [ ] Flujo de peluquería completo probado: crear turno de peluquería → asignar peluquero → peluquero registra sesión → fotos subidas → hallazgos registrados → ingreso en caja automático
- [ ] Cada rol probado en aislamiento (ingresar como veterinario, como peluquero — verificar que dashboard filtra turnos y las rutas bloqueadas redirigen)
- N/A ~~Flujo de facturación probado~~ — Fase D diferida a post-lanzamiento
- [ ] Catálogo de servicios configurado con los servicios de Paula
- [ ] Vista semanal de calendario verificada con slots libres y bloqueos de cirugía
- [ ] Suspensión de agenda: profesional puede bloquear días/franjas y turnos afectados se cancelan
- [ ] Recordatorios por email probados: turno 48h/24h, vacunas 7 días antes, seguimiento post-consulta
- [ ] Email de confirmación probado: crear turno → cliente recibe email
- [ ] Email de cancelación probado: cancelar turno → cliente recibe email con motivo
- [ ] No-show: marcar turno pasado como "no se presentó" → estado correcto
- [ ] Detalle de turno muestra resumen del paciente (última consulta, vacunas vencidas, alerta braquicéfalo)
- [ ] Ficha del cliente muestra próximos turnos inline
- [ ] Dashboard admin muestra widget de caja abierta/cerrada
- [ ] Pet shop: crear producto → registrar entrada de stock → stock sube → registrar venta → stock baja → badge de stock bajo visible
- [ ] Caja: abrir sesión → registrar movimientos → ventas + peluquería se reflejan en balance → cerrar con conteo de efectivo
- [ ] Internaciones: admitir paciente → registrar observaciones diarias → dar de alta → aparece en historial
- [ ] Procedimientos: registrar procedimiento → agregar insumos (stock baja) → eliminar insumo (stock sube) → agendar seguimiento
- [ ] Consentimientos: generar PDF de autorización de cirugía, acta de eutanasia y acuerdo reproductivo → datos auto-llenados → descargar PDF
- [ ] Cargos y deudores: auto-cargo al registrar consulta/peluquería/venta → página deudores muestra saldo → registrar pago parcial/total → estado se actualiza
- [ ] UI verificada en mobile (celular) para los flujos principales

### Datos
- [ ] Todas las migraciones (0001–última) aplicadas en Supabase de producción
- [ ] Importación de GVet completada y verificada (cantidad de clientes y pacientes coincide)
- [ ] Script de backfill ejecutado (turnos creados desde consultas importadas)
- [ ] Backups automáticos de Supabase habilitados (Configuración → Backups en el panel de Supabase)

### Documentación
- [ ] Este documento de entrega completo
- [ ] `crm/README.md` actualizado y preciso
- [ ] `crm/docs/v1/technical-spec.md` refleja la implementación final
- [ ] Todos los ADRs en `crm/docs/v1/architecture/` actualizados

### Transferencia de accesos
- [ ] Paula tiene acceso de administrador al proyecto en Vercel
- [ ] Paula tiene acceso de administrador al proyecto en Supabase
- [ ] Paula tiene su propia cuenta en el CRM con rol `admin`
- N/A ~~Credenciales ARCA configuradas en las variables de entorno de producción~~ — Fase D diferida a post-lanzamiento
- [ ] El acceso de la agencia fue reducido o eliminado según el acuerdo

---

## 2. ¿Qué hace el sistema?

### Descripción general

NeoVet CRM es la herramienta interna de la clínica para gestionar toda la operación diaria sin depender de GVet. Desde acá podés:

- **Clientes y pacientes** — buscar cualquier dueño, ver sus mascotas, editar datos de contacto.
- **Turnos** — crear turnos veterinarios o de peluquería, asignarlos a un profesional, confirmarlos, marcarlos como completados o registrar ausencia ("no se presentó"). 5 estados: `pendiente`, `confirmado`, `completado`, `cancelado`, `no se presentó`. Cancelación con motivo opcional. Vista semanal con slots libres y bloqueos de cirugía. Cada profesional puede suspender su propia agenda por día(s) o franja horaria. Al crear un turno se envía email de confirmación al cliente; al cancelar se envía notificación.
- **Catálogo de servicios** — lista de servicios con duración predeterminada; las cirugías bloquean el calendario el tiempo que se configure.
- **Historia clínica** — registrar cada consulta con notas SOAP, signos vitales, plan de tratamiento (con medicamento, dosis, frecuencia y duración), vacunas y desparasitaciones. Se pueden adjuntar documentos clasificados por categoría (laboratorio, radiografía, ecografía, foto) y métodos complementarios (informes de estudios con fotos opcionales).
- **Peluquería** — cada perro que pasa por peluquería tiene su perfil propio (comportamiento, tipo de pelaje, tiempo estimado). El peluquero registra cada sesión con fotos antes/después, hallazgos, precio final y método de pago. El ingreso se registra automáticamente en la caja abierta.
- **Pet shop** — catálogo de productos con 9 categorías, gestión de proveedores, ingresos de stock y ventas con carrito multi-ítem. El stock se actualiza automáticamente al registrar ingresos y ventas. Alerta visual de stock bajo.
- **Caja** — apertura y cierre de sesiones de caja, movimientos de ingresos y egresos, desglose por método de pago. Las ventas del período se incorporan automáticamente al balance.
- **Internaciones** — admisión de pacientes con motivo y notas, observaciones diarias con signos vitales (peso, temperatura, FC, FR) y clínicas (alimentación, hidratación, medicación, orina, heces), alta con notas opcionales. Solo un paciente internado activo a la vez.
- **Procedimientos** — registro de cirugías y procedimientos con cirujano y anestesiólogo, consumo de insumos del inventario (decrementa stock automáticamente), seguimiento post-procedimiento.
- **Documentos de consentimiento** — generación de PDFs con datos auto-llenados del paciente y el cliente. Tres templates: autorización de cirugía y hospitalización, acta de eutanasia, acuerdo de asesoría reproductiva (GenetiCan). Almacenados en Supabase Storage con descarga vía URL firmada.
- **Cargos y deudores** — cargos por consulta, peluquería, procedimiento, venta, internación u otro. Pagos parciales y totales. Página "Deudores" con clientes con saldo pendiente. Auto-cargo al registrar consultas, sesiones de peluquería y ventas.
- **Facturación** — registrar pagos y emitir facturas electrónicas (ARCA) de forma opcional. Control de límites por entidad fiscal para evitar recategorización. *(Fase D — diferida a post-lanzamiento.)*
- **Recordatorios por email** — el sistema envía recordatorios automáticos: turno 48h y 24h antes, vacunas 7 días antes, seguimiento post-consulta. También envía confirmación al crear un turno y notificación al cancelarlo.
- **Staff y accesos** — cada integrante del equipo tiene su propio usuario con el acceso que le corresponde según su rol. El dashboard de cada rol muestra solo sus turnos asignados.

### ¿Quién usa qué?

| Rol | Qué puede hacer |
|---|---|
| **Admin / Owner** (Paula, recepción) | Todo — clientes, pacientes, turnos, historia clínica, internaciones, procedimientos, consentimientos, peluquería, pet shop, caja, cargos y deudores, staff, configuración. Dashboard muestra todos los turnos del día + estado de caja |
| **Veterinario/a** | Ver clientes · Ver y editar pacientes · Ver turnos veterinarios asignados · Registrar y editar consultas · Agendar seguimiento · Internaciones · Procedimientos · Consentimientos |
| **Peluquero/a** | Ver turnos de peluquería asignados · Registrar sesiones de peluquería (ingreso auto en caja) · Editar perfil de peluquería del paciente |

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
| Stock sube al registrar entrada | Automático | Sistema |
| Stock baja al registrar venta | Automático | Sistema |
| Ingreso de peluquería → movimiento de caja | Automático | Sistema (si hay caja abierta) |
| Email de confirmación al crear turno | Automático | Sistema (si `sendReminders` activo) |
| Email de cancelación al cancelar turno | Automático | Sistema (si `sendReminders` activo) |
| Admitir paciente / registrar observación / dar de alta | Manual | Veterinario/a o admin |
| Registrar procedimiento con insumos | Manual | Veterinario/a o admin |
| Stock baja al agregar insumo a procedimiento | Automático | Sistema |
| Generar PDF de consentimiento | Manual (un clic) | Admin o veterinario/a |
| Auto-cargo al registrar consulta, peluquería o venta | Automático | Sistema |
| Registrar pago de cargo | Manual | Admin |
| Emitir factura | Manual (opcional) | Admin — *(Fase D diferida a post-lanzamiento)* |
| Pago por Mercado Pago → requiere factura | Regla automática | Sistema — *(Fase D diferida a post-lanzamiento)* |
| Recordatorio de turno 48h/24h por email | Automático (Vercel Cron) | Sistema |
| Recordatorio de vacuna 7 días antes por email | Automático (Vercel Cron) | Sistema |
| Seguimiento post-consulta por email | Automático (fecha programada) | Sistema |
| Notificaciones y recordatorios por WhatsApp | ❌ No disponible en v1 | — (v2) |

---

## 3. Credenciales y accesos

> ⚠️ Nunca compartir credenciales por email o WhatsApp. Usar 1Password o Bitwarden.

| Sistema | Tipo de cuenta | Quién la tiene | Dónde está |
|---|---|---|---|
| Vercel | Admin | Tomás + Paula | 1Password — entregar al momento de la firma |
| Supabase | Admin | Tomás + Paula | 1Password — entregar al momento de la firma |
| ARCA (certificado digital) | Titular | Paula | A definir con Paula |
| Dominio | Registrar | A confirmar | A confirmar |

### Variables de entorno en producción

Todas las variables están en Vercel → Configuración → Variables de entorno. La lista completa está en `.env.example` en el repositorio.

| Variable | Propósito |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clave anónima (auth client-side) |
| `SUPABASE_SERVICE_ROLE_KEY` | Clave de servicio (crear staff, admin API) |
| `DATABASE_URL` | Conexión PostgreSQL, transaction mode (puerto 6543) |
| `NEXT_PUBLIC_APP_URL` | URL pública del CRM (para links en emails) |
| `RESEND_API_KEY` | API key de Resend para envío de emails |
| `EMAIL_FROM` | Remitente de emails (ej: `NeoVet <turnos@neovet.com.ar>`) |
| `CRON_SECRET` | Protege las rutas de cron y admin |
| `BOT_API_KEY` | Protege los endpoints `/api/bot/*` |

**Nunca** agregar o cambiar variables directamente en la base de datos — siempre usar el panel de Vercel para que queden encriptadas y versionadas.

---

## 4. Manual de operaciones

### Cómo agregar un nuevo usuario del staff

1. Entrar al CRM con una cuenta de admin.
2. Ir a **Configuración → Staff**.
3. Hacer clic en **Nuevo miembro**.
4. Completar nombre, email y rol.
5. El sistema crea la cuenta y el usuario recibe un email para definir su contraseña.

### Cómo aplicar una migración de base de datos tras un deploy

```bash
cd crm
npm run db:migrate
```

> Requiere `DATABASE_URL` en modo sesión (puerto 5432). Ver `crm/README.md` para la diferencia entre session mode y transaction mode.

### Cómo hacer un redeploy manual

1. Ir a Vercel → proyecto NeoVet CRM → pestaña **Deployments**.
2. Hacer clic en los tres puntos del deploy más reciente → **Redeploy**.

### Cómo rotar una credencial (clave de Supabase, ARCA, etc.)

1. Generar la nueva clave en el panel del proveedor.
2. Actualizar la variable de entorno en Vercel → Configuración → Variables de entorno.
3. Hacer un redeploy.
4. Verificar que el sistema funcione correctamente.
5. Revocar la clave vieja en el panel del proveedor.

### Cómo restaurar un backup de la base de datos

1. Ir a Supabase → tu proyecto → **Backups**.
2. Seleccionar el backup de la fecha deseada.
3. Hacer clic en **Restore**. El proceso tarda aproximadamente 5 minutos.
4. Verificar que los datos estén correctos en el CRM.

---

## 5. Problemas frecuentes

| Síntoma | Causa probable | Solución |
|---|---|---|
| "No autorizado" al entrar al dashboard | Sesión expirada o cookies borradas | Cerrar sesión y volver a ingresar |
| No aparece el botón "Registrar consulta" en un turno | El turno no está en estado "Completado" | Marcar el turno como completado primero |
| Un archivo no se puede descargar | URL firmada expirada (60 segundos) | Hacer clic en descargar de nuevo — se genera una nueva URL |
| El peluquero no ve sus turnos | El turno no está tipificado como "grooming" o no está asignado al peluquero | Un admin edita el turno y cambia el tipo o la asignación |
| El ingreso de peluquería no aparece en caja | No había caja abierta al registrar la sesión | Abrir caja antes de registrar sesiones. Si ya se registró, agregar el movimiento manualmente |
| No llegó el email de confirmación del turno | `sendReminders` estaba desactivado, o el cliente no tiene email cargado | Verificar el toggle al crear el turno, y que el cliente tenga email |
| Error al emitir factura en ARCA | *(Fase D pendiente de build — esta fila aplica cuando se implemente facturación)* | — |
| No puedo subir una foto en la sesión de peluquería | Archivo muy grande o formato no soportado | Usar JPG o PNG, máximo 10 MB |

### Términos de garantía (60 días)

**Período:** Desde la fecha de entrega formal (2026-04-20) hasta 2026-06-19.

**Qué cubre la garantía:**
- Bugs — funcionalidad que debería funcionar según el charter y no funciona
- Errores de datos — problemas con la migración desde Geovet detectados post-entrega
- Caídas del sistema no causadas por el usuario

**Qué NO cubre la garantía:**
- Features nuevos o cambios de criterio ("quiero que funcione distinto")
- Problemas causados por el usuario (borrado de datos, cambios de configuración)
- La Fase D (facturación ARCA) — se agrega como update independiente cuando lleguen las credenciales

### Cuándo contactar a la agencia

Durante el período de garantía, contactarnos ante:
- Vulnerabilidades de seguridad o pérdida de datos (contacto inmediato)
- El sistema está completamente caído y el redeploy no lo resolvió
- Un bug presente al lanzamiento que no fue detectado durante el UAT

**Contacto durante el período de garantía:**
- Tomás Pinolini: tomaspinolini2003@gmail.com
- Franco Zancocchia: zfi1811@gmail.com
- Tiempo de respuesta: días hábiles, dentro de 4 horas si el sistema está caído (P0), 24 horas para bugs normales

---

## 6. Limitaciones conocidas de v1

| Comportamiento | Explicación | Alternativa por ahora |
|---|---|---|
| Sin integración con el chatbot | CRM y chatbot son independientes en v1 | Gestionar turnos manualmente desde el CRM |
| Sin recordatorios por WhatsApp | WhatsApp es v2 — en v1 se usan emails | Los recordatorios y confirmaciones llegan por email; WhatsApp se agrega en v2 |
| Los hallazgos del peluquero no alertan al veterinario | Flujo pendiente de entrevista con el peluquero (v2) | El peluquero le avisa al veterinario manualmente |
| Cancelación masiva por suspensión no envía emails | Al suspender agenda, los turnos se cancelan pero no se notifica a cada cliente | Avisar manualmente a los clientes afectados; batch de emails en v2 |
| Sin impresión de recetas o prescripciones | Gestión de recetas con formato legal es v2 | El vet puede leer el plan de tratamiento en la consulta y dictar al cliente |
| Sin log de auditoría | No se registra quién cambió qué (v2) | Los campos `createdBy` y `updatedAt` dan visibilidad parcial |
| Sin reportes ni analíticas | Son funcionalidades de v3 | Exportar datos desde Supabase si se necesita un análisis puntual |
| Facturación ARCA pendiente | Fase D diferida a post-lanzamiento — pendiente certificado digital y credenciales ARCA | Paula sigue facturando manualmente como hasta ahora; la emisión de comprobantes electrónicos se agrega cuando se tengan las credenciales |

---

## 7. Próximas versiones

### v2 — Chatbot + WhatsApp + Automatización
- Integración CRM ↔ chatbot (turnos online, API pública)
- Canal WhatsApp vía Kapso
- Recordatorios de turno, peluquería y vacunas por WhatsApp
- Confirmación de turno por WhatsApp
- Alertas al veterinario por hallazgos del peluquero

### v3 — Inteligencia y automatización avanzada
- Dictado por voz para historia clínica
- Tiempo estimado de peluquería calculado automáticamente
- Business intelligence y reportes de rentabilidad
- Pagos online (Mercado Pago / QR)
- Portal del tutor / app para clientes

Ver roadmap completo en `crm/docs/roadmap.md`.

---

## 8. Firma de entrega

| Rol | Nombre | Fecha | Firma |
|---|---|---|---|
| Agencia — entregado por | Tomás Pinolini / Franco Zancocchia | | |
| Cliente — recibido por | Paula Silveira | | |

*Ambas partes confirman que todos los entregables listados en el charter fueron entregados, probados y aceptados.*
