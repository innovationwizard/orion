# 078 — Permission Architecture Foundation (Phase 2)

**Date:** 2026-03-20
**Impact:** Code quality + compliance. Zero permission changes — mechanical centralization of 43 scattered authorization checks into a single source of truth.
**Gaps resolved:** GAP-07 (formal access control matrix), GAP-08 (`can()` utility), GAP-21 (SOC 2 CC6.1 document), DISC-03 (`hasMinimumRole()` evaluation).

## Why

After Phase 1 (changelogs 074–075) secured all API routes, authorization logic was scattered across 43 decision points: 15 routes used hardcoded role arrays (`["master", "torredecontrol"]`), 3 files defined duplicate copies of `ADMIN_ROLES`/`DATA_VIEWER_ROLES`, and there was no single place to answer "what can role X do?" This made it impossible to audit permissions, onboard new roles, or generate compliance documentation.

## What Changed

### New: `src/lib/permissions.ts` — Single Source of Truth

**PERMISSIONS matrix:** `Record<Resource, Partial<Record<Action, Role[]>>>` covering 22 resources, 49 permission triples, 119 role grants. Every entry is a direct transcription of existing `requireRole()` calls — zero invented permissions.

**Public API:**
- `rolesFor(resource, action)` → `Role[]` — returns the roles allowed for a given action. Used in API routes as `requireRole(rolesFor("reservations", "confirm"))`.
- `can(role, resource, action)` → `boolean` — checks if a role is allowed. For UI conditional rendering and script consumption.
- `ADMIN_ROLES` / `DATA_VIEWER_ROLES` — client-safe re-exports (auth.ts uses `next/headers` which can't be imported in client components).

**Resource types:** reservations, reservation_clients, sales, payments, commissions, commission_rates, commission_phases, projects, clients, salespeople, settings, documents, ocr, referidos, valorizacion, cesion, buyer_persona, integracion, management_roles, audit_log, creditos, analytics.

**Action types:** view, view_own, create, update, delete, confirm, reject, desist, release_freeze, confirm_rate, invite, assign_project, send_password_link.

### Migrated: 15 Routes (18 `requireRole()` Calls)

Replaced hardcoded arrays with `rolesFor()` calls:

| Route | Before | After |
|-------|--------|-------|
| `admin/salespeople` | `["master", "torredecontrol"]` | `rolesFor("salespeople", "view")` |
| `admin/salespeople/invite` | `["master", "torredecontrol"]` | `rolesFor("salespeople", "invite")` |
| `admin/salespeople/projects` | `["master", "torredecontrol"]` | `rolesFor("salespeople", "assign_project")` |
| `admin/send-password-link` | `["master", "torredecontrol"]` | `rolesFor("salespeople", "send_password_link")` |
| `admin/management-roles` GET | `["master"]` | `rolesFor("management_roles", "view")` |
| `admin/management-roles` POST | `["master"]` | `rolesFor("management_roles", "create")` |
| `admin/management-roles/[id]` | `["master"]` | `rolesFor("management_roles", "update")` |
| `reservas/admin/clients/[id]` | `["master", "torredecontrol"]` | `rolesFor("clients", "update")` |
| `reservas/admin/reservation-clients/[id]` | `["master", "torredecontrol"]` | `rolesFor("reservation_clients", "update")` |
| `reservas/admin/reservations/[id]` | `["master", "torredecontrol"]` | `rolesFor("reservations", "view")` |
| `reservas/admin/settings` GET | `["master", "torredecontrol"]` | `rolesFor("settings", "view")` |
| `reservas/admin/settings` PATCH | `["master", "torredecontrol"]` | `rolesFor("settings", "update")` |
| `reservas/admin/sales/[id]/ejecutivo-rate` | `["master", "financiero"]` | `rolesFor("sales", "confirm_rate")` |
| `reservas/admin/pcv/[id]` GET | `["master", "torredecontrol"]` | `rolesFor("documents", "view")` |
| `reservas/admin/pcv/[id]` POST | `["master", "torredecontrol"]` | `rolesFor("documents", "update")` |
| `reservas/admin/pcv/[id]` PATCH | `["master", "torredecontrol"]` | `rolesFor("documents", "update")` |
| `reservas/admin/carta-autorizacion/[id]` | `["master", "torredecontrol"]` | `rolesFor("documents", "view")` |
| `reservas/admin/carta-pago/[id]` | `["master", "torredecontrol"]` | `rolesFor("documents", "view")` |

### Eliminated: 3 Duplicate Constants

| Location | Was | Now |
|----------|-----|-----|
| `src/app/api/reservas/me/route.ts:9` | `const ADMIN_ROLES = [...] as const` | Imported from `@/lib/auth` |
| `src/app/page.tsx:10` | `const DATA_VIEWER_ROLES = [...]` | Imported from `@/lib/auth` |
| `src/components/nav-bar.tsx:9` | `const ADMIN_PAGE_ROLES = [...]` | Imported from `@/lib/permissions` |

**Middleware:** Local constants kept (Edge Runtime can't import from `src/lib/`). Added sync comment referencing `auth.ts`.

### New: `scripts/generate-access-matrix.ts`

Reads the `PERMISSIONS` object and generates `docs/access-control-matrix.md` — a formal 7-role × 49-action matrix. Satisfies SOC 2 CC6.1 and ISO 27001 A.5.15 requirements.

Run: `npx tsx scripts/generate-access-matrix.ts`

### `hasMinimumRole()` (DISC-03)

Currently unused. Added "Currently unused — retained for future UI conditional rendering" comment. No deletion — 5 lines of code, zero cost, potential future value for gerencia/financiero activation.

## Files Changed

| File | Change |
|------|--------|
| `src/lib/permissions.ts` | **New** — PERMISSIONS matrix + `can()` + `rolesFor()` |
| `scripts/generate-access-matrix.ts` | **New** — access control matrix generator |
| `docs/access-control-matrix.md` | **Generated** — formal access control matrix |
| `src/lib/auth.ts` | Added comment on `hasMinimumRole()` |
| `src/components/nav-bar.tsx` | Import from `@/lib/permissions` instead of local constant |
| `src/app/page.tsx` | Import `DATA_VIEWER_ROLES` from `@/lib/auth` |
| `src/app/api/reservas/me/route.ts` | Import `ADMIN_ROLES` from `@/lib/auth`, remove spread |
| `middleware.ts` | Added sync comment on local constants |
| 14 API route files | `requireRole([...])` → `requireRole(rolesFor(...))` |

**Total: 2 new files, 1 generated doc, 19 files modified. ~130 lines added.**

## What This Does NOT Change

- **Permissions** — zero changes to who can do what
- **Middleware** — routing logic unchanged (Edge Runtime constraint)
- **`role === "ventas"` checks** — routing decisions, not permissions
- **Dual-auth fallback logic** — ownership checks stay inline
- **RLS policies** — database-level enforcement unchanged
- **22 routes already using constants** — optional future migration

## Verification

- `npx next build` passes clean (71 routes, zero errors)
- `rolesFor("reservations", "confirm")` → `["master", "torredecontrol"]`
- `rolesFor("sales", "confirm_rate")` → `["master", "financiero"]`
- `rolesFor("management_roles", "view")` → `["master"]`
- No duplicate `ADMIN_ROLES`/`DATA_VIEWER_ROLES` outside `auth.ts`/`permissions.ts`
- `docs/access-control-matrix.md` generated with 22 resources, 49 triples, 119 grants
