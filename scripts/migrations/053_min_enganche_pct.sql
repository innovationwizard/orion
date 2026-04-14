-- Migration 053: Add min_enganche_pct to cotizador_configs
-- Purpose: Enforce a per-config minimum enganche percentage in the cotizador slider.
-- Santa Elena requires 30% minimum; other projects remain at the hardcoded 5% default.

ALTER TABLE cotizador_configs
ADD COLUMN min_enganche_pct numeric(5,4) DEFAULT NULL;

COMMENT ON COLUMN cotizador_configs.min_enganche_pct IS
  'Minimum enganche percentage (decimal, e.g. 0.30 = 30%). NULL = use app default (5%).';

-- Set Santa Elena configs to 30% minimum
UPDATE cotizador_configs
SET min_enganche_pct = 0.30, updated_at = now()
WHERE project_id = (SELECT id FROM projects WHERE slug = 'santa-elena');
