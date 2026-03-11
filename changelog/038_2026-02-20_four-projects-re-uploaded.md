# 038 — All four projects re-uploaded with new ETL

- **Hash:** `bc64559`
- **Date:** 2026-02-20
- **Author:** Jorge Luis Contreras Herrera

## Description

Landmark commit. All four real estate projects re-uploaded with new per-project ETL after populating sales reps tables. Added 13 new SQL migrations (commission rules, phases, escalation, referral types, deduplication, RLS fixes). Added payment compliance API route. Moved docs to proper directories. Cleaned up root-level files. "Hail Mary."

## Files changed

| File | Changes |
|------|---------|
| .vercelignore | +1 |
| DEVOLUCIONES_IMPLEMENTATION.md | −176 |
| METADATA_SPEC.md | −10 |
| docs/METADATA_SPEC.md | +10 |
| etl_boulevard.py | −1073 |
| etl_santa_elisa.py | −1271 |
| orion-repo-packed.txt | −3788 |
| package-lock.json | +1365 −1 |
| package.json | +9 −1 |
| scripts/commission-debug/04-reconciliation-report.sql | +11 −1 |
| scripts/migrations/004_commission_rules_foundation.sql | +266 |
| scripts/migrations/005_commission_phases_ahorro_retiro.sql | +212 |
| scripts/migrations/006_commission_project_period_rates.sql | +286 |
| scripts/migrations/007_commission_escalation.sql | +222 |
| scripts/migrations/008_commission_referral_types.sql | +236 |
| scripts/migrations/009_seed_commission_phases_and_rates.sql | +46 |
| scripts/migrations/010_count_by_project_rpc.sql | +36 |
| scripts/migrations/011_dedupe_payments.sql | +24 |
| scripts/migrations/012_fix_v_rate_where_clause.sql | +224 |
| scripts/migrations/013_payments_allow_reimbursement_negative.sql | +31 |
| scripts/migrations/014_policy_periods_referral_gerencia.sql | +406 |
| scripts/migrations/015_fix_v_rate_where_management.sql | +248 |
| scripts/migrations/016_payment_compliance_days_delinquent.sql | +96 |
| scripts/migrations/preflight_check_etl.sql | +101 |
| src/app/api/analytics/payment-compliance/route.ts | +226 |
| src/app/api/sales/route.ts | +17 −1 |
| src/app/bex/page.tsx | +53 |
| src/app/dashboard-client.tsx | +235 −1 |
| src/app/globals.css | +44 |
| src/app/odoo/page.tsx | +49 |
| src/components/kpi-card.tsx | +6 −1 |
| src/components/payment-detail-modal.tsx | +96 −1 |
| src/components/payment-treemap.tsx | +87 −1 |
| src/lib/types.ts | +13 |
| supabase_schema_4.md | −157 |
| tsconfig.json | +2 −1 |
| tsconfig.tsbuildinfo | +1 |
