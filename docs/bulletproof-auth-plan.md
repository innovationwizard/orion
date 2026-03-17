# Bulletproof Auth — Clean Code Plan

## Context

The invite flow for ventas users has been broken since inception. The root cause: invite links go through Supabase's hosted `/auth/v1/verify` which redirects to a client-side callback page (`/auth/callback`). The Supabase JS client auto-consumes hash tokens before React's `useEffect` runs, causing a race condition where none of the redirect logic executes. Ventas users land on the admin dashboard instead of `/auth/set-password`.

Repeated patches (flow detection, metadata checks, fallback paths) added 140 lines of dead complexity without fixing the underlying architectural flaw. Additionally, `role` is written to `user_metadata` (client-editable) creating a privilege escalation vulnerability.

**Goal:** Single-path, server-side auth flow. Zero client-side token processing. Role in `app_metadata` only. Clean code, no dead paths.

---

## Phase 1: Close the Security Hole — Stop Writing Role to `user_metadata`

`user_metadata` is client-editable. Any user can call `supabaseBrowser.auth.updateUser({ data: { role: "master" } })` from the browser console. The middleware falls back to `user_metadata.role` when `app_metadata.role` is missing.

### Changes

**`src/app/auth/set-password/page.tsx`**
- Remove `useSearchParams`, `Suspense` wrapper, `isInviteFlow` logic, and `role` from `userData`
- Simplify to: `updateUser({ password, data: { password_set: true } })`
- Remove the `SetPasswordForm` / `SetPasswordPage` split — just one default export component (no `useSearchParams` = no Suspense needed)

**`src/app/api/admin/salespeople/invite/route.ts`**
- Path 1 (resend): Remove `user_metadata: { role: "ventas" }` from `updateUserById`. Keep only `app_metadata: { role: "ventas" }`.
- Path 2 (existing user fallback): Change `user_metadata: { ...existingUser.user_metadata, role: "ventas" }` to just removing the `user_metadata` field. `app_metadata` is the authority.
- Path 3 (new invite): `generateLink({ data: { role: "ventas" } })` writes to `user_metadata` — acceptable because `updateUserById` on line 146 immediately sets `app_metadata.role`. The `user_metadata` value becomes stale but harmless.

---

## Phase 2: Move `password_set` to `app_metadata` (Server-Side)

Currently `password_set: true` is set by client-side `updateUser()`. A user could bypass the password gate from the console.

### Changes

**New file: `src/app/api/auth/confirm-password-set/route.ts`**
- POST route, requires authenticated user (`requireAuth`)
- Uses `createAdminClient()` to set `app_metadata: { password_set: true }` via `updateUserById`
- Returns `{ ok: true }`

**`src/app/auth/set-password/page.tsx`**
- After `updateUser({ password })` succeeds, call `fetch("/api/auth/confirm-password-set", { method: "POST" })`
- Keep `data: { password_set: true }` in the `updateUser` call as belt-and-suspenders (client-side fallback for the transition period)

**`middleware.ts`**
- Change `password_set` check from `user_metadata?.password_set` to `(app_metadata?.password_set === true || user_metadata?.password_set === true)`
- The `user_metadata` fallback covers existing users who already set their password before this change

---

## Phase 3: Gut the Callback Page

The `/auth/callback` page has 140 lines of dead complexity. Now that:
- Invite links use `/auth/confirm` (server-side OTP verification)
- Password reset uses `/auth/confirm` (login-form.tsx line 28: `redirectTo: siteUrl + "/auth/confirm"`)
- `AuthHashRedirect` in layout.tsx catches stray hash tokens

...the callback only needs to handle one edge case: hash tokens that `AuthHashRedirect` forwards here.

### Changes

**`src/app/auth/callback/page.tsx`** — Replace 140 lines with ~40:
- Remove `needsPasswordSetup()` function entirely (middleware handles this)
- Remove PKCE code exchange (not used — `/auth/confirm` handles server-side verification)
- Remove `flowInvite`, `typeParam` detection
- Keep ONLY: hash-based session recovery → redirect to `/` (middleware enforces everything else)

---

## Phase 4: Remove `user_metadata.role` Fallback Reads

**Prerequisite:** Run this query before deploying to confirm zero orphaned users:
```sql
SELECT id, email, raw_user_meta_data->>'role' as um_role, raw_app_meta_data->>'role' as am_role
FROM auth.users
WHERE raw_user_meta_data->>'role' IS NOT NULL
AND raw_app_meta_data->>'role' IS NULL;
```
If non-zero rows: backfill `app_metadata.role` for those users first.

### Changes

**`src/lib/auth.ts`** — `getUserRole()` (line 52-57)
- Change from `app_metadata?.role ?? user_metadata?.role` to `app_metadata?.role ?? null`

**`middleware.ts`** (line 77-80)
- Remove `user_metadata?.role` fallback line

**`src/app/api/auth/session/route.ts`** (line 12)
- Change from `app_metadata?.role ?? user_metadata?.role ?? null` to `app_metadata?.role ?? null`

---

## Phase 5: Delete Dead Code & Consolidate

### 5a: Delete legacy invite route
**Delete: `src/app/api/admin/invite/route.ts`**
- Zero consumers in source code (only changelogs reference it)
- Uses deprecated `inviteUserByEmail()` + redirects to dead `/auth/callback?flow=invite`

### 5b: Consolidate browser clients
**`src/lib/supabase/client.ts`** — Replace factory with re-export:
```typescript
import { supabaseBrowser } from "@/lib/supabase-browser";
/** @deprecated Use supabaseBrowser from "@/lib/supabase-browser" directly */
export function createReservasClient() { return supabaseBrowser; }
```
- 3 consumers (`pcv-client.tsx`, `upload-image.ts`, `use-realtime-units.ts`) continue working unchanged

### 5c: Delete unused server client factory
**Delete: `src/lib/supabase/server.ts`**
- `createReservasServerClient()` has zero imports outside its own file

### 5d: Migrate invite route to `createAdminClient()`
**`src/app/api/admin/salespeople/invite/route.ts`**
- Replace `import { supabaseAdmin, getSupabaseConfigError } from "@/lib/supabase"` with `import { createAdminClient } from "@/lib/supabase/admin"`
- Replace null-check pattern with `const admin = createAdminClient()` (throws on missing env — same behavior)

---

## Files Modified (Summary)

| File | Action | Phase |
|------|--------|-------|
| `src/app/auth/set-password/page.tsx` | Simplify: remove role write, Suspense, flow detection | 1, 2 |
| `src/app/api/admin/salespeople/invite/route.ts` | Remove user_metadata role writes, migrate to createAdminClient | 1, 5d |
| `src/app/api/auth/confirm-password-set/route.ts` | **NEW** — server-side password_set in app_metadata | 2 |
| `middleware.ts` | Update password_set check to prefer app_metadata | 2, 4 |
| `src/app/auth/callback/page.tsx` | Gut from 140 → ~40 lines | 3 |
| `src/lib/auth.ts` | Remove user_metadata.role fallback in getUserRole | 4 |
| `src/app/api/auth/session/route.ts` | Remove user_metadata.role fallback | 4 |
| `src/app/api/admin/invite/route.ts` | **DELETE** — dead legacy route | 5a |
| `src/lib/supabase/client.ts` | Deprecate: re-export supabaseBrowser | 5b |
| `src/lib/supabase/server.ts` | **DELETE** — zero consumers | 5c |

---

## Verification

1. **Build:** `next build` must pass with zero errors
2. **Invite flow:** Admin generates link → salesperson clicks → lands on `/auth/set-password` (not dashboard)
3. **Password setup:** After setting password, salesperson is redirected to `/ventas/dashboard` (not `/`)
4. **Page restrictions:** Ventas user cannot access `/`, `/admin/*`, `/projects` — middleware redirects to `/ventas/dashboard`
5. **Console exploit blocked:** From ventas user browser console, `supabaseBrowser.auth.updateUser({ data: { role: "master" } })` should NOT grant admin access (middleware reads `app_metadata` only)
6. **Password reset:** From login page "Olvidé mi contraseña" → email link → `/auth/confirm` → `/auth/set-password` → works
7. **Existing users:** Users who already set their password are NOT forced to redo it (fallback to `user_metadata.password_set`)
