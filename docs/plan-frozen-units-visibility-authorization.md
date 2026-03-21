# Plan: Frozen Units Visibility + Authorization Workflow

**Date:** 2026-03-20
**Requested by:** Gerente Comercial
**Context:** Boulevard 5 has very few available units. Frozen units are invisible to sales reps. They need to see them and request authorization to reserve them.

---

## Requirements (verbatim)

> Frozen Units in Boulevard, due to very low available units:
> - Currently, they cannot see frozen units.
> - Sales reps must be able to see frozen units along with available units in pwa and page.
> - To reserve a frozen unit, they must request authorization (approval workflow, torredecontrol can approve or reject).

---

## Current State Analysis

### What works today
- `rv_unit_status` enum already includes `FROZEN`
- `RESERVABLE_STATUSES = ["AVAILABLE", "FROZEN"]` — the DB function `submit_reservation()` already accepts FROZEN units (line 455 in migration 018)
- `UNIT_STATUS_COLORS.FROZEN = "#a855f7"` (purple) and `UNIT_STATUS_LABELS.FROZEN = "Congelado"` already defined
- Admin can release freezes via `PATCH /api/reservas/admin/freeze-requests/[id]/release`
- `unit_status_log` already tracks FROZEN transitions
- Realtime subscription (`use-realtime-units.ts`) already handles any status change

### What's broken / missing

| # | Gap | Impact |
|---|---|---|
| G1 | `/reservar` grid hardcodes `status: "AVAILABLE"` (`reservar-client.tsx:52`) | Sales reps cannot see frozen units at all |
| G2 | `/api/reservas/units` API only supports single `status` filter via `.eq()` | Cannot fetch AVAILABLE + FROZEN in one query |
| G3 | No visual distinction in grid between AVAILABLE and FROZEN buttons | Sales rep wouldn't know a unit is frozen before clicking |
| G4 | Auto-approval bypasses manual review for frozen units | When `auto_approval_enabled = true`, a frozen-unit reservation auto-confirms without torredecontrol authorization — violates the business requirement |
| G5 | `reject_reservation()` always restores unit to AVAILABLE (line 586–588) | If admin rejects a reservation on a previously-frozen unit, the freeze is silently destroyed — unit becomes AVAILABLE instead of FROZEN |
| G6 | `confirm_reservation()` doesn't release the `freeze_requests` record | After confirming a reservation on a frozen unit, the freeze_request stays ACTIVE (dangling), and `status_detail` on rv_units remains set to the freeze reason |
| G7 | No way to distinguish "normal" vs "frozen-unit" reservations in admin panel | TorreDeControl can't tell which PENDING_REVIEW reservations require freeze authorization |

---

## Design Decisions

### Approach: Reuse existing reservation flow

The system already supports reserving frozen units at the database level (`RESERVABLE_STATUSES`). Rather than building a separate "freeze authorization" workflow with new tables, we augment the existing reservation flow:

1. Sales rep sees FROZEN units in the grid (purple)
2. Sales rep fills the same reservation form (no separate request form)
3. Reservation is created as PENDING_REVIEW — but **auto-approval is always skipped** for frozen units
4. TorreDeControl sees a visual badge ("Unidad congelada — requiere autorización") in the admin panel
5. TorreDeControl approves → reservation confirmed, freeze released automatically
6. TorreDeControl rejects → unit returns to FROZEN (not AVAILABLE)

**Why this approach:**
- Reuses 90% of existing infrastructure (form, API, DB functions, admin UI, realtime)
- No new tables, no new enum types, no new approval workflow to build/maintain
- Sales rep workflow is identical — just clicks a purple button instead of green
- TorreDeControl workflow is identical — just reviews a reservation with a badge
- The only new column: `previous_unit_status` on `reservations` to track what to restore on rejection

### Scope: All projects, not just Boulevard

Although the Gerente Comercial mentions Boulevard specifically, frozen units exist across projects (9 freeze_requests in production). The feature should work consistently across all projects — no project-specific code.

---

## Implementation Plan

### Phase 1: Database Migration (migration 043)

**Goal:** Track the unit's status at reservation time so rejection restores the correct status. Auto-release freeze on confirmation.

#### 1a. Add `previous_unit_status` column to `reservations`

```sql
ALTER TABLE reservations
  ADD COLUMN previous_unit_status rv_unit_status;
```

- Nullable (existing reservations were all from AVAILABLE, no backfill needed)
- Set by `submit_reservation()` at creation time

#### 1b. Update `submit_reservation()` to store previous status

In the INSERT into `reservations`, add `previous_unit_status = v_unit_status`. This captures whether the unit was AVAILABLE or FROZEN at the time of reservation.

#### 1c. Update `reject_reservation()` to restore correct status

Current (broken for frozen units):
```sql
UPDATE rv_units SET status = 'AVAILABLE' ...
```

New:
```sql
-- Fetch previous_unit_status from the reservation
SELECT previous_unit_status INTO v_prev_status FROM reservations WHERE id = p_reservation_id;

-- Restore to FROZEN if it was frozen, otherwise AVAILABLE
UPDATE rv_units SET
  status = COALESCE(v_prev_status, 'AVAILABLE'),
  status_detail = CASE WHEN COALESCE(v_prev_status, 'AVAILABLE') = 'FROZEN'
    THEN (SELECT reason FROM freeze_requests WHERE unit_id = v_unit_id AND status = 'ACTIVE' LIMIT 1)
    ELSE NULL END,
  status_changed_at = now()
WHERE id = v_unit_id;
```

#### 1d. Update `confirm_reservation()` to release active freeze

After confirming the reservation, auto-release any active freeze on that unit:

```sql
-- Auto-release any active freeze on this unit
UPDATE freeze_requests SET
  status = 'RELEASED',
  released_at = now(),
  released_by = p_admin_user_id
WHERE unit_id = v_unit_id AND status = 'ACTIVE';
```

#### 1e. Update `v_reservations_pending` view

Append `previous_unit_status` to the view SELECT so the admin UI can detect frozen-unit reservations. (PostgreSQL view rule: new columns must be appended at the END.)

**Files changed:**
- `scripts/migrations/043_frozen_unit_authorization.sql` (new)

---

### Phase 2: API Layer

**Goal:** Support multi-status filtering and skip auto-approval for frozen units.

#### 2a. Multi-status filter on `/api/reservas/units`

Current: `query.eq("status", filters.status)` (single value)

New: Support comma-separated status values:
```typescript
if (filters.status) {
  const statuses = filters.status.split(",");
  if (statuses.length === 1) {
    query = query.eq("status", statuses[0]);
  } else {
    query = query.in("status", statuses);
  }
}
```

Update the Zod schema `unitsQuerySchema` to accept comma-separated values.

#### 2b. Skip auto-approval for frozen units

In `POST /api/reservas/reservations` (line 115–132), before auto-approving, check if the unit was FROZEN:

```typescript
// Auto-approval: skip for frozen units (requires torredecontrol authorization)
if (data) {
  // Check if unit was frozen (fetch the reservation's previous_unit_status)
  const { data: reservation } = await supabase
    .from("reservations")
    .select("previous_unit_status")
    .eq("id", data)
    .single();

  const wasFrozen = reservation?.previous_unit_status === "FROZEN";

  if (!wasFrozen) {
    const { data: setting } = await supabase
      .from("system_settings")
      .select("value")
      .eq("key", "auto_approval_enabled")
      .maybeSingle();

    if (setting?.value === true) {
      // ... existing auto-confirm logic
    }
  }
}
```

#### 2c. Add audit event for frozen-unit reservations

When a reservation is created on a frozen unit, log `reservation.frozen_unit_requested` audit event so operations can track these.

**Files changed:**
- `src/app/api/reservas/units/route.ts`
- `src/app/api/reservas/reservations/route.ts`
- `src/lib/reservas/validations.ts` (unitsQuerySchema update)

---

### Phase 3: `/reservar` Grid (Sales Rep UI)

**Goal:** Show FROZEN units alongside AVAILABLE in the inventory grid with clear visual distinction.

#### 3a. Fetch AVAILABLE + FROZEN units

Change `reservar-client.tsx:52`:
```typescript
// Before:
status: "AVAILABLE",

// After:
status: "AVAILABLE,FROZEN",
```

#### 3b. Visual distinction for FROZEN units

FROZEN units already render with purple background via `UNIT_STATUS_COLORS.FROZEN`. Add a small visual indicator (e.g., a lock icon or "C" badge) to make the frozen state obvious at a glance:

```tsx
<button
  key={u.id}
  className="..."
  style={{ backgroundColor: UNIT_STATUS_COLORS[u.status] }}
  onClick={() => handleSelectUnit(u)}
>
  <span className="block leading-tight">{u.unit_number}</span>
  {u.status === "FROZEN" && (
    <span className="block text-[10px] font-normal opacity-90">Congelado</span>
  )}
  {u.status !== "FROZEN" && u.area_total ? (
    <span className="block text-[10px] font-normal opacity-80">{u.area_total}m²</span>
  ) : null}
</button>
```

#### 3c. Interstitial notice before form

When a sales rep clicks a FROZEN unit, show a brief notice before opening the form:

- Option A (simpler): Show a banner at the top of the reservation form: "Esta unidad está congelada. Tu reserva requerirá autorización de Torre de Control antes de ser confirmada."
- Option B: Show a confirmation dialog before opening the form: "Esta unidad está congelada. ¿Deseas solicitar autorización para reservarla?" → [Continuar] / [Cancelar]

**Recommendation:** Option A — a banner on the form. Fewer clicks, same information. The form already submits as PENDING_REVIEW anyway, so the sales rep just needs to know their reservation will be reviewed. Adding a dialog creates friction that slows them down.

#### 3d. Update counter text

Change "X unidades disponibles" to account for mixed statuses:
```tsx
const availableCount = filteredUnits.filter(u => u.status === "AVAILABLE").length;
const frozenCount = filteredUnits.filter(u => u.status === "FROZEN").length;

// e.g., "5 disponibles · 3 congelados"
```

#### 3e. Status legend

Add a small legend below the grid showing the two colors:
- Green dot + "Disponible" — reserva inmediata
- Purple dot + "Congelado" — requiere autorización

**Files changed:**
- `src/app/reservar/reservar-client.tsx`
- `src/app/reservar/reservation-form.tsx` (frozen-unit banner)

---

### Phase 4: Admin UI (TorreDeControl)

**Goal:** Let torredecontrol identify frozen-unit reservations and act on them with full context.

#### 4a. Badge in reservation table

In the admin reservas table, reservations where `previous_unit_status = 'FROZEN'` get a purple badge: "Unidad congelada" or a lock icon. This tells torredecontrol that this reservation requires freeze authorization.

#### 4b. Reservation detail context

In the reservation detail panel, show:
- "Esta reserva fue creada sobre una unidad congelada."
- The freeze reason (from `freeze_requests.reason`)
- The VIP name if applicable (from `freeze_requests.vip_name`)
- Who requested the freeze (from `freeze_requests.salesperson_id`)

This gives torredecontrol full context to decide whether to authorize the reservation.

#### 4c. Operaciones dashboard

The `/admin/operaciones` work queue should surface frozen-unit reservations with appropriate urgency — they represent sales reps blocked and waiting for authorization.

**Files changed:**
- `src/app/admin/reservas/admin-reservas-client.tsx` (badge)
- `src/app/admin/reservas/reservation-detail.tsx` or equivalent (freeze context)
- `src/app/admin/operaciones/operaciones-client.tsx` (if work queue filters by this)

---

### Phase 5: `/disponibilidad` Page

**Goal:** Ensure the availability dashboard also correctly shows frozen units if it's accessible to ventas.

Check if ventas users can access `/disponibilidad` (middleware allows it). If so, verify that frozen units are displayed there too. The disponibilidad page likely already shows all statuses since it's an overview dashboard — but confirm and add the status legend if missing.

**Files changed:**
- `src/app/disponibilidad/disponibilidad-client.tsx` (verify, possibly no changes needed)

---

## File Change Summary

| File | Change Type | Description |
|---|---|---|
| `scripts/migrations/043_frozen_unit_authorization.sql` | **New** | Add `previous_unit_status` column, update 3 DB functions, update view |
| `src/app/api/reservas/units/route.ts` | Edit | Multi-status filter support |
| `src/lib/reservas/validations.ts` | Edit | Update `unitsQuerySchema` for comma-separated status |
| `src/app/api/reservas/reservations/route.ts` | Edit | Skip auto-approval for frozen units, audit event |
| `src/app/reservar/reservar-client.tsx` | Edit | Fetch AVAILABLE+FROZEN, visual distinction, counter, legend |
| `src/app/reservar/reservation-form.tsx` | Edit | Frozen-unit banner/notice |
| `src/app/admin/reservas/admin-reservas-client.tsx` | Edit | "Unidad congelada" badge on frozen-unit reservations |
| Admin reservation detail component | Edit | Show freeze context (reason, VIP, who froze) |

---

## Edge Cases & Risks

### E1: Race condition — two sales reps try to reserve the same frozen unit
**Mitigation:** Already handled. `submit_reservation()` uses `SELECT ... FOR UPDATE` (row-level lock). The second salesperson gets "Unidad no disponible" because the first reservation moved it to SOFT_HOLD.

### E2: Admin rejects frozen-unit reservation while freeze has been released
**Mitigation:** If `previous_unit_status = 'FROZEN'` but no active `freeze_requests` record exists (it was released separately), `reject_reservation()` should fall back to AVAILABLE. The COALESCE + subquery handles this: if no active freeze reason is found, `status_detail` is set to NULL and status goes to AVAILABLE.

### E3: Auto-approval is ON but sales rep reserves a frozen unit
**Mitigation:** Phase 2b explicitly skips auto-approval when `previous_unit_status = 'FROZEN'`. Reservation stays in PENDING_REVIEW for torredecontrol.

### E4: Frozen unit is reserved, then the freeze is released by admin before reservation review
**Mitigation:** The unit is already in SOFT_HOLD (not FROZEN), so releasing the freeze would fail (freeze_request is for a unit not in FROZEN status anymore). The DB function `release_freeze()` doesn't check unit status — it just updates freeze_requests and sets unit to AVAILABLE. **Risk:** If someone releases the freeze while the unit is in SOFT_HOLD, it would set the unit to AVAILABLE while a PENDING_REVIEW reservation exists. **Fix:** `release_freeze()` should check if unit is in FROZEN status before releasing. If not in FROZEN (e.g., already in SOFT_HOLD), skip the unit status update but still mark freeze as RELEASED. This is a pre-existing bug — add to migration 043.

### E5: Multiple freezes on the same unit (historical)
**Mitigation:** `submit_freeze()` requires unit to be AVAILABLE, so only one freeze can be active at a time. No risk of multiple active freezes.

### E6: PWA / offline behavior
The service worker (`public/sw.js`) caches the `/reservar` page. The unit grid is fetched dynamically via API, so no SW changes needed. The status filter change (AVAILABLE → AVAILABLE,FROZEN) is in the client code, which is served fresh from the edge.

---

## What This Does NOT Include

- **Notification to sales rep when freeze authorization is approved/rejected** — Currently no push notification system exists. Sales rep must check back manually or see the unit disappear from the grid (realtime). A future enhancement could add email/WhatsApp notifications.
- **Freeze authorization request as a separate entity** — We reuse reservations. No new `freeze_authorization_requests` table.
- **Project-specific logic** — This works for all projects, not just Boulevard. Boulevard may have the most frozen units today, but the feature is universal.
- **Changes to who can freeze/unfreeze** — Freeze creation and release permissions remain unchanged (any auth user can freeze, only admin can release).

---

## Deployment Sequence

1. Deploy migration 043 via Management API (or `supabase db push`)
2. Deploy application code (Vercel auto-deploy on push)
3. Verify: open `/reservar` as a ventas user for a project with frozen units → frozen units should appear in purple
4. Verify: create a reservation on a frozen unit → should go to PENDING_REVIEW (not auto-confirmed)
5. Verify: admin confirms → freeze auto-released, unit goes to RESERVED
6. Verify: admin rejects → unit returns to FROZEN (not AVAILABLE)
7. Bump service worker version in `public/sw.js` (`reservar-v2` → `reservar-v3`)

---

## Estimated Scope

| Phase | Effort |
|---|---|
| Phase 1: Migration | ~2h |
| Phase 2: API changes | ~1h |
| Phase 3: /reservar grid | ~2h |
| Phase 4: Admin UI | ~2h |
| Phase 5: /disponibilidad verify | ~30min |
| Testing & deploy | ~1h |
| **Total** | **~8.5h** |


---

## ADDENDUM 2026-03-20: BLT Torre B — Authoritative Correction

**Source:** Jorge (project owner), direct confirmation.
**Cross-reference:** `docs/creditos-33-units-investigation.md` (UPDATE 2026-03-20)

During the Créditos dashboard backfill investigation, 24 BLT Torre B units were flagged with credit data but no reservations. The "INFO PARA REPORTES" Excel sheet listed 58 rows of client data, suggesting 58 hidden sales. Upon authoritative review:

1. **As of 2026-03-20, only 3 confirmed sales exist in Bosque Las Tapias — Torre B.** The 58 rows in "INFO PARA REPORTES" do NOT represent real sales. The confirmed count on that date is **3** (point-in-time figure, not a fixed ceiling).
2. **All existing BLT Torre B sales records will be dropped from the production database** to establish a clean baseline.
3. **Only the 3 confirmed sales (as of 2026-03-20) will be uploaded** as the sole BLT Torre B transactions. This is a point-in-time count — new sales will flow through the normal Orion reservation process.

Any prior references in this document to BLT Torre B having 11 hidden reservations (Category C), 13 orphan income markers (Category D), or 58 clients missing from the DB are **superseded** by this correction (2026-03-20).