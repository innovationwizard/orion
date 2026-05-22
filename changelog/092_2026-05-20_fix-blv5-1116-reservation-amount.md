# 092 — Fix BLV5 1116 Reservation Payment Amount

**Date:** 2026-05-20
**Migration:** `scripts/migrations/063_fix_blv5_1116_reservation_amount.sql`
**Source flag:** `docs/manifest-CIERRE_COBROS_ABRIL.md` — FLAG-C2 (RESOLVED)

## What Changed

Corrected the Phase 1 reservation payment for BLV5 Apto 1116 from **Q5,000 → Q10,000**.

Migration 061 (April 2026 sales import) inserted this payment at Q5,000 as recorded in
`CIERRE_RESERVAS_ABRIL.xlsx` Row 21. Pati confirmed the actual amount received was Q10,000
(the standard BLV5 reservation). The COBROS SSOT (`CIERRE_COBROS_ABRIL.xlsx`) records Q10,000.

## Context

- Prior desistimiento: Francisco Javier Arriaza Reyes, Apto 1116, 2024-02-15 — already
  cancelled in migration 061 preamble. No action required here.
- New sale: Ingrid Lissette Robles Villatoro / Erwin Cardona / 2026-04-17.
- Q10,000 is the reservation only. No Phase 2 (down payment) installment was collected in April.

## Records Affected

| Table | Record | Change |
|-------|--------|--------|
| `payments` | `75fc4c15-1bc4-43c8-b995-66034aafa0cf` | amount: 5,000 → 10,000 |
| `commissions` | 7 Phase 1 rows for payment above | DELETE + REINSERT via `calculate_commissions()` |

## Commission Recalculation Result

Commissions are based on `price_without_tax` (Q965,233.30), not the reservation amount.
Amounts are unchanged from before the correction — the payment correction restores record
accuracy for COBROS reconciliation.

| Recipient | Phase | Rate | Amount (GTQ) |
|-----------|-------|------|-------------|
| Erwin | 1 | 1.00% | 2,895.70 |
| Puerta Abierta | 1 | 2.50% | 7,239.25 |
| Otto Herrera | 1 | 0.60% | 1,737.42 |
| Antonio Rada | 1 | 0.30% | 868.71 |
| Ahorro G. Comercial | 1 | 0.20% | 579.14 |
| Job Jiménez | 1 | 0.15% | 434.36 |
| Ahorro | 1 | 0.25% | 723.93 |

## Open Items

None. FLAG-C2 fully resolved.
