# 020 — Commission Distribution UI was still only showing subset

- **Hash:** `2e6c362`
- **Date:** 2026-02-09
- **Author:** Jorge Luis Contreras Herrera

## Description

Major commission debugging effort. Fixed commission distribution UI to show full dataset. Added debug scripts, diagnostic tools, reconciliation reports, and ETL improvements.

## Files changed

| File | Changes |
|------|---------|
| COMMISSION_DEBUG_REPORT.md | +60 |
| diagnose.ts | +107 |
| etl-reservas.ts | +125 −1 |
| scripts/commission-debug/01-validate-inputs.sql | +34 |
| scripts/commission-debug/02-inspect-trigger-and-function.sql | +34 |
| scripts/commission-debug/03-sample-recompute.sql | +58 |
| scripts/commission-debug/04-reconciliation-report.sql | +83 |
| scripts/commission-debug/README.md | +53 |
| scripts/commission-debug/backfill-commissions.sql | +39 |
| scripts/commission-debug/fix-trigger-recalc-on-update.sql | +43 |
| scripts/commission-debug/fix-walk-in-treat-unknown.sql | +136 |
| scripts/commission-debug/validate-and-reconcile.ts | +329 |
| src/app/api/analytics/commissions/route.ts | +58 −32 |
| test-normalization.ts | +110 |
