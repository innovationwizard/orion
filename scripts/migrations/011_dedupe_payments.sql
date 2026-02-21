-- ============================================================================
-- Deduplicate payments: keep one row per (sale_id, payment_date, amount, payment_type)
-- Run after ETL was executed multiple times.
-- ============================================================================

-- 1. Delete commissions for duplicate payments (FK constraint)
DELETE FROM commissions
WHERE payment_id IN (
  SELECT a.id FROM payments a
  JOIN payments b ON a.sale_id = b.sale_id
    AND a.payment_date = b.payment_date
    AND a.amount = b.amount
    AND a.payment_type = b.payment_type
    AND a.id > b.id
);

-- 2. Delete duplicate payments (keep row with smallest id)
DELETE FROM payments a
USING payments b
WHERE a.id > b.id
  AND a.sale_id = b.sale_id
  AND a.payment_date = b.payment_date
  AND a.amount = b.amount
  AND a.payment_type = b.payment_type;
