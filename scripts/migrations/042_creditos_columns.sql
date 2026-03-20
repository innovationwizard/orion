-- ============================================================================
-- Migration 042: Créditos Dashboard — New columns + denormalized view
-- ============================================================================
-- Adds 7 columns across 3 tables for the Créditos department dashboard:
--   rv_units:            valor_inmueble
--   rv_client_profiles:  income_source, prequalification_bank, is_fha, is_cash_purchase
--   reservations:        cuotas_enganche, pipedrive_url
-- Creates v_creditos_unit_full view for the dashboard API.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. rv_units — assessed property value
-- ---------------------------------------------------------------------------
ALTER TABLE rv_units ADD COLUMN IF NOT EXISTS valor_inmueble numeric(14,2);

COMMENT ON COLUMN rv_units.valor_inmueble IS 'Assessed property value (valor del inmueble). Distinct from price_list (listing price) and sales.price_with_tax (sale price).';

-- ---------------------------------------------------------------------------
-- 2. rv_client_profiles — credit/financing buyer attributes
-- ---------------------------------------------------------------------------
ALTER TABLE rv_client_profiles ADD COLUMN IF NOT EXISTS income_source text;
ALTER TABLE rv_client_profiles ADD COLUMN IF NOT EXISTS prequalification_bank text;
ALTER TABLE rv_client_profiles ADD COLUMN IF NOT EXISTS is_fha boolean NOT NULL DEFAULT false;
ALTER TABLE rv_client_profiles ADD COLUMN IF NOT EXISTS is_cash_purchase boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN rv_client_profiles.income_source IS 'Comma-separated income source(s): Relacion Dependencia, Negocio Propio, Economia Informal, Servicios Profesionales, Otros';
COMMENT ON COLUMN rv_client_profiles.prequalification_bank IS 'Bank that pre-qualified the buyer for financing';
COMMENT ON COLUMN rv_client_profiles.is_fha IS 'FHA financing flag';
COMMENT ON COLUMN rv_client_profiles.is_cash_purchase IS 'Cash (contado) purchase flag';

-- ---------------------------------------------------------------------------
-- 3. reservations — transaction-level credit fields
-- ---------------------------------------------------------------------------
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS cuotas_enganche integer;
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS pipedrive_url text;

COMMENT ON COLUMN reservations.cuotas_enganche IS 'Number of down payment (enganche) installments';
COMMENT ON COLUMN reservations.pipedrive_url IS 'Pipedrive CRM deal URL';

-- ---------------------------------------------------------------------------
-- 4. v_creditos_unit_full — denormalized credit dashboard view
-- ---------------------------------------------------------------------------
-- Returns one row per rv_unit (~890 units).
-- Joins: rv_units → floors → towers → projects
--        → latest active reservation → salesperson
--        → primary client → client profile
--        → analytics units → active sale (natural key bridge)
-- Status mapped: SOLD→VENDIDO, RESERVED/SOFT_HOLD→RESERVADO, else→DISPONIBLE
-- ---------------------------------------------------------------------------

CREATE OR REPLACE VIEW v_creditos_unit_full AS
SELECT
  u.id                AS unit_id,
  u.unit_number,
  u.unit_type,
  u.area_total,
  u.bedrooms,
  COALESCE(u.parking_car, 0) + COALESCE(u.parking_tandem, 0) AS parking,
  u.price_list,
  u.valor_inmueble,
  u.status            AS unit_status,
  CASE u.status
    WHEN 'SOLD'      THEN 'VENDIDO'
    WHEN 'RESERVED'  THEN 'RESERVADO'
    WHEN 'SOFT_HOLD' THEN 'RESERVADO'
    ELSE 'DISPONIBLE'
  END                 AS credit_status,
  f.number            AS floor_number,
  t.id                AS tower_id,
  t.name              AS tower_name,
  p.id                AS project_id,
  p.name              AS project_name,
  p.slug              AS project_slug,
  -- Reservation data (latest active: CONFIRMED or PENDING_REVIEW)
  r.id                AS reservation_id,
  r.deposit_amount,
  r.cuotas_enganche,
  r.pipedrive_url,
  s.id                AS salesperson_id,
  s.full_name         AS salesperson_name,
  -- Client data (primary buyer from junction)
  c.full_name         AS client_name,
  -- Client profile (credit-specific)
  cp.income_source,
  cp.prequalification_bank,
  cp.is_fha,
  cp.is_cash_purchase,
  -- Sales bridge (analytics side)
  sa.price_with_tax   AS precio_total,
  sa.down_payment_amount AS enganche,
  CASE WHEN sa.promise_signed_date IS NOT NULL THEN true ELSE false END AS promesa_firmada,
  CASE
    WHEN sa.price_with_tax IS NOT NULL AND sa.down_payment_amount IS NOT NULL
    THEN sa.price_with_tax - sa.down_payment_amount
    ELSE NULL
  END                 AS financiamiento
FROM rv_units u
JOIN floors f     ON f.id = u.floor_id
JOIN towers t     ON t.id = f.tower_id
JOIN projects p   ON p.id = t.project_id
-- Latest active reservation via LATERAL subquery
LEFT JOIN LATERAL (
  SELECT r2.*
  FROM reservations r2
  WHERE r2.unit_id = u.id
    AND r2.status IN ('CONFIRMED', 'PENDING_REVIEW')
  ORDER BY r2.created_at DESC
  LIMIT 1
) r ON true
LEFT JOIN salespeople s ON s.id = r.salesperson_id
-- Primary client via LATERAL (is_primary = true, fallback to document_order = 1)
LEFT JOIN LATERAL (
  SELECT rc2.client_id
  FROM reservation_clients rc2
  WHERE rc2.reservation_id = r.id
    AND rc2.is_primary = true
  ORDER BY rc2.document_order
  LIMIT 1
) prc ON r.id IS NOT NULL
LEFT JOIN rv_clients c ON c.id = prc.client_id
LEFT JOIN rv_client_profiles cp ON cp.client_id = c.id
-- Sales bridge: rv_units → analytics units → sales (natural key)
LEFT JOIN units u_analytics ON u_analytics.project_id = p.id
  AND u_analytics.unit_number = u.unit_number
LEFT JOIN LATERAL (
  SELECT s2.*
  FROM sales s2
  WHERE s2.unit_id = u_analytics.id
    AND s2.status = 'active'
  ORDER BY s2.sale_date DESC
  LIMIT 1
) sa ON u_analytics.id IS NOT NULL
ORDER BY p.name, t.name, f.number, u.unit_number;

COMMENT ON VIEW v_creditos_unit_full IS 'Denormalized credit dashboard view — all units with reservation, client, profile, and sales data for the Créditos department.';
