-- ============================================================================
-- Migration 066: Merge Daniel Veliz into Eder Veliz (same person)
-- ============================================================================
-- Problem: "Eder Veliz" and "Daniel Veliz" are the same real person stored as
-- two separate salespeople records. Daniel Veliz was inserted in migration 024
-- and used for March–April 2026 sales (migrations 057/061). Eder Veliz is the
-- longer-standing canonical record with 24+ historical sales.
--
-- Fix: Re-key all Daniel Veliz references to Eder Veliz, merge periods and
-- assignments, deactivate the Daniel Veliz record, and recalculate commissions
-- on affected sales.
--
-- UUIDs:
--   Eder Veliz  (KEEP)   d5895fe3-62c8-4815-af0b-086feafead42
--   Daniel Veliz (MERGE)  c5e33ccb-6c39-45ac-8d4d-ee5cdf598895
--
-- Affected sales (8 total):
--   Migration 057 (March 2026):
--     83ba25ae-7300-42ea-80d7-416f898d6843  BNT 2026-03-30
--     4d47106f-4ae7-439a-ab89-4fb11f9fc260  BNT 2026-03-29
--     a2a0d9e9-41e3-449b-bfe1-71fa54a026c1  BNT 2026-03-12
--     d74498bb-94ed-445a-bf57-bacd31606d68  BNT 2026-03-08
--   Migration 061 (April 2026):
--     15c95eb2-646a-43bf-8bf9-e4f117d05d12  BNT 309-C  2026-04-30
--     89dd84a7-bbc8-4015-8bd2-32f063e75ee3  BNT 105-D  2026-04-28
--     f7ea12a1-65b0-40ab-889a-9a12ba3631a5  BNT 202-B  2026-04-28
--     df6bd4df-1a3b-475b-b905-e3ad33cd9a15  BNT 302-D  2026-04-19
-- ============================================================================

-- ============================================================================
-- PHASE 0: Pre-check — verify both records exist
-- ============================================================================
DO $$
DECLARE
  v_eder_count int;
  v_daniel_count int;
  v_daniel_sales int;
BEGIN
  SELECT COUNT(*) INTO v_eder_count FROM salespeople
  WHERE id = 'd5895fe3-62c8-4815-af0b-086feafead42';

  SELECT COUNT(*) INTO v_daniel_count FROM salespeople
  WHERE id = 'c5e33ccb-6c39-45ac-8d4d-ee5cdf598895';

  IF v_eder_count = 0 THEN
    RAISE EXCEPTION 'Eder Veliz (d5895fe3) not found in salespeople';
  END IF;

  IF v_daniel_count = 0 THEN
    RAISE EXCEPTION 'Daniel Veliz (c5e33ccb) not found in salespeople';
  END IF;

  SELECT COUNT(*) INTO v_daniel_sales FROM sales
  WHERE sales_rep_id = 'c5e33ccb-6c39-45ac-8d4d-ee5cdf598895';

  RAISE NOTICE 'Pre-check passed: Eder Veliz and Daniel Veliz found. Daniel has % sales.', v_daniel_sales;
END;
$$;

-- ============================================================================
-- PHASE 1: Disable triggers
-- ============================================================================

ALTER TABLE sales DISABLE TRIGGER auto_recalc_commissions_on_sale_update;
ALTER TABLE payments DISABLE TRIGGER auto_calculate_commissions;

-- ============================================================================
-- PHASE 2: Re-key sales.sales_rep_id
-- ============================================================================

UPDATE sales
SET sales_rep_id = 'd5895fe3-62c8-4815-af0b-086feafead42',
    updated_at = NOW()
WHERE sales_rep_id = 'c5e33ccb-6c39-45ac-8d4d-ee5cdf598895';

-- ============================================================================
-- PHASE 3: Re-key commissions.recipient_id (text column)
-- ============================================================================

UPDATE commissions
SET recipient_id = 'd5895fe3-62c8-4815-af0b-086feafead42',
    recipient_name = (SELECT display_name FROM salespeople WHERE id = 'd5895fe3-62c8-4815-af0b-086feafead42')
WHERE recipient_id = 'c5e33ccb-6c39-45ac-8d4d-ee5cdf598895';

-- ============================================================================
-- PHASE 4: Merge salesperson_periods
-- ============================================================================
-- Daniel has an open period from migration 062: (2025-11-01, NULL).
-- Delete it. Eder should have his own period; if not, insert one.

DELETE FROM salesperson_periods
WHERE salesperson_id = 'c5e33ccb-6c39-45ac-8d4d-ee5cdf598895';

-- Ensure Eder has an open period (no-op if one already exists with NULL end_date)
INSERT INTO salesperson_periods (salesperson_id, start_date, end_date, dates_confirmed, source, notes)
SELECT 'd5895fe3-62c8-4815-af0b-086feafead42', '2025-05-01', NULL, true, 'migration_066', 'Merged from Daniel Veliz — open period'
WHERE NOT EXISTS (
  SELECT 1 FROM salesperson_periods
  WHERE salesperson_id = 'd5895fe3-62c8-4815-af0b-086feafead42'
    AND end_date IS NULL
);

-- ============================================================================
-- PHASE 5: Merge salesperson_project_assignments
-- ============================================================================
-- Delete Daniel's assignments that would conflict with Eder's existing ones
-- (same project_id). Then re-key any remaining.

DELETE FROM salesperson_project_assignments
WHERE salesperson_id = 'c5e33ccb-6c39-45ac-8d4d-ee5cdf598895'
  AND project_id IN (
    SELECT project_id FROM salesperson_project_assignments
    WHERE salesperson_id = 'd5895fe3-62c8-4815-af0b-086feafead42'
  );

UPDATE salesperson_project_assignments
SET salesperson_id = 'd5895fe3-62c8-4815-af0b-086feafead42'
WHERE salesperson_id = 'c5e33ccb-6c39-45ac-8d4d-ee5cdf598895';

-- ============================================================================
-- PHASE 6: Re-key reservation-system tables (if any rows exist)
-- ============================================================================

UPDATE reservations
SET salesperson_id = 'd5895fe3-62c8-4815-af0b-086feafead42'
WHERE salesperson_id = 'c5e33ccb-6c39-45ac-8d4d-ee5cdf598895';

UPDATE freeze_requests
SET salesperson_id = 'd5895fe3-62c8-4815-af0b-086feafead42'
WHERE salesperson_id = 'c5e33ccb-6c39-45ac-8d4d-ee5cdf598895';

UPDATE rv_referrals
SET salesperson_id = 'd5895fe3-62c8-4815-af0b-086feafead42'
WHERE salesperson_id = 'c5e33ccb-6c39-45ac-8d4d-ee5cdf598895';

-- ============================================================================
-- PHASE 7: Clean up commission_rates (if any entry exists for Daniel)
-- ============================================================================

DELETE FROM commission_rates
WHERE recipient_id = 'c5e33ccb-6c39-45ac-8d4d-ee5cdf598895';

-- ============================================================================
-- PHASE 8: Deactivate Daniel Veliz
-- ============================================================================
-- Deactivate rather than DELETE to avoid ON DELETE RESTRICT violations from
-- any unknown references (reservations, freeze_requests).

UPDATE salespeople
SET is_active = false, updated_at = NOW()
WHERE id = 'c5e33ccb-6c39-45ac-8d4d-ee5cdf598895';

-- ============================================================================
-- PHASE 9: Re-enable triggers
-- ============================================================================

ALTER TABLE sales ENABLE TRIGGER auto_recalc_commissions_on_sale_update;
ALTER TABLE payments ENABLE TRIGGER auto_calculate_commissions;

-- ============================================================================
-- PHASE 10: Recalculate commissions on formerly-Daniel sales
-- ============================================================================
-- Recalculate all payments on the 8 migrated sales so commission rows reflect
-- the updated sales_rep_id (Eder's UUID and display_name).

DO $$
DECLARE
  r record;
  v_count int := 0;
BEGIN
  FOR r IN
    SELECT p.id
    FROM payments p
    JOIN sales s ON p.sale_id = s.id
    WHERE s.id IN (
      -- Migration 057 (March 2026)
      '83ba25ae-7300-42ea-80d7-416f898d6843',
      '4d47106f-4ae7-439a-ab89-4fb11f9fc260',
      'a2a0d9e9-41e3-449b-bfe1-71fa54a026c1',
      'd74498bb-94ed-445a-bf57-bacd31606d68',
      -- Migration 061 (April 2026)
      '15c95eb2-646a-43bf-8bf9-e4f117d05d12',
      '89dd84a7-bbc8-4015-8bd2-32f063e75ee3',
      'f7ea12a1-65b0-40ab-889a-9a12ba3631a5',
      'df6bd4df-1a3b-475b-b905-e3ad33cd9a15'
    )
    ORDER BY p.payment_date, p.id
  LOOP
    PERFORM calculate_commissions(r.id);
    v_count := v_count + 1;
  END LOOP;
  RAISE NOTICE 'Commission recalculation complete: % payments recalculated', v_count;
END;
$$;

-- ============================================================================
-- PHASE 11: Verification
-- ============================================================================
-- Run these after migration to confirm clean merge:
--
-- SELECT COUNT(*) AS orphaned_sales FROM sales
-- WHERE sales_rep_id = 'c5e33ccb-6c39-45ac-8d4d-ee5cdf598895';
-- Expected: 0
--
-- SELECT COUNT(*) AS orphaned_commissions FROM commissions
-- WHERE recipient_id = 'c5e33ccb-6c39-45ac-8d4d-ee5cdf598895';
-- Expected: 0
--
-- SELECT COUNT(*) AS orphaned_periods FROM salesperson_periods
-- WHERE salesperson_id = 'c5e33ccb-6c39-45ac-8d4d-ee5cdf598895';
-- Expected: 0
--
-- SELECT COUNT(*) AS orphaned_assignments FROM salesperson_project_assignments
-- WHERE salesperson_id = 'c5e33ccb-6c39-45ac-8d4d-ee5cdf598895';
-- Expected: 0
--
-- SELECT id, full_name, is_active FROM salespeople
-- WHERE full_name ILIKE '%veliz%';
-- Expected: Eder Veliz active, Daniel Veliz inactive
-- ============================================================================
