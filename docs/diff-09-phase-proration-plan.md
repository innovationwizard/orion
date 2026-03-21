# DIFF-09: Phase Commission Pro-Rata (Sale-Price Base)

## Context

**Problem:** The app calculates commissions as `payment_amount × rate × phase_pct`. The SSOT uses `sale_price` as the commission base, prorating each payment's share within its phase. This applies to ALL three phases, not just phase 2.

**Current (wrong):**
```
commission = payment_amount × rate × phase_percentage
```

**SSOT (correct):**
```
Phase 1: commission = sale_price × rate × 0.30  (one-time, triggered by reservation+promise)
Phase 2: commission = (cuota / enganche_neto) × sale_price × rate × 0.30  (prorated per cuota)
Phase 3: commission = (payment / phase3_denom) × sale_price × rate × 0.40  (prorated per post-deed payment)
```

Where:
- `enganche_neto = down_payment_amount - reservation_amount`
- `phase3_denom = sale_price - down_payment_amount`

**Verification (totals over all payments in a phase):**
- Phase 1: 1 payment → `1.0 × sale_price × rate × 0.30` = 30% of total commission ✓
- Phase 2: cuotas sum to `enganche_neto` → `1.0 × sale_price × rate × 0.30` = 30% ✓
- Phase 3: payments sum to `phase3_denom` → `1.0 × sale_price × rate × 0.40` = 40% ✓
- Grand total: `sale_price × rate × (0.30 + 0.30 + 0.40)` = `sale_price × rate` ✓

**Impact magnitude:**
- Phase 1 current total: Q39,363 (540 rows)
- Phase 2 current total: Q645,394 (31,148 rows)
- Phase 3: no data yet (no deeds signed)
- After fix: both will increase substantially (base changes from payment to sale_price)
- 60% cap (`sale_price × 3%`) bounds phase 1+2 combined

**Data availability:**
- `sales.price_without_tax` — populated on all 757 active sales ✓
- `sales.down_payment_amount` — populated on 755/757 active sales (avg 10.4% of sale_price) ✓
- Reservation amounts — available from `payments WHERE payment_type = 'reservation'` ✓

---

## Changes

### File 1: `scripts/migrations/037_phase_proration.sql` (NEW)

#### Phase A: Update `calculate_commissions()` function

**New variables:**
```sql
v_sale_price numeric;
v_base_amount numeric;
v_reserva_amount numeric := 0;
v_enganche_neto numeric;
v_phase3_denom numeric;
```

**After phase selection (line 91), before first INSERT:**
```sql
v_sale_price := COALESCE(v_sale.price_without_tax, v_sale.price_with_tax, 0);

IF v_phase = 1 THEN
  -- Phase 1: sale_price is the base (30% of total commission, one-time)
  v_base_amount := v_sale_price;

ELSIF v_phase = 2 THEN
  -- Phase 2: prorate cuota across enganche_neto
  SELECT COALESCE(SUM(p.amount), 0) INTO v_reserva_amount
  FROM payments p WHERE p.sale_id = v_sale.id AND p.payment_type = 'reservation';

  v_enganche_neto := COALESCE(v_sale.down_payment_amount, 0) - v_reserva_amount;

  IF v_enganche_neto > 0 THEN
    v_base_amount := (v_payment.amount / v_enganche_neto) * v_sale_price;
  ELSE
    -- Fallback: IFERROR equivalent
    v_base_amount := v_payment.amount;
    RAISE WARNING 'Sale % enganche_neto <= 0 (down_payment=%, reserva=%) — falling back to payment base',
      v_sale.id, v_sale.down_payment_amount, v_reserva_amount;
  END IF;

ELSIF v_phase = 3 THEN
  -- Phase 3: prorate payment across (sale_price - enganche)
  v_phase3_denom := v_sale_price - COALESCE(v_sale.down_payment_amount, 0);

  IF v_phase3_denom > 0 THEN
    v_base_amount := (v_payment.amount / v_phase3_denom) * v_sale_price;
  ELSE
    v_base_amount := v_payment.amount;
    RAISE WARNING 'Sale % phase3_denom <= 0 (price=%, down_payment=%) — falling back to payment base',
      v_sale.id, v_sale_price, v_sale.down_payment_amount;
  END IF;

ELSE
  v_base_amount := v_payment.amount;
END IF;
```

**Replace ALL occurrences in INSERTs:**
- `base_amount` value: `v_payment.amount` → `v_base_amount`
- `commission_amount` value: `v_payment.amount * rate * v_phase_percentage` → `v_base_amount * rate * v_phase_percentage`

This affects Sections 1a, 1b, 2 (both redirect and direct), 3 (referral), and 4 (ahorro).

#### Phase B: Recalculate all commissions

Same pattern as migrations 034/035. Process all payments from active sales.

**Important:** Add `ORDER BY p.payment_date, p.id` to ensure chronological processing for correct 60% cap accumulation.

#### Phase C: Validation queries (commented, run manually)

1. Phase 1 commission totals should be ~= `SUM(price_without_tax × 0.05 × 0.30)` across sales with phase 1 payments
2. Phase 2 commission totals: per sale, `SUM(commission_amount for all recipients)` should approach `sale_price × 0.05 × 0.30`
3. No negative commission_amounts
4. No phase 1+2 totals exceeding 3% of sale_price per sale (60% cap)
5. Total commission count comparison (before/after)
6. Spot-check: sale with Q1M price, Q100K enganche, Q10K reserva, 7 cuotas of ~Q12.9K each:
   - Phase 1 total (all recipients): Q1M × 5% × 30% = Q15,000
   - Phase 2 per cuota (all recipients): ~Q2,143
   - Phase 2 total: Q15,000

---

## Edge Cases

| Case | Behavior |
|------|----------|
| `down_payment_amount = 0` (2 sales) | Phase 2: `enganche_neto = -reserva` → fallback to payment base + WARNING |
| `down_payment_amount IS NULL` | Impossible (NOT NULL column) |
| No reservation payment (128 sales) | `v_reserva_amount = 0`, `enganche_neto = down_payment_amount` |
| `enganche_neto = 0` | Fallback to payment base + WARNING |
| Phase 3 `denom = 0` | Fallback + WARNING (would mean enganche = sale_price, unlikely) |
| Multiple reservation payments | Phase 1 uses `v_sale_price` regardless. Phase 2 denominator uses sum of all reservation payments |
| Cuotas exceed enganche_neto | Proration > 1.0 → commission exceeds intended 30% pool. 60% cap catches this |
| `price_without_tax = 0` | `v_base_amount = 0` → zero commissions (data quality issue) |

---

## Files Summary

| # | File | Action |
|---|------|--------|
| 1 | `scripts/migrations/037_phase_proration.sql` | NEW |

**No TypeScript changes. No frontend changes. No new API routes.** This is purely a DB function change + recalculation.

---

## Verification

1. Take pre-migration snapshot (row counts, totals by phase and recipient)
2. Deploy migration 037 via Management API
3. Run validation queries C.1–C.6
4. Compare phase 1 totals (should increase dramatically — sale_price base vs reservation base)
5. Compare phase 2 totals (should increase — sale_price base vs payment base)
6. Verify 60% cap compliance across all sales
7. Update `docs/commission-audit-plan.md` → DIFF-09 RESOLVED
8. Changelog + MEMORY.md


---

## ADDENDUM 2026-03-20: BLT Torre B — Authoritative Correction

**Source:** Jorge (project owner), direct confirmation.
**Cross-reference:** `docs/creditos-33-units-investigation.md` (UPDATE 2026-03-20)

During the Créditos dashboard backfill investigation, 24 BLT Torre B units were flagged with credit data but no reservations. The "INFO PARA REPORTES" Excel sheet listed 58 rows of client data, suggesting 58 hidden sales. Upon authoritative review:

1. **Only 3 sales exist in Bosque Las Tapias — Torre B.** The 58 rows in "INFO PARA REPORTES" do NOT represent real sales. The true number is **3**.
2. **All existing BLT Torre B sales records will be dropped from the production database** to establish a clean baseline.
3. **Only the 3 currently existing sales will be uploaded** as the sole BLT Torre B transactions.

Any prior references in this document to BLT Torre B having 11 hidden reservations (Category C), 13 orphan income markers (Category D), or 58 clients missing from the DB are **superseded** by this correction.