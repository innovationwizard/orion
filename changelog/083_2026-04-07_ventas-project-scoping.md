# 083 — Ventas Portal Project Scoping

**Date:** 2026-04-07
**Scope:** API routes (`/api/reservas/ventas/reservations`, `/api/reservas/ventas/clients`)

## Summary

Fixed a security/data-isolation gap where salespeople could see reservations and clients from projects they are not currently assigned to. Both ventas API routes filtered only by `salesperson_id` — they now also scope results to the salesperson's active project assignments (`salesperson_project_assignments WHERE end_date IS NULL`).

## Problem

A salesperson assigned only to Bosque Las Tapias could see Boulevard 5 reservations and clients in the ventas portal panel, reservations list, and clients page. The `salesperson_id` filter was necessary but not sufficient — project assignment boundaries were not enforced.

## Changes

### `src/app/api/reservas/ventas/reservations/route.ts`
- Looks up the salesperson's active project assignments via `salesperson_project_assignments`
- Extracts assigned project slugs from the joined `projects` table
- Adds `.in("project_slug", assignedSlugs)` to the `v_reservations_pending` query
- Returns `[]` early if the salesperson has zero active assignments

### `src/app/api/reservas/ventas/clients/route.ts`
- Same assignment lookup to get assigned project slugs
- Fetches unit IDs belonging to assigned projects from `v_rv_units_full`
- Adds `.in("reservations.unit_id", assignedUnitIds)` to scope the `reservation_clients` query
- Returns `[]` early if no assignments or no units in assigned projects

## DB Confirmation

No migration needed. Uses existing `salesperson_project_assignments` table (active = `end_date IS NULL`) and existing view columns (`project_slug` on `v_reservations_pending`, `project_slug` on `v_rv_units_full`).
