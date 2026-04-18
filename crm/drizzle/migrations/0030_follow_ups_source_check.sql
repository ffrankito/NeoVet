-- Fix 3 (revised): enforce "exactly one of consultation_id/procedure_id non-null"
-- on follow_ups via a CHECK constraint. Replaces the original "split into two
-- tables" proposal — see crm/docs/diagrams/domain-model-fixes.md for rationale.
--
-- Prereq query (run before merging, expect zero rows):
--   SELECT id, consultation_id, procedure_id
--   FROM follow_ups
--   WHERE (consultation_id IS NOT NULL)::int + (procedure_id IS NOT NULL)::int <> 1;

ALTER TABLE "follow_ups"
ADD CONSTRAINT "follow_ups_source_check"
CHECK ((consultation_id IS NOT NULL)::int + (procedure_id IS NOT NULL)::int = 1);
