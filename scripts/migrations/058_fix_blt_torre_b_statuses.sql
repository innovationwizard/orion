-- Migration 058: Fix BLT Torre B unit statuses
--
-- Root cause: Column drift in OneDrive sync — DISP_COLUMNS.blt_b.statusCol
-- pointed at "Total" (monetary column X) instead of "Estatus" (column Z).
-- normalizeStatus() mapped every numeric value to SOLD.
-- All 117 Torre B units were overwritten to SOLD on every hourly sync.
--
-- This migration:
--   1. Resets all Torre B units to AVAILABLE (except those with active reservations)
--   2. Restores correct statuses for the 4 units identified in the SSOT Excel
--   3. Logs corrections to unit_status_log
--
-- Ref: docs/diag-blt-torre-b-all-vendido-2026-04-21.md
-- Ref: docs/plan-fix-blt-torre-b-vendido-2026-04-21.md

-- -------------------------------------------------------------------------
-- Step 1: Reset all SOLD Torre B units to AVAILABLE
--         (skip units that have an active reservation — those are legitimately non-AVAILABLE)
-- -------------------------------------------------------------------------
WITH torre_b_units AS (
  SELECT u.id, u.unit_number, u.status
  FROM rv_units u
  JOIN floors f ON u.floor_id = f.id
  JOIN towers t ON f.tower_id = t.id
  JOIN projects p ON t.project_id = p.id
  WHERE p.slug = 'bosque-las-tapias'
    AND t.name = 'Torre B'
    AND u.status = 'SOLD'
    AND u.id NOT IN (
      SELECT unit_id FROM reservations
      WHERE status IN ('PENDING_REVIEW', 'CONFIRMED')
    )
),
updated AS (
  UPDATE rv_units u
  SET status = 'AVAILABLE',
      status_changed_at = NOW(),
      status_detail = 'Fix migration 058: column-drift mass-SOLD bug'
  FROM torre_b_units tb
  WHERE u.id = tb.id
  RETURNING u.id, tb.unit_number, tb.status AS old_status
)
INSERT INTO unit_status_log (unit_id, old_status, new_status, changed_by, reason)
SELECT id, old_status, 'AVAILABLE', 'system:migration-058',
       'Fix: column-drift caused mass-SOLD — unit ' || unit_number || ' restored to AVAILABLE'
FROM updated;

-- -------------------------------------------------------------------------
-- Step 2: Set correct statuses for the 4 known units from SSOT
-- -------------------------------------------------------------------------

-- Unit 508 = Reservado
WITH target AS (
  SELECT u.id, u.status AS old_status
  FROM rv_units u
  JOIN floors f ON u.floor_id = f.id
  JOIN towers t ON f.tower_id = t.id
  JOIN projects p ON t.project_id = p.id
  WHERE p.slug = 'bosque-las-tapias'
    AND t.name = 'Torre B'
    AND u.unit_number = '508'
    AND u.status != 'RESERVED'
),
upd AS (
  UPDATE rv_units u
  SET status = 'RESERVED',
      status_changed_at = NOW(),
      status_detail = 'Fix migration 058: restored from SSOT Excel'
  FROM target t
  WHERE u.id = t.id
  RETURNING u.id, t.old_status
)
INSERT INTO unit_status_log (unit_id, old_status, new_status, changed_by, reason)
SELECT id, old_status, 'RESERVED', 'system:migration-058',
       'Fix: unit 508 restored to RESERVED per SSOT'
FROM upd;

-- Units 702, 1305, 1307 = PCV → SOLD
WITH target AS (
  SELECT u.id, u.unit_number, u.status AS old_status
  FROM rv_units u
  JOIN floors f ON u.floor_id = f.id
  JOIN towers t ON f.tower_id = t.id
  JOIN projects p ON t.project_id = p.id
  WHERE p.slug = 'bosque-las-tapias'
    AND t.name = 'Torre B'
    AND u.unit_number IN ('702', '1305', '1307')
    AND u.status != 'SOLD'
),
upd AS (
  UPDATE rv_units u
  SET status = 'SOLD',
      status_changed_at = NOW(),
      status_detail = 'Fix migration 058: restored from SSOT Excel (PCV)'
  FROM target t
  WHERE u.id = t.id
  RETURNING u.id, t.unit_number, t.old_status
)
INSERT INTO unit_status_log (unit_id, old_status, new_status, changed_by, reason)
SELECT id, old_status, 'SOLD', 'system:migration-058',
       'Fix: unit ' || unit_number || ' restored to SOLD (PCV) per SSOT'
FROM upd;

-- -------------------------------------------------------------------------
-- Verification query (run after migration to confirm results)
-- -------------------------------------------------------------------------
-- SELECT u.unit_number, u.status, u.status_detail
-- FROM rv_units u
-- JOIN floors f ON u.floor_id = f.id
-- JOIN towers t ON f.tower_id = t.id
-- JOIN projects p ON t.project_id = p.id
-- WHERE p.slug = 'bosque-las-tapias'
--   AND t.name = 'Torre B'
--   AND u.status != 'AVAILABLE'
-- ORDER BY u.unit_number;
-- Expected: 508=RESERVED, 702=SOLD, 1305=SOLD, 1307=SOLD
