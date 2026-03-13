-- ============================================================================
-- Migration: Seed active project assignments from historical data
-- Date: 2026-03-13
--
-- Creates one active assignment (end_date = NULL) per distinct
-- (salesperson, project) pair found in historical assignments.
-- Excludes non-person entries (Unknown, Junta Directiva).
-- Only the first project per salesperson gets is_primary = true
-- (constraint srpa_one_active_primary_per_rep enforces at most one).
-- Idempotent: skips pairs that already have an active assignment.
-- ============================================================================

INSERT INTO salesperson_project_assignments (
  id, salesperson_id, project_id, start_date, end_date, is_primary
)
SELECT
  gen_random_uuid(),
  ranked.salesperson_id,
  ranked.project_id,
  CURRENT_DATE,
  NULL,   -- active = no end date
  (ranked.rn = 1)  -- only first project is primary
FROM (
  SELECT
    spa.salesperson_id,
    spa.project_id,
    ROW_NUMBER() OVER (
      PARTITION BY spa.salesperson_id
      ORDER BY spa.project_id  -- deterministic ordering by project
    ) AS rn
  FROM (
    SELECT DISTINCT salesperson_id, project_id
    FROM salesperson_project_assignments
  ) spa
  JOIN salespeople sp ON sp.id = spa.salesperson_id
  WHERE sp.full_name NOT IN ('Unknown', 'Junta Directiva')
) ranked
WHERE NOT EXISTS (
  SELECT 1 FROM salesperson_project_assignments existing
  WHERE existing.salesperson_id = ranked.salesperson_id
    AND existing.project_id = ranked.project_id
    AND existing.end_date IS NULL
);
