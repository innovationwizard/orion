# 081 — Zero-Diff Cotizador Overhaul

**Date:** 2026-03-26
**Scope:** Cotizador computation engine, per-project configuration, consumer refactors, admin UI, print view
**Prerequisite docs:** `docs/cotizador-diff-report-2026-03-26.md` (37 diffs), `docs/plan-zero-diff-cotizador-2026-03-26.md` (8-phase plan)

## Summary

Complete rewrite of the cotizador system to achieve zero diffs against the real Excel cotizadores used by each project. Previously, the app used a single set of hardcoded defaults for all projects. The real Excel cotizadores have 10+ parameter variations across BEN, BLT, B5, and CE — different rounding rules, bank rates, enganche percentages, cuota composition, income multipliers, escrituracion splits, and more.

This change introduces a per-project/tower/unit-type configuration system backed by a new `cotizador_configs` DB table, rewrites all computation functions to accept config, and threads the config through every consumer.

## Changes

### Migration 047 — `cotizador_configs` table
- New table: `cotizador_configs` (~30 columns) with `UNIQUE(project_id, tower_id, unit_type)` constraint
- Seeded 10 config rows from real Excel data: BEN×4 towers, BLT×2 towers, B5×2 variants (default + Terraza), CE×3 variants (default + 208 + Local)
- Tower IDs resolved via subqueries — no hardcoded UUIDs
- Appends `valor_inmueble` to `v_rv_units_full` view (IUSI tax base, migration 042 column)
- RLS: all authenticated read, master/torredecontrol write

### Migration 048 — Per-reservation financial terms
- 3 new columns on `reservations`: `sale_price`, `enganche_pct`, `inmueble_pct`
- All NULL for existing reservations (NULL = use project config default)
- Updates `v_reservations_pending` view to include these plus `cuotas_enganche`/`pipedrive_url` (from 042, not previously in view)

### Computation engine rewrite (`src/lib/reservas/cotizador.ts`)
- **`CotizadorConfig` interface** — 25+ fields covering all per-project variations
- **`configFromDefaults()`** — backward-compatible fallback from `COTIZADOR_DEFAULTS`
- **`roundUpQ100()` / `roundUpQ1()`** — Excel ROUNDUP equivalents (Math.ceil-based)
- **`computeEnganche()`** — now accepts config for rounding flags; includes last-installment adjustment to absorb rounding remainder
- **`computeFinancingMatrix()`** — accepts config for rates/plazos/composition; uses `valor_inmueble` as IUSI base; configurable seguro inclusion/base/informational flag; configurable income multiplier and base
- **`computeEscrituracion()`** — pre-tax extraction via dynamic `tax_factor` (÷1.093 for 70/30, ÷1.12 for 100/0); 3% timbres fiscales on acciones
- **`computeMantenimiento()`** — new function for HOA fee calculation (per m²)

### Config resolution system
- **API route:** `GET /api/reservas/cotizador-config?project=<slug>` — authenticated, returns active configs
- **Hook:** `useCotizadorConfigs(projectSlug)` — fetch + cache configs
- **`resolveConfig(configs, towerId, unitType)`** — 5-tier resolution: exact match → tower-only → type-only → project-default → hardcoded fallback
- **`useResolvedConfig()`** — memoized convenience hook

### Consumer refactors
- **`cotizador-client.tsx`** — loads configs via hook, resolves per selected unit, initializes params from config, passes to all sub-components; new client name + salesperson inputs; delivery date display; currency-aware formatting; print button + print CSS
- **`financing-matrix.tsx`** — accepts `config: CotizadorConfig` prop; renders bank rate labels; conditional IUSI monthly/quarterly display; seguro "informativo" flag; income multiplier/base display
- **`escrituracion-panel.tsx`** — accepts config prop; shows timbres fiscales on acciones; hides acciones row when 100% inmueble; currency-aware; column header adapts (IVA vs Impuestos)
- **`pcv-client.tsx`** — uses `configFromDefaults()` instead of hardcoded `COTIZADOR_DEFAULTS`; updated to new function signatures
- **`carta-pago-client.tsx`** — same pattern as PCV
- **`creditos-client.tsx`** — fixed type error from `formatCurrency` signature change (wrapped in lambda)

### Structural & presentation gaps
- Client name field (optional text input, shown in print)
- Salesperson name field (optional text input, shown in print footer with signature line)
- Delivery date from `towers.delivery_date` in unit summary
- Quotation date + validity days in header
- Disclaimers from config (rendered as bullet list)
- Mantenimiento section (area × per_m2 rate, configurable label)

### Admin config UI (Phase 6)
- **Page:** `/admin/cotizador-config` — grouped-by-project table with expandable detail rows
- **API:** `GET/POST /api/admin/cotizador-config`, `PATCH/DELETE /api/admin/cotizador-config/[id]`
- Active/inactive toggle per config row
- Full audit trail via `logAudit()`
- **Permissions:** `cotizador_config` resource added to SSOT matrix (admin-only: master + torredecontrol)
- **NavBar:** "Config Cotizador" link for admin roles

### Print view
- `@media print` styles: hides NavBar/inputs/controls, shows print footer (signature line, company name, validity)
- "Imprimir cotización" button visible when unit selected
- Break-inside-avoid on sections, 9pt tables, 8pt disclaimers

### Constants
- `formatCurrency()` updated: `formatCurrency(amount, currency?: "GTQ" | "USD")` — `$` prefix + 2 decimals for USD

## Diff coverage

**36 of 37 diffs closed.** 1 deferred:
- DIFF-S06 — Payment tracking (LOW priority, duplicates admin functionality)

Previously deferred, now closed by migration 049 (Santa Elena onboarding):
- ~~DIFF-F13~~ — SE IUSI quarterly → SE cotizador_config seeded with `iusi_frequency: 'quarterly'`
- ~~SE-specific currency/parameter diffs~~ → SE config seeded: USD, 30% enganche, 8.50% rate, quarterly IUSI, seguro included

## Files changed

| File | Change |
|---|---|
| `scripts/migrations/047_cotizador_configs.sql` | New |
| `scripts/migrations/048_reservation_financial_terms.sql` | New |
| `src/lib/reservas/cotizador.ts` | Rewritten |
| `src/lib/reservas/types.ts` | Added `CotizadorConfigRow`, `valor_inmueble` on `UnitFull` |
| `src/lib/reservas/constants.ts` | `formatCurrency()` currency param |
| `src/lib/permissions.ts` | Added `cotizador_config` resource |
| `src/hooks/use-cotizador-config.ts` | New |
| `src/app/cotizador/cotizador-client.tsx` | Major refactor |
| `src/app/cotizador/financing-matrix.tsx` | Refactored (config prop) |
| `src/app/cotizador/escrituracion-panel.tsx` | Refactored (config prop, timbres) |
| `src/app/admin/reservas/pcv/[id]/pcv-client.tsx` | Updated signatures |
| `src/app/admin/reservas/carta-pago/[id]/carta-pago-client.tsx` | Updated signatures |
| `src/app/creditos/creditos-client.tsx` | Type fix |
| `src/app/api/reservas/cotizador-config/route.ts` | New |
| `src/app/api/admin/cotizador-config/route.ts` | New |
| `src/app/api/admin/cotizador-config/[id]/route.ts` | New |
| `src/app/admin/cotizador-config/page.tsx` | New |
| `src/app/admin/cotizador-config/cotizador-config-client.tsx` | New |
| `src/components/nav-bar.tsx` | Added Config Cotizador link |

### Migration 049 — Santa Elena seed + `area_lot` column (same session)
- New column: `rv_units.area_lot` (numeric(10,2)) — lot/plot area for horizontal projects (casas)
- Updated `v_rv_units_full` view: appends `u.area_lot` at end
- Updated `UnitFull` TypeScript type: `area_lot: number | null`
- Full Santa Elena project seed: project, tower, floor, 11 units, salesperson (Luccia Calvo), 5 clients, 5 reservations (4 CONFIRMED + 1 DESISTED), reservation_clients, unit_status_log, freeze_request, cotizador_config (USD), lead_source ('Valla')
- `PROJECT_SLUGS` updated: `SE: "santa-elena"`

| File | Change |
|---|---|
| `scripts/migrations/049_santa_elena_seed.sql` | New |
| `src/lib/reservas/types.ts` | Added `area_lot` to `UnitFull` |
| `src/lib/reservas/constants.ts` | Added SE to `PROJECT_SLUGS` |
