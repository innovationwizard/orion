# 069 — Bulletproof Ventas Auth

**Date:** 2026-03-17
**Author:** Jorge Luis Contreras Herrera
**Status:** DEPLOYED to production
**Severity:** Critical — ventas users bypassed password setup and saw all admin dashboards

---

## Context

### The Problem

When torredecontrol generated invite links from the `/admin/asesores` panel, ventas salespeople were supposed to:
1. Click the link → land on `/auth/set-password`
2. Set their password → redirect to `/ventas/portal/reservas`
3. Only see ventas-allowed pages (inventory, reservations, clients, etc.)

**None of this worked.** Ventas users landed directly on the admin analytics dashboard ("/") with full access to all navigation links. The password setup gate was never hit.

### Root Cause (Architectural)

The invite flow relied on **Supabase's hosted redirect chain**, which is fundamentally broken for client-side SPAs:

```
Admin generates invite
  → Supabase sends email with link to supabase.co/auth/v1/verify
    → Supabase verifies token, redirects to /auth/callback#access_token=...
      → Supabase JS client AUTO-CONSUMES hash fragment BEFORE React mounts
        → useEffect() callback logic never executes
          → User lands on "/" with valid session, no routing enforced
```

The Supabase JS client (`@supabase/ssr`) listens for `onAuthStateChange` and processes hash fragments (`#access_token=...&refresh_token=...`) immediately on page load — before any React component mounts. By the time `useEffect()` runs in `/auth/callback`, the tokens are already consumed and the hash is empty. All redirect logic (flow detection, role checking, password setup enforcement) was dead code.

### Security Vulnerability

`role` was written to `user_metadata` (client-editable). Any ventas user could run this in the browser console:
```javascript
supabaseBrowser.auth.updateUser({ data: { role: "master" } })
```
The middleware fell back to `user_metadata.role` when `app_metadata.role` was missing, granting full admin access.

---

## What Didn't Work (Chronological)

### Attempt 1: Fix `app_metadata.role` in invite route

**Hypothesis:** The middleware reads `app_metadata.role`, but the invite route only set role in `user_metadata` (via `generateLink({ data: { role: "ventas" } })`).

**Fix:** Added `app_metadata: { role: "ventas" }` via `updateUserById` in all three invite paths.

**Result:** Failed. The role was now correctly in `app_metadata`, but `/auth/set-password` was still never hit. The Supabase-hosted redirect chain (`/auth/v1/verify → /auth/callback#access_token=...`) bypassed all our logic regardless of metadata state.

### Attempt 2: Patch the callback page

**Hypothesis:** The `/auth/callback` page had the right logic but wasn't detecting the invite flow correctly.

**Fix:** Added flow detection (`typeParam`, `flowInvite`), metadata checks (`needsPasswordSetup()`), and multiple fallback paths — growing the callback to 140 lines.

**Result:** Failed. All this code was dead — the hash fragments were consumed before React mounted. 140 lines of unreachable complexity.

### Attempt 3: Supabase Redirect URLs configuration

**Hypothesis:** Supabase wasn't redirecting to our callback because the URL wasn't whitelisted.

**Fix:** Added `/auth/confirm` to Supabase's Redirect URLs allowlist.

**Result:** Necessary for password recovery flow, but didn't fix the invite flow. The invite links still went through Supabase's hosted `/auth/v1/verify`, not our `/auth/confirm`.

---

## What Worked (5-Phase Fix)

### Phase 1: Stop writing role to `user_metadata`

- **`set-password/page.tsx`**: Removed `role` from `updateUser({ data })` — no more client-side role writes
- **`invite/route.ts`**: Removed all `user_metadata: { role: "ventas" }` writes. `app_metadata` only.
- Removed `Suspense`, `useSearchParams`, `isInviteFlow` — dead complexity from failed attempts

### Phase 2: Move `password_set` to `app_metadata` (server-side)

- **NEW: `/api/auth/confirm-password-set/route.ts`**: POST route uses `createAdminClient()` to set `app_metadata: { password_set: true }` via `updateUserById`. Called by set-password page after successful password update.
- **`middleware.ts`**: Changed `password_set` check to: `app_metadata?.password_set === true || user_metadata?.password_set === true` (fallback for existing users who already set password before this change)

### Phase 3: Gut the callback page (140 → 40 lines)

- Removed `needsPasswordSetup()`, PKCE code exchange, `flowInvite`/`typeParam` detection — all dead code
- Kept ONLY: hash-based session recovery → redirect to "/" (middleware handles everything else)

### Phase 4: Remove `user_metadata.role` fallback reads

- **`src/lib/auth.ts`** `getUserRole()`: Changed from `app_metadata?.role ?? user_metadata?.role` to `app_metadata?.role ?? null`
- **`middleware.ts`**: Removed `user_metadata?.role` fallback
- **`/api/auth/session/route.ts`**: Same — `app_metadata?.role ?? null`

### Phase 5: Delete dead code & consolidate

- **DELETED** `src/app/api/admin/invite/route.ts` — legacy route, zero consumers, used deprecated `inviteUserByEmail()`
- **DELETED** `src/lib/supabase/server.ts` — `createReservasServerClient()`, zero imports
- **Migrated** invite route from `supabaseAdmin` singleton to `createAdminClient()` factory
- **Invite route rewrite**: Uses `generateLink()` → `hashed_token` → builds URL to OUR `/auth/confirm` route. Bypasses Supabase's hosted redirect chain entirely.

### Phase 6: Server-side invite link generation script

- **NEW: `scripts/generate-invite-link.ts`**: Quick workaround to generate invite links locally using service_role key. Same `generateLink()` + `hashed_token` approach.
- Used to successfully onboard first three ventas users while admin panel deploys.

### Phase 7: WhatsApp bot protection

- First invite link sent via WhatsApp was consumed by the link preview bot before the user clicked it.
- **`/auth/confirm` route**: Added crawler user-agent detection (WhatsApp, Facebook, Telegram, etc.). Returns `200 OK` without calling `verifyOtp()` for bots.

### Phase 8: Role-aware NavBar

- **`nav-bar.tsx`**: Reads `app_metadata.role` on mount via `supabaseBrowser.auth.getUser()`
- Ventas users see: Mis Reservas, Inventario, Clientes, Rendimiento | Disponibilidad, Cotizador
- Admin users see: full link set (Dashboard, Projects, Reservas, etc.)
- Renders nothing until role is determined (prevents flash of admin links)

### Phase 9: Middleware cookie propagation

- **`middleware.ts`**: `getUser()` may refresh JWT tokens and write new cookies to the `response` object. Previously, `NextResponse.redirect()` created a NEW response — losing those cookies and potentially breaking the session.
- New `redirectTo()` helper copies all cookies from the response to the redirect, ensuring token refresh survives redirects.

---

## Design Decisions

1. **Server-side token verification only.** Client-side hash processing is inherently racy in React SPAs. Our `/auth/confirm` route verifies the OTP server-side, sets cookies in the response, and redirects — zero client-side token handling.

2. **`app_metadata` is the sole authority for role and `password_set`.** `user_metadata` is client-editable — any user can escalate privileges from the browser console. `app_metadata` requires service_role key to modify.

3. **`generateLink()` + `hashed_token` instead of `inviteUserByEmail()`.** `inviteUserByEmail()` sends an email through Supabase's hosted flow, which redirects to `/auth/v1/verify` and then to our callback with hash fragments. `generateLink()` returns the raw `hashed_token` without sending email, letting us construct URLs to our own `/auth/confirm` route.

4. **Middleware as sole enforcer.** Role-based routing, password-setup gate, and page restrictions all live in one place. Pages don't implement their own auth checks for routing — they delegate to middleware.

5. **NavBar reads role client-side.** The NavBar is a client component rendered on every page. It reads `app_metadata.role` once on mount and filters links accordingly. This is defense-in-depth — even if a ventas user somehow sees a page, they can't navigate to admin pages via the UI.

6. **Crawler detection in `/auth/confirm`.** WhatsApp/Facebook/Telegram link preview bots issue GET requests to URLs shared in messages. For one-time OTP tokens, this consumes the token before the human clicks. The route now returns `200 OK` for known bot user-agents without verifying.

---

## Verification

| Test | Expected | Result |
|------|----------|--------|
| Invite link (script) → WhatsApp → click | Lands on `/auth/set-password` | PASS (eder.veliz, paula.hernandez, jose.gutierrez) |
| WhatsApp bot preview | Returns 200 OK, token NOT consumed | PASS (first link after bot fix) |
| Set password → redirect | Ventas user → `/ventas/portal/reservas` | PASS |
| NavBar (ventas user) | Shows only: Mis Reservas, Inventario, Clientes, Rendimiento, Disponibilidad, Cotizador | PASS |
| NavBar (admin user) | Shows full admin link set | PASS |
| Browser console `updateUser({ data: { role: "master" } })` | Does NOT grant admin access (middleware reads `app_metadata` only) | PASS |
| Direct URL to "/" (ventas user) | Middleware redirects to `/ventas/dashboard` → `/ventas/portal/reservas` | PASS |
| Password recovery (login page) | Email link → `/auth/confirm` → `/auth/set-password` | PASS |
| `next build` | Zero errors | PASS |

---

## Files

| File | Action |
|------|--------|
| `middleware.ts` | MODIFY — `redirectTo()` helper with cookie propagation, `app_metadata` only for role |
| `src/components/nav-bar.tsx` | MODIFY — role-aware link filtering |
| `src/app/auth/set-password/page.tsx` | MODIFY — simplified, removed role write + Suspense |
| `src/app/auth/callback/page.tsx` | MODIFY — gutted from 140 → 40 lines |
| `src/app/auth/confirm/route.ts` | MODIFY — crawler detection |
| `src/app/api/admin/salespeople/invite/route.ts` | MODIFY — `generateLink` + `buildConfirmUrl`, `createAdminClient` |
| `src/app/api/auth/confirm-password-set/route.ts` | NEW — server-side `password_set` in `app_metadata` |
| `src/app/api/auth/session/route.ts` | MODIFY — removed `user_metadata.role` fallback |
| `src/lib/auth.ts` | MODIFY — `getUserRole()` reads `app_metadata` only |
| `src/app/api/admin/invite/route.ts` | DELETE — legacy, zero consumers |
| `src/lib/supabase/server.ts` | DELETE — zero imports |
| `scripts/generate-invite-link.ts` | NEW — local invite link generator |

---

## Key Insight

The fundamental flaw was architectural, not a bug. Supabase's hosted auth flow (`/auth/v1/verify → callback#hash`) is designed for server-rendered apps or apps that process tokens synchronously. In React SPAs, the Supabase JS client consumes hash fragments via `onAuthStateChange` before any React lifecycle method runs. Every attempt to "fix" the callback page added dead code — the tokens were already gone.

The fix was to **bypass the entire Supabase-hosted redirect chain** by using `generateLink()` to get the raw `hashed_token` and building URLs to our own server-side `/auth/confirm` route. Server controls everything: token verification, cookie setting, redirect destination. Zero client-side token processing.
