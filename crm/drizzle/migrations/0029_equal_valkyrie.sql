-- Fix 1: Embed GroomingProfile into Patient (Value Object consolidation).
-- Hand-edited from the Drizzle-generated version to enforce the correct order:
-- add columns → CHECK constraint → backfill → drop source table.
-- The auto-generated version had DROP TABLE first, which would have lost all
-- grooming profile data.
--
-- Prereq grep (run before merging, expect zero unexpected matches):
--   grep -rn "groomingProfileId" crm/src/
--   grep -rn "groomingProfiles\.id" crm/src/
--   grep -rn "grooming_profiles" crm/src/

-- Step 1 — add embedded columns to patients
ALTER TABLE "patients" ADD COLUMN "grooming_behavior_score" integer;--> statement-breakpoint
ALTER TABLE "patients" ADD COLUMN "grooming_coat_type" text;--> statement-breakpoint
ALTER TABLE "patients" ADD COLUMN "grooming_coat_difficulties" text;--> statement-breakpoint
ALTER TABLE "patients" ADD COLUMN "grooming_behavior_notes" text;--> statement-breakpoint
ALTER TABLE "patients" ADD COLUMN "grooming_estimated_minutes" integer;--> statement-breakpoint

-- Step 2 — CHECK constraint on behavior_score (allow NULL, else 1..10)
ALTER TABLE "patients" ADD CONSTRAINT "patients_grooming_behavior_score_range"
  CHECK ("grooming_behavior_score" IS NULL OR ("grooming_behavior_score" BETWEEN 1 AND 10));--> statement-breakpoint

-- Step 3 — backfill from grooming_profiles into the new columns
UPDATE "patients" AS p
SET
  "grooming_behavior_score"      = gp."behavior_score",
  "grooming_coat_type"           = gp."coat_type",
  "grooming_coat_difficulties"   = gp."coat_difficulties",
  "grooming_behavior_notes"      = gp."behavior_notes",
  "grooming_estimated_minutes"   = gp."estimated_minutes"
FROM "grooming_profiles" gp
WHERE gp."patient_id" = p."id";--> statement-breakpoint

-- Step 4 — drop the now-redundant table
DROP TABLE "grooming_profiles" CASCADE;
