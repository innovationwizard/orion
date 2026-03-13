-- ============================================================================
-- Migration 023: Cesion de Derechos — rv_units columns + cross-domain view
-- Date: 2026-03-12
-- Purpose: Add parking area, price_suggested, cesion flag, PCV block,
--          precalificacion, razon_compra, tipo_cliente to rv_units.
--          Update v_rv_units_full. Create v_cesion_derechos cross-domain view
--          joining rv_units with payment_compliance.
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. New columns on rv_units
-- ============================================================================

-- Universal unit attributes (useful for any project)
ALTER TABLE rv_units ADD COLUMN IF NOT EXISTS parking_car_area    numeric(10,2);
ALTER TABLE rv_units ADD COLUMN IF NOT EXISTS parking_tandem_area numeric(10,2);
ALTER TABLE rv_units ADD COLUMN IF NOT EXISTS price_suggested     numeric(14,2);

-- Cesion de Derechos program flag
ALTER TABLE rv_units ADD COLUMN IF NOT EXISTS is_cesion boolean NOT NULL DEFAULT false;

-- PCV signing block (1-4)
ALTER TABLE rv_units ADD COLUMN IF NOT EXISTS pcv_block integer;

-- Bank prequalification tracking
ALTER TABLE rv_units ADD COLUMN IF NOT EXISTS precalificacion_status text;
ALTER TABLE rv_units ADD COLUMN IF NOT EXISTS precalificacion_notes  text;

-- Denormalized classification (avoids multi-domain JOINs for cesion dashboard)
ALTER TABLE rv_units ADD COLUMN IF NOT EXISTS razon_compra text;
ALTER TABLE rv_units ADD COLUMN IF NOT EXISTS tipo_cliente text;

-- ============================================================================
-- 2. Indexes
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_rv_units_is_cesion
  ON rv_units(is_cesion) WHERE is_cesion = true;

CREATE INDEX IF NOT EXISTS idx_rv_units_pcv_block
  ON rv_units(pcv_block) WHERE pcv_block IS NOT NULL;

-- ============================================================================
-- 3. Update v_rv_units_full — append new columns at END
--    (PostgreSQL cannot reorder columns in CREATE OR REPLACE VIEW)
-- ============================================================================

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
  -- 023: cesion de derechos columns
  u.parking_car_area,
  u.parking_tandem_area,
  u.price_suggested,
  u.is_cesion,
  u.pcv_block,
  u.precalificacion_status,
  u.precalificacion_notes,
  u.razon_compra,
  u.tipo_cliente
FROM rv_units u
JOIN floors f   ON f.id = u.floor_id
JOIN towers t   ON t.id = f.tower_id
JOIN projects p ON p.id = t.project_id;

-- ============================================================================
-- 4. Cross-domain view: v_cesion_derechos
--    Bridges rv_units (physical data) with payment_compliance (financial data)
--    via (project_id, unit_number).
-- ============================================================================

CREATE OR REPLACE VIEW v_cesion_derechos WITH (security_invoker = true) AS
SELECT
  -- Unit identity
  u.id                        AS unit_id,
  u.unit_number,
  u.unit_type,
  u.status                    AS unit_status,
  -- Area
  u.area_interior,
  u.area_terrace,
  u.area_total,
  u.parking_car,
  u.parking_tandem,
  u.parking_car_area,
  u.parking_tandem_area,
  u.bodega_area,
  -- Pricing
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
  -- Cesion classification
  u.pcv_block,
  u.precalificacion_status,
  u.precalificacion_notes,
  u.razon_compra,
  u.tipo_cliente,
  -- Project context
  p.id                        AS project_id,
  p.name                      AS project_name,
  p.slug                      AS project_slug,
  -- Financial (from analytics domain via payment_compliance)
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

COMMIT;
