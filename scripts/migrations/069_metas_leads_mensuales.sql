-- ============================================================================
-- Migration 069: Metas de leads mensuales por proyecto (HUD MERCADEO k2/k3)
-- ============================================================================
-- Healthy monthly lead ranges per project, from the marketing team (via Jorge,
-- 2026-08-07). Marketing's message said "Leads diarios", but validated against
-- their own Power BI data the ranges only hold as MONTHLY (e.g. Santa Elena
-- produces ~60 leads/month, exactly inside its 50-100 band; as daily, actuals
-- would be ~10% of goal, contradicting marketing's own "volumen bastante
-- saludable"). Jorge confirmed the monthly interpretation.
-- Verbatim ranges: Benestare 350-400, Bosque Las Tapias 250-300,
-- Boulevard 5 150-200, Santa Elena 50-100. Casa Elisa: no meta given (NULL).
-- ============================================================================

ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS meta_leads_mensual_min integer,
  ADD COLUMN IF NOT EXISTS meta_leads_mensual_max integer;

COMMENT ON COLUMN projects.meta_leads_mensual_min IS
  'Rango saludable de leads por mes (mínimo). Fuente: equipo de mercadeo 2026-08-07. NULL = sin meta.';
COMMENT ON COLUMN projects.meta_leads_mensual_max IS
  'Rango saludable de leads por mes (máximo). Fuente: equipo de mercadeo 2026-08-07. NULL = sin meta.';

UPDATE projects SET meta_leads_mensual_min = 350, meta_leads_mensual_max = 400 WHERE slug = 'benestare';
UPDATE projects SET meta_leads_mensual_min = 250, meta_leads_mensual_max = 300 WHERE slug = 'bosque-las-tapias';
UPDATE projects SET meta_leads_mensual_min = 150, meta_leads_mensual_max = 200 WHERE slug = 'boulevard-5';
UPDATE projects SET meta_leads_mensual_min = 50,  meta_leads_mensual_max = 100 WHERE slug = 'santa-elena';
