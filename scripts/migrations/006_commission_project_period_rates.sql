-- ============================================================================
-- Migration: Project & Period-Aware Commission Rates (Phase 3)
-- ============================================================================
-- Resolves rates from commission_policy_periods + commission_role_rates
-- by project_id + payment_date. Falls back to commission_rates when no policy.
-- Uses rate_below_threshold for now (Phase 4 adds escalation).
-- ============================================================================

-- Role -> recipient mapping (who gets paid for each role)
CREATE TABLE IF NOT EXISTS public.commission_role_recipients (
  role text PRIMARY KEY,
  recipient_id text NOT NULL,
  recipient_name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.commission_role_recipients IS 'Maps commission roles to recipient_id for commission_rates lookup. Gerencia/Supervisor may vary by period (Phase 6).';

INSERT INTO public.commission_role_recipients (role, recipient_id, recipient_name) VALUES
  ('direccion_general', 'otto_herrera', 'Otto Herrera'),
  ('gerencia_comercial', 'alek_hernandez', 'Alek Hernández'),
  ('supervisor_comercial', 'antonio_rada', 'Supervisor / Antonio R.'),
  ('ahorro', 'ahorro', 'Ahorro')
ON CONFLICT (role) DO UPDATE SET
  recipient_id = EXCLUDED.recipient_id,
  recipient_name = EXCLUDED.recipient_name,
  updated_at = now();

-- Helper: resolve policy period for project + payment date
CREATE OR REPLACE FUNCTION public.get_commission_policy_period(
  p_project_id uuid,
  p_payment_date date
)
RETURNS uuid
LANGUAGE sql
STABLE
SET search_path TO 'public'
AS $$
  SELECT id FROM commission_policy_periods
  WHERE project_id = p_project_id
    AND start_date <= p_payment_date
    AND (end_date IS NULL OR end_date >= p_payment_date)
  ORDER BY start_date DESC
  LIMIT 1;
$$;

COMMENT ON FUNCTION public.get_commission_policy_period(uuid, date) IS
  'Returns policy_period_id for project + payment date. NULL if no matching period.';

-- Main commission calculation with project/period-aware rates
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
BEGIN
  SELECT * INTO v_payment FROM payments WHERE id = p_payment_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Payment not found: %', p_payment_id;
  END IF;

  IF v_payment.payment_type = 'reimbursement' THEN
    DELETE FROM commissions WHERE payment_id = p_payment_id AND paid = false;
    RETURN;
  END IF;

  SELECT * INTO v_sale FROM sales WHERE id = v_payment.sale_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Sale not found for payment: %', p_payment_id;
  END IF;

  -- Phase selection
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

  -- Resolve policy period (project + payment date)
  v_policy_period_id := get_commission_policy_period(v_sale.project_id, v_payment.payment_date);
  v_use_policy_rates := (v_policy_period_id IS NOT NULL);

  DELETE FROM commissions WHERE payment_id = p_payment_id;

  -- Walk-in detection
  v_is_walk_in := v_sale.sales_rep_id IS NULL
    OR EXISTS (
      SELECT 1 FROM sales_reps sr
      WHERE sr.id = v_sale.sales_rep_id
        AND sr.name IN ('Unknown', 'Puerta Abierta', 'Unknown / Directo')
    );

  -- Ahorro por retiro
  IF NOT v_is_walk_in AND v_sale.sales_rep_id IS NOT NULL THEN
    v_redirect_to_ahorro := COALESCE(
      (SELECT MAX(srp.end_date) < v_payment.payment_date
       FROM sales_rep_periods srp
       WHERE srp.rep_id = v_sale.sales_rep_id
         AND srp.end_date IS NOT NULL),
      false
    );
  END IF;

  -- 1) Management roles: Dirección, Gerencia, Supervisor (from policy or commission_rates)
  IF v_use_policy_rates THEN
    FOR v_role_rate IN
      SELECT crr.role, crr.rate_below_threshold AS rate
      FROM commission_role_rates crr
      WHERE crr.policy_period_id = v_policy_period_id
        AND crr.role IN ('direccion_general', 'gerencia_comercial', 'supervisor_comercial')
    LOOP
      IF v_role_rate.rate > 0 THEN
        SELECT * INTO v_recipient FROM commission_role_recipients WHERE role = v_role_rate.role;
        IF FOUND THEN
          INSERT INTO commissions
            (payment_id, sale_id, recipient_id, recipient_name, phase, rate, base_amount, commission_amount, paid, status, policy_period_id)
          VALUES
            (p_payment_id, v_sale.id, v_recipient.recipient_id, v_recipient.recipient_name, v_phase, v_role_rate.rate,
             v_payment.amount, v_payment.amount * v_role_rate.rate * v_phase_percentage, false, 'pending', v_policy_period_id);
        END IF;
      END IF;
    END LOOP;
  ELSE
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
  END IF;

  -- 2) Ejecutivo (sales rep) or walk-in or ahorro_por_retiro
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
    IF v_use_policy_rates THEN
      SELECT rate_below_threshold INTO v_ejecutivo_rate
      FROM commission_role_rates
      WHERE policy_period_id = v_policy_period_id AND role = 'ejecutivo_venta';
      IF FOUND AND v_ejecutivo_rate > 0 THEN
        INSERT INTO commissions
          (payment_id, sale_id, recipient_id, recipient_name, phase, rate, base_amount, commission_amount, paid, status, policy_period_id)
        VALUES
          (p_payment_id, v_sale.id, 'ahorro_por_retiro', 'Ahorro por Retiro', v_phase, v_ejecutivo_rate,
           v_payment.amount, v_payment.amount * v_ejecutivo_rate * v_phase_percentage, false, 'pending', v_policy_period_id);
      END IF;
    ELSE
      SELECT * INTO v_rate FROM commission_rates
      WHERE recipient_id = v_sale.sales_rep_id::text AND recipient_type = 'sales_rep' AND active = true;
      IF FOUND THEN
        INSERT INTO commissions
          (payment_id, sale_id, recipient_id, recipient_name, phase, rate, base_amount, commission_amount, paid, status)
        VALUES
          (p_payment_id, v_sale.id, 'ahorro_por_retiro', 'Ahorro por Retiro', v_phase, v_rate.rate,
           v_payment.amount, v_payment.amount * v_rate.rate * v_phase_percentage, false, 'pending');
      END IF;
    END IF;
  ELSE
    IF v_use_policy_rates THEN
      SELECT rate_below_threshold INTO v_ejecutivo_rate
      FROM commission_role_rates
      WHERE policy_period_id = v_policy_period_id AND role = 'ejecutivo_venta';
      IF FOUND AND v_ejecutivo_rate > 0 THEN
        INSERT INTO commissions
          (payment_id, sale_id, recipient_id, recipient_name, phase, rate, base_amount, commission_amount, paid, status, policy_period_id)
        VALUES
          (p_payment_id, v_sale.id, v_sale.sales_rep_id::text,
           (SELECT name FROM sales_reps WHERE id = v_sale.sales_rep_id),
           v_phase, v_ejecutivo_rate,
           v_payment.amount, v_payment.amount * v_ejecutivo_rate * v_phase_percentage, false, 'pending', v_policy_period_id);
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
  END IF;

  -- 3) Referral
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

  -- 4) Ahorro (special always_paid) — from policy or commission_rates
  IF v_use_policy_rates THEN
    SELECT crr.rate_below_threshold AS rate, r.recipient_id, r.recipient_name INTO v_ahorro_rec
    FROM commission_role_rates crr
    JOIN commission_role_recipients r ON r.role = 'ahorro'
    WHERE crr.policy_period_id = v_policy_period_id AND crr.role = 'ahorro';
    IF FOUND AND v_ahorro_rec.rate > 0 THEN
      INSERT INTO commissions
        (payment_id, sale_id, recipient_id, recipient_name, phase, rate, base_amount, commission_amount, paid, status, policy_period_id)
      VALUES
        (p_payment_id, v_sale.id, v_ahorro_rec.recipient_id, v_ahorro_rec.recipient_name, v_phase, v_ahorro_rec.rate,
         v_payment.amount, v_payment.amount * v_ahorro_rec.rate * v_phase_percentage, false, 'pending', v_policy_period_id);
    END IF;
  ELSE
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
  END IF;

  -- 60% cap
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
  'Calculates commissions. Uses project/period rates when policy exists; fallback to commission_rates. Phase 1 requires promise_signed_date. 60% cap. Ahorro por retiro.';
