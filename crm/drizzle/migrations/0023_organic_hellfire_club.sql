-- Rename enum value peluqueria → estetica
ALTER TYPE "public"."service_category" RENAME VALUE 'peluqueria' TO 'estetica';

-- Add serviceId column to grooming_sessions
ALTER TABLE "grooming_sessions" ADD COLUMN "service_id" text;

-- Make price_tier nullable (drop NOT NULL)
ALTER TABLE "grooming_sessions" ALTER COLUMN "price_tier" DROP NOT NULL;

-- Add FK constraint
ALTER TABLE "grooming_sessions" ADD CONSTRAINT "grooming_sessions_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE set null ON UPDATE no action;

-- Seed 7 estética services
INSERT INTO "services" ("id", "name", "category", "default_duration_minutes", "block_duration_minutes", "base_price", "is_active", "created_at", "updated_at")
VALUES
  ('svc_estetica_bano', 'Baño', 'estetica', 60, NULL, NULL, true, NOW(), NOW()),
  ('svc_estetica_corte', 'Corte', 'estetica', 60, NULL, NULL, true, NOW(), NOW()),
  ('svc_estetica_cortesan', 'Corte sanitario', 'estetica', 45, NULL, NULL, true, NOW(), NOW()),
  ('svc_estetica_dental', 'Limpieza dental', 'estetica', 30, NULL, NULL, true, NOW(), NOW()),
  ('svc_estetica_banosan', 'Baño sanitario', 'estetica', 45, NULL, NULL, true, NOW(), NOW()),
  ('svc_estetica_banocorte', 'Baño y corte', 'estetica', 90, NULL, NULL, true, NOW(), NOW()),
  ('svc_estetica_banosancorte', 'Baño sanitario y corte', 'estetica', 75, NULL, NULL, true, NOW(), NOW())
ON CONFLICT DO NOTHING;

-- Update old generic service name
UPDATE "services" SET "name" = 'Estética (general)', "category" = 'estetica' WHERE "name" = 'Estetica y Peluqueria';
