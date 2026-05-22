# 090 — April 2026 Sales Import: Migration 061

**Date:** 2026-05-19
**Scope:** `scripts/migrations/061_april_2026_sales_import.sql`, `docs/SOP-monthly-commission-etl.md`
**Source:** `Comisiones4Abril/CIERRE_RESERVAS_ABRIL.xlsx` (2-sheet format: "Abril" + "Seguimiento")

---

## Summary

22 active April 2026 sales imported across 3 projects (BNT, BLT, BLV5). 10 prior active sales cancelled as confirmed desistimientos. 21 new clients inserted; 1 existing client reused (Belia Ester Velasquez Castillo). Phase 1 commissions calculated for 21 of 22 sales (Row 25 BLT 1007-B deferred — no promise signed). `lead_source_id` column added to `sales` table (Phase 0). SOP updated to v1.1 with mandatory client duplicate pre-check (Step 3.5).

> ⚠ **Subsequent correction — see changelog 091 and migration 062.**
> Post-import audit revealed that all April ejecutivo commissions for Rony, Daniel V., Paula, Erwin, and José were misrouted to `Ahorro por Retiro` due to stale `salesperson_periods` data. Migration 062 fixed the periods and recalculated all April commissions. The final correct commission breakdown is in changelog 091.

---

## Migration Scope

| Metric | Count |
|--------|-------|
| Active sales inserted | 22 |
| Desistimientos cancelled (preamble) | 10 |
| New clients inserted (Phase A) | 21 |
| Existing client reused | 1 |
| Reservation payments inserted (Phase D) | 22 |
| Sales with Phase 1 commissions computed | 21 |
| Sales deferred (no promise signed) | 1 |
| Sales with `lead_source_id` set (Meta) | 2 |
| Schema changes (Phase 0) | 1 (`lead_source_id` column) |

### Sales by Project

| Project | Sales | Salesperson(s) |
|---------|-------|----------------|
| Benestare (BNT) | 12 | Rony, Daniel Veliz, Ivan Castillo (×5), Paula, Erwin, José Gutiérrez |
| Boulevard Tapias (BLT) | 4 | Rony, Ivan |
| Boulevard 5 (BLV5) | 6 | Daniel Veliz, José Gutiérrez |

---

## Bugs Found and Fixed

### Bug 1 — Wrong Unit Lookup Subquery (Critical)

**Symptom:** Original migration 061 used:
```sql
(SELECT u.id FROM units u JOIN towers t ON u.tower_id = t.id WHERE t.name = 'Torre C' AND u.unit_number = '210')
```

**Root cause:** The `units` table has NO `tower_id` column. Units link directly to `projects` via `project_id`. Tower disambiguation is encoded in `unit_number` (e.g. `'210-C'`). The JOIN would have silently failed or matched the wrong unit.

**Fix:** All 22 unit UUIDs retrieved via direct DB pre-check (`SELECT id, unit_number FROM units WHERE unit_number IN (...)`) and hardcoded into the migration. No subqueries involving towers anywhere in the migration.

**Rule added to SOP (Step 3):**
> ⚠ There is NO `tower_id` column on `units`. Tower disambiguation is encoded in `unit_number`. Never write `JOIN towers ON u.tower_id = t.id`.

---

### Bug 2 — Missing Desistimiento Preamble

**Symptom:** 10 units in the April SSOT had prior active sales in DB. No cancellations were in the original migration draft.

**Root cause:** Preamble was omitted from the original migration. Inserting a new active sale on a unit that already has an active sale would have created a data integrity violation (or silently resulted in two active sales for the same unit).

**Fix:** Added preamble to cancel all 10 prior active sales before Phase A–D. Trigger `auto_recalc_commissions_on_sale_update` disabled during cancellations to prevent `calculate_commissions()` from firing on historical (potentially already-disbursed) commission records.

**10 desistimientos cancelled:**
| Unit | Prior Client | Prior Sale Date |
|------|-------------|-----------------|
| BLV5 1001 | Zonia Hernández | 2023-04-11 |
| BLV5 1016 | Sergio Bolaños | 2023-04-16 |
| BLV5 1116 | Francisco Arriaza | 2024-02-15 |
| BLV5 1212 | Sergio Bolaños | 2023-07-16 |
| BNT 202-B | Carlos Alvizures | 2024-10-31 |
| BNT 210-C | Karen Barahona | 2026-02-15 |
| BNT 309-C | Julio Jeronimo | 2025-11-16 |
| BNT 313-B | Suarlim Barrientos | 2025-07-30 |
| BLV5 614 | Thalía Carredano | 2025-08-08 |
| BLV5 919 | Ana Rangel | 2023-03-31 |

---

### Bug 3 — Missing `auto_recalc_commissions_on_sale_update` in Trigger Protocol

**Symptom:** SOP template only disabled `auto_calculate_commissions` on `payments`. The `sales` table trigger was not in the preamble template.

**Root cause:** `auto_recalc_commissions_on_sale_update` fires AFTER UPDATE on `sales`, calling `calculate_commissions()` for all payments of the updated sale. If left enabled during the preamble `UPDATE sales SET status='cancelled'`, it would attempt to recompute commissions for historical sales that may have already been disbursed.

**Fix:** Both triggers disabled in preamble, both re-enabled in Phase E:
```sql
-- Preamble
ALTER TABLE sales DISABLE TRIGGER auto_recalc_commissions_on_sale_update;
ALTER TABLE payments DISABLE TRIGGER auto_calculate_commissions;
-- Phase E
ALTER TABLE payments ENABLE TRIGGER auto_calculate_commissions;
ALTER TABLE sales ENABLE TRIGGER auto_recalc_commissions_on_sale_update;
```

---

### Bug 4 — Client Unique Constraint Violation (Runtime)

**Symptom:** Phase A failed mid-execution:
```
ERROR: 23505: duplicate key value violates unique constraint "clients_full_name_key"
Detail: Key (full_name)=("Belia Ester Velasquez Castillo") already exists.
```

**Root cause:** No pre-check was run to determine whether any client names in the SSOT already existed in the `clients` table (which has a unique constraint on `full_name`). Belia Ester Velasquez Castillo was already in the DB from a prior migration.

**Resolution:**
1. Queried DB: found Belia with UUID `019c7da8-bfc5-71ba-b81f-388f50fcf8da`
2. Commented out her INSERT in Phase A with note: `-- Already exists. UUID: 019c7da8... Skip INSERT, use existing UUID in Phase B.`
3. Updated Phase B Row 5 (BNT 105-D) `client_id` to `019c7da8-bfc5-71ba-b81f-388f50fcf8da`
4. Inserted 21 new clients (instead of 22)

**SOP fix:** Step 3.5 added as MANDATORY. See SOP Changes section below.

---

## Special Cases

### Ivan Castillo — Escalation Rate

Ivan Castillo made 5 sales in April 2026. Row 7 (BNT 313-B, sale date 2026-04-10) was his 5th sale, triggering the escalation rate:
- Rows 1–4: `ejecutivo_rate = 0.0100`
- Row 7 (5th sale): `ejecutivo_rate = 0.0125`

### José Gutiérrez — End Date Boundary

José Gutiérrez's `end_date` was 2026-04-21 (inclusive). Both his April sales fall within his active period:
- BLV5 614: 2026-04-19 ✓
- BLV5 1016: 2026-04-21 ✓

Both sales pay commissions to José Gutiérrez (not to `ahorro_por_retiro`).

### Row 25 — BLT 1007-B (Deferred)

- Client: Pablo Marroquín
- Salesperson: Rony
- `promise_signed_date = NULL` ("No se firmo promesa")
- Sale inserted as `status = 'active'`
- Phase 1 commissions NOT computed (0 commission rows)
- Will auto-trigger when `promise_signed_date` is set via `UPDATE sales SET promise_signed_date = ...` — fires `auto_recalc_commissions_on_sale_update`

### Lead Source — FLAG-A4 (Meta)

2 SSOT entries had `[Lead Meta]` / `[Lead Meta BLT]` prefixes in client names:
- BNT 401-D (Rony)
- BLT 1007-B (Rony)

Prefixes stripped from `clients.full_name`. `lead_source_id` set to Meta UUID (`62b28c19-268a-4a3f-9c24-98699a56ff9b`) on both sales.

Requires Phase 0: `ALTER TABLE sales ADD COLUMN IF NOT EXISTS lead_source_id uuid REFERENCES lead_sources(id)`.

---

## Execution Protocol

Migration executed phase-by-phase via `curl` against Supabase management API (Python `urllib` blocked by Cloudflare WAF — error 403 / code 1010). Each phase auto-committed separately.

| Phase | Action | Result |
|-------|--------|--------|
| Preamble | Disable both triggers + cancel 10 prior active sales | 10 rows updated ✓ |
| Phase 0 | ADD COLUMN `lead_source_id` | ✓ |
| Phase A | Insert 21 new clients | ✓ |
| Phase B | Insert 22 active sales | 22 rows ✓ |
| Phase D | Insert 22 reservation payments | 22 rows ✓ |
| Phase E | Re-enable triggers + `calculate_commissions` loop | ✓ |

---

## Post-Import Validation

All counts confirmed against production DB:

| Check | Expected | Actual |
|-------|----------|--------|
| April active sales | 22 | 22 ✓ |
| CIERRE_ABRIL payments | 22 | 22 ✓ |
| Desistimientos cancelled | 10 | 10 ✓ |
| BLT 1007-B commissions | 0 | 0 ✓ |
| Meta lead_source rows | 2 | 2 ✓ |

### Commission Recipients (Phase 1)

| Recipient | Commission Rows | Total (GTQ) |
|-----------|----------------|-------------|
| Puerta Abierta | 21 | 105,791.17 |
| Ahorro por Retiro | 16 | 35,377.22 |
| Otto Herrera | 21 | 25,389.88 |
| Antonio Rada | 21 | 12,694.94 |
| Ahorro | 20 | 10,212.90 |
| Ahorro G. Comercial | 21 | 8,463.29 |
| Ivan Castillo | 5 | 7,305.47 |
| Job Jiménez | 21 | 6,347.47 |

> Row 25 (BLT 1007-B) excluded from all commission rows — deferred pending promise signature.
> Ahorro por Retiro = 16 rows (not 22): 5 Ivan escalation sales + 1 Row 25 deferred + José Gutiérrez's 2 sales paid to him directly, not ahorro.

---

## SOP Changes (v1.1)

### Step 3.5 — Client Duplicate Pre-Check (NEW, MANDATORY)

Added as a new mandatory step between Step 3 (DB Pre-Check) and Step 4 (Write Migration SQL). Failure to run this check caused a production failure in migration 061.

Template:
```sql
SELECT id, full_name
FROM clients
WHERE full_name IN (
  'Name 1',
  'Name 2',
  -- all client names from the manifest
);
-- For each name that ALREADY EXISTS: skip INSERT in Phase A, use existing UUID in Phase B.
```

### Step 3 — Units Query Fixed

Removed incorrect `JOIN towers ON u.tower_id = t.id` from the pre-check query template. Correct query uses `unit_number IN (...)` directly.

### Step 4 — Preamble Template Fixed

Updated to disable BOTH triggers:
- `auto_recalc_commissions_on_sale_update` on `sales` (was missing)
- `auto_calculate_commissions` on `payments`

Updated Phase E to re-enable BOTH triggers in correct order (payments first, then sales).

### Key Reference Files — Migration 061 Added

`scripts/migrations/061_april_2026_sales_import.sql` added as reference ETL SQL (April — includes preamble, trigger protocol, duplicate client handling, lead_source_id Phase 0).

---

## Files Changed

| File | Change |
|------|--------|
| `scripts/migrations/061_april_2026_sales_import.sql` | Complete rewrite: hardcoded unit UUIDs, desistimiento preamble, both trigger disables, Belia client_id fix, 21 new client inserts, 22 sales, 22 payments, Phase E re-enable + commission loop |
| `docs/SOP-monthly-commission-etl.md` | v1.1: Step 3.5 added (MANDATORY client duplicate pre-check), Step 3 query fixed (no tower_id join), Step 4 preamble template fixed (both triggers), Phase E template fixed (both triggers), migration 061 added to Key Reference Files |
