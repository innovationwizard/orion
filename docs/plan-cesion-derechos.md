# Cesion de Derechos Dashboard — Implementation Plan

**Status:** IMPLEMENTED (2026-03-12) — code complete, build passes. Pending: migration 023 deployment + backfill execution on production.

## Context

The standalone paventas app at `paventas/` is a Vite+React SPA that reads a static CSV to display a financial dashboard for 280 Boulevard 5 "Cesion de Derechos" apartments. The goal is to replace it with a page in Orion (`/cesion`) that reads from the production database — no Excel dependency.

**Gap analysis result:** 20 of 26 fields already exist in the DB. 6 need new columns on `rv_units`, plus 3 denormalized fields to avoid complex multi-domain joins. The page bridges two DB domains: `rv_units` (physical data) and `payment_compliance` (financial data), joined on `(project_id, unit_number)`.

---

## Step 1: Migration `scripts/migrations/023_cesion_derechos.sql`

**9 new columns on `rv_units`:**

| Column | Type | Rationale |
|---|---|---|
| `parking_car_area` | `numeric(10,2)` | Universal — parking m2, useful for any unit |
| `parking_tandem_area` | `numeric(10,2)` | Universal — tandem parking m2 |
| `price_suggested` | `numeric(14,2)` | Current market price per unit |
| `is_cesion` | `boolean NOT NULL DEFAULT false` | Flags cesion program units (partial index) |
| `pcv_block` | `integer` | PCV signing block (1-4) |
| `precalificacion_status` | `text` | APROBADA / DENEGADA / N/A / DISPONIBLE |
| `precalificacion_notes` | `text` | Bank prequalification comments |
| `razon_compra` | `text` | INVERSION, etc. (denormalized from rv_client_profiles) |
| `tipo_cliente` | `text` | CASO ESPECIAL, CLIENTE NORMAL (denormalized from sales) |

**Views:**
- `CREATE OR REPLACE VIEW v_rv_units_full` — append 9 new columns at END (PostgreSQL cannot reorder)
  - Existing 29 columns stay exactly as-is (verified from migration 018, lines 735-764)
- `CREATE OR REPLACE VIEW v_cesion_derechos WITH (security_invoker = true)` — cross-domain view joining:
  - `rv_units` → physical + new columns
  - `floors` → `towers` → `projects` (project_id for bridge)
  - `LEFT JOIN payment_compliance` ON `(project_id, unit_number)` → `client_name`, `expected_total`, `expected_to_date`, `actual_total` (enganche_pagado), `variance`, `compliance_pct`, `compliance_status`, `days_delinquent`

**Indexes:**
- `idx_rv_units_is_cesion ON rv_units(is_cesion) WHERE is_cesion = true` (partial, fast cesion lookups)

**No changes to:** `v_reservations_pending`, `v_rv_unit_sale_counts`, `v_rv_referrals_full` (cesion columns are irrelevant to those views)

**Pattern:** matches 022 — `BEGIN`/`COMMIT` wrapper, `ADD COLUMN IF NOT EXISTS`, `CREATE INDEX IF NOT EXISTS`, `========` header block

---

## Step 2: ETL Backfill `scripts/backfill_cesion.py` → `scripts/backfill_cesion.sql`

**Source:** `origin/SSOT/Documentos varios/ACTUALIZACION APTOS CESIÓN DE DERECHOS BOULEVARD 5 Vrs.030326.xlsx`
- Sheet: `Cesión de derechos`, 281 data rows, 26 columns

**Pattern:** matches `backfill_reservations.py`:
- `openpyxl` with `read_only=True, data_only=True`
- Header detection (scan row 1 for known column names → column index mapping)
- `dataclass` for `CesionRecord` with 9 fields (the new columns)
- Helper functions: `sql_str()`, `sql_num()`, `sql_bool()` (same as existing scripts)
- Pre-flight check: verify all target unit_numbers exist in rv_units for B5
- Generates `UPDATE rv_units SET ... WHERE id = (subquery matching unit_number + B5 project_id)`
- Sets `is_cesion = true` for all 281 matched units
- `BEGIN`/`COMMIT` wrapper, ON CONFLICT-safe (idempotent UPDATEs)
- Output: `scripts/backfill_cesion.sql` — reviewed manually, then executed via Supabase Management API

**Column mapping (xlsx → rv_units):**

| xlsx Col | Header | Target Column |
|---|---|---|
| H | Metraje simple | `parking_car_area` |
| J | Metraje Tandem | `parking_tandem_area` |
| N | Precio actual sugerido | `price_suggested` |
| V | Bloque PCV | `pcv_block` |
| W | Estatus Precalificación | `precalificacion_status` |
| X | Comentarios de Precalificación | `precalificacion_notes` |
| Y | Razón de compra | `razon_compra` (normalize: strip, uppercase) |
| Z | Tipo de cliente | `tipo_cliente` (normalize: strip, uppercase) |

(Column letters based on xlsx inspection; script uses header detection, not hardcoded indices)

---

## Step 3: Page Implementation

### 3a. Dependencies

- `npm install recharts` — Recharts for pie/donut and bar charts (paventas already uses it; D3 in Orion is for treemaps — different use case, no conflict)

### 3b. Files to CREATE (16 files)

| File | Purpose |
|---|---|
| `scripts/migrations/023_cesion_derechos.sql` | Migration |
| `scripts/backfill_cesion.py` | ETL script |
| `src/app/cesion/page.tsx` | Server component (Suspense + metadata) |
| `src/app/cesion/cesion-client.tsx` | Main client: state, filters, stats, view routing |
| `src/app/cesion/components/kpi-row.tsx` | 5 KPI cards (reuses `KpiCard` from `src/components/kpi-card.tsx`) |
| `src/app/cesion/components/filters.tsx` | 6 multi-select filters + text search |
| `src/app/cesion/components/multi-select.tsx` | Dropdown with checkboxes (port from paventas) |
| `src/app/cesion/components/view-tabs.tsx` | Resumen / Cartera / Clientes tab switcher |
| `src/app/cesion/components/resumen-view.tsx` | 4 donut charts + 1 bar chart (Recharts) |
| `src/app/cesion/components/cartera-view.tsx` | Sortable table + expandable detail panel |
| `src/app/cesion/components/clientes-view.tsx` | Top-15 client bar chart + summary table |
| `src/app/cesion/components/drill-down-modal.tsx` | Full-screen overlay with search + sortable table |
| `src/app/cesion/components/chart-tooltips.tsx` | Custom Recharts tooltips (pie + bar) |
| `src/app/api/reservas/cesion/route.ts` | GET endpoint: `SELECT * FROM v_cesion_derechos` |
| `src/hooks/use-cesion.ts` | Data fetch hook |
| `src/hooks/use-drill-down.ts` | Drill-down modal state |

### 3c. Files to MODIFY (4 files)

| File | Change |
|---|---|
| `src/components/nav-bar.tsx` | Add `"divider"`, then `{ href: "/cesion", label: "Cesion" }` after valorizacion |
| `src/lib/reservas/types.ts` | Add `CesionUnit` interface (mirrors `v_cesion_derechos` columns) |
| `src/lib/reservas/constants.ts` | Add `fmtQCompact()` (Q1.33M, Q133K format for KPI cards) |
| `package.json` | Add recharts dependency |

### 3d. Architecture decisions

- **API route** at `/api/reservas/cesion/route.ts` — uses `createAdminClient()` (service_role bypasses RLS on `payment_compliance`), returns ~280 rows in one query, no pagination
- **Stats computed client-side** via `useMemo` — same approach as paventas `App.jsx`:
  - `totalVenta` = sum(price_list)
  - `totalPlusvalia` = sum(price_suggested - price_list)
  - `totalPagado` = sum(enganche_pagado)
  - `totalDiferencia` = sum(variance)
  - `atrasados` = count where compliance_status = 'behind'
  - `pctCobro` = totalPagado / sum(expected_to_date) × 100
- **Estatus mapping**: `compliance_status === 'behind'` → `ATRASADO`, else → `AL DÍA`
- **Live data**: page shows current-date compliance (not frozen February snapshot) — intentionally better than Excel
- **Styling**: Tailwind (Orion's light theme), not paventas dark theme inline styles
- **Existing `formatCurrency()`** in constants.ts reused for table cells; new `fmtQCompact()` added for KPI cards only

---

## Execution order

1. Write + deploy migration 023 (via Supabase Management API)
2. Write + run ETL script → review SQL → deploy backfill
3. `npm install recharts`
4. Add types + constants
5. Add API route → test with `curl /api/reservas/cesion`
6. Build page components (leaves → root)
7. Add NavBar link (last — makes page discoverable)

## Verification

1. **Migration**: Query `SELECT column_name FROM information_schema.columns WHERE table_name = 'rv_units'` — confirm 9 new columns
2. **Backfill**: `SELECT count(*) FROM rv_units WHERE is_cesion = true` → should be 281; `SELECT * FROM v_cesion_derechos LIMIT 5` → should return joined data
3. **API**: `curl localhost:3000/api/reservas/cesion | jq length` → 281
4. **Page**: Navigate to `/cesion` — KPIs, charts, table, filters, drill-down all functional
5. **Cross-check**: Compare KPI totals with paventas app at `paventas.vercel.app` — numbers should be close (not identical due to live vs snapshot data)

## Risks

- **payment_compliance coverage**: If some B5 cesion units lack records in the analytics `expected_payments`/`sales` tables, the LEFT JOIN returns NULLs for financial fields. The UI must handle nulls gracefully (show "—").
- **Column index drift**: The xlsx header detection in the ETL script mitigates this. If headers change in future xlsx versions, the script fails loudly rather than silently misaligning data.
- **Recharts bundle**: ~200KB gzipped, but code-split to `/cesion` route only (Next.js automatic).


---

## ADDENDUM 2026-03-20: BLT Torre B — Authoritative Correction

**Source:** Jorge (project owner), direct confirmation.
**Cross-reference:** `docs/creditos-33-units-investigation.md` (UPDATE 2026-03-20)

During the Créditos dashboard backfill investigation, 24 BLT Torre B units were flagged with credit data but no reservations. The "INFO PARA REPORTES" Excel sheet listed 58 rows of client data, suggesting 58 hidden sales. Upon authoritative review:

1. **As of 2026-03-20, only 3 confirmed sales exist in Bosque Las Tapias — Torre B.** The 58 rows in "INFO PARA REPORTES" do NOT represent real sales. The confirmed count on that date is **3** (point-in-time figure, not a fixed ceiling).
2. **All existing BLT Torre B sales records will be dropped from the production database** to establish a clean baseline.
3. **Only the 3 confirmed sales (as of 2026-03-20) will be uploaded** as the sole BLT Torre B transactions. This is a point-in-time count — new sales will flow through the normal Orion reservation process.

Any prior references in this document to BLT Torre B having 11 hidden reservations (Category C), 13 orphan income markers (Category D), or 58 clients missing from the DB are **superseded** by this correction (2026-03-20).