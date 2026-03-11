# 034 — Auth to web app

- **Hash:** `956a7aa`
- **Date:** 2026-02-10
- **Author:** Jorge Luis Contreras Herrera

## Description

Improved authentication flow. Added auth callback page, error banner component, and updated middleware for proper auth redirects.

## Files changed

| File | Changes |
|------|---------|
| middleware.ts | +4 −1 |
| src/app/api/admin/invite/route.ts | +13 −1 |
| src/app/auth/callback/page.tsx | +86 |
| src/app/dashboard-client.tsx | +3 −1 |
| src/app/desistimientos/page.tsx | +3 −1 |
| src/app/projects/page.tsx | +3 −1 |
| src/components/error-banner.tsx | +23 |
