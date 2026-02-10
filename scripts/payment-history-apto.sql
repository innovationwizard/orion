-- Historic of payments for apto 514 (chronological).
-- Run in Supabase SQL Editor or: psql $DATABASE_URL -f scripts/payment-history-apto.sql
-- To include variants like 514-A, use: WHERE u.unit_number LIKE '514%'

SELECT
  p.id AS payment_id,
  p.payment_date,
  p.amount,
  p.payment_type,
  p.payment_method,
  p.notes,
  p.created_at,
  s.id AS sale_id,
  u.unit_number AS apto,
  c.full_name AS client_name
FROM payments p
JOIN sales s ON p.sale_id = s.id
JOIN units u ON s.unit_id = u.id
LEFT JOIN clients c ON s.client_id = c.id
WHERE u.unit_number = '514'
ORDER BY p.payment_date ASC;
