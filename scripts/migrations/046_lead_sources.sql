-- Migration 046: lead_sources table
-- Moves lead sources from hardcoded constants to DB-managed list.
-- New "marketing" role can manage via /admin/lead-sources.

-- ---------------------------------------------------------------------------
-- Table
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS lead_sources (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text        NOT NULL,
  display_order int         NOT NULL DEFAULT 0,
  is_active     boolean     NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  updated_by    uuid        REFERENCES auth.users(id),
  CONSTRAINT lead_sources_name_unique UNIQUE (name)
);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION lead_sources_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_lead_sources_updated_at
  BEFORE UPDATE ON lead_sources
  FOR EACH ROW
  EXECUTE FUNCTION lead_sources_updated_at();

-- ---------------------------------------------------------------------------
-- Seed current 16 sources
-- ---------------------------------------------------------------------------
INSERT INTO lead_sources (name, display_order) VALUES
  ('Facebook',        1),
  ('Meta',            2),
  ('Referido',        3),
  ('Visita Inédita',  4),
  ('Señalética',      5),
  ('PBX',             6),
  ('Página Web',      7),
  ('Inbox',           8),
  ('Mailing',         9),
  ('Prospección',    10),
  ('F&F',            11),
  ('Wati',           12),
  ('Activación',     13),
  ('Evento',         14),
  ('TikTok',         15),
  ('LinkedIn',       16)
ON CONFLICT (name) DO NOTHING;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
ALTER TABLE lead_sources ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read (needed by reservation forms)
CREATE POLICY lead_sources_select ON lead_sources
  FOR SELECT TO authenticated
  USING (true);

-- Marketing + admin roles can insert/update/delete
CREATE POLICY lead_sources_insert ON lead_sources
  FOR INSERT TO authenticated
  WITH CHECK (jwt_role() IN ('master', 'torredecontrol', 'marketing'));

CREATE POLICY lead_sources_update ON lead_sources
  FOR UPDATE TO authenticated
  USING (jwt_role() IN ('master', 'torredecontrol', 'marketing'))
  WITH CHECK (jwt_role() IN ('master', 'torredecontrol', 'marketing'));

CREATE POLICY lead_sources_delete ON lead_sources
  FOR DELETE TO authenticated
  USING (jwt_role() IN ('master', 'torredecontrol', 'marketing'));
