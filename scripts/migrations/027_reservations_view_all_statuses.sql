-- Migration 027: Remove PENDING_REVIEW filter from v_reservations_pending
-- The admin panel needs to show all reservation statuses, not just pending.
-- View name kept for backwards compatibility (rename would break Supabase cache).

CREATE OR REPLACE VIEW v_reservations_pending AS
SELECT
  r.id AS reservation_id,
  r.status AS reservation_status,
  r.deposit_amount,
  r.deposit_date,
  r.deposit_bank,
  r.receipt_type,
  r.depositor_name,
  r.receipt_image_url,
  r.lead_source,
  r.notes,
  r.is_resale,
  r.created_at AS submitted_at,
  u.unit_number,
  u.unit_code,
  u.unit_type,
  u.bedrooms,
  u.price_list,
  f.number      AS floor_number,
  t.name        AS tower_name,
  t.is_default  AS tower_is_default,
  p.name        AS project_name,
  p.slug        AS project_slug,
  s.full_name   AS salesperson_name,
  s.id          AS salesperson_id,
  re.extracted_amount,
  re.extracted_date,
  re.extracted_bank,
  re.confidence AS ocr_confidence,
  array_agg(c.full_name ORDER BY rc.is_primary DESC, c.full_name) AS client_names,
  (array_agg(c.phone ORDER BY rc.is_primary DESC) FILTER (WHERE c.phone IS NOT NULL))[1] AS client_phone,
  r.dpi_image_url
FROM reservations r
JOIN rv_units u        ON u.id = r.unit_id
JOIN floors f          ON f.id = u.floor_id
JOIN towers t          ON t.id = f.tower_id
JOIN projects p        ON p.id = t.project_id
JOIN salespeople s     ON s.id = r.salesperson_id
LEFT JOIN receipt_extractions re ON re.reservation_id = r.id
LEFT JOIN reservation_clients rc ON rc.reservation_id = r.id
LEFT JOIN rv_clients c ON c.id = rc.client_id
GROUP BY
  r.id, r.status, r.deposit_amount, r.deposit_date, r.deposit_bank,
  r.receipt_type, r.depositor_name, r.receipt_image_url,
  r.lead_source, r.notes, r.is_resale, r.created_at,
  u.unit_number, u.unit_code, u.unit_type, u.bedrooms, u.price_list,
  f.number, t.name, t.is_default, p.name, p.slug,
  s.full_name, s.id,
  re.extracted_amount, re.extracted_date, re.extracted_bank, re.confidence,
  r.dpi_image_url
ORDER BY r.created_at DESC;
