-- ============================================================================
-- Migration 050: Add currency column to projects, propagate to views
-- ============================================================================
-- Santa Elena is the first USD project. All other projects are GTQ.
-- Adding currency to projects allows the UI to format amounts correctly
-- without hardcoding assumptions about which project uses which currency.
-- ============================================================================

-- 1. Add currency column to projects table
ALTER TABLE projects ADD COLUMN IF NOT EXISTS currency text NOT NULL DEFAULT 'GTQ';

-- 2. Set Santa Elena to USD
UPDATE projects SET currency = 'USD' WHERE slug = 'santa-elena';

-- 3. Append currency to v_rv_units_full (must match exact current column order)
CREATE OR REPLACE VIEW v_rv_units_full AS
SELECT
  u.id,
  u.unit_number,
  u.unit_code,
  u.unit_type,
  u.bedrooms,
  u.is_local,
  u.area_interior,
  u.area_balcony,
  u.area_terrace,
  u.area_garden,
  u.area_total,
  u.parking_car,
  u.parking_tandem,
  u.parking_number,
  u.parking_level,
  u.bodega_number,
  u.price_list,
  u.status,
  u.status_detail,
  u.status_changed_at,
  f.number    AS floor_number,
  f.id        AS floor_id,
  t.id        AS tower_id,
  t.name      AS tower_name,
  t.is_default AS tower_is_default,
  t.delivery_date AS tower_delivery_date,
  p.id        AS project_id,
  p.name      AS project_name,
  p.slug      AS project_slug,
  u.parking_car_area,
  u.parking_tandem_area,
  u.bodega_area,
  u.price_suggested,
  u.is_cesion,
  u.pcv_block,
  u.precalificacion_status,
  u.precalificacion_notes,
  u.razon_compra,
  u.tipo_cliente,
  u.valor_inmueble,
  u.area_lot,
  -- 050: appended column for project currency
  p.currency
FROM rv_units u
  JOIN floors f ON f.id = u.floor_id
  JOIN towers t ON t.id = f.tower_id
  JOIN projects p ON p.id = t.project_id;

-- 4. Append currency to v_reservations_pending
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
  f.number AS floor_number,
  t.name AS tower_name,
  t.is_default AS tower_is_default,
  p.name AS project_name,
  p.slug AS project_slug,
  s.full_name AS salesperson_name,
  s.id AS salesperson_id,
  re.extracted_amount,
  re.extracted_date,
  re.extracted_bank,
  re.confidence AS ocr_confidence,
  array_agg(c.full_name ORDER BY rc.is_primary DESC, c.full_name) AS client_names,
  (array_agg(c.phone ORDER BY rc.is_primary DESC) FILTER (WHERE c.phone IS NOT NULL))[1] AS client_phone,
  r.dpi_image_url,
  count(rc.id) AS client_count,
  sale.ejecutivo_rate,
  sale.ejecutivo_rate_confirmed,
  r.cuotas_enganche,
  r.pipedrive_url,
  r.sale_price,
  r.enganche_pct,
  r.inmueble_pct,
  -- 050: appended column for project currency
  p.currency
FROM reservations r
  JOIN rv_units u ON u.id = r.unit_id
  JOIN floors f ON f.id = u.floor_id
  JOIN towers t ON t.id = f.tower_id
  JOIN projects p ON p.id = t.project_id
  JOIN salespeople s ON s.id = r.salesperson_id
  LEFT JOIN receipt_extractions re ON re.reservation_id = r.id
  LEFT JOIN reservation_clients rc ON rc.reservation_id = r.id
  LEFT JOIN rv_clients c ON c.id = rc.client_id
  LEFT JOIN units u_analytics ON u_analytics.project_id = p.id AND u_analytics.unit_number = u.unit_number
  LEFT JOIN sales sale ON sale.unit_id = u_analytics.id AND sale.status = 'active'::sale_status
GROUP BY r.id, r.status, r.deposit_amount, r.deposit_date, r.deposit_bank,
  r.receipt_type, r.depositor_name, r.receipt_image_url, r.lead_source,
  r.notes, r.is_resale, r.created_at,
  u.unit_number, u.unit_code, u.unit_type, u.bedrooms, u.price_list,
  f.number, t.name, t.is_default, p.name, p.slug,
  s.full_name, s.id,
  re.extracted_amount, re.extracted_date, re.extracted_bank, re.confidence,
  r.dpi_image_url,
  sale.ejecutivo_rate, sale.ejecutivo_rate_confirmed,
  r.cuotas_enganche, r.pipedrive_url,
  r.sale_price, r.enganche_pct, r.inmueble_pct,
  p.currency
ORDER BY r.created_at DESC;

-- 5. Append currency to v_rv_projects_with_towers
CREATE OR REPLACE VIEW v_rv_projects_with_towers AS
SELECT
  p.id AS project_id,
  p.name AS project_name,
  p.slug AS project_slug,
  json_agg(json_build_object(
    'id', t.id,
    'name', t.name,
    'is_default', t.is_default,
    'delivery_date', t.delivery_date
  ) ORDER BY t.name) AS towers,
  -- 050: appended column for project currency
  p.currency
FROM projects p
  JOIN towers t ON t.project_id = p.id
GROUP BY p.id, p.name, p.slug, p.currency
ORDER BY p.name;
