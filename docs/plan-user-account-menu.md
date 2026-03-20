# Plan: User Account Menu with Logout

## Context

The NavBar has **no logout button** and **no user identity indicator**. Users cannot see who they're logged in as, what role they have, or end their session. This violates OWASP session management requirements and basic enterprise UX standards. Every production SaaS (Stripe, Salesforce, GitHub) has a user menu in the top-right corner.

## Approach

**Single-file change** to `src/components/nav-bar.tsx`. No new files, no new API routes, no new dependencies.

Add a user account menu to the right side of the NavBar:
- **Initials avatar** (circle with 1-2 letters) — always-visible click target
- **Dropdown panel** with: display name, email, role badge, "Cerrar sesión" button
- **Logout flow**: clear sessionStorage → `supabaseBrowser.auth.signOut()` → hard navigate to `/login`

## File Modified

`src/components/nav-bar.tsx`

## Implementation Details

### 1. New imports
Add `useCallback`, `useRef` to existing React import.

### 2. New constants (above component)

```typescript
const ROLE_LABELS: Record<string, string> = {
  master: "Master",
  torredecontrol: "Torre de Control",
  gerencia: "Gerencia",
  financiero: "Financiero",
  contabilidad: "Contabilidad",
  inventario: "Inventario",
  ventas: "Ventas",
};

const ROLE_COLORS: Record<string, string> = {
  master: "#7c3aed",         // purple — highest privilege
  torredecontrol: "#2563eb", // blue
  gerencia: "#0891b2",       // cyan
  financiero: "#16a34a",     // green
  contabilidad: "#64748b",   // muted
  inventario: "#f59e0b",     // amber
  ventas: "#2563eb",         // blue
};

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}
```

### 3. New state & hooks (ALL before the early `return null`)

- `email` — from `getUser()`, captured alongside `role`
- `displayName` — resolved from sessionStorage cache (ventas) or email prefix (others)
- `open` — dropdown toggle
- `signingOut` — loading state during logout
- `menuRef` — `useRef<HTMLDivElement>` for click-outside detection

**Effects:**
- Expand existing `useEffect` to also capture `email`
- New effect: resolve `displayName` from sessionStorage (`orion:current-salesperson` cache key) for ventas, email prefix for others
- New effect: click-outside handler (`mousedown` on document, check `menuRef.current.contains`)
- New effect: `Escape` key closes dropdown

**Callbacks:**
- `toggleMenu` — toggles `open`
- `handleSignOut` — clears sessionStorage, calls `signOut()`, hard navigates to `/login`

### 4. JSX — user menu appended after `links.map()`

Inside existing `<nav>`, after links:
- `<div className="ml-auto relative">` — pushes menu to far right
- Initials button: 32×32 circle, `bg-primary`, white text, `aria-expanded`, `aria-haspopup`
- Dropdown: `absolute right-0 top-full mt-2 w-64`, card background, border, shadow, z-50
  - Identity section: display name (bold), email (muted), role badge (colored pill)
  - Separator
  - "Cerrar sesión" button: red text, hover:bg-danger/5, disabled during signout

### 5. Logout flow (step by step)

1. Set `signingOut = true` (disables button, shows "Cerrando sesión...")
2. `sessionStorage.removeItem("orion:current-salesperson")` — clear salesperson cache
3. `await supabaseBrowser.auth.signOut()` — clears auth cookies, revokes refresh token
4. `window.location.href = "/login"` — hard navigation (clean React tree, middleware re-evaluates)
5. If `signOut()` throws: still navigate to `/login` (middleware handles expired tokens)

Why `window.location.href` not `router.push`: guarantees no stale React state, forces middleware to see fresh unauthenticated request.

### 6. Accessibility

- Trigger: `aria-expanded`, `aria-haspopup="true"`, `aria-label` with full name + role
- Dropdown: `role="menu"`
- Logout button: `role="menuitem"`
- Escape key closes dropdown
- `:focus-visible` styles already in globals.css

### 7. Edge cases

| Case | Handling |
|------|----------|
| Role loading (`undefined`) | NavBar returns `null` — no menu (existing) |
| No email | Display "Usuario", initials "U" |
| Ventas, no cached salesperson | Fall back to email prefix |
| `signOut()` throws | Catch, still redirect to `/login` |
| Double-click logout | Button `disabled` during signout |
| Click outside dropdown | Closes via `mousedown` listener |

## Verification

1. `npx next build` — must pass with zero errors
2. Deploy to Vercel preview
3. Test as admin: see initials circle, click → dropdown with email + role badge + "Cerrar sesión"
4. Test as ventas: see display_name from cache or email prefix
5. Click "Cerrar sesión" → redirected to `/login`, session cleared
6. Verify sessionStorage `orion:current-salesperson` is removed after logout
7. Try accessing protected route after logout → redirected to `/login`
8. Keyboard: Tab to avatar, Enter to open, Escape to close
