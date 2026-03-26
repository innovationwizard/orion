-- ============================================================================
-- Migration 048: Per-Reservation Financial Terms
-- ============================================================================
-- Adds 3 columns to `reservations` for per-reservation overrides of
-- cotizador defaults. When NULL, PCV/Carta de Pago use the project config.
--
-- Existing columns leveraged (not modified):
--   reservations.deposit_amount    → actual reserva paid (migration 018)
--   reservations.cuotas_enganche   → installment count (migration 042)
--
-- Also updates v_reservations_pending to include:
--   cuotas_enganche, pipedrive_url (from 042, not previously in view)
--   sale_price, enganche_pct, inmueble_pct (new columns)
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. New columns on reservations
-- ---------------------------------------------------------------------------

ALTER TABLE reservations
  ADD COLUMN IF NOT EXISTS sale_price numeric(14,2),
  ADD COLUMN IF NOT EXISTS enganche_pct numeric(5,4),
  ADD COLUMN IF NOT EXISTS inmueble_pct numeric(5,4);

COMMENT ON COLUMN reservations.sale_price IS 'Effective sale price (may differ from price_list). NULL = use unit price_list.';
COMMENT ON COLUMN reservations.enganche_pct IS 'Down payment % agreed for this reservation. NULL = use project config default.';
COMMENT ON COLUMN reservations.inmueble_pct IS 'Deed split: property portion %. NULL = use project config default (typically 70%).';

-- ---------------------------------------------------------------------------
-- 2. Update v_reservations_pending — preserve 033 structure, append new cols
-- ---------------------------------------------------------------------------
-- The current production view is from migration 033. It uses GROUP BY with
-- array_agg for client names. We preserve the exact column ordering and
-- only append new columns at the END.

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
  r.dpi_image_url,
  -- 030: M:N buyer support
  count(rc.id) AS client_count,
  -- 033: ejecutivo rate + confirmation status
  sale.ejecutivo_rate,
  sale.ejecutivo_rate_confirmed,
  -- 042: cuotas enganche + pipedrive (columns existed but weren't in view)
  r.cuotas_enganche,
  r.pipedrive_url,
  -- 048: per-reservation financial terms
  r.sale_price,
  r.enganche_pct,
  r.inmueble_pct
FROM reservations r
JOIN rv_units u        ON u.id = r.unit_id
JOIN floors f          ON f.id = u.floor_id
JOIN towers t          ON t.id = f.tower_id
JOIN projects p        ON p.id = t.project_id
JOIN salespeople s     ON s.id = r.salesperson_id
LEFT JOIN receipt_extractions re ON re.reservation_id = r.id
LEFT JOIN reservation_clients rc ON rc.reservation_id = r.id
LEFT JOIN rv_clients c ON c.id = rc.client_id
LEFT JOIN units u_analytics ON u_analytics.project_id = p.id
  AND u_analytics.unit_number = u.unit_number
LEFT JOIN sales sale ON sale.unit_id = u_analytics.id
  AND sale.status = 'active'
GROUP BY
  r.id, r.status, r.deposit_amount, r.deposit_date, r.deposit_bank,
  r.receipt_type, r.depositor_name, r.receipt_image_url,
  r.lead_source, r.notes, r.is_resale, r.created_at,
  u.unit_number, u.unit_code, u.unit_type, u.bedrooms, u.price_list,
  f.number, t.name, t.is_default, p.name, p.slug,
  s.full_name, s.id,
  re.extracted_amount, re.extracted_date, re.extracted_bank, re.confidence,
  r.dpi_image_url,
  sale.ejecutivo_rate, sale.ejecutivo_rate_confirmed,
  r.cuotas_enganche, r.pipedrive_url,
  r.sale_price, r.enganche_pct, r.inmueble_pct
ORDER BY r.created_at DESC;

COMMENT ON VIEW v_reservations_pending IS
  'Denormalized reservation view with unit, project, client, salesperson, ejecutivo rate, and financial terms.';
