# 086 — Cotizador: Descuento Especial

**Date:** 2026-04-07
**Scope:** `src/app/cotizador/cotizador-client.tsx`

## Summary

Added support for pre-authorized special discounts in the cotizador. Sales reps who have received approval outside the app can now input a flat discount amount, and all downstream calculations (enganche, financing, escrituración) automatically use the discounted price.

## Changes

### Discount Toggle
- Discrete "Agregar descuento" text link between Unit Summary and Enganche sections — small, underlined, muted. Invisible in print.
- Clicking reveals the **DESCUENTO ESPECIAL** section; closing it resets the discount to zero.

### Discount Section
- Dashed amber-bordered card with currency-aware input field.
- Three-line breakdown when discount is active: **Precio lista** → **Descuento especial** (negative, amber) → **Precio con Descuento** (bold).
- Validation: discount must be a positive integer strictly less than the list price. Error message shown if discount ≥ price.

### Calculation Pipeline
- Introduced `effectivePrice = price - discountAmount` (when valid; otherwise falls back to `price`).
- `computeEnganche`, `computeFinancingMatrix`, and `computeEscrituracion` all receive `effectivePrice` instead of `price`.
- No changes to the computation engine (`src/lib/reservas/cotizador.ts`) — pure functions already accept price as a parameter.

### Reset Behavior
- Discount resets to zero on: project change, tower change, unit change, and config change.

### Print
- Discount section (breakdown only) appears in print with dashed amber border preserved.
- Input and close button hidden in print via `cotizador-no-print` class.

## Design Decisions

- **Ephemeral only** — discount lives in component state, not persisted to URL or DB. Prevents accidental sharing of unauthorized discounts.
- **Flat amount only** — matches the business process where authorization specifies a currency amount, not a percentage.
- **UI deliberately discrete** — edge case feature; toggle is small and muted to avoid confusion for the majority of cotizaciones that use list price.
