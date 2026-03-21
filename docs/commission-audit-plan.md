# Commission Calculation Deep Audit Plan

**Date:** 2026-03-16
**SSOT Source:** `ComisionesFebrero/` (provided by CFO)
**Scope:** All 4 projects — Boulevard 5, Benestare, Bosque Las Tapias, Casa Elisa
**Excluded Month:** February 2026 (not yet loaded to prod DB)
**Audit Period:** All historical data through January 2026

---

## Table of Contents

1. [SSOT Manifest](#1-ssot-manifest)
2. [App Commission Architecture Summary](#2-app-commission-architecture-summary)
3. [Critical Diffs: SSOT vs App](#3-critical-diffs-ssot-vs-app)
4. [Execution Plan](#4-execution-plan)

---

## 1. SSOT Manifest

### 1.1 File: `CIERRE DE VENTAS FEBRERO 2026.xlsx`

**Single sheet: `insights list`** — 24 rows of February 2026 sales (excluded from diff scope).

| Column | Content |
|--------|---------|
| Proyecto | Benestare (18), Bosque Las Tapias (4), Boulevard 5 (2) |
| Precio de venta | Sale price with tax (IVA + timbres) |
| Precio sin impuestos | `= Precio de venta / 1.093` |
| Comision Total | `= Precio sin impuestos × Porcentaje comision` |
| Comision 30% | `= Comision Total × 30%` (Phase 1) |
| Porcentaje comision | 1.00% (20 rows) or 1.25% (4 rows) |

**Key observations:**
- Commission rates 1.00% / 1.25% appear assigned per-unit, not by monthly threshold count
- 2 desistimientos noted (Apto 306, Apto 1003)
- 1 unsigned client (Apto 210: "Cliente no firmo")
- 1 M:N buyer (Apto 1003: two names separated by "/")
- Tax factor: `1.093` = 12% IVA on 70% + 3% timbres on 30%

### 1.2 File: `02.26 Reservas y cobros proyectos febrero 2026.xlsx`

**23 sheets** — Master payment tracking workbook.

| Sheet | Purpose | Data Rows |
|-------|---------|-----------|
| RESUMEN GENERAL | Cross-project summary dashboard | 4 projects |
| SANTA ELISA | Casa Elisa unit-by-unit payment collections (Jun 2022–May 2025) | ~75 units |
| SANTA ELISA PPTO | Casa Elisa monthly budget/projection | ~79 units |
| BOULEVARD 5 | B5 unit-by-unit payment collections (Mar 2023–Feb 2026) | ~298 units |
| B5 PPTO | B5 monthly budget | ~307 units |
| B5 Alerta | B5 client status pivot (al dia / atrasado / completado) | 616 rows |
| B5 Atradados | B5 overdue client detail | 123 rows |
| RESUMEN | B5-only collection summary | — |
| BENES | Benestare original numbering (Mar 2023–Jul 2025) | ~80 units |
| BOULEVARD 5 orig. | Historical B5 data (as of Mar 2024) | ~311 units |
| BENESTARE | Benestare expanded through Feb 2026 | ~170 units |
| BENESTARE PPTO | Benestare budget | — |
| BL-TAPIAS | Bosque Las Tapias (Mar 2025–Feb 2026) | ~117 units |
| BL PPTO | BLT budget | — |
| BENESTARE 2.0 | Restructured BNT with Torre A renumbering | ~280 units |
| BNT PPTO 2.0 | Restructured BNT budget | — |
| ALERTA BNT 2.0 | BNT 2.0 alert/summary | — |
| RESUMEN BNT 2.0 | BNT 2.0 collection summary | — |
| BL-TAPIAS 2.0 | Restructured BLT expanded inventory | ~276 units |
| BL PPTO 2.0 | Restructured BLT budget | — |
| ALERTA INDECAS 2.0 | BLT 2.0 alert | — |
| RESUMEN INDECAS 2.0 | BLT 2.0 collection summary | — |
| PEND. BTARE | BNT payment plan reference (cuotas) | 66 units |

**Column structure per project sheet:**
- Unit ID, Type, Tower, Salesperson, Client, Reservation Date, Status
- Sale Price, Enganche
- Monthly payment columns (one per month)
- Total Collections, % Collected, Pending Balance
- Bank Financing Amount
- Client Status (al dia / atrasado / enganche completado / F&F)
- Cuotas Pactadas, Cuotas Pagadas, Cuotas Atrasadas

**Key formula: Tax removal**
```
Precio sin impuestos = Precio de venta / 1.093
70% base × 12% IVA = 8.4%
30% base × 3% timbres = 0.9%
Combined: 9.3% → factor 1.093
```

**Escritura split (B5 columns BZ–CG):**
```
BZ = ROUND(PV/1.093 × 70%, 3)   — 70% base
CA = ROUND(PV/1.093 × 30%, 3)   — 30% base
CB = ROUND(BZ × 12%, 2)          — IVA on 70%
CC = ROUND(CA × 3%, 2)           — Timbres on 30%
```

### 1.3 File: `01.26 Comisiones nuevo formato - Enero 2026.xlsx`

**13 sheets** — Commission calculation workbook for January 2026.

| Sheet | Purpose | Rows × Cols |
|-------|---------|-------------|
| Resumen Ahorros | Accumulated ahorro balances per project per month | 47 × 18 |
| Hoja2 | Otto Herrera CE reconciliation (calculo presentado vs nuevo) | small |
| Casa Elisa | CE commission report (March 2025 — older version) | 107 × 140 |
| Pagos | January 2026 payment instructions (who gets paid, bank accounts) | 60 × 14 |
| Boulervard 5 Final | B5 commission calc: Jan 2026 (14+ recipients × 3 phases) | 304 × 196 |
| Benestare Final | BNT commission calc: Jan 2026 | 240 × 173 |
| Bosque Las Tapias | BLT commission calc: Jan 2026 | 90 × 185 |
| Nueva Ubicacion (Torre A) | BNT unit renumbering map | 80 × 14 |
| Hoja1 | Funding request totals | 9 rows |
| Casa Elisa Final (2) | CE commission calc: Aug 2025 (most recent) | 104 × 160 |
| Hoja5 | Otto Herrera referral detail (5 referrals) | small |
| Hoja6 | Detailed referral commission calculation | small |
| Casa Elisa Final | CE commission calc: June 2025 (older) | — |

#### 1.3.1 Commission Recipients per Project (SSOT — January 2026)

**Boulevard 5 (Inmobiliaria El Gran Jaguar, S.A. / NIT: 668146-8)**

| Recipient | Code | Rate | Type |
|-----------|------|------|------|
| Otto Herrera | GG | 0.60% | Management — always paid |
| Alek Hernandez | GC | 0.30% | Management — **conditionally paid** (zeroed on some units) |
| Ahorro G. Comercial | — | 0.20% | Accumulated, never disbursed |
| Supervisor / Antonio R. | SUPER | 0.25% | Management — **conditionally paid** (same trigger as Alek) |
| Antonio Rada | EV 05 | **variable** (0.25–1.25%) | Sales rep |
| (unnamed "B") | EV 14 | variable | Sales rep |
| (unnamed "C") | EV 23 | variable | Sales rep |
| Anahi Cisneros | EV 24 | variable | Sales rep |
| Laura Molina | EV 26 | variable | Sales rep |
| Mario Rodriguez | EV 28 | variable | Sales rep |
| Erwin Cardona | EV 35 | variable | Sales rep |
| Referidos | — | variable | Referral |
| Ahorro | — | **residual** | Overflow bucket |
| Puerta Abierta | — | 2.50% | **Always paid on every sale** |
| **TOTAL** | — | **5.00%** | Hard cap |

**Benestare (Inversiones Inmobiliarias Chinautla, S.A. / NIT: 11206240-7)**

| Recipient | Code | Rate | Type |
|-----------|------|------|------|
| Otto Herrera | GG | 0.60% | Management — always paid |
| **Ronaldo O.** | GC | **0.50%** | **Management — conditional (old reps only)** |
| Alek Hernandez | GC | 0.30% | Management — conditional |
| Supervisor / Antonio R. | SUPER | 0.25% | Management — conditional |
| Efren Sanchez | EV 13 | variable | Sales rep |
| Eder Veliz | EV 20 | variable | Sales rep |
| Antonio Rada | EV 05 | variable | Sales rep |
| Pedro Pablo Sarti | EV 21 | variable | Sales rep |
| Pablo Marroquin | EV 27 | variable | Sales rep |
| Rony Ramirez | EV 29 | variable | Sales rep |
| Puerta Abierta | — | 2.50% | Always paid |
| **TOTAL** | — | **5.00%** | Hard cap |

**Bosque Las Tapias (Inversiones de Castilla, S.A. / NIT: 11205889-2)**

| Recipient | Code | Rate | Type |
|-----------|------|------|------|
| Otto Herrera | GG | 0.60% | Management — always paid |
| **Ronaldo O.** | GC | **0.50%** | **Listed but never paid (all zeros)** |
| Alek Hernandez | GC | 0.30% | Management — conditional |
| Supervisor / Antonio R. | SUPER | 0.25% | Management — conditional |
| Efren Sanchez | EV 13 | variable | Sales rep |
| Fabiola Alvarez | EV 17 | variable | Sales rep |
| Antonio Rada | EV 05 | variable | Sales rep |
| Paula Hernandez | EV 07 | variable | Sales rep |
| Pedro Pablo Sarti | EV 21 | variable | Sales rep |
| Jose Gutierrez | EV 25 | variable | Sales rep |
| Rony Ramirez | EV 29 | variable | Sales rep |
| Gloria Cante | EV 34 | variable | Sales rep |
| Puerta Abierta | — | 2.50% | Always paid |
| **TOTAL** | — | **5.00%** | Hard cap |

**Casa Elisa (Inversiones Inmobiliarias Santa Elisa, S.A. / NIT: 106487750)**
*(Most recent: August 2025)*

| Recipient | Code | Rate | Type |
|-----------|------|------|------|
| Otto Herrera | GG | 0.60% | Management — always paid |
| Alek Hernandez | GC | 0.30% | Management — conditional |
| Supervisor / Antonio R. | SUPER | 0.25% | Management — conditional |
| Paula Hernandez | EV 07 | **variable** (0.40–2.00%) | Sales rep |
| Eder Veliz | EV 20 | variable | Sales rep |
| Efren Sanchez | EV 13 | variable | Sales rep |
| Puerta Abierta | — | 2.50% | Always paid |
| **TOTAL** | — | **5.00%** | Hard cap |

#### 1.3.2 Ahorro Formula (SSOT)

The Ahorro bucket is a **residual calculation**, not a fixed rate:

```
AHORRO% = BASE% − Σ(all EV rates for this unit) − REFERIDO%
```

Where BASE% depends on whether Alek + Supervisor are paid for that unit:
- **1.9000%** when Alek + Supervisor are NOT paid
- **1.3500%** when Alek + Supervisor ARE paid (deducts 0.30% + 0.25% = 0.55%)

Verification: `0.60% (GG) + 0.30% (GC) + 0.25% (Sup) + 1.35% (EV+Ahorro base) + 2.50% (Puerta) = 5.00%`

#### 1.3.3 Ahorro Accumulated Balances (Resumen Ahorros — through Aug 2025)

| Project | Accumulated Balance |
|---------|-------------------|
| Boulevard 5 | Q497,286.76 |
| Casa Elisa | Q162,396.47 |
| Benestare | Q92,827.24 |
| Bosque Las Tapias | Q20,471.63 |

#### 1.3.4 January 2026 Disbursements (Pagos sheet)

| Project | Total Disbursed |
|---------|----------------|
| Boulevard 5 | Q111,048.72 (47.3%) |
| Benestare | Q94,637.87 (40.3%) |
| Bosque Las Tapias | Q29,083.49 (12.4%) |
| Casa Elisa | Q4,176.18 (1.8%) |
| **Grand Total** | **Q234,770.08** |

**ISR retention formula:** `Total a pagar = Total a facturar × 107/112` (5% ISR on pre-IVA amount)

#### 1.3.5 EV Rate Variations (SSOT — per unit)

**Boulevard 5 — Antonio Rada (EV 05):** 6 distinct rates
- 0.25%, 0.30%, 0.40%, 0.50%, 1.00%, 1.25%

**Casa Elisa — Paula Hernandez (EV 07):** 4 distinct rates
- 0.40%, 0.50%, 1.00%, 2.00%

**Benestare / BLT:** Mostly 1.00% or 1.25% (escalation-like pattern)

---

## 2. App Commission Architecture Summary

### 2.1 Core Function

`calculate_commissions(p_payment_id uuid)` — PostgreSQL function triggered on every payment INSERT/UPDATE.

### 2.2 Phase Allocation

| Phase | Name | Percentage | Trigger |
|-------|------|------------|---------|
| 1 | Promise Signed | 30% | `payment_type = 'reservation'` AND `promise_signed_date IS NOT NULL` |
| 2 | Down Payment | 30% | Regular payments, deed not yet signed |
| 3 | Deed Signed | 40% | `deed_signed_date` or `bank_disbursement_date` reached |

### 2.3 Policy Periods (DB — all 4 projects)

**Period 1 (project-specific start — May 2025)**

| Role | Below Threshold | At Threshold |
|------|-----------------|--------------|
| Dirección General | 0.60% | 0.60% |
| Gerencia Comercial | 0.50% | 0.50% |
| Supervisor Comercial | 0% | 0% |
| Ejecutivo Venta | 1.00% | 1.25% |
| Ahorro | 0.40% | 0.15% |

**Period 2 (June 2025 — open-ended)**

| Role | Below Threshold | At Threshold |
|------|-----------------|--------------|
| Dirección General | 0.60% | 0.60% |
| Gerencia Comercial | 0.30% | 0.30% |
| Supervisor Comercial | 0.25% | 0.25% |
| Ejecutivo Venta | 1.00% | 1.25% |
| Ahorro | 0.35% | 0.10% |

### 2.4 Escalation Thresholds

| Project | Threshold |
|---------|-----------|
| Boulevard 5 | 5 units/month |
| Benestare | 5 units/month |
| Bosque Las Tapias | 5 units/month |
| Casa Elisa | 2 units/month |

### 2.5 Cap Enforcement

- Hard cap: 5.00% per sale
- Phase 1+2 combined: max 3.00% (60% of 5%)
- Phase 3: remaining 2.00% (40% of 5%)
- Proportional scaling applied when cap exceeded

### 2.6 Recipients (DB)

Management (always_paid = true):
- `puerta_abierta` — 2.50% *(added migration 032)*
- `otto_herrera` — 0.60%
- `ahorro_comercial` — 0.20%

Management (conditional — from `commission_gerencia_assignments`, temporal by sale_date): *(migration 034)*
- `ronaldo_ogaldez` — 0.50% GC (start → 2025-07-04)
- `alek_hernandez` — 0.30% GC (2025-07-07 → 2026-03-16)
- `antonio_rada` — 0.25% Supervisor (2025-07-07 → 2026-03-16), then 0.30% GC (2026-03-16 → ongoing)
- `job_jimenez` — 0.25% Supervisor (2026-03-16 → ongoing)

Special:
- `walk_in` — deactivated *(CFO confirmed walk-ins don't exist)*
- `ahorro` — 0.35% (below threshold) / 0.10% (at threshold)
- `ahorro_por_retiro` — 0% (absorbs retired rep commissions)
- `referral` — 1.00%

Sales Reps (ejecutivo): Per-unit rate stored on `sales.ejecutivo_rate` *(migration 033)*. Backfilled from policy-period escalation (1.00%/1.25%). CFO confirmation required.

---

## 3. Critical Diffs: SSOT vs App

### DIFF-01: Ronaldo O. (0.50%) — Missing from App --- RESOLVED (migration 034)

| Aspect | SSOT | App |
|--------|------|-----|
| **Recipient** | Ronaldo O. at 0.50% | Does not exist |
| **Projects** | Benestare (conditionally paid for old reps), BLT (listed, never paid) | N/A |
| **Impact** | **HIGH** — 0.50% on ~80+ BNT units with old salespeople. All commission rows for these units are missing this recipient. |
| **Root Cause** | Ronaldo O. was likely added to BNT/BLT after the app's initial commission schema was built. The app has no `ronaldo_ogaldez` or equivalent recipient. |
| **Resolution** | Add `ronaldo_ogaldez` as a management recipient. Define conditional logic (paid only for specific salespeople/units). Backfill historical commissions. |
| **Status** | **RESOLVED** — Migration 034 added Ronaldo to `commission_gerencia_assignments` for B5 (existing, fixed dates), BNT (new, 2023-08→2025-07-04), BLT (new, 2024-10→2025-07-04). Temporal lookup in `calculate_commissions()` Section 1b. 4,757 commission rows generated. |

### DIFF-02: Puerta Abierta — Always Paid vs Walk-In Only --- RESOLVED (migration 032)

| Aspect | SSOT | App |
|--------|------|-----|
| **Rate** | 2.50% | 2.50% |
| **Trigger** | **Always paid on every single sale** | **Only paid when `sales_rep_id IS NULL`** (walk-in sales) |
| **Impact** | **CRITICAL** — The app does NOT generate Puerta Abierta commission rows for sales that have an assigned salesperson. The SSOT shows Puerta Abierta at 2.50% on ALL units regardless of whether a sales rep is assigned. |
| **Root Cause** | Fundamental architectural misunderstanding. "Puerta Abierta" in the SSOT is the company's share (2.50% of every sale). In the app, it was implemented as a special walk-in rate only. |
| **Resolution** | Restructure `walk_in` logic. Puerta Abierta (2.50%) must be an `always_paid` management-tier recipient on every sale. Walk-in logic (when no sales rep) should redirect the EV portion to ahorro or similar, not to Puerta Abierta. |
| **Status** | **RESOLVED** — Migration 032 moved Puerta Abierta to `always_paid = true` management recipient. Walk-in concept eliminated (CFO confirmed walk-ins don't exist). 6,524 commission rows. |

### DIFF-03: Alek Hernandez — Conditional vs Always Paid --- RESOLVED (migration 034)

| Aspect | SSOT | App |
|--------|------|-----|
| **Rate** | 0.30% | 0.30% |
| **Payment logic** | **Conditional** — zeroed out (×0) on specific units depending on the salesperson | **always_paid = true** — paid on every single payment |
| **Impact** | **HIGH** — The app overpays Alek's commission on units where the SSOT zeroes it out. |
| **Root Cause** | The app treats all management recipients as unconditionally paid. The SSOT has a per-unit override that zeroes certain recipients based on the selling rep. |
| **Resolution** | Define the business rule for when Alek is zeroed out (which salespeople trigger this?). Implement conditional logic in `calculate_commissions()`. |
| **Status** | **RESOLVED** — Migration 034 moved Alek from `always_paid=true` to conditional via `commission_gerencia_assignments` (start_date=2025-07-07, end_date=2026-03-16). Temporal lookup in Section 1b. 476 commission rows (post-July sales only). Zero pre-July rows confirmed. |

### DIFF-04: Supervisor / Antonio R. — Conditional vs Always Paid --- RESOLVED (migration 034)

| Aspect | SSOT | App |
|--------|------|-----|
| **Rate** | 0.25% | 0.25% |
| **Payment logic** | **Conditional** — same trigger as Alek (zeroed on same units) | **always_paid = true** (Period 2) |
| **Impact** | **HIGH** — Same overpayment issue as DIFF-03 but for the Supervisor role. |
| **Resolution** | Same as DIFF-03 — define the business rule, implement conditional logic. |
| **Status** | **RESOLVED** — Migration 034 moved Antonio from `always_paid=true` to conditional via `commission_gerencia_assignments`. Supervisor 0.25% (2025-07-07→2026-03-16), then promoted to GC 0.30% (2026-03-16→ongoing). Job Jimenez replaces as Supervisor (2026-03-16→ongoing). 476 commission rows. Zero pre-July rows confirmed. |

### DIFF-05: Ahorro Calculation — Residual vs Fixed Rate --- RESOLVED (migration 035)

| Aspect | SSOT | App |
|--------|------|-----|
| **Formula** | `BASE% − Σ(EV rates) − REFERIDO%` (residual, per-unit) | Fixed rate from policy: 0.35% (below) / 0.10% (at threshold) |
| **BASE%** | 1.90% when Alek+Sup NOT paid; 1.35% when Alek+Sup ARE paid | N/A — no conditional base |
| **Impact** | **HIGH** — The app's fixed ahorro rate does not account for per-unit EV rate variations. When a rep has a rate lower than 1.00% (e.g., 0.25%), the SSOT puts the difference into ahorro. The app does not. |
| **Example** | Unit with EV 05 at 0.25%: SSOT ahorro = 1.90% − 0.25% = 1.65%. App ahorro = 0.35%. Difference: **1.30% per unit.** |
| **Root Cause** | The app was designed with escalation-only rate variation (1.00%/1.25%). The SSOT has arbitrary per-unit rates that make the ahorro residual essential. |
| **Resolution** | Either (a) implement residual ahorro calculation, or (b) normalize all EV rates to 1.00%/1.25% and confirm with CFO that per-unit rates are legacy. |
| **Status** | **RESOLVED** — Migration 035 replaced fixed 0.35% ahorro with dynamic residual: `ahorro = 5.00% - sum(all other rates)`. Ahorro rows: 6,115→1,519 (75% of sales now exceed 5% without ahorro). Phase 3 rate sums = exactly 5.00% on all payments. 4 distinct residual rates observed (0.15%–0.70%). |

### DIFF-06: Per-Unit EV Rate Variations — Not Captured by Escalation Model --- RESOLVED (migration 033)

| Aspect | SSOT | App |
|--------|------|-----|
| **EV rate determination** | Per-unit, manually assigned (6 distinct rates for Antonio Rada in B5 alone) | Threshold-based: 1.00% (below) or 1.25% (at/above threshold) |
| **Rates observed** | 0.25%, 0.30%, 0.40%, 0.50%, 0.90%, 1.00%, 1.25%, 1.90%, 2.00% | Only 1.00% or 1.25% |
| **Impact** | **HIGH** — The app cannot reproduce the SSOT's per-unit rate assignments. Units sold at 0.25% or 0.50% will have incorrect EV commission in the app. |
| **Root Cause** | The app assumed all EV rates follow a simple binary escalation model. The SSOT reveals rates are assigned per historical/contractual agreement per unit. |
| **Resolution** | Either (a) add a per-sale rate override field, or (b) confirm with CFO which rates are current policy vs legacy. |
| **Status** | **RESOLVED** — Migration 033 added `sales.ejecutivo_rate` (Stripe Ledger pattern). Per-unit rate stored on the sale, not looked up. Backfilled from policy-period escalation model (1.00%/1.25%). CFO confirmation workflow (`ejecutivo_rate_confirmed`). Master-only PATCH at `/api/reservas/admin/sales/[id]/ejecutivo-rate`. |

### DIFF-07: Ahorro G. Comercial (0.20%) — Different Treatment --- RESOLVED (migration 038)

| Aspect | SSOT | App |
|--------|------|-----|
| **Rate** | 0.20% (B5 only) | 0.20% (`ahorro_comercial`, always_paid) |
| **Treatment** | Computed but **accumulated, never disbursed** (separate tracking in Resumen Ahorros) | Treated as a regular `always_paid` recipient — commission rows generated and potentially marked as paid |
| **Impact** | **MEDIUM** — If the app marks `ahorro_comercial` commissions as "paid," it misrepresents the accounting reality. |
| **Resolution** | Verify if `ahorro_comercial` rows exist in the `commissions` table and their `paid` status. Potentially redefine as accumulation-only. |
| **Status** | **RESOLVED** — Migration 038 added `disbursable` boolean to `commission_rates`. Set `false` for 4 accumulation-only accounts (puerta_abierta, ahorro, ahorro_comercial, ahorro_por_retiro). API returns `disbursable` flag per recipient + split summary (disbursableTotal/Paid/Unpaid). Dashboard KPIs show "A desembolsar" vs "Acumulado". Commission bars show "Acumulado" badge on non-disbursable recipients. |

### DIFF-08: ISR Retention — Not Modeled in App --- RESOLVED (migration 036)

| Aspect | SSOT | App |
|--------|------|-----|
| **Logic** | `Total a pagar = Total a facturar × 107/112` (5% ISR on pre-IVA amount) | No ISR logic whatsoever |
| **Impact** | **MEDIUM** — The app shows commission amounts but cannot differentiate between "to invoice" and "to pay" amounts. Pati's payment instructions require this distinction. |
| **Resolution** | Add ISR retention calculation to the commission display/export. This is a presentation-layer concern, not a calculation-layer change. |
| **Status** | **RESOLVED** — Migration 036 added `isr_exempt` column to `commission_rates`. ISR utility (`src/lib/isr.ts`) computes facturar/isrRetenido/pagar from base commission. API returns ISR fields per recipient. Dashboard shows ISR KPI row + "Neto" amounts on commission bars. Exempt: puerta_abierta, ahorro, ahorro_comercial, ahorro_por_retiro. Configurable. |

### DIFF-09: Phase Commission Pro-Rata (Sale-Price Base) --- RESOLVED (migration 037)

| Aspect | SSOT | App |
|--------|------|-----|
| **Phase 2 formula** | `IFERROR(cuota/(enganche-reserva) × (total_commission × 30%) × trigger, 0)` — pro-rata based on payment/enganche ratio | `payment_amount × rate × 0.30` — flat percentage of each payment |
| **Impact** | **MEDIUM** — The math may produce different results. SSOT divides each cuota by total enganche to proportion the 30% phase. App applies 30% to each payment directly. Over the life of the enganche, both should converge to the same total, but individual payment rows will differ. |
| **Resolution** | Verify mathematically whether both approaches produce identical totals. If not, quantify the variance. |
| **Status** | **RESOLVED** — Migration 037 changed commission base from `payment_amount` to `sale_price` (prorated by payment's share within its phase). Phase 1: `base = sale_price` (one-time). Phase 2: `base = (cuota / enganche_neto) × sale_price`. Phase 3: `base = (payment / phase3_denom) × sale_price`. Where `enganche_neto = down_payment - reservation`, `phase3_denom = sale_price - down_payment`. Phase 1 totals: Q39K→Q951K (+24x). Phase 2 totals: Q645K→Q4.5M (+7x). 60% cap compliance: 0 violations. Row counts unchanged (31,688). |

### DIFF-10: Escalation Trigger — Monthly Count vs Per-Unit Assignment --- RESOLVED (verified, superseded by migration 033)

| Aspect | SSOT | App |
|--------|------|-----|
| **1.25% trigger** | Appears assigned per-unit (4 of 24 Feb 2026 sales at 1.25%) | Triggered when rep sells ≥ threshold units in a calendar month |
| **Impact** | **MEDIUM** — Need to verify whether the 4 units at 1.25% in the Cierre correspond to reps who hit threshold. If they do, the app logic is correct. If not, 1.25% is a per-unit override. |
| **Resolution** | Cross-reference Feb 2026 sales: count each rep's sales in Feb. Check if reps with 1.25% hit the 5-unit threshold. |
| **Status** | **RESOLVED** — Verified: zero references to escalation, threshold, policy_period, or fallback in `calculate_commissions()`. `sales.ejecutivo_rate` is the sole source (9 references in function). Escalation trigger code completely removed by migration 033. Rate backfill produced 1.00%/1.25% from threshold model; CFO confirmation workflow exists to adjust individual rates when needed. 30 orphaned sales with NULL rate (all linked to "Unknown" salesperson, zero payments — see `docs/orphaned-sales-investigation.md`). |

### DIFF-11: Casa Elisa — Unique Rate Structure --- RESOLVED (verified, covered by migrations 033+035)

| Aspect | SSOT | App |
|--------|------|-----|
| **CE-specific rates** | Paula Hernandez: 0.40%, 0.50%, 1.00%, 2.00% across different units | Standard escalation: 1.00% / 1.25% |
| **CE Ahorro base** | 1.40% (when Alek+Sup paid) — different from other projects' 1.35% | Same formula as other projects |
| **Impact** | **MEDIUM** — CE is the smallest project (~75 units) and has an older version (Aug 2025). But the rate variations indicate project-specific rules. |
| **Resolution** | Clarify with CFO whether CE has unique contractual rates or if these are legacy. |
| **Status** | **RESOLVED** — Verified: CE ahorro rates are 0.45% and 0.70% — correct residual values from the dynamic formula (`5% - sum(all rates)`). The "CE-specific ahorro base of 1.40%" is automatically handled by the residual calculation (no special CE logic needed). CE per-unit rates: 18 at 1.00%, 56 at 1.25%, zero NULL. `sales.ejecutivo_rate` supports any rate value — CFO can adjust via confirmation workflow. |

### DIFF-12: Referral Commission Recipient Overrides --- RESOLVED (verified, no data to compare)

| Aspect | SSOT | App |
|--------|------|-----|
| **Otto Herrera referrals** | Separate sheet (Hoja5/Hoja6) tracks 5 referrals with 1.00% rate, 3-phase allocation | Generic `referral` recipient at 1.00% |
| **Impact** | **LOW** — The rate matches. But the SSOT tracks referrals per referring individual. The app uses a generic bucket. |
| **Resolution** | Verify that referral commission amounts match between SSOT and app for known referral sales. |
| **Status** | **RESOLVED** — Verified: zero active sales with `referral_applies = true`. Zero referral commission rows. Referral logic exists in `calculate_commissions()` Section 3 at 1.00% rate, names rows "Referral Bonus: [referral_name]" per referring individual. Code is correct and ready; no referral data exists in the current dataset to compare against SSOT. |

### DIFF-13: Fallback Rates for Legacy Sales Reps --- RESOLVED (verified, superseded by migration 033)

| Aspect | SSOT | App |
|--------|------|-----|
| **Rep 06 (Jose Franco)** | Not visible in Jan 2026 data (possibly no active payments) | Fallback rate: 1.90% |
| **Rep 05 (Antonio Rada)** | Variable per-unit (0.25%–1.25%) | Fallback rate: 0.90% |
| **Impact** | **MEDIUM** — Fallback rates (used when no policy period matches) don't align with SSOT per-unit rates. |
| **Resolution** | Verify when fallback rates are actually used (pre-Period 1 payments only?) and whether they match historical SSOT data. |
| **Status** | **RESOLVED** — Verified: zero fallback code in `calculate_commissions()`. Function uses only `sales.ejecutivo_rate`; when NULL, it issues `RAISE WARNING` and skips ejecutivo commission (no fallback rate applied). Antonio Rada: 168 active sales (10 at 1.00%, 158 at 1.25%). Jose Franco: not in unified `salespeople` table (legacy rep, no active sales). 4,493 total ejecutivo commission rows, ZERO with non-standard rates. All rates are 1.00% or 1.25% from backfill. |

---

## 4. Execution Plan

### Phase 1: Data Extraction (DB vs SSOT)

**Objective:** Extract comparable datasets from both sources.

#### 1.1 Query App Database
```sql
-- All commissions through January 2026, grouped by sale
SELECT
  s.id AS sale_id,
  p.name AS project_name,
  u.unit_number,
  s.client_name,
  sr.name AS sales_rep_name,
  s.price AS sale_price,
  s.price_without_tax,
  c.recipient_id,
  c.recipient_name,
  c.phase,
  c.rate,
  c.base_amount,
  c.commission_amount,
  c.paid,
  c.policy_period_id,
  c.referral_type,
  pay.payment_date,
  pay.payment_type,
  pay.amount AS payment_amount
FROM commissions c
JOIN payments pay ON c.payment_id = pay.id
JOIN sales s ON c.sale_id = s.id
JOIN projects p ON s.project_id = p.id
LEFT JOIN units u ON s.unit_id = u.id
LEFT JOIN sales_reps sr ON s.sales_rep_id = sr.id
WHERE pay.payment_date <= '2026-01-31'
ORDER BY p.name, u.unit_number, pay.payment_date, c.recipient_id;
```

#### 1.2 Extract SSOT Commission Totals per Unit
For each project's "Final" sheet in `01.26 Comisiones nuevo formato`:
- Sum Phase 1 + Phase 2 + Phase 3 per recipient per unit
- Note which recipients are zeroed on which units
- Capture the ahorro residual per unit

#### 1.3 Extract SSOT Payment Totals per Unit
From `02.26 Reservas y cobros`:
- Sum all monthly payment columns per unit (through Jan 2026)
- Cross-reference with commission calculation inputs

### Phase 2: Unit-Level Comparison

**Objective:** For each unit in each project, compare SSOT commission totals to app commission totals.

#### 2.1 Per-Unit Commission Comparison
For each unit, compare:
- Total commission per recipient (SSOT vs App)
- Phase breakdown per recipient (SSOT vs App)
- Rate used per recipient (SSOT vs App)
- Ahorro amount (SSOT residual vs App fixed)

#### 2.2 Identify Variances
Flag any unit where:
- SSOT total ≠ App total (tolerance: ±Q1.00 for rounding)
- A recipient exists in SSOT but not in App (or vice versa)
- Rate differs between SSOT and App
- Ahorro differs by more than Q10.00

### Phase 3: Structural Gap Analysis

**Objective:** Quantify the financial impact of each diff.

#### 3.1 DIFF-02 Impact (Puerta Abierta)
```
Impact = Σ(price_without_tax × 2.50%) for all non-walk-in sales
```
This is the total Puerta Abierta commission that the app is NOT generating.

#### 3.2 DIFF-03/04 Impact (Alek + Supervisor overpayment)
```
Impact = Σ(commission_amount) for Alek + Antonio Rada on units where SSOT zeroes them
```
This is the total commission the app is incorrectly generating.

#### 3.3 DIFF-05/06 Impact (Ahorro + EV rate variance)
```
Per unit: SSOT_ahorro − App_ahorro = (BASE% − actual_EV%) − fixed_ahorro_rate
```
Sum across all units.

### Phase 4: Reconciliation Report

**Objective:** Produce a final audit document with:

1. **Summary table:** Total commission per project per recipient (SSOT vs App)
2. **Variance table:** Units with discrepancies, sorted by magnitude
3. **Root cause classification:** Each variance tagged with its DIFF-XX cause
4. **Financial impact:** Total Q over/under-stated per diff category
5. **Recommendations:** Prioritized list of code/data changes needed

### Phase 5: Implementation Roadmap

Based on audit findings, create a prioritized implementation plan:

1. ~~**P0 (Critical):** Fix Puerta Abierta (DIFF-02)~~ **DONE** — migration 032
2. ~~**P0 (Critical):** Add Ronaldo O. recipient (DIFF-01)~~ **DONE** — migration 034
3. ~~**P1 (High):** Implement conditional Alek/Supervisor payment (DIFF-03/04)~~ **DONE** — migration 034
4. **P1 (High):** Implement residual ahorro calculation (DIFF-05)
5. ~~**P2 (Medium):** Support per-unit EV rate overrides (DIFF-06)~~ **DONE** — migration 033
6. ~~**P2 (Medium):** Add ISR retention display (DIFF-08)~~ **DONE** — migration 036
7. ~~**P3 (Low):** Verify Phase 2 proportional math (DIFF-09)~~ **DONE** — migration 037
8. ~~**P3 (Low):** Validate escalation trigger logic (DIFF-10)~~ **VERIFIED** — superseded by migration 033

---

## Appendix A: Legal Entities

| Project | Legal Entity | NIT |
|---------|-------------|-----|
| Casa Elisa | Inversiones Inmobiliarias Santa Elisa, S.A. | 106487750 |
| Boulevard 5 | Inmobiliaria El Gran Jaguar, S.A. | 668146-8 |
| Benestare | Inversiones Inmobiliarias Chinautla, S.A. | 11206240-7 |
| Bosque Las Tapias | Inversiones de Castilla, S.A. | 11205889-2 |

## Appendix B: EV Code → Name Cross-Reference

| EV Code | Name | Projects |
|---------|------|----------|
| 05 | Antonio Rada | B5, BNT, BLT |
| 06 | Jose Franco | B5 |
| 07 | Paula Hernandez | CE, BLT |
| 09 | (Benestare legacy) | BNT |
| 10 | (Benestare legacy) | BNT |
| 11 | Luis Esteban | BNT |
| 12 | (Benestare legacy) | BNT |
| 13 | Efren Sanchez | BNT, BLT |
| 14 | (unnamed "B") | B5 |
| 17 | Fabiola Alvarez | BLT |
| 20 | Eder Veliz | BNT |
| 21 | Pedro Pablo Sarti | BNT, BLT |
| 23 | (unnamed "C") | B5 |
| 24 | Anahi Cisneros | B5 |
| 25 | Jose Gutierrez | BLT |
| 26 | Laura Molina | B5 |
| 27 | Pablo Marroquin | BNT |
| 28 | Mario Rodriguez | B5 |
| 29 | Rony Ramirez | BNT, BLT |
| 34 | Gloria Cante | BLT |
| 35 | Erwin Cardona | B5 |

## Appendix C: Reservation Amounts by Project (SSOT)

| Project | Reservation Amount |
|---------|-------------------|
| Benestare | Q1,500 |
| Bosque Las Tapias | Q3,000 |
| Boulevard 5 | Q10,000 |
| Casa Elisa | Variable |


---

## ADDENDUM 2026-03-20: BLT Torre B — Authoritative Correction

**Source:** Jorge (project owner), direct confirmation.
**Cross-reference:** `docs/creditos-33-units-investigation.md` (UPDATE 2026-03-20)

During the Créditos dashboard backfill investigation, 24 BLT Torre B units were flagged with credit data but no reservations. The "INFO PARA REPORTES" Excel sheet listed 58 rows of client data, suggesting 58 hidden sales. Upon authoritative review:

1. **Only 3 sales exist in Bosque Las Tapias — Torre B.** The 58 rows in "INFO PARA REPORTES" do NOT represent real sales. The true number is **3**.
2. **All existing BLT Torre B sales records will be dropped from the production database** to establish a clean baseline.
3. **Only the 3 currently existing sales will be uploaded** as the sole BLT Torre B transactions.

Any prior references in this document to BLT Torre B having 11 hidden reservations (Category C), 13 orphan income markers (Category D), or 58 clients missing from the DB are **superseded** by this correction.