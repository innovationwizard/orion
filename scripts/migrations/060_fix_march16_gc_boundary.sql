-- ============================================================================
-- Migration 060: Fix March 16 GC/Supervisor date boundary (inclusive vs exclusive)
-- ============================================================================
-- Root cause (discovered during Phase 1 commission audit, 2026-05-04):
--
--   commission_gerencia_assignments has:
--     alek_hernandez  (GC 0.30%)  end_date = 2026-03-16
--     antonio_rada    (SUP 0.25%) end_date = 2026-03-16
--     antonio_rada    (GC 0.30%)  start_date = 2026-03-16   (no end_date)
--     job_jimenez     (SUP 0.15%) start_date = 2026-03-16   (no end_date)
--
--   calculate_commissions() uses inclusive boundary:
--     start_date <= sale_date AND (end_date IS NULL OR end_date >= sale_date)
--
--   This causes sale_date = 2026-03-16 to match BOTH groups simultaneously:
--     - Alek (end_date 2026-03-16 >= 2026-03-16 → TRUE)
--     - Antonio-GC (start_date 2026-03-16 <= 2026-03-16 → TRUE)
--
--   Result: the March 16 BEN sale (e29d304a, Q386,900) generates 4 commission rows:
--     - Alek Hernández (GC)           Q318.58  ← WRONG — must be removed
--     - Supervisor / Antonio R.       Q265.48  ← WRONG — must be removed
--     - Antonio Rada (GC)             Q318.58  ← CORRECT
--     - Job Jiménez (Supervisor)      Q159.29  ← CORRECT
--
-- Fix:
--   1. Set end_date = 2026-03-15 for Alek-GC and Antonio-Supervisor rows.
--      This excludes March 16 from their range (end_date < 2026-03-16).
--   2. Re-run calculate_commissions() for the March 16 reservation payment.
--      The function DELETEs all commission rows for that payment_id and
--      re-INSERTs correct rows (only Antonio-GC + Job-Supervisor + others).
--
-- Payment ID for March 16 reservation (BEN sale e29d304a):
--   9f665670-e40f-4b32-bd6d-231e0861a443
--
-- Affected commission rows deleted by re-run:
--   - Alek Hernández Q318.58  (recipient_id = 'alek_hernandez')
--   - Supervisor / Antonio R. Q265.48  (recipient_id = 'antonio_rada', wrong role row)
-- ============================================================================

-- Step 1: Shift end_date from 2026-03-16 → 2026-03-15 for Alek (GC) rows
UPDATE commission_gerencia_assignments
SET end_date = '2026-03-15'
WHERE recipient_id = 'alek_hernandez'
  AND role = 'gerencia_comercial'
  AND end_date = '2026-03-16';

-- Step 2: Shift end_date from 2026-03-16 → 2026-03-15 for Antonio-Supervisor rows
UPDATE commission_gerencia_assignments
SET end_date = '2026-03-15'
WHERE recipient_id = 'antonio_rada'
  AND role = 'supervisor_comercial'
  AND end_date = '2026-03-16';

-- Step 3: Verify the updates (informational — does not affect execution)
DO $$
DECLARE
  alek_count  int;
  sup_count   int;
BEGIN
  SELECT COUNT(*) INTO alek_count
  FROM commission_gerencia_assignments
  WHERE recipient_id = 'alek_hernandez' AND end_date = '2026-03-16';

  SELECT COUNT(*) INTO sup_count
  FROM commission_gerencia_assignments
  WHERE recipient_id = 'antonio_rada' AND role = 'supervisor_comercial' AND end_date = '2026-03-16';

  IF alek_count > 0 OR sup_count > 0 THEN
    RAISE EXCEPTION 'UPDATE did not clear all 2026-03-16 end_date rows (alek=%, antonio-sup=%)',
      alek_count, sup_count;
  END IF;

  RAISE NOTICE 'Step 1-2 complete: boundary shifted to 2026-03-15 for Alek-GC and Antonio-Supervisor';
END;
$$;

-- Step 4: Recalculate commissions for all payments on sale e29d304a (March 16 BEN sale).
-- calculate_commissions() does DELETE+REINSERT for each payment_id, so calling it here
-- will remove the wrong Alek and Antonio-Supervisor rows and insert the correct rows.
DO $$
DECLARE
  r record;
  v_count int := 0;
BEGIN
  FOR r IN
    SELECT id
    FROM payments
    WHERE sale_id = 'e29d304a-35c6-4767-b56a-b86e09897957'
    ORDER BY payment_date
  LOOP
    PERFORM calculate_commissions(r.id);
    v_count := v_count + 1;
  END LOOP;
  RAISE NOTICE 'Step 4 complete: recalculated commissions for % payment(s) on sale e29d304a', v_count;
END;
$$;

-- ============================================================================
-- Validation queries (run manually after deploy to confirm fix)
-- ============================================================================

-- 1. Confirm boundary dates in commission_gerencia_assignments
-- SELECT recipient_id, role, rate, start_date, end_date
-- FROM commission_gerencia_assignments
-- WHERE recipient_id IN ('alek_hernandez', 'antonio_rada', 'job_jimenez')
-- ORDER BY recipient_id, role, start_date;
-- Expected: alek_hernandez end_date = 2026-03-15, antonio_rada supervisor end_date = 2026-03-15

-- 2. Confirm March 16 sale now has only correct commission rows
-- SELECT recipient_name, recipient_id, ROUND(commission_amount::numeric, 2) as amount
-- FROM commissions c
-- JOIN payments p ON c.payment_id = p.id
-- WHERE p.id = '9f665670-e40f-4b32-bd6d-231e0861a443'
-- ORDER BY amount DESC;
-- Expected: antonio_rada (GC Q318.58), job_jimenez (Q159.29), otto_herrera (~Q637), puerta_abierta, ahorro, ejecutivo
-- Expected NOT present: alek_hernandez, 'Supervisor / Antonio R.' row

-- 3. Confirm corrected March 2026 totals for the four recipients
-- SELECT recipient_name, COUNT(*) as rows, ROUND(SUM(commission_amount)::numeric, 2) as total
-- FROM commissions c
-- JOIN payments p ON c.payment_id = p.id
-- WHERE p.payment_date >= '2026-03-01' AND p.payment_date <= '2026-03-31'
--   AND recipient_id IN ('alek_hernandez', 'antonio_rada', 'job_jimenez', 'otto_herrera')
-- GROUP BY recipient_name ORDER BY recipient_name;
-- Expected vs pre-fix:
--   Alek Hernández:      Q8,897.73  (was Q9,216.31  — minus Q318.58 March 16 wrong row)
--   Antonio Rada (GC):   Q7,864.58  (unchanged — March 16 GC row is correct)
--   Supervisor/Antonio:  Q7,414.78  (was Q7,680.26  — minus Q265.48 March 16 wrong row)
--   Job Jiménez:         Q3,932.29  (unchanged)
--   Otto Herrera:        Q33,524.63 (unchanged)
