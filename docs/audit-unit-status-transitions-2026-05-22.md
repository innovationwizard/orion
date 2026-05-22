# Audit: Unit Status Transition Conflicts & Ambiguities

**Date:** 2026-05-22
**Canonical Rules Under Audit:**

1. `RESERVED → SOLD` — admin confirms
2. `RESERVED → AVAILABLE` — admin confirms desistimiento

---

## Executive Summary

The desistimiento flow (`RESERVED → AVAILABLE`) is correctly implemented end-to-end: RPC function, API route, auth gate, UI dialog, and audit trail all align.

The sale closure flow (`RESERVED → SOLD`) has **three issues**: the transition function does not exist, the UI dialog text is misleading, and there is a desist-button visibility bug.

---

## Issue 1 — CRITICAL: No `RESERVED → SOLD` function exists

**Impact:** Units that close sale (PCV signed) cannot be marked SOLD through the application. Status must be changed via manual migration SQL.

**Canonical rule:** `RESERVED → SOLD` — admin confirms

**Current state:**

| Layer | Status |
|---|---|
| PostgreSQL enum | `SOLD` exists in `rv_unit_status` |
| TypeScript type | `SOLD` exists in `RvUnitStatus` |
| Constants/labels | `SOLD: "Vendido"` defined in `constants.ts` |
| RPC function | **MISSING** — no `confirm_sale()` or equivalent |
| API route | **MISSING** — no `/api/reservas/admin/reservations/[id]/sell` |
| UI button | **MISSING** — no "Marcar como vendido" action on CONFIRMED reservations |
| Audit trail | **MISSING** — no `unit_status_log` entry path for this transition |

**Where SOLD units come from today:**
- Initial seed script (`seed_prod.py:67-75`) maps Excel `"pcv"` and `"promesa"` → `SOLD`
- One-time migration fixes (e.g., `058_fix_blt_torre_b_statuses.sql` lines 78-102) set specific units to SOLD via raw SQL
- OneDrive sync script may overwrite status from Excel source

**Files:**
- `scripts/migrations/018_reservas_mvp_schema.sql` — all 6 RPC functions defined; none handles RESERVED → SOLD
- `src/lib/reservas/types.ts:18` — type includes SOLD
- `src/lib/reservas/constants.ts:22-44` — labels include SOLD
- `scripts/seed_prod.py:67-75` — STATUS_MAP maps pcv/promesa → SOLD (seed-time only)

---

## Issue 2 — INCORRECT: Confirm dialog says "vendida" but backend sets "RESERVED"

**Impact:** Admin sees "Esta acción marcará la reserva como confirmada y la unidad como vendida" — but clicking Confirmar only sets the unit to `RESERVED`, not `SOLD`. The user is told one thing and gets another.

**File:** `src/app/admin/reservas/reservation-detail.tsx:771`
```
description="Esta acción marcará la reserva como confirmada y la unidad como vendida."
```

**What actually happens (backend):**
- `confirm_reservation()` in migration 018, lines 537-545:
  - Sets `reservations.status = 'CONFIRMED'`
  - Sets `rv_units.status = 'RESERVED'` (NOT `SOLD`)

**Resolution options:**
- **Option A:** Fix the dialog text to say "reservada" instead of "vendida" (matches current backend behavior)
- **Option B:** Implement a two-step flow: confirm → RESERVED, then a separate admin action → SOLD (matches the canonical rule)

---

## Issue 3 — BUG: Desist button shown on PENDING_REVIEW reservations

**Impact:** If an admin clicks "Desistir" on a PENDING_REVIEW reservation, the RPC call will fail with: `"Only confirmed reservations can be desisted. Current: PENDING_REVIEW"`. The button should not be visible.

**File:** `src/app/admin/reservas/reservation-detail.tsx:737-760`

The entire action bar (Confirmar, Rechazar, **Desistir**) is gated by `isPending`:
```typescript
const isPending = data?.reservation.status === "PENDING_REVIEW";  // line 243

{isPending && (  // line 737
  <div>
    <button onClick={() => setAction("confirm")}>Confirmar</button>    <!-- correct -->
    <button onClick={() => setAction("reject")}>Rechazar</button>      <!-- correct -->
    <button onClick={() => setAction("desist")}>Desistir</button>      <!-- WRONG -->
  </div>
)}
```

**Backend guard** (`desist_reservation()`, migration 018 line 620):
```sql
IF v_res_status != 'CONFIRMED' THEN
  RAISE EXCEPTION 'Only confirmed reservations can be desisted. Current: %', v_res_status;
END IF;
```

**Resolution:** The Desistir button should only appear when the reservation is `CONFIRMED`, not `PENDING_REVIEW`. It needs a separate `{isConfirmed && (...)}` block.

---

## Issue 4 — AMBIGUOUS: SDD schema comment lists "DESISTED" as a unit status

**Impact:** Low — documentation-only. Could confuse future developers reading the schema spec.

**File:** `origin/SSOT/_SDD-reserve-observer-mvp.md:347`
```
status  text  NOT NULL DEFAULT 'AVAILABLE'
        -- ENUM: AVAILABLE, SOFT_HOLD, RESERVED, FROZEN, SOLD, DESISTED
```

**Actual PostgreSQL enum** (migration 018, lines 30-36):
```sql
CREATE TYPE rv_unit_status AS ENUM (
  'AVAILABLE', 'SOFT_HOLD', 'RESERVED', 'FROZEN', 'SOLD'
);
```

`DESISTED` is **not** a unit status — it is a **reservation** status (`rv_reservation_status`). When a reservation is desisted, the unit returns to `AVAILABLE`; it does not get a `DESISTED` status.

**Resolution:** Remove `DESISTED` from the SDD schema comment to match the actual enum.

---

## Issue 5 — AMBIGUOUS: Legacy desistimientos page uses different system

**Impact:** Two separate desistimiento flows exist — one for the reservation system, one for legacy analytics sales. An admin could use the wrong one.

| System | Route | Table | Status Value | Auth |
|---|---|---|---|---|
| Reservation system | `PATCH /api/reservas/admin/reservations/[id]/desist` | `reservations` | `DESISTED` | `requireRole(ADMIN_ROLES)` |
| Legacy analytics | `PATCH /api/sales` | `sales` | `cancelled` | None explicit in route |

**Files:**
- `src/app/desistimientos/page.tsx:63-85` — legacy flow, calls `/api/sales` with `status: "cancelled"`
- `src/app/api/reservas/admin/reservations/[id]/desist/route.ts` — reservation system flow

**Resolution:** Determine whether the legacy desistimientos page should be deprecated, redirected, or kept for historical sales that predate the reservation system.

---

## Correctly Implemented Transitions (No Issues Found)

These transitions are consistent across SDD, schema, RPC, API, UI, and audit:

| Transition | Function | Guard | Auth | Audit |
|---|---|---|---|---|
| `AVAILABLE → SOFT_HOLD` | `submit_reservation()` | unit must be AVAILABLE or FROZEN | salesperson (via API) | unit_status_log |
| `SOFT_HOLD → RESERVED` | `confirm_reservation()` | reservation must be PENDING_REVIEW, unit must be SOFT_HOLD | ADMIN_ROLES | unit_status_log |
| `SOFT_HOLD → AVAILABLE` | `reject_reservation()` | reservation must be PENDING_REVIEW | ADMIN_ROLES | unit_status_log |
| `RESERVED → AVAILABLE` | `desist_reservation()` | reservation must be CONFIRMED | ADMIN_ROLES | unit_status_log |
| `AVAILABLE → FROZEN` | `submit_freeze()` | unit must be AVAILABLE | salesperson (via API) | unit_status_log |
| `FROZEN → AVAILABLE` | `release_freeze()` | freeze must be ACTIVE | ADMIN_ROLES | unit_status_log |
| `FROZEN → SOFT_HOLD` | `submit_reservation()` | unit must be AVAILABLE or FROZEN | salesperson (via API) | unit_status_log |

---

## Complete State Machine (As-Designed vs As-Built)

```
As-Designed (SDD + canonical rules):

AVAILABLE ──► SOFT_HOLD ──► RESERVED ──► SOLD
    ▲              │            │
    │              │            │ (admin confirms
    │    (admin    │            │  desistimiento)
    │    rejects)  │            │
    └──────────────┘            │
    └───────────────────────────┘
    ↕
  FROZEN


As-Built (after migration 067):

AVAILABLE ──► SOFT_HOLD ──► RESERVED ──► SOLD
    ▲              │            │
    │              │            │ (admin confirms
    │    (admin    │            │  desistimiento)
    │    rejects)  │            │
    └──────────────┘            │
    └───────────────────────────┘
    ↕
  FROZEN
```

Design and production code now match.

---

## Files Referenced

| File | Lines | Relevance |
|---|---|---|
| `origin/SSOT/_SDD-reserve-observer-mvp.md` | 347, 462-490 | State machine design + schema comment with DESISTED |
| `scripts/migrations/018_reservas_mvp_schema.sql` | 30-36, 40-47, 424-726 | Enum definitions + all 6 RPC functions |
| `src/lib/reservas/types.ts` | 18, 20 | TypeScript enum types |
| `src/lib/reservas/constants.ts` | 22-44, 69-81 | Labels, colors, status arrays |
| `src/app/admin/reservas/reservation-detail.tsx` | 243, 737-760, 768-811 | Admin UI: action buttons + confirm dialog |
| `src/app/api/reservas/admin/reservations/[id]/confirm/route.ts` | 12, 22 | Confirm API route |
| `src/app/api/reservas/admin/reservations/[id]/desist/route.ts` | 12, 22 | Desist API route |
| `scripts/seed_prod.py` | 67-75, 192-203 | STATUS_MAP for initial seed |
| `scripts/migrations/058_fix_blt_torre_b_statuses.sql` | 78-102 | Manual SOLD fixes |

---

## Resolution (2026-05-22)

All 5 issues resolved in migration 067 + application code changes:

| Issue | Resolution | Files |
|---|---|---|
| **#1 CRITICAL: No RESERVED->SOLD function** | Created `mark_unit_sold()` RPC + API route + UI button | `067_mark_unit_sold_and_desist_expansion.sql`, `mark-sold/route.ts`, `reservation-detail.tsx` |
| **#2 INCORRECT: Confirm dialog says "vendida"** | Changed to "reservada" to match actual backend behavior | `reservation-detail.tsx:792` |
| **#3 BUG: Desist button on PENDING_REVIEW** | Expanded `desist_reservation()` to accept PENDING_REVIEW (per business decision); added separate CONFIRMED action bar with mark-sold + desist | `067_mark_unit_sold_and_desist_expansion.sql`, `reservation-detail.tsx` |
| **#4 AMBIGUOUS: SDD lists DESISTED as unit status** | Removed DESISTED from schema comment | `_SDD-reserve-observer-mvp.md:347` |
| **#5 AMBIGUOUS: Legacy desistimientos page** | Removed page + nav link (per business decision: all sales migrated) | Deleted `desistimientos/page.tsx`, edited `nav-bar.tsx` |
