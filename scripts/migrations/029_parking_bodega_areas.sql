-- Migration 029: Add parking area columns, populate from SSOT, fix bodega data
--
-- Root cause: seed_prod.py extracted parking COUNTS and LOCATIONS but never
-- parking AREAS (m²). The columns parking_car_area and parking_tandem_area
-- existed in TypeScript types but were never created in the database.
-- Also: B5 bodega_area was seeded as 5.0 instead of the correct 5.3,
-- and CE bodega_area was never populated at all.
--
-- Source data: SSOT/Reservas y Ventas/{project}/Disponibilidad*.xlsx
--   B5: "Cesion de derechos" sheet → 12.5 m² simple, 25.0 m² tandem, 5.3 m² bodega
--   CE: "Disponibilidad" sheet → 12.5 m² simple, variable bodega (1.78–4.9 m²)
--   BLT/BEN: parking area not in SSOT — left NULL

-- ---------------------------------------------------------------------------
-- 1. Add new columns
-- ---------------------------------------------------------------------------

ALTER TABLE rv_units
  ADD COLUMN IF NOT EXISTS parking_car_area numeric,
  ADD COLUMN IF NOT EXISTS parking_tandem_area numeric;

-- ---------------------------------------------------------------------------
-- 2. Boulevard 5 — parking areas (fixed: 12.5 simple, 25.0 tandem)
-- ---------------------------------------------------------------------------

UPDATE rv_units u
SET parking_car_area = 12.5
FROM floors f
JOIN towers t ON f.tower_id = t.id
JOIN projects p ON t.project_id = p.id
WHERE u.floor_id = f.id
  AND p.slug = 'boulevard-5'
  AND u.parking_car > 0;

UPDATE rv_units u
SET parking_tandem_area = 25.0
FROM floors f
JOIN towers t ON f.tower_id = t.id
JOIN projects p ON t.project_id = p.id
WHERE u.floor_id = f.id
  AND p.slug = 'boulevard-5'
  AND u.parking_tandem > 0;

-- ---------------------------------------------------------------------------
-- 3. Boulevard 5 — fix bodega_area: 5.0 → 5.3 (per SSOT)
-- ---------------------------------------------------------------------------

UPDATE rv_units u
SET bodega_area = 5.3
FROM floors f
JOIN towers t ON f.tower_id = t.id
JOIN projects p ON t.project_id = p.id
WHERE u.floor_id = f.id
  AND p.slug = 'boulevard-5'
  AND u.bodega_area IS NOT NULL;

-- ---------------------------------------------------------------------------
-- 4. Casa Elisa — parking areas (fixed: 12.5 simple, no tandem)
-- ---------------------------------------------------------------------------

UPDATE rv_units u
SET parking_car_area = 12.5
FROM floors f
JOIN towers t ON f.tower_id = t.id
JOIN projects p ON t.project_id = p.id
WHERE u.floor_id = f.id
  AND p.slug = 'casa-elisa'
  AND u.parking_car > 0;

-- ---------------------------------------------------------------------------
-- 5. Casa Elisa — bodega areas (variable per unit, from SSOT Disponibilidad)
-- ---------------------------------------------------------------------------

-- Units with 3.0 m² bodegas (most common)
UPDATE rv_units u
SET bodega_area = 3.0
FROM floors f
JOIN towers t ON f.tower_id = t.id
JOIN projects p ON t.project_id = p.id
WHERE u.floor_id = f.id
  AND p.slug = 'casa-elisa'
  AND u.unit_number IN ('101','102','103','104','105','203','306','707','902','903','907','1002','1003');

-- Unit 303: bodega_area = 1.78
UPDATE rv_units u
SET bodega_area = 1.78
FROM floors f
JOIN towers t ON f.tower_id = t.id
JOIN projects p ON t.project_id = p.id
WHERE u.floor_id = f.id
  AND p.slug = 'casa-elisa'
  AND u.unit_number = '303';

-- Unit 603: bodega_area = 2.26
UPDATE rv_units u
SET bodega_area = 2.26
FROM floors f
JOIN towers t ON f.tower_id = t.id
JOIN projects p ON t.project_id = p.id
WHERE u.floor_id = f.id
  AND p.slug = 'casa-elisa'
  AND u.unit_number = '603';

-- Unit 803: bodega_area = 1.89
UPDATE rv_units u
SET bodega_area = 1.89
FROM floors f
JOIN towers t ON f.tower_id = t.id
JOIN projects p ON t.project_id = p.id
WHERE u.floor_id = f.id
  AND p.slug = 'casa-elisa'
  AND u.unit_number = '803';

-- Unit 506: bodega_number + area were missing from seed (bodegas #14+15 combined)
UPDATE rv_units u
SET bodega_number = '14', bodega_area = 4.9
FROM floors f
JOIN towers t ON f.tower_id = t.id
JOIN projects p ON t.project_id = p.id
WHERE u.floor_id = f.id
  AND p.slug = 'casa-elisa'
  AND u.unit_number = '506';

-- Unit 403: bodega_area is empty in SSOT (cell never filled) — left NULL
-- Needs manual verification with Pati

-- ---------------------------------------------------------------------------
-- 6. Update view to include parking areas and bodega_area
-- ---------------------------------------------------------------------------

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
  u.bodega_area
FROM rv_units u
  JOIN floors f ON f.id = u.floor_id
  JOIN towers t ON t.id = f.tower_id
  JOIN projects p ON p.id = t.project_id;
