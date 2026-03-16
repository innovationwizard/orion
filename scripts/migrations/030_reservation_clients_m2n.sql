-- Migration 030: Enrich reservation_clients for M:N buyer-unit support
--
-- Adds role, ownership_pct, legal_capacity, document_order, signs_pcv
-- to the junction table. Backfills existing 682 rows from is_primary.
-- Updates v_reservations_pending view (appends client_count column).
-- Updates submit_reservation RPC to set role + document_order.
--
-- See: memory/m2m-buyer-unit-analysis.md, memory/m2m-implementation-plan.md

-- ---------------------------------------------------------------------------
-- 1. Create enum type
-- ---------------------------------------------------------------------------

DO $$ BEGIN
  CREATE TYPE rv_buyer_role AS ENUM (
    'PROMITENTE_COMPRADOR',
    'CO_COMPRADOR',
    'REPRESENTANTE_LEGAL',
    'GARANTE'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ---------------------------------------------------------------------------
-- 2. Add columns to reservation_clients
-- ---------------------------------------------------------------------------

ALTER TABLE reservation_clients
  ADD COLUMN IF NOT EXISTS role rv_buyer_role NOT NULL DEFAULT 'PROMITENTE_COMPRADOR',
  ADD COLUMN IF NOT EXISTS ownership_pct numeric(5,2) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS legal_capacity text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS document_order smallint NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS signs_pcv boolean NOT NULL DEFAULT true;

-- ---------------------------------------------------------------------------
-- 3. Constraints
-- ---------------------------------------------------------------------------

DO $$ BEGIN
  ALTER TABLE reservation_clients
    ADD CONSTRAINT rc_ownership_pct_range
      CHECK (ownership_pct IS NULL OR (ownership_pct > 0 AND ownership_pct <= 100));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE reservation_clients
    ADD CONSTRAINT rc_document_order_positive
      CHECK (document_order > 0);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ---------------------------------------------------------------------------
-- 4. Backfill existing data
-- ---------------------------------------------------------------------------

-- 4a. Set role and document_order from is_primary
UPDATE reservation_clients
SET role = CASE WHEN is_primary THEN 'PROMITENTE_COMPRADOR'::rv_buyer_role ELSE 'CO_COMPRADOR'::rv_buyer_role END,
    document_order = CASE WHEN is_primary THEN 1 ELSE 2 END;

-- 4b. Single-buyer reservations: 100%
UPDATE reservation_clients rc
SET ownership_pct = 100.00
FROM (
  SELECT reservation_id
  FROM reservation_clients
  GROUP BY reservation_id
  HAVING count(*) = 1
) s
WHERE rc.reservation_id = s.reservation_id;

-- 4c. Multi-buyer reservations: equal split (Guatemala Civil Code Art. 485)
UPDATE reservation_clients rc
SET ownership_pct = ROUND(100.00 / cnt.total, 2)
FROM (
  SELECT reservation_id, count(*) AS total
  FROM reservation_clients
  GROUP BY reservation_id
  HAVING count(*) > 1
) cnt
WHERE rc.reservation_id = cnt.reservation_id;

-- ---------------------------------------------------------------------------
-- 5. Update v_reservations_pending view — append client_count at end
--    PostgreSQL CREATE OR REPLACE VIEW cannot reorder columns; new columns
--    must be appended after all existing ones.
-- ---------------------------------------------------------------------------

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
  count(rc.id) AS client_count
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

-- ---------------------------------------------------------------------------
-- 6. Update submit_reservation RPC — set role + document_order
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION submit_reservation(
  p_unit_id         uuid,
  p_salesperson_id  uuid,
  p_client_names    text[],
  p_client_phone    text,
  p_deposit_amount  numeric,
  p_deposit_date    date,
  p_deposit_bank    text,
  p_receipt_type    rv_receipt_type,
  p_depositor_name  text,
  p_receipt_image_url text,
  p_lead_source     text,
  p_notes           text,
  p_dpi_image_url   text DEFAULT NULL
) RETURNS uuid AS $$
DECLARE
  v_reservation_id uuid;
  v_unit_status    rv_unit_status;
  v_client_id      uuid;
  v_client_name    text;
  v_is_first       boolean := true;
  v_is_resale      boolean := false;
  v_client_index   smallint := 1;
BEGIN
  -- Acquire exclusive lock on the unit row
  SELECT status INTO v_unit_status
  FROM rv_units WHERE id = p_unit_id FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Unit not found: %', p_unit_id;
  END IF;

  -- Validate state transition
  IF v_unit_status NOT IN ('AVAILABLE', 'FROZEN') THEN
    RAISE EXCEPTION 'Unidad no disponible. Estado actual: %', v_unit_status;
  END IF;

  -- Detect resale: was this unit previously sold and desisted?
  SELECT EXISTS(
    SELECT 1 FROM reservations
    WHERE unit_id = p_unit_id AND status = 'DESISTED'
  ) INTO v_is_resale;

  -- Create the reservation record
  INSERT INTO reservations (
    unit_id, salesperson_id, status, deposit_amount,
    deposit_date, deposit_bank, receipt_type, depositor_name,
    receipt_image_url, dpi_image_url, lead_source, notes, is_resale
  ) VALUES (
    p_unit_id, p_salesperson_id, 'PENDING_REVIEW', p_deposit_amount,
    p_deposit_date, p_deposit_bank, p_receipt_type, p_depositor_name,
    p_receipt_image_url, p_dpi_image_url, p_lead_source, p_notes, v_is_resale
  ) RETURNING id INTO v_reservation_id;

  -- Create client records and link to reservation
  FOREACH v_client_name IN ARRAY p_client_names LOOP
    IF length(trim(v_client_name)) = 0 THEN
      CONTINUE;
    END IF;

    INSERT INTO rv_clients (full_name, phone)
    VALUES (trim(v_client_name), CASE WHEN v_is_first THEN p_client_phone ELSE NULL END)
    RETURNING id INTO v_client_id;

    INSERT INTO reservation_clients (
      reservation_id, client_id, is_primary, role, document_order
    ) VALUES (
      v_reservation_id,
      v_client_id,
      v_is_first,
      CASE WHEN v_is_first THEN 'PROMITENTE_COMPRADOR'::rv_buyer_role ELSE 'CO_COMPRADOR'::rv_buyer_role END,
      v_client_index
    );

    v_is_first := false;
    v_client_index := v_client_index + 1;
  END LOOP;

  -- Transition unit: → SOFT_HOLD
  UPDATE rv_units SET
    status = 'SOFT_HOLD',
    status_changed_at = now()
  WHERE id = p_unit_id;

  -- Audit trail
  INSERT INTO unit_status_log (unit_id, old_status, new_status, changed_by, reservation_id)
  VALUES (p_unit_id, v_unit_status, 'SOFT_HOLD', 'salesperson:' || p_salesperson_id, v_reservation_id);

  RETURN v_reservation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
