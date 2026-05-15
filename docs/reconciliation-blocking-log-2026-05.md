# Reconciliation Blocking Row Resolution Log
## CIERRE_MARZO_RESERVAS.xlsx → Production DB
## Import scope: January, February, March 2026 — B5, BEN, BLT

**Started:** 2026-05-06
**Operator:** Jorge (user) + Claude Code
**Script:** `scripts/reconcile_phase2_payments.py`
**Dry-run date:** 2026-05-05
**Total blocking rows at start:** 149 (105 AMBIGUOUS · 29 AMOUNT_MISMATCH · 15 UNMATCHED_UNIT)
**Clean MISSING_IN_DB rows pending insert:** 2,037

---

## Summary Table

| # | Type | Project | Unit | Month | Decision | Status |
|---|------|---------|------|-------|----------|--------|
| 1 | UNMATCHED_UNIT | B5 | 403 | 2023-08-20 | SKIP — desistimiento confirmed 2026-01-27, no 2026 payments | ✅ Resolved |
| 2 | UNMATCHED_UNIT | B5 | 105 | 2025-12-09 | SKIP — desistimiento (Nery, unit 906). TRASLADO pending (Julio → 105) | ✅ Resolved |
| 3 | UNMATCHED_UNIT | BEN | 203-A | 2026-02-19 | SKIP — desistimiento (Jesica Noj). Unit re-sold to Lisbeth Osuna Sis (new DB sale + 2 payments pending) | ✅ Resolved |
| 4 | UNMATCHED_UNIT | BEN | 505-A | 2026-02-28 | SKIP — new sale (Katherine Aceytuno/Denis Gabriel), no prior client. DB sale missing, no 2026 scope payments to import | ✅ Resolved |
| 5 | UNMATCHED_UNIT | BEN | 110-B | 2026-02-22 | SKIP — new sale (Maria Ysabel Velásquez/Eder Veliz), no prior client. 2.Reservado, no 2026 enganche installments | ✅ Resolved |
| 6 | UNMATCHED_UNIT | BEN | 205-B | 2025-07-07 | SKIP — TRASLADO (Angel Muñoz: 305-B → 205-B). Old 305-B sales cancelled. New DB sale on 205-B required | ✅ Resolved |
| 7 | UNMATCHED_UNIT | BEN | 402-B | 2025-11-17 | SKIP — migration artifact (402-B-B → 402-B). TRASLADO from 607-A. Fix: UPDATE sale unit_id. All payments missing from DB | ✅ Resolved |
| 8 | UNMATCHED_UNIT | BEN | 111-C | 2026-02-28 | SKIP — new sale (Selvin Castillo/Eder Veliz), no prior client. 2.Reservado, no 2026 installments | ✅ Resolved |
| 9 | UNMATCHED_UNIT | BEN | 207-C | 2026-02-20 | SKIP — new sale (Sergio Fuentes López/Eder Veliz), no prior client. 2.Reservado, no 2026 installments | ✅ Resolved |
| 10 | UNMATCHED_UNIT | BEN | 604-C | 2026-02-24 | SKIP — new sale (Javier Zepeda Aguirre/Rony Ramírez), no prior client. 2.Reservado, no 2026 installments | ✅ Resolved |
| 11 | UNMATCHED_UNIT | BEN | 611-C | 2026-02-27 | SKIP — new sale (Diego Sandoval Méndez/Efren Sanchez), no prior client. 2.Reservado, no 2026 installments | ✅ Resolved |
| 12 | UNMATCHED_UNIT | BLT | 1305-B | 2026-02-16 | SKIP — new sale (Evelin Yanira Ramos Regalado/José Gutierrez). 2.Reservado, no 2026 installments | ✅ Resolved |
| 13 | UNMATCHED_UNIT | BLT | 806-C | 2026-02-24 | SKIP — desistimiento Irma Canel (2025-08-31). New sale Melany Eulalia López Martínez/Paula Hernández. No 2026 installments | ✅ Resolved |
| 14 | UNMATCHED_UNIT | BLT | 905-C | 2026-02-16 | SKIP — desistimiento Julio Calderon (2026-01-22). New sale Oscar Josue Acabal Cun/José Gutierrez. Feb reserva + Mar 1st installment pending DB sale creation | ✅ Resolved |
| 15 | UNMATCHED_UNIT | BLT | 1207-C | 2026-03-22 | SKIP — desistimiento (Marlon Pixtun, policy date 2026-04-30). SSOT Q0 amounts — no importable payments. DB cancellation date incorrect, fix needed | ✅ Resolved |
| 16 | AMOUNT_MISMATCH | B5 | 607 | 2026-02-28 | RESOLVED — DB Q5,167 correct (regular). Q20,000 extraordinary payment (2026-02-20) MISSING from DB — needs INSERT | ✅ Resolved |
| 17 | AMOUNT_MISMATCH | B5 | 703 | 2026-02-28 | RESOLVED — DB Q2,000 correct (regular). Q7,963 additional payment (2026-02-27) MISSING from DB — needs INSERT | ✅ Resolved |
| 18 | AMOUNT_MISMATCH | B5 | 607 | 2025-05-31 | SKIP — pre-scope (May 2025) | ✅ Resolved |
| 19 | AMOUNT_MISMATCH | BEN | 101-A | 2026-02-28 | SKIP — DB Q1,022.73 confirmed correct. SSOT double-counts (script bug) | ✅ Resolved |
| 20 | AMOUNT_MISMATCH | BEN | 501-A | 2026-02-28 | SKIP — DB Q1,462.50 confirmed correct. SSOT double-counts (script bug) | ✅ Resolved |
| 21 | AMOUNT_MISMATCH | BEN | 306-B | 2026-02-28 | SKIP — DB Q1,500.00 confirmed correct. SSOT double-counts (script bug). ⚠️ Client name spelling fix: "Enrique" → "Enriquez" | ✅ Resolved |
| 22 | AMOUNT_MISMATCH | BEN | 510-C | 2026-02-28 | SKIP — DB Q967.00 confirmed correct. SSOT double-counts (script bug) | ✅ Resolved |
| 23 | AMOUNT_MISMATCH | BLT | 1108-C | 2026-02-28 | SKIP — DB Q2,232.00 confirmed correct. SSOT double-counts (script bug) | ✅ Resolved |
| 24–44 | AMOUNT_MISMATCH | CE | 1001/103 | 2022–2024 | SKIP — CE project, out of scope (pre-2026, different project) | ✅ Resolved |
| 45–142 | AMBIGUOUS | B5/BEN/BLT | various | 2023–2025 | SKIP — pre-scope (all pre-Jan 2026), out of import window | ✅ Resolved |
| 143 | AMBIGUOUS | B5 | 207 | 2026-02-28 | IMPORT Q22,135 — confirmed: reserva + first installment combined in Feb 2026 | ✅ Resolved |
| 144 | AMBIGUOUS | B5 | 211 | 2026-03-31 | IMPORT Q82,800 — confirmed: full enganche paid upfront (= DB down_payment_amount) | ✅ Resolved |
| 145 | AMBIGUOUS | B5 | 502 | 2026-03-31 | IMPORT Q10,000 — confirmed correct reserva (non-standard, script expected Q15,000) | ✅ Resolved |
| 146 | AMBIGUOUS | B5 | 719 | 2026-01-31 | IMPORT Q1,362,326.78 — corporate lump-sum (Flortiz S.A.). ⚠️ USD payment — exchange rate used vs correct rate requires investigation | ✅ Resolved |
| 147 | AMBIGUOUS | BEN | 408-B | 2026-01-31 | IMPORT Q1,395 — Neolink settlement: client paid Q1,500, bank received Q1,395 (Q105 withheld by Neolink, may be released later). ⚠️ Neolink holdback pattern documented | ✅ Resolved |
| 148 | AMBIGUOUS | BEN | 404-D | 2026-03-31 | IMPORT Q3,146 — confirmed: reserva + first installment combined in Mar 2026 | ✅ Resolved |
| 149 | AMBIGUOUS | BLT | 302-C | 2026-01-31 | IMPORT Q5,455 — confirmed: reserva + first installment combined in Jan 2026 | ✅ Resolved |

---

## Resolved Cases

---

### Case 1 — UNMATCHED_UNIT · B5 · apto 403

**Type:** UNMATCHED_UNIT
**Project:** Boulevard 5
**Unit:** 403
**Script note:** `No active sale found in DB for unit 403 (tower=None, db_key=403) in project Boulevard 5`

**SSOT (Excel) data:**
- Salesperson: Antonio Rada
- Client: Denis Estuardo Mazariegos Fuentes
- Reservation date: 2023-08-20
- SSOT status: 4.Plan de pagos
- Enganche pactado: Q 70,000
- Payment history: 23 payments (Aug 2023 – Jun 2025)
  - 2023-08-31: Q 6,000 (reservation deposit)
  - 2023-09-30 through 2025-06-30: Q 2,560/month × 22 installments
  - Total: Q 62,320

**DB state:**
- Sale exists for unit 403: `status = cancelled`, `sale_date = 2023-08-20`, `price_with_tax = Q 699,700`

**Conflict:** SSOT shows active payment history. DB shows sale as cancelled.

**User clarification (2026-05-06):**
- Client confirmed correct: Denis Estuardo Mazariegos Fuentes ✓
- Salesperson confirmed correct: Antonio Rada ✓
- Reserved: August 2023 ✓
- **Desisted: January 27, 2026**

**Resolution:** SKIP for this import.
- The desistimiento is confirmed. DB cancelled status is correct.
- The 23 historical payments (Aug 2023 – Jun 2025, Q 62,320 total) predate the Jan/Feb/Mar 2026 import window.
- No 2026 payments exist for this unit in the SSOT.
- Pre-cancellation payment history is a separate historical backfill question, not in scope here.

**Action:** None. Script gate exception noted for unit 403.

---

### Case 2 — UNMATCHED_UNIT · B5 · apto 105

**Type:** UNMATCHED_UNIT
**Project:** Boulevard 5
**Unit:** 105
**Script note:** `No active sale found in DB for unit 105 (tower=None, db_key=105) in project Boulevard 5`

**SSOT (Excel) data:**
- Salesperson: Erwin Cardona
- Client shown in SSOT: Nery Adolfo Ortíz Alvarez (SSOT not yet updated with TRASLADO)
- SSOT status: 2.Reserva
- Enganche pactado: Q 83,500
- Payment history: 1 payment
  - 2025-12-31: Q 10,000 (reservation deposit)

**DB state:**
- Sale exists for unit 105: `status = cancelled`, `sale_date = 2025-12-09`, `price_with_tax = Q 1,192,700`

**User clarification (2026-05-06):**
- Nery Adolfo Ortíz Alvarez was on **apto 906**, not apto 105
- Nery reserved apto 906 in December 2025
- **Nery desisted January 26, 2026**
- **Apto 105 is a TRASLADO**: Julio Fernando Flores Interiano (originally purchased apto 718) has been reassigned to apto 105

**New case type identified: TRASLADO** (see `docs/business-case-types.md`)
A TRASLADO is a reassignment of an existing purchase to a different unit. The client, salesperson, price, and payments follow the sale. Only the unit changes.

**Resolution:** SKIP for this import.
- The DB cancelled sale for unit 105 is correctly cancelled (it was Nery's brief reservation on 906; the unit 105 DB record may reflect a prior stale record).
- No 2026 Jan/Feb/Mar payments exist for unit 105 in the SSOT (only 1 payment in Dec 2025 which is Nery's reservation deposit on apto 906, not 105).
- The TRASLADO (Julio Fernando Flores Interiano: 718 → 105) requires a separate DB migration before unit 105 payments can be attributed to the correct sale.

**Action required (separate task):** TRASLADO migration for Julio Fernando Flores Interiano. Update `sales.unit_id` from unit 718 → unit 105. Update `rv_units.status` for both units. Log in `unit_status_log`.

---

---

### Case 3 — UNMATCHED_UNIT · BEN · apto 203-A

**Type:** UNMATCHED_UNIT
**Project:** Benestare 2.0
**Unit:** 203-A (tower A)
**Script note:** `No active sale found in DB for unit 203 (tower=A, db_key=203-A) in project Benestare`

**SSOT (Excel) data at time of dry-run:**
- Salesperson: Efren Sanchez
- Client: Lisbeth Hortencia Osuna Sis
- Reservation date: 2026-02-19
- SSOT status: 4.Plan de pagos
- Price: Q 523,700
- Enganche pactado: Q 26,200
- Payments in scope:
  - 2026-02-28: Q 1,500
  - 2026-03-31: Q 24,700

**DB state:**
- Unit 203-A (`id = 019c967f-2fbf-7e01-85ee-d1fcb513f4f9`): `status = available`
- No active sale records found for this unit.

**User clarification (2026-05-06):**
- Previous client: **Jesica Paola Noj Ramírez**
- Previous salesperson: **Abigail García** (inactive)
- Status: **DESISTIDO**
- Desistimiento date: not provided (unknown)

**Context:**
- Jesica Paola Noj Ramírez reserved unit 203-A. She desisted (date unknown).
- Unit was returned to available and re-sold to a new client: Lisbeth Hortencia Osuna Sis (Efren Sanchez).
- The SSOT has already been updated to reflect the new sale (Lisbeth/Efren, reserved 2026-02-19).
- Jesica's original sale is either cancelled in DB or was never formally created — reconciliation confirmed no DB sale exists for 203-A.
- The new DB sale (Lisbeth/Efren) has NOT been created yet. Two 2026 payments (Feb Q1,500 + Mar Q24,700) are waiting.
- Note: A separate AMBIGUOUS row exists in the reconciliation for unit 203-C (different unit, same floor digit) — this belongs to Francisco Alberto García Palencia / Wendy Yajaira Morales Pedroza, Pablo Marroquín-adjacent sale; unrelated to this case.

**Resolution:** SKIP for this import (blocking row cleared).
- No active DB sale for 203-A → nothing to reconcile against.
- The UNMATCHED_UNIT flag is expected: SSOT has the new sale (Lisbeth), DB doesn't.
- Desistimiento of Jesica is confirmed; unit being available in DB is correct.

**Action required (separate task):**
1. Create new sale in DB for Lisbeth Hortencia Osuna Sis / Efren Sanchez / BEN 203-A.
   - Reservation date: 2026-02-19
   - Price: Q 523,700
   - Enganche pactado: Q 26,200
2. Once DB sale exists, the Feb 2026 (Q 1,500) and Mar 2026 (Q 24,700) payments will surface as MISSING_IN_DB on next dry-run and can be imported.

---

---

### Case 4 — UNMATCHED_UNIT · BEN · apto 505-A

**Type:** UNMATCHED_UNIT
**Project:** Benestare 2.0
**Unit:** 505-A (tower A)
**Script note:** `No active sale found in DB for unit 505 (tower=A, db_key=505-A) in project Benestare`

**SSOT (Excel) data:**
- Salesperson: Eder Veliz
- Client: Katherine Andrea Aceytuno Herrera / Denis Alexander Gabriel Sicaja
- Reservation date: 2026-02-28
- SSOT status: 4.Plan de pagos
- Price: Q 386,900
- Enganche pactado: Q 19,400

**DB state:**
- Unit 505-A (`id = 019c967f-2fc0-7c8b-8f30-6dea0264df6d`): `status = available`
- No sales records for this unit.

**Note:** The MATCH/MISSING_IN_DB rows appearing under apto=505 in the reconciliation output belong to unit **505-B** (Yenifer Estefania Santos Gonzáles / Juan Eduardo Flores Barrera, Pablo Marroquín, sale_date=2025-08-09, active). These are a different unit entirely and are unrelated to this case.

**User clarification (2026-05-15):**
- Current active client: Katherine Andrea Aceytuno Herrera / Denis Alexander Gabriel Sicaja ✓
- No prior client on record.
- Salesperson confirmed: Eder Veliz ✓

**Resolution:** SKIP for this import (blocking row cleared).
- New sale, never in DB. Unit was available. No 2026 Jan/Feb/Mar payments exist in SSOT for this unit (reserved 2026-02-28, reservation date is boundary of import scope — no down_payment installments recorded yet).

**Action required (separate task):**
1. Create DB sale for Katherine Andrea Aceytuno Herrera / Denis Alexander Gabriel Sicaja / Eder Veliz / BEN 505-A.
   - Reservation date: 2026-02-28
   - Price: Q 386,900
   - Enganche pactado: Q 19,400
2. Verify SSOT for any Feb/Mar 2026 payment amounts for 505-A and import once sale exists.

---

---

### Case 5 — UNMATCHED_UNIT · BEN · apto 110-B

**Type:** UNMATCHED_UNIT
**Project:** Benestare 2.0
**Unit:** 110-B (tower B)
**Script note:** `No active sale found in DB for unit 110 (tower=B, db_key=110-B) in project Benestare`

**SSOT (Excel) data:**
- Salesperson: Eder Veliz
- Client: Maria Ysabel Velásquez Fernandez de Chocón
- Reservation date: 2026-02-22
- SSOT status: 2.Reservado
- Price: Q 477,700
- Enganche pactado: Q 24,000

**DB state:**
- Unit 110-B (`id = 019c967f-2fc1-7591-9ab1-e45748aa1056`): `status = available`
- No sales records for this unit.

**Note:** MATCH/MISSING_IN_DB rows under apto=110 in the reconciliation belong to unit **110-C** (Fernando Terre Galdamez, sale_date=2025-12-17, active). Unrelated to this case.

**User clarification (2026-05-15):**
- Client confirmed correct: Maria Ysabel Velásquez Fernandez de Chocón ✓
- Salesperson confirmed correct: Eder Veliz ✓
- No previous client on this unit.

**Resolution:** SKIP for this import (blocking row cleared).
- New sale, never in DB. Status 2.Reservado — no down_payment installments in Jan/Feb/Mar 2026 scope.

**Action required (separate task):**
Create DB sale for Maria Ysabel Velásquez Fernandez de Chocón / Eder Veliz / BEN 110-B (reservation 2026-02-22, Q477,700, enganche Q24,000).

---

---

### Case 6 — UNMATCHED_UNIT · BEN · apto 205-B

**Type:** UNMATCHED_UNIT
**Project:** Benestare 2.0
**Unit:** 205-B (tower B)
**Script note:** `No active sale found in DB for unit 205 (tower=B, db_key=205-B) in project Benestare`

**SSOT (Excel) data:**
- Salesperson: Efrén Sánchez
- Client: Angel Renato Muñoz de León
- Reservation date: 2025-07-07
- SSOT status: 2.Reservado
- Price: Q 477,700
- Enganche pactado: Q 24,000

**DB state:**
- Unit 205-B (`id = 019c967f-2fc2-7433-84ae-a908143c8b38`): `status = available`
- No active sales for this unit.

**Note:** MATCH rows under apto=205 in reconciliation belong to unit **205-A** (Saulo Josue Escobar Pérez, sale_date=2023-11-09, active). Unrelated to this case.

**User clarification (2026-05-15):**
- Client confirmed correct: Angel Renato Muñoz de León ✓
- Salesperson confirmed correct: Efrén Sánchez ✓
- **TRASLADO confirmed:** Angel Renato Muñoz de León was transferred from unit 305-B → 205-B.

**DB evidence of TRASLADO:**
- Unit `305-B` (BEN): two cancelled sales for Angel — the cancellations cleared the way for 305-B's new active buyer (Dulce Rocío Medrano Barrera / Eder Veliz / 2025-08-30, unit_status=sold).
- Unit `305-B-B` (BEN, `id = 019c7da8-bec7-7612-a1e9-50a1e1673230`): **ACTIVE sale** `019c7da9-1564-7025-be9b-f911ad1fa337` for Angel Renato Muñoz de León / Cesar Renato Muñoz de León / Efrén Sánchez / 2025-07-07. Unit_status=sold.
  - `305-B-B` is a **migration artifact unit number** — the correct unit per SSOT and business reality is 205-B.
- User confirmed (2026-05-15): 205-B is the correct current unit for Angel Renato Muñoz de León.

**Resolution:** SKIP for this import (blocking row cleared).
- Active sale exists under wrong unit number (`305-B-B` instead of `205-B`). No active DB sale on `205-B` → nothing to reconcile against.
- SSOT status is 2.Reservado → no 2026 Jan/Feb/Mar down_payment installments in scope.

**Action required (separate task — TRASLADO, simpler than originally assessed):**
1. UPDATE existing active sale `019c7da9-1564-7025-be9b-f911ad1fa337` to change `unit_id` from `305-B-B` unit → `205-B` unit (`019c967f-2fc2-7433-84ae-a908143c8b38`).
2. Update unit `305-B-B` status → AVAILABLE (or deactivate/delete as migration artifact).
3. Update unit `205-B` status → RESERVED (or SOLD per business state).
4. Log event in `unit_status_log` for both units.

---

---

### Case 7 — UNMATCHED_UNIT · BEN · apto 402-B

**Type:** UNMATCHED_UNIT
**Project:** Benestare 2.0
**Unit:** 402-B (tower B)
**Script note:** `No active sale found in DB for unit 402 (tower=B, db_key=402-B) in project Benestare`

**SSOT (Excel) data:**
- Salesperson: Rony Ramírez ✓ (confirmed in DB)
- Client: Rigoberto Gabriel López ✓ (confirmed in DB)
- Reservation date: 2025-11-17
- SSOT status: 4.Plan de pagos
- Price: Q 492,700
- Enganche pactado: Q 24,700

**DB state:**
- Unit 402-B (`id = 019c967f-2fc3-7fbd-a157-fb68a5dfe301`): `status = available`
- No sales linked to unit 402-B.
- **BUT:** Active sale `019c7da9-4d98-71c3-9716-45aa01f81653` exists for Rigoberto / Rony Ramírez on unit **`402-B-B`** (`019c7da8-bec9-755b-860a-ca6c28036b55`, status=reserved) — a migration artifact unit number. Same date=2025-11-17, same price=Q492,700.
- This sale has **zero payments** recorded in DB.
- Cancelled sale also exists for Rigoberto on unit **607-A** (Rony Ramírez, 2025-11-17, Q513,000) — confirms TRASLADO from 607-A → 402-B.

**Note:** MATCH/MISSING_IN_DB rows under apto=402 in reconciliation (Dec Q2,889, Jan Q963, etc.) belong to unit **402-C** (Miguel Estuardo Arevalo Toc). Unrelated to this case.

**Resolution:** SKIP for this import (blocking row cleared).
- Same migration artifact pattern as Case 6 (305-B-B). Active sale is on wrong unit number (402-B-B vs 402-B).
- After unit_id fix, all of Rigoberto's SSOT payments (Nov 2025 → Mar 2026) will surface as MISSING_IN_DB and can be imported.

**Action required (separate task — migration artifact + TRASLADO):**
1. UPDATE active sale `019c7da9-4d98-71c3-9716-45aa01f81653` to change `unit_id` from `402-B-B` unit (`019c7da8-bec9-755b-860a-ca6c28036b55`) → `402-B` unit (`019c967f-2fc3-7fbd-a157-fb68a5dfe301`).
2. Also UPDATE `down_payment_amount` on this sale: DB has Q0, SSOT shows Q24,700.
3. Update unit `402-B-B` status → AVAILABLE (migration artifact, deactivate).
4. Update unit `402-B` status → SOLD.
5. Log event in `unit_status_log`.

---

### Cases 8–11 — UNMATCHED_UNIT · BEN · tower C new reservations (Feb 2026)

All four cases share an identical pattern: brand-new reservations in February 2026, status 2.Reservado, no previous clients, DB unit is `available` with no sales history. No Jan/Feb/Mar 2026 down_payment installments in scope.

The MATCH rows appearing under the same apto digits in the reconciliation belong to **different towers** (B or A), confirmed by DB lookup.

| Case | Unit | Client | Salesperson | Reservation | Price | Enganche | DB unit_id |
|------|------|--------|-------------|-------------|-------|---------|------------|
| 8 | 111-C | Selvin Andino Castillo Diéguez | Eder Veliz | 2026-02-28 | Q 386,900 | Q 19,345 | `019c967f-2fc6-74bf...` |
| 9 | 207-C | Sergio Estuardo Fuentes López | Eder Veliz | 2026-02-20 | Q 513,700 | Q 25,685 | `019c967f-2fc6-776c...` |
| 10 | 604-C | Javier Alberto Zepeda Aguirre | Rony Ramírez | 2026-02-24 | Q 513,700 | Q 25,685 | `019c967f-2fc9-7326...` |
| 11 | 611-C | Diego Alejandro Sandoval Méndez | Efren Sanchez | 2026-02-27 | Q 0* | Q 0* | `019c967f-2fca-769b...` |

*611-C price=Q0, enganche=Q0 in SSOT — data entry incomplete at time of dry-run.

**Resolution for all four:** SKIP for this import (blocking rows cleared).

**Action required (separate task):** Create DB sales for each of the four units above using SSOT data. Confirm price/enganche for 611-C (SSOT shows Q0).

---

---

### Case 12 — UNMATCHED_UNIT · BLT · apto 1305-B

**Type:** UNMATCHED_UNIT
**Project:** Boulevard Torre (BLT)
**Unit:** 1305-B (tower B)
**Script note:** `No active sale found in DB for unit 1305-B in project BLT`

**SSOT (Excel) data:**
- Salesperson: José Gutierrez
- Client: Evelin Yanira Ramos Regalado
- Reservation date: 2026-02-16
- SSOT status: 2.Reservado
- Price: Q 581,100
- Enganche pactado: blank

**DB state:**
- Unit 1305-B (`id = 019c9689-89a8-7744-9891-cc33cfbb9b66`): `status = available`
- No prior sales found for this unit.

**User clarification (2026-05-15):**
- Client confirmed correct: Evelin Yanira Ramos Regalado ✓
- Salesperson confirmed correct: José Gutierrez ✓
- No prior client on this unit.

**Resolution:** SKIP for this import.
- New sale. Unit was available with no prior history.
- Status is 2.Reservado with no down_payment installments in the Jan/Feb/Mar 2026 scope.
- UNMATCHED_UNIT flag is expected: DB sale not yet created.

**Action required (separate task):** Create DB sale for Evelin Yanira Ramos Regalado / José Gutierrez / BLT 1305-B. Reservation date: 2026-02-16. Price: Q 581,100.

---

---

### Case 13 — UNMATCHED_UNIT · BLT · apto 806-C

**Type:** UNMATCHED_UNIT
**Project:** Bosque Las Tapias (BLT)
**Unit:** 806-C (tower C)
**Script note:** `No active sale found in DB for unit 806 (tower=C, db_key=806-C) in project Bosque Las Tapias`

**SSOT (Excel, current BLT sheet R192):**
- Salesperson: Paula Hernández
- Client: Melany Eulalia López Martínez
- Reservation date: 2026-02-24
- SSOT status: 2.Reservado
- Price: Q 744,000
- Enganche pactado: Q 52,100

**DB state:**
- Unit 806-C (`id = 019c9689-89ab-73ba-a7a8-ff725b06b64d`): `status = available`
- Prior cancelled sale (`019c9689-cebf-7640-8efe-f34bea2dbd8a`): Irma Sofía Canel Tocay / Paula Hernández / cancelled 2025-08-31 / Q744,000 / Q52,100 / no 2026 payments.

**User clarification (2026-05-15):**
- Irma Sofía Canel Tocay confirmed desistimiento date: 2025-08-31 ✓ (matches DB cancelled date)
- New client confirmed: Melany Eulalia López Martínez ✓
- Salesperson confirmed: Paula Hernández ✓
- No Jan/Feb/Mar 2026 installments on record.

**Resolution:** SKIP for this import.
- UNMATCHED_UNIT expected: DB has no active sale for 806-C.
- Status 2.Reservado — no enganche installments in the Jan/Feb/Mar 2026 scope.

**Action required (separate task):** Create DB sale for Melany Eulalia López Martínez / Paula Hernández / BLT 806-C. Reservation date: 2026-02-24. Price: Q 744,000. Enganche: Q 52,100.

---

---

### Case 14 — UNMATCHED_UNIT · BLT · apto 905-C

**Type:** UNMATCHED_UNIT
**Project:** Bosque Las Tapias (BLT)
**Unit:** 905-C (tower C)
**Script note:** `No active sale found in DB for unit 905 (tower=C, db_key=905-C) in project Bosque Las Tapias`

**SSOT (Excel, current BLT sheet R200):**
- Salesperson: José Gutierrez
- Client: Oscar Josue Acabal Cun
- Reservation date: 2026-02-16
- SSOT status: 4.Plan de Pagos
- Price: Q 636,000
- Enganche pactado: Q 44,600

**DB state:**
- Unit 905-C (`id = 019c9689-89ab-7b60-a028-0cf6e898aeaa`): `status = available`
- Prior cancelled sale (`019c9689-cab3-7f24-800a-5c2318496588`): Julio Cesar Calderon Mus / José Gutierrez / sale_date=2025-06-27 / cancelled / Q636,400 / Q44,548 / 1 payment (Q1,500 reserva, 2025-07-31).

**User clarification (2026-05-15):**
- Julio Cesar Calderon Mus confirmed desistimiento date: 2026-01-22 ✓
  _(User wrote "2025-01-22" — flagged as likely typo; DB sale was created 2025-06-27, so cancellation must be ≥2025-06-27. Recorded as 2026-01-22.)_
- New client confirmed: Oscar Josue Acabal Cun ✓
- Salesperson confirmed: José Gutierrez ✓
- Feb 2026: Reserva payment only (amount to be determined from SSOT on next script run)
- Mar 2026: First installment paid (amount to be determined from SSOT on next script run)

**Resolution:** SKIP for this import (blocking row cleared).
- UNMATCHED_UNIT expected: DB has no active sale for 905-C.
- Feb/Mar 2026 payments will surface as MISSING_IN_DB once DB sale is created for Oscar.

**Action required (separate task):**
1. Create DB sale for Oscar Josue Acabal Cun / José Gutierrez / BLT 905-C. Reservation date: 2026-02-16. Price: Q 636,000. Enganche: Q 44,600.
2. Run reconciliation dry-run again — Feb 2026 (reserva) + Mar 2026 (1st installment) will appear as MISSING_IN_DB and be auto-imported.

---

---

### Case 15 — UNMATCHED_UNIT · BLT · apto 1207-C

**Type:** UNMATCHED_UNIT
**Project:** Bosque Las Tapias (BLT)
**Unit:** 1207-C (tower C)
**Script note:** `No active sale found in DB for unit 1207 (tower=C, db_key=1207-C) in project Bosque Las Tapias`

**SSOT (Excel, current BLT sheet R229):**
- Salesperson: Anahí Cisneros
- Client: Marlon Samuel Pixtum Martinez (full DB name: Marlon Samuel Pixtun Martínez y Mariela Yamileth Hernández Chávez)
- Reservation date: 2026-03-22
- SSOT status: 2.Reservado
- Price: Q 0 (data entry incomplete)
- Enganche pactado: Q 0 (data entry incomplete)

**DB state:**
- Unit 1207-C (`id = 019c9689-89ac-76e6-806f-a62116c1f577`): `status = available`
- Cancelled sale (`ee9dfb2a-b456-4422-9a98-487d79b90b6c`): Marlon Samuel Pixtun Martínez y Mariela Yamileth Hernández Chávez / Anahí Cisneros / sale_date=2026-03-22 / **cancelled (same date)** / Q744,000 / Q52,100 / **zero payments recorded**.

**User clarification (2026-05-15):**
- Client paid reserva, then stopped communicating ("ghosted").
- **Desistimiento date: 2026-04-30** (formalized by administrative policy, post-scope).
- No Jan/Feb/Mar 2026 importable payments — SSOT amounts are Q0 (incomplete entry); actual reserva amount unknown from SSOT data.

**Resolution:** SKIP for this import.
- SSOT Q0 amounts → nothing to import in Jan–Mar 2026 window regardless of sale status.
- Desistimiento confirmed 2026-04-30 (post-scope). Unit correctly shows `available` in DB.

**Issues to fix (separate tasks):**
1. DB cancellation date is wrong: sale `ee9dfb2a-b456-4422-9a98-487d79b90b6c` shows `cancelled` with `sale_date = 2026-03-22`. The correct desistimiento date per administrative policy is **2026-04-30**. Update the cancelled sale record to reflect this.
2. Reserva payment: client paid a reserva before ghosting. Actual amount unknown from SSOT (Q0 entered). If a reimbursement decision is needed, the actual payment amount must be sourced from bank records separately.

---

---

### Cases 19–23 — AMOUNT_MISMATCH · BEN/BLT · Feb 2026 · 2× doubling pattern

**Type:** AMOUNT_MISMATCH (script double-count)
**Pattern:** SSOT amount = exactly 2× DB amount in all 5 cases.

**Root cause hypothesis:** The reconciliation script performs a tower-agnostic SSOT payment lookup for AMOUNT_MISMATCH rows (note: `tower=?` in JSON output for all). For BEN units with composite keys (e.g., `101-A`), the script may sum payment rows from both tower variants of the same apto number (e.g., 101-A and 101-B both contributing Q1,022.73 → SSOT total = Q2,045.46). This is a script bug, not a data error. DB payments are correct.

**User confirmation (2026-05-15):** All five DB amounts confirmed correct by user.

| Case | Unit | Client | DB amount (correct) | SSOT (doubled) |
|------|------|--------|---------------------|----------------|
| 19 | BEN 101-A | Wendy Azucena Barrientos Salazar de Vargas | Q1,022.73 | Q2,045.46 |
| 20 | BEN 501-A | Ronald Alberto Pineda Monroy | Q1,462.50 | Q2,925.00 |
| 21 | BEN 306-B | Sara Fernanda Enriquez Lemus | Q1,500.00 | Q3,000.00 |
| 22 | BEN 510-C | Erik Francisco Estrada Catalán | Q967.00 | Q1,934.00 |
| 23 | BLT 1108-C | Daniel Rafael Bonilla Pérez / Yohany Danissa Leonardo Bocanegra | Q2,232.00 | Q4,464.00 |

**Resolution:** SKIP for all five. DB amounts are correct. No payment update needed.

**Action required:**
- ⚠️ **Case 21 — spelling fix:** Client `full_name` in DB records as `Sara Fernanda Enrique Lemus`. Correct spelling confirmed by user: **`Sara Fernanda Enriquez Lemus`**. UPDATE `clients.full_name` for client linked to sale `019c7da8-e825-7d7a-bf01-d25ded98d523`.
- **Script bug:** Flag tower-agnostic SSOT payment lookup in reconciliation script for BEN AMOUNT_MISMATCH rows. Fix: ensure tower is respected when summing SSOT payment amounts by month.

---

---

### Case 16 — AMOUNT_MISMATCH · B5 · apto 607 · Feb 2026

**Type:** AMOUNT_MISMATCH
**Project:** Boulevard 5
**Unit:** 607
**Reconciliation note:** XLSX=Q25,167 vs DB=Q5,167 — delta +Q20,000

**DB state:**
- Sale `019c9692-7212-77b2-ad29-288615381807`: status=active, sale_date=2025-04-22
- Client: Antony Williams Sajché Torres / Madelyn Kristina Sajché Torres
- Sales rep: Antonio Rada
- Feb 2026 DB payment: Q5,167 (regular installment, already recorded)

**Prior history (user-provided, 2026-05-15):**
- Previous client: **Billy Hasse Orellana Serrano** — desisted April 2025
- New sale: 2025-04-22 — Antony Williams Sajché Torres / Madelyn Kristina Sajché Torres / Antonio Rada ✓ (matches DB)

**Explanation of mismatch:**
Two payments were made in February 2026:
1. **Q5,167** — regular monthly installment (already in DB ✓)
2. **Q20,000** — extraordinary (lump-sum) installment paid **2026-02-20** (MISSING from DB)

The reconciliation script summed both SSOT rows for Feb 2026 (Q5,167 + Q20,000 = Q25,167) and compared against the single DB record (Q5,167), producing the AMOUNT_MISMATCH. This is not a data error — both components are correct.

**Resolution:** AMOUNT_MISMATCH explained. Regular installment is correct in DB.

**Action required:**
- INSERT new payment record: sale_id=`019c9692-7212-77b2-ad29-288615381807`, amount=**Q20,000**, payment_date=**2026-02-20**, payment_type=extraordinary.

---

---

### Case 17 — AMOUNT_MISMATCH · B5 · apto 703 · Feb 2026

**Type:** AMOUNT_MISMATCH
**Project:** Boulevard 5
**Unit:** 703
**Reconciliation note:** XLSX=Q9,963 vs DB=Q2,000 — delta +Q7,963

**DB state:**
- Sale `019c9692-8588-7aa2-90e4-ec1af946237b`: status=active, sale_date=2024-03-07
- Client: Daniel Augusto Sántos Aragón ✓ (confirmed by user)
- Feb 2026 DB payment: Q2,000 (regular installment, already recorded)

**Explanation of mismatch:**
Two payments made in February 2026:
1. **Q2,000** — regular installment (already in DB ✓)
2. **Q7,963** — additional payment made **2026-02-27** (MISSING from DB)

Q2,000 + Q7,963 = Q9,963 ✓ matches SSOT exactly.

**Resolution:** AMOUNT_MISMATCH explained. Regular installment is correct in DB.

**Action required:**
- INSERT new payment record: sale_id=`019c9692-8588-7aa2-90e4-ec1af946237b`, amount=**Q7,963**, payment_date=**2026-02-27**, payment_type=extraordinary.

---

---

### Cases 45–142 — AMBIGUOUS · B5/BEN/BLT · Pre-scope batch (98 rows)

All 98 rows have `month_end` between 2023-03-31 and 2025-12-31 — before the Jan/Feb/Mar 2026 import window. All flagged as AMBIGUOUS because the reservation-month payment amount did not match the script's standard reserva expectation (amount above or below standard, or payment date precedes SSOT reservation date).

**Resolution:** SKIP for this import. Pre-2026 payments are out of scope. Historical reconciliation of pre-2026 B5/BEN/BLT reservation-month payments is a separate task.

---

### Case 143 — AMBIGUOUS · B5 · apto 207 · Feb 2026

**Type:** AMBIGUOUS
**Project:** Boulevard 5
**Unit:** 207
**Script note:** `Amount 22135.0 > reserva 10000.0 in reservation month. Possible combined Phase1+Phase2.`

**DB state:**
- Sale `019c9692-1243-7045-be57-a608b1dcf76a`: status=active, sale_date=2026-02-10
- Client: Fernando Rafael Soto Barrios
- Price: Q1,509,100 / Enganche: Q105,600

**SSOT:** Q22,135 recorded for Feb 2026 (reservation month).

**User clarification (2026-05-15):** Client paid both reserva AND first installment in the same month (Feb 2026). Q22,135 = combined payment.

**Resolution:** IMPORT Q22,135 for Feb 2026 as a single combined payment.

**Action required:** Script should import this row. Override AMBIGUOUS flag — amount is correct.

---

### Case 144 — AMBIGUOUS · B5 · apto 211 · Mar 2026

**Type:** AMBIGUOUS
**Project:** Boulevard 5
**Unit:** 211
**Script note:** `Amount 82800.0 > reserva 10000.0 in reservation month. Possible combined Phase1+Phase2.`

**DB state:**
- Sale `d43193d0-a84f-4c31-ba46-42d619710fbd`: status=active, sale_date=2026-03-03
- Client: Nery Aroldo Castañeda Cerna / Sara Beatriz Castro Tebalán de Castañeda (rep: José Gutierrez)
- Price: Q1,655,400 / Enganche: Q82,800

**SSOT:** Q82,800 recorded for Mar 2026 (reservation month).

**User clarification (2026-05-15):** Client paid full enganche upfront. Q82,800 = full enganche (matches DB `down_payment_amount` exactly).

**Resolution:** IMPORT Q82,800 for Mar 2026.

**Action required:** Script should import this row. Override AMBIGUOUS flag — amount is correct (full enganche upfront).

---

---

### Case 145 — AMBIGUOUS · B5 · apto 502 · Mar 2026

**Type:** AMBIGUOUS
**Script note:** `Amount 10000.0 < standard reserva 15000.0 in reservation month.`

**DB state:** Sale `448a171c-a29a-4226-b8ba-6fed78e90fba` — Mauricio Adolfo Rodríguez, sale_date=2026-03-03, price=Q1,635,400, enganche=Q350,000.

**User clarification (2026-05-15):** Q10,000 is the correct reserva amount. Non-standard (script's Q15,000 is incorrect expectation for this unit).

**Resolution:** IMPORT Q10,000 for Mar 2026. Override AMBIGUOUS flag.

---

### Case 146 — AMBIGUOUS · B5 · apto 719 · Jan 2026

**Type:** AMBIGUOUS
**Script note:** `Amount 1362326.78 > reserva 10000.0 in reservation month. Possible combined Phase1+Phase2.`

**DB state:** Sale `019c9692-9acb-7d7a-a31d-7e353113f94d` — Flortiz, S.A. (corporate client), sale_date=2026-01-14, price=Q1,456,400, enganche=Q101,900.

**User clarification (2026-05-15):**
- Q1,362,326.78 is a **large corporate lump-sum payment** by Flortiz, S.A.
- Payment was made in **USD**, converted to GTQ for SSOT entry.
- The accounts system cannot natively handle USD payments — the GTQ equivalent was entered manually.

**Resolution:** IMPORT Q1,362,326.78 for Jan 2026. Override AMBIGUOUS flag.

**⚠️ FLAG — USD exchange rate investigation required:**
The Q1,362,326.78 figure is a manual GTQ conversion of a USD payment. The exchange rate applied must be verified:
- What USD amount was actually received?
- What exchange rate was used for the conversion?
- What is the correct exchange rate that should have been applied (e.g., Banguat rate on 2026-01-14)?
- If the rate differs, the GTQ amount in DB must be corrected and the difference documented.

This is a separate accounting task. The import proceeds with Q1,362,326.78 as currently recorded in SSOT, pending rate confirmation.

---

---

### Case 147 — AMBIGUOUS · BEN · apto 408-B · Jan 2026

**Type:** AMBIGUOUS
**Script note:** `Amount 1395.0 < standard reserva 1500.0 in reservation month.`

**DB state:** Sale `019c9681-53a1-7ae3-950d-e4fcc244d1d6` — Oscar Misael De Jesus Santos Borrayo, sale_date=2026-01-19, price=Q477,700, enganche=Q23,900.

**User clarification (2026-05-15):**
- Client paid **Q1,500** via **Neolink**.
- Neolink retains a portion of each payment before releasing to the company bank account.
- Bank received **Q1,395** (same day or next day) — Q105 withheld by Neolink.
- The Q105 holdback may be released by Neolink on a later date as a separate settlement.
- SSOT records the bank-received amount (Q1,395), not the client-paid amount (Q1,500).

**Resolution:** IMPORT Q1,395 for Jan 2026. This is the correct amount actually received by the bank.

**⚠️ SYSTEMIC NOTE — Neolink holdback pattern:**
Neolink payments arrive net of a platform fee/holdback. This means:
- SSOT amounts for Neolink payments will be lower than the nominal client payment.
- The holdback may be released as a separate, later payment — which will surface as a MISSING_IN_DB row when it clears.
- This pattern likely affects other payments across B5, BEN, BLT where clients paid via Neolink.
- A dedicated Neolink reconciliation pass should identify all net-vs-gross discrepancies and track holdback release dates.
- The reconciliation script's standard-reserva comparison will always flag Neolink payments as AMBIGUOUS if the net amount differs from the standard. Consider adding a `payment_channel=neolink` flag to affected payment records.

---

---

### Case 148 — AMBIGUOUS · BEN · apto 404-D · Mar 2026

**Type:** AMBIGUOUS
**Script note:** `Amount 3146.0 > reserva 1500.0 in reservation month. Possible combined Phase1+Phase2.`

**DB state:** Sale `d74498bb-94ed-445a-bf57-bacd31606d68` — Pedro Orlando José Carias Leiva, sale_date=2026-03-08, price=Q537,300, enganche=Q37,700.

**User clarification (2026-05-15):** Client paid reserva + first installment combined in Mar 2026. Q3,146 = combined payment.

**Resolution:** IMPORT Q3,146 for Mar 2026. Override AMBIGUOUS flag.

---

---

### Case 149 — AMBIGUOUS · BLT · apto 302-C · Jan 2026

**Type:** AMBIGUOUS
**Script note:** `Amount 5455.0 > reserva 3000.0 in reservation month. Possible combined Phase1+Phase2.`

**DB state:** Sale `019c9689-90e3-7d8c-971b-d174294fefaa` — Claudia María Gatica Ramírez, sale_date=2026-01-08, price=Q817,300, enganche=Q57,211.

**User clarification (2026-05-15):** Client paid reserva + first installment combined in Jan 2026. Q5,455 = combined payment.

**Resolution:** IMPORT Q5,455 for Jan 2026. Override AMBIGUOUS flag.

---

## ALL 149 BLOCKING ROWS RESOLVED — 2026-05-15

**Resolution complete.** Proceed to batch DB updates and final import run.
