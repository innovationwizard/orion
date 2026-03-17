# 070 — ISR Retention Display (DIFF-08)

**Date:** 2026-03-17
**Author:** Jorge Luis Contreras Herrera
**Status:** DEPLOYED to production
**Migration:** 036
**Severity:** Medium — Pati needs "a facturar" vs "a pagar" amounts for payment instructions

---

## Context

### The Problem

The SSOT (CFO's Excel "Pagos" sheet) applies ISR retention to commission disbursements using the formula `Total a pagar = Total a facturar × 107/112`. The app showed raw commission amounts with no differentiation between "to invoice" and "to pay" amounts. Without this, Pati still needed Excel for payment instructions.

### SSOT Formula (Guatemalan Tax)

```
commission_amount (DB) = base commission (pre-IVA)
Total a facturar       = base × 1.12  (add 12% IVA)
ISR retenido           = base × 0.05  (5% ISR retention on pre-IVA)
Total a pagar          = base × 1.07  (facturar − ISR = base × (1.12 − 0.05))

Verification: 1.07 / 1.12 = 107/112 ✓
```

### ISR Exemption

Company-internal accounts are exempt (never disbursed to a person):
- `puerta_abierta` — company's own share
- `ahorro` — reserve account
- `ahorro_comercial` — reserve account
- `ahorro_por_retiro` — reserve account

All others (individuals) have ISR applied. Configurable via `commission_rates.isr_exempt`.

---

## What Changed

### Migration 036: `isr_exempt` column

```sql
ALTER TABLE commission_rates ADD COLUMN isr_exempt boolean NOT NULL DEFAULT false;
UPDATE commission_rates SET isr_exempt = true
WHERE recipient_id IN ('puerta_abierta', 'ahorro', 'ahorro_comercial', 'ahorro_por_retiro');
```

### ISR Utility (`src/lib/isr.ts`)

New module with constants (`IVA_RATE`, `ISR_RATE`, `PAGO_FACTOR`) and `computeISR(base, isExempt)` function.

### API Update (`/api/analytics/commissions`)

Per-recipient response now includes: `isrExempt`, `facturar`, `isrRetenido`, `pagar`.
Summary now includes: `facturar`, `isrRetenido`, `pagar` totals.

### Dashboard Update

- New ISR KPI row: "Total a facturar" | "ISR retenido (5%)" | "Total a pagar"
- Commission bars: non-exempt recipients show "Neto Q..." secondary label

---

## Design Decisions

1. **Presentation-layer only** — ISR is computed on the fly from `commission_amount × factor`. No per-row DB storage. The formula is deterministic.
2. **Configurable exemption** — `isr_exempt` boolean on `commission_rates`. Default `false` (ISR applies). Exempt set for obvious company-internal accounts. User can adjust when exact split rules are available.
3. **Recipients not in commission_rates** (ejecutivos, GC/Supervisor) default to ISR applies — they're all individuals.

---

## Files

| Action | File |
|--------|------|
| NEW | `scripts/migrations/036_isr_exempt.sql` |
| NEW | `src/lib/isr.ts` |
| MODIFY | `src/app/api/analytics/commissions/route.ts` |
| MODIFY | `src/components/commission-bars.tsx` |
| MODIFY | `src/app/dashboard-client.tsx` |
| MODIFY | `public/metadata/commission-rules.json` |

---

## Audit Progress

| DIFF | Description | Status | Migration |
|------|-------------|--------|-----------|
| DIFF-01 | Ronaldo O. missing | **RESOLVED** | 034 |
| DIFF-02 | Puerta Abierta always_paid | **RESOLVED** | 032 |
| DIFF-03 | Alek conditional | **RESOLVED** | 034 |
| DIFF-04 | Antonio conditional | **RESOLVED** | 034 |
| DIFF-05 | Ahorro residual | **RESOLVED** | 035 |
| DIFF-06 | Per-unit EV rates | **RESOLVED** | 033 |
| DIFF-07 | Ahorro G. Comercial treatment | Open | — |
| DIFF-08 | ISR retention | **RESOLVED** | 036 |
| DIFF-09 | Phase 2 proportional | Open | — |
| DIFF-10 | Escalation trigger | Open | — |
| DIFF-11 | Casa Elisa rates | Open | — |
| DIFF-12 | Referral tracking | Open | — |
| DIFF-13 | Legacy fallback rates | Open | — |
