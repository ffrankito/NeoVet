# Checklist Pre-Lanzamiento — NeoVet v1

**Fecha de demo:** miércoles 9 de abril 2026 ✅ realizada
**Semana de UAT:** Postpuesta — proyecto en fase de desarrollo (ver nota abajo)
**Fecha de entrega formal:** Pendiente — TBD tras cerrar gaps de desarrollo
**Responsables:** Tomás Pinolini / Franco Zancocchia

> **⚠️ Estado (2026-04-18):** UAT postpuesto. El relevamiento con Paula, Valdemar y Fernanda identificó gaps (internaciones con fluidoterapia, procedimientos con ASA/roles, cargos auto, agendas compartidas, acceso a costos para vets, reemplazo de "Neocitas"). El proyecto volvió a fase de desarrollo activa para cerrarlos. Pendiente: entrevista con recepción/administración, re-scope v1 vs v2, y reprogramación de UAT una vez cerrados los gaps.

---

## Claves generadas

Estas claves ya están generadas. Copialas tal cual a las variables de entorno de Vercel.

```
CRON_SECRET=a05cc5e9006ffeb4f5b659358273d99183d21c576a09c6ced7bf178bc25dc8d2
BOT_API_KEY=605868ec4b078514cd3bea471f76c6d58497ed5f776863d629ed80743aa9df3f
```

> Después de cargarlas en Vercel, eliminá este bloque del documento por seguridad.

---

## Antes del miércoles 9 (demo)

### Franco

- [ ] **Cargar variables de entorno en Vercel** (Proyecto → Settings → Environment Variables → Production):

  | Variable | Valor | Estado |
  |----------|-------|--------|
  | `NEXT_PUBLIC_APP_URL` | `https://neo-vet-eta.vercel.app` (o el dominio final) | ⚠️ Está en `localhost:3000` — cambiar |
  | `CRON_SECRET` | Ver bloque de claves arriba | ⚠️ No está cargada |
  | `BOT_API_KEY` | Ver bloque de claves arriba | ⚠️ No está cargada |
  | `RESEND_API_KEY` | Obtener de resend.com → API Keys | ⚠️ No está cargada |
  | `EMAIL_FROM` | `NeoVet <turnos@neovet.com.ar>` (o dominio verificado) | ⚠️ No está cargada |

- [ ] **Redeploy en Vercel** después de cargar las variables (las variables no toman efecto hasta el próximo deploy)
- [ ] **Verificar migraciones en producción**: Supabase → tu proyecto → Table Editor → contar que haya 27 tablas
- [ ] **Habilitar backups automáticos**: Supabase → Settings → Backups → verificar que esté activo
- [ ] **Crear la cuenta admin de Paula**:
  ```bash
  cd crm
  npx tsx scripts/seed-user.ts --email [EMAIL_DE_PAULA] --password [CONTRASEÑA_TEMPORAL] --name "Paula Silveira" --role admin
  ```
- [ ] **Correr npm audit fix**:
  ```bash
  cd crm
  npm audit fix
  ```
- [ ] **Verificar que no haya secretos en el repo**:
  ```bash
  git grep -r "service_role" --exclude-dir=node_modules
  git grep -r "sk-ant" --exclude-dir=node_modules
  ```
- [ ] **Smoke test**: Abrir `https://neo-vet-eta.vercel.app`, loguearte, navegar el dashboard. ¿Funciona todo?

- [ ] **Verificar dominio de email en Resend**: Resend dashboard → Domains → agregar y verificar `neovet.com.ar` (o el dominio que usen). Requiere agregar registros DNS (MX, SPF, DKIM).
- [ ] **Confirmar que el deploy de Vercel apunta a base de producción** (no a preview/dev)
- [ ] **Lo de Kapso** (no bloqueante para v1, pero si está listo, mejor)

### Preguntarle a Paula (miércoles 9 en la reunión)

- [ ] **Emails del equipo** para crear las 9 cuentas de staff (5 vets, 2 recepcionistas, 1 esteticista)
- [ ] **Precios de estética por tier** (mín / medio / difícil) → configurar en Settings → Precios de estética
- [ ] **Duraciones de cirugía** → confirmar en el catálogo de servicios
- [ ] **¿Cargó datos nuevos en Geovet esta semana?** → si sí, hacer una migración final antes del 20

---

## Antes del lunes 20 (entrega formal)

### Verificación post-UAT *(pendiente — UAT postpuesto)*

- [ ] **Todos los bugs reportados por Paula resueltos**
- [ ] **Crons de Vercel verificados**: Vercel → Logs → Crons → verificar que corren a las 12:00 UTC diariamente
- [ ] **Email de recordatorio de turno probado**: crear turno a 48h, verificar que llegue el email al día siguiente
- [ ] **Email de confirmación de turno probado**: crear turno → ¿llega email al cliente?
- [ ] **Email de cancelación probado**: cancelar turno → ¿llega email con motivo?
- [ ] **Cada rol probado**: loguearse como vet (solo ve sus turnos), como esteticista (solo estética), como admin (ve todo)

### Seguridad

- [ ] **npm audit**: sin vulnerabilidades altas o críticas
- [ ] **HTTPS activo**: confirmar en el navegador (Vercel lo da por defecto)
- [ ] **Rutas protegidas**: visitar `/dashboard` sin sesión → tiene que redirigir a `/login`

### Transferencia de accesos

- [ ] **Paula tiene admin en Vercel**: invitarla al proyecto en Vercel
- [ ] **Paula tiene admin en Supabase**: invitarla al proyecto en Supabase
- [ ] **Paula tiene su cuenta admin en el CRM**: verificar que puede loguearse
- [ ] **Documentar credenciales en 1Password o Bitwarden** — nunca por WhatsApp o email

### Documentación

- [ ] **Completar URL de producción** en `crm/docs/v1/handoff.md` (línea 8)
- [ ] **Completar emails de contacto** en `crm/docs/v1/handoff.md` (líneas 201-203)
- [ ] **Completar tiempo de respuesta** durante garantía (ej: "días hábiles, dentro de 4hs para urgencias")
- [ ] **Verificar que `crm/README.md` tiene la URL correcta de producción**

### Entrega

- [ ] **Imprimir o enviar las guías de usuario** (Admin, Vet, Esteticista)
- [ ] **Llevar la guía de testeo resuelta** con los resultados del UAT *(cuando el UAT se reprograme)*
- [ ] **Firmar simbólicamente el handoff** — ambas partes

---

## Migración final de Geovet (solo si Paula cargó datos nuevos)

Si Paula estuvo usando Geovet entre la última importación y el 20 de abril:

```bash
cd crm

# 1. Pedirle a Paula el export de Excel actualizado

# 2. Nuke de la base (solo si es re-import completo — ver README.md)

# 3. Correr los scripts en orden:
npx tsx scripts/import-gvet.ts
npx tsx scripts/import-visitas.ts
npx tsx scripts/import-products.ts
npx tsx scripts/import-turnos-futuros.ts
npx tsx scripts/dedupe-patients.ts
npx tsx scripts/backfill-appointments-from-consultations.ts
npx tsx scripts/cleanup-imported-visits.ts

# 4. Verificar totales: ~1,771+ clientes, ~1,380+ pacientes
```

---

## Post-entrega (20 de abril en adelante)

- Eliminar el bloque de claves de este documento
- Reducir acceso de la agencia según lo acordado con Paula
- Iniciar período de garantía de 60 días (hasta 19 de junio)
- Fase D (facturación ARCA) se construye cuando lleguen credenciales — es independiente de la garantía
