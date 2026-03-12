# 053 — Backfill Reservation History Plan

**Date:** 2026-03-12
**Author:** Jorge Luis Contreras Herrera

## Context

Inventory seed (052) is complete: 9 towers, 85 floors, 890 units, 27 salespeople. Unit statuses are correct (AVAILABLE/RESERVED/SOLD/FROZEN). But **all 9 transactional tables are empty** — no reservations, no clients, no status history. Pages like `/ventas`, `/integracion`, `/admin/reservas`, and `/desistimientos` show nothing.

**Goal**: Populate `rv_clients`, `reservations`, `reservation_clients`, `unit_status_log`, and `freeze_requests` from the SSOT xlsx files so the reservation system is fully operational with historical data.

**Constraint**: Production database. Same zero-tolerance safety contract as 052.

## Key Discovery: Reporte de Ventas Files

The "Disponibilidad" files (used for inventory seed) are **snapshots** — current state only. The **"Reporte de Ventas"** files are the real transactional source:

| Project | File | Monthly Sheets | Has Dates | Has Desistimientos |
|---------|------|----------------|-----------|-------------------|
| BLT | `2. Reporte de Ventas Bosque Las Tapias septiembre 2025.xlsx` | Feb 2025 → Mar 2026 | ✓ | ✓ (separate sheet) |
| Benestare | `2. Reporte de Ventas BENESTARE septiembre 2025.xlsx` | Aug → Mar 2026 | ✓ | ✓ |
| Boulevard 5 | `2. Reporte de Ventas BOULEVARD 5 septiembre 2025.xlsx` | Mar → Mar 2026 | ✓ | ✓ |
| Casa Elisa | `2 .Reporte de Ventas CASA ELISA septiembre 2025.xlsx` | Jan → Oct 2025 | ✓ | ✓ |

Each monthly "Ventas" sheet has: `fecha`, `Cliente`, `No. Apartamento`, `Torre`, `Asesor`, `Enganche`, `Promesa Firmada`.
Each file also has a **Desistimientos** sheet with cancellation records.

## Safety Guarantees

1. **Single transaction** — `BEGIN` / `COMMIT` — atomic all-or-nothing
2. **Tables must be empty** — pre-flight check; script refuses to run if transactional tables have data
3. **No DELETEs, no UPDATEs** — INSERT only into empty tables
4. **Review before execution** — generate SQL file first, human-review, then execute
5. **Post-flight verification** — count rows, cross-check with Disponibilidad status counts
6. **Historical timestamps preserved** — `created_at` CAN be overridden on INSERT (confirmed: no BEFORE INSERT trigger, only DEFAULT clause)

## Data Flow

### Which units get reservation records?

| Unit Status | Action | Reservation Status |
|-------------|--------|-------------------|
| AVAILABLE | **Skip** — no reservation | — |
| RESERVED | Create reservation | `CONFIRMED` |
| SOLD (PCV) | Create reservation | `CONFIRMED` |
| FROZEN | Create `freeze_request` (if salesperson available) | — |

### For desisted units (from Desistimientos sheets):

Units that appear in Desistimientos sheets get TWO records:
1. Original reservation → `DESISTED` (with reason + date from sheet)
2. If unit is currently RESERVED/SOLD → new reservation → `CONFIRMED` (is_resale = true)

### Co-buyers

Benestare client names often contain co-buyers: `"Mauricio Hernández / Sherlyn Orantes"`. Split by `"/"`, create separate `rv_clients` records, link both via `reservation_clients` (first = `is_primary: true`).

## ETL Script Design

**File**: `scripts/backfill_reservations.py`

### Step 1: Read Reporte de Ventas (primary source)

For each project's Reporte de Ventas file:
- Iterate monthly "Ventas {month}" sheets
- Extract: fecha, client name(s), unit number, tower, salesperson, enganche amount
- Build a `dict[unit_key] → ReservationRecord` mapping

### Step 2: Read Desistimientos sheets

For each project's Reporte de Ventas file:
- Find and parse the "Desistimientos" sheet
- Extract: unit, client, date, reason (if available)
- Build a `set[unit_key] → DesistimientoRecord` mapping

### Step 3: Cross-reference with Disponibilidad

For each non-AVAILABLE unit in the seeded inventory:
- Look up in Reporte de Ventas data → get date, client, salesperson
- If found in Desistimientos → mark as DESISTED
- If unit is RESERVED/SOLD and has a desistimiento → create DESISTED + new CONFIRMED (is_resale)
- If unit has client+salesperson but no Reporte entry → use Disponibilidad data with fallback date

### Step 4: Generate SQL

Order of INSERTs (FK dependencies):
1. `rv_clients` — all unique client names
2. `reservations` — with unit_id and salesperson_id via subqueries, historical `created_at`
3. `reservation_clients` — junction records
4. `freeze_requests` — for FROZEN units with salesperson data
5. `unit_status_log` — one entry per non-AVAILABLE unit (initial status record)

### Client name normalization

Same as salesperson normalization in seed_prod.py:
- `strip_accents()` — remove Unicode diacritics
- Trim whitespace, normalize multiple spaces
- Split co-buyers by `" / "` or `"/"` separator
- Title case normalization

### Date handling

| Source | Availability | Action |
|--------|-------------|--------|
| Reporte de Ventas `fecha` | All projects | Use as `created_at` + `deposit_date` |
| Disponibilidad `Fecha de Reserva` | Benestare only | Fallback if Reporte entry missing |
| No date available | Rare edge case | Use `'2025-09-01'` (SSOT file date) |

### Deposit data

- `deposit_amount` from Reporte de Ventas enganche column (or Disponibilidad)
- `receipt_type` → NULL (no receipt images in xlsx)
- `deposit_bank` → NULL (not in xlsx)

## SQL Structure

```sql
BEGIN;

-- Pre-flight: abort if any transactional table has data
DO $$ BEGIN
  IF (SELECT count(*) FROM rv_clients) > 0 THEN
    RAISE EXCEPTION 'rv_clients is not empty — aborting';
  END IF;
  -- ... same for reservations, reservation_clients, unit_status_log, freeze_requests
END $$;

-- Step 1: Clients
INSERT INTO rv_clients (full_name, created_at) VALUES
  ('Client Name', '2025-06-15');
-- ~400-600 rows

-- Step 2: Reservations (CONFIRMED)
INSERT INTO reservations (unit_id, salesperson_id, status, deposit_amount, deposit_date, created_at)
VALUES (
  (SELECT ru.id FROM rv_units ru
   JOIN floors f ON f.id = ru.floor_id
   JOIN towers t ON t.id = f.tower_id
   WHERE t.project_id = '...' AND t.name = 'Torre B' AND f.number = 1 AND ru.unit_number = '101'),
  (SELECT id FROM salespeople WHERE full_name = 'Juan Perez'),
  'CONFIRMED',
  50000.00,
  '2025-06-15',
  '2025-06-15'
);

-- Step 3: Desisted reservations
INSERT INTO reservations (unit_id, salesperson_id, status, desistimiento_reason, desistimiento_date, created_at)
VALUES (..., 'DESISTED', 'Desistimiento registrado en SSOT', '2025-08-01', '2025-06-15');

-- Step 4: Reservation ↔ Client links
INSERT INTO reservation_clients (reservation_id, client_id, is_primary) VALUES (
  (SELECT id FROM reservations WHERE unit_id = ... AND status = 'CONFIRMED'),
  (SELECT id FROM rv_clients WHERE full_name = 'Client Name' LIMIT 1),
  true
);

-- Step 5: Freeze requests (FROZEN units)
INSERT INTO freeze_requests (unit_id, salesperson_id, reason, status, created_at) VALUES (
  ..., ..., 'Congelado en inventario SSOT', 'ACTIVE', '2025-09-01'
);

-- Step 6: Unit status log (initial entries)
INSERT INTO unit_status_log (unit_id, old_status, new_status, changed_by, reason, created_at) VALUES (
  ..., NULL, 'RESERVED', 'system:backfill', 'Backfill desde SSOT', '2025-06-15'
);

COMMIT;
```

## Execution Steps

1. **Deep-dive Reporte de Ventas** — map exact columns per project/sheet (same approach as seed_prod.py)
2. **Write** `scripts/backfill_reservations.py` — Python ETL
3. **Run** to generate `scripts/backfill_reservations.sql`
4. **Review** generated SQL (human inspection)
5. **Execute** via Supabase Management API
6. **Verify** row counts + cross-check with Disponibilidad status counts

## Expected Row Counts

| Table | Estimated Rows | Notes |
|-------|---------------|-------|
| `rv_clients` | ~400-600 | Unique client names from all projects |
| `reservations` | ~500-700 | One per RESERVED/SOLD unit + desistimientos |
| `reservation_clients` | ~550-750 | Slightly more than reservations (co-buyers) |
| `unit_status_log` | ~500-700 | One entry per non-AVAILABLE unit |
| `freeze_requests` | ~65 | FROZEN units with salesperson data |

## Verification

```sql
-- Row counts
SELECT 'rv_clients' AS tbl, count(*) FROM rv_clients
UNION ALL SELECT 'reservations', count(*) FROM reservations
UNION ALL SELECT 'reservation_clients', count(*) FROM reservation_clients
UNION ALL SELECT 'unit_status_log', count(*) FROM unit_status_log
UNION ALL SELECT 'freeze_requests', count(*) FROM freeze_requests;

-- Reservation status distribution
SELECT status, count(*) FROM reservations GROUP BY status;

-- Every RESERVED/SOLD unit should have exactly one CONFIRMED reservation
SELECT ru.status, count(DISTINCT ru.id) AS units,
       count(DISTINCT r.id) AS reservations
FROM rv_units ru
LEFT JOIN reservations r ON r.unit_id = ru.id AND r.status = 'CONFIRMED'
WHERE ru.status IN ('RESERVED', 'SOLD')
GROUP BY ru.status;

-- App pages should now show data
-- /ventas → monthly charts populated
-- /integracion → pipeline summary populated
-- /admin/reservas → reservation list populated
```

## Status

**COMPLETED** — executed on production 2026-03-12.

## Actual Results

| Table | Expected | Actual |
|-------|----------|--------|
| `rv_clients` | 400-600 | **648** |
| `reservations` | 500-700 | **644** (571 CONFIRMED + 73 DESISTED) |
| `reservation_clients` | 550-750 | **682** |
| `unit_status_log` | 500-700 | **580** |
| `freeze_requests` | ~65 | **9** (only units with identifiable salesperson) |
| `salespeople` | 27 (existing) | **32** (+5 historical from desistimientos) |

### Coverage

- **590 of 591 RESERVED/SOLD units** have a CONFIRMED reservation (99.7%)
- 19 units skipped (1 BEN + 18 CE) — no client/salesperson data in xlsx
- 58 FROZEN units without salesperson → no freeze_request (unit status already correct)
- 67 units with desistimiento history + re-reservation (is_resale=true)
- 6 desisted units now AVAILABLE (fully cancelled, not re-reserved)

### Data Sources

- **Primary**: "Reporte de Ventas" xlsx files (monthly sales history with dates)
- **Secondary**: "Disponibilidad" xlsx files (current snapshot with client info)
- **Discovery**: Reporte de Ventas contained 696 sales records + 142 desistimiento records across all 4 projects

### New Salespeople Added

5 historical salespeople from desistimiento records not in original seed:
`Francisco Osuna`, `Marielos España`, and 3 others (all with ON CONFLICT DO NOTHING).
