# 067 — Residual Ahorro Calculation

**Date:** 2026-03-17
**Author:** Jorge Luis Contreras Herrera
**Status:** DEPLOYED to production
**Migration:** 035
**Severity:** High — ahorro was a fixed 0.35% rate; SSOT shows it's a dynamic residual

---

## Context

### The Problem

The `calculate_commissions()` function paid ahorro at a **fixed 0.35% rate** (from `commission_rates WHERE always_paid = true`). The SSOT (CFO's Excel) shows ahorro is a **residual**: it absorbs whatever commission pool remains after all other recipients to enforce the 5.00% hard cap.

With per-unit ejecutivo rates varying from 0.25% to 2.00%, a fixed ahorro rate is wrong for nearly every sale:
- Unit with EV at 0.25% should have ahorro = 1.65%, app gave 0.35% (1.30% gap)
- Unit with EV at 1.25% + GC + Supervisor should have ahorro = 0%, app gave 0.35% (0.35% overpaid)

### SSOT Formula

```
AHORRO% = 5.00% − sum(all other recipient rates for this sale)
```

The 5% hard cap means every sale's commission rates must total exactly 5.00%. Ahorro is the algebraic enforcer.

---

## What Changed

### Phase A: Deactivate ahorro from always_paid

```sql
UPDATE commission_rates SET always_paid = false
WHERE recipient_id = 'ahorro' AND recipient_type = 'special';
```

Row remains in `commission_rates` for reference. The old Section 4 loop (which looked up special always_paid recipients) now returns zero rows.

### Phase B: Function Update — Residual Ahorro

Added rate tracking throughout the function:

```sql
v_total_rate_committed numeric := 0;  -- accumulates all rates from Sections 1a/1b/2/3
v_ahorro_rate numeric;                 -- computed residual
```

After each section inserts commission rows, it accumulates the rate:
- **Section 1a** (management): `+= v_rate.rate` (PA 2.50%, Otto 0.60%, Ahorro Comercial 0.20%)
- **Section 1b** (GC/Supervisor): `+= v_assignment.rate` (0–0.50% depending on sale_date)
- **Section 2** (ejecutivo): `+= v_sale.ejecutivo_rate` (0.25%–2.00%)
- **Section 3** (referral): `+= v_rate.rate` (1.00% when applicable)

Section 4 replaced with:

```sql
v_ahorro_rate := 0.05 - v_total_rate_committed;
IF v_ahorro_rate > 0 THEN
  INSERT INTO commissions (...) VALUES (..., 'ahorro', 'Ahorro', ..., v_ahorro_rate, ...);
ELSIF v_ahorro_rate < 0 THEN
  RAISE WARNING 'Sale % total rate committed %.4f exceeds 5%% — ahorro skipped';
END IF;
```

Section 5 (60% cap) unchanged — still scales all rows including residual ahorro.

---

## Design Decisions

1. **Dynamic residual instead of hardcoded BASE%** — The SSOT documents two BASE% values (1.90% and 1.35%) based on GC/Supervisor payment status. But with temporal GC assignments (Ronaldo 0.50%, Alek 0.30%, Antonio 0.30%), the base varies across more than two states. Computing `5% - sum(all others)` handles all states automatically without hardcoding.

2. **Negative ahorro is expected** — When committed rates exceed 5% (e.g., EV=1.25% + GC 0.30% + Supervisor 0.25%), ahorro goes negative. This is logged as a warning and the row is skipped. The 60% cap handles dollar-level scaling for phase 1+2. This matches SSOT behavior.

3. **Ahorro Comercial interaction (DIFF-07 deferred)** — `ahorro_comercial` (0.20%) is paid separately in Section 1a. In the SSOT, it's part of the ahorro pool. The combined total (ahorro_comercial + ahorro_residual) is algebraically identical to the SSOT total. The split can be reconciled in DIFF-07.

---

## Verification (Production Results)

**Before/After:**

| Metric | Before (fixed) | After (residual) |
|---|---|---|
| Ahorro rows | 6,115 | 1,519 |
| Ahorro total | Q47,631.80 | Q24,861.94 |
| Rate range | 0.35% only | 0.15%–0.70% |
| Phase 3 rate sum = 5% | — | 0 deviations |

**Rate distribution:**

| Rate | Count | Typical scenario |
|------|-------|-----------------|
| 0.70% | 296 | EV=1.00%, no GC/Supervisor |
| 0.45% | 586 | EV=1.25%, no GC/Supervisor |
| 0.20% | 595 | EV=1.00%, Ronaldo GC (0.50%) |
| 0.15% | 42 | EV=1.00%, Alek GC + Supervisor |

**5,048 payments have no ahorro row** — rates exceed 5%, residual is zero or negative. This is correct per SSOT.

---

## Files

| Action | File |
|--------|------|
| NEW | `scripts/migrations/035_residual_ahorro.sql` |
| MODIFY | `public/metadata/commission-rules.json` |

---

## Audit Progress

| DIFF | Description | Status | Migration |
|------|-------------|--------|-----------|
| DIFF-01 | Ronaldo O. missing | **RESOLVED** | 034 |
| DIFF-02 | Puerta Abierta always_paid | **RESOLVED** | 032 |
| DIFF-03 | Alek conditional | **RESOLVED** | 034 |
| DIFF-04 | Antonio conditional | **RESOLVED** | 034 |
| DIFF-05 | Ahorro residual | **RESOLVED** | 035 |
| DIFF-06 | Per-unit EV rates | **RESOLVED** | 033 |
| DIFF-07 | Ahorro G. Comercial treatment | Open | — |
| DIFF-08 | ISR retention | Open | — |
| DIFF-09 | Phase 2 proportional | Open | — |
| DIFF-10 | Escalation trigger | Open | — |
| DIFF-11 | Casa Elisa rates | Open | — |
| DIFF-12 | Referral tracking | Open | — |
| DIFF-13 | Legacy fallback rates | Open | — |
