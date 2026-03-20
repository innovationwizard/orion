-- ============================================================
-- Migration 041: Centralized Audit Events
-- Append-only table for all significant admin actions.
-- Complements unit_status_log (domain-specific) with a
-- system-wide event log for compliance and traceability.
--
-- Gaps resolved: GAP-22, GAP-16, DISC-02, DISC-05
-- ============================================================

CREATE TABLE audit_events (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Actor
  actor_id       uuid        NOT NULL,
  actor_role     text        NOT NULL,
  actor_email    text,

  -- Event
  event_type     text        NOT NULL,
  resource_type  text        NOT NULL,
  resource_id    text,
  resource_label text,

  -- Change data
  details        jsonb,

  -- Request context
  ip_address     text,
  http_method    text,
  http_path      text,

  -- Timestamp
  created_at     timestamptz NOT NULL DEFAULT now()
);

-- Indexes for common queries
CREATE INDEX idx_audit_events_actor    ON audit_events (actor_id);
CREATE INDEX idx_audit_events_resource ON audit_events (resource_type, resource_id);
CREATE INDEX idx_audit_events_type     ON audit_events (event_type);
CREATE INDEX idx_audit_events_created  ON audit_events (created_at DESC);

-- RLS: admin-only read, service_role insert (append-only)
ALTER TABLE audit_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin read audit events" ON audit_events
  FOR SELECT TO authenticated
  USING (
    jwt_role() IN ('master', 'torredecontrol')
  );

CREATE POLICY "Service role insert audit events" ON audit_events
  FOR INSERT TO service_role
  WITH CHECK (true);
