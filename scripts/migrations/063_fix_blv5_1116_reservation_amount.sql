-- ============================================================================
-- Migration 063: Fix BLV5 Apto 1116 reservation payment amount
-- ============================================================================
-- Source: docs/manifest-CIERRE_COBROS_ABRIL.md — FLAG-C2 (RESOLVED)
-- Context: Migration 061 imported the Phase 1 reservation for BLV5 1116
--   (Ingrid Lissette Robles Villatoro, 2026-04-17) using Q5,000 as Monto de
--   Reserva Pactado from CIERRE_RESERVAS_ABRIL.xlsx. Pati confirmed the
--   actual amount received is Q10,000 (standard BLV5 reserva). COBROS records
--   Q10,000. The RESERVAS SSOT had the incorrect amount.
--
-- Prior desistimiento (Francisco Javier Arriaza Reyes, 2024-02-15) was already
--   cancelled in migration 061 preamble — sale 019c9692-fef7-7177-b6e5-442f381c905f.
--   No action required here.
--
-- This migration:
--   1. Updates payment 75fc4c15-1bc4-43c8-b995-66034aafa0cf from Q5,000 → Q10,000
--   2. Recalculates commissions for that payment (DELETE+REINSERT via calculate_commissions)
-- ============================================================================

-- Pre-check: confirm current state before updating
-- Expected: 1 row, amount = 5000, payment_type = 'reservation'
-- SELECT id, sale_id, payment_date, amount, payment_type
-- FROM payments
-- WHERE id = '75fc4c15-1bc4-43c8-b995-66034aafa0cf';

-- ============================================================================
-- STEP 1: Correct the reservation payment amount
-- ============================================================================
UPDATE payments
SET amount = 10000
WHERE id = '75fc4c15-1bc4-43c8-b995-66034aafa0cf'
  AND sale_id = '0737b81b-b63d-4956-b071-5654a2bdb03a'  -- Ingrid Lissette Robles Villatoro, BLV5 1116
  AND payment_type = 'reservation'
  AND amount = 5000;  -- guard: only applies if not already corrected

-- ============================================================================
-- STEP 2: Recalculate commissions
-- calculate_commissions() does DELETE+REINSERT for the given payment_id.
-- This removes the Q5,000-based commission rows and inserts correct Q10,000 rows.
-- ============================================================================
SELECT calculate_commissions('75fc4c15-1bc4-43c8-b995-66034aafa0cf');

-- ============================================================================
-- Post-check (run after execution to verify):
-- ============================================================================
-- SELECT p.id, p.amount, p.payment_type, p.payment_date
-- FROM payments p
-- WHERE p.id = '75fc4c15-1bc4-43c8-b995-66034aafa0cf';
-- Expected: amount = 10000
--
-- SELECT commission_phase, recipient_type, amount_gtq
-- FROM commissions
-- WHERE payment_id = '75fc4c15-1bc4-43c8-b995-66034aafa0cf'
-- ORDER BY commission_phase, recipient_type;
-- Expected: Phase 1 commissions based on Q10,000 (not Q5,000)
