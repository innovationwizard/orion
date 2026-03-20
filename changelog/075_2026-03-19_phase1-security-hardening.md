# 075 — Phase 1 Security Hardening: Middleware, NavBar, RLS (GAP-04, GAP-05)

**Date:** 2026-03-19
**Impact:** Security hardening. Completes all go-live security blockers. Explicit role enforcement at middleware, UI, and database layers.
**Prerequisite:** Changelog 074 (API route guards, role hierarchy, rate limiting).

## Why

Changelog 074 secured API routes, but three enforcement layers remained binary (ventas vs non-ventas):

1. **Middleware** treated all non-ventas roles identically — a `financiero` user got the same full page access as `master`
2. **NavBar** showed the same links to all non-ventas roles, including admin-only links like "Roles" that would 403 on click
3. **RLS policies** allowed any authenticated user to SELECT all rows from reservation tables — no database-level ventas ownership enforcement

These were identified as GAP-04 (inactive roles have uncontrolled access) and GAP-05 (no DB-level ownership enforcement) in `docs/roles-gap-analysis.md`.

## What Changed

### 1. Middleware: Explicit 5-Category Role Routing (`middleware.ts`)

Replaced the binary `role === "ventas"` / else split with explicit role handling:

| Category | Roles | Page Access |
|----------|-------|-------------|
| ventas | `ventas` | `/reservar`, `/ventas/*`, `/disponibilidad`, `/cotizador`, `/auth/*` (unchanged) |
| Admin | `master`, `torredecontrol` | Full page access (unchanged) |
| Data viewers | `gerencia`, `financiero`, `contabilidad` | Analytics pages only; blocked from `/admin/*`, `/referidos`, `/valorizacion`, `/cesion`, `/buyer-persona`, `/integracion` |
| Unknown/null | Any unrecognized role | Redirect → `/login` |
| Unauthenticated | — | Redirect → `/login` (unchanged) |

Login redirect is now role-specific: ventas → `/ventas/dashboard`, admin/data roles → `/`.

### 2. NavBar: Role-Filtered Links (`src/components/nav-bar.tsx`)

Each non-ventas link is now tagged with a `roles` array specifying which roles can see it:

- Admin-only links (Reservas, Integracion, Referidos, etc.) → `roles: ["master", "torredecontrol"]`
- Roles page → `roles: ["master"]` (fixes DISC-04 — torredecontrol no longer sees a link that 403s)
- Data viewer links (Dashboard, Projects, etc.) → visible to all non-ventas roles
- Orphaned dividers automatically cleaned up after filtering

### 3. Ownership-Scoped RLS Policies (Migration 040)

**Migration file:** `scripts/migrations/040_ventas_ownership_rls.sql`
**Deployed via:** Management API

Created a reusable `jwt_role()` SQL helper function and CASE-based SELECT policies on 4 tables:

| Table | Policy Name | Ventas Behavior | Non-Ventas |
|-------|-------------|-----------------|------------|
| `reservations` | Role-scoped read reservations | Own `salesperson_id` only | All rows |
| `rv_clients` | Role-scoped read rv_clients | Clients linked through own reservations | All rows |
| `reservation_clients` | Role-scoped read reservation_clients | Junction rows for own reservations | All rows |
| `receipt_extractions` | Role-scoped read receipt_extractions | Extractions for own reservations | All rows |

Old broad SELECT policies dropped:
- "Authenticated users read reservations/rv_clients/reservation_clients/extractions"

**Bonus:** INSERT policies tightened on `reservations` and `reservation_clients` from `TO public` (anyone including anonymous) to `TO authenticated`.

## What Did NOT Change

- **API routes** — no changes (already secured in changelog 074)
- **Frontend/client code** — zero client-side changes beyond NavBar
- **Inactive salesperson check** — `requireSalesperson()` already checks `is_active` (line 61)
- **DISC-01** (system_settings.updated_by) — already populated at line 39 of settings route (false finding)

## Files Modified

| File | Change |
|------|--------|
| `middleware.ts` | Explicit 5-category role routing |
| `src/components/nav-bar.tsx` | Role-filtered links with `roles` array tagging |
| `scripts/migrations/040_ventas_ownership_rls.sql` | **New file** — `jwt_role()` + 4 ownership policies + 2 INSERT tightening |

## Discovered Issues Resolved

- **DISC-01:** `system_settings.updated_by` never populated — false finding (already set at line 39)
- **DISC-04:** NavBar "Roles" link visible to torredecontrol — fixed (tagged `roles: ["master"]`)

## Verification

- `next build` passes clean
- Migration 040 deployed and verified via `pg_policies` query
- All Phase 1 go-live security blockers resolved

## Design Documents

- Plan: `docs/plan-fix-high-severity-gaps.md` (Phase 1 marked ✅)
- Gap analysis: `docs/roles-gap-analysis.md` (GAP-04, GAP-05 marked resolved)
- Current state: `docs/roles-current-state.md` (sections 2, 4, 6, 7 updated)
