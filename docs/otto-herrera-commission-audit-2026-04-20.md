# Commission Reconciliation Audit — 2026-04-20

## Symptom

Dashboard → Comisiones por Beneficiario → filter "Mes pasado" (March 2026):

| Recipient | Displayed | Expected |
|-----------|-----------|----------|
| Otto Herrera | **Q 648,297** | March-only total (TBD after fix) |
| Puerta Abierta | Q 2,701,238 | March-only total (TBD after fix) |

All displayed figures are **all-time totals**, not March. Root cause: date filter bug.

---

## SSOT Reference — Escenario #1 (effective 2025-03-16)

Source: `current_rules.jpeg`

| # | Puesto | Rate | Notes |
|---|--------|------|-------|
| — | Puerta Abierta | 2.50% | Implicit (5% − 2.50% Fuerza Comercial) |
| 1 | Dirección General (Otto) | 0.60% | always_paid |
| 2 | Gerencia Comercial | 0.30% | conditional, temporal per project |
| 3 | Supervisor Comercial | **0.15%** | conditional, temporal per project |
| 4 | Ejecutivos de Venta | 1.00% | per-sale rate (escalation to 1.25% after quota) |
| 5 | Ahorro | **0.45%** | residual (5% − sum of all others) |
| — | Ahorro Comercial | 0.20% | always_paid, not shown in SSOT (part of Ahorro pool) |
| | **TOTAL** | **5.00%** | |

Phase allocation: 30% reserva / 30% cobro / 40% entrega — **applies to ALL recipients**.

Proration: commission base = `sale_price` (prorated per payment's share within phase). Over lifecycle, each recipient earns `rate × sale_price`.

---

## Confirmed Bugs

### BUG-1 (CRITICAL): Date filter on `commissions.created_at` instead of `payments.payment_date`

**Location:** `src/app/api/analytics/commissions/route.ts` lines 106–111

```typescript
// CURRENT (buggy):
if (query?.start_date) {
  builder = builder.gte("created_at", query.start_date);
}
if (query?.end_date) {
  builder = builder.lte("created_at", query.end_date);
}
```

**Problem:** `calculate_commissions()` DELETEs and re-INSERTs commission rows for each payment. The `created_at` column defaults to `NOW()`, so it reflects the **recalculation timestamp**, not when the commission was earned.

Migration 037 ran on **2026-03-17** and recalculated ALL 31,688 commission rows. Every row has `created_at ≈ 2026-03-17`. When the user selects "Mes pasado" (March 1–31), ALL commission rows match — returning **all-time totals** instead of March-only.

**Proof:**
- Phase 1 all-time total (all recipients): Q950,942
- Phase 2 all-time total (all recipients): Q4,491,825
- Otto's rate share: 0.006/0.05 = 12%
- Expected all-time Otto ≈ Q5,442,767 × 0.12 = **Q653,132** — close to displayed **Q648,297** ✓

**Blast radius:** Affects ALL date filters, ALL recipients. Any range including March 17 shows everything. Any range excluding it shows nearly nothing.

**Fix:** Filter by `payments.payment_date` via PostgREST `!inner` join. Pure TypeScript change, no migration.

---

### BUG-2 (HIGH): Supervisor rate 0.25% should be 0.15%

**Location:** `commission_gerencia_assignments` table

**Current data (wrong):**

| Holder | Role | Rate | Period |
|--------|------|------|--------|
| Antonio Rada | supervisor_comercial | **0.0025 (0.25%)** | 2025-07-07 → 2026-03-16 |
| Job Jiménez | supervisor_comercial | **0.0025 (0.25%)** | 2026-03-16 → ongoing |

**SSOT (correct):** Supervisor = **0.15%** effective 2025-03-16.

**Impact on rate pool:**
- With 0.25% supervisor: total committed = 4.85%, ahorro residual = 0.15%
- With 0.15% supervisor: total committed = 4.75%, ahorro residual = **0.25%**
- Combined ahorro pool (AC 0.20% + residual): 0.35% → **0.45%** ← matches SSOT

**Fix:** Migration to UPDATE `commission_gerencia_assignments` rate from 0.0025 to 0.0015 for all `supervisor_comercial` rows. Then recalculate affected commissions.

---

## Withdrawn Findings

### ~~BUG-2 (original): Proration on management recipients~~ — WITHDRAWN

Initial hypothesis: proration should not apply to always_paid management (Otto, PA, AC).

**User correction:** 30/30/40 phase split applies to ALL recipients including Otto. The SSOT formula uses `sale_price` as base for all. Over the lifecycle, Otto earns exactly 0.60% of sale_price — this is correct.

The proration in `calculate_commissions()` Section 1a is **working as designed**.

### ~~Ahorro Comercial phantom~~ — WITHDRAWN

Ahorro Comercial (0.20%, always_paid) is a legitimate sub-allocation of the SSOT's "Ahorro 0.45%" pool. System correctly splits it into:
- Ahorro Comercial: 0.20% fixed (Section 1a)
- Ahorro: residual (Section 4)
- Combined: 0.20% + 0.25% = 0.45% ✓

### ~~Ejecutivo escalation eliminated~~ — WITHDRAWN

User confirmed: escalation to 1.25% after quota IS the current rule. The SSOT image note is informational. `sales.ejecutivo_rate` per-sale is correct.

---

## Data Flow Trace

```
Payment inserted/updated
    → trigger: auto_calculate_commissions
        → calculate_commissions(payment_id)
            → DELETE FROM commissions WHERE payment_id = ?
            → INSERT INTO commissions (... created_at=NOW())  ← BUG-1: timestamp ≠ payment date
            → v_base_amount = prorated sale_price              ← CORRECT per SSOT
            → Section 1a: always_paid management               ← CORRECT (proration applies)
            → Section 1b: conditional GC/Supervisor            ← BUG-2: rate 0.25% should be 0.15%
            → Section 2: ejecutivo                             ← correct
            → Section 3: referral                              ← correct
            → Section 4: ahorro (residual)                     ← reduced by BUG-2 (absorbs excess 0.10%)
            → Section 5: 60% cap                               ← correct

API: GET /api/analytics/commissions?start_date=2026-03-01&end_date=2026-03-31
    → .gte("created_at", "2026-03-01")             ← BUG-1: wrong column
    → .lte("created_at", "2026-03-31")             ← BUG-1: wrong column
    → Returns ALL 31,688 rows (should be March-only)
    → Supervisor rows overcounted by 0.10%         ← BUG-2
```

---

## Proposed Fixes

### Fix 1: API date filter (TypeScript)

**File:** `src/app/api/analytics/commissions/route.ts`

Join `payments` table via `!inner` when date filters are present. Filter on `payments.payment_date` instead of `commissions.created_at`.

**Risk:** Low. No data mutation. No migration.

### Fix 2: Supervisor rate correction (SQL migration)

**File:** `scripts/migrations/055_fix_supervisor_rate.sql`

1. UPDATE `commission_gerencia_assignments` SET `rate = 0.0015` WHERE `role = 'supervisor_comercial'`
2. Recalculate commissions for all payments on sales where the supervisor was active
3. Validation: verify ahorro residual increased from ~0.15% to ~0.25%

**Risk:** Medium. Changes commission amounts. Requires recalculation.

---

## Verification Plan

### After Fix 1:
1. "Mes pasado" → confirm only March 2026 payments' commissions appear
2. "Este año" → Jan–Dec 2026 works
3. "Año pasado" → 2025 works
4. No date filter → all-time totals (should match current numbers)

### After Fix 2:
1. Snapshot pre-migration supervisor commission totals
2. Deploy migration
3. Verify supervisor rows reflect 0.15% rate
4. Verify ahorro residual increased correspondingly
5. Verify total row count unchanged
6. Verify 60% cap compliance

---

## Summary

| Bug | Severity | Root Cause | Fix Type |
|-----|----------|------------|----------|
| BUG-1 | **CRITICAL** | API filters `commissions.created_at` (recalculation timestamp) instead of `payments.payment_date` | TypeScript |
| BUG-2 | **HIGH** | Supervisor rate 0.25% in DB, should be 0.15% per SSOT (effective 2025-03-16) | SQL migration |
