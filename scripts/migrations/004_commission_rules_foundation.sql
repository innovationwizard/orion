-- ============================================================================
-- Migration: Commission Rules Foundation (Phase 0)
-- ============================================================================
-- Adds config tables for project/period-aware rates, referral types.
-- Extends sales and commissions for audit. Run after migration_sales_reps_uuid.
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 0.1 Commission policy periods (project + date range + escalation threshold)
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.commission_policy_periods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id),
  start_date date NOT NULL,
  end_date date,
  escalation_threshold int NOT NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(project_id, start_date)
);

COMMENT ON TABLE public.commission_policy_periods IS 'Project-specific commission policy periods. Rates and thresholds vary by period.';
COMMENT ON COLUMN public.commission_policy_periods.escalation_threshold IS 'Units sold (excl. referrals) to reach 1.25% ejecutivo rate. Varies: 2 (Santa Elena), 3 (Casa Elisa), 5 (Boulevard, Benestare, BL-Tapias).';

-- ----------------------------------------------------------------------------
-- 0.2 Role rates per period
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.commission_role_rates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_period_id uuid NOT NULL REFERENCES commission_policy_periods(id) ON DELETE CASCADE,
  role text NOT NULL,
  rate_below_threshold numeric NOT NULL,
  rate_at_threshold numeric NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(policy_period_id, role)
);

COMMENT ON TABLE public.commission_role_rates IS 'Role rates per policy period. rate_below_threshold when advisor < escalation_threshold; rate_at_threshold when >= threshold.';
COMMENT ON COLUMN public.commission_role_rates.role IS 'direccion_general | gerencia_comercial | supervisor_comercial | ejecutivo_venta | ahorro';

-- ----------------------------------------------------------------------------
-- 0.3 Referral type definitions
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.commission_referral_types (
  id text PRIMARY KEY,
  name text NOT NULL,
  ejecutivo_rate numeric NOT NULL,
  referrer_rate numeric NOT NULL,
  referrer_phase_only int,
  special_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.commission_referral_types IS 'Referral commission structures. referrer_phase_only=3 means referrer paid only at deed phase.';
COMMENT ON COLUMN public.commission_referral_types.referrer_phase_only IS '3 = pay referrer only at phase 3 (deed); NULL = all phases';

-- ----------------------------------------------------------------------------
-- 0.4 Extend sales table
-- ----------------------------------------------------------------------------

ALTER TABLE public.sales
  ADD COLUMN IF NOT EXISTS referral_type text REFERENCES commission_referral_types(id),
  ADD COLUMN IF NOT EXISTS bank_disbursement_date date;

COMMENT ON COLUMN public.sales.referral_type IS 'portfolio_standard | portfolio_antonio_rada | inter_project | external | broker. NULL = no referral.';
COMMENT ON COLUMN public.sales.bank_disbursement_date IS 'Date bank disbursed client credit to project. Required for phase 3 when present.';

-- ----------------------------------------------------------------------------
-- 0.5 Extend commission_phases (optional metadata)
-- ----------------------------------------------------------------------------

ALTER TABLE public.commission_phases
  ADD COLUMN IF NOT EXISTS requires_promise_signed boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS requires_bank_disbursement boolean DEFAULT false;

-- ----------------------------------------------------------------------------
-- 0.6 Extend commissions for audit
-- ----------------------------------------------------------------------------

ALTER TABLE public.commissions
  ADD COLUMN IF NOT EXISTS policy_period_id uuid REFERENCES commission_policy_periods(id),
  ADD COLUMN IF NOT EXISTS referral_type text;

-- ----------------------------------------------------------------------------
-- 0.7 Seed referral types
-- ----------------------------------------------------------------------------

INSERT INTO public.commission_referral_types (id, name, ejecutivo_rate, referrer_rate, referrer_phase_only, special_notes) VALUES
  ('portfolio_standard', 'Portfolio Referral (Standard)', 0.01, 0.0035, 3, 'Referrer paid only at deed. Ejecutivo 1%.'),
  ('portfolio_antonio_rada', 'Portfolio Referral — Antonio Rada', 0.0035, 0.01, 3, 'Antonio Rada gets 1%; original referrer 0%; Supervisor nullified.'),
  ('inter_project', 'Inter-Project Referral', 0.005, 0.004, NULL, 'Referring advisor 0.40%; Ahorro 0.45%.'),
  ('external', 'External Referrer', 0.0035, 0.01, 3, 'Referrer paid only at deed.'),
  ('broker', 'Broker / Real Estate Agency', 0.0035, 0.01, 3, 'Same as external.')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  ejecutivo_rate = EXCLUDED.ejecutivo_rate,
  referrer_rate = EXCLUDED.referrer_rate,
  referrer_phase_only = EXCLUDED.referrer_phase_only,
  special_notes = EXCLUDED.special_notes,
  updated_at = now();

-- ----------------------------------------------------------------------------
-- 0.8 Seed policy periods and role rates (depends on projects existing)
-- ----------------------------------------------------------------------------

-- Boulevard 5: Period 1 (Mar 2023 – May 2025)
INSERT INTO public.commission_policy_periods (project_id, start_date, end_date, escalation_threshold, notes)
SELECT id, '2023-03-01'::date, '2025-05-31'::date, 5, 'Boulevard 5 Period 1 — Gerencia 0.50%, no Supervisor'
FROM projects WHERE name = 'boulevard'
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
WHERE p.notes LIKE 'Boulevard 5 Period 1%'
  AND NOT EXISTS (SELECT 1 FROM commission_role_rates crr WHERE crr.policy_period_id = p.id AND crr.role = r.role);

-- Boulevard 5: Period 2 (Jun 2025 onwards)
INSERT INTO public.commission_policy_periods (project_id, start_date, end_date, escalation_threshold, notes)
SELECT id, '2025-06-01'::date, NULL, 5, 'Boulevard 5 Period 2 — Gerencia 0.30%, Supervisor 0.25%'
FROM projects WHERE name = 'boulevard'
ON CONFLICT (project_id, start_date) DO NOTHING;

INSERT INTO public.commission_role_rates (policy_period_id, role, rate_below_threshold, rate_at_threshold)
SELECT p.id, r.role, r.rate_below, r.rate_at
FROM commission_policy_periods p
CROSS JOIN (VALUES
  ('direccion_general', 0.006, 0.006),
  ('gerencia_comercial', 0.003, 0.003),
  ('supervisor_comercial', 0.0025, 0.0025),
  ('ejecutivo_venta', 0.01, 0.0125),
  ('ahorro', 0.0035, 0.001)
) AS r(role, rate_below, rate_at)
WHERE p.notes LIKE 'Boulevard 5 Period 2%'
  AND NOT EXISTS (SELECT 1 FROM commission_role_rates crr WHERE crr.policy_period_id = p.id AND crr.role = r.role);

-- Benestare: Period 1 (Aug 2023 – May 2025)
INSERT INTO public.commission_policy_periods (project_id, start_date, end_date, escalation_threshold, notes)
SELECT id, '2023-08-01'::date, '2025-05-31'::date, 5, 'Benestare Period 1'
FROM projects WHERE name = 'benestare'
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
WHERE p.notes = 'Benestare Period 1'
  AND NOT EXISTS (SELECT 1 FROM commission_role_rates crr WHERE crr.policy_period_id = p.id AND crr.role = r.role);

-- Benestare: Period 2 (Jun 2025 onwards)
INSERT INTO public.commission_policy_periods (project_id, start_date, end_date, escalation_threshold, notes)
SELECT id, '2025-06-01'::date, NULL, 5, 'Benestare Period 2'
FROM projects WHERE name = 'benestare'
ON CONFLICT (project_id, start_date) DO NOTHING;

INSERT INTO public.commission_role_rates (policy_period_id, role, rate_below_threshold, rate_at_threshold)
SELECT p.id, r.role, r.rate_below, r.rate_at
FROM commission_policy_periods p
CROSS JOIN (VALUES
  ('direccion_general', 0.006, 0.006),
  ('gerencia_comercial', 0.003, 0.003),
  ('supervisor_comercial', 0.0025, 0.0025),
  ('ejecutivo_venta', 0.01, 0.0125),
  ('ahorro', 0.0035, 0.001)
) AS r(role, rate_below, rate_at)
WHERE p.notes = 'Benestare Period 2'
  AND NOT EXISTS (SELECT 1 FROM commission_role_rates crr WHERE crr.policy_period_id = p.id AND crr.role = r.role);

-- BL-Tapias: Period 1 (Oct 2024 – May 2025)
INSERT INTO public.commission_policy_periods (project_id, start_date, end_date, escalation_threshold, notes)
SELECT id, '2024-10-01'::date, '2025-05-31'::date, 5, 'BL-Tapias Period 1'
FROM projects WHERE name = 'bl_tapias'
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
WHERE p.notes = 'BL-Tapias Period 1'
  AND NOT EXISTS (SELECT 1 FROM commission_role_rates crr WHERE crr.policy_period_id = p.id AND crr.role = r.role);

-- BL-Tapias: Period 2 (Jun 2025 onwards)
INSERT INTO public.commission_policy_periods (project_id, start_date, end_date, escalation_threshold, notes)
SELECT id, '2025-06-01'::date, NULL, 5, 'BL-Tapias Period 2'
FROM projects WHERE name = 'bl_tapias'
ON CONFLICT (project_id, start_date) DO NOTHING;

INSERT INTO public.commission_role_rates (policy_period_id, role, rate_below_threshold, rate_at_threshold)
SELECT p.id, r.role, r.rate_below, r.rate_at
FROM commission_policy_periods p
CROSS JOIN (VALUES
  ('direccion_general', 0.006, 0.006),
  ('gerencia_comercial', 0.003, 0.003),
  ('supervisor_comercial', 0.0025, 0.0025),
  ('ejecutivo_venta', 0.01, 0.0125),
  ('ahorro', 0.0035, 0.001)
) AS r(role, rate_below, rate_at)
WHERE p.notes = 'BL-Tapias Period 2'
  AND NOT EXISTS (SELECT 1 FROM commission_role_rates crr WHERE crr.policy_period_id = p.id AND crr.role = r.role);

-- Santa Elisa (Santa Elena): Period 1 (Jul 2024 – May 2025), threshold 2
INSERT INTO public.commission_policy_periods (project_id, start_date, end_date, escalation_threshold, notes)
SELECT id, '2024-07-01'::date, '2025-05-31'::date, 2, 'Santa Elisa Period 1'
FROM projects WHERE name = 'santa_elisa'
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
WHERE p.notes = 'Santa Elisa Period 1'
  AND NOT EXISTS (SELECT 1 FROM commission_role_rates crr WHERE crr.policy_period_id = p.id AND crr.role = r.role);

-- Santa Elisa: Period 2 (Jun 2025 onwards)
INSERT INTO public.commission_policy_periods (project_id, start_date, end_date, escalation_threshold, notes)
SELECT id, '2025-06-01'::date, NULL, 2, 'Santa Elisa Period 2'
FROM projects WHERE name = 'santa_elisa'
ON CONFLICT (project_id, start_date) DO NOTHING;

INSERT INTO public.commission_role_rates (policy_period_id, role, rate_below_threshold, rate_at_threshold)
SELECT p.id, r.role, r.rate_below, r.rate_at
FROM commission_policy_periods p
CROSS JOIN (VALUES
  ('direccion_general', 0.006, 0.006),
  ('gerencia_comercial', 0.003, 0.003),
  ('supervisor_comercial', 0.0025, 0.0025),
  ('ejecutivo_venta', 0.01, 0.0125),
  ('ahorro', 0.0035, 0.001)
) AS r(role, rate_below, rate_at)
WHERE p.notes = 'Santa Elisa Period 2'
  AND NOT EXISTS (SELECT 1 FROM commission_role_rates crr WHERE crr.policy_period_id = p.id AND crr.role = r.role);

COMMIT;
