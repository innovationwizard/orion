-- ============================================================================
-- Migration 073c: Créditos y Entregas — vistas de lectura
-- ============================================================================
-- ESCRITA A MANO, al lado de la migración generada 073: una vista es una consulta,
-- no estructura del modelo.
--
-- Las dos van `WITH (security_invoker = true)`, de modo que las políticas RLS de las
-- tablas de abajo siguen aplicando al usuario que consulta. Sin eso, una vista corre
-- con los permisos de su dueño y enseñaría a cualquiera lo que la política niega.
-- (v_entregas_full, de la migración 071, no lo lleva: queda anotado, no se toca aquí.)
--
-- Una unidad no guarda su proyecto: se llega por piso → torre → proyecto. Por eso las
-- dos vistas leen v_rv_units_full en lugar de rv_units.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- La compra, como la ve quien va a abrir un expediente
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW v_pai_credito_reserva
WITH (security_invoker = true) AS
SELECT
  r.id                      AS reservation_id,
  r.status::text            AS reservation_status,
  (r.status = 'CONFIRMED')  AS confirmada,
  u.project_id,
  u.project_name,
  u.id                      AS unit_id,
  u.unit_number,
  u.tower_name,
  c.full_name               AS cliente,
  EXISTS (
    SELECT 1 FROM pai_credito_expediente e
     WHERE e.reservation_id = r.id AND e.active
  )                         AS tiene_expediente,
  r.created_at
FROM reservations r
JOIN v_rv_units_full u ON u.id = r.unit_id
LEFT JOIN LATERAL (
  SELECT cl.full_name
    FROM reservation_clients rc
    JOIN rv_clients cl ON cl.id = rc.client_id
   WHERE rc.reservation_id = r.id
   ORDER BY rc.is_primary DESC, cl.full_name
   LIMIT 1
) c ON true;

COMMENT ON VIEW v_pai_credito_reserva IS
  'La compra vista desde Créditos: proyecto, torre, unidad y titular, con si ya tiene expediente activo. El formulario de Nuevo Expediente ofrece las confirmadas que todavía no lo tienen.';

-- ---------------------------------------------------------------------------
-- El expediente, con la compra resuelta para el listado
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW v_pai_credito_expediente_full
WITH (security_invoker = true) AS
SELECT
  e.id,
  e.reservation_id,
  e.unit_id,
  e.company_id,
  e.credit_type,
  e.credit_subtype,
  e.state,
  e.cumplimiento_categoria,
  e.desistido_reason,
  e.active,
  e.create_date,
  e.write_date,
  u.project_name,
  u.unit_number,
  u.tower_name,
  c.full_name AS cliente,
  (SELECT count(*) FROM pai_credito_checklist_item i
    WHERE i.expediente_id = e.id AND i.is_required AND i.state = 'pendiente') AS documentos_pendientes
FROM pai_credito_expediente e
JOIN v_rv_units_full u ON u.id = e.unit_id
LEFT JOIN LATERAL (
  SELECT cl.full_name
    FROM reservation_clients rc
    JOIN rv_clients cl ON cl.id = rc.client_id
   WHERE rc.reservation_id = e.reservation_id
   ORDER BY rc.is_primary DESC, cl.full_name
   LIMIT 1
) c ON true;

COMMENT ON VIEW v_pai_credito_expediente_full IS
  'El expediente con su proyecto, torre, unidad y titular, y cuántos documentos obligatorios le faltan. Es lo que lee el listado de la pestaña Operación.';

GRANT SELECT ON v_pai_credito_reserva, v_pai_credito_expediente_full TO authenticated;
