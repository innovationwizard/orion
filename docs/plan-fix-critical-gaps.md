# Plan: Fix the 3 Critical Security Gaps

**Date:** 2026-03-19
**Reference:** `docs/roles-gap-analysis.md` — GAP-01, GAP-02, GAP-06
**Status:** ✅ COMPLETED (2026-03-19, changelog 074)

## Context

The gap analysis identified 3 critical gaps in the Orion role system. These must be fixed **before the 32-salesperson go-live** — once salespeople have accounts, any authenticated user can bypass middleware UI restrictions and call API routes directly.

**Critical Gaps:**
- **GAP-01:** 20+ API routes use only `requireAuth()` or no auth at all — ventas users can access all commission, payment, sales, and analytics data via direct API calls
- **GAP-02:** OCR endpoints (`/api/reservas/ocr`, `/api/reservas/dpi-ocr`) are fully public — anyone can consume Claude API credits without authentication or rate limiting
- **GAP-06:** No role hierarchy — roles are flat, requiring manual enumeration of role lists in every `requireRole()` call; activating new roles requires editing every route

**Bonus findings during exploration — 4 unguarded admin mutation routes:**
- `PATCH /api/reservas/admin/reservations/[id]/confirm` — **zero auth**, calls `confirm_reservation` RPC
- `PATCH /api/reservas/admin/reservations/[id]/reject` — **zero auth**, calls `reject_reservation` RPC
- `PATCH /api/reservas/admin/reservations/[id]/desist` — **zero auth**, calls `desist_reservation` RPC
- `PATCH /api/reservas/admin/freeze-requests/[id]/release` — **zero auth**, calls `release_freeze` RPC

These are arguably worse than GAP-01 — **anyone can confirm, reject, or desist a reservation** by calling the API directly.

**Key architectural fact:** Middleware does NOT intercept API routes (matcher excludes `api`). All API protection must come from the route handler itself.

---

## Step 1: Role Hierarchy Utility (GAP-06)

**Why first:** Creates the foundation that Steps 2 and 3 depend on. Instead of hardcoding `["master", "torredecontrol"]` in 30+ routes, we define the hierarchy once.

### File: `src/lib/auth.ts`

**Add role group constants and a hierarchy helper:**

```typescript
// Numeric levels: higher = more access. Roles at the same level are peers.
const ROLE_LEVEL: Record<Role, number> = {
  ventas: 10,
  inventario: 20,
  contabilidad: 30,
  financiero: 40,
  gerencia: 50,
  torredecontrol: 60,
  master: 70,
};

/** Admin roles that can manage reservations and operational data. */
export const ADMIN_ROLES: Role[] = ["master", "torredecontrol"];

/** Roles that can view all analytics/financial data (admin + future finance roles). */
export const DATA_VIEWER_ROLES: Role[] = ["master", "torredecontrol", "gerencia", "financiero", "contabilidad"];

/** Check if user's role is at or above the required minimum level. */
export function hasMinimumRole(user: User | null, minimumRole: Role): boolean {
  const role = getUserRole(user);
  if (!role) return false;
  return (ROLE_LEVEL[role as Role] ?? 0) >= ROLE_LEVEL[minimumRole];
}
```

**Existing `requireRole()` stays unchanged** — its signature is already correct. The new constants reduce duplication.

**No changes to middleware or NavBar** — this step is API-level only.

---

## Step 2: Secure All API Routes (GAP-01 + bonus unguarded routes)

### Group A: Unguarded Admin Mutation Routes → `requireRole(ADMIN_ROLES)`

These routes under `/api/reservas/admin/` currently have **ZERO auth** and allow anyone to confirm/reject/desist reservations:

| File | Method |
|------|--------|
| `src/app/api/reservas/admin/reservations/[id]/confirm/route.ts` | PATCH |
| `src/app/api/reservas/admin/reservations/[id]/reject/route.ts` | PATCH |
| `src/app/api/reservas/admin/reservations/[id]/desist/route.ts` | PATCH |
| `src/app/api/reservas/admin/freeze-requests/[id]/release/route.ts` | PATCH |

**Change:** Add 2 lines at the top of each handler:
```typescript
const auth = await requireRole(ADMIN_ROLES);
if (auth.response) return auth.response;
```

### Group B: Analytics/Financial Routes → `requireRole(DATA_VIEWER_ROLES)`

Currently `requireAuth()` only — any authenticated user (including ventas) can access all commission and payment data:

| File | Method |
|------|--------|
| `src/app/api/analytics/commissions/route.ts` | GET |
| `src/app/api/analytics/payments/route.ts` | GET |
| `src/app/api/analytics/payment-compliance/route.ts` | GET |
| `src/app/api/analytics/cash-flow-forecast/route.ts` | GET |
| `src/app/api/commissions/route.ts` | GET |
| `src/app/api/commission-rates/route.ts` | GET |
| `src/app/api/commission-phases/route.ts` | GET |

**Change:** Replace `requireAuth()` with `requireRole(DATA_VIEWER_ROLES)`.

### Group C: Admin-Only Operational Routes → `requireRole(ADMIN_ROLES)`

Currently no auth or `requireAuth()` only — expose write access to business data:

| File | Method | Notes |
|------|--------|-------|
| `src/app/api/sales/route.ts` | POST, PATCH | Keep GET as `DATA_VIEWER_ROLES` |
| `src/app/api/payments/route.ts` | POST | Keep GET as `DATA_VIEWER_ROLES` |
| `src/app/api/projects/route.ts` | POST, PATCH, DELETE | Keep GET as `DATA_VIEWER_ROLES` |
| `src/app/api/reservas/referidos/route.ts` | GET, POST | Currently **zero auth** |
| `src/app/api/reservas/referidos/[id]/route.ts` | PATCH, DELETE | Currently **zero auth** |
| `src/app/api/reservas/valorizacion/route.ts` | GET, POST | Currently **zero auth** |
| `src/app/api/reservas/valorizacion/[id]/route.ts` | PATCH, DELETE | Currently **zero auth** |
| `src/app/api/reservas/cesion/route.ts` | GET | Currently **zero auth** |
| `src/app/api/reservas/buyer-persona/route.ts` | GET | Currently **zero auth** |
| `src/app/api/reservas/buyer-persona/[client_id]/route.ts` | GET, PUT | Currently **zero auth** |
| `src/app/api/reservas/integracion/route.ts` | GET | Currently **zero auth** |

### Group D: Reference Data Routes → `requireAuth()`

Currently no auth but serve reference data needed by the reservation form (which already requires login):

| File | Method |
|------|--------|
| `src/app/api/reservas/units/route.ts` | GET |
| `src/app/api/reservas/salespeople/route.ts` | GET |
| `src/app/api/reservas/projects/route.ts` | GET |
| `src/app/api/reservas/reservations/route.ts` | GET |
| `src/app/api/reservas/freeze-requests/route.ts` | POST |
| `src/app/api/reservas/ventas/route.ts` | GET |

### Group E: Already Correct — No Changes

| File | Current Auth | Reason |
|------|-------------|--------|
| `src/app/api/me/route.ts` | `requireAuth()` | Self-info |
| `src/app/api/auth/session/route.ts` | `requireAuth()` | Session info |
| `src/app/api/auth/confirm-password-set/route.ts` | `requireAuth()` | Self-action |
| `src/app/api/reservas/me/route.ts` | Custom dual check | Already correct |
| `src/app/api/reservas/reservations/route.ts` POST | `requireSalesperson()` + admin fallback | Already correct |
| `src/app/api/reservas/ventas/reservations/route.ts` | `requireSalesperson()` | Already correct |
| `src/app/api/reservas/ventas/clients/route.ts` | `requireSalesperson()` | Already correct |
| All `/api/admin/salespeople/*` routes | `requireRole(["master", "torredecontrol"])` | Already correct |
| All `/api/admin/management-roles/*` routes | `requireRole(["master"])` | Already correct |
| All dual-auth document routes (PCV, cartas) | Admin + salesperson ownership | Already correct |

---

## Step 3: Secure OCR Endpoints (GAP-02)

### 3a. Add Authentication

Both OCR routes are called from `/reservar`, which requires login. Adding `requireAuth()` is safe.

**Files:**
- `src/app/api/reservas/ocr/route.ts`
- `src/app/api/reservas/dpi-ocr/route.ts`

**Change:** Add at the top of `POST` handler:
```typescript
const auth = await requireAuth();
if (auth.response) return auth.response;
```

### 3b. Add In-Memory Rate Limiting

**No new dependency.** Simple in-memory Map with sliding window per user. On Vercel serverless, each cold start gets its own Map — sufficient for preventing bulk abuse.

**New file: `src/lib/rate-limit.ts`**

```typescript
const store = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, resetAt: now + windowMs };
  }

  entry.count++;
  if (entry.count > limit) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  return { allowed: true, remaining: limit - entry.count, resetAt: entry.resetAt };
}
```

**Usage in OCR routes (after `requireAuth()`):**
```typescript
const rl = rateLimit(`ocr:${auth.user.id}`, 20, 60 * 60 * 1000); // 20/hour/user
if (!rl.allowed) {
  return jsonError(429, "Demasiadas solicitudes. Intente de nuevo más tarde.");
}
```

**20 per hour per user:** A salesperson won't exceed this during normal reservation flow; an attacker would be throttled.

---

## File Change Summary

| # | File | Action | Est. Lines |
|---|------|--------|------------|
| 1 | `src/lib/auth.ts` | Add `ADMIN_ROLES`, `DATA_VIEWER_ROLES`, `hasMinimumRole()` | +20 |
| 2 | `src/lib/rate-limit.ts` | **New file** — in-memory rate limiter | +20 |
| 3-6 | 4 unguarded admin mutation routes | Add `requireRole(ADMIN_ROLES)` | +3 each |
| 7-13 | 7 analytics/financial routes | `requireAuth()` → `requireRole(DATA_VIEWER_ROLES)` | +2 each |
| 14-24 | 11 admin operational routes | Add `requireRole(ADMIN_ROLES)` | +3 each |
| 25-30 | 6 reference data routes | Add `requireAuth()` | +3 each |
| 31-32 | 2 OCR routes | Add `requireAuth()` + rate limiting | +8 each |

**Total: 32 files modified, 1 new file, ~130 lines added.**

---

## Verification

1. **Build:** `npx next build` — all imports and types must compile clean
2. **Auth smoke tests:**
   - Unauthenticated → all protected routes return 401
   - Ventas user → admin/analytics routes return 403, own data routes return 200
   - Admin user → all routes return 200
3. **Rate limit test:** OCR endpoint → 21st request in same hour returns 429
4. **Regression:** `/reservar` form flow (reservation + receipt OCR + DPI OCR) must work for logged-in ventas users
5. **No UI changes** — all changes are API-level; NavBar, middleware, and pages untouched

---

## What This Does NOT Change

- **Middleware** — unchanged (correctly routes ventas vs non-ventas)
- **NavBar** — unchanged (binary ventas/admin split)
- **RLS policies** — no database changes
- **Inactive roles** — gerencia/financiero/contabilidad/inventario now have correct implicit behavior: they pass `DATA_VIEWER_ROLES` for analytics, fail `ADMIN_ROLES` for mutations
- **Client-side code** — zero frontend changes

---

## Post-Completion Discovery: Post-Auth Redirect Failures (2026-03-20)

### Context

After this plan was completed (changelog 074), the API layer was fully secured. However, production testing with two ventas users (Erwin Cardona and Antonio Rada) revealed **5 compounding failures in the post-authentication redirect layer** — the code that runs AFTER a user has a valid session but needs to land on the correct page.

These failures were NOT API-level security gaps (those were fixed here). They were **UX/routing failures** in the authentication flow itself:

1. **`src/app/login/page.tsx`** — `redirect("/")` sent all authenticated users to admin dashboard regardless of role
2. **`src/app/login/login-form.tsx`** + **`src/app/auth/set-password/page.tsx`** — `router.replace("/")` created client-side race conditions (React rendered admin dashboard before middleware redirect arrived)
3. **`src/app/auth/confirm/route.ts`** — Always redirected to `/auth/set-password` even for magiclink re-invites where user already had `password_set`
4. **`src/app/page.tsx`** — Root dashboard had NO server-side auth guard (sole defense was middleware)
5. **Missing `password_set`** — Pre-March-17 users trapped in set-password loops

### Relationship to This Plan

This plan secured the **API layer** (Layer 3). The post-auth redirect fixes secured the **page layer** (Layer 2) and **login flow**. Together, they complete 5-layer defense-in-depth:

```
Layer 1: Middleware (request-level routing)           ← already existed
Layer 2: Page auth guards (server-side redirects)     ← added 2026-03-20
Layer 3: API route guards (requireRole)               ← this plan (2026-03-19)
Layer 4: RLS (database-level)                         ← migration 040
Layer 5: Client-side UI filtering                     ← NavBar, readOnly
```

### Resolution

All 5 issues fixed on 2026-03-20. Full details in `docs/plan-auth-deep-investigation.md`.
