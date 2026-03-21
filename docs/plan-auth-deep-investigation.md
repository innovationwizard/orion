# Deep Investigation: Ventas Users See Admin Dashboard

## Problem Statement

Two ventas (salesperson) users are experiencing critical auth failures:

1. **Erwin Cardona** (`erwin.cardona@puertaabierta.com.gt`, created 2026-03-13):
   - Sees the **full admin dashboard** at `/` with NavBar showing VENTAS_LINKS
   - "No autorizado" banner appears BUT dashboard layout (filters, tabs, KPIs) still renders underneath
   - `app_metadata`: has `role: "ventas"` but **NO `password_set`** (created before bulletproof auth on March 17)

2. **Antonio Rada** (`antonio.rada@puertaabierta.com.gt`, created 2026-03-20):
   - Types `/login` in address bar → **redirected to `/` (admin dashboard)** instead of `/ventas/dashboard`
   - Network tab: `payment-compliance` → 403, `commissions` → 403, `cash-flow-forecast` → 403
   - `app_metadata`: has `role: "ventas"` AND `password_set: true`

Both users see admin pages they should never reach.

---

## Root Causes Identified (5 compounding failures)

### FAILURE 1: Login page redirects ALL authenticated users to `/` (CRITICAL)

**File:** `src/app/login/page.tsx` line 29-30

```typescript
if (user) {
  redirect("/");  // ← ALWAYS "/", ignores role
}
```

The login page is a **Server Component** that runs AFTER middleware. If middleware doesn't redirect (e.g., because it returned `response` for an edge case), this server-side `redirect("/")` fires and sends ANY authenticated user — including ventas — to the admin dashboard.

**When this fires:** When middleware's `getUser()` returns a user with `role = null` or an unrecognized role, middleware line 97-98 returns `response` (stays on login page). Then the login page's own `getUser()` succeeds and blindly redirects to `/`.

### FAILURE 2: `router.replace("/")` in login-form.tsx and set-password/page.tsx

**Files:**
- `src/app/login/login-form.tsx` line 49: `router.replace("/")`
- `src/app/auth/set-password/page.tsx` line 44: `router.replace("/")`

Both always navigate to `/` after authentication, relying on middleware to redirect ventas users to `/ventas/dashboard` on the NEXT server interaction. This creates a race where the `/` page may render briefly (or fully) before middleware intercepts.

### FAILURE 3: `/auth/confirm` always redirects to `/auth/set-password`

**File:** `src/app/auth/confirm/route.ts` line 53

```typescript
redirectUrl.pathname = "/auth/set-password";
```

For `type=magiclink` (re-invite of existing user with a password), the user is forced to set a password AGAIN. This is unnecessary and creates a broken flow for returning users.

### FAILURE 4: Root page `/` has NO server-side auth guard

**File:** `src/app/page.tsx`

```typescript
export default function DashboardPage() {
  return (
    <Suspense fallback={...}>
      <DashboardClient />  // No auth check — renders for ANY user
    </Suspense>
  );
}
```

No `requireRole()`, no `redirect()`, no server-side validation. The ONLY defense is middleware — if middleware fails to redirect, the full admin dashboard shell renders. The "No autorizado" banner from API 403s is cosmetic; the page layout (NavBar, filters, tabs, KPI cards) is fully visible.

### FAILURE 5: Missing `password_set` for pre-bulletproof-auth users

**Affected users:** Any salesperson account created before 2026-03-17 (when `confirm-password-set` was deployed).

Erwin was created March 13. His `app_metadata` has `role: "ventas"` but NO `password_set`. The middleware's password gate (line 104-108) will:
- Keep redirecting to `/auth/set-password` on every request
- Force re-set even if the user already has a password
- Create a frustrating loop for returning users

---

## Attack Flow (How Erwin Sees the Admin Dashboard)

```
1. Erwin clicks magiclink → /auth/confirm?type=magiclink
2. Server verifies OTP, creates session, redirects to /auth/set-password
3. Erwin lands on /auth/set-password (middleware allows: isSetPassword=true)
4. Erwin sets password → confirm-password-set → router.replace("/")
5. Client navigates to "/"
6. Middleware runs on "/":
   - role = "ventas" ✓
   - passwordSet = TRUE (just confirmed) ✓
   - "/" not in allowedPrefixes → redirect to /ventas/dashboard
7. BUT: Before redirect response arrives, React may render the "/" page
   from client-side cache/optimistic rendering
8. User sees admin dashboard briefly (or permanently if redirect fails)
```

Alternative path (Antonio's case):
```
1. Antonio navigates to /login
2. Middleware: getUser() returns user with role (may be stale/null in JWT)
   → If role detected correctly: redirect to /ventas/dashboard
   → If role is null/stale: return response (stay on login)
3. Login page server component: getUser() → user exists → redirect("/")
4. User lands on "/" (admin dashboard) — WRONG DESTINATION
```

---

## Fix Plan (6 changes, 4 files)

### Fix 1: Login page — role-aware redirect (CRITICAL)

**File:** `src/app/login/page.tsx`

Replace blind `redirect("/")` with role-aware redirect:

```typescript
if (user) {
  const role = user.app_metadata?.role as string | undefined;
  if (role === "ventas") {
    redirect("/ventas/dashboard");
  } else {
    redirect("/");
  }
}
```

### Fix 2: Login form — role-aware client navigation

**File:** `src/app/login/login-form.tsx`

After `signInWithPassword`, get the user's role and navigate accordingly:

```typescript
const { data: { user } } = await supabaseBrowser.auth.getUser();
const role = user?.app_metadata?.role;
if (role === "ventas") {
  window.location.href = "/ventas/dashboard";
} else {
  window.location.href = "/";
}
```

Use `window.location.href` (hard navigation) instead of `router.replace()` to guarantee middleware runs on a fresh server request.

### Fix 3: Set-password page — role-aware redirect + hard navigation

**File:** `src/app/auth/set-password/page.tsx`

After setting password, navigate to role-appropriate URL with hard navigation:

```typescript
await fetch("/api/auth/confirm-password-set", { method: "POST" });

const { data: { user } } = await supabaseBrowser.auth.getUser();
const role = user?.app_metadata?.role;
if (role === "ventas") {
  window.location.href = "/ventas/dashboard";
} else {
  window.location.href = "/";
}
```

### Fix 4: Root page — server-side auth guard (defense in depth)

**File:** `src/app/page.tsx`

Add server-side role check before rendering:

```typescript
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

const DATA_VIEWER_ROLES = ["master", "torredecontrol", "gerencia", "financiero", "contabilidad"];

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const supabase = createServerClient(url, key, {
    cookies: { get: (name) => cookieStore.get(name)?.value, set: () => {}, remove: () => {} }
  });
  const { data } = await supabase.auth.getUser();

  if (!data.user) redirect("/login");

  const role = data.user.app_metadata?.role as string | undefined;
  if (role === "ventas") redirect("/ventas/dashboard");
  if (!role || !DATA_VIEWER_ROLES.includes(role)) redirect("/login");

  return (
    <Suspense fallback={...}>
      <DashboardClient />
    </Suspense>
  );
}
```

### Fix 5: `/auth/confirm` — conditional redirect based on `password_set`

**File:** `src/app/auth/confirm/route.ts`

After OTP verification, check if user already has `password_set`. If yes, redirect to role-appropriate home (not `/auth/set-password`):

```typescript
const { error, data: otpData } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });

if (error) { /* existing error handling */ }

// If user already has password_set, skip set-password and go to home
const user = otpData?.user;
const hasPassword = user?.app_metadata?.password_set === true ||
                    user?.user_metadata?.password_set === true;

if (hasPassword) {
  const role = user?.app_metadata?.role as string | undefined;
  const homeUrl = request.nextUrl.clone();
  homeUrl.pathname = role === "ventas" ? "/ventas/dashboard" : "/";
  homeUrl.searchParams.delete("token_hash");
  homeUrl.searchParams.delete("type");
  const homeResponse = NextResponse.redirect(homeUrl);
  // Copy cookies from OTP verification
  for (const cookie of response.cookies.getAll()) {
    homeResponse.cookies.set(cookie);
  }
  return homeResponse;
}

return response; // existing: redirect to /auth/set-password
```

### Fix 6: Backfill `password_set` for pre-bulletproof-auth users

**SQL** (run in Supabase):

```sql
-- Backfill password_set for ventas users who have a confirmed account
-- but were created before the bulletproof auth deployment (2026-03-17)
UPDATE auth.users
SET raw_app_meta_data = raw_app_meta_data || '{"password_set": true}'::jsonb
WHERE id IN (
  SELECT s.user_id
  FROM salespeople s
  JOIN auth.users u ON u.id = s.user_id
  WHERE u.confirmed_at IS NOT NULL
    AND u.raw_app_meta_data->>'role' = 'ventas'
    AND (u.raw_app_meta_data->>'password_set') IS NULL
);
```

This ensures existing confirmed ventas users don't get trapped in the set-password loop.

---

## Files Modified

| File | Change | Priority |
|------|--------|----------|
| `src/app/login/page.tsx` | Role-aware server redirect | CRITICAL |
| `src/app/login/login-form.tsx` | Role-aware hard navigation after login | CRITICAL |
| `src/app/auth/set-password/page.tsx` | Role-aware hard navigation after password set | CRITICAL |
| `src/app/page.tsx` | Server-side auth guard (defense in depth) | HIGH |
| `src/app/auth/confirm/route.ts` | Conditional redirect based on password_set | HIGH |
| SQL (Supabase) | Backfill password_set for existing users | HIGH |

---

## Verification

1. `npx next build` — must pass with zero errors
2. Test as ventas user:
   - Navigate to `/login` → after login, lands on `/ventas/dashboard` (NOT `/`)
   - Navigate to `/` directly → redirected to `/ventas/dashboard`
   - Click magiclink with existing password → lands on `/ventas/dashboard` (NOT `/auth/set-password`)
3. Test as admin (master/torredecontrol):
   - Navigate to `/login` → after login, lands on `/`
   - All dashboard data loads normally
4. Test unauthenticated:
   - Navigate to `/` → redirected to `/login`
   - Navigate to `/disponibilidad` → page loads (public)
5. Verify Erwin's `password_set` backfilled in Supabase after SQL execution

---

## Resolution — ✅ ALL 6 FIXES IMPLEMENTED (2026-03-20)

### Previous Situation

Two ventas users reported critical auth failures that had persisted for over a week:

- **Erwin Cardona** (created 2026-03-13, pre-bulletproof-auth) clicked his magiclink and landed on the full admin dashboard. The "No autorizado" banner appeared from API 403s, but the entire dashboard shell (NavBar, filters, tabs, KPI cards) was visible. Root cause: 5 compounding failures in the auth flow — blind `redirect("/")` in login page, `router.replace("/")` race conditions in login-form and set-password, no server-side auth guard on the root page, missing `password_set` for pre-March-17 users, and `/auth/confirm` always forcing password re-set even for magiclink re-invites.

- **Antonio Rada** (created 2026-03-20, post-bulletproof-auth) typed `/login` in his address bar and was redirected to `/` (the admin dashboard) instead of `/ventas/dashboard`. Network tab confirmed: document request loaded `/` with analytics query params, then API calls to `payment-compliance`, `commissions`, `cash-flow-forecast` all returned 403. Root cause: the login page's Server Component ran `redirect("/")` after middleware allowed the request through.

### What Changed (5 code fixes + 1 SQL backfill)

**Fix 1 — `src/app/login/page.tsx` (CRITICAL):**
- **Before:** `if (user) { redirect("/"); }` — blindly sent ALL authenticated users to admin dashboard
- **After:** Role-aware redirect — `role === "ventas"` → `/ventas/dashboard`, others → `/`

**Fix 2 — `src/app/login/login-form.tsx` (CRITICAL):**
- **Before:** `router.replace("/"); router.refresh();` — soft client-side navigation with race condition
- **After:** `window.location.href` to role-appropriate URL after `getUser()`. Removed `useRouter` import.

**Fix 3 — `src/app/auth/set-password/page.tsx` (CRITICAL):**
- **Before:** Same `router.replace("/")` race condition
- **After:** Same `window.location.href` with role-aware destination. Removed `useRouter` import.

**Fix 4 — `src/app/page.tsx` (HIGH — defense in depth):**
- **Before:** Static component, no auth check — rendered for ANY user
- **After:** Async Server Component: no user → `/login`, ventas → `/ventas/dashboard`, unknown role → `/login`, only `DATA_VIEWER_ROLES` renders dashboard. Page changed from `○` (static) to `ƒ` (dynamic).

**Fix 5 — `src/app/auth/confirm/route.ts` (HIGH):**
- **Before:** Always redirected to `/auth/set-password` after OTP verification
- **After:** Checks `password_set` in `app_metadata`/`user_metadata`. If set, skips set-password and redirects to role-appropriate home. Copies cookies from OTP response.

**Fix 6 — SQL backfill (HIGH):**
- Executed in Supabase: backfilled `password_set: true` for confirmed ventas users missing it. Result: "Success. No rows returned."

### Design Reasoning

1. **`window.location.href` over `router.replace()`:** Hard navigation guarantees a full HTTP request where middleware runs first. No React cache, no race condition. Acceptable trade-off for login flows (once per session).

2. **Server-side auth guard on `page.tsx`:** Defense-in-depth. If a future middleware regression allows ventas through, the page-level guard catches it.

3. **`password_set` check in both `app_metadata` and `user_metadata`:** Belt-and-suspenders for users who set passwords before vs after `confirm-password-set` route deployment.

### Relationship to Bulletproof Auth (March 17)

| Bulletproof Auth (March 17) | This Fix (March 20) |
|----------------------------|---------------------|
| Fixed: Supabase hash auto-consumption race | Fixed: `redirect("/")` ignores role |
| Fixed: Role in `user_metadata` → moved to `app_metadata` | Fixed: `router.replace("/")` race condition |
| Fixed: `/auth/callback` dead complexity | Fixed: `/auth/confirm` always forces password re-set |
| Added: Server-side OTP via `/auth/confirm` | Fixed: `/page.tsx` has no auth guard |
| Added: `password_set` in `app_metadata` | Fixed: Missing `password_set` for pre-March-17 users |
| Added: Middleware as sole routing enforcer | Added: Page-level defense-in-depth on root page |

The bulletproof auth plan addressed the *token verification* layer. This fix addresses the *post-authentication redirect* layer — what happens AFTER the user has a valid session but needs to land on the correct page for their role.

### Build Verification

- `npx next build` — zero errors, 71 routes compiled
- Root page `/` now `ƒ` (dynamic) — reads cookies for auth guard
- SQL backfill executed successfully
- Deployment: pending push to main → Vercel auto-deploy


---

## ADDENDUM 2026-03-20: BLT Torre B — Authoritative Correction

**Source:** Jorge (project owner), direct confirmation.
**Cross-reference:** `docs/creditos-33-units-investigation.md` (UPDATE 2026-03-20)

During the Créditos dashboard backfill investigation, 24 BLT Torre B units were flagged with credit data but no reservations. The "INFO PARA REPORTES" Excel sheet listed 58 rows of client data, suggesting 58 hidden sales. Upon authoritative review:

1. **As of 2026-03-20, only 3 confirmed sales exist in Bosque Las Tapias — Torre B.** The 58 rows in "INFO PARA REPORTES" do NOT represent real sales. The confirmed count on that date is **3** (point-in-time figure, not a fixed ceiling).
2. **All existing BLT Torre B sales records will be dropped from the production database** to establish a clean baseline.
3. **Only the 3 confirmed sales (as of 2026-03-20) will be uploaded** as the sole BLT Torre B transactions. This is a point-in-time count — new sales will flow through the normal Orion reservation process.

Any prior references in this document to BLT Torre B having 11 hidden reservations (Category C), 13 orphan income markers (Category D), or 58 clients missing from the DB are **superseded** by this correction (2026-03-20).