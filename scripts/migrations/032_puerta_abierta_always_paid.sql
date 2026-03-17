-- ============================================================================
-- Migration 032: Puerta Abierta Always Paid (2.50% on every sale)
-- Date: 2026-03-16
--
-- WHAT: Fixes the structural error where Puerta Abierta's 2.50% was only
--       paid on "walk-in" sales (sales_rep_id IS NULL). Per CFO confirmation,
--       the 5% total commission splits 2.50% Puerta Abierta (company utility)
--       + 2.50% commercial team — on EVERY sale, regardless of salesperson.
--
--       Walk-in sales do not exist ("confirmamos. No existe, no existe un caso").
--
-- CHANGES:
--   1. Insert 'puerta_abierta' as management recipient (always_paid, 2.50%)
--   2. Deactivate 'walk_in' recipient
--   3. Update calculate_commissions() to remove walk-in logic
--   4. Backfill: recalculate all existing commissions
--
-- AFTER THIS MIGRATION:
--   • Every payment generates a 'puerta_abierta' commission row at 2.50%
--   • No 'walk_in' commission rows are generated
--   • Existing commission rows are recalculated with the new logic
-- ============================================================================


-- ============================================================================
-- PHASE 1: DATA — Add puerta_abierta, deactivate walk_in
-- ============================================================================

INSERT INTO commission_rates (recipient_id, recipient_name, recipient_type, rate, description, always_paid, active)
SELECT 'puerta_abierta', 'Puerta Abierta', 'management', 0.025,
       'Company utility share (2.50% of every sale)', true, true
WHERE NOT EXISTS (SELECT 1 FROM commission_rates WHERE recipient_id = 'puerta_abierta');

UPDATE commission_rates SET active = false WHERE recipient_id = 'walk_in';


-- ============================================================================
-- PHASE 2: FUNCTION — Remove walk-in logic, add puerta_abierta via management loop
-- ============================================================================

CREATE OR REPLACE FUNCTION public.calculate_commissions(p_payment_id uuid)
RETURNS void
LANGUAGE plpgsql
SET search_path TO 'public', 'extensions'
AS $function$
DECLARE
  v_payment record;
  v_sale record;
  v_phase int;
  v_phase_percentage numeric;
  v_rate record;
  v_redirect_to_ahorro boolean := false;
  v_cap_remaining numeric;
  v_commission_total numeric := 0;
  v_scale_factor numeric := 1;
BEGIN
  SELECT * INTO v_payment FROM payments WHERE id = p_payment_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Payment not found: %', p_payment_id;
  END IF;

  -- Reimbursements: no commissions; remove unpaid only
  IF v_payment.payment_type = 'reimbursement' THEN
    DELETE FROM commissions WHERE payment_id = p_payment_id AND paid = false;
    RETURN;
  END IF;

  SELECT * INTO v_sale FROM sales WHERE id = v_payment.sale_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Sale not found for payment: %', p_payment_id;
  END IF;

  -- Phase selection (phase 1 requires promise_signed_date)
  IF v_payment.payment_type = 'reservation' THEN
    IF v_sale.promise_signed_date IS NOT NULL THEN
      v_phase := 1;
    ELSE
      DELETE FROM commissions WHERE payment_id = p_payment_id;
      RETURN;
    END IF;
  ELSIF (v_sale.deed_signed_date IS NOT NULL OR v_sale.bank_disbursement_date IS NOT NULL)
        AND v_payment.payment_date >= COALESCE(v_sale.bank_disbursement_date, v_sale.deed_signed_date) THEN
    v_phase := 3;
  ELSE
    v_phase := 2;
  END IF;

  SELECT percentage INTO v_phase_percentage FROM commission_phases WHERE phase = v_phase;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Phase % configuration not found', v_phase;
  END IF;

  -- Clean existing commissions for this payment
  DELETE FROM commissions WHERE payment_id = p_payment_id;

  -- Ahorro por retiro: payment_date > latest contract end_date
  IF v_sale.sales_rep_id IS NOT NULL THEN
    v_redirect_to_ahorro := COALESCE(
      (SELECT MAX(sp.end_date) < v_payment.payment_date
       FROM salesperson_periods sp
       WHERE sp.salesperson_id = v_sale.sales_rep_id
         AND sp.end_date IS NOT NULL),
      false
    );
  END IF;

  -- 1) Management (always_paid) — includes puerta_abierta at 2.50%
  FOR v_rate IN
    SELECT * FROM commission_rates cr
    WHERE cr.recipient_type = 'management' AND cr.always_paid = true AND cr.active = true
  LOOP
    INSERT INTO commissions
      (payment_id, sale_id, recipient_id, recipient_name, phase, rate, base_amount, commission_amount, paid, status)
    VALUES
      (p_payment_id, v_sale.id, v_rate.recipient_id, v_rate.recipient_name, v_phase, v_rate.rate,
       v_payment.amount, v_payment.amount * v_rate.rate * v_phase_percentage, false, 'pending');
  END LOOP;

  -- 2) Sales rep or ahorro_por_retiro (only when a salesperson is assigned)
  IF v_sale.sales_rep_id IS NOT NULL THEN
    IF v_redirect_to_ahorro THEN
      -- Rep's contract ended: redirect their commission to ahorro_por_retiro
      SELECT * INTO v_rate FROM commission_rates cr
      WHERE cr.recipient_id = v_sale.sales_rep_id::text AND cr.recipient_type = 'sales_rep' AND cr.active = true;
      IF FOUND THEN
        INSERT INTO commissions
          (payment_id, sale_id, recipient_id, recipient_name, phase, rate, base_amount, commission_amount, paid, status)
        VALUES
          (p_payment_id, v_sale.id, 'ahorro_por_retiro', 'Ahorro por Retiro', v_phase, v_rate.rate,
           v_payment.amount, v_payment.amount * v_rate.rate * v_phase_percentage, false, 'pending');
      END IF;
    ELSE
      -- Active rep: pay their commission
      SELECT * INTO v_rate FROM commission_rates cr
      WHERE cr.recipient_id = v_sale.sales_rep_id::text AND cr.recipient_type = 'sales_rep' AND cr.active = true;
      IF FOUND THEN
        INSERT INTO commissions
          (payment_id, sale_id, recipient_id, recipient_name, phase, rate, base_amount, commission_amount, paid, status)
        VALUES
          (p_payment_id, v_sale.id, v_rate.recipient_id, v_rate.recipient_name, v_phase, v_rate.rate,
           v_payment.amount, v_payment.amount * v_rate.rate * v_phase_percentage, false, 'pending');
      END IF;
    END IF;
  END IF;
  -- When sales_rep_id IS NULL: no ejecutivo row inserted (walk-ins do not exist)

  -- 3) Referral (if applicable)
  IF v_sale.referral_applies = true THEN
    SELECT * INTO v_rate FROM commission_rates cr
    WHERE cr.recipient_id = 'referral' AND cr.recipient_type = 'special' AND cr.active = true;
    IF FOUND THEN
      INSERT INTO commissions
        (payment_id, sale_id, recipient_id, recipient_name, phase, rate, base_amount, commission_amount, paid, status)
      VALUES
        (p_payment_id, v_sale.id, 'referral',
         'Referral Bonus: ' || COALESCE(v_sale.referral_name, 'Unknown'),
         v_phase, v_rate.rate,
         v_payment.amount, v_payment.amount * v_rate.rate * v_phase_percentage, false, 'pending');
    END IF;
  END IF;

  -- 4) Special always_paid (ahorro, ahorro_comercial — excludes referral, walk_in, ahorro_por_retiro)
  FOR v_rate IN
    SELECT * FROM commission_rates cr
    WHERE cr.recipient_type = 'special' AND cr.always_paid = true AND cr.active = true
      AND cr.recipient_id NOT IN ('referral', 'walk_in', 'ahorro_por_retiro')
  LOOP
    INSERT INTO commissions
      (payment_id, sale_id, recipient_id, recipient_name, phase, rate, base_amount, commission_amount, paid, status)
    VALUES
      (p_payment_id, v_sale.id, v_rate.recipient_id, v_rate.recipient_name, v_phase, v_rate.rate,
       v_payment.amount, v_payment.amount * v_rate.rate * v_phase_percentage, false, 'pending');
  END LOOP;

  -- 60% cap: scale down phase 1+2 commissions if they exceed 3% of sale price
  IF v_phase IN (1, 2) THEN
    SELECT COALESCE(SUM(commission_amount), 0) INTO v_commission_total
    FROM commissions WHERE payment_id = p_payment_id;
    v_cap_remaining := get_commission_phase12_cap_remaining(v_sale.id, p_payment_id);
    IF v_commission_total > 0 AND v_cap_remaining < v_commission_total THEN
      v_scale_factor := v_cap_remaining / v_commission_total;
      UPDATE commissions
      SET commission_amount = commission_amount * v_scale_factor
      WHERE payment_id = p_payment_id;
    END IF;
  END IF;
END;
$function$;

COMMENT ON FUNCTION public.calculate_commissions(uuid) IS
  'Calculates commissions per payment. Puerta Abierta (2.50%) always paid on every sale. No walk-in concept. 60% cap on phase 1+2. Ahorro por retiro when payment_date > salesperson_periods.end_date.';


-- ============================================================================
-- PHASE 3: BACKFILL — Recalculate all commissions with new logic
-- ============================================================================
-- Every payment gets recalculated: existing walk_in rows removed,
-- puerta_abierta rows added. "Success. No rows returned" is expected.
-- ============================================================================

DO $$
DECLARE
    v_payment_id UUID;
    v_count INTEGER := 0;
    v_total INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_total FROM payments;
    RAISE NOTICE 'Backfill: recalculating commissions for % payments (adding puerta_abierta, removing walk_in)...', v_total;

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


-- ============================================================================
-- PHASE 4: VALIDATION — Verify puerta_abierta rows exist, walk_in rows gone
-- ============================================================================

-- Run these after the backfill to confirm:
-- SELECT recipient_id, COUNT(*) AS rows, ROUND(SUM(commission_amount)::numeric, 2) AS total
-- FROM commissions
-- GROUP BY recipient_id
-- ORDER BY total DESC;
--
-- Expected: 'puerta_abierta' appears with highest total; 'walk_in' absent.
