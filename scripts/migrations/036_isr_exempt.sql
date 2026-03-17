-- ============================================================================
-- Migration 036: ISR Exempt Flag on Commission Rates (DIFF-08)
-- ============================================================================
-- Adds `isr_exempt` column to commission_rates so the presentation layer
-- can distinguish "Total a facturar" from "Total a pagar" per recipient.
--
-- Guatemala ISR retention formula:
--   Total a facturar = commission_amount × 1.12  (add 12% IVA)
--   ISR retenido     = commission_amount × 0.05  (5% retention on base)
--   Total a pagar    = commission_amount × 1.07  (base + IVA - ISR)
--   Verification: 1.07 / 1.12 = 107/112
--
-- Exempt recipients are company-internal accounts that never receive
-- actual disbursements (no invoice, no ISR).
--
-- No commission recalculation needed — this is metadata only.
-- ============================================================================


-- ============================================================================
-- PHASE A: Add isr_exempt column
-- ============================================================================

ALTER TABLE commission_rates
ADD COLUMN isr_exempt boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN commission_rates.isr_exempt IS
  'True for company-internal accounts (ahorro, puerta_abierta) that are never disbursed to a person. ISR retention does not apply to exempt recipients.';


-- ============================================================================
-- PHASE B: Set exempt for company-internal accounts
-- ============================================================================

UPDATE commission_rates
SET isr_exempt = true
WHERE recipient_id IN ('puerta_abierta', 'ahorro', 'ahorro_comercial', 'ahorro_por_retiro');


-- ============================================================================
-- PHASE C: Validation (run manually after deployment)
-- ============================================================================

-- -- 1. Verify exempt recipients
-- SELECT recipient_id, recipient_name, isr_exempt
-- FROM commission_rates
-- WHERE isr_exempt = true
-- ORDER BY recipient_id;
-- -- Expected: puerta_abierta, ahorro, ahorro_comercial, ahorro_por_retiro
--
-- -- 2. Verify non-exempt recipients
-- SELECT recipient_id, recipient_name, isr_exempt
-- FROM commission_rates
-- WHERE isr_exempt = false AND active = true
-- ORDER BY recipient_id;
-- -- Expected: otto_herrera, referral (and any others)
--
-- -- 3. All rows should have the column
-- SELECT COUNT(*) AS total_rows,
--        COUNT(*) FILTER (WHERE isr_exempt = true) AS exempt,
--        COUNT(*) FILTER (WHERE isr_exempt = false) AS non_exempt
-- FROM commission_rates;
