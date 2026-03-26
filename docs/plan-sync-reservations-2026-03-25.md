# Plan: Sync Reporte Excel Files → Production Database

## Context

The production database was backfilled with reservation history from SSOT files dated September 2025 (via `scripts/backfill_reservations.py`). Since then, reservations have continued flowing in through the app and through Patty's Excel files. The user has dropped updated Reporte files (March 2026) at `Reservas/` in the project root. We need to reconcile these against the production database.

**Current DB state:**
- 645 reservations: 571 CONFIRMED, 73 DESISTED, 1 PENDING_REVIEW
- Latest deposit_date per project: BEN=2026-03-21, BLT=2026-03-08, B5=2026-03-10, CE=2025-10-22

**Excel state:**
- 4 Reporte files with monthly Ventas tabs going up to March 2026
- CE stops at October 2025 (no new data expected)

## Approach

Create a self-contained Python script (`scripts/sync_reservations.py`) that:
1. Extracts all Ventas tabs from the 4 Reporte files
2. Queries the production DB for current reservation state
3. Compares by matching key `(project, tower, unit_number)`
4. Outputs: SQL for new inserts + Markdown proposal for differences

### Reuse from `scripts/backfill_reservations.py`

Copy these functions/constants into the new script (not import — to keep it self-contained and not risk touching the original):

- **Normalization**: `strip_accents()`, `normalize_salesperson()`, `normalize_client_name()`, `split_client_names()`, `safe_date()`, `safe_float()`, `safe_int()`, `normalize_unit_number()`, `normalize_tower()`, `floor_from_unit()`
- **Header detection**: `VENTAS_HEADER_MAP`, `detect_ventas_headers()`
- **SQL helpers**: `sql_str()`, `sql_num()`, `sql_date()`, `sql_bool()`
- **Constants**: `PROJECT_IDS`, `PROJECT_NAMES`, `SINGLE_TOWER_PROJECTS`, `DEFAULT_TOWER`, `SALESPERSON_CANONICAL`, `SALESPERSON_EXCLUDE`

### New code

1. **File paths** → point to `Reservas/` instead of `origin/SSOT/`
2. **DB query function** → Supabase Management API (`POST https://api.supabase.com/v1/projects/{ref}/database/query`) with auth token from macOS keychain
3. **Comparison engine** → field-by-field diff for matched records
4. **Output generators** → SQL for inserts, Markdown for proposals

## Implementation Steps

### Step 1: Extract from Excel

Read all Ventas tabs from all 4 Reporte files. Use the existing `detect_ventas_headers()` + row extraction logic. Build a deduplicated map:

```
(project_key, tower_name, unit_number) → SaleRecord (latest by fecha)
```

Tower resolution:
- B5, CE → hardcoded "Principal"
- BEN, BLT → from the "Torre" column in Ventas tab (present in current files)
- If Torre column missing for a BEN/BLT row → skip (flag as warning)

### Step 2: Query Production DB

Run this SQL via Management API to get all active reservations with their details:

```sql
SELECT
  r.id, r.status, r.deposit_amount, r.deposit_date, r.lead_source,
  r.is_resale, r.created_at, r.desistimiento_reason, r.desistimiento_date,
  ru.unit_number, t.name as tower_name, p.name as project_name, p.id as project_id,
  sp.full_name as salesperson_name,
  (SELECT string_agg(rc2.full_name, ' / ' ORDER BY rc.is_primary DESC, rc2.full_name)
   FROM reservation_clients rc
   JOIN rv_clients rc2 ON rc.client_id = rc2.id
   WHERE rc.reservation_id = r.id) as client_names
FROM reservations r
JOIN rv_units ru ON r.unit_id = ru.id
JOIN floors f ON ru.floor_id = f.id
JOIN towers t ON f.tower_id = t.id
JOIN projects p ON t.project_id = p.id
JOIN salespeople sp ON r.salesperson_id = sp.id
ORDER BY p.name, t.name, ru.unit_number;
```

Build a map: `(project_key, tower_name, unit_number)` → list of DB records (list because a unit can have multiple reservations: desisted + confirmed).

For matching purposes, take the CONFIRMED/PENDING_REVIEW record as the "current" one.

### Step 3: Compare

For each Excel record `(project, tower, unit)`:

**Case A — NEW**: No matching CONFIRMED/PENDING_REVIEW reservation in DB for this unit.
→ Add to `new_records` list.

**Case B — MATCH**: A CONFIRMED/PENDING_REVIEW reservation exists for this unit.
→ Compare these fields:

| Excel Field | DB Field | Comparison |
|---|---|---|
| Cliente | client_names (via rv_clients) | Fuzzy: `strip_accents().lower()` on both sides |
| Asesor | salesperson_name | Exact after normalization |
| Fecha | deposit_date | Date equality |
| Enganche | deposit_amount | Numeric within Q1.00 tolerance |
| Medio | lead_source | Only flag if Excel has value AND DB has different non-null value |

If any field differs → add to `diff_records` with field-by-field detail.

**Case C — ENRICHMENT**: DB record has null `lead_source` but Excel has "Medio" value.
→ Include in proposal as "enrichment" (separate section, not a conflict).

**Case D — DB-ONLY**: Reservation exists in DB but no corresponding Excel row.
→ Log for information only (could be app-created reservations or data from tabs we didn't scan).

### Step 4: Generate Outputs

**Output 1: `scripts/sync_new_reservations.sql`**

For each NEW record, generate INSERT statements following the same pattern as `backfill_reservations.sql`:
- INSERT into `rv_clients` (ON CONFLICT DO NOTHING for existing client names)
- INSERT into `reservations` (status = 'CONFIRMED', reviewed_at = deposit_date)
- INSERT into `reservation_clients` (junction)
- INSERT into `unit_status_log` (audit trail)

Wrap in a single transaction. Include a `changed_by = 'system:excel-sync-2026-03-25'` for traceability.

**Output 2: `docs/sync-diff-proposal-2026-03-25.md`**

Markdown document with:
1. **Summary**: counts (new, matched-no-diff, matched-with-diff, enrichments, db-only)
2. **New Records Inserted**: table of what was auto-inserted
3. **Differences Found**: per-record table showing `| Field | Excel Value | DB Value |`
4. **Lead Source Enrichments**: records where DB lead_source is NULL but Excel has a value, with proposed UPDATE statements
5. **DB-Only Records**: informational list of reservations in DB but not in latest Excel

### Step 5: Execute

1. Run `python3 scripts/sync_reservations.py` — generates both output files
2. Review `scripts/sync_new_reservations.sql` — then execute via Management API
3. Review `docs/sync-diff-proposal-2026-03-25.md` — user decides which updates to apply

## Files to Create

| File | Purpose |
|---|---|
| `scripts/sync_reservations.py` | Main ETL + comparison script |
| `scripts/sync_new_reservations.sql` | Generated INSERT SQL for new records (auto-insert) |
| `docs/sync-diff-proposal-2026-03-25.md` | Generated Markdown proposal for differences |

## Files to Read (not modify)

| File | Purpose |
|---|---|
| `scripts/backfill_reservations.py` | Source of reusable helpers |
| `Reservas/*/Reporte*.xlsx` | Input data (4 files) |
| `Reservas/*/Disponibilidad.xlsx` | Secondary source for tower resolution if needed |

## Risks & Mitigations

1. **Client name fuzzy matching**: Excel names may have slight spelling variations vs DB. Using `strip_accents().lower()` comparison. Edge cases flagged as diffs for human review.
2. **Duplicate unit keys**: A unit desisted and re-reserved will have 2+ DB records. We match against the CONFIRMED/PENDING_REVIEW one. DESISTED records are excluded from comparison.
3. **No Disponibilidad files for tower resolution**: Unlike the original backfill, we don't use Disponibilidad files as a secondary source. Tower must come from the Ventas tab's Torre column (present in BEN/BLT) or from default (B5/CE). If a BEN/BLT row lacks Torre, it's flagged and skipped.
4. **CE stale data**: CE Reporte stops at Oct 2025 — same as DB. Expect zero new records, possibly some diffs in historical data.
5. **Management API auth**: Script reads Supabase CLI token from macOS keychain. If unavailable, falls back to environment variable `SUPABASE_ACCESS_TOKEN`.

## Verification

1. Run script → check stdout for extraction stats and match counts
2. Review `sync_new_reservations.sql` — verify INSERT count matches expected new reservations
3. Review `sync-diff-proposal-2026-03-25.md` — verify diffs are real (not normalization artifacts)
4. Execute SQL → verify DB row counts increased by expected amount
5. Spot-check 3-5 new records in `/admin/reservas` UI

---

## Status Update (2026-03-26)

### Executed
The sync script was executed on 2026-03-25, producing `scripts/sync_new_reservations.sql` (28 new records) and `docs/sync-diff-proposal-2026-03-25.md` (14 differences, 355 lead source enrichments).

### Santa Elena — Not Covered by Sync
Santa Elena (SE) is the **5th project** added to the system after this sync was designed and executed. SE data was loaded separately via **migration 049** (`scripts/migrations/049_santa_elena_seed.sql`) directly from `Reservas/Santa Elena/Disponibilidad.xlsx` and `Reservas/Santa Elena/ReporteSANTAELENA.xlsx`. The sync script covers only BEN, BLT, B5, and CE — the 4 projects with Reporte files in `Reservas/`.

SE data loaded by migration 049:
- 1 project (`santa-elena`, slug `santa-elena`)
- 1 tower ("Principal"), 1 floor ("Planta Baja")
- 11 units (Casa 1–11), 2 models (A: 491.91 m², B: 581 m²), lot areas 386–400.44 m²
- 1 new salesperson (Luccia Calvo) with project assignment
- 5 clients, 5 reservations (4 CONFIRMED + 1 DESISTED), 5 reservation_clients
- 5 unit_status_log entries, 1 freeze_request (Casa 6 FROZEN)
- 1 cotizador_config row (USD, 30% enganche, 8.50% rate, quarterly IUSI)
- 1 new lead_source ('Valla')

If future SE reservation syncs are needed, the sync script would need to be extended to include the SE Reporte file and map to the new project/tower/floor IDs.
