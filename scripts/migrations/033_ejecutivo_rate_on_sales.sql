-- ============================================================================
-- Migration 033: ejecutivo_rate on sales + CFO confirmation workflow
-- Date: 2026-03-16
--
-- WHAT: Fixes the structural error where ejecutivo (salesperson) commissions
--       are silently skipped because commission_rates has zero 'sales_rep'
--       entries. The rate is a property of the sale, not the salesperson.
--
--       Stores ejecutivo_rate directly on the sales table. Pre-populates
--       from the policy-period escalation model (1.00%/1.25%) with
--       confirmed = false. The master user reviews and confirms each rate
--       against the SSOT, unit by unit.
--
-- CHANGES:
--   1. Add ejecutivo_rate + confirmation columns to sales
--   2. Backfill ejecutivo_rate from policy-period escalation model
--   3. Update calculate_commissions() to use sales.ejecutivo_rate
--   4. Update v_reservations_pending view to show rate + confirmation status
--   5. Recalculate all commissions (ejecutivo rows will now appear)
--
-- AFTER THIS MIGRATION:
--   • Every payment with a salesperson generates an ejecutivo commission row
--   • Rates are pre-populated as unconfirmed (1.00% or 1.25% per escalation)
--   • Master user can confirm/adjust rates via UI, triggering recalculation
--   • Ahorro por retiro redirects use ejecutivo_rate as the redirected rate
--
-- DESIGN DOC: docs/ejecutivo-rate-solution.md
-- ROOT CAUSE: docs/sales-rep-commission-rates-investigation.md
-- ============================================================================


-- ============================================================================
-- PHASE 1: SCHEMA — Add ejecutivo_rate + confirmation columns to sales
-- ============================================================================

ALTER TABLE sales ADD COLUMN ejecutivo_rate numeric;
ALTER TABLE sales ADD COLUMN ejecutivo_rate_confirmed boolean NOT NULL DEFAULT false;
ALTER TABLE sales ADD COLUMN ejecutivo_rate_confirmed_at timestamptz;
ALTER TABLE sales ADD COLUMN ejecutivo_rate_confirmed_by uuid;


-- ============================================================================
-- PHASE 2: BACKFILL — Set ejecutivo_rate from policy-period escalation model
-- ============================================================================
-- Uses the same escalation logic as the original policy-period function
-- (migration 006 / get_commission_policy_period):
--   • Count salesperson's active sales in the project up to the sale date
--   • If count >= escalation_threshold: rate_at_threshold (1.25%)
--   • Else: rate_below_threshold (1.00%)
--   • Unknown/Puerta Abierta/Unknown Directo: NULL (no ejecutivo commission)
--
-- All backfilled rates are marked ejecutivo_rate_confirmed = false (default).
-- The CFO/master user will confirm each rate against the SSOT Excel.
-- ============================================================================

UPDATE sales s
SET ejecutivo_rate = CASE
  WHEN (
    SELECT COUNT(*) FROM sales s2
    WHERE s2.sales_rep_id = s.sales_rep_id
      AND s2.project_id = s.project_id
      AND s2.sale_date <= s.sale_date
      AND s2.status = 'active'
  ) >= COALESCE((
    SELECT cpp.escalation_threshold
    FROM commission_policy_periods cpp
    WHERE cpp.project_id = s.project_id
      AND s.sale_date >= cpp.start_date
      AND (cpp.end_date IS NULL OR s.sale_date <= cpp.end_date)
    LIMIT 1
  ), 5)
  THEN 0.0125  -- at/above threshold: 1.25%
  ELSE 0.01    -- below threshold: 1.00%
END
WHERE s.sales_rep_id IS NOT NULL
  AND s.sales_rep_id NOT IN (
    SELECT id FROM salespeople
    WHERE display_name IN ('Unknown', 'Puerta Abierta', 'Unknown / Directo')
  );


-- ============================================================================
-- PHASE 3: FUNCTION — Use sales.ejecutivo_rate instead of commission_rates
-- ============================================================================
-- Key changes from migration 032:
--   • Section 2 (ejecutivo): reads v_sale.ejecutivo_rate directly
--   • No more commission_rates lookup for sales_rep recipient_type
--   • Salesperson name fetched from salespeople table
--   • RAISE WARNING when sales_rep_id present but ejecutivo_rate is NULL
--   • Ahorro por retiro redirect uses v_sale.ejecutivo_rate
--   • All other sections (management, referral, special, 60% cap) unchanged
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
  v_salesperson_name text;
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
  'Calculates commissions per payment. Ejecutivo rate stored on sales.ejecutivo_rate (Stripe Ledger pattern). Puerta Abierta (2.50%) always paid. 60% cap on phase 1+2. Ahorro por retiro when payment_date > salesperson_periods.end_date.';


-- ============================================================================
-- PHASE 4: VIEW — Append ejecutivo_rate + confirmation status
-- ============================================================================
-- PostgreSQL CREATE OR REPLACE VIEW: new columns MUST be appended at END.
-- Join path: rv_units.unit_number + projects.id → units → sales (active)
-- ============================================================================

CREATE OR REPLACE VIEW v_reservations_pending AS
SELECT
  r.id AS reservation_id,
  r.status AS reservation_status,
  r.deposit_amount,
  r.deposit_date,
  r.deposit_bank,
  r.receipt_type,
  r.depositor_name,
  r.receipt_image_url,
  r.lead_source,
  r.notes,
  r.is_resale,
  r.created_at AS submitted_at,
  u.unit_number,
  u.unit_code,
  u.unit_type,
  u.bedrooms,
  u.price_list,
  f.number      AS floor_number,
  t.name        AS tower_name,
  t.is_default  AS tower_is_default,
  p.name        AS project_name,
  p.slug        AS project_slug,
  s.full_name   AS salesperson_name,
  s.id          AS salesperson_id,
  re.extracted_amount,
  re.extracted_date,
  re.extracted_bank,
  re.confidence AS ocr_confidence,
  array_agg(c.full_name ORDER BY rc.is_primary DESC, c.full_name) AS client_names,
  (array_agg(c.phone ORDER BY rc.is_primary DESC) FILTER (WHERE c.phone IS NOT NULL))[1] AS client_phone,
  r.dpi_image_url,
  -- 030: M:N buyer support
  count(rc.id) AS client_count,
  -- 033: ejecutivo rate + confirmation status
  sale.ejecutivo_rate,
  sale.ejecutivo_rate_confirmed
FROM reservations r
JOIN rv_units u        ON u.id = r.unit_id
JOIN floors f          ON f.id = u.floor_id
JOIN towers t          ON t.id = f.tower_id
JOIN projects p        ON p.id = t.project_id
JOIN salespeople s     ON s.id = r.salesperson_id
LEFT JOIN receipt_extractions re ON re.reservation_id = r.id
LEFT JOIN reservation_clients rc ON rc.reservation_id = r.id
LEFT JOIN rv_clients c ON c.id = rc.client_id
LEFT JOIN units u_analytics ON u_analytics.project_id = p.id
  AND u_analytics.unit_number = u.unit_number
LEFT JOIN sales sale ON sale.unit_id = u_analytics.id
  AND sale.status = 'active'
GROUP BY
  r.id, r.status, r.deposit_amount, r.deposit_date, r.deposit_bank,
  r.receipt_type, r.depositor_name, r.receipt_image_url,
  r.lead_source, r.notes, r.is_resale, r.created_at,
  u.unit_number, u.unit_code, u.unit_type, u.bedrooms, u.price_list,
  f.number, t.name, t.is_default, p.name, p.slug,
  s.full_name, s.id,
  re.extracted_amount, re.extracted_date, re.extracted_bank, re.confidence,
  r.dpi_image_url,
  sale.ejecutivo_rate, sale.ejecutivo_rate_confirmed
ORDER BY r.created_at DESC;


-- ============================================================================
-- PHASE 5: BACKFILL COMMISSIONS — Recalculate with ejecutivo rates
-- ============================================================================
-- Every payment will now generate ejecutivo commission rows where
-- sales.ejecutivo_rate IS NOT NULL. "Success. No rows returned" is expected.
-- ============================================================================

DO $$
DECLARE
    v_payment_id UUID;
    v_count INTEGER := 0;
    v_total INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_total FROM payments;
    RAISE NOTICE 'Backfill: recalculating commissions for % payments (adding ejecutivo rows)...', v_total;

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
-- PHASE 6: VALIDATION (run manually after deployment)
-- ============================================================================
--
-- 1. Every sale with a real salesperson should have an ejecutivo_rate:
-- SELECT COUNT(*) AS sales_missing_rate
-- FROM sales s
-- JOIN salespeople sp ON s.sales_rep_id = sp.id
-- WHERE sp.display_name NOT IN ('Unknown', 'Puerta Abierta', 'Unknown / Directo')
--   AND s.ejecutivo_rate IS NULL;
-- Expected: 0
--
-- 2. Ejecutivo commission rows should now exist per salesperson:
-- SELECT recipient_id, COUNT(*) AS rows,
--   ROUND(SUM(commission_amount)::numeric, 2) AS total
-- FROM commissions
-- WHERE recipient_id NOT IN (
--   'puerta_abierta', 'otto_herrera', 'alek_hernandez',
--   'ahorro_comercial', 'antonio_rada', 'ahorro', 'ahorro_por_retiro',
--   'referral', 'walk_in'
-- )
-- GROUP BY recipient_id
-- ORDER BY total DESC;
-- Expected: rows per salesperson UUID
--
-- 3. All rates should be unconfirmed after backfill:
-- SELECT COUNT(*) AS confirmed FROM sales WHERE ejecutivo_rate_confirmed = true;
-- Expected: 0
--
-- 4. Ejecutivo row count should approximate puerta_abierta count:
-- SELECT
--   COUNT(*) FILTER (WHERE recipient_id = 'puerta_abierta') AS pa_rows,
--   COUNT(*) FILTER (WHERE recipient_id NOT IN (
--     'puerta_abierta', 'otto_herrera', 'alek_hernandez',
--     'ahorro_comercial', 'antonio_rada', 'ahorro', 'ahorro_por_retiro',
--     'referral', 'walk_in'
--   )) AS ejecutivo_rows
-- FROM commissions;
-- Expected: ejecutivo_rows close to pa_rows (minus sales with NULL sales_rep_id)
