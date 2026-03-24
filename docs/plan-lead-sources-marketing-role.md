# Lead Sources Management Page + Marketing Role

**Status:** ✅ Completed 2026-03-24 (changelog 080). Migration 046 deployed to prod.

## Context
Lead sources are currently hardcoded in `src/lib/reservas/constants.ts` (16 options). The user wants a management UI so marketing can add/remove/reorder sources without code changes. A new "marketing" role is needed for users of this page. Marketing also gets read-only dashboard access.

---

## Phase 1: Migration 046 — `lead_sources` table
**File:** `scripts/migrations/046_lead_sources.sql`

- Table: `lead_sources` (id uuid v7 PK, name text UNIQUE NOT NULL, display_order int NOT NULL DEFAULT 0, is_active boolean NOT NULL DEFAULT true, created_at, updated_at, updated_by uuid FK → auth.users)
- Seed current 16 sources with display_order 1–16
- RLS: SELECT for all authenticated, INSERT/UPDATE/DELETE for marketing + admin (via `jwt_role()` helper)
- Trigger: auto-update `updated_at` on change

## Phase 2: Add "marketing" role to backend + frontend

### `src/lib/auth.ts`
- Add `"marketing"` to `Role` union type
- Add `marketing: 25` to `ROLE_LEVEL` (between inventario=20 and contabilidad=30)

### `src/lib/permissions.ts`
- Add `"marketing"` to imports awareness
- Add shorthand: `const MK: Role[] = ["master", "torredecontrol", "marketing"]`
- Add `lead_sources` to `Resource` type
- Add to PERMISSIONS matrix:
  ```
  lead_sources: { view: MK, create: MK, update: MK, delete: MK }
  ```
- Add `"marketing"` to `DATA_VIEWER_ROLES` (for dashboard access)

### `middleware.ts`
- Add `"marketing"` to middleware routing: blocklist approach like DATA_PAGE_ROLES, with exception for `/admin/lead-sources`

### `src/components/nav-bar.tsx`
- Add `marketing: "Marketing"` to `ROLE_LABELS`
- Add `marketing: "#ec4899"` to `ROLE_COLORS` (pink)
- Add `"marketing"` to `DATA_VIEWER_ROLES` re-export in permissions.ts (NavBar imports from there)
- Add nav link: `{ href: "/admin/lead-sources", label: "Fuentes", roles: ["master", "torredecontrol", "marketing"] }`

### `scripts/generate-access-matrix.ts`
- Add `"marketing"` to `ALL_ROLES` array

## Phase 3: API routes

### `GET /api/reservas/lead-sources/route.ts` — public read (authenticated)
- Returns active lead sources ordered by `display_order`
- Used by reservation forms (ventas users need this)
- Auth: `requireAuth()` only

### `/api/admin/lead-sources/route.ts` — management CRUD
- **GET**: Returns ALL sources (active + inactive), ordered by display_order. Auth: `requireRole(rolesFor("lead_sources", "view"))`
- **POST**: Create new source (name, display_order). Auth: `requireRole(rolesFor("lead_sources", "create"))`. Audit log.

### `/api/admin/lead-sources/[id]/route.ts`
- **PATCH**: Update name, display_order, is_active. Auth: `requireRole(rolesFor("lead_sources", "update"))`. Audit log.
- **DELETE**: Hard delete (only if source is unused in reservations). Auth: `requireRole(rolesFor("lead_sources", "delete"))`. Audit log. If source is in use → return 409 with instruction to deactivate instead.

## Phase 4: Admin page `/admin/lead-sources`

### `src/app/admin/lead-sources/page.tsx`
- Server component with metadata (follows `/admin/roles` pattern)

### `src/app/admin/lead-sources/lead-sources-client.tsx`
- Fetch all sources from `/api/admin/lead-sources`
- Stats: total, active, inactive
- Table: name, order, status (active/inactive toggle), actions (edit/delete)
- Inline editing for name and display_order
- "Add source" button → inline row or small form
- Toggle is_active via PATCH
- Delete with confirmation (only if unused)
- Follows `roles-client.tsx` patterns (NavBar, loading skeleton, error state)

## Phase 5: Update forms to use DB-driven sources

### `src/app/reservar/reservation-form.tsx`
- Fetch lead sources from `GET /api/reservas/lead-sources` on mount
- Replace `LEAD_SOURCES` import with fetched data
- Update `TOP_LEAD_SOURCES` to use first 6 from fetched list
- Fallback: if fetch fails, use empty array (field becomes free text or hidden)

### `src/app/ventas/portal/nueva-reserva/nueva-reserva-client.tsx`
- Same changes as above

### `src/lib/reservas/validations.ts`
- Change `lead_source: z.enum(LEAD_SOURCES)` → `z.string().min(1)` with `.nullable().default(null)`
- Server-side validation in API route already checks against DB

### `src/lib/reservas/constants.ts`
- Keep `LEAD_SOURCES` array but add deprecation comment (still used as seed data reference)
- Remove `LeadSource` type export (replaced by string)

## Phase 6: Verification
- `next build` must pass (TypeScript strict, no errors)
- Manual test plan:
  1. Login as marketing user → sees Dashboard + Fuentes nav link
  2. Navigate to /admin/lead-sources → sees all 16 seeded sources
  3. Add new source → appears in list
  4. Toggle source inactive → disappears from reservation forms
  5. Login as ventas → reservation form shows only active sources from DB
  6. Login as master → sees Fuentes link, full CRUD works

---

## Files to create
| File | Purpose |
|------|---------|
| `scripts/migrations/046_lead_sources.sql` | Table + seed + RLS |
| `src/app/api/reservas/lead-sources/route.ts` | Public read endpoint |
| `src/app/api/admin/lead-sources/route.ts` | Admin GET + POST |
| `src/app/api/admin/lead-sources/[id]/route.ts` | Admin PATCH + DELETE |
| `src/app/admin/lead-sources/page.tsx` | Server page |
| `src/app/admin/lead-sources/lead-sources-client.tsx` | Client component |

## Files to modify
| File | Change |
|------|--------|
| `src/lib/auth.ts` | Add `"marketing"` to Role, ROLE_LEVEL |
| `src/lib/permissions.ts` | Add lead_sources resource, marketing to DATA_VIEWER_ROLES |
| `middleware.ts` | Add marketing routing |
| `src/components/nav-bar.tsx` | Add marketing labels/colors, lead-sources link |
| `src/lib/reservas/validations.ts` | Relax lead_source from enum to string |
| `src/lib/reservas/constants.ts` | Deprecation comment on LEAD_SOURCES |
| `src/app/reservar/reservation-form.tsx` | Fetch from API |
| `src/app/ventas/portal/nueva-reserva/nueva-reserva-client.tsx` | Fetch from API |
| `scripts/generate-access-matrix.ts` | Add marketing to ALL_ROLES |
