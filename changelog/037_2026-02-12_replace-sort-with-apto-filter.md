# 037 — Replace sort with apto filter

- **Hash:** `87e4d8b`
- **Date:** 2026-02-12
- **Author:** Jorge Luis Contreras Herrera

## Description

Major commit. Replaced treemap sort with apartment filter. Added per-project Python ETL scripts (Boulevard, Santa Elisa). Created sales reps table migrations, devoluciones (returns) implementation, and commission rules JSON. Cleaned up root-level debug docs.

## Files changed

| File | Changes |
|------|---------|
| DESISTIMIENTO_GUIDE.md | −386 |
| DESISTIMIENTO_SUMMARY.md | −112 |
| DEVOLUCIONES_IMPLEMENTATION.md | +176 |
| etl-reservas.ts | −695 |
| etl_boulevard.py | +1073 |
| etl_santa_elisa.py | +1271 |
| public/metadata/commission-rules.json | +7 |
| scripts/migrations/001_devoluciones_reimbursement_enum.sql | +237 |
| scripts/migrations/002_sales_reps_table.sql | +248 |
| scripts/migrations/003_dedupe_sales_reps.sql | +92 |
| scripts/migrations/PRODUCTION_devoluciones.sql | +102 |
| src/app/api/sales-reps/route.ts | +31 |
| src/app/api/sales/route.ts | +22 −1 |
| src/app/dashboard-client.tsx | +96 −1 |
| src/app/globals.css | +68 −1 |
| src/lib/types.ts | +7 |
| supabase_schema_4.md | +157 |
