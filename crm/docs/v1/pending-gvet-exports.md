# Datos pendientes de exportar desde GVet

> Checklist para Paula. Cada ítem es un exportable de GVet que alimenta una funcionalidad del CRM.

## Prioridad alta

### Historial de vacunas
- **¿Por qué?** El CRM envía recordatorios automáticos 7 días antes del vencimiento. Sin este dato, no puede calcular la próxima dosis.
- **Campos necesarios:** nombre del paciente, nombre de la vacuna, fecha de aplicación, fecha de próximo vencimiento, lote (opcional).
- **Formato:** CSV o Excel.
- **Estado:** ⬜ Pendiente de consultar con Paula.

### Historial de desparasitaciones
- **¿Por qué?** Misma lógica que vacunas — permite seguimiento y recordatorios.
- **Campos necesarios:** nombre del paciente, producto usado, fecha de aplicación, dosis, fecha de próxima aplicación.
- **Formato:** CSV o Excel.
- **Estado:** ⬜ Pendiente de consultar con Paula.

## Prioridad media

### Historial de ventas / facturación
- **¿Por qué?** Permite no arrancar de cero con el módulo de pet shop. Útil para reportes de facturación y análisis de productos más vendidos.
- **Campos necesarios:** fecha, productos vendidos, cantidades, precios, método de pago.
- **Formato:** CSV o Excel.
- **Estado:** ⬜ Pendiente de consultar con Paula.

## Ya disponible (no requiere nueva exportación)

| Dato | Archivo | Estado |
|------|---------|--------|
| Clientes | `Lista de clientes.csv` | ✅ Importado |
| Pacientes | `Lista de pacientes.csv` | ✅ Importado |
| Visitas (marzo) | `Visitas-03-2026.csv` | ✅ Importado |
| Visitas (abril) | `Visitas-04-2026.csv` | ✅ Importado |
| Productos | `lista_precios 2026-04-01-18-49-51.csv` | ✅ Script listo |
| Proveedores | `proveedores.txt` | 🔲 Script por crear |

## No requiere importación

| Dato | Razón |
|------|-------|
| Staff (equipo) | Son 3 personas, se crean manualmente |
| Servicios | Ya cargados en el seed (9 servicios) |
| Perfiles de peluquería | Se crean con el uso, no hay data histórica estructurada en GVet |
| Tratamientos | En GVet es texto libre dentro de las visitas, no está estructurado por ítem |
| Seguimientos post-consulta | Feature nueva del CRM, no existe en GVet |
