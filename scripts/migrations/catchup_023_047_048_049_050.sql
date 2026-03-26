-- ============================================================================
-- CATCH-UP MIGRATION: Deploy missing 023, 047, 048, 049, 050
-- ============================================================================
-- Audit (2026-03-26) found these migrations never deployed to prod:
--   023 — Cesion de Derechos (rv_units columns + v_cesion_derechos view)
--   047 — Cotizador configs (table + seed data)
--   048 — Per-reservation financial terms (3 columns + v_reservations_pending)
--   049 — Santa Elena seed (area_lot column + full project data)
--   050 — Bedroom-based cotizador rates (bedrooms column + BEN 3-hab configs)
--
-- This script is IDEMPOTENT (safe to re-run):
--   • ADD COLUMN IF NOT EXISTS
--   • CREATE TABLE IF NOT EXISTS
--   • CREATE INDEX IF NOT EXISTS
--   • CREATE OR REPLACE VIEW
--   • INSERT ... ON CONFLICT DO NOTHING
--   • DO $$ guard blocks for policies
--
-- Execution: via Supabase Management API (POST /database/query)
-- Do NOT use `supabase db push` (this file has DO $$ blocks).
-- ============================================================================


-- =====================================================================
-- PHASE 1: SCHEMA — columns on existing tables
-- =====================================================================

-- 023: Cesion columns on rv_units
ALTER TABLE rv_units ADD COLUMN IF NOT EXISTS price_suggested          numeric(14,2);
ALTER TABLE rv_units ADD COLUMN IF NOT EXISTS is_cesion                boolean NOT NULL DEFAULT false;
ALTER TABLE rv_units ADD COLUMN IF NOT EXISTS pcv_block                integer;
ALTER TABLE rv_units ADD COLUMN IF NOT EXISTS precalificacion_status   text;
ALTER TABLE rv_units ADD COLUMN IF NOT EXISTS precalificacion_notes    text;
ALTER TABLE rv_units ADD COLUMN IF NOT EXISTS razon_compra             text;
ALTER TABLE rv_units ADD COLUMN IF NOT EXISTS tipo_cliente             text;

-- 023: Indexes
CREATE INDEX IF NOT EXISTS idx_rv_units_is_cesion  ON rv_units(is_cesion) WHERE is_cesion = true;
CREATE INDEX IF NOT EXISTS idx_rv_units_pcv_block  ON rv_units(pcv_block) WHERE pcv_block IS NOT NULL;

-- 048: Per-reservation financial terms
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS sale_price    numeric(14,2);
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS enganche_pct  numeric(5,4);
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS inmueble_pct  numeric(5,4);

-- 049: Lot area for horizontal projects
ALTER TABLE rv_units ADD COLUMN IF NOT EXISTS area_lot numeric(10,2);


-- =====================================================================
-- PHASE 2: cotizador_configs table (047 + 050 combined)
-- =====================================================================
-- Created with bedrooms column from the start (avoids constraint dance).

CREATE TABLE IF NOT EXISTS cotizador_configs (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id        uuid NOT NULL REFERENCES projects(id),
  tower_id          uuid REFERENCES towers(id),
  unit_type         text,
  bedrooms          integer,
  label             text NOT NULL,
  currency          text NOT NULL DEFAULT 'GTQ',
  enganche_pct      numeric(5,4) NOT NULL,
  reserva_default   numeric(14,2) NOT NULL,
  installment_months integer NOT NULL,
  round_enganche_q100  boolean NOT NULL DEFAULT false,
  round_cuota_q100     boolean NOT NULL DEFAULT false,
  round_cuota_q1       boolean NOT NULL DEFAULT false,
  round_saldo_q100     boolean NOT NULL DEFAULT false,
  bank_rates        numeric(6,4)[] NOT NULL,
  bank_rate_labels  text[],
  plazos_years      integer[] NOT NULL,
  include_seguro_in_cuota boolean NOT NULL DEFAULT false,
  include_iusi_in_cuota   boolean NOT NULL DEFAULT true,
  seguro_enabled          boolean NOT NULL DEFAULT false,
  seguro_base             text NOT NULL DEFAULT 'price',
  iusi_frequency          text NOT NULL DEFAULT 'monthly',
  income_multiplier     numeric(4,2) NOT NULL DEFAULT 2.00,
  income_base           text NOT NULL DEFAULT 'cuota_banco',
  inmueble_pct          numeric(5,4) NOT NULL DEFAULT 0.7000,
  timbres_rate          numeric(5,4) NOT NULL DEFAULT 0.0300,
  use_pretax_extraction boolean NOT NULL DEFAULT true,
  mantenimiento_per_m2  numeric(8,2),
  mantenimiento_label   text,
  disclaimers           text[],
  validity_days         integer DEFAULT 7,
  is_active       boolean NOT NULL DEFAULT true,
  display_order   integer NOT NULL DEFAULT 0,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now(),
  UNIQUE(project_id, tower_id, unit_type, bedrooms)
);

-- RLS (idempotent via DO block)
ALTER TABLE cotizador_configs ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'cotizador_configs' AND policyname = 'cotizador_configs_read') THEN
    CREATE POLICY cotizador_configs_read ON cotizador_configs
      FOR SELECT TO authenticated USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'cotizador_configs' AND policyname = 'cotizador_configs_write') THEN
    CREATE POLICY cotizador_configs_write ON cotizador_configs
      FOR ALL TO authenticated
      USING (jwt_role() IN ('master', 'torredecontrol'))
      WITH CHECK (jwt_role() IN ('master', 'torredecontrol'));
  END IF;
END $$;


-- =====================================================================
-- PHASE 3: VIEWS — rebuild with all new columns
-- =====================================================================

-- v_rv_units_full: preserve existing 32-column order, append new at END
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
  f.number       AS floor_number,
  f.id           AS floor_id,
  t.id           AS tower_id,
  t.name         AS tower_name,
  t.is_default   AS tower_is_default,
  t.delivery_date AS tower_delivery_date,
  p.id           AS project_id,
  p.name         AS project_name,
  p.slug         AS project_slug,
  -- 029: parking/bodega areas (already in current view)
  u.parking_car_area,
  u.parking_tandem_area,
  u.bodega_area,
  -- 023: cesion columns (NEW — appended at end)
  u.price_suggested,
  u.is_cesion,
  u.pcv_block,
  u.precalificacion_status,
  u.precalificacion_notes,
  u.razon_compra,
  u.tipo_cliente,
  -- 047: cotizador IUSI base (NEW)
  u.valor_inmueble,
  -- 049: lot/plot area (NEW)
  u.area_lot
FROM rv_units u
  JOIN floors f  ON f.id = u.floor_id
  JOIN towers t  ON t.id = f.tower_id
  JOIN projects p ON p.id = t.project_id;

-- v_cesion_derechos: cross-domain cesion dashboard view (023)
CREATE OR REPLACE VIEW v_cesion_derechos WITH (security_invoker = true) AS
SELECT
  u.id                        AS unit_id,
  u.unit_number,
  u.unit_type,
  u.status                    AS unit_status,
  u.area_interior,
  u.area_terrace,
  u.area_total,
  u.parking_car,
  u.parking_tandem,
  u.parking_car_area,
  u.parking_tandem_area,
  u.bodega_area,
  u.price_list,
  u.price_suggested,
  CASE
    WHEN u.price_suggested IS NOT NULL AND u.price_list IS NOT NULL
    THEN u.price_suggested - u.price_list
    ELSE NULL
  END                         AS plusvalia,
  CASE
    WHEN COALESCE(u.area_total, 0) > 0
    THEN ROUND(u.price_list / u.area_total, 2)
    ELSE NULL
  END                         AS precio_m2,
  u.pcv_block,
  u.precalificacion_status,
  u.precalificacion_notes,
  u.razon_compra,
  u.tipo_cliente,
  p.id                        AS project_id,
  p.name                      AS project_name,
  p.slug                      AS project_slug,
  pc.client_name,
  pc.expected_total           AS enganche_total,
  pc.expected_to_date         AS enganche_pactado,
  pc.actual_total             AS enganche_pagado,
  pc.variance                 AS diferencia,
  pc.compliance_pct,
  pc.compliance_status,
  pc.days_delinquent
FROM rv_units u
JOIN floors f   ON f.id = u.floor_id
JOIN towers t   ON t.id = f.tower_id
JOIN projects p ON p.id = t.project_id
LEFT JOIN payment_compliance pc
  ON pc.project_id  = p.id
  AND pc.unit_number = u.unit_number
WHERE u.is_cesion = true;

-- v_reservations_pending: add 048 columns at END (preserve existing 34 cols)
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
  count(rc.id) AS client_count,
  sale.ejecutivo_rate,
  sale.ejecutivo_rate_confirmed,
  -- 048: appended columns (NEW)
  r.cuotas_enganche,
  r.pipedrive_url,
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


-- =====================================================================
-- PHASE 4: SEED DATA — Cotizador configs (047)
-- =====================================================================

-- BEN — Benestare: 4 tower-specific configs (default = 1-hab rates)
INSERT INTO cotizador_configs (
  project_id, tower_id, unit_type, bedrooms, label,
  currency, enganche_pct, reserva_default, installment_months,
  round_enganche_q100, round_cuota_q100, round_cuota_q1, round_saldo_q100,
  bank_rates, bank_rate_labels, plazos_years,
  include_seguro_in_cuota, include_iusi_in_cuota, seguro_enabled, seguro_base, iusi_frequency,
  income_multiplier, income_base,
  inmueble_pct, timbres_rate, use_pretax_extraction,
  mantenimiento_per_m2, mantenimiento_label,
  disclaimers, validity_days, display_order
)
SELECT
  '019c7d10-8f5a-74c7-b3df-c2151ad8a376'::uuid,
  t.id, NULL, NULL,
  'Cotizador Benestare ' || t.name,
  'GTQ', 0.0500, 1500.00, 7,
  true, false, true, true,
  '{0.0500,0.0550,0.0726,0.0850}',
  '{"Mi primera Casa Tipo A","FHA Tipo B y C","Sin carencia FHA","Crédito directo"}',
  '{40,30,25,20}',
  false, true, false, 'price', 'monthly',
  2.00, 'cuota_banco',
  0.7000, 0.0300, true,
  NULL, NULL,
  '{"Precios sujetos a cambio sin previo aviso","Cotización válida 7 días","La reserva no es reembolsable","Metros cuadrados son aproximados","Imágenes son de referencia"}',
  7, 1
FROM towers t
WHERE t.project_id = '019c7d10-8f5a-74c7-b3df-c2151ad8a376'
  AND t.name IN ('Torre A', 'Torre B', 'Torre C', 'Torre D')
ON CONFLICT (project_id, tower_id, unit_type, bedrooms) DO NOTHING;

-- BLT — Bosque Las Tapias: Torre C (24 cuotas)
INSERT INTO cotizador_configs (
  project_id, tower_id, unit_type, bedrooms, label,
  currency, enganche_pct, reserva_default, installment_months,
  round_enganche_q100, round_cuota_q100, round_cuota_q1, round_saldo_q100,
  bank_rates, bank_rate_labels, plazos_years,
  include_seguro_in_cuota, include_iusi_in_cuota, seguro_enabled, seguro_base, iusi_frequency,
  income_multiplier, income_base,
  inmueble_pct, timbres_rate, use_pretax_extraction,
  mantenimiento_per_m2, mantenimiento_label,
  disclaimers, validity_days, display_order
)
SELECT
  '019c7d10-8ee5-7999-9881-2cd5ad038aa9'::uuid,
  t.id, NULL, NULL,
  'Cotizador BLT Torre C',
  'GTQ', 0.0700, 3000.00, 24,
  true, false, true, true,
  '{0.0550}',
  '{"FHA"}',
  '{30,25,20,15,10}',
  false, true, false, 'price', 'monthly',
  2.00, 'cuota_banco',
  0.7000, 0.0300, true,
  NULL, 'Pendiente',
  '{"Precios sujetos a cambio sin previo aviso","Cotización válida 7 días","La reserva no es reembolsable","Metros cuadrados son aproximados","Imágenes son de referencia"}',
  7, 2
FROM towers t
WHERE t.project_id = '019c7d10-8ee5-7999-9881-2cd5ad038aa9'
  AND t.name = 'Torre C'
ON CONFLICT (project_id, tower_id, unit_type, bedrooms) DO NOTHING;

-- BLT — Bosque Las Tapias: Torre B (28 cuotas)
INSERT INTO cotizador_configs (
  project_id, tower_id, unit_type, bedrooms, label,
  currency, enganche_pct, reserva_default, installment_months,
  round_enganche_q100, round_cuota_q100, round_cuota_q1, round_saldo_q100,
  bank_rates, bank_rate_labels, plazos_years,
  include_seguro_in_cuota, include_iusi_in_cuota, seguro_enabled, seguro_base, iusi_frequency,
  income_multiplier, income_base,
  inmueble_pct, timbres_rate, use_pretax_extraction,
  mantenimiento_per_m2, mantenimiento_label,
  disclaimers, validity_days, display_order
)
SELECT
  '019c7d10-8ee5-7999-9881-2cd5ad038aa9'::uuid,
  t.id, NULL, NULL,
  'Cotizador BLT Torre B',
  'GTQ', 0.0700, 3000.00, 28,
  true, false, true, true,
  '{0.0550}',
  '{"FHA"}',
  '{30,25,20,15,10}',
  false, true, false, 'price', 'monthly',
  2.00, 'cuota_banco',
  0.7000, 0.0300, true,
  NULL, 'Pendiente',
  '{"Precios sujetos a cambio sin previo aviso","Cotización válida 7 días","La reserva no es reembolsable","Metros cuadrados son aproximados","Imágenes son de referencia"}',
  7, 3
FROM towers t
WHERE t.project_id = '019c7d10-8ee5-7999-9881-2cd5ad038aa9'
  AND t.name = 'Torre B'
ON CONFLICT (project_id, tower_id, unit_type, bedrooms) DO NOTHING;

-- B5 — Boulevard 5: automático 2025 (project default)
INSERT INTO cotizador_configs (
  project_id, tower_id, unit_type, bedrooms, label,
  currency, enganche_pct, reserva_default, installment_months,
  round_enganche_q100, round_cuota_q100, round_cuota_q1, round_saldo_q100,
  bank_rates, bank_rate_labels, plazos_years,
  include_seguro_in_cuota, include_iusi_in_cuota, seguro_enabled, seguro_base, iusi_frequency,
  income_multiplier, income_base,
  inmueble_pct, timbres_rate, use_pretax_extraction,
  mantenimiento_per_m2, mantenimiento_label,
  disclaimers, validity_days, display_order
) VALUES (
  '019c7d10-8e01-720f-942f-cac0017d83a8',
  NULL, NULL, NULL,
  'Cotizador B5 automático 2025',
  'GTQ', 0.0700, 10000.00, 8,
  true, true, false, true,
  '{0.0726}',
  '{"FHA"}',
  '{30,25,20,15,10}',
  false, true, false, 'price', 'monthly',
  2.00, 'cuota_banco',
  0.7000, 0.0300, true,
  16.00, NULL,
  '{"Precios sujetos a cambio sin previo aviso","Cotización válida 7 días","La reserva no es reembolsable","Metros cuadrados son aproximados","Imágenes son de referencia"}',
  7, 4
) ON CONFLICT (project_id, tower_id, unit_type, bedrooms) DO NOTHING;

-- B5 — Boulevard 5: aptos Terraza (unit_type override)
INSERT INTO cotizador_configs (
  project_id, tower_id, unit_type, bedrooms, label,
  currency, enganche_pct, reserva_default, installment_months,
  round_enganche_q100, round_cuota_q100, round_cuota_q1, round_saldo_q100,
  bank_rates, bank_rate_labels, plazos_years,
  include_seguro_in_cuota, include_iusi_in_cuota, seguro_enabled, seguro_base, iusi_frequency,
  income_multiplier, income_base,
  inmueble_pct, timbres_rate, use_pretax_extraction,
  mantenimiento_per_m2, mantenimiento_label,
  disclaimers, validity_days, display_order
) VALUES (
  '019c7d10-8e01-720f-942f-cac0017d83a8',
  NULL, 'Terraza', NULL,
  'Cotizador B5 aptos Terraza',
  'GTQ', 0.0700, 10000.00, 7,
  false, true, false, true,
  '{0.0726}',
  '{"FHA"}',
  '{30,25,20,15,10}',
  false, true, false, 'price', 'monthly',
  2.00, 'cuota_banco',
  0.7000, 0.0300, true,
  16.00, NULL,
  '{"Precios sujetos a cambio sin previo aviso","Cotización válida 7 días","La reserva no es reembolsable","Metros cuadrados son aproximados","Imágenes son de referencia"}',
  7, 5
) ON CONFLICT (project_id, tower_id, unit_type, bedrooms) DO NOTHING;

-- CE — Casa Elisa: Automático (project default)
INSERT INTO cotizador_configs (
  project_id, tower_id, unit_type, bedrooms, label,
  currency, enganche_pct, reserva_default, installment_months,
  round_enganche_q100, round_cuota_q100, round_cuota_q1, round_saldo_q100,
  bank_rates, bank_rate_labels, plazos_years,
  include_seguro_in_cuota, include_iusi_in_cuota, seguro_enabled, seguro_base, iusi_frequency,
  income_multiplier, income_base,
  inmueble_pct, timbres_rate, use_pretax_extraction,
  mantenimiento_per_m2, mantenimiento_label,
  disclaimers, validity_days, display_order
) VALUES (
  '019c7d10-8e7b-7db6-93be-6f42d0538233',
  NULL, NULL, NULL,
  'Cotizador CE Automático',
  'GTQ', 0.0500, 5000.00, 1,
  false, false, false, false,
  '{0.0726}',
  '{"FHA"}',
  '{30,25,17,15,10}',
  false, true, false, 'price', 'monthly',
  2.00, 'cuota_mensual',
  0.7000, 0.0300, true,
  NULL, NULL,
  '{"Precios sujetos a cambio sin previo aviso","Cotización válida 7 días","La reserva no es reembolsable","Metros cuadrados son aproximados","Imágenes son de referencia"}',
  7, 6
) ON CONFLICT (project_id, tower_id, unit_type, bedrooms) DO NOTHING;

-- CE — Casa Elisa: 208 (unit-type override)
INSERT INTO cotizador_configs (
  project_id, tower_id, unit_type, bedrooms, label,
  currency, enganche_pct, reserva_default, installment_months,
  round_enganche_q100, round_cuota_q100, round_cuota_q1, round_saldo_q100,
  bank_rates, bank_rate_labels, plazos_years,
  include_seguro_in_cuota, include_iusi_in_cuota, seguro_enabled, seguro_base, iusi_frequency,
  income_multiplier, income_base,
  inmueble_pct, timbres_rate, use_pretax_extraction,
  mantenimiento_per_m2, mantenimiento_label,
  disclaimers, validity_days, display_order
) VALUES (
  '019c7d10-8e7b-7db6-93be-6f42d0538233',
  NULL, '208', NULL,
  'Cotizador CE 208',
  'GTQ', 0.1000, 5000.00, 2,
  false, false, false, false,
  '{0.0750}',
  '{"Banco"}',
  '{30,25,17,15,10}',
  false, true, true, 'price', 'monthly',
  2.50, 'cuota_mensual',
  0.7000, 0.0300, true,
  NULL, NULL,
  '{"Precios sujetos a cambio sin previo aviso","Cotización válida 7 días","La reserva no es reembolsable","Metros cuadrados son aproximados","Imágenes son de referencia"}',
  7, 7
) ON CONFLICT (project_id, tower_id, unit_type, bedrooms) DO NOTHING;

-- CE — Casa Elisa: Locales (commercial, 100% inmueble)
INSERT INTO cotizador_configs (
  project_id, tower_id, unit_type, bedrooms, label,
  currency, enganche_pct, reserva_default, installment_months,
  round_enganche_q100, round_cuota_q100, round_cuota_q1, round_saldo_q100,
  bank_rates, bank_rate_labels, plazos_years,
  include_seguro_in_cuota, include_iusi_in_cuota, seguro_enabled, seguro_base, iusi_frequency,
  income_multiplier, income_base,
  inmueble_pct, timbres_rate, use_pretax_extraction,
  mantenimiento_per_m2, mantenimiento_label,
  disclaimers, validity_days, display_order
) VALUES (
  '019c7d10-8e7b-7db6-93be-6f42d0538233',
  NULL, 'Local', NULL,
  'Cotizador CE Locales',
  'GTQ', 0.2000, 5000.00, 1,
  false, false, false, false,
  '{0.0750}',
  '{"Banco"}',
  '{1,5,10,20}',
  false, true, false, 'price', 'monthly',
  2.00, 'cuota_mensual',
  1.0000, 0.0000, true,
  NULL, NULL,
  '{"Precios sujetos a cambio sin previo aviso","Cotización válida 7 días","La reserva no es reembolsable","Metros cuadrados son aproximados","Imágenes son de referencia"}',
  7, 8
) ON CONFLICT (project_id, tower_id, unit_type, bedrooms) DO NOTHING;


-- =====================================================================
-- PHASE 5: 050 — BEN 3-hab configs
-- =====================================================================

INSERT INTO cotizador_configs (
  project_id, tower_id, unit_type, bedrooms, label,
  currency, enganche_pct, reserva_default, installment_months,
  round_enganche_q100, round_cuota_q100, round_cuota_q1, round_saldo_q100,
  bank_rates, bank_rate_labels, plazos_years,
  include_seguro_in_cuota, include_iusi_in_cuota, seguro_enabled, seguro_base, iusi_frequency,
  income_multiplier, income_base,
  inmueble_pct, timbres_rate, use_pretax_extraction,
  mantenimiento_per_m2, mantenimiento_label,
  disclaimers, validity_days, display_order
)
SELECT
  '019c7d10-8f5a-74c7-b3df-c2151ad8a376'::uuid,
  t.id, NULL, 3,
  'Cotizador Benestare ' || t.name || ' (3 hab)',
  'GTQ', 0.0500, 1500.00, 7,
  true, false, true, true,
  '{0.0550,0.0726,0.0750,0.0850}',
  '{"FHA Tipo B y C","Sin carencia FHA",NULL,"Crédito directo"}',
  '{40,30,25,20}',
  false, true, false, 'price', 'monthly',
  2.00, 'cuota_banco',
  0.7000, 0.0300, true,
  NULL, NULL,
  '{"Los precios de venta podrán sufrir cambios sin previo aviso","Aplican condiciones y restricciones"}',
  7, 10
FROM towers t
WHERE t.project_id = '019c7d10-8f5a-74c7-b3df-c2151ad8a376'
ON CONFLICT (project_id, tower_id, unit_type, bedrooms) DO NOTHING;


-- =====================================================================
-- PHASE 6: 049 — Santa Elena full seed
-- =====================================================================

DO $$
DECLARE
  v_project_id  uuid;
  v_tower_id    uuid;
  v_floor_id    uuid;
  v_sp_luccia   uuid;
  v_sp_junta    uuid;
  v_u1  uuid;  v_u2  uuid;  v_u6  uuid;  v_u7  uuid;  v_u11 uuid;
  v_r1  uuid;  v_r2  uuid;  v_r6  uuid;  v_r7  uuid;  v_r11 uuid;
  v_c_luisa uuid;  v_c_jorge uuid;  v_c_forma uuid;  v_c_paola uuid;  v_c_liza uuid;
BEGIN
  -- Guard: skip if Santa Elena already exists
  SELECT id INTO v_project_id FROM projects WHERE slug = 'santa-elena';
  IF v_project_id IS NOT NULL THEN
    RAISE NOTICE 'Santa Elena already exists (id=%), skipping seed', v_project_id;
    RETURN;
  END IF;

  -- 1. PROJECT
  INSERT INTO projects (name, slug)
  VALUES ('Santa Elena', 'santa-elena')
  RETURNING id INTO v_project_id;

  -- 2. TOWER
  INSERT INTO towers (project_id, name, is_default, delivery_date)
  VALUES (v_project_id, 'Principal', true, '2026-10-01')
  RETURNING id INTO v_tower_id;

  -- 3. FLOOR
  INSERT INTO floors (tower_id, number)
  VALUES (v_tower_id, 1)
  RETURNING id INTO v_floor_id;

  -- 4. SALESPEOPLE
  INSERT INTO salespeople (full_name, display_name)
  VALUES ('Luccia Calvo', 'Luccia')
  ON CONFLICT (full_name) DO NOTHING;

  SELECT id INTO v_sp_luccia FROM salespeople WHERE full_name = 'Luccia Calvo';
  IF v_sp_luccia IS NULL THEN
    RAISE EXCEPTION 'Failed to insert/find Luccia Calvo';
  END IF;

  SELECT id INTO v_sp_junta FROM salespeople WHERE full_name = 'Junta Directiva';
  IF v_sp_junta IS NULL THEN
    RAISE EXCEPTION 'Junta Directiva not found';
  END IF;

  INSERT INTO salesperson_project_assignments (id, salesperson_id, project_id, start_date, end_date, is_primary)
  VALUES (gen_random_uuid(), v_sp_luccia, v_project_id, '2025-01-01', NULL, true);

  INSERT INTO salesperson_project_assignments (id, salesperson_id, project_id, start_date, end_date, is_primary)
  VALUES (gen_random_uuid(), v_sp_junta, v_project_id, '2025-01-01', NULL, false);

  -- 5. UNITS
  INSERT INTO rv_units (floor_id, unit_number, unit_type, bedrooms, area_lot, area_total, price_list, valor_inmueble, status, status_changed_at)
  VALUES (v_floor_id, 'Casa 1', 'Modelo A', 0, 400.44, 491.91, 1065000.00, 682067.70, 'RESERVED'::rv_unit_status, '2025-01-17')
  RETURNING id INTO v_u1;
  INSERT INTO rv_units (floor_id, unit_number, unit_type, bedrooms, area_lot, area_total, price_list, valor_inmueble, status, status_changed_at)
  VALUES (v_floor_id, 'Casa 2', 'Modelo A', 0, 400.25, 491.91, 1090000.00, 698078.68, 'RESERVED'::rv_unit_status, '2025-02-28')
  RETURNING id INTO v_u2;
  INSERT INTO rv_units (floor_id, unit_number, unit_type, bedrooms, area_lot, area_total, price_list, valor_inmueble, status)
  VALUES (v_floor_id, 'Casa 3', 'Modelo B', 0, 386.00, 581.00, 1639500.00, 1050000.00, 'AVAILABLE'::rv_unit_status);
  INSERT INTO rv_units (floor_id, unit_number, unit_type, bedrooms, area_lot, area_total, price_list, valor_inmueble, status)
  VALUES (v_floor_id, 'Casa 4', 'Modelo B', 0, 398.38, 581.00, 1639500.00, 1050000.00, 'AVAILABLE'::rv_unit_status);
  INSERT INTO rv_units (floor_id, unit_number, unit_type, bedrooms, area_lot, area_total, price_list, valor_inmueble, status)
  VALUES (v_floor_id, 'Casa 5', 'Modelo A', 0, 399.20, 491.91, 1300000.00, 832570.91, 'AVAILABLE'::rv_unit_status);
  INSERT INTO rv_units (floor_id, unit_number, unit_type, bedrooms, area_lot, area_total, price_list, valor_inmueble, status, status_changed_at)
  VALUES (v_floor_id, 'Casa 6', 'Modelo B', 0, 386.00, 581.00, 1639500.00, 1050000.00, 'FROZEN'::rv_unit_status, '2025-06-01')
  RETURNING id INTO v_u6;
  INSERT INTO rv_units (floor_id, unit_number, unit_type, bedrooms, area_lot, area_total, price_list, valor_inmueble, status, status_changed_at)
  VALUES (v_floor_id, 'Casa 7', 'Modelo B', 0, 386.00, 581.00, 1639500.00, 1050000.00, 'RESERVED'::rv_unit_status, '2025-04-01')
  RETURNING id INTO v_u7;
  INSERT INTO rv_units (floor_id, unit_number, unit_type, bedrooms, area_lot, area_total, price_list, valor_inmueble, status)
  VALUES (v_floor_id, 'Casa 8', 'Modelo B', 0, 386.00, 581.00, 1639500.00, 1050000.00, 'AVAILABLE'::rv_unit_status);
  INSERT INTO rv_units (floor_id, unit_number, unit_type, bedrooms, area_lot, area_total, price_list, valor_inmueble, status)
  VALUES (v_floor_id, 'Casa 9', 'Modelo B', 0, 386.00, 581.00, 1639500.00, 1050000.00, 'AVAILABLE'::rv_unit_status);
  INSERT INTO rv_units (floor_id, unit_number, unit_type, bedrooms, area_lot, area_total, price_list, valor_inmueble, status)
  VALUES (v_floor_id, 'Casa 10', 'Modelo A', 0, 400.36, 491.91, 1300000.00, 832570.91, 'AVAILABLE'::rv_unit_status);
  INSERT INTO rv_units (floor_id, unit_number, unit_type, bedrooms, area_lot, area_total, price_list, valor_inmueble, status, status_changed_at)
  VALUES (v_floor_id, 'Casa 11', 'Modelo A', 0, 400.00, 491.91, 1095000.00, 701280.88, 'RESERVED'::rv_unit_status, '2025-01-18')
  RETURNING id INTO v_u11;

  -- 6. CLIENTS
  INSERT INTO rv_clients (full_name) VALUES ('Luisa Cana') RETURNING id INTO v_c_luisa;
  INSERT INTO rv_clients (full_name) VALUES ('Jorge Huertas') RETURNING id INTO v_c_jorge;
  INSERT INTO rv_clients (full_name) VALUES ('Forma Capital y 25 Avenida') RETURNING id INTO v_c_forma;
  INSERT INTO rv_clients (full_name) VALUES ('Paola Carpio') RETURNING id INTO v_c_paola;
  INSERT INTO rv_clients (full_name) VALUES ('Liza Johanna Castillo Beltranena') RETURNING id INTO v_c_liza;

  -- 7. RESERVATIONS
  INSERT INTO reservations (unit_id, salesperson_id, status, deposit_amount, deposit_date, lead_source, is_resale, created_at, reviewed_at)
  VALUES (v_u1, v_sp_luccia, 'CONFIRMED'::rv_reservation_status, 10000.00, '2025-01-17', 'Valla', false, '2025-01-17', '2025-01-17')
  RETURNING id INTO v_r1;
  INSERT INTO reservations (unit_id, salesperson_id, status, deposit_amount, deposit_date, lead_source, is_resale, created_at, reviewed_at)
  VALUES (v_u2, v_sp_luccia, 'CONFIRMED'::rv_reservation_status, 10000.00, '2025-02-28', 'Facebook', false, '2025-02-28', '2025-02-28')
  RETURNING id INTO v_r2;
  INSERT INTO reservations (unit_id, salesperson_id, status, deposit_amount, deposit_date, lead_source, is_resale, created_at, reviewed_at)
  VALUES (v_u7, v_sp_junta, 'CONFIRMED'::rv_reservation_status, 10000.00, '2025-04-01', NULL, false, '2025-04-01', '2025-04-01')
  RETURNING id INTO v_r7;
  INSERT INTO reservations (unit_id, salesperson_id, status, deposit_amount, deposit_date, lead_source, is_resale, created_at, reviewed_at)
  VALUES (v_u11, v_sp_luccia, 'CONFIRMED'::rv_reservation_status, 10000.00, '2025-01-18', 'Página Web', false, '2025-01-18', '2025-01-18')
  RETURNING id INTO v_r11;
  INSERT INTO reservations (unit_id, salesperson_id, status, deposit_amount, deposit_date, lead_source, is_resale, desistimiento_reason, desistimiento_date, created_at, reviewed_at)
  VALUES (v_u6, v_sp_luccia, 'DESISTED'::rv_reservation_status, 10000.00, '2025-04-03', 'Facebook', false, 'Sin registro en reporte de desistimientos', '2025-06-01', '2025-04-03', '2025-04-03')
  RETURNING id INTO v_r6;

  -- 8. RESERVATION_CLIENTS
  INSERT INTO reservation_clients (reservation_id, client_id, is_primary, role, document_order, signs_pcv)
  VALUES
    (v_r1, v_c_luisa, true, 'PROMITENTE_COMPRADOR'::rv_buyer_role, 1, true),
    (v_r2, v_c_jorge, true, 'PROMITENTE_COMPRADOR'::rv_buyer_role, 1, true),
    (v_r7, v_c_forma, true, 'PROMITENTE_COMPRADOR'::rv_buyer_role, 1, true),
    (v_r11, v_c_paola, true, 'PROMITENTE_COMPRADOR'::rv_buyer_role, 1, true),
    (v_r6, v_c_liza, true, 'PROMITENTE_COMPRADOR'::rv_buyer_role, 1, true);

  -- 9. UNIT STATUS LOG
  INSERT INTO unit_status_log (unit_id, old_status, new_status, changed_by, reservation_id, reason, created_at)
  VALUES
    (v_u1,  'AVAILABLE'::rv_unit_status, 'RESERVED'::rv_unit_status, 'system:se-seed', v_r1,  'Manual load from Disponibilidad SE', '2025-01-17'),
    (v_u2,  'AVAILABLE'::rv_unit_status, 'RESERVED'::rv_unit_status, 'system:se-seed', v_r2,  'Manual load from Disponibilidad SE', '2025-02-28'),
    (v_u7,  'AVAILABLE'::rv_unit_status, 'RESERVED'::rv_unit_status, 'system:se-seed', v_r7,  'Manual load from Disponibilidad SE', '2025-04-01'),
    (v_u11, 'AVAILABLE'::rv_unit_status, 'RESERVED'::rv_unit_status, 'system:se-seed', v_r11, 'Manual load from Disponibilidad SE', '2025-01-18');

  INSERT INTO unit_status_log (unit_id, old_status, new_status, changed_by, reservation_id, reason, created_at)
  VALUES
    (v_u6, 'AVAILABLE'::rv_unit_status, 'RESERVED'::rv_unit_status, 'system:se-seed', v_r6, 'Reservation by Liza Castillo', '2025-04-03'),
    (v_u6, 'RESERVED'::rv_unit_status, 'AVAILABLE'::rv_unit_status, 'system:se-seed', v_r6, 'Desistimiento (date approximate)', '2025-06-01'),
    (v_u6, 'AVAILABLE'::rv_unit_status, 'FROZEN'::rv_unit_status, 'system:se-seed', NULL, 'Congelada por Junta Directiva post-desistimiento', '2025-06-01');

  -- 10. FREEZE REQUEST
  INSERT INTO freeze_requests (unit_id, salesperson_id, reason, status, created_at)
  VALUES (v_u6, v_sp_junta, 'Unidad congelada por Junta Directiva post-desistimiento', 'ACTIVE'::rv_freeze_request_status, '2025-06-01');

  -- 11. COTIZADOR CONFIG — Santa Elena default
  INSERT INTO cotizador_configs (
    project_id, tower_id, unit_type, bedrooms, label, currency,
    enganche_pct, reserva_default, installment_months,
    round_enganche_q100, round_cuota_q100, round_cuota_q1, round_saldo_q100,
    bank_rates, bank_rate_labels, plazos_years,
    include_seguro_in_cuota, include_iusi_in_cuota,
    seguro_enabled, seguro_base, iusi_frequency,
    income_multiplier, income_base,
    inmueble_pct, timbres_rate, use_pretax_extraction,
    mantenimiento_per_m2, mantenimiento_label,
    disclaimers, validity_days, display_order, is_active
  ) VALUES (
    v_project_id, NULL, NULL, NULL, 'Santa Elena — Default', 'USD',
    0.3000, 10000.00, 15,
    false, false, false, false,
    ARRAY[0.0850]::numeric(6,4)[], ARRAY['Crédito directo']::text[], ARRAY[25, 20, 15, 10, 5]::integer[],
    true, false,
    true, 'price', 'quarterly',
    2.00, 'cuota_mensual',
    0.7000, 0.0300, true,
    NULL, 'Pendiente',
    ARRAY[
      'Precio y disponibilidad sujetos a cambio sin previo aviso.',
      'Reserva no es reembolsable en caso de desistimiento.',
      'Cuota mensual es de referencia y podrá variar según institución financiera.',
      'Si es necesario financiamiento bancario el enganche mínimo a pagar es un 30%.'
    ]::text[],
    7, 0, true
  );

END $$;

-- Lead source 'Valla' (used by SE)
INSERT INTO lead_sources (name, display_order)
VALUES ('Valla', 17)
ON CONFLICT (name) DO NOTHING;


-- =====================================================================
-- VERIFICATION QUERIES (read-only, returns counts)
-- =====================================================================
SELECT 'v_cesion_derechos' AS view_name, count(*) AS rows FROM v_cesion_derechos
UNION ALL
SELECT 'cotizador_configs', count(*) FROM cotizador_configs
UNION ALL
SELECT 'v_rv_units_full', count(*) FROM v_rv_units_full
UNION ALL
SELECT 'SE units', count(*) FROM v_rv_units_full WHERE project_slug = 'santa-elena';
