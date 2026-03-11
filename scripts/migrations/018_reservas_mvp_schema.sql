-- ============================================================================
-- 018 — RESERVAS MVP Schema
-- ============================================================================
-- Multi-Project Real-Time Inventory & Reserve Intake System
-- Projects: Bosque Las Tapias, Casa Elisa, Benestare, Boulevard 5
--
-- INTEGRATION NOTES (existing analytics DB):
--   • Table `projects` already exists → ALTER to add slug, updated_at
--   • Table `units` already exists (analytics) → new table `rv_units` (inventory)
--   • Table `clients` already exists (analytics) → new table `rv_clients` (reservation)
--   • All other tables are new and use scaffolding names directly
--   • Enum types prefixed with rv_ to avoid conflicts
--   • Views/functions reference rv_units and rv_clients
--
-- Design principles:
--   • UUID-first identity
--   • Enum types — domain integrity at the type level
--   • Atomic state transitions — PL/pgSQL functions with row-level locking
--   • Append-only audit trail
--   • Partial unique indexes — prevent double-booking without blocking history
--   • RLS — public read for availability, authenticated write for admin ops
-- ============================================================================


-- ----------------------------------------------------------------------------
-- 1. CUSTOM TYPES (rv_ prefixed to avoid conflicts)
-- ----------------------------------------------------------------------------

DO $$ BEGIN
  CREATE TYPE rv_unit_status AS ENUM (
    'AVAILABLE',
    'SOFT_HOLD',
    'RESERVED',
    'FROZEN',
    'SOLD'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE rv_reservation_status AS ENUM (
    'PENDING_REVIEW',
    'CONFIRMED',
    'REJECTED',
    'DESISTED'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE rv_receipt_type AS ENUM (
    'TRANSFER',
    'DEPOSIT_SLIP',
    'NEOLINK',
    'MOBILE_SCREENSHOT',
    'CHECK',
    'OTHER'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE rv_extraction_confidence AS ENUM (
    'HIGH',
    'MEDIUM',
    'LOW'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE rv_freeze_request_status AS ENUM (
    'ACTIVE',
    'RELEASED'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;


-- ----------------------------------------------------------------------------
-- 2. ALTER EXISTING TABLES
-- ----------------------------------------------------------------------------

-- projects: add slug and updated_at to existing table
ALTER TABLE projects ADD COLUMN IF NOT EXISTS slug text;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- Populate slugs for existing projects (lowercase, hyphenated)
UPDATE projects
SET slug = lower(replace(replace(trim(name), ' ', '-'), '.', ''))
WHERE slug IS NULL;

-- Now enforce constraints
DO $$ BEGIN
  ALTER TABLE projects ALTER COLUMN slug SET NOT NULL;
EXCEPTION WHEN others THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE projects ADD CONSTRAINT projects_slug_unique UNIQUE (slug);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE projects ADD CONSTRAINT projects_slug_not_empty CHECK (length(trim(slug)) > 0);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_projects_slug ON projects (slug);


-- ----------------------------------------------------------------------------
-- 3. NEW TABLES
-- ----------------------------------------------------------------------------

-- Towers: organizational grouping within a project
CREATE TABLE IF NOT EXISTS towers (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id    uuid NOT NULL REFERENCES projects(id) ON DELETE RESTRICT,
  name          text NOT NULL,
  is_default    boolean NOT NULL DEFAULT false,
  delivery_date date,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT towers_project_name_unique UNIQUE (project_id, name),
  CONSTRAINT towers_name_not_empty CHECK (length(trim(name)) > 0)
);

CREATE INDEX IF NOT EXISTS idx_towers_project_id ON towers (project_id);

-- Enforce: at most one default tower per project
CREATE UNIQUE INDEX IF NOT EXISTS idx_towers_one_default_per_project
  ON towers (project_id) WHERE is_default = true;


-- Floors: physical level within a tower
CREATE TABLE IF NOT EXISTS floors (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tower_id   uuid NOT NULL REFERENCES towers(id) ON DELETE RESTRICT,
  number     integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT floors_tower_number_unique UNIQUE (tower_id, number),
  CONSTRAINT floors_number_positive CHECK (number > 0)
);

CREATE INDEX IF NOT EXISTS idx_floors_tower_id ON floors (tower_id);


-- rv_units: the reservable inventory (named rv_units to avoid conflict with analytics units)
CREATE TABLE IF NOT EXISTS rv_units (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  floor_id         uuid NOT NULL REFERENCES floors(id) ON DELETE RESTRICT,
  unit_number      text NOT NULL,
  unit_code        text,
  unit_type        text NOT NULL,
  bedrooms         integer NOT NULL,
  is_local         boolean NOT NULL DEFAULT false,
  area_interior    numeric(10,2),
  area_balcony     numeric(10,2),
  area_terrace     numeric(10,2),
  area_garden      numeric(10,2),
  area_total       numeric(10,2),
  parking_car      integer NOT NULL DEFAULT 0,
  parking_tandem   integer NOT NULL DEFAULT 0,
  parking_moto     integer NOT NULL DEFAULT 0,
  parking_type     text,
  parking_number   text,
  parking_level    text,
  bodega_number    text,
  bodega_area      numeric(10,2),
  price_list       numeric(14,2),
  status           rv_unit_status NOT NULL DEFAULT 'AVAILABLE',
  status_detail    text,
  status_changed_at timestamptz,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT rv_units_floor_number_unique UNIQUE (floor_id, unit_number),
  CONSTRAINT rv_units_unit_number_not_empty CHECK (length(trim(unit_number)) > 0),
  CONSTRAINT rv_units_unit_type_not_empty CHECK (length(trim(unit_type)) > 0),
  CONSTRAINT rv_units_bedrooms_non_negative CHECK (bedrooms >= 0),
  CONSTRAINT rv_units_parking_non_negative CHECK (
    parking_car >= 0 AND parking_tandem >= 0 AND parking_moto >= 0
  ),
  CONSTRAINT rv_units_locals_zero_bedrooms CHECK (
    (is_local = false) OR (is_local = true AND bedrooms = 0)
  )
);

CREATE INDEX IF NOT EXISTS idx_rv_units_floor_id ON rv_units (floor_id);
CREATE INDEX IF NOT EXISTS idx_rv_units_status ON rv_units (status);
CREATE INDEX IF NOT EXISTS idx_rv_units_unit_code ON rv_units (unit_code) WHERE unit_code IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_rv_units_floor_status ON rv_units (floor_id, status);


-- Salespeople: shared pool across all projects
CREATE TABLE IF NOT EXISTS salespeople (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name    text NOT NULL,
  display_name text NOT NULL,
  phone        text,
  email        text,
  is_active    boolean NOT NULL DEFAULT true,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT salespeople_full_name_unique UNIQUE (full_name),
  CONSTRAINT salespeople_full_name_not_empty CHECK (length(trim(full_name)) > 0),
  CONSTRAINT salespeople_display_name_not_empty CHECK (length(trim(display_name)) > 0)
);

CREATE INDEX IF NOT EXISTS idx_salespeople_active ON salespeople (is_active) WHERE is_active = true;


-- rv_clients: created at reservation time (named rv_clients to avoid conflict with analytics clients)
CREATE TABLE IF NOT EXISTS rv_clients (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name  text NOT NULL,
  phone      text,
  email      text,
  dpi        text,
  notes      text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT rv_clients_full_name_not_empty CHECK (length(trim(full_name)) > 0)
);


-- Reservations: the core business event
CREATE TABLE IF NOT EXISTS reservations (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id               uuid NOT NULL REFERENCES rv_units(id) ON DELETE RESTRICT,
  salesperson_id        uuid NOT NULL REFERENCES salespeople(id) ON DELETE RESTRICT,
  status                rv_reservation_status NOT NULL DEFAULT 'PENDING_REVIEW',
  deposit_amount        numeric(14,2),
  deposit_date          date,
  deposit_bank          text,
  receipt_type          rv_receipt_type,
  depositor_name        text,
  receipt_image_url     text,
  notes                 text,
  lead_source           text,
  is_resale             boolean NOT NULL DEFAULT false,
  desistimiento_reason  text,
  desistimiento_date    date,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now(),
  reviewed_at           timestamptz,
  reviewed_by           uuid,
  rejection_reason      text,

  CONSTRAINT reservations_desist_fields CHECK (
    (status != 'DESISTED') OR
    (status = 'DESISTED' AND desistimiento_reason IS NOT NULL AND desistimiento_date IS NOT NULL)
  ),
  CONSTRAINT reservations_rejection_fields CHECK (
    (status != 'REJECTED') OR
    (status = 'REJECTED' AND rejection_reason IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS idx_reservations_unit_id ON reservations (unit_id);
CREATE INDEX IF NOT EXISTS idx_reservations_salesperson_id ON reservations (salesperson_id);
CREATE INDEX IF NOT EXISTS idx_reservations_status ON reservations (status);
CREATE INDEX IF NOT EXISTS idx_reservations_created_at ON reservations (created_at DESC);

-- Prevent double-booking: only one active reservation per unit
CREATE UNIQUE INDEX IF NOT EXISTS idx_reservations_one_active_per_unit
  ON reservations (unit_id)
  WHERE status IN ('PENDING_REVIEW', 'CONFIRMED');


-- Reservation <-> Client junction (M:N — supports multiple buyers per unit)
CREATE TABLE IF NOT EXISTS reservation_clients (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id uuid NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
  client_id      uuid NOT NULL REFERENCES rv_clients(id) ON DELETE RESTRICT,
  is_primary     boolean NOT NULL DEFAULT false,
  created_at     timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT reservation_clients_unique UNIQUE (reservation_id, client_id)
);

CREATE INDEX IF NOT EXISTS idx_reservation_clients_reservation ON reservation_clients (reservation_id);
CREATE INDEX IF NOT EXISTS idx_reservation_clients_client ON reservation_clients (client_id);


-- Receipt OCR extractions: one per reservation, stores raw Claude response
CREATE TABLE IF NOT EXISTS receipt_extractions (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id         uuid NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
  raw_response           jsonb NOT NULL,
  extracted_amount       numeric(14,2),
  extracted_date         date,
  extracted_bank         text,
  extracted_ref          text,
  extracted_depositor    text,
  extracted_receipt_type rv_receipt_type,
  confidence             rv_extraction_confidence,
  created_at             timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT receipt_extractions_one_per_reservation UNIQUE (reservation_id)
);


-- Unit status audit log: append-only, never modified, never deleted
CREATE TABLE IF NOT EXISTS unit_status_log (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id        uuid NOT NULL REFERENCES rv_units(id) ON DELETE RESTRICT,
  old_status     rv_unit_status,
  new_status     rv_unit_status NOT NULL,
  changed_by     text NOT NULL,
  reservation_id uuid REFERENCES reservations(id) ON DELETE SET NULL,
  reason         text,
  created_at     timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT unit_status_log_changed_by_not_empty CHECK (length(trim(changed_by)) > 0)
);

CREATE INDEX IF NOT EXISTS idx_unit_status_log_unit_id ON unit_status_log (unit_id, created_at DESC);


-- Freeze requests: VIP holds without deposit
CREATE TABLE IF NOT EXISTS freeze_requests (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id        uuid NOT NULL REFERENCES rv_units(id) ON DELETE RESTRICT,
  salesperson_id uuid NOT NULL REFERENCES salespeople(id) ON DELETE RESTRICT,
  reason         text NOT NULL,
  vip_name       text,
  status         rv_freeze_request_status NOT NULL DEFAULT 'ACTIVE',
  released_at    timestamptz,
  released_by    uuid,
  created_at     timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT freeze_requests_reason_not_empty CHECK (length(trim(reason)) > 0),
  CONSTRAINT freeze_requests_release_fields CHECK (
    (status != 'RELEASED') OR
    (status = 'RELEASED' AND released_at IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS idx_freeze_requests_unit_id ON freeze_requests (unit_id);
CREATE INDEX IF NOT EXISTS idx_freeze_requests_status ON freeze_requests (status) WHERE status = 'ACTIVE';


-- ----------------------------------------------------------------------------
-- 4. EXTENSIONS
-- ----------------------------------------------------------------------------

CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- GIN trigram index for fuzzy client name search (after extension is created)
CREATE INDEX IF NOT EXISTS idx_rv_clients_full_name ON rv_clients USING gin (full_name gin_trgm_ops);


-- ----------------------------------------------------------------------------
-- 5. AUTOMATIC TIMESTAMP TRIGGERS
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Only create triggers if they don't already exist
DO $$ BEGIN
  CREATE TRIGGER set_updated_at_projects
    BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TRIGGER set_updated_at_towers
    BEFORE UPDATE ON towers
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TRIGGER set_updated_at_rv_units
    BEFORE UPDATE ON rv_units
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TRIGGER set_updated_at_salespeople
    BEFORE UPDATE ON salespeople
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TRIGGER set_updated_at_rv_clients
    BEFORE UPDATE ON rv_clients
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TRIGGER set_updated_at_reservations
    BEFORE UPDATE ON reservations
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;


-- ----------------------------------------------------------------------------
-- 6. ATOMIC BUSINESS FUNCTIONS
-- ----------------------------------------------------------------------------
-- These are the ONLY way unit status changes. No direct UPDATE allowed via API.
-- All use row-level locking (FOR UPDATE) to prevent race conditions.
-- All log to unit_status_log for complete audit trail.
-- ----------------------------------------------------------------------------

-- 6.1 Submit a new reservation (salesperson form → SOFT_HOLD)
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
  p_notes           text
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
    receipt_image_url, lead_source, notes, is_resale
  ) VALUES (
    p_unit_id, p_salesperson_id, 'PENDING_REVIEW', p_deposit_amount,
    p_deposit_date, p_deposit_bank, p_receipt_type, p_depositor_name,
    p_receipt_image_url, p_lead_source, p_notes, v_is_resale
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


-- 6.2 Confirm reservation (admin → RESERVED)
CREATE OR REPLACE FUNCTION confirm_reservation(
  p_reservation_id uuid,
  p_admin_user_id  uuid
) RETURNS void AS $$
DECLARE
  v_unit_id    uuid;
  v_old_status rv_unit_status;
  v_res_status rv_reservation_status;
BEGIN
  SELECT r.unit_id, u.status, r.status
  INTO v_unit_id, v_old_status, v_res_status
  FROM reservations r
  JOIN rv_units u ON u.id = r.unit_id
  WHERE r.id = p_reservation_id
  FOR UPDATE OF u;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Reservation not found: %', p_reservation_id;
  END IF;

  IF v_res_status != 'PENDING_REVIEW' THEN
    RAISE EXCEPTION 'Reservation is not pending review. Current: %', v_res_status;
  END IF;

  IF v_old_status != 'SOFT_HOLD' THEN
    RAISE EXCEPTION 'Unit is not in SOFT_HOLD. Current: %', v_old_status;
  END IF;

  UPDATE reservations SET
    status = 'CONFIRMED',
    reviewed_at = now(),
    reviewed_by = p_admin_user_id
  WHERE id = p_reservation_id;

  UPDATE rv_units SET
    status = 'RESERVED',
    status_changed_at = now()
  WHERE id = v_unit_id;

  INSERT INTO unit_status_log (unit_id, old_status, new_status, changed_by, reservation_id)
  VALUES (v_unit_id, v_old_status, 'RESERVED', 'admin:' || p_admin_user_id, p_reservation_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 6.3 Reject reservation (admin → AVAILABLE)
CREATE OR REPLACE FUNCTION reject_reservation(
  p_reservation_id uuid,
  p_admin_user_id  uuid,
  p_reason         text
) RETURNS void AS $$
DECLARE
  v_unit_id    uuid;
  v_old_status rv_unit_status;
  v_res_status rv_reservation_status;
BEGIN
  SELECT r.unit_id, u.status, r.status
  INTO v_unit_id, v_old_status, v_res_status
  FROM reservations r
  JOIN rv_units u ON u.id = r.unit_id
  WHERE r.id = p_reservation_id
  FOR UPDATE OF u;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Reservation not found: %', p_reservation_id;
  END IF;

  IF v_res_status != 'PENDING_REVIEW' THEN
    RAISE EXCEPTION 'Reservation is not pending review. Current: %', v_res_status;
  END IF;

  UPDATE reservations SET
    status = 'REJECTED',
    reviewed_at = now(),
    reviewed_by = p_admin_user_id,
    rejection_reason = p_reason
  WHERE id = p_reservation_id;

  UPDATE rv_units SET
    status = 'AVAILABLE',
    status_changed_at = now()
  WHERE id = v_unit_id;

  INSERT INTO unit_status_log (unit_id, old_status, new_status, changed_by, reservation_id, reason)
  VALUES (v_unit_id, v_old_status, 'AVAILABLE', 'admin:' || p_admin_user_id, p_reservation_id, p_reason);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 6.4 Desist reservation (admin → AVAILABLE)
CREATE OR REPLACE FUNCTION desist_reservation(
  p_reservation_id     uuid,
  p_admin_user_id      uuid,
  p_reason             text,
  p_desistimiento_date date
) RETURNS void AS $$
DECLARE
  v_unit_id    uuid;
  v_old_status rv_unit_status;
  v_res_status rv_reservation_status;
BEGIN
  SELECT r.unit_id, u.status, r.status
  INTO v_unit_id, v_old_status, v_res_status
  FROM reservations r
  JOIN rv_units u ON u.id = r.unit_id
  WHERE r.id = p_reservation_id
  FOR UPDATE OF u;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Reservation not found: %', p_reservation_id;
  END IF;

  IF v_res_status != 'CONFIRMED' THEN
    RAISE EXCEPTION 'Only confirmed reservations can be desisted. Current: %', v_res_status;
  END IF;

  UPDATE reservations SET
    status = 'DESISTED',
    desistimiento_reason = p_reason,
    desistimiento_date = p_desistimiento_date,
    reviewed_at = now(),
    reviewed_by = p_admin_user_id
  WHERE id = p_reservation_id;

  UPDATE rv_units SET
    status = 'AVAILABLE',
    status_detail = 'Liberado — desistimiento',
    status_changed_at = now()
  WHERE id = v_unit_id;

  INSERT INTO unit_status_log (unit_id, old_status, new_status, changed_by, reservation_id, reason)
  VALUES (v_unit_id, v_old_status, 'AVAILABLE', 'admin:' || p_admin_user_id, p_reservation_id,
    'Desistimiento: ' || p_reason);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 6.5 Submit freeze request (salesperson → FROZEN)
CREATE OR REPLACE FUNCTION submit_freeze(
  p_unit_id        uuid,
  p_salesperson_id uuid,
  p_reason         text,
  p_vip_name       text
) RETURNS uuid AS $$
DECLARE
  v_freeze_id   uuid;
  v_unit_status rv_unit_status;
BEGIN
  SELECT status INTO v_unit_status
  FROM rv_units WHERE id = p_unit_id FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Unit not found: %', p_unit_id;
  END IF;

  IF v_unit_status != 'AVAILABLE' THEN
    RAISE EXCEPTION 'Only available units can be frozen. Current: %', v_unit_status;
  END IF;

  INSERT INTO freeze_requests (unit_id, salesperson_id, reason, vip_name, status)
  VALUES (p_unit_id, p_salesperson_id, p_reason, p_vip_name, 'ACTIVE')
  RETURNING id INTO v_freeze_id;

  UPDATE rv_units SET
    status = 'FROZEN',
    status_detail = p_reason,
    status_changed_at = now()
  WHERE id = p_unit_id;

  INSERT INTO unit_status_log (unit_id, old_status, new_status, changed_by, reason)
  VALUES (p_unit_id, v_unit_status, 'FROZEN', 'salesperson:' || p_salesperson_id,
    'Freeze: ' || p_reason || COALESCE(' (VIP: ' || p_vip_name || ')', ''));

  RETURN v_freeze_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 6.6 Release freeze (admin → AVAILABLE)
CREATE OR REPLACE FUNCTION release_freeze(
  p_freeze_id     uuid,
  p_admin_user_id uuid
) RETURNS void AS $$
DECLARE
  v_unit_id    uuid;
  v_old_status rv_unit_status;
  v_frz_status rv_freeze_request_status;
BEGIN
  SELECT fr.unit_id, u.status, fr.status
  INTO v_unit_id, v_old_status, v_frz_status
  FROM freeze_requests fr
  JOIN rv_units u ON u.id = fr.unit_id
  WHERE fr.id = p_freeze_id
  FOR UPDATE OF u;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Freeze request not found: %', p_freeze_id;
  END IF;

  IF v_frz_status != 'ACTIVE' THEN
    RAISE EXCEPTION 'Freeze is not active. Current: %', v_frz_status;
  END IF;

  UPDATE freeze_requests SET
    status = 'RELEASED',
    released_at = now(),
    released_by = p_admin_user_id
  WHERE id = p_freeze_id;

  UPDATE rv_units SET
    status = 'AVAILABLE',
    status_detail = NULL,
    status_changed_at = now()
  WHERE id = v_unit_id;

  INSERT INTO unit_status_log (unit_id, old_status, new_status, changed_by, reason)
  VALUES (v_unit_id, v_old_status, 'AVAILABLE', 'admin:' || p_admin_user_id, 'Freeze released');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ----------------------------------------------------------------------------
-- 7. VIEWS — Denormalized reads for the application layer
-- ----------------------------------------------------------------------------

-- Full unit view with project/tower/floor context (powers availability board)
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
  f.number     AS floor_number,
  f.id         AS floor_id,
  t.id         AS tower_id,
  t.name       AS tower_name,
  t.is_default AS tower_is_default,
  t.delivery_date AS tower_delivery_date,
  p.id         AS project_id,
  p.name       AS project_name,
  p.slug       AS project_slug
FROM rv_units u
JOIN floors f  ON f.id = u.floor_id
JOIN towers t  ON t.id = f.tower_id
JOIN projects p ON p.id = t.project_id;


-- Pending reservations with all context (powers admin review queue)
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
  (array_agg(c.phone ORDER BY rc.is_primary DESC) FILTER (WHERE c.phone IS NOT NULL))[1] AS client_phone
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
  r.receipt_type, r.depositor_name, r.receipt_image_url, r.lead_source,
  r.notes, r.is_resale, r.created_at,
  u.unit_number, u.unit_code, u.unit_type, u.bedrooms, u.price_list,
  f.number, t.name, t.is_default, p.name, p.slug,
  s.full_name, s.id,
  re.extracted_amount, re.extracted_date, re.extracted_bank, re.confidence
ORDER BY r.created_at ASC;


-- Projects with tower summary (powers form cascading selects)
CREATE OR REPLACE VIEW v_rv_projects_with_towers AS
SELECT
  p.id AS project_id,
  p.name AS project_name,
  p.slug AS project_slug,
  json_agg(
    json_build_object(
      'id', t.id,
      'name', t.name,
      'is_default', t.is_default,
      'delivery_date', t.delivery_date
    ) ORDER BY t.name
  ) AS towers
FROM projects p
JOIN towers t ON t.project_id = p.id
GROUP BY p.id, p.name, p.slug
ORDER BY p.name;


-- Unit sale history count (for admin "sold xN" badges)
CREATE OR REPLACE VIEW v_rv_unit_sale_counts AS
SELECT
  unit_id,
  count(*) FILTER (WHERE status IN ('CONFIRMED', 'DESISTED')) AS total_sales,
  count(*) FILTER (WHERE status = 'DESISTED') AS desistimientos
FROM reservations
GROUP BY unit_id;


-- ----------------------------------------------------------------------------
-- 8. ROW LEVEL SECURITY
-- ----------------------------------------------------------------------------

-- towers: public read
ALTER TABLE towers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read towers"
  ON towers FOR SELECT USING (true);
CREATE POLICY "Service role manages towers"
  ON towers FOR ALL USING (auth.role() = 'service_role');

-- floors: public read
ALTER TABLE floors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read floors"
  ON floors FOR SELECT USING (true);
CREATE POLICY "Service role manages floors"
  ON floors FOR ALL USING (auth.role() = 'service_role');

-- rv_units: public read (powers availability board)
ALTER TABLE rv_units ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read rv_units"
  ON rv_units FOR SELECT USING (true);
CREATE POLICY "Service role manages rv_units"
  ON rv_units FOR ALL USING (auth.role() = 'service_role');

-- salespeople: public read (powers form dropdown)
ALTER TABLE salespeople ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read salespeople"
  ON salespeople FOR SELECT USING (true);
CREATE POLICY "Service role manages salespeople"
  ON salespeople FOR ALL USING (auth.role() = 'service_role');

-- rv_clients: authenticated read, service_role write
ALTER TABLE rv_clients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users read rv_clients"
  ON rv_clients FOR SELECT USING (auth.role() IN ('authenticated', 'service_role'));
CREATE POLICY "Service role manages rv_clients"
  ON rv_clients FOR ALL USING (auth.role() = 'service_role');

-- reservations: public insert (form), authenticated read, service_role manage
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can insert reservations"
  ON reservations FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated users read reservations"
  ON reservations FOR SELECT USING (auth.role() IN ('authenticated', 'service_role'));
CREATE POLICY "Service role manages reservations"
  ON reservations FOR ALL USING (auth.role() = 'service_role');

-- reservation_clients: follows reservation access
ALTER TABLE reservation_clients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can insert reservation_clients"
  ON reservation_clients FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated users read reservation_clients"
  ON reservation_clients FOR SELECT USING (auth.role() IN ('authenticated', 'service_role'));
CREATE POLICY "Service role manages reservation_clients"
  ON reservation_clients FOR ALL USING (auth.role() = 'service_role');

-- receipt_extractions: service_role only (created by API route, read by admin)
ALTER TABLE receipt_extractions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users read extractions"
  ON receipt_extractions FOR SELECT USING (auth.role() IN ('authenticated', 'service_role'));
CREATE POLICY "Service role manages extractions"
  ON receipt_extractions FOR ALL USING (auth.role() = 'service_role');

-- unit_status_log: public read (audit transparency)
ALTER TABLE unit_status_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read audit log"
  ON unit_status_log FOR SELECT USING (true);
CREATE POLICY "Service role writes audit log"
  ON unit_status_log FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- freeze_requests: public insert, authenticated read
ALTER TABLE freeze_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can insert freeze requests"
  ON freeze_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated users read freeze requests"
  ON freeze_requests FOR SELECT USING (auth.role() IN ('authenticated', 'service_role'));
CREATE POLICY "Service role manages freeze requests"
  ON freeze_requests FOR ALL USING (auth.role() = 'service_role');


-- ----------------------------------------------------------------------------
-- 9. REALTIME
-- ----------------------------------------------------------------------------

-- Enable realtime on rv_units table for the availability board
ALTER PUBLICATION supabase_realtime ADD TABLE rv_units;


-- ----------------------------------------------------------------------------
-- 10. STORAGE
-- ----------------------------------------------------------------------------

-- Receipt images bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'receipts',
  'receipts',
  false,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'application/pdf']
) ON CONFLICT (id) DO NOTHING;

-- Anyone can upload receipts (salespeople use the public form)
CREATE POLICY "Anyone can upload receipts"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'receipts');

-- Authenticated users can read receipts (admin dashboard)
CREATE POLICY "Authenticated users read receipts"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'receipts' AND auth.role() IN ('authenticated', 'service_role'));
