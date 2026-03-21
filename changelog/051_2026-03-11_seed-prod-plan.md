# 051 — Seed Production Database Plan

**Date:** 2026-03-11
**Author:** Jorge Luis Contreras Herrera

## Context

All 4 migrations (018-021) are deployed to production. The 7 new tables (`towers`, `floors`, `rv_units`, `salespeople`, `rv_clients`, `reservations`, etc.) exist but are **completely empty**. The 4 projects exist in the `projects` table but have outdated names/slugs (`bl_tapias`, `santa_elisa`, `boulevard`) that don't match the app's `PROJECT_SLUGS` constant.

**Goal**: Populate the inventory backbone (towers, floors, units, salespeople) from the SSOT xlsx files so the app's pages (Disponibilidad, Cotizador, Integracion, etc.) have data to display.

**Constraint**: This is a **production database**. Zero tolerance for data loss or corruption.

## Safety guarantees

1. **Single transaction** — entire seed wrapped in `BEGIN; ... COMMIT;` — atomic all-or-nothing
2. **Idempotent** — every INSERT uses `ON CONFLICT DO NOTHING` (unique constraints exist on all tables)
3. **No DELETEs, no UPDATEs on user data** — only UPDATE is on `projects` table (name/slug fix) and only INSERTs on empty tables
4. **Review before execution** — generate SQL file first, human-review it, then execute
5. **Post-flight verification** — count rows in every table after seed

## Existing project IDs

| Project | UUID | Current slug | New slug |
|---------|------|-------------|----------|
| Bosque Las Tapias | `019c7d10-8ee5-7999-9881-2cd5ad038aa9` | `bl_tapias` | `bosque-las-tapias` |
| Casa Elisa | `019c7d10-8e7b-7db6-93be-6f42d0538233` | `santa_elisa` | `casa-elisa` |
| Boulevard 5 | `019c7d10-8e01-720f-942f-cac0017d83a8` | `boulevard` | `boulevard-5` |
| Benestare | `019c7d10-8f5a-74c7-b3df-c2151ad8a376` | `benestare` | `benestare` |

## Data inventory

| Project | Towers | Floors | Units |
|---------|--------|--------|-------|
| Bosque Las Tapias | 2 (B, C) | 13 each | 234 |
| Benestare | 5 (A-E) | 6 each | 282 |
| Boulevard 5 | 1 | 19 | 298 |
| Casa Elisa | 1 | 10 | 75 |
| **Total** | **9** | **~57** | **889** |

## Approach

Python ETL script (`scripts/seed_prod.py`) reads SSOT xlsx files → generates `scripts/seed_prod.sql` → reviewed → executed via Supabase Management API.

## Status

**COMPLETED** — see [052](052_2026-03-11_seed-prod-implementation.md) for implementation.


---

## ADDENDUM 2026-03-20: BLT Torre B — Authoritative Correction

**Source:** Jorge (project owner), direct confirmation.
**Cross-reference:** `docs/creditos-33-units-investigation.md` (UPDATE 2026-03-20)

During the Créditos dashboard backfill investigation, 24 BLT Torre B units were flagged with credit data but no reservations. The "INFO PARA REPORTES" Excel sheet listed 58 rows of client data, suggesting 58 hidden sales. Upon authoritative review:

1. **As of 2026-03-20, only 3 confirmed sales exist in Bosque Las Tapias — Torre B.** The 58 rows in "INFO PARA REPORTES" do NOT represent real sales. The confirmed count on that date is **3** (point-in-time figure, not a fixed ceiling).
2. **All existing BLT Torre B sales records will be dropped from the production database** to establish a clean baseline.
3. **Only the 3 confirmed sales (as of 2026-03-20) will be uploaded** as the sole BLT Torre B transactions. This is a point-in-time count — new sales will flow through the normal Orion reservation process.

Any prior references in this document to BLT Torre B having 11 hidden reservations (Category C), 13 orphan income markers (Category D), or 58 clients missing from the DB are **superseded** by this correction (2026-03-20).