-- Migration 031: System Settings + Auto-Approval
-- Purpose: Add system_settings table for feature toggles,
-- and auto_confirm_reservation() RPC for automated approval.
-- Safe: purely additive, default OFF, zero behavioral change on deploy.

-- ============================================================================
-- 1. system_settings table
-- ============================================================================

CREATE TABLE IF NOT EXISTS system_settings (
  key        text PRIMARY KEY,
  value      jsonb NOT NULL DEFAULT 'false'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read settings (API routes enforce role checks)
CREATE POLICY system_settings_select ON system_settings
  FOR SELECT TO authenticated USING (true);

-- Only master/torredecontrol can modify
CREATE POLICY system_settings_modify ON system_settings
  FOR UPDATE TO authenticated USING (
    coalesce(auth.jwt()->'app_metadata'->>'role', '') IN ('master', 'torredecontrol')
  );

-- Seed the auto-approval toggle (defaults to OFF)
INSERT INTO system_settings (key, value)
VALUES ('auto_approval_enabled', 'false'::jsonb)
ON CONFLICT (key) DO NOTHING;


-- ============================================================================
-- 2. auto_confirm_reservation() RPC
-- ============================================================================
-- Mirrors confirm_reservation() but uses system-level audit markers:
--   reviewed_by = NULL  (no human reviewer)
--   changed_by  = 'system:auto-approval'  (satisfies NOT NULL + CHECK)
--   reason      = 'Autorización automática'

CREATE OR REPLACE FUNCTION auto_confirm_reservation(
  p_reservation_id uuid
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

  -- Confirm reservation with system-level audit markers
  UPDATE reservations SET
    status      = 'CONFIRMED',
    reviewed_at = now(),
    reviewed_by = NULL
  WHERE id = p_reservation_id;

  UPDATE rv_units SET
    status            = 'RESERVED',
    status_changed_at = now()
  WHERE id = v_unit_id;

  INSERT INTO unit_status_log (unit_id, old_status, new_status, changed_by, reservation_id, reason)
  VALUES (
    v_unit_id,
    v_old_status,
    'RESERVED',
    'system:auto-approval',
    p_reservation_id,
    'Autorización automática'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
