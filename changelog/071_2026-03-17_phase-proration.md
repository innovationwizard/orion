# 071 — Phase Commission Pro-Rata (DIFF-09)

**Date:** 2026-03-17
**Migration:** 037_phase_proration.sql
**Audit Ref:** DIFF-09

## Context

The app calculated commissions as `payment_amount * rate * phase_pct`. The SSOT uses `sale_price` as the commission base, prorating each payment's share within its phase. This affects all three phases.

## SSOT Formula

```
Phase 1: commission = sale_price * rate * 0.30  (one-time, reservation trigger)
Phase 2: commission = (cuota / enganche_neto) * sale_price * rate * 0.30
Phase 3: commission = (payment / phase3_denom) * sale_price * rate * 0.40
```

Where:
- `enganche_neto = down_payment_amount - sum(reservation payments)`
- `phase3_denom = sale_price - down_payment_amount`

Over all payments in each phase, totals converge to `sale_price * rate * phase_pct`.

## Changes

### `scripts/migrations/037_phase_proration.sql` (NEW)

- **Phase A:** Updated `calculate_commissions()` function:
  - New variables: `v_sale_price`, `v_base_amount`, `v_reserva_amount`, `v_enganche_neto`, `v_phase3_denom`
  - Phase-specific base computation block after phase selection, before commission inserts
  - All 12 occurrences of `v_payment.amount` in INSERTs replaced with `v_base_amount`
  - Edge case fallbacks with `RAISE WARNING` for division-by-zero scenarios
- **Phase B:** Full recalculation of all payments from active sales, ordered by `payment_date, id` for correct 60% cap accumulation
- **Phase C:** 6 validation queries (commented, run manually post-deploy)

No TypeScript changes. No frontend changes. No new API routes. Purely a DB function change + recalculation.

## Validation Results

| # | Check | Result |
|---|-------|--------|
| C.1 | Phase totals | Phase 1: 540 rows, Q950,942 (was Q39,364). Phase 2: 31,148 rows, Q4,491,825 (was Q645,394). |
| C.2 | 60% cap compliance | 0 sales over cap |
| C.3 | Phase 1 base = sale_price | 0 mismatches |
| C.4 | Phase 2 proration | 5 sales with implied_base < sale_price (expected: incomplete plans + cap scaling) |
| C.5 | Negative commissions | 0 |
| C.6 | Total rows | 31,688 (unchanged) |

## Audit Progress

DIFF-01/02/03/04/05/06/08/09 resolved. Remaining: DIFF-07, DIFF-10, DIFF-11, DIFF-12, DIFF-13.
