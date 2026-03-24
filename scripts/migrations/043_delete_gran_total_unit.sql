-- ============================================================================
-- Migration 043: Delete "GRAN TOTAL" summary row from rv_units
-- ============================================================================
-- The Boulevard 5 ETL seed accidentally imported a spreadsheet footer row
-- (unit_number='298', unit_type='GRAN TOTAL') as a real unit on floor P2.
-- Its fields are aggregates (parking_car=174, parking_tandem=124, etc.)
-- and it has no area_total, causing a blank tile on the inventory grid.
--
-- This migration deletes that single bogus row.
-- ============================================================================

DELETE FROM rv_units
WHERE unit_number = '298'
  AND floor_id = (
    SELECT f.id
    FROM floors f
    JOIN towers t ON t.id = f.tower_id
    WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'  -- Boulevard 5
      AND t.name = 'Principal'
      AND f.number = 2
  );
