-- ============================================================================
-- Migration 068: Metas de ventas mensuales por asesor (HUD VENTAS v2/v3)
-- ============================================================================
-- Monthly sales targets per assigned salesperson, per project.
-- Values provided by Jorge (2026-08-07):
--   BENESTARE = 5 por asesor
--   BOSQUE LAS TAPIAS = 5 por asesor
--   BOULEVARD 5 = 3 por asesor
--   CASA ELISA = 0 por asesor
--   SANTA ELENA = 0 por asesor
-- Project monthly target = meta_mensual_por_asesor × active assigned asesores
-- (salesperson_project_assignments WHERE end_date IS NULL).
-- ============================================================================

ALTER TABLE projects ADD COLUMN IF NOT EXISTS meta_mensual_por_asesor integer NOT NULL DEFAULT 0;

COMMENT ON COLUMN projects.meta_mensual_por_asesor IS
  'Meta mensual de ventas (reservas) por asesor asignado. Meta total del proyecto = meta × asesores activos. Valores de Jorge 2026-08-07.';

UPDATE projects SET meta_mensual_por_asesor = 5 WHERE slug IN ('benestare', 'bosque-las-tapias');
UPDATE projects SET meta_mensual_por_asesor = 3 WHERE slug = 'boulevard-5';
UPDATE projects SET meta_mensual_por_asesor = 0 WHERE slug IN ('casa-elisa', 'santa-elena');
