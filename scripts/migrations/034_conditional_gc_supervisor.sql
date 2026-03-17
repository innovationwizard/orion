-- ============================================================================
-- Migration 034: Conditional GC/Supervisor + Temporal Management Roles
-- ============================================================================
-- Fixes DIFF-01 (Ronaldo O. missing), DIFF-03 (Alek always_paid → conditional),
-- DIFF-04 (Antonio Rada Supervisor always_paid → conditional).
--
-- Approach:
--   • Add `rate` column to commission_gerencia_assignments
--   • Populate temporal assignments for all 4 projects
--   • Deactivate alek_hernandez + antonio_rada from always_paid management
--   • Update calculate_commissions() to query commission_gerencia_assignments
--     for GC + Supervisor based on sale_date (not payment_date)
--   • Recalculate all commissions
--
-- GC/Supervisor Timeline (user-provided):
--   Start → 2025-07-04: Ronaldo Ogaldez (GC 0.50%), no Supervisor
--   2025-07-07 → 2026-03-16: Alek Hernandez (GC 0.30%), Antonio Rada (SUPER 0.25%)
--   2026-03-16 → ongoing: Antonio Rada (GC 0.30%), Job Jiménez (SUPER 0.25%)
-- ============================================================================


-- ============================================================================
-- PHASE A: Schema — add rate column
-- ============================================================================

ALTER TABLE commission_gerencia_assignments
  ADD COLUMN IF NOT EXISTS rate numeric NOT NULL DEFAULT 0;

COMMENT ON COLUMN commission_gerencia_assignments.rate IS
  'Commission rate for this role assignment (decimal, e.g. 0.003 = 0.30%)';


-- ============================================================================
-- PHASE B: Data — fix existing rows + populate all assignments
-- ============================================================================

-- B.1) Ensure Job Jiménez exists in salespeople
INSERT INTO salespeople (full_name, display_name, is_active)
SELECT 'Job Alexander Jiménez Villatoro', 'Job Jiménez', true
WHERE NOT EXISTS (
  SELECT 1 FROM salespeople WHERE full_name = 'Job Alexander Jiménez Villatoro'
);

-- B.2) Fix existing Boulevard entries (migration 014 had wrong dates)

-- Ronaldo on Boulevard: end_date 2025-05-31 → 2025-07-04, set rate
UPDATE commission_gerencia_assignments
SET end_date = '2025-07-04'::date,
    rate = 0.005,
    notes = 'Boulevard GC Period 1 — before restructure',
    updated_at = now()
WHERE recipient_id = 'ronaldo_ogaldez'
  AND role = 'gerencia_comercial'
  AND project_id = (SELECT id FROM projects WHERE slug = 'boulevard-5')
  AND start_date = '2023-03-01'::date;

-- Alek on Boulevard: start_date 2025-06-01 → 2025-07-07, add end_date, set rate
UPDATE commission_gerencia_assignments
SET start_date = '2025-07-07'::date,
    end_date = '2026-03-16'::date,
    rate = 0.003,
    notes = 'Boulevard GC Period 2 — restructured',
    updated_at = now()
WHERE recipient_id = 'alek_hernandez'
  AND role = 'gerencia_comercial'
  AND project_id = (SELECT id FROM projects WHERE slug = 'boulevard-5')
  AND start_date = '2025-06-01'::date;

-- B.3) Boulevard 5 — new entries

-- Antonio Rada as Supervisor on B5
INSERT INTO commission_gerencia_assignments (project_id, role, recipient_id, recipient_name, rate, start_date, end_date, notes)
SELECT p.id, 'supervisor_comercial', 'antonio_rada', 'Supervisor / Antonio R.', 0.0025,
       '2025-07-07'::date, '2026-03-16'::date, 'B5 Supervisor Period 2'
FROM projects p WHERE p.slug = 'boulevard-5'
AND NOT EXISTS (
  SELECT 1 FROM commission_gerencia_assignments cga
  WHERE cga.project_id = p.id AND cga.recipient_id = 'antonio_rada'
    AND cga.role = 'supervisor_comercial' AND cga.start_date = '2025-07-07'::date
);

-- Antonio Rada as GC on B5 (from March 16, 2026)
INSERT INTO commission_gerencia_assignments (project_id, role, recipient_id, recipient_name, rate, start_date, end_date, notes)
SELECT p.id, 'gerencia_comercial', 'antonio_rada', 'Antonio Rada', 0.003,
       '2026-03-16'::date, NULL, 'B5 GC — promoted from Supervisor'
FROM projects p WHERE p.slug = 'boulevard-5'
AND NOT EXISTS (
  SELECT 1 FROM commission_gerencia_assignments cga
  WHERE cga.project_id = p.id AND cga.recipient_id = 'antonio_rada'
    AND cga.role = 'gerencia_comercial' AND cga.start_date = '2026-03-16'::date
);

-- Job Jiménez as Supervisor on B5 (from March 16, 2026)
INSERT INTO commission_gerencia_assignments (project_id, role, recipient_id, recipient_name, rate, start_date, end_date, notes)
SELECT p.id, 'supervisor_comercial', 'job_jimenez', 'Job Jiménez', 0.0025,
       '2026-03-16'::date, NULL, 'B5 Supervisor — replaces Antonio Rada'
FROM projects p WHERE p.slug = 'boulevard-5'
AND NOT EXISTS (
  SELECT 1 FROM commission_gerencia_assignments cga
  WHERE cga.project_id = p.id AND cga.recipient_id = 'job_jimenez'
    AND cga.role = 'supervisor_comercial' AND cga.start_date = '2026-03-16'::date
);

-- B.4) Benestare — all entries

-- Ronaldo as GC on BNT
INSERT INTO commission_gerencia_assignments (project_id, role, recipient_id, recipient_name, rate, start_date, end_date, notes)
SELECT p.id, 'gerencia_comercial', 'ronaldo_ogaldez', 'Ronaldo Ogaldez', 0.005,
       '2023-08-01'::date, '2025-07-04'::date, 'BNT GC Period 1'
FROM projects p WHERE p.slug = 'benestare'
AND NOT EXISTS (
  SELECT 1 FROM commission_gerencia_assignments cga
  WHERE cga.project_id = p.id AND cga.recipient_id = 'ronaldo_ogaldez'
    AND cga.role = 'gerencia_comercial'
);

-- Alek as GC on BNT
INSERT INTO commission_gerencia_assignments (project_id, role, recipient_id, recipient_name, rate, start_date, end_date, notes)
SELECT p.id, 'gerencia_comercial', 'alek_hernandez', 'Alek Hernández', 0.003,
       '2025-07-07'::date, '2026-03-16'::date, 'BNT GC Period 2'
FROM projects p WHERE p.slug = 'benestare'
AND NOT EXISTS (
  SELECT 1 FROM commission_gerencia_assignments cga
  WHERE cga.project_id = p.id AND cga.recipient_id = 'alek_hernandez'
    AND cga.role = 'gerencia_comercial' AND cga.start_date = '2025-07-07'::date
);

-- Antonio Rada as Supervisor on BNT
INSERT INTO commission_gerencia_assignments (project_id, role, recipient_id, recipient_name, rate, start_date, end_date, notes)
SELECT p.id, 'supervisor_comercial', 'antonio_rada', 'Supervisor / Antonio R.', 0.0025,
       '2025-07-07'::date, '2026-03-16'::date, 'BNT Supervisor Period 2'
FROM projects p WHERE p.slug = 'benestare'
AND NOT EXISTS (
  SELECT 1 FROM commission_gerencia_assignments cga
  WHERE cga.project_id = p.id AND cga.recipient_id = 'antonio_rada'
    AND cga.role = 'supervisor_comercial' AND cga.start_date = '2025-07-07'::date
);

-- Antonio Rada as GC on BNT (from March 16, 2026)
INSERT INTO commission_gerencia_assignments (project_id, role, recipient_id, recipient_name, rate, start_date, end_date, notes)
SELECT p.id, 'gerencia_comercial', 'antonio_rada', 'Antonio Rada', 0.003,
       '2026-03-16'::date, NULL, 'BNT GC — promoted from Supervisor'
FROM projects p WHERE p.slug = 'benestare'
AND NOT EXISTS (
  SELECT 1 FROM commission_gerencia_assignments cga
  WHERE cga.project_id = p.id AND cga.recipient_id = 'antonio_rada'
    AND cga.role = 'gerencia_comercial' AND cga.start_date = '2026-03-16'::date
);

-- Job Jiménez as Supervisor on BNT (from March 16, 2026)
INSERT INTO commission_gerencia_assignments (project_id, role, recipient_id, recipient_name, rate, start_date, end_date, notes)
SELECT p.id, 'supervisor_comercial', 'job_jimenez', 'Job Jiménez', 0.0025,
       '2026-03-16'::date, NULL, 'BNT Supervisor — replaces Antonio Rada'
FROM projects p WHERE p.slug = 'benestare'
AND NOT EXISTS (
  SELECT 1 FROM commission_gerencia_assignments cga
  WHERE cga.project_id = p.id AND cga.recipient_id = 'job_jimenez'
    AND cga.role = 'supervisor_comercial' AND cga.start_date = '2026-03-16'::date
);

-- B.5) Bosque Las Tapias — all entries

-- Ronaldo as GC on BLT (listed but never paid — all BLT sales are post-July 2025)
INSERT INTO commission_gerencia_assignments (project_id, role, recipient_id, recipient_name, rate, start_date, end_date, notes)
SELECT p.id, 'gerencia_comercial', 'ronaldo_ogaldez', 'Ronaldo Ogaldez', 0.005,
       '2024-10-01'::date, '2025-07-04'::date, 'BLT GC Period 1 — listed but all BLT sales post-July (zero rows expected)'
FROM projects p WHERE p.slug = 'bosque-las-tapias'
AND NOT EXISTS (
  SELECT 1 FROM commission_gerencia_assignments cga
  WHERE cga.project_id = p.id AND cga.recipient_id = 'ronaldo_ogaldez'
    AND cga.role = 'gerencia_comercial'
);

-- Alek as GC on BLT
INSERT INTO commission_gerencia_assignments (project_id, role, recipient_id, recipient_name, rate, start_date, end_date, notes)
SELECT p.id, 'gerencia_comercial', 'alek_hernandez', 'Alek Hernández', 0.003,
       '2025-07-07'::date, '2026-03-16'::date, 'BLT GC Period 2'
FROM projects p WHERE p.slug = 'bosque-las-tapias'
AND NOT EXISTS (
  SELECT 1 FROM commission_gerencia_assignments cga
  WHERE cga.project_id = p.id AND cga.recipient_id = 'alek_hernandez'
    AND cga.role = 'gerencia_comercial' AND cga.start_date = '2025-07-07'::date
);

-- Antonio Rada as Supervisor on BLT
INSERT INTO commission_gerencia_assignments (project_id, role, recipient_id, recipient_name, rate, start_date, end_date, notes)
SELECT p.id, 'supervisor_comercial', 'antonio_rada', 'Supervisor / Antonio R.', 0.0025,
       '2025-07-07'::date, '2026-03-16'::date, 'BLT Supervisor Period 2'
FROM projects p WHERE p.slug = 'bosque-las-tapias'
AND NOT EXISTS (
  SELECT 1 FROM commission_gerencia_assignments cga
  WHERE cga.project_id = p.id AND cga.recipient_id = 'antonio_rada'
    AND cga.role = 'supervisor_comercial' AND cga.start_date = '2025-07-07'::date
);

-- Antonio Rada as GC on BLT (from March 16, 2026)
INSERT INTO commission_gerencia_assignments (project_id, role, recipient_id, recipient_name, rate, start_date, end_date, notes)
SELECT p.id, 'gerencia_comercial', 'antonio_rada', 'Antonio Rada', 0.003,
       '2026-03-16'::date, NULL, 'BLT GC — promoted from Supervisor'
FROM projects p WHERE p.slug = 'bosque-las-tapias'
AND NOT EXISTS (
  SELECT 1 FROM commission_gerencia_assignments cga
  WHERE cga.project_id = p.id AND cga.recipient_id = 'antonio_rada'
    AND cga.role = 'gerencia_comercial' AND cga.start_date = '2026-03-16'::date
);

-- Job Jiménez as Supervisor on BLT (from March 16, 2026)
INSERT INTO commission_gerencia_assignments (project_id, role, recipient_id, recipient_name, rate, start_date, end_date, notes)
SELECT p.id, 'supervisor_comercial', 'job_jimenez', 'Job Jiménez', 0.0025,
       '2026-03-16'::date, NULL, 'BLT Supervisor — replaces Antonio Rada'
FROM projects p WHERE p.slug = 'bosque-las-tapias'
AND NOT EXISTS (
  SELECT 1 FROM commission_gerencia_assignments cga
  WHERE cga.project_id = p.id AND cga.recipient_id = 'job_jimenez'
    AND cga.role = 'supervisor_comercial' AND cga.start_date = '2026-03-16'::date
);

-- B.6) Casa Elisa — post-July entries only (pre-July GC unknown)

-- Alek as GC on CE
INSERT INTO commission_gerencia_assignments (project_id, role, recipient_id, recipient_name, rate, start_date, end_date, notes)
SELECT p.id, 'gerencia_comercial', 'alek_hernandez', 'Alek Hernández', 0.003,
       '2025-07-07'::date, '2026-03-16'::date, 'CE GC Period 2'
FROM projects p WHERE p.slug = 'casa-elisa'
AND NOT EXISTS (
  SELECT 1 FROM commission_gerencia_assignments cga
  WHERE cga.project_id = p.id AND cga.recipient_id = 'alek_hernandez'
    AND cga.role = 'gerencia_comercial' AND cga.start_date = '2025-07-07'::date
);

-- Antonio Rada as Supervisor on CE
INSERT INTO commission_gerencia_assignments (project_id, role, recipient_id, recipient_name, rate, start_date, end_date, notes)
SELECT p.id, 'supervisor_comercial', 'antonio_rada', 'Supervisor / Antonio R.', 0.0025,
       '2025-07-07'::date, '2026-03-16'::date, 'CE Supervisor Period 2'
FROM projects p WHERE p.slug = 'casa-elisa'
AND NOT EXISTS (
  SELECT 1 FROM commission_gerencia_assignments cga
  WHERE cga.project_id = p.id AND cga.recipient_id = 'antonio_rada'
    AND cga.role = 'supervisor_comercial' AND cga.start_date = '2025-07-07'::date
);

-- Antonio Rada as GC on CE (from March 16, 2026)
INSERT INTO commission_gerencia_assignments (project_id, role, recipient_id, recipient_name, rate, start_date, end_date, notes)
SELECT p.id, 'gerencia_comercial', 'antonio_rada', 'Antonio Rada', 0.003,
       '2026-03-16'::date, NULL, 'CE GC — promoted from Supervisor'
FROM projects p WHERE p.slug = 'casa-elisa'
AND NOT EXISTS (
  SELECT 1 FROM commission_gerencia_assignments cga
  WHERE cga.project_id = p.id AND cga.recipient_id = 'antonio_rada'
    AND cga.role = 'gerencia_comercial' AND cga.start_date = '2026-03-16'::date
);

-- Job Jiménez as Supervisor on CE (from March 16, 2026)
INSERT INTO commission_gerencia_assignments (project_id, role, recipient_id, recipient_name, rate, start_date, end_date, notes)
SELECT p.id, 'supervisor_comercial', 'job_jimenez', 'Job Jiménez', 0.0025,
       '2026-03-16'::date, NULL, 'CE Supervisor — replaces Antonio Rada'
FROM projects p WHERE p.slug = 'casa-elisa'
AND NOT EXISTS (
  SELECT 1 FROM commission_gerencia_assignments cga
  WHERE cga.project_id = p.id AND cga.recipient_id = 'job_jimenez'
    AND cga.role = 'supervisor_comercial' AND cga.start_date = '2026-03-16'::date
);


-- ============================================================================
-- PHASE C: Deactivate Alek + Antonio from always_paid management
-- ============================================================================
-- They remain in commission_rates for reference but the management loop skips them.
-- Their commissions now come from commission_gerencia_assignments.

UPDATE commission_rates
SET always_paid = false, updated_at = now()
WHERE recipient_id IN ('alek_hernandez', 'antonio_rada')
  AND recipient_type = 'management'
  AND always_paid = true;


-- ============================================================================
-- PHASE D: Update calculate_commissions() function
-- ============================================================================
-- Changes from migration 033:
--   • Section 1 comment updated
--   • New v_assignment variable declared
--   • NEW Section 1b: conditional management from commission_gerencia_assignments
--     using v_sale.sale_date (not v_payment.payment_date)
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
  'Calculates commissions per payment. Section 1a: always_paid management (puerta_abierta, otto_herrera, ahorro_comercial). Section 1b: conditional GC/Supervisor from commission_gerencia_assignments (temporal, sale_date-based). Section 2: ejecutivo from sales.ejecutivo_rate. 60% cap on phase 1+2.';


-- ============================================================================
-- PHASE E: Recalculate all commissions
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
-- PHASE F: Validation queries (run manually after deployment)
-- ============================================================================

-- -- 1. Ronaldo commission rows should exist for BNT/B5 sales before July 2025
-- SELECT COUNT(*) AS ronaldo_rows FROM commissions WHERE recipient_id = 'ronaldo_ogaldez';
--
-- -- 2. Alek should only appear on sales from July 7, 2025 onward
-- SELECT COUNT(*) AS alek_pre_july FROM commissions c
-- JOIN sales s ON c.sale_id = s.id
-- WHERE c.recipient_id = 'alek_hernandez' AND s.sale_date < '2025-07-07';
-- -- Expected: 0
--
-- -- 3. Antonio (supervisor) should only appear from July 7, 2025 onward
-- SELECT COUNT(*) AS antonio_pre_july FROM commissions c
-- JOIN sales s ON c.sale_id = s.id
-- WHERE c.recipient_id = 'antonio_rada' AND s.sale_date < '2025-07-07';
-- -- Expected: 0
--
-- -- 4. No Ronaldo on sales after July 4, 2025
-- SELECT COUNT(*) AS ronaldo_post_july FROM commissions c
-- JOIN sales s ON c.sale_id = s.id
-- WHERE c.recipient_id = 'ronaldo_ogaldez' AND s.sale_date > '2025-07-04';
-- -- Expected: 0
--
-- -- 5. Assignment coverage: how many rows per conditional recipient
-- SELECT c.recipient_id, c.recipient_name, COUNT(*) AS rows
-- FROM commissions c
-- WHERE c.recipient_id IN ('ronaldo_ogaldez', 'alek_hernandez', 'antonio_rada', 'job_jimenez')
-- GROUP BY c.recipient_id, c.recipient_name
-- ORDER BY c.recipient_id;
