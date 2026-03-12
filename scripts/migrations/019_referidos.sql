-- 019: Referidos — referral tracking table
-- Tracks units sold through referral channels with special pricing.

CREATE TABLE IF NOT EXISTS rv_referrals (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id   uuid REFERENCES reservations(id) ON DELETE SET NULL,
  unit_id          uuid NOT NULL REFERENCES rv_units(id) ON DELETE RESTRICT,
  client_name      text NOT NULL,
  precio_lista     numeric(14,2),
  precio_referido  numeric(14,2),
  referido_por     text NOT NULL,
  fecha_reserva    date,
  salesperson_id   uuid REFERENCES salespeople(id) ON DELETE SET NULL,
  notes            text,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT rv_referrals_client_not_empty CHECK (length(trim(client_name)) > 0),
  CONSTRAINT rv_referrals_referido_not_empty CHECK (length(trim(referido_por)) > 0)
);

CREATE INDEX IF NOT EXISTS idx_rv_referrals_unit_id ON rv_referrals (unit_id);
CREATE INDEX IF NOT EXISTS idx_rv_referrals_reservation_id ON rv_referrals (reservation_id);
CREATE INDEX IF NOT EXISTS idx_rv_referrals_referido_por ON rv_referrals (referido_por);

-- Denormalized view for display
CREATE OR REPLACE VIEW v_rv_referrals_full AS
SELECT
  ref.id,
  ref.client_name,
  ref.precio_lista,
  ref.precio_referido,
  ref.referido_por,
  ref.fecha_reserva,
  ref.notes,
  ref.created_at,
  u.unit_number,
  u.unit_type,
  t.name AS tower_name,
  p.name AS project_name,
  p.slug AS project_slug,
  s.display_name AS salesperson_name
FROM rv_referrals ref
JOIN rv_units u ON u.id = ref.unit_id
JOIN floors f ON f.id = u.floor_id
JOIN towers t ON t.id = f.tower_id
JOIN projects p ON p.id = t.project_id
LEFT JOIN salespeople s ON s.id = ref.salesperson_id
ORDER BY ref.created_at DESC;

-- RLS
ALTER TABLE rv_referrals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users read referrals"
  ON rv_referrals FOR SELECT USING (auth.role() IN ('authenticated', 'service_role'));
CREATE POLICY "Service role manages referrals"
  ON rv_referrals FOR ALL USING (auth.role() = 'service_role');

-- updated_at trigger
DO $$ BEGIN
  CREATE TRIGGER set_updated_at_rv_referrals
    BEFORE UPDATE ON rv_referrals
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
