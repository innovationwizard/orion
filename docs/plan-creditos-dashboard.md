# Plan: Créditos Dashboard — Integrate pacreditos into Orion

## Context

The Créditos (Loans) department at Puerta Abierta currently uses a standalone Vite/React app (`pacreditos/`) that reads 3 Excel files to display a multi-tab credit portfolio dashboard. This duplicates effort, depends on stale Excel snapshots, and lives outside the main Orion platform.

**Goal**: Replicate the pacreditos output within Orion at `/creditos`, consuming live data from the prod Supabase DB — no Excel dependency. All 4 projects (including Casa Elisa). D3.js for charts. DATA_VIEWER_ROLES access.

**Route**: `/creditos` (NOT `/admin/creditos`) because DATA_PAGE_ROLES are blocked from `/admin/*` by middleware. This matches the pattern of other data pages (`/desistimientos`, `/ventas`, `/disponibilidad`).

---

## Phase 1: DB Migration (`scripts/migrations/042_creditos_columns.sql`)

Add 7 columns across 3 tables + 1 view.

### New columns

**`rv_units`:**
- `valor_inmueble numeric(14,2)` — assessed property value (distinct from price_list/price_with_tax)

**`rv_client_profiles`:**
- `income_source text` — comma-separated values: "Relacion Dependencia", "Negocio Propio", "Economia Informal", "Servicios Profesionales", "Otros"
- `prequalification_bank text` — bank that pre-qualified the buyer
- `is_fha boolean NOT NULL DEFAULT false` — FHA financing flag
- `is_cash_purchase boolean NOT NULL DEFAULT false` — cash (contado) flag

**`reservations`:**
- `cuotas_enganche integer` — number of down payment installments
- `pipedrive_url text` — Pipedrive deal URL (B5 only)

### New view: `v_creditos_unit_full`

Denormalized view joining rv_units → floors → towers → projects → reservations → salespeople → rv_clients → rv_client_profiles → analytics units → sales. Uses `LATERAL` subqueries for latest active reservation and primary client. Returns one row per unit (~890 rows).

Key join: `rv_units.unit_number + project_id` → `units.unit_number + units.project_id` → `sales.unit_id` (natural key bridge, same pattern as `v_reservations_pending`).

Status mapping in view:
- `SOLD` → `'VENDIDO'`
- `RESERVED`, `SOFT_HOLD` → `'RESERVADO'`
- `AVAILABLE`, `FROZEN` → `'DISPONIBLE'`

### Files
- `scripts/migrations/042_creditos_columns.sql`

---

## Phase 2: Backfill Script

ETL script that reads `pacreditos/scripts/data.json` (already extracted from Excel by `extract_data.py`) and generates SQL UPDATE statements.

### Matching strategy
- Match by `(project_name, tower_name, unit_number)` natural key
- For each unit in JSON:
  - UPDATE `rv_units` SET `valor_inmueble` WHERE matched
  - UPDATE `reservations` SET `cuotas_enganche`, `pipedrive_url` WHERE matched via unit
  - UPDATE/INSERT `rv_client_profiles` SET `income_source`, `prequalification_bank`, `is_fha`, `is_cash_purchase` WHERE matched via reservation → client

### Files
- `scripts/backfill_creditos.py` — Python ETL (reads JSON, outputs SQL)
- `scripts/backfill_creditos.sql` — Generated SQL (executed via Management API)

---

## Phase 3: API Route

**`GET /api/admin/creditos`**
- Auth: `requireRole(DATA_VIEWER_ROLES)`
- Query params: `project` (optional slug filter)
- Returns: `CreditUnit[]` from `v_creditos_unit_full`
- ~890 rows, ~200KB — no pagination needed (client aggregates everything)

### Files
- `src/app/api/admin/creditos/route.ts`

---

## Phase 4: TypeScript Types + Helpers

### Types (`src/lib/reservas/types.ts`)
- `CreditUnitStatus = "VENDIDO" | "RESERVADO" | "DISPONIBLE"`
- `CreditUnit` interface matching view columns

### Constants (`src/lib/reservas/constants.ts`)
- `toCreditStatus()` mapper
- `CREDIT_STATUS_COLORS` and `CREDIT_STATUS_LABELS`

### Aggregation helpers (`src/lib/creditos/helpers.ts`)
Reimplement pacreditos `dataHelpers.js` functions in TypeScript:
- `computeStats(units)` — counts + values by status
- `getVendorStats(units)` — salesperson ranking
- `getStatusByLevel(units)` — status breakdown by floor
- `getModelStats(units)` — status by unit_type
- `getFinancingMix(units)` — FHA/contado/credit distribution
- `getIncomeSourceMix(units)` — income source distribution
- `groupByProject(units)` — partition by project

### Files
- `src/lib/reservas/types.ts` (modify)
- `src/lib/reservas/constants.ts` (modify)
- `src/lib/creditos/helpers.ts` (new)

---

## Phase 5: D3 Chart Components

All under `src/components/creditos/`. Each uses `useElementSize` hook for responsive SVG sizing (pattern from `commission-treemap.tsx`). D3 v7 (full bundle already installed).

### 5.0: Extract shared hook
- `src/hooks/use-element-size.ts` — extract from existing treemap components
- Update `commission-treemap.tsx`, `payment-treemap.tsx`, `cash-flow-chart.tsx` to import from shared hook

### 5.1: DonutChart (`donut-chart.tsx`)
- D3 `arc()` + `pie()` generators
- Used by: Portfolio (status distribution), Portfolio (income source), Team (vendor distribution)

### 5.2: StackedBarChart (`stacked-bar-chart.tsx`)
- D3 `scaleBand` + `scaleLinear` + `stack()`
- Used by: Portfolio (status by project), Project (absorption by level)

### 5.3: GroupedBarChart (`grouped-bar-chart.tsx`)
- Supports `layout: "vertical" | "horizontal"`
- Used by: Project (model distribution, vendor top 10), Compare (absorption, financial), Team (top 15, vendor by project), Portfolio (inventory value)

### 5.4: RadarChart (`radar-chart.tsx`)
- D3 radial scales, polygon paths
- Used by: Compare view only

### 5.5: ProgressBar (`progress-bar.tsx`)
- Pure CSS segments (no D3)
- Used by: Portfolio (project cards), Project (tower cards)

### 5.6: ChartTooltip (`chart-tooltip.tsx`)
- Shared tooltip for all D3 charts
- Positioned absolute, Orion theme styling

### Files (all new)
- `src/hooks/use-element-size.ts`
- `src/components/creditos/donut-chart.tsx`
- `src/components/creditos/stacked-bar-chart.tsx`
- `src/components/creditos/grouped-bar-chart.tsx`
- `src/components/creditos/radar-chart.tsx`
- `src/components/creditos/progress-bar.tsx`
- `src/components/creditos/chart-tooltip.tsx`

### Modified (extract useElementSize)
- `src/components/commission-treemap.tsx`
- `src/components/payment-treemap.tsx`
- `src/components/cash-flow-chart.tsx`

---

## Phase 6: Credit Dashboard Page

### Page files
- `src/app/creditos/page.tsx` — Server component (metadata + Suspense)
- `src/app/creditos/creditos-client.tsx` — Client component (main dashboard)

### Data hook
- `src/hooks/use-credit-units.ts` — fetches from `/api/admin/creditos`

### Tab structure (7 tabs)
1. **Portafolio** — 4 KPIs (Total Unidades, Absorción, Valor Vendido, Disponibles) + 3 project summary cards with ProgressBars + DonutChart (status) + StackedBarChart (status by project) + GroupedBarChart horizontal (inventory value) + DonutChart (income source)
2. **Benestare** — Project view (reusable component)
3. **Bosques Las Tapias** — Project view
4. **Boulevard 5** — Project view
5. **Casa Elisa** — Project view (new, not in pacreditos)
6. **Comparativa** — Comparison table + grouped bars + radar
7. **Equipo de Ventas** — Leaderboard table + bars + pie

### Project view (reusable for each project tab)
- 6 KPIs + per-tower breakdown cards + absorption-by-level stacked bar + model distribution grouped bar + sortable/filterable unit inventory table (12 columns) + vendor performance horizontal bar (top 10)

### Reused from existing Orion components
- `KpiCard` from `src/components/kpi-card.tsx` (label + value + hint)
- NavBar from `src/components/nav-bar.tsx`

---

## Phase 7: NavBar + Middleware Registration

### NavBar (`src/components/nav-bar.tsx`)
Add after "Valorizacion" link:
```typescript
{ href: "/creditos", label: "Créditos", roles: ["master", "torredecontrol", "gerencia", "financiero", "contabilidad"] },
```

### Middleware (`middleware.ts`)
No changes needed — `/creditos` is NOT under `/admin/`, so DATA_PAGE_ROLES can access it. Ventas users are already blocked (not in their allowedPrefixes).

---

## Phase 8: Verification

1. **Migration**: Verify columns + view via `SELECT count(*) FROM v_creditos_unit_full` (expect 890)
2. **Backfill**: Verify non-null counts for new columns
3. **API**: curl endpoint, verify JSON shape
4. **Build**: `next build` must pass (TypeScript strict)
5. **Visual**: Compare side-by-side with deployed pacreditos — all tabs should show equivalent data

---

## File Inventory

### New files (15)
| File | Purpose |
|---|---|
| `scripts/migrations/042_creditos_columns.sql` | Migration: 7 columns + view |
| `scripts/backfill_creditos.py` | ETL: JSON → SQL |
| `scripts/backfill_creditos.sql` | Generated backfill SQL |
| `src/app/api/admin/creditos/route.ts` | API endpoint |
| `src/app/creditos/page.tsx` | Server page component |
| `src/app/creditos/creditos-client.tsx` | Client dashboard |
| `src/hooks/use-element-size.ts` | Shared ResizeObserver hook |
| `src/hooks/use-credit-units.ts` | Data fetching hook |
| `src/lib/creditos/helpers.ts` | Aggregation functions |
| `src/components/creditos/donut-chart.tsx` | D3 donut/pie |
| `src/components/creditos/stacked-bar-chart.tsx` | D3 stacked bar |
| `src/components/creditos/grouped-bar-chart.tsx` | D3 grouped/horizontal bar |
| `src/components/creditos/radar-chart.tsx` | D3 radar/spider |
| `src/components/creditos/progress-bar.tsx` | CSS progress bar |
| `src/components/creditos/chart-tooltip.tsx` | Shared D3 tooltip |

### Modified files (6)
| File | Change |
|---|---|
| `src/lib/reservas/types.ts` | Add `CreditUnit`, `CreditUnitStatus` |
| `src/lib/reservas/constants.ts` | Add status mappers + colors |
| `src/components/nav-bar.tsx` | Add "Créditos" link |
| `src/components/commission-treemap.tsx` | Import shared `useElementSize` |
| `src/components/payment-treemap.tsx` | Import shared `useElementSize` |
| `src/components/cash-flow-chart.tsx` | Import shared `useElementSize` |

### Already gitignored
- `pacreditos/` (done)

---

## Risks

1. **Natural key bridge**: `rv_units ↔ units ↔ sales` join via `(project_id, unit_number)`. If unit numbers differ between tables, financial columns will be NULL. Verify join row counts.
2. **Casa Elisa data gap**: CE credit-specific fields will be NULL until separately backfilled (not in pacreditos Excel).
3. **D3 chart LOC**: 5 new D3 components is ~60% of total effort. Each requires responsive sizing, hover tooltips, axis rendering, and theme consistency.
4. **New D3 dependencies**: `d3` v7 full bundle is already installed — no new packages needed.


---

## ADDENDUM 2026-03-20: BLT Torre B — Authoritative Correction

**Source:** Jorge (project owner), direct confirmation.
**Cross-reference:** `docs/creditos-33-units-investigation.md` (UPDATE 2026-03-20)

During the Créditos dashboard backfill investigation, 24 BLT Torre B units were flagged with credit data but no reservations. The "INFO PARA REPORTES" Excel sheet listed 58 rows of client data, suggesting 58 hidden sales. Upon authoritative review:

1. **As of 2026-03-20, only 3 confirmed sales exist in Bosque Las Tapias — Torre B.** The 58 rows in "INFO PARA REPORTES" do NOT represent real sales. The confirmed count on that date is **3** (point-in-time figure, not a fixed ceiling).
2. **All existing BLT Torre B sales records will be dropped from the production database** to establish a clean baseline.
3. **Only the 3 confirmed sales (as of 2026-03-20) will be uploaded** as the sole BLT Torre B transactions. This is a point-in-time count — new sales will flow through the normal Orion reservation process.

Any prior references in this document to BLT Torre B having 11 hidden reservations (Category C), 13 orphan income markers (Category D), or 58 clients missing from the DB are **superseded** by this correction (2026-03-20).