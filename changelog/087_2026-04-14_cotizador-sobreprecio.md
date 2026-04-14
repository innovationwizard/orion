# 087 — Cotizador: Sobreprecio (Negotiation Markup)

**Date:** 2026-04-14
**Scope:** `src/app/cotizador/cotizador-client.tsx`
**Origin:** Ventas meeting 2026-04-14 — requested by Ronnie, Paula, and Eder independently. Documented in `docs/transcript-feature-extraction-2026-04-14.md` §2.1.

## Summary

Salespeople regularly quote clients a price above list price to create room for a negotiation "discount" as a closing technique. The cotizador now supports this via an ephemeral "Sobreprecio" input. When active, the printed cotización shows only the inflated price — the real list price is never visible to the client.

## Changes

### Markup Toggle
- New "Agregar sobreprecio" text link alongside "Agregar descuento", both in a flex-wrap container below the unit summary.
- Clicking reveals the **SOBREPRECIO** section; closing it resets the markup to zero.

### Markup Section
- Dashed emerald-bordered card (visually distinct from the amber discount card).
- Currency-aware input field for flat markup amount.
- Three-line breakdown (screen only, class `cotizador-no-print`): **Precio lista** → **Sobreprecio** (+amount, emerald) → **Precio al cliente** (bold).
- Entire section hidden in print via `.cotizador-markup { display: none !important; }` — the inflated price is already shown in the unit summary.

### Price Calculation Chain
- `price` = `selectedUnit.price_list` (unchanged, internal baseline).
- `markedUpPrice` = `price + markupAmount` (what client sees).
- `maxDiscount` = `markupAmount` when markup active; `markedUpPrice - 1` otherwise.
- `effectivePrice` = `markedUpPrice - discountAmount` (when discount valid; otherwise `markedUpPrice`).
- All downstream computations (`computeEnganche`, `computeFinancingMatrix`, `computeEscrituracion`) receive `effectivePrice` as before — no engine changes.

### Unit Summary — Dynamic Label
- When markup is active: label shows **"Precio"** (not "Precio lista") with the `markedUpPrice` value.
- When markup is off: label remains **"Precio lista"** as before.
- In print, the client sees only the label and value displayed in the unit summary — never the real list price.

### Discount Section — Adjusted
- `max` on discount input now uses `maxDiscount` (equals markup amount when markup active, preventing price below list).
- Discount breakdown uses `markedUpPrice` as the base (labeled "Precio" when markup active, "Precio lista" otherwise).
- Validation message changes contextually: "El descuento no puede ser mayor al sobreprecio" (with markup) vs "El descuento debe ser menor al precio lista" (without markup).

### Reset Behavior
- Markup resets to zero on: project change, tower change, unit change, and config change — same lifecycle as discount.

## Interaction Matrix

| Markup | Discount | Unit summary label | Base for calcs | Discount cap |
|--------|----------|-------------------|----------------|--------------|
| OFF | OFF | "Precio lista" | `price_list` | n/a |
| OFF | ON | "Precio lista" | `price_list - discount` | `price - 1` |
| ON | OFF | "Precio" | `markedUpPrice` | n/a |
| ON | ON | "Precio" | `markedUpPrice - discount` | `markupAmount` |

## Design Decisions

- **Ephemeral only** — markup lives in component state, not persisted to URL or DB. Same rationale as discount: prevents accidental sharing and keeps the cotización tool stateless.
- **Flat amount only** — matches the discount pattern. Salespeople think in currency amounts ("le subo Q10,000"), not percentages.
- **Hidden in print** — the markup section is a salesperson tool, not a client-facing document element. The inflated price is already shown in the unit summary as "Precio".
- **Discount capped at markup** — when markup is active, the discount cannot exceed the markup amount. This enforces the business rule: never sell below list price via the markup+discount flow. Authorized discounts below list price still work via the standalone discount feature (without markup).
- **Emerald theme** — green/emerald visual identity distinguishes markup (up = green) from discount (down = amber).
- **No engine changes** — the computation functions already accept `effectivePrice` as a parameter. The markup only affects how that price is derived in the UI layer.
