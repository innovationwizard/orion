-- ============================================================================
-- Migration 049: Santa Elena — Schema addition + full project seed
-- ============================================================================
-- Source files:
--   Reservas/Santa Elena/Disponibilidad.xlsx          (current inventory, 11 units)
--   Reservas/Santa Elena/ReporteSANTAELENA.xlsx       (sales log, 4 sales)
--   Disponibilidad.xlsx > "Cotizador Automático" tab  (cotizador config params)
--
-- Santa Elena is a horizontal housing project (casas, not apartments).
-- Currency: USD. Units: 11 (Casas 1–11), 2 models (A: 491.91m², B: 581m²).
-- Status: 4 RESERVED (1,2,7,11), 6 AVAILABLE (3,4,5,8,9,10), 1 FROZEN (6).
-- Reservations: 4 CONFIRMED + 1 DESISTED (Casa 6, Liza Castillo).
-- New salesperson: Luccia Calvo. Junta Directiva already in DB.
--
-- Schema change: adds area_lot column to rv_units (lot/plot area for
-- horizontal projects). Appends to v_rv_units_full view.
--
-- Data quality notes:
--   • Report lists Paola Carpio on "Casa 10" but current Disponibilidad shows
--     her on Casa 11. Disponibilidad is authoritative (user-confirmed).
--   • Casa 7 reservation date (2025-04-01) from cotizador installment plan
--     start — Casa 7 is not in the sales report tabs.
--   • Casa 6 desistimiento date (2025-06-01) is approximate: report
--     "Desistimiento" sheet is empty; May 2025 snapshot still shows Reservada.
--   • Bedroom count not available in source Excel; set to 0 (unknown).
-- ============================================================================


-- ---------------------------------------------------------------------------
-- 0. SCHEMA: add area_lot column to rv_units
-- ---------------------------------------------------------------------------
-- Lot/plot area in m². Relevant for horizontal projects (casas with individual
-- lots). NULL for vertical projects (apartments) where lot area is shared.

ALTER TABLE rv_units ADD COLUMN IF NOT EXISTS area_lot numeric(10,2);

COMMENT ON COLUMN rv_units.area_lot IS 'Lot/plot area in m² (horizontal projects). NULL for apartments.';

-- Update v_rv_units_full: append area_lot at END (after valor_inmueble).
-- Preserves exact column order from 047 (last definition).
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
  u.valor_inmueble,
  -- 049: appended column for lot/plot area (horizontal projects)
  u.area_lot
FROM rv_units u
  JOIN floors f  ON f.id = u.floor_id
  JOIN towers t  ON t.id = f.tower_id
  JOIN projects p ON p.id = t.project_id;


-- ---------------------------------------------------------------------------
-- 1–12. SEED DATA (inside DO block for variable scoping)
-- ---------------------------------------------------------------------------

DO $$
DECLARE
  v_project_id  uuid;
  v_tower_id    uuid;
  v_floor_id    uuid;
  v_sp_luccia   uuid;
  v_sp_junta    uuid;
  -- Unit IDs for units that need reservations or freeze
  v_u1  uuid;
  v_u2  uuid;
  v_u6  uuid;
  v_u7  uuid;
  v_u11 uuid;
  -- Reservation IDs
  v_r1  uuid;
  v_r2  uuid;
  v_r6  uuid;
  v_r7  uuid;
  v_r11 uuid;
  -- Client IDs
  v_c_luisa uuid;
  v_c_jorge uuid;
  v_c_forma uuid;
  v_c_paola uuid;
  v_c_liza  uuid;
BEGIN

  -- ==========================================================================
  -- 1. PROJECT
  -- ==========================================================================
  INSERT INTO projects (name, slug)
  VALUES ('Santa Elena', 'santa-elena')
  RETURNING id INTO v_project_id;

  -- ==========================================================================
  -- 2. TOWER (single tower for horizontal housing project)
  -- ==========================================================================
  INSERT INTO towers (project_id, name, is_default, delivery_date)
  VALUES (v_project_id, 'Principal', true, '2026-10-01')
  RETURNING id INTO v_tower_id;

  -- ==========================================================================
  -- 3. FLOOR (single floor — all houses are ground level)
  -- ==========================================================================
  INSERT INTO floors (tower_id, number)
  VALUES (v_tower_id, 1)
  RETURNING id INTO v_floor_id;

  -- ==========================================================================
  -- 4. SALESPEOPLE
  -- ==========================================================================
  -- Luccia Calvo: new salesperson (all 4 organic SE sales)
  INSERT INTO salespeople (full_name, display_name)
  VALUES ('Luccia Calvo', 'Luccia')
  ON CONFLICT (full_name) DO NOTHING;

  SELECT id INTO v_sp_luccia FROM salespeople WHERE full_name = 'Luccia Calvo';
  IF v_sp_luccia IS NULL THEN
    RAISE EXCEPTION 'Failed to insert/find Luccia Calvo in salespeople';
  END IF;

  -- Junta Directiva: already exists (board-level reservations/freezes)
  SELECT id INTO v_sp_junta FROM salespeople WHERE full_name = 'Junta Directiva';
  IF v_sp_junta IS NULL THEN
    RAISE EXCEPTION 'Junta Directiva not found in salespeople';
  END IF;

  -- Assign Luccia to SE (primary)
  INSERT INTO salesperson_project_assignments (id, salesperson_id, project_id, start_date, end_date, is_primary)
  VALUES (gen_random_uuid(), v_sp_luccia, v_project_id, '2025-01-01', NULL, true);

  -- Assign Junta Directiva to SE (non-primary)
  INSERT INTO salesperson_project_assignments (id, salesperson_id, project_id, start_date, end_date, is_primary)
  VALUES (gen_random_uuid(), v_sp_junta, v_project_id, '2025-01-01', NULL, false);

  -- ==========================================================================
  -- 5. UNITS — 11 houses (Casas 1–11)
  -- ==========================================================================
  -- bedrooms = 0: source Excel does not include bedroom data.
  -- area_lot: from Disponibilidad col D ("Tamaño Lote M²").
  -- area_total: from Disponibilidad col E ("Tamaño Casa M²") = construction area.
  -- valor_inmueble = 0.70 × precio_sin_impuestos (col F), verified via IUSI.

  -- Casa 1: Modelo A, lot 400.44m², house 491.91m², $1,065,000, RESERVED
  INSERT INTO rv_units (floor_id, unit_number, unit_type, bedrooms, area_lot, area_total, price_list, valor_inmueble, status, status_changed_at)
  VALUES (v_floor_id, 'Casa 1', 'Modelo A', 0, 400.44, 491.91, 1065000.00, 682067.70, 'RESERVED'::rv_unit_status, '2025-01-17')
  RETURNING id INTO v_u1;

  -- Casa 2: Modelo A, lot 400.25m², house 491.91m², $1,090,000, RESERVED
  INSERT INTO rv_units (floor_id, unit_number, unit_type, bedrooms, area_lot, area_total, price_list, valor_inmueble, status, status_changed_at)
  VALUES (v_floor_id, 'Casa 2', 'Modelo A', 0, 400.25, 491.91, 1090000.00, 698078.68, 'RESERVED'::rv_unit_status, '2025-02-28')
  RETURNING id INTO v_u2;

  -- Casa 3: Modelo B, lot 386m², house 581m², $1,639,500, AVAILABLE
  INSERT INTO rv_units (floor_id, unit_number, unit_type, bedrooms, area_lot, area_total, price_list, valor_inmueble, status)
  VALUES (v_floor_id, 'Casa 3', 'Modelo B', 0, 386.00, 581.00, 1639500.00, 1050000.00, 'AVAILABLE'::rv_unit_status);

  -- Casa 4: Modelo B, lot 398.38m², house 581m², $1,639,500, AVAILABLE
  INSERT INTO rv_units (floor_id, unit_number, unit_type, bedrooms, area_lot, area_total, price_list, valor_inmueble, status)
  VALUES (v_floor_id, 'Casa 4', 'Modelo B', 0, 398.38, 581.00, 1639500.00, 1050000.00, 'AVAILABLE'::rv_unit_status);

  -- Casa 5: Modelo A, lot 399.2m², house 491.91m², $1,300,000, AVAILABLE
  INSERT INTO rv_units (floor_id, unit_number, unit_type, bedrooms, area_lot, area_total, price_list, valor_inmueble, status)
  VALUES (v_floor_id, 'Casa 5', 'Modelo A', 0, 399.20, 491.91, 1300000.00, 832570.91, 'AVAILABLE'::rv_unit_status);

  -- Casa 6: Modelo B, lot 386m², house 581m², $1,639,500, FROZEN (post-desistimiento)
  INSERT INTO rv_units (floor_id, unit_number, unit_type, bedrooms, area_lot, area_total, price_list, valor_inmueble, status, status_changed_at)
  VALUES (v_floor_id, 'Casa 6', 'Modelo B', 0, 386.00, 581.00, 1639500.00, 1050000.00, 'FROZEN'::rv_unit_status, '2025-06-01')
  RETURNING id INTO v_u6;

  -- Casa 7: Modelo B, lot 386m², house 581m², $1,639,500, RESERVED
  INSERT INTO rv_units (floor_id, unit_number, unit_type, bedrooms, area_lot, area_total, price_list, valor_inmueble, status, status_changed_at)
  VALUES (v_floor_id, 'Casa 7', 'Modelo B', 0, 386.00, 581.00, 1639500.00, 1050000.00, 'RESERVED'::rv_unit_status, '2025-04-01')
  RETURNING id INTO v_u7;

  -- Casa 8: Modelo B, lot 386m², house 581m², $1,639,500, AVAILABLE
  INSERT INTO rv_units (floor_id, unit_number, unit_type, bedrooms, area_lot, area_total, price_list, valor_inmueble, status)
  VALUES (v_floor_id, 'Casa 8', 'Modelo B', 0, 386.00, 581.00, 1639500.00, 1050000.00, 'AVAILABLE'::rv_unit_status);

  -- Casa 9: Modelo B, lot 386m², house 581m², $1,639,500, AVAILABLE
  INSERT INTO rv_units (floor_id, unit_number, unit_type, bedrooms, area_lot, area_total, price_list, valor_inmueble, status)
  VALUES (v_floor_id, 'Casa 9', 'Modelo B', 0, 386.00, 581.00, 1639500.00, 1050000.00, 'AVAILABLE'::rv_unit_status);

  -- Casa 10: Modelo A, lot 400.36m², house 491.91m², $1,300,000, AVAILABLE
  INSERT INTO rv_units (floor_id, unit_number, unit_type, bedrooms, area_lot, area_total, price_list, valor_inmueble, status)
  VALUES (v_floor_id, 'Casa 10', 'Modelo A', 0, 400.36, 491.91, 1300000.00, 832570.91, 'AVAILABLE'::rv_unit_status);

  -- Casa 11: Modelo A, lot 400m², house 491.91m², $1,095,000, RESERVED
  INSERT INTO rv_units (floor_id, unit_number, unit_type, bedrooms, area_lot, area_total, price_list, valor_inmueble, status, status_changed_at)
  VALUES (v_floor_id, 'Casa 11', 'Modelo A', 0, 400.00, 491.91, 1095000.00, 701280.88, 'RESERVED'::rv_unit_status, '2025-01-18')
  RETURNING id INTO v_u11;

  -- ==========================================================================
  -- 6. CLIENTS
  -- ==========================================================================
  -- Names from current Disponibilidad.xlsx (authoritative per user).
  -- Casa 6 client from ReporteSANTAELENA (historical, desisted).

  INSERT INTO rv_clients (full_name) VALUES ('Luisa Cana') RETURNING id INTO v_c_luisa;
  INSERT INTO rv_clients (full_name) VALUES ('Jorge Huertas') RETURNING id INTO v_c_jorge;
  INSERT INTO rv_clients (full_name) VALUES ('Forma Capital y 25 Avenida') RETURNING id INTO v_c_forma;
  INSERT INTO rv_clients (full_name) VALUES ('Paola Carpio') RETURNING id INTO v_c_paola;
  INSERT INTO rv_clients (full_name) VALUES ('Liza Johanna Castillo Beltranena') RETURNING id INTO v_c_liza;

  -- ==========================================================================
  -- 7. RESERVATIONS — 4 CONFIRMED + 1 DESISTED
  -- ==========================================================================
  -- Deposit = $10,000 USD (standard SE reserva).
  -- Lead sources from ReporteSANTAELENA sales log.

  -- Casa 1: Luisa Cana, Jan 17 2025, Valla, Luccia Calvo → CONFIRMED
  INSERT INTO reservations (
    unit_id, salesperson_id, status, deposit_amount, deposit_date,
    lead_source, is_resale, created_at, reviewed_at
  ) VALUES (
    v_u1, v_sp_luccia, 'CONFIRMED'::rv_reservation_status,
    10000.00, '2025-01-17', 'Valla', false,
    '2025-01-17', '2025-01-17'
  ) RETURNING id INTO v_r1;

  -- Casa 2: Jorge Huertas, Feb 28 2025, Facebook, Luccia Calvo → CONFIRMED
  INSERT INTO reservations (
    unit_id, salesperson_id, status, deposit_amount, deposit_date,
    lead_source, is_resale, created_at, reviewed_at
  ) VALUES (
    v_u2, v_sp_luccia, 'CONFIRMED'::rv_reservation_status,
    10000.00, '2025-02-28', 'Facebook', false,
    '2025-02-28', '2025-02-28'
  ) RETURNING id INTO v_r2;

  -- Casa 7: Forma Capital y 25 Avenida, ~Apr 2025, Junta Directiva → CONFIRMED
  -- Date from cotizador installment plan start (not in sales report).
  INSERT INTO reservations (
    unit_id, salesperson_id, status, deposit_amount, deposit_date,
    lead_source, is_resale, created_at, reviewed_at
  ) VALUES (
    v_u7, v_sp_junta, 'CONFIRMED'::rv_reservation_status,
    10000.00, '2025-04-01', NULL, false,
    '2025-04-01', '2025-04-01'
  ) RETURNING id INTO v_r7;

  -- Casa 11: Paola Carpio, Jan 18 2025, Página Web, Luccia Calvo → CONFIRMED
  -- Report lists as Casa 10; Disponibilidad (truth) shows Paola on Casa 11.
  INSERT INTO reservations (
    unit_id, salesperson_id, status, deposit_amount, deposit_date,
    lead_source, is_resale, created_at, reviewed_at
  ) VALUES (
    v_u11, v_sp_luccia, 'CONFIRMED'::rv_reservation_status,
    10000.00, '2025-01-18', 'Página Web', false,
    '2025-01-18', '2025-01-18'
  ) RETURNING id INTO v_r11;

  -- Casa 6: Liza Castillo, Apr 3 2025, Facebook, Luccia Calvo → DESISTED
  -- Desistimiento date approximate (after May 2025 snapshot).
  -- Report "Desistimiento" sheet is empty — reason not documented.
  INSERT INTO reservations (
    unit_id, salesperson_id, status, deposit_amount, deposit_date,
    lead_source, is_resale,
    desistimiento_reason, desistimiento_date,
    created_at, reviewed_at
  ) VALUES (
    v_u6, v_sp_luccia, 'DESISTED'::rv_reservation_status,
    10000.00, '2025-04-03', 'Facebook', false,
    'Sin registro en reporte de desistimientos', '2025-06-01',
    '2025-04-03', '2025-04-03'
  ) RETURNING id INTO v_r6;

  -- ==========================================================================
  -- 8. RESERVATION_CLIENTS — link clients to reservations
  -- ==========================================================================

  INSERT INTO reservation_clients (reservation_id, client_id, is_primary, role, document_order, signs_pcv)
  VALUES (v_r1, v_c_luisa, true, 'PROMITENTE_COMPRADOR'::rv_buyer_role, 1, true);

  INSERT INTO reservation_clients (reservation_id, client_id, is_primary, role, document_order, signs_pcv)
  VALUES (v_r2, v_c_jorge, true, 'PROMITENTE_COMPRADOR'::rv_buyer_role, 1, true);

  INSERT INTO reservation_clients (reservation_id, client_id, is_primary, role, document_order, signs_pcv)
  VALUES (v_r7, v_c_forma, true, 'PROMITENTE_COMPRADOR'::rv_buyer_role, 1, true);

  INSERT INTO reservation_clients (reservation_id, client_id, is_primary, role, document_order, signs_pcv)
  VALUES (v_r11, v_c_paola, true, 'PROMITENTE_COMPRADOR'::rv_buyer_role, 1, true);

  INSERT INTO reservation_clients (reservation_id, client_id, is_primary, role, document_order, signs_pcv)
  VALUES (v_r6, v_c_liza, true, 'PROMITENTE_COMPRADOR'::rv_buyer_role, 1, true);

  -- ==========================================================================
  -- 9. UNIT STATUS LOG — audit trail
  -- ==========================================================================

  -- Casas 1, 2, 7, 11: AVAILABLE → RESERVED
  INSERT INTO unit_status_log (unit_id, old_status, new_status, changed_by, reservation_id, reason, created_at)
  VALUES
    (v_u1,  'AVAILABLE'::rv_unit_status, 'RESERVED'::rv_unit_status, 'system:se-seed', v_r1,  'Manual load from Disponibilidad SE', '2025-01-17'),
    (v_u2,  'AVAILABLE'::rv_unit_status, 'RESERVED'::rv_unit_status, 'system:se-seed', v_r2,  'Manual load from Disponibilidad SE', '2025-02-28'),
    (v_u7,  'AVAILABLE'::rv_unit_status, 'RESERVED'::rv_unit_status, 'system:se-seed', v_r7,  'Manual load from Disponibilidad SE', '2025-04-01'),
    (v_u11, 'AVAILABLE'::rv_unit_status, 'RESERVED'::rv_unit_status, 'system:se-seed', v_r11, 'Manual load from Disponibilidad SE', '2025-01-18');

  -- Casa 6: AVAILABLE → RESERVED → AVAILABLE (desist) → FROZEN
  INSERT INTO unit_status_log (unit_id, old_status, new_status, changed_by, reservation_id, reason, created_at)
  VALUES
    (v_u6, 'AVAILABLE'::rv_unit_status, 'RESERVED'::rv_unit_status, 'system:se-seed', v_r6,
     'Reservation by Liza Castillo', '2025-04-03'),
    (v_u6, 'RESERVED'::rv_unit_status, 'AVAILABLE'::rv_unit_status, 'system:se-seed', v_r6,
     'Desistimiento (date approximate)', '2025-06-01'),
    (v_u6, 'AVAILABLE'::rv_unit_status, 'FROZEN'::rv_unit_status, 'system:se-seed', NULL,
     'Congelada por Junta Directiva post-desistimiento', '2025-06-01');

  -- ==========================================================================
  -- 10. FREEZE REQUEST — Casa 6
  -- ==========================================================================
  INSERT INTO freeze_requests (unit_id, salesperson_id, reason, status, created_at)
  VALUES (v_u6, v_sp_junta, 'Unidad congelada por Junta Directiva post-desistimiento',
          'ACTIVE'::rv_freeze_request_status, '2025-06-01');

  -- ==========================================================================
  -- 11. COTIZADOR CONFIG — Santa Elena default
  -- ==========================================================================
  -- Parameters from "Cotizador Automático" sheet in Disponibilidad.xlsx.
  -- Single config row (no tower/unit_type variants for SE).
  -- Verified: bank rate 8.50% back-calculated from PMT values.
  -- Verified: seguro rate 0.35% on total price ($478.19/mo for $1,639,500).
  -- Verified: IUSI = valor_inmueble × 0.9% / 12 (quarterly display).
  -- Verified: income = 2× cuota_mensual (banco + seguro).
  -- Verified: escrituración 70/30 with pre-tax extraction (÷1.093).
  INSERT INTO cotizador_configs (
    project_id, tower_id, unit_type, label, currency,
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
    v_project_id, NULL, NULL, 'Santa Elena — Default', 'USD',
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

-- ==========================================================================
-- 12. LEAD SOURCE — 'Valla' (used by SE, not in seed 046)
-- ==========================================================================
INSERT INTO lead_sources (name, display_order)
VALUES ('Valla', 17)
ON CONFLICT (name) DO NOTHING;
