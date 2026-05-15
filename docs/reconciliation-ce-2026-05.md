# CE Reconciliation Findings
## Source: reconciliation-diff-phase2-2026-05-05.json
## Status: OUT OF SCOPE for CIERRE_MARZO_RESERVAS import — deferred for separate CE reconciliation pass

**Generated:** 2026-05-15
**Operator:** Claude Code (extracted from phase-2 dry-run output)

---

## Summary

CE (Centro Ejecutivo) was included in the phase-2 dry-run but is **out of scope** for the Jan/Feb/Mar 2026 B5/BEN/BLT import. This document captures all CE findings for a future dedicated CE reconciliation pass.

| Status | Count |
|--------|-------|
| MATCH | 788 |
| MISSING_IN_DB | 161 |
| AMOUNT_MISMATCH | 21 |
| EXTRA_IN_DB | 21 |
| **Total CE rows** | **991** |

**Units covered:** 68 units (101–1001, across multiple floors)
**Date range:** 2022-06-30 through 2025-05-31

---

## MISSING_IN_DB — 161 rows

**Total SSOT amount not yet in DB: Q3,047,764.24**

Date range: 2022-06-30 → 2025-05-31 (multi-year backlog across 68 CE units).

These represent payments recorded in the SSOT but absent from the DB. Importing these will require a dedicated CE reconciliation run scoped to all CE units and all historical months.

---

## AMOUNT_MISMATCH — 21 rows

### Unit 1001 (20 rows, Sept 2022 – May 2024)

All 20 rows show the same pattern: XLSX ≈ Q4,918–5,000 vs DB = Q1,947.93 (delta ≈ Q2,970–3,052).

The DB payment amount Q1,947.93 appears to be a fixed installment rate. The SSOT records a significantly higher amount for the same months. This suggests either:
- The DB was loaded with a partial installment amount during migration, or
- The SSOT records multiple payment components (e.g., principal + interest + fees) that the DB splits across separate records, or
- A rounding/rate discrepancy in the original migration

December 2023 is a partial exception: XLSX Q4,919 vs DB Q3,895.86 (= 2× Q1,947.93 — two payments merged).

| Month | XLSX | DB | Delta |
|-------|------|----|-------|
| 2022-09-30 | Q5,000.00 | Q1,947.93 | +Q3,052.07 |
| 2022-10-31 | Q4,918.00 | Q1,947.93 | +Q2,970.07 |
| 2022-11-30 | Q4,922.00 | Q1,947.93 | +Q2,974.07 |
| 2022-12-31 | Q4,920.00 | Q1,947.93 | +Q2,972.07 |
| 2023-01-31 | Q4,918.18 | Q1,947.93 | +Q2,970.25 |
| 2023-02-28 | Q4,920.00 | Q1,947.93 | +Q2,972.07 |
| 2023-03-31 | Q4,918.18 | Q1,947.93 | +Q2,970.25 |
| 2023-04-30 | Q4,918.00 | Q1,947.93 | +Q2,970.07 |
| 2023-05-31 | Q4,918.00 | Q1,947.93 | +Q2,970.07 |
| 2023-06-30 | Q4,918.00 | Q1,947.93 | +Q2,970.07 |
| 2023-07-31 | Q4,918.18 | Q1,947.93 | +Q2,970.25 |
| 2023-08-31 | Q4,919.00 | Q1,947.93 | +Q2,971.07 |
| 2023-09-30 | Q4,919.00 | Q1,947.93 | +Q2,971.07 |
| 2023-10-31 | Q4,919.00 | Q1,947.93 | +Q2,971.07 |
| 2023-12-31 | Q4,919.00 | Q3,895.86 | +Q1,023.14 |
| 2024-01-31 | Q4,919.00 | Q1,947.93 | +Q2,971.07 |
| 2024-02-29 | Q4,919.00 | Q1,947.93 | +Q2,971.07 |
| 2024-03-31 | Q4,919.00 | Q1,947.93 | +Q2,971.07 |
| 2024-04-30 | Q4,919.00 | Q1,947.83 | +Q2,971.17 |
| 2024-05-31 | Q4,919.00 | Q1,947.83 | +Q2,971.17 |

### Unit 103 (1 row, Oct 2024)

| Month | XLSX | DB | Delta |
|-------|------|----|-------|
| 2024-10-31 | Q8,100.00 | Q5,000.00 | +Q3,100.00 |

---

## EXTRA_IN_DB — 21 rows

Payments recorded in DB with no matching SSOT row. Several involve large lump sums — likely interim payments, escritura-related entries, or data quality issues from migration.

| Unit | Month | DB Amount | Note |
|------|-------|-----------|------|
| 604 | 2024-03-31 | Q3,500.00 | |
| 604 | 2024-04-30 | Q3,500.00 | |
| 604 | 2024-05-31 | Q3,500.00 | |
| 604 | 2024-06-30 | Q3,500.00 | |
| 604 | 2024-07-31 | Q728,264.00 | Large lump — possible escritura or lump payoff |
| 508 | 2025-03-31 | Q60,000.00 | Duplicate row (appears twice) |
| 508 | 2025-03-31 | Q60,000.00 | Duplicate |
| 606 | 2024-11-30 | Q89,900.00 | |
| 606 | 2025-03-31 | Q302,993.04 | Large — possible lump payoff |
| 605 | 2025-02-28 | Q35,900.00 | |
| 307 | 2025-03-31 | Q35,500.00 | |
| 307 | 2025-05-31 | Q178,600.00 | |
| 807 | 2025-02-28 | Q245,000.00 | Duplicate row (appears twice) |
| 807 | 2025-02-28 | Q245,000.00 | Duplicate |
| 904 | 2024-06-30 | Q20,000.00 | |
| 904 | 2025-01-31 | Q741,479.55 | Large — possible escritura payoff |
| 1001 | 2022-08-31 | Q1,947.93 | |
| 103 | 2024-11-30 | Q5,000.00 | |
| 103 | 2024-12-31 | Q5,000.00 | |
| 103 | 2025-01-31 | Q21,650.00 | |
| 103 | 2025-02-28 | Q21,650.00 | |

---

## Action Required (Future CE Pass)

1. **Scope a dedicated CE reconciliation** covering all CE units, all historical months (2022 onward).
2. **Investigate unit 1001 AMOUNT_MISMATCH:** Determine whether DB installment amount (Q1,947.93) is a partial rate or a migration error. Source the correct monthly installment from the original CE payment schedule.
3. **Audit EXTRA_IN_DB large amounts** on units 604, 606, 904 — confirm whether these are legitimate lump payoffs or duplicate/erroneous DB records. Units 508 and 807 have clear duplicate rows that need deduplication.
4. **Run CE-scoped reconciliation import** once the above issues are resolved.
