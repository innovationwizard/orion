# 065 — ejecutivo_rate on sales + CFO Confirmation Workflow

**Date:** 2026-03-16
**Author:** Jorge Luis Contreras Herrera
**Status:** DEPLOYED to production
**Migration:** 033
**Severity:** Critical — ejecutivo commissions were silently not being calculated

---

## Context

### The Problem

The `calculate_commissions()` function silently skipped **all ejecutivo (salesperson) commissions** because the `commission_rates` table had **zero entries** with `recipient_type = 'sales_rep'`. This was not a recent regression — analysis of 12 historical schema snapshots confirmed `commission_rates` never contained sales_rep rows across the entire project history.

The function's pattern was:

```sql
SELECT * INTO v_rate FROM commission_rates cr
WHERE cr.recipient_id = v_sale.sales_rep_id::text
  AND cr.recipient_type = 'sales_rep'
  AND cr.active = true;
IF FOUND THEN
  INSERT INTO commissions (...);
END IF;
-- No ELSE, no RAISE WARNING → silent skip
```

Zero rows matched → `IF FOUND` was always false → no ejecutivo commission was ever inserted.

### Root Cause

Migration 024 (unify salespeople) replaced the policy-period-aware `calculate_commissions()` function (from migration 006) with a simplified version that relied on `commission_rates` for ejecutivo rates. But the policy-period function never stored ejecutivo rates in `commission_rates` — it computed them dynamically from `commission_policy_periods` + `commission_role_rates`. When migration 024 removed that dynamic lookup and substituted a `commission_rates WHERE recipient_type = 'sales_rep'` lookup, there were no rows to find.

The `IF FOUND THEN ... END IF` pattern (with no `ELSE` or `RAISE WARNING`) made this failure completely silent. No errors, no logs, no missing-data alerts. The system simply produced commission reports without ejecutivo rows.

### The Insight

The SSOT (CFO's Excel) shows ejecutivo rates vary **per unit**, not per salesperson:

- Antonio Rada has 6 different rates (0.25%–1.25%) in Boulevard 5 alone
- Paula Hernandez has 4 rates (0.40%–2.00%) in Casa Elisa

The rate is a property of the **sale**, not of the salesperson. No lookup table — polymorphic or otherwise — can model this correctly without becoming a per-sale lookup, which is just `sales.ejecutivo_rate` with extra steps.

This follows the **Stripe Ledger pattern**: capture the rate at transaction time, don't look it up later.

---

## What Changed

### Phase 1: Schema — Migration 033

**4 new columns on `sales`:**

| Column | Type | Default | Purpose |
|--------|------|---------|---------|
| `ejecutivo_rate` | `numeric` | NULL | The ejecutivo commission rate for this sale (decimal, e.g. 0.01 = 1%) |
| `ejecutivo_rate_confirmed` | `boolean` | `false` | Whether the CFO/master user has verified this rate against the SSOT |
| `ejecutivo_rate_confirmed_at` | `timestamptz` | NULL | When the rate was confirmed |
| `ejecutivo_rate_confirmed_by` | `uuid` | NULL | Who confirmed it (auth.users FK) |

**Why `ejecutivo_rate` on `sales`:**

1. The SSOT proves it — the CFO's Excel has a rate column per row (per unit/sale), not a salesperson lookup table
2. Eliminates the polymorphic anti-pattern for ejecutivo — no more `commission_rates WHERE recipient_type = 'sales_rep'` with text discriminators and FK constraint gaps
3. Immutable by design — once a sale is recorded, its ejecutivo rate doesn't change (Stripe Ledger pattern)
4. Per-unit granularity is inherent — each sale records its own rate, modeling the 6 different rates for a single salesperson trivially
5. Simplest sufficient solution — one `ALTER TABLE`, not a new temporal lookup table with EXCLUDE constraints

### Phase 2: Backfill — Policy-Period Escalation Model

All existing sales with a real salesperson (excluding Unknown / Puerta Abierta / Unknown Directo) were backfilled using the same escalation logic from the original policy-period function (migration 006):

- Count the salesperson's active sales in the project up to the sale date
- If count ≥ `escalation_threshold` (from `commission_policy_periods`): rate = 1.25%
- If count < threshold: rate = 1.00%
- Default threshold when no policy period exists: 5

All backfilled rates are marked `ejecutivo_rate_confirmed = false`. These are **estimates** from the escalation model, not the canonical SSOT rates. The master user must review and confirm each rate against the CFO's Excel, unit by unit.

**Why not backfill from the SSOT directly:** The SSOT Excel rates cannot be fabricated or assumed. The escalation model provides a reasonable approximation that allows commissions to start calculating immediately, while the confirmation workflow ensures every rate gets verified against the canonical source before being considered final.

### Phase 3: Function Update — `calculate_commissions()`

**Replaced section 2 (ejecutivo)** — the `commission_rates WHERE recipient_type = 'sales_rep'` lookup (which always returned 0 rows) with direct use of `v_sale.ejecutivo_rate`:

```sql
-- NEW: reads rate directly from the sale
IF v_sale.sales_rep_id IS NOT NULL AND v_sale.ejecutivo_rate IS NOT NULL THEN
  SELECT display_name INTO v_salesperson_name
  FROM salespeople WHERE id = v_sale.sales_rep_id;

  IF v_redirect_to_ahorro THEN
    -- Redirect to ahorro_por_retiro using the sale's ejecutivo_rate
    INSERT INTO commissions (...) VALUES (..., v_sale.ejecutivo_rate, ...);
  ELSE
    -- Active rep: pay ejecutivo commission
    INSERT INTO commissions (...) VALUES (..., v_sale.ejecutivo_rate, ...);
  END IF;
ELSIF v_sale.sales_rep_id IS NOT NULL AND v_sale.ejecutivo_rate IS NULL THEN
  RAISE WARNING 'Sale % has salesperson % but no ejecutivo_rate', ...;
END IF;
```

**Key improvements over the previous version:**
- `RAISE WARNING` when a sale has a salesperson but no rate (no more silent failures)
- Salesperson name fetched from `salespeople` table (not from `commission_rates.recipient_name`)
- Ahorro por retiro redirect uses the sale's own ejecutivo rate (previously it also silently failed because it used the same empty `commission_rates` lookup)
- All other sections (management, referral, special, 60% cap) unchanged

### Phase 4: View Update — `v_reservations_pending`

**2 new columns appended** (PostgreSQL requires new view columns at the end):

- `ejecutivo_rate` — from the matching active sale
- `ejecutivo_rate_confirmed` — confirmation status

**Join path:** `rv_units.unit_number + projects.id → units (analytics) → sales (active)`

```sql
LEFT JOIN units u_analytics ON u_analytics.project_id = p.id
  AND u_analytics.unit_number = u.unit_number
LEFT JOIN sales sale ON sale.unit_id = u_analytics.id
  AND sale.status = 'active'
```

This connects the reservation system's `rv_units` to the analytics `units` table (which `sales` references) via the shared `(project_id, unit_number)` natural key.

### Phase 5: Commission Recalculation

All payments were recalculated with the updated function. Ejecutivo commission rows now exist for every payment with a real salesperson.

**Production results:**
- 4,782 ejecutivo commission rows generated across 25 salespersons (previously: 0)
- 6,524 puerta_abierta rows (expected to be higher — PA pays on every sale including those with no real salesperson)
- 0 rates confirmed (all pending CFO review)

### Phase 6: PATCH API — Rate Confirmation Endpoint

**New file:** `src/app/api/reservas/admin/sales/[id]/ejecutivo-rate/route.ts`

- **Auth:** `requireRole(["master"])` — only the master user can confirm rates
- **Accepts:** `{ ejecutivo_rate: number }` (Zod validated: ≥ 0 AND ≤ 0.05, i.e. 0–5%)
- **Updates:** `ejecutivo_rate`, sets `ejecutivo_rate_confirmed = true`, timestamps `confirmed_at` / `confirmed_by`
- **Recalculates:** Calls `calculate_commissions()` for every payment of the sale (commissions update immediately with the confirmed rate)
- **Returns:** Updated sale data + recalculation stats

**Why recalculate on confirmation:** When the master user adjusts a rate (e.g., from the backfilled 1.00% to the SSOT's actual 0.40%), all commission amounts for that sale's payments must reflect the corrected rate. Recalculating immediately eliminates stale commission data.

### Phase 7: Reservation Detail API — Sale Rate Data

**Modified:** `src/app/api/reservas/admin/reservations/[id]/route.ts`

After the main `Promise.all` (reservation, clients, extractions, unit, salesperson, audit_log), a sequential query fetches the sale's ejecutivo rate data:

1. Find the analytics `units` row matching the rv_unit by `(project_id, unit_number)`
2. Find the active `sales` row on that unit
3. Include `sale_rate` in the response: `{ sale_id, ejecutivo_rate, ejecutivo_rate_confirmed, ejecutivo_rate_confirmed_at, ejecutivo_rate_confirmed_by }`

**Why sequential, not in the Promise.all:** The analytics unit lookup depends on `rvUnit.project_id` and `rvUnit.unit_number` from the unit result. These values aren't known until the first query completes.

### Phase 8: UI — Dot Indicator in Reservation Table

**Modified:** `src/app/admin/reservas/reservation-row.tsx`

A discrete 6px dot appears after the status badge:

| Condition | Dot | Title |
|-----------|-----|-------|
| `ejecutivo_rate_confirmed === true` | Green (`bg-success`) | "Tasa EV confirmada" |
| `ejecutivo_rate_confirmed === false` AND rate exists | Amber (`bg-warning`) | "Tasa EV pendiente" |
| `ejecutivo_rate === null` | No dot | No ejecutivo commission expected |

Visible to all admin roles (master, torredecontrol, gerencia, financiero, contabilidad, inventario). Minimal footprint — a color dot, not text or a badge.

### Phase 9: UI — Tasa EV Section in Reservation Detail

**Modified:** `src/app/admin/reservas/reservation-detail.tsx`

New "Tasa EV" section between "Asesor" and "Depósito" sections:

**All admin roles see:**
- Current rate as percentage (e.g., "1%")
- Confirmation status: "Confirmada" (green) or "Pendiente" (amber)
- Confirmation date (if confirmed)

**Master role additionally sees:**
- Editable rate input (number, step 0.01, range 0–5%)
- "Confirmar tasa" button
- Success/error feedback

**Props change:** `ReservationDetail` now receives `userRole: string | null` from the parent (`reservas-admin-client.tsx`), which extracts it from the `/api/auth/session` response (already returned `role` — no API change needed).

### Phase 10: Type Updates

**`src/lib/reservas/types.ts` — `ReservationPending` interface:**
- `ejecutivo_rate: number | null`
- `ejecutivo_rate_confirmed: boolean`

**`src/lib/types.ts` — `Sale` type:**
- `ejecutivo_rate: number | null`
- `ejecutivo_rate_confirmed: boolean`
- `ejecutivo_rate_confirmed_at: string | null`
- `ejecutivo_rate_confirmed_by: string | null`

**`src/lib/reservas/validations.ts`:**
- `ejecutivoRateSchema` — Zod schema for the PATCH endpoint (number, 0–0.05 range)

**`public/metadata/commission-rules.json`:**
- Replaced stale `sales_reps` array (which referenced legacy text IDs that no longer exist) with `ejecutivo` section documenting the new rate resolution pattern

---

## What Stays the Same

- **Management rates** (puerta_abierta, otto_herrera, alek_hernandez, ahorro_comercial, antonio_rada): Still resolved via `commission_rates` table with `always_paid = true`. These are company-wide flat rates; the polymorphic pattern works fine for them.
- **Referral logic:** Unchanged — still uses `commission_rates WHERE recipient_id = 'referral'`
- **Ahorro / ahorro_por_retiro:** Structure unchanged. Ahorro por retiro now uses `v_sale.ejecutivo_rate` as the redirected rate (same semantic, new source — previously this also silently failed).
- **60% cap logic:** Unchanged
- **Commission API** (`/api/analytics/commissions/route.ts`): No change — ejecutivo commissions now exist as rows in `commissions` with `recipient_id = salespeople.id::text`, which the existing type lookup already handles
- **Commission treemap/bars:** No change — new ejecutivo rows render automatically
- **Policy-period tables:** Remain as the rule engine for future rate assignment. Not deleted.

---

## Design Decisions

1. **Rate on the sale, not in a lookup table** — The SSOT has per-unit rates. Any lookup table (per-salesperson, per-project, temporal) would either lose granularity or become a per-sale table with extra joins — which is just `sales.ejecutivo_rate` in disguise.

2. **Pre-populate with estimates, confirm later** — Immediate value: ejecutivo commissions start appearing in reports today. The confirmation workflow ensures every rate gets reviewed before being considered canonical. Zero ejecutivo rows → approximate ejecutivo rows → exact ejecutivo rows, progressively.

3. **`RAISE WARNING` instead of silent skip** — The original bug existed because failures were silent. The new function explicitly warns when a sale has a salesperson but no rate. This surfaces data quality issues instead of hiding them.

4. **Master-only confirmation** — The ejecutivo rate directly affects commission amounts (money). Only the master user (CFO-authorized) should be able to set the canonical rate. Other admins can see the status but not modify it.

5. **Recalculate on confirmation** — When a rate changes from 1.00% to 0.40%, every commission for that sale's payments is wrong until recalculated. Doing it immediately on confirmation prevents stale financial data.

6. **Discrete dot (not badge, not column)** — The confirmation status is important but secondary to the reservation workflow. A color dot conveys the information without adding visual noise to the table. Green = done, amber = needs attention, absent = not applicable.

7. **View joins through `(project_id, unit_number)` natural key** — The reservation system (`rv_units`) and analytics system (`units`) are separate tables for the same physical units. The natural key `(project_id, unit_number)` is the bridge. A direct FK between the tables doesn't exist (and shouldn't — they belong to different bounded contexts).

---

## Risk Mitigations

| Risk | Mitigation |
|------|------------|
| Backfilled rates are wrong for some units | All marked `confirmed = false`. Master user reviews each against SSOT. Commission amounts are approximate until confirmed. |
| Multiple active sales per unit → duplicate view rows | LEFT JOIN produces at most one match per reservation. In practice, a unit has at most one active sale. |
| No analytics unit match for reservation unit | LEFT JOIN returns NULL → `ejecutivo_rate = null` → no dot shown, no Tasa EV section. Graceful absence. |
| Rate confirmation without commission recalc | PATCH endpoint recalculates all payments for the sale immediately after updating the rate. |
| Non-master user attempts rate change | `requireRole(["master"])` returns 403. UI hides the input/button for non-master roles. |
| Silent failure regression | `RAISE WARNING` in the function catches any future cases where `sales_rep_id IS NOT NULL` but `ejecutivo_rate IS NULL`. |

---

## Verification (Production Results)

| Query | Result | Expected |
|-------|--------|----------|
| Sales missing `ejecutivo_rate` (with real salesperson) | **0** | 0 |
| Ejecutivo commission rows | **4,782 rows across 25 salespersons** | > 0 (previously 0) |
| Confirmed rates | **0** | 0 (all pending) |
| PA rows vs EV rows | **6,524 vs 4,782** | EV < PA (PA pays on all sales; EV only on sales with real salesperson) |

---

## Files

| Action | File |
|--------|------|
| NEW | `scripts/migrations/033_ejecutivo_rate_on_sales.sql` |
| NEW | `src/app/api/reservas/admin/sales/[id]/ejecutivo-rate/route.ts` |
| MODIFY | `src/lib/reservas/types.ts` |
| MODIFY | `src/lib/types.ts` |
| MODIFY | `src/app/admin/reservas/reservation-row.tsx` |
| MODIFY | `src/app/api/reservas/admin/reservations/[id]/route.ts` |
| MODIFY | `src/app/admin/reservas/reservation-detail.tsx` |
| MODIFY | `src/app/admin/reservas/reservas-admin-client.tsx` |
| MODIFY | `src/lib/reservas/validations.ts` |
| MODIFY | `public/metadata/commission-rules.json` |

---

## References

- [ejecutivo-rate-solution.md](../docs/ejecutivo-rate-solution.md) — Design document: why rate-on-sale is the correct model
- [sales-rep-commission-rates-investigation.md](../docs/sales-rep-commission-rates-investigation.md) — Root cause analysis: 12-snapshot schema timeline, polymorphic anti-pattern diagnosis
- [commission-audit-plan.md](../docs/commission-audit-plan.md) — 13 diffs between SSOT and app (DIFF-06 = per-unit rate granularity)
- Stripe Ledger pattern: capture the rate at transaction time, don't look it up later
- Celko, *SQL Antipatterns* (Ch. 7): polymorphic associations prevent FK enforcement
- Kimball SCD Type 2: rate changes captured as immutable snapshots (the sale row IS the snapshot)
