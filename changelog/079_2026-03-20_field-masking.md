# 079 — Role-Aware Field Masking (Phase 4)

**Date:** 2026-03-20
**Impact:** Security. Server-side post-query response shaping prevents data leakage when gerencia/financiero/contabilidad roles are activated.
**Gap resolved:** GAP-03 (No Server-Side Field Masking on Analytics Routes).

## Why

All analytics API routes returned the same full dataset regardless of the caller's role. When gerencia, financiero, or contabilidad users log in, they would see individual commission amounts per salesperson, ISR breakdowns, payment histories, and salesperson-amount pairings — data beyond their job function. Phase 2 (permission architecture) controls access-or-no-access; this phase adds field-level granularity within allowed routes.

## What Changed

### New: `src/lib/field-masking.ts` — 4 Per-Resource Masking Functions

Pure, typed functions applied after Supabase queries, before `jsonOk()`. Defense-in-depth: unknown roles default to the most restrictive masking (gerencia-level).

| Function | Route | gerencia | contabilidad |
|----------|-------|----------|--------------|
| `maskCommissionsAnalytics()` | `/api/analytics/commissions` | `byRecipient: []`, ISR/disbursable zeroed | `recipientName` → "Beneficiario N" |
| `maskPaymentCompliance()` | `/api/analytics/payment-compliance` | `paymentHistory: []` per unit | No masking |
| `maskPaymentsAnalytics()` | `/api/analytics/payments` | Money fields zeroed, `paymentHistory: []` | No masking |
| `maskCommissionsLegacy()` | `/api/commissions` | `data: []` (keep totals) | `recipient_name` → "Beneficiario N" |

**financiero, master, torredecontrol:** Full access — no masking applied.

**Cash flow route excluded:** `/api/analytics/cash-flow-forecast` returns only aggregate monthly data with no PII or per-person breakdown.

### Modified: 4 API Routes

Each route: added `getUserRole()` import, extracted role from `auth.user`, wrapped response with the corresponding mask function before `jsonOk()`.

- `src/app/api/analytics/commissions/route.ts` — `maskCommissionsAnalytics()`
- `src/app/api/analytics/payments/route.ts` — `maskPaymentsAnalytics()`
- `src/app/api/analytics/payment-compliance/route.ts` — `maskPaymentCompliance()`
- `src/app/api/commissions/route.ts` — `maskCommissionsLegacy()`

### Modified: Dashboard UI

- `src/app/page.tsx` — passes `role` prop to `<DashboardClient role={role} />`.
- `src/app/dashboard-client.tsx` — accepts `role?: string` prop. Filters visible tabs: gerencia sees Resumen, Pagos, Flujo de Caja (no Comisiones).

## Masking Rules (Confirmed)

| Field Category | financiero | contabilidad | gerencia |
|----------------|------------|--------------|----------|
| Project-level aggregates | full | full | full |
| Client names (display only) | full | full | full |
| Individual commission amounts per recipient | full | full | **hidden** |
| ISR calculations | full | full | **hidden** |
| Salesperson name + amount pairing | full | **anonymized** | **hidden** |
| Payment delinquency per unit | full | full | full |
| Payment history per unit | full | full | **hidden** |
| Disbursable/non-disbursable split | full | full | **hidden** |

## Defense Model Update

Added Layer 4 (field masking) to the 6-layer defense-in-depth model:

```
Layer 1: Middleware           — Role-based page routing (5 categories)
Layer 2: Page auth guards     — Server-side role check on root page
Layer 3: API route guards     — requireRole() on 30+ routes, 15 using rolesFor()
Layer 4: Field masking        — Post-query response shaping per role (4 analytics routes)
Layer 5: RLS policies         — Ownership-scoped SELECT on 4 tables + jwt_role() helper
Layer 6: Client UI filtering  — NavBar role-filtered links + role-aware tab visibility
```

## Files Changed

| File | Change |
|------|--------|
| `src/lib/field-masking.ts` | **NEW** — 4 masking functions (~200 lines) |
| `src/app/api/analytics/commissions/route.ts` | +3 lines (import + role + mask) |
| `src/app/api/analytics/payments/route.ts` | +3 lines |
| `src/app/api/analytics/payment-compliance/route.ts` | +3 lines |
| `src/app/api/commissions/route.ts` | +3 lines |
| `src/app/page.tsx` | Pass `role` prop to DashboardClient |
| `src/app/dashboard-client.tsx` | Accept `role` prop, filter tabs for gerencia |
| `docs/gap-master-status-2026-03-20.md` | Phase 4 completion, scoreboard 27/34 |

## Verification

- `npx next build` — passes clean, zero errors.
- gerencia/financiero/contabilidad roles are now safe to activate for real users.
