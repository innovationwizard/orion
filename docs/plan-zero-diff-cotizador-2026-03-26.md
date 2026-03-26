# Plan: Zero-Diff Cotizador — Close All 37 Gaps

**Date:** 2026-03-26
**Status:** DRAFT — 0 open questions
**Prerequisite:** `docs/cotizador-diff-report-2026-03-26.md` (37 diffs inventoried)
**Goal:** 100% accuracy, 100% reliability — every number the app produces matches the real Excel cotizador for that project/tower/variant.
**Scope:** BEN, BLT, B5, CE, SE (5 projects). **Santa Elena onboarded** via migration 049 (2026-03-26) — project, 11 units, 5 reservations, cotizador config, salesperson all loaded.

---

## Table of Contents

1. [Design Principle](#1-design-principle)
2. [What Already Exists (Leverage)](#2-what-already-exists)
3. [Phase 1 — Per-Project Cotizador Config Table](#phase-1--per-project-cotizador-config-table-migration-047)
4. [Phase 2 — Fix Computation Engine](#phase-2--fix-computation-engine-cotizadorts)
5. [Phase 3 — Thread Config Through All Consumers](#phase-3--thread-config-through-all-consumers)
6. [Phase 4 — Structural & Presentation Gaps](#phase-4--structural--presentation-gaps)
7. [Phase 5 — Per-Reservation Financial Terms](#phase-5--per-reservation-financial-terms-migration-048)
8. [Phase 6 — Admin Config UI](#phase-6--admin-config-ui)
9. [Phase 7 — Per-Project Cotizador Reports + PDF](#phase-7--per-project-cotizador-reports--pdf)
10. [Phase 8 — Validation & Acceptance Test](#phase-8--validation--acceptance-test)
11. [Diff Coverage Matrix](#diff-coverage-matrix)
12. [Dependency Graph](#dependency-graph)
13. [Files Affected](#files-affected)
14. [Open Questions](#open-questions)

---

## 1. Design Principle

**One config row per cotizador variant.** The Excel reality is: each project has 1-4 cotizador tabs with different parameters (per tower, per unit type, or per pricing mode). The data model must support this granularity.

The config is keyed by `(project_id, tower_id?, unit_type?)`:
- `project_id` required (every config belongs to a project)
- `tower_id` nullable (NULL = project-wide default; non-null = tower-specific override)
- `unit_type` nullable (NULL = all unit types; non-null = type-specific, e.g., "Local comercial")

This mirrors the Excel structure exactly:
| Excel Tab | project_id | tower_id | unit_type |
|---|---|---|---|
| BEN Cotizador TA | BEN | Torre A | NULL |
| BEN Cotizador TB | BEN | Torre B | NULL |
| BLT Torre B | BLT | Torre B | NULL |
| BLT Torre C | BLT | Torre C | NULL |
| B5 automático 2025 | B5 | NULL | NULL |
| B5 aptos Terraza | B5 | NULL | Terraza |
| CE Automatico | CE | NULL | NULL |
| CE 208 | CE | NULL | 208 |
| CE Locales | CE | NULL | Local |

**Santa Elena onboarded** (migration 049) — SE config row seeded with full parameters (USD, 30% enganche, 8.50% rate, quarterly IUSI, seguro included, 2x income on cuota_mensual).

**Resolution order:** When computing a cotización for a unit, find the most specific matching config:
1. Exact match on `(project_id, tower_id, unit_type)` → use it
2. Match on `(project_id, tower_id, NULL)` → use it
3. Match on `(project_id, NULL, unit_type)` → use it
4. Match on `(project_id, NULL, NULL)` → use it (project default)
5. No match → use hardcoded `COTIZADOR_DEFAULTS` (backward-compatible fallback)

---

## 2. What Already Exists

These columns/tables already exist and will be leveraged (not re-created):

| What | Where | Purpose |
|---|---|---|
| `rv_units.valor_inmueble` | Migration 042 | IUSI tax base — fixes DIFF-F03 |
| `rv_units.price_list` | Migration 018 | Unit price |
| `reservations.deposit_amount` | Migration 018 | Actual reserva amount paid |
| `reservations.cuotas_enganche` | Migration 042 | Installment count per reservation |
| `towers.delivery_date` | Migration 018 | Delivery date per tower — fixes DIFF-S03 |
| `projects.slug` | Migration 018 | Project identifier for config lookup |
| `system_settings` | Migration 031 | Pattern for admin-configurable settings |
| `rv_units.area_total` | Migration 018 | For mantenimiento calculation |

---

## Phase 1 — Per-Project Cotizador Config Table (Migration 047)

**Closes:** DIFF-F01, F04, F05, F06, F10, F11, F12, F13, INCON-01 through INCON-05, all §3 parameter diffs

### Migration SQL

```sql
CREATE TABLE IF NOT EXISTS cotizador_configs (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id      uuid NOT NULL REFERENCES projects(id),
  tower_id        uuid REFERENCES towers(id),
  unit_type       text,                          -- NULL = default for project/tower
  label           text NOT NULL,                 -- display name, e.g. "Cotizador automático 2025"

  -- Currency
  currency        text NOT NULL DEFAULT 'GTQ',   -- 'GTQ' or 'USD'

  -- Enganche
  enganche_pct    numeric(5,4) NOT NULL,         -- e.g. 0.0700 = 7%
  reserva_default numeric(14,2) NOT NULL,        -- e.g. 3000.00
  installment_months integer NOT NULL,           -- e.g. 24

  -- Rounding rules (per-project, per INCON-01)
  round_enganche_q100    boolean NOT NULL DEFAULT false,  -- ROUNDUP enganche to Q100?
  round_cuota_q100       boolean NOT NULL DEFAULT false,  -- ROUNDUP cuota to Q100?
  round_cuota_q1         boolean NOT NULL DEFAULT false,  -- ROUNDUP cuota to Q1?
  round_saldo_q100       boolean NOT NULL DEFAULT false,  -- ROUNDUP saldo to Q100?

  -- Bank financing
  bank_rates      numeric(6,4)[] NOT NULL,       -- e.g. {0.0500, 0.0550, 0.0726, 0.0850}
  bank_rate_labels text[],                       -- e.g. {"FHA Tipo A","FHA Tipo B/C","Sin carencia FHA","Crédito directo"}
  plazos_years    integer[] NOT NULL,            -- e.g. {40,30,25,20}

  -- Cuota mensual composition (per INCON-03, INCON-04)
  include_seguro_in_cuota   boolean NOT NULL DEFAULT false,  -- include insurance in monthly total?
  include_iusi_in_cuota     boolean NOT NULL DEFAULT true,   -- include IUSI in monthly total?
  seguro_enabled            boolean NOT NULL DEFAULT false,  -- show insurance line at all?
  seguro_base               text NOT NULL DEFAULT 'price',   -- 'price' or 'monto_financiar'
  iusi_frequency            text NOT NULL DEFAULT 'monthly', -- 'monthly' or 'quarterly'

  -- Income requirement (per INCON-02)
  income_multiplier     numeric(4,2) NOT NULL DEFAULT 2.00,
  income_base           text NOT NULL DEFAULT 'cuota_banco', -- 'cuota_banco' or 'cuota_mensual'

  -- Escrituracion (per INCON-05)
  inmueble_pct          numeric(5,4) NOT NULL DEFAULT 0.7000,
  timbres_rate          numeric(5,4) NOT NULL DEFAULT 0.0300, -- 3% on acciones
  use_pretax_extraction boolean NOT NULL DEFAULT true,        -- ÷1.093 method

  -- Mantenimiento
  mantenimiento_per_m2  numeric(8,2),            -- NULL = not shown, e.g. 16.00 for B5
  mantenimiento_label   text,                    -- e.g. "Pendiente" for BLT

  -- Disclaimers
  disclaimers           text[],                  -- array of disclaimer strings
  validity_days         integer DEFAULT 7,       -- "Cotización válida X días"

  -- Metadata
  is_active     boolean NOT NULL DEFAULT true,
  display_order integer NOT NULL DEFAULT 0,
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now(),

  -- Uniqueness: one config per (project, tower, unit_type) combo
  UNIQUE(project_id, tower_id, unit_type)
);

COMMENT ON TABLE cotizador_configs IS
  'Per-project/tower/unit-type cotizador configuration. Each row mirrors one Excel cotizador tab.';

-- RLS: all authenticated read, admin write
ALTER TABLE cotizador_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY cotizador_configs_read ON cotizador_configs
  FOR SELECT TO authenticated USING (true);

CREATE POLICY cotizador_configs_write ON cotizador_configs
  FOR ALL TO authenticated
  USING (jwt_role() IN ('master', 'torredecontrol'))
  WITH CHECK (jwt_role() IN ('master', 'torredecontrol'));
```

### Seed Data

Seeded from direct extraction of the 13 Excel cotizador tabs (all values verified in `docs/cotizador-diff-report-2026-03-26.md`):

```sql
-- Benestare — 4 towers, identical config except tower_id
-- (Using placeholder UUIDs — real tower IDs from production DB required)
INSERT INTO cotizador_configs (
  project_id, tower_id, unit_type, label,
  currency, enganche_pct, reserva_default, installment_months,
  round_enganche_q100, round_cuota_q100, round_cuota_q1, round_saldo_q100,
  bank_rates, bank_rate_labels, plazos_years,
  include_seguro_in_cuota, include_iusi_in_cuota, seguro_enabled, seguro_base, iusi_frequency,
  income_multiplier, income_base,
  inmueble_pct, timbres_rate, use_pretax_extraction,
  mantenimiento_per_m2, mantenimiento_label,
  disclaimers, validity_days, display_order
) VALUES
-- BEN Tower A (repeat for TB, TC, TD with respective tower_ids)
(
  '019c7d10-8f5a-74c7-b3df-c2151ad8a376', -- BEN project_id
  NULL, -- tower_id: INSERT REAL TOWER ID FOR TORRE A
  NULL, -- unit_type: all
  'Cotizador Benestare Torre A',
  'GTQ', 0.0500, 1500.00, 7,
  true, false, true, true,                           -- BEN rounds enganche Q100, cuota Q1, saldo Q100
  '{0.0500,0.0550,0.0726,0.0850}',
  '{"Mi primera Casa Tipo A","FHA Tipo B y C","Sin carencia FHA","Crédito directo"}',
  '{40,30,25,20}',
  false, true, false, 'price', 'monthly',            -- no seguro, IUSI monthly
  2.00, 'cuota_banco',                                -- 2x on bank cuota only
  0.7000, 0.0300, true,                               -- 70/30, 3% timbres, ÷1.093
  NULL, NULL,                                         -- no mantenimiento
  '{"Precios sujetos a cambio sin previo aviso","Cotización válida 7 días","La reserva no es reembolsable","Metros cuadrados son aproximados","Imágenes son de referencia"}',
  7, 1
);

-- Bosque Las Tapias — Torre C
-- (
--   BLT project_id, Torre C tower_id, NULL,
--   'Cotizador BLT Torre C',
--   'GTQ', 0.0700, 3000.00, 24,
--   true, false, true, true,
--   '{0.0550}', '{"FHA"}', '{30,25,20,15,10}',
--   false, true, false, 'price', 'monthly',
--   2.00, 'cuota_banco',
--   0.7000, 0.0300, true,
--   NULL, 'Pendiente',
--   '{...disclaimers...}', 7, 2
-- );

-- Bosque Las Tapias — Torre B
-- Same as Torre C except: installment_months=28

-- Boulevard 5 — automático 2025
-- (
--   B5 project_id, NULL, NULL,
--   'Cotizador B5 automático 2025',
--   'GTQ', 0.0700, 10000.00, 8,
--   true, true, false, true,                -- B5 rounds enganche Q100, cuota Q100, saldo Q100
--   '{0.0726}', '{"FHA"}', '{30,25,20,15,10}',
--   false, true, false, 'price', 'monthly',
--   2.00, 'cuota_banco',
--   0.7000, 0.0300, true,
--   16.00, NULL,                             -- mantenimiento Q16/m²
--   '{...}', 7, 3
-- );

-- Boulevard 5 — aptos Terraza
-- Same except: round_enganche_q100=false, installment_months=7

-- Casa Elisa — Automatico
-- (
--   CE project_id, NULL, NULL,
--   'Cotizador CE Automático',
--   'GTQ', 0.0500, 5000.00, 1,
--   false, false, false, false,              -- CE: no rounding
--   '{0.0726}', '{"FHA"}', '{30,25,17,15,10}',
--   false, true, false, 'price', 'monthly',
--   2.00, 'cuota_mensual',                   -- CE uses cuota_mensual (bank+IUSI)
--   0.7000, 0.0300, true,
--   NULL, NULL,
--   '{...}', 7, 4
-- );

-- Casa Elisa — 208
-- Same except: enganche_pct=0.1000, installment_months=2,
-- bank_rates='{0.0750}', seguro_enabled=true (informational),
-- include_seguro_in_cuota=false, seguro_base='price',
-- income_multiplier=2.50

-- Casa Elisa — Locales
-- Same except: enganche_pct=0.2000, installment_months=1,
-- bank_rates='{0.0750}', plazos_years='{1,5,10,20}',
-- inmueble_pct=1.0000, timbres_rate=0.0000,     -- 100% inmueble, no acciones
-- use_pretax_extraction=true (divides by 1.12 not 1.093)

-- Santa Elena — DONE (migration 049, 2026-03-26)
-- Seeded with: currency='USD', enganche_pct=0.3000, reserva_default=10000.00,
-- installment_months=15, bank_rates={0.0850}, bank_rate_labels={"Crédito Directo"},
-- plazos_years={25,20,15,10,5}, seguro_enabled=true, include_seguro_in_cuota=true,
-- include_iusi_in_cuota=false, iusi_frequency='quarterly', income_multiplier=2.00,
-- income_base='cuota_mensual', inmueble_pct=0.7000, round_*=all false.
```

**NOTE:** The commented-out INSERTs above use real parameter values extracted from Excel. The actual INSERT statements require real `tower_id` UUIDs from the production database. The migration script will use subqueries to look up tower IDs by name. I will NOT use placeholder UUIDs in production.

### API Route

`GET /api/reservas/cotizador-config?project=<slug>` — returns all active configs for a project.

Resolution logic lives client-side (or in a shared utility): given `(project_id, tower_id, unit_type)`, find the best matching config row.

---

## Phase 2 — Fix Computation Engine (`cotizador.ts`)

**Closes:** DIFF-F01, F02, F03, F04, F05, F06, F07, F08, F09, F11, F13, F14

### 2A. New Type: `CotizadorConfig`

```typescript
export interface CotizadorConfig {
  currency: 'GTQ' | 'USD';
  enganche_pct: number;
  reserva_default: number;
  installment_months: number;
  // Rounding
  round_enganche_q100: boolean;
  round_cuota_q100: boolean;
  round_cuota_q1: boolean;
  round_saldo_q100: boolean;
  // Bank
  bank_rates: number[];
  bank_rate_labels?: string[];
  plazos_years: number[];
  // Cuota composition
  include_seguro_in_cuota: boolean;
  include_iusi_in_cuota: boolean;
  seguro_enabled: boolean;
  seguro_base: 'price' | 'monto_financiar';
  iusi_frequency: 'monthly' | 'quarterly';
  // Income
  income_multiplier: number;
  income_base: 'cuota_banco' | 'cuota_mensual';
  // Escrituracion
  inmueble_pct: number;
  timbres_rate: number;
  use_pretax_extraction: boolean;
  // Mantenimiento
  mantenimiento_per_m2: number | null;
  mantenimiento_label: string | null;
  // Presentation
  disclaimers: string[];
  validity_days: number;
}
```

A `configFromDefaults()` function returns a `CotizadorConfig` populated from the current `COTIZADOR_DEFAULTS` — this is the fallback when no DB config exists.

### 2B. Rounding Utilities

```typescript
/** Round UP to nearest Q100 (Excel ROUNDUP(x, -2)). */
export function roundUpQ100(amount: number): number {
  return Math.ceil(amount / 100) * 100;
}

/** Round UP to nearest Q1 (Excel ROUNDUP(x, 0)). */
export function roundUpQ1(amount: number): number {
  return Math.ceil(amount);
}
```

### 2C. Refactored `computeEnganche()`

```typescript
export function computeEnganche(
  price: number,
  config: Pick<CotizadorConfig, 'enganche_pct' | 'round_enganche_q100' | 'round_cuota_q100' | 'round_cuota_q1'>,
  reserva: number,
  installment_months: number,
): EngancheResult {
  // 1. Enganche total — conditionally round to Q100
  let enganche_total = price * config.enganche_pct;
  if (config.round_enganche_q100) enganche_total = roundUpQ100(enganche_total);
  else enganche_total = Math.round(enganche_total);

  // 2. Enganche neto
  const enganche_neto = Math.max(0, enganche_total - reserva);

  // 3. Cuota — conditionally round to Q100 or Q1
  let cuota_enganche: number;
  if (installment_months <= 0) {
    cuota_enganche = enganche_neto;
  } else if (config.round_cuota_q100) {
    cuota_enganche = roundUpQ100(enganche_neto / installment_months);
  } else if (config.round_cuota_q1) {
    cuota_enganche = roundUpQ1(enganche_neto / installment_months);
  } else {
    cuota_enganche = Math.round(enganche_neto / installment_months);
  }

  // 4. Last-installment adjustment (DIFF-F02)
  const installments: { number: number; amount: number }[] = [
    { number: 0, amount: reserva },
  ];
  for (let i = 1; i <= installment_months; i++) {
    if (i === installment_months) {
      // Last installment absorbs rounding remainder
      const previous_sum = cuota_enganche * (installment_months - 1);
      installments.push({ number: i, amount: enganche_neto - previous_sum });
    } else {
      installments.push({ number: i, amount: cuota_enganche });
    }
  }

  return { enganche_total, reserva, enganche_neto, cuota_enganche, installments };
}
```

### 2D. Refactored `computeFinancingMatrix()`

```typescript
export function computeFinancingMatrix(
  price: number,
  enganche_total: number,
  config: Pick<CotizadorConfig,
    'bank_rates' | 'bank_rate_labels' | 'plazos_years' |
    'round_saldo_q100' | 'seguro_enabled' | 'seguro_base' |
    'include_seguro_in_cuota' | 'include_iusi_in_cuota' |
    'iusi_frequency' | 'income_multiplier' | 'income_base'
  >,
  valor_inmueble: number | null,  // from rv_units.valor_inmueble — IUSI base
): FinancingScenario[] {
  // Saldo a financiar — conditionally round to Q100 (DIFF-F11)
  let monto_financiar = Math.max(0, price - enganche_total);
  if (config.round_saldo_q100) monto_financiar = roundUpQ100(monto_financiar);

  // IUSI base = valor_inmueble if available (DIFF-F03)
  const iusi_base = valor_inmueble ?? price;
  const iusi_monthly = Math.round((iusi_base * 0.009) / 12);
  const iusi_quarterly = Math.round((iusi_base * 0.009) / 4);

  // Insurance (DIFF-F04)
  const seguro_calc_base = config.seguro_base === 'price' ? price : monto_financiar;
  const seguro_monthly = config.seguro_enabled
    ? Math.round((seguro_calc_base * 0.0035) / 12)
    : 0;

  const scenarios: FinancingScenario[] = [];
  for (let ri = 0; ri < config.bank_rates.length; ri++) {
    const rate = config.bank_rates[ri];
    const rate_label = config.bank_rate_labels?.[ri] ?? `${(rate * 100).toFixed(2)}%`;

    for (const plazo of config.plazos_years) {
      const cuota_banco = Math.round(pmt(rate, plazo, monto_financiar));

      // Cuota mensual composition (DIFF-F05)
      let total_monthly = cuota_banco;
      if (config.include_iusi_in_cuota) total_monthly += iusi_monthly;
      if (config.include_seguro_in_cuota) total_monthly += seguro_monthly;

      // Income requirement (DIFF-F06)
      const income_base_amount = config.income_base === 'cuota_banco'
        ? cuota_banco
        : total_monthly;
      const ingreso_requerido = Math.round(income_base_amount * config.income_multiplier);

      scenarios.push({
        rate,
        rate_label,
        plazo_years: plazo,
        monto_financiar,
        cuota_banco,
        iusi_monthly: config.include_iusi_in_cuota ? iusi_monthly : 0,
        iusi_quarterly: config.iusi_frequency === 'quarterly' ? iusi_quarterly : 0,
        seguro_monthly: config.seguro_enabled ? seguro_monthly : 0,
        seguro_informational: config.seguro_enabled && !config.include_seguro_in_cuota,
        total_monthly,
        ingreso_requerido,
      });
    }
  }
  return scenarios;
}
```

### 2E. Refactored `computeEscrituracion()`

```typescript
export function computeEscrituracion(
  price: number,
  config: Pick<CotizadorConfig, 'inmueble_pct' | 'timbres_rate' | 'use_pretax_extraction'>,
): EscrituracionResult {
  const pct_inmueble = config.inmueble_pct;
  const pct_acciones = 1 - pct_inmueble;

  let valor_inmueble_sin_iva: number;
  let valor_acciones: number;

  if (config.use_pretax_extraction) {
    // DIFF-F07: Excel method — extract pre-tax base first
    // Factor = pct_inmueble × 1.12 + pct_acciones × (1 + timbres_rate)
    const tax_factor = pct_inmueble * 1.12 + pct_acciones * (1 + config.timbres_rate);
    const base = price / tax_factor;
    valor_inmueble_sin_iva = Math.round(base * pct_inmueble);
    valor_acciones = Math.round(base * pct_acciones);
  } else {
    // Legacy app method (kept for backward compat, should not be used)
    valor_inmueble_sin_iva = Math.round(price * pct_inmueble);
    valor_acciones = Math.round(price * pct_acciones);
  }

  const iva_inmueble = Math.round(valor_inmueble_sin_iva * 0.12);                    // 12% IVA
  const timbres_acciones = Math.round(valor_acciones * config.timbres_rate);           // DIFF-F08: 3% timbres
  const valor_inmueble_con_iva = valor_inmueble_sin_iva + iva_inmueble;
  const valor_acciones_con_timbres = valor_acciones + timbres_acciones;

  return {
    pct_inmueble,
    pct_acciones,
    valor_inmueble_sin_iva,
    iva_inmueble,
    valor_inmueble_con_iva,
    valor_acciones,
    timbres_acciones,                    // NEW
    valor_acciones_con_timbres,          // NEW
    total_sin_impuesto: valor_inmueble_sin_iva + valor_acciones,
    total_con_impuesto: valor_inmueble_con_iva + valor_acciones_con_timbres,
  };
}
```

### 2F. Mantenimiento Calculation (DIFF-F14)

```typescript
export function computeMantenimiento(
  area_total: number,
  per_m2: number | null,
): number | null {
  if (per_m2 == null || area_total <= 0) return null;
  return Math.ceil(per_m2 * area_total); // ROUNDUP per B5 Excel
}
```

### 2G. Updated Types

`FinancingScenario` gains:
- `rate_label: string`
- `iusi_quarterly: number`
- `seguro_informational: boolean` (shown but not in total)

`EscrituracionResult` gains:
- `timbres_acciones: number`
- `valor_acciones_con_timbres: number`

---

## Phase 3 — Thread Config Through All Consumers

**Closes:** Remaining parameter diffs (all §3 diffs)

### 3A. New Hook: `useCotizadorConfig(projectSlug)`

```typescript
export function useCotizadorConfig(projectSlug: string | undefined) {
  // Fetches GET /api/reservas/cotizador-config?project=<slug>
  // Returns CotizadorConfig[] for that project
  // Memoized + cached
}

export function resolveConfig(
  configs: CotizadorConfig[],
  towerId: string | null,
  unitType: string | null,
): CotizadorConfig {
  // Resolution order: exact → tower-only → type-only → project-default → COTIZADOR_DEFAULTS
}
```

### 3B. Refactor `cotizador-client.tsx`

1. When user selects a project → load configs via `useCotizadorConfig(slug)`
2. When user selects a unit → `resolveConfig(configs, unit.tower_id, unit.unit_type)`
3. Initialize `enganchePct`, `reserva`, `installmentMonths` from resolved config (not from `COTIZADOR_DEFAULTS`)
4. Pass resolved config to all `compute*()` functions
5. Pass `unit.valor_inmueble` (from `UnitFull`) to `computeFinancingMatrix`
6. Show currency symbol from config (`Q` or `$`)

### 3C. Refactor `financing-matrix.tsx`

- Accept `config: CotizadorConfig` as prop (instead of reading `COTIZADOR_DEFAULTS`)
- Render one row per `(rate, rate_label)` with columns per `plazos_years`
- Show `iusi_quarterly` as separate line when `iusi_frequency === 'quarterly'`
- Show `seguro_monthly` as "(informativo)" when `seguro_informational === true`
- Show `rate_label` next to each rate (e.g., "5.00% — FHA Tipo A")

### 3D. Refactor `escrituracion-panel.tsx`

- Accept `config: CotizadorConfig` as prop
- Show timbres fiscales line (DIFF-F08)
- For locales (inmueble_pct = 1.0): hide acciones section entirely (DIFF-F09)
- Default inmueble_pct from config (not hardcoded 0.70)

### 3E. Refactor PCV (`pcv-client.tsx`)

- Look up config by reservation's `project_id` + `tower_id` + `unit_type`
- Use `reservation.enganche_pct ?? config.enganche_pct` (per-reservation override or project default)
- Use `reservation.cuotas_enganche ?? config.installment_months`
- Use `reservation.deposit_amount ?? config.reserva_default`
- Pass config to all `compute*()` functions
- Escrituracion: use ÷1.093 method via config

### 3F. Refactor Carta de Pago (`carta-pago-client.tsx`)

Same pattern as PCV.

### 3G. Currency Support

- `formatCurrency()` in `constants.ts` currently only supports GTQ (`Q`).
- Add `formatCurrency(amount, currency: 'GTQ' | 'USD')` overload.
- `$` prefix for USD, `Q` prefix for GTQ. No decimal places for GTQ (existing), 2 decimal places for USD.

---

## Phase 4 — Structural & Presentation Gaps

**Closes:** DIFF-S01, S02, S03, S04, S05, S06, S07, S08

### 4A. Client Name (DIFF-S01)

The cotizador page currently has no client identity. Two options:

**Option A — Anonymous (current, keep for interactive tool):** The `/cotizador` page stays anonymous. Client name is added only in the per-project report (Phase 7) and print view.

**Option B — Optional client name field:** Add a text input "Nombre del cliente" at the top. Optional. Included in print output. Not persisted.

**Recommendation:** Option B. A single text input is trivial and makes the print output usable as a client document.

### 4B. Salesperson Identity (DIFF-S02)

- If user is authenticated (salesperson via `useCurrentSalesperson()`), auto-fill their name.
- If anonymous access, show text input.
- Display as "Asesor: {name}" in print output.
- Signature line in print footer.

### 4C. Delivery Date (DIFF-S03)

Already in DB: `towers.delivery_date` → available in `UnitFull.tower_delivery_date`.

Display: "Fecha de entrega estimada: {tower_delivery_date}" in the unit summary section.

### 4D. Disclaimers (DIFF-S04)

Loaded from `config.disclaimers[]`. Rendered as a numbered list at the bottom of the cotización.

In print view, rendered in smaller font as footer content.

### 4E. Mantenimiento (DIFF-S05)

Computed from `computeMantenimiento(unit.area_total, config.mantenimiento_per_m2)`.

If result is non-null, show as "Cuota de mantenimiento estimada: {amount}/mes".

If `config.mantenimiento_label` is set (e.g., "Pendiente"), show that instead of a number.

### 4F. FHA Rate Labels (DIFF-S07)

Already handled in Phase 3C — `rate_label` displayed next to each rate in the financing matrix.

### 4G. Quotation Validity & Date (DIFF-S08)

- Display current date: "Fecha: {today}" at top.
- Display validity: "Cotización válida {config.validity_days} días" in footer/disclaimers.

### 4H. Payment Tracking (DIFF-S06)

**Deferred.** This is a B5-specific Excel feature (paid-to-date, remaining). The app already has payment tracking in the admin reservation detail. Adding it to the cotizador would duplicate functionality. **LOW priority — defer.**

---

## Phase 5 — Per-Reservation Financial Terms (Migration 048)

**Closes:** Bug in PCV/Carta de Pago using hardcoded defaults for all reservations

### Migration

```sql
ALTER TABLE reservations
  ADD COLUMN IF NOT EXISTS sale_price numeric(14,2),
  ADD COLUMN IF NOT EXISTS enganche_pct numeric(5,4),
  ADD COLUMN IF NOT EXISTS installment_months integer,
  ADD COLUMN IF NOT EXISTS inmueble_pct numeric(5,4);

-- cuotas_enganche already exists (migration 042) — alias for installment_months
-- deposit_amount already exists (migration 018) — actual reserva paid

COMMENT ON COLUMN reservations.sale_price IS 'Effective sale price (may differ from price_list)';
COMMENT ON COLUMN reservations.enganche_pct IS 'Down payment % agreed for this reservation';
COMMENT ON COLUMN reservations.installment_months IS 'Enganche installment count (supersedes cuotas_enganche)';
COMMENT ON COLUMN reservations.inmueble_pct IS 'Deed split: property portion %';
```

**Backfill:** All new columns set to NULL for existing reservations. NULL means "use project config default." This is the correct approach — we do not know the actual negotiated terms for 644 existing reservations.

**Migration note:** `cuotas_enganche` (042) and `installment_months` (048) overlap. Consolidate: use `cuotas_enganche` as the canonical column name (it already exists and has data), add `enganche_pct` and `sale_price` and `inmueble_pct` only. Do NOT add a duplicate `installment_months`.

Revised migration:

```sql
ALTER TABLE reservations
  ADD COLUMN IF NOT EXISTS sale_price numeric(14,2),
  ADD COLUMN IF NOT EXISTS enganche_pct numeric(5,4),
  ADD COLUMN IF NOT EXISTS inmueble_pct numeric(5,4);
```

`cuotas_enganche` already exists. `deposit_amount` already exists. Three new columns only.

### Code Changes

- PCV: `reservation.enganche_pct ?? config.enganche_pct` (reservation override or project config)
- Carta de Pago: same
- Reservation creation form: optional fields for sale_price, enganche_pct, cuotas_enganche, inmueble_pct
- Admin reservation detail: editable financial terms section
- `v_reservations_pending`: append `sale_price`, `enganche_pct`, `inmueble_pct`

---

## Phase 6 — Admin Config UI

**Route:** `/admin/cotizador-config`
**Access:** master + torredecontrol only

### Features

1. **List view:** All configs grouped by project. Each row shows: project, tower, unit_type, enganche%, reserva, cuotas, rates, plazos.
2. **Edit:** Inline editing or modal form for each config row.
3. **Create:** Add new config variant (e.g., new tower for a project).
4. **Toggle active/inactive.**
5. **Audit trail:** `logAudit()` on create/update (existing audit infrastructure).

### API Routes

- `GET /api/admin/cotizador-config` — all configs (admin only)
- `POST /api/admin/cotizador-config` — create
- `PATCH /api/admin/cotizador-config/[id]` — update
- `DELETE /api/admin/cotizador-config/[id]` — soft delete (set `is_active = false`)

### Permissions

Add to `src/lib/permissions.ts`:
```typescript
cotizador_config: {
  view:   ['master', 'torredecontrol'],
  create: ['master', 'torredecontrol'],
  update: ['master', 'torredecontrol'],
  delete: ['master', 'torredecontrol'],
},
```

---

## Phase 7 — Per-Project Cotizador Reports + PDF

**Closes:** DIFF-S01 (client name), DIFF-S02 (salesperson), transcript requirement A:728-729

### 7A. Print View for Interactive Cotizador

- "Imprimir / Compartir" button on `/cotizador` page
- Print CSS: single page, company header, unit details, enganche schedule, financing matrix, escrituracion, mantenimiento, disclaimers, salesperson name, signature line, date, validity
- Uses `@media print` styles (same pattern as PCV/Carta de Pago)

### 7B. Per-Project Report Route

- Route: `/cotizador/reporte/[project_slug]`
- Loads all AVAILABLE units for the project
- Groups by tower
- For each unit: shows price, enganche at project defaults, financing scenarios at project default rate, escrituracion summary
- Print-optimized: one unit per page or compact table format
- Header: company logo, project name, date, "Cotización válida {N} días"
- Footer: disclaimers from config

---

## Phase 8 — Validation & Acceptance Test

**Goal:** Prove zero diffs.

### 8A. Automated Snapshot Tests

For each of the 9 in-scope Excel cotizador tabs (BEN×4, BLT×2, B5×2, CE×3 minus hidden contado), create a test case:
- Input: real unit price from that project + the seeded config
- Expected: exact values from the Excel (enganche, cuota, saldo, PMT at each plazo, IUSI, seguro, cuota mensual, income requirement, escrituracion split)
- Assert all values match within Q1 tolerance

### 8B. Manual Validation Checklist

For each project, pick one real unit and compare:
1. App cotización output (screenshot)
2. Excel cotizador tab with same unit (screenshot)
3. Verify every number matches

### 8C. Definition of Done

The cotizador is at zero diffs when:
1. All 14 formula diffs produce identical results to Excel
2. All 10 parameter diffs are resolved via per-project config
3. All 8 structural gaps are present in the UI (except DIFF-S06, deferred)
4. All 5 cross-project inconsistencies are modeled as config variations
5. PCV and Carta de Pago use per-reservation terms (not hardcoded)
6. Snapshot tests pass for all 10 in-scope cotizador variants (BEN×4, BLT×2, B5×2, CE×3 minus hidden, SE×1)
7. Manual validation passes for at least one unit per in-scope project (BEN, BLT, B5, CE, SE)

---

## Diff Coverage Matrix

Every diff from `cotizador-diff-report-2026-03-26.md` mapped to the phase that closes it:

| Diff ID | Description | Phase | How |
|---|---|---|---|
| **DIFF-F01** | Rounding ROUNDUP vs Math.round | 2B, 2C | Per-config rounding flags + `roundUpQ100()`/`roundUpQ1()` |
| **DIFF-F02** | Missing last-installment adjustment | 2C | Last installment = `enganche_neto - sum(previous)` |
| **DIFF-F03** | IUSI base (valor_inmueble vs price) | 2D | Use `rv_units.valor_inmueble` as IUSI base |
| **DIFF-F04** | Insurance base/presence varies | 1, 2D | `seguro_enabled`, `seguro_base`, `include_seguro_in_cuota` per config |
| **DIFF-F05** | Cuota mensual composition varies | 1, 2D | `include_seguro_in_cuota`, `include_iusi_in_cuota` per config |
| **DIFF-F06** | Income multiplier 2x/2.5x vs 3x | 1, 2D | `income_multiplier`, `income_base` per config |
| **DIFF-F07** | Escrituracion ÷1.093 missing | 2E | `use_pretax_extraction` + dynamic `tax_factor` |
| **DIFF-F08** | Acciones 3% timbres vs 0% | 2E | `timbres_rate` per config |
| **DIFF-F09** | Locales 100% inmueble | 1, 2E, 3D | `inmueble_pct=1.0`, `timbres_rate=0` in CE-Locales config |
| **DIFF-F10** | Single rate vs 4×4 grid | 1, 3C | Config has 1-4 rates; matrix adapts dynamically |
| **DIFF-F11** | Saldo rounding missing | 2D | `round_saldo_q100` per config |
| **DIFF-F12** | Rate source differs per project | 1 | `bank_rates[]` per config row |
| **DIFF-F13** | SE IUSI quarterly vs monthly | 1 (mig 049) | SE config: `iusi_frequency='quarterly'`, `include_iusi_in_cuota=false` |
| **DIFF-F14** | Metraje/mantenimiento calc | 1, 2F, 4E | `mantenimiento_per_m2` per config + `computeMantenimiento()` |
| **DIFF-S01** | Client name missing | 4A | Optional text input, shown in print |
| **DIFF-S02** | Salesperson missing | 4B | Auto-fill from auth or text input |
| **DIFF-S03** | Delivery date missing | 4C | Already in DB: `towers.delivery_date` |
| **DIFF-S04** | Disclaimers missing | 1, 4D | `disclaimers[]` per config, rendered in footer |
| **DIFF-S05** | Mantenimiento missing | 1, 4E | Config + computation |
| **DIFF-S06** | Payment tracking missing | **DEFERRED** | LOW priority, duplicates admin functionality |
| **DIFF-S07** | FHA rate labels missing | 1, 3C | `bank_rate_labels[]` per config |
| **DIFF-S08** | Validity/date missing | 1, 4G | `validity_days` per config, date auto-generated |
| **INCON-01** | Rounding not uniform | 1 | 4 boolean rounding flags per config row |
| **INCON-02** | Income multiplier not uniform | 1 | `income_multiplier` + `income_base` per config |
| **INCON-03** | Insurance not uniform | 1 | `seguro_enabled` + `include_seguro_in_cuota` per config |
| **INCON-04** | IUSI treatment not uniform | 1 | `iusi_frequency` + `include_iusi_in_cuota` per config |
| **INCON-05** | Escrituracion split not uniform | 1 | `inmueble_pct` + `timbres_rate` per config |

**36 of 37 diffs closed. 1 deferred:**
- **DIFF-S06** — Payment tracking (LOW priority, duplicates admin functionality)

Previously deferred, now closed (migration 049, 2026-03-26):
- ~~**DIFF-F13** — SE IUSI quarterly~~ → **CLOSED.** SE cotizador_config seeded with `iusi_frequency: 'quarterly'`.
- ~~SE-specific currency/parameter diffs~~ → **CLOSED.** SE config seeded: USD, 30% enganche, $10,000 reserva, 15 cuotas, 8.50% rate, {25,20,15,10,5} plazos, seguro included, quarterly IUSI, 2x income on cuota_mensual.

---

## Dependency Graph

```
Phase 1 (DB: cotizador_configs table + seed)
  ↓
Phase 2 (Engine: fix cotizador.ts formulas)
  ↓
Phase 3 (Thread: wire config through all consumers)
  ↓ (can start in parallel with Phase 2)
Phase 4 (Presentation: client name, disclaimers, delivery date, etc.)
  ↓
Phase 5 (DB: per-reservation financial terms)
  ↓
Phase 6 (Admin UI for config management)
  ↓
Phase 7 (PDF: print views + per-project reports)
  ↓
Phase 8 (Validation: snapshot tests + manual QA)
```

**Critical path:** Phase 1 → Phase 2 → Phase 3. Everything else can parallel after Phase 3.

**Estimated effort:**
| Phase | Effort |
|---|---|
| 1. Config table + seed | ~3-4h |
| 2. Fix computation engine | ~3-4h |
| 3. Thread config through consumers | ~4-6h |
| 4. Structural/presentation | ~3-4h |
| 5. Per-reservation terms | ~2-3h |
| 6. Admin config UI | ~4-5h |
| 7. PDF/reports | ~4-6h |
| 8. Validation | ~2-3h |
| **Total** | **~25-35h** |

---

## Files Affected

| File | Phases | Change |
|---|---|---|
| `scripts/migrations/047_cotizador_configs.sql` | 1 | New: config table + seed |
| `scripts/migrations/048_reservation_financial_terms.sql` | 5 | New: 3 columns on reservations |
| `src/lib/reservas/cotizador.ts` | 2 | Rewrite: all 3 compute functions + new types + rounding utils |
| `src/lib/reservas/types.ts` | 1, 2, 5 | Add: CotizadorConfig, CotizadorConfigRow, updated FinancingScenario/EscrituracionResult |
| `src/lib/reservas/validations.ts` | 5, 6 | Add: Zod schemas for config CRUD + reservation financial terms |
| `src/lib/reservas/constants.ts` | 3G | Update: `formatCurrency()` with currency param |
| `src/lib/permissions.ts` | 6 | Add: `cotizador_config` resource |
| `src/hooks/use-cotizador-config.ts` | 3A | New: hook to fetch + resolve config |
| `src/app/cotizador/cotizador-client.tsx` | 3B, 4 | Major refactor: load config, wire params, add fields |
| `src/app/cotizador/financing-matrix.tsx` | 3C | Refactor: accept config prop, dynamic rates/plazos/labels |
| `src/app/cotizador/escrituracion-panel.tsx` | 3D | Refactor: accept config prop, timbres, locales handling |
| `src/app/cotizador/installment-table.tsx` | — | Minor: already generic, no changes needed |
| `src/app/admin/reservas/pcv/[id]/pcv-client.tsx` | 3E | Refactor: use per-reservation + config terms |
| `src/app/admin/reservas/carta-pago/[id]/carta-pago-client.tsx` | 3F | Refactor: same |
| `src/app/api/reservas/cotizador-config/route.ts` | 1 | New: GET authenticated |
| `src/app/api/admin/cotizador-config/route.ts` | 6 | New: CRUD admin |
| `src/app/api/admin/cotizador-config/[id]/route.ts` | 6 | New: PATCH/DELETE |
| `src/app/admin/cotizador-config/page.tsx` | 6 | New: admin management page |
| `src/app/cotizador/reporte/[slug]/page.tsx` | 7 | New: per-project report route |
| `src/app/reservar/reservation-form.tsx` | 5 | Add: financial terms section |
| `src/app/reservar/confirmation-modal.tsx` | 5 | Add: financial summary display |
| `src/components/nav-bar.tsx` | 6 | Add: "Config Cotizador" link for admin |

---

## Open Questions

**All resolved. Zero open questions.**

| Q# | Question | Resolution |
|---|---|---|
| Q1 | Locales escrituracion divisor (÷1.12 vs ÷1.093) | **Self-resolving.** Dynamic formula `tax_factor = pct_inmueble × 1.12 + pct_acciones × (1 + timbres_rate)` yields 1.12 when `inmueble_pct=1.0`. |
| Q2 | Santa Elena `valor_inmueble` for IUSI base | **CLOSED (migration 049).** SE units seeded with `valor_inmueble = 0.70 × (price / 1.093)`. IUSI base uses `rv_units.valor_inmueble`. |
| Q3 | Real tower UUIDs for seed data | **Self-resolving.** Migration uses subquery `(SELECT id FROM towers WHERE name = '...' AND project_id = '...')`. |

---

---

## Addendum: Migration 049 — Santa Elena Onboarding (2026-03-26)

Migration 049 (`scripts/migrations/049_santa_elena_seed.sql`) loads Santa Elena as the 5th project and closes the remaining SE-related diffs.

### Schema changes in migration 049:
- `ALTER TABLE rv_units ADD COLUMN IF NOT EXISTS area_lot numeric(10,2)` — lot/plot area for horizontal projects (casas)
- `CREATE OR REPLACE VIEW v_rv_units_full` — appends `u.area_lot` at end
- `UnitFull` TypeScript type updated with `area_lot: number | null`

### Data seeded:
- 1 project (Santa Elena, slug `santa-elena`)
- 1 tower ("Principal"), 1 floor ("Planta Baja")
- 11 units (Casa 1–11): 2 models (A: 491.91 m², B: 581 m²), prices $1,065K–$1,639.5K USD, lot areas 386–400.44 m²
- 1 salesperson (Luccia Calvo) + project assignment
- 5 clients, 5 reservations (4 CONFIRMED + 1 DESISTED), 5 reservation_clients
- 5 unit_status_log entries, 1 freeze_request (Casa 6 FROZEN)
- 1 cotizador_config row (full SE parameters from Excel)
- 1 lead_source ('Valla')
- `PROJECT_SLUGS` constant updated with `SE: "santa-elena"`

### Additional files changed:
| File | Change |
|---|---|
| `scripts/migrations/049_santa_elena_seed.sql` | New: schema + full SE seed |
| `src/lib/reservas/types.ts` | Added `area_lot: number \| null` to `UnitFull` |
| `src/lib/reservas/constants.ts` | Added `SE: "santa-elena"` to `PROJECT_SLUGS` |

---

*Supersedes `docs/plan-fix-cotizador-2026-03-26.md` (the earlier 7-phase plan). This plan is a complete rewrite grounded in the 37 diffs from `docs/cotizador-diff-report-2026-03-26.md`.*
