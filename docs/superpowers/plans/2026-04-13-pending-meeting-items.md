# Pending Meeting Items — Sedation Consent + Appointment Type Filter

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the two remaining items from the April 9 meeting with Paula: (1) add a sedation consent template (seed + PDF), and (2) add an appointment type filter to the appointments table UI.

**Architecture:** The sedation consent follows the exact same pattern as surgery consent — a `@react-pdf/renderer` template component, registered in `render-consent.ts`, seeded as a row in `consent_templates`, and matched by name in the `generateConsentDocument` action. The appointment type filter adds a `type` search param to the appointments page, a `<Select>` in the table component, and passes it through to the existing `getAppointments` query (which already supports `appointmentType` filtering).

**Tech Stack:** Next.js 16 App Router, @react-pdf/renderer, Drizzle ORM, shadcn/ui Select

---

## File Map

| Action | File | Purpose |
|--------|------|---------|
| Create | `crm/src/lib/pdf/templates/sedation-consent.tsx` | PDF template for sedation authorization |
| Modify | `crm/src/lib/pdf/render-consent.ts` | Register `sedation_consent` type |
| Modify | `crm/src/app/dashboard/consent-documents/actions.ts:211-221` | Add name match for sedation → `sedation_consent` |
| Modify | `crm/scripts/seed-consent-templates.ts` | Add sedation template text |
| Modify | `crm/src/app/dashboard/appointments/page.tsx:10` | Accept `type` search param, pass to query |
| Modify | `crm/src/components/admin/appointments/appointment-table.tsx` | Add type filter `<Select>`, pass through URL |

---

## Task 1: Sedation consent PDF template

**Files:**
- Create: `crm/src/lib/pdf/templates/sedation-consent.tsx`

This is structurally identical to `surgery-consent.tsx` — same patient info block, same signature block, different legal text. The sedation consent authorizes anesthesia/sedation specifically (not surgery), acknowledges sedation-specific risks, and is shorter than the surgery consent.

- [ ] **Step 1: Create the sedation consent template**

Create `crm/src/lib/pdf/templates/sedation-consent.tsx`:

```tsx
import { Document, Page, View, Text } from "@react-pdf/renderer";
import { styles } from "../styles";
import { ClinicHeader } from "../clinic-header";

export interface SedationConsentProps {
  clientName: string;
  clientDni: string;
  clientAddress: string;
  patientName: string;
  patientSpecies: string;
  patientBreed: string;
  patientCoatColor: string;
  patientWeight: string;
  patientDob: string;
  historyNumber?: string;
  date: string;
  sedationReason?: string;
}

export function SedationConsentDocument(props: SedationConsentProps) {
  const {
    clientName,
    clientDni,
    clientAddress,
    patientName,
    patientSpecies,
    patientBreed,
    patientCoatColor,
    patientWeight,
    patientDob,
    historyNumber,
    date,
    sedationReason,
  } = props;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <ClinicHeader
          patientName={patientName}
          historyNumber={historyNumber}
          date={date}
        />

        <Text style={styles.dateRight}>{date}</Text>

        <Text style={styles.title}>
          {`Autorización de sedación`}
        </Text>

        {/* Opening paragraph */}
        <View style={styles.body}>
          <Text>
            {`Por medio de este documento, yo `}
            <Text style={styles.bold}>{clientName}</Text>
            {` (${clientDni}) con dirección en ${clientAddress} en la ciudad de Rosario.`}
          </Text>
        </View>

        {/* Authorization paragraph */}
        <View style={[styles.body, styles.bodySpacing]}>
          <Text style={styles.bodyBold}>
            {`Extiendo mi completa y total autorización en favor de Neovet, para que lleve a cabo la sedación de mi mascota con el fin de realizar:`}
            {sedationReason ? (
              <Text style={styles.body}>{` ${sedationReason}`}</Text>
            ) : null}
          </Text>
        </View>

        {/* Patient info */}
        <View style={[styles.patientInfo, styles.bodySpacing]}>
          <Text style={styles.patientInfoLine}>
            <Text style={styles.patientInfoLabel}>Nombre: </Text>
            {patientName}
          </Text>
          <Text style={styles.patientInfoLine}>
            <Text style={styles.patientInfoLabel}>Especie: </Text>
            {patientSpecies}
          </Text>
          <Text style={styles.patientInfoLine}>
            <Text style={styles.patientInfoLabel}>Raza: </Text>
            {patientBreed}
          </Text>
          <Text style={styles.patientInfoLine}>
            <Text style={styles.patientInfoLabel}>Pelaje: </Text>
            {patientCoatColor}
          </Text>
          <Text style={styles.patientInfoLine}>
            <Text style={styles.patientInfoLabel}>Peso: </Text>
            {patientWeight} Kg.
          </Text>
          <Text style={styles.patientInfoLine}>
            <Text style={styles.patientInfoLabel}>Fecha de nacimiento: </Text>
            {patientDob}
          </Text>
        </View>

        {/* Risk acknowledgement — sedation-specific */}
        <View style={[styles.body, styles.bodySpacing]}>
          <Text>
            {`Declaro conocer los riesgos inherentes a la sedación y/o anestesia, incluyendo posibles reacciones adversas, complicaciones respiratorias o cardiovasculares, y en casos extremos, la muerte del animal.`}
          </Text>
        </View>

        {/* Responsibility clause */}
        <View style={[styles.body, styles.bodySpacing]}>
          <Text style={styles.bodyBold}>
            {`Acepto que dicha mascota es de mi propiedad por lo que me responsabilizo de los gastos que generen dichos procedimientos.`}
          </Text>
        </View>

        {/* Signature */}
        <View style={styles.signatureBlock}>
          <View style={styles.signatureLine} />
          <Text style={styles.signatureLabel}>Firma del cliente</Text>
        </View>

        {/* Footer */}
        <Text
          style={styles.footer}
          render={({ pageNumber, totalPages }) =>
            `Página ${pageNumber} - ${totalPages}`
          }
          fixed
        />
      </Page>
    </Document>
  );
}
```

- [ ] **Step 2: Verify it compiles**

Run: `cd crm && rtk npx tsc --noEmit`
Expected: No new errors

- [ ] **Step 3: Commit**

```bash
git add crm/src/lib/pdf/templates/sedation-consent.tsx
git commit -m "feat: add sedation consent PDF template"
```

---

## Task 2: Register sedation consent in the render pipeline

**Files:**
- Modify: `crm/src/lib/pdf/render-consent.ts`
- Modify: `crm/src/app/dashboard/consent-documents/actions.ts:211-221`

- [ ] **Step 1: Add sedation to render-consent.ts**

In `crm/src/lib/pdf/render-consent.ts`, add the import at the top alongside the existing imports:

```ts
import {
  SedationConsentDocument,
  type SedationConsentProps,
} from "./templates/sedation-consent";
```

Add `"sedation_consent"` to the `ConsentTemplateType` union:

```ts
export type ConsentTemplateType =
  | "surgery_consent"
  | "euthanasia_consent"
  | "reproductive_agreement"
  | "sedation_consent";
```

Add to `TemplatePropsMap`:

```ts
type TemplatePropsMap = {
  surgery_consent: SurgeryConsentProps;
  euthanasia_consent: EuthanasiaConsentProps;
  reproductive_agreement: ReproductiveAgreementProps;
  sedation_consent: SedationConsentProps;
};
```

Add to `templateComponents`:

```ts
const templateComponents: Record<ConsentTemplateType, AnyComponent> = {
  surgery_consent: SurgeryConsentDocument,
  euthanasia_consent: EuthanasiaConsentDocument,
  reproductive_agreement: ReproductiveAgreementDocument,
  sedation_consent: SedationConsentDocument,
};
```

- [ ] **Step 2: Add name matching in generateConsentDocument**

In `crm/src/app/dashboard/consent-documents/actions.ts`, in the template type detection block (around line 211-221), add a match for sedation before the fallback:

```ts
  } else if (nameLower.includes("sedación") || nameLower.includes("sedacion")) {
    templateType = "sedation_consent";
  } else {
    templateType = "surgery_consent"; // fallback
  }
```

- [ ] **Step 3: Add the sedation PDF generation branch**

In the same file, in the PDF generation block (around line 244), add a branch for `sedation_consent` before the final `else` (reproductive). It uses the same props as surgery consent, plus `sedationReason` from `customFields`:

```ts
    } else if (templateType === "sedation_consent") {
      const props: SedationConsentProps = {
        clientName: client.name,
        clientDni: client.dni ?? "",
        clientAddress: client.address ?? "",
        patientName: patient.name,
        patientSpecies: patientSpeciesAndSex,
        patientBreed: patient.breed ?? "",
        patientCoatColor: patient.coatColor ?? "",
        patientWeight: patient.weightKg ?? "",
        patientDob: patient.dateOfBirth ?? "",
        historyNumber: patient.gvetHistoryNumber ?? undefined,
        date: todayFormatted,
        sedationReason:
          customFields.sedationReason ??
          procedureDescription ??
          undefined,
      };
      pdfBuffer = await renderConsentPdf("sedation_consent", props);
```

Add the `SedationConsentProps` import at the top of the file:

```ts
import type { SedationConsentProps } from "@/lib/pdf/templates/sedation-consent";
```

- [ ] **Step 4: Verify it compiles**

Run: `cd crm && rtk npx tsc --noEmit`
Expected: No new errors

- [ ] **Step 5: Commit**

```bash
git add crm/src/lib/pdf/render-consent.ts crm/src/app/dashboard/consent-documents/actions.ts
git commit -m "feat: register sedation consent in render pipeline and document generation"
```

---

## Task 3: Seed the sedation consent template

**Files:**
- Modify: `crm/scripts/seed-consent-templates.ts`

- [ ] **Step 1: Add the sedation template text**

In `crm/scripts/seed-consent-templates.ts`, add this constant after `REPRODUCTIVE_TEMPLATE` (around line 155):

```ts
const SEDATION_TEMPLATE = `Por medio de este documento, yo {{clientName}} ({{clientDni}}) con dirección en {{clientAddress}} en la ciudad de Rosario.

Extiendo mi completa y total autorización en favor de Neovet, para que lleve a cabo la sedación de mi mascota con el fin de realizar: {{sedationReason}}

en el animal de mi propiedad:

Nombre: {{patientName}}
Especie: {{patientSpecies}}
Raza: {{patientBreed}}
Color de pelaje: {{patientCoatColor}}
Sexo: {{patientSex}}
Edad: {{patientAge}}
Peso: {{patientWeight}} kg

Declaro conocer los riesgos inherentes a la sedación y/o anestesia, incluyendo posibles reacciones adversas, complicaciones respiratorias o cardiovasculares, y en casos extremos, la muerte del animal. Asumo la responsabilidad de los costos del tratamiento y medicación que fueran necesarios.

Firma del propietario: ______________________
Aclaración: {{clientName}}
DNI: {{clientDni}}
Fecha: {{date}}`;
```

- [ ] **Step 2: Add the template to the templates array**

In the `templates` array inside `main()`, add:

```ts
    {
      id: createId("ctm"),
      name: "Autorización de sedación",
      bodyTemplate: SEDATION_TEMPLATE,
    },
```

- [ ] **Step 3: Run the seed script against the dev DB**

Run: `cd crm && DATABASE_URL="<dev-db-url>" npx tsx scripts/seed-consent-templates.ts`
Expected: `Insertada: Autorización de sedación` (the existing 3 will show duplicate errors — that's fine)

- [ ] **Step 4: Commit**

```bash
git add crm/scripts/seed-consent-templates.ts
git commit -m "feat: add sedation consent to seed script"
```

---

## Task 4: Appointment type filter in the table UI

**Files:**
- Modify: `crm/src/app/dashboard/appointments/page.tsx:10`
- Modify: `crm/src/components/admin/appointments/appointment-table.tsx`

- [ ] **Step 1: Accept `type` search param in the page**

In `crm/src/app/dashboard/appointments/page.tsx`, update the `Props` interface to include `type`:

```ts
interface Props {
  searchParams: Promise<{ status?: string; from?: string; to?: string; page?: string; type?: string }>;
}
```

Update the `getAppointments` call to pass `type` when admin/owner (vets and groomers already have a forced filter):

```ts
  const typeFilter =
    role === "vet" ? "veterinary" :
    role === "groomer" ? "grooming" :
    (params.type as "veterinary" | "grooming" | undefined) ?? undefined;
```

Pass `type` to `AppointmentTable` as a prop so it knows the current filter value:

```tsx
        <AppointmentTable
          data={result.data}
          total={result.total}
          page={result.page}
          totalPages={result.totalPages}
          typeFilter={params.type}
          showTypeFilter={isAdmin}
        />
```

- [ ] **Step 2: Add type filter Select to the table component**

In `crm/src/components/admin/appointments/appointment-table.tsx`, add `typeFilter` and `showTypeFilter` to the props interface:

```ts
interface AppointmentTableProps {
  data?: AppointmentRow[];
  total: number;
  page: number;
  totalPages: number;
  typeFilter?: string;
  showTypeFilter?: boolean;
}
```

Update the component destructuring:

```ts
export function AppointmentTable({
  data = [],
  total,
  page,
  totalPages,
  typeFilter: initialTypeFilter,
  showTypeFilter = false,
}: AppointmentTableProps) {
```

Add state for the type filter:

```ts
  const [typeFilterValue, setTypeFilterValue] = useState(initialTypeFilter ?? "all");
```

Update `applyFilters` to include the type param:

```ts
  function applyFilters() {
    startTransition(() => {
      const params = new URLSearchParams();
      if (statusFilter && statusFilter !== "all") params.set("status", statusFilter);
      if (typeFilterValue && typeFilterValue !== "all") params.set("type", typeFilterValue);
      if (from) params.set("from", from);
      if (to) params.set("to", to);
      router.push(`/dashboard/appointments?${params.toString()}`);
    });
  }
```

Add the Select element in the filter bar, right after the status filter `<div>`, wrapped in `{showTypeFilter && ...}`:

```tsx
        {showTypeFilter && (
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Tipo</label>
            <Select value={typeFilterValue} onValueChange={(v) => v && setTypeFilterValue(v)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="veterinary">Veterinario</SelectItem>
                <SelectItem value="grooming">Estética</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
```

**Note:** Do NOT use the `label` prop on `<SelectItem>` — it is not supported by shadcn/ui and causes the component to display the `value` instead of the text when selected (see CLAUDE.md).

- [ ] **Step 3: Verify it compiles**

Run: `cd crm && rtk npx tsc --noEmit`
Expected: No new errors

- [ ] **Step 4: Test in browser**

Run: `cd crm && npm run dev`

1. Open `/dashboard/appointments` as admin → should see the "Tipo" dropdown with Todos / Veterinario / Estética
2. Select "Veterinario" → click Filtrar → URL should include `?type=veterinary`, table should show only veterinary appointments
3. Select "Estética" → click Filtrar → URL should include `?type=grooming`, table should show only grooming appointments
4. Select "Todos" → click Filtrar → `type` param removed, shows all appointments
5. Log in as a vet → the "Tipo" dropdown should NOT appear (vet already sees only veterinary)
6. Log in as a groomer → the "Tipo" dropdown should NOT appear (groomer already sees only grooming)

- [ ] **Step 5: Commit**

```bash
git add crm/src/app/dashboard/appointments/page.tsx crm/src/components/admin/appointments/appointment-table.tsx
git commit -m "feat: add appointment type filter for admin/owner on appointments page"
```

---

## Task 5 (conditional): Add Endocrinología service

> **Blocked on:** Paula confirming whether endocrinología is structurally the same as cardiología (a standard external specialist consultation). If yes, this is just a seed row.

**Files:**
- No file changes — this is a one-time DB insert via the existing services settings UI, or a manual SQL insert.

- [ ] **Step 1: Add via settings UI or direct insert**

Option A (preferred): Paula or admin adds it from `/dashboard/settings` → Servicios → Nuevo servicio, with:
- Nombre: `Endocrinología`
- Categoría: `veterinary`
- Duración: 30 min (same as cardiología — adjust after Paula confirms)
- Precio base: TBD by Paula

Option B (script): Direct DB insert matching the existing services pattern:

```sql
INSERT INTO services (id, name, category, default_duration_minutes, base_price, is_active)
VALUES ('svc_endocrinologia', 'Endocrinología', 'veterinary', 30, 0, true);
```

- [ ] **Step 2: Verify it appears in the appointment creation form**

After adding, create a new appointment → the service dropdown should show "Endocrinología" as an option.
