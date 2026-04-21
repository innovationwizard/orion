-- ============================================================================
-- Migration 056: Fix Supervisor Comercial Rate (temporal split)
-- ============================================================================
-- SSOT: Escenario #1 — Supervisor rate changed at the personnel transition:
--   Antonio Rada (2025-07-07 → 2026-03-16): 0.25% (unchanged)
--   Job Jiménez (2026-03-16 → ongoing):     0.15% (new rate)
--
-- System had 0.25% (0.0025) for ALL supervisor_comercial rows.
-- Fix: only Job Jiménez rows updated to 0.0015. Antonio stays at 0.0025.
--
-- No schema changes. Targeted rate update + recalculation.
-- ============================================================================


-- ============================================================================
-- PHASE A: Update supervisor rate for Job Jiménez only
-- ============================================================================

UPDATE commission_gerencia_assignments
SET rate = 0.0015, updated_at = NOW()
WHERE role = 'supervisor_comercial'
  AND recipient_id = 'job_jimenez';


-- ============================================================================
-- PHASE B: Recalculate commissions for payments on sales in Job's period
-- (sale_date >= 2026-03-16)
-- ============================================================================

DO $$
DECLARE
  r record;
  v_count int := 0;
BEGIN
  FOR r IN
    SELECT p.id, p.payment_date
    FROM payments p
    JOIN sales s ON p.sale_id = s.id
    WHERE s.status = 'active'
      AND s.sale_date >= '2026-03-16'
    ORDER BY p.payment_date, p.id
  LOOP
    PERFORM calculate_commissions(r.id);
    v_count := v_count + 1;
  END LOOP;
  RAISE NOTICE 'Recalculation complete: % payments processed', v_count;
END;
$$;


-- ============================================================================
-- PHASE C: Validation queries (run manually after deployment)
-- ============================================================================

-- -- 1. Verify temporal rate split
-- SELECT recipient_id, recipient_name, rate, start_date, end_date
-- FROM commission_gerencia_assignments
-- WHERE role = 'supervisor_comercial'
-- ORDER BY start_date;
-- -- Expected: antonio_rada = 0.0025, job_jimenez = 0.0015

-- -- 2. Verify commission rows reflect correct rates
-- SELECT recipient_id, recipient_name, rate, COUNT(*), ROUND(SUM(commission_amount), 2) AS total
-- FROM commissions
-- WHERE recipient_id IN ('antonio_rada', 'job_jimenez')
-- GROUP BY recipient_id, recipient_name, rate
-- ORDER BY recipient_name;
