-- ============================================================================
-- Step 4: Reconciliation report — expected vs actual totals
-- Run in Supabase SQL Editor. Phase logic matches calculate_commissions_for_payment.
-- ============================================================================

-- Helper: phase per payment (1=reservation, 3=on/after deed date, else 2)
WITH payment_phase AS (
  SELECT
    p.id AS payment_id,
    p.amount,
    p.payment_type,
    p.payment_date,
    s.sales_rep_id,
    s.referral_applies,
    s.deed_signed_date,
    CASE
      WHEN p.payment_type = 'reservation' THEN 1
      WHEN s.deed_signed_date IS NOT NULL AND p.payment_date >= s.deed_signed_date THEN 3
      ELSE 2
    END AS phase
  FROM payments p
  JOIN sales s ON p.sale_id = s.id
),

-- Expected commission per (payment, recipient) then summed
expected_per_payment_recipient AS (
  SELECT
    pp.payment_id,
    cr.recipient_id,
    cr.recipient_type,
    (pp.amount * cr.rate * cp.percentage) AS expected_amount
  FROM payment_phase pp
  JOIN commission_phases cp ON cp.phase = pp.phase
  JOIN commission_rates cr ON cr.active = true
  WHERE (cr.recipient_type = 'management' AND cr.always_paid = true)
     OR (cr.recipient_type = 'sales_rep' AND pp.sales_rep_id IS NOT NULL AND pp.sales_rep_id <> '' AND pp.sales_rep_id NOT IN ('unknown','walk_in') AND cr.recipient_id = pp.sales_rep_id)
     OR (cr.recipient_type = 'special' AND cr.recipient_id = 'walk_in' AND (pp.sales_rep_id IS NULL OR pp.sales_rep_id IN ('unknown','walk_in')))
     OR (cr.recipient_type = 'special' AND cr.recipient_id = 'referral' AND pp.referral_applies = true)
     OR (cr.recipient_type = 'special' AND cr.always_paid = true AND cr.recipient_id NOT IN ('referral','walk_in'))
)

-- Overall expected
SELECT ROUND(SUM(expected_amount)::numeric, 2) AS total_expected FROM expected_per_payment_recipient;

-- Overall actual
SELECT ROUND(SUM(commission_amount)::numeric, 2) AS total_actual FROM commissions;

-- By recipient_type: expected vs actual
WITH payment_phase AS (
  SELECT p.id AS payment_id, p.amount, s.sales_rep_id, s.referral_applies, s.deed_signed_date,
    CASE WHEN p.payment_type = 'reservation' THEN 1 WHEN s.deed_signed_date IS NOT NULL AND p.payment_date >= s.deed_signed_date THEN 3 ELSE 2 END AS phase
  FROM payments p JOIN sales s ON p.sale_id = s.id
),
expected_per_payment_recipient AS (
  SELECT cr.recipient_type, (pp.amount * cr.rate * cp.percentage) AS expected_amount
  FROM payment_phase pp
  JOIN commission_phases cp ON cp.phase = pp.phase
  JOIN commission_rates cr ON cr.active = true
  WHERE (cr.recipient_type = 'management' AND cr.always_paid = true)
     OR (cr.recipient_type = 'sales_rep' AND pp.sales_rep_id IS NOT NULL AND pp.sales_rep_id <> '' AND pp.sales_rep_id NOT IN ('unknown','walk_in') AND cr.recipient_id = pp.sales_rep_id)
     OR (cr.recipient_type = 'special' AND cr.recipient_id = 'walk_in' AND (pp.sales_rep_id IS NULL OR pp.sales_rep_id IN ('unknown','walk_in')))
     OR (cr.recipient_type = 'special' AND cr.recipient_id = 'referral' AND pp.referral_applies = true)
     OR (cr.recipient_type = 'special' AND cr.always_paid = true AND cr.recipient_id NOT IN ('referral','walk_in'))
),
expected_by_type AS (
  SELECT recipient_type, ROUND(SUM(expected_amount)::numeric, 2) AS expected
  FROM expected_per_payment_recipient
  GROUP BY recipient_type
),
actual_by_type AS (
  SELECT COALESCE(cr.recipient_type, 'unknown') AS recipient_type, ROUND(SUM(c.commission_amount)::numeric, 2) AS actual
  FROM commissions c
  LEFT JOIN commission_rates cr ON c.recipient_id = cr.recipient_id
  GROUP BY cr.recipient_type
)
SELECT
  COALESCE(e.recipient_type, a.recipient_type) AS recipient_type,
  e.expected,
  a.actual,
  ROUND((COALESCE(e.expected, 0) - COALESCE(a.actual, 0))::numeric, 2) AS diff
FROM expected_by_type e
FULL OUTER JOIN actual_by_type a ON e.recipient_type = a.recipient_type
ORDER BY recipient_type;
