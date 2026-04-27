# Hospitalization Observations — Add Clinical Exam Fields

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add 3 new clinical examination fields (capillary refill time, mucous membranes, sensorium) to hospitalization observation records.

**Architecture:** Add 3 nullable text columns to the `hospitalization_observations` table. Each field uses a predefined set of options rendered as `<Select>` in the form. They appear in a new "Examen físico" subsection between the vitals grid and the clinical observations section.

**Tech Stack:** Drizzle ORM (schema + migration), Zod (validation), shadcn/ui Select (form), React Server Components (display)

---

## File Map

| Action | File | Purpose |
|--------|------|---------|
| Modify | `crm/src/db/schema/hospitalization_observations.ts` | Add 3 columns |
| Generate | `crm/drizzle/migrations/0023_*.sql` | DB migration |
| Modify | `crm/src/app/dashboard/hospitalizations/actions.ts` | Validation schema + form extraction + insert + query select |
| Modify | `crm/src/components/admin/hospitalizations/observation-form.tsx` | 3 Select inputs in new "Examen físico" section |
| Modify | `crm/src/app/dashboard/hospitalizations/[id]/page.tsx` | Display new fields in observation cards |

---

## Select Options (constants used across form + display)

```
capillaryRefillTime: "< 2 seg" | "2-3 seg" | "> 3 seg"
mucousMembranes:    "Rosadas" | "Pálidas" | "Cianóticas" | "Ictéricas" | "Congestionadas"
sensorium:          "Alerta" | "Semicomatoso" | "Comatoso"
```

---

### Task 1: Schema — add 3 columns

**Files:**
- Modify: `crm/src/db/schema/hospitalization_observations.ts:18-25`

- [ ] **Step 1: Add the 3 new text columns after the vitals block (after line 18)**

In `crm/src/db/schema/hospitalization_observations.ts`, add 3 new text columns between the vitals block and the clinical observations block. After the `respiratoryRate` line (line 18) and before the `// Clinical observations` comment (line 20):

```ts
  // Physical exam
  capillaryRefillTime: text("capillary_refill_time"),
  mucousMembranes: text("mucous_membranes"),
  sensorium: text("sensorium"),
```

The resulting file should have: vitals (4 numeric) → physical exam (3 text) → clinical observations (5 text) → notes → createdAt.

- [ ] **Step 2: Generate the Drizzle migration**

```bash
cd crm && npm run db:generate
```

Expected: A new migration file `drizzle/migrations/0023_*.sql` containing 3 `ALTER TABLE` statements adding nullable text columns.

- [ ] **Step 3: Inspect the generated migration**

Read the generated SQL file. It should contain exactly:

```sql
ALTER TABLE "hospitalization_observations" ADD COLUMN "capillary_refill_time" text;
ALTER TABLE "hospitalization_observations" ADD COLUMN "mucous_membranes" text;
ALTER TABLE "hospitalization_observations" ADD COLUMN "sensorium" text;
```

No DROP, no NOT NULL, no other changes. If Drizzle generated anything unexpected (CREATE TABLE for existing tables, drops), manually strip those lines before proceeding.

- [ ] **Step 4: Run the migration against the dev database**

Make sure `.env.local` points to the dev/preview DB (not production), then:

```bash
cd crm && npm run db:migrate
```

Expected: Migration applied successfully, no errors.

- [ ] **Step 5: Commit**

```
feat: add capillaryRefillTime, mucousMembranes, sensorium columns to hospitalization_observations
```

---

### Task 2: Validation & server action — wire up the 3 fields

**Files:**
- Modify: `crm/src/app/dashboard/hospitalizations/actions.ts:30-61` (observationSchema)
- Modify: `crm/src/app/dashboard/hospitalizations/actions.ts:344-365` (raw extraction in addObservation)
- Modify: `crm/src/app/dashboard/hospitalizations/actions.ts:393-408` (insert values)
- Modify: `crm/src/app/dashboard/hospitalizations/actions.ts:176-195` (observation query select)

- [ ] **Step 1: Add Zod enum validations to observationSchema**

In `actions.ts`, inside `observationSchema` (line 30), add these 3 fields after `respiratoryRate` (after line 53):

```ts
  capillaryRefillTime: z
    .enum(["< 2 seg", "2-3 seg", "> 3 seg", ""])
    .optional()
    .transform((v) => v || undefined),
  mucousMembranes: z
    .enum(["Rosadas", "Pálidas", "Cianóticas", "Ictéricas", "Congestionadas", ""])
    .optional()
    .transform((v) => v || undefined),
  sensorium: z
    .enum(["Alerta", "Semicomatoso", "Comatoso", ""])
    .optional()
    .transform((v) => v || undefined),
```

The empty string `""` allows the select to submit with no selection. The transform converts it to `undefined` so it maps to `null` in the DB.

- [ ] **Step 2: Extract the 3 new fields from FormData in addObservation**

In the `raw` object inside `addObservation` (around line 344), add after `respiratoryRate`:

```ts
    capillaryRefillTime:
      (formData.get("capillaryRefillTime") as string)?.trim() || undefined,
    mucousMembranes:
      (formData.get("mucousMembranes") as string)?.trim() || undefined,
    sensorium:
      (formData.get("sensorium") as string)?.trim() || undefined,
```

- [ ] **Step 3: Include the 3 fields in the DB insert**

In the `db.insert(hospitalizationObservations).values({...})` call (around line 393), add after `respiratoryRate`:

```ts
      capillaryRefillTime: d.capillaryRefillTime || null,
      mucousMembranes: d.mucousMembranes || null,
      sensorium: d.sensorium || null,
```

- [ ] **Step 4: Add the 3 fields to the observation query in getHospitalization**

In the `getHospitalization` function's observation select (around line 178), add after `respiratoryRate`:

```ts
      capillaryRefillTime: hospitalizationObservations.capillaryRefillTime,
      mucousMembranes: hospitalizationObservations.mucousMembranes,
      sensorium: hospitalizationObservations.sensorium,
```

- [ ] **Step 5: Verify the dev server compiles without errors**

```bash
cd crm && npx next build --no-lint 2>&1 | head -30
```

Expected: No TypeScript errors related to the schema or actions.

- [ ] **Step 6: Commit**

```
feat: add validation and server action support for observation exam fields
```

---

### Task 3: Form — add 3 Select inputs

**Files:**
- Modify: `crm/src/components/admin/hospitalizations/observation-form.tsx`

- [ ] **Step 1: Add Select imports**

At the top of `observation-form.tsx`, add the shadcn Select import:

```tsx
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
```

- [ ] **Step 2: Define the options constants inside the component file (above the component)**

```tsx
const CAPILLARY_REFILL_OPTIONS = ["< 2 seg", "2-3 seg", "> 3 seg"] as const;
const MUCOUS_MEMBRANE_OPTIONS = ["Rosadas", "Pálidas", "Cianóticas", "Ictéricas", "Congestionadas"] as const;
const SENSORIUM_OPTIONS = ["Alerta", "Semicomatoso", "Comatoso"] as const;
```

- [ ] **Step 3: Add the "Examen físico" section between vitals and clinical observations**

After the closing `</div>` of the "Signos vitales" section (after line 120) and before the `{/* Observaciones clínicas */}` comment (line 122), insert:

```tsx
      {/* Examen físico */}
      <div className="space-y-2">
        <p className="text-sm font-medium">Examen físico</p>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="space-y-1">
            <Label htmlFor="capillaryRefillTime" className="text-xs">
              Llenado capilar
            </Label>
            <Select name="capillaryRefillTime">
              <SelectTrigger id="capillaryRefillTime">
                <SelectValue placeholder="Seleccionar..." />
              </SelectTrigger>
              <SelectContent>
                {CAPILLARY_REFILL_OPTIONS.map((opt) => (
                  <SelectItem key={opt} value={opt}>
                    {opt}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label htmlFor="mucousMembranes" className="text-xs">
              Mucosas
            </Label>
            <Select name="mucousMembranes">
              <SelectTrigger id="mucousMembranes">
                <SelectValue placeholder="Seleccionar..." />
              </SelectTrigger>
              <SelectContent>
                {MUCOUS_MEMBRANE_OPTIONS.map((opt) => (
                  <SelectItem key={opt} value={opt}>
                    {opt}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label htmlFor="sensorium" className="text-xs">
              Sensorio
            </Label>
            <Select name="sensorium">
              <SelectTrigger id="sensorium">
                <SelectValue placeholder="Seleccionar..." />
              </SelectTrigger>
              <SelectContent>
                {SENSORIUM_OPTIONS.map((opt) => (
                  <SelectItem key={opt} value={opt}>
                    {opt}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
```

- [ ] **Step 4: Verify the form renders**

Start the dev server (`npm run dev`), navigate to an active hospitalization, and confirm the 3 selects appear between vitals and clinical observations. Each should show a placeholder "Seleccionar..." and open a dropdown with the correct options.

- [ ] **Step 5: Commit**

```
feat: add capillary refill, mucous membranes, sensorium selects to observation form
```

---

### Task 4: Display — show new fields in observation cards

**Files:**
- Modify: `crm/src/app/dashboard/hospitalizations/[id]/page.tsx:196-264`

- [ ] **Step 1: Update the hasVitals check to include the new fields**

In the detail page (around line 199), update the `hasVitals` variable to also check for the physical exam fields:

```tsx
              const hasVitals =
                obs.weightKg || obs.temperature || obs.heartRate || obs.respiratoryRate;
              const hasExam =
                obs.capillaryRefillTime || obs.mucousMembranes || obs.sensorium;
```

- [ ] **Step 2: Add the "Examen físico" display block between vitals and clinical observations**

After the vitals grid closing `</div>` (after line 243) and before the `{/* Clinical observations */}` comment (line 246), insert:

```tsx
                  {/* Physical exam */}
                  {hasExam && (
                    <div className="mt-3 grid grid-cols-3 gap-2">
                      <VitalItem
                        label="Llenado capilar"
                        value={obs.capillaryRefillTime}
                        unit=""
                      />
                      <VitalItem
                        label="Mucosas"
                        value={obs.mucousMembranes}
                        unit=""
                      />
                      <VitalItem
                        label="Sensorio"
                        value={obs.sensorium}
                        unit=""
                      />
                    </div>
                  )}
```

We reuse the existing `VitalItem` component since it already handles null values and has the right visual style. The `unit` is empty since these are categorical, not measured.

- [ ] **Step 3: Verify the display works**

Submit a test observation with all 3 new fields filled. Confirm the observation card shows the new "Examen físico" row between vitals and clinical observations. Also confirm that observations without these fields still render correctly (no empty row).

- [ ] **Step 4: Commit**

```
feat: display capillary refill, mucous membranes, sensorium in observation cards
```

---

### Task 5: Final verification

- [ ] **Step 1: Full build check**

```bash
cd crm && npx next build 2>&1 | tail -20
```

Expected: Build succeeds with no errors.

- [ ] **Step 2: End-to-end test**

1. Navigate to an active hospitalization
2. Fill in vitals + all 3 new selects + a clinical note
3. Submit the observation
4. Verify it appears in the timeline with all fields displayed
5. Submit another observation with ONLY vitals (no exam fields) — verify no empty exam row appears
6. Delete a test observation — verify it's removed

- [ ] **Step 3: Final commit (if any cleanup needed)**

Only if adjustments were needed during testing.
