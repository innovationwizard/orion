# 088 — Enganche Personalizado: Custom Installment Schedules

**Date:** 2026-04-14
**Scope:** Engine, cotizador UI, PCV, carta de pago, admin reservation detail, migration 054
**Origin:** Ventas meeting 2026-04-14 — requested by Paula. Clients have extraordinary income (aguinaldo, bono 14) in specific months that should be reflected in enganche cuotas.

## Summary

Enganche installments can now have non-uniform amounts. The engine redistributes remaining cuotas automatically so the total enganche never changes. Available in the cotizador (ephemeral), and persisted on confirmed reservations for PCV and carta de pago.

## Phase 1 — Engine (`src/lib/reservas/cotizador.ts`)

### `computeEnganche` — New `overrides` Parameter

```typescript
export function computeEnganche(
  price: number,
  config: Pick<CotizadorConfig, "round_enganche_q100" | "round_cuota_q100" | "round_cuota_q1">,
  enganche_pct: number,
  reserva: number,
  installment_months: number,
  overrides?: Record<number, number>,  // { cuotaNumber: amount }
): EngancheResult
```

When `overrides` has entries:
1. Filter valid keys (1..installment_months, amount >= 1).
2. Clamp if total overrides exceed `enganche_neto - (remaining_count × 1)`.
3. Compute uniform cuota from remaining balance for non-overridden cuotas.
4. Last non-overridden cuota absorbs rounding remainder.
5. Build installments array: overrides where present, uniform elsewhere.

When empty/undefined: identical to previous behavior (backward compatible).

### `scheduleToOverrides` — New Helper

```typescript
export function scheduleToOverrides(
  schedule: { cuota: number; amount: number }[],
): Record<number, number>
```

Converts the persisted JSONB array to the `Record<number, number>` format for `computeEnganche`.

### Financial Safety Invariants

- `sum(all cuota amounts) = enganche_neto` — ALWAYS
- Each cuota >= 1 (Q1 or $1)
- Each override <= `enganche_neto - sum(other_overrides) - (remaining_count × 1)`

## Phase 2 — Cotizador UI (Ephemeral Editing)

### `src/app/cotizador/installment-table.tsx`

New optional props (backward compatible):

| Prop | Type | Purpose |
|------|------|---------|
| `editing` | `boolean` | Enables inline number inputs on each cuota row |
| `overrides` | `Record<number, number>` | Currently overridden cuotas |
| `onOverride` | `(cuota, amount) => void` | Callback when user edits a cuota |
| `onClearOverride` | `(cuota) => void` | Callback to restore a cuota to uniform |
| `maxOverride` | `(cuota) => number` | Max allowed amount per cuota |

- Overridden rows get amber background + bold styling.
- Number input + clear button per row. Print shows formatted amount (not input).
- Without editing props: identical to previous read-only table.

### `src/app/cotizador/cotizador-client.tsx`

- New state: `editingInstallments`, `installmentOverrides`.
- Resets on project/tower/unit/config change (same triggers as sobreprecio/descuento).
- Toggle link: "Personalizar cuotas" / "Restaurar cuotas uniformes".
- Passes `installmentOverrides` to `computeEnganche`.
- Print style: `.cotizador-print-only { display: inline !important; }` for formatted amounts in print mode.

## Phase 3 — Migration 054

**File:** `scripts/migrations/054_enganche_schedule.sql` — deployed to production.

```sql
ALTER TABLE reservations
ADD COLUMN enganche_schedule jsonb DEFAULT NULL;
```

Shape: `[{"cuota": 1, "amount": 5000}, {"cuota": 2, "amount": 8000}, ...]`

NULL = uniform distribution (compute on-the-fly from `enganche_pct` and `cuotas_enganche`). Backward compatible — all existing reservations remain NULL.

## Phase 4 — Fix PCV & Carta de Pago (Pre-Existing Gap)

Both PCV and carta de pago were calling `configFromDefaults()` — hardcoding 10% enganche, 7 cuotas, no rounding — ignoring per-reservation fields (`sale_price`, `enganche_pct`, `cuotas_enganche` from migrations 042/048) and per-project `cotizador_configs`. This phase fixes that gap.

### API Routes

**`src/app/api/reservas/admin/pcv/[id]/route.ts`**
- Added `cotizador_configs` query (active configs for the unit's project).
- Returns `cotizador_configs` in response for client-side config resolution.

**`src/app/api/reservas/admin/carta-pago/[id]/route.ts`**
- Expanded reservation SELECT: `sale_price, enganche_pct, cuotas_enganche, deposit_amount, enganche_schedule`.
- Expanded unit SELECT: `project_id, tower_id, unit_type, bedrooms`.
- Added `cotizador_configs` query and response field.

### Client Components

**`src/app/admin/reservas/pcv/[id]/pcv-client.tsx`** and **`src/app/admin/reservas/carta-pago/[id]/carta-pago-client.tsx`**

Both replaced `configFromDefaults()` with:

```typescript
const cfg = data.cotizador_configs?.length
  ? resolveConfig(data.cotizador_configs, unit.tower_id, unit.unit_type, unit.bedrooms)
  : configFromDefaults();
const price = reservation.sale_price ?? unit.price_list ?? 0;
const enganchePct = reservation.enganche_pct != null ? Number(reservation.enganche_pct) : cfg.enganche_pct;
const cuotasCount = reservation.cuotas_enganche ?? cfg.installment_months;
const reservaAmount = reservation.deposit_amount ?? cfg.reserva_default;
const overrides = reservation.enganche_schedule
  ? scheduleToOverrides(reservation.enganche_schedule) : undefined;
const enganche = computeEnganche(price, cfg, enganchePct, reservaAmount, cuotasCount, overrides);
```

This means:
- B5 reservation → uses B5 config (7% enganche, 8 cuotas)
- BLT reservation → uses BLT config (7% enganche, 24 cuotas)
- SE reservation → uses SE config (30% enganche, 18 cuotas, USD)
- Any reservation with `enganche_schedule` → uses custom amounts

## Phase 5 — Admin UI (Persist Schedule on Reservation)

### Validation (`src/lib/reservas/validations.ts`)

```typescript
export const updateEngancheScheduleSchema = z.object({
  enganche_schedule: z
    .array(z.object({
      cuota: z.number().int().positive(),
      amount: z.number().positive(),
    }))
    .nullable(),
});
```

### API (`src/app/api/reservas/admin/reservations/[id]/route.ts`)

- **GET**: Added `cotizador_configs` to response (active configs for the unit's project).
- **PATCH** (new method): Accepts `enganche_schedule`, validates with Zod, updates reservation, logs `reservation.schedule_updated` audit event.

### Reservation Detail (`src/app/admin/reservas/reservation-detail.tsx`)

New "Plan de Enganche" section (visible for CONFIRMED reservations):
- Displays enganche %, cuotas count, total, type (Uniforme/Personalizado).
- Reuses `InstallmentTable` with editing mode.
- Save/Cancel/Restaurar uniforme buttons.
- PATCH to API on save, refreshes data on success.

### Types (`src/lib/reservas/types.ts`)

Added to `Reservation` interface:

```typescript
sale_price: number | null;
enganche_pct: number | null;
cuotas_enganche: number | null;
inmueble_pct: number | null;
enganche_schedule: { cuota: number; amount: number }[] | null;
```

## Files Changed (12 files, +640/−43)

| File | Change |
|------|--------|
| `src/lib/reservas/cotizador.ts` | `overrides` param + redistribution logic + `scheduleToOverrides` |
| `src/app/cotizador/installment-table.tsx` | Editing mode with inline inputs |
| `src/app/cotizador/cotizador-client.tsx` | Custom cuotas state + toggle + reset |
| `scripts/migrations/054_enganche_schedule.sql` | `enganche_schedule` JSONB column |
| `src/app/api/reservas/admin/pcv/[id]/route.ts` | `cotizador_configs` in response |
| `src/app/api/reservas/admin/carta-pago/[id]/route.ts` | Expanded fields + `cotizador_configs` |
| `src/app/admin/reservas/pcv/[id]/pcv-client.tsx` | Resolved config + reservation terms |
| `src/app/admin/reservas/carta-pago/[id]/carta-pago-client.tsx` | Resolved config + reservation terms |
| `src/lib/reservas/types.ts` | Financial fields on `Reservation` |
| `src/lib/reservas/validations.ts` | `updateEngancheScheduleSchema` |
| `src/app/api/reservas/admin/reservations/[id]/route.ts` | PATCH method + `cotizador_configs` in GET |
| `src/app/admin/reservas/reservation-detail.tsx` | "Plan de Enganche" section |
