# 072 — Accumulation-Only Recipients (DIFF-07)

**Date:** 2026-03-17
**Migration:** 038_disbursable.sql
**Audit Ref:** DIFF-07

## Context

The SSOT treats company-internal accounts (puerta_abierta, ahorro, ahorro_comercial, ahorro_por_retiro) as accumulation-only — commissions are computed and tracked but never disbursed to a person. The app had no distinction between disbursable and accumulation-only recipients.

## Changes

### `scripts/migrations/038_disbursable.sql` (NEW)

- Added `disbursable` boolean to `commission_rates` (default `true`)
- Set `false` for 4 accumulation-only accounts

### `src/app/api/analytics/commissions/route.ts` (EDIT)

- Fetches `disbursable` from `commission_rates`
- Returns `disbursable` flag per recipient
- Summary includes `disbursableTotal`, `disbursablePaid`, `disbursableUnpaid`

### `src/components/commission-bars.tsx` (EDIT)

- Extended `CommissionBarItem` type with `disbursable`
- Shows "Acumulado" badge on non-disbursable recipients

### `src/app/dashboard-client.tsx` (EDIT)

- KPI row 1: "Total comisiones" | "A desembolsar" | "Acumulado"
- ISR KPI row unchanged

### `public/metadata/commission-rules.json` (EDIT)

- Added `disbursability` section documenting the concept

## Audit Progress

DIFF-01/02/03/04/05/06/07/08/09 resolved. Remaining: DIFF-10, DIFF-11, DIFF-12, DIFF-13.
