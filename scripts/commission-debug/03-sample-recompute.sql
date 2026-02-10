-- ============================================================================
-- Step 3: Recompute expected commissions for a small sample (run in Supabase SQL Editor)
-- Compares expected vs actual per payment for ~10 payments (mix of types).
-- ============================================================================

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
expected_per_payment AS (
  SELECT
    pp.payment_id,
    pp.payment_type,
    pp.payment_date,
    ROUND(SUM(pp.amount * cr.rate * cp.percentage)::numeric, 2) AS expected_total
  FROM payment_phase pp
  JOIN commission_phases cp ON cp.phase = pp.phase
  JOIN commission_rates cr ON cr.active = true
  WHERE (cr.recipient_type = 'management' AND cr.always_paid = true)
     OR (cr.recipient_type = 'sales_rep' AND pp.sales_rep_id IS NOT NULL AND pp.sales_rep_id <> '' AND pp.sales_rep_id NOT IN ('unknown','walk_in') AND cr.recipient_id = pp.sales_rep_id)
     OR (cr.recipient_type = 'special' AND cr.recipient_id = 'walk_in' AND (pp.sales_rep_id IS NULL OR pp.sales_rep_id IN ('unknown','walk_in')))
     OR (cr.recipient_type = 'special' AND cr.recipient_id = 'referral' AND pp.referral_applies = true)
     OR (cr.recipient_type = 'special' AND cr.always_paid = true AND cr.recipient_id NOT IN ('referral','walk_in'))
  GROUP BY pp.payment_id, pp.payment_type, pp.payment_date
),
actual_per_payment AS (
  SELECT payment_id, ROUND(SUM(commission_amount)::numeric, 2) AS actual_total
  FROM commissions
  GROUP BY payment_id
),
sample_payments AS (
  SELECT payment_id FROM payment_phase ORDER BY payment_date, payment_id LIMIT 10
)
SELECT
  e.payment_id,
  e.payment_type,
  e.payment_date,
  e.expected_total,
  COALESCE(a.actual_total, 0) AS actual_total,
  ROUND((e.expected_total - COALESCE(a.actual_total, 0))::numeric, 2) AS diff,
  CASE WHEN ABS(e.expected_total - COALESCE(a.actual_total, 0)) < 0.02 THEN 'OK' ELSE 'MISMATCH' END AS status
FROM expected_per_payment e
JOIN sample_payments s ON s.payment_id = e.payment_id
LEFT JOIN actual_per_payment a ON a.payment_id = e.payment_id
ORDER BY e.payment_date, e.payment_id;
