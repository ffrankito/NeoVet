# Procedures — Assistant Role, ASA Classification, Pre/Post Vitals

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add assistant staff role, ASA anesthetic risk classification, and pre/post procedure vital signs to the procedures module.

**Architecture:** The assistant role reuses the existing `procedureStaff` join table (no migration — just a new role value `"assistant"`). ASA score is a new nullable text column on `procedures`. Pre/post vitals are 8 new nullable numeric columns on `procedures` (4 vitals x 2 timepoints). Form, action, query, and display all updated accordingly.

**Tech Stack:** Drizzle ORM (schema + migration), Zod (validation), shadcn/ui Select + Input (form), React Server Components (display)

---

## File Map

| Action | File | Purpose |
|--------|------|---------|
| Modify | `crm/src/db/schema/procedures.ts` | Add `asaScore` + 8 vitals columns to `procedures`, update role comment |
| Generate | `crm/drizzle/migrations/0025_*.sql` | DB migration (9 new columns) |
| Modify | `crm/src/app/dashboard/procedures/actions.ts` | Validation, FormData, insert/update, queries |
| Modify | `crm/src/components/admin/procedures/procedure-form.tsx` | Assistant checkboxes, ASA select, vitals inputs |
| Modify | `crm/src/app/dashboard/procedures/[id]/page.tsx` | Display assistant, ASA, vitals |

---

## ASA Options

```
"1" | "2" | "3" | "4" | "5" | "1E" | "2E" | "3E" | "4E" | "5E"
```

Labels for display:
- 1 = Sano
- 2 = Enfermedad sistémica leve
- 3 = Enfermedad sistémica grave
- 4 = Enfermedad sistémica grave con amenaza de vida
- 5 = Moribundo
- E suffix = Emergencia

---

### Task 1: Schema — add columns to `procedures` table

**Files:**
- Modify: `crm/src/db/schema/procedures.ts`

- [ ] **Step 1: Add numeric import and new columns**

In `crm/src/db/schema/procedures.ts`, add `numeric` to the import from `drizzle-orm/pg-core` (line 1):

```ts
import { numeric, pgTable, text, timestamp } from "drizzle-orm/pg-core";
```

Then add the following columns to the `procedures` table definition, after the `type` line (line 15) and before the `notes` line (line 16):

```ts
  asaScore: text("asa_score"), // '1' | '2' | '3' | '4' | '5' | '1E' | '2E' | '3E' | '4E' | '5E'

  // Pre-procedure vitals
  preWeightKg: numeric("pre_weight_kg", { precision: 5, scale: 2 }),
  preTemperature: numeric("pre_temperature", { precision: 4, scale: 1 }),
  preHeartRate: numeric("pre_heart_rate", { precision: 5, scale: 0 }),
  preRespiratoryRate: numeric("pre_respiratory_rate", { precision: 4, scale: 0 }),

  // Post-procedure vitals
  postWeightKg: numeric("post_weight_kg", { precision: 5, scale: 2 }),
  postTemperature: numeric("post_temperature", { precision: 4, scale: 1 }),
  postHeartRate: numeric("post_heart_rate", { precision: 5, scale: 0 }),
  postRespiratoryRate: numeric("post_respiratory_rate", { precision: 4, scale: 0 }),
```

Also update the comment on the `procedureStaff.role` line (line 32) to:

```ts
  role: text("role").notNull(), // 'surgeon' | 'anesthesiologist' | 'assistant'
```

- [ ] **Step 2: Generate the Drizzle migration**

```bash
cd crm && npm run db:generate
```

Expected: A new migration file with 9 `ALTER TABLE "procedures" ADD COLUMN` statements. All nullable. No other changes.

- [ ] **Step 3: Inspect the generated migration**

Read the SQL file. It should contain exactly 9 ALTER TABLE statements adding nullable columns to `procedures`:
- 1 text (`asa_score`)
- 4 numeric (`pre_weight_kg`, `pre_temperature`, `pre_heart_rate`, `pre_respiratory_rate`)
- 4 numeric (`post_weight_kg`, `post_temperature`, `post_heart_rate`, `post_respiratory_rate`)

No DROP statements, no NOT NULL, no changes to `procedure_staff`. Strip anything unexpected.

- [ ] **Step 4: Commit**

```
feat: add asaScore and pre/post vitals columns to procedures schema
```

---

### Task 2: Server action — validation, extraction, insert/update, queries

**Files:**
- Modify: `crm/src/app/dashboard/procedures/actions.ts`

This task has 6 changes across the file. Read the file first, then apply all changes.

- [ ] **Step 1: Update the Zod `procedureSchema` (around line 28)**

Add these fields after `notes` (line 34):

```ts
  asaScore: z.enum(["1", "2", "3", "4", "5", "1E", "2E", "3E", "4E", "5E", ""]).optional().transform((v) => v || undefined),
  preWeightKg: z.string().optional().refine((v) => !v || !isNaN(parseFloat(v)), { message: "El peso no es válido." }),
  preTemperature: z.string().optional().refine((v) => !v || !isNaN(parseFloat(v)), { message: "La temperatura no es válida." }),
  preHeartRate: z.string().optional().refine((v) => !v || !isNaN(parseFloat(v)), { message: "La FC no es válida." }),
  preRespiratoryRate: z.string().optional().refine((v) => !v || !isNaN(parseFloat(v)), { message: "La FR no es válida." }),
  postWeightKg: z.string().optional().refine((v) => !v || !isNaN(parseFloat(v)), { message: "El peso no es válido." }),
  postTemperature: z.string().optional().refine((v) => !v || !isNaN(parseFloat(v)), { message: "La temperatura no es válida." }),
  postHeartRate: z.string().optional().refine((v) => !v || !isNaN(parseFloat(v)), { message: "La FC no es válida." }),
  postRespiratoryRate: z.string().optional().refine((v) => !v || !isNaN(parseFloat(v)), { message: "La FR no es válida." }),
```

- [ ] **Step 2: Update FormData extraction in `createProcedure` (around line 272)**

Add these to the `raw` object, after `notes`:

```ts
    asaScore: (formData.get("asaScore") as string)?.trim() || undefined,
    preWeightKg: (formData.get("preWeightKg") as string)?.trim() || undefined,
    preTemperature: (formData.get("preTemperature") as string)?.trim() || undefined,
    preHeartRate: (formData.get("preHeartRate") as string)?.trim() || undefined,
    preRespiratoryRate: (formData.get("preRespiratoryRate") as string)?.trim() || undefined,
    postWeightKg: (formData.get("postWeightKg") as string)?.trim() || undefined,
    postTemperature: (formData.get("postTemperature") as string)?.trim() || undefined,
    postHeartRate: (formData.get("postHeartRate") as string)?.trim() || undefined,
    postRespiratoryRate: (formData.get("postRespiratoryRate") as string)?.trim() || undefined,
```

Also add `assistantIds` extraction after `anesthesiologistIds` (around line 284):

```ts
  const assistantIds = (formData.getAll("assistantIds") as string[]).filter(Boolean);
```

- [ ] **Step 3: Update the DB insert in `createProcedure` (around line 296)**

Add the new columns to the `db.insert(procedures).values({...})`, after `notes`:

```ts
      asaScore: d.asaScore || null,
      preWeightKg: d.preWeightKg || null,
      preTemperature: d.preTemperature || null,
      preHeartRate: d.preHeartRate || null,
      preRespiratoryRate: d.preRespiratoryRate || null,
      postWeightKg: d.postWeightKg || null,
      postTemperature: d.postTemperature || null,
      postHeartRate: d.postHeartRate || null,
      postRespiratoryRate: d.postRespiratoryRate || null,
```

Also add the assistant staff insert loop after the anesthesiologist loop (after line 323):

```ts
    for (const asId of assistantIds) {
      await db.insert(procedureStaff).values({
        id: procedureStaffId(),
        procedureId: id,
        staffId: asId,
        role: "assistant",
      });
    }
```

- [ ] **Step 4: Apply the same changes to `updateProcedure` (around line 333)**

In the `raw` object (around line 337), add the same 9 FormData extractions as in Step 2.

Add `assistantIds` extraction after `anesthesiologistIds` (around line 348):

```ts
  const assistantIds = (formData.getAll("assistantIds") as string[]).filter(Boolean);
```

In the `db.update(procedures).set({...})` call (around line 370), add the 9 new columns after `notes`:

```ts
        asaScore: d.asaScore || null,
        preWeightKg: d.preWeightKg || null,
        preTemperature: d.preTemperature || null,
        preHeartRate: d.preHeartRate || null,
        preRespiratoryRate: d.preRespiratoryRate || null,
        postWeightKg: d.postWeightKg || null,
        postTemperature: d.postTemperature || null,
        postHeartRate: d.postHeartRate || null,
        postRespiratoryRate: d.postRespiratoryRate || null,
```

Add the assistant staff insert loop after the anesthesiologist re-insert loop (after line 397):

```ts
    for (const asId of assistantIds) {
      await db.insert(procedureStaff).values({
        id: procedureStaffId(),
        procedureId: id,
        staffId: asId,
        role: "assistant",
      });
    }
```

- [ ] **Step 5: Update the `getProcedure` query (around line 115)**

Add the 9 new columns to the select (after `type`, around line 128):

```ts
      asaScore: procedures.asaScore,
      preWeightKg: procedures.preWeightKg,
      preTemperature: procedures.preTemperature,
      preHeartRate: procedures.preHeartRate,
      preRespiratoryRate: procedures.preRespiratoryRate,
      postWeightKg: procedures.postWeightKg,
      postTemperature: procedures.postTemperature,
      postHeartRate: procedures.postHeartRate,
      postRespiratoryRate: procedures.postRespiratoryRate,
```

Add assistants to the staff filtering (after line 163):

```ts
  const assistants = staffAssignments.filter((s) => s.role === "assistant");
```

Update the return to include assistants (around line 194):

```ts
  return { ...row, surgeons, anesthesiologists, assistants, supplies, followUps: linkedFollowUps };
```

- [ ] **Step 6: Commit**

```
feat: add ASA, vitals, assistant support to procedure actions
```

---

### Task 3: Form — add assistant checkboxes, ASA select, vitals inputs

**Files:**
- Modify: `crm/src/components/admin/procedures/procedure-form.tsx`

- [ ] **Step 1: Add Select imports**

Add at the top of the file:

```tsx
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
```

- [ ] **Step 2: Define ASA options constant above the component**

```tsx
const ASA_OPTIONS = [
  { value: "1", label: "ASA 1 — Sano" },
  { value: "2", label: "ASA 2 — Enfermedad sistémica leve" },
  { value: "3", label: "ASA 3 — Enfermedad sistémica grave" },
  { value: "4", label: "ASA 4 — Amenaza de vida" },
  { value: "5", label: "ASA 5 — Moribundo" },
  { value: "1E", label: "ASA 1E — Sano (emergencia)" },
  { value: "2E", label: "ASA 2E — Enf. leve (emergencia)" },
  { value: "3E", label: "ASA 3E — Enf. grave (emergencia)" },
  { value: "4E", label: "ASA 4E — Amenaza de vida (emergencia)" },
  { value: "5E", label: "ASA 5E — Moribundo (emergencia)" },
] as const;
```

- [ ] **Step 3: Add ASA select after the Type field (after line 155)**

```tsx
      <div className="space-y-2">
        <Label htmlFor="asaScore">Valoración ASA</Label>
        <Select name="asaScore">
          <SelectTrigger id="asaScore">
            <SelectValue placeholder="Seleccionar..." />
          </SelectTrigger>
          <SelectContent>
            {ASA_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
```

- [ ] **Step 4: Add assistant checkbox group — change the staff grid from 2 columns to 3**

Replace the current `<div className="grid gap-4 sm:grid-cols-2">` (line 157) wrapping the surgeon/anesthesiologist fieldsets with `<div className="grid gap-4 sm:grid-cols-3">` and add a third fieldset after the anesthesiologist one:

```tsx
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">Ayudante(s)</legend>
          <div className="space-y-1 rounded-md border p-3">
            {staffList.map((s) => (
              <label key={s.id} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-muted/50 rounded px-1 py-0.5">
                <input type="checkbox" name="assistantIds" value={s.id} className="rounded" />
                {s.name}
              </label>
            ))}
          </div>
        </fieldset>
```

- [ ] **Step 5: Add pre/post vitals sections before the Notes field (before line 183)**

Insert two sections — "Signos vitales al inicio" and "Signos vitales al cierre":

```tsx
      {/* Pre-procedure vitals */}
      <div className="space-y-2">
        <p className="text-sm font-medium">Signos vitales al inicio</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="space-y-1">
            <Label htmlFor="preWeightKg" className="text-xs">Peso (kg)</Label>
            <Input id="preWeightKg" name="preWeightKg" type="number" step="0.01" min="0" placeholder="0.00" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="preTemperature" className="text-xs">Temp. (&deg;C)</Label>
            <Input id="preTemperature" name="preTemperature" type="number" step="0.1" min="30" max="45" placeholder="38.5" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="preHeartRate" className="text-xs">FC (lpm)</Label>
            <Input id="preHeartRate" name="preHeartRate" type="number" step="1" min="0" placeholder="80" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="preRespiratoryRate" className="text-xs">FR (rpm)</Label>
            <Input id="preRespiratoryRate" name="preRespiratoryRate" type="number" step="1" min="0" placeholder="20" />
          </div>
        </div>
      </div>

      {/* Post-procedure vitals */}
      <div className="space-y-2">
        <p className="text-sm font-medium">Signos vitales al cierre</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="space-y-1">
            <Label htmlFor="postWeightKg" className="text-xs">Peso (kg)</Label>
            <Input id="postWeightKg" name="postWeightKg" type="number" step="0.01" min="0" placeholder="0.00" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="postTemperature" className="text-xs">Temp. (&deg;C)</Label>
            <Input id="postTemperature" name="postTemperature" type="number" step="0.1" min="30" max="45" placeholder="38.5" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="postHeartRate" className="text-xs">FC (lpm)</Label>
            <Input id="postHeartRate" name="postHeartRate" type="number" step="1" min="0" placeholder="80" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="postRespiratoryRate" className="text-xs">FR (rpm)</Label>
            <Input id="postRespiratoryRate" name="postRespiratoryRate" type="number" step="1" min="0" placeholder="20" />
          </div>
        </div>
      </div>
```

- [ ] **Step 6: Commit**

```
feat: add ASA select, assistant checkboxes, pre/post vitals to procedure form
```

---

### Task 4: Display — show new fields on detail page

**Files:**
- Modify: `crm/src/app/dashboard/procedures/[id]/page.tsx`

- [ ] **Step 1: Add a `VitalItem` helper component (after the `InfoCard` component, around line 52)**

```tsx
function VitalItem({
  label,
  value,
  unit,
}: {
  label: string;
  value: string | null;
  unit: string;
}) {
  if (!value) return null;
  return (
    <div className="rounded-md border px-3 py-2">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm font-medium">
        {value} {unit}
      </p>
    </div>
  );
}
```

- [ ] **Step 2: Add assistant display in the info grid (after the anesthesiologist InfoCard, around line 134)**

```tsx
        <InfoCard
          label="Ayudante(s)"
          value={procedure.assistants.map((s) => s.staffName).join(", ") || null}
        />
```

- [ ] **Step 3: Add ASA badge next to the type badge in the header (around line 87)**

After the type badge and before the closing `</div>` of the header flex container:

```tsx
            {procedure.asaScore && (
              <Badge variant="outline">ASA {procedure.asaScore}</Badge>
            )}
```

- [ ] **Step 4: Add pre/post vitals display sections between the info grid and the Notes section (after line 135, before line 137)**

```tsx
      {/* Pre-procedure vitals */}
      {(procedure.preWeightKg || procedure.preTemperature || procedure.preHeartRate || procedure.preRespiratoryRate) && (
        <>
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-2">Signos vitales al inicio</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <VitalItem label="Peso" value={procedure.preWeightKg} unit="kg" />
              <VitalItem label="Temp." value={procedure.preTemperature} unit="°C" />
              <VitalItem label="FC" value={procedure.preHeartRate} unit="lpm" />
              <VitalItem label="FR" value={procedure.preRespiratoryRate} unit="rpm" />
            </div>
          </div>
        </>
      )}

      {/* Post-procedure vitals */}
      {(procedure.postWeightKg || procedure.postTemperature || procedure.postHeartRate || procedure.postRespiratoryRate) && (
        <>
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-2">Signos vitales al cierre</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <VitalItem label="Peso" value={procedure.postWeightKg} unit="kg" />
              <VitalItem label="Temp." value={procedure.postTemperature} unit="°C" />
              <VitalItem label="FC" value={procedure.postHeartRate} unit="lpm" />
              <VitalItem label="FR" value={procedure.postRespiratoryRate} unit="rpm" />
            </div>
          </div>
        </>
      )}
```

- [ ] **Step 5: Commit**

```
feat: display assistant, ASA, pre/post vitals on procedure detail page
```

---

### Task 5: Final verification

- [ ] **Step 1: TypeScript check**

```bash
cd C:/Users/tomas/dev/personal/zzz/neovet/crm && npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 2: End-to-end test**

1. Navigate to create a new procedure
2. Verify the form shows: ASA select, 3 staff role checkbox groups (Cirujano, Anestesiólogo, Ayudante), pre/post vitals
3. Fill in all fields and submit
4. Verify the detail page shows: ASA badge, all 3 staff roles, pre and post vitals
5. Create a procedure with NO optional fields — verify no empty sections appear

- [ ] **Step 3: Final commit (if cleanup needed)**

Only if adjustments were needed during testing.
