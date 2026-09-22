-- ============================================================================
-- Migration 073b: Créditos y Entregas — funciones de escritura y candado del tipo
-- ============================================================================
-- ESCRITA A MANO, al lado de la migración generada 073. Aquí va lo que es
-- comportamiento, y por eso no sale de la definición JSON (guide.md §14, resp. 1).
--
-- Dos cosas:
--
--   1. Las dos únicas puertas de escritura que usa PAI APP. No deciden ninguna
--      regla de negocio —eso ya lo hizo el servicio de dominio—; garantizan que el
--      cambio y su evento de historial entren juntos o no entre ninguno. Son el
--      espejo exacto de los dos métodos del addon de Odoo, donde hacen falta
--      porque cada llamada a su API es su propia transacción.
--
--   2. El candado del tipo de crédito. El servicio lo impide y el formulario ni
--      siquiera ofrece el campo; este disparador es lo que de verdad lo garantiza
--      si alguien escribe por fuera de la aplicación.
--
-- La puerta sobre entrega_citas —no completar la cita de llaves sin escrituración
-- completada— NO está aquí: toca una tabla que Entregas usa a diario y se aplica
-- en E10, ensayada antes (SDD v5 §8.6).
--
-- Idempotente. Las funciones fijan search_path y solo las ejecuta service_role.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Crear un expediente, su checklist y su evento de creación, en una transacción
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_pai_credito_crear_expediente(
  p_expediente jsonb,   -- columnas del expediente
  p_items      jsonb,   -- arreglo de documentos, copiados del catálogo
  p_evento     jsonb    -- el evento 'creacion', sin expediente_id
) RETURNS uuid
  LANGUAGE plpgsql
  SECURITY INVOKER
  SET search_path = public, pg_temp
AS $$
DECLARE
  v_id uuid;
BEGIN
  INSERT INTO pai_credito_expediente (
    reservation_id, unit_id, company_id, credit_type, credit_subtype,
    cumplimiento_categoria, create_uid, write_uid
  )
  SELECT
    (p_expediente ->> 'reservation_id')::uuid,
    (p_expediente ->> 'unit_id')::uuid,
    (p_expediente ->> 'company_id')::uuid,
    p_expediente ->> 'credit_type',
    p_expediente ->> 'credit_subtype',
    p_expediente ->> 'cumplimiento_categoria',
    (p_evento ->> 'actor_id')::uuid,
    (p_evento ->> 'actor_id')::uuid
  RETURNING id INTO v_id;

  INSERT INTO pai_credito_checklist_item (
    expediente_id, document_key, name, condition,
    is_conditional, is_required, is_extra, sequence, create_uid, write_uid
  )
  SELECT
    v_id,
    item ->> 'document_key',
    item ->> 'name',
    item ->> 'condition',
    COALESCE((item ->> 'is_conditional')::boolean, false),
    COALESCE((item ->> 'is_required')::boolean, true),
    COALESCE((item ->> 'is_extra')::boolean, false),
    COALESCE((item ->> 'sequence')::integer, 10),
    (p_evento ->> 'actor_id')::uuid,
    (p_evento ->> 'actor_id')::uuid
  FROM jsonb_array_elements(p_items) AS item;

  INSERT INTO pai_credito_expediente_evento (
    expediente_id, action, from_state, to_state, desistido_reason, detail, note, actor_id, create_uid
  )
  VALUES (
    v_id,
    p_evento ->> 'action',
    p_evento ->> 'from_state',
    p_evento ->> 'to_state',
    p_evento ->> 'desistido_reason',
    p_evento -> 'detail',
    p_evento ->> 'note',
    (p_evento ->> 'actor_id')::uuid,
    (p_evento ->> 'actor_id')::uuid
  );

  RETURN v_id;
END;
$$;

COMMENT ON FUNCTION fn_pai_credito_crear_expediente(jsonb, jsonb, jsonb) IS
  'Crea un expediente con su checklist y su evento de creación en una sola transacción. No decide reglas: el servicio de dominio ya decidió.';

-- ---------------------------------------------------------------------------
-- Aplicar un cambio ya decidido y registrar su evento, en una transacción
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_pai_credito_aplicar_cambio(
  p_expediente_id uuid,
  p_cambios       jsonb,   -- columnas del expediente a cambiar; {} para una nota
  p_item          jsonb,   -- marca de un documento: {id, state, received_date}; null si no aplica
  p_evento        jsonb
) RETURNS void
  LANGUAGE plpgsql
  SECURITY INVOKER
  SET search_path = public, pg_temp
AS $$
DECLARE
  v_actor uuid := (p_evento ->> 'actor_id')::uuid;
BEGIN
  IF p_cambios IS NOT NULL AND p_cambios <> '{}'::jsonb THEN
    UPDATE pai_credito_expediente SET
      state                  = COALESCE(p_cambios ->> 'state', state),
      desistido_reason       = CASE WHEN p_cambios ? 'desistido_reason'
                                    THEN p_cambios ->> 'desistido_reason' ELSE desistido_reason END,
      cumplimiento_categoria = CASE WHEN p_cambios ? 'cumplimiento_categoria'
                                    THEN p_cambios ->> 'cumplimiento_categoria' ELSE cumplimiento_categoria END,
      active                 = COALESCE((p_cambios ->> 'active')::boolean, active),
      deleted_date           = CASE WHEN p_cambios ? 'deleted_date'
                                    THEN (p_cambios ->> 'deleted_date')::timestamptz ELSE deleted_date END,
      deleted_by_id          = CASE WHEN p_cambios ? 'deleted_by_id'
                                    THEN (p_cambios ->> 'deleted_by_id')::uuid ELSE deleted_by_id END,
      write_uid              = v_actor
    WHERE id = p_expediente_id;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'El expediente % no existe', p_expediente_id USING ERRCODE = 'no_data_found';
    END IF;
  END IF;

  IF p_item IS NOT NULL THEN
    UPDATE pai_credito_checklist_item SET
      state         = COALESCE(p_item ->> 'state', state),
      received_date = CASE WHEN p_item ? 'received_date'
                           THEN (p_item ->> 'received_date')::timestamptz ELSE received_date END,
      marked_by_id  = v_actor,
      write_uid     = v_actor
    WHERE id = (p_item ->> 'id')::uuid AND expediente_id = p_expediente_id;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'El documento % no pertenece a este expediente', p_item ->> 'id'
        USING ERRCODE = 'no_data_found';
    END IF;
  END IF;

  INSERT INTO pai_credito_expediente_evento (
    expediente_id, action, from_state, to_state, desistido_reason, detail, note, actor_id, create_uid
  )
  VALUES (
    p_expediente_id,
    p_evento ->> 'action',
    p_evento ->> 'from_state',
    p_evento ->> 'to_state',
    p_evento ->> 'desistido_reason',
    p_evento -> 'detail',
    p_evento ->> 'note',
    v_actor,
    v_actor
  );
END;
$$;

COMMENT ON FUNCTION fn_pai_credito_aplicar_cambio(uuid, jsonb, jsonb, jsonb) IS
  'Aplica un cambio que el servicio de dominio ya decidió y escribe su evento, en una sola transacción. Si el historial falla, el cambio no se confirma.';

-- ---------------------------------------------------------------------------
-- Agregar a un expediente un documento que el catálogo no lista, con su evento
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_pai_credito_agregar_documento(
  p_expediente_id uuid,
  p_item          jsonb,
  p_evento        jsonb
) RETURNS uuid
  LANGUAGE plpgsql
  SECURITY INVOKER
  SET search_path = public, pg_temp
AS $$
DECLARE
  v_id    uuid;
  v_actor uuid := (p_evento ->> 'actor_id')::uuid;
BEGIN
  INSERT INTO pai_credito_checklist_item (
    expediente_id, document_key, name, condition,
    is_conditional, is_required, is_extra, sequence, create_uid, write_uid
  )
  SELECT
    p_expediente_id,
    p_item ->> 'document_key',
    p_item ->> 'name',
    p_item ->> 'condition',
    false,
    COALESCE((p_item ->> 'is_required')::boolean, true),
    true,                                   -- agregado a mano, siempre
    COALESCE((SELECT max(sequence) FROM pai_credito_checklist_item
               WHERE expediente_id = p_expediente_id), 0) + 10,
    v_actor, v_actor
  RETURNING id INTO v_id;

  INSERT INTO pai_credito_expediente_evento (
    expediente_id, action, detail, note, actor_id, create_uid
  )
  VALUES (
    p_expediente_id, p_evento ->> 'action', p_evento -> 'detail', p_evento ->> 'note', v_actor, v_actor
  );

  RETURN v_id;
END;
$$;

COMMENT ON FUNCTION fn_pai_credito_agregar_documento(uuid, jsonb, jsonb) IS
  'Agrega a un expediente un documento que el catálogo no lista, con su evento, en una sola transacción. Siempre queda marcado como agregado a mano; quien lo agrega decide si es obligatorio para el caso.';

-- Las tres son SECURITY INVOKER: corren con el rol de quien llama, de modo que las
-- políticas RLS de las tablas siguen aplicando dentro de la función. Por eso pueden
-- otorgarse a `authenticated` sin abrir nada: si el rol del usuario no tiene permiso
-- sobre la tabla, la escritura no alcanza ninguna fila y la función lo detecta.
-- Es lo contrario del patrón de desist_reservation(), que es SECURITY DEFINER,
-- está otorgada a anon y no comprueba quién llama — ese patrón no se copia.
--
-- service_role se conserva para el único camino que no corre como el usuario: cuando
-- Entregas completa la cita de llaves, quien escribe el expediente es el equipo de
-- Entregas, que no tiene permiso propio sobre estas tablas (SDD v5 §8.6).
REVOKE ALL ON FUNCTION fn_pai_credito_crear_expediente(jsonb, jsonb, jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION fn_pai_credito_aplicar_cambio(uuid, jsonb, jsonb, jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION fn_pai_credito_agregar_documento(uuid, jsonb, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION fn_pai_credito_crear_expediente(jsonb, jsonb, jsonb) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION fn_pai_credito_aplicar_cambio(uuid, jsonb, jsonb, jsonb) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION fn_pai_credito_agregar_documento(uuid, jsonb, jsonb) TO authenticated, service_role;

-- ---------------------------------------------------------------------------
-- El tipo y el subtipo de crédito no se modifican nunca
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_pai_credito_tipo_inmutable() RETURNS trigger
  LANGUAGE plpgsql SET search_path = public, pg_temp AS $$
BEGIN
  IF NEW.credit_type IS DISTINCT FROM OLD.credit_type
     OR NEW.credit_subtype IS DISTINCT FROM OLD.credit_subtype THEN
    RAISE EXCEPTION 'El tipo y el subtipo de crédito no se pueden modificar'
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS pai_credito_expediente_tipo_inmutable ON pai_credito_expediente;
CREATE TRIGGER pai_credito_expediente_tipo_inmutable
  BEFORE UPDATE ON pai_credito_expediente
  FOR EACH ROW EXECUTE FUNCTION fn_pai_credito_tipo_inmutable();
