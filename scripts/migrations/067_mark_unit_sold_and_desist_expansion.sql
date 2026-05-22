-- Migration 067: mark_unit_sold() + expand desist_reservation() to PENDING_REVIEW
-- Date: 2026-05-22
-- Fixes: audit-unit-status-transitions-2026-05-22.md Issues #1, #2, #3
--
-- Issue #1: RESERVED -> SOLD transition has no RPC function.
-- Issue #3: desist_reservation() only accepts CONFIRMED; should also accept PENDING_REVIEW.
--
-- This migration:
--   1. Adds sale_closed_date column to reservations table
--   2. Creates mark_unit_sold() RPC function (RESERVED -> SOLD)
--   3. Replaces desist_reservation() to accept CONFIRMED or PENDING_REVIEW

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. Add sale_closed_date column to reservations
-- ---------------------------------------------------------------------------

ALTER TABLE reservations
  ADD COLUMN IF NOT EXISTS sale_closed_date date NULL;

COMMENT ON COLUMN reservations.sale_closed_date IS
  'Date the sale was formally closed (PCV signed or equivalent). Set by mark_unit_sold().';

-- ---------------------------------------------------------------------------
-- 2. mark_unit_sold() — RESERVED -> SOLD (admin confirms)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION mark_unit_sold(
  p_reservation_id uuid,
  p_admin_user_id  uuid,
  p_sale_date      date,
  p_notes          text DEFAULT NULL
) RETURNS void AS $$
DECLARE
  v_unit_id    uuid;
  v_old_status rv_unit_status;
  v_res_status rv_reservation_status;
BEGIN
  -- Acquire exclusive lock on the unit row
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
    RAISE EXCEPTION 'Only confirmed reservations can be marked as sold. Current: %', v_res_status;
  END IF;

  IF v_old_status != 'RESERVED' THEN
    RAISE EXCEPTION 'Unit is not in RESERVED status. Current: %', v_old_status;
  END IF;

  -- Update reservation with sale closure date
  UPDATE reservations SET
    sale_closed_date = p_sale_date,
    reviewed_at = now(),
    reviewed_by = p_admin_user_id
  WHERE id = p_reservation_id;

  -- Transition unit to SOLD
  UPDATE rv_units SET
    status = 'SOLD',
    status_detail = p_notes,
    status_changed_at = now()
  WHERE id = v_unit_id;

  -- Audit trail
  INSERT INTO unit_status_log (unit_id, old_status, new_status, changed_by, reservation_id, reason)
  VALUES (v_unit_id, v_old_status, 'SOLD', 'admin:' || p_admin_user_id, p_reservation_id,
    'Venta cerrada: ' || p_sale_date || COALESCE(' — ' || p_notes, ''));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ---------------------------------------------------------------------------
-- 3. Expand desist_reservation() to accept PENDING_REVIEW
-- ---------------------------------------------------------------------------
-- Original guard: v_res_status != 'CONFIRMED'
-- New guard: v_res_status NOT IN ('CONFIRMED', 'PENDING_REVIEW')
--
-- When desisting a PENDING_REVIEW reservation, the unit transitions from
-- SOFT_HOLD -> AVAILABLE (v_old_status captures this dynamically).

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

  IF v_res_status NOT IN ('CONFIRMED', 'PENDING_REVIEW') THEN
    RAISE EXCEPTION 'Only confirmed or pending reservations can be desisted. Current: %', v_res_status;
  END IF;

  -- Update reservation
  UPDATE reservations SET
    status = 'DESISTED',
    desistimiento_reason = p_reason,
    desistimiento_date = p_desistimiento_date,
    reviewed_at = now(),
    reviewed_by = p_admin_user_id
  WHERE id = p_reservation_id;

  -- Return unit to AVAILABLE
  UPDATE rv_units SET
    status = 'AVAILABLE',
    status_detail = 'Liberado — desistimiento',
    status_changed_at = now()
  WHERE id = v_unit_id;

  -- Audit trail
  INSERT INTO unit_status_log (unit_id, old_status, new_status, changed_by, reservation_id, reason)
  VALUES (v_unit_id, v_old_status, 'AVAILABLE', 'admin:' || p_admin_user_id, p_reservation_id,
    'Desistimiento: ' || p_reason);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ---------------------------------------------------------------------------
-- Verification queries (run after applying)
-- ---------------------------------------------------------------------------

-- Verify sale_closed_date column exists
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'reservations' AND column_name = 'sale_closed_date';

-- Verify mark_unit_sold function exists
-- SELECT routine_name FROM information_schema.routines
-- WHERE routine_name = 'mark_unit_sold';

-- Verify desist_reservation was replaced (test with a non-existent ID to see new error message)
-- SELECT desist_reservation('00000000-0000-0000-0000-000000000000'::uuid,
--   '00000000-0000-0000-0000-000000000000'::uuid, 'test', '2026-01-01'::date);
-- Expected: "Reservation not found: 00000000-0000-0000-0000-000000000000"

COMMIT;
