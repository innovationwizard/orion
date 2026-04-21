-- ============================================================================
-- Migration 056: Fix Supervisor Comercial Rate (0.25% → 0.15%)
-- ============================================================================
-- SSOT: Escenario #1 (effective 2025-03-16) — Supervisor Comercial = 0.15%
-- System had 0.25% (0.0025) for all supervisor_comercial rows.
-- Correct rate: 0.15% (0.0015).
--
-- Impact:
--   - Supervisor commission amounts decrease by 40% (0.0015/0.0025)
--   - Ahorro residual increases by 0.10% (absorbs the freed rate)
--   - Combined ahorro pool: AC(0.20%) + Ahorro(0.25%) = 0.45% — matches SSOT
--
-- No schema changes. Rate update + targeted recalculation.
-- ============================================================================


-- ============================================================================
-- PHASE A: Update supervisor rate in commission_gerencia_assignments
-- ============================================================================

UPDATE commission_gerencia_assignments
SET rate = 0.0015, updated_at = NOW()
WHERE role = 'supervisor_comercial'
  AND rate = 0.0025;

-- Verify: should match the number of supervisor rows updated
-- SELECT COUNT(*) FROM commission_gerencia_assignments WHERE role = 'supervisor_comercial' AND rate = 0.0015;


-- ============================================================================
-- PHASE B: Recalculate commissions for all payments on sales where a
-- supervisor was active (sale_date >= 2025-07-07, the earliest supervisor start)
-- ============================================================================

DO $$
DECLARE
  r record;
  v_count int := 0;
BEGIN
  FOR r IN
    SELECT DISTINCT p.id
    FROM payments p
    JOIN sales s ON p.sale_id = s.id
    WHERE s.status = 'active'
      AND s.sale_date >= '2025-07-07'
    ORDER BY p.payment_date, p.id
  LOOP
    PERFORM calculate_commissions(r.id);
    v_count := v_count + 1;
    IF v_count % 500 = 0 THEN
      RAISE NOTICE 'Recalculated % payments...', v_count;
    END IF;
  END LOOP;
  RAISE NOTICE 'Recalculation complete: % payments processed', v_count;
END;
$$;


-- ============================================================================
-- PHASE C: Validation queries (run manually after deployment)
-- ============================================================================

-- -- 1. Verify no supervisor rows still have 0.25%
-- SELECT * FROM commission_gerencia_assignments
-- WHERE role = 'supervisor_comercial' AND rate != 0.0015;
-- -- Expected: 0 rows

-- -- 2. Verify supervisor commission amounts use 0.15% rate
-- SELECT recipient_id, recipient_name, rate, COUNT(*), ROUND(SUM(commission_amount), 2) AS total
-- FROM commissions
-- WHERE recipient_id IN (
--   SELECT recipient_id FROM commission_gerencia_assignments WHERE role = 'supervisor_comercial'
-- )
-- GROUP BY recipient_id, recipient_name, rate
-- ORDER BY recipient_name;
-- -- Expected: all rows show rate = 0.0015

-- -- 3. Verify ahorro residual increased (sample check)
-- SELECT c.sale_id, c.recipient_id, c.rate
-- FROM commissions c
-- WHERE c.recipient_id = 'ahorro'
--   AND c.sale_id IN (
--     SELECT s.id FROM sales s WHERE s.sale_date >= '2025-07-07' LIMIT 5
--   )
-- ORDER BY c.sale_id
-- LIMIT 10;
-- -- Expected: ahorro rate should be ~0.10% higher than before migration

-- -- 4. Total row count (should be unchanged)
-- SELECT COUNT(*) FROM commissions;
