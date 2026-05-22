# 091 — Fix salesperson_periods: Active Rep Commission Misrouting (April 2026)

**Date:** 2026-05-19
**Scope:** `salesperson_periods` table (data fix), `scripts/migrations/062_fix_salesperson_periods_active_reps.sql`
**Triggered by:** Post-import audit of migration 061 commission output — Rony, Daniel V., Paula, Erwin, José absent as named recipients; all routed to Ahorro por Retiro instead.

---

## Summary

5 reps' period data in `salesperson_periods` was stale. `calculate_commissions()` uses `MAX(salesperson_periods.end_date) < payment_date` to decide whether to redirect a rep's ejecutivo commission to `ahorro_por_retiro`. Because all four active reps (Rony, Daniel, Paula, Erwin) had closed end_dates in Jan–Feb 2026 and no open period, the function treated them as offboarded for every April payment. José Gutiérrez's MAX end_date was 2026-02-01 instead of his confirmed 2026-04-21. Stale data was deleted and replaced with correct periods. April commissions recalculated. All 16 misrouted rows now correctly attributed to named reps. Ahorro por Retiro: 0 rows for April.

---

## Root Cause

### The function logic (from `calculate_commissions()`)

```sql
v_redirect_to_ahorro := COALESCE(
  (SELECT MAX(sp.end_date) < v_payment.payment_date
   FROM salesperson_periods sp
   WHERE sp.salesperson_id = v_sale.sales_rep_id
     AND sp.end_date IS NOT NULL),
  false
);
```

- If a rep has **no rows** with `end_date IS NOT NULL` → subquery returns NULL → `COALESCE(NULL, false) = false` → paid directly. (Ivan's case.)
- If a rep has **any row** with `end_date IS NOT NULL` and `MAX(end_date) < payment_date` → `true` → redirected to `ahorro_por_retiro`.

### What was in the table (stale data)

| Rep | MAX end_date | April payment_date | Result |
|-----|-------------|-------------------|--------|
| Rony Ramirez | 2026-02-15 | 2026-04-xx | → Ahorro por Retiro ✗ |
| Daniel Veliz | 2025-12-31 | 2026-04-xx | → Ahorro por Retiro ✗ |
| Erwin Cardona | 2026-02-10 | 2026-04-xx | → Ahorro por Retiro ✗ |
| Paula Hernández | 2026-01-31 | 2026-04-xx | → Ahorro por Retiro ✗ |
| José Gutiérrez | 2026-02-01 | 2026-04-xx | → Ahorro por Retiro ✗ |
| Ivan Castillo | (no rows) | 2026-04-xx | → Ivan directly ✓ |

### Why these stale rows existed

The four active reps' existing period records had closed end_dates from a prior data migration. Their current active period was never inserted with `end_date = NULL`. José Gutiérrez's period was last closed at 2026-02-01, not updated to reflect his confirmed 2026-04-21 offboarding date from migration 059.

---

## Fix (Migration 062)

### Phase 1 — Delete stale rows

```sql
DELETE FROM salesperson_periods
WHERE salesperson_id IN (
  '8b14b330-7e04-4409-98eb-e3d1d7d0a363',  -- Rony Ramirez
  'c5e33ccb-6c39-45ac-8d4d-ee5cdf598895',  -- Daniel Veliz
  'c87fe26f-3fad-4498-8cea-4563a380d863',  -- Erwin Cardona
  '1718037b-0d7b-4346-8ef2-c7658e25092b',  -- Paula Hernández
  '3d7ff0ed-94bf-4d9a-9259-ea03114e62a2'   -- José Gutiérrez
);
```

### Phase 2 — Insert correct periods

| Rep | start_date | end_date | Rationale |
|-----|-----------|----------|-----------|
| Rony Ramirez | 2025-10-01 | NULL | Ongoing active rep |
| Daniel Veliz | 2025-11-01 | NULL | Ongoing active rep |
| Erwin Cardona | 2025-11-01 | NULL | Ongoing active rep |
| Paula Hernández | 2022-11-01 | NULL | Ongoing active rep |
| José Gutiérrez | 2025-06-01 | 2026-04-21 | Offboarded 2026-04-21 per migration 059 SSOT |

### Phase 3 — Recalculate April 2026 commissions

`calculate_commissions()` called for all 21 active April payments. Function deletes and reinserts all commission rows for each payment unconditionally.

---

## Before vs. After

### Before (migration 061 output — incorrect)

| Recipient | Rows | Total (GTQ) |
|-----------|------|-------------|
| Puerta Abierta | 21 | 105,791.17 |
| **Ahorro por Retiro** | **16** | **35,377.22** |
| Otto Herrera | 21 | 25,389.88 |
| Antonio Rada | 21 | 12,694.94 |
| Ahorro | 20 | 10,212.90 |
| Ahorro G. Comercial | 21 | 8,463.29 |
| Ivan | 5 | 7,305.47 |
| Job Jiménez | 21 | 6,347.47 |

### After (migration 062 output — correct)

| Recipient | Rows | Total (GTQ) |
|-----------|------|-------------|
| Puerta Abierta | 21 | 105,791.17 |
| Otto Herrera | 21 | 25,389.88 |
| Antonio Rada | 21 | 12,694.94 |
| Erwin | 4 | 12,305.49 |
| Ahorro | 20 | 10,212.90 |
| Ahorro G. Comercial | 21 | 8,463.29 |
| Ivan | 5 | 7,305.47 |
| José | 2 | 7,095.43 |
| Job Jiménez | 21 | 6,347.47 |
| Daniel V. | 4 | 5,877.31 |
| Paula | 3 | 5,709.06 |
| Rony | 3 | 4,389.94 |
| **Ahorro por Retiro** | **0** | **0** |

**Money conserved:** Previous Ivan (Q7,305.47) + Ahorro por Retiro (Q35,377.22) = Q42,682.69. New sum of all 6 rep rows = Q42,682.70. ✓ (Q0.01 rounding, pool unchanged.)

---

## SOP Gap Identified

The monthly ETL SOP (Step 3 — DB Pre-Check) had no check for `salesperson_periods`. This caused the misrouting to go undetected until post-import audit. Step 3 updated in SOP v1.2 to include a mandatory `salesperson_periods` pre-check for every rep in the SSOT.

---

## Files Changed

| File | Change |
|------|--------|
| `salesperson_periods` (DB) | Deleted 9 stale rows; inserted 5 correct rows |
| `commissions` (DB) | 147 rows deleted and reinserted (21 payments × ~7 rows each, corrected routing) |
| `scripts/migrations/062_fix_salesperson_periods_active_reps.sql` | New migration file |
| `docs/SOP-monthly-commission-etl.md` | v1.2: Step 3 salesperson_periods pre-check added |
