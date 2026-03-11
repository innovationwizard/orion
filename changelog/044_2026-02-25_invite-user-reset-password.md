# 044 — Updated Invite user and Reset password

- **Hash:** `d2e0ad5`
- **Date:** 2026-02-25
- **Author:** Jorge Luis Contreras Herrera

## Description

Improved auth flows. Added email confirmation route, set-password page, and enhanced login form with password reset capability.

## Files changed

| File | Changes |
|------|---------|
| middleware.ts | +4 −1 |
| src/app/auth/confirm/route.ts | +57 |
| src/app/auth/set-password/page.tsx | +82 |
| src/app/login/login-form.tsx | +84 −7 |
