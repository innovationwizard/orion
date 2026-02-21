-- ============================================================================
-- Migration 016: Fix payment_compliance days_delinquent (first unpaid due date)
--
-- AR aging best practice: days_delinquent = days since first unpaid due date,
-- not last_due_date. Uses cumulative expected vs actual to find first unpaid.
--
-- Run after: 015
-- ============================================================================

CREATE OR REPLACE VIEW payment_compliance WITH (security_invoker = true) AS
WITH expected_summary AS (
  SELECT
    ep.project_id,
    ep.unit_number,
    count(*)::bigint AS expected_installments,
    sum(ep.amount) AS expected_total,
    min(ep.due_date) AS first_due_date,
    max(ep.due_date) AS last_due_date,
    sum(CASE WHEN ep.due_date <= CURRENT_DATE THEN ep.amount ELSE 0 END) AS expected_to_date
  FROM expected_payments ep
  WHERE ep.schedule_type = 'budget'
  GROUP BY ep.project_id, ep.unit_number
),
actual_summary AS (
  SELECT
    s.project_id,
    u.unit_number,
    count(p.id)::bigint AS actual_installments,
    COALESCE(sum(p.amount), 0) AS actual_total,
    min(p.payment_date) AS first_payment_date,
    max(p.payment_date) AS last_payment_date
  FROM sales s
  JOIN units u ON s.unit_id = u.id
  LEFT JOIN payments p ON s.id = p.sale_id
  GROUP BY s.project_id, u.unit_number
),
-- Cumulative expected per installment (for first-unpaid calculation)
cumulative_expected AS (
  SELECT
    project_id,
    unit_number,
    due_date,
    sum(amount) OVER (PARTITION BY project_id, unit_number ORDER BY due_date) AS running_expected
  FROM expected_payments
  WHERE schedule_type = 'budget'
),
-- First due_date where cumulative expected > actual_total (first unpaid)
first_unpaid AS (
  SELECT
    c.project_id,
    c.unit_number,
    min(c.due_date) AS first_unpaid_due_date
  FROM cumulative_expected c
  LEFT JOIN actual_summary a ON a.project_id = c.project_id AND a.unit_number = c.unit_number
  WHERE c.running_expected > COALESCE(a.actual_total, 0)
  GROUP BY c.project_id, c.unit_number
)
SELECT
  p.name AS project_name,
  e.unit_number,
  c.full_name AS client_name,
  e.expected_installments,
  e.expected_total,
  e.expected_to_date,
  e.first_due_date,
  e.last_due_date,
  COALESCE(a.actual_installments, 0) AS actual_installments,
  COALESCE(a.actual_total, 0) AS actual_total,
  a.first_payment_date,
  a.last_payment_date,
  CASE
    WHEN e.expected_to_date > 0
    THEN round((COALESCE(a.actual_total, 0) / e.expected_to_date) * 100, 1)
    ELSE NULL
  END AS compliance_pct,
  (COALESCE(a.actual_total, 0) - e.expected_to_date) AS variance,
  CASE
    WHEN COALESCE(a.actual_total, 0) >= (e.expected_to_date * 1.05) THEN 'ahead'
    WHEN COALESCE(a.actual_total, 0) >= (e.expected_to_date * 0.95) THEN 'on_track'
    ELSE 'behind'
  END AS compliance_status,
  CASE
    WHEN COALESCE(a.actual_total, 0) < e.expected_to_date
    THEN GREATEST(0, CURRENT_DATE - COALESCE(fu.first_unpaid_due_date, e.last_due_date)::date)
    ELSE NULL
  END AS days_delinquent,
  e.project_id,
  u.id AS unit_id,
  s.id AS sale_id
FROM expected_summary e
JOIN projects p ON e.project_id = p.id
LEFT JOIN actual_summary a ON e.project_id = a.project_id AND e.unit_number = a.unit_number
LEFT JOIN units u ON e.project_id = u.project_id AND e.unit_number = u.unit_number
LEFT JOIN sales s ON u.id = s.unit_id AND s.status = 'active'
LEFT JOIN clients c ON s.client_id = c.id
LEFT JOIN first_unpaid fu ON e.project_id = fu.project_id AND e.unit_number = fu.unit_number;
