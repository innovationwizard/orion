-- ============================================================================
-- Step 1: Validate base inputs (rates + phases)
-- Run in Supabase SQL Editor. Reference: commission-rules.json
-- ============================================================================

-- 1a. commission_rates: counts by recipient_type
SELECT
  recipient_type,
  COUNT(*) AS rate_count,
  array_agg(recipient_id ORDER BY recipient_id) AS recipient_ids
FROM commission_rates
WHERE active = true
GROUP BY recipient_type
ORDER BY recipient_type;

-- Expected from rules: management (4), sales_rep (4), special (referral, ahorro, walk_in, etc.)

-- 1b. List all active commission_rates for manual check vs commission-rules.json
SELECT recipient_type, recipient_id, recipient_name, rate, always_paid
FROM commission_rates
WHERE active = true
ORDER BY recipient_type, recipient_id;

-- 1c. commission_phases: phases 1–3 and percentages sum to 1.0
SELECT
  phase,
  name,
  percentage,
  (SELECT ROUND(SUM(percentage)::numeric, 6) FROM commission_phases WHERE phase IN (1,2,3)) AS sum_phases_1_2_3
FROM commission_phases
WHERE phase IN (1, 2, 3)
ORDER BY phase;

-- Expect: phase 1 = 0.3, phase 2 = 0.3, phase 3 = 0.4, sum = 1.0
