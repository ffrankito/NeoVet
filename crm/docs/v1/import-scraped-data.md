# Importación de datos scrapeados de GVet

| Campo | Valor |
|---|---|
| **Autor** | Tomás Pinolini |
| **Fecha** | 2026-04-09 |
| **Estado** | Pendiente de ejecución |
| **Prerequisito** | Acceso a Supabase producción (DATABASE_URL con password correcto) |

---

## Contexto

Se extrajeron datos de GVet que no están disponibles vía exportación CSV: internaciones, procedimientos y deudores. Los datos fueron scrapeados manualmente (guardando páginas HTML desde Firefox) y convertidos a JSON mediante un parser.

---

## Archivos involucrados

| Archivo | Qué hace |
|---------|----------|
| `scripts/gvet-data/internaciones.json` | 11 internaciones extraídas de GVet |
| `scripts/gvet-data/procedimientos.json` | 74 procedimientos extraídos de GVet |
| `scripts/gvet-data/deudores.json` | 42 deudores con saldo pendiente |
| `scripts/parse-gvet-html.ts` | Parser que convierte HTML → JSON (ya fue ejecutado) |
| `scripts/import-gvet-scraped.ts` | Script que importa los JSON a la base de datos |

---

## Pasos para ejecutar la importación

### 1. Configurar acceso a la base de datos de producción

Copiar `.env.prod` a `.env.local` y verificar que `DATABASE_URL` tenga la contraseña correcta:

```bash
cd crm
cp .env.prod .env.local
```

Verificar que `DATABASE_URL` en `.env.local` tenga el formato correcto con la contraseña de producción. La contraseña se obtiene de: **Supabase Dashboard → Proyecto NeoVet → Settings → Database → Connection string (Session mode, puerto 5432)**.

### 2. Verificar que las migraciones estén aplicadas

Las migraciones 0021 y 0022 deben estar aplicadas en producción. Si no lo están:

```bash
npm run db:migrate
```

Esto crea las tablas: `hospitalizations`, `hospitalization_observations`, `procedures`, `procedure_staff`, `procedure_supplies`, `consent_templates`, `consent_documents`, `charges`.

### 3. Ejecutar dry run (verificar sin escribir datos)

```bash
npx tsx scripts/import-gvet-scraped.ts --dry-run
```

Esto muestra qué se importaría sin tocar la base de datos. Verificar:
- Cuántas internaciones/procedimientos/deudores matchean con pacientes/clientes existentes
- Cuántos se omiten por no encontrar el paciente/cliente
- Los nombres de staff que se resuelven (cirujanos, anestesiólogos)

### 4. Ejecutar la importación real

```bash
npx tsx scripts/import-gvet-scraped.ts
```

Se puede importar por secciones si se prefiere:
```bash
npx tsx scripts/import-gvet-scraped.ts --sections internaciones
npx tsx scripts/import-gvet-scraped.ts --sections procedimientos
npx tsx scripts/import-gvet-scraped.ts --sections deudores
```

### 5. Seed de templates de consentimiento

```bash
npx tsx scripts/seed-consent-templates.ts
```

### 6. Crear bucket de Storage

En Supabase Dashboard → Storage → New Bucket:
- Nombre: `consent-documents`
- Acceso: **Private**

---

## Cómo funciona la importación

### Internaciones
- Busca el paciente en NeoVet por `patients.gvetId`
- Si no encuentra el paciente, omite ese registro y lo reporta
- Dedup: si ya existe una internación para el mismo paciente en la misma fecha, omite
- "Caducó" en el campo Alta se interpreta como dado de alta

### Procedimientos
- Busca el paciente por `patients.gvetId`
- Resuelve cirujanos y anestesiólogos por nombre en la tabla `staff` (match parcial, case-insensitive)
- Soporta múltiples cirujanos ("silveyra y ferreyra" se separa e importa como 2 entradas en `procedure_staff`)
- Los recordatorios de GVet se guardan en el campo `notes`
- Dedup: mismo paciente + misma fecha + misma descripción

### Deudores
- Busca el cliente por `clients.gvetId`, y si no encuentra, intenta por nombre
- Crea cargos individuales por categoría (ventas, visitas, estética, guardería, cuenta actual) — solo las que tienen monto > 0
- Descripción incluye "Importado de GVet" para trazabilidad
- Dedup: no re-importa si ya existe un cargo con "Importado de GVet" para ese cliente

### Idempotencia
Todos los imports son seguros de re-ejecutar. Si se corren de nuevo, los registros ya existentes se omiten.

---

## Troubleshooting

| Error | Causa | Solución |
|-------|-------|----------|
| `ENOTFOUND db.xxx.supabase.co` | DATABASE_URL apunta a un branch de Supabase inactivo | Usar la URL de producción |
| `password authentication failed` | Contraseña incorrecta en DATABASE_URL | Verificar en Supabase Dashboard → Settings → Database |
| `Paciente no encontrado` | El paciente de GVet no fue importado previamente | Correr `import-gvet.ts` primero con CSVs actualizados |
| `Cliente no encontrado` | El cliente no existe en NeoVet | Verificar que se corrió la importación de clientes |

---

## Después de la importación

- Verificar en el CRM que las internaciones aparecen en `/dashboard/hospitalizations`
- Verificar que los procedimientos aparecen en `/dashboard/procedures`
- Verificar que los deudores aparecen en `/dashboard/deudores`
- Verificar en el detalle de un paciente que las pestañas "Internaciones" y "Procedimientos" muestran los datos importados
