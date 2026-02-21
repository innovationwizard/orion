-- ============================================================================
-- Migration: Fix calculate_commissions "v_rate is not assigned yet" (management branch)
-- ============================================================================
-- Bug: FOR loop WHERE clause referenced v_rate.recipient_id before the loop
-- variable was assigned. Use table alias (cr) instead. Same fix as 012.
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
  v_is_walk_in boolean := false;
  v_cap_remaining numeric;
  v_commission_total numeric := 0;
  v_scale_factor numeric := 1;
  v_policy_period_id uuid;
  v_role_rate record;
  v_recipient record;
  v_ejecutivo_rate numeric;
  v_ahorro_rec record;
  v_use_policy_rates boolean := false;
  v_escalation_threshold int;
  v_unit_count int;
  v_at_threshold boolean := false;
  v_referral_type record;
  v_is_referral_sale boolean := false;
  v_use_referral_type_rates boolean := false;
  v_pay_referrer boolean := false;
  v_skip_supervisor boolean := false;
  v_gerencia_recipient_id text := NULL;
  v_gerencia_recipient_name text := NULL;
BEGIN
  SELECT * INTO v_payment FROM payments WHERE id = p_payment_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Payment not found: %', p_payment_id; END IF;

  IF v_payment.payment_type = 'reimbursement' THEN
    DELETE FROM commissions WHERE payment_id = p_payment_id AND paid = false;
    RETURN;
  END IF;

  SELECT * INTO v_sale FROM sales WHERE id = v_payment.sale_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Sale not found for payment: %', p_payment_id; END IF;

  v_is_referral_sale := (v_sale.referral_applies = true);

  IF v_payment.payment_type = 'reservation' THEN
    IF v_sale.promise_signed_date IS NOT NULL THEN v_phase := 1;
    ELSE DELETE FROM commissions WHERE payment_id = p_payment_id; RETURN; END IF;
  ELSIF (v_sale.deed_signed_date IS NOT NULL OR v_sale.bank_disbursement_date IS NOT NULL)
        AND v_payment.payment_date >= COALESCE(v_sale.bank_disbursement_date, v_sale.deed_signed_date) THEN
    v_phase := 3;
  ELSE v_phase := 2;
  END IF;

  SELECT * INTO v_referral_type FROM commission_referral_types
  WHERE id = COALESCE(v_sale.referral_type, CASE WHEN v_is_referral_sale THEN 'portfolio_standard' ELSE NULL END);
  v_use_referral_type_rates := FOUND;
  IF NOT FOUND AND v_is_referral_sale THEN
    SELECT * INTO v_referral_type FROM commission_referral_types WHERE id = 'portfolio_standard';
    v_use_referral_type_rates := FOUND;
  END IF;
  IF v_is_referral_sale AND v_use_referral_type_rates AND v_referral_type.id IS NOT NULL THEN
    v_pay_referrer := (v_referral_type.referrer_phase_only IS NULL OR v_referral_type.referrer_phase_only = v_phase);
    v_skip_supervisor := (v_referral_type.id = 'portfolio_antonio_rada');
  END IF;

  SELECT percentage INTO v_phase_percentage FROM commission_phases WHERE phase = v_phase;
  IF NOT FOUND THEN RAISE EXCEPTION 'Phase % configuration not found', v_phase; END IF;

  v_policy_period_id := get_commission_policy_period(v_sale.project_id, v_payment.payment_date);
  v_use_policy_rates := (v_policy_period_id IS NOT NULL);

  IF v_use_policy_rates AND NOT v_sale.referral_applies AND v_sale.sales_rep_id IS NOT NULL
     AND NOT v_use_referral_type_rates THEN
    SELECT escalation_threshold INTO v_escalation_threshold
    FROM commission_policy_periods WHERE id = v_policy_period_id;
    v_unit_count := get_rep_unit_count_for_escalation(v_sale.sales_rep_id, v_sale.project_id, v_payment.payment_date, NULL);
    v_at_threshold := (v_escalation_threshold IS NOT NULL AND v_unit_count >= v_escalation_threshold);
  END IF;

  DELETE FROM commissions WHERE payment_id = p_payment_id;

  v_is_walk_in := v_sale.sales_rep_id IS NULL
    OR EXISTS (SELECT 1 FROM sales_reps sr WHERE sr.id = v_sale.sales_rep_id
      AND sr.name IN ('Unknown', 'Puerta Abierta', 'Unknown / Directo'));

  IF NOT v_is_walk_in AND v_sale.sales_rep_id IS NOT NULL THEN
    v_redirect_to_ahorro := COALESCE(
      (SELECT MAX(srp.end_date) < v_payment.payment_date FROM sales_rep_periods srp
       WHERE srp.rep_id = v_sale.sales_rep_id AND srp.end_date IS NOT NULL), false);
  END IF;

  -- 1) Management (use commission_gerencia_assignments when available)
  IF v_use_policy_rates THEN
    FOR v_role_rate IN
      SELECT crr.role, crr.rate_below_threshold AS rate
      FROM commission_role_rates crr
      WHERE crr.policy_period_id = v_policy_period_id
        AND crr.role IN ('direccion_general', 'gerencia_comercial', 'supervisor_comercial')
        AND NOT (v_skip_supervisor AND crr.role = 'supervisor_comercial')
    LOOP
      IF v_role_rate.rate > 0 THEN
        SELECT * INTO v_recipient FROM commission_role_recipients WHERE role = v_role_rate.role;
        v_gerencia_recipient_id := NULL;
        v_gerencia_recipient_name := NULL;
        IF v_role_rate.role = 'gerencia_comercial' THEN
          SELECT cga.recipient_id, cga.recipient_name INTO v_gerencia_recipient_id, v_gerencia_recipient_name
          FROM commission_gerencia_assignments cga
          WHERE cga.project_id = v_sale.project_id
            AND cga.role = 'gerencia_comercial'
            AND cga.start_date <= v_payment.payment_date
            AND (cga.end_date IS NULL OR cga.end_date >= v_payment.payment_date)
          ORDER BY cga.start_date DESC LIMIT 1;
          IF FOUND THEN
            v_recipient.recipient_id := v_gerencia_recipient_id;
            v_recipient.recipient_name := v_gerencia_recipient_name;
          END IF;
        END IF;
        IF v_recipient.recipient_id IS NOT NULL AND v_recipient.recipient_id <> '' THEN
          INSERT INTO commissions (payment_id, sale_id, recipient_id, recipient_name, phase, rate, base_amount, commission_amount, paid, status, policy_period_id)
          VALUES (p_payment_id, v_sale.id, v_recipient.recipient_id, v_recipient.recipient_name, v_phase, v_role_rate.rate,
            v_payment.amount, v_payment.amount * v_role_rate.rate * v_phase_percentage, false, 'pending', v_policy_period_id);
        END IF;
      END IF;
    END LOOP;
  ELSE
    -- FIX: Use cr (table alias) in WHERE, not v_rate (loop variable)
    FOR v_rate IN SELECT * FROM commission_rates cr
      WHERE cr.recipient_type = 'management' AND cr.always_paid = true AND cr.active = true
        AND NOT (v_skip_supervisor AND cr.recipient_id = 'antonio_rada')
    LOOP
      INSERT INTO commissions (payment_id, sale_id, recipient_id, recipient_name, phase, rate, base_amount, commission_amount, paid, status)
      VALUES (p_payment_id, v_sale.id, v_rate.recipient_id, v_rate.recipient_name, v_phase, v_rate.rate,
        v_payment.amount, v_payment.amount * v_rate.rate * v_phase_percentage, false, 'pending');
    END LOOP;
  END IF;

  -- 2) Ejecutivo (use referral type rates when v_use_referral_type_rates)
  IF v_is_walk_in THEN
    SELECT * INTO v_rate FROM commission_rates WHERE recipient_id = 'walk_in' AND recipient_type = 'special' AND active = true;
    IF FOUND THEN
      INSERT INTO commissions (payment_id, sale_id, recipient_id, recipient_name, phase, rate, base_amount, commission_amount, paid, status)
      VALUES (p_payment_id, v_sale.id, v_rate.recipient_id, v_rate.recipient_name, v_phase, v_rate.rate,
        v_payment.amount, v_payment.amount * v_rate.rate * v_phase_percentage, false, 'pending');
    END IF;
  ELSIF v_redirect_to_ahorro THEN
    IF v_use_policy_rates OR v_use_referral_type_rates THEN
      IF v_use_referral_type_rates THEN
        v_ejecutivo_rate := v_referral_type.ejecutivo_rate;
      ELSE
        SELECT CASE WHEN v_at_threshold THEN rate_at_threshold ELSE rate_below_threshold END INTO v_ejecutivo_rate
        FROM commission_role_rates WHERE policy_period_id = v_policy_period_id AND role = 'ejecutivo_venta';
      END IF;
      IF v_ejecutivo_rate > 0 THEN
        INSERT INTO commissions (payment_id, sale_id, recipient_id, recipient_name, phase, rate, base_amount, commission_amount, paid, status, policy_period_id)
        VALUES (p_payment_id, v_sale.id, 'ahorro_por_retiro', 'Ahorro por Retiro', v_phase, v_ejecutivo_rate,
          v_payment.amount, v_payment.amount * v_ejecutivo_rate * v_phase_percentage, false, 'pending', v_policy_period_id);
      END IF;
    ELSE
      SELECT * INTO v_rate FROM commission_rates WHERE recipient_id = v_sale.sales_rep_id::text AND recipient_type = 'sales_rep' AND active = true;
      IF FOUND THEN
        INSERT INTO commissions (payment_id, sale_id, recipient_id, recipient_name, phase, rate, base_amount, commission_amount, paid, status)
        VALUES (p_payment_id, v_sale.id, 'ahorro_por_retiro', 'Ahorro por Retiro', v_phase, v_rate.rate,
          v_payment.amount, v_payment.amount * v_rate.rate * v_phase_percentage, false, 'pending');
      END IF;
    END IF;
  ELSE
    IF v_use_policy_rates OR v_use_referral_type_rates THEN
      IF v_use_referral_type_rates THEN
        v_ejecutivo_rate := v_referral_type.ejecutivo_rate;
      ELSE
        SELECT CASE WHEN v_at_threshold THEN rate_at_threshold ELSE rate_below_threshold END INTO v_ejecutivo_rate
        FROM commission_role_rates WHERE policy_period_id = v_policy_period_id AND role = 'ejecutivo_venta';
      END IF;
      IF v_ejecutivo_rate IS NOT NULL AND v_ejecutivo_rate > 0 THEN
        INSERT INTO commissions (payment_id, sale_id, recipient_id, recipient_name, phase, rate, base_amount, commission_amount, paid, status, policy_period_id)
        VALUES (p_payment_id, v_sale.id, v_sale.sales_rep_id::text, (SELECT name FROM sales_reps WHERE id = v_sale.sales_rep_id),
          v_phase, v_ejecutivo_rate, v_payment.amount, v_payment.amount * v_ejecutivo_rate * v_phase_percentage, false, 'pending', v_policy_period_id);
      END IF;
    ELSE
      SELECT * INTO v_rate FROM commission_rates WHERE recipient_id = v_sale.sales_rep_id::text AND recipient_type = 'sales_rep' AND active = true;
      IF FOUND THEN
        INSERT INTO commissions (payment_id, sale_id, recipient_id, recipient_name, phase, rate, base_amount, commission_amount, paid, status)
        VALUES (p_payment_id, v_sale.id, v_rate.recipient_id, v_rate.recipient_name, v_phase, v_rate.rate,
          v_payment.amount, v_payment.amount * v_rate.rate * v_phase_percentage, false, 'pending');
      END IF;
    END IF;
  END IF;

  -- 3) Referral (only when v_pay_referrer)
  IF v_is_referral_sale AND v_pay_referrer AND v_referral_type.referrer_rate > 0 THEN
    INSERT INTO commissions (payment_id, sale_id, recipient_id, recipient_name, phase, rate, base_amount, commission_amount, paid, status, referral_type)
    VALUES (p_payment_id, v_sale.id,
      COALESCE(v_referral_type.referrer_recipient_id, 'referral'),
      COALESCE(v_referral_type.referrer_recipient_name, 'Referral Bonus: ' || COALESCE(v_sale.referral_name, 'Unknown')),
      v_phase, v_referral_type.referrer_rate,
      v_payment.amount, v_payment.amount * v_referral_type.referrer_rate * v_phase_percentage, false, 'pending', v_referral_type.id);
  END IF;

  -- 4) Ahorro (use ahorro_rate from referral type when set, else policy rates)
  IF v_use_referral_type_rates AND v_referral_type.ahorro_rate IS NOT NULL AND v_referral_type.ahorro_rate > 0 THEN
    SELECT recipient_id, recipient_name INTO v_ahorro_rec FROM commission_role_recipients WHERE role = 'ahorro';
    IF FOUND THEN
      INSERT INTO commissions (payment_id, sale_id, recipient_id, recipient_name, phase, rate, base_amount, commission_amount, paid, status, policy_period_id)
      VALUES (p_payment_id, v_sale.id, v_ahorro_rec.recipient_id, v_ahorro_rec.recipient_name, v_phase, v_referral_type.ahorro_rate,
        v_payment.amount, v_payment.amount * v_referral_type.ahorro_rate * v_phase_percentage, false, 'pending', v_policy_period_id);
    END IF;
  ELSIF v_use_policy_rates THEN
    SELECT CASE WHEN v_at_threshold THEN crr.rate_at_threshold ELSE crr.rate_below_threshold END AS rate,
           r.recipient_id, r.recipient_name INTO v_ahorro_rec
    FROM commission_role_rates crr
    JOIN commission_role_recipients r ON r.role = 'ahorro'
    WHERE crr.policy_period_id = v_policy_period_id AND crr.role = 'ahorro';
    IF FOUND AND v_ahorro_rec.rate > 0 THEN
      INSERT INTO commissions (payment_id, sale_id, recipient_id, recipient_name, phase, rate, base_amount, commission_amount, paid, status, policy_period_id)
      VALUES (p_payment_id, v_sale.id, v_ahorro_rec.recipient_id, v_ahorro_rec.recipient_name, v_phase, v_ahorro_rec.rate,
        v_payment.amount, v_payment.amount * v_ahorro_rec.rate * v_phase_percentage, false, 'pending', v_policy_period_id);
    END IF;
  ELSE
    FOR v_rate IN SELECT * FROM commission_rates cr
      WHERE cr.recipient_type = 'special' AND cr.always_paid = true AND cr.active = true
        AND cr.recipient_id NOT IN ('referral', 'walk_in', 'ahorro_por_retiro')
    LOOP
      INSERT INTO commissions (payment_id, sale_id, recipient_id, recipient_name, phase, rate, base_amount, commission_amount, paid, status)
      VALUES (p_payment_id, v_sale.id, v_rate.recipient_id, v_rate.recipient_name, v_phase, v_rate.rate,
        v_payment.amount, v_payment.amount * v_rate.rate * v_phase_percentage, false, 'pending');
    END LOOP;
  END IF;

  -- 60% cap
  IF v_phase IN (1, 2) THEN
    SELECT COALESCE(SUM(commission_amount), 0) INTO v_commission_total FROM commissions WHERE payment_id = p_payment_id;
    v_cap_remaining := get_commission_phase12_cap_remaining(v_sale.id, p_payment_id);
    IF v_commission_total > 0 AND v_cap_remaining < v_commission_total THEN
      v_scale_factor := v_cap_remaining / v_commission_total;
      UPDATE commissions SET commission_amount = commission_amount * v_scale_factor WHERE payment_id = p_payment_id;
    END IF;
  END IF;
END;
$function$;
