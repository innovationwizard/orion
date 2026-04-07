# 085 — Cotizador: Financiamiento Bancario UX Overhaul + Print Optimization

**Date:** 2026-04-07
**Scope:** `src/lib/reservas/cotizador.ts`, `src/app/cotizador/financing-matrix.tsx`, `src/app/cotizador/escrituracion-panel.tsx`, `src/app/cotizador/cotizador-client.tsx`

## Summary

Redesigned the financiamiento bancario section for clarity and interactivity. Fixed IUSI calculation. Improved print layout to fit on a single page.

## Changes

### IUSI Calculation Fix
- **Before:** IUSI mensual was calculated over the total price including taxes.
- **After:** IUSI base is now 70% of the price without taxes (`inmueble_pct × price / tax_factor`), matching the real escrituracion split. When `valor_inmueble` is stored in the DB (e.g., Santa Elena), that value is used directly; otherwise it is derived inline from `inmueble_pct`, `timbres_rate`, and `use_pretax_extraction`.

### Financiamiento Bancario Section
- **Single-rate view:** Replaced the multi-row table (all rates visible) with a dropdown selector. Only one rate row is displayed at a time.
- **Custom plazo column:** Added a fifth column with an editable year input (1–50) for "what if" scenarios. Values compute in real time using the same `pmt()` formula.
- **Cuota-only cells:** Each cell now shows a single bold cuota value instead of the previous two-line layout (total_monthly + sub-label).
- **Ingreso mínimo requerido row:** Moved from a single footer value to a per-plazo second row, since the required income varies by term length. Custom column included.
- **Relación Cuota Ingreso:** Inverted display from multiplier format ("2x") to percentage ("50%"). Removed redundant "cuota banco" suffix.
- **Label fixes:** "Ingreso requerido (min)" → "Ingreso mínimo requerido". "Multiplicador" → "Relación Cuota Ingreso".

### Escrituración Section
- All amounts now round to 2 decimal places (computation uses `Math.round(n * 100) / 100` instead of `Math.round(n)`).
- Display always shows 2 decimal digits (`minimumFractionDigits: 2`).
- Line breaks inserted between tax amounts and their labels ("IVA 12%", "Timbres 3%").

### Print Optimization
- **"Seleccionar unidad" hidden** in print via `cotizador-no-print` class.
- **Unit summary compacted** into a single inline flex row (heading hidden, label-value pairs inline).
- **Disclaimers** rendered as a single wrapped row instead of stacked paragraphs.
- **Tighter margins and font sizes** (0.8cm/1.2cm margins, 7.5pt base font) to fit everything on one page.
