# 057 — Cesion de Derechos Dashboard

**Date:** 2026-03-12
**Author:** Jorge Luis Contreras Herrera
**Status:** IMPLEMENTED — pending migration 023 deployment + backfill execution

---

## Context

The standalone `paventas/` app is a Vite+React SPA that reads a static CSV to display a financial dashboard for 280 Boulevard 5 "Cesion de Derechos" apartments. This change replaces it with a page in Orion (`/cesion`) that reads from the production database — eliminating the Excel/CSV dependency entirely.

**Gap analysis:** 20 of 26 dashboard fields already existed in the DB. 6 required new columns on `rv_units`, plus 3 denormalized fields to avoid multi-domain joins. The page bridges two DB domains: `rv_units` (physical inventory data) and `payment_compliance` (financial data), joined on `(project_id, unit_number)`.

---

## Database Migration (023)

**File:** `scripts/migrations/023_cesion_derechos.sql`

### New columns on `rv_units` (9)

| Column | Type | Purpose |
|--------|------|---------|
| `parking_car_area` | `numeric(10,2)` | Parking m2 (universal) |
| `parking_tandem_area` | `numeric(10,2)` | Tandem parking m2 (universal) |
| `price_suggested` | `numeric(14,2)` | Current market price per unit |
| `is_cesion` | `boolean NOT NULL DEFAULT false` | Flags cesion program units |
| `pcv_block` | `integer` | PCV signing block (1-4) |
| `precalificacion_status` | `text` | Bank prequalification status |
| `precalificacion_notes` | `text` | Prequalification comments |
| `razon_compra` | `text` | Purchase reason (denormalized) |
| `tipo_cliente` | `text` | Client classification (denormalized) |

### Views

| View | Change |
|------|--------|
| `v_rv_units_full` | Appended 9 new columns at END (PostgreSQL cannot reorder) |
| `v_cesion_derechos` | NEW cross-domain view: `rv_units` LEFT JOIN `payment_compliance` via `(project_id, unit_number)`, filtered by `is_cesion = true`. Returns physical + financial data for ~280 B5 cesion units. Uses `security_invoker = true`. |

### Indexes

| Index | Type |
|-------|------|
| `idx_rv_units_is_cesion` | Partial on `is_cesion WHERE true` |
| `idx_rv_units_pcv_block` | Partial on `pcv_block WHERE NOT NULL` |

---

## ETL Backfill

**Script:** `scripts/backfill_cesion.py`
**Output:** `scripts/backfill_cesion.sql` (279 UPDATE statements)
**Source:** `origin/SSOT/Documentos varios/ACTUALIZACION APTOS CESION DE DERECHOS BOULEVARD 5 Vrs.030326.xlsx`

- Reads xlsx sheet via openpyxl with dynamic header detection
- Normalizes unit numbers, skips footer/summary rows
- Deduplicates (units 207 and 1001 had duplicate rows in source)
- Sets `is_cesion = true` for all matched units
- Idempotent UPDATEs wrapped in BEGIN/COMMIT

---

## Page Implementation

### Architecture

- **API route:** `GET /api/reservas/cesion` — queries `v_cesion_derechos` via `createAdminClient()` (service_role bypasses RLS on `payment_compliance`), returns ~280 rows
- **Stats computed client-side** via `useMemo` — matches paventas approach
- **Estatus mapping:** `compliance_status === 'behind'` -> ATRASADO, else -> AL DIA
- **Live data:** shows current-date compliance (not frozen snapshot like the Excel)
- **Charts:** Recharts (pie/donut + bar) — code-split to `/cesion` route only (126KB)
- **Styling:** Tailwind (Orion light theme), not paventas dark inline styles

### KPI Cards (5)

| KPI | Formula |
|-----|---------|
| Valor de Cartera | sum(price_list) |
| Plusvalia Total | sum(plusvalia) |
| Enganche Pagado | sum(enganche_pagado), % of enganche_pactado |
| Brecha de Cobro | sum(diferencia) |
| Tasa de Atraso | count(behind) / total |

### Views (3 tabs)

| Tab | Content |
|-----|---------|
| Resumen | 4 donut charts (estatus, precalificacion, razon_compra, tipo_cliente) + 1 bar chart (bloque PCV). All clickable -> drill-down. |
| Cartera | 14-column sortable table with expandable detail panel per row. Shows all financial + physical fields. |
| Clientes | Top-15 client horizontal bar chart + full summary table (client aggregation by venta, pagado, diferencia, plusvalia). |

### Filters (6)

Estatus, Bloque PCV, Precalificacion, Razon de Compra, Tipo de Cliente (multi-select dropdowns) + text search by client name. Clear all button + filtered/total count.

### Drill-down Modal

Full-screen overlay triggered by clicking any chart segment. Sortable 11-column table with search, footer totals, Escape to close.

---

## Files Created (16)

| File | Purpose |
|------|---------|
| `scripts/migrations/023_cesion_derechos.sql` | Migration |
| `scripts/backfill_cesion.py` | ETL script |
| `scripts/backfill_cesion.sql` | Generated SQL (279 updates) |
| `src/app/cesion/page.tsx` | Server component (Suspense + metadata) |
| `src/app/cesion/cesion-client.tsx` | Main client orchestrator |
| `src/app/cesion/components/kpi-row.tsx` | 5 KPI cards |
| `src/app/cesion/components/filters.tsx` | 6 multi-select filters + search |
| `src/app/cesion/components/multi-select.tsx` | Dropdown with checkboxes |
| `src/app/cesion/components/view-tabs.tsx` | Tab switcher |
| `src/app/cesion/components/resumen-view.tsx` | 4 donuts + 1 bar (Recharts) |
| `src/app/cesion/components/cartera-view.tsx` | Sortable table + detail panel |
| `src/app/cesion/components/clientes-view.tsx` | Top-15 bar + summary table |
| `src/app/cesion/components/drill-down-modal.tsx` | Full-screen drill-down |
| `src/app/cesion/components/chart-tooltips.tsx` | Custom Recharts tooltips |
| `src/hooks/use-cesion.ts` | Data fetch hook |
| `src/hooks/use-drill-down.ts` | Drill-down modal state |

## Files Modified (4)

| File | Change |
|------|--------|
| `src/components/nav-bar.tsx` | Added divider + `{ href: "/cesion", label: "Cesion" }` |
| `src/lib/reservas/types.ts` | Added `CesionUnit` interface (32 fields) |
| `src/lib/reservas/constants.ts` | Added `fmtQCompact()` for KPI cards |
| `package.json` | Added `recharts` dependency |

---

## Deployment Steps

1. Execute migration 023 via Supabase Management API
2. Run `python scripts/backfill_cesion.py` -> review -> execute `backfill_cesion.sql`
3. Deploy to Vercel (build passes clean)

## Verification

1. `SELECT count(*) FROM rv_units WHERE is_cesion = true` -> 279
2. `SELECT * FROM v_cesion_derechos LIMIT 5` -> joined data with financial fields
3. Navigate to `/cesion` -> KPIs, charts, table, filters, drill-down functional
4. Cross-check KPI totals with paventas app (numbers close but not identical: live vs snapshot data)
