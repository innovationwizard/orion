# SOP: Monthly Commission ETL
## CIERRE_RESERVAS_[MONTH].xlsx → Production DB

**Version:** 1.2
**Created:** 2026-05-19
**Updated:** 2026-05-19 — v1.1: added client duplicate pre-check (Step 3.5), fixed unit lookup queries, added desistimiento trigger protocol; v1.2: added salesperson_periods pre-check (Step 3, query 6)

---

## Purpose

This SOP governs the monthly ingestion of Pati's SSOT closing file (`CIERRE_RESERVAS_[MES].xlsx`) into the production database so that the commission calculation engine can compute and disburse Phase 1 commissions (and trigger downstream phases when conditions are met).

This procedure runs once per month after Pati delivers the closing file.

---

## File Naming & Location Convention

| Month | Folder | SSOT File |
|-------|--------|-----------|
| February 2026 | `Comisiones2Febrero/` | `CIERRE DE VENTAS FEBRERO 2026.xlsx` |
| March 2026 | `Comisiones3Marzo/` | `CIERRE_RESERVAS_MARZO.xlsx` |
| April 2026 | `Comisiones4Abril/` | `CIERRE_RESERVAS_ABRIL.xlsx` |
| May 2026 | `Comisiones5Mayo/` | `CIERRE_RESERVAS_MAYO.xlsx` (expected) |

**Rule:** SSOT files are read-only. Never modify them. Never rename them.

---

## Sheet Structure (as of April 2026)

Every monthly SSOT has evolved over time. Confirm sheet names before parsing.

| Sheet | Contents | ETL Action |
|-------|---------|-----------|
| `[Month Name]` (e.g., "Abril") | New reservation closures for the month | **Import** |
| `Seguimiento` | Tracking reference for prior-month pending entries | **Skip** — already imported in previous migration |

> **Note:** The March SSOT (CIERRE_RESERVAS_MARZO.xlsx) had 27 sheets. The April SSOT simplified to 2 sheets. Always re-confirm structure before running.

---

## Step-by-Step Procedure

### Step 0 — Receive and Verify SSOT

- [ ] Confirm the file was delivered by Pati (or accountant) and is marked SSOT.
- [ ] Place file in the correct `Comisiones[N][Month]/` folder.
- [ ] Do NOT modify the file. Open read-only.
- [ ] Run manifest generation (see Step 1).

---

### Step 1 — Generate Manifest

Parse the SSOT using Python/openpyxl (read-only, `data_only=True`):

```bash
python3 -c "
import openpyxl
wb = openpyxl.load_workbook('Comisiones[N][Month]/CIERRE_RESERVAS_[MES].xlsx', data_only=True)
print([ws for ws in wb.sheetnames])
# then iterate all sheets, print all non-empty rows
"
```

Document in `docs/manifest-CIERRE_RESERVAS_[MES].md`:
1. Sheet index with row/col counts
2. Column headers and DB mapping
3. All data rows (per project block)
4. Commission math verification (formula checks)
5. All anomaly flags (partial rows, missing fields, boundary cases)
6. ETL scope determination (what is new vs. already imported)
7. Open questions (blocking issues that require answers before writing SQL)

Reference format: [docs/manifest-CIERRE_RESERVAS_ABRIL.md](manifest-CIERRE_RESERVAS_ABRIL.md)

---

### Step 2 — Resolve Blocking Questions

Before writing SQL, resolve all flags from the manifest. Typical recurring questions:

| Question | Who Resolves |
|----------|-------------|
| Partial/anomalous rows | Pati (original source) |
| Unsigned promise entries | Commercial director or Pati |
| Offboarded salesperson boundary dates | Pati or CFO |
| New asesor not yet in DB | Pati or admin |
| Lead source prefix in client name | Clarify naming convention with Pati |
| `price_without_tax` formula | CFO confirmation |

Do not proceed to Step 3 until all BLOCKING questions are resolved.

---

### Step 3 — DB Pre-Check

Before writing the migration, run these queries to avoid conflicts.

> **IMPORTANT — `units` table schema:** `units` links directly to `projects` via `project_id`.
> There is NO `tower_id` column on `units`. Tower disambiguation is encoded in `unit_number`
> (e.g. `'210-C'` = unit 210, Torre C). Never write `JOIN towers ON u.tower_id = t.id`.

```sql
-- 1. Confirm all units exist and retrieve their UUIDs
--    Use hardcoded unit_number values as they appear in the DB (with tower suffix if multi-tower)
SELECT id, unit_number, status, project_id
FROM units
WHERE unit_number IN ('210-C','103-A','309-C','105-D','1103-C','508-B','1016','614',...)
ORDER BY unit_number;
-- ⚠ Copy the UUIDs from this output — use them directly in Phase B (no subqueries).

-- 2. Confirm no active sale on any unit being imported
SELECT u.unit_number, s.id AS sale_id, s.status, s.sale_date, c.full_name AS prior_client
FROM sales s
JOIN units u ON s.unit_id = u.id
JOIN clients c ON s.client_id = c.id
WHERE s.status = 'active'
  AND u.id IN ('[uuid1]','[uuid2]',...);  -- use UUIDs from query 1
-- If any rows returned: those are re-sells (desistimientos). Document sale IDs for preamble.

-- 3. Confirm all asesores exist and are active
SELECT id, full_name, is_active FROM salespeople
WHERE full_name ILIKE ANY(ARRAY['%Rony%','%Daniel Veliz%','%Ivan Castillo%',...]);

-- 4. Confirm lead sources exist (for any [Lead Meta] entries)
SELECT id, name FROM lead_sources WHERE name IN ('Meta','Referido',...);

-- 5. Confirm project IDs
SELECT id, name FROM projects
WHERE name ILIKE ANY(ARRAY['%Benestare%','%Tapias%','%Boulevard%']);

-- 6. ⚠ Confirm salesperson_periods for every rep in the SSOT
--    calculate_commissions() uses MAX(end_date) to route ejecutivo commissions.
--    If MAX(end_date) < payment_date → commission goes to ahorro_por_retiro (not the rep).
--    Active reps must have end_date = NULL. Offboarded reps must have end_date = their last day.
SELECT s.full_name, sp.start_date, sp.end_date
FROM salespeople s
LEFT JOIN salesperson_periods sp ON sp.salesperson_id = s.id
WHERE s.full_name ILIKE ANY(ARRAY['%Rony%','%Daniel Veliz%','%Ivan Castillo%',...])
ORDER BY s.full_name, sp.start_date;
-- ✓ Active rep: must have ZERO rows with end_date IS NOT NULL.
--   The function evaluates MAX(end_date) across all non-null rows only.
--   Any single row with a past end_date will trigger redirection to
--   ahorro_por_retiro — even if an open period (end_date=NULL) also exists.
-- ✓ Offboarded rep: must have MAX(end_date) >= their last sale's payment_date.
-- If stale closed periods exist for active reps: delete them and insert a
-- single open period (end_date=NULL). See migration 062 as reference.
```

---

### Step 3.5 — Client Duplicate Pre-Check ⚠ MANDATORY

> **The `clients` table has a unique constraint on `full_name`.** Inserting a client whose
> name already exists will fail the entire migration. This check is REQUIRED before writing
> Phase A. Failing to run this caused a production failure in migration 061 (April 2026).

```sql
-- Run BEFORE writing Phase A. Replace names with those from the SSOT manifest.
SELECT id, full_name
FROM clients
WHERE full_name IN (
  'Karol del Rosario Mayen Gutierrez',
  'Belia Ester Velasquez Castillo',
  'Carlos Roberto Sandoval Najera / Carlos Ramon Chajon Aceituno',
  -- ... all client names from the manifest
);
-- For each name that ALREADY EXISTS: skip the INSERT in Phase A and use the existing UUID
-- as client_id in Phase B for that sale row.
```

For any existing client found:
1. Comment out their INSERT in Phase A with a note: `-- [Name] already exists. UUID: [existing_id]. Skip INSERT, use existing UUID in Phase B.`
2. Replace the generated UUID in Phase B's client_id with the existing client's UUID.

If a unit has an existing active sale, determine if it is a re-sell. Confirm with Pati.
If confirmed as desistimiento: add cancellation to migration preamble (see Step 4 — Preamble).

---

### Step 4 — Write Migration SQL

Create: `scripts/migrations/[NNN]_[month]_2026_sales_import.sql`

Where `[NNN]` is the next sequential migration number.

**Migration structure (from migrations 057 + 061):**

```sql
-- ============================================================================
-- Migration [NNN]: [Month] 2026 Sales Import (CIERRE_RESERVAS_[MES].xlsx SSOT)
-- ============================================================================
-- Source: Comisiones[N][Month]/CIERRE_RESERVAS_[MES].xlsx
-- [N] active sales + [M] desistimientos cancelled in preamble
-- unit_id values: hardcoded UUIDs from DB pre-check (Step 3). NO tower subqueries.
-- ============================================================================

-- ============================================================================
-- PREAMBLE: Disable both triggers, then cancel prior active sales (desistimientos)
-- ============================================================================
-- Disabling auto_recalc_commissions_on_sale_update prevents calculate_commissions()
-- from firing on historical records when we cancel them. Historical commissions
-- (potentially already disbursed) are left intact.
ALTER TABLE sales DISABLE TRIGGER auto_recalc_commissions_on_sale_update;
ALTER TABLE payments DISABLE TRIGGER auto_calculate_commissions;

-- Cancel prior active sales on units being re-sold (confirmed desistimientos)
UPDATE sales
SET status = 'cancelled', updated_at = NOW()
WHERE id IN (
  '[prior_sale_id_1]',  -- [unit] ([prior client name], [prior sale_date])
  '[prior_sale_id_2]'
);

-- ============================================================================
-- PHASE 0: Schema changes (if any — e.g. ADD COLUMN)
-- ============================================================================

-- ============================================================================
-- PHASE A: Insert new clients
-- ============================================================================
-- Only clients NOT already in DB.
-- Full name exactly as in SSOT (except: strip [Lead Meta] and similar prefixes).
INSERT INTO clients (id, full_name) VALUES (gen_random_uuid(), '...');

-- ============================================================================
-- PHASE B: Insert active sales
-- ============================================================================
INSERT INTO sales (
  id, project_id, unit_id, client_id, sales_rep_id,
  sale_date, price_with_tax, price_without_tax,
  down_payment_amount, financed_amount, status,
  promise_signed_date, ejecutivo_rate, referral_applies, referral_name
) VALUES (...);
-- financed_amount = price_with_tax - down_payment_amount

-- ============================================================================
-- PHASE C: Insert desistimientos / cancelled sales (if any)
-- ============================================================================
-- No promise_signed_date, no ejecutivo_rate, status='cancelled'
INSERT INTO sales (
  id, project_id, unit_id, client_id, sales_rep_id,
  sale_date, price_with_tax, price_without_tax,
  down_payment_amount, financed_amount, status
) VALUES (...);

-- ============================================================================
-- PHASE D: Insert reservation payments (active sales only)
-- ============================================================================
INSERT INTO payments (id, sale_id, payment_date, amount, payment_type, notes)
VALUES (gen_random_uuid(), '[sale_id]', '[sale_date]', [reserva_amount], 'reservation', 'CIERRE_[MES] import');

-- ============================================================================
-- PHASE E: Re-enable BOTH triggers, calculate commissions in date order
-- ============================================================================
ALTER TABLE payments ENABLE TRIGGER auto_calculate_commissions;
ALTER TABLE sales ENABLE TRIGGER auto_recalc_commissions_on_sale_update;

DO $$
DECLARE
  r record;
  v_count int := 0;
BEGIN
  FOR r IN
    SELECT p.id
    FROM payments p
    JOIN sales s ON p.sale_id = s.id
    WHERE s.status = 'active'
      AND s.sale_date >= '[MONTH]-01'
      AND s.sale_date <= '[MONTH]-[LAST_DAY]'
    ORDER BY p.payment_date, p.id
  LOOP
    PERFORM calculate_commissions(r.id);
    v_count := v_count + 1;
  END LOOP;
  RAISE NOTICE 'Commission calculation complete: % payments', v_count;
END;
$$;
```

---

### Step 5 — Validate Before Executing

Run the migration in a **dry-run** or transaction with rollback first:

```sql
BEGIN;
-- paste migration here
-- check results:
SELECT COUNT(*) FROM sales WHERE sale_date >= '[month]-01' AND sale_date <= '[month]-[last]';
SELECT COUNT(*) FROM payments WHERE notes LIKE 'CIERRE_[MES]%';
SELECT COUNT(*) FROM commissions WHERE created_at >= NOW() - INTERVAL '5 minutes';
ROLLBACK; -- or COMMIT if results look correct
```

Verify:
- Sale count matches manifest (e.g., 21 for April)
- Payment count matches sale count (1 reservation per active sale)
- Commission rows generated = sales × expected_recipients (6 recipients per sale minimum)

---

### Step 6 — Execute in Production

```bash
# Via Supabase dashboard SQL editor, or psql:
psql $DATABASE_URL -f scripts/migrations/[NNN]_[month]_2026_sales_import.sql
```

Or paste directly into Supabase SQL editor (preferred for audit trail).

---

### Step 7 — Post-Import Verification

```sql
-- 1. Confirm sale count for the month
SELECT COUNT(*), MIN(sale_date), MAX(sale_date)
FROM sales
WHERE sale_date BETWEEN '[month]-01' AND '[month]-[last]'
  AND status = 'active';

-- 2. Confirm commissions were generated
SELECT recipient_type, COUNT(*), SUM(amount_gtq)
FROM commissions
WHERE sale_id IN (
  SELECT id FROM sales
  WHERE sale_date BETWEEN '[month]-01' AND '[month]-[last]'
)
GROUP BY recipient_type
ORDER BY recipient_type;

-- 3. Spot-check one sale's commission math
SELECT s.id, s.price_without_tax, s.ejecutivo_rate,
       s.price_without_tax * s.ejecutivo_rate AS expected_total,
       SUM(c.amount_gtq) FILTER (WHERE c.commission_phase = 1) AS phase1_total
FROM sales s
JOIN commissions c ON c.sale_id = s.id
WHERE s.sale_date = '[spot_check_date]'
GROUP BY s.id, s.price_without_tax, s.ejecutivo_rate;

-- 4. Check for orphaned payments (no commissions)
SELECT p.id, p.sale_id, p.amount
FROM payments p
LEFT JOIN commissions c ON c.payment_id = p.id
WHERE p.notes LIKE 'CIERRE_[MES]%'
  AND c.id IS NULL;
```

---

### Step 8 — Create Changelog Entry

Create: `changelog/[NNN]_[DATE]_[month]-2026-sales-import.md`

Include:
- Migration number and name
- Sale count by project
- Any anomalies resolved and how
- Open items (if any) carried to next month

---

## Recurring Checks Per Month

| Check | What to Look For |
|-------|-----------------|
| New asesor | Asesor in SSOT not in `salespeople` table — must insert before Phase B |
| Offboarded asesor | Asesor with `is_active=false` or period end_date — confirm commission routing |
| Re-sold units | Unit already has `status='active'` sale — must cancel prior before inserting |
| Escalation rate | If any asesor has 5+ sales in the month, verify `ejecutivo_rate` matches SSOT |
| Lead source prefixes | Strip `[Lead Meta]`, `[Referido]`, etc. from `full_name`; store separately if schema supports |
| Multi-client entries | Names joined by `/` or `y` — store full compound name as-is (established precedent in migration 057) |
| Unsigned promises | "No se firmo promesa" — clarify with Pati before importing |
| Partial rows | Rows missing project/client/unit — flag as anomaly, do not import without resolution |

---

## Key Reference Files

| File | Purpose |
|------|---------|
| `docs/manifest-CIERRE_MARZO_RESERVAS.md` | March 2026 manifest (27-sheet format) |
| `docs/manifest-CIERRE_RESERVAS_ABRIL.md` | April 2026 manifest (2-sheet format) |
| `scripts/migrations/057_march_2026_sales_import.sql` | Reference ETL SQL (March) |
| `scripts/migrations/061_april_2026_sales_import.sql` | Reference ETL SQL (April — includes preamble, trigger protocol, duplicate client handling) |
| `scripts/migrations/062_fix_salesperson_periods_active_reps.sql` | Reference fix: stale salesperson_periods causing active rep commissions to route to ahorro_por_retiro |
| `public/metadata/commission-rules.json` | Commission rules, rates, recipient definitions |
| `docs/reconciliation-phase2-plan.md` | Phase 2 (down payment) reconciliation procedure |
| `scripts/reconcile_phase2_payments.py` | Phase 2 reconciliation script |
| `scripts/commission-debug/README.md` | Commission validation and debug workflow |
