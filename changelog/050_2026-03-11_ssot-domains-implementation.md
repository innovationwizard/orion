# 050 — SSOT Domains Implementation

**Date:** 2026-03-11
**Author:** Jorge Luis Contreras Herrera
**Plan:** [049](049_2026-03-11_ssot-domains-plan.md)

## Description

Built all 6 remaining SSOT domains, closing the gap between the Excel workbooks and Orion. Every tab from the SSOT xlsx files now has a corresponding page in the app. This is the implementation of plan 049.

### Mission

**TO COMPLETELY, THOROUGHLY, AND ABSOLUTELY OBLITERATE PATI'S NEED OF EXCEL.**

## What was built

### Phase A-0: NavBar Extraction

Extracted the inline `<nav>` block duplicated across 5 files into a shared `<NavBar>` component.

| File | Action |
|------|--------|
| `src/components/nav-bar.tsx` | NEW — shared nav with 12 links, divider support, pill styling, flex-wrap mobile |
| `src/app/dashboard-client.tsx` | MOD — replaced inline nav |
| `src/app/projects/page.tsx` | MOD — replaced inline nav |
| `src/app/desistimientos/page.tsx` | MOD — replaced inline nav |
| `src/app/disponibilidad/disponibilidad-client.tsx` | MOD — replaced inline nav |
| `src/app/admin/reservas/reservas-admin-client.tsx` | MOD — replaced inline nav |

### Phase A-1: Cotizador (`/cotizador`)

Client-side quotation calculator for salespeople. Reads unit data from existing hooks, all computation is pure TypeScript (no API calls).

| File | Purpose |
|------|---------|
| `src/lib/reservas/cotizador.ts` | Pure computation engine: PMT formula, enganche breakdown, financing matrix (4 rates x 4 plazos), escrituracion tax split |
| `src/app/cotizador/page.tsx` | Server component with Suspense |
| `src/app/cotizador/cotizador-client.tsx` | Unit selector (project → tower → unit cascade), parameter controls (enganche %, reserva amount, installments) |
| `src/app/cotizador/financing-matrix.tsx` | 4x4 grid: bank rate x plazo → cuota mensual, total mensual, ingreso requerido |
| `src/app/cotizador/installment-table.tsx` | Enganche installment schedule (reserva + N monthly cuotas) |
| `src/app/cotizador/escrituracion-panel.tsx` | Inmueble/acciones split with IVA breakdown, adjustable split ratio |
| `src/app/disponibilidad/unit-cell.tsx` | MOD — added "Cotizar" button alongside "Reservar" |
| `middleware.ts` | MOD — added `/cotizador` to public page exemption |

### Phase A-2: Integracion (`/integracion`)

Pipeline summary by tower — aggregates existing unit statuses.

| File | Purpose |
|------|---------|
| `src/app/api/reservas/integracion/route.ts` | GET — aggregation query from `v_rv_units_full` + `reservations` |
| `src/hooks/use-integration.ts` | Data hook |
| `src/app/integracion/page.tsx` | Server component |
| `src/app/integracion/integracion-client.tsx` | Project filter, KPI cards (total, sold, reserved, available, frozen, %vendido) |
| `src/app/integracion/pipeline-table.tsx` | Matrix: towers x pipeline stages with color-coded badge counts |

### Phase A-3: Ritmo de Ventas (`/ventas`)

Monthly sales velocity charts and KPIs.

| File | Purpose |
|------|---------|
| `src/app/api/reservas/ventas/route.ts` | GET — monthly time series from reservations (reservations/confirmed/desisted/net/cumulative) + VentasSummary |
| `src/hooks/use-ventas.ts` | Data hook |
| `src/app/ventas/page.tsx` | Server component |
| `src/app/ventas/ventas-client.tsx` | KPI cards (velocity, months remaining, absorption), charts, data table |
| `src/app/ventas/monthly-chart.tsx` | SVG bar chart: reservations (blue) vs desistimientos (red) per month |
| `src/app/ventas/cumulative-chart.tsx` | SVG line chart with area fill, dashed reference line for total units |

### Phase B-1: Referidos (`/referidos`)

Referral tracking with special pricing. New database table.

| File | Purpose |
|------|---------|
| `scripts/migrations/019_referidos.sql` | `rv_referrals` table, `v_rv_referrals_full` view, RLS, indexes, trigger |
| `src/app/api/reservas/referidos/route.ts` | GET (list with project filter) + POST (create) |
| `src/app/api/reservas/referidos/[id]/route.ts` | PATCH (update) + DELETE |
| `src/hooks/use-referrals.ts` | Data hook |
| `src/app/referidos/page.tsx` | Server component |
| `src/app/referidos/referidos-client.tsx` | Project filter, table + create dialog, delete with confirmation |
| `src/app/referidos/referral-table.tsx` | Data table with discount calculation display |
| `src/app/referidos/referral-form.tsx` | Modal form: unit selector (auto-fills precio_lista), client, referrer, prices, date, salesperson |

### Phase B-2: Valorizacion (`/valorizacion`)

Price appreciation history. New database table.

| File | Purpose |
|------|---------|
| `scripts/migrations/020_valorizacion.sql` | `rv_price_history` table, unique constraint (project, tower, date), RLS, indexes, trigger |
| `src/app/api/reservas/valorizacion/route.ts` | GET (list with project filter, joins project/tower names) + POST (create) |
| `src/app/api/reservas/valorizacion/[id]/route.ts` | PATCH (update) + DELETE |
| `src/hooks/use-price-history.ts` | Data hook |
| `src/app/valorizacion/page.tsx` | Server component |
| `src/app/valorizacion/valorizacion-client.tsx` | Project filter, summary pills, chart + table, entry form |
| `src/app/valorizacion/price-history-table.tsx` | Chronological table: date, project, tower, increment, %, avg price, total appreciation |
| `src/app/valorizacion/appreciation-chart.tsx` | SVG line chart with area fill showing cumulative appreciation over time |
| `src/app/valorizacion/entry-form.tsx` | Modal form: project/tower select, date, units remaining, increment amount/%, prices |

### Phase B-3: Buyer Persona (`/buyer-persona`)

Customer demographics aggregate dashboard + per-client profile forms.

| File | Purpose |
|------|---------|
| `scripts/migrations/021_buyer_persona.sql` | `rv_client_profiles` table (1:1 with `rv_clients`), RLS, indexes, trigger |
| `src/app/api/reservas/buyer-persona/route.ts` | GET — aggregate distributions (gender, purchase type, education, department, occupation, marital status, channel) |
| `src/app/api/reservas/buyer-persona/[client_id]/route.ts` | GET + PUT (upsert) per client profile |
| `src/hooks/use-buyer-persona.ts` | Data hook for aggregates |
| `src/app/buyer-persona/page.tsx` | Server component |
| `src/app/buyer-persona/buyer-persona-client.tsx` | Aggregate dashboard with KPI + distribution cards grid |
| `src/app/buyer-persona/distribution-card.tsx` | Horizontal bar chart for one demographic metric |
| `src/app/admin/reservas/client-profile-form.tsx` | Inline profile form embedded in reservation detail panel |
| `src/app/admin/reservas/reservation-detail.tsx` | MOD — added Buyer Persona profile section |
| `src/lib/reservas/constants.ts` | MOD — added `BUYER_PERSONA_OPTIONS` (gender, purchase type, marital status, education, occupation, departments, channels) |

### Shared modifications

| File | Changes |
|------|---------|
| `src/lib/reservas/types.ts` | Added 12 types: `IntegrationRow`, `VentasMonthlySeries`, `VentasSummary`, `ReferralFull`, `CreateReferralPayload`, `PriceHistoryEntry`, `CreatePriceHistoryPayload`, `ClientProfile`, `DistributionItem`, `BuyerPersonaAggregate` |
| `src/lib/reservas/validations.ts` | Added 7 Zod schemas: `integracionQuerySchema`, `ventasQuerySchema`, `createReferralSchema`, `referidosQuerySchema`, `createPriceHistorySchema`, `valorizacionQuerySchema`, `upsertClientProfileSchema` |

## Verification

- `npx tsc --noEmit` — zero errors after each domain
- `npm run build` — zero errors, all 6 pages visible in build output

## File count

- **New files:** 40
- **Modified files:** 9
- **New migrations:** 3 (019, 020, 021)
- **New API routes:** 8
- **New hooks:** 5
- **New pages:** 6

## SSOT coverage

| SSOT Domain | Route | Status |
|-------------|-------|--------|
| Disponibilidad / Precios | `/disponibilidad` | Done (046/047) |
| Reservas | `/reservar`, `/admin/reservas` | Done (046/047) |
| Desistimientos | `/desistimientos` | Done (033) |
| Control de Pagos | Dashboard | Done (001) |
| Cotizador | `/cotizador` | **NEW** |
| Integracion | `/integracion` | **NEW** |
| Ritmo de Ventas | `/ventas` | **NEW** |
| Referidos | `/referidos` | **NEW** |
| Valorizacion | `/valorizacion` | **NEW** |
| Buyer Persona | `/buyer-persona` | **NEW** |

All 10 SSOT domains now have corresponding features in Orion.
