-- ============================================================================
-- Step 2: Confirm trigger execution and function logic
-- Run in Supabase SQL Editor to inspect DB objects.
-- ============================================================================

-- 2a. Find trigger on payments that fires commission calculation
SELECT
  tgname AS trigger_name,
  proname AS function_name,
  pg_get_triggerdef(t.oid, true) AS trigger_definition
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE n.nspname = 'public'
  AND c.relname = 'payments'
  AND NOT t.tgisinternal
ORDER BY tgname;

-- 2b. Get function source for calculate_commissions (any variant)
SELECT
  n.nspname AS schema_name,
  p.proname AS function_name,
  pg_get_functiondef(p.oid) AS function_definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND (p.proname LIKE '%commission%' OR p.proname LIKE '%calculate%')
ORDER BY p.proname;

-- Verify in the function:
-- - Phase: reservation -> 1; deed_signed_date set and payment_date >= deed_signed_date -> 3; else -> 2
-- - Formula: payment.amount * rate * phase_percentage
-- - Recipients: management (always_paid), sales_rep or walk_in, referral if applicable, special always_paid
