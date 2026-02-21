-- ============================================================================
-- Migration: Policy Periods, Portfolio Transition, Gerencia Assignments
-- ============================================================================
-- Implements CODEBASE_UPDATE_PLAN Phase A:
-- - Casa Elisa policy periods (if project exists)
-- - portfolio_transition referral type
-- - commission_gerencia_assignments for project+period gerencia
-- - ahorro_rate override for referral types (portfolio_transition)
-- Run after 013.
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 1. Add ahorro_rate to commission_referral_types (for portfolio_transition)
-- ----------------------------------------------------------------------------

ALTER TABLE public.commission_referral_types
  ADD COLUMN IF NOT EXISTS ahorro_rate numeric;

COMMENT ON COLUMN public.commission_referral_types.ahorro_rate IS
  'When set, overrides commission_role_rates ahorro for this referral type. E.g. portfolio_transition 0.85%.';

-- ----------------------------------------------------------------------------
-- 2. Add portfolio_transition referral type (business_rules §11)
-- ----------------------------------------------------------------------------
-- Ejecutivo 0.50%, Ahorro 0.85%, no referrer. When advisors take over portfolio.

INSERT INTO public.commission_referral_types (id, name, ejecutivo_rate, referrer_rate, referrer_phase_only, ahorro_rate, special_notes)
VALUES (
  'portfolio_transition',
  'Portfolio Transition',
  0.005,
  0,
  NULL,
  0.0085,
  'When advisors take over existing portfolio. Ejecutivo 0.50%, Ahorro 0.85%.'
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  ejecutivo_rate = EXCLUDED.ejecutivo_rate,
  referrer_rate = EXCLUDED.referrer_rate,
  referrer_phase_only = EXCLUDED.referrer_phase_only,
  ahorro_rate = EXCLUDED.ahorro_rate,
  special_notes = EXCLUDED.special_notes,
  updated_at = now();

-- ----------------------------------------------------------------------------
-- 3. Add Ronaldo Ogaldez to commission_rates (Boulevard gerencia Mar 2023–May 2025)
-- ----------------------------------------------------------------------------

INSERT INTO public.commission_rates (recipient_id, recipient_name, recipient_type, rate, description, always_paid, active)
SELECT 'ronaldo_ogaldez', 'Ronaldo Ogaldez', 'management', 0.005, 'Gerencia Comercial (Boulevard Mar 2023–May 2025)', false, true
WHERE NOT EXISTS (SELECT 1 FROM commission_rates WHERE recipient_id = 'ronaldo_ogaldez');

-- ----------------------------------------------------------------------------
-- 4. commission_gerencia_assignments (project + period → gerente)
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.commission_gerencia_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id),
  role text NOT NULL DEFAULT 'gerencia_comercial',
  recipient_id text NOT NULL,
  recipient_name text NOT NULL,
  start_date date NOT NULL,
  end_date date,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.commission_gerencia_assignments IS
  'Gerencia/Supervisor assignments by project and period. Overrides commission_role_recipients when payment_date falls in range.';

CREATE INDEX IF NOT EXISTS idx_commission_gerencia_assignments_project_dates
  ON public.commission_gerencia_assignments (project_id, start_date, end_date);

-- Boulevard: Ronaldo Ogaldez (Mar 2023 – May 2025), Alek Hernández (Jun 2025+)
INSERT INTO public.commission_gerencia_assignments (project_id, role, recipient_id, recipient_name, start_date, end_date, notes)
SELECT p.id, 'gerencia_comercial', 'ronaldo_ogaldez', 'Ronaldo Ogaldez', '2023-03-01'::date, '2025-05-31'::date,
  'Boulevard Period 1 — Gerencia before restructure'
FROM projects p WHERE p.name = 'boulevard'
  AND NOT EXISTS (SELECT 1 FROM commission_gerencia_assignments cga
    WHERE cga.project_id = p.id AND cga.recipient_id = 'ronaldo_ogaldez' AND cga.start_date = '2023-03-01'::date);

INSERT INTO public.commission_gerencia_assignments (project_id, role, recipient_id, recipient_name, start_date, end_date, notes)
SELECT p.id, 'gerencia_comercial', 'alek_hernandez', 'Alek Hernández', '2025-06-01'::date, NULL,
  'Boulevard Period 2 — Gerencia after restructure'
FROM projects p WHERE p.name = 'boulevard'
  AND NOT EXISTS (SELECT 1 FROM commission_gerencia_assignments cga
    WHERE cga.project_id = p.id AND cga.recipient_id = 'alek_hernandez' AND cga.start_date = '2025-06-01'::date);

-- ----------------------------------------------------------------------------
-- 5. Casa Elisa policy periods (if project exists)
-- ----------------------------------------------------------------------------

INSERT INTO public.projects (name, display_name)
SELECT 'casa_elisa', 'Casa Elisa'
WHERE NOT EXISTS (SELECT 1 FROM projects WHERE name = 'casa_elisa');

-- Casa Elisa Period 1 (Jun 2022 – Feb 2023): threshold 4, DG 0.50%, Gerencia/Ejec 1.00/1.25
INSERT INTO public.commission_policy_periods (project_id, start_date, end_date, escalation_threshold, notes)
SELECT id, '2022-06-01'::date, '2023-02-28'::date, 4, 'Casa Elisa Period 1 — DG 0.50%, no incentives'
FROM projects WHERE name = 'casa_elisa'
ON CONFLICT (project_id, start_date) DO NOTHING;

INSERT INTO public.commission_role_rates (policy_period_id, role, rate_below_threshold, rate_at_threshold)
SELECT p.id, r.role, r.rate_below, r.rate_at
FROM commission_policy_periods p
CROSS JOIN (VALUES
  ('direccion_general', 0.005, 0.005),
  ('gerencia_comercial', 0.01, 0.0125),
  ('supervisor_comercial', 0, 0),
  ('ejecutivo_venta', 0.01, 0.0125),
  ('ahorro', 0, 0)
) AS r(role, rate_below, rate_at)
WHERE p.notes = 'Casa Elisa Period 1 — DG 0.50%, no incentives'
  AND NOT EXISTS (SELECT 1 FROM commission_role_rates crr WHERE crr.policy_period_id = p.id AND crr.role = r.role);

-- Casa Elisa Period 2 (Mar 2023 – Dec 2024): threshold 3, standard rates
INSERT INTO public.commission_policy_periods (project_id, start_date, end_date, escalation_threshold, notes)
SELECT id, '2023-03-01'::date, '2024-12-31'::date, 3, 'Casa Elisa Period 2 — Standard'
FROM projects WHERE name = 'casa_elisa'
ON CONFLICT (project_id, start_date) DO NOTHING;

INSERT INTO public.commission_role_rates (policy_period_id, role, rate_below_threshold, rate_at_threshold)
SELECT p.id, r.role, r.rate_below, r.rate_at
FROM commission_policy_periods p
CROSS JOIN (VALUES
  ('direccion_general', 0.006, 0.006),
  ('gerencia_comercial', 0.005, 0.005),
  ('supervisor_comercial', 0, 0),
  ('ejecutivo_venta', 0.01, 0.0125),
  ('ahorro', 0.004, 0.0015)
) AS r(role, rate_below, rate_at)
WHERE p.notes = 'Casa Elisa Period 2 — Standard'
  AND NOT EXISTS (SELECT 1 FROM commission_role_rates crr WHERE crr.policy_period_id = p.id AND crr.role = r.role);

-- Casa Elisa Period 3 (Dec 2024 – Jan 2025): closing strategy — Ejec 2%/1.5% (simplified: use 1.25% for now; ranking requires manual override)
INSERT INTO public.commission_policy_periods (project_id, start_date, end_date, escalation_threshold, notes)
SELECT id, '2024-12-01'::date, '2025-01-31'::date, 1, 'Casa Elisa Period 3 — Closing strategy (Ejec 1.25% placeholder; 2%/1.5% requires ranking)'
FROM projects WHERE name = 'casa_elisa'
ON CONFLICT (project_id, start_date) DO NOTHING;

INSERT INTO public.commission_role_rates (policy_period_id, role, rate_below_threshold, rate_at_threshold)
SELECT p.id, r.role, r.rate_below, r.rate_at
FROM commission_policy_periods p
CROSS JOIN (VALUES
  ('direccion_general', 0.006, 0.006),
  ('gerencia_comercial', 0.005, 0.005),
  ('supervisor_comercial', 0, 0),
  ('ejecutivo_venta', 0.0125, 0.0125),
  ('ahorro', 0.0015, 0.0015)
) AS r(role, rate_below, rate_at)
WHERE p.notes LIKE 'Casa Elisa Period 3%'
  AND NOT EXISTS (SELECT 1 FROM commission_role_rates crr WHERE crr.policy_period_id = p.id AND crr.role = r.role);

-- ----------------------------------------------------------------------------
-- 6. Update calculate_commissions: use referral_type when set (not only referral_applies)
--    + ahorro_rate override for portfolio_transition
--    + commission_gerencia_assignments for gerencia recipient
-- ----------------------------------------------------------------------------

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

  -- Use referral type when set (portfolio_transition, etc.) or when referral_applies
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
    FOR v_rate IN SELECT * FROM commission_rates WHERE recipient_type = 'management' AND always_paid = true AND active = true
      AND NOT (v_skip_supervisor AND v_rate.recipient_id = 'antonio_rada')
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
    FOR v_rate IN SELECT * FROM commission_rates
      WHERE recipient_type = 'special' AND always_paid = true AND active = true
        AND recipient_id NOT IN ('referral', 'walk_in', 'ahorro_por_retiro')
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

COMMIT;
