# CRM Phase 4 + Data Import — Design Spec

| Field | Value |
|---|---|
| **Date** | 2026-03-27 |
| **Author** | Tomás Pinolini + Claude |
| **Status** | Approved |
| **Scope** | `crm/` only |
| **Depends on** | Phases 0–3 complete (✅) |

---

## 1. Scope

This spec covers:

1. **Phase 4 Polish** — validation, loading states, delete confirmations, dashboard home
2. **CSV Import Script** — one-time migration of GVet data into NeoVet

Deployment to Vercel is handled manually by Tomás — not part of this spec.

---

## 2. Validation

### Decision
Zod server-side only. No `react-hook-form` or other client-side validation library.

### Approach
All server actions that write data return field-level errors:

```ts
// Return shape
type ActionResult =
  | { errors: { name?: string; phone?: string; email?: string; [key: string]: string | undefined } }
  | { error: string }
  | undefined  // success (redirect)
```

Each form component:
1. Calls the action via `useActionState` (or existing `handleSubmit` pattern)
2. Reads `result.errors.fieldName`
3. Renders a `<p className="text-sm text-destructive">` beneath the relevant `<Input>`

### Fields to validate per form

| Form | Required | Format |
|---|---|---|
| Client | name, phone | phone: non-empty string |
| Patient | name, species, clientId | dob: valid date if provided |
| Appointment | patientId, scheduledAt, durationMinutes | scheduledAt: future date; duration: positive integer |

---

## 3. Loading States

### Decision
Next.js `loading.tsx` convention + Suspense. No per-component `isLoading` booleans.

### Files to create

| File | Skeleton shown |
|---|---|
| `src/app/dashboard/clients/loading.tsx` | `TableSkeleton` — header row + 5 gray rows |
| `src/app/dashboard/appointments/loading.tsx` | `TableSkeleton` — header row + 5 gray rows |
| `src/app/dashboard/clients/[id]/loading.tsx` | `DetailSkeleton` — title block + two content sections |
| `src/app/dashboard/patients/[id]/loading.tsx` | `DetailSkeleton` |
| `src/app/dashboard/appointments/[id]/loading.tsx` | `DetailSkeleton` |

### Skeleton components

Created in `src/components/admin/skeletons.tsx`:

- `TableSkeleton` — renders a `<Skeleton>` for each cell across N rows
- `DetailSkeleton` — renders title + two content block skeletons
- `CardSkeleton` — used by the dashboard summary cards

---

## 4. Delete Confirmations

### Decision
shadcn/ui `AlertDialog` on every destructive action. No delete executes without explicit confirmation.

### Scope

| Action | Trigger | Dialog text |
|---|---|---|
| Delete client | Button on client detail page | "¿Eliminar cliente? Esta acción no se puede deshacer. Se eliminarán también todos sus pacientes." |
| Delete patient | Button on patient detail page | "¿Eliminar paciente? Esta acción no se puede deshacer." |
| Cancel appointment | Button on appointment detail page | "¿Cancelar turno? El turno quedará marcado como cancelado." |

### Implementation
Each confirmation is a small client component wrapping `AlertDialog`. The destructive server action is only called when the user confirms.

---

## 5. Dashboard Home

### Summary Cards
Three cards, each with a count fetched server-side:

| Card | Label | Query |
|---|---|---|
| 1 | Clientes | `COUNT(*) FROM clients` |
| 2 | Pacientes | `COUNT(*) FROM patients` |
| 3 | Turnos hoy | `COUNT(*) FROM appointments WHERE DATE(scheduled_at) = CURRENT_DATE AND status != 'cancelled'` |

### Quick Actions
Two buttons below the cards:
- **Nuevo cliente** → `/dashboard/clients/new`
- **Nuevo turno** → `/dashboard/appointments/new`

### Today's Appointments List
Below the cards: a list of today's appointments ordered by `scheduled_at ASC`.

Each row shows:
- Scheduled time (e.g. "10:30")
- Patient name + owner name
- Status badge (color-coded)
- **Confirmar** button (pending → confirmed) — inline server action
- **Cancelar** button → opens `AlertDialog` before cancelling

Empty state: "No hay turnos para hoy."

---

## 6. CSV Import Script

### Decision
CLI script only. No UI. One-time use. Deleted after migration.

### Location
`scripts/import-gvet.ts`

### Usage
```bash
npx tsx scripts/import-gvet.ts --clients clientes.csv --patients pacientes.csv
```

### Column mapping
A `COLUMN_MAP` config object at the top of the script maps GVet CSV headers → NeoVet fields. Adjusted once after inspecting the real CSV headers.

```ts
const CLIENT_MAP = {
  name: "Nombre",        // GVet column name — adjust to match actual CSV
  phone: "Teléfono",
  email: "Email",
}

const PATIENT_MAP = {
  ownerName: "Propietario",  // used to look up client FK
  name: "Nombre",
  species: "Especie",
  breed: "Raza",
  dob: "Fecha de nacimiento",
}
```

### Behaviour
1. Parse CSV with Node.js built-in `fs` + a lightweight CSV parser
2. For each client row: upsert by phone (skip if already exists)
3. For each patient row: look up client by owner name, insert patient
4. Set `importedFromGvet: true` on all inserted records
5. Log: `✓ 142 clientes insertados · 3 omitidos (ya existían)`
6. Dry-run mode: `--dry-run` flag logs what would be inserted without writing

### Error handling
- Missing required field → log warning, skip row, continue
- Client not found for patient → log warning, skip patient row
- DB error → abort with full error message

---

## 7. Out of Scope

These are explicitly not in this spec:

- Billing / AFIP — pending Paula meeting
- SOAP / clinical history — pending Paula meeting
- Staff roles / RBAC — v1 next phase
- WhatsApp notifications — v2
- Vercel deployment — handled manually by Tomás

---

## 8. Open Questions (resolve at Paula meeting)

See `docs/paula-meeting.md` for the full list. Key ones that affect this spec:

- **Soft delete policy** — if Paula wants archiving instead of hard delete, the `AlertDialog` copy and server actions need updating
- **CSV column names** — exact GVet headers unknown until Tomás downloads the files
