# Investigation: 33 "DISPONIBLE" Units with Credit Data

**Date:** 2026-03-20
**Context:** During the Créditos dashboard backfill (Phase 2), 33 units were flagged as DISPONIBLE in the extract script but contained non-null credit fields (income_source, bank, fha, cuotas_enganche). Per production rules: if a row has income data, it's logically necessary that reservation data exists. This investigation cross-references the SSOT Excel files and the production database to find that data.

---

## Executive Summary

The 33 units fall into **4 distinct categories**:

| Category | Count | Root Cause | Action Required |
|---|---|---|---|
| A. Template defaults | 7 | FHA column has template `X` markers, not client data | Filter out — not real data |
| B. Ghost desist residue | 2 | Desisted deals with partially cleared rows | Link to desisted reservation if exists, or create stub |
| C. **Hidden reservations** | **11** | **Client names in separate Excel sheet ("INFO PARA REPORTES") never loaded into DB** | **Critical: load these into DB** |
| D. Orphan income markers | 13 | Income source `X` marks without any client in any sheet | Investigate per-unit with Pati |

---

## Category A: Template Defaults (7 units — BEN Torre A)

**Units:** 103, 105, 202, 204, 402, 406, 607

**Excel evidence:**
- Vendor = "Disponible", Client = empty, ALL pricing = 0
- The only non-null credit field is `fha=true` (column AE has `X`)
- No income_source, no bank, no cuotas_enganche
- No data in any other column beyond physical attributes

**Root cause:** The FHA column (`AE`) and Crédito/Financiamiento column (`AD`) contain template `X` markers indicating eligible financing modes for the unit type — NOT client-specific selections. This is a data quality issue in the Excel template where available units have financing eligibility pre-filled.

**DB cross-reference:**
- Only unit **204** has a desisted reservation in the DB (client: Abigail García, desisted 2025-01-30, reason: "tiempo de entrega / Cambio de ubicación"). The FHA marker on 204 is still a template default, not from this client.
- The other 6 units (103, 105, 202, 402, 406, 607) have NO reservation history in the DB whatsoever.

**Action:** No backfill needed. These 7 units should be **excluded** from credit profile updates. The extract script's `check_x()` function should not be treated as client data for these units.

**Backfill fix:** Already correctly skipped by the current script (they have no reservation to attach to).

---

## Category B: Ghost Desist Residue (2 units — BEN Torre B)

**Units:** 107, 207

### B-107
| Field | Value |
|---|---|
| Vendor | "disponible" |
| Client | empty |
| Bank | **Banrural** |
| Income | **Negocio Propio** |
| FHA | true |
| Pricing | All zeros |

### B-207
| Field | Value |
|---|---|
| Vendor | "disponible" |
| Client | empty |
| Bank | empty |
| Income | **Relación Dependencia** |
| FHA | true |
| Valor Inmueble | **Q384,700** |
| Enganche | Q38,500 |
| Reserva | Q1,000 |
| Financiamiento | Q346,200 |

**Root cause:** These are desisted transactions where the client name and vendor were cleared from the Excel but the credit profile data (bank, income source, FHA flag) and in B-207's case the full pricing were left behind. This is exactly the kind of incomplete cleanup that makes Excel unreliable.

**DB cross-reference:**
- The DB has 16 desisted reservations for BEN Torre B: units 111, 112, 113, 212, 213, 302, 303, 306, 310, 313, 403, 406, 412, 603, 605, 612.
- **Neither 107 nor 207 appear in the desisted list.** These desistimientos predate the backfill data snapshot or were never formally entered as reservations.

**Action:**
- B-107: The credit data (Banrural, Negocio Propio) belongs to an unknown former client. Without a reservation record, this data has no entity to attach to. **Park until Pati can identify the client from memory or older records.**
- B-207: Same situation, but has full pricing. The Q384,700 valor_inmueble can be stored on `rv_units` since it's a property of the unit. The income/FHA data requires a client.

**Backfill fix:** Add B-207's `valor_inmueble = 384700` to the rv_units UPDATE (this was already being generated). Skip the client profile fields until a reservation record exists.

---

## Category C: Hidden Reservations (11 units — BLT Torre B) ⚠️ CRITICAL

**Units:** 102, 103, 105, 202, 203, 204, 205, 301, 304, 305, 401

**This is the most significant finding.** The BLT Excel file has a **separate sheet** called **"INFO PARA REPORTES"** that contains actual client names, DPIs, workplace data, and salary information for 58 BLT Torre B units. The main "BASE DE DATOS TORRE B" sheet has vendor/client columns **completely empty** for ALL 117 units.

The extract script (`extract_data.py`) only reads the "BASE DE DATOS TORRE B" sheet and never touches "INFO PARA REPORTES". The `backfill_reservations.py` script also never loaded BLT Torre B data (DB shows 0 desisted reservations for BLT).

### Client Data Found in "INFO PARA REPORTES"

| Unit | Client 1 | Client 2 | FHA |
|---|---|---|---|
| 102 | Cristina Estefania Villagran Marroquin | Jose Manuel Villagran Barrios | — |
| 103 | Juan Luis Pinto Gomez de Liano | — | X |
| 105 | Laura Annabella Castro Guerra | Juan Pablo Matheu Morales | — |
| 202 | Angel Roberto Sic Garcia | Angel Eduardo Sic Morales | X |
| 203 | Ana Cristina Velasquez Aguilar de Gomez | Rene Ubaldo Gomez Aguilar | — |
| 204 | Alfonso Javier Miranda Roman | — | X |
| 205 | Elfego Adonias Apen Son | Dany Alexis Gomez Ajuchan | — |
| 301 | Hector Enrique Zacarias Illescas | — | X |
| 304 | Luis Alfonso Ramirez Rivas | — | — |
| 305 | Carol Anali Ovalle Valladares | — | — |
| 401 | Hector Rene Guzman Moran | — | — |

**These are real buyers.** They have DPIs, full names, and in some cases co-buyers — this is not template data. The fact that the main sheet shows vendor=None and client=None while a reporting sheet has full client data is a classic Pati Excel fragmentation problem: data lives in multiple tabs, updated independently, never synchronized.

**DB cross-reference:**
- **Zero BLT reservations** (active or desisted) exist in the DB for these units.
- The `backfill_reservations.py` loaded BLT data from a different SSOT Excel snapshot and apparently only covered Torre C units (which do have vendor/client data in the main sheet).
- These 11 BLT Torre B clients are **completely absent from the production database**.

**Impact on Créditos dashboard:**
- These units will appear as DISPONIBLE (no reservation) when they should be RESERVADO or VENDIDO.
- Their credit profile data (income, bank, FHA) will be missing from all aggregations.
- Portfolio absorption metrics will undercount BLT by at least 11 units.

**The full "INFO PARA REPORTES" sheet has 58 rows** — meaning there are likely **47 additional BLT Torre B units** with client data beyond our 24 target units. These 47 units may have income_source=NULL (so they weren't flagged) but still have clients that are missing from the DB.

**Action:** This requires a dedicated backfill:
1. Extract all 58 rows from "INFO PARA REPORTES" sheet
2. Create `rv_clients` records for each client
3. Create `reservations` records (status TBD — need Pati to confirm active vs desisted)
4. Create `reservation_clients` junction records
5. Create `rv_client_profiles` records with income/bank/FHA data
6. Update `rv_units` status from AVAILABLE to RESERVED/SOLD as appropriate

---

## Category D: Orphan Income Markers (13 units — BLT Torre B)

**Units:** 104, 106, 107, 108, 109, 201, 206, 209, 303, 306, 307, 308, 309

These units have income source `X` markers in the main "BASE DE DATOS TORRE B" sheet but **no client data in any sheet** (neither the main sheet nor "INFO PARA REPORTES").

**Possibilities:**
1. **Pre-qualification inquiries** — buyers who were pre-qualified (income assessed) but never completed a reservation
2. **Desisted before "INFO PARA REPORTES" was created** — the reporting sheet only covers active clients
3. **Template/projection data** — income source markers filled in for planning purposes

**DB cross-reference:** Zero reservation history for any of these units.

**Action:** Flag for review with Pati. These may represent:
- Lost leads (marketing/sales pipeline data, not transaction data)
- Or genuinely desisted clients whose data was completely scrubbed from both sheets

Until clarified, these should NOT be backfilled — we'd be storing income source data with no client to attach it to.

---

## Root Cause Analysis

The 33-unit gap reveals **three systemic Excel failure modes** that Orion was built to eliminate:

1. **Multi-sheet fragmentation** — BLT Torre B has client data in "INFO PARA REPORTES" but not in "BASE DE DATOS TORRE B". The extract script reads one sheet; backfill reads another. Neither captures the full picture.

2. **Incomplete desist cleanup** — BEN Torre B units 107 and 207 had their client/vendor cleared when desisted, but credit profile data (bank, income source, pricing) was left behind. This creates zombie rows that look available but carry ghost data.

3. **Template markers masquerading as client data** — BEN Torre A's FHA column has `X` marks on genuinely empty units. The extract script treats any `X` as client data.

---

## Recommended Roadmap

### Phase 1: Immediate — Fix the Backfill Script (est. 1h)

Update `backfill_creditos.py` to:
- **Exclude Category A** (7 BEN Torre A units) — already excluded correctly, but add explicit comment documenting why
- **Include B-207** valor_inmueble on `rv_units` — it's a property value, not client-dependent
- No other changes — the script is correct for data currently in the DB

### Phase 2: Critical — BLT Torre B Client Load (est. 4-6h)

**This is the highest-impact item.** 58 BLT Torre B clients exist only in Excel.

1. Write `scripts/extract_blt_torre_b_clients.py` to read "INFO PARA REPORTES" sheet
2. Extract: client names, DPIs, workplace, salary, co-buyers
3. Coordinate with Pati to classify each as CONFIRMED, PENDING_REVIEW, or DESISTED
4. Write `scripts/backfill_blt_torre_b.py` to generate SQL:
   - INSERT into `rv_clients` (58+ clients)
   - INSERT into `reservations` (up to 58 reservations)
   - INSERT into `reservation_clients` (junction records, handle co-buyers)
   - INSERT into `rv_client_profiles` (income, bank, FHA from main sheet cross-reference)
   - UPDATE `rv_units` status (AVAILABLE → RESERVED/SOLD)
5. Deploy migration via Management API
6. Re-run `backfill_creditos.py` to populate credit-specific columns on newly created records

### Phase 3: Data Quality — Pati Review Session (est. 2h)

Present the following to Pati for confirmation:
- **13 Category D orphan units** — are these real clients or template data?
- **BEN B-107 and B-207** — who were these clients? Do records exist elsewhere?
- **BLT Torre B full 58-row review** — confirm which are active vs desisted
- **BLT Torre B remaining 59 units** (117 - 58) — truly available, or more hidden data?

### Phase 4: Extract Script Hardening (est. 1h)

Update `pacreditos/scripts/extract_data.py` to:
- Read "INFO PARA REPORTES" sheet for BLT Torre B (not just "BASE DE DATOS TORRE B")
- Cross-reference client data between sheets
- Add data quality warnings for template markers vs real client data

### Phase 5: Dashboard Verification (est. 1h)

After Phases 2-3 are complete:
- Re-query `v_creditos_unit_full` view — expect BLT Torre B absorption to increase from 0% to ~50%
- Compare dashboard output against pacreditos standalone app
- Verify all 4 projects show accurate data for board-level reporting

---

## Impact on Board Report Accuracy

| Metric | Current (without fix) | After Phase 2 |
|---|---|---|
| BLT Torre B absorption | 0% (0/117) | ~50% (58/117) |
| BLT total units tracked | 117 (all DISPONIBLE) | 117 (58 RESERVADO/VENDIDO + 59 DISPONIBLE) |
| Total portfolio absorption | Undercounted by ~58 units | Accurate |
| Income source coverage | Missing 11+ BLT clients | Complete for all known clients |
| Client count | Missing 58+ BLT clients | Complete |

**Bottom line:** Without Phase 2, the Créditos dashboard will show BLT Torre B as 100% available — which is materially wrong for a board report. The "INFO PARA REPORTES" sheet proves at least 58 of 117 units have buyers.

---

## UPDATE 2026-03-20: Authoritative Correction — BLT Torre B Sales Count

**Source:** Jorge (project owner), direct confirmation.

The analysis above (Categories C and D) was based on the "INFO PARA REPORTES" Excel sheet which listed 58 rows of client data for BLT Torre B. Upon authoritative review, the actual situation is:

### Corrected Facts

1. **Only 3 sales exist in Bosque Las Tapias — Torre B.** The 58 rows in "INFO PARA REPORTES" and the 13 orphan income markers in "BASE DE DATOS TORRE B" do NOT represent 58+ real sales. The true number of confirmed sales is **3**.

2. **All existing BLT Torre B sales records will be dropped from the production database.** Any BLT Torre B transactional data currently in prod (reservations, reservation_clients, rv_client_profiles, unit_status_log) will be purged to establish a clean baseline.

3. **Only the 3 currently existing sales will be uploaded.** After the purge, exactly 3 sales will be loaded into the production database as the sole BLT Torre B transactions.

### Impact on Prior Analysis

| Section | Original Conclusion | Corrected Status |
|---|---|---|
| Category C (11 units) | 11 hidden reservations from "INFO PARA REPORTES" to load into DB | **Superseded** — only 3 of the 58 "INFO PARA REPORTES" rows are real sales |
| Category D (13 units) | 13 orphan income markers to review with Patty | **Superseded** — these are not real sales data |
| Phase 2 roadmap | Load 58 clients, create reservations, update unit status | **Replaced** — drop all, load only 3 |
| Board report impact | BLT absorption ~50% (58/117) | **TBD** — absorption will reflect only 3 sales |

### Revised Action Plan

1. **DROP** all BLT Torre B sales/reservation records from production database
2. **INSERT** the 3 confirmed sales (details TBD — pending identification of which 3 units/clients)
3. Categories C and D analysis remains as historical reference for how the discrepancy was discovered, but the remediation path is now the simplified 3-sale load above
