-- ============================================================================
-- One-time backfill: recalculate commissions for all payments
-- Run in Supabase SQL Editor after fix-trigger-recalc-on-update.sql.
-- Use this to fix the "special" shortfall (expected > actual) caused by
-- commissions having been created only on INSERT before the trigger fix.
-- ============================================================================
-- The DO block below does not return rows; "Success. No rows returned" is normal.
-- Run the SELECT at the end (after the backfill) to confirm commission row count.
-- ============================================================================

DO $$
DECLARE
    v_payment_id UUID;
    v_count INTEGER := 0;
    v_total INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_total FROM payments;
    RAISE NOTICE 'Backfill: recalculating commissions for % payments...', v_total;

    FOR v_payment_id IN
        SELECT id FROM payments ORDER BY payment_date, created_at
    LOOP
        PERFORM calculate_commissions(v_payment_id);
        v_count := v_count + 1;

        IF v_count % 500 = 0 THEN
            RAISE NOTICE 'Progress: % / % (%.1f%%)', v_count, v_total, (v_count::NUMERIC / v_total * 100);
        END IF;
    END LOOP;

    RAISE NOTICE 'Backfill complete: % payments processed', v_count;
END;
$$;

-- Confirmation: show payment count and total commission rows (run after the DO block)
SELECT
  (SELECT COUNT(*) FROM payments) AS payments_processed,
  (SELECT COUNT(*) FROM commissions) AS commission_rows,
  ROUND((SELECT SUM(commission_amount) FROM commissions)::numeric, 2) AS total_commission_amount;
