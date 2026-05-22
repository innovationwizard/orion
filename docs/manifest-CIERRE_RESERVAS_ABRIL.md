# Manifest: CIERRE_RESERVAS_ABRIL.xlsx

**File:** `Comisiones4Abril/CIERRE_RESERVAS_ABRIL.xlsx`
**SSOT Status:** Approved (do not modify)
**Generated:** 2026-05-19
**Sheets:** 2 total

---

## Sheet Index

1. [Abril](#1-abril) — 23 non-empty rows (21 full records + 1 partial anomaly + 1 flagged record), 17 cols
2. [Seguimiento](#2-seguimiento) — 20 non-empty rows (19 tracking entries), 6 cols

---

## 1. Abril

**Purpose:** Primary ETL source. April 2026 new reservation closures across 3 projects. Every row is a reservation event that triggers Phase 1 commission calculation (30% of ejecutivo commission).

**Dimensions:** 36 rows × 17 columns (max_row includes blank rows and a rate scale table at the bottom)

### Row Structure

| Row(s) | Content |
|--------|---------|
| 1 | Column headers |
| 2–13 | Benestare (BNT) active reservations — 12 records |
| 14–16 | Bosque Las Tapias (BLT) active reservations — 3 records |
| 17–22 | Boulevard 5 (BLV5) active reservations — 6 records |
| 23 | Empty |
| **24** | **ANOMALY: partial data row — no Proyecto/Cliente/Asesor/Unidad. Only cols 9/14/15 populated. See flags below.** |
| 25 | BLT reservation — Pablo Marroquin — flagged "No se firmo promesa" |
| 26–34 | Empty |
| 35–36 | Commission rate scale reference table (not data) |

### Column Headers (Row 1)

| Col | Header | DB Target | Notes |
|-----|--------|-----------|-------|
| 1 | Proyecto | `projects.name` → `project_id` | Lookup |
| 2 | Descripción | — | Human-readable label; unit + tower + model + project code. Not stored directly. |
| 3 | Cliente | `clients.full_name` → `client_id` | Insert if new |
| 4 | Asesor | `salespeople.name` → `sales_rep_id` | Lookup |
| 5 | Apartamento | `units.unit_number` component → `unit_id` | Combined with Torre for lookup |
| 6 | Modelo | — | Reference only; derivable from unit |
| 7 | Torre | `towers.name` component → `unit_id` | Combined with Apartamento |
| 8 | Fecha de reserva | `sales.sale_date`, `sales.promise_signed_date` | Both set to same date (Phase 1 trigger) |
| 9 | Precio de venta | `sales.price_with_tax` | GTQ, includes IVA |
| 10 | Precio sin impuestos | `sales.price_without_tax` | Tax-adjusted price. Formula: `price_with_tax × 107/112` NOT confirmed — see flags. |
| 11 | Comisión Total | Computed: `price_without_tax × ejecutivo_rate` | Verified ✓. Not stored directly; DB recomputes. |
| 12 | Comisión 30% | Computed: `Comisión Total × 0.30` | Verified ✓. Phase 1 disbursement amount. |
| 13 | Porcentaje comisión | `sales.ejecutivo_rate` | Decimal (0.01 or 0.0125). Escalates at 5th sale. |
| 14 | Trato - Enganche acordado | `sales.down_payment_amount` | GTQ |
| 15 | Trato - Monto de Reserva | `payments.amount` (type=`reservation`) | GTQ; reservation payment, deductible from enganche |
| 16 | Referidor | `sales.referral_name`, `sales.referral_applies` | Empty for all April records |
| 17 | Comentario | Flag only — not stored | Used to identify anomalies |

### Commission Math Verification

**Rule (rows 35–36):**
- Sales 1–4 per asesor per month: `ejecutivo_rate = 0.01` (1%)
- Sales 5+ per asesor per month: `ejecutivo_rate = 0.0125` (1.25%)

**Formulas verified across all data rows:**

```
Comisión Total = Precio sin impuestos × Porcentaje comisión  ✓ (all rows)
Comisión 30%   = Comisión Total × 0.30                       ✓ (all rows)
```

**Escalation application — Ivan Castillo (BNT, 5 sales in April):**

| Row | Unit | Date | Sale # (Ivan) | Rate Applied |
|-----|------|------|---------------|--------------|
| 13 | Apto 511 TC MA | 2026-04-04 | 1st | 0.01 ✓ |
| 11 | Apto 202 TA MC | 2026-04-12 | 2nd | 0.01 ✓ |
| 10 | Apto 505 TD MC | 2026-04-14 | 3rd | 0.01 ✓ |
| 8  | Apto 401 TD MC | 2026-04-25 | 4th | 0.01 ✓ |
| 7  | Apto 313 TB MB | 2026-04-25 | 5th | 0.0125 ✓ |

All other asesores have ≤ 4 April sales → 0.01 throughout. Verified ✓.

---

### All Data Rows — Benestare (BNT)

Project DB slug: `benestare` | project_id: to be resolved from DB

| Row | Unit | Torre | Modelo | Cliente | Asesor | Fecha Reserva | Precio Venta | Precio Sin Imp | Com Total | Com 30% | Exec Rate | Enganche | Reserva | Referidor | Comentario |
|-----|------|-------|--------|---------|--------|--------------|-------------|----------------|-----------|---------|-----------|----------|---------|-----------|------------|
| 2 | 210 | Torre C | C | Karol del Rosario Mayen Gutierrez | Rony Ramirez | 2026-04-30 | 533,000 | 487,648.67 | 4,876.49 | 1,462.95 | 0.01 | 37,400 | 1,500 | — | — |
| 3 | 103 | Torre A | C | Carlos Francisco Mejia Payes | Rony Ramirez | 2026-04-30 | 533,000 | 487,648.67 | 4,876.49 | 1,462.95 | 0.01 | 26,700 | 1,500 | — | — |
| 4 | 309 | Torre C | C | Enma Aracely Tista Jimenez | Daniel Veliz | 2026-04-30 | 533,000 | 487,648.67 | 4,876.49 | 1,462.95 | 0.01 | 37,400 | 1,500 | — | — |
| 5 | 105 | Torre D | C | Belia Ester Velasquez Castillo | Daniel Veliz | 2026-04-28 | 537,300 | 491,582.80 | 4,915.83 | 1,474.75 | 0.01 | 37,700 | 1,500 | — | — |
| 6 | 202 | Torre B | B | Diego Francisco Culajay Sic | Daniel Veliz | 2026-04-28 | 533,700 | 488,289.11 | 4,882.89 | 1,464.87 | 0.01 | 26,700 | 1,500 | — | — |
| 7 | 313 | Torre B | B | Sussan Iveth Molina Zuncar | Ivan Castillo | 2026-04-25 | 533,700 | 488,289.11 | 6,103.61 | 1,831.08 | **0.0125** | 26,700 | 1,500 | — | — |
| 8 | 401 | Torre D | C | [Lead Meta] Diego Reynoso | Ivan Castillo | 2026-04-25 | 537,300 | 491,582.80 | 4,915.83 | 1,474.75 | 0.01 | 37,700 | 1,500 | — | — |
| 9 | 302 | Torre D | C | Jose Manuel Elias Recinos | Daniel Veliz | 2026-04-19 | 537,300 | 491,582.80 | 4,915.83 | 1,474.75 | 0.01 | 37,700 | 1,500 | — | — |
| 10 | 505 | Torre D | C | Andri Sarai Cinto Lopez | Ivan Castillo | 2026-04-14 | 537,300 | 491,582.80 | 4,915.83 | 1,474.75 | 0.01 | 37,700 | 1,500 | — | — |
| 11 | 202 | Torre A | C | Jorge Mario López Gonzalez | Ivan Castillo | 2026-04-12 | 533,000 | 487,648.67 | 4,876.49 | 1,462.95 | 0.01 | 26,700 | 1,500 | — | — |
| 12 | 305 | Torre C | C | Manuel Bolom Yaxcal | Rony Ramirez | 2026-04-12 | 533,400 | 488,014.64 | 4,880.15 | 1,464.04 | 0.01 | 37,700 | 1,500 | — | — |
| 13 | 511 | Torre C | A | Marcos Javier Gatica Paz | Ivan Castillo | 2026-04-04 | 386,900 | 353,979.87 | 3,539.80 | 1,061.94 | 0.01 | 27,112 | 1,500 | — | — |

**BNT subtotals (Abril sheet):**
- Records: 12
- Asesores: Rony Ramirez (3), Daniel Veliz (4), Ivan Castillo (5)
- Reserva amount per unit: GTQ 1,500 (uniform)
- Price range: GTQ 386,900 – 537,300

---

### All Data Rows — Bosque Las Tapias (BLT)

Project DB slug: `bosque-las-tapias` | project_id: to be resolved from DB

| Row | Unit | Torre | Modelo | Cliente | Asesor | Fecha Reserva | Precio Venta | Precio Sin Imp | Com Total | Com 30% | Exec Rate | Enganche | Reserva | Referidor | Comentario |
|-----|------|-------|--------|---------|--------|--------------|-------------|----------------|-----------|---------|-----------|----------|---------|-----------|------------|
| 14 | 1103 | Torre C | C | Luis Alfredo Ortiz Ajualip | Paula Hernandez | 2026-04-30 | 744,000 | 680,695.33 | 6,806.95 | 2,042.09 | 0.01 | 52,100 | 3,000 | — | — |
| 15 | 1208 | Torre B | C | Abner Josué Pérez Monterroso y Joy Nicole Golla Oliveras | Paula Hernandez | 2026-04-30 | 668,000 | 611,161.94 | 6,111.62 | 1,833.49 | 0.01 | 46,800 | 3,000 | — | — |
| 16 | 508 | Torre B | C | Andrea Sarahi Alvarez Solorzano y Christian André Orozco García | Paula Hernandez | 2026-04-19 | 668,000 | 611,161.94 | 6,111.62 | 1,833.49 | 0.01 | 46,760 | 3,000 | — | — |
| **25** | **1007** | **Torre B** | **C** | **[Lead Meta BLT] Joel Enrique Mayen Anavisca** | **Pablo Marroquin** | **2026-04-26** | **678,000** | **620,311.07** | **6,203.11** | **1,860.93** | **0.01** | **47,500** | **3,000** | — | **"No se firmo promesa"** |

**BLT subtotals (Abril sheet, rows 14–16 confirmed + row 25 flagged):**
- Confirmed records: 3
- Flagged record: 1 (row 25 — no signed promise)
- Asesores: Paula Hernandez (3), Pablo Marroquin (1, flagged)
- Reserva amount per unit: GTQ 3,000 (uniform)
- Price range: GTQ 668,000 – 744,000

---

### All Data Rows — Boulevard 5 (BLV5)

Project DB slug: `boulevard-5` | project_id: to be resolved from DB

| Row | Unit | Torre | Modelo | Cliente | Asesor | Fecha Reserva | Precio Venta | Precio Sin Imp | Com Total | Com 30% | Exec Rate | Enganche | Reserva | Referidor | Comentario |
|-----|------|-------|--------|---------|--------|--------------|-------------|----------------|-----------|---------|-----------|----------|---------|-----------|------------|
| 17 | 1016 | Única | A2 | Diego Alejandro Barreno González | Jose Gutierrez | 2026-04-21 | 970,000 | 887,465.69 | 8,874.66 | 2,662.40 | 0.01 | 97,000 | 10,000 | — | — |
| 18 | 1212 | Única | A8 | Erick Orlando Barrios Navas | Erwin Cardona | 2026-04-20 | 895,000 | 818,847.21 | 8,188.47 | 2,456.54 | 0.01 | 300,000 | 10,000 | — | — |
| 19 | 614 | Única | E5 | Ruben Ivan España Marroquín | Jose Gutierrez | 2026-04-19 | 1,615,100 | 1,477,676.12 | 14,776.76 | 4,433.03 | 0.01 | 161,510 | 10,000 | — | — |
| 20 | 1001 | Única | C4 | Carlos Roberto Sandoval Najera / Carlos Ramón Chajón Aceituno | Erwin Cardona | 2026-04-17 | 1,355,600 | 1,240,256.18 | 12,402.56 | 3,720.77 | 0.01 | 67,800 | 10,000 | — | — |
| 21 | 1116 | Única | B3 | Ingrid Lissette Robles Villatoro | Erwin Cardona | 2026-04-17 | 1,055,000 | 965,233.30 | 9,652.33 | 2,895.70 | 0.01 | 52,800 | 5,000 | — | — |
| 22 | 919 | Única | C3 | Edwin Ernesto Ovalle Barrios | Erwin Cardona | 2026-04-10 | 1,177,700 | 1,077,493.14 | 10,774.93 | 3,232.48 | 0.01 | 58,900 | 10,000 | — | — |

**BLV5 subtotals (rows 17–22):**
- Records: 6
- Asesores: Jose Gutierrez (2), Erwin Cardona (4)
- Reserva amount: GTQ 10,000 (uniform except row 21: GTQ 5,000)
- Price range: GTQ 895,000 – 1,615,100

---

### Commission Rate Scale Reference (Rows 35–36)

Embedded in Abril sheet, not a data row. Documents escalation policy applied to Porcentaje comisión column:

| Row | Label | Rate |
|-----|-------|------|
| 35 | 1 a 4 (sales 1–4 per asesor per month) | 0.01 (1%) |
| 36 | 5 adelante (5th sale onward per asesor per month) | 0.0125 (1.25%) |

---

### Anomalies — Abril Sheet

#### FLAG-A1: Row 24 — Partial Data Row

**ETL Decision (2026-05-19):** EXCLUDED from April ETL. Persisted here for investigation.

**Raw cell values (openpyxl, `data_only=True`):**

| Col | Header | Value | data_type |
|-----|--------|-------|-----------|
| 1 | Proyecto | `None` | n |
| 2 | Descripción | `None` | n |
| 3 | Cliente | `None` | n |
| 4 | Asesor | `None` | n |
| 5 | Apartamento | `None` | n |
| 6 | Modelo | `None` | n |
| 7 | Torre | `None` | n |
| 8 | Fecha de reserva | `None` | n |
| **9** | **Precio de venta** | **2,528,200** | **n** |
| 10 | Precio sin impuestos | `None` | n |
| 11 | Comisión Total | `None` | n |
| 12 | Comisión 30% | `None` | n |
| 13 | Porcentaje comisión | `None` | n |
| **14** | **Trato - Enganche acordado** | **155,912** | **n** |
| **15** | **Trato - Monto de Reserva** | **7,500** | **n** |
| 16 | Referidor | `None` | n |
| 17 | Comentario | `None` | n |

**Structural observations:**
- All cells have `data_type='n'` (numeric) — values are literals, not formula results. No broken formula references.
- Commission columns (10–13) are completely empty — whoever entered this row did not compute commissions. All other data rows have these filled.
- No merged cell ranges exist in the sheet (confirmed via `ws.merged_cells.ranges` — empty).
- Row 23 immediately before is empty. Row 25 immediately after is a valid BLT record (Pablo Marroquin). Row 22 is the last BLV5 record (Erwin Cardona, 2026-04-10).

**Financial ratios vs. rest of dataset:**

| Metric | Row 24 | BNT range | BLT range | BLV5 range |
|--------|--------|-----------|-----------|------------|
| Precio de venta | 2,528,200 | 386,900–537,300 | 668,000–744,000 | 895,000–1,615,100 |
| Enganche / precio | 6.17% | 5.00–7.07% | 7.00–7.01% | 5.00–33.52% |
| Reserva | 7,500 | 1,500 (all) | 3,000 (all) | 5,000–10,000 |

- Price of **GTQ 2,528,200 is ~57% above the highest observed BLV5 unit** (Apto 614 E5 at GTQ 1,615,100). No known unit in the active project catalog reaches this price point.
- Enganche ratio (6.17%) is within normal range — not a flag in isolation.
- Reserva of GTQ 7,500 is unique in this dataset. No other unit has exactly 7,500.

**Hypotheses (unverified — requires Pati clarification):**

| # | Hypothesis | Evidence For | Evidence Against |
|---|-----------|-------------|-----------------|
| H1 | Incomplete data entry — asesor entered price/enganche/reserva and did not finish the row | Commission cols empty; all other cols empty | Price is anomalously high |
| H2 | Different/unlisted project unit (e.g. Casa Elisa penthouse or future phase) | Casa Elisa absent from this SSOT entirely | Casa Elisa sold out per prior data; price still high |
| H3 | BLV5 penthouse or premium unit not in standard catalog | Positioned after last BLV5 entry; BLV5 has largest price range | Row 23 is empty (gap from BLV5 block) |
| H4 | Sum/aggregate row accidentally placed in data range | — | No other aggregate rows exist in sheet; ratios don't match BLV5 subtotals (BLV5 sum = 7,068,400) |
| H5 | Sobreprecio or commercial deal with custom price | 7,500 reserva is non-standard | No project/client context to evaluate |

**Next step:** Ask Pati what this row represents. Provide her with: price = Q2,528,200, enganche = Q155,912, reserva = Q7,500, position in file after Boulevard5 section.

#### FLAG-A2: Row 25 — "No se firmo promesa"

**ETL Decision (2026-05-19):** INCLUDED — Path A. Import with `promise_signed_date = NULL`.

```
Proyecto:    Bosque Las Tapias
Descripción: APTO 1007 TB MC-BLT
Cliente:     [Lead Meta BLT] Joel Enrique Mayen Anavisca
Asesor:      Pablo Marroquin
Fecha:       2026-04-26
Precio:      678,000
Enganche:    47,500
Reserva:     3,000
Comentario:  No se firmo promesa
```

**Business rule confirmed directly by Pati (2026-05-19):**
> "This reservation does not count as a closed April sale for commission purposes. Commission is triggered when promise is signed."

**Consequences of this decision:**
- `sales` row inserted with `status = 'active'`, `promise_signed_date = NULL`
- Unit 1007 Torre B BLT shows as occupied in the cotizador — no double-sell risk
- Reservation payment (GTQ 3,000) recorded with `payment_type = 'reservation'`
- Phase 1 commission does **not** fire — `promise_signed_date = NULL`, trigger condition not met
- This record does **not** count toward April commission close
- Pablo Marroquin's Phase 1 commission is deferred to the month the promise is actually signed
- **Action required (future):** When Pati confirms promise was signed, run: `UPDATE sales SET promise_signed_date = '[actual_date]' WHERE id = '[row25_sale_id]';` — trigger fires and generates Phase 1 commission at that point

#### FLAG-A3: José Gutiérrez — Offboarded 2026-04-21

**ETL Decision (2026-05-19):** `end_date` is **inclusive**. José earns commission on both April sales.

Migration 059 set `salesperson_periods.end_date = '2026-04-21'` for José Gutiérrez (`sales_rep_id = '3d7ff0ed-94bf-4d9a-9259-ea03114e62a2'`).

His two April sales — both pay to José, not `ahorro_por_retiro`:
- Row 19: Apto 614 / Ruben Ivan España Marroquín / **2026-04-19** — before end_date ✓
- Row 17: Apto 1016 / Diego Alejandro Barreno González / **2026-04-21** — on end_date, inclusive ✓

The commission trigger will route correctly because `sale_date (2026-04-21) <= period.end_date (2026-04-21)`. No special handling required in the migration SQL.

#### FLAG-A4: "[Lead Meta]" Client Name Prefix

**ETL Decision (2026-05-19):** Strip prefix from name. Backfill lead source in same migration.

Two clients carry a lead source prefix in their name field:
- Row 8: `[Lead Meta] Diego Reynoso` (BNT 401, Torre D)
- Row 25: `[Lead Meta BLT] Joel Enrique Mayen Anavisca` (BLT 1007, Torre B)

**Clean names (prefix stripped):**
- `Diego Reynoso`
- `Joel Enrique Mayen Anavisca`

**Lead source mapping:**
Both prefixes resolve to `'Meta'` — confirmed by the `lead_sources` table (migration 046, `name = 'Meta'`, `display_order = 2`). The `[BLT]` qualifier in row 25's prefix is a project-scoping note by the asesor, not a distinct lead source.

**Schema finding — `sales` table has no `lead_source` column:**
- `lead_sources` table exists (migration 046) as a normalized reference table — the correct FK target
- `reservations.lead_source text` is pre-migration-046 technical debt; it was never migrated to a FK
- Migration 057 (March) did not write lead source anywhere

**Required schema change in migration 061:**
```sql
ALTER TABLE sales ADD COLUMN IF NOT EXISTS lead_source_id uuid REFERENCES lead_sources(id);
```
Uses the normalized reference table (migration 046) via FK — not free text. Does **not** replicate `reservations.lead_source text`, which is existing technical debt.

**ETL actions for the two affected rows:**
- Insert clients with clean names: `'Diego Reynoso'` and `'Joel Enrique Mayen Anavisca'`
- In Phase B `sales` INSERT: `lead_source_id = (SELECT id FROM lead_sources WHERE name = 'Meta')`

**Backfill scope:** March migration 057 had no `[Lead Meta]` entries — no prior sales need backfill.

---

## 2. Seguimiento

**Purpose:** Tracking reference sheet. Documents the disposition of pre-existing March 2026 reservations that were pending delivery of physical documentation to Patty as of April close.

**CRITICAL FINDING: All entries in this sheet were already imported in migration 057 (March 2026 Sales Import).** This sheet is a monitoring artifact, not new data. **Do NOT re-import any entries from this sheet.**

**Dimensions:** 20 rows × 6 columns

### Column Headers (Row 1)

| Col | Header |
|-----|--------|
| 1 | Proyecto |
| 2 | Descripción |
| 3 | Cliente |
| 4 | Asesor |
| 5 | Referidor |
| 6 | Comentario |

### Disposition Categories

| Comentario Value | Count | Meaning |
|-----------------|-------|---------|
| `no la tiene patty pero si esta subida` | 5 | Reservation is in the system but physical paperwork not yet with Patty |
| `Entregada a Patty` | 12 | Physical documents delivered to Patty; sale confirmed |
| `Desiste` | 2 | Client withdrawing — already imported as `status='cancelled'` in migration 057 |

### All Entries

| Row | Proyecto | Descripción | Cliente | Asesor | Comentario | DB Status |
|-----|---------|-------------|---------|--------|------------|-----------|
| 2 | Benestare | Apto 307 TD-MB-BNT | Maria Guadalupe Estacuy Mendoza | Rony Ramirez | no la tiene patty pero si esta subida | Imported (migration 057) |
| 3 | Benestare | Apto 607 TA-MC-BNT | Ever Benedicto Tipol Yoj | Rony Ramirez | no la tiene patty pero si esta subida | Imported (migration 057) |
| 4 | Benestare | APTO 406 TA MB -BNT | Ana Paola Garcia Reyes 406 | Daniel Veliz | Entregada a Patty | Imported (migration 057) |
| 5 | Benestare | APTO 402 TA MB -BNT | Ana Paola Garcia Reyes 402 | Daniel Veliz | Entregada a Patty | Imported (migration 057) |
| 6 | Benestare | Apto 305 TA MA - BNT | Ana Natalia Bardales García | Ivan Castillo | Entregada a Patty | Imported (migration 057) |
| 7 | Boulevard 5 | Apto 1512 T1 MA10 BLV5 | William Danilo Davila Coro | Jose Gutierrez | Desiste | Imported as `cancelled` (migration 057 Phase C) |
| 8 | Boulevard 5 | Apto 307 T1 MB6 BLV5 | Selvin Antonio Rodrigues Parada | Jose Gutierrez | Entregada a Patty | Imported (migration 057) |
| 9 | Boulevard 5 | Apto 108 T1 MB1.1 BLV5 | Mirna Violeta Rodriguez Gonzalez/Amiagro, S.A. | Jose Gutierrez | Entregada a Patty (Firma electronica) | Imported (migration 057) |
| 10 | Benestare | Apto 402 TD-MB-BNT | Nnenna Danie Sandoval Chavez | Rony Ramirez | no la tiene patty pero si esta subida | Imported (migration 057) |
| 11 | Boulevard 5 | Apto 201 T1 MB7 BLV5 | Ludwin Jose Leonel Calderon Ortiz | Jose Gutierrez | Entregada a Patty | Imported (migration 057) |
| 12 | Bosque Las Tapias | Aparto 1207 Torre C Modelo C BLT | Marlon Samuel Pixtun Martínez y Mariela Yamileth Hernández Chávez | Anahi Cisneros | Desiste | Imported as `cancelled` (migration 057 Phase C) |
| 13 | Benestare | Apto 104 TD MB -BNT | Welnio Ivan Cueller Portillo | Rony Ramirez | no la tiene patty pero si esta subida | Imported (migration 057) |
| 14 | Benestare | Apto 302 TB MB -BNT | Flory Cristina Escalante Ramos | Rony Ramirez | no la tiene patty pero si esta subida | Imported (migration 057) |
| 15 | Benestare | Apto 106 TC MA -BNT | Yuri Blanca Margarita Reyes De Almira | Rony Ramirez | Entregada a Patty | Imported (migration 057) |
| 16 | Benestare | Apto 405 TD MC - BNT | Josselin Rodriguez | Ivan Castillo | Entregada a Patty | Imported (migration 057) |
| 17 | Benestare | APTO 204 TA MB -BNT | Rosa Elena Rojas Cano | Daniel Veliz | Entregada a Patty | Imported (migration 057) |
| 18 | Benestare | Apto 605 TD MC - BNT | Elkin Daniery Oscal | Ivan Castillo | Entregada a Patty | Imported (migration 057) |
| 19 | Benestare | APTO 404 TD MB -BNT | Pedro Orlando Jose Carias Leiva | Daniel Veliz | Entregada a Patty | Imported (migration 057) |
| 20 | Boulevard 5 | Apto 211 T1 ME1 BLV5 | Nery Aroldo Castañeda Cerna/Sara Beatriz Castro Tebalán de Castañeda | Jose Gutierrez | Entregada a Patty | Imported (migration 057) |

---

## ETL Scope Summary

### In Scope: Abril Sheet, Rows 2–22 + Row 25 (22 records total)

| Project | Count | Asesores | Notes |
|---------|-------|---------|-------|
| Benestare (BNT) | 12 | Rony Ramirez (3), Daniel Veliz (4), Ivan Castillo (5) | |
| Bosque Las Tapias (BLT) | 4 | Paula Hernandez (3), Pablo Marroquin (1) | Row 25: `promise_signed_date = NULL` |
| Boulevard 5 (BLV5) | 6 | Jose Gutierrez (2), Erwin Cardona (4) | |
| **Total** | **22** | | |

### Flags Resolution Status

| Item | Row | Flag | Status |
|------|-----|------|--------|
| Partial data row | 24 | FLAG-A1 | EXCLUDED — persisted for investigation, ask Pati |
| "No se firmo promesa" | 25 | FLAG-A2 | RESOLVED — Path A: import with `promise_signed_date = NULL` |
| José Gutiérrez end_date boundary | 17 | FLAG-A3 | RESOLVED — end_date inclusive; both sales pay to José |
| "[Lead Meta]" client name handling | 8, 25 | FLAG-A4 | RESOLVED — strip name; add `sales.lead_source_id` FK; set to `'Meta'` |

### Out of Scope

| Item | Reason |
|------|--------|
| Seguimiento sheet (all 19 entries) | Already imported in migration 057 |
| Rows 35–36 (rate scale table) | Reference data only, not a reservation record |

---

## ETL Pre-Requisites (from March pattern)

Based on migration 057 (CIERRE_MARZO import), the April ETL will follow this sequence:

1. **Pre-check:** Confirm no existing active sale on any April unit (detect re-sells; cancel prior if applicable)
2. **Phase A:** Insert new clients not already in DB
3. **Phase B:** Insert active sales (`status='active'`, `promise_signed_date=sale_date` for rows 2–22; `promise_signed_date=NULL` for row 25)
4. **Phase C:** Insert cancelled/desistimiento sales (if any) — none identified from Abril sheet; Seguimiento desistimientos already imported
5. **Phase D:** Insert reservation payments (`payment_type='reservation'`, `notes='CIERRE_ABRIL import'`)
6. **Phase E:** Re-enable trigger, run `calculate_commissions()` in date order

### Computed Fields for Phase B INSERT

```
financed_amount = price_with_tax - down_payment_amount
```

All confirmed rows — financed amounts:

| Row | price_with_tax | down_payment | financed_amount |
|-----|---------------|-------------|-----------------|
| 2 (BNT 210) | 533,000 | 37,400 | 495,600 |
| 3 (BNT 103) | 533,000 | 26,700 | 506,300 |
| 4 (BNT 309) | 533,000 | 37,400 | 495,600 |
| 5 (BNT 105) | 537,300 | 37,700 | 499,600 |
| 6 (BNT 202 TB) | 533,700 | 26,700 | 507,000 |
| 7 (BNT 313) | 533,700 | 26,700 | 507,000 |
| 8 (BNT 401) | 537,300 | 37,700 | 499,600 |
| 9 (BNT 302) | 537,300 | 37,700 | 499,600 |
| 10 (BNT 505) | 537,300 | 37,700 | 499,600 |
| 11 (BNT 202 TA) | 533,000 | 26,700 | 506,300 |
| 12 (BNT 305) | 533,400 | 37,700 | 495,700 |
| 13 (BNT 511) | 386,900 | 27,112 | 359,788 |
| 14 (BLT 1103) | 744,000 | 52,100 | 691,900 |
| 15 (BLT 1208) | 668,000 | 46,800 | 621,200 |
| 16 (BLT 508) | 668,000 | 46,760 | 621,240 |
| 17 (BLV5 1016) | 970,000 | 97,000 | 873,000 |
| 18 (BLV5 1212) | 895,000 | 300,000 | 595,000 |
| 19 (BLV5 614) | 1,615,100 | 161,510 | 1,453,590 |
| 20 (BLV5 1001) | 1,355,600 | 67,800 | 1,287,800 |
| 21 (BLV5 1116) | 1,055,000 | 52,800 | 1,002,200 |
| 22 (BLV5 919) | 1,177,700 | 58,900 | 1,118,800 |
| 25 (BLT 1007) ⚠️ no promise | 678,000 | 47,500 | 630,500 |

---

## Open Questions (Blocking or Clarifying)

> All questions resolved as of 2026-05-19. Migration 061 is unblocked.

**Q1 — FLAG-A1 [DEFERRED — under investigation]:** Row 24 has `Precio de venta = GTQ 2,528,200`, `Enganche = 155,912`, `Reserva = 7,500` with no project, client, unit, asesor, or commission columns.
- Full forensic data persisted in FLAG-A1 section above.
- **Excluded from April ETL.** Will not be imported until source is identified.
- Action: Show Pati the three values (price, enganche, reserva) and ask what this entry represents.

**Q2 — FLAG-A2 [RESOLVED]:** Row 25 (`Apto 1007 TB MC-BLT` / Pablo Marroquin / 2026-04-26) — import with `promise_signed_date = NULL`.
- Unit will show as occupied in cotizador; Phase 1 commission deferred until promise is signed.

**Q3 — FLAG-A3 [RESOLVED]:** `end_date = 2026-04-21` is **inclusive**. Both Row 17 (2026-04-21) and Row 19 (2026-04-19) pay commission to José Gutiérrez. No redirect to `ahorro_por_retiro`.

**Q4 — FLAG-A4 [RESOLVED]:** Names stripped to `'Diego Reynoso'` and `'Joel Enrique Mayen Anavisca'`. Lead source stored via `sales.lead_source_id uuid REFERENCES lead_sources(id)` — FK to normalized `lead_sources` table, not free text. Value: `(SELECT id FROM lead_sources WHERE name = 'Meta')`.

**Q5 — RESOLVED (2026-05-19):** Pablo Marroquin exists in `salespeople` table. UUID: `58770544-eb03-4887-b622-278806707cb1`. Confirmed active in migration 055's active-12 list. Confirmed by sales manager: active for BLT **and** Benestare as of April 2026.

**Q6 — NOT BLOCKING (2026-05-19):** The `107/112` formula in `commission-rules.json` applies to commission ISR disbursement math, not unit pricing. The actual observed ratio is `price_with_tax / price_without_tax ≈ 1.09296` (consistent across all rows, cross-confirmed against migration 057). The exact Guatemalan fiscal formula is unknown — CFO clarification deferred to future sprint. **For this migration: not blocking** — `price_without_tax` is read directly from the SSOT column, not derived. Values are authoritative. The formula question only matters when the app accepts sale entry natively (without an SSOT import).
