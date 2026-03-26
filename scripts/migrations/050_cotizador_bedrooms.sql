-- ============================================================================
-- Migration 050: Bedroom-based cotizador configs (Benestare)
-- ============================================================================
-- Adds optional `bedrooms` column to cotizador_configs so rates can vary by
-- bedroom count. Business rule (Benestare):
--   1 hab  → 5.00%, 5.50%, 7.26%, 8.50%
--   3 hab  → 5.50%, 7.26%, 7.50%, 8.50%
--
-- Existing tower-level configs (bedrooms IS NULL) serve as the default.
-- Bedroom-specific configs take priority in the resolution chain.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Add bedrooms column
-- ---------------------------------------------------------------------------

ALTER TABLE cotizador_configs ADD COLUMN IF NOT EXISTS bedrooms integer;

-- Drop old unique and create new one including bedrooms
ALTER TABLE cotizador_configs
  DROP CONSTRAINT IF EXISTS cotizador_configs_project_id_tower_id_unit_type_key;

ALTER TABLE cotizador_configs
  ADD CONSTRAINT cotizador_configs_project_tower_type_bed_uniq
  UNIQUE (project_id, tower_id, unit_type, bedrooms);

COMMENT ON COLUMN cotizador_configs.bedrooms IS
  'Optional bedroom count filter. When set, this config only applies to units with this bedroom count. NULL = applies to all bedroom counts (default).';

-- ---------------------------------------------------------------------------
-- 2. Insert BEN 3-hab configs (one per tower)
-- ---------------------------------------------------------------------------
-- Existing BEN tower-level configs (bedrooms=NULL) already have the correct
-- 1-hab rates (5.00, 5.50, 7.26, 8.50). We add 3-hab overrides.

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
  '019c7d10-8f5a-74c7-b3df-c2151ad8a376'::uuid, -- BEN project_id
  t.id, NULL, 3,  -- tower_id, no unit_type filter, bedrooms=3
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
ORDER BY t.name;
