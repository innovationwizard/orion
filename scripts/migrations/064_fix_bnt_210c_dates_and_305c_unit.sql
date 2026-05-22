-- ============================================================================
-- Migration 064: Fix BNT 210-C sale dates + BNT 305-C → 305-D unit correction
-- ============================================================================
-- Source: docs/manifest-CIERRE_COBROS_ABRIL.md — FLAG-C3 and FLAG-C4 (both RESOLVED)
--
-- FIX 1: BNT Apto 210 TC — Karol del Rosario Mayen Gutierrez
--   Migration 061 imported this sale using CIERRE_RESERVAS_ABRIL.xlsx Row 2
--   with sale_date = 2026-04-30. Pati confirmed: Karen Elizabeth Barahona Escobar
--   desisted 2026-04-15 (already cancelled in DB). New sale to Karol Mayen was
--   on 2026-05-04 — NOT 2026-04-30. promise_signed_date must also move to 2026-05-04.
--   Reservation payment_date corrected accordingly.
--   COBROS April consequence: the Q1,482 Karen paid in April is on a cancelled sale —
--   do NOT import. Karol's Q1,500 reservation is a May payment — not in April scope.
--
--   Sale:    4ce108e3-6b10-4ff5-9bbc-acc07d472c49
--   Payment: b4d71f9c-9439-4c74-8a30-d8f06b38d513
--
-- FIX 2: BNT Apto 305 — Manuel Bolom Yaxcal
--   Migration 061 inserted unit_id pointing to 305-C. Pati confirmed the actual
--   unit is Torre D. Correcting unit_id to 305-D.
--   COBROS April consequence: Q1,500 in COBROS = Phase 1 reservation, already in DB
--   on the corrected unit. No Phase 2 insert needed for April.
--
--   Sale:    2923fcb4-1a80-4515-9680-e54cc0189dd2
--   Payment: f2a0c07a-070d-485a-9bd6-aaf5f9f9ec56
-- ============================================================================

ALTER TABLE sales DISABLE TRIGGER auto_recalc_commissions_on_sale_update;
ALTER TABLE payments DISABLE TRIGGER auto_calculate_commissions;

-- ============================================================================
-- FIX 1A: Correct sale dates for Karol Mayen (BNT 210-C)
-- ============================================================================
UPDATE sales
SET sale_date          = '2026-05-04',
    promise_signed_date = '2026-05-04',
    updated_at         = NOW()
WHERE id = '4ce108e3-6b10-4ff5-9bbc-acc07d472c49'
  AND sale_date = '2026-04-30';  -- guard

-- ============================================================================
-- FIX 1B: Correct reservation payment date for Karol Mayen (BNT 210-C)
-- ============================================================================
UPDATE payments
SET payment_date = '2026-05-04'
WHERE id      = 'b4d71f9c-9439-4c74-8a30-d8f06b38d513'
  AND sale_id = '4ce108e3-6b10-4ff5-9bbc-acc07d472c49'
  AND payment_date = '2026-04-30';  -- guard

-- ============================================================================
-- FIX 2: Correct unit_id for Manuel Bolom Yaxcal (BNT 305-C → 305-D)
-- ============================================================================
UPDATE sales
SET unit_id    = '019c967f-2fcb-7834-a425-5309f2cf56cb',  -- 305-D
    updated_at = NOW()
WHERE id      = '2923fcb4-1a80-4515-9680-e54cc0189dd2'
  AND unit_id = '019c967f-2fc7-76b1-8229-ce2b8ac60e7b';   -- guard: only if still on 305-C

-- ============================================================================
-- Re-enable triggers, recalculate commissions for both affected payments
-- ============================================================================
ALTER TABLE payments ENABLE TRIGGER auto_calculate_commissions;
ALTER TABLE sales ENABLE TRIGGER auto_recalc_commissions_on_sale_update;

SELECT calculate_commissions('b4d71f9c-9439-4c74-8a30-d8f06b38d513');  -- Karol Mayen, BNT 210-C
SELECT calculate_commissions('f2a0c07a-070d-485a-9bd6-aaf5f9f9ec56');  -- Manuel Bolom, BNT 305-D

-- ============================================================================
-- Post-checks (uncomment to verify):
-- ============================================================================
-- SELECT id, sale_date, promise_signed_date FROM sales WHERE id = '4ce108e3-6b10-4ff5-9bbc-acc07d472c49';
-- Expected: sale_date = 2026-05-04, promise_signed_date = 2026-05-04

-- SELECT id, payment_date FROM payments WHERE id = 'b4d71f9c-9439-4c74-8a30-d8f06b38d513';
-- Expected: payment_date = 2026-05-04

-- SELECT id, unit_id FROM sales WHERE id = '2923fcb4-1a80-4515-9680-e54cc0189dd2';
-- Expected: unit_id = 019c967f-2fcb-7834-a425-5309f2cf56cb (305-D)

-- SELECT phase, recipient_name, amount_gtq FROM commissions
-- WHERE payment_id IN ('b4d71f9c-9439-4c74-8a30-d8f06b38d513', 'f2a0c07a-070d-485a-9pd6-aaf5f9f9ec56')
-- ORDER BY payment_id, phase, recipient_name;
