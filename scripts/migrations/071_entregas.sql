-- ============================================================================
-- Migration 071: Entregas — cronograma de escrituración y entrega de unidades
-- ============================================================================
-- Replaces the Google Sheet "Boulevard 5 — Cronograma de Entregas".
-- The DB is master; the sheet is retired and nothing is imported from it
-- (its only row was test data).
--
-- Model (decided 2026-08-17):
--   entregas       — one expediente per unit. Holds the sale-level facts that
--                    do not belong to a single appointment (tipo de pago,
--                    banco) and the link to the confirmed reservation.
--   entrega_citas  — one row per milestone (ESCRITURA, LLAVES). Each milestone
--                    is scheduled, confirmed, completed or cancelled
--                    INDEPENDENTLY of the other.
--
-- Reschedule history is NOT a state: a rescheduled cita returns to PROGRAMADA
-- with reprogramaciones incremented, and the before/after is written to
-- audit_events (resource_type = 'entrega_cita') by the API layer.
--
-- Data facts verified against production before writing this migration:
--   - Boulevard 5 has 272 SOLD units; every one has exactly one CONFIRMED
--     reservation, and every such reservation has a primary client.
--   - 25 sold units also carry a DESISTED reservation (resale). The CONFIRMED
--     one is always the correct link.
--   - sales.deed_signed_date is NULL for all 343 B5 sales — escritura dates
--     are not tracked anywhere else today, so this table is their first home.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Enum types
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'rv_entrega_milestone') THEN
    CREATE TYPE rv_entrega_milestone AS ENUM ('ESCRITURA', 'LLAVES');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'rv_entrega_estado') THEN
    CREATE TYPE rv_entrega_estado AS ENUM ('PROGRAMADA', 'CONFIRMADA', 'COMPLETADA', 'CANCELADA');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'rv_entrega_tipo_pago') THEN
    CREATE TYPE rv_entrega_tipo_pago AS ENUM ('FHA', 'CREDITO_DIRECTO', 'CONTADO');
  END IF;
END
$$;

-- ---------------------------------------------------------------------------
-- entregas — expediente de entrega, one per unit
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS entregas (
  id             uuid                 PRIMARY KEY DEFAULT uuid_v7(),
  project_id     uuid                 NOT NULL REFERENCES projects(id),
  unit_id        uuid                 NOT NULL REFERENCES rv_units(id),
  reservation_id uuid                 NOT NULL REFERENCES reservations(id),
  tipo_pago      rv_entrega_tipo_pago,
  banco          text,
  notas          text,
  created_at     timestamptz          NOT NULL DEFAULT now(),
  created_by     uuid                 REFERENCES auth.users(id),
  updated_at     timestamptz          NOT NULL DEFAULT now(),
  updated_by     uuid                 REFERENCES auth.users(id),
  CONSTRAINT entregas_unit_unique UNIQUE (unit_id),
  CONSTRAINT entregas_banco_not_blank CHECK (banco IS NULL OR btrim(banco) <> '')
);

COMMENT ON TABLE entregas IS
  'Expediente de entrega por unidad. Sustituye la hoja de Google "Cronograma de Entregas". Una fila por unidad; las citas de escrituración y entrega de llaves viven en entrega_citas.';
COMMENT ON COLUMN entregas.reservation_id IS
  'Reserva CONFIRMED de la unidad. Una unidad con desistimiento previo tiene también reservas DESISTED — esas nunca se enlazan aquí.';
COMMENT ON COLUMN entregas.tipo_pago IS
  'Capturado por Torre de Control. El snapshot de créditos (Pipedrive, corte 2026-08-05) solo se usa como sugerencia en la UI: 273 de 569 tratos B5 tienen tipoCredito "Sin dato".';
COMMENT ON COLUMN entregas.banco IS
  'Banco que otorga el crédito. Texto libre: el catálogo de bancos varía y solo 213 de 569 tratos B5 lo traen.';

CREATE INDEX IF NOT EXISTS idx_entregas_project ON entregas (project_id);
CREATE INDEX IF NOT EXISTS idx_entregas_reservation ON entregas (reservation_id);

-- ---------------------------------------------------------------------------
-- entrega_citas — one row per milestone, independently schedulable
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS entrega_citas (
  id               uuid                 PRIMARY KEY DEFAULT uuid_v7(),
  entrega_id       uuid                 NOT NULL REFERENCES entregas(id) ON DELETE CASCADE,
  milestone        rv_entrega_milestone NOT NULL,
  fecha            date                 NOT NULL,
  hora             time                 NOT NULL,
  estado           rv_entrega_estado    NOT NULL DEFAULT 'PROGRAMADA',
  reprogramaciones integer              NOT NULL DEFAULT 0,
  completada_at    timestamptz,
  cancelada_motivo text,
  notas            text,
  created_at       timestamptz          NOT NULL DEFAULT now(),
  created_by       uuid                 REFERENCES auth.users(id),
  updated_at       timestamptz          NOT NULL DEFAULT now(),
  updated_by       uuid                 REFERENCES auth.users(id),
  CONSTRAINT entrega_citas_milestone_unique UNIQUE (entrega_id, milestone),
  CONSTRAINT entrega_citas_reprogramaciones_positive CHECK (reprogramaciones >= 0),
  CONSTRAINT entrega_citas_completada_coherente CHECK (
    (estado = 'COMPLETADA' AND completada_at IS NOT NULL)
    OR (estado <> 'COMPLETADA' AND completada_at IS NULL)
  ),
  CONSTRAINT entrega_citas_cancelada_coherente CHECK (
    estado = 'CANCELADA' OR cancelada_motivo IS NULL
  )
);

COMMENT ON TABLE entrega_citas IS
  'Cita agendada para un hito de entrega. ESCRITURA y LLAVES se agendan, confirman, completan y cancelan de forma independiente.';
COMMENT ON COLUMN entrega_citas.reprogramaciones IS
  'Veces que la cita cambió de fecha/hora. "Reprogramada" no es un estado: al reprogramar la cita vuelve a PROGRAMADA y este contador sube. El antes/después queda en audit_events.';
COMMENT ON COLUMN entrega_citas.estado IS
  'PROGRAMADA → CONFIRMADA → COMPLETADA, o CANCELADA en cualquier momento. Completar una cita NO modifica rv_units ni reservations.';

CREATE INDEX IF NOT EXISTS idx_entrega_citas_fecha ON entrega_citas (fecha);
CREATE INDEX IF NOT EXISTS idx_entrega_citas_entrega ON entrega_citas (entrega_id);
CREATE INDEX IF NOT EXISTS idx_entrega_citas_agenda ON entrega_citas (fecha, hora)
  WHERE estado <> 'CANCELADA';

-- ---------------------------------------------------------------------------
-- updated_at triggers
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION entregas_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_entregas_updated_at ON entregas;
CREATE TRIGGER trg_entregas_updated_at
  BEFORE UPDATE ON entregas
  FOR EACH ROW
  EXECUTE FUNCTION entregas_updated_at();

DROP TRIGGER IF EXISTS trg_entrega_citas_updated_at ON entrega_citas;
CREATE TRIGGER trg_entrega_citas_updated_at
  BEFORE UPDATE ON entrega_citas
  FOR EACH ROW
  EXECUTE FUNCTION entregas_updated_at();

-- ---------------------------------------------------------------------------
-- v_entregas_full — one row per cita, resolved for the board
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW v_entregas_full AS
SELECT
  c.id                AS cita_id,
  c.milestone,
  c.fecha,
  c.hora,
  c.estado,
  c.reprogramaciones,
  c.completada_at,
  c.cancelada_motivo,
  c.notas             AS cita_notas,
  c.updated_at        AS cita_updated_at,
  e.id                AS entrega_id,
  e.tipo_pago,
  e.banco,
  e.notas             AS entrega_notas,
  u.id                AS unit_id,
  u.unit_number,
  u.unit_code,
  u.status            AS unit_status,
  t.name              AS tower_name,
  p.id                AS project_id,
  p.slug              AS project_slug,
  p.name              AS project_name,
  r.id                AS reservation_id,
  cl.full_name        AS cliente,
  cl.phone            AS cliente_phone,
  (
    SELECT count(*)
    FROM reservation_clients rc2
    WHERE rc2.reservation_id = r.id
  )                   AS titulares_count
FROM entrega_citas c
JOIN entregas e            ON e.id = c.entrega_id
JOIN rv_units u            ON u.id = e.unit_id
JOIN floors f              ON f.id = u.floor_id
JOIN towers t              ON t.id = f.tower_id
JOIN projects p            ON p.id = e.project_id
JOIN reservations r        ON r.id = e.reservation_id
LEFT JOIN reservation_clients rc ON rc.reservation_id = r.id AND rc.is_primary
LEFT JOIN rv_clients cl    ON cl.id = rc.client_id;

COMMENT ON VIEW v_entregas_full IS
  'Una fila por cita de entrega, con unidad, proyecto y titular resueltos. Alimenta el tablero /entregas.';

-- ---------------------------------------------------------------------------
-- RLS — reads for anyone who can see the board, writes for admins only
-- ---------------------------------------------------------------------------
ALTER TABLE entregas ENABLE ROW LEVEL SECURITY;
ALTER TABLE entrega_citas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS entregas_select ON entregas;
CREATE POLICY entregas_select ON entregas
  FOR SELECT TO authenticated
  USING (jwt_role() IN ('master', 'torredecontrol', 'gerencia', 'financiero', 'contabilidad', 'marketing', 'entregas_viewer'));

DROP POLICY IF EXISTS entregas_insert ON entregas;
CREATE POLICY entregas_insert ON entregas
  FOR INSERT TO authenticated
  WITH CHECK (jwt_role() IN ('master', 'torredecontrol'));

DROP POLICY IF EXISTS entregas_update ON entregas;
CREATE POLICY entregas_update ON entregas
  FOR UPDATE TO authenticated
  USING (jwt_role() IN ('master', 'torredecontrol'))
  WITH CHECK (jwt_role() IN ('master', 'torredecontrol'));

DROP POLICY IF EXISTS entregas_delete ON entregas;
CREATE POLICY entregas_delete ON entregas
  FOR DELETE TO authenticated
  USING (jwt_role() IN ('master', 'torredecontrol'));

DROP POLICY IF EXISTS entrega_citas_select ON entrega_citas;
CREATE POLICY entrega_citas_select ON entrega_citas
  FOR SELECT TO authenticated
  USING (jwt_role() IN ('master', 'torredecontrol', 'gerencia', 'financiero', 'contabilidad', 'marketing', 'entregas_viewer'));

DROP POLICY IF EXISTS entrega_citas_insert ON entrega_citas;
CREATE POLICY entrega_citas_insert ON entrega_citas
  FOR INSERT TO authenticated
  WITH CHECK (jwt_role() IN ('master', 'torredecontrol'));

DROP POLICY IF EXISTS entrega_citas_update ON entrega_citas;
CREATE POLICY entrega_citas_update ON entrega_citas
  FOR UPDATE TO authenticated
  USING (jwt_role() IN ('master', 'torredecontrol'))
  WITH CHECK (jwt_role() IN ('master', 'torredecontrol'));

DROP POLICY IF EXISTS entrega_citas_delete ON entrega_citas;
CREATE POLICY entrega_citas_delete ON entrega_citas
  FOR DELETE TO authenticated
  USING (jwt_role() IN ('master', 'torredecontrol'));
