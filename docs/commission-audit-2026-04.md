# Commission Audit — April 2026

**Date:** 2026-04-20
**Trigger:** Otto Herrera's "Mes pasado" (March 2026) commission total showed Q648,297 — matching his all-time total, not a March-only figure. Puerta Abierta showed Q2,701,238 (same issue).

---

## Files Consulted

| File | Purpose |
|------|---------|
| `docs/otto-herrera-commission-audit-2026-04-20.md` | Original audit write-up: symptom, root cause, proposed fixes |
| `src/app/api/analytics/commissions/route.ts` | API route where BUG-1 was located and fixed |
| `scripts/migrations/056_fix_supervisor_rate.sql` | Migration that resolved BUG-2 |
| `scripts/migrations/057_march_2026_sales_import.sql` | March 2026 sales import (CIERRE_MARZO.xlsx source) |
| `ComisionesMarzo/` (untracked) | Source Excel files used for the March import and audit |

---

## Bug 1 — Date Filter on Wrong Column (CRITICAL)

**Status: FIXED**

**Root cause:** `GET /api/analytics/commissions` was filtering on `commissions.created_at`. The `calculate_commissions()` trigger DELETEs and re-INSERTs all commission rows for a payment on every recalculation, resetting `created_at` to `NOW()`. Migration 037 (2026-03-17) recalculated all 31,688 rows — stamping every row with `2026-03-17`. Selecting "Mes pasado" (March 1–31) matched all rows and returned all-time totals.

**Fix:** Conditional `payments!inner(payment_date)` join when date filters are present. Filters now apply to `payments.payment_date` (when money was received), not `commissions.created_at` (when the row was last computed).

**Location after fix:** [src/app/api/analytics/commissions/route.ts:94-112](src/app/api/analytics/commissions/route.ts#L94-L112)

```typescript
// Use payments!inner(payment_date) when filtering by date
const needsDateFilter = query?.start_date || query?.end_date;
const paymentJoin = needsDateFilter ? ", payments!inner( payment_date )" : "";
// ...
if (query?.start_date) builder = builder.gte("payments.payment_date", query.start_date);
if (query?.end_date)   builder = builder.lte("payments.payment_date", query.end_date);
```

---

## Bug 2 — Supervisor Rate 0.25% vs 0.15% (HIGH)

**Status: FIXED via migration 056**

**Root cause:** Both `antonio_rada` (supervisor 2025-07-07 → 2026-03-16) and `job_jimenez` (supervisor 2026-03-16 → present) had `rate = 0.0025` in `commission_gerencia_assignments`. Per SSOT Escenario #1, the 0.25% → 0.15% reduction applies **at the personnel transition** (when Job took over), not retroactively to Antonio's tenure.

**Resolution clarification:** Initial audit draft incorrectly proposed updating all supervisor rows to 0.15%. The correct interpretation: Antonio Rada stays at 0.25% (his rate during 2025-07-07 → 2026-03-16 is per SSOT). Only Job Jiménez needed correction.

**Fix (`scripts/migrations/056_fix_supervisor_rate.sql`):**
- `UPDATE commission_gerencia_assignments SET rate = 0.0015 WHERE role = 'supervisor_comercial' AND recipient_id = 'job_jimenez'`
- Recalculated commissions for all payments on `sale_date >= 2026-03-16`

**Impact on rate pool (post-fix):**
- Total committed: 0.60 + 0.30 + 0.15 + 1.00 + 0.20 = 2.25% (per active sale)
- Ahorro residual: 2.50% − 2.25% = 0.25%
- Combined ahorro pool (AC 0.20% + residual 0.25%) = 0.45% ✓ matches SSOT

---

## Withdrawn Findings (from original audit)

| Finding | Disposition |
|---------|-------------|
| Proration should not apply to always_paid management | **Withdrawn.** 30/30/40 applies to all recipients. Otto earns exactly 0.60% × sale_price over lifecycle — correct per SSOT. |
| Ahorro Comercial phantom 0.20% | **Withdrawn.** Legitimate sub-allocation of the SSOT 0.45% ahorro pool. |
| Ejecutivo escalation was eliminated | **Withdrawn.** 1.25% after quota threshold IS current rule. Per-sale `ejecutivo_rate` on `sales` table is correct. |

---

---

## Phase 1 — Reservas Commission Audit

**Status: INCOMPLETE — DIFF DISCOVERED (2026-05-04)**

A randomly audited March 2026 reserva commission number does not match the SSOT source. Root cause not yet determined. Investigation starting.

Known scope: Phase 1 = reservation-deposit commissions (`payment_type = 'reservation'`). These are the Q3,000 / Q5,000 / Q10,000 / Q1,500 reserva deposits per project, earning commissions on the first payment event for each sale.

---

## March 2026 Sales Import

Migration 057 (`scripts/migrations/057_march_2026_sales_import.sql`) imported 25 active sales + 2 desistimientos from `CIERRE_MARZO.xlsx`. Pre-requisite: 4 prior sales on resold units were manually cancelled before the import ran.

Source files in `ComisionesMarzo/` (gitignored, not committed):
- `03.26 Comisiones nuevo formato - Marzo 2026.xlsx`
- `03.26 Comisiones nuevo formato - Marzo 2026 01 al 15.xlsx`
- `03.26 Comisiones nuevo formato - Marzo 2026 16 al 31.xlsx`
- `CIERRE_MARZO.xlsx`
- `CIERRE_MARZO_RESERVAS.xlsx`
- `Screenshot 2026-04-21 at 18.11.33.png`

---

## Migration 059 — Status Note

`scripts/migrations/059_offboard_jose_gutierrez.sql` exists locally but was **never committed to git**. No git commit trace found. Per user recollection, this migration was executed against production. File should be committed to preserve the deployment record.
