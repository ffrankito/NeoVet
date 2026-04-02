# Entrega del Proyecto — NeoVet CRM v1

| Campo | Valor |
|---|---|
| **Proyecto** | NeoVet CRM |
| **Cliente** | Paula Silveira — NeoVet |
| **Agencia** | Tomás Pinolini / Franco Zancocchia |
| **URL de producción** | <!-- TODO: agregar URL de Vercel al momento del deploy --> |
| **Fecha de entrega** | <!-- AAAA-MM-DD --> |
| **Fin del período de soporte** | <!-- AAAA-MM-DD --> |
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
- [ ] Todos los entregables del charter probados en producción (D1–D14)
- [ ] Paula y el equipo completaron el UAT
- [ ] Flujo de consulta completo probado: crear turno → confirmar → completar → registrar consulta → agregar ítems de tratamiento → métodos complementarios
- [ ] Flujo de peluquería completo probado: crear turno de peluquería → asignar peluquero → peluquero registra sesión → fotos subidas → hallazgos registrados
- [ ] Cada rol probado en aislamiento (ingresar como veterinario, como peluquero — verificar que las rutas bloqueadas redirigen)
- [ ] Flujo de facturación probado: registrar pago → generar factura → enviar a ARCA → recibir CAE
- [ ] Catálogo de servicios configurado con los servicios de Paula
- [ ] Vista semanal de calendario verificada con slots libres y bloqueos de cirugía
- [ ] Suspensión de agenda: profesional puede bloquear días/franjas y turnos afectados se cancelan
- [ ] Recordatorios por email probados: turno 48h/24h, vacunas 7 días antes, seguimiento post-consulta
- [ ] Pet shop: crear producto → registrar entrada de stock → stock sube → registrar venta → stock baja → badge de stock bajo visible
- [ ] Caja: abrir sesión → registrar movimientos → ventas se reflejan en balance → cerrar con conteo de efectivo
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
- [ ] Credenciales ARCA configuradas en las variables de entorno de producción
- [ ] El acceso de la agencia fue reducido o eliminado según el acuerdo

---

## 2. ¿Qué hace el sistema?

### Descripción general

NeoVet CRM es la herramienta interna de la clínica para gestionar toda la operación diaria sin depender de GVet. Desde acá podés:

- **Clientes y pacientes** — buscar cualquier dueño, ver sus mascotas, editar datos de contacto.
- **Turnos** — crear turnos veterinarios o de peluquería, asignarlos a un profesional, confirmarlos y marcarlos como completados. Vista semanal con slots libres y bloqueos de cirugía. Cada profesional puede suspender su propia agenda por día(s) o franja horaria.
- **Catálogo de servicios** — lista de servicios con duración predeterminada; las cirugías bloquean el calendario el tiempo que se configure.
- **Historia clínica** — registrar cada consulta con notas SOAP, signos vitales, plan de tratamiento (con medicamento, dosis, frecuencia y duración), vacunas y desparasitaciones. Se pueden adjuntar documentos clasificados por categoría (laboratorio, radiografía, ecografía, foto) y métodos complementarios (informes de estudios con fotos opcionales).
- **Peluquería** — cada perro que pasa por peluquería tiene su perfil propio (comportamiento, tipo de pelaje, tiempo estimado). El peluquero registra cada sesión con fotos antes/después, hallazgos y precio final.
- **Pet shop** — catálogo de productos con 9 categorías, gestión de proveedores, ingresos de stock y ventas con carrito multi-ítem. El stock se actualiza automáticamente al registrar ingresos y ventas. Alerta visual de stock bajo.
- **Caja** — apertura y cierre de sesiones de caja, movimientos de ingresos y egresos, desglose por método de pago. Las ventas del período se incorporan automáticamente al balance.
- **Facturación** — registrar pagos y emitir facturas electrónicas (ARCA) de forma opcional. Control de límites por entidad fiscal para evitar recategorización. *(Fase D — pendiente de build.)*
- **Recordatorios por email** — el sistema envía recordatorios automáticos: turno 48h y 24h antes, vacunas 7 días antes, seguimiento post-consulta.
- **Staff y accesos** — cada integrante del equipo tiene su propio usuario con el acceso que le corresponde según su rol.

### ¿Quién usa qué?

| Rol | Qué puede hacer |
|---|---|
| **Admin** (Paula, recepción) | Todo — clientes, pacientes, turnos, historia clínica, peluquería, pet shop, caja, facturación, staff, configuración |
| **Veterinario/a** | Ver clientes · Ver y editar pacientes · Ver turnos veterinarios · Registrar y editar consultas |
| **Peluquero/a** | Ver turnos de peluquería · Registrar sesiones de peluquería · Editar perfil de peluquería del paciente |

### ¿Qué es automático vs. manual?

| Acción | Modo | Responsable |
|---|---|---|
| Confirmar turno | Manual | Recepción / admin |
| Asignar profesional al turno | Manual | Recepción / admin |
| Registrar consulta | Manual | Veterinario/a |
| Registrar sesión de peluquería | Manual | Peluquero/a |
| Registrar venta en pet shop | Manual | Admin |
| Abrir/cerrar caja | Manual | Admin |
| Stock sube al registrar entrada | Automático | Sistema |
| Stock baja al registrar venta | Automático | Sistema |
| Emitir factura | Manual (opcional) | Admin |
| Pago por Mercado Pago → requiere factura | Regla automática | Sistema |
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
| El peluquero no ve sus turnos | El turno no está tipificado como "grooming" o no está asignado | Un admin edita el turno y cambia el tipo o la asignación |
| Error al emitir factura en ARCA | Certificado digital vencido o credenciales incorrectas | Verificar las variables `ARCA_*` en Vercel y renovar el certificado si aplica |
| No puedo subir una foto en la sesión de peluquería | Archivo muy grande o formato no soportado | Usar JPG o PNG, máximo 10 MB |

### Cuándo contactar a la agencia

Durante el período de soporte, contactarnos ante:
- Vulnerabilidades de seguridad o pérdida de datos (contacto inmediato)
- El sistema está completamente caído y el redeploy no lo resolvió
- Un bug presente al lanzamiento que no fue detectado durante el UAT

**Contacto durante el período de soporte:**
- Tomás Pinolini: <!-- email -->
- Franco Zancocchia: <!-- email -->
- Tiempo de respuesta: <!-- ej: días hábiles, dentro de 4hs para P0 -->

---

## 6. Limitaciones conocidas de v1

| Comportamiento | Explicación | Alternativa por ahora |
|---|---|---|
| Sin integración con el chatbot | CRM y chatbot son independientes en v1 | Gestionar turnos manualmente desde el CRM |
| Sin recordatorios por WhatsApp | WhatsApp es v2 — en v1 se usan emails | Los recordatorios llegan por email; WhatsApp se agrega en v2 |
| Los hallazgos del peluquero no alertan al veterinario | Flujo pendiente de entrevista con el peluquero (v2) | El peluquero le avisa al veterinario manualmente |
| Sin reportes ni analíticas | Son funcionalidades de v3 | Exportar datos desde Supabase si se necesita un análisis puntual |
| Facturación ARCA pendiente | Fase D no construida aún — pendiente certificado digital y credenciales | Registrar pagos se puede hacer; la emisión de comprobantes electrónicos se agrega cuando se tengan las credenciales |

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
