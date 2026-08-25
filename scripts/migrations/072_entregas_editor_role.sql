-- ============================================================================
-- Migration 072: Rol entregas_editor — RLS del tablero de entregas
-- ============================================================================
-- Cambios de RBAC solicitados (2026-08-24):
--   1. Nuevo rol `entregas_editor`: mismo alcance de página que `entregas_viewer`
--      (solo /entregas), pero con permiso de escritura sobre el cronograma.
--   2. `torredecontrol` pasa a SOLO LECTURA en entregas. Conserva intactos
--      todos sus demás permisos de administrador (reservas, pagos, cotizador,
--      auditoría, etc.) — este cambio está acotado al recurso `entregas`.
--
-- Espejo exacto de PERMISSIONS.entregas en src/lib/permissions.ts:
--   view                    → DE = data viewers + entregas_viewer + entregas_editor
--   create / update / delete → EW = master + entregas_editor
--
-- Si estas políticas y la matriz de la app divergen, la API autoriza y luego
-- Postgres rechaza. Mantener ambas en sincronía.
--
-- Idempotente: todas las políticas usan DROP POLICY IF EXISTS.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- entregas
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS entregas_select ON entregas;
CREATE POLICY entregas_select ON entregas
  FOR SELECT TO authenticated
  USING (jwt_role() IN ('master', 'torredecontrol', 'gerencia', 'financiero', 'contabilidad', 'marketing', 'entregas_viewer', 'entregas_editor'));

DROP POLICY IF EXISTS entregas_insert ON entregas;
CREATE POLICY entregas_insert ON entregas
  FOR INSERT TO authenticated
  WITH CHECK (jwt_role() IN ('master', 'entregas_editor'));

DROP POLICY IF EXISTS entregas_update ON entregas;
CREATE POLICY entregas_update ON entregas
  FOR UPDATE TO authenticated
  USING (jwt_role() IN ('master', 'entregas_editor'))
  WITH CHECK (jwt_role() IN ('master', 'entregas_editor'));

DROP POLICY IF EXISTS entregas_delete ON entregas;
CREATE POLICY entregas_delete ON entregas
  FOR DELETE TO authenticated
  USING (jwt_role() IN ('master', 'entregas_editor'));

-- ---------------------------------------------------------------------------
-- entrega_citas
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS entrega_citas_select ON entrega_citas;
CREATE POLICY entrega_citas_select ON entrega_citas
  FOR SELECT TO authenticated
  USING (jwt_role() IN ('master', 'torredecontrol', 'gerencia', 'financiero', 'contabilidad', 'marketing', 'entregas_viewer', 'entregas_editor'));

DROP POLICY IF EXISTS entrega_citas_insert ON entrega_citas;
CREATE POLICY entrega_citas_insert ON entrega_citas
  FOR INSERT TO authenticated
  WITH CHECK (jwt_role() IN ('master', 'entregas_editor'));

DROP POLICY IF EXISTS entrega_citas_update ON entrega_citas;
CREATE POLICY entrega_citas_update ON entrega_citas
  FOR UPDATE TO authenticated
  USING (jwt_role() IN ('master', 'entregas_editor'))
  WITH CHECK (jwt_role() IN ('master', 'entregas_editor'));

DROP POLICY IF EXISTS entrega_citas_delete ON entrega_citas;
CREATE POLICY entrega_citas_delete ON entrega_citas
  FOR DELETE TO authenticated
  USING (jwt_role() IN ('master', 'entregas_editor'));
