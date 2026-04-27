# Walk-in Queue & Waiting Room Dashboard

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add walk-in support with a waiting room dashboard that separates active patients from scheduled/completed, shows service category color badges, and supports urgent flagging.

**Architecture:** Two new boolean columns on `appointments` (`isWalkIn`, `isUrgent`). Dashboard page rewritten to show 3 sections: "Sala de espera" (confirmed appointments), "Turnos programados" (pending scheduled), and completed/no-show (dimmed, bottom). A new streamlined "Agregar a sala de espera" form on the dashboard for quick walk-in entry. Service category badges reuse the existing `SERVICE_COLORS` from `calendar-utils.ts`.

**Tech Stack:** Drizzle ORM (schema + migration), Next.js Server Components (dashboard), shadcn/ui (form + badges), existing `getServiceColors()` util

---

## File Map

| Action | File | Purpose |
|--------|------|---------|
| Modify | `crm/src/db/schema/appointments.ts` | Add `isWalkIn` + `isUrgent` columns |
| Generate | `crm/drizzle/migrations/0026_*.sql` | DB migration |
| Modify | `crm/src/app/dashboard/page.tsx` | Rewrite dashboard with 3 sections + service badges |
| Modify | `crm/src/components/admin/dashboard-actions.tsx` | Add "Agregar a sala de espera" button |
| Create | `crm/src/components/admin/appointments/walk-in-form.tsx` | Streamlined walk-in form (patient + service + urgent) |
| Modify | `crm/src/app/dashboard/appointments/actions.ts` | Add `createWalkIn` server action |

---

### Task 1: Schema — add `isWalkIn` and `isUrgent` columns

**Files:**
- Modify: `crm/src/db/schema/appointments.ts:25-49`

- [ ] **Step 1: Add 2 boolean columns**

In `crm/src/db/schema/appointments.ts`, inside the `appointments` table definition, add after the `sendReminders` line (line 46) and before `createdAt` (line 47):

```ts
  isWalkIn: boolean("is_walk_in").default(false).notNull(),
  isUrgent: boolean("is_urgent").default(false).notNull(),
```

- [ ] **Step 2: Generate migration**

```bash
cd C:/Users/tomas/dev/personal/zzz/neovet/crm && npm run db:generate
```

Expected: Migration with 2 `ALTER TABLE "appointments" ADD COLUMN` statements. Both `boolean NOT NULL DEFAULT false`.

- [ ] **Step 3: Inspect migration**

Read the generated SQL. Should contain exactly:

```sql
ALTER TABLE "appointments" ADD COLUMN "is_walk_in" boolean DEFAULT false NOT NULL;
ALTER TABLE "appointments" ADD COLUMN "is_urgent" boolean DEFAULT false NOT NULL;
```

Strip anything unexpected.

- [ ] **Step 4: Commit**

```
feat: add isWalkIn and isUrgent columns to appointments schema
```

---

### Task 2: Server action — `createWalkIn`

**Files:**
- Modify: `crm/src/app/dashboard/appointments/actions.ts`

- [ ] **Step 1: Add the `createWalkIn` server action**

Add this new function at the end of the mutations section in `crm/src/app/dashboard/appointments/actions.ts`. This is a streamlined version of `createAppointment` — fewer fields, auto-sets time to now and status to confirmed.

Read the file first to understand the existing patterns (imports, ID generators, auth checks). The function should:

1. Check `hasRole("admin", "owner", "vet", "groomer")`
2. Get `getSessionStaffId()` for `assignedStaffId`
3. Accept FormData with: `patientId` (required), `serviceId` (optional), `reason` (optional), `isUrgent` (boolean from checkbox)
4. Validate with a small Zod schema: `patientId: z.string().min(1)`
5. Insert an appointment with:
   - `id`: from `appointmentId()` generator
   - `patientId`: from form
   - `appointmentType`: `"veterinary"` (walk-ins are always vet, grooming is scheduled)
   - `serviceId`: from form or null
   - `scheduledAt`: `new Date()` (current time)
   - `durationMinutes`: 30 (default)
   - `reason`: from form or null
   - `status`: `"confirmed"` (walk-ins skip pending — they're already here)
   - `isWalkIn`: `true`
   - `isUrgent`: from form checkbox
   - `assignedStaffId`: current session staff ID
   - `sendReminders`: `false` (no point sending reminders for walk-ins)
6. `revalidatePath("/dashboard")`
7. Return `{ success: true }` or `{ error: "..." }`

Also, export a `getServicesForWalkIn` query that returns active services (id + name + category) for the walk-in form's service picker:

```ts
export async function getServicesForWalkIn() {
  return db
    .select({
      id: services.id,
      name: services.name,
      category: services.category,
    })
    .from(services)
    .where(eq(services.isActive, true))
    .orderBy(services.name);
}
```

- [ ] **Step 2: Commit**

```
feat: add createWalkIn server action and getServicesForWalkIn query
```

---

### Task 3: Walk-in form component

**Files:**
- Create: `crm/src/components/admin/appointments/walk-in-form.tsx`

- [ ] **Step 1: Create the walk-in form component**

Create `crm/src/components/admin/appointments/walk-in-form.tsx`. This is a "use client" component with a streamlined form for adding walk-ins from the dashboard.

**Props:**
```tsx
interface WalkInFormProps {
  clients: Array<{ id: string; name: string }>;
  patients: Array<{ id: string; name: string; species: string; clientId: string; clientName: string }>;
  services: Array<{ id: string; name: string; category: string | null }>;
}
```

**UI structure:**
- A collapsible section (initially hidden) toggled by a button on the dashboard
- Client selector (SearchableSelect) — filters patients
- Patient selector (SearchableSelect, filtered by client)
- Service selector (optional, SearchableSelect with service name)
- Reason text input (optional, placeholder "Motivo de consulta...")
- Urgent checkbox with label "Urgente" and red styling
- Submit button "Agregar a sala de espera"

**Behavior:**
- Uses `useActionState` with `createWalkIn` server action
- On successful submit, resets form state (clears selections)
- The `patientId` is set from the SearchableSelect state, same pattern as `procedure-form.tsx`
- `isUrgent` is submitted as a checkbox: `formData.get("isUrgent") === "on"`

**Imports needed:**
```tsx
import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { createWalkIn } from "@/app/dashboard/appointments/actions";
```

The component should be wrapped in a `<details>` / disclosure pattern OR use state to show/hide the form. Use a simple `useState<boolean>(false)` toggle — button says "+ Agregar a sala de espera", clicking it shows the form below, submitting or clicking "Cancelar" hides it.

- [ ] **Step 2: Commit**

```
feat: add walk-in form component for dashboard
```

---

### Task 4: Dashboard rewrite — 3 sections with service badges

**Files:**
- Modify: `crm/src/app/dashboard/page.tsx`

This is the largest task. The dashboard page needs to be rewritten to show 3 sections instead of one flat list. Read the full file first.

- [ ] **Step 1: Update the query to include service category and walk-in/urgent flags**

In the `todayAppointments` query (around line 68-92), add these fields to the select:

```ts
          serviceCategory: services.category,
          isWalkIn: appointments.isWalkIn,
          isUrgent: appointments.isUrgent,
```

Also add a `leftJoin` for services (the query already joins patients, clients, staff):

```ts
        .leftJoin(services, eq(appointments.serviceId, services.id))
```

Import `services` from `@/db/schema` if not already imported (check the existing import on line 3 — it has `clients, patients, appointments, staff` but may not have `services`).

Import `getServiceColors` from `@/lib/calendar-utils`:

```ts
import { getServiceColors } from "@/lib/calendar-utils";
```

- [ ] **Step 2: Split appointments into 3 groups**

After the query executes, split `todayAppointments` into 3 arrays:

```tsx
  // Sala de espera: confirmed (physically present — scheduled arrivals + walk-ins)
  const waitingRoom = todayAppointments
    .filter((apt) => apt.status === "confirmed")
    .sort((a, b) => {
      // Urgent first, then by scheduledAt
      if (a.isUrgent && !b.isUrgent) return -1;
      if (!a.isUrgent && b.isUrgent) return 1;
      return new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime();
    });

  // Turnos programados: pending (expected but not yet arrived)
  const scheduled = todayAppointments
    .filter((apt) => apt.status === "pending");

  // Completados / no se presentó: dimmed at bottom
  const finished = todayAppointments
    .filter((apt) => apt.status === "completed" || apt.status === "no_show" || apt.status === "cancelled");
```

- [ ] **Step 3: Rewrite the appointments rendering section**

Replace the current single list (lines 137-197) with 3 sections. Each section uses a shared `AppointmentRow` helper component. Define the helper inside the same file (above `DashboardContent` or inline):

```tsx
function AppointmentRow({
  apt,
  dimmed = false,
}: {
  apt: typeof todayAppointments[number];
  dimmed?: boolean;
}) {
  const colors = getServiceColors(apt.serviceCategory);

  return (
    <div
      className={cn(
        "flex items-center gap-4 px-4 py-3",
        dimmed && "opacity-50",
        apt.isUrgent && apt.status === "confirmed" && "bg-red-50 border-l-4 border-l-red-500"
      )}
    >
      {/* Service category dot */}
      <span
        className={cn("h-3 w-3 shrink-0 rounded-full", colors.bg, colors.border, "border")}
        title={apt.serviceCategory ?? "Sin servicio"}
      />

      {/* Time */}
      <span className="w-14 shrink-0 text-sm font-mono font-medium text-muted-foreground">
        {apt.isWalkIn ? "S/T" : formatTimeART(apt.scheduledAt, {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        })}
      </span>

      {/* Patient + owner + reason + staff */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <Link
            href={`/dashboard/appointments/${apt.id}`}
            className="font-medium hover:underline truncate"
          >
            {apt.patientName}
          </Link>
          {apt.isWalkIn && (
            <Badge variant="outline" className="text-xs">Sin turno</Badge>
          )}
          {apt.isUrgent && (
            <Badge variant="destructive" className="text-xs">Urgente</Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground truncate">
          <Link
            href={`/dashboard/clients/${apt.clientId}`}
            className="hover:underline"
          >
            {apt.clientName}
          </Link>
          {apt.reason ? ` — ${apt.reason}` : ""}
          {apt.assignedStaffName ? (
            <span className="ml-2 text-xs text-primary-600">· {apt.assignedStaffName}</span>
          ) : null}
        </p>
      </div>

      {/* Status badge */}
      <Badge variant={statusVariants[apt.status] ?? "secondary"}>
        {statusLabels[apt.status] ?? apt.status}
      </Badge>

      {/* Inline actions */}
      <AppointmentActions
        appointmentId={apt.id}
        patientId={apt.patientId}
        status={apt.status as "pending" | "confirmed" | "cancelled" | "completed" | "no_show"}
      />
    </div>
  );
}
```

Import `cn` from `@/lib/utils` if not already imported.

Then render the 3 sections:

```tsx
      {/* Sala de espera */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Sala de espera</h2>
        {waitingRoom.length === 0 ? (
          <div className="rounded-lg border border-dashed py-6 text-center text-muted-foreground">
            No hay pacientes en espera.
          </div>
        ) : (
          <div className="rounded-lg border divide-y">
            {waitingRoom.map((apt) => (
              <AppointmentRow key={apt.id} apt={apt} />
            ))}
          </div>
        )}
      </div>

      {/* Turnos programados */}
      {scheduled.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Turnos programados</h2>
          <div className="rounded-lg border divide-y">
            {scheduled.map((apt) => (
              <AppointmentRow key={apt.id} apt={apt} />
            ))}
          </div>
        </div>
      )}

      {/* Completados / no se presentó */}
      {finished.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-muted-foreground">Completados</h2>
          <div className="rounded-lg border divide-y">
            {finished.map((apt) => (
              <AppointmentRow key={apt.id} apt={apt} dimmed />
            ))}
          </div>
        </div>
      )}
```

- [ ] **Step 4: Commit**

```
feat: rewrite dashboard with waiting room sections and service category badges
```

---

### Task 5: Wire walk-in form into the dashboard

**Files:**
- Modify: `crm/src/app/dashboard/page.tsx`
- Modify: `crm/src/components/admin/dashboard-actions.tsx`

- [ ] **Step 1: Fetch data for the walk-in form in the dashboard page**

In `DashboardContent()` (around line 30), add imports and data fetches for the walk-in form:

```ts
import { getAllClientsForSelect, getAllPatientsForSelect, getServicesForWalkIn } from "@/app/dashboard/appointments/actions";
import { WalkInForm } from "@/components/admin/appointments/walk-in-form";
```

Inside the `Promise.all` (or after it), fetch the walk-in form data:

```ts
  const [walkInClients, walkInPatients, walkInServices] = await Promise.all([
    getAllClientsForSelect(),
    getAllPatientsForSelect(),
    getServicesForWalkIn(),
  ]);
```

- [ ] **Step 2: Add the WalkInForm to the dashboard**

Place the `WalkInForm` component between the `DashboardActions` and the cash register status section. Pass the fetched data:

```tsx
      {/* Walk-in form */}
      <WalkInForm
        clients={walkInClients}
        patients={walkInPatients}
        services={walkInServices}
      />
```

- [ ] **Step 3: Remove the "Nuevo turno" link from DashboardActions if desired, or keep both**

In `crm/src/components/admin/dashboard-actions.tsx`, keep the existing "Nuevo turno" link (for scheduled appointments) as-is. The walk-in form is separate and lives in the dashboard directly. No changes needed to this file unless we want to rename "Nuevo turno" to "Nuevo turno programado" for clarity:

```tsx
      <Link href="/dashboard/appointments/new" className={buttonVariants({ variant: "outline" })}>
        Nuevo turno programado
      </Link>
```

- [ ] **Step 4: Commit**

```
feat: wire walk-in form into dashboard page
```

---

### Task 6: Final verification

- [ ] **Step 1: TypeScript check**

```bash
cd C:/Users/tomas/dev/personal/zzz/neovet/crm && npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 2: End-to-end test**

1. Navigate to the dashboard
2. Verify 3 sections appear (Sala de espera, Turnos programados, Completados)
3. Click the walk-in form toggle — verify form appears with patient picker, service picker, urgent checkbox
4. Create a walk-in — verify it appears in "Sala de espera" as confirmed with "Sin turno" badge
5. Create an urgent walk-in — verify it appears at the TOP of the waiting room with red highlight and "Urgente" badge
6. Verify a regular pending appointment shows in "Turnos programados"
7. Confirm an appointment — verify it moves to "Sala de espera"
8. Complete an appointment — verify it moves to "Completados" section, dimmed
9. Verify service category color dots appear on all appointment rows

- [ ] **Step 3: Final commit (if cleanup needed)**

Only if adjustments were needed during testing.
