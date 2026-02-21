-- ============================================================================
-- Pre-flight check: Verify all dependencies before running etl_bl_tapias.py
-- Run in Supabase SQL Editor. All checks should pass.
-- ============================================================================

-- 1. Projects: bl_tapias must exist (ETL + commission policy periods)
SELECT 'projects' AS check_name,
       COUNT(*) FILTER (WHERE name = 'bl_tapias') AS bl_tapias_exists,
       COUNT(*) AS total_projects
FROM projects;

-- 2. Sales reps: populated by etl_sales_reps.py; Unknown required for walk-in
SELECT 'sales_reps' AS check_name,
       COUNT(*) AS total_reps,
       COUNT(*) FILTER (WHERE name IN ('Unknown', 'Puerta Abierta', 'Unknown / Directo')) AS walk_in_reps
FROM sales_reps;

-- 3. Sales rep periods: needed for ahorro por retiro
SELECT 'sales_rep_periods' AS check_name, COUNT(*) AS total_periods
FROM sales_rep_periods;

-- 4. Sales rep project assignments: bl_tapias assignments
SELECT 'sales_rep_project_assignments' AS check_name,
       COUNT(*) AS total_assignments,
       COUNT(*) FILTER (WHERE p.name = 'bl_tapias') AS bl_tapias_assignments
FROM sales_rep_project_assignments srpa
JOIN projects p ON p.id = srpa.project_id;

-- 5. Commission phases: phases 1–3, percentages sum to 1.0
SELECT 'commission_phases' AS check_name,
       phase,
       name,
       percentage,
       (SELECT ROUND(SUM(percentage)::numeric, 6) FROM commission_phases WHERE phase IN (1,2,3)) AS sum_1_2_3
FROM commission_phases
WHERE phase IN (1, 2, 3)
ORDER BY phase;

-- 6. Commission policy periods: bl_tapias must have at least one period
SELECT 'commission_policy_periods' AS check_name,
       p.name AS project_name,
       cpp.start_date,
       cpp.end_date,
       cpp.escalation_threshold
FROM commission_policy_periods cpp
JOIN projects p ON p.id = cpp.project_id
WHERE p.name = 'bl_tapias'
ORDER BY cpp.start_date;

-- 7. Commission role rates: must exist for bl_tapias policy periods
SELECT 'commission_role_rates' AS check_name,
       p.name AS project_name,
       COUNT(crr.id) AS role_rate_count
FROM commission_policy_periods cpp
JOIN projects p ON p.id = cpp.project_id
LEFT JOIN commission_role_rates crr ON crr.policy_period_id = cpp.id
WHERE p.name = 'bl_tapias'
GROUP BY p.name, cpp.id, cpp.start_date
ORDER BY cpp.start_date;

-- 8. Commission referral types: seeded by migration 004
SELECT 'commission_referral_types' AS check_name, COUNT(*) AS total
FROM commission_referral_types;

-- 9. Commission role recipients: direccion, gerencia, supervisor, ahorro
SELECT 'commission_role_recipients' AS check_name,
       role,
       recipient_id,
       recipient_name
FROM commission_role_recipients
ORDER BY role;

-- 10. Commission rates (fallback): walk_in, referral required when no policy
SELECT 'commission_rates_fallback' AS check_name,
       recipient_id,
       recipient_type,
       rate,
       active
FROM commission_rates
WHERE active = true
  AND (recipient_id IN ('walk_in', 'referral') OR recipient_type = 'management')
ORDER BY recipient_type, recipient_id;

-- 11. Trigger: auto_calculate_commissions on payments
SELECT 'payments_trigger' AS check_name,
       t.tgname AS trigger_name,
       p.proname AS function_name
FROM pg_trigger t
JOIN pg_class c ON c.oid = t.tgrelid
JOIN pg_proc p ON p.oid = t.tgfoid
WHERE c.relname = 'payments'
  AND t.tgname LIKE '%commission%';

-- 12. Helper functions exist
SELECT 'helper_functions' AS check_name,
       p.proname AS function_name
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname IN ('get_commission_policy_period', 'get_commission_phase12_cap_remaining', 'get_rep_unit_count_for_escalation', 'calculate_commissions')
ORDER BY p.proname;
