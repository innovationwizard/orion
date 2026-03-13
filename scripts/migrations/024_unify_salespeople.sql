-- ============================================================================
-- Migration 024: Unify Salespeople — One Person, One Row, One UUID
-- Date: 2026-03-13
--
-- WHAT: Merges the legacy analytics `sales_reps` table (text PK) into the
--       reservation system's `salespeople` table (uuid PK). Eliminates the
--       redundant `salesperson_projects` junction table in favor of the
--       pre-existing `sales_rep_project_assignments` (renamed).
--
-- DATA CORRECTIONS:
--   1. Canonicalize 9 salespeople names with accents from sales_reps (canon)
--   2. Insert 5 missing salespeople (Daniel Veliz, Gloria Cante, Jose Franco,
--      Lilian G., Unknown)
--   3. Manual-match 2 abbreviated names: Francisco S. → Francisco Osuna,
--      Ricardo O. → Ricardo Oliva
--   4. Merge 2 duplicate pairs: Andrea Gonzalez/González → one entry,
--      Rony Ramirez/Ramírez → one entry
--
-- AFTER THIS MIGRATION:
--   • `salespeople`                      — SINGLE canonical identity table
--   • `salesperson_project_assignments`  — renamed from sales_rep_project_assignments
--   • `salesperson_periods`              — renamed from sales_rep_periods
--   • `sales_reps`                       — DROPPED
--   • `salesperson_projects`             — DROPPED
--
-- RE-KEYED TABLES:
--   sales.sales_rep_id                (text → uuid, FK → salespeople)
--   salesperson_periods.salesperson_id (uuid re-mapped)
--   salesperson_project_assignments.salesperson_id (uuid re-mapped)
--   commission_rates.recipient_id     (text, sales_rep entries only)
--   commissions.recipient_id          (text, matching old IDs)
--
-- PK STANDARDIZATION:
--   salesperson_project_assignments.id (bigint → uuid)
--   salesperson_periods.id             (bigint → uuid)
--
-- SAFETY: Entire migration runs inside a transaction. Validation aborts
--         with RAISE EXCEPTION if ANY sales_reps entry cannot be mapped.
-- ============================================================================

BEGIN;

-- Required for accent-insensitive name matching
CREATE EXTENSION IF NOT EXISTS unaccent;


-- ============================================================================
-- PHASE 0: DATA CORRECTION — Prepare salespeople for mapping
-- ============================================================================

-- 0a. Canonicalize full_name with accents (sales_reps names are canonical)
--     Also fix display_name where first name has accent.
UPDATE salespeople SET full_name = 'Abigail García'
  WHERE full_name = 'Abigail Garcia';

UPDATE salespeople SET full_name = 'Alejandra Calderón'
  WHERE full_name = 'Alejandra Calderon';

UPDATE salespeople SET full_name = 'Anahí Cisneros', display_name = 'Anahí'
  WHERE full_name = 'Anahi Cisneros';

UPDATE salespeople SET full_name = 'Brenda Búcaro'
  WHERE full_name = 'Brenda Bucaro';

UPDATE salespeople SET full_name = 'Efrén Sánchez', display_name = 'Efrén'
  WHERE full_name = 'Efren Sanchez';

UPDATE salespeople SET full_name = 'José Gutierrez', display_name = 'José'
  WHERE full_name = 'Jose Gutierrez';

UPDATE salespeople SET full_name = 'Noemí Menendez', display_name = 'Noemí'
  WHERE full_name = 'Noemi Menendez';

UPDATE salespeople SET full_name = 'Pablo Marroquín'
  WHERE full_name = 'Pablo Marroquin';

UPDATE salespeople SET full_name = 'Paula Hernández'
  WHERE full_name = 'Paula Hernandez';

-- 0b. Insert salespeople that exist only in sales_reps (no match in salespeople)
INSERT INTO salespeople (full_name, display_name) VALUES
  ('Daniel Veliz', 'Daniel V.'),
  ('Gloria Cante', 'Gloria'),
  ('Jose Franco', 'Jose F.'),
  ('Lilian G.', 'Lilian'),
  ('Unknown', 'Unknown')
ON CONFLICT (full_name) DO NOTHING;


-- ============================================================================
-- PHASE 1: BUILD MAPPING TABLE (sales_reps.id → salespeople.id)
-- ============================================================================

-- Use text for old_id to avoid cross-type comparison issues.
-- sales_reps.id, sales.sales_rep_id, and rep_id columns may be text or uuid —
-- casting everything to text ensures consistent comparisons.
CREATE TEMP TABLE _id_map (
  old_id text NOT NULL,
  new_id uuid NOT NULL
);

-- 1a. Auto-match via unaccent (handles exact + accent-variant names)
--     Covers 31 of 33 sales_reps entries including duplicates:
--       Andrea Gonzalez + Andrea González → same salespeople row
--       Rony Ramirez + Rony Ramírez → same salespeople row
INSERT INTO _id_map (old_id, new_id)
SELECT sr.id::text, sp.id
FROM sales_reps sr
JOIN salespeople sp
  ON unaccent(lower(trim(sr.name)))
   = unaccent(lower(trim(sp.full_name)));

-- 1b. Manual matches for abbreviated names (2 entries)
--     Francisco S. → Francisco Osuna (same person, abbreviated surname)
INSERT INTO _id_map (old_id, new_id)
SELECT sr.id::text, sp.id
FROM sales_reps sr
CROSS JOIN salespeople sp
WHERE sr.name = 'Francisco S.'
  AND sp.full_name = 'Francisco Osuna'
  AND NOT EXISTS (SELECT 1 FROM _id_map WHERE old_id = sr.id::text);

--     Ricardo O. → Ricardo Oliva (O. = Oliva abbreviation)
INSERT INTO _id_map (old_id, new_id)
SELECT sr.id::text, sp.id
FROM sales_reps sr
CROSS JOIN salespeople sp
WHERE sr.name = 'Ricardo O.'
  AND sp.full_name = 'Ricardo Oliva'
  AND NOT EXISTS (SELECT 1 FROM _id_map WHERE old_id = sr.id::text);


-- ============================================================================
-- PHASE 1c: VALIDATION
-- ============================================================================

DO $$
DECLARE
  v_unmapped text[];
  v_orphan_sales int;
  v_orphan_periods int;
  v_orphan_assignments int;
BEGIN
  -- Every sales_reps entry must have a mapping
  SELECT array_agg(sr.name ORDER BY sr.name)
  INTO v_unmapped
  FROM sales_reps sr
  WHERE NOT EXISTS (SELECT 1 FROM _id_map m WHERE m.old_id = sr.id::text);

  IF v_unmapped IS NOT NULL AND array_length(v_unmapped, 1) > 0 THEN
    RAISE EXCEPTION
      'ABORT: % sales_reps entries have no mapping: %',
      array_length(v_unmapped, 1), v_unmapped;
  END IF;

  -- Every non-NULL sales.sales_rep_id must exist in mapping
  SELECT count(DISTINCT s.sales_rep_id)
  INTO v_orphan_sales
  FROM sales s
  WHERE s.sales_rep_id IS NOT NULL
    AND NOT EXISTS (SELECT 1 FROM _id_map m WHERE m.old_id = s.sales_rep_id::text);

  IF v_orphan_sales > 0 THEN
    RAISE EXCEPTION
      'ABORT: % sales rows have sales_rep_id not in mapping', v_orphan_sales;
  END IF;

  -- Every sales_rep_periods.rep_id must exist in mapping
  SELECT count(DISTINCT srp.rep_id)
  INTO v_orphan_periods
  FROM sales_rep_periods srp
  WHERE NOT EXISTS (SELECT 1 FROM _id_map m WHERE m.old_id = srp.rep_id::text);

  IF v_orphan_periods > 0 THEN
    RAISE EXCEPTION
      'ABORT: % sales_rep_periods rows have unmapped rep_id', v_orphan_periods;
  END IF;

  -- Every sales_rep_project_assignments.rep_id must exist in mapping
  SELECT count(DISTINCT srpa.rep_id)
  INTO v_orphan_assignments
  FROM sales_rep_project_assignments srpa
  WHERE NOT EXISTS (SELECT 1 FROM _id_map m WHERE m.old_id = srpa.rep_id::text);

  IF v_orphan_assignments > 0 THEN
    RAISE EXCEPTION
      'ABORT: % assignment rows have unmapped rep_id', v_orphan_assignments;
  END IF;

  RAISE NOTICE 'Validation passed: all 33 sales_reps mapped, all FKs valid';
END $$;


-- ============================================================================
-- PHASE 2: RE-KEY sales.sales_rep_id (text → uuid)
-- ============================================================================

-- Drop existing FK to sales_reps (auto-generated name from schema)
ALTER TABLE sales DROP CONSTRAINT IF EXISTS fk_sales_sales_rep;
ALTER TABLE sales DROP CONSTRAINT IF EXISTS sales_sales_rep_id_fkey;

-- Disable triggers to prevent calculate_commissions from firing during re-key
-- (commission_rates hasn't been re-keyed yet, so the trigger would fail)
ALTER TABLE sales DISABLE TRIGGER USER;

-- Map old UUIDs to new UUIDs (sales_rep_id is already uuid type)
UPDATE sales s
SET sales_rep_id = m.new_id
FROM _id_map m
WHERE s.sales_rep_id::text = m.old_id;

-- Re-enable triggers
ALTER TABLE sales ENABLE TRIGGER USER;

-- Add FK to salespeople
ALTER TABLE sales
  ADD CONSTRAINT fk_sales_salesperson
  FOREIGN KEY (sales_rep_id) REFERENCES salespeople(id);


-- ============================================================================
-- PHASE 3: RE-KEY sales_rep_periods.rep_id (uuid → uuid)
-- ============================================================================

-- Drop FK if it exists
ALTER TABLE sales_rep_periods
  DROP CONSTRAINT IF EXISTS sales_rep_periods_rep_id_fkey;

-- Map old IDs to new UUIDs
UPDATE sales_rep_periods srp
SET rep_id = m.new_id
FROM _id_map m
WHERE srp.rep_id::text = m.old_id;

-- Add FK to salespeople
ALTER TABLE sales_rep_periods
  ADD CONSTRAINT fk_sp_periods_salesperson
  FOREIGN KEY (rep_id) REFERENCES salespeople(id);


-- ============================================================================
-- PHASE 4: RE-KEY sales_rep_project_assignments.rep_id (uuid → uuid)
-- ============================================================================

-- Drop ALL constraints that reference sales_reps or block merge of duplicates
ALTER TABLE sales_rep_project_assignments
  DROP CONSTRAINT IF EXISTS sales_rep_project_assignments_rep_id_fkey;
ALTER TABLE sales_rep_project_assignments
  DROP CONSTRAINT IF EXISTS srpa_rep_id_fkey;
ALTER TABLE sales_rep_project_assignments
  DROP CONSTRAINT IF EXISTS srpa_project_id_fkey;
ALTER TABLE sales_rep_project_assignments
  DROP CONSTRAINT IF EXISTS srpa_rep_project_uniq;
DROP INDEX IF EXISTS srpa_rep_project_dates_uniq;

-- Map old IDs to new UUIDs
UPDATE sales_rep_project_assignments srpa
SET rep_id = m.new_id
FROM _id_map m
WHERE srpa.rep_id::text = m.old_id;

-- Delete duplicate assignments created by merging duplicate sales_reps
-- Keep the row with the lowest ctid (arbitrary but deterministic)
DELETE FROM sales_rep_project_assignments a
USING sales_rep_project_assignments b
WHERE a.rep_id = b.rep_id
  AND a.project_id = b.project_id
  AND a.start_date = b.start_date
  AND COALESCE(a.end_date, '9999-12-31') = COALESCE(b.end_date, '9999-12-31')
  AND a.ctid > b.ctid;

-- Re-create unique index after dedup
CREATE UNIQUE INDEX srpa_rep_project_dates_uniq
  ON sales_rep_project_assignments (rep_id, project_id, start_date, end_date);

-- Add FK to salespeople
ALTER TABLE sales_rep_project_assignments
  ADD CONSTRAINT fk_spa_salesperson
  FOREIGN KEY (rep_id) REFERENCES salespeople(id);

-- Add FK for project_id if missing
ALTER TABLE sales_rep_project_assignments
  DROP CONSTRAINT IF EXISTS sales_rep_project_assignments_project_id_fkey;
ALTER TABLE sales_rep_project_assignments
  ADD CONSTRAINT fk_spa_project
  FOREIGN KEY (project_id) REFERENCES projects(id);


-- ============================================================================
-- PHASE 5: RE-KEY commission_rates & commissions
-- ============================================================================

-- commission_rates.recipient_id: text column, update sales_rep entries
UPDATE commission_rates cr
SET recipient_id = m.new_id::text
FROM _id_map m
WHERE cr.recipient_type = 'sales_rep'
  AND cr.recipient_id = m.old_id::text;

-- commissions.recipient_id: text column, update entries matching old IDs
UPDATE commissions c
SET recipient_id = m.new_id::text
FROM _id_map m
WHERE c.recipient_id = m.old_id::text;


-- ============================================================================
-- PHASE 6: RENAME TABLES AND COLUMNS
-- ============================================================================

-- sales_rep_periods → salesperson_periods
ALTER TABLE sales_rep_periods RENAME TO salesperson_periods;
ALTER TABLE salesperson_periods RENAME COLUMN rep_id TO salesperson_id;

-- Rename constraint for clarity
ALTER TABLE salesperson_periods
  RENAME CONSTRAINT fk_sp_periods_salesperson TO fk_salesperson_periods_salesperson;

-- sales_rep_project_assignments → salesperson_project_assignments
ALTER TABLE sales_rep_project_assignments RENAME TO salesperson_project_assignments;
ALTER TABLE salesperson_project_assignments RENAME COLUMN rep_id TO salesperson_id;

-- Rename constraints for clarity
ALTER TABLE salesperson_project_assignments
  RENAME CONSTRAINT fk_spa_salesperson TO fk_salesperson_project_assignments_salesperson;
ALTER TABLE salesperson_project_assignments
  RENAME CONSTRAINT fk_spa_project TO fk_salesperson_project_assignments_project;


-- ============================================================================
-- PHASE 7: STANDARDIZE PKs TO UUID (bigint → uuid)
-- ============================================================================

-- 7a. salesperson_periods
ALTER TABLE salesperson_periods
  DROP CONSTRAINT IF EXISTS sales_rep_periods_pkey;

ALTER TABLE salesperson_periods
  ADD COLUMN new_id uuid NOT NULL DEFAULT gen_random_uuid();

UPDATE salesperson_periods SET new_id = gen_random_uuid();

ALTER TABLE salesperson_periods DROP COLUMN id;
ALTER TABLE salesperson_periods RENAME COLUMN new_id TO id;
ALTER TABLE salesperson_periods ADD PRIMARY KEY (id);

DROP SEQUENCE IF EXISTS sales_rep_periods_id_seq;

-- 7b. salesperson_project_assignments
ALTER TABLE salesperson_project_assignments
  DROP CONSTRAINT IF EXISTS sales_rep_project_assignments_pkey;

ALTER TABLE salesperson_project_assignments
  ADD COLUMN new_id uuid NOT NULL DEFAULT gen_random_uuid();

UPDATE salesperson_project_assignments SET new_id = gen_random_uuid();

ALTER TABLE salesperson_project_assignments DROP COLUMN id;
ALTER TABLE salesperson_project_assignments RENAME COLUMN new_id TO id;
ALTER TABLE salesperson_project_assignments ADD PRIMARY KEY (id);

DROP SEQUENCE IF EXISTS sales_rep_project_assignments_id_seq;


-- ============================================================================
-- PHASE 8: UPDATE calculate_commissions FUNCTION
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
    NULL;
  END IF;

  -- Walk-in detection: query salespeople (unified table)
  v_is_walk_in := v_sale.sales_rep_id IS NULL
    OR EXISTS (
      SELECT 1 FROM salespeople sp
      WHERE sp.id = v_sale.sales_rep_id
        AND sp.full_name IN ('Unknown', 'Puerta Abierta', 'Unknown / Directo')
    );

  -- Ahorro por retiro: payment_date > latest contract end_date
  IF NOT v_is_walk_in AND v_sale.sales_rep_id IS NOT NULL THEN
    v_redirect_to_ahorro := COALESCE(
      (SELECT MAX(sp.end_date) < v_payment.payment_date
       FROM salesperson_periods sp
       WHERE sp.salesperson_id = v_sale.sales_rep_id
         AND sp.end_date IS NOT NULL),
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
  'Calculates commissions. Phase 1 requires promise_signed_date. 60% cap on phase 1+2. Ahorro por retiro when payment_date > salesperson_periods.end_date. Uses unified salespeople table.';


-- ============================================================================
-- PHASE 9: RLS POLICIES ON RENAMED TABLES
-- ============================================================================

-- salesperson_project_assignments: add write policies for service_role
-- (existing "Allow read for authenticated" policy persists through rename)
CREATE POLICY "Service role full access on salesperson_project_assignments"
  ON salesperson_project_assignments FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- salesperson_periods: add service_role write policy
CREATE POLICY "Service role full access on salesperson_periods"
  ON salesperson_periods FOR ALL TO service_role
  USING (true) WITH CHECK (true);


-- ============================================================================
-- PHASE 10: DROP REDUNDANT TABLES
-- ============================================================================

-- salesperson_projects: empty junction table from migration 022, replaced by
-- salesperson_project_assignments (which has 44 rows of temporal data)
DROP TABLE IF EXISTS salesperson_projects;

-- sales_reps: legacy identity table, replaced by salespeople
DROP TABLE IF EXISTS sales_reps;


-- ============================================================================
-- PHASE 11: SCHEMA RELOAD
-- ============================================================================

-- Notify PostgREST to pick up table renames, FK changes, and column renames
NOTIFY pgrst, 'reload schema';

COMMIT;
