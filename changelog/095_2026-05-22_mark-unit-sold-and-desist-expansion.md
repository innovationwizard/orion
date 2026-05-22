# 095 — Mark Unit Sold + Desist Expansion + UI Fixes

**Date:** 2026-05-22
**Migration:** `scripts/migrations/067_mark_unit_sold_and_desist_expansion.sql`
**Audit source:** `docs/audit-unit-status-transitions-2026-05-22.md`

## Problem

A systematic audit of the two canonical unit status transition rules found 5 issues:

1. **CRITICAL — No RESERVED → SOLD function.** Units that closed sale (PCV signed) could not be marked SOLD through the application. Status was only set via seed scripts or manual migration SQL.
2. **INCORRECT — Confirm dialog said "vendida".** The confirm reservation dialog told the admin "la unidad como vendida" but the backend actually set the unit to RESERVED, not SOLD.
3. **BUG — Desist button on PENDING_REVIEW.** The Desistir button was shown on PENDING_REVIEW reservations, but the RPC function only accepted CONFIRMED — clicking it would fail with an exception.
4. **AMBIGUOUS — SDD listed DESISTED as unit status.** The schema comment in `_SDD-reserve-observer-mvp.md` listed `DESISTED` in the `rv_unit_status` enum, but DESISTED is a reservation status — units return to AVAILABLE on desistimiento.
5. **AMBIGUOUS — Legacy desistimientos page.** Two separate desistimiento flows existed: the reservation system (`PATCH /api/reservas/.../desist`) and a legacy analytics page (`/desistimientos` calling `PATCH /api/sales`).

## Canonical Rules Enforced

- `RESERVED → SOLD` — admin confirms (promesa de compraventa signed or equivalent closure)
- `RESERVED → AVAILABLE` — admin confirms desistimiento

## What Changed

### Migration 067 (database)

- **New column:** `reservations.sale_closed_date date NULL` — captures when the PCV was signed / sale closed.
- **New function:** `mark_unit_sold(p_reservation_id, p_admin_user_id, p_sale_date, p_notes)` — transitions unit from RESERVED → SOLD. Guards: reservation must be CONFIRMED, unit must be RESERVED. Inserts `unit_status_log` audit entry.
- **Expanded function:** `desist_reservation()` — guard changed from `!= 'CONFIRMED'` to `NOT IN ('CONFIRMED', 'PENDING_REVIEW')`. When desisting a PENDING_REVIEW reservation, unit transitions from SOFT_HOLD → AVAILABLE (not RESERVED → AVAILABLE). The function already captures `v_old_status` dynamically.

### Application code

| File | Change |
|------|--------|
| `src/lib/reservas/validations.ts` | Added `markUnitSoldSchema` (sale_date + optional notes) |
| `src/lib/permissions.ts` | Added `mark_sold` action to `Action` type and `reservations` permissions |
| `src/app/api/reservas/admin/reservations/[id]/mark-sold/route.ts` | New API route: `PATCH`, `requireRole(ADMIN_ROLES)`, calls `mark_unit_sold` RPC, logs audit |
| `src/app/admin/reservas/reservation-detail.tsx` | State-dependent action panel: PENDING_REVIEW shows Confirmar/Rechazar/Desistir; CONFIRMED shows "Marcar como vendido"/Desistir. Fixed confirm dialog text to say "reservada". Added mark-sold dialog with date + notes. |
| `src/components/nav-bar.tsx` | Removed `/desistimientos` nav link |
| `src/app/desistimientos/page.tsx` | Deleted (legacy page) |
| `origin/SSOT/_SDD-reserve-observer-mvp.md` | Removed DESISTED from unit status enum comment (line 347). Updated transition rules (lines 488-489). |

### Documentation

| File | Change |
|------|--------|
| `docs/audit-unit-status-transitions-2026-05-22.md` | Created audit report + added resolution section |
| `docs/SOP-run-migration.md` | Corrected from psql/Dashboard methods to `npx supabase db query --linked` (v2.0) |

## Records Affected

No production data was modified. Migration 067 is schema + function only (ALTER TABLE ADD COLUMN, CREATE OR REPLACE FUNCTION).

## State Machine (post-067)

```
AVAILABLE ──► SOFT_HOLD ──► RESERVED ──► SOLD
    ^              |            |
    |    (admin    |            | (admin confirms
    |    rejects)  |            |  desistimiento)
    └──────────────┘            |
    └───────────────────────────┘
    ↕
  FROZEN
```

Design and production code now match.

## Open Items

None. All 5 audit issues resolved.
