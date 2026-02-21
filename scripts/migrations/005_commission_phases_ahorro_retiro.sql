-- ============================================================================
-- Migration: Commission Phases, 60% Cap, Ahorro por Retiro (Phases 1 & 2)
-- ============================================================================
-- Phase 1: Require promise_signed_date for phase 1; enforce 60% cap.
-- Phase 2: Use sales_rep_periods for ahorro por retiro (contract end).
-- Handles UUID sales_rep_id; walk-in = Unknown or Puerta Abierta reps.
-- ============================================================================

-- Helper: remaining phase 1+2 commission cap for a sale (before adding new payment's commissions)
CREATE OR REPLACE FUNCTION public.get_commission_phase12_cap_remaining(
  p_sale_id uuid,
  p_exclude_payment_id uuid DEFAULT NULL
)
RETURNS numeric
LANGUAGE sql
STABLE
SET search_path TO 'public'
AS $$
  WITH sale_info AS (
    SELECT COALESCE(price_without_tax, price_with_tax, 0) AS sale_price
    FROM sales WHERE id = p_sale_id
  ),
  current_phase12 AS (
    SELECT COALESCE(SUM(c.commission_amount), 0) AS total
    FROM commissions c
    JOIN payments p ON c.payment_id = p.id
    WHERE c.sale_id = p_sale_id
      AND (p_exclude_payment_id IS NULL OR p.id <> p_exclude_payment_id)
      AND c.phase IN (1, 2)
  )
  SELECT GREATEST(0, (SELECT sale_price FROM sale_info) * 0.03 - (SELECT total FROM current_phase12))
$$;

COMMENT ON FUNCTION public.get_commission_phase12_cap_remaining(uuid, uuid) IS
  'Returns remaining commission budget for phase 1+2 (60% of 5% = 3% of sale price). Used to cap new commissions.';

-- Main commission calculation (Phase 1 triggers, 60% cap, ahorro por retiro via sales_rep_periods)
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
  v_is_walk_in boolean := false;
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

  -- Phase selection (Minuta: phase 1 requires promise_signed_date)
  IF v_payment.payment_type = 'reservation' THEN
    IF v_sale.promise_signed_date IS NOT NULL THEN
      v_phase := 1;
    ELSE
      -- Phase 1 not eligible: no promise signed. Skip commission for this payment.
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

  -- 60% cap: for phase 1 or 2, compute scale factor if we would exceed
  IF v_phase IN (1, 2) THEN
    v_cap_remaining := get_commission_phase12_cap_remaining(v_sale.id, p_payment_id);
    -- We will compute total as we go; for now assume we need to check after building
    -- For simplicity: compute estimated total for this payment, then scale if needed
    -- Total = sum of (rate * phase_pct * amount) for each recipient. We'll scale at insert.
    NULL; -- Scale applied per-insert below
  END IF;

  -- Walk-in detection: sales_rep is Unknown or Puerta Abierta (UUID-based)
  v_is_walk_in := v_sale.sales_rep_id IS NULL
    OR EXISTS (
      SELECT 1 FROM sales_reps sr
      WHERE sr.id = v_sale.sales_rep_id
        AND sr.name IN ('Unknown', 'Puerta Abierta', 'Unknown / Directo')
    );

  -- Ahorro por retiro: payment_date > latest contract end_date (from sales_rep_periods)
  IF NOT v_is_walk_in AND v_sale.sales_rep_id IS NOT NULL THEN
    v_redirect_to_ahorro := COALESCE(
      (SELECT MAX(srp.end_date) < v_payment.payment_date
       FROM sales_rep_periods srp
       WHERE srp.rep_id = v_sale.sales_rep_id
         AND srp.end_date IS NOT NULL),
      false
    );
  END IF;

  -- 1) Management (always_paid)
  FOR v_rate IN
    SELECT * FROM commission_rates
    WHERE recipient_type = 'management' AND always_paid = true AND active = true
  LOOP
    INSERT INTO commissions
      (payment_id, sale_id, recipient_id, recipient_name, phase, rate, base_amount, commission_amount, paid, status)
    VALUES
      (p_payment_id, v_sale.id, v_rate.recipient_id, v_rate.recipient_name, v_phase, v_rate.rate,
       v_payment.amount, v_payment.amount * v_rate.rate * v_phase_percentage, false, 'pending');
  END LOOP;

  -- 2) Sales rep or walk-in or ahorro_por_retiro
  IF v_is_walk_in THEN
    SELECT * INTO v_rate FROM commission_rates
    WHERE recipient_id = 'walk_in' AND recipient_type = 'special' AND active = true;
    IF FOUND THEN
      INSERT INTO commissions
        (payment_id, sale_id, recipient_id, recipient_name, phase, rate, base_amount, commission_amount, paid, status)
      VALUES
        (p_payment_id, v_sale.id, v_rate.recipient_id, v_rate.recipient_name, v_phase, v_rate.rate,
         v_payment.amount, v_payment.amount * v_rate.rate * v_phase_percentage, false, 'pending');
    END IF;
  ELSIF v_redirect_to_ahorro THEN
    SELECT * INTO v_rate FROM commission_rates
    WHERE recipient_id = v_sale.sales_rep_id::text AND recipient_type = 'sales_rep' AND active = true;
    IF FOUND THEN
      INSERT INTO commissions
        (payment_id, sale_id, recipient_id, recipient_name, phase, rate, base_amount, commission_amount, paid, status)
      VALUES
        (p_payment_id, v_sale.id, 'ahorro_por_retiro', 'Ahorro por Retiro', v_phase, v_rate.rate,
         v_payment.amount, v_payment.amount * v_rate.rate * v_phase_percentage, false, 'pending');
    END IF;
  ELSE
    SELECT * INTO v_rate FROM commission_rates
    WHERE recipient_id = v_sale.sales_rep_id::text AND recipient_type = 'sales_rep' AND active = true;
    IF FOUND THEN
      INSERT INTO commissions
        (payment_id, sale_id, recipient_id, recipient_name, phase, rate, base_amount, commission_amount, paid, status)
      VALUES
        (p_payment_id, v_sale.id, v_rate.recipient_id, v_rate.recipient_name, v_phase, v_rate.rate,
         v_payment.amount, v_payment.amount * v_rate.rate * v_phase_percentage, false, 'pending');
    END IF;
  END IF;

  -- 3) Referral (if applicable)
  IF v_sale.referral_applies = true THEN
    SELECT * INTO v_rate FROM commission_rates
    WHERE recipient_id = 'referral' AND recipient_type = 'special' AND active = true;
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

  -- 4) Special always_paid (exclude referral, walk_in, ahorro_por_retiro)
  FOR v_rate IN
    SELECT * FROM commission_rates
    WHERE recipient_type = 'special' AND always_paid = true AND active = true
      AND recipient_id NOT IN ('referral', 'walk_in', 'ahorro_por_retiro')
  LOOP
    INSERT INTO commissions
      (payment_id, sale_id, recipient_id, recipient_name, phase, rate, base_amount, commission_amount, paid, status)
    VALUES
      (p_payment_id, v_sale.id, v_rate.recipient_id, v_rate.recipient_name, v_phase, v_rate.rate,
       v_payment.amount, v_payment.amount * v_rate.rate * v_phase_percentage, false, 'pending');
  END LOOP;

  -- 60% cap: scale down phase 1+2 commissions if we exceeded
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
  'Calculates commissions. Phase 1 requires promise_signed_date. 60% cap on phase 1+2. Ahorro por retiro when payment_date > sales_rep_periods.end_date.';
