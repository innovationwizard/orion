# 073 — Fix Orphaned Sales (Migration 039)

**Date:** 2026-03-18
**Migration:** `scripts/migrations/039_fix_orphaned_sales.sql`
**Impact:** Data correction only. Zero financial impact.

## What Changed

30 active sales linked to placeholder "Unknown" salesperson (ETL artifact from `seed_prod.py`) were resolved:

- **25 re-attributed** to correct salespeople based on cross-reference against loans_ssot master databases (Feb 2026) and SSOT Reporte de Ventas:
  - José (Jose Gutierrez): 13 BLT units
  - Paula (Hernandez): 6 BLT units
  - Eder (Veliz): 1 BEN unit (506-B-B)
  - Rony (Ramirez): 2 BEN units (508-C-C, 303-C-C)
  - Pablo (Marroquin): 1 BEN unit (503-C-C)
  - Ivan (Castillo): 1 BEN unit (607-C)
  - Junta (Directiva): 1 B5 unit (1607)

- **5 cancelled** — BLT desisted sales confirmed available in master DB (101, 105, 505, 802, 1003)

- **"Unknown" salesperson deactivated** (`is_active = false`)

## Why Zero Impact

All 30 sales had zero payments and zero commission rows. The `calculate_commissions()` trigger fires on payment INSERT only — updating `sales_rep_id` or `status` fires nothing.

## Pending

`ejecutivo_rate` left NULL on the 25 re-attributed sales — CFO will confirm rates during upcoming session.

## Investigation

Full cross-reference methodology and source analysis: `docs/orphaned-sales-investigation.md`
