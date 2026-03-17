# 066 — Conditional GC/Supervisor + HR Management Page

**Date:** 2026-03-17
**Author:** Jorge Luis Contreras Herrera
**Status:** DEPLOYED to production
**Migration:** 034
**Severity:** Critical — GC/Supervisor commissions were unconditionally paid on all sales regardless of tenure

---

## Context

### The Problem

Three commission audit DIFFs traced to the same root cause: the `calculate_commissions()` function paid GC (Gerencia Comercial) and Supervisor recipients unconditionally via `commission_rates WHERE always_paid = true`, ignoring that these roles are **temporal** — the person holding the role changes over time, and only the holder active when the sale was made should receive the commission.

**DIFF-01:** Ronaldo Ogaldez (0.50% GC, start through July 4, 2025) was completely missing from the app. Zero commission rows for ~80+ Benestare pre-July sales.

**DIFF-03:** Alek Hernandez (0.30% GC) was paid on every sale unconditionally. The SSOT shows he should only receive commission on sales made during his tenure (July 7, 2025 through March 16, 2026).

**DIFF-04:** Antonio Rada (0.25% Supervisor) had the same unconditional overpayment issue as Alek.

### The Timeline (User-Provided)

| Period | GC (Gerencia Comercial) | Rate | Supervisor | Rate |
|--------|------------------------|------|------------|------|
| Start → 2025-07-04 | Ronaldo Ogaldez | 0.50% | *(none)* | 0% |
| 2025-07-07 → 2026-03-16 | Alek Hernandez | 0.30% | Antonio Rada | 0.25% |
| 2026-03-16 → ongoing | Antonio Rada | 0.30% | Job Jimenez | 0.25% |

Applies to B5, BNT, BLT. Casa Elisa: pre-July GC unknown — excluded until confirmed.

### July 5-6 Gap

Ronaldo ends July 4, Alek starts July 7. Sales on July 5-6 get no GC/Supervisor commission. This appears intentional (transition handoff).

---

## What Changed

### Phase A: Schema — `commission_gerencia_assignments.rate`

Added `rate numeric NOT NULL DEFAULT 0` column to the existing `commission_gerencia_assignments` table (created in migration 014, previously unused by the production function).

This table already had the right schema for temporal role resolution: `project_id`, `role`, `recipient_id`, `recipient_name`, `start_date`, `end_date`. The new `rate` column completes it.

### Phase B: Data — Temporal Assignments for All 4 Projects

**Fixed existing Boulevard entries** (migration 014 had wrong dates):
- Ronaldo: `end_date` changed from `2025-05-31` to `2025-07-04`, rate set to `0.005`
- Alek: `start_date` changed from `2025-06-01` to `2025-07-07`, `end_date` set to `2026-03-16`, rate set to `0.003`

**Populated all assignments:**

| Project | GC Period 1 (Ronaldo) | GC Period 2 (Alek) | GC Period 3 (Antonio) | Super Period 2 (Antonio) | Super Period 3 (Job) |
|---------|----------------------|--------------------|-----------------------|--------------------------|----------------------|
| Boulevard 5 | existing (fixed) | existing (fixed) | new | new | new |
| Benestare | new | new | new | new | new |
| Bosque Las Tapias | new (zero rows expected) | new | new | new | new |
| Casa Elisa | *(excluded)* | new | new | new | new |

**BLT Ronaldo at 0.50%:** Included for auditability. All BLT sales are post-July 2025, so the temporal filter naturally produces zero matches. Listed but never paid — matches the SSOT pattern.

**Job Jimenez:** Added to `salespeople` table (`full_name = 'Job Alexander Jimenez Villatoro'`, `display_name = 'Job Jimenez'`).

### Phase C: Deactivate Alek + Antonio from `always_paid`

```sql
UPDATE commission_rates SET always_paid = false
WHERE recipient_id IN ('alek_hernandez', 'antonio_rada')
  AND recipient_type = 'management';
```

Rows remain in `commission_rates` for reference, but the management loop (Section 1a) now skips them. Their commissions come exclusively from `commission_gerencia_assignments` (Section 1b).

### Phase D: Function Update — `calculate_commissions()`

**Section 1 split into 1a + 1b:**

**1a) Always-paid management** (unchanged — puerta_abierta 2.50%, otto_herrera 0.60%, ahorro_comercial 0.20%):
```sql
FOR v_rate IN
  SELECT * FROM commission_rates cr
  WHERE cr.recipient_type = 'management' AND cr.always_paid = true AND cr.active = true
LOOP
  INSERT INTO commissions (...);
END LOOP;
```

**1b) Conditional management** (NEW — GC + Supervisor from assignments table):
```sql
FOR v_assignment IN
  SELECT cga.recipient_id, cga.recipient_name, cga.rate, cga.role
  FROM commission_gerencia_assignments cga
  WHERE cga.project_id = v_sale.project_id
    AND v_sale.sale_date >= cga.start_date
    AND (cga.end_date IS NULL OR v_sale.sale_date <= cga.end_date)
    AND cga.rate > 0
LOOP
  INSERT INTO commissions (...);
END LOOP;
```

**Key design choice: `v_sale.sale_date`** (not `v_payment.payment_date`). The GC/Supervisor active when the sale was made gets the commission on ALL payments for that sale, even years later. This matches the SSOT where conditionality is per-sale, not per-payment.

All other sections (ejecutivo, referral, special, 60% cap) unchanged.

### Phase E: Commission Recalculation

All payments on active sales recalculated with the updated function. Additionally, 2,842 stale unpaid commission rows from cancelled sales were cleaned up (pre-migration relics that the active-only recalculation loop didn't touch).

### New Files: HR Management Page + API

**Admin page** (`/admin/roles`): Master-only page for managing temporal GC/Supervisor assignments. Table with project, role, person, rate, start/end dates, active/finalized status. Side panel for viewing details and ending assignments. Form for creating new assignments with overlap detection.

**API routes:**
- `GET /api/admin/management-roles` — List all assignments with project info
- `POST /api/admin/management-roles` — Create new assignment (409 on overlap)
- `PATCH /api/admin/management-roles/[id]` — End assignment (set end_date)

This page eliminates future migration requirements for GC/Supervisor role changes. When the next transition happens, the master user (or a future HR role) adds the new assignment and ends the old one directly in the UI.

---

## What Stays the Same

- **Puerta Abierta** (2.50%), **Otto Herrera** (0.60%), **Ahorro G. Comercial** (0.20%): Still `always_paid = true` in `commission_rates`. Truly unconditional.
- **Ejecutivo rates**: Still from `sales.ejecutivo_rate` (migration 033)
- **Referral, ahorro, ahorro_por_retiro, 60% cap**: All unchanged
- **`commission_gerencia_assignments` table structure**: Unchanged except adding `rate` column

---

## Design Decisions

1. **Reuse `commission_gerencia_assignments` instead of a new table** — The table already had temporal columns (`start_date`, `end_date`, `project_id`, `role`). Adding `rate` was simpler and more semantically correct than creating a parallel structure.

2. **Temporal key is `sale_date`, not `payment_date`** — The SSOT shows conditionality per-sale ("old reps" = old sales). A sale made during Ronaldo's tenure pays Ronaldo's GC on all payments for that sale, even years later. This follows the Stripe Ledger pattern: capture the rate at transaction time, don't re-resolve it on each payment.

3. **`always_paid = false` instead of deleting rows** — Alek and Antonio's `commission_rates` rows remain for reference and potential fallback. The flag toggle is reversible.

4. **BLT Ronaldo included despite zero expected rows** — Completeness and auditability. The SSOT lists Ronaldo for BLT (all zeros). Including him in the assignments table means the system accurately represents the SSOT, even when the temporal filter produces no matches.

5. **Casa Elisa pre-July excluded** — User confirmed no data available for CE's GC before Alek. Conservative approach: underpay (no GC) rather than overpay (wrong person). Can be added via the HR page when confirmed.

6. **HR page for master role initially** — Designed for reuse. When an HR-specific role is created later, the `requireRole(["master"])` check just needs one more string. No architectural change needed.

---

## Verification (Production Results)

| Query | Result | Expected |
|-------|--------|----------|
| Ronaldo commission rows | **4,757** | > 0 (previously 0) |
| Alek pre-July rows | **0** | 0 |
| Antonio pre-July rows | **0** | 0 |
| Ronaldo post-July rows | **0** | 0 |
| Stale cancelled-sale rows cleaned | **2,842** | — |

**Per-recipient counts (post-migration):**

| Recipient | Role | Rows |
|-----------|------|------|
| Ronaldo Ogaldez | GC 0.50% | 4,757 |
| Alek Hernandez | GC 0.30% | 476 |
| Antonio Rada | Supervisor 0.25% | 476 |
| Job Jimenez | Supervisor 0.25% | 0 (no sales on/after Mar 16 yet) |

---

## Files

| Action | File |
|--------|------|
| NEW | `scripts/migrations/034_conditional_gc_supervisor.sql` |
| NEW | `src/app/api/admin/management-roles/route.ts` |
| NEW | `src/app/api/admin/management-roles/[id]/route.ts` |
| NEW | `src/app/admin/roles/page.tsx` |
| NEW | `src/app/admin/roles/roles-client.tsx` |
| MODIFY | `src/lib/reservas/types.ts` |
| MODIFY | `src/lib/reservas/validations.ts` |
| MODIFY | `src/components/nav-bar.tsx` |
| MODIFY | `public/metadata/commission-rules.json` |

---

## Audit Progress

| DIFF | Description | Status | Migration |
|------|-------------|--------|-----------|
| DIFF-01 | Ronaldo O. missing | **RESOLVED** | 034 |
| DIFF-02 | Puerta Abierta always_paid | **RESOLVED** | 032 |
| DIFF-03 | Alek conditional | **RESOLVED** | 034 |
| DIFF-04 | Antonio conditional | **RESOLVED** | 034 |
| DIFF-05 | Ahorro residual | Open | — |
| DIFF-06 | Per-unit EV rates | **RESOLVED** | 033 |
| DIFF-07 | Ahorro G. Comercial treatment | Open | — |
| DIFF-08 | ISR retention | Open | — |
| DIFF-09 | Phase 2 proportional | Open | — |
| DIFF-10 | Escalation trigger | Open | — |
| DIFF-11 | Casa Elisa rates | Open | — |
| DIFF-12 | Referral tracking | Open | — |
| DIFF-13 | Legacy fallback rates | Open | — |

---

## References

- [commission-audit-plan.md](../docs/commission-audit-plan.md) — 13 diffs between SSOT and app
- [ejecutivo-rate-solution.md](../docs/ejecutivo-rate-solution.md) — Why rate-on-sale is correct (migration 033 design doc)
- `scripts/migrations/014_policy_periods_referral_gerencia.sql` — Original `commission_gerencia_assignments` table creation
- `scripts/migrations/033_ejecutivo_rate_on_sales.sql` — Current production function (pre-034 baseline)
- Stripe Ledger pattern: capture the rate at transaction time
