-- ============================================================================
-- Migration 076: Entregas — publicar una visita aparte de agendarla
-- ============================================================================
-- Hasta ahora agendar escribía la cita y el tablero la mostraba en el mismo
-- paso. Quien solo consulta /entregas (entregas_viewer, gerencia, financiero,
-- contabilidad, marketing) veía cada alta al instante.
--
-- `publicada` es independiente de `estado`. Publicar no mueve PROGRAMADA,
-- CONFIRMADA, COMPLETADA ni CANCELADA. Una reprogramación de una cita
-- CONFIRMADA sigue devolviéndola a PROGRAMADA cuando el editor no elige otro
-- estado: eso no se toca aquí.
--
-- El default de la columna es TRUE a propósito. El deploy que está en
-- producción inserta citas sin nombrar `publicada`. Con default false, esas
-- altas quedarían invisibles y sin botón de publicar hasta que el código nuevo
-- esté arriba. El código nuevo inserta `publicada = false` de forma explícita.
-- Cualquier writer que olvide la columna sigue el comportamiento anterior:
-- la cita se ve.
--
-- Las citas que ya existen quedan publicadas. El tablero en vivo no se vacía.
--
-- Correr este archivo completo en el SQL editor de Supabase,
-- ANTES de desplegar el código que filtra por `publicada`.
-- Idempotente.
-- ============================================================================

ALTER TABLE entrega_citas
  ADD COLUMN IF NOT EXISTS publicada boolean NOT NULL DEFAULT true;

ALTER TABLE entrega_citas
  ADD COLUMN IF NOT EXISTS publicada_at timestamptz;

ALTER TABLE entrega_citas
  ADD COLUMN IF NOT EXISTS publicada_by uuid REFERENCES auth.users(id);

-- Sella las citas que ya estaban en el tablero. Una cita creada por el código
-- nuevo tiene publicada = false y no entra aquí, así que re-ejecutar este
-- UPDATE no publica un borrador.
UPDATE entrega_citas
SET publicada = true,
    publicada_at = COALESCE(publicada_at, created_at)
WHERE publicada = true
  AND publicada_at IS NULL;

COMMENT ON COLUMN entrega_citas.publicada IS
  'Visible para quien solo consulta el tablero. Los editores (master, torredecontrol, entregas_editor) ven también las citas en false. Independiente de estado.';
COMMENT ON COLUMN entrega_citas.publicada_at IS
  'Momento en que la cita pasó a ser visible. NULL mientras sigue en borrador.';
COMMENT ON COLUMN entrega_citas.publicada_by IS
  'Usuario que publicó la cita. NULL en las citas que ya estaban en el tablero cuando se agregó la columna, y en los borradores.';

-- ---------------------------------------------------------------------------
-- v_entregas_full — mismas columnas que la migración 075, más la publicación.
-- Las columnas nuevas van al final: CREATE OR REPLACE no puede reordenar.
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
  )                   AS titulares_count,
  COALESCE(
    (
      SELECT jsonb_agg(
               jsonb_build_object(
                 'client_id',  cl2.id,
                 'full_name',  cl2.full_name,
                 'phone',      cl2.phone,
                 'is_primary', rc3.is_primary
               )
               ORDER BY rc3.is_primary DESC, rc3.document_order
             )
      FROM reservation_clients rc3
      JOIN rv_clients cl2 ON cl2.id = rc3.client_id
      WHERE rc3.reservation_id = r.id
    ),
    '[]'::jsonb
  )                   AS titulares,
  c.publicada,
  c.publicada_at
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
  'Una fila por cita de entrega, con unidad, proyecto y titulares resueltos. Alimenta el tablero /entregas. `publicada` distingue el borrador de lo que ya ven los lectores.';

-- ---------------------------------------------------------------------------
-- RLS de lectura. El tablero usa el service role y filtra en GET /api/entregas;
-- esta política cubre cualquier consulta autenticada que no pase por ahí.
-- Escritura no cambia: sigue siendo la de la migración 072. Publicar pasa por
-- la API con service role, igual que agendar y editar.
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS entrega_citas_select ON entrega_citas;
CREATE POLICY entrega_citas_select ON entrega_citas
  FOR SELECT TO authenticated
  USING (
    jwt_role() IN ('master', 'torredecontrol', 'entregas_editor')
    OR (
      publicada
      AND jwt_role() IN (
        'gerencia', 'financiero', 'contabilidad', 'marketing', 'entregas_viewer'
      )
    )
  );
