# 080 — Lead Sources Management + Marketing Role

**Date:** 2026-03-24
**Impact:** New feature — DB-driven lead source management with dedicated admin page. New "marketing" role for lead source configuration + read-only dashboard access.
**Migration:** 046 (deployed to prod)

## Why

Lead sources were hardcoded in `src/lib/reservas/constants.ts` (24 options, trimmed to 16). Any change required a code deploy. Marketing needs to add/remove/reorder sources independently — especially as new channels (TikTok, LinkedIn) are added and old ones (Perfilan, Pipedrive) are retired.

## What Changed

### New: "marketing" Role — Full 4-Layer Integration

| Layer | File | Change |
|-------|------|--------|
| Type system | `src/lib/auth.ts` | Added `"marketing"` to `Role` union, `ROLE_LEVEL: 25`, `DATA_VIEWER_ROLES` |
| Permissions | `src/lib/permissions.ts` | Added `lead_sources` resource (view/create/update/delete for `MK` group), `"marketing"` in `DATA_VIEWER_ROLES` |
| Middleware | `middleware.ts` | Marketing routing: dashboard + `/admin/lead-sources` allowed, other admin pages blocked |
| NavBar | `src/components/nav-bar.tsx` | Label "Marketing", color `#ec4899` (pink), "Fuentes" link |
| Access matrix | `scripts/generate-access-matrix.ts` | Added to `ALL_ROLES` array |

**Role level hierarchy:** ventas(10) → inventario(20) → **marketing(25)** → contabilidad(30) → financiero(40) → gerencia(50) → torredecontrol(60) → master(70)

### New: Migration 046 — `lead_sources` Table

```sql
CREATE TABLE lead_sources (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text NOT NULL UNIQUE,
  display_order int  NOT NULL DEFAULT 0,
  is_active     boolean NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  updated_by    uuid REFERENCES auth.users(id)
);
```

- Seeded with 16 sources (Facebook, Meta, Referido, Visita Inédita, Señalética, PBX, Página Web, Inbox, Mailing, Prospección, F&F, Wati, Activación, Evento, TikTok, LinkedIn)
- Auto-update trigger on `updated_at`
- RLS: SELECT for all authenticated, INSERT/UPDATE/DELETE for marketing + admin (`jwt_role()`)

### New: API Routes

| Route | Method | Auth | Purpose |
|-------|--------|------|---------|
| `/api/reservas/lead-sources` | GET | Any authenticated | Active sources for reservation forms |
| `/api/admin/lead-sources` | GET | marketing + admin | All sources (active + inactive) for management |
| `/api/admin/lead-sources` | POST | marketing + admin | Create new source |
| `/api/admin/lead-sources/[id]` | PATCH | marketing + admin | Update name, order, active status |
| `/api/admin/lead-sources/[id]` | DELETE | marketing + admin | Hard delete (only if unused in reservations; 409 if in use) |

All write operations log to `audit_events` (event types: `lead_source.created`, `lead_source.updated`, `lead_source.deleted`).

### New: `/admin/lead-sources` Management Page

- 3 KPI cards: total, active, inactive
- Table with inline editing (name + display_order)
- Active/inactive toggle per source (PATCH `is_active`)
- Delete with confirmation (blocked if source is used by reservations)
- "Add source" form with auto-incrementing display_order

### Changed: Reservation Forms — DB-Driven

| File | Change |
|------|--------|
| `src/app/reservar/reservation-form.tsx` | Fetches from `GET /api/reservas/lead-sources` on mount; removed `LEAD_SOURCES` import |
| `src/app/ventas/portal/nueva-reserva/nueva-reserva-client.tsx` | Same: fetch from API, removed hardcoded constant |
| `src/lib/reservas/validations.ts` | `lead_source` changed from `z.enum(LEAD_SOURCES)` to `z.string().min(1).nullable()` |
| `src/lib/reservas/constants.ts` | `LEAD_SOURCES` renamed to `LEAD_SOURCES_SEED` (reference only); `LeadSource` type removed |

Both forms show the first 6 sources as quick-select chips, with "Ver todas (N)" to expand. The count is now dynamic from the DB.

## Files Created

- `scripts/migrations/046_lead_sources.sql`
- `src/app/api/reservas/lead-sources/route.ts`
- `src/app/api/admin/lead-sources/route.ts`
- `src/app/api/admin/lead-sources/[id]/route.ts`
- `src/app/admin/lead-sources/page.tsx`
- `src/app/admin/lead-sources/lead-sources-client.tsx`

## Files Modified

- `src/lib/auth.ts` — Role type, ROLE_LEVEL, DATA_VIEWER_ROLES
- `src/lib/permissions.ts` — lead_sources resource, MK shorthand, DATA_VIEWER_ROLES
- `middleware.ts` — marketing routing block, login redirect
- `src/components/nav-bar.tsx` — marketing label/color, Fuentes link
- `src/lib/reservas/constants.ts` — LEAD_SOURCES → LEAD_SOURCES_SEED
- `src/lib/reservas/validations.ts` — lead_source enum → string
- `src/app/reservar/reservation-form.tsx` — fetch from API
- `src/app/ventas/portal/nueva-reserva/nueva-reserva-client.tsx` — fetch from API
- `scripts/generate-access-matrix.ts` — marketing in ALL_ROLES

## Next Steps

- Create Supabase Auth accounts for marketing users with `app_metadata.role = "marketing"`
- Regenerate access control matrix: `npx tsx scripts/generate-access-matrix.ts`
