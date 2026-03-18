-- ============================================================================
-- Migration 038: Accumulation-Only Recipients (DIFF-07)
-- ============================================================================
-- Adds `disbursable` flag to commission_rates.
--
-- SSOT: The Pagos sheet only lists individuals (salespeople, Otto Herrera,
-- referrals). Company-internal accounts (puerta_abierta, ahorro,
-- ahorro_comercial, ahorro_por_retiro) appear in the Resumen Ahorros sheet
-- as accumulated balances — never disbursed.
--
-- disbursable = true  → recipient receives actual payments (default)
-- disbursable = false → accumulation-only (commission tracked, never paid out)
--
-- No recalculation needed. Commission rows are still generated for all
-- recipients — this flag controls presentation and future payment logic.
-- ============================================================================

ALTER TABLE commission_rates
  ADD COLUMN disbursable boolean NOT NULL DEFAULT true;

UPDATE commission_rates
SET disbursable = false
WHERE recipient_id IN ('puerta_abierta', 'ahorro', 'ahorro_comercial', 'ahorro_por_retiro');

COMMENT ON COLUMN commission_rates.disbursable IS
  'Whether this recipient receives actual disbursements. false = accumulation-only (tracked but never paid out).';
