# 094 — Merge Daniel Veliz into Eder Veliz (same person)

**Date:** 2026-05-22
**Migration:** `scripts/migrations/066_merge_daniel_veliz_into_eder.sql`

## Problem

"Eder Veliz" (`d5895fe3`) and "Daniel Veliz" (`c5e33ccb`) are the same real person stored as two separate `salespeople` records. Daniel Veliz was inserted in migration 024 and used for March–April 2026 sales (migrations 057/061), while Eder Veliz is the longer-standing record with 24+ historical sales.

This split caused commissions to be tracked under two separate recipient IDs and prevented correct aggregation in the commissions dashboard.

## Fix

- Re-keyed all `sales.sales_rep_id` from Daniel → Eder (8 sales)
- Re-keyed all `commissions.recipient_id` from Daniel → Eder
- Merged `salesperson_periods` and `salesperson_project_assignments`
- Re-keyed reservation-system tables (`reservations`, `freeze_requests`, `rv_referrals`)
- Deactivated Daniel Veliz record (`is_active = false`)
- Recalculated commissions on all 8 affected sales
- Added `"daniel veliz" → "Eder Veliz"` to `salesperson-map.ts` for future ETL imports

## Records affected

- 8 sales (4 March 2026 from migration 057, 4 April 2026 from migration 061)
- All commission rows previously attributed to Daniel Veliz
- `ejecutivo_rate` left unchanged (per-sale business decision)
