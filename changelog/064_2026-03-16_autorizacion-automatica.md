# 064 — Autorización Automática + Ventas Dashboard

**Date:** 2026-03-16
**Author:** Jorge Luis Contreras Herrera
**Status:** DEPLOYED to production

---

## Context

Torredecontrol users (Pati) manually review every new reservation — a bottleneck that adds significant time per sale. The hypothesis: with the new system and better salesperson coaching, manual quality control may no longer be necessary. This feature adds a **reversible toggle** to test that hypothesis safely.

Additionally, ventas (sales) users had no desktop dashboard — only the mobile PWA at `/reservar`. This change introduces `/ventas/dashboard` as the ventas desktop home, with KPI stats, reservation table, and PDF document access for their own reservations.

---

## What Changed

### Phase 1: Database — Migration 031

**New table: `system_settings`**
- Key-value store for feature toggles (`key text PK`, `value jsonb`)
- RLS: all authenticated can read, only `master`/`torredecontrol` can modify
- Seeded with `auto_approval_enabled = false` (OFF by default)

**New RPC: `auto_confirm_reservation(p_reservation_id)`**
- Mirrors `confirm_reservation()` but uses system-level audit markers:
  - `reviewed_by = NULL` (no human reviewer)
  - `changed_by = 'system:auto-approval'` (satisfies `NOT NULL + CHECK(length>0)` on `unit_status_log`)
  - `reason = 'Autorización automática'`
- `SECURITY DEFINER`, row-level `FOR UPDATE` lock on unit

### Phase 2: Settings API

**New file:** `src/app/api/reservas/admin/settings/route.ts`
- `GET` — returns `{ auto_approval_enabled: boolean }`
- `PATCH` — updates toggle value (Zod-validated via `updateSettingsSchema`)
- Auth: `master` or `torredecontrol` only

**Modified:** `src/lib/reservas/validations.ts`
- Added `updateSettingsSchema`

### Phase 3: Auto-Approval Logic

**Modified:** `src/app/api/reservas/reservations/route.ts` (POST handler)
- After `submit_reservation` RPC, checks `system_settings` for `auto_approval_enabled`
- If `true`: calls `auto_confirm_reservation()` → returns `status: "CONFIRMED"` (201)
- If RPC fails: logs error, falls through to `PENDING_REVIEW` (graceful degradation)
- If `false` or not found: existing behavior unchanged

### Phase 4: Toggle UI

**Modified:** `src/app/admin/reservas/reservas-admin-client.tsx`
- Toggle switch in header area between title and stats
- Green dot + "activa" / gray dot + "inactiva" visual indicator
- Confirmation dialog when toggling ON (reuses `ActionConfirmDialog` pattern)
- Toggling OFF applies immediately (safer default — no confirmation)

### Phase 5: PDF Access for Ventas Users

**Modified (GET handler only — POST/PATCH remain admin-only):**
- `src/app/api/reservas/admin/pcv/[id]/route.ts`
- `src/app/api/reservas/admin/carta-autorizacion/[id]/route.ts`
- `src/app/api/reservas/admin/carta-pago/[id]/route.ts`

**Dual-auth pattern:** Try admin role first → if not admin, try salesperson auth with ownership check (`reservation.salesperson_id === salesperson.id`). Unauthorized → 403.

**Modified:** `src/app/admin/reservas/pcv/[id]/pcv-client.tsx`
- Added `readOnly?: boolean` prop
- When `readOnly`: hides profile editing form and "Guardar PCV" button, shows "Descargar PDF" only
- New `handleDownload` callback for direct pdf.save() without Storage upload

### Phase 6: Ventas Dashboard

**New files:**
- `src/app/api/reservas/ventas/reservations/route.ts` — GET salesperson's own reservations
- `src/app/ventas/dashboard/page.tsx` — Server component with metadata + Suspense
- `src/app/ventas/dashboard/ventas-dashboard-client.tsx` — Full dashboard with:
  - KPI stats (Total, Confirmadas, Pendientes, Desistidas, Rechazadas)
  - Reservation table (Unidad, Proyecto, Cliente(s), Monto, Fecha, Estado, Documentos)
  - PDF buttons (PCV, Autorización, Pago) for Boulevard 5 + CONFIRMED reservations
  - Graceful "no autorizado" message for non-salesperson users
- `src/app/ventas/dashboard/pcv/[id]/page.tsx` — Wraps `<PcvClient readOnly />`
- `src/app/ventas/dashboard/carta-autorizacion/[id]/page.tsx` — Wraps `<CartaClient />`
- `src/app/ventas/dashboard/carta-pago/[id]/page.tsx` — Wraps `<CartaPagoClient />`

### Phase 7: NavBar

**Modified:** `src/components/nav-bar.tsx`
- Added `{ href: "/ventas/dashboard", label: "Mi Panel" }` link

---

## Design Decisions

1. **Dedicated RPC, not modifying `confirm_reservation`** — The existing function expects `admin_user_id` which concatenates into `changed_by`. Passing NULL would violate the NOT NULL constraint. A separate function with hardcoded `'system:auto-approval'` is safer.
2. **Graceful degradation** — Auto-confirm failure is non-fatal. The reservation is saved as PENDING_REVIEW, and Pati reviews it manually as before.
3. **Dual-auth on existing routes (not duplicating)** — Avoids 3 duplicate API routes. GET handlers accept admin OR salesperson with ownership check. POST/PATCH remain admin-only.
4. **Cross-route component imports** — Ventas PDF pages import admin client components directly. No template duplication.
5. **`readOnly` prop on PCV** — Cleaner than a separate component. Hides save/upload/profile-edit for ventas while preserving download.
6. **No ventas detail panel (MVP)** — Table rows show essential info + PDF buttons directly. Side panel can be added later.
7. **Global toggle (all projects)** — Simpler than per-project. Can be refined later if needed.

---

## Risk Mitigations

| Risk | Mitigation |
|------|------------|
| Toggle accidentally left ON | Confirmation dialog on activation. Visible label in header. |
| Auto-confirm fails after submit | Graceful degradation: logs error, returns PENDING_REVIEW |
| `changed_by` NOT NULL constraint | Dedicated RPC with `'system:auto-approval'` string |
| Ventas accesses other's reservation | Ownership check: `salesperson_id` mismatch → 403 |
| PCV save by ventas user | `readOnly` hides save button. POST/PATCH remain admin-only |

---

## Files

| Action | File |
|--------|------|
| NEW | `scripts/migrations/031_system_settings_auto_approval.sql` |
| NEW | `src/app/api/reservas/admin/settings/route.ts` |
| NEW | `src/app/api/reservas/ventas/reservations/route.ts` |
| NEW | `src/app/ventas/dashboard/page.tsx` |
| NEW | `src/app/ventas/dashboard/ventas-dashboard-client.tsx` |
| NEW | `src/app/ventas/dashboard/pcv/[id]/page.tsx` |
| NEW | `src/app/ventas/dashboard/carta-autorizacion/[id]/page.tsx` |
| NEW | `src/app/ventas/dashboard/carta-pago/[id]/page.tsx` |
| MODIFY | `src/app/api/reservas/reservations/route.ts` |
| MODIFY | `src/app/admin/reservas/reservas-admin-client.tsx` |
| MODIFY | `src/lib/reservas/validations.ts` |
| MODIFY | `src/app/api/reservas/admin/pcv/[id]/route.ts` |
| MODIFY | `src/app/api/reservas/admin/carta-autorizacion/[id]/route.ts` |
| MODIFY | `src/app/api/reservas/admin/carta-pago/[id]/route.ts` |
| MODIFY | `src/app/admin/reservas/pcv/[id]/pcv-client.tsx` |
| MODIFY | `src/components/nav-bar.tsx` |

---

## Reference

- [Implementation Plan](../memory/autorizacion-automatica-plan.md) — Full 7-phase plan
