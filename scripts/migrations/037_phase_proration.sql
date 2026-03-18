-- ============================================================================
-- Migration 037: Phase Commission Pro-Rata (DIFF-09)
-- ============================================================================
-- Changes the commission base from payment_amount to sale_price, prorated
-- by the payment's share within its phase.
--
-- SSOT formula:
--   Phase 1: commission = sale_price × rate × 0.30  (one-time, reservation trigger)
--   Phase 2: commission = (cuota / enganche_neto) × sale_price × rate × 0.30
--   Phase 3: commission = (payment / phase3_denom) × sale_price × rate × 0.40
--
-- Where:
--   enganche_neto = down_payment_amount - reservation_amount
--   phase3_denom  = sale_price - down_payment_amount
--
-- Over all payments in each phase, totals = sale_price × rate × phase_pct.
-- Grand total across all phases = sale_price × rate.
--
-- No schema changes. Function update + full recalculation.
-- ============================================================================


-- ============================================================================
-- PHASE A: Update calculate_commissions() function
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
  v_assignment record;
  v_salesperson_name text;
  v_redirect_to_ahorro boolean := false;
  v_cap_remaining numeric;
  v_commission_total numeric := 0;
  v_scale_factor numeric := 1;
  v_total_rate_committed numeric := 0;
  v_ahorro_rate numeric;
  -- Phase proration (migration 037)
  v_sale_price numeric;
  v_base_amount numeric;
  v_reserva_amount numeric := 0;
  v_enganche_neto numeric;
  v_phase3_denom numeric;
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

  -- Compute effective base amount (SSOT: sale_price is the base, prorated per phase)
  v_sale_price := COALESCE(v_sale.price_without_tax, v_sale.price_with_tax, 0);

  IF v_phase = 1 THEN
    -- Phase 1: sale_price is the base (30% of total commission, one-time allocation)
    v_base_amount := v_sale_price;

  ELSIF v_phase = 2 THEN
    -- Phase 2: prorate cuota across enganche_neto
    -- SSOT: cuota/(enganche-reserva) × sale_price × rate × 0.30
    SELECT COALESCE(SUM(p.amount), 0) INTO v_reserva_amount
    FROM payments p WHERE p.sale_id = v_sale.id AND p.payment_type = 'reservation';

    v_enganche_neto := COALESCE(v_sale.down_payment_amount, 0) - v_reserva_amount;

    IF v_enganche_neto > 0 THEN
      v_base_amount := (v_payment.amount / v_enganche_neto) * v_sale_price;
    ELSE
      v_base_amount := v_payment.amount;
      RAISE WARNING 'Sale % enganche_neto <= 0 (down_payment=%, reserva=%) — falling back to payment base',
        v_sale.id, v_sale.down_payment_amount, v_reserva_amount;
    END IF;

  ELSIF v_phase = 3 THEN
    -- Phase 3: prorate payment across (sale_price - enganche)
    v_phase3_denom := v_sale_price - COALESCE(v_sale.down_payment_amount, 0);

    IF v_phase3_denom > 0 THEN
      v_base_amount := (v_payment.amount / v_phase3_denom) * v_sale_price;
    ELSE
      v_base_amount := v_payment.amount;
      RAISE WARNING 'Sale % phase3_denom <= 0 (price=%, down_payment=%) — falling back to payment base',
        v_sale.id, v_sale_price, v_sale.down_payment_amount;
    END IF;

  ELSE
    v_base_amount := v_payment.amount;
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

  -- 1a) Management — always_paid (puerta_abierta 2.50%, otto_herrera 0.60%, ahorro_comercial 0.20%)
  FOR v_rate IN
    SELECT * FROM commission_rates cr
    WHERE cr.recipient_type = 'management' AND cr.always_paid = true AND cr.active = true
  LOOP
    INSERT INTO commissions
      (payment_id, sale_id, recipient_id, recipient_name, phase, rate, base_amount, commission_amount, paid, status)
    VALUES
      (p_payment_id, v_sale.id, v_rate.recipient_id, v_rate.recipient_name, v_phase, v_rate.rate,
       v_base_amount, v_base_amount * v_rate.rate * v_phase_percentage, false, 'pending');
    v_total_rate_committed := v_total_rate_committed + v_rate.rate;
  END LOOP;

  -- 1b) Management — conditional GC + Supervisor (from commission_gerencia_assignments)
  -- Uses sale_date: the GC/Supervisor active when the sale was made gets the commission
  -- on ALL payments for that sale, even years later.
  FOR v_assignment IN
    SELECT cga.recipient_id, cga.recipient_name, cga.rate, cga.role
    FROM commission_gerencia_assignments cga
    WHERE cga.project_id = v_sale.project_id
      AND v_sale.sale_date >= cga.start_date
      AND (cga.end_date IS NULL OR v_sale.sale_date <= cga.end_date)
      AND cga.rate > 0
  LOOP
    INSERT INTO commissions
      (payment_id, sale_id, recipient_id, recipient_name, phase, rate, base_amount, commission_amount, paid, status)
    VALUES
      (p_payment_id, v_sale.id, v_assignment.recipient_id, v_assignment.recipient_name,
       v_phase, v_assignment.rate,
       v_base_amount, v_base_amount * v_assignment.rate * v_phase_percentage, false, 'pending');
    v_total_rate_committed := v_total_rate_committed + v_assignment.rate;
  END LOOP;

  -- 2) Ejecutivo: use sales.ejecutivo_rate (Stripe Ledger pattern — rate on the sale)
  IF v_sale.sales_rep_id IS NOT NULL AND v_sale.ejecutivo_rate IS NOT NULL THEN
    SELECT display_name INTO v_salesperson_name
    FROM salespeople WHERE id = v_sale.sales_rep_id;

    IF v_redirect_to_ahorro THEN
      -- Rep's contract ended: redirect their commission to ahorro_por_retiro
      INSERT INTO commissions
        (payment_id, sale_id, recipient_id, recipient_name, phase, rate, base_amount, commission_amount, paid, status)
      VALUES
        (p_payment_id, v_sale.id, 'ahorro_por_retiro', 'Ahorro por Retiro', v_phase, v_sale.ejecutivo_rate,
         v_base_amount, v_base_amount * v_sale.ejecutivo_rate * v_phase_percentage, false, 'pending');
    ELSE
      -- Active rep: pay their ejecutivo commission
      INSERT INTO commissions
        (payment_id, sale_id, recipient_id, recipient_name, phase, rate, base_amount, commission_amount, paid, status)
      VALUES
        (p_payment_id, v_sale.id, v_sale.sales_rep_id::text, v_salesperson_name, v_phase, v_sale.ejecutivo_rate,
         v_base_amount, v_base_amount * v_sale.ejecutivo_rate * v_phase_percentage, false, 'pending');
    END IF;
    v_total_rate_committed := v_total_rate_committed + v_sale.ejecutivo_rate;
  ELSIF v_sale.sales_rep_id IS NOT NULL AND v_sale.ejecutivo_rate IS NULL THEN
    RAISE WARNING 'Sale % has salesperson % but no ejecutivo_rate — skipping ejecutivo commission',
      v_sale.id, v_sale.sales_rep_id;
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
         v_base_amount, v_base_amount * v_rate.rate * v_phase_percentage, false, 'pending');
      v_total_rate_committed := v_total_rate_committed + v_rate.rate;
    END IF;
  END IF;

  -- 4) Ahorro — residual: absorbs remaining commission pool to reach 5%
  -- SSOT formula: AHORRO% = 5.00% − sum(all other rates)
  -- Negative ahorro is expected when rates exceed 5% (e.g., EV=1.25% + GC + Sup).
  -- The 60% cap (Section 5) handles dollar-level scaling for phase 1+2.
  v_ahorro_rate := 0.05 - v_total_rate_committed;
  IF v_ahorro_rate > 0 THEN
    INSERT INTO commissions
      (payment_id, sale_id, recipient_id, recipient_name, phase, rate, base_amount, commission_amount, paid, status)
    VALUES
      (p_payment_id, v_sale.id, 'ahorro', 'Ahorro', v_phase, v_ahorro_rate,
       v_base_amount, v_base_amount * v_ahorro_rate * v_phase_percentage, false, 'pending');
  ELSIF v_ahorro_rate < 0 THEN
    RAISE WARNING 'Sale % total rate committed %.4f exceeds 5%% — ahorro skipped (residual %.4f)',
      v_sale.id, v_total_rate_committed, v_ahorro_rate;
  END IF;

  -- 5) 60% cap: scale down phase 1+2 commissions if they exceed 3% of sale price
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
  'Calculates commissions per payment. Base amount = sale_price (prorated by payment share within phase). Section 1a: always_paid management. 1b: conditional GC/Supervisor. 2: ejecutivo. 3: referral. 4: ahorro (residual). 5: 60% cap on phase 1+2.';


-- ============================================================================
-- PHASE B: Recalculate all commissions (chronological order for cap accuracy)
-- ============================================================================

DO $$
DECLARE
  r record;
  v_count int := 0;
BEGIN
  -- Delete unpaid commissions from cancelled sales (stale data from previous recalculations)
  DELETE FROM commissions c
  USING sales s
  WHERE c.sale_id = s.id AND s.status = 'cancelled' AND c.paid = false;

  -- Recalculate all payments from active sales, ordered by payment_date for correct cap accumulation
  FOR r IN
    SELECT p.id
    FROM payments p
    JOIN sales s ON p.sale_id = s.id
    WHERE s.status = 'active'
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

-- -- 1. Commission totals by phase (compare with pre-migration snapshot)
-- SELECT phase, COUNT(*) AS rows, ROUND(SUM(commission_amount), 2) AS total
-- FROM commissions
-- GROUP BY phase ORDER BY phase;
--
-- -- 2. Per-sale phase 1+2 total should not exceed 3% of sale_price (60% cap)
-- SELECT c.sale_id, s.price_without_tax,
--        SUM(c.commission_amount) AS phase12_total,
--        s.price_without_tax * 0.03 AS cap,
--        CASE WHEN SUM(c.commission_amount) > s.price_without_tax * 0.03 + 0.01 THEN 'OVER CAP' ELSE 'OK' END AS status
-- FROM commissions c
-- JOIN sales s ON c.sale_id = s.id
-- WHERE c.phase IN (1, 2) AND s.status = 'active'
-- GROUP BY c.sale_id, s.price_without_tax
-- HAVING SUM(c.commission_amount) > s.price_without_tax * 0.03 + 0.01
-- ORDER BY SUM(c.commission_amount) DESC
-- LIMIT 10;
--
-- -- 3. Phase 1 base_amount should equal sale_price (not reservation amount)
-- SELECT c.base_amount, s.price_without_tax,
--        ROUND(c.base_amount - s.price_without_tax, 2) AS diff
-- FROM commissions c
-- JOIN sales s ON c.sale_id = s.id
-- WHERE c.phase = 1 AND c.recipient_id = 'puerta_abierta'
-- AND ABS(c.base_amount - s.price_without_tax) > 1
-- LIMIT 5;
-- -- Expected: 0 rows (base_amount = sale_price for all phase 1)
--
-- -- 4. Phase 2: verify proration factor per sale
-- -- For each sale, sum of (commission_amount / (rate × phase_pct)) across all phase 2 payments
-- -- should approximate sale_price
-- SELECT c.sale_id, s.price_without_tax,
--        ROUND(SUM(c.commission_amount / NULLIF(c.rate * 0.30, 0)), 2) AS implied_base_total,
--        ROUND(SUM(c.commission_amount / NULLIF(c.rate * 0.30, 0)) - s.price_without_tax, 2) AS diff
-- FROM commissions c
-- JOIN sales s ON c.sale_id = s.id
-- WHERE c.phase = 2 AND c.recipient_id = 'puerta_abierta' AND s.status = 'active'
-- GROUP BY c.sale_id, s.price_without_tax
-- HAVING ABS(SUM(c.commission_amount / NULLIF(c.rate * 0.30, 0)) - s.price_without_tax) > 1
-- LIMIT 5;
-- -- Expected: 0 rows (implied base total = sale_price within rounding)
--
-- -- 5. No negative commission amounts
-- SELECT COUNT(*) FROM commissions WHERE commission_amount < 0;
-- -- Expected: 0
--
-- -- 6. Total row count comparison
-- SELECT COUNT(*) AS total_rows FROM commissions;
