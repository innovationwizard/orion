# Plan: Phase 2 — Permission Architecture Foundation

**Date:** 2026-03-20
**Status:** ✅ COMPLETED 2026-03-20 (changelog 078)
**Prerequisites:** Phase 1 (security hardening) completed 2026-03-19.
**Scope:** GAP-07, GAP-08, GAP-21, DISC-03.
**Estimated effort:** ~16 hours.
**Constraint:** This is a mechanical refactor. Every route's behavior must be IDENTICAL before and after. Zero permission changes — only centralization.

---

## Table of Contents

1. [Objective](#1-objective)
2. [Current State (Research Findings)](#2-current-state-research-findings)
3. [Step 1: Create permissions.ts](#3-step-1-create-permissionsts)
4. [Step 2: Migrate Hardcoded Routes](#4-step-2-migrate-hardcoded-routes)
5. [Step 3: Eliminate Duplicate Constants](#5-step-3-eliminate-duplicate-constants)
6. [Step 4: Evaluate hasMinimumRole()](#6-step-4-evaluate-hasminimumrole)
7. [Step 5: Generate Access Control Document](#7-step-5-generate-access-control-document)
8. [Step 6: Build Verification](#8-step-6-build-verification)
9. [What This Plan Does NOT Change](#9-what-this-plan-does-not-change)
10. [File Change Summary](#10-file-change-summary)
11. [Verification Checklist](#11-verification-checklist)

---

## 1. Objective

Create a single source of truth for all authorization decisions in Orion.

**Today:** 43 permission decision points scattered across 37 API routes, middleware, NavBar, and page guards. 15 routes use hardcoded role arrays instead of constants. 3 files define duplicate copies of `ADMIN_ROLES` or `DATA_VIEWER_ROLES`. No centralized way to answer "what can role X do?"

**After Phase 2:** One `PERMISSIONS` object in `src/lib/permissions.ts` defines every (role, resource, action) triple. Every API route references it via `rolesFor()`. An auto-generated markdown table provides an auditable access control matrix (SOC 2 CC6.1).

**Non-goal:** This phase does NOT change which roles can do what. It centralizes existing permission rules — nothing more.

---

## 2. Current State (Research Findings)

### 2.1 Permission Decision Points: 43 Total

| Category | Count | Pattern |
|----------|-------|---------|
| API `requireRole()` calls | 37 | Consistent — constants or hardcoded arrays |
| Hardcoded role arrays (not using constants) | 15 | `["master", "torredecontrol"]`, `["master"]`, `["master", "financiero"]` |
| NavBar link role filtering | 13 | Inline `roles` property on link objects |
| `role === "ventas"` string comparisons | 11 | Binary routing checks (login, middleware, NavBar) |
| Dual-auth inline checks | 2 | `hasRole()` + `isSuperuser()` fallback |

### 2.2 Duplicate Constant Definitions

| Constant | Canonical Location | Duplicated In |
|----------|-------------------|---------------|
| `ADMIN_ROLES` | `src/lib/auth.ts:63` | `src/app/api/reservas/me/route.ts:9` (redefined locally) |
| `DATA_VIEWER_ROLES` | `src/lib/auth.ts:66` | `src/app/page.tsx:10` (redefined locally) |
| `ADMIN_PAGE_ROLES` | — | `middleware.ts:87` + `src/components/nav-bar.tsx:9` (defined independently in both) |
| `DATA_PAGE_ROLES` | — | `middleware.ts:89` (local only, differs from `DATA_VIEWER_ROLES` — intentionally excludes master/torredecontrol) |

### 2.3 Routes with Hardcoded Arrays (15 routes, target for migration)

| Route | Current Array | Semantic Equivalent |
|-------|--------------|---------------------|
| `/api/admin/salespeople` | `["master", "torredecontrol"]` | `ADMIN_ROLES` |
| `/api/admin/salespeople/invite` | `["master", "torredecontrol"]` | `ADMIN_ROLES` |
| `/api/admin/salespeople/projects` | `["master", "torredecontrol"]` | `ADMIN_ROLES` |
| `/api/admin/send-password-link` | `["master", "torredecontrol"]` | `ADMIN_ROLES` |
| `/api/admin/management-roles` GET | `["master"]` | Master-only |
| `/api/admin/management-roles` POST | `["master"]` | Master-only |
| `/api/admin/management-roles/[id]` PATCH | `["master"]` | Master-only |
| `/api/reservas/admin/clients/[id]` | `["master", "torredecontrol"]` | `ADMIN_ROLES` |
| `/api/reservas/admin/pcv/[id]` GET/PATCH/DELETE | `["master", "torredecontrol"]` | `ADMIN_ROLES` |
| `/api/reservas/admin/reservation-clients/[id]` | `["master", "torredecontrol"]` | `ADMIN_ROLES` |
| `/api/reservas/admin/reservations/[id]` GET/PATCH | `["master", "torredecontrol"]` | `ADMIN_ROLES` |
| `/api/reservas/admin/settings` GET/PATCH | `["master", "torredecontrol"]` | `ADMIN_ROLES` |
| `/api/reservas/admin/sales/[id]/ejecutivo-rate` | `["master", "financiero"]` | Unique — rate confirmation |
| `/api/reservas/admin/carta-autorizacion/[id]` | `["master", "torredecontrol"]` | `ADMIN_ROLES` |
| `/api/reservas/admin/carta-pago/[id]` | `["master", "torredecontrol"]` | `ADMIN_ROLES` |

### 2.4 `role === "ventas"` Checks (11 occurrences — NOT in scope)

These are **routing decisions**, not permission checks:
- `middleware.ts` (2 checks) — page routing
- `nav-bar.tsx` (2 checks) — NavBar set selection
- `login/page.tsx` (1 check) — post-login redirect
- `login-form.tsx` (1 check) — client-side redirect
- `auth/confirm/route.ts` (1 check) — OTP redirect
- `set-password/page.tsx` (1 check) — password-set redirect
- `page.tsx` (1 check) — root page redirect

Forcing these through `can()` would be semantically misleading ("is this user allowed to see the ventas dashboard?" is not the right question — the question is "which dashboard should this user land on?"). These stay as-is.

### 2.5 Dual-Auth Routes (5 routes — minimal change)

These routes use a fallback pattern: try admin → fallback to salesperson with ownership check:
- `/api/reservas/me/route.ts`
- `/api/reservas/reservations/route.ts` (POST)
- `/api/reservas/admin/carta-autorizacion/[id]/route.ts`
- `/api/reservas/admin/carta-pago/[id]/route.ts`
- `/api/reservas/admin/pcv/[id]/route.ts` (GET only)

The dual-auth pattern is inherently route-specific logic (ownership check requires knowing the resource). These routes will import `rolesFor()` for the admin check portion, but the fallback-to-salesperson logic stays inline.

---

## 3. Step 1: Create `src/lib/permissions.ts`

**New file.** This is the single source of truth for all authorization decisions.

### 3.1 Design Decisions

**Resource granularity:** One resource per logical domain, not per API route. Example: `reservations` covers confirm/reject/desist/release_freeze — these are all actions on the same resource.

**Action naming:** Verb-based, matching what the user does. `view` for GET, `create` for POST, `update` for PATCH, `delete` for DELETE, plus domain-specific actions like `confirm`, `reject`, `desist`, `confirm_rate`.

**`view_own` convention:** Used when ventas users can see their own data but not others'. The API route still uses `requireAuth()` or `requireSalesperson()` — the `view_own` entry in the matrix is for documentation completeness, not enforcement (ownership is enforced by RLS and API query filters).

### 3.2 Permission Matrix (Derived from Actual Routes)

The matrix below is a direct transcription of the 37 `requireRole()` calls currently in the codebase. No permissions are invented or changed.

```
Resource               Action              Roles
─────────────────────  ──────────────────  ──────────────────────────────
reservations           view                ADMIN_ROLES
reservations           view_own            ventas (via requireSalesperson)
reservations           create              authenticated (ventas + admin fallback)
reservations           confirm             ADMIN_ROLES
reservations           reject              ADMIN_ROLES
reservations           desist              ADMIN_ROLES
reservations           release_freeze      ADMIN_ROLES
reservations           update              ADMIN_ROLES
reservation_clients    update              ADMIN_ROLES
sales                  view                DATA_VIEWER_ROLES
sales                  create              ADMIN_ROLES
sales                  update              ADMIN_ROLES
sales                  confirm_rate        master, financiero
payments               view                DATA_VIEWER_ROLES
payments               create              ADMIN_ROLES
commissions            view                DATA_VIEWER_ROLES
commission_rates       view                DATA_VIEWER_ROLES
commission_phases      view                DATA_VIEWER_ROLES
projects               view                DATA_VIEWER_ROLES
projects               create              ADMIN_ROLES
projects               update              ADMIN_ROLES
projects               delete              ADMIN_ROLES
clients                view                ADMIN_ROLES
clients                view_own            ventas (via requireSalesperson)
clients                update              ADMIN_ROLES
salespeople            view                ADMIN_ROLES
salespeople            invite              ADMIN_ROLES
salespeople            assign_project      ADMIN_ROLES
salespeople            send_password_link  ADMIN_ROLES
settings               view                ADMIN_ROLES
settings               update              ADMIN_ROLES
documents              view                ADMIN_ROLES (+ ventas own via dual-auth)
documents              view_own            ventas (via requireSalesperson + ownership)
documents              update              ADMIN_ROLES
documents              delete              ADMIN_ROLES
ocr                    create              authenticated (rate limited)
referidos              view                ADMIN_ROLES
referidos              create              ADMIN_ROLES
referidos              update              ADMIN_ROLES
referidos              delete              ADMIN_ROLES
valorizacion           view                ADMIN_ROLES
valorizacion           create              ADMIN_ROLES
valorizacion           update              ADMIN_ROLES
valorizacion           delete              ADMIN_ROLES
cesion                 view                ADMIN_ROLES
buyer_persona          view                ADMIN_ROLES
buyer_persona          update              ADMIN_ROLES
integracion            view                ADMIN_ROLES
management_roles       view                master
management_roles       create              master
management_roles       update              master
audit_log              view                ADMIN_ROLES
creditos               view                DATA_VIEWER_ROLES
analytics              view                DATA_VIEWER_ROLES
```

### 3.3 API Surface

```typescript
// Types
export type Resource = "reservations" | "reservation_clients" | "sales" | "payments"
  | "commissions" | "commission_rates" | "commission_phases" | "projects"
  | "clients" | "salespeople" | "settings" | "documents" | "ocr"
  | "referidos" | "valorizacion" | "cesion" | "buyer_persona"
  | "integracion" | "management_roles" | "audit_log" | "creditos" | "analytics";

export type Action = "view" | "view_own" | "create" | "update" | "delete"
  | "confirm" | "reject" | "desist" | "release_freeze" | "confirm_rate"
  | "invite" | "assign_project" | "send_password_link";

// Core functions
export function can(role: Role | null | undefined, resource: Resource, action: Action): boolean;
export function rolesFor(resource: Resource, action: Action): Role[];

// Matrix (exported for script consumption)
export const PERMISSIONS: Record<Resource, Partial<Record<Action, Role[]>>>;
```

### 3.4 Key Implementation Details

1. **`can()` returns `false` for null/undefined roles** — safe for unauthenticated contexts.
2. **`rolesFor()` returns `[]` for undefined entries** — safe default (nobody has access).
3. **The `PERMISSIONS` object uses shorthand constants** defined at the top of the file (`const A = ADMIN_ROLES`, `const D = DATA_VIEWER_ROLES`, `const M: Role[] = ["master"]`, `const MF: Role[] = ["master", "financiero"]`).
4. **No runtime imports of `ADMIN_ROLES`/`DATA_VIEWER_ROLES` from auth.ts** — permissions.ts defines the arrays inline using the same values. This avoids a circular dependency (auth.ts exports `requireRole` which is used with `rolesFor` from permissions.ts). The constants in auth.ts remain for backward compatibility during incremental migration.

---

## 4. Step 2: Migrate Hardcoded Routes

### 4.1 Strategy

**Incremental, non-breaking migration.** Each route can be updated independently. The behavior is identical — `rolesFor("reservations", "confirm")` returns `["master", "torredecontrol"]`, same as `ADMIN_ROLES`.

**Pattern change per route:**

```typescript
// BEFORE (hardcoded array):
const auth = await requireRole(["master", "torredecontrol"]);

// AFTER (centralized):
import { rolesFor } from "@/lib/permissions";
const auth = await requireRole(rolesFor("reservations", "confirm"));
```

### 4.2 Migration Table (15 routes)

| # | File | Current | After |
|---|------|---------|-------|
| 1 | `src/app/api/admin/salespeople/route.ts:9` | `["master", "torredecontrol"]` | `rolesFor("salespeople", "view")` |
| 2 | `src/app/api/admin/salespeople/invite/route.ts:13` | `["master", "torredecontrol"]` | `rolesFor("salespeople", "invite")` |
| 3 | `src/app/api/admin/salespeople/projects/route.ts:16` | `["master", "torredecontrol"]` | `rolesFor("salespeople", "assign_project")` |
| 4 | `src/app/api/admin/send-password-link/route.ts:13` | `["master", "torredecontrol"]` | `rolesFor("salespeople", "send_password_link")` |
| 5 | `src/app/api/admin/management-roles/route.ts:13` (GET) | `["master"]` | `rolesFor("management_roles", "view")` |
| 6 | `src/app/api/admin/management-roles/route.ts:52` (POST) | `["master"]` | `rolesFor("management_roles", "create")` |
| 7 | `src/app/api/admin/management-roles/[id]/route.ts:16` | `["master"]` | `rolesFor("management_roles", "update")` |
| 8 | `src/app/api/reservas/admin/clients/[id]/route.ts:10` | `["master", "torredecontrol"]` | `rolesFor("clients", "update")` |
| 9 | `src/app/api/reservas/admin/reservation-clients/[id]/route.ts:17` | `["master", "torredecontrol"]` | `rolesFor("reservation_clients", "update")` |
| 10 | `src/app/api/reservas/admin/reservations/[id]/route.ts:55` | `["master", "torredecontrol"]` | `rolesFor("reservations", "view")` |
| 11 | `src/app/api/reservas/admin/settings/route.ts:9` (GET) | `["master", "torredecontrol"]` | `rolesFor("settings", "view")` |
| 12 | `src/app/api/reservas/admin/settings/route.ts:28` (PATCH) | `["master", "torredecontrol"]` | `rolesFor("settings", "update")` |
| 13 | `src/app/api/reservas/admin/sales/[id]/ejecutivo-rate/route.ts:19` | `["master", "financiero"]` | `rolesFor("sales", "confirm_rate")` |
| 14 | `src/app/api/reservas/admin/pcv/[id]/route.ts:33,132,171` | `["master", "torredecontrol"]` | `rolesFor("documents", "view")` / `rolesFor("documents", "update")` / `rolesFor("documents", "delete")` |
| 15 | `src/app/api/reservas/admin/carta-autorizacion/[id]/route.ts:21` | `["master", "torredecontrol"]` | `rolesFor("documents", "view")` |

### 4.3 Routes Already Using Constants (22 routes — optional migration)

These routes already use `ADMIN_ROLES` or `DATA_VIEWER_ROLES`. Migration to `rolesFor()` is optional and lower priority. They work correctly today — the constant just moves from `auth.ts` to `permissions.ts`.

**Decision:** Migrate these in a second pass or during other work touching these files. Not blocking for Phase 2 completion.

### 4.4 Dual-Auth Routes (5 routes — partial migration)

For the admin-check portion of dual-auth routes:

```typescript
// BEFORE:
const auth = await requireRole(["master", "torredecontrol"]);
// Fallback to requireSalesperson()...

// AFTER:
import { rolesFor } from "@/lib/permissions";
const auth = await requireRole(rolesFor("documents", "view"));
// Fallback to requireSalesperson()...
```

The fallback-to-salesperson logic is inherently route-specific (ownership check) and stays inline.

**Files:**
- `src/app/api/reservas/admin/carta-autorizacion/[id]/route.ts` — admin check → `rolesFor("documents", "view")`
- `src/app/api/reservas/admin/carta-pago/[id]/route.ts` — admin check → `rolesFor("documents", "view")`
- `src/app/api/reservas/admin/pcv/[id]/route.ts` (GET) — admin check → `rolesFor("documents", "view")`
- `src/app/api/reservas/me/route.ts` — local `ADMIN_ROLES` → import from `@/lib/auth`

---

## 5. Step 3: Eliminate Duplicate Constants

### 5.1 `src/app/api/reservas/me/route.ts`

```typescript
// BEFORE (line 9):
const ADMIN_ROLES = ["master", "torredecontrol"] as const;

// AFTER:
import { ADMIN_ROLES } from "@/lib/auth";
// Delete line 9 (local constant)
```

### 5.2 `src/app/page.tsx`

```typescript
// BEFORE (line 10):
const DATA_VIEWER_ROLES = ["master", "torredecontrol", "gerencia", "financiero", "contabilidad"];

// AFTER:
import { DATA_VIEWER_ROLES } from "@/lib/auth";
// Delete line 10 (local constant)
```

### 5.3 `middleware.ts`

Middleware cannot import from `src/lib/` (Next.js edge runtime restriction — middleware runs in Edge Runtime, cannot import arbitrary modules from `src/`). The local constants `ADMIN_PAGE_ROLES` and `DATA_PAGE_ROLES` must stay.

**However:** The middleware constants are semantically different from `ADMIN_ROLES`/`DATA_VIEWER_ROLES`:
- `ADMIN_PAGE_ROLES = ["master", "torredecontrol"]` — identical to `ADMIN_ROLES` but for page routing
- `DATA_PAGE_ROLES = ["gerencia", "financiero", "contabilidad"]` — intentionally **excludes** master/torredecontrol (they're already handled by `ADMIN_PAGE_ROLES` in the `if/else if` chain)

**Decision:** Leave middleware constants as-is. Add a comment explaining the relationship:

```typescript
// These mirror ADMIN_ROLES and DATA_VIEWER_ROLES from src/lib/auth.ts
// Defined locally because middleware runs in Edge Runtime and cannot
// import from src/lib/. Keep in sync manually.
// DATA_PAGE_ROLES excludes master/torredecontrol because those are
// handled by ADMIN_PAGE_ROLES in the if/else chain above.
const ADMIN_PAGE_ROLES = ["master", "torredecontrol"];
const DATA_PAGE_ROLES = ["gerencia", "financiero", "contabilidad"];
```

### 5.4 `src/components/nav-bar.tsx`

```typescript
// BEFORE (line 9):
const ADMIN_PAGE_ROLES = ["master", "torredecontrol"];

// AFTER:
import { ADMIN_ROLES, DATA_VIEWER_ROLES } from "@/lib/auth";
// Replace ADMIN_PAGE_ROLES with ADMIN_ROLES throughout
// Replace hardcoded DATA_VIEWER_ROLES arrays on individual links with imported constant
```

NavBar link role arrays currently use inline arrays that match `ADMIN_ROLES` or `DATA_VIEWER_ROLES`. After this change:
- Links with `roles: ADMIN_PAGE_ROLES` → `roles: ADMIN_ROLES`
- Links with `roles: ["master", "torredecontrol", "gerencia", "financiero", "contabilidad"]` → `roles: DATA_VIEWER_ROLES`
- Links with `roles: ["master"]` → `roles: ["master"]` (unchanged — unique)

---

## 6. Step 4: Evaluate `hasMinimumRole()`

**Current state:** Defined in `src/lib/auth.ts:69–73`. Zero consumers.

**Analysis:**
- `hasMinimumRole(user, "gerencia")` would return `true` for gerencia, torredecontrol, master.
- This is useful for hierarchical checks ("at least manager level").
- However, `rolesFor()` makes this unnecessary for API routes — each route's permissions are explicit.
- The only place `hasMinimumRole()` adds value is UI code that needs "show this to gerencia and above" — but the NavBar already uses explicit role arrays on links, which is more readable.

**Decision:** Keep `hasMinimumRole()` for now. It's 5 lines of code, costs nothing, and may be useful for future UI conditional rendering. Add a `// Currently unused` comment. Remove it only if still unused after Phase 4.

---

## 7. Step 5: Generate Access Control Document

### 7.1 Script: `scripts/generate-access-matrix.ts`

Reads the `PERMISSIONS` object from `src/lib/permissions.ts` and generates `docs/access-control-matrix.md`.

**Run command:** `npx tsx scripts/generate-access-matrix.ts`

**Output format:**

```markdown
# Orion Access Control Matrix
Generated: 2026-03-20 | Source: src/lib/permissions.ts

| Resource | Action | master | torredecontrol | gerencia | financiero | contabilidad | ventas |
|----------|--------|:------:|:--------------:|:--------:|:----------:|:------------:|:------:|
| reservations | view | ✓ | ✓ | | | | |
| reservations | view_own | | | | | | ✓ |
| reservations | confirm | ✓ | ✓ | | | | |
| sales | view | ✓ | ✓ | ✓ | ✓ | ✓ | |
| sales | confirm_rate | ✓ | | | ✓ | | |
| commissions | view | ✓ | ✓ | ✓ | ✓ | ✓ | |
| management_roles | view | ✓ | | | | | |
```

**Key properties:**
- Always in sync with code (generated from the same `PERMISSIONS` object).
- Satisfies SOC 2 CC6.1 (formal access control matrix).
- Satisfies ISO 27001 A.5.15 (auditable access control document).
- Review schedule: regenerate whenever roles or routes change. Add as CI step later if desired.

### 7.2 Integration

- Add to `.gitignore`? **No** — the generated document should be committed so it's visible without running the script.
- Add to CI? **Not now** — manual regeneration is sufficient. CI integration is Phase 6 polish.
- Add header comment in generated doc: "This file is auto-generated. Do not edit manually. Run `npx tsx scripts/generate-access-matrix.ts` to regenerate."

---

## 8. Step 6: Build Verification

```bash
npx next build
```

Must pass clean with zero errors. This is a mechanical refactor — no new features, no behavior changes, no new routes, no new components.

**Expected changes to build output:** None. Same routes, same static/dynamic classification.

---

## 9. What This Plan Does NOT Change

| Item | Why Not |
|------|---------|
| **Middleware routing logic** | Routing decisions, not permission checks. Edge Runtime can't import from src/lib/. |
| **`role === "ventas"` checks (11 occurrences)** | These are UX routing decisions ("where should this user go?"), not authorization checks ("is this user allowed?"). Forcing them through `can()` would be semantically misleading. |
| **NavBar link structure** | Links keep inline `roles` arrays — just import constants instead of defining locally. No structural change to how NavBar filtering works. |
| **Dual-auth fallback logic** | Ownership checks are inherently route-specific. Only the admin-check portion uses `rolesFor()`. |
| **RLS policies** | Database-level enforcement is unchanged. |
| **Audit logging** | `logAudit()` calls are unchanged. |
| **Which roles can do what** | Zero permission changes. The matrix documents what already exists. |
| **New pages or UI** | No new UI. The access control matrix is a markdown document. |

---

## 10. File Change Summary

### New Files (2)

| File | Purpose |
|------|---------|
| `src/lib/permissions.ts` | PERMISSIONS matrix + `can()` + `rolesFor()` |
| `scripts/generate-access-matrix.ts` | Script to generate access control document |

### Generated Files (1)

| File | Purpose |
|------|---------|
| `docs/access-control-matrix.md` | Auto-generated formal access control matrix |

### Modified Files (19)

| # | File | Change |
|---|------|--------|
| 1 | `src/app/api/admin/salespeople/route.ts` | `["master", "torredecontrol"]` → `rolesFor("salespeople", "view")` |
| 2 | `src/app/api/admin/salespeople/invite/route.ts` | `["master", "torredecontrol"]` → `rolesFor("salespeople", "invite")` |
| 3 | `src/app/api/admin/salespeople/projects/route.ts` | `["master", "torredecontrol"]` → `rolesFor("salespeople", "assign_project")` |
| 4 | `src/app/api/admin/send-password-link/route.ts` | `["master", "torredecontrol"]` → `rolesFor("salespeople", "send_password_link")` |
| 5 | `src/app/api/admin/management-roles/route.ts` | `["master"]` → `rolesFor("management_roles", "view")` / `"create"` |
| 6 | `src/app/api/admin/management-roles/[id]/route.ts` | `["master"]` → `rolesFor("management_roles", "update")` |
| 7 | `src/app/api/reservas/admin/clients/[id]/route.ts` | `["master", "torredecontrol"]` → `rolesFor("clients", "update")` |
| 8 | `src/app/api/reservas/admin/reservation-clients/[id]/route.ts` | `["master", "torredecontrol"]` → `rolesFor("reservation_clients", "update")` |
| 9 | `src/app/api/reservas/admin/reservations/[id]/route.ts` | `["master", "torredecontrol"]` → `rolesFor("reservations", "view")` |
| 10 | `src/app/api/reservas/admin/settings/route.ts` | `["master", "torredecontrol"]` → `rolesFor("settings", "view")` / `"update"` |
| 11 | `src/app/api/reservas/admin/sales/[id]/ejecutivo-rate/route.ts` | `["master", "financiero"]` → `rolesFor("sales", "confirm_rate")` |
| 12 | `src/app/api/reservas/admin/pcv/[id]/route.ts` | `["master", "torredecontrol"]` → `rolesFor("documents", ...)` (3 methods) |
| 13 | `src/app/api/reservas/admin/carta-autorizacion/[id]/route.ts` | `["master", "torredecontrol"]` → `rolesFor("documents", "view")` |
| 14 | `src/app/api/reservas/admin/carta-pago/[id]/route.ts` | `["master", "torredecontrol"]` → `rolesFor("documents", "view")` |
| 15 | `src/app/api/reservas/me/route.ts` | Delete local `ADMIN_ROLES`, import from `@/lib/auth` |
| 16 | `src/app/page.tsx` | Delete local `DATA_VIEWER_ROLES`, import from `@/lib/auth` |
| 17 | `src/components/nav-bar.tsx` | Import `ADMIN_ROLES`, `DATA_VIEWER_ROLES` from `@/lib/auth`; replace local `ADMIN_PAGE_ROLES` |
| 18 | `middleware.ts` | Add sync comment on local constants |
| 19 | `src/lib/auth.ts` | Add `// Currently unused` comment on `hasMinimumRole()` |

---

## 11. Verification Checklist

All verified on 2026-03-20:

- [x] `npx next build` passes with zero errors (71 routes)
- [x] `rolesFor("reservations", "confirm")` returns `["master", "torredecontrol"]` (same as `ADMIN_ROLES`)
- [x] `rolesFor("sales", "confirm_rate")` returns `["master", "financiero"]`
- [x] `rolesFor("management_roles", "view")` returns `["master"]`
- [x] `can("ventas", "reservations", "view")` returns `false`
- [x] `can("master", "reservations", "view")` returns `true`
- [x] `can(null, "reservations", "view")` returns `false`
- [x] No duplicate `ADMIN_ROLES` or `DATA_VIEWER_ROLES` definitions remain outside `auth.ts`/`permissions.ts`
- [x] `docs/access-control-matrix.md` generated and committed (22 resources, 49 triples, 119 grants)
- [x] Every permission triple in the matrix matches the current production behavior exactly

---

## Execution Order

```
Step 1: Create src/lib/permissions.ts          (GAP-07, GAP-08)
Step 2: Migrate 15 hardcoded-array routes      (GAP-08 — incremental)
Step 3: Eliminate 3 duplicate constants         (Code hygiene)
Step 4: Evaluate hasMinimumRole()              (DISC-03)
Step 5: Generate access control document        (GAP-21)
Step 6: Build verification                      (Production safety)
```

Steps 1–4 can be done in sequence (each builds on the previous).
Step 5 requires Step 1 (reads the PERMISSIONS object).
Step 6 is final gate.

**No database changes. No migrations. No new API routes. No new UI components.**

---

## Completion Notes (2026-03-20)

**Delivered:** 2 new files (`src/lib/permissions.ts`, `scripts/generate-access-matrix.ts`), 1 generated doc (`docs/access-control-matrix.md`), 19 files modified, ~130 lines added.

**Key implementation detail:** `nav-bar.tsx` is `"use client"` and cannot import from `auth.ts` (which uses `next/headers`). Client-safe `ADMIN_ROLES` and `DATA_VIEWER_ROLES` are exported from `permissions.ts` instead (no server-only imports, only `import type { Role }`).

**Changelog:** `changelog/078_2026-03-20_permission-architecture.md`
