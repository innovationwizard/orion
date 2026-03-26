# Cotizador Diff Report — Real Excel vs App

**Date:** 2026-03-26
**Status:** COMPLETE
**Source — Real cotizadores:** `Reservas/*/Disponibilidad.xlsx` → "Cotizador" tabs (13 tabs across 5 projects)
**Source — App cotizador:** `src/lib/reservas/cotizador.ts` (161 LOC) + `src/app/cotizador/cotizador-client.tsx` (255 LOC)
**Manifest used:** `memory/reservas-folder-manifest.md`

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Inventory of Real Cotizador Tabs](#2-inventory-of-real-cotizador-tabs)
3. [Per-Project Parameter Comparison](#3-per-project-parameter-comparison)
4. [Formula-Level Diffs](#4-formula-level-diffs)
5. [Structural & Presentation Diffs](#5-structural--presentation-diffs)
6. [Inconsistencies Within the Excel Cotizadores Themselves](#6-inconsistencies-within-the-excel-cotizadores-themselves)
7. [Impact Assessment](#7-impact-assessment)

---

## 1. Executive Summary

The app cotizador (`/cotizador`) uses a single set of hardcoded defaults applied uniformly to all projects. The real cotizadores are **per-project, per-tower, and per-unit-type**, with dramatically different parameters, formulas, and even currencies. Every single computation in the app produces incorrect results when compared to the Excels the sales team actually uses.

**Diff count:** 37 discrete differences organized into 4 categories:
- **14 formula/computation diffs** (wrong math)
- **10 parameter diffs** (wrong defaults)
- **8 structural/presentation diffs** (missing fields/sections)
- **5 cross-project inconsistencies** (Excel-vs-Excel variations the app must model)

---

## 2. Inventory of Real Cotizador Tabs

| # | Project | File | Tab Name | Unit Type | Currency |
|---|---------|------|----------|-----------|----------|
| 1 | Benestare | `BEN/Disponibilidad.xlsx` | Cotizador TA | Apto (Torre A) | GTQ |
| 2 | Benestare | `BEN/Disponibilidad.xlsx` | Cotizador TB | Apto (Torre B) | GTQ |
| 3 | Benestare | `BEN/Disponibilidad.xlsx` | Cotizador TC | Apto (Torre C) | GTQ |
| 4 | Benestare | `BEN/Disponibilidad.xlsx` | Cotizador TD | Apto (Torre D) | GTQ |
| 5 | Bosque Las Tapias | `BLT/Disponibilidad.xlsx` | Cotizador Torre C | Apto (Torre C) | GTQ |
| 6 | Bosque Las Tapias | `BLT/Disponibilidad.xlsx` | Cotizador Torre B | Apto (Torre B) | GTQ |
| 7 | Boulevard 5 | `B5/Disponibilidad.xlsx` | Cotizador automático 2025 | Apto | GTQ |
| 8 | Boulevard 5 | `B5/Disponibilidad.xlsx` | Cotizador aptos Terraza | Apto Terraza | GTQ |
| 9 | Boulevard 5 | `B5/Disponibilidad.xlsx` | Cotizador contado | Apto (contado) | GTQ |
| 10 | Casa Elisa | `CE/Disponibilidad.xlsx` | Cotizador Automatico | Apto | GTQ |
| 11 | Casa Elisa | `CE/Disponibilidad.xlsx` | Cotizador 208 | Apto (unit 208) | GTQ |
| 12 | Casa Elisa | `CE/Disponibilidad.xlsx` | Cotizador Locales | Local comercial | GTQ |
| 13 | Santa Elena | `SE/Disponibilidad.xlsx` | Cotizador Automático | Casa (house) | **USD** |

**Tab #9 (B5 contado) is hidden** — excluded from detailed analysis.

---

## 3. Per-Project Parameter Comparison

### 3.1 Enganche Percentage

| Project / Variant | Excel | App Default |
|---|---|---|
| Benestare (all towers) | **5%** | 10% |
| Bosque Las Tapias (all towers) | **7%** | 10% |
| Boulevard 5 (automático + Terraza) | **7%** | 10% |
| Casa Elisa (Automatico) | **5%** | 10% |
| Casa Elisa (208) | **10%** | 10% |
| Casa Elisa (Locales) | **20%** | 10% |
| Santa Elena | **30%** | 10% |

**Verdict:** App default of 10% matches only CE-208. 6 of 7 variants are wrong.

### 3.2 Reserva Amount

| Project / Variant | Excel | App Default |
|---|---|---|
| Benestare (all towers) | **Q1,500** | Q1,500 |
| Bosque Las Tapias (all towers) | **Q3,000** | Q1,500 |
| Boulevard 5 (all) | **Q10,000** | Q1,500 |
| Casa Elisa (all) | **Q5,000** | Q1,500 |
| Santa Elena | **$10,000** | Q1,500 |

**Verdict:** App default matches only Benestare. 4 of 5 projects are wrong. Santa Elena is USD.

### 3.3 Installment Months (Cuotas de Enganche)

| Project / Variant | Excel | App Default |
|---|---|---|
| Benestare (all towers) | **7** | 7 |
| Bosque Las Tapias (Torre C) | **24** | 7 |
| Bosque Las Tapias (Torre B) | **28** | 7 |
| Boulevard 5 (automático) | **8** | 7 |
| Boulevard 5 (Terraza) | **7** | 7 |
| Casa Elisa (Automatico) | **1** | 7 |
| Casa Elisa (208) | **2** | 7 |
| Casa Elisa (Locales) | **1** | 7 |
| Santa Elena | **15** | 7 |

**Verdict:** App default matches Benestare and B5-Terraza only. 7 of 9 variants are wrong.

### 3.4 Bank Interest Rates

| Project / Variant | Excel Rates | App Rates |
|---|---|---|
| Benestare | Dropdown: **5%, 5.5%, 7.26%, 8.5%** | 7.5%, 8.5%, 9.5%, 10.5% |
| Bosque Las Tapias | **5.5%** (single) | 7.5%, 8.5%, 9.5%, 10.5% |
| Boulevard 5 (automático) | **7.26%** (single) | 7.5%, 8.5%, 9.5%, 10.5% |
| Boulevard 5 (Terraza) | **7.26%** (single) | 7.5%, 8.5%, 9.5%, 10.5% |
| Casa Elisa (Automatico) | **7.26%** (hardcoded in PMT) | 7.5%, 8.5%, 9.5%, 10.5% |
| Casa Elisa (208) | **7.5%** (hardcoded in PMT) | 7.5%, 8.5%, 9.5%, 10.5% |
| Casa Elisa (Locales) | **7.5%** (hardcoded in PMT) | 7.5%, 8.5%, 9.5%, 10.5% |
| Santa Elena | **8.5%** (single) | 7.5%, 8.5%, 9.5%, 10.5% |

**Verdict:** Zero overlap. Excels use market FHA rates (5%–8.5%). App uses arbitrary rates (7.5%–10.5%) that don't exist in any real cotizador. Most Excels use a single rate (not a 4-rate matrix).

### 3.5 Plazos (Loan Terms in Years)

| Project / Variant | Excel | App |
|---|---|---|
| Benestare | **40, 30, 25, 20** | 15, 20, 25, 30 |
| Bosque Las Tapias | **30, 25, 20, 15, 10** | 15, 20, 25, 30 |
| Boulevard 5 | **30, 25, 20, 15, 10** | 15, 20, 25, 30 |
| Casa Elisa (Automatico) | **30, 25, 17, 15, 10** | 15, 20, 25, 30 |
| Casa Elisa (208/Locales) | **30, 25, 17, 15, 10** | 15, 20, 25, 30 |
| Casa Elisa (Locales) | **1, 5, 10, 20** | 15, 20, 25, 30 |
| Santa Elena | **25, 20, 15, 10, 5** | 15, 20, 25, 30 |

**Verdict:** App always shows 15/20/25/30. Excel varies by project (includes 40, 17, 10, 5, 1). Benestare has 40 years. CE has 17 years. Locales has 1 year. None match app exactly.

### 3.6 Currency

| Project | Excel | App |
|---|---|---|
| Benestare | GTQ (Q) | GTQ (Q) |
| Bosque Las Tapias | GTQ (Q) | GTQ (Q) |
| Boulevard 5 | GTQ (Q) | GTQ (Q) |
| Casa Elisa | GTQ (Q) | GTQ (Q) |
| Santa Elena | **USD ($)** | GTQ (Q) |

**Verdict:** App is GTQ-only. Santa Elena quotes in USD.

### 3.7 Summary — Parameters That Match Per-Project

| Parameter | BEN | BLT | B5 | CE-Auto | CE-208 | CE-Loc | SE |
|---|---|---|---|---|---|---|---|
| Enganche % | miss | miss | miss | miss | **match** | miss | miss |
| Reserva | **match** | miss | miss | miss | miss | miss | miss |
| Cuotas | **match** | miss | miss | miss | miss | miss | miss |
| Rates | miss | miss | miss | miss | miss | miss | miss |
| Plazos | miss | miss | miss | miss | miss | miss | miss |
| Currency | **match** | **match** | **match** | **match** | **match** | **match** | miss |

**Only 8 of 42 parameter cells match.** The app cotizador is fundamentally wrong for every project.

---

## 4. Formula-Level Diffs

### DIFF-F01: Rounding — ROUNDUP to Q100 vs Math.round

**Excel (most projects):**
```
Enganche:        =ROUNDUP(pct * price, -2)    → rounds UP to nearest Q100
Cuota enganche:  =ROUNDUP(neto / meses, 0)    → rounds UP to nearest Q1
Saldo a financiar: =ROUNDUP(price - enganche, -2) → rounds UP to Q100
```

**App:**
```ts
enganche_total = Math.round(price * enganche_pct)    // rounds to NEAREST integer
cuota_enganche = Math.round(enganche_neto / months)  // rounds to NEAREST integer
monto_financiar = Math.max(0, price - enganche_total) // NO rounding at all
```

**Impact:** On a Q500,000 unit at 7%: Excel enganche = Q35,100 (ROUNDUP). App enganche = Q35,000 (Math.round of Q35,000 = Q35,000). On Q501,234 at 7%: Excel = Q35,100 (ROUNDUP(35086.38,-2)). App = Q35,087 (Math.round). The Q100 rounding ensures clean payment amounts for clients.

**Exception:** Casa Elisa (Automatico, 208, Locales) and Santa Elena do **NOT** round enganche — they use `=price*pct` directly. Boulevard 5 Terraza also has no enganche rounding (`=C24*D26`). This is project-specific.

### DIFF-F02: Last-Installment Adjustment (Missing)

**Excel (BLT, B5):**
```
Last cuota = enganche_neto - SUM(all previous cuotas)
e.g. =C22-SUM(G16:G39)
```
This absorbs the rounding remainder so the total matches exactly.

**App:**
```ts
// All installments are identical: cuota_enganche = Math.round(enganche_neto / months)
// NO final adjustment — remainder is silently lost or over-collected
```

**Impact:** If enganche_neto = Q33,500 and months = 24: App shows Q1,396 × 24 = Q33,504 (Q4 overcollected). Excel: Q1,396 × 23 + Q1,392 = Q33,500 exact.

### DIFF-F03: IUSI Tax Base — valor_inmueble vs Total Price

**Excel (all projects):**
```
IUSI = (valor_inmueble * 0.009) / 12
Where valor_inmueble = (price / 1.093) * 0.70
```
The IUSI is charged on the registered immovable property value (the pre-tax 70% inmueble portion), not on the total purchase price.

**App:**
```ts
iusi_monthly = Math.round((price * COTIZADOR_DEFAULTS.IUSI_ANNUAL_RATE) / 12)
```
Uses the full `price` (100% of total investment including acciones + IVA).

**Impact:** On a Q500,000 unit: Excel IUSI base = (500000/1.093)×0.70 = Q320,219. Excel IUSI/mo = Q240. App IUSI base = Q500,000. App IUSI/mo = Q375. **App overstates IUSI by ~56%.**

### DIFF-F04: Insurance/Seguro Base — Varies by Project

**Excel varies:**
| Project | Insurance Base | Formula |
|---|---|---|
| Benestare | **No insurance line** | N/A |
| Bosque Las Tapias | **No insurance line** | N/A |
| Boulevard 5 | **No insurance line** | N/A |
| Casa Elisa (Auto) | **No insurance line** | N/A |
| Casa Elisa (208) | Total price | `=($C$23*0.0035)/12` |
| Santa Elena | Total price | `=+$C$20*0.0035/12` |

**App:**
```ts
seguro_monthly = Math.round((monto_financiar * INSURANCE_ANNUAL_RATE) / 12)
```
Always present. Uses `monto_financiar` (financed amount, not total price).

**Impact:** The app shows insurance on every cotización, but 10 of 13 real cotizador tabs don't include it at all. Where insurance exists (CE-208, SE), the base differs: Excel uses total price, app uses financed amount.

### DIFF-F05: Cuota Mensual Composition — Varies by Project

**Excel varies:**
| Project | Cuota Mensual = |
|---|---|
| Benestare | bank + IUSI (no seguro) |
| Bosque Las Tapias | bank + IUSI (no seguro) |
| Boulevard 5 | bank + IUSI (no seguro) |
| Casa Elisa (Auto) | bank + IUSI (no seguro) |
| Casa Elisa (208) | bank + IUSI (**seguro calculated but NOT included in total!**) |
| Casa Elisa (Locales) | bank + IUSI (no seguro) |
| Santa Elena | bank + seguro (**NO IUSI in monthly** — IUSI is quarterly) |

**App:**
```ts
total_monthly = cuota_banco + iusi_monthly + seguro_monthly  // always all 3
```

**Impact:** App always sums bank + IUSI + seguro. Most Excels only sum bank + IUSI. CE-208 has seguro as informational but excluded from the monthly total. Santa Elena excludes IUSI from monthly (it's quarterly). The app has no concept of optional line items or quarterly taxes.

### DIFF-F06: Income Multiplier — 2x/2.5x vs 3x

**Excel:**
| Project | Multiplier | Base |
|---|---|---|
| Benestare | **2x** | Bank cuota only (`=D46*2`) |
| Bosque Las Tapias | **2x** | Bank cuota only (`=C53*2`) |
| Boulevard 5 | **2x** | Bank cuota only (`=C51*2`) |
| Casa Elisa (Auto) | **2x** | Cuota mensual (bank+IUSI) |
| Casa Elisa (208) | **2.5x** | Cuota mensual (bank+IUSI) |
| Casa Elisa (Locales) | **2x** | Cuota mensual (bank+IUSI) |
| Santa Elena | **2x** | Cuota mensual (bank+seguro) |

**App:**
```ts
ingreso_requerido = total_monthly * 3  // INCOME_MULTIPLIER = 3
```

**Impact:** App requires 50% more income than most real cotizaciones (3x vs 2x). CE-208 uses 2.5x. The base also varies: some Excels multiply only the bank cuota, others multiply the total cuota mensual. App multiplies the full total (bank + IUSI + seguro).

### DIFF-F07: Escrituracion — Pre-Tax Extraction (÷1.093)

**Excel (all residential projects):**
```
inmueble = (TOTAL_INVERSION / 1.093) * 0.70
acciones = (TOTAL_INVERSION / 1.093) * 0.30
```
The division by 1.093 extracts the pre-tax base from the total investment. The factor 1.093 comes from the tax structure: `0.70 × 1.12 (IVA) + 0.30 × 1.03 (timbres) = 0.784 + 0.309 = 1.093`.

**App:**
```ts
valor_inmueble_sin_iva = Math.round(price * pct_inmueble)      // = price × 0.70
iva_inmueble = Math.round(valor_inmueble_sin_iva * IVA_RATE)   // = × 0.12
valor_acciones = Math.round(price * pct_acciones)               // = price × 0.30
```
The app applies percentages directly to the raw price, then adds IVA on top. It does NOT extract the pre-tax base first.

**Impact:** On Q500,000:
- Excel: base = 500000/1.093 = Q457,503. Inmueble = Q320,252. Acciones = Q137,251. IVA = Q38,430. Timbres = Q4,118. Total = Q500,051 (≈ Q500,000).
- App: Inmueble sin IVA = Q350,000. IVA = Q42,000. Acciones = Q150,000. Total = Q542,000.
- **App overstates escrituracion total by ~Q42,000 (8.4%).**

### DIFF-F08: Acciones Tax — 3% Timbres Fiscales vs 0%

**Excel (all residential projects):**
```
Acciones carry 3% timbres fiscales tax.
Total tax structure: inmueble 12% IVA, acciones 3% timbres.
Effective blended rate: 0.70×12% + 0.30×3% = 9.3%
```

**App:**
```ts
// No tax on acciones. EscrituracionResult only has iva_inmueble.
// valor_acciones is shown raw with 0% tax.
```

**Impact:** App undercharges acciones by 3%. On Q500,000 with 30% acciones: Excel acciones tax = Q137,251 × 3% = Q4,118. App acciones tax = Q0.

### DIFF-F09: Escrituracion — Locales (100% Inmueble)

**Excel (CE Locales):**
```
Locales are 100% inmueble (no acciones split).
Formula: =C23/1.12  (extracts base from 12% IVA total)
```

**App:**
```ts
// Fixed 70/30 split. No concept of 100% inmueble for commercial units.
pct_inmueble: number = COTIZADOR_DEFAULTS.INMUEBLE_PCT  // always 0.70
```

**Impact:** Commercial units (locales) are entirely wrong — app shows 70/30 split with fictional acciones when there should be 100% inmueble at 12% IVA.

### DIFF-F10: Financing Matrix Structure — Single Rate vs 4×4 Grid

**Excel:**
Most cotizadores use a **single rate** with **5 plazos** (one column of PMT results). Benestare uniquely has a rate dropdown selector showing one rate at a time.

**App:**
Shows a **4-rate × 4-plazo** matrix (16 scenarios).

**Impact:** The 16-scenario matrix is a UX/presentation issue. Real salespeople show clients one rate with 5 term options. The app overwhelms with 16 numbers, most at rates that don't exist in the market.

### DIFF-F11: Saldo a Financiar Rounding

**Excel (most projects):**
```
=ROUNDUP(price - enganche, -2)   → rounds UP to nearest Q100
```

**App:**
```ts
monto_financiar = Math.max(0, price - enganche_total)  // no rounding
```

**Impact:** The financed amount (and therefore all PMT calculations) can differ by up to Q99 due to missing Q100 rounding.

### DIFF-F12: PMT Rate — Hardcoded in Formula vs Parameter

**Excel (CE-Auto, CE-208, CE-Locales):**
```
=+PMT(7.26%/12, ...)    // rate is a literal in the formula
=+PMT(7.5%/12, ...)     // different rate per variant
```

**Excel (BEN):**
```
=+PMT(H45/12, ...)      // H45 is a dropdown cell (5%, 5.5%, 7.26%, 8.5%)
```

**App:**
```ts
BANK_RATES: [0.075, 0.085, 0.095, 0.105]  // hardcoded array, passed to pmt()
```

**Impact:** Different patterns per project: some hardcode rate in the formula, some use a cell reference/dropdown. The app's rates don't match any project.

### DIFF-F13: Santa Elena IUSI — Quarterly vs Monthly

**Excel (Santa Elena):**
```
IUSI = ($D$53 * 0.009) / 4    → QUARTERLY payment, shown separately
```
IUSI is NOT included in the monthly cuota. It's a separate quarterly charge.

**App:**
```ts
iusi_monthly = Math.round((price * 0.009) / 12)   // monthly, included in total
```

**Impact:** Santa Elena IUSI should be quarterly and separate from the cuota mensual. App includes it in the monthly total.

### DIFF-F14: Metraje/Area Calculation — B5

**Excel (BLT):**
```
Metraje total = interior + bodega + parking areas
=C13+E11+E12+(G11*12.5)+(G12*15.5)
```
Includes variable parking area multipliers (12.5 m², 15.5 m²).

**Excel (B5):**
```
Mantenimiento = ROUNDUP(16 * total_area, 0)   → Q16/m² × total area
```

**App:** No area breakdown. No mantenimiento calculation. Shows `area_total` from DB but doesn't compute derived metrics.

---

## 5. Structural & Presentation Diffs

### DIFF-S01: Client Identity Fields (Missing)

**Excel:** All cotizador tabs have fields for:
- Client full name
- Client DPI/ID number (some variants)

**App:** No client identity fields. Cotizador is anonymous.

### DIFF-S02: Salesperson / Signature (Missing)

**Excel:** All cotizador tabs have:
- "Asesor de Ventas" or "Ejecutivo de Ventas" field
- Signature line (at bottom)

**App:** No salesperson identification or signature.

### DIFF-S03: Delivery Date (Missing)

**Excel:** All cotizador tabs include:
- "Fecha de entrega estimada" (estimated delivery date)
- Varies by project/tower (e.g., BLT Torre B = "Julio 2028")

**App:** No delivery date field.

### DIFF-S04: Disclaimers / Legal Notices (Missing)

**Excel (all projects):** Include 5-6 disclaimer clauses, typically:
1. "Precios sujetos a cambio sin previo aviso"
2. "Cotización válida 7 días"
3. "La reserva no es reembolsable"
4. "Metros cuadrados son aproximados"
5. "Imágenes son de referencia"
6. Various financing caveats

**App:** No disclaimers.

### DIFF-S05: Mantenimiento / HOA Fee (Missing)

**Excel:**
| Project | Mantenimiento |
|---|---|
| Benestare | Not shown |
| Bosque Las Tapias | "Pendiente" (text placeholder) |
| Boulevard 5 | `=ROUNDUP(16*total_area, 0)` = Q16/m² |
| Casa Elisa | Not shown |
| Santa Elena | Not shown |

**App:** No mantenimiento calculation or field.

### DIFF-S06: Payment Tracking Columns (Missing)

**Excel (B5):** Has columns:
- "Pagado a la fecha" (paid to date)
- "Por pagar" (remaining)

These turn the cotizador into a mini payment tracker.

**App:** No payment tracking. Cotizador is computation-only.

**Resolution (2026-03-26): CLOSED — Not a valid diff.** Payment tracking does not belong in a cotizador. A cotizador is a stateless quoting/computation tool; embedding live payment state into it conflates two distinct concerns and creates a data duplication anti-pattern. Actual payment tracking already exists in the admin reservation detail (`/admin/reservas/[id]`). The "Pagado a la fecha" / "Por pagar" columns in B5's Excel are an artifact of Excel being used as an all-in-one tool — not a feature to replicate. This diff will be flagged for removal from the SSOT Excel files.

### DIFF-S07: FHA Rate Notes / Bank Program Labels (Missing)

**Excel (BEN):** Shows labeled rate tiers:
- "Mi primera Casa Tipo A: 5%"
- "Mi primera Casa Tipo B y C: 5.50%"
- "Sin carencia de bienes FHA: 7.26%"
- "Crédito directo: 8.50%"

**Excel (SE):** Labels plazos as "Crédito Directo"
**Excel (SE):** Note: "Si es necesario financiamiento bancario el enganche mínimo a pagar es un 30%"

**App:** Shows raw percentages with no bank program labels or context.

### DIFF-S08: Quotation Validity / Date (Missing)

**Excel:** "Cotización válida 7 días" + date field at top.

**App:** No validity period. No quotation date.

---

## 6. Inconsistencies Within the Excel Cotizadores Themselves

These are differences between Excel tabs that the app must handle as per-project/per-variant configuration, not with a single default.

### INCON-01: Rounding Behavior Is Not Uniform

| Project | Enganche Rounding | Cuota Rounding | Saldo Rounding |
|---|---|---|---|
| BEN | ROUNDUP to Q100 | ROUNDUP to Q1 | ROUNDUP to Q100 |
| BLT | ROUNDUP to Q100 | ROUNDUP to Q1 | ROUNDUP to Q100 |
| B5 (automático) | ROUNDUP to Q100 | **ROUNDUP to Q100** | ROUNDUP to Q100 |
| B5 (Terraza) | **No rounding** | ROUNDUP to Q100 | ROUNDUP to Q100 |
| CE (Auto) | **No rounding** | **No rounding** | **No rounding** |
| CE (208) | **No rounding** | **No rounding** | **No rounding** |
| CE (Locales) | **No rounding** | **No rounding** | **No rounding** |
| SE | **No rounding** | **No rounding** | **No rounding** |

### INCON-02: Income Multiplier Is Not Uniform

| Project | Multiplier | Base |
|---|---|---|
| BEN, BLT, B5 | 2x | Bank cuota only |
| CE-Auto, CE-Locales | 2x | Cuota mensual (bank+IUSI) |
| CE-208 | **2.5x** | Cuota mensual (bank+IUSI) |
| SE | 2x | Cuota mensual (bank+seguro) |

### INCON-03: Insurance Presence Is Not Uniform

| Project | Has Insurance? | Base |
|---|---|---|
| BEN, BLT, B5, CE-Auto, CE-Locales | **No** | — |
| CE-208 | **Yes (informational only, NOT in cuota total)** | Total price |
| SE | **Yes (included in cuota total)** | Total price |

### INCON-04: IUSI Treatment Is Not Uniform

| Project | IUSI in Monthly? | IUSI Frequency |
|---|---|---|
| BEN, BLT, B5, CE | Yes | Monthly |
| SE | **No** | **Quarterly (separate line)** |

### INCON-05: Escrituracion Split Is Not Uniform

| Project | Split | Tax |
|---|---|---|
| BEN, BLT, B5, CE-Auto, CE-208, SE | 70/30 | Inmueble 12% IVA + Acciones 3% timbres |
| CE-Locales | **100% inmueble** | 12% IVA only (no acciones) |

---

## 7. Impact Assessment

### 7.1 Severity by Diff

| ID | Description | Severity | Why |
|---|---|---|---|
| DIFF-F01 | Rounding ROUNDUP vs Math.round | **HIGH** | Wrong payment amounts shown to clients |
| DIFF-F02 | Missing last-installment adjustment | **MEDIUM** | Enganche total doesn't balance |
| DIFF-F03 | IUSI base (valor_inmueble vs price) | **HIGH** | IUSI overstated ~56% |
| DIFF-F04 | Insurance base/presence varies | **HIGH** | Shows insurance where none exists |
| DIFF-F05 | Cuota mensual composition varies | **HIGH** | Monthly payment total wrong |
| DIFF-F06 | Income multiplier 2x/2.5x vs 3x | **HIGH** | Income requirement overstated 50% — may disqualify clients |
| DIFF-F07 | Escrituracion ÷1.093 missing | **HIGH** | Escrituracion total overstated ~8.4% |
| DIFF-F08 | Acciones 3% timbres vs 0% | **MEDIUM** | Closing costs understated |
| DIFF-F09 | Locales 100% inmueble | **HIGH** | Entirely wrong for commercial units |
| DIFF-F10 | Single rate vs 4×4 grid | **LOW** | UX issue, not a math error per se |
| DIFF-F11 | Saldo rounding missing | **MEDIUM** | PMT calculated on unrounded principal |
| DIFF-F12 | Rate source differs per project | **MEDIUM** | Need per-project rate config |
| DIFF-F13 | SE IUSI quarterly vs monthly | **MEDIUM** | Wrong for Santa Elena specifically |
| DIFF-F14 | Metraje/mantenimiento calc | **MEDIUM** | Missing for B5, BLT |
| DIFF-S01 | Client name missing | **HIGH** | Can't use cotización as client document |
| DIFF-S02 | Salesperson missing | **HIGH** | Can't attribute cotización |
| DIFF-S03 | Delivery date missing | **MEDIUM** | Key selling point missing |
| DIFF-S04 | Disclaimers missing | **HIGH** | Legal protection missing |
| DIFF-S05 | Mantenimiento missing | **MEDIUM** | Varies by project |
| DIFF-S06 | Payment tracking missing | ~~LOW~~ **CLOSED** | Not a valid cotizador concern — data duplication anti-pattern; will be removed from SSOT Excel |
| DIFF-S07 | FHA rate labels missing | **MEDIUM** | Context for rate choices |
| DIFF-S08 | Validity/date missing | **MEDIUM** | Professional document standard |

### 7.2 Affected Users

- **Salespeople:** Every cotización they generate from the app is numerically wrong vs what they would give from Excel.
- **Clients:** Receive incorrect payment amounts, inflated income requirements, wrong closing costs.
- **Patty:** Cannot trust app cotizaciones; must still use Excel to verify/correct.
- **Management:** Cannot retire Excel if the app cotizador doesn't match reality.

### 7.3 Root Cause

The app cotizador was built with a single set of generic defaults (`COTIZADOR_DEFAULTS`) instead of per-project configuration sourced from the DB. The formulas were implemented from general financial principles rather than reverse-engineered from the actual Excel cotizadores. No validation against real cotizador outputs was performed.

---

*Generated from direct extraction of all 13 cotizador tabs using openpyxl, compared against `src/lib/reservas/cotizador.ts` (rev 1cd9632).*

---

## 8. Resolution Status (Updated 2026-03-26)

### Diffs closed by zero-diff cotizador overhaul (changelog 081, migrations 047-048)
All 14 formula diffs, 7 of 8 structural diffs, and all 5 inconsistencies were closed via the `cotizador_configs` table and computation engine rewrite. **34 of 37 diffs closed.**

### Diffs closed by Santa Elena onboarding (migration 049)
- **DIFF-F13** (SE IUSI quarterly) — **CLOSED.** Migration 049 seeds a `cotizador_configs` row for Santa Elena with `iusi_frequency: 'quarterly'`, `include_iusi_in_cuota: false`, `currency: 'USD'`.
- **SE-specific currency/parameter diffs** — **CLOSED.** SE config row includes: `currency: 'USD'`, `enganche_pct: 0.3000`, `reserva_default: 10000.00`, `installment_months: 15`, `bank_rates: {0.0850}`, `plazos_years: {25,20,15,10,5}`, `seguro_enabled: true`, `include_seguro_in_cuota: true`, `income_multiplier: 2.00`, `income_base: 'cuota_mensual'`.

### Current status: **37 of 37 diffs closed.**
- ~~**DIFF-S06** (Payment tracking) — DEFERRED.~~ → **CLOSED (2026-03-26).** Payment tracking does not belong in a cotizador — a cotizador is a stateless computation tool. Duplicating payment state across systems is a data integrity anti-pattern. Existing payment tracking lives in admin reservation detail. This column will be removed from the SSOT Excel files.
