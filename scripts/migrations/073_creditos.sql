-- ============================================================================
-- Migration 073: Créditos y Entregas — expediente, checklist e historial
-- ============================================================================
-- GENERADO por scripts/generate-spec.mjs desde spec/*.json. No editar a mano:
-- cambiar la definición y volver a generar. Su reverso es 073_creditos_down.sql.
--
-- Las reglas del proceso NO están aquí: viven en el servicio de dominio
-- (SDD v5 §6.5). Lo que esta migración impone es lo que la base puede negar por
-- sí sola, y vale igual en la base de PAI APP y en Odoo: que el subtipo
-- pertenezca a su tipo, que el motivo exista solo al desistir, que una reserva
-- tenga un expediente activo, y que el historial solo admita inserción.
--
-- Se aplican aparte, escritos a mano, los dos espejos de reglas de proceso: el
-- disparador que impide cambiar el tipo de crédito y la puerta sobre
-- entrega_citas.
--
-- Idempotente. Verificar contra la base en vivo antes de aplicar: el repositorio
-- no es un retrato completo de producción.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- write_date, como lo haría el ORM de Odoo del otro lado
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION pai_touch_write_date() RETURNS trigger
  LANGUAGE plpgsql SET search_path = public, pg_temp AS $$
BEGIN
  -- clock_timestamp(), no now(): now() es la hora de inicio de la transacción, así que
  -- un cambio hecho en la misma transacción que la creación dejaría las dos fechas
  -- idénticas. El ORM de Odoo registra el momento real de la escritura; esto también.
  NEW.write_date := clock_timestamp();
  RETURN NEW;
END;
$$;

-- ---------------------------------------------------------------------------
-- pai_credito_expediente — Expediente de crédito
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS pai_credito_expediente (
  id                       uuid PRIMARY KEY DEFAULT uuid_v7(),
  reservation_id           uuid NOT NULL REFERENCES reservations(id) ON DELETE RESTRICT,
  unit_id                  uuid NOT NULL REFERENCES rv_units(id) ON DELETE RESTRICT,
  company_id               uuid NOT NULL REFERENCES projects(id) ON DELETE RESTRICT,
  credit_type              text NOT NULL,
  credit_subtype           text NOT NULL,
  state                    text NOT NULL DEFAULT 'en_armado',
  cumplimiento_categoria   text,
  desistido_reason         text,
  active                   boolean NOT NULL DEFAULT true,
  deleted_date             timestamptz,
  deleted_by_id            uuid REFERENCES auth.users(id),
  create_uid               uuid REFERENCES auth.users(id),
  create_date              timestamptz NOT NULL DEFAULT now(),
  write_uid                uuid REFERENCES auth.users(id),
  write_date               timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT pai_credito_expediente_credit_type_valid CHECK (credit_type IN ('contado', 'directo', 'fha')),
  CONSTRAINT pai_credito_expediente_credit_subtype_valid CHECK (credit_subtype IN ('contado_individual', 'contado_juridica', 'directo_negocio_propio', 'directo_relacion_dependencia', 'directo_servicios_profesionales', 'fha_negocio_servicios', 'fha_relacion_dependencia', 'fha_extranjero')),
  CONSTRAINT pai_credito_expediente_state_valid CHECK (state IN ('en_armado', 'expediente_completo', 'autorizacion_contado', 'en_analisis', 'suspendido', 'en_reanalisis', 'aprobado', 'tecnico_validado', 'aprobacion_final', 'en_escrituracion', 'escrituracion_completada', 'entregado', 'firma_completada', 'impuestos_pagados', 'registrado_rgp', 'desembolso_parcial', 'liquidado', 'archivado', 'desistido')),
  CONSTRAINT pai_credito_expediente_cumplimiento_categoria_valid CHECK (cumplimiento_categoria IN ('normal', 'pep', 'cpe')),
  CONSTRAINT pai_credito_expediente_desistido_reason_valid CHECK (desistido_reason IN ('cliente_no_interesado', 'cliente_no_puede_pagar', 'cliente_sin_respuesta', 'equipo_desiste', 'banco_rechazo_definitivo')),
  CONSTRAINT pai_credito_expediente_deleted_coherent CHECK (
    (active IS TRUE AND deleted_date IS NULL AND deleted_by_id IS NULL) OR
    (active IS NOT TRUE AND deleted_date IS NOT NULL AND deleted_by_id IS NOT NULL)),
  CONSTRAINT pai_credito_expediente_subtype_matches_type CHECK (
    (credit_type = 'contado' AND credit_subtype IN ('contado_individual', 'contado_juridica')) OR
    (credit_type = 'directo' AND credit_subtype IN ('directo_negocio_propio', 'directo_relacion_dependencia', 'directo_servicios_profesionales')) OR
    (credit_type = 'fha' AND credit_subtype IN ('fha_negocio_servicios', 'fha_relacion_dependencia', 'fha_extranjero'))),
  CONSTRAINT pai_credito_expediente_desistido_reason_coherent CHECK ((state = 'desistido') = (desistido_reason IS NOT NULL))
);

COMMENT ON TABLE pai_credito_expediente IS 'El expediente de crédito de una compra, desde que Créditos recibe la PCV hasta su archivo o su desistimiento. Uno por reserva. El expediente físico sigue siendo el documento legal: la aplicación refleja lo que ocurre en papel.';
COMMENT ON COLUMN pai_credito_expediente.reservation_id IS 'Reserva. La compra. Solo se abre expediente contra una reserva CONFIRMED: esa confirmación significa que la PCV está firmada y el primer pago recibido.';
COMMENT ON COLUMN pai_credito_expediente.unit_id IS 'Unidad. Tomada de la reserva, como ya lo hace entregas.';
COMMENT ON COLUMN pai_credito_expediente.company_id IS 'Proyecto. El proyecto de la unidad. Se llama company_id porque en Odoo cada proyecto es una compañía.';
COMMENT ON COLUMN pai_credito_expediente.credit_type IS 'Tipo de crédito. Se elige al crear y no se modifica nunca. Cambiar de contado a crédito es un hecho del negocio, no una edición.';
COMMENT ON COLUMN pai_credito_expediente.credit_subtype IS 'Subtipo de crédito. Gobierna qué checklist se copia. Tampoco se modifica: cambiarlo invalidaría el checklist ya marcado.';
COMMENT ON COLUMN pai_credito_expediente.state IS 'Estado. Estado actual del proceso. Solo avanza, y solo por las transiciones que el servicio permite para ese tipo de crédito.';
COMMENT ON COLUMN pai_credito_expediente.cumplimiento_categoria IS 'Categoría de cumplimiento. Espejo informativo de Cumplimiento y único campo editable del expediente.';
COMMENT ON COLUMN pai_credito_expediente.desistido_reason IS 'Motivo de desistimiento. Se registra junto con la transición a desistido, y solo entonces.';
COMMENT ON COLUMN pai_credito_expediente.active IS 'Eliminación lógica: false lo oculta de las lecturas por defecto.';
COMMENT ON COLUMN pai_credito_expediente.deleted_date IS 'Cuándo se eliminó.';
COMMENT ON COLUMN pai_credito_expediente.deleted_by_id IS 'Quién lo eliminó. Bloquea borrar esa cuenta.';
COMMENT ON COLUMN pai_credito_expediente.create_uid IS 'Quién creó la fila. Bloquea borrar esa cuenta.';
COMMENT ON COLUMN pai_credito_expediente.create_date IS 'Cuándo se creó.';
COMMENT ON COLUMN pai_credito_expediente.write_uid IS 'Quién la cambió por última vez.';
COMMENT ON COLUMN pai_credito_expediente.write_date IS 'Cuándo cambió por última vez. La toca un disparador.';

CREATE INDEX IF NOT EXISTS idx_pai_credito_expediente_reservation_id ON pai_credito_expediente (reservation_id);
CREATE INDEX IF NOT EXISTS idx_pai_credito_expediente_company_id ON pai_credito_expediente (company_id);
CREATE INDEX IF NOT EXISTS idx_pai_credito_expediente_state ON pai_credito_expediente (state);
-- Esta reserva ya tiene un expediente.
CREATE UNIQUE INDEX IF NOT EXISTS pai_credito_expediente_reservation_active_uniq ON pai_credito_expediente (reservation_id) WHERE active IS TRUE;

-- ---------------------------------------------------------------------------
-- pai_credito_checklist_item — Documento del checklist
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS pai_credito_checklist_item (
  id                       uuid PRIMARY KEY DEFAULT uuid_v7(),
  expediente_id            uuid NOT NULL REFERENCES pai_credito_expediente(id) ON DELETE CASCADE,
  company_id               uuid REFERENCES projects(id) ON DELETE RESTRICT,
  document_key             text NOT NULL,
  name                     text NOT NULL,
  condition                text,
  is_conditional           boolean NOT NULL DEFAULT false,
  is_required              boolean NOT NULL DEFAULT true,
  is_extra                 boolean NOT NULL DEFAULT false,
  sequence                 integer NOT NULL DEFAULT 10,
  state                    text NOT NULL DEFAULT 'pendiente',
  received_date            timestamptz,
  marked_by_id             uuid REFERENCES auth.users(id) ON DELETE RESTRICT,
  create_uid               uuid REFERENCES auth.users(id),
  create_date              timestamptz NOT NULL DEFAULT now(),
  write_uid                uuid REFERENCES auth.users(id),
  write_date               timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT pai_credito_checklist_item_state_valid CHECK (state IN ('pendiente', 'recibido', 'na')),
  CONSTRAINT pai_credito_checklist_item_expediente_document_uniq UNIQUE (expediente_id, document_key)
);

COMMENT ON TABLE pai_credito_checklist_item IS 'Un documento que este expediente requiere. Es una copia congelada de la fila del catálogo hecha al crear el expediente: editar el catálogo después no altera los documentos ni las marcas de un expediente ya abierto. El equipo también puede agregar aquí un documento que el banco pidió y que el catálogo no lista.';
COMMENT ON COLUMN pai_credito_checklist_item.expediente_id IS 'Expediente';
COMMENT ON COLUMN pai_credito_checklist_item.company_id IS 'Proyecto. El proyecto del expediente, guardado en la fila.';
COMMENT ON COLUMN pai_credito_checklist_item.document_key IS 'Clave del documento';
COMMENT ON COLUMN pai_credito_checklist_item.name IS 'Documento. Copiado del catálogo al crear el expediente.';
COMMENT ON COLUMN pai_credito_checklist_item.condition IS 'Condición. Copiada del catálogo.';
COMMENT ON COLUMN pai_credito_checklist_item.is_conditional IS 'Condicional. Copiado del catálogo: el documento solo aplica en ciertos casos («si aplica», «si co-solicitante»).';
COMMENT ON COLUMN pai_credito_checklist_item.is_required IS 'Obligatorio para este caso. Si este documento debe estar recibido o marcado no aplica antes de declarar el expediente completo. Al copiar el catálogo vale lo contrario de condicional; al agregar un documento a mano lo elige quien lo agrega. Es el único campo que la regla de completitud consulta.';
COMMENT ON COLUMN pai_credito_checklist_item.is_extra IS 'Agregado a mano. Documento que el equipo agregó solo a este expediente, porque el banco lo pidió. Deja constancia de su origen; que detenga o no el avance lo dice obligatorio para este caso.';
COMMENT ON COLUMN pai_credito_checklist_item.sequence IS 'Orden';
COMMENT ON COLUMN pai_credito_checklist_item.state IS 'Estado. Se marca al recibir el documento, y la marca puede deshacerse: equivocarse de fila es un error corriente.';
COMMENT ON COLUMN pai_credito_checklist_item.received_date IS 'Recibido el';
COMMENT ON COLUMN pai_credito_checklist_item.marked_by_id IS 'Marcado por';
COMMENT ON COLUMN pai_credito_checklist_item.create_uid IS 'Quién creó la fila. Bloquea borrar esa cuenta.';
COMMENT ON COLUMN pai_credito_checklist_item.create_date IS 'Cuándo se creó.';
COMMENT ON COLUMN pai_credito_checklist_item.write_uid IS 'Quién la cambió por última vez.';
COMMENT ON COLUMN pai_credito_checklist_item.write_date IS 'Cuándo cambió por última vez. La toca un disparador.';

CREATE INDEX IF NOT EXISTS idx_pai_credito_checklist_item_expediente_id ON pai_credito_checklist_item (expediente_id);
CREATE INDEX IF NOT EXISTS idx_pai_credito_checklist_item_company_id ON pai_credito_checklist_item (company_id);

-- ---------------------------------------------------------------------------
-- pai_credito_checklist_template — Plantilla de checklist
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS pai_credito_checklist_template (
  id                       uuid PRIMARY KEY DEFAULT uuid_v7(),
  credit_type              text NOT NULL,
  credit_subtype           text NOT NULL,
  document_key             text NOT NULL,
  name                     text NOT NULL,
  condition                text,
  is_conditional           boolean NOT NULL DEFAULT false,
  sequence                 integer NOT NULL DEFAULT 10,
  create_uid               uuid REFERENCES auth.users(id),
  create_date              timestamptz NOT NULL DEFAULT now(),
  write_uid                uuid REFERENCES auth.users(id),
  write_date               timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT pai_credito_checklist_template_credit_type_valid CHECK (credit_type IN ('contado', 'directo', 'fha')),
  CONSTRAINT pai_credito_checklist_template_credit_subtype_valid CHECK (credit_subtype IN ('contado_individual', 'contado_juridica', 'directo_negocio_propio', 'directo_relacion_dependencia', 'directo_servicios_profesionales', 'fha_negocio_servicios', 'fha_relacion_dependencia', 'fha_extranjero')),
  CONSTRAINT pai_credito_checklist_template_subtype_document_uniq UNIQUE (credit_subtype, document_key),
  CONSTRAINT pai_credito_checklist_template_subtype_matches_type CHECK (
    (credit_type = 'contado' AND credit_subtype IN ('contado_individual', 'contado_juridica')) OR
    (credit_type = 'directo' AND credit_subtype IN ('directo_negocio_propio', 'directo_relacion_dependencia', 'directo_servicios_profesionales')) OR
    (credit_type = 'fha' AND credit_subtype IN ('fha_negocio_servicios', 'fha_relacion_dependencia', 'fha_extranjero')))
);

COMMENT ON TABLE pai_credito_checklist_template IS 'El catálogo de documentos que exige cada subtipo de crédito, transcrito de los ocho checklists en PDF, que son la autoridad literal. Un solo juego para todos los proyectos: la papelería depende del tipo y subtipo, nunca de la sociedad. Por eso el catálogo no lleva proyecto.';
COMMENT ON COLUMN pai_credito_checklist_template.credit_type IS 'Tipo de crédito';
COMMENT ON COLUMN pai_credito_checklist_template.credit_subtype IS 'Subtipo de crédito';
COMMENT ON COLUMN pai_credito_checklist_template.document_key IS 'Clave del documento. Identificador estable del documento (dpi, rtu, estados_cuenta, …). Es lo que permite comparar el mismo requisito entre subtipos.';
COMMENT ON COLUMN pai_credito_checklist_template.name IS 'Documento. Cómo se llama el documento en pantalla, en español.';
COMMENT ON COLUMN pai_credito_checklist_template.condition IS 'Condición. La salvedad con que el PDF lo pide: «últimos 3 meses», «si co-solicitante», «si posee patente».';
COMMENT ON COLUMN pai_credito_checklist_template.is_conditional IS 'Condicional. Verdadero cuando el documento solo aplica en ciertos casos. Los condicionales no impiden declarar el expediente completo.';
COMMENT ON COLUMN pai_credito_checklist_template.sequence IS 'Orden. Orden en que se muestran los documentos del subtipo.';
COMMENT ON COLUMN pai_credito_checklist_template.create_uid IS 'Quién creó la fila. Bloquea borrar esa cuenta.';
COMMENT ON COLUMN pai_credito_checklist_template.create_date IS 'Cuándo se creó.';
COMMENT ON COLUMN pai_credito_checklist_template.write_uid IS 'Quién la cambió por última vez.';
COMMENT ON COLUMN pai_credito_checklist_template.write_date IS 'Cuándo cambió por última vez. La toca un disparador.';

CREATE INDEX IF NOT EXISTS idx_pai_credito_checklist_template_credit_subtype ON pai_credito_checklist_template (credit_subtype);

-- ---------------------------------------------------------------------------
-- pai_credito_expediente_evento — Evento del historial
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS pai_credito_expediente_evento (
  id                       uuid PRIMARY KEY DEFAULT uuid_v7(),
  expediente_id            uuid NOT NULL REFERENCES pai_credito_expediente(id) ON DELETE RESTRICT,
  company_id               uuid REFERENCES projects(id) ON DELETE RESTRICT,
  action                   text NOT NULL,
  from_state               text,
  to_state                 text,
  desistido_reason         text,
  detail                   jsonb,
  note                     text,
  actor_id                 uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  create_uid               uuid REFERENCES auth.users(id),
  create_date              timestamptz NOT NULL DEFAULT now(),
  write_uid                uuid REFERENCES auth.users(id),
  write_date               timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT pai_credito_expediente_evento_action_valid CHECK (action IN ('creacion', 'transicion', 'marca_checklist', 'edicion', 'nota', 'eliminacion')),
  CONSTRAINT pai_credito_expediente_evento_from_state_valid CHECK (from_state IN ('en_armado', 'expediente_completo', 'autorizacion_contado', 'en_analisis', 'suspendido', 'en_reanalisis', 'aprobado', 'tecnico_validado', 'aprobacion_final', 'en_escrituracion', 'escrituracion_completada', 'entregado', 'firma_completada', 'impuestos_pagados', 'registrado_rgp', 'desembolso_parcial', 'liquidado', 'archivado', 'desistido')),
  CONSTRAINT pai_credito_expediente_evento_to_state_valid CHECK (to_state IN ('en_armado', 'expediente_completo', 'autorizacion_contado', 'en_analisis', 'suspendido', 'en_reanalisis', 'aprobado', 'tecnico_validado', 'aprobacion_final', 'en_escrituracion', 'escrituracion_completada', 'entregado', 'firma_completada', 'impuestos_pagados', 'registrado_rgp', 'desembolso_parcial', 'liquidado', 'archivado', 'desistido')),
  CONSTRAINT pai_credito_expediente_evento_desistido_reason_valid CHECK (desistido_reason IN ('cliente_no_interesado', 'cliente_no_puede_pagar', 'cliente_sin_respuesta', 'equipo_desiste', 'banco_rechazo_definitivo')),
  CONSTRAINT pai_credito_expediente_evento_transition_has_states CHECK (action <> 'transicion' OR (from_state IS NOT NULL AND to_state IS NOT NULL)),
  CONSTRAINT pai_credito_expediente_evento_reason_requires_desistido CHECK (desistido_reason IS NULL OR to_state = 'desistido')
);

COMMENT ON TABLE pai_credito_expediente_evento IS 'El historial del expediente: qué pasó, quién lo hizo y cuándo. Solo admite inserción, para todos los roles, incluido el equipo de Créditos. Sobrevive a la eliminación lógica del expediente e impide su borrado físico. Cada evento se escribe dentro de la misma transacción que el cambio que lo produjo: si el historial falla, el cambio no se confirma. Es además el único lugar del que puede calcularse el tiempo en cada etapa.';
COMMENT ON COLUMN pai_credito_expediente_evento.expediente_id IS 'Expediente. Nunca se borra con su expediente: por eso restrict y no cascade.';
COMMENT ON COLUMN pai_credito_expediente_evento.company_id IS 'Proyecto. El proyecto del expediente, guardado en la fila.';
COMMENT ON COLUMN pai_credito_expediente_evento.action IS 'Acción';
COMMENT ON COLUMN pai_credito_expediente_evento.from_state IS 'Estado anterior. Solo en las transiciones.';
COMMENT ON COLUMN pai_credito_expediente_evento.to_state IS 'Estado nuevo. Solo en las transiciones.';
COMMENT ON COLUMN pai_credito_expediente_evento.desistido_reason IS 'Motivo de desistimiento. Cuando la transición es a desistido.';
COMMENT ON COLUMN pai_credito_expediente_evento.detail IS 'Detalle. Qué cambió: el documento que se marcó, el valor anterior y el nuevo.';
COMMENT ON COLUMN pai_credito_expediente_evento.note IS 'Nota. Texto libre. El equipo lo necesita para situaciones que la máquina de estados no expresa, como un cliente que quiere pasarse a contado.';
COMMENT ON COLUMN pai_credito_expediente_evento.actor_id IS 'Quién. Explícito, y no create_uid, para que el historial se lea igual en las dos bases.';
COMMENT ON COLUMN pai_credito_expediente_evento.create_uid IS 'Quién creó la fila. Bloquea borrar esa cuenta.';
COMMENT ON COLUMN pai_credito_expediente_evento.create_date IS 'Cuándo se creó.';
COMMENT ON COLUMN pai_credito_expediente_evento.write_uid IS 'Quién la cambió por última vez.';
COMMENT ON COLUMN pai_credito_expediente_evento.write_date IS 'Cuándo cambió por última vez. La toca un disparador.';

CREATE INDEX IF NOT EXISTS idx_pai_credito_expediente_evento_expediente_id ON pai_credito_expediente_evento (expediente_id);
CREATE INDEX IF NOT EXISTS idx_pai_credito_expediente_evento_company_id ON pai_credito_expediente_evento (company_id);

-- ---------------------------------------------------------------------------
-- pai_credito_expediente — disparadores
-- ---------------------------------------------------------------------------
DROP TRIGGER IF EXISTS pai_credito_expediente_write_date ON pai_credito_expediente;
CREATE TRIGGER pai_credito_expediente_write_date BEFORE UPDATE ON pai_credito_expediente
  FOR EACH ROW EXECUTE FUNCTION pai_touch_write_date();

-- ---------------------------------------------------------------------------
-- pai_credito_checklist_item — disparadores
-- ---------------------------------------------------------------------------
DROP TRIGGER IF EXISTS pai_credito_checklist_item_write_date ON pai_credito_checklist_item;
CREATE TRIGGER pai_credito_checklist_item_write_date BEFORE UPDATE ON pai_credito_checklist_item
  FOR EACH ROW EXECUTE FUNCTION pai_touch_write_date();

-- company_id se copia de expediente_id.company_id, como un campo relacionado almacenado.
CREATE OR REPLACE FUNCTION pai_credito_checklist_item_company_id_related() RETURNS trigger
  LANGUAGE plpgsql SET search_path = public, pg_temp AS $$
BEGIN
  SELECT company_id INTO NEW.company_id FROM pai_credito_expediente WHERE id = NEW.expediente_id;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS pai_credito_checklist_item_company_id_related ON pai_credito_checklist_item;
CREATE TRIGGER pai_credito_checklist_item_company_id_related BEFORE INSERT OR UPDATE OF expediente_id ON pai_credito_checklist_item
  FOR EACH ROW EXECUTE FUNCTION pai_credito_checklist_item_company_id_related();

-- ---------------------------------------------------------------------------
-- pai_credito_checklist_template — disparadores
-- ---------------------------------------------------------------------------
DROP TRIGGER IF EXISTS pai_credito_checklist_template_write_date ON pai_credito_checklist_template;
CREATE TRIGGER pai_credito_checklist_template_write_date BEFORE UPDATE ON pai_credito_checklist_template
  FOR EACH ROW EXECUTE FUNCTION pai_touch_write_date();

-- ---------------------------------------------------------------------------
-- pai_credito_expediente_evento — disparadores
-- ---------------------------------------------------------------------------
DROP TRIGGER IF EXISTS pai_credito_expediente_evento_write_date ON pai_credito_expediente_evento;
CREATE TRIGGER pai_credito_expediente_evento_write_date BEFORE UPDATE ON pai_credito_expediente_evento
  FOR EACH ROW EXECUTE FUNCTION pai_touch_write_date();

-- company_id se copia de expediente_id.company_id, como un campo relacionado almacenado.
CREATE OR REPLACE FUNCTION pai_credito_expediente_evento_company_id_related() RETURNS trigger
  LANGUAGE plpgsql SET search_path = public, pg_temp AS $$
BEGIN
  SELECT company_id INTO NEW.company_id FROM pai_credito_expediente WHERE id = NEW.expediente_id;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS pai_credito_expediente_evento_company_id_related ON pai_credito_expediente_evento;
CREATE TRIGGER pai_credito_expediente_evento_company_id_related BEFORE INSERT OR UPDATE OF expediente_id ON pai_credito_expediente_evento
  FOR EACH ROW EXECUTE FUNCTION pai_credito_expediente_evento_company_id_related();

-- ---------------------------------------------------------------------------
-- pai_credito_expediente — permisos
-- ---------------------------------------------------------------------------
ALTER TABLE pai_credito_expediente ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS pai_credito_expediente_select ON pai_credito_expediente;
CREATE POLICY pai_credito_expediente_select ON pai_credito_expediente
  FOR SELECT TO authenticated
  USING (jwt_role() IN ('creditos', 'master'));

DROP POLICY IF EXISTS pai_credito_expediente_insert ON pai_credito_expediente;
CREATE POLICY pai_credito_expediente_insert ON pai_credito_expediente
  FOR INSERT TO authenticated
  WITH CHECK (jwt_role() IN ('creditos', 'master'));

DROP POLICY IF EXISTS pai_credito_expediente_update ON pai_credito_expediente;
CREATE POLICY pai_credito_expediente_update ON pai_credito_expediente
  FOR UPDATE TO authenticated
  USING (jwt_role() IN ('creditos', 'master'))
  WITH CHECK (jwt_role() IN ('creditos', 'master'));

DROP POLICY IF EXISTS pai_credito_expediente_delete ON pai_credito_expediente;
-- Sin política de DELETE: nadie puede hacerlo, por diseño.

-- ---------------------------------------------------------------------------
-- pai_credito_checklist_item — permisos
-- ---------------------------------------------------------------------------
ALTER TABLE pai_credito_checklist_item ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS pai_credito_checklist_item_select ON pai_credito_checklist_item;
CREATE POLICY pai_credito_checklist_item_select ON pai_credito_checklist_item
  FOR SELECT TO authenticated
  USING (jwt_role() IN ('creditos', 'master'));

DROP POLICY IF EXISTS pai_credito_checklist_item_insert ON pai_credito_checklist_item;
CREATE POLICY pai_credito_checklist_item_insert ON pai_credito_checklist_item
  FOR INSERT TO authenticated
  WITH CHECK (jwt_role() IN ('creditos', 'master'));

DROP POLICY IF EXISTS pai_credito_checklist_item_update ON pai_credito_checklist_item;
CREATE POLICY pai_credito_checklist_item_update ON pai_credito_checklist_item
  FOR UPDATE TO authenticated
  USING (jwt_role() IN ('creditos', 'master'))
  WITH CHECK (jwt_role() IN ('creditos', 'master'));

DROP POLICY IF EXISTS pai_credito_checklist_item_delete ON pai_credito_checklist_item;
-- Sin política de DELETE: nadie puede hacerlo, por diseño.

-- ---------------------------------------------------------------------------
-- pai_credito_checklist_template — permisos
-- ---------------------------------------------------------------------------
ALTER TABLE pai_credito_checklist_template ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS pai_credito_checklist_template_select ON pai_credito_checklist_template;
CREATE POLICY pai_credito_checklist_template_select ON pai_credito_checklist_template
  FOR SELECT TO authenticated
  USING (jwt_role() IN ('creditos', 'master'));

DROP POLICY IF EXISTS pai_credito_checklist_template_insert ON pai_credito_checklist_template;
CREATE POLICY pai_credito_checklist_template_insert ON pai_credito_checklist_template
  FOR INSERT TO authenticated
  WITH CHECK (jwt_role() IN ('master'));

DROP POLICY IF EXISTS pai_credito_checklist_template_update ON pai_credito_checklist_template;
CREATE POLICY pai_credito_checklist_template_update ON pai_credito_checklist_template
  FOR UPDATE TO authenticated
  USING (jwt_role() IN ('master'))
  WITH CHECK (jwt_role() IN ('master'));

DROP POLICY IF EXISTS pai_credito_checklist_template_delete ON pai_credito_checklist_template;
-- Sin política de DELETE: nadie puede hacerlo, por diseño.

-- ---------------------------------------------------------------------------
-- pai_credito_expediente_evento — permisos
-- ---------------------------------------------------------------------------
ALTER TABLE pai_credito_expediente_evento ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS pai_credito_expediente_evento_select ON pai_credito_expediente_evento;
CREATE POLICY pai_credito_expediente_evento_select ON pai_credito_expediente_evento
  FOR SELECT TO authenticated
  USING (jwt_role() IN ('creditos', 'master'));

DROP POLICY IF EXISTS pai_credito_expediente_evento_insert ON pai_credito_expediente_evento;
CREATE POLICY pai_credito_expediente_evento_insert ON pai_credito_expediente_evento
  FOR INSERT TO authenticated
  WITH CHECK (jwt_role() IN ('creditos', 'master'));

DROP POLICY IF EXISTS pai_credito_expediente_evento_update ON pai_credito_expediente_evento;
-- Sin política de UPDATE: nadie puede hacerlo, por diseño.

DROP POLICY IF EXISTS pai_credito_expediente_evento_delete ON pai_credito_expediente_evento;
-- Sin política de DELETE: nadie puede hacerlo, por diseño.

-- ---------------------------------------------------------------------------
-- pai_credito_checklist_template — datos de referencia (88 filas)
-- ---------------------------------------------------------------------------
INSERT INTO pai_credito_checklist_template (credit_type, credit_subtype, document_key, name, condition, is_conditional, sequence) VALUES
  ('directo', 'directo_negocio_propio', 'constancia_ingresos', 'Constancia de ingresos de perito contador', 'Original', 'false', '10'),
  ('directo', 'directo_negocio_propio', 'estados_financieros', 'Estados financieros', 'Últimos 2 o 3 años', 'false', '20'),
  ('directo', 'directo_negocio_propio', 'estados_cuenta', 'Estados de cuenta bancarios', 'Últimos 3 meses', 'false', '30'),
  ('directo', 'directo_negocio_propio', 'dpi', 'DPI', NULL, 'false', '40'),
  ('directo', 'directo_negocio_propio', 'rtu', 'RTU', NULL, 'false', '50'),
  ('directo', 'directo_negocio_propio', 'recibo_servicios', 'Recibo de servicios', NULL, 'false', '60'),
  ('directo', 'directo_negocio_propio', 'patente_comercio', 'Patente de comercio', NULL, 'false', '70'),
  ('directo', 'directo_negocio_propio', 'flujo_efectivo', 'Flujo de efectivo', 'Si aplica y si el banco lo solicita', 'true', '80'),
  ('directo', 'directo_negocio_propio', 'recopilacion_datos', 'Documento de recopilación de datos', NULL, 'false', '90'),
  ('directo', 'directo_negocio_propio', 'formularios_banco', 'Formularios del banco', 'Los llena el proyecto y se envían al cliente para firma', 'false', '100'),
  ('directo', 'directo_negocio_propio', 'documento_parentesco', 'Documento de parentesco', 'Si participa en el crédito con otra persona: certificado de matrimonio, partida de nacimiento, acta de compromiso', 'true', '110'),
  ('directo', 'directo_relacion_dependencia', 'constancia_ingresos', 'Constancia de ingresos membretada', 'Original', 'false', '10'),
  ('directo', 'directo_relacion_dependencia', 'estados_cuenta', 'Estados de cuenta bancarios', 'Últimos 3 meses', 'false', '20'),
  ('directo', 'directo_relacion_dependencia', 'dpi', 'DPI', NULL, 'false', '30'),
  ('directo', 'directo_relacion_dependencia', 'rtu', 'RTU', NULL, 'false', '40'),
  ('directo', 'directo_relacion_dependencia', 'recibo_servicios', 'Recibo de servicios', NULL, 'false', '50'),
  ('directo', 'directo_relacion_dependencia', 'recopilacion_datos', 'Documento de recopilación de datos', NULL, 'false', '60'),
  ('directo', 'directo_relacion_dependencia', 'formularios_banco', 'Formularios del banco', 'Los llena el proyecto y se envían al cliente para firma', 'false', '70'),
  ('directo', 'directo_relacion_dependencia', 'documento_parentesco', 'Documento de parentesco', 'Si participa en el crédito con otra persona: certificado de matrimonio, partida de nacimiento, acta de compromiso', 'true', '80'),
  ('directo', 'directo_servicios_profesionales', 'constancia_ingresos', 'Constancia de ingresos de perito contador', 'Original', 'false', '10'),
  ('directo', 'directo_servicios_profesionales', 'facturas', 'Facturas', 'Últimos 3 meses', 'false', '20'),
  ('directo', 'directo_servicios_profesionales', 'declaraciones_sat', 'Declaraciones de impuestos ante SAT', 'Últimos 3 meses', 'false', '30'),
  ('directo', 'directo_servicios_profesionales', 'estados_cuenta', 'Estados de cuenta bancarios', 'Últimos 3 meses', 'false', '40'),
  ('directo', 'directo_servicios_profesionales', 'dpi', 'DPI', NULL, 'false', '50'),
  ('directo', 'directo_servicios_profesionales', 'rtu', 'RTU', NULL, 'false', '60'),
  ('directo', 'directo_servicios_profesionales', 'recibo_servicios', 'Recibo de servicios', NULL, 'false', '70'),
  ('directo', 'directo_servicios_profesionales', 'recopilacion_datos', 'Documento de recopilación de datos', NULL, 'false', '80'),
  ('directo', 'directo_servicios_profesionales', 'formularios_banco', 'Formularios del banco', 'Los llena el proyecto y se envían al cliente para firma', 'false', '90'),
  ('directo', 'directo_servicios_profesionales', 'documento_parentesco', 'Documento de parentesco', 'Si participa en el crédito con otra persona: certificado de matrimonio, partida de nacimiento, acta de compromiso', 'true', '100'),
  ('fha', 'fha_negocio_servicios', 'constancia_ingresos', 'Constancia de ingresos de perito contador', 'Original', 'false', '10'),
  ('fha', 'fha_negocio_servicios', 'facturas', 'Facturas', 'Últimos 3 meses; solo servicios profesionales', 'true', '20'),
  ('fha', 'fha_negocio_servicios', 'declaraciones_sat', 'Declaraciones de impuestos ante SAT (IVA e ISR)', 'Últimos 3 meses', 'false', '30'),
  ('fha', 'fha_negocio_servicios', 'patente_comercio', 'Patente de comercio', 'Si aplica', 'true', '40'),
  ('fha', 'fha_negocio_servicios', 'estados_cuenta', 'Estados de cuenta bancarios', 'Últimos 3 meses', 'false', '50'),
  ('fha', 'fha_negocio_servicios', 'dpi', 'DPI', NULL, 'false', '60'),
  ('fha', 'fha_negocio_servicios', 'rtu', 'RTU', NULL, 'false', '70'),
  ('fha', 'fha_negocio_servicios', 'recibo_servicios', 'Recibo de servicios', NULL, 'false', '80'),
  ('fha', 'fha_negocio_servicios', 'recopilacion_datos', 'Documento de recopilación de datos', NULL, 'false', '90'),
  ('fha', 'fha_negocio_servicios', 'formularios_fha', 'Formularios FHA', 'Los llena el proyecto y se envían al cliente para firma', 'false', '100'),
  ('fha', 'fha_negocio_servicios', 'formularios_banco', 'Formularios del banco', 'Los llena el proyecto y se envían al cliente para firma', 'false', '110'),
  ('fha', 'fha_negocio_servicios', 'documento_parentesco', 'Documento de parentesco', 'Si participa en el crédito con otra persona: certificado de matrimonio, partida de nacimiento, acta de compromiso', 'true', '120'),
  ('fha', 'fha_relacion_dependencia', 'constancia_ingresos', 'Constancia de ingresos membretada', 'Original; mínimo 1 año de estabilidad laboral', 'false', '10'),
  ('fha', 'fha_relacion_dependencia', 'carta_continuidad_laboral', 'Carta de continuidad laboral', 'Si no tiene 1 año de estabilidad laboral', 'true', '20'),
  ('fha', 'fha_relacion_dependencia', 'estados_cuenta', 'Estados de cuenta bancarios', 'Últimos 3 meses', 'false', '30'),
  ('fha', 'fha_relacion_dependencia', 'dpi', 'DPI', NULL, 'false', '40'),
  ('fha', 'fha_relacion_dependencia', 'rtu', 'RTU', NULL, 'false', '50'),
  ('fha', 'fha_relacion_dependencia', 'recibo_servicios', 'Recibo de servicios', NULL, 'false', '60'),
  ('fha', 'fha_relacion_dependencia', 'recopilacion_datos', 'Documento de recopilación de datos', NULL, 'false', '70'),
  ('fha', 'fha_relacion_dependencia', 'formularios_fha', 'Formularios FHA', 'Los llena el proyecto y se envían al cliente para firma', 'false', '80'),
  ('fha', 'fha_relacion_dependencia', 'formularios_banco', 'Formularios del banco', 'Los llena el proyecto y se envían al cliente para firma', 'false', '90'),
  ('fha', 'fha_relacion_dependencia', 'documento_parentesco', 'Documento de parentesco', 'Si participa en el crédito con otra persona: certificado de matrimonio, partida de nacimiento, acta de compromiso', 'true', '100'),
  ('fha', 'fha_extranjero', 'dpi', 'DPI del solicitante', 'Copia certificada por notario guatemalteco, con pases de ley o apostilla', 'false', '10'),
  ('fha', 'fha_extranjero', 'rtu', 'RTU del solicitante', 'Copia certificada por notario guatemalteco, con pases de ley o apostilla', 'false', '20'),
  ('fha', 'fha_extranjero', 'recibo_servicios_mandatario', 'Recibo de servicios del mandatario', 'Copia certificada por notario guatemalteco, con pases de ley o apostilla', 'false', '30'),
  ('fha', 'fha_extranjero', 'dpi_mandatario', 'DPI del mandatario', 'Copia certificada por notario guatemalteco, con pases de ley o apostilla', 'false', '40'),
  ('fha', 'fha_extranjero', 'rtu_mandatario', 'RTU del mandatario', 'Copia certificada por notario guatemalteco, con pases de ley o apostilla', 'false', '50'),
  ('fha', 'fha_extranjero', 'constancia_ingresos', 'Constancia de ingresos', 'Original, en papel membretado de la empresa o emitida por el contador si tiene negocio propio', 'false', '60'),
  ('fha', 'fha_extranjero', 'traduccion_jurada', 'Traducción jurada de la constancia de ingresos', 'Certificada por notario guatemalteco, con pases de ley o apostilla', 'false', '70'),
  ('fha', 'fha_extranjero', 'estados_cuenta', 'Estados de cuenta bancarios', 'Últimos 3 meses', 'false', '80'),
  ('fha', 'fha_extranjero', 'declaracion_isr_extranjero', 'Declaración anual de impuestos sobre la renta y sus anexos (TAXES)', 'De su país de residencia; últimos 2 años y lo parcial del año en curso', 'false', '90'),
  ('fha', 'fha_extranjero', 'mandato_judicial', 'Mandato General Judicial con Representación y Cláusula Especial', 'Que permita comprar, hipotecar y ceder en pago; en español', 'false', '100'),
  ('contado', 'contado_individual', 'estados_cuenta', 'Estados de cuenta', 'Últimos 6 meses', 'false', '10'),
  ('contado', 'contado_individual', 'dpi', 'DPI', 'Actualizado', 'false', '20'),
  ('contado', 'contado_individual', 'rtu', 'RTU', 'Actualizado', 'false', '30'),
  ('contado', 'contado_individual', 'recibo_servicios', 'Recibo de servicios', NULL, 'false', '40'),
  ('contado', 'contado_individual', 'constancia_ingresos', 'Constancia de ingresos', 'Si trabaja en relación de dependencia', 'true', '50'),
  ('contado', 'contado_individual', 'certificacion_contador', 'Certificación de contador', 'Si tiene negocio propio o presta servicios profesionales', 'true', '60'),
  ('contado', 'contado_individual', 'estados_financieros', 'Estados financieros', '1 año y lo parcial del año en curso; si tiene negocio propio', 'true', '70'),
  ('contado', 'contado_individual', 'facturas_declaraciones_sat', 'Facturas por servicios y declaraciones ante SAT', 'Últimos 6 meses; si presta servicios profesionales o tiene negocio propio', 'true', '80'),
  ('contado', 'contado_individual', 'respaldo_pago_contado', 'Documento que respalde el pago de contado', NULL, 'false', '90'),
  ('contado', 'contado_individual', 'escritura_constitucion', 'Escritura de constitución de sociedad', 'Si el apartamento se escritura a nombre de una sociedad', 'true', '100'),
  ('contado', 'contado_individual', 'nombramiento_representante', 'Nombramiento de representante legal', 'Si el apartamento se escritura a nombre de una sociedad', 'true', '110'),
  ('contado', 'contado_individual', 'patente_sociedad', 'Patente de comercio y de sociedad', 'Si se escritura a nombre de una sociedad y si la posee', 'true', '120'),
  ('contado', 'contado_individual', 'rtu_sociedad', 'RTU de la sociedad', 'Si el apartamento se escritura a nombre de una sociedad', 'true', '130'),
  ('contado', 'contado_individual', 'dpi_representante', 'DPI del representante legal', 'Si el apartamento se escritura a nombre de una sociedad', 'true', '140'),
  ('contado', 'contado_individual', 'rtu_representante', 'RTU del representante legal', 'Si el apartamento se escritura a nombre de una sociedad', 'true', '150'),
  ('contado', 'contado_individual', 'recibo_servicios_sociedad', 'Recibo de servicios de la sociedad', 'Si el apartamento se escritura a nombre de una sociedad', 'true', '160'),
  ('contado', 'contado_individual', 'recibo_servicios_representante', 'Recibo de servicios del representante legal', 'Si el apartamento se escritura a nombre de una sociedad', 'true', '170'),
  ('contado', 'contado_individual', 'punto_acta', 'Punto de acta', 'Si el nombramiento no faculta al representante legal para aportar inmuebles a la sociedad', 'true', '180'),
  ('contado', 'contado_juridica', 'escritura_constitucion', 'Escritura de constitución de sociedad', NULL, 'false', '10'),
  ('contado', 'contado_juridica', 'nombramiento_representante', 'Nombramiento de representante legal', NULL, 'false', '20'),
  ('contado', 'contado_juridica', 'patente_sociedad', 'Patente de comercio y de sociedad', 'Si la posee', 'true', '30'),
  ('contado', 'contado_juridica', 'rtu_sociedad', 'RTU de la sociedad', NULL, 'false', '40'),
  ('contado', 'contado_juridica', 'recibo_servicios_sociedad', 'Recibo de servicios de la sociedad', NULL, 'false', '50'),
  ('contado', 'contado_juridica', 'recibo_servicios_representante', 'Recibo de servicios del representante legal', NULL, 'false', '60'),
  ('contado', 'contado_juridica', 'estados_financieros', 'Estados financieros', 'Último año y lo parcial del presente', 'false', '70'),
  ('contado', 'contado_juridica', 'estados_cuenta', 'Estados de cuenta bancarios', 'Últimos 6 meses', 'false', '80'),
  ('contado', 'contado_juridica', 'punto_acta', 'Punto de acta', 'Si el nombramiento no faculta al representante legal para aportar inmuebles a la sociedad', 'true', '90')
ON CONFLICT (credit_subtype, document_key) DO UPDATE SET credit_type = EXCLUDED.credit_type, name = EXCLUDED.name, condition = EXCLUDED.condition, is_conditional = EXCLUDED.is_conditional, sequence = EXCLUDED.sequence;
