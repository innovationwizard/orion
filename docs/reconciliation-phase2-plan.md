# Phase 2 Reconciliation Plan — Zero-Diff Audit
## CIERRE_MARZO_RESERVAS.xlsx vs Production DB

**Date:** 2026-05-04
**SSOT:** `ComisionesMarzo/CIERRE_MARZO_RESERVAS.xlsx` (approved by Head of Accountant)
**Scope:** Phase 2 — Enganche cuotas (`down_payment`). Phase 3 — see blocker below.
**Goal:** 0% diff between SSOT payment totals and DB payment records.

---

## Part I — XLSX Manifest

### File Overview

| Property | Value |
|----------|-------|
| Sheets | 27 |
| Canonical project sheets | 4 (see below) |
| Time range (B5, BNT 2.0) | March 2023 → March 2026 |
| Time range (BLT 2.0) | March 2025 → March 2026 |
| Time range (SANTA ELISA) | June 2022 → March 2026 |
| Last column date | 2026-03-31 (all canonical sheets) |
| Accountant approval | Yes — SSOT, read-only |

### Canonical Sheets per Project

| Project (DB name) | Canonical Sheet | Rows | Cols | Legal Entity |
|-------------------|----------------|------|------|-------------|
| Casa Elisa (`casa-elisa`) | `SANTA ELISA` | 111 | 65 | Inversiones Inmobiliarias Santa Elisa, S.A. |
| Boulevard 5 (`boulevard-5`) | `BOULEVARD 5` | 382 | 88 | Inmobiliaria El Gran Jaguar, S.A. |
| Benestare (`benestare`) | `BENESTARE 2.0` | 357 | 82 | Inversiones Inmobiliarias Chinautla, S.A. |
| Bosque Las Tapias (`bosque-las-tapias`) | `BL-TAPIAS 2.0` | 276 | 53 | Inversiones de Castilla, S.A. |

Non-canonical sheets (legacy, budget, alerts, scratch): `BENES`, `BOULEVARD 5 orig.`, `BENESTARE`, `BL-TAPIAS`, `B5 PPTO`, `BENESTARE PPTO`, `BL PPTO`, `B5 Alerta`, `Atrasados B5`, `RESUMEN B5`, `BNT PPTO 2.0`, `RESUMEN BNT 2.0`, `ALERTA BNT 2.0`, `Atrasados Benestare`, `BL PPTO 2.0`, `RESUMEN BLT`, `ALERTA INDECAS 2.0`, `Atrasados BLT`, `SANTA ELISA PPTO`, `Hoja1`, `Hoja2`, `PEND. BTARE`, `RESUMEN GENERAL`. **Do not read from these for reconciliation.**

### Canonical Sheet Structure

**Fixed columns (identical across all 4 canonical sheets):**

| Col name | Type | Notes |
|----------|------|-------|
| Apto | int | Unit number — maps to `units.unit_number` (as string) |
| Tipo / Modelo | str | Unit type code |
| Torre | str | Tower (BNT, BLT only) |
| Vendedor | str | Salesperson name |
| Cliente | str | Buyer name(s); slash-separated for multi-buyer |
| Fecha Reserva | date | Reservation date |
| Estatus | str | Lifecycle status (see below) |
| Precio de Venta | float | Sale price (with tax) |
| Enganche | float | Total down-payment amount |

**Monthly payment columns:** One column per calendar month-end date. Each cell = total cash received from the client for that unit in that calendar month. No sub-column distinguishes payment type within a cell.

**Summary columns (after the last monthly column):**

| Col name | Relevance to reconciliation |
|----------|-----------------------------|
| TOTAL COBROS Y RESERVAS / ENGANCHES | Cross-check: should equal sum of all monthly cells |
| SALDO PENDIENTE ENGANCHE | Remaining Phase 2 balance — not yet collected |
| Monto a Financiar por Banco | Phase 3 amount — not tracked as payments in this file |
| Monto de Reserva Pactado | Agreed reserva deposit amount (Phase 1 reference) |
| Monto de Cuota Pactada | Agreed monthly installment |
| Cuotas Pactadas | Total installments contracted |
| Cuotas Pagadas | Installments paid (count) |
| Status inmueble / Status Cliente | Flags: Vendido, Enganche Completado, Al día, Atrasado |
| Caso Especial / F&F | F&F flag |

**Lifecycle status values:**

| Estatus | Meaning for reconciliation |
|---------|---------------------------|
| `1.Disponible` | No sale — skip entirely |
| `2.Reserva` / `2.Reservado` | Active — reservation deposit paid, enganche ongoing |
| `2. Reserva / Prom. F.` | Active — promesa firmada variant (B5) |
| `4.Plan de pagos` / `4.Plan de Pagos` | Active — enganche fully scheduled |
| `Desistimiento` | Cancelled — skip (map to cancelled sales in DB) |

### March 2026 Payment Totals (from XLSX)

These are the totals visible in the March 2026 column of each canonical sheet. They combine Phase 1 new deposits and Phase 2 installment payments — **not yet disaggregated**.

| Project | Units with March payment | Gross total (XLSX) |
|---------|--------------------------|-------------------|
| Boulevard 5 | 105 | Q 1,800,117.00 |
| Benestare | 107 | Q 187,820.21 |
| Bosque Las Tapias | 42 | Q 100,002.83 |
| Casa Elisa | 9 | Q 1,049,105.70 (USD units — verify currency) |
| **Total** | **263** | **Q 3,137,045.74** |

---

## Part II — Phase Identification Analysis

### Can payment phase origin be identified per cell?

**Phase 1 — Reserva deposit:**
Partially identifiable by inference. There is no explicit type tag per cell. A cell is Phase 1 if:
1. It falls in the same calendar month as `Fecha Reserva`, AND
2. Its amount matches `Monto de Reserva Pactado` (when populated) OR the project-standard reserva amount (Q10,000 B5 / Q1,500 BNT / Q3,000 BLT / $10,000 SE)

If the cell amount exceeds the reserva amount in the same month, the cell is ambiguous: it may contain a combined Phase 1 + Phase 2 payment, or an over-payment. **These must be flagged for manual review, never auto-split.**

Phase 1 for March 2026 new sales was already handled by migration 057. The script will confirm this coverage and skip re-insertion of Phase 1 rows.

**Phase 2 — Enganche cuotas (`down_payment`):**
All non-zero monthly cells that are NOT Phase 1. Concretely:
- Any cell in a month after `Fecha Reserva`, for a unit with `2.Reserva` / `4.Plan de pagos` status.
- Cells in the same month as `Fecha Reserva` where amount > `Monto de Reserva Pactado` → flagged as ambiguous.

**Phase 3 — Crédito / bank disbursement (`financed_payment`):**
**NOT present in this file.** The XLSX tracks only Phase 1 + Phase 2 collections (reserva + enganche). The column `Monto a Financiar por Banco` captures the pending bank financing amount but contains no rows of actual bank disbursements or crédito directo monthly payments. A separate SSOT is required for Phase 3 — see blocker below.

### DB Schema Reference

From `src/lib/types.ts`:

```typescript
PaymentType = "reservation" | "down_payment" | "financed_payment"

Payment = {
  id: string;
  sale_id: string;         // FK → sales.id
  payment_date: string;    // ISO date — use month-end date from XLSX column header
  amount: number;
  payment_type: PaymentType;
  payment_method: string | null;
  notes: string | null;
  created_at: string;
}

Sale = {
  id: string;
  project_id: string;      // FK → projects.id
  unit_id: string;         // FK → units.id
  status: "active" | "cancelled" | "completed";
  sale_date: string;
  price_with_tax: number;
  down_payment_amount: number;
  financed_amount: number;
  promise_signed_date: string | null;
  deed_signed_date: string | null;
  bank_disbursement_date: string | null;
  ejecutivo_rate: number | null;
}
```

Phase allocation logic in `calculate_commissions()`:
- `payment_type = 'reservation'` → Phase 1 (30%)
- `payment_type = 'down_payment'` AND `deed_signed_date` IS NULL → Phase 2 (30%)
- `payment_type = 'financed_payment'` OR `payment_date >= deed_signed_date/bank_disbursement_date` → Phase 3 (40%)

---

## Part III — Phase 3 Blocker

**Phase 3 reconciliation is BLOCKED.** `CIERRE_MARZO_RESERVAS.xlsx` does not contain bank disbursement records or crédito directo monthly payment data. To proceed with Phase 3:

1. Identify the Phase 3 SSOT source (bank disbursement notifications, Odoo/NeoLink bank records, or separate accountant workbook).
2. Verify that `deed_signed_date` and `bank_disbursement_date` are populated correctly on the `sales` rows in DB.
3. Only after Phase 3 SSOT is confirmed should a separate reconciliation script be written.

**This plan covers Phase 2 only.**

---

## Part IV — Zero-Diff Reconciliation Plan

### Principles (from `_THE_RULES.MD`)

- No data changes without 100% confidence in correctness.
- Dry-run is mandatory before any write.
- Script is idempotent — safe to run multiple times.
- No bulk mutations without unit-level verification.
- All discrepancies are logged and reviewed before write mode is activated.

### Stage Overview

```
STAGE 0: PREFLIGHT
  → Verify DB connectivity
  → Confirm unit_number format in DB matches XLSX Apto column
  → Count active sales per project (sanity check vs XLSX)
  → Abort if any pre-condition fails

STAGE 1: EXTRACT
  → Parse 4 canonical XLSX sheets
  → For each non-disponible, non-desistimiento row:
      - Build unit payment timeline: {month_end_date → amount}
      - Classify each cell: phase_1_candidate | phase_2 | ambiguous
  → Output: in-memory dataset of unit timelines

STAGE 2: DISCOVER
  → For each unit in XLSX:
      - Find matching sale in DB via (project_id, unit_number)
      - If no match → flag as UNMATCHED (manual review required)
  → Query all existing payments for matched sales
  → Group by (sale_id, payment_date, payment_type)
  → Output: DB payment map per sale

STAGE 3: COMPARE
  → For each unit:
      - For each Phase 2 cell in XLSX timeline:
          * Check if DB has a down_payment row for this sale on this month
          * MATCH: amounts within tolerance (±Q1.00 rounding)
          * AMOUNT_MISMATCH: row exists but amount differs
          * MISSING_IN_DB: row in XLSX with no DB counterpart
          * EXTRA_IN_DB: DB row with no XLSX counterpart
      - For Phase 1 cells:
          * Verify reservation payment exists in DB (expected from migration 057 / backfill)
          * Flag if absent (but do NOT create Phase 1 rows — handled separately)
  → Output: diff dataset

STAGE 4: REPORT
  → Write docs/reconciliation-diff-phase2-{date}.md:
      - Summary table: project totals XLSX vs DB, delta
      - Per-unit breakdown: unit, month, type, XLSX amount, DB amount, status
      - Ambiguous cells: require manual decision before write
      - Unmatched units: no DB sale found
  → Write scripts/output/reconciliation-diff-phase2-{date}.json (machine-readable)
  → Print summary to stdout
  → STOP — human must review report before proceeding

STAGE 5: GATE
  → Requires ALL of:
      a) Zero ambiguous cells (or all explicitly resolved via --resolve flag)
      b) Zero unmatched units (or all explicitly skipped via --skip-unmatched)
      c) Explicit --write flag
      d) Explicit --confirmed flag
      e) Report file must exist (Stage 4 must have run)
  → Without all 5: print gate status and exit 0 (no error, just not ready)

STAGE 6: EXECUTE
  → For each MISSING_IN_DB row (Phase 2 only):
      - INSERT INTO payments (id, sale_id, payment_date, amount, payment_type, notes)
        WHERE payment_type = 'down_payment'
        AND NOT EXISTS (same sale_id + payment_date + payment_type already)
      - notes = 'Reconciled from CIERRE_MARZO_RESERVAS.xlsx — {date}'
  → For each AMOUNT_MISMATCH row:
      - DO NOT auto-update — append to manual-review list
      - UPDATE only if --force-update explicitly passed (requires separate confirmation)
  → All inserts in a single transaction — rollback on any error
  → After commit: trigger commission recalculation for each inserted payment_id
  → Write execution log to scripts/output/reconciliation-exec-{date}.json
```

### Tolerance and Safety Rules

| Rule | Value | Rationale |
|------|-------|-----------|
| Amount match tolerance | ±Q1.00 | Rounding in Excel formulas |
| Ambiguous cell policy | Flag, never auto-split | A wrong Phase 1/2 split corrupts commission phases |
| Amount mismatch policy | Flag, never auto-update | Could indicate a payment reversal or client correction |
| Unit unmatched policy | Flag, never skip silently | A missing DB sale is a data integrity issue, not a payment issue |
| Desistimiento rows | Skip entirely | Cancelled sales have no Phase 2 payments |
| F&F rows | Include but tag | F&F payments are valid; commission escalation threshold exclusion handled by existing DB flag |
| Transaction atomicity | All-or-nothing per project | No partial project loads |
| Commission recalculation | Triggered per payment after insert | `calculate_commissions()` is idempotent |

### Unit Number Mapping

The XLSX stores unit numbers as integers (e.g., `101`, `307`, `1318`). The DB `units.unit_number` is a string. The script's PREFLIGHT stage must verify the exact format in the DB for each project before mapping:

```sql
SELECT unit_number FROM units
WHERE project_id = '<project_id>'
ORDER BY unit_number LIMIT 10;
```

If DB stores `"101"`, map by `str(xlsx_apto)`.
If DB stores `"Apto 101"` or `"101-A"`, the mapping function must be adjusted. The script must abort if the format cannot be confirmed.

---

## Part V — Script Reference

**Location:** `scripts/reconcile_phase2_payments.py`

**Dependencies:** `openpyxl`, `requests` (or `supabase` Python client), standard library only.

**Environment variables required:**
```
SUPABASE_URL=https://nqaexbpteletuwdbpixq.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<from keychain>
```

**CLI usage:**
```bash
# Stage 0-4: Extract, compare, generate report (dry-run — safe to run anytime)
python3 scripts/reconcile_phase2_payments.py

# Limit to one project
python3 scripts/reconcile_phase2_payments.py --project b5

# Write mode: only after reviewing the report
python3 scripts/reconcile_phase2_payments.py --write --confirmed

# Write mode for one project only
python3 scripts/reconcile_phase2_payments.py --project ben --write --confirmed
```

**Output files:**
- `scripts/output/reconciliation-diff-phase2-YYYY-MM-DD.md` — human-readable diff report
- `scripts/output/reconciliation-diff-phase2-YYYY-MM-DD.json` — machine-readable diff
- `scripts/output/reconciliation-exec-YYYY-MM-DD.json` — execution log (write mode only)

---

## Part VI — Phase 3 Path Forward (future)

When Phase 3 SSOT becomes available:

1. Identify source (bank disbursement letters, NeoLink export, or accountant workbook).
2. Verify `deed_signed_date` / `bank_disbursement_date` columns on `sales` table are populated.
3. Write a separate `reconcile_phase3_payments.py` following the same stage pattern.
4. Phase 3 commission trigger: `payment_type = 'financed_payment'` and `payment_date >= COALESCE(bank_disbursement_date, deed_signed_date)`.

---

*Script: `scripts/reconcile_phase2_payments.py`*
*Report output: `scripts/output/`*
*Last updated: 2026-05-04*
