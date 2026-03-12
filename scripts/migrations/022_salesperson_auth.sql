-- Migration 022: Salesperson Auth + DPI Image Support
-- Date: 2026-03-12
-- Purpose: Link salespeople to Supabase Auth, add project assignments,
--          add DPI image URL to reservations, create DPI storage bucket.

BEGIN;

-- ============================================================================
-- 1. Link salespeople to Supabase Auth users
-- ============================================================================

ALTER TABLE salespeople ADD COLUMN IF NOT EXISTS user_id uuid UNIQUE REFERENCES auth.users(id);
CREATE INDEX IF NOT EXISTS idx_salespeople_user_id ON salespeople(user_id);


-- ============================================================================
-- 2. Salesperson ↔ Project junction table
-- ============================================================================

CREATE TABLE IF NOT EXISTS salesperson_projects (
  salesperson_id uuid NOT NULL REFERENCES salespeople(id) ON DELETE CASCADE,
  project_id     uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  created_at     timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (salesperson_id, project_id)
);

ALTER TABLE salesperson_projects ENABLE ROW LEVEL SECURITY;

-- Salespeople can read their own project assignments
CREATE POLICY "Salespeople read own assignments"
  ON salesperson_projects FOR SELECT TO authenticated
  USING (
    salesperson_id IN (
      SELECT id FROM salespeople WHERE user_id = auth.uid()
    )
  );

-- Admin roles can manage all assignments
CREATE POLICY "Admins manage all assignments"
  ON salesperson_projects FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
        AND raw_app_meta_data->>'role' IN ('master', 'gerencia', 'inventario')
    )
  );

-- Service role bypass (for API routes using admin client)
CREATE POLICY "Service role full access on salesperson_projects"
  ON salesperson_projects FOR ALL TO service_role
  USING (true) WITH CHECK (true);


-- ============================================================================
-- 3. DPI image URL on reservations
-- ============================================================================

ALTER TABLE reservations ADD COLUMN IF NOT EXISTS dpi_image_url text;


-- ============================================================================
-- 4. Update submit_reservation to accept DPI image URL
-- ============================================================================

CREATE OR REPLACE FUNCTION submit_reservation(
  p_unit_id           uuid,
  p_salesperson_id    uuid,
  p_client_names      text[],
  p_client_phone      text,
  p_deposit_amount    numeric,
  p_deposit_date      date,
  p_deposit_bank      text,
  p_receipt_type      rv_receipt_type,
  p_depositor_name    text,
  p_receipt_image_url text,
  p_lead_source       text,
  p_notes             text,
  p_dpi_image_url     text DEFAULT NULL
) RETURNS uuid AS $$
DECLARE
  v_reservation_id uuid;
  v_unit_status    rv_unit_status;
  v_client_id      uuid;
  v_client_name    text;
  v_is_first       boolean := true;
  v_is_resale      boolean := false;
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
    receipt_image_url, lead_source, notes, is_resale, dpi_image_url
  ) VALUES (
    p_unit_id, p_salesperson_id, 'PENDING_REVIEW', p_deposit_amount,
    p_deposit_date, p_deposit_bank, p_receipt_type, p_depositor_name,
    p_receipt_image_url, p_lead_source, p_notes, v_is_resale, p_dpi_image_url
  ) RETURNING id INTO v_reservation_id;

  -- Create client records and link to reservation
  FOREACH v_client_name IN ARRAY p_client_names LOOP
    IF length(trim(v_client_name)) = 0 THEN
      CONTINUE;
    END IF;

    INSERT INTO rv_clients (full_name, phone)
    VALUES (trim(v_client_name), CASE WHEN v_is_first THEN p_client_phone ELSE NULL END)
    RETURNING id INTO v_client_id;

    INSERT INTO reservation_clients (reservation_id, client_id, is_primary)
    VALUES (v_reservation_id, v_client_id, v_is_first);

    v_is_first := false;
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


-- ============================================================================
-- 5. DPI Storage bucket
-- ============================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'dpi',
  'dpi',
  false,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic']
) ON CONFLICT (id) DO NOTHING;

-- Authenticated users can upload DPI images
CREATE POLICY "Authenticated users upload DPI"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'dpi');

-- Authenticated users can read DPI images (admin review)
CREATE POLICY "Authenticated users read DPI"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'dpi');

-- Update receipts bucket: restrict uploads to authenticated users only
-- (Previously was open to anyone for the public form; now /reservar requires auth)
DROP POLICY IF EXISTS "Anyone can upload receipts" ON storage.objects;
CREATE POLICY "Authenticated users upload receipts"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'receipts');


-- ============================================================================
-- 6. View: add dpi_image_url to pending reservations view
--    (matches existing structure from 018, adds dpi_image_url column)
-- ============================================================================

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
  r.dpi_image_url
FROM reservations r
JOIN rv_units u        ON u.id = r.unit_id
JOIN floors f          ON f.id = u.floor_id
JOIN towers t          ON t.id = f.tower_id
JOIN projects p        ON p.id = t.project_id
JOIN salespeople s     ON s.id = r.salesperson_id
LEFT JOIN receipt_extractions re ON re.reservation_id = r.id
LEFT JOIN reservation_clients rc ON rc.reservation_id = r.id
LEFT JOIN rv_clients c ON c.id = rc.client_id
WHERE r.status = 'PENDING_REVIEW'
GROUP BY
  r.id, r.status, r.deposit_amount, r.deposit_date, r.deposit_bank,
  r.receipt_type, r.depositor_name, r.receipt_image_url,
  r.lead_source, r.notes, r.is_resale, r.created_at,
  u.unit_number, u.unit_code, u.unit_type, u.bedrooms, u.price_list,
  f.number, t.name, t.is_default, p.name, p.slug,
  s.full_name, s.id,
  re.extracted_amount, re.extracted_date, re.extracted_bank, re.confidence,
  r.dpi_image_url
ORDER BY r.created_at ASC;

COMMIT;
