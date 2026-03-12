# 049 — Build the Missing SSOT Domains (Plan)

**Date:** 2026-03-11
**Status:** COMPLETED — see [050](050_2026-03-11_ssot-domains-implementation.md) for implementation details
**Author:** Jorge Luis Contreras Herrera

## Context

The mission: obliterate Pati's Excel dependency. The SSOT xlsx workbooks define 10 core domains — we've built 4 (Disponibilidad, Reservas, Desistimientos, Control de Pagos). Six remain:

1. **Cotizador** — quotation calculator (daily use by salespeople)
2. **Integracion** — pipeline summary by tower (monthly management reporting)
3. **Ritmo de Ventas** — sales velocity charts (monthly reporting)
4. **Referidos** — referral tracking table (ongoing)
5. **Buyer Persona** — customer demographics (CRM extension)
6. **Valorizacion** — price appreciation history (strategic pricing)

## Phasing

**Phase A** — No new DB tables. Pure UI + computed views:
1. Extract shared `<NavBar>` component (prerequisite — stops copy-pasting nav in 10+ files)
2. Cotizador (client-side calculator, reads existing unit data)
3. Integracion (aggregates existing unit/reservation statuses)
4. Ritmo de Ventas (aggregates existing reservation data)

**Phase B** — New DB tables + migrations + UI:
5. Referidos (new `rv_referrals` table)
6. Valorizacion (new `rv_price_history` table)
7. Buyer Persona (new `rv_client_profiles` table, extends admin detail panel)

---

## Phase A-0: Extract Shared NavBar

The same inline `<nav>` block is duplicated in 5 files. With 6 new pages coming, extract it once.

### Files

| Action | File |
|--------|------|
| **NEW** | `src/components/nav-bar.tsx` |
| **MOD** | `src/app/dashboard-client.tsx` — replace inline nav |
| **MOD** | `src/app/projects/page.tsx` — replace inline nav |
| **MOD** | `src/app/desistimientos/page.tsx` — replace inline nav |
| **MOD** | `src/app/disponibilidad/disponibilidad-client.tsx` — replace inline nav |
| **MOD** | `src/app/admin/reservas/reservas-admin-client.tsx` — replace inline nav |

### Design

```tsx
// src/components/nav-bar.tsx
const LINKS = [
  { href: "/", label: "Dashboard" },
  { href: "/projects", label: "Projects" },
  { href: "/desistimientos", label: "Desistimientos" },
  "divider",
  { href: "/disponibilidad", label: "Disponibilidad" },
  { href: "/admin/reservas", label: "Reservas" },
  { href: "/cotizador", label: "Cotizador" },
  { href: "/integracion", label: "Integracion" },
  { href: "/ventas", label: "Ventas" },
  { href: "/referidos", label: "Referidos" },
  { href: "/buyer-persona", label: "Buyer Persona" },
  { href: "/valorizacion", label: "Valorizacion" },
] as const;
```

Links added incrementally as each domain is built. Same pill styling, `flex-wrap` for mobile.

---

## Phase A-1: Cotizador

**Route**: `/cotizador` (public — add to middleware exemption alongside `/disponibilidad`)
**Data**: Reads from existing `useUnits` + `useProjects` hooks. All computation is client-side.

### How the SSOT Cotizador works (from xlsx)

1. User picks unit → gets `price_list` from DB
2. Sets `enganche_pct` (e.g. 10%) → computes `enganche_total = price × pct`
3. `reserva` is a flat Q amount (e.g. Q1,500)
4. `enganche_neto = enganche_total - reserva`, split into N monthly installments
5. Bank financing: `monto_a_financiar = price - enganche_total`
6. For each (interest_rate × plazo_years) combination:
   - `cuota_banco` = PMT formula
   - `iusi` = annual property tax / 12
   - `seguro` = insurance / 12
   - `total_mensual` = cuota + iusi + seguro
   - `ingreso_requerido` = total_mensual × 3
7. Escrituracion: split price into inmueble (70%) + acciones (30%), compute IVA on each

### Files

| Action | File | Purpose |
|--------|------|---------|
| **NEW** | `src/lib/reservas/cotizador.ts` | Pure computation functions (PMT, enganche, financing matrix, escrituracion) |
| **NEW** | `src/app/cotizador/page.tsx` | Server component with Suspense |
| **NEW** | `src/app/cotizador/cotizador-client.tsx` | Main client: unit selector + parameter controls + results |
| **NEW** | `src/app/cotizador/financing-matrix.tsx` | 4×4 grid: rates × plazos → monthly payment |
| **NEW** | `src/app/cotizador/installment-table.tsx` | Enganche installment schedule |
| **NEW** | `src/app/cotizador/escrituracion-panel.tsx` | Tax split breakdown |
| **MOD** | `src/app/disponibilidad/unit-cell.tsx` | Add "Cotizar" link in unit detail dialog |
| **MOD** | `middleware.ts` | Add `/cotizador` to `isPublicReservasPage` |

### Constants (add to `src/lib/reservas/constants.ts`)

```ts
export const COTIZADOR_DEFAULTS = {
  RESERVA_AMOUNT: 1500,
  ENGANCHE_PCT: 0.10,
  INSTALLMENT_MONTHS: 7,
  INMUEBLE_PCT: 0.70,
  IVA_RATE: 0.12,
  IUSI_ANNUAL_RATE: 0.009,
  INSURANCE_ANNUAL_RATE: 0.0035,
  BANK_RATES: [0.075, 0.085, 0.095, 0.105] as const,
  PLAZOS_YEARS: [15, 20, 25, 30] as const,
  INCOME_MULTIPLIER: 3,
} as const;
```

---

## Phase A-2: Integracion

**Route**: `/integracion` (authenticated)
**Data**: Aggregation of `rv_units.status` grouped by tower. Uses a new API endpoint that queries existing tables.

### What the SSOT shows

Per tower, count units in each pipeline stage:
- Firma de PCV → maps to `SOLD` status
- En transito PCV (current month) → `RESERVED` with reservation `CONFIRMED` this month
- En transito PCV (previous months) → `RESERVED` with reservation `CONFIRMED` before this month
- Desistimiento Confirmado → reservations with status `DESISTED`
- Congelado → `FROZEN` status
- Disponible → `AVAILABLE`
- Soft Hold → `SOFT_HOLD`

### Files

| Action | File | Purpose |
|--------|------|---------|
| **NEW** | `src/app/integracion/page.tsx` | Server component |
| **NEW** | `src/app/integracion/integracion-client.tsx` | Main client with project filter |
| **NEW** | `src/app/integracion/pipeline-table.tsx` | Matrix: towers × stages |
| **NEW** | `src/app/api/reservas/integracion/route.ts` | GET — aggregation query |
| **NEW** | `src/hooks/use-integration.ts` | Hook |
| **MOD** | `src/lib/reservas/types.ts` | Add `IntegrationRow` type |
| **MOD** | `src/lib/reservas/validations.ts` | Add `integracionQuerySchema` |

### API Response Shape

```ts
interface IntegrationRow {
  project_name: string;
  project_slug: string;
  tower_name: string;
  tower_id: string;
  available: number;
  soft_hold: number;
  reserved: number;
  frozen: number;
  sold: number;
  total: number;
  desisted_total: number;
  confirmed_current_month: number;
  confirmed_previous: number;
}
```

---

## Phase A-3: Ritmo de Ventas

**Route**: `/ventas` (authenticated)
**Data**: Monthly aggregation of `reservations` by `created_at`.

### What the SSOT shows

Monthly time series per project:
- Reservas (new reservations per month)
- Promesas de CV (confirmed/PCV signed per month)
- Metas (monthly sales targets) — stored as JSON config initially
- Cumulative reservations
- Available units remaining
- Desistimiento adjustments

### Files

| Action | File | Purpose |
|--------|------|---------|
| **NEW** | `src/app/ventas/page.tsx` | Server component |
| **NEW** | `src/app/ventas/ventas-client.tsx` | Main client with project + date filters |
| **NEW** | `src/app/ventas/monthly-chart.tsx` | SVG bar chart (reservations/confirmed/desisted per month) |
| **NEW** | `src/app/ventas/cumulative-chart.tsx` | SVG line chart (cumulative sold over time) |
| **NEW** | `src/app/ventas/velocity-kpis.tsx` | KPI cards: absorption rate, velocity, remaining |
| **NEW** | `src/app/api/reservas/ventas/route.ts` | GET — monthly aggregation query |
| **NEW** | `src/hooks/use-ventas.ts` | Hook |
| **MOD** | `src/lib/reservas/types.ts` | Add `VentasMonthlySeries`, `VentasSummary` |

### API Response Shape

```ts
interface VentasMonthlySeries {
  month: string;          // "2025-01"
  reservations: number;   // New reservations that month
  confirmed: number;      // PCV signed that month
  desisted: number;       // Cancellations
  net: number;            // reservations - desisted
  cumulative: number;     // Running total
  target?: number;        // From config
}

interface VentasSummary {
  total_units: number;
  sold_units: number;
  available_units: number;
  absorption_rate: number;     // sold / total
  avg_monthly_velocity: number;
  months_to_sellout: number;   // available / velocity
}
```

---

## Phase B-1: Referidos

**Route**: `/referidos` (authenticated)
**DB**: New `rv_referrals` table

### Migration: `scripts/migrations/019_referidos.sql`

```sql
CREATE TABLE rv_referrals (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id   uuid REFERENCES reservations(id) ON DELETE SET NULL,
  unit_id          uuid NOT NULL REFERENCES rv_units(id),
  client_name      text NOT NULL CHECK (length(trim(client_name)) > 0),
  precio_lista     numeric(14,2),
  precio_referido  numeric(14,2),
  referido_por     text NOT NULL CHECK (length(trim(referido_por)) > 0),
  fecha_reserva    date,
  salesperson_id   uuid REFERENCES salespeople(id),
  notes            text,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);
-- + view v_rv_referrals_full (joins project/tower/salesperson names)
-- + RLS, indexes, trigger
```

### Files

| Action | File | Purpose |
|--------|------|---------|
| **NEW** | `scripts/migrations/019_referidos.sql` | Table + view + RLS |
| **NEW** | `src/app/referidos/page.tsx` | Server component |
| **NEW** | `src/app/referidos/referidos-client.tsx` | Main client with table + add dialog |
| **NEW** | `src/app/referidos/referral-table.tsx` | Data table |
| **NEW** | `src/app/referidos/referral-form.tsx` | Create/edit dialog |
| **NEW** | `src/app/api/reservas/referidos/route.ts` | GET + POST |
| **NEW** | `src/app/api/reservas/referidos/[id]/route.ts` | PATCH + DELETE |
| **NEW** | `src/hooks/use-referrals.ts` | Hook |
| **MOD** | `src/lib/reservas/types.ts` | Add `ReferralFull`, `CreateReferralPayload` |
| **MOD** | `src/lib/reservas/validations.ts` | Add `createReferralSchema` |

---

## Phase B-2: Valorizacion

**Route**: `/valorizacion` (authenticated)
**DB**: New `rv_price_history` table

### Migration: `scripts/migrations/020_valorizacion.sql`

```sql
CREATE TABLE rv_price_history (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id          uuid NOT NULL REFERENCES projects(id),
  tower_id            uuid REFERENCES towers(id),
  effective_date      date NOT NULL,
  units_remaining     integer NOT NULL CHECK (units_remaining >= 0),
  increment_amount    numeric(14,2) NOT NULL DEFAULT 0,
  increment_pct       numeric(8,4),
  new_price_avg       numeric(14,2),
  appreciation_total  numeric(14,2),
  notes               text,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),
  UNIQUE (project_id, tower_id, effective_date)
);
-- + RLS, indexes, trigger
```

### Files

| Action | File | Purpose |
|--------|------|---------|
| **NEW** | `scripts/migrations/020_valorizacion.sql` | Table + RLS |
| **NEW** | `src/app/valorizacion/page.tsx` | Server component |
| **NEW** | `src/app/valorizacion/valorizacion-client.tsx` | Main client with project filter |
| **NEW** | `src/app/valorizacion/price-history-table.tsx` | Chronological table |
| **NEW** | `src/app/valorizacion/appreciation-chart.tsx` | SVG line chart |
| **NEW** | `src/app/valorizacion/entry-form.tsx` | Add/edit entry dialog |
| **NEW** | `src/app/api/reservas/valorizacion/route.ts` | GET + POST |
| **NEW** | `src/app/api/reservas/valorizacion/[id]/route.ts` | PATCH + DELETE |
| **NEW** | `src/hooks/use-price-history.ts` | Hook |
| **MOD** | `src/lib/reservas/types.ts` | Add `PriceHistoryEntry`, `CreatePriceHistoryPayload` |
| **MOD** | `src/lib/reservas/validations.ts` | Add `createPriceHistorySchema` |

---

## Phase B-3: Buyer Persona

**Route**: `/buyer-persona` (authenticated — aggregate analytics dashboard)
**DB**: New `rv_client_profiles` table (1:1 extension of `rv_clients`)

### Migration: `scripts/migrations/021_buyer_persona.sql`

```sql
CREATE TABLE rv_client_profiles (
  id                        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id                 uuid NOT NULL UNIQUE REFERENCES rv_clients(id) ON DELETE CASCADE,
  gender                    text CHECK (gender IN ('M','F','Otro')),
  birth_date                date,
  education_level           text,
  purchase_type             text CHECK (purchase_type IN ('uso_propio','inversion')),
  marital_status            text,
  children_count            integer CHECK (children_count IS NULL OR children_count >= 0),
  department                text,
  zone                      text,
  occupation_type           text CHECK (occupation_type IN ('formal','informal','independiente','empresario')),
  industry                  text,
  monthly_income_individual numeric(14,2),
  monthly_income_family     numeric(14,2),
  acquisition_channel       text,
  created_at                timestamptz NOT NULL DEFAULT now(),
  updated_at                timestamptz NOT NULL DEFAULT now()
);
-- + RLS, indexes, trigger
```

### Files

| Action | File | Purpose |
|--------|------|---------|
| **NEW** | `scripts/migrations/021_buyer_persona.sql` | Table + RLS |
| **NEW** | `src/app/buyer-persona/page.tsx` | Server component |
| **NEW** | `src/app/buyer-persona/buyer-persona-client.tsx` | Aggregate dashboard: distribution charts |
| **NEW** | `src/app/buyer-persona/distribution-card.tsx` | Horizontal bar chart for one metric |
| **NEW** | `src/app/admin/reservas/client-profile-form.tsx` | Inline profile form (embedded in reservation detail) |
| **NEW** | `src/app/api/reservas/buyer-persona/route.ts` | GET aggregate distributions |
| **NEW** | `src/app/api/reservas/buyer-persona/[client_id]/route.ts` | GET + PUT per client |
| **NEW** | `src/hooks/use-buyer-persona.ts` | Hook for aggregate data |
| **MOD** | `src/app/admin/reservas/reservation-detail.tsx` | Add "Perfil" section with client-profile-form |
| **MOD** | `src/lib/reservas/types.ts` | Add `ClientProfile`, `BuyerPersonaAggregate`, `DistributionItem` |
| **MOD** | `src/lib/reservas/validations.ts` | Add `upsertClientProfileSchema` |
| **MOD** | `src/lib/reservas/constants.ts` | Add `BUYER_PERSONA_OPTIONS` and labels |

---

## Existing code to reuse

| What | Where | Used by |
|------|-------|---------|
| `useUnits` hook | `src/hooks/use-units.ts` | Cotizador (reads unit data) |
| `useProjects` hook | `src/hooks/use-projects.ts` | Cotizador, Integracion, Ventas, Valorizacion |
| `ProjectTowerFilter` | `src/app/disponibilidad/project-tower-filter.tsx` | Cotizador, Integracion |
| `KpiCard` | `src/components/kpi-card.tsx` | Integracion, Ventas, Buyer Persona |
| `formatCurrency` / `formatDate` | `src/lib/reservas/constants.ts` | All 6 domains |
| `jsonOk` / `jsonError` / `parseQuery` / `parseJson` | `src/lib/api.ts` | All API routes |
| `createAdminClient` | `src/lib/supabase/admin.ts` | All API routes |
| Cash flow chart SVG pattern | `src/components/cash-flow-chart.tsx` | Ventas monthly chart, Valorizacion chart |

---

## Build order

1. **NavBar extraction** → all existing pages use it
2. **Cotizador** → zero dependencies, purely client-side, immediate value for salespeople
3. **Integracion** → 1 API route, aggregates existing data
4. **Ritmo de Ventas** → 1 API route, aggregates existing data
5. **Referidos** → migration + CRUD (simplest Phase B domain)
6. **Valorizacion** → migration + CRUD + chart
7. **Buyer Persona** → migration + form + aggregate dashboard (most complex)

## Verification

After each domain: `npx tsc --noEmit && npm run build` — zero errors.

Final check: every SSOT xlsx workbook tab has a corresponding feature in the app. Pati opens Orion instead of Excel.

## File count

- **New files**: ~43 (pages, components, API routes, hooks, migrations, lib)
- **Modified files**: ~10 (types, constants, validations, middleware, unit-cell, reservation-detail, all existing navs → replaced by NavBar)
