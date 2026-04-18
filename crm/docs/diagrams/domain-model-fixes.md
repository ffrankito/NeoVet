# Domain Model — Cleanup Plan

Three schema cleanups flagged in `./domain-model.drawio` (⚠️ markers). This plan was revised after an independent database review surfaced design flaws in Fixes 2 and 3 as originally proposed. The current shape is:

- **Fix 1** → Apply now (scoped down: 5 columns, not JSONB).
- **Fix 2** → **Redesign required before it ships.** The original CHECK constraint design was broken. Defer until the revised design is agreed and a live-data audit runs clean.
- **Fix 3** → **Replace the table split with a 1-line CHECK constraint.** The original split was premature normalization — the cron and dashboards treat both follow-up types identically, so splitting adds UNION churn without buying integrity the DB can already enforce.

After Fix 1 + the new CHECK on `follow_ups` land, `./domain-model-prescriptive.drawio` can be updated and promoted to replace `./domain-model.drawio` once Fix 2 is also merged.

> **Context:** the project is in active development. UAT is postponed. These fixes are dev-phase refactors; they're not v1 blockers in the business-functionality sense, but shipping Fix 2 wrong would create silent data corruption, so the guardrails below are mandatory, not optional.

---

## Fix 1 — Embed `GroomingProfile` into `Patient`

**Status:** ready to apply. Scoped decision: 5 typed columns, **not** JSONB.

### The problem
`grooming_profiles` is its own table with `UNIQUE(patientId)` and `ON DELETE CASCADE`. Exactly one per pet, dies with the pet, no independent identity. That's a Value Object — it doesn't earn its own table.

### Why 5 columns and not JSONB
- `behaviorScore` is an integer with a semantic range (1–10 per the schema comment) — a typed column keeps that as a trivial CHECK. JSONB needs custom functions.
- `estimatedMinutes` is consumed by the calendar for slot sizing — hot path. Columnar access is free; JSONB path extraction needs functional or GIN indexes.
- "Easier to evolve" only matters at 50+ fields or multi-tenant variation. Neither applies here.

### Prerequisite (must run before the migration)
```bash
grep -r "groomingProfileId" crm/src/
grep -r "groomingProfiles.id" crm/src/
grep -r "grooming_profiles" crm/src/
```
If anything references `groomingProfileId` as a foreign key (audit trail, photo linkage, etc.), surface that **before** dropping the table — otherwise rows orphan silently.

### Migration
1. Add 5 nullable columns to `patients`:
   - `grooming_behavior_score integer` with `CHECK (grooming_behavior_score BETWEEN 1 AND 10)`.
   - `grooming_coat_type text`.
   - `grooming_coat_difficulties text`.
   - `grooming_behavior_notes text`.
   - `grooming_estimated_minutes integer`.
2. Backfill: `UPDATE patients SET … FROM grooming_profiles WHERE grooming_profiles.patient_id = patients.id`.
3. Drop `grooming_profiles`.
4. Optional: partial index `CREATE INDEX idx_patients_grooming ON patients(id) WHERE grooming_estimated_minutes IS NOT NULL;` — only if the grooming module actually filters on "patients with profile". Verify in `src/app/dashboard/grooming/` queries before adding; otherwise skip.

### Code changes
- Delete `src/db/schema/grooming_profiles.ts`, remove its export from `src/db/schema/index.ts`.
- Add the 5 fields in `src/db/schema/patients.ts`.
- Update any grooming action/query to read/write the `patients` columns directly. Start from `src/app/dashboard/grooming/actions.ts` and work outward.

### Done when
- `grooming_profiles` table no longer exists.
- Peluquería tab in patient detail still loads the profile fields.
- Creating/editing a profile from the grooming module still works end-to-end.

### Rollback
Trivial if caught pre-divergence: reverse migration re-creates `grooming_profiles`, backfills from the 5 columns, drops them.

---

## Fix 2 — Replace `Charge` polymorphism with typed FKs

**Status: redesign required. Do NOT ship the original design.**

### What was wrong with the original proposal
The original doc proposed a `CHECK (sum_of_nonnull_fks <= 1)` constraint with the rationale that manual charges (`sourceType = 'other'`) have all FKs null. This silently collapses two different conditions into the same shape:
- A legitimate manual charge (intentional).
- An auto-charge hook that forgot to set its typed FK (bug).

Today `sourceType = 'other'` is an explicit positive signal. The original design weakens the invariant. It must not ship as written.

### Call-site impact is larger than the original doc claimed
Grep confirms `sourceType` is used in 10+ places including:
- `src/app/dashboard/deudores/actions.ts` — `GROUP BY charges.sourceType` at line 227, Zod enum at lines 46–53, categorization logic at 173, `createChargeForSource()` at 397–421.
- `src/components/admin/deudores/charge-form.tsx` and `charge-table.tsx` — exposes `sourceType` as form/display value.

A refactor must treat `sourceType` as a **conceptual column** (kept for categorization) while adding typed FKs for referential integrity.

### Revised design (agreed baseline — pending final review)
1. Keep `source_type` OR replace with `is_manual boolean NOT NULL DEFAULT false`.
2. Add 5 nullable FK columns to `charges`:
   - `consultation_id` → `consultations.id` ON DELETE SET NULL
   - `sale_id` → `sales.id` ON DELETE SET NULL
   - `procedure_id` → `procedures.id` ON DELETE SET NULL
   - `hospitalization_id` → `hospitalizations.id` ON DELETE SET NULL
   - `grooming_session_id` → `grooming_sessions.id` ON DELETE SET NULL
3. **Index all 5 FKs** — otherwise `ON DELETE SET NULL` triggers a seq scan of `charges` on every delete, ×5.
4. Conditional CHECK:
   ```sql
   CHECK (
     (is_manual AND (consultation_id IS NULL AND sale_id IS NULL AND procedure_id IS NULL AND hospitalization_id IS NULL AND grooming_session_id IS NULL))
     OR
     (NOT is_manual AND (
       (consultation_id IS NOT NULL)::int +
       (sale_id IS NOT NULL)::int +
       (procedure_id IS NOT NULL)::int +
       (hospitalization_id IS NOT NULL)::int +
       (grooming_session_id IS NOT NULL)::int
       = 1
     ))
   )
   ```
5. Backfill maps each existing `(sourceType, sourceId)` pair into the matching typed FK, and sets `is_manual = true` for legacy `sourceType = 'other'` rows.
6. Drop `sourceType` and `sourceId` columns **only after** backfill verified.

### Mandatory prerequisites before running the migration
- **Data audit**: verify every live `(sourceType, sourceId)` in `charges` resolves to a real row in the referenced table:
  ```sql
  -- run variant for each sourceType value; no rows should return
  SELECT c.id, c.source_type, c.source_id
  FROM charges c
  WHERE c.source_type = 'consultation'
    AND c.source_id IS NOT NULL
    AND NOT EXISTS (SELECT 1 FROM consultations WHERE id = c.source_id);
  ```
  If any rows return, the FK creation step will fail. They must be cleaned up or documented as known-orphan.
- **Refresh the dev Supabase branch from prod** so the migration runs against realistic data, not seed fixtures.
- **Full backup of `charges`** before running the migration in prod — CHECK rejections cannot be recovered without it.

### Call-site refactor scope
- Update `createChargeForSource()` signature — accept a discriminated union instead of `(sourceType: string, sourceId: string)`.
- Rewrite the `GROUP BY sourceType` in deudores as `GROUP BY CASE WHEN consultation_id IS NOT NULL THEN 'consultation' … END` (or derive a virtual column).
- Update the 4 auto-charge hooks (consultations, grooming sessions, pet shop sales, procedures).
- Update Zod schemas and admin form/table components.

### Done when
- `source_type` and `source_id` columns are gone.
- Deleting a consultation with an associated charge leaves the charge with `consultation_id = NULL` and `is_manual = false` — no orphan, no silent downgrade to "manual".
- Deudores page still categorizes charges correctly by source.
- All 5 new FK indexes exist.

### Gotcha: Drizzle regeneration drift
Migration 0019 had the issue of Drizzle regenerating CREATE TABLE for existing tables. Fix 2 adds 5 FKs and drops 2 columns in the same migration — higher risk than most of adding noise to the generated file. **Generate the migration, read it byte-by-byte before committing, and be prepared to hand-edit like 0019 required.**

---

## Fix 3 — Enforce the `follow_ups` invariant with a CHECK constraint

**Status:** ready to apply. **Replaces the original "split into two tables" proposal.**

### Why the original split was rejected
The cron job at `src/app/api/cron/follow-ups/route.ts:19-35` reads `patientName`, `clientName`, `clientEmail`, `reason` — it never reads `consultationId` or `procedureId`. Both "types" of follow-up are behaviorally identical. Splitting into two tables produces:
- Two tables with ~95% identical columns.
- A `UNION ALL` in every cron query and dashboard query.
- Double the index maintenance.
- A behavior change (CASCADE vs. SET NULL) disguised as a refactor.

### Revised migration (one line of SQL)
```sql
ALTER TABLE follow_ups
ADD CONSTRAINT follow_ups_source_check
CHECK ((consultation_id IS NOT NULL)::int + (procedure_id IS NOT NULL)::int = 1);
```
This gives the "exactly one non-null" integrity guarantee with zero code changes, zero backfill, zero cron rewrite.

### Prerequisite
Run this query first — if any rows return, clean them up before adding the constraint (otherwise the ALTER fails):
```sql
SELECT id, consultation_id, procedure_id
FROM follow_ups
WHERE (consultation_id IS NOT NULL)::int + (procedure_id IS NOT NULL)::int <> 1;
```

### Drizzle note
Drizzle 0.45.1 models CHECK constraints awkwardly. Easiest path: generate an empty migration and write the ALTER TABLE by hand in the SQL file. Do not try to express the constraint in `schema.ts`.

### Done when
- Constraint exists in prod.
- Follow-up creation from both entry points (consultation detail, procedure detail) still works.
- Cron job still fires as expected.

### Rollback
One-liner: `ALTER TABLE follow_ups DROP CONSTRAINT follow_ups_source_check;`.

---

## Execution order

Bundle Fix 1 and Fix 3 into a single PR. They're independent in code but both are low-risk, small-surface, and reviewable together. Fix 2 ships separately when redesign is finalized and the data audit is clean.

1. **PR 1 — Bundle (now):**
   - Fix 1 migration + schema + call-site updates.
   - Fix 3 one-line CHECK constraint.
   - Manual smoke test: create a grooming profile via UI, edit it, delete and re-create a patient; create a follow-up from a consultation and from a procedure; verify cron fires.

2. **PR 2 — Fix 2 (next):**
   - Data audit query results attached to the PR description.
   - Dev branch refreshed from prod.
   - Charges table backup verified.
   - Revised CHECK + `is_manual` design reviewed.
   - Migration hand-reviewed for Drizzle drift.

Each PR:
- Generated migration file.
- Updated schema + callers.
- No Drizzle unused-table warnings.
- Manual test plan in the PR description, executed against the dev branch.

---

## After all three land

1. Delete `./domain-model.drawio` (the descriptive one).
2. Rename `./domain-model-prescriptive.drawio` → `./domain-model.drawio`.
3. Update the prescriptive file's title block to remove "(PRESCRIPTIVE — fixes applied)".
4. Update this file one more time: note which PRs landed which fix, then consider deleting it. It has served its purpose once Fix 2 is merged.
