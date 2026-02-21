-- ============================================================================
-- Migration 017: Supabase Security Linter Fixes
--
-- Addresses:
-- - 0010 security_definer_view: Views use SECURITY DEFINER (owner's privileges)
--   instead of SECURITY INVOKER (caller's privileges). Fix: set security_invoker.
-- - 0013 rls_disabled_in_public: Tables in public schema exposed to PostgREST
--   without RLS. Fix: enable RLS and add read policy for authenticated users.
--
-- Run after: 016
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Security Definer Views → Security Invoker
-- ----------------------------------------------------------------------------
-- Views execute with caller's privileges instead of owner's. Respects RLS on
-- underlying tables. See: https://supabase.com/docs/guides/database/database-linter?lint=0010_security_definer_view

ALTER VIEW IF EXISTS public.payment_compliance SET (security_invoker = true);
ALTER VIEW IF EXISTS public.cash_flow_forecast SET (security_invoker = true);
ALTER VIEW IF EXISTS public.delinquent_accounts SET (security_invoker = true);

-- ----------------------------------------------------------------------------
-- 2. Enable RLS on public tables
-- ----------------------------------------------------------------------------
-- Tables exposed to PostgREST must have RLS enabled. The app uses service role
-- (bypasses RLS). Policies below allow authenticated users read-only access;
-- service role retains full access for API/ETL.
-- See: https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public

ALTER TABLE public.sales_rep_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commission_policy_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commission_role_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_reps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commission_referral_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_rep_project_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commission_role_recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expected_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commission_gerencia_assignments ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- 3. RLS policies: allow SELECT for authenticated users
-- ----------------------------------------------------------------------------
-- Read-only for direct PostgREST access with anon/authenticated key.
-- Service role (used by API/ETL) bypasses RLS and retains full access.

CREATE POLICY "Allow read for authenticated"
  ON public.sales_rep_periods FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow read for authenticated"
  ON public.commission_policy_periods FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow read for authenticated"
  ON public.commission_role_rates FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow read for authenticated"
  ON public.sales_reps FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow read for authenticated"
  ON public.commission_referral_types FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow read for authenticated"
  ON public.sales_rep_project_assignments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow read for authenticated"
  ON public.commission_role_recipients FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow read for authenticated"
  ON public.expected_payments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow read for authenticated"
  ON public.commission_gerencia_assignments FOR SELECT
  TO authenticated
  USING (true);
