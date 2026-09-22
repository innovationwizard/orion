-- ============================================================================
-- Reverso de la migración 073 — Créditos y Entregas
-- ============================================================================
-- GENERADO por scripts/generate-spec.mjs. El módulo es aditivo: esto lo borra
-- entero y deja la base como estaba. Borra también sus datos.
-- ============================================================================

DROP TABLE IF EXISTS pai_credito_expediente_evento, pai_credito_checklist_template, pai_credito_checklist_item, pai_credito_expediente CASCADE;

DROP FUNCTION IF EXISTS pai_credito_expediente_evento_company_id_related();
DROP FUNCTION IF EXISTS pai_credito_checklist_item_company_id_related();
DROP FUNCTION IF EXISTS pai_touch_write_date();
