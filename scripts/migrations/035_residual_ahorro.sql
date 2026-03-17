-- ============================================================================
-- Migration 035: Residual Ahorro Calculation (DIFF-05)
-- ============================================================================
-- Fixes DIFF-05: Ahorro was a fixed 0.35% rate. SSOT shows it's a residual:
--   AHORRO% = 5.00% − sum(all other recipient rates)
--
-- Approach:
--   • Deactivate ahorro from always_paid in commission_rates
--   • Track total committed rate through Sections 1a/1b/2/3
--   • Compute ahorro = 0.05 − total_committed (residual)
--   • Recalculate all commissions
--
-- Negative ahorro is expected when rates exceed 5% (e.g., EV=1.25% + GC +
-- Supervisor). The 60% cap handles dollar-level scaling for phase 1+2.
-- ============================================================================


-- ============================================================================
-- PHASE A: Deactivate ahorro from always_paid
-- ============================================================================
-- Row remains active for reference. Section 4's loop will now return zero rows
-- (ahorro was the only special always_paid recipient not in the exclusion list).

UPDATE commission_rates
SET always_paid = false, updated_at = now()
WHERE recipient_id = 'ahorro'
  AND recipient_type = 'special'
  AND always_paid = true;


-- ============================================================================
-- PHASE B: Update calculate_commissions() function
-- ============================================================================
-- Changes from migration 034:
--   • New variables: v_total_rate_committed, v_ahorro_rate
--   • Rate accumulation after each section's INSERT
--   • Section 4 replaced: fixed-rate loop → residual calculation
--   • All other sections unchanged

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

  -- 1a) Management — always_paid (puerta_abierta 2.50%, otto_herrera 0.60%, ahorro_comercial 0.20%)
  FOR v_rate IN
    SELECT * FROM commission_rates cr
    WHERE cr.recipient_type = 'management' AND cr.always_paid = true AND cr.active = true
  LOOP
    INSERT INTO commissions
      (payment_id, sale_id, recipient_id, recipient_name, phase, rate, base_amount, commission_amount, paid, status)
    VALUES
      (p_payment_id, v_sale.id, v_rate.recipient_id, v_rate.recipient_name, v_phase, v_rate.rate,
       v_payment.amount, v_payment.amount * v_rate.rate * v_phase_percentage, false, 'pending');
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
       v_payment.amount, v_payment.amount * v_assignment.rate * v_phase_percentage, false, 'pending');
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
         v_payment.amount, v_payment.amount * v_sale.ejecutivo_rate * v_phase_percentage, false, 'pending');
    ELSE
      -- Active rep: pay their ejecutivo commission
      INSERT INTO commissions
        (payment_id, sale_id, recipient_id, recipient_name, phase, rate, base_amount, commission_amount, paid, status)
      VALUES
        (p_payment_id, v_sale.id, v_sale.sales_rep_id::text, v_salesperson_name, v_phase, v_sale.ejecutivo_rate,
         v_payment.amount, v_payment.amount * v_sale.ejecutivo_rate * v_phase_percentage, false, 'pending');
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
         v_payment.amount, v_payment.amount * v_rate.rate * v_phase_percentage, false, 'pending');
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
       v_payment.amount, v_payment.amount * v_ahorro_rate * v_phase_percentage, false, 'pending');
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
  'Calculates commissions per payment. Section 1a: always_paid management (puerta_abierta, otto_herrera, ahorro_comercial). Section 1b: conditional GC/Supervisor from commission_gerencia_assignments (temporal, sale_date-based). Section 2: ejecutivo from sales.ejecutivo_rate. Section 3: referral. Section 4: ahorro (residual = 5% - sum of all other rates). Section 5: 60% cap on phase 1+2.';


-- ============================================================================
-- PHASE C: Recalculate all commissions
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
  LOOP
    PERFORM calculate_commissions(r.id);
    v_count := v_count + 1;
  END LOOP;
  RAISE NOTICE 'Recalculated commissions for % payments', v_count;
END $$;


-- ============================================================================
-- PHASE D: Validation queries (run manually after deployment)
-- ============================================================================

-- -- 1. Ahorro rates should vary per sale (not all 0.0035)
-- SELECT rate, COUNT(*) AS rows
-- FROM commissions
-- WHERE recipient_id = 'ahorro'
-- GROUP BY rate
-- ORDER BY rows DESC
-- LIMIT 20;
--
-- -- 2. Phase 3 payments: sum of all rates per payment should ≈ 0.05
-- SELECT c.payment_id, SUM(c.rate) AS total_rate
-- FROM commissions c
-- WHERE c.phase = 3
-- GROUP BY c.payment_id
-- HAVING ABS(SUM(c.rate) - 0.05) > 0.0001
-- LIMIT 10;
-- -- Expected: 0 rows (or very few edge cases)
--
-- -- 3. No negative ahorro rates in commissions table
-- SELECT COUNT(*) AS negative_ahorro
-- FROM commissions
-- WHERE recipient_id = 'ahorro' AND rate < 0;
-- -- Expected: 0
--
-- -- 4. Per-recipient commission row counts
-- SELECT c.recipient_id, c.recipient_name, COUNT(*) AS rows,
--        MIN(c.rate) AS min_rate, MAX(c.rate) AS max_rate, AVG(c.rate) AS avg_rate
-- FROM commissions c
-- WHERE c.recipient_id IN ('ahorro', 'ahorro_comercial', 'puerta_abierta')
-- GROUP BY c.recipient_id, c.recipient_name
-- ORDER BY c.recipient_id;
--
-- -- 5. Spot-check: sale with EV=1.00%, post-July (Alek+Sup paid), no referral
-- SELECT c.recipient_id, c.rate
-- FROM commissions c
-- JOIN sales s ON c.sale_id = s.id
-- WHERE s.ejecutivo_rate = 0.01
--   AND s.referral_applies = false
--   AND s.sale_date >= '2025-07-07'
--   AND c.phase = 3
-- GROUP BY c.payment_id, c.recipient_id, c.rate
-- HAVING c.recipient_id = 'ahorro'
-- LIMIT 5;
-- -- Expected: ahorro rate ≈ 0.0015 (0.15%)
--
-- -- 6. How many sales have ahorro skipped (negative residual)?
-- SELECT COUNT(DISTINCT s.id) AS sales_without_ahorro
-- FROM sales s
-- JOIN payments p ON p.sale_id = s.id
-- WHERE s.status = 'active'
--   AND NOT EXISTS (
--     SELECT 1 FROM commissions c
--     WHERE c.payment_id = p.id AND c.recipient_id = 'ahorro'
--   );
--
-- -- 7. Distribution of ahorro rates
-- SELECT
--   CASE
--     WHEN rate < 0.001 THEN '< 0.10%'
--     WHEN rate < 0.003 THEN '0.10% - 0.29%'
--     WHEN rate < 0.005 THEN '0.30% - 0.49%'
--     WHEN rate < 0.01 THEN '0.50% - 0.99%'
--     ELSE '≥ 1.00%'
--   END AS rate_bucket,
--   COUNT(*) AS rows
-- FROM commissions
-- WHERE recipient_id = 'ahorro'
-- GROUP BY 1
-- ORDER BY 1;
