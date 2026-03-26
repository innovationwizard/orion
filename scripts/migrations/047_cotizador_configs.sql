-- ============================================================================
-- Migration 047: Per-project cotizador configuration
-- ============================================================================
-- Creates cotizador_configs table with one row per Excel cotizador tab.
-- Each row stores the full set of financial parameters (enganche %, reserva,
-- installments, bank rates, plazos, rounding rules, IUSI/seguro treatment,
-- income multiplier, escrituracion split, mantenimiento, disclaimers).
--
-- Also appends valor_inmueble to v_rv_units_full (needed for IUSI base calc).
-- Santa Elena is DEFERRED — not seeded (data not loaded to DB).
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. cotizador_configs table
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS cotizador_configs (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id        uuid NOT NULL REFERENCES projects(id),
  tower_id          uuid REFERENCES towers(id),
  unit_type         text,
  label             text NOT NULL,

  -- Currency
  currency          text NOT NULL DEFAULT 'GTQ',

  -- Enganche
  enganche_pct      numeric(5,4) NOT NULL,
  reserva_default   numeric(14,2) NOT NULL,
  installment_months integer NOT NULL,

  -- Rounding rules
  round_enganche_q100  boolean NOT NULL DEFAULT false,
  round_cuota_q100     boolean NOT NULL DEFAULT false,
  round_cuota_q1       boolean NOT NULL DEFAULT false,
  round_saldo_q100     boolean NOT NULL DEFAULT false,

  -- Bank financing
  bank_rates        numeric(6,4)[] NOT NULL,
  bank_rate_labels  text[],
  plazos_years      integer[] NOT NULL,

  -- Cuota mensual composition
  include_seguro_in_cuota boolean NOT NULL DEFAULT false,
  include_iusi_in_cuota   boolean NOT NULL DEFAULT true,
  seguro_enabled          boolean NOT NULL DEFAULT false,
  seguro_base             text NOT NULL DEFAULT 'price',
  iusi_frequency          text NOT NULL DEFAULT 'monthly',

  -- Income requirement
  income_multiplier     numeric(4,2) NOT NULL DEFAULT 2.00,
  income_base           text NOT NULL DEFAULT 'cuota_banco',

  -- Escrituracion
  inmueble_pct          numeric(5,4) NOT NULL DEFAULT 0.7000,
  timbres_rate          numeric(5,4) NOT NULL DEFAULT 0.0300,
  use_pretax_extraction boolean NOT NULL DEFAULT true,

  -- Mantenimiento
  mantenimiento_per_m2  numeric(8,2),
  mantenimiento_label   text,

  -- Disclaimers
  disclaimers           text[],
  validity_days         integer DEFAULT 7,

  -- Metadata
  is_active       boolean NOT NULL DEFAULT true,
  display_order   integer NOT NULL DEFAULT 0,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now(),

  UNIQUE(project_id, tower_id, unit_type)
);

COMMENT ON TABLE cotizador_configs IS
  'Per-project/tower/unit-type cotizador configuration. Each row mirrors one real Excel cotizador tab.';

-- RLS: all authenticated read, admin write
ALTER TABLE cotizador_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY cotizador_configs_read ON cotizador_configs
  FOR SELECT TO authenticated USING (true);

CREATE POLICY cotizador_configs_write ON cotizador_configs
  FOR ALL TO authenticated
  USING (jwt_role() IN ('master', 'torredecontrol'))
  WITH CHECK (jwt_role() IN ('master', 'torredecontrol'));

-- ---------------------------------------------------------------------------
-- 2. Seed — values extracted from real Excel cotizador tabs
-- ---------------------------------------------------------------------------
-- Source: Reservas/*/Disponibilidad.xlsx → "Cotizador" tabs
-- Verified in: docs/cotizador-diff-report-2026-03-26.md
-- ---------------------------------------------------------------------------

-- BEN — Benestare: 4 tower-specific configs (TA, TB, TC, TD)
-- All BEN towers share identical params (extracted from Excel TA, verified TB/TC/TD identical)
INSERT INTO cotizador_configs (
  project_id, tower_id, unit_type, label,
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
  '019c7d10-8f5a-74c7-b3df-c2151ad8a376'::uuid, -- BEN project_id
  t.id, NULL,
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
  AND t.name IN ('Torre A', 'Torre B', 'Torre C', 'Torre D');

-- BLT — Bosque Las Tapias: Torre C (24 cuotas)
INSERT INTO cotizador_configs (
  project_id, tower_id, unit_type, label,
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
  t.id, NULL,
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
  AND t.name = 'Torre C';

-- BLT — Bosque Las Tapias: Torre B (28 cuotas)
INSERT INTO cotizador_configs (
  project_id, tower_id, unit_type, label,
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
  t.id, NULL,
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
  AND t.name = 'Torre B';

-- B5 — Boulevard 5: automático 2025 (project default)
INSERT INTO cotizador_configs (
  project_id, tower_id, unit_type, label,
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
  NULL, NULL,
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
);

-- B5 — Boulevard 5: aptos Terraza (unit_type override)
INSERT INTO cotizador_configs (
  project_id, tower_id, unit_type, label,
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
  NULL, 'Terraza',
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
);

-- CE — Casa Elisa: Automático (project default)
INSERT INTO cotizador_configs (
  project_id, tower_id, unit_type, label,
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
  NULL, NULL,
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
);

-- CE — Casa Elisa: 208 (unit-type override)
INSERT INTO cotizador_configs (
  project_id, tower_id, unit_type, label,
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
  NULL, '208',
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
);

-- CE — Casa Elisa: Locales (commercial, 100% inmueble)
INSERT INTO cotizador_configs (
  project_id, tower_id, unit_type, label,
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
  NULL, 'Local',
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
);

-- ---------------------------------------------------------------------------
-- 3. Append valor_inmueble to v_rv_units_full view
-- ---------------------------------------------------------------------------
-- valor_inmueble (added in 042 on rv_units table) is needed as IUSI base
-- in cotizador calculations. Must be appended at END of SELECT (PostgreSQL
-- view column ordering constraint).
-- ---------------------------------------------------------------------------

-- Preserves column order from 029 (last deployed), appends valor_inmueble at END.
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
  -- 029: appended columns
  u.parking_car_area,
  u.parking_tandem_area,
  u.bodega_area,
  -- 047: appended column for cotizador IUSI base
  u.valor_inmueble
FROM rv_units u
  JOIN floors f  ON f.id = u.floor_id
  JOIN towers t  ON t.id = f.tower_id
  JOIN projects p ON p.id = t.project_id;
