# 074 — API Route Role Enforcement (GAP-01, GAP-02, GAP-06)

**Date:** 2026-03-19
**Impact:** Security hardening. Zero functional change for current admin users. Blocks unauthorized API access before salesperson go-live.

## Why

Middleware protects **pages** but explicitly excludes `/api/*` routes (matcher config). Any authenticated user — including the 32 salespeople about to receive accounts — could call any API route directly and access commission data, modify sales, confirm reservations, or consume Claude API credits via OCR endpoints. Four admin mutation routes (confirm/reject/desist/release) had **zero authentication**, meaning anyone on the internet could alter reservation state.

This was identified in `docs/roles-gap-analysis.md` as three critical gaps:
- **GAP-01:** 20+ API routes used only `requireAuth()` or no auth — ventas users could access all financial data
- **GAP-02:** OCR endpoints were fully public — anyone could burn Claude API credits
- **GAP-06:** No role hierarchy — roles were flat strings requiring manual enumeration everywhere

## What Changed

### 1. Role hierarchy foundation (`src/lib/auth.ts`)

Added numeric role levels and two reusable role-group constants:

- `ROLE_LEVEL` — ventas(10) < inventario(20) < contabilidad(30) < financiero(40) < gerencia(50) < torredecontrol(60) < master(70)
- `ADMIN_ROLES` — `["master", "torredecontrol"]` — can manage reservations, modify business data
- `DATA_VIEWER_ROLES` — `["master", "torredecontrol", "gerencia", "financiero", "contabilidad"]` — can view analytics and financial data
- `hasMinimumRole()` — level-based check for future use

Existing `requireRole()` signature unchanged. The constants eliminate hardcoded role arrays across 30+ route files.

### 2. New rate limiter (`src/lib/rate-limit.ts`)

In-memory sliding window rate limiter. No external dependency. Per-user key, configurable limit and window. On Vercel serverless, each cold start gets its own Map — sufficient for preventing bulk abuse.

### 3. Secured 30 API routes across 4 groups

**Group A — Zero-auth admin mutations → `requireRole(ADMIN_ROLES)`** (4 routes)

These had NO authentication whatsoever. Anyone on the internet could confirm, reject, or desist a reservation.

| Route | Method |
|-------|--------|
| `/api/reservas/admin/reservations/[id]/confirm` | PATCH |
| `/api/reservas/admin/reservations/[id]/reject` | PATCH |
| `/api/reservas/admin/reservations/[id]/desist` | PATCH |
| `/api/reservas/admin/freeze-requests/[id]/release` | PATCH |

**Group B — Analytics/financial data → `requireRole(DATA_VIEWER_ROLES)`** (7 routes)

Previously `requireAuth()` only — any logged-in ventas user could query all commission, payment, and compliance data.

| Route | Method |
|-------|--------|
| `/api/analytics/commissions` | GET |
| `/api/analytics/payments` | GET |
| `/api/analytics/payment-compliance` | GET |
| `/api/analytics/cash-flow-forecast` | GET |
| `/api/commissions` | GET |
| `/api/commission-rates` | GET |
| `/api/commission-phases` | GET |

**Group C — Admin operational routes → split auth** (11 routes)

Routes with mutations restricted to `ADMIN_ROLES`. Read-only endpoints set to `DATA_VIEWER_ROLES` or `ADMIN_ROLES` depending on data sensitivity.

| Route | Method | Auth |
|-------|--------|------|
| `/api/sales` | GET | `requireAuth()` (unchanged) |
| `/api/sales` | POST, PATCH | `requireRole(ADMIN_ROLES)` |
| `/api/payments` | GET | `requireAuth()` (unchanged) |
| `/api/payments` | POST | `requireRole(ADMIN_ROLES)` |
| `/api/projects` | GET | `requireRole(DATA_VIEWER_ROLES)` |
| `/api/projects` | POST, PATCH, DELETE | `requireRole(ADMIN_ROLES)` |
| `/api/reservas/referidos` | GET, POST | `requireRole(ADMIN_ROLES)` |
| `/api/reservas/referidos/[id]` | PATCH, DELETE | `requireRole(ADMIN_ROLES)` |
| `/api/reservas/valorizacion` | GET, POST | `requireRole(ADMIN_ROLES)` |
| `/api/reservas/valorizacion/[id]` | PATCH, DELETE | `requireRole(ADMIN_ROLES)` |
| `/api/reservas/cesion` | GET | `requireRole(ADMIN_ROLES)` |
| `/api/reservas/buyer-persona` | GET | `requireRole(ADMIN_ROLES)` |
| `/api/reservas/buyer-persona/[client_id]` | GET, PUT | `requireRole(ADMIN_ROLES)` |
| `/api/reservas/integracion` | GET | `requireRole(ADMIN_ROLES)` |

**Group D — Reference data routes → `requireAuth()`** (6 routes)

Previously zero auth. These are called by the `/reservar` form which already requires login via middleware. Adding `requireAuth()` blocks direct unauthenticated API calls without breaking the form flow.

| Route | Method |
|-------|--------|
| `/api/reservas/units` | GET |
| `/api/reservas/salespeople` | GET |
| `/api/reservas/projects` | GET |
| `/api/reservas/reservations` | GET |
| `/api/reservas/freeze-requests` | POST |
| `/api/reservas/ventas` | GET |

### 4. OCR endpoints secured (`requireAuth()` + rate limiting)

| Route | Method | Rate Limit |
|-------|--------|------------|
| `/api/reservas/ocr` | POST | 20 req/hour/user |
| `/api/reservas/dpi-ocr` | POST | 20 req/hour/user |

Returns HTTP 429 with Spanish error message when exceeded.

## What Did NOT Change

- **Middleware** — no changes (already correctly routes ventas vs non-ventas pages)
- **NavBar** — no changes (binary ventas/admin UI split stays)
- **RLS policies** — no database changes
- **Frontend code** — zero client-side changes
- **Already-correct routes** — `/api/me`, `/api/auth/*`, `/api/reservas/me`, `/api/admin/*`, all dual-auth document routes, salesperson-owned routes — left as-is

## Files Modified

| File | Change |
|------|--------|
| `src/lib/auth.ts` | +`ROLE_LEVEL`, `ADMIN_ROLES`, `DATA_VIEWER_ROLES`, `hasMinimumRole()` |
| `src/lib/rate-limit.ts` | **New file** — in-memory rate limiter |
| 4 admin mutation routes | Added `requireRole(ADMIN_ROLES)` |
| 7 analytics routes | `requireAuth()` → `requireRole(DATA_VIEWER_ROLES)` |
| 11 admin operational routes | Split auth (viewer GET / admin mutations) |
| 6 reference data routes | Added `requireAuth()` |
| 2 OCR routes | Added `requireAuth()` + rate limiting |

**Total: 32 files modified, 1 new file, ~130 lines added.**

## Verification

`next build` passes clean — zero errors, zero warnings.

## Design Documents

- Gap analysis: `docs/roles-gap-analysis.md`
- Implementation plan: `docs/plan-fix-critical-gaps.md`
- Role inventory: `docs/roles-current-state.md`
- Industry benchmarks: `docs/roles-industry-best-practices.md`
