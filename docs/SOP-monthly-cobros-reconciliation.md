# SOP: Monthly COBROS Reconciliation
## CIERRE_COBROS_[MONTH].xlsx → Production DB (Phase 1 Verification + Phase 2 Import)

**Version:** 1.0
**Created:** 2026-05-20

---

## Purpose

This SOP governs the monthly ingestion of Pati's COBROS closing file (`CIERRE_COBROS_[MES].xlsx`) into the production database. This file is the master collections workbook — it tracks all payment activity for every active unit across all projects.

**Scope of this SOP:**
- **Phase 1 (reservation):** Verify that reservation deposits already imported via the companion CIERRE_RESERVAS migration match what COBROS records for April. Flag discrepancies.
- **Phase 2 (down_payment):** Import all ongoing monthly installment payments for active units.

**This SOP does NOT cover:**
- New sales import (covered by `SOP-monthly-commission-etl.md` / CIERRE_RESERVAS)
- Phase 3 (financed_payment / escritura) — no Phase 3 data in this file

**Relationship to CIERRE_RESERVAS SOP:**
The CIERRE_RESERVAS ETL runs first (inserts new sales + Phase 1 reservation payments). This SOP runs second — it verifies those Phase 1 inserts and adds all Phase 2 installments.

**Prerequisite:** CIERRE_RESERVAS ETL migration must be complete before this SOP runs.

---

## File Naming & Location Convention

| Month | Folder | SSOT File |
|-------|--------|-----------|
| March 2026 | `ComisionesMarzo/` | `CIERRE_MARZO_RESERVAS.xlsx` (27-sheet format — same type, legacy name) |
| April 2026 | `Comisiones4Abril/` | `CIERRE_COBROS_ABRIL.xlsx` |
| May 2026 | `Comisiones5Mayo/` | `CIERRE_COBROS_MAYO.xlsx` (expected) |

**Rule:** SSOT files are read-only. Never modify them. Never rename them.

---

## Sheet Structure

The COBROS file has many sheets. Only 3 are canonical data sources.

| Sheet | Type | ETL Action |
|-------|------|-----------|
| `BOULEVARD 5` | Canonical | **Import target-month column** |
| `BENESTARE 2.0` | Canonical | **Import target-month column** |
| `BL-TAPIAS 2.0` | Canonical | **Import target-month column** |
| `SANTA ELISA` | Legacy/Inactive | Skip — historical sheet for Casa Elisa project (near sold-out). No active payments expected. |
| All other sheets (PPTO, RESUMEN, ALERTA, Atrasados, legacy, Hoja1) | Non-canonical | Skip |

> **Every month, re-confirm sheet names and header row positions before parsing.** The file format has evolved (March had 27 sheets under different names).

---

## Step-by-Step Procedure

### Step 0 — Receive and Verify SSOT

- [ ] Confirm the file was delivered by Pati (or accountant) and is marked SSOT.
- [ ] Place file in the correct `Comisiones[N][Month]/` folder.
- [ ] Do NOT modify the file. Open read-only.
- [ ] Confirm CIERRE_RESERVAS ETL for the same month is already complete (migration exists and was executed).

---

### Step 1 — Generate Manifest

Parse the SSOT using Python/openpyxl (`data_only=True`, read-only):

```bash
python3 -c "
import openpyxl
wb = openpyxl.load_workbook('Comisiones[N][Month]/CIERRE_COBROS_[MES].xlsx', data_only=True)
print('Sheets:', wb.sheetnames)
for ws in wb.worksheets:
    print(ws.title, ws.dimensions, ws.max_row, ws.max_column)
"
```

Document in `docs/manifest-CIERRE_COBROS_[MES].md`:

1. Sheet index — which sheets exist, which are canonical, which are skipped
2. Column structure of each canonical sheet (header row, date columns, summary columns)
3. April `[MONTH]` column location in each canonical sheet
4. All non-zero, non-Disponible, non-Desistimiento data rows for the target month
5. Payment totals by project
6. Phase classification (Phase 1 vs Phase 2 vs Ambiguous)
7. Cross-reference against CIERRE_RESERVAS manifest for the same month
8. All anomaly flags (discrepancies, missing entries, unusual amounts)
9. Open questions (blocking before SQL can be written)

Reference format: [docs/manifest-CIERRE_COBROS_ABRIL.md](manifest-CIERRE_COBROS_ABRIL.md)

---

### Step 2 — Phase Classification

For each data row with a non-zero target-month payment:

```
IF fecha_reserva is in target month
  AND april_pmt ≈ Monto_de_Reserva_Pactado (±Q1.00)
  → Phase 1 candidate (verify against CIERRE_RESERVAS manifest)

IF fecha_reserva is in target month
  AND Monto_de_Reserva_Pactado is NULL
  OR amount differs from Monto_de_Reserva_Pactado
  → AMBIGUOUS — cross-reference CIERRE_RESERVAS manifest

IF fecha_reserva is BEFORE target month
  → Phase 2 (down_payment installment)
```

**Phase 1 handling:**
- If amount matches DB reservation payment already inserted → reconciled, no action.
- If amount differs → flag as discrepancy. Do not auto-correct.
- If no DB reservation payment exists (unit missing from prior ETL) → flag as missing, do not insert without resolution.

**Phase 2 handling:**
- Insert as `payment_type = 'down_payment'` for each row.
- One payment per unit per month (the cell value is the total collected that month).
- Use **month-end date** from the column header as `payment_date` (not the reservation date).
- Notes field: `'CIERRE_COBROS_[MES] import'`

---

### Step 3 — DB Pre-Check

Before writing the migration SQL:

```sql
-- 1. Confirm all units from the manifest exist in DB
--    For BNT/BLT: unit_number format is 'NNN-T' (e.g. '305-C', '1103-C')
--    For B5: unit_number is plain integer string (e.g. '614', '1016')
SELECT id, unit_number, project_id FROM units
WHERE unit_number IN ('614', '1016', '919', '305-C', '1103-C', ...)
ORDER BY unit_number;

-- 2. Confirm all active sales for these units
SELECT u.unit_number, s.id AS sale_id, s.sale_date, s.status
FROM sales s
JOIN units u ON s.unit_id = u.id
WHERE s.status = 'active'
  AND u.unit_number IN (...);

-- 3. Check Phase 1 payments already in DB (from CIERRE_RESERVAS migration)
--    Verify amounts match COBROS data for new-month reservations
SELECT u.unit_number, p.payment_date, p.amount, p.payment_type
FROM payments p
JOIN sales s ON p.sale_id = s.id
JOIN units u ON s.unit_id = u.id
WHERE p.payment_type = 'reservation'
  AND s.sale_date >= '[MONTH]-01'
  AND s.sale_date <= '[MONTH]-[LAST]';

-- 4. Check for duplicate Phase 2 payments (idempotency guard)
--    Before inserting, verify no down_payment row exists for same sale_id + payment_date
SELECT u.unit_number, p.sale_id, p.payment_date, p.amount, p.payment_type
FROM payments p
JOIN sales s ON p.sale_id = s.id
JOIN units u ON s.unit_id = u.id
WHERE p.payment_type = 'down_payment'
  AND p.payment_date = '[MONTH_END_DATE]'  -- e.g. '2026-04-30'
ORDER BY u.unit_number;
-- If any rows returned: skip those units in Phase B. They were already imported.
```

---

### Step 4 — Resolve Blocking Questions

Do not write SQL until all BLOCKING flags from the manifest are resolved.

Typical recurring blocking questions for COBROS:

| Question | Who Resolves |
|----------|-------------|
| Amount discrepancy between COBROS and RESERVAS | Pati / accountant |
| Client name mismatch between COBROS and RESERVAS | Pati |
| Torre discrepancy for BNT/BLT units | Pati |
| Unit missing from COBROS (in RESERVAS but not COBROS) | Pati |
| SANTA ELISA sheet missing April column | Pati |
| Large unusual payments (possible Phase 3) | CFO or Pati |

Non-blocking flags can proceed; document them in the migration preamble.

---

### Step 5 — Write Migration SQL

Create: `scripts/migrations/[NNN]_[month]_2026_cobros_phase2_import.sql`

Where `[NNN]` is the next sequential migration number.

**Migration structure:**

```sql
-- ============================================================================
-- Migration [NNN]: [Month] 2026 COBROS Import — Phase 2 Down Payments
-- ============================================================================
-- Source: Comisiones[N][Month]/CIERRE_COBROS_[MES].xlsx
-- [N] Phase 2 payments across [P] projects
-- Phase 1 verification: [M] matches, [X] discrepancies (see below)
-- ============================================================================

-- ============================================================================
-- PREAMBLE: Disable trigger during bulk insert, re-enable after
-- ============================================================================
-- Disabling auto_calculate_commissions prevents premature commission calc
-- during insertion. We recalculate in date order after all inserts.
ALTER TABLE payments DISABLE TRIGGER auto_calculate_commissions;

-- ============================================================================
-- PHASE A: Phase 1 Reconciliation Notes (no SQL for matched rows)
-- ============================================================================
-- [List matched Phase 1 rows here as comments — informational, no SQL needed]
-- ✓ BNT Apto 202 TB / Diego Culajay — DB: Q1,500 = COBROS: Q1,500. Reconciled.
-- ✓ BNT Apto 103 TA / Carlos Mejia  — DB: Q1,500 = COBROS: Q1,500. Reconciled.
-- ... (all matched Phase 1 rows)

-- [Phase 1 discrepancy rows excluded — document here with flags]
-- ⚠ BLV5 Apto 1212 — BLOCKED. COBROS Q50,000 ≠ DB Q10,000. FLAG-C2 open.

-- ============================================================================
-- PHASE B: Insert Phase 2 payments (down_payment)
-- ============================================================================
-- payment_date = month-end date from column header (e.g. 2026-04-30)
-- payment_type = 'down_payment'
-- notes = 'CIERRE_COBROS_[MES] import'
-- sale_id obtained from: SELECT s.id FROM sales s JOIN units u ON s.unit_id = u.id
--   WHERE u.unit_number = '[unit]' AND s.status = 'active'

-- Idempotency guard: use INSERT ... WHERE NOT EXISTS pattern
INSERT INTO payments (id, sale_id, payment_date, amount, payment_type, notes)
SELECT
  gen_random_uuid(),
  s.id,
  '[MONTH_END_DATE]',
  [AMOUNT],
  'down_payment',
  'CIERRE_COBROS_[MES] import'
FROM sales s
JOIN units u ON s.unit_id = u.id
WHERE u.unit_number = '[UNIT_NUMBER]'
  AND s.status = 'active'
  AND NOT EXISTS (
    SELECT 1 FROM payments p2
    WHERE p2.sale_id = s.id
      AND p2.payment_date = '[MONTH_END_DATE]'
      AND p2.payment_type = 'down_payment'
  );

-- [Repeat for all Phase 2 rows]

-- ============================================================================
-- PHASE C: Re-enable trigger, calculate commissions in date order
-- ============================================================================
ALTER TABLE payments ENABLE TRIGGER auto_calculate_commissions;

DO $$
DECLARE
  r record;
  v_count int := 0;
BEGIN
  FOR r IN
    SELECT p.id
    FROM payments p
    WHERE p.notes LIKE 'CIERRE_COBROS_[MES]%'
      AND p.payment_type = 'down_payment'
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

### Step 6 — Validate Before Executing

```sql
BEGIN;
-- paste migration here
-- check results:
SELECT COUNT(*) FROM payments
WHERE notes LIKE 'CIERRE_COBROS_[MES]%' AND payment_type = 'down_payment';

SELECT COUNT(*) FROM commissions
WHERE created_at >= NOW() - INTERVAL '5 minutes';

SELECT SUM(amount) FROM payments
WHERE notes LIKE 'CIERRE_COBROS_[MES]%' AND payment_type = 'down_payment';
-- Should equal manifest total (Phase 2 only)

ROLLBACK; -- or COMMIT if results look correct
```

Verify:
- Payment count matches manifest Phase 2 row count
- Total amount matches manifest Phase 2 total
- Commission rows generated = payments × expected recipients
- No duplicate payments (run Step 3 query 4 again after ROLLBACK)

---

### Step 7 — Execute in Production

```bash
# Via Supabase dashboard SQL editor, or psql:
psql $DATABASE_URL -f scripts/migrations/[NNN]_[month]_2026_cobros_phase2_import.sql
```

Or paste directly into Supabase SQL editor (preferred for audit trail).

---

### Step 8 — Post-Import Verification

```sql
-- 1. Confirm payment count and total for the month
SELECT payment_type, COUNT(*), SUM(amount)
FROM payments
WHERE notes LIKE 'CIERRE_COBROS_[MES]%'
GROUP BY payment_type;

-- 2. Confirm commissions were generated for Phase 2 payments
SELECT commission_phase, COUNT(*), SUM(amount_gtq)
FROM commissions
WHERE payment_id IN (
  SELECT id FROM payments WHERE notes LIKE 'CIERRE_COBROS_[MES]%'
)
GROUP BY commission_phase;

-- 3. Spot-check one Phase 2 commission
SELECT p.amount AS payment_amt, s.price_without_tax, s.ejecutivo_rate,
       c.commission_phase, c.amount_gtq, c.recipient_type
FROM payments p
JOIN sales s ON p.sale_id = s.id
JOIN commissions c ON c.payment_id = p.id
WHERE p.notes LIKE 'CIERRE_COBROS_[MES]%'
  AND p.payment_type = 'down_payment'
LIMIT 10;

-- 4. Check for orphaned payments (no commissions)
SELECT p.id, p.sale_id, p.amount, p.payment_type
FROM payments p
LEFT JOIN commissions c ON c.payment_id = p.id
WHERE p.notes LIKE 'CIERRE_COBROS_[MES]%'
  AND c.id IS NULL;
```

---

### Step 9 — Create Changelog Entry

Create: `changelog/[NNN]_[DATE]_[month]-2026-cobros-phase2-import.md`

Include:
- Migration number and name
- Payment count and total by project
- Phase 1 reconciliation summary (matches, discrepancies)
- Phase 2 import summary
- Open flags carried to next month

---

## Recurring Checks Per Month

| Check | What to Look For |
|-------|-----------------|
| New canonical sheet names | Pati may rename or restructure sheets. Re-confirm sheet names before parsing. |
| Header row position | Re-confirm header row (currently row 6 for B5/BNT/BLT). |
| April column position | Confirm the target month column exists and its index. |
| Phase 1 amount discrepancies | Compare each new-month reservation payment in COBROS against DB and CIERRE_RESERVAS SSOT. |
| Missing units (in RESERVAS but not COBROS) | New sales may not be added to COBROS immediately. |
| Duplicate rows per unit | BENESTARE 2.0 has been observed with multiple rows for the same unit (re-sell scenario). Verify before inserting. |
| Ambiguous large payments | Payments >> cuota_pactada may be lump-sum payoffs, overpayments, or Phase 3 bank disbursements. Verify before inserting. |
| Micro payments (< Q1) | Rounding artifacts. Import as-is at exact amount. |
| Status = `2.Reserva` with Precio=0 | Newly added entries. Verify classification before treating as Phase 2. |

---

## Key Reference Files

| File | Purpose |
|------|---------|
| `docs/manifest-CIERRE_COBROS_ABRIL.md` | April 2026 COBROS manifest (first reference month) |
| `docs/manifest-CIERRE_RESERVAS_ABRIL.md` | April 2026 RESERVAS manifest (companion file) |
| `docs/reconciliation-phase2-plan.md` | Phase 2 reconciliation design doc (March baseline, 27-sheet format) |
| `docs/SOP-monthly-commission-etl.md` | Companion SOP for CIERRE_RESERVAS (new sales import) |
| `scripts/migrations/061_april_2026_sales_import.sql` | Reference ETL (April RESERVAS — includes trigger protocol, duplicate client handling) |
| `public/metadata/commission-rules.json` | Commission rules, phase allocation, recipient definitions |
