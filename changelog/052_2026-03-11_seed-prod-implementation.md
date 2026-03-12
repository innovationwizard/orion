# 052 — Seed Production Database Implementation

**Date:** 2026-03-11
**Author:** Jorge Luis Contreras Herrera
**Plan:** [051](051_2026-03-11_seed-prod-plan.md)

## Description

Seeded the production Supabase database with inventory data from all 4 SSOT xlsx workbooks. Populated towers, floors, rv_units, and salespeople tables. Fixed project names and slugs to match the app's `PROJECT_SLUGS` constant.

## What was done

### Step 1: Fix project metadata

Updated `projects` table names and slugs:

| Project | Old slug | New slug |
|---------|----------|----------|
| Bosque Las Tapias | `bl_tapias` | `bosque-las-tapias` |
| Casa Elisa | `santa_elisa` | `casa-elisa` |
| Boulevard 5 | `boulevard` | `boulevard-5` |
| Benestare | `benestare` | `benestare` |

### Step 2: Python ETL script

Created `scripts/seed_prod.py` — reads 4 SSOT xlsx files using `openpyxl` and generates a single `scripts/seed_prod.sql` file.

**Key ETL features:**
- Per-project, per-sheet column mappings (each xlsx has different layouts)
- Unicode accent normalization for salesperson names (e.g., `Brénda Búcaro` → `Brenda Bucaro`)
- Suffix stripping for notes embedded in salesperson fields (e.g., `Efren Sanchez/ Traslado` → `Efren Sanchez`)
- Status mapping: `Disponible`→`AVAILABLE`, `Reservado`→`RESERVED`, `PCV`→`SOLD`, `Congelado`→`FROZEN`, `Liberado`→`AVAILABLE`
- Special handling for Casa Elisa locales (`L-1`, `L-2`, `L-3` text unit numbers)
- Parking format parsing for Boulevard 5 (`S5_229` → level=`S5`, number=`229`)
- Bedroom inference from unit type for BLT Torre B (no explicit column)

### Step 3: Generated SQL

`scripts/seed_prod.sql` — 1,035 lines, 601 KB

**Safety guarantees:**
- Single transaction (`BEGIN` / `COMMIT`)
- Every INSERT uses `ON CONFLICT DO NOTHING` (idempotent)
- No DELETEs or destructive operations
- FK references via subqueries (not hardcoded UUIDs)

### Step 4: Execution

Executed via Supabase Management API (`POST /v1/projects/{ref}/database/query`). HTTP 201 — success.

## Results

| Table | Rows |
|-------|------|
| towers | 9 |
| floors | 85 |
| rv_units | 890 |
| salespeople | 27 |

### Per-project breakdown

| Project | Tower | Units | Available | Reserved | Sold | Frozen |
|---------|-------|-------|-----------|----------|------|--------|
| Benestare | Torre A | 54 | 8 | 24 | 22 | 0 |
| Benestare | Torre B | 78 | 5 | 25 | 48 | 0 |
| Benestare | Torre C | 66 | 14 | 17 | 35 | 0 |
| Benestare | Torre D | 42 | 34 | 2 | 0 | 6 |
| Benestare | Torre E | 42 | 0 | 0 | 0 | 42 |
| Bosque Las Tapias | Torre B | 117 | 114 | 3 | 0 | 0 |
| Bosque Las Tapias | Torre C | 117 | 46 | 7 | 49 | 15 |
| Boulevard 5 | Principal | 299 | 8 | 10 | 273 | 8 |
| Casa Elisa | Principal | 75 | 0 | 1 | 74 | 0 |

### SSOT xlsx source files

| Project | File |
|---------|------|
| BLT | `origin/SSOT/Reservas y Ventas/Bosque Las Tapias/Disponibilidad y cotizador Bosque Las Tapias septiembre 2025.xlsx` |
| Benestare | `origin/SSOT/Reservas y Ventas/Benestare/Precios y Disponibilidad BENESTARE TA septiembre 25.xlsx` |
| Boulevard 5 | `origin/SSOT/Reservas y Ventas/Boulevard 5/DisponibilIdad e Integración B5 septiembre 2025.xlsx` |
| Casa Elisa | `origin/SSOT/Reservas y Ventas/Casa Elisa/CASA ELISA con trazabilidad precios septiembre 2025.xlsx` |

## Files

| Action | File | Purpose |
|--------|------|---------|
| **NEW** | `scripts/seed_prod.py` | Python ETL: xlsx → SQL |
| **NEW** | `scripts/seed_prod.sql` | Generated idempotent seed SQL |
| **NEW** | `changelog/051_2026-03-11_seed-prod-plan.md` | Plan document |

## Verification

- HTTP 201 from Management API
- Row counts verified: 9 towers, 85 floors, 890 units, 27 salespeople
- Project slugs verified: `bosque-las-tapias`, `casa-elisa`, `boulevard-5`, `benestare`
- Unit status distribution verified per project/tower
