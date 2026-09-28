-- ============================================================================
-- Migration 075: Entregas — titulares editables desde el tablero
-- ============================================================================
-- Solicitado 2026-09-28: `entregas_editor` debe poder corregir la ortografía
-- del nombre de los titulares desde el modal de /entregas.
--
-- Los errores son ortográficos reales (acentos, letras cambiadas), no de
-- formato: se verificaron los 25 titulares del tablero con heurísticas de
-- formato y ninguno dio positivo. Por eso la corrección es manual y necesita
-- UI — no hay script que los detecte.
--
-- Dos cambios, ambos aditivos:
--
--   1. v_entregas_full expone `titulares`: un jsonb array con TODOS los
--      titulares de la reserva (no solo el is_primary), cada uno con su
--      rv_clients.id. Hasta ahora la vista devolvía `cliente` como texto suelto
--      sin el id, así que el tablero no tenía a quién direccionar la edición.
--      Se incluyen los copropietarios porque 3 reservas del cronograma
--      (aptos 209, 203, 211) tienen un segundo titular que el tablero no
--      mostraba y que también puede traer el nombre mal escrito.
--
--   2. RLS de rv_clients: política de UPDATE para los roles que la matriz de
--      la app ya autoriza. `rv_clients` tenía política de SELECT (migración
--      040) pero ninguna de UPDATE, así que la autorización vivía solo en la
--      capa de API. Esto la baja también a Postgres.
--
-- `cliente` y `cliente_phone` se conservan intactos: los consume el tablero
-- (título del modal, búsqueda, tarjetas) y el objetivo es no romper nada.
--
-- Idempotente.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. v_entregas_full — agrega `titulares`
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
  -- Todos los titulares con su id, para poder editarlos. El titular principal
  -- va primero; el resto por document_order, que es el orden en que aparecen
  -- en la escritura.
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
  )                   AS titulares
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
  'Una fila por cita de entrega, con unidad, proyecto y titulares resueltos. Alimenta el tablero /entregas. `titulares` trae todos los copropietarios con su id para edición.';

-- ---------------------------------------------------------------------------
-- 2. rv_clients — política de UPDATE
-- ---------------------------------------------------------------------------
-- Espejo de PERMISSIONS.clients.update en src/lib/permissions.ts tras el
-- cambio de 2026-09-28: master + torredecontrol + entregas_editor.
-- torredecontrol es la gerencia de ventas; entregas_editor entra para poder
-- corregir titulares desde el cronograma.
--
-- Si esta política y la matriz de la app divergen, la API autoriza y luego
-- Postgres rechaza. Mantener ambas en sincronía.
DROP POLICY IF EXISTS "Role-scoped update rv_clients" ON rv_clients;
CREATE POLICY "Role-scoped update rv_clients"
  ON rv_clients FOR UPDATE
  TO authenticated
  USING (jwt_role() IN ('master', 'torredecontrol', 'entregas_editor'))
  WITH CHECK (jwt_role() IN ('master', 'torredecontrol', 'entregas_editor'));
