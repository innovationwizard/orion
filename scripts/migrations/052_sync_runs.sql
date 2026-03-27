-- Migration 052: OneDrive sync audit trail
-- Tracks every hourly sync run: files processed, records changed, errors.

CREATE TABLE IF NOT EXISTS sync_runs (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  started_at      timestamptz NOT NULL DEFAULT now(),
  finished_at     timestamptz,
  status          text NOT NULL DEFAULT 'RUNNING'
                    CHECK (status IN ('RUNNING', 'SUCCESS', 'PARTIAL', 'FAILED')),
  trigger_source  text NOT NULL DEFAULT 'cron'
                    CHECK (trigger_source IN ('cron', 'manual')),

  -- Per-file tracking
  files_checked   int NOT NULL DEFAULT 0,
  files_processed int NOT NULL DEFAULT 0,
  file_results    jsonb NOT NULL DEFAULT '[]'::jsonb,

  -- Aggregate counters
  units_updated        int NOT NULL DEFAULT 0,
  reservations_created int NOT NULL DEFAULT 0,
  clients_created      int NOT NULL DEFAULT 0,
  errors               jsonb NOT NULL DEFAULT '[]'::jsonb,

  -- Change detection: { "filepath": "lastModifiedDateTime" }
  file_checksums  jsonb,

  created_at      timestamptz NOT NULL DEFAULT now()
);

-- Fast lookup by status + recency
CREATE INDEX idx_sync_runs_status ON sync_runs (status);
CREATE INDEX idx_sync_runs_started ON sync_runs (started_at DESC);

-- RLS: admin read, service_role write
ALTER TABLE sync_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin read sync runs" ON sync_runs
  FOR SELECT TO authenticated
  USING (jwt_role() IN ('master', 'torredecontrol'));

CREATE POLICY "Service role full access sync runs" ON sync_runs
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);
