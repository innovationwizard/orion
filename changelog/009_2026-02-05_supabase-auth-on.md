# 009 — Supabase auth ON

- **Hash:** `bdd980a`
- **Date:** 2026-02-05
- **Author:** Jorge Luis Contreras Herrera

## Description

Full authentication system implementation. Added middleware, login page, admin invite API, auth utilities, and Supabase browser client. Protected all API routes.

## Files changed

| File | Changes |
|------|---------|
| middleware.ts | +48 |
| package.json | +1 |
| src/app/api/admin/invite/route.ts | +51 |
| src/app/api/commission-phases/route.ts | +7 −1 |
| src/app/api/commission-rates/route.ts | +5 |
| src/app/api/commissions/route.ts | +5 |
| src/app/api/me/route.ts | +17 |
| src/app/api/payments/route.ts | +9 |
| src/app/api/sales/route.ts | +9 |
| src/app/dashboard-client.tsx | +86 |
| src/app/layout.tsx | +16 −2 |
| src/app/login/login-form.tsx | +58 |
| src/app/login/page.tsx | +44 |
| src/lib/auth.ts | +85 |
| src/lib/supabase-browser.ts | +6 |
