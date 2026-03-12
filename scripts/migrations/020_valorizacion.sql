-- 020: Valorizacion — price appreciation history table
-- Tracks price increments per project/tower over time.

CREATE TABLE IF NOT EXISTS rv_price_history (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id          uuid NOT NULL REFERENCES projects(id) ON DELETE RESTRICT,
  tower_id            uuid REFERENCES towers(id) ON DELETE SET NULL,
  effective_date      date NOT NULL,
  units_remaining     integer NOT NULL CHECK (units_remaining >= 0),
  increment_amount    numeric(14,2) NOT NULL DEFAULT 0,
  increment_pct       numeric(8,4),
  new_price_avg       numeric(14,2),
  appreciation_total  numeric(14,2),
  notes               text,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT rv_price_history_unique_entry UNIQUE (project_id, tower_id, effective_date)
);

CREATE INDEX IF NOT EXISTS idx_rv_price_history_project ON rv_price_history (project_id);
CREATE INDEX IF NOT EXISTS idx_rv_price_history_date ON rv_price_history (effective_date);

-- RLS
ALTER TABLE rv_price_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users read price history"
  ON rv_price_history FOR SELECT USING (auth.role() IN ('authenticated', 'service_role'));
CREATE POLICY "Service role manages price history"
  ON rv_price_history FOR ALL USING (auth.role() = 'service_role');

-- updated_at trigger
DO $$ BEGIN
  CREATE TRIGGER set_updated_at_rv_price_history
    BEFORE UPDATE ON rv_price_history
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
