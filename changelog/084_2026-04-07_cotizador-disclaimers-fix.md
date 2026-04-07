# 084 — Cotizador: All Units Show All Disclaimers

**Date:** 2026-04-07
**Scope:** `src/app/cotizador/cotizador-client.tsx`

## Summary

Fixed a bug where some apartments did not show terms and conditions at the bottom of the cotizador. Disclaimers are now always sourced from the project-default config row, ensuring all units display the full set of terms regardless of which tower/unit-type-specific config resolves.

## Problem

The cotizador resolves a per-unit config based on tower, unit type, and bedrooms. When a more specific config row matched (e.g., tower-level or unit-type-level), that row's `disclaimers` array could be empty — silently hiding the terms and conditions for those units.

## Fix

Added a separate `useResolvedConfig(configRows, null, null, null)` call to always retrieve the project-default config. The disclaimers rendered at the bottom now come from this project-level row, falling back to the unit-specific config only if the project default has none. This guarantees all units within a project show the same complete set of terms and conditions.
