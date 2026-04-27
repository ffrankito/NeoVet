# Pet-Name Search — Patient-First Inversion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Invert the patient selector in the two reception-facing forms (`/dashboard/appointments/new` and the dashboard walk-in panel) so Paula and Gabriela can start from a pet's name — shown with breed and owner for disambiguation — instead of being forced to remember the owner's name first.

**Architecture:** Replace the current two-step "pick client → filtered pet dropdown" with a single `SearchableSelect` listing every patient. Label = pet name, sublabel = `breed (or species) · owner name`. A sentinel value `"__new__"` triggers an inline block for creating a new pet; inside that block, a nested `SearchableSelect` lets the user pick an existing owner or trigger a further sentinel for inline new-client creation. Owner ID is auto-derived from the chosen patient in the happy path. Walk-in form gets the same inversion but retains its existing-only constraint (no inline creation, matching current behavior).

**Tech stack:** Next.js 16 App Router, TypeScript, React 19 (`useState`, `useMemo`, `useActionState`), shadcn/ui's `SearchableSelect` wrapper over `cmdk`, Drizzle ORM, Tailwind CSS 4.

**Feature wiki:** `~/ObsidianVaults/neovet/wiki/features/pet-name-search.md` (status: partial → will move to shipped after Task 7).

---

## File Structure

Three files modified. No new files. No shared component extraction (per explicit YAGNI decision — revisit if we later expand to hospitalizations/procedures/consent forms).

| File | Change |
|---|---|
| `crm/src/app/dashboard/appointments/actions.ts` | Widen `getAllPatientsForSelect` to return `breed`. |
| `crm/src/components/admin/appointments/appointment-form.tsx` | Invert to patient-first. Single `SearchableSelect` listing all patients. Sentinel `"__new__"` shows inline block with nested owner selector + nested "+ Nuevo dueño" sentinel. Deep-link `?patientId=X` still pre-fills (editable). |
| `crm/src/components/admin/appointments/walk-in-form.tsx` | Same inversion, simpler (no inline creation — walk-in currently doesn't support new clients and that stays out of scope). |

Consumer surfaces of `getAllPatientsForSelect` that are **not** modified but remain backwards-compatible: `hospitalizations/new/page.tsx`, `procedures/new/page.tsx`, `consent-documents/new/page.tsx`, `dashboard/page.tsx` (walk-in consumer). They read a subset of fields; adding `breed` does not break them.

---

## Decisions Locked In (from grill session)

1. **Scope:** Only `/dashboard/appointments/new` + `[id]/edit/page.tsx` (same component) + dashboard walk-in form. Not hospitalizations/procedures/consent in v1.
2. **Flow shape:** Invert — patient-first primary selector.
3. **Disambiguation:** Label `Luna`, sublabel `Bulldog · Maria Fernández`. Fall back to species when breed is null: `perro · Maria Fernández`.
4. **Inline creation:** Single sentinel `+ Nueva mascota` with a nested owner selector inside its inline block. Owner selector has its own `+ Nuevo dueño` sentinel for inline client creation.
5. **Deep-link behavior:** Pre-fill patient selector, keep it editable.
6. **Extraction:** Duplicate between the two forms (three similar lines > premature abstraction).
7. **Out of scope:** Global omnibox (v3 candidate), patient-list page (doesn't exist), hospitalizations/procedures/consent forms.

---

## Task 0: Branch, dev server, bug repro

**Files:** none (setup only).

- [ ] **Step 1: Verify working directory and git status.**

```bash
rtk git status
rtk git branch --show-current
```

Expected: clean working tree (or known pending changes). On `main` or an active dev branch.

- [ ] **Step 2: Check env points to dev DB.**

```bash
head -3 crm/.env.local
```

Expected: `DATABASE_URL` contains the Supabase preview branch project-id prefix. If it points to production, run `cp crm/.env.dev crm/.env.local`.

- [ ] **Step 3: Create the feature branch.**

```bash
rtk git checkout -b feat/pet-name-search-inverted
```

- [ ] **Step 4: Start dev server in a separate terminal and keep it running for the entire plan.**

```bash
cd crm && npm run dev
```

Expected: Next.js dev server on http://localhost:3000. Log in as admin (`paula@...` or your seeded admin user).

- [ ] **Step 5: Manually reproduce the bug we're fixing.**

1. Navigate to http://localhost:3000/dashboard/appointments/new
2. In the "Cliente *" dropdown, type the name of any pet known to exist in the dev DB (e.g., `Luna`, `Tobi`, `Firulais`).
3. Confirm: **no matches** — dropdown only indexes owner names.
4. Close the dropdown, note the behavior. This is "before." We're fixing exactly this.

- [ ] **Step 6: Check reassurance — the clients page search DOES work by pet name.**

1. Navigate to http://localhost:3000/dashboard/clients
2. Type the same pet name in the search box.
3. Confirm: the owner record surfaces. This is the reference behavior — the client directory's `EXISTS (SELECT 1 FROM patients ...)` subquery works. We're propagating that capability into the appointment creation flow via a different mechanism (in-memory filter on a pre-loaded list, since the form needs instant response).

No commit for Task 0.

---

## Task 1: Widen `getAllPatientsForSelect` to return `breed`

**Files:**
- Modify: `crm/src/app/dashboard/appointments/actions.ts` (lines 452–464).

**Why this first:** Small, isolated change. Unblocks Tasks 2 and 4. Drizzle's return type is structural — all existing consumers keep working without edits.

- [ ] **Step 1: Open the file and find the function.**

Read `crm/src/app/dashboard/appointments/actions.ts`, locate `getAllPatientsForSelect` (around line 452).

- [ ] **Step 2: Add `breed` to the select projection.**

Find this exact code:
```typescript
export async function getAllPatientsForSelect() {
  return db
    .select({
      id: patients.id,
      name: patients.name,
      species: patients.species,
      clientId: clients.id,
      clientName: clients.name,
    })
    .from(patients)
    .innerJoin(clients, eq(patients.clientId, clients.id))
    .orderBy(clients.name, patients.name);
}
```

Replace with:
```typescript
export async function getAllPatientsForSelect() {
  return db
    .select({
      id: patients.id,
      name: patients.name,
      species: patients.species,
      breed: patients.breed,
      clientId: clients.id,
      clientName: clients.name,
    })
    .from(patients)
    .innerJoin(clients, eq(patients.clientId, clients.id))
    .orderBy(clients.name, patients.name);
}
```

- [ ] **Step 3: Type-check the project.**

```bash
cd crm && rtk tsc --noEmit
```

Expected: zero new errors. Pre-existing errors (if any) unchanged. The return type now contains a new `breed: string | null` property — since existing consumers destructure specific fields, no breakage.

- [ ] **Step 4: Suggested commit (ask user before running).**

```bash
rtk git add crm/src/app/dashboard/appointments/actions.ts
rtk git commit -m "feat(crm): include breed in getAllPatientsForSelect

Unblocks patient-first search by surfacing breed as a disambiguation
field in the select option sublabel. Drizzle return type is structural
so existing consumers (hospitalizations, procedures, consent, walk-in)
keep working without edits.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 2: Invert appointment-form — state machine + types

**Files:**
- Modify: `crm/src/components/admin/appointments/appointment-form.tsx`.

**Why this is one task not two:** The state machine and JSX are tightly coupled. Splitting them leaves a broken intermediate state. We write both, then commit.

**Concept recap (familiarity 2):**

- **Sentinel value** (`"__new__"`): a reserved fake ID that means "user wants to create a new thing." The `SearchableSelect` stores it in `selectedPatient` just like it would store a real `pat_abc123`. Conditional rendering checks `selectedPatient === "__new__"` to show the inline creation block.
- **Derived state:** Once a real patient is picked, `clientId` is *derived* from `patient.clientId` — no separate state needed. We only store a dedicated `selectedClient` when `selectedPatient === "__new__"` AND the user also wants a new client.

---

### Step 1: Update the `PatientOption` interface

Find (around line 52):
```typescript
interface PatientOption {
  id: string;
  name: string;
  species: string;
  clientId: string;
  clientName: string;
}
```

Replace with:
```typescript
interface PatientOption {
  id: string;
  name: string;
  species: string;
  breed: string | null;
  clientId: string;
  clientName: string;
}
```

### Step 2: Replace the sentinel constants

Find (around line 21):
```typescript
const NEW_CLIENT_VALUE = "__new__";
const NEW_PATIENT_VALUE = "__new__";
```

Keep as-is. Both sentinels stay, but their roles change:
- `NEW_PATIENT_VALUE` goes on the top-level patient selector.
- `NEW_CLIENT_VALUE` goes on the nested owner selector inside the inline new-patient block.

### Step 3: Rewrite the state declarations

Find the block starting with `const defaultClientId = defaultPatientId` (around line 117).

Replace the entire block from `const defaultClientId = ...` through `const [selectedClient, setSelectedClient] = useState(defaultClientId);` with:

```typescript
// Primary state: patientId. Either a real pat_xxx, NEW_PATIENT_VALUE, or "".
const [selectedPatient, setSelectedPatient] = useState(
  appointment?.patientId ?? defaultPatientId ?? ""
);
// Only used when selectedPatient === NEW_PATIENT_VALUE. Either a real cli_xxx, NEW_CLIENT_VALUE, or "".
const [selectedClient, setSelectedClient] = useState<string>("");
```

**Rationale:** In the happy path, owner is derived on submit from `patients.find((p) => p.id === selectedPatient)?.clientId`. No need for `defaultClientId` anymore — deep-links with `?patientId=X` are fully handled by setting `selectedPatient`.

### Step 4: Rewrite the derived booleans and filteredPatients

Find (around line 148):
```typescript
// Inline creation state
const isNewClient = selectedClient === NEW_CLIENT_VALUE;
const isNewPatient = selectedPatient === NEW_PATIENT_VALUE;
```

Replace with:
```typescript
// Inline creation state
const isNewPatient = selectedPatient === NEW_PATIENT_VALUE;
const isNewClient = isNewPatient && selectedClient === NEW_CLIENT_VALUE;
// True when the user wants a new patient AND is picking an existing owner.
const isExistingOwnerForNewPatient =
  isNewPatient && selectedClient !== "" && selectedClient !== NEW_CLIENT_VALUE;
```

Then find (around line 159):
```typescript
const filteredPatients = isNewClient
  ? []
  : patients.filter((p) => p.clientId === selectedClient);
```

**Delete this line entirely.** We no longer filter patients by a pre-selected client.

### Step 5: Rewrite `clientOptions` (nested selector options)

Find (around line 163):
```typescript
const clientOptions = [
  { value: NEW_CLIENT_VALUE, label: "+ Nuevo cliente" },
  ...clients.map((c) => ({ value: c.id, label: c.name })),
];
```

Replace with:
```typescript
// Used inside the inline new-patient block as the nested owner selector
const clientOptions = [
  { value: NEW_CLIENT_VALUE, label: "+ Nuevo dueño" },
  ...clients.map((c) => ({ value: c.id, label: c.name })),
];
```

### Step 6: Build `patientOptions` — new top-level selector data

Add this memoized value right after the `clientOptions` declaration:

```typescript
const patientOptions = useMemo(() => {
  const sentinelOption = { value: NEW_PATIENT_VALUE, label: "+ Nueva mascota" };
  const realOptions = patients.map((p) => {
    const disambig = p.breed ?? p.species;
    return {
      value: p.id,
      label: p.name,
      sublabel: `${disambig} · ${p.clientName}`,
    };
  });
  return [sentinelOption, ...realOptions];
}, [patients]);
```

You will need to import `useMemo`. Find the React import line (likely `import { useActionState, useState } from "react";`) and extend it:

```typescript
import { useActionState, useMemo, useState } from "react";
```

### Step 7: Rewrite `handleClientChange` / `handlePatientChange`

Find `function handleClientChange` (around line 168). Replace both handlers with:

```typescript
function handlePatientChange(patientId: string) {
  setSelectedPatient(patientId);
  setInlineErrors({});
  // When switching back to a real patient, clear any staged new-patient fields
  if (patientId !== NEW_PATIENT_VALUE) {
    setSelectedClient("");
    setNewClientName("");
    setNewClientPhone("");
    setNewClientEmail("");
    setNewPatientName("");
    setNewPatientSpecies("perro");
    setNewPatientBreed("");
    setNewPatientSex("macho");
  }
}

function handleOwnerChange(clientId: string) {
  setSelectedClient(clientId);
  setInlineErrors({});
  // When switching back to an existing owner, clear new-client staged fields
  if (clientId !== NEW_CLIENT_VALUE) {
    setNewClientName("");
    setNewClientPhone("");
    setNewClientEmail("");
  }
}
```

### Step 8: Rewrite the submit action's case logic

Find the `action` assignment (around line 204). Inside the create branch (the `else` of `isEdit`), replace the case logic. The current code has three cases: new client + new patient, existing client + new patient, existing only. Keep the structure but change the triggers.

Locate the block:

```typescript
: async (_prev: ActionResult, formData: FormData) => {
    setInlineErrors({});

    let patientId = selectedPatient;

    // Case 1: New client + new patient
    if (isNewClient) {
      const result = await createClientAndPatient({ ... });
      // ...
    }
    // Case 2: Existing client + new patient
    else if (isNewPatient) {
      const result = await createPatientInline({ ... });
      // ...
    }
```

Replace it with:

```typescript
: async (_prev: ActionResult, formData: FormData) => {
    setInlineErrors({});

    let patientId = selectedPatient;

    // Branch A: user wants a new patient
    if (isNewPatient) {
      // Sub-branch A1: new owner too (create client + patient together)
      if (isNewClient) {
        const result = await createClientAndPatient({
          clientName: newClientName,
          clientPhone: newClientPhone,
          clientEmail: newClientEmail,
          patientName: newPatientName,
          patientSpecies: newPatientSpecies,
          patientBreed: newPatientBreed,
          patientSex: newPatientSex as "macho" | "hembra",
        });

        if ("errors" in result && result.errors) {
          const flat: Record<string, string> = {};
          for (const [key, msgs] of Object.entries(result.errors)) {
            if (Array.isArray(msgs) && msgs[0]) flat[key] = msgs[0];
          }
          setInlineErrors(flat);
          return { error: "Completá los datos del nuevo dueño y mascota." };
        }
        if ("error" in result && result.error) return { error: result.error };
        if ("patientId" in result && result.patientId) patientId = result.patientId;
      }
      // Sub-branch A2: existing owner + new patient
      else if (isExistingOwnerForNewPatient) {
        const result = await createPatientInline({
          clientId: selectedClient,
          patientName: newPatientName,
          patientSpecies: newPatientSpecies,
          patientBreed: newPatientBreed,
          patientSex: newPatientSex as "macho" | "hembra",
        });

        if ("errors" in result && result.errors) {
          const flat: Record<string, string> = {};
          for (const [key, msgs] of Object.entries(result.errors)) {
            if (Array.isArray(msgs) && msgs[0]) flat[key] = msgs[0];
          }
          setInlineErrors(flat);
          return { error: "Completá los datos de la nueva mascota." };
        }
        if ("error" in result && result.error) return { error: result.error };
        if ("patientId" in result && result.patientId) patientId = result.patientId;
      }
      // Sub-branch A3: user picked "+ Nueva mascota" but didn't pick/create an owner
      else {
        setInlineErrors({ clientId: "Seleccioná un dueño existente o creá uno nuevo." });
        return { error: "Falta elegir el dueño de la nueva mascota." };
      }
    }

    formData.set("patientId", patientId);
    formData.set("appointmentType", appointmentType);
    formData.set("consultationType", consultationType);
    formData.set("serviceId", selectedServiceId);
    formData.set("sendReminders", sendReminders ? "true" : "false");
    formData.set("scheduledAt", scheduledAt);
    return createAppointment(formData);
  };
```

### Step 9: Rewrite the JSX — top-level patient selector

Find the JSX block starting with `{/* Client selection */}` (around line 291). Replace from that comment through the end of the `{/* Inline new patient fields */}` block (around line 441) with the following.

```tsx
{!isEdit && (
  <>
    {/* Patient selection — primary selector */}
    <div className="space-y-2">
      <Label>Paciente *</Label>
      <SearchableSelect
        options={patientOptions}
        value={selectedPatient}
        onChange={handlePatientChange}
        placeholder="Seleccioná una mascota"
        searchPlaceholder="Buscar por nombre de mascota, raza o dueño..."
        emptyMessage="No se encontró ninguna mascota."
      />
      {errors.patientId && (
        <p className="mt-1 text-sm text-destructive">{errors.patientId}</p>
      )}
    </div>

    {/* Inline new patient block */}
    {isNewPatient && (
      <div className="space-y-4 rounded-lg border border-dashed border-primary/30 bg-primary/5 p-4">
        <p className="text-sm font-medium text-primary">Nueva mascota</p>

        {/* Nested owner selector */}
        <div className="space-y-2">
          <Label>Dueño *</Label>
          <SearchableSelect
            options={clientOptions}
            value={selectedClient}
            onChange={handleOwnerChange}
            placeholder="Seleccioná un dueño"
            searchPlaceholder="Buscar dueño..."
            emptyMessage="No se encontró ningún dueño."
          />
          {inlineErrors.clientId && (
            <p className="text-sm text-destructive">{inlineErrors.clientId}</p>
          )}
        </div>

        {/* Inline new-client fields */}
        {isNewClient && (
          <div className="space-y-4 rounded-lg border border-dashed border-primary/30 bg-background p-4">
            <p className="text-sm font-medium text-primary">Nuevo dueño</p>
            <div className="space-y-2">
              <Label htmlFor="newClientName">Nombre completo *</Label>
              <Input
                id="newClientName"
                value={newClientName}
                onChange={(e) => setNewClientName(e.target.value)}
                placeholder="Nombre del dueño"
                aria-invalid={!!inlineErrors.clientName}
              />
              {inlineErrors.clientName && <p className="text-sm text-destructive">{inlineErrors.clientName}</p>}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="newClientPhone">Teléfono *</Label>
                <Input
                  id="newClientPhone"
                  type="tel"
                  value={newClientPhone}
                  onChange={(e) => setNewClientPhone(e.target.value)}
                  placeholder="341 310-1194"
                  aria-invalid={!!inlineErrors.clientPhone}
                />
                {inlineErrors.clientPhone && <p className="text-sm text-destructive">{inlineErrors.clientPhone}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="newClientEmail">Email <span className="text-xs text-muted-foreground">(opcional)</span></Label>
                <Input
                  id="newClientEmail"
                  type="email"
                  value={newClientEmail}
                  onChange={(e) => setNewClientEmail(e.target.value)}
                  placeholder="email@ejemplo.com"
                />
              </div>
            </div>
          </div>
        )}

        {/* Inline new-patient fields */}
        <div className="space-y-2">
          <Label htmlFor="newPatientName">Nombre de la mascota *</Label>
          <Input
            id="newPatientName"
            value={newPatientName}
            onChange={(e) => setNewPatientName(e.target.value)}
            placeholder="Nombre de la mascota"
            aria-invalid={!!inlineErrors.patientName}
          />
          {inlineErrors.patientName && <p className="text-sm text-destructive">{inlineErrors.patientName}</p>}
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label>Especie *</Label>
            <Select value={newPatientSpecies} onValueChange={(v) => v && setNewPatientSpecies(v)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="perro">Perro</SelectItem>
                <SelectItem value="gato">Gato</SelectItem>
                <SelectItem value="otro">Otro</SelectItem>
              </SelectContent>
            </Select>
            {inlineErrors.patientSpecies && <p className="text-sm text-destructive">{inlineErrors.patientSpecies}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="newPatientBreed">Raza</Label>
            <Input
              id="newPatientBreed"
              value={newPatientBreed}
              onChange={(e) => setNewPatientBreed(e.target.value)}
              placeholder="Bulldog, etc."
            />
          </div>
          <div className="space-y-2">
            <Label>Sexo *</Label>
            <Select value={newPatientSex} onValueChange={(v) => v && setNewPatientSex(v)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="macho">Macho</SelectItem>
                <SelectItem value="hembra">Hembra</SelectItem>
              </SelectContent>
            </Select>
            {inlineErrors.patientSex && <p className="text-sm text-destructive">{inlineErrors.patientSex}</p>}
          </div>
        </div>
      </div>
    )}
  </>
)}
```

**Note on the removed `label="..."` prop:** the existing code used `<SelectItem value="perro" label="Perro">Perro</SelectItem>`. The project CLAUDE.md explicitly forbids the `label` prop on `SelectItem` (causes the component to display the value instead of the text). Delete the `label="..."` attribute — the children text is what renders.

### Step 10: Type-check and lint.

```bash
cd crm && rtk tsc --noEmit && rtk lint
```

Expected: zero new errors. If `useMemo` import is missing, fix it. If `useActionState` types complain because `ActionResult` gained a new return shape, the existing union already handles it.

### Step 11: Suggested commit (ask user before running).

```bash
rtk git add crm/src/components/admin/appointments/appointment-form.tsx
rtk git commit -m "feat(crm): invert appointment form to patient-first selector

Replace two-step client-first flow with a single SearchableSelect
listing every patient. Label = pet name. Sublabel = breed (or species)
+ owner name. Sentinel '+ Nueva mascota' opens an inline block with a
nested owner selector + optional '+ Nuevo dueño' for inline client
creation. Owner id is derived from the chosen patient in the happy
path. Deep-link ?patientId=X still pre-fills (editable).

Closes: pet-name-search wiki item #2.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 3: Invert walk-in-form

**Files:**
- Modify: `crm/src/components/admin/appointments/walk-in-form.tsx`.

**Why simpler:** This form does not support inline creation today. We're only inverting the selector — patient first, owner display-only. Out of scope: adding inline creation (would require changing `createWalkIn` validation, which is a separate feature).

### Step 1: Update the props `patients` type.

Find the `WalkInFormProps` interface (around line 14):
```typescript
interface WalkInFormProps {
  clients: Array<{ id: string; name: string }>;
  patients: Array<{ id: string; name: string; species: string; clientId: string; clientName: string }>;
  services: Array<{ id: string; name: string; category: string | null }>;
  defaultPatientId?: string;
}
```

Replace with:
```typescript
interface WalkInFormProps {
  clients: Array<{ id: string; name: string }>;
  patients: Array<{ id: string; name: string; species: string; breed: string | null; clientId: string; clientName: string }>;
  services: Array<{ id: string; name: string; category: string | null }>;
  defaultPatientId?: string;
}
```

The `clients` prop stays (still passed by the dashboard page) but becomes unused after inversion — we can remove it in Step 4, or leave it for now. **Remove it** to avoid confusion.

### Step 2: Remove the `clients` prop and the client state.

Update the interface to drop `clients`:
```typescript
interface WalkInFormProps {
  patients: Array<{ id: string; name: string; species: string; breed: string | null; clientId: string; clientName: string }>;
  services: Array<{ id: string; name: string; category: string | null }>;
  defaultPatientId?: string;
}
```

Update the function signature:
```typescript
export function WalkInForm({ patients, services, defaultPatientId }: WalkInFormProps) {
```

Inside the body, replace:
```typescript
const defaultPatient = defaultPatientId ? patients.find((p) => p.id === defaultPatientId) : undefined;
const [isOpen, setIsOpen] = useState(!!defaultPatientId);
const [selectedClient, setSelectedClient] = useState(defaultPatient?.clientId ?? "");
const [selectedPatient, setSelectedPatient] = useState(defaultPatientId ?? "");
const [selectedService, setSelectedService] = useState("");

const filteredPatients = patients.filter((p) => p.clientId === selectedClient);
```

With:
```typescript
const [isOpen, setIsOpen] = useState(!!defaultPatientId);
const [selectedPatient, setSelectedPatient] = useState(defaultPatientId ?? "");
const [selectedService, setSelectedService] = useState("");
```

### Step 3: Build `patientOptions` (same shape as Task 2, no sentinel).

Add after the state declarations:
```typescript
const patientOptions = useMemo(() => {
  return patients.map((p) => {
    const disambig = p.breed ?? p.species;
    return {
      value: p.id,
      label: p.name,
      sublabel: `${disambig} · ${p.clientName}`,
    };
  });
}, [patients]);
```

Add `useMemo` to the React imports. Find:
```typescript
import { useActionState, useState, useEffect } from "react";
```
Replace with:
```typescript
import { useActionState, useMemo, useState, useEffect } from "react";
```

### Step 4: Update the reset effect.

Find (around line 39):
```typescript
useEffect(() => {
  if (result?.success) {
    setSelectedClient("");
    setSelectedPatient("");
    setSelectedService("");
    setIsOpen(false);
  }
}, [result]);
```

Replace with:
```typescript
useEffect(() => {
  if (result?.success) {
    setSelectedPatient("");
    setSelectedService("");
    setIsOpen(false);
  }
}, [result]);
```

### Step 5: Replace the JSX client + patient selectors with a single patient selector.

Find the `{/* Client selector */}` block and the `{/* Patient selector */}` block (around lines 69–103). Delete both.

Replace them with:
```tsx
{/* Patient selector */}
<div className="space-y-2">
  <Label>Paciente *</Label>
  <SearchableSelect
    options={patientOptions}
    value={selectedPatient}
    onChange={setSelectedPatient}
    placeholder="Seleccioná una mascota"
    searchPlaceholder="Buscar por nombre de mascota, raza o dueño..."
    emptyMessage="No se encontró ninguna mascota."
  />
</div>
```

### Step 6: Update the dashboard page that renders this form.

The caller in `crm/src/app/dashboard/page.tsx` passes `clients` and `patients` to `<WalkInForm>`. Since we removed the `clients` prop, the caller no longer needs to fetch them.

Open `crm/src/app/dashboard/page.tsx`, find the JSX block rendering `<WalkInForm>` (around line 212) and the call to `getAllClientsForSelect()` above it (around line 208).

1. Remove `getAllClientsForSelect` from the `Promise.all` — it's still used elsewhere in the file? Check: if the dashboard page uses it only for walk-in, remove. If it uses it elsewhere, keep. Use `Grep` to verify:

```bash
rtk grep "walkInClients" crm/src/app/dashboard/page.tsx
```

If `walkInClients` appears only in the `<WalkInForm>` prop, remove both the fetch and the prop. If it appears in other places (e.g., passed to another component), leave the fetch alone and just drop the `<WalkInForm clients={...}>` prop.

2. Remove the `clients={walkInClients}` prop from the `<WalkInForm>` JSX.

### Step 7: Type-check and lint.

```bash
cd crm && rtk tsc --noEmit && rtk lint
```

Expected: zero new errors.

### Step 8: Suggested commit (ask user before running).

```bash
rtk git add crm/src/components/admin/appointments/walk-in-form.tsx crm/src/app/dashboard/page.tsx
rtk git commit -m "feat(crm): invert walk-in form to patient-first selector

Same inversion as appointment-form: single SearchableSelect listing
every patient with breed + owner sublabel. Walk-in retains its
existing-only capability (no inline new-client creation — out of scope
for this feature). Drops the now-unused clients prop and its fetch.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 4: Manual QA pass

**Files:** none.

Run the dev server. Walk through each scenario. Capture any regression.

### Scenario A: Appointment — existing patient, happy path

- [ ] Navigate to `/dashboard/appointments/new`.
- [ ] Type a pet name (e.g., "Luna") in the patient selector.
- [ ] Confirm: multiple "Luna" entries appear, disambiguated by `Bulldog · Maria Fernández` in the sublabel.
- [ ] Pick one. Confirm the owner's identity is visible in the trigger text after selection.
- [ ] Fill date/time and submit. Confirm appointment is created for the correct patient (check `/dashboard/appointments/<id>`).

### Scenario B: Appointment — deep-link pre-fill

- [ ] Find a patient detail page (`/dashboard/patients/<id>`) and click "Nuevo turno".
- [ ] Confirm the appointment-new page opens with the patient pre-filled in the selector.
- [ ] Confirm the patient selector is **still clickable** (editable); change it to a different patient and revert.
- [ ] Submit. Confirm appointment is created for the final choice.

### Scenario C: Appointment — new patient for existing owner

- [ ] Navigate to `/dashboard/appointments/new`.
- [ ] Click the "+ Nueva mascota" sentinel at the top of the patient selector.
- [ ] Confirm the inline block appears with a "Dueño *" nested selector.
- [ ] In the nested selector, pick an existing owner.
- [ ] Fill the new-pet fields (name, species, breed, sex).
- [ ] Fill date/time and submit. Confirm: owner is unchanged, a new patient was created under them, and the appointment references the new patient.

### Scenario D: Appointment — new patient + new owner

- [ ] Same as C, but in the nested owner selector, pick "+ Nuevo dueño".
- [ ] Confirm a second inline block (new-client fields) appears.
- [ ] Fill client fields + pet fields + date/time.
- [ ] Submit. Confirm: new client created, new patient created under them, appointment created for the new patient.

### Scenario E: Appointment — error paths

- [ ] Try: pick "+ Nueva mascota", leave owner empty, submit. Expected: error "Seleccioná un dueño existente o creá uno nuevo."
- [ ] Try: pick "+ Nueva mascota", pick existing owner, leave pet name empty, submit. Expected: field-level error on patient name.
- [ ] Try: pick "+ Nueva mascota", pick "+ Nuevo dueño", leave client phone empty, submit. Expected: field-level error on client phone.

### Scenario F: Edit mode — existing appointment

- [ ] Go to `/dashboard/appointments/<id>/edit` for any existing appointment.
- [ ] Confirm the form renders **without** the patient selector (this is edit mode; patient isn't changeable in the current design — `!isEdit` guards the whole selector block).
- [ ] Change date/time, submit. Confirm no regression.

### Scenario G: Walk-in — existing patient

- [ ] Go to `/dashboard`.
- [ ] Click "+ Agregar a sala de espera".
- [ ] Type a pet name. Pick one. Confirm owner shows in the sublabel.
- [ ] Submit. Confirm patient is added to the waiting-room list on the dashboard.

### Scenario H: Walk-in — deep-link pre-fill

- [ ] If you can find a flow that deep-links to the dashboard with `?walkInPatientId=...` (check dashboard page source), confirm pre-fill works. If no such flow exists, skip.

### Scenario I: Mobile viewport

- [ ] In dev tools, set viewport to 375px wide.
- [ ] Repeat Scenario A. Confirm the `SearchableSelect` dropdown is usable (scroll works, 50-item cap renders, touch targets ≥ 44px).

### Scenario J: Role filtering

- [ ] Log out. Log in as a `groomer` user.
- [ ] Walk-in form: confirm the form still renders and the patient dropdown lists all patients (grooming appointments apply to any pet).
- [ ] Appointment-new: confirm the page is either accessible or gated per existing middleware rules. Whichever the current behavior is, no regression.

---

## Task 5: Update the feature wiki file

**Files:**
- Modify: `~/ObsidianVaults/neovet/wiki/features/pet-name-search.md`.

- [ ] Change `status: partial` → `status: shipped`.
- [ ] Update the body:
  - Mark items #1 (patient-list page search) as "dropped — page doesn't exist; not in v1 scope."
  - Mark items #2 (appointment-creation pet lookup) and #3 (global omnibox) accordingly: #2 as shipped via inversion; #3 as deferred to v3.
  - Add an "Implementation" section linking to `crm/docs/v1/plans/2026-04-21-pet-name-search.md` and the relevant commits.
- [ ] Update the `updated:` date.

---

## Task 6: Update CLAUDE.md status

**Files:**
- Modify: `c:\Users\tomas\dev\personal\zzz\neovet\CLAUDE.md` (the root one, in the "STATUS" section).

The current status line lists pet-name search among the "5 shippados." After this work, that's accurate (it was slightly optimistic before — shipped for client directory only). No change needed to the count, but add a brief note in the status block that the appointment-new + walk-in surfaces are now aligned.

- [ ] Find the STATUS (2026-04-20, end of day) block in root `CLAUDE.md`.
- [ ] Update the line about "búsqueda por nombre de mascota" to: `"búsqueda por nombre de mascota completada (client directory + appointment-new + walk-in)"`.
- [ ] Bump the date to today (2026-04-21).

---

## Task 7: Paula/Gabriela validation prep (not implementation — reminder)

**Files:** none. This is a handoff note.

After the plan merges, before declaring the feature "done," Tomás should:

1. Demo the inverted flow to Paula and Gabriela in person or over video.
2. Specifically ask: "¿Esto es lo que querías cuando me dijiste que entrás por el nombre del perro?"
3. Watch where their eyes go first on the new form. If they hunt for a "Cliente" field before realizing the pet selector does both, that's useful signal.
4. If they validate → mark the wiki status `shipped`. If not → open a new wiki feature file documenting the gap and re-scope.

This step is not something the implementing engineer can check off — it's a product validation step.

---

## Self-Review Checklist

**Spec coverage:**
- [x] Invert to patient-first → Tasks 2, 3.
- [x] Scope limited to appointment-new + walk-in → Tasks 2, 3 only.
- [x] Label format `Luna` + sublabel `Bulldog · Maria Fernández` → Task 2 Step 6 and Task 3 Step 3.
- [x] Single sentinel with nested inline client selector → Task 2 Step 9.
- [x] Deep-link `?patientId=X` pre-fills and remains editable → Task 2 Step 3 + Scenario B.
- [x] No shared component extraction → Tasks 2 and 3 duplicate by design.
- [x] Breed added to `getAllPatientsForSelect` → Task 1.
- [x] Wiki updated → Task 5.
- [x] CLAUDE.md status updated → Task 6.
- [x] Validation handoff → Task 7.

**Placeholder scan:** no "TBD", "add error handling", or "similar to Task N" references. All code blocks are complete.

**Type consistency:**
- `PatientOption` includes `breed: string | null` in both `appointment-form.tsx` and `walk-in-form.tsx`.
- `getAllPatientsForSelect` return type gains `breed: string | null` — matches consumer shapes.
- `NEW_PATIENT_VALUE` / `NEW_CLIENT_VALUE` sentinel strings consistent across files (both `"__new__"`).
- Handler names: `handlePatientChange`, `handleOwnerChange` in appointment form; walk-in uses `setSelectedPatient` directly.

---

## Execution Handoff

**Plan complete and saved to `crm/docs/v1/plans/2026-04-21-pet-name-search.md`. Two execution options:**

**1. Subagent-Driven (recommended)** — I dispatch a fresh subagent per task, review between tasks, fast iteration.

**2. Inline Execution** — Execute tasks in this session using executing-plans, batch execution with checkpoints.

**Which approach?**
