# Orphaned Sales Investigation: "Unknown" Salesperson

**Date:** 2026-03-17
**Discovery:** During DIFF-10 verification (commission audit)
**Last updated:** 2026-03-18
**Status:** RESOLVED — Migration 039 deployed 2026-03-18

---

## Summary

30 active sales are linked to a single "Unknown" salesperson (`cd0006ee-5013-4881-be2f-c843f76fd607`). These sales have:
- `ejecutivo_rate = NULL` (no rate set)
- Zero payments
- Zero commission rows
- No financial impact on commission calculations

The salesperson record exists in the `salespeople` table with `display_name = 'Unknown'` and `is_active = true`.

---

## Root Cause

These sales were created during the ETL migration (`scripts/seed_prod.py` → `scripts/seed_prod.sql`). The `asesor` field from the source "Reporte de Ventas" Excel files was empty or unrecognized. The ETL's `normalize_salesperson()` returned `None`, and the TypeScript layer defaulted to `'unknown'` to satisfy the FK constraint.

**Why these specific units?** All 24 BLT orphaned units are from **Torre C** (the new tower added mid-2025). The ETL source data likely predated Torre C sales being entered, or used an older snapshot where those sales had no salesperson recorded. Torre B rows in the master DB are empty inventory listings — sale data lives exclusively in the Torre C sheets.

---

## Affected Sales (30)

### Benestare (5 sales)

| Unit | Sale Date | Price (w/tax) | Down Payment | Promise Signed |
|------|-----------|---------------|--------------|----------------|
| 506-B-B | 2025-09-11 | Q492,700 | Q24,700 | 2025-09-11 |
| 508-C-C | 2025-10-21 | Q492,000 | Q24,600 | 2025-10-21 |
| 503-C-C | 2025-10-26 | Q497,000 | Q24,900 | 2025-10-26 |
| 607-C | 2025-10-26 | Q492,700 | Q24,700 | — |
| 303-C-C | 2025-10-26 | Q497,000 | Q24,900 | 2025-10-26 |

### Bosque Las Tapias (24 sales)

| Unit | Sale Date | Price (w/tax) | Down Payment | Promise Signed |
|------|-----------|---------------|--------------|----------------|
| 505 | 2025-06-15 | Q622,000 | Q44,000 | 2025-06-15 |
| 101 | 2025-06-15 | Q665,200 | Q46,600 | 2025-06-15 |
| 809 | 2025-06-15 | Q813,000 | Q56,910 | 2025-06-15 |
| 105 | 2025-06-27 | Q655,200 | Q46,000 | 2025-06-27 |
| 604 | 2025-07-26 | Q636,400 | Q44,548 | 2025-07-26 |
| 906 | 2025-07-27 | Q813,000 | Q56,910 | 2025-07-27 |
| 106 | 2025-07-28 | Q847,700 | Q59,339 | 2025-07-28 |
| 401 | 2025-08-01 | Q622,000 | Q43,540 | 2025-08-01 |
| 605 | 2025-08-03 | Q636,400 | Q44,548 | 2025-08-03 |
| 903 | 2025-08-03 | Q945,900 | Q66,213 | 2025-08-03 |
| 902 | 2025-08-11 | Q945,900 | Q66,213 | 2025-08-11 |
| 1001 | 2025-08-18 | Q744,000 | Q52,100 | 2025-08-18 |
| 908 | 2025-08-19 | Q945,900 | Q66,213 | 2025-08-19 |
| 802 | 2025-08-28 | Q744,000 | Q52,100 | 2025-08-28 |
| 803 | 2025-09-27 | Q744,000 | Q53,000 | 2025-09-27 |
| 807 | 2025-10-12 | Q744,000 | Q52,100 | 2025-10-12 |
| 503 | 2025-10-12 | Q744,000 | Q52,100 | 2025-10-12 |
| 602 | 2025-10-12 | Q744,000 | Q52,100 | 2025-10-12 |
| 1004 | 2025-10-15 | Q655,200 | Q45,900 | 2025-10-15 |
| 1003 | 2025-10-16 | Q744,000 | Q52,100 | 2025-10-16 |
| 1002 | 2025-10-16 | Q744,000 | Q52,100 | 2025-10-16 |
| 502 | 2025-10-16 | Q744,000 | Q52,100 | 2025-10-16 |
| 703 | 2025-10-18 | Q744,000 | Q52,100 | 2025-10-18 |
| 708 | 2025-10-27 | Q744,000 | Q52,100 | 2025-10-27 |

### Boulevard 5 (1 sale)

| Unit | Sale Date | Price (w/tax) | Down Payment | Promise Signed |
|------|-----------|---------------|--------------|----------------|
| 1607 | 2024-10-03 | Q1,164,200 | Q102,510 | — |

---

## Impact Assessment

| Metric | Value |
|--------|-------|
| Total payments | 0 |
| Total commission rows | 0 |
| Financial impact | Q0.00 |
| Promise signed | 28 of 30 (2 without: BNT 607-C, B5 1607) |

These sales exist in the DB but have no payment history and generate no commissions. They are inert from a financial perspective.

---

## Cross-Reference Results

### Sources Used

**Round 1 — Monthly reports (medium authority):**
- `origin/SSOT/Reservas y Ventas/Bosque Las Tapias/2. Reporte de Ventas Bosque Las Tapias septiembre 2025.xlsx`
- `origin/SSOT/Reservas y Ventas/Benestare/2. Reporte de Ventas BENESTARE septiembre 2025.xlsx`
- `origin/SSOT/Reservas y Ventas/Boulevard 5/2. Reporte de Ventas BOULEVARD 5 septiembre 2025.xlsx`
- `origin/SSOT/CIERRE DE MES PROYECTOS PA/CIERRE VENTAS {AGOSTO,SEPTIEMBRE,OCTUBRE} 2025.xlsx`

**Round 2 — Master databases as of Feb 2026 (highest authority):**
- `loans_ssot/Base de datos Apartamentos - Bosques Las Tapias a feb.'26.xlsx`
- `loans_ssot/Base de datos Apartamentos - Benestare a feb.'26.xlsx`
- `loans_ssot/Reporte de cumplimiento B5(Recuperado automáticamente).xlsx`

The loans_ssot master databases are the definitive February 2026 snapshots. Where conflicts exist between Round 1 and Round 2, Round 2 takes precedence.

---

### Bosque Las Tapias — 24 units

**Structural insight:** BLT master DB has 4 sheets: "BASE DE DATOS TORRE B" (empty inventory rows — no clients), "BASE DE DATOS TORRE C Nueva" (active sales), "BASE DE DATOS TORRE C" (older version), and "INFO PARA REPORTES" (employment/income data from an older era). All 24 orphaned units are Torre C sales. The ETL likely sourced from a snapshot that predated Torre C sales being entered.

#### 20 Active Sales — Corrected Attribution

| Unit | DB Sale Date | Vendedor (Master DB) | Client (Master DB) | Client 2 | DB UUID |
|------|-------------|---------------------|-------------------|----------|---------|
| 809 | 2025-06-15 | Jose Gutierrez | Lenin Alejandro Hidalgo Godinez | Masielle Daayeth Monroy Hernandez | `3d7ff0ed` |
| 106 | 2025-07-28 | Jose Gutierrez | Karen Mariles Navas Castro de Muralles | — | `3d7ff0ed` |
| 604 | 2025-07-26 | Paula Hernandez | Lilian Jeanette Paz Garcia de Zapete | — | `1718037b` |
| 906 | 2025-07-27 | Jose Gutierrez | William Alexander Fuentes Alvarado | Maria Regina Ramos Samayoa | `3d7ff0ed` |
| 401 | 2025-08-01 | Paula Hernandez | Carlos Eduardo Celada | — | `1718037b` |
| 605 | 2025-08-03 | Paula Hernandez | Josue Roberto Fajardo Chiguil | Emily Jazmin Vasquez Morales | `1718037b` |
| 903 | 2025-08-03 | Jose Gutierrez | Andreina Maribel Cornel Moraga | Juan Fernando Ramos Samayoa | `3d7ff0ed` |
| 902 | 2025-08-11 | Paula Hernandez | Febe Abigail Arana Franco | Luis Antonio Gomez Lucero | `1718037b` |
| 1001 | 2025-08-18 | Jose Gutierrez | Dilan Guillermo Hernandez Lopez | — | `3d7ff0ed` |
| 908 | 2025-08-19 | Paula Hernandez | Agustin Armando Calvillo Calderon | Jennifer Ivette Gonzalez Medrano | `1718037b` |
| 803 | 2025-09-27 | Jose Gutierrez | Levi Benjamin Gutierrez Satey | Rebeca Jazmin Gonzalez Molina | `3d7ff0ed` |
| 807 | 2025-10-12 | Jose Gutierrez | Luciana Concepcion Cruz Alvarado | Randall Jeancarlo Padilla Cruz | `3d7ff0ed` |
| 503 | 2025-10-12 | Jose Gutierrez | Albert Francescoli de Jesus Ortiz Pineda | Ana Gabriela Morales Chajon | `3d7ff0ed` |
| 602 | 2025-10-12 | Jose Gutierrez | Julio Ernesto Garcia Archila | Blanca Estela Gonzalez Cedillo | `3d7ff0ed` |
| 1004 | 2025-10-15 | **Jose Gutierrez** | Ludis Gonzalez Lopez | — | `3d7ff0ed` |
| 1002 | 2025-10-16 | Jose Gutierrez | Andrea Elizabeth Rodas Cabrera | Roberto Isaac Morales Reyes | `3d7ff0ed` |
| 502 | 2025-10-16 | Paula Hernandez | Byron Omar Yapur Ponce | — | `1718037b` |
| 703 | 2025-10-18 | Jose Gutierrez | Pedro Alberto Garcia Guzman | — | `3d7ff0ed` |
| 708 | 2025-10-27 | Jose Gutierrez | Lesbia Fernanda Flores Garcia | — | `3d7ff0ed` |
| 101 | 2025-06-15 | **Paula Hernandez** | Favio Javier Estrada Quinonez | Candida Eva Daniela Ramirez Lopez | `1718037b` |

**Correction from Round 1:** Unit 1004 was attributed to Rony Ramirez by the "Reporte de Ventas" monthly sheet. The master DB (Feb '26) lists **Jose Gutierrez** for the same client (Ludis Gonzalez Lopez). Master DB takes precedence.

**Note on unit 101:** The DB sale date is 2025-06-15 (original Jose Gutierrez sale, since desisted). The master DB's current entry shows Paula Hernandez with reservation date 2025-07-29. The DB record is stale — see Desistimiento section below.

**Summary (active sales):** José (Jose Gutierrez) = 14 units, Paula (Hernandez) = 6 units.

#### 4 Stale Sales — Currently Available (DESISTED)

The master DB (Torre C Nueva) shows these units with **no client and no vendedor** — they are currently available:

| Unit | DB Sale Date | Original Vendedor | Original Client (old Torre C sheet) | Master DB Feb '26 Status |
|------|-------------|-------------------|-------------------------------------|-------------------------|
| 105 | 2025-06-27 | Jose Gutierrez | Brandon Oswaldo Ponce Perez / Katerine Andrea Lucia Martinez Mejia | **AVAILABLE** (no client) |
| 505 | 2025-06-15 | Jose Gutierrez | Lestere Ariel Canahui Gomez / Brenda Carolina Aguilar Gomez | **AVAILABLE** (no client) |
| 802 | 2025-08-28 | Jose Gutierrez | _(old client from Torre C sheet not found)_ | **AVAILABLE** (no client) |
| 1003 | 2025-10-16 | Jose Gutierrez | _(marked "pend.exp.")_ | **AVAILABLE** (no client) |

These 4 DB records represent **desisted sales that were never replaced**. The DB should mark them as `status = 'cancelled'`.

---

### Benestare — 5 units

**Structural insight:** BEN master DB has 4 sheets per tower (A, B, C, summary). The unit suffix encodes tower and type: "506-B-B" = unit 506, Tower B, Type B. "508-C-C" = unit 508, Tower C, Type C. The same unit number (e.g., 303) appears across towers A, B, and C with **different clients** — the tower suffix is critical for disambiguation.

| Unit | DB Sale Date | Vendedor (Master DB) | Client (Master DB) | Financial Status | DB UUID |
|------|-------------|---------------------|-------------------|-----------------|---------|
| 506-B-B | 2025-09-11 | **Eder Veliz** | Hugo Alexander Mendez Caal | Full data (Q492,700, 16 cuotas, CHN pre-qual) | `d5895fe3` |
| 508-C-C | 2025-10-21 | **Rony Ramirez** | Carlos Daniel Morales Palma | Sold, some docs missing (Q502,000, 23 cuotas) | `8b14b330` |
| 503-C-C | 2025-10-26 | **Pablo Marroquin** | Abner Manolo Barrios Herrera | Full data (Q497,000, 23 cuotas, dual deposits BI/CHN) | `58770544` |
| 607-C | 2025-10-26 | **Ivan Castillo** | Paola Adelina Figueroa Gomez de Escobar / Alan Yoel Escobar Figueroa | **Zero financial data** — early stage, no pricing/deposits | `eca06792` |
| 303-C-C | 2025-10-26 | **Rony Ramirez** | Diego Gabriel Molina Romero | **Zero financial data** — early stage, no pricing/deposits | `8b14b330` |

**Correction from Round 1:** Unit 303-C-C was attributed to Eder Veliz based on the Dec Cierre. That Cierre entry was for **Tower B's unit 303** (client: Del Carmen Jaqueline Samantha Canel Cumatz). Tower C's unit 303 in the master DB = **Rony Ramirez** (Diego Molina). Master DB takes precedence.

**Data quality flags:**
- 607-C and 303-C-C have client names assigned but **completely empty financial data** (zero pricing, zero deposits, no PCV date). These appear to be very early/informal reservations that may not represent real sales.
- 503-C-C has a discrepancy: the master DB price (Q497,000) has a different vendedor client than the previous "Reporte de Ventas" finding (which showed "Amy Andrea Vasquez Hernandez" — that client is in Torre **B**'s 503, not Torre C's).

---

### Boulevard 5 — 1 unit

| Unit | DB Sale Date | Vendedor (Master DB) | Client (Master DB) | Notes |
|------|-------------|---------------------|-------------------|-------|
| 1607 | 2024-10-03 | **(empty — no vendedor)** | Federico Franco / Inmobiliaria Quince, S.A. | Corporate/related-party purchase |

**Key details from B5 compliance report:**
- **Flagged with 'x'** (needs attention)
- Model C9, Level 16, 56.36 m2, 2 bedrooms, tandem parking (25 m2), bodega #49 (5.30 m2)
- PCV signed 2024-10-30, 1 cuota only (paid immediately), down payment completed 2024-11-01
- Total price Q1,164,200, financing Q1,047,700 (90% LTV)
- No DPI, no RTU, no pre-qualification bank, no reservation payment info — **significant compliance gaps**
- Observation: "documentos de ambos declaracion licita" (both parties need lawful origin declaration)
- "Trato en Pipedrive": SI

**Correction from Round 1:** The "Reporte de Ventas" listed "Junta Directiva" as the salesperson. The B5 compliance report has **no vendedor assigned**. "Junta Directiva" may have referred to the sales channel/origin, not the salesperson. The DB's existing "Junta" record (`5fef7873`) remains the most appropriate match.

---

## Desistimiento Analysis (Deep)

### Confirmed Desisted — 4 BLT units currently AVAILABLE

The master DB (Feb '26) confirms these units have **no client in Torre C Nueva** — the original sales were desisted and no re-sale has occurred:

| Unit | DB Sale Date | Original Vendedor | Original Client | DB Status | Master DB Status |
|------|-------------|-------------------|-----------------|-----------|-----------------|
| 105 | 2025-06-27 | Jose Gutierrez | Brandon Ponce / Katerine Martinez | `active` | **AVAILABLE** |
| 505 | 2025-06-15 | Jose Gutierrez | Lestere Canahui / Brenda Aguilar | `active` | **AVAILABLE** |
| 802 | 2025-08-28 | Jose Gutierrez | _(unknown)_ | `active` | **AVAILABLE** |
| 1003 | 2025-10-16 | Jose Gutierrez | _(unknown, "pend.exp.")_ | `active` | **AVAILABLE** |

**Action:** These 4 sales should be marked `status = 'cancelled'` in the DB. They represent sales that no longer exist. No salesperson re-attribution needed — just cancellation.

### Desisted and Re-sold — 1 BLT unit

| Unit | DB Sale Date | DB Vendedor | Current Vendedor (Feb '26) | Current Client | Current Reservation Date |
|------|-------------|------------|---------------------------|----------------|------------------------|
| 101 | 2025-06-15 | Unknown (→ José) | **Paula Hernandez** | Favio Javier Estrada Quinonez / Candida Ramirez Lopez | 2025-07-29 |

**Action:** The DB record (sale_date 2025-06-15) represents the original desisted sale. It should be `cancelled`. The current sale by Paula Hernandez (2025-07-29) may already exist as a separate DB record, or needs to be created.

---

## Final Corrected Attribution (30 units)

### Category A: Active sales — fix sales_rep_id (20 units)

| Unit | Project | Vendedor | DB display_name | DB UUID |
|------|---------|---------|-----------------|---------|
| 809 | BLT | Jose Gutierrez | José | `3d7ff0ed-94bf-4d9a-9259-ea03114e62a2` |
| 106 | BLT | Jose Gutierrez | José | `3d7ff0ed-94bf-4d9a-9259-ea03114e62a2` |
| 906 | BLT | Jose Gutierrez | José | `3d7ff0ed-94bf-4d9a-9259-ea03114e62a2` |
| 903 | BLT | Jose Gutierrez | José | `3d7ff0ed-94bf-4d9a-9259-ea03114e62a2` |
| 1001 | BLT | Jose Gutierrez | José | `3d7ff0ed-94bf-4d9a-9259-ea03114e62a2` |
| 803 | BLT | Jose Gutierrez | José | `3d7ff0ed-94bf-4d9a-9259-ea03114e62a2` |
| 807 | BLT | Jose Gutierrez | José | `3d7ff0ed-94bf-4d9a-9259-ea03114e62a2` |
| 503 | BLT | Jose Gutierrez | José | `3d7ff0ed-94bf-4d9a-9259-ea03114e62a2` |
| 602 | BLT | Jose Gutierrez | José | `3d7ff0ed-94bf-4d9a-9259-ea03114e62a2` |
| 1004 | BLT | Jose Gutierrez | José | `3d7ff0ed-94bf-4d9a-9259-ea03114e62a2` |
| 1002 | BLT | Jose Gutierrez | José | `3d7ff0ed-94bf-4d9a-9259-ea03114e62a2` |
| 703 | BLT | Jose Gutierrez | José | `3d7ff0ed-94bf-4d9a-9259-ea03114e62a2` |
| 708 | BLT | Jose Gutierrez | José | `3d7ff0ed-94bf-4d9a-9259-ea03114e62a2` |
| 604 | BLT | Paula Hernandez | Paula | `1718037b-0d7b-4346-8ef2-c7658e25092b` |
| 401 | BLT | Paula Hernandez | Paula | `1718037b-0d7b-4346-8ef2-c7658e25092b` |
| 605 | BLT | Paula Hernandez | Paula | `1718037b-0d7b-4346-8ef2-c7658e25092b` |
| 902 | BLT | Paula Hernandez | Paula | `1718037b-0d7b-4346-8ef2-c7658e25092b` |
| 908 | BLT | Paula Hernandez | Paula | `1718037b-0d7b-4346-8ef2-c7658e25092b` |
| 502 | BLT | Paula Hernandez | Paula | `1718037b-0d7b-4346-8ef2-c7658e25092b` |
| 506-B-B | BEN | Eder Veliz | Eder | `d5895fe3-62c8-4815-af0b-086feafead42` |

**BLT split:** José = 13, Paula = 6, total = 19 BLT + 1 BEN = 20 units.

### Category B: Active sales — fix sales_rep_id (4 BEN units, lower confidence)

| Unit | Project | Vendedor | DB display_name | DB UUID | Confidence |
|------|---------|---------|-----------------|---------|------------|
| 508-C-C | BEN | Rony Ramirez | Rony | `8b14b330-7e04-4409-98eb-e3d1d7d0a363` | HIGH — confirmed by master DB + Oct Cierre |
| 503-C-C | BEN | Pablo Marroquin | Pablo | `58770544-eb03-4887-b622-278806707cb1` | HIGH — confirmed by master DB (Abner Barrios, dual deposits) |
| 607-C | BEN | Ivan Castillo | Ivan | `eca06792-5219-4549-9922-274324e9f53b` | MEDIUM — master DB shows zero financial data, early stage |
| 303-C-C | BEN | Rony Ramirez | Rony | `8b14b330-7e04-4409-98eb-e3d1d7d0a363` | MEDIUM — master DB shows zero financial data, early stage |

### Category C: Desisted sales — cancel in DB (5 BLT units)

| Unit | Project | Action | Notes |
|------|---------|--------|-------|
| 105 | BLT | Cancel (`status = 'cancelled'`) | Available in master DB, no re-sale |
| 505 | BLT | Cancel (`status = 'cancelled'`) | Available in master DB, no re-sale |
| 802 | BLT | Cancel (`status = 'cancelled'`) | Available in master DB, no re-sale |
| 1003 | BLT | Cancel (`status = 'cancelled'`) | Available in master DB, marked "pend.exp." |
| 101 | BLT | Cancel (`status = 'cancelled'`) | Re-sold by Paula (2025-07-29), new record needed |

### Category D: Corporate allocation — assign to Junta (1 B5 unit)

| Unit | Project | Action | Notes |
|------|---------|--------|-------|
| 1607 | B5 | Assign to Junta (`5fef7873`) | No vendedor in compliance report; "Junta Directiva" in Ventas report. Corporate purchase (Inmobiliaria Quince, S.A.), compliance flags pending. |

---

## Resolution Steps

### Step 1: Execute Category A fixes (20 units, no Pati input needed)
```sql
-- BLT: José (13 units)
UPDATE sales SET sales_rep_id = '3d7ff0ed-94bf-4d9a-9259-ea03114e62a2'
WHERE sales_rep_id = 'cd0006ee-5013-4881-be2f-c843f76fd607'
  AND id IN (SELECT s.id FROM sales s JOIN units u ON s.unit_id = u.id
             JOIN projects p ON s.project_id = p.id
             WHERE p.name = 'Bosque Las Tapias'
             AND u.unit_number IN ('809','106','906','903','1001','803','807','503','602','1004','1002','703','708')
             AND s.sales_rep_id = 'cd0006ee-5013-4881-be2f-c843f76fd607');

-- BLT: Paula (6 units)
UPDATE sales SET sales_rep_id = '1718037b-0d7b-4346-8ef2-c7658e25092b'
WHERE sales_rep_id = 'cd0006ee-5013-4881-be2f-c843f76fd607'
  AND id IN (SELECT s.id FROM sales s JOIN units u ON s.unit_id = u.id
             JOIN projects p ON s.project_id = p.id
             WHERE p.name = 'Bosque Las Tapias'
             AND u.unit_number IN ('604','401','605','902','908','502')
             AND s.sales_rep_id = 'cd0006ee-5013-4881-be2f-c843f76fd607');

-- BEN: Eder (1 unit)
UPDATE sales SET sales_rep_id = 'd5895fe3-62c8-4815-af0b-086feafead42'
WHERE sales_rep_id = 'cd0006ee-5013-4881-be2f-c843f76fd607'
  AND id IN (SELECT s.id FROM sales s JOIN units u ON s.unit_id = u.id
             WHERE u.unit_number = '506-B-B'
             AND s.sales_rep_id = 'cd0006ee-5013-4881-be2f-c843f76fd607');
```

### Step 2: Execute Category B fixes (4 BEN units)
```sql
-- BEN: Rony (2 units)
UPDATE sales SET sales_rep_id = '8b14b330-7e04-4409-98eb-e3d1d7d0a363'
WHERE sales_rep_id = 'cd0006ee-5013-4881-be2f-c843f76fd607'
  AND id IN (SELECT s.id FROM sales s JOIN units u ON s.unit_id = u.id
             WHERE u.unit_number IN ('508-C-C','303-C-C')
             AND s.sales_rep_id = 'cd0006ee-5013-4881-be2f-c843f76fd607');

-- BEN: Pablo (1 unit)
UPDATE sales SET sales_rep_id = '58770544-eb03-4887-b622-278806707cb1'
WHERE sales_rep_id = 'cd0006ee-5013-4881-be2f-c843f76fd607'
  AND id IN (SELECT s.id FROM sales s JOIN units u ON s.unit_id = u.id
             WHERE u.unit_number = '503-C-C'
             AND s.sales_rep_id = 'cd0006ee-5013-4881-be2f-c843f76fd607');

-- BEN: Ivan (1 unit)
UPDATE sales SET sales_rep_id = 'eca06792-5219-4549-9922-274324e9f53b'
WHERE sales_rep_id = 'cd0006ee-5013-4881-be2f-c843f76fd607'
  AND id IN (SELECT s.id FROM sales s JOIN units u ON s.unit_id = u.id
             WHERE u.unit_number = '607-C'
             AND s.sales_rep_id = 'cd0006ee-5013-4881-be2f-c843f76fd607');
```

### Step 3: Execute Category C (cancel 5 desisted sales)
```sql
UPDATE sales SET status = 'cancelled'
WHERE sales_rep_id = 'cd0006ee-5013-4881-be2f-c843f76fd607'
  AND id IN (SELECT s.id FROM sales s JOIN units u ON s.unit_id = u.id
             JOIN projects p ON s.project_id = p.id
             WHERE p.name = 'Bosque Las Tapias'
             AND u.unit_number IN ('105','505','802','1003','101')
             AND s.sales_rep_id = 'cd0006ee-5013-4881-be2f-c843f76fd607');
```

### Step 4: Execute Category D (B5 1607 → Junta)
```sql
UPDATE sales SET sales_rep_id = '5fef7873-9b44-420f-aa6f-2e8212978962'
WHERE sales_rep_id = 'cd0006ee-5013-4881-be2f-c843f76fd607'
  AND id IN (SELECT s.id FROM sales s JOIN units u ON s.unit_id = u.id
             WHERE u.unit_number = '1607'
             AND s.sales_rep_id = 'cd0006ee-5013-4881-be2f-c843f76fd607');
```

### Step 5: Set ejecutivo_rate
After re-attribution, set `ejecutivo_rate` based on `salesperson_periods` escalation (1.00% or 1.25%) for the 25 re-attributed active sales.

### Step 6: Deactivate "Unknown" salesperson
Once zero sales remain linked to `cd0006ee`, set `is_active = false`.

### Step 7: Handle unit 101 re-sale
The current sale of BLT unit 101 (Paula Hernandez → Favio Estrada, 2025-07-29) may need a new sale record in the DB if one doesn't already exist.

---

---

## Resolution — Migration 039 (2026-03-18)

**Migration:** `scripts/migrations/039_fix_orphaned_sales.sql`

### Actions Taken

| Action | Count | Details |
|--------|-------|---------|
| Re-attributed to José (Jose Gutierrez) | 13 | BLT units: 809, 106, 906, 903, 1001, 803, 807, 503, 602, 1004, 1002, 703, 708 |
| Re-attributed to Paula (Hernandez) | 6 | BLT units: 604, 401, 605, 902, 908, 502 |
| Re-attributed to Eder (Veliz) | 1 | BEN unit: 506-B-B |
| Re-attributed to Rony (Ramirez) | 2 | BEN units: 508-C-C, 303-C-C |
| Re-attributed to Pablo (Marroquin) | 1 | BEN unit: 503-C-C |
| Re-attributed to Ivan (Castillo) | 1 | BEN unit: 607-C |
| Re-attributed to Junta (Directiva) | 1 | B5 unit: 1607 |
| Cancelled (desisted) | 5 | BLT units: 101, 105, 505, 802, 1003 |
| **Total** | **30** | 25 re-attributed + 5 cancelled |

### Post-Deployment Verification

- Unknown salesperson: **0 active sales** remaining (19 cancelled = 14 pre-existing + 5 new)
- Unknown salesperson: **deactivated** (`is_active = false`)
- All 25 re-attributed sales verified via post-flight queries
- `ejecutivo_rate` left NULL — CFO will confirm during upcoming session
- Zero financial impact: no payments, no commission rows affected
