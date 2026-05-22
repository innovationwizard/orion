# Manifest: CIERRE_COBROS_ABRIL.xlsx

**File:** `Comisiones4Abril/CIERRE_COBROS_ABRIL.xlsx`
**SSOT Status:** Approved — do not modify
**Generated:** 2026-05-20
**Sheets:** 26 total
**Distinction from CIERRE_RESERVAS_ABRIL.xlsx:** The RESERVAS file tracks new April 2026 sales closures (21 records, already imported via migration 061). This COBROS file tracks all payment collections for all active units across the entire payment history — Phase 1 reservation deposits and Phase 2 down-payment installments. It is the collections master workbook.

---

## 1. Sheet Index

| # | Sheet | Type | April Col | ETL Action |
|---|-------|------|-----------|------------|
| 1 | `RESUMEN GENERAL` | Summary | — | Skip — aggregate view, not source data |
| 2 | `SANTA ELISA` | Legacy/Inactive | — | Skip — historical sheet, not an active project in this import scope |
| 3 | `SANTA ELISA PPTO` | Legacy/Inactive | — | Skip |
| 4 | `BOULEVARD 5` | Canonical | AV (col 48) | **Import** — April 2026 = 2026-04-30 |
| 5 | `B5 PPTO` | Budget | — | Skip |
| 6 | `RESUMEN B5` | Summary | — | Skip |
| 7 | `B5 Alerta` | Alert | — | Skip |
| 8 | `BENES` | Legacy | — | Skip — superseded by BENESTARE 2.0 |
| 9 | `BOULEVARD 5 orig.` | Legacy | — | Skip — superseded by BOULEVARD 5 |
| 10 | `BENESTARE ` | Legacy | — | Skip — superseded by BENESTARE 2.0 |
| 11 | `BENESTARE PPTO` | Budget | — | Skip |
| 12 | `BL-TAPIAS` | Legacy | — | Skip — superseded by BL-TAPIAS 2.0 |
| 13 | `BL PPTO` | Budget | — | Skip |
| 14 | `Atrasados B5` | Alert | — | Skip |
| 15 | `BENESTARE 2.0` | Canonical | AV (col 48) | **Import** — April 2026 = 2026-04-30 |
| 16 | `BNT PPTO 2.0` | Budget | — | Skip |
| 17 | `RESUMEN BNT 2.0` | Summary | — | Skip |
| 18 | `ALERTA BNT 2.0` | Alert | — | Skip |
| 19 | `Atrasados Benestare` | Alert | — | Skip |
| 20 | `BL-TAPIAS 2.0` | Canonical | X (col 24) | **Import** — April 2026 = 2026-04-30 |
| 21 | `BL PPTO 2.0` | Budget | — | Skip |
| 22 | `RESUMEN BLT` | Summary | — | Skip |
| 23 | `ALERTA INDECAS 2.0` | Alert | — | Skip |
| 24 | `Atrasados BLT` | Alert | — | Skip |
| 25 | `Hoja1` | Empty | — | Skip |
| 26 | `PEND. BTARE` | Pending | — | Skip |

---

## 2. Canonical Sheet Structure

Three canonical sheets are active for April 2026 import: BOULEVARD 5, BENESTARE 2.0, BL-TAPIAS 2.0.

### Dimensions

| Sheet | Header Row | Data Start | Max Row | Max Col | Date Range | April 2026 Col |
|-------|-----------|-----------|---------|---------|------------|----------------|
| BOULEVARD 5 | 6 | 7 | 388 | 89 (CK) | 2023-03-31 → 2026-04-30 | col 48 (AV) |
| BENESTARE 2.0 | 6 | 7 | 361 | 83 (CE) | 2023-03-31 → 2026-04-30 | col 48 (AV) |
| BL-TAPIAS 2.0 | 6 | 7 | 276 | 54 (BB) | 2025-03-31 → 2026-04-30 | col 24 (X) |

### Fixed Column Mapping (identical across BOULEVARD 5, BENESTARE 2.0, BL-TAPIAS 2.0)

| Col | Header | DB Target | Notes |
|-----|--------|-----------|-------|
| B (2) | Apto | `units.unit_number` component → `unit_id` | Combined with Torre for BNT/BLT |
| C (3) | Tipo / Modelo | — | Reference only |
| D (4) | Torre (BNT/BLT) / Notas (B5) | `towers.name` component | B5 has no tower column |
| E (5) | Vendedor | `salespeople.full_name` → `sales_rep_id` | Names abbreviated vs DB (see FLAG-C11) |
| F (6) | Cliente | `clients.full_name` | Full legal names; may differ from CIERRE_RESERVAS |
| G (7) | Fecha Reserva | `sales.sale_date` | Reference for phase classification |
| H (8) | Estatus | Unit lifecycle status | See status values below |
| I (9) | Precio de Venta | `sales.price_with_tax` | 0 for new April entries not yet filled |
| J (10) | Enganche | `sales.down_payment_amount` | 0 for new April entries not yet filled |
| K–date_last | Monthly dates (month-end) | `payments.payment_date` | Each non-zero cell = payment to import |
| TOTAL COBROS Y RESERVAS | — | Cross-check only | Sum of all monthly cells |
| SALDO PENDIENTE ENGANCHE | — | Reference | Remaining Phase 2 balance |
| Monto a Financiar por Banco | — | Reference | Phase 3 amount; NOT in this file |
| Monto de Reserva Pactado | `payments.amount` (type=reservation) | Phase 1 reference amount |
| Monto de Cuota Pactada | Reference | Agreed monthly installment |
| Cuotas Pagadas | Reference | Installments paid to date |
| Status inmueble | Reference | Vendido / Disponible / etc. |
| Status Cliente | Reference | Al día / Atrasado / Superávit de Enganche / Enganche Completado |

**Lifecycle status values:**

| Estatus | Meaning |
|---------|---------|
| `1.Disponible` | No sale — skip entirely |
| `2.Reserva` / `2.Reservado` | Active — reservation deposit paid, enganche ongoing |
| `4.Plan de pagos` / `4.Plan de Pagos` | Active — enganche fully scheduled |
| `Desistimiento` | Cancelled — skip |

---

## 3. April 2026 Collections Summary

| Project | DB Slug | Units with April Payment | April Total (GTQ) |
|---------|---------|--------------------------|-------------------|
| BOULEVARD 5 | `boulevard-5` | 106 | Q 10,793,188.91 |
| BENESTARE 2.0 | `benestare` | 103 | Q 161,781.46 |
| BL-TAPIAS 2.0 | `bosque-las-tapias` | 36 | Q 77,099.19 |
| **GRAND TOTAL** | | **245** | **Q 11,032,069.56** |

---

## 4. Phase Classification

> **Methodology:** Each April payment row is classified as Phase 1, Phase 2, or Ambiguous based on:
> - **Phase 1**: `fecha_reserva` is in April 2026 AND `april_pmt` matches `Monto de Reserva Pactado` (±Q1.00)
> - **Ambiguous**: `fecha_reserva` is in April 2026 BUT `Monto de Reserva Pactado` is NULL or amount differs
> - **Phase 2**: `fecha_reserva` is before April 2026 (prior reservation, ongoing installment)

| Phase | Count | Total (GTQ) | Notes |
|-------|-------|-------------|-------|
| Phase 1 — Reservation deposits (new April sales) | 1 | Q 1,500.00 | Exact match to MRes |
| Phase 2 — Down payment installments (ongoing) | 226 | Q 10,909,587.56 | Prior reservations |
| Ambiguous — April reservation date, MRes=NULL | 18 | Q 120,982.00 | Needs cross-ref with CIERRE_RESERVAS_ABRIL |

**Note on Ambiguous rows:** Most are April 2026 new sales whose `Monto de Reserva Pactado` has not yet been filled in the COBROS workbook (these rows were recently added). Cross-referencing with `CIERRE_RESERVAS_ABRIL.xlsx` (already imported via migration 061) confirms most are Phase 1 reservation deposits. Discrepancies are flagged individually in Section 6.

---

## 5.1 Boulevard 5 — April 2026 Data Rows

**106 units with April 2026 payment | Total: Q10,793,188.91**

| # | Apto | Torre | Cliente | Vendedor | Estatus | FechaRes | AprPmt (GTQ) | MRes | CPact | CPag | StInm | StCli | Phase |
|---|------|-------|---------|----------|---------|----------|-------------|------|-------|------|-------|-------|-------|
| 1 | 102 |  | Irma Leticia Villatoro Bucaro | Erwin Cardona | 4.Plan de pagos | 2025-12-21 | Q73,606.00 | Q10,000 | 36,900.00 | 0 | Vendido | Cliente Atrasado | **P2** |
| 2 | 107 |  | Eder Omar Vásquez Chávez | Erwin Cardona | 4.Plan de pagos | 2026-03-10 | Q5,000.00 | Q10,000 | 8,900.00 | 1 | Vendido | Cliente Atrasado | **P2** |
| 3 | 109 |  | Laura Elisa Ovalle González | Antonio Rada | 4.Plan de pagos | 2024-06-28 | Q1,100,004.00 | Q10,000 | 7,704.00 | 18 | Vendido | Superávit de Enganche | **P2** |
| 4 | 113 |  | Rodrigo Rodas Pazos | Antonio Rada | 4.Plan de pagos | 2024-11-20 | Q6.24 | Q10,000 | 470,006.04 | 1 | Vendido | Superávit de Enganche | **P2** |
| 5 | 202 |  | Bella Rosana Chaveque González | Antonio Rada | 4.Plan de pagos | 2025-03-20 | Q8,000.00 | Q10,000 | 8,731.00 | 9 | Vendido | Cliente al día | **P2** |
| 6 | 203 |  | Edlen Isaí Reyes Matus | Erwin Cardona | 4.Plan de pagos | 2026-03-19 | Q11,000.00 | Q10,000 | 11,000.00 | 0 | Vendido | Cliente al día | **P2** |
| 7 | 205 |  | Javier Adolfo Hernández León | Sofia Paredes | 4.Plan de pagos | 2025-02-18 | Q7,903.00 | Q10,000 | 7,903.00 | 14 | Vendido | Cliente al día | **P2** |
| 8 | 207 |  | Fernando Rafael Soto Barrios | Erwin Cardona | 4.Plan de pagos | 2026-02-10 | Q12,135.00 | Q10,000 | 12,135.43 | 0 | Vendido | Cliente al día | **P2** |
| 9 | 210 |  | Carlos Alejandro de León Samayoa | Laura Molina | 4.Plan de pagos | 2025-07-21 | Q8,731.66 | Q15,000 | 8,731.66 | 9 | Vendido | Cliente al día | **P2** |
| 10 | 213 |  | Carlos Humberto Rivera Carrillo  | Sofia Paredes | 4.Plan de pagos | 2025-02-07 | Q5,000.00 | Q10,000 | 4,420.00 | 9 | Vendido | Cliente al día | **P2** |
| 11 | 216 |  | Narvesters Gabriell Moreno Cedeño | Antonio Rada | 4.Plan de pagos | 2024-03-09 | Q50,000.00 | Q8,000 | 5,006.00 | 3 | Vendido | Superávit de Enganche | **P2** |
| 12 | 304 |  | Ricardo Alberto Vásquez Monterroso | Antonio Rada | 4.Plan de pagos | 2025-03-03 | Q5,244.00 | Q10,000 | 5,244.00 | 13 | Vendido | Cliente al día | **P2** |
| 13 | 305 |  | Josue Alejandro Arias Perez | Antonio Rada | 4.Plan de pagos | 2025-04-01 | Q3,500.00 | Q10,000 | 7,790.00 | 7 | Vendido | Cliente Atrasado | **P2** |
| 14 | 306 |  | Ricardo José Ruiz Álvarez | Anahí Cisneros | 4.Plan de pagos | 2026-01-11 | Q10,000.00 | Q10,000 | 10,000.00 | 0 | Vendido | Cliente al día | **P2** |
| 15 | 307 |  | Selvin Antonio Rodriguez Parada | Jose Gutierrez | 4.Plan de pagos | 2026-03-25 | Q11,200.00 | Q10,000 | 8,400.00 | 0 | Vendido | Cliente al día | **P2** |
| 16 | 308 |  | Ricardo Alberto Vásquez Monterroso | Antonio Rada | 4.Plan de pagos | 2025-03-03 | Q6,666.00 | Q10,000 | 6,666.00 | 13 | Vendido | Cliente al día | **P2** |
| 17 | 309 |  | Leonel Bernardo Molina Gramajo | Antonio Rada | 4.Plan de pagos | 2024-08-12 | Q5,000.00 | Q10,000 | 7,818.00 | 16 | Vendido | Cliente Atrasado | **P2** |
| 18 | 312 |  | Freddy Alejandro Chinchilla Culajay | Antonio Rada | 4.Plan de pagos | 2024-12-24 | Q7,851.00 | Q8,000 | 7,851.00 | 15 | Vendido | Cliente Atrasado | **P2** |
| 19 | 314 |  | Arcely Abigail Contreras Zuñiga | Laura Molina | 4.Plan de pagos | 2025-08-11 | Q6,774.83 | Q10,000 | 6,774.83 | 8 | Vendido | Cliente al día | **P2** |
| 20 | 316 |  | Allan Omar Alvarado Vásquez | Antonio Rada | 4.Plan de pagos | 2023-10-29 | Q599,241.01 | Q8,000 | 2,735.00 | 22 | Vendido | Superávit de Enganche | **P2** |
| 21 | 406 |  | Andrea Joanna Hidalgo Mendizábal  | Antonio Rada | 4.Plan de pagos | 2025-05-23 | Q8,367.00 | Q10,000 | 8,371.00 | 7 | Vendido | Cliente Atrasado | **P2** |
| 22 | 407 |  | Alberto Antonio Arrecis Rosales | Laura Molina | 4.Plan de pagos | 2025-08-14 | Q7,041.47 | Q10,000 | 7,041.47 | 8 | Vendido | Cliente al día | **P2** |
| 23 | 409 |  | Rafael Leonidas Tabíc Borja | Antonio Rada | 4.Plan de pagos | 2024-08-08 | Q3,690.00 | Q10,000 | 7,762.00 | 15 | Vendido | Superávit de Enganche | **P2** |
| 24 | 410 |  | Josue Ernesto Herrera Aguilar | Anahí Cisneros | 4.Plan de pagos | 2025-07-11 | Q9,504.04 | Q15,000 | 9,504.04 | 9 | Vendido | Cliente al día | **P2** |
| 25 | 411 |  | Sonia Elizabeth Gómez Méndez de García | Anahí Cisneros | 4.Plan de pagos | 2025-12-13 | Q10,000.00 | Q10,000 | 10,000.00 | 0 | Vendido | Cliente al día | **P2** |
| 26 | 415 |  | Kevin Mario Andrés Leal Morales / Flor de María Herrera Reye | Anahí Cisneros | 4.Plan de pagos | 2025-06-10 | Q18,044.00 | Q15,000 | 18,044.00 | 0 | Vendido | Cliente al día | **P2** |
| 27 | 416 |  | Carlos Humberto Rivera Carrillo  | Sofia Paredes | 4.Plan de pagos | 2025-02-07 | Q5,000.00 | Q10,000 | 4,371.00 | 10 | Vendido | Superávit de Enganche | **P2** |
| 28 | 418 |  | Antonio Vicente Tzep Tahay  | Antonio Rada | 4.Plan de pagos | 2025-05-08 | Q43,380.50 | Q10,000 | 5,423.00 | 1 | Vendido | Enganche Completado | **P2** |
| 29 | 501 |  | Erick Guillermo Ruano Gatica | Sofia Paredes | 4.Plan de pagos | 2025-01-24 | Q8,772.00 | Q10,000 | 8,772.00 | 15 | Vendido | Cliente al día | **P2** |
| 30 | 502 |  | Mauricio Adolfo Rodriguez | Erwin Cardona | 2.Reserva | 2026-03-03 | Q140,000.00 | NULL | — | 0 | Vendido | Superávit de Enganche | **P2** |
| 31 | 503 |  | David Eduardo Orellana Rivera | Antonio Rada | 4.Plan de pagos | 2025-05-21 | Q7,894.00 | Q10,000 | 7,894.00 | 6 | Vendido | Cliente Atrasado | **P2** |
| 32 | 504 |  | Jaquelyn Andrea España Siliezar | Antonio Rada | 4.Plan de pagos | 2025-05-11 | Q7,894.00 | Q10,000 | 7,894.00 | 11 | Vendido | Cliente al día | **P2** |
| 33 | 505 |  | Nancy Eugenia Cisneros Sánchez de Dávila | Antonio Rada | 4.Plan de pagos | 2024-07-30 | Q7,767.00 | Q10,000 | 7,645.00 | 19 | Vendido | Superávit de Enganche | **P2** |
| 34 | 506 |  | Carlos Eduardo Miranda Morales / Nancy Patricia Medina Marín | Antonio Rada | 4.Plan de pagos | 2024-10-15 | Q635.00 | Q10,000 | 9,185.00 | 11 | Vendido | Enganche Completado | **P2** |
| 35 | 507 |  | Osmin Otoniel Oliva Córdova | Antonio Rada | 4.Plan de pagos | 2023-08-17 | Q16,565.30 | Q6,000 | 2,652.00 | 25 | Vendido | Superávit de Enganche | **P2** |
| 36 | 510 |  | Francis Ayleen Funes Castellanos | Antonio Rada | 4.Plan de pagos | 2024-03-01 | Q4,000.00 | Q8,000 | 6,133.00 | 19 | Vendido | Cliente Atrasado | **P2** |
| 37 | 511 |  | Hugo Leonel Roca Morales / Karen Andrea Guerra Lobos de Roca | Antonio Rada | 4.Plan de pagos | 2024-06-27 | Q25,000.00 | Q10,000 | 6,009.00 | 5 | Vendido | Superávit de Enganche | **P2** |
| 38 | 513 |  | María Fernanda Cabrera Valdez | Antonio Rada | 4.Plan de pagos | 2023-07-16 | Q2,415.00 | Q6,000 | 2,415.00 | 20 | Vendido | Superávit de Enganche | **P2** |
| 39 | 517 |  | Jorge Estuardo Díaz Durán Baldetti | Antonio Rada | 4.Plan de pagos | 2024-05-13 | Q620,000.00 | Q8,000 | 4,166.00 | 17 | Vendido | Superávit de Enganche | **P2** |
| 40 | 519 |  | Neftalí Hemanuel de León Recinos | Anahí Cisneros | 4.Plan de pagos | 2025-08-29 | Q10,210.00 | Q10,000 | 10,210.00 | 0 | Vendido | Cliente al día | **P2** |
| 41 | 602 |  | Wendy Lorena Caal García de Castellanos | Anahí Cisneros | 4.Plan de pagos | 2025-08-27 | Q1,407,744.00 | Q10,000 | 102,800.00 | 0 | Vendido | Superávit de Enganche | **P2** |
| 42 | 607 |  | Antony Williams Sajché Torres / Madelyn Kristina Sajché Torr | Antonio Rada | 4.Plan de pagos | 2025-04-22 | Q428.00 | Q10,000 | 5,167.00 | 11 | Vendido | Superávit de Enganche | **P2** |
| 43 | 611 |  | Kenny Estuardo Garay Carías | Antonio Rada | 4.Plan de pagos | 2025-06-27 | Q20,488.00 | Q10,000 | 20,488.00 | 0 | Vendido | Cliente al día | **P2** |
| 44 | 612 |  | Yonatan Morgan Acajabón | Antonio Rada | 4.Plan de pagos | 2025-09-06 | Q158,212.50 | Q10,000 | 6,300.00 | 5 | Vendido | Superávit de Enganche | **P2** |
| 45 | 613 |  | Sergio Oswaldo Velásquez Moreno | Antonio Rada | 4.Plan de pagos | 2023-07-19 | Q581,568.60 | Q6,000 | 2,415.00 | 25 | Vendido | Superávit de Enganche | **P2** |
| 46 | 614 |  | Ruben Ivan España Marroquín | Erwin Cardona | 2.Reserva | 2026-04-19 | Q10,000.00 | NULL | — | 0 | Vendido | Superávit de Enganche | **AMB** |
| 47 | 618 |  | Sergio Adolfo García Velásquez | Antonio Rada | 4.Plan de pagos | 2025-04-25 | Q6,000.00 | Q10,000 | 10,796.00 | 10 | Vendido | Cliente Atrasado | **P2** |
| 48 | 619 |  | José Estuardo Ordoñez Cancinos | Sofia Paredes | 4.Plan de pagos | 2025-03-08 | Q10,214.00 | Q10,000 | 10,214.00 | 1 | Vendido | Cliente Atrasado | **P2** |
| 49 | 705 |  | Ingrid Lisbeth Dubón García de Díaz | Antonio Rada | 4.Plan de pagos | 2025-02-11 | Q58,647.00 | Q10,000 | 8,647.00 | 11 | Vendido | Superávit de Enganche | **P2** |
| 50 | 706 |  | Edison Gabriel Ramirez López | Antonio Rada | 4.Plan de pagos | 2025-03-12 | Q18,614.70 | Q10,000 | 9,307.00 | 10 | Vendido | Enganche Completado | **P2** |
| 51 | 707 |  | Cristhian Paul Escobar Maldonado  | Sofia Paredes | 4.Plan de pagos | 2025-04-04 | Q11,945.00 | Q10,000 | 5,303.00 | 8 | Vendido | Enganche Completado | **P2** |
| 52 | 708 |  | Alfonso Videche Rodriguez | Antonio Rada | 4.Plan de pagos | 2024-01-30 | Q15,793.00 | Q7,600 | 18,465.50 | 1 | Vendido | Superávit de Enganche | **P2** |
| 53 | 709 |  | Manuel Lizandro Ramírez Barrios | Anahí Cisneros | 4.Plan de pagos | 2023-10-03 | Q1,190,792.00 | Q10,000 | 86,000.00 | 0 | Vendido | Superávit de Enganche | **P2** |
| 54 | 711 |  | Samuel David Chávez Pérez | Diana Alvarez | 4.Plan de pagos | 2025-04-23 | Q45,512.47 | Q60,000 | 3,782.00 | 5 | Vendido | Enganche Completado | **P2** |
| 55 | 713 |  |  Luis Alejandro Pérez Ibañez | Antonio Rada | 4.Plan de pagos | 2023-06-10 | Q5,004.85 | Q6,000 | 2,326.00 | 25 | Vendido | Enganche Completado | **P2** |
| 56 | 714 |  | José Carlos Samayoa San José | Antonio Rada | 4.Plan de pagos | 2024-04-11 | Q19,500.00 | Q8,000 | 7,989.00 | 0 | Vendido | Superávit de Enganche | **P2** |
| 57 | 715 |  | Cynthia Marisel Coronado Monterroso | Brenda Búcaro | 4.Plan de pagos | 2023-03-10 | Q522,264.00 | Q6,000 | 1,600.00 | 31 | Vendido | Superávit de Enganche | **P2** |
| 58 | 717 |  | Jorge Estuardo Díaz Durán Baldetti | Antonio Rada | 4.Plan de pagos | 2024-04-30 | Q702,556.00 | Q8,000 | 4,040.00 | 17 | Vendido | Superávit de Enganche | **P2** |
| 59 | 718 |  | Luis Alexander Valencia Méndez | Anahi Cisneros | 2.Reserva | 2025-11-09 | Q13,500.00 | NULL | — | 0 | Vendido | Cliente al día | **P2** |
| 60 | 802 |  | Carmen Julia Soto Baechli de Hicks | Brenda Búcaro | 4.Plan de pagos | 2023-06-10 | Q4,100.00 | Q6,000 | 4,100.00 | 32 | Vendido | Superávit de Enganche | **P2** |
| 61 | 804 |  | Victor Hugo Cáceres Morales | Brenda Búcaro | 4.Plan de pagos | 2023-06-13 | Q17,800.00 | Q6,000 | 2,381.00 | 28 | Vendido | Superávit de Enganche | **P2** |
| 62 | 806 |  | Rodolfo Morales Muñoz | Antonio Rada | 4.Plan de pagos | 2024-09-12 | Q917,534.00 | Q10,000 | 6,564.00 | 15 | Vendido | Superávit de Enganche | **P2** |
| 63 | 812 |  | Juan Pablo González Tuchán | Antonio Rada | 4.Plan de pagos | 2024-07-30 | Q200,000.00 | Q10,000 | 84,146.71 | 0 | Vendido | Superávit de Enganche | **P2** |
| 64 | 813 |  | Industrias Danico, S.A. /  Pedro José Cordón Folgar} | Antonio Rada | 4.Plan de pagos | 2024-05-14 | Q12,238.85 | Q8,000 | 4,082.00 | 0 | Vendido | Enganche Completado | **P2** |
| 65 | 816 |  | Coasa, S.A. | Brenda Búcaro | 4.Plan de pagos | 2023-03-31 | Q551,216.00 | Q6,000 | 1,700.00 | 34 | Vendido | Superávit de Enganche | **P2** |
| 66 | 817 |  |  Juan Antonio Escobedo del Cid | Brenda Búcaro | 4.Plan de pagos | 2023-04-11 | Q3,000.00 | Q6,000 | 1,757.00 | 30 | Vendido | Cliente Atrasado | **P2** |
| 67 | 819 |  | Edvin Eduardo Sajquim Sajquim / Edvin Waldemar Sajquim Estac | Brenda Búcaro | 4.Plan de pagos | 2023-05-29 | Q3,200.00 | Q6,000 | 3,243.00 | 33 | Vendido | Superávit de Enganche | **P2** |
| 68 | 902 |  | Waldir Edenilson Contreras Pedroza | Antonio Rada | 4.Plan de pagos | 2024-01-15 | Q40,000.00 | Q8,000 | 5,584.00 | 8 | Vendido | Superávit de Enganche | **P2** |
| 69 | 911 |  | Mario Alberto Maldonado Recinos | Brenda Búcaro | 4.Plan de pagos | 2023-09-16 | Q27,094.50 | Q8,000 | 4,053.00 | 28 | Vendido | Superávit de Enganche | **P2** |
| 70 | 919 |  | Edwin Ernesto Ovalle Barrios | Erwin Cardona | 2.Reserva | 2026-04-10 | Q10,000.00 | NULL | — | 0 | Vendido | Superávit de Enganche | **AMB** |
| 71 | 1001 |  | Carlos Ramón Chajón Aceituno | Erwin Cardona | 2.Reserva | 2026-04-17 | Q10,000.00 | NULL | — | 0 | Vendido | Superávit de Enganche | **AMB** |
| 72 | 1010 |  | Allan Donaldo Lapop Cárdenas | Antonio Rada | 4.Plan de pagos | 2023-08-27 | Q25,000.00 | Q6,000 | 3,156.00 | 25 | Vendido | Superávit de Enganche | **P2** |
| 73 | 1015 |  | Pedro Luis Artero Bran | Antonio Rada | 4.Plan de pagos | 2023-04-19 | Q5,203.00 | Q6,000 | 4,393.00 | 36 | Vendido | Superávit de Enganche | **P2** |
| 74 | 1016 |  | Diego Alejandro Barreno González | Erwin Cardona | 2.Reserva | 2026-04-21 | Q10,000.00 | NULL | — | 0 | Vendido | Superávit de Enganche | **AMB** |
| 75 | 1017 |  | Irene Alejandra Reyes Guzmán | Brenda Búcaro | 4.Plan de pagos | 2023-04-16 | Q17,800.00 | Q40,000 | 1,650.00 | 20 | Vendido | Enganche Completado | **P2** |
| 76 | 1020 |  | Bernerd Alexandro Godínez López | Erwin Cardona | 4.Plan de pagos | 2025-11-24 | Q8,500.00 | Q40,000 | 8,500.00 | 6 | Vendido | Cliente al día | **P2** |
| 77 | 1103 |  | Samuel Hiram Salazar Say | Antonio Rada | 4.Plan de pagos | 2023-05-25 | Q643,098.50 | Q6,000 | 6,225.00 | 0 | Vendido | Superávit de Enganche | **P2** |
| 78 | 1111 |  | Erika Ruth Castro Juarez | Antonio Rada | 4.Plan de pagos | 2024-02-07 | Q81.50 | Q8,000 | 5,863.00 | 20 | Vendido | Enganche Completado | **P2** |
| 79 | 1115 |  | Eddy Francisco Mac-Intosh López | Antonio Rada | 4.Plan de pagos | 2025-04-08 | Q8,025.00 | Q10,000 | 8,025.00 | 12 | Vendido | Cliente al día | **P2** |
| 80 | 1116 |  | Ingrid Lissette Robles Villatoro | Erwin Cardona | 2.Reserva | 2026-04-17 | Q10,000.00 | NULL | — | 0 | Vendido | Superávit de Enganche | **AMB** |
| 81 | 1201 |  | Rogelio Alejandro Ochoa Hernández | Antonio Rada | 4.Plan de pagos | 2024-06-18 | Q17,900.00 | Q10,000 | 6,411.00 | 13 | Vendido | Enganche Completado | **P2** |
| 82 | 1205 |  | Andrea Nicole Mansilla Fuentes | Antonio Rada | 4.Plan de pagos | 2023-03-25 | Q8,034.00 | Q6,000 | 1,725.71 | 25 | Vendido | Cliente Atrasado | **P2** |
| 83 | 1212 |  | Erick Orlando Barrios Navas | Erwin Cardona | 2.Reserva | 2026-04-21 | Q50,000.00 | NULL | — | 0 | Vendido | Superávit de Enganche | **AMB** |
| 84 | 1214 |  | Manuel Armando Fletes Ordoñez | Jose Franco | 4.Plan de pagos | 2023-06-05 | Q10,000.00 | Q6,000 | 2,693.00 | 22 | Vendido | Superávit de Enganche | **P2** |
| 85 | 1215 |  | José Javier Hernández Juárez | Antonio Rada | 4.Plan de pagos | 2023-04-11 | Q4,000.00 | Q6,000 | 2,755.00 | 33 | Vendido | Superávit de Enganche | **P2** |
| 86 | 1216 |  | Alan Richard Gonzalez Choc | Anahí Cisneros | 4.Plan de pagos | 2025-07-18 | Q31,100.00 | Q519,578 | 47,234.37 | 7 | Vendido | Cliente Atrasado | **P2** |
| 87 | 1218 |  | Héctor Ricardo Echeverría Méndez | Diana Alvarez | 4.Plan de pagos | 2024-11-18 | Q6,950.00 | Q10,000 | 6,950.00 | 9 | Vendido | Cliente Atrasado | **P2** |
| 88 | 1305 |  | José Salvador Franco Rosales | Antonio Rada | 4.Plan de pagos | 2025-05-02 | Q5,617.00 | Q10,000 | 5,617.00 | 11 | Vendido | Cliente al día | **P2** |
| 89 | 1306 |  |  Barbara Elizabeth Barrientos Valenzuela | Brenda Búcaro | 4.Plan de pagos | 2023-05-08 | Q5,000.00 | Q6,000 | 2,279.00 | 27 | Vendido | Superávit de Enganche | **P2** |
| 90 | 1310 |  |  Raúl Cabrera Galindo | Jose Franco | 4.Plan de pagos | 2023-03-27 | Q100.00 | Q6,000 | 3,002.86 | 34 | Vendido | Enganche Completado | **P2** |
| 91 | 1311 |  | Luis Gabriel Garrido Blanco | Antonio Rada | 4.Plan de pagos | 2023-10-03 | Q8,192.00 | Q8,000 | 4,096.00 | 12 | Vendido | Superávit de Enganche | **P2** |
| 92 | 1315 |  | Alan Richard Gonzalez Choc | Anahí Cisneros | 4.Plan de pagos | 2025-07-18 | Q32,100.00 | Q536,137 | 46,739.73 | 8 | Vendido | Cliente Atrasado | **P2** |
| 93 | 1317 |  | Marcos David Boror Alpírez | Antonio Rada | 4.Plan de pagos | 2024-08-21 | Q7,605.00 | Q10,000 | 7,605.00 | 20 | Vendido | Superávit de Enganche | **P2** |
| 94 | 1318 |  | Jose Alejandro Abalony Rojas | Erwin Cardona | 4.Plan de pagos | 2025-12-02 | Q45,000.00 | Q10,000 | 149,531.43 | 0 | Vendido | Cliente Atrasado | **P2** |
| 95 | 1406 |  |  Jonatan Hans Donis Montenegro | Jose Franco | 4.Plan de pagos | 2023-03-27 | Q1,740.00 | Q6,000 | 1,691.43 | 35 | Vendido | Cliente Atrasado | **P2** |
| 96 | 1408 |  | Yahayra Sujey Lemus Contreras de Mayén | Erwin Cardona | 4.Plan de pagos | 2026-01-25 | Q100,000.00 | Q84,665 | — | 1 | Vendido | Cliente al día | **P2** |
| 97 | 1504 |  | Berta Eugenia Morales López de Letona | Jose Franco | 4.Plan de pagos | 2023-05-22 | Q1,000.00 | Q6,000 | 2,943.00 | 34 | Vendido | Cliente Atrasado | **P2** |
| 98 | 1505 |  | Daniel Alvarez Alvarez | Antonio Rada | 4.Plan de pagos | 2024-07-18 | Q6,929.00 | Q10,000 | 6,929.00 | 21 | Vendido | Superávit de Enganche | **P2** |
| 99 | 1509 |  | Alan Richard Gonzalez Choc | Anahí Cisneros | 4.Plan de pagos | 2025-07-18 | Q32,400.00 | Q541,277 | 49,207.00 | 7 | Vendido | Cliente Atrasado | **P2** |
| 100 | 1605 |  | Edgar Rolando Muy Pineda | Antonio Rada | 4.Plan de pagos | 2024-10-22 | Q9,165.71 | Q10,000 | 9,240.00 | 10 | Vendido | Superávit de Enganche | **P2** |
| 101 | 1609 |  | Christian Josué Colindres Sandoval | Antonio Rada | 4.Plan de pagos | 2023-03-25 | Q9,160.68 | Q6,000 | 2,290.02 | 21 | Vendido | Cliente Atrasado | **P2** |
| 102 | 1612 |  | Allan Rodrigo Godínez Padilla | Erwin Cardona | 4.Plan de pagos | 2026-02-10 | Q8,488.00 | Q10,000 | 7,275.71 | 1 | Vendido | Cliente Atrasado | **P2** |
| 103 | 1707 |  | Miguel Eduardo Yon Moll | Ronaldo Ogaldez | 4.Plan de pagos | 2025-03-05 | Q5,050.00 | Q10,000 | 5,050.00 | 2 | Vendido | Cliente al día | **P2** |
| 104 | 1708 |  | Carlos Antonio Aguilar Velásquez | Anahí Cisneros | 4.Plan de pagos | 2025-10-27 | Q20,000.00 | Q10,000 | 14,200.00 | 0 | Vendido | Cliente al día | **P2** |
| 105 | 1803 |  | Rivabella, S.A. / Marcos Ramón Vásquez Solís | Anahi Cisneros | 4.Plan de pagos | 2025-11-15 | Q150,000.00 | Q10,000 | 485,500.00 | 0 | Vendido | Superávit de Enganche | **P2** |
| 106 | 1804 |  | Juan Pablo Monterroso Arroyo | Brenda Búcaro | 4.Plan de pagos | 2023-03-10 | Q1,940.00 | Q6,000 | 1,600.00 | 31 | Vendido | Cliente Atrasado | **P2** |

## 5.2 Benestare (BNT) — April 2026 Data Rows

**103 units with April 2026 payment | Total: Q161,781.46**

| # | Apto | Torre | Cliente | Vendedor | Estatus | FechaRes | AprPmt (GTQ) | MRes | CPact | CPag | StInm | StCli | Phase |
|---|------|-------|---------|----------|---------|----------|-------------|------|-------|------|-------|-------|-------|
| 1 | 103 A | A | Carlos Francisco Mejía Payes | Rony Ramírez | 2.Reservado | 2026-04-30 | Q1,500.00 | NULL | — | 0 | Vendido | Superávit de Enganche | **AMB** |
| 2 | 201 A | A | Silvia Dinora Pérez Ruano | Pablo Marroquín | 4.Plan de pagos | 2025-11-16 | Q2,340.00 | Q1,500 | 2,340.00 | 0 | Vendido | Cliente al día | **P2** |
| 3 | 202 A | A | Jorge Mario López Gonzalez | Iván Castillo | 2.Reservado | 2026-04-12 | Q1,500.00 | NULL | — | 0 | Vendido | Superávit de Enganche | **AMB** |
| 4 | 209 A | A | Byron Amilcar Argueta Orrego / Sheila Roxana Ajcúc Hernández | Eder Veliz | 4.Plan de pagos | 2025-11-22 | Q2,300.00 | Q1,500 | 2,320.00 | 0 | Vendido | Cliente Atrasado | **P2** |
| 5 | 305 A | A | Ana Natalia Bardales García | Iván Castillo | 2.Reservado | 2026-03-28 | Q2,686.00 | NULL | — | 0 | Vendido | Superávit de Enganche | **P2** |
| 6 | 404 A | A | Amanda Aracely Castillo Guzmán | Efren Sanchez | 4.Plan de pagos | 2024-11-30 | Q1,800.00 | Q500 | 7,653.85 | 0 | Vendido | Cliente Atrasado | **P2** |
| 7 | 405 A | A | Sara Esmeralda López Hernández | Pablo Marroquín | 4.Plan de pagos | 2025-06-30 | Q1,062.50 | Q1,500 | 1,062.50 | 10 | Vendido | Cliente al día | **P2** |
| 8 | 409 A | A | Rudy Ronaldo Peña Larios | Efren Sanchez | 4.Plan de pagos | 2025-03-31 | Q1,500.00 | Q1,500 | 1,493.33 | 0 | Vendido | Cliente al día | **P2** |
| 9 | 501 A | A | Ronald Alberto Pineda Monroy | Efren Sanchez | 4.Plan de pagos | 2025-06-28 | Q1,462.50 | Q500 | 1,462.50 | 0 | Vendido | Cliente al día | **P2** |
| 10 | 503 A | A | Michael Alexander Morales Rodríguez / Helen Mishel Rodas Lóp | Pablo Marroquín | 4.Plan de pagos | 2025-06-27 | Q1,400.00 | Q1,500 | 1,400.00 | 9 | Vendido | Cliente al día | **P2** |
| 11 | 504 A | A | Diego Estuardo Salguero Salvatierra / Iveth Esmeralda Pereir | Pablo Marroquín | 4.Plan de pagos | 2025-06-28 | Q1,400.00 | Q1,500 | 1,400.00 | 7 | Vendido | Cliente Atrasado | **P2** |
| 12 | 505 A | A | Katherine Andrea Aceytuno Herrera / Denis Alexander Gabriel  | Eder Veliz | 4.Plan de pagos | 2026-02-28 | Q2,558.00 | Q1,500 | 2,558.00 | 0 | Vendido | Cliente al día | **P2** |
| 13 | 506 A | A | Cintia Noemy Díaz Díaz / Alan Emanuel Tunche Huertas | Eder Veliz | 4.Plan de pagos | 2025-05-10 | Q4,182.00 | Q1,500 | 1,866.67 | 0 | Vendido | Cliente Atrasado | **P2** |
| 14 | 508 A | A | Sebastian Angel Milian Guas | Eder Veliz | 4.Plan de pagos | 2025-06-28 | Q1,400.00 | Q1,500 | 1,400.00 | 10 | Vendido | Cliente al día | **P2** |
| 15 | 509 A | A | Cintia Noemy Diaz Diaz | Eder Veliz | 4.Plan de pagos | 2025-11-16 | Q2,320.00 | Q1,500 | 2,320.00 | 0 | Vendido | Cliente al día | **P2** |
| 16 | 607 A | A | Ever Benedicto Tipol Yoj | Rony Ramírez | 2.Reservado | 2026-03-30 | Q3,600.00 | NULL | — | 0 | Vendido | Superávit de Enganche | **P2** |
| 17 | 102 B | B | Miguel Anibal Navarro Orozco | Efren Sanchez | 2.Reservado | 2026-02-04 | Q1,614.00 | NULL | — | 0 | Vendido | Cliente al día | **P2** |
| 18 | 103 B | B | Linsy Asaneth Alarcón Reyes de Cordón | Pablo Marroquín | 4.Plan de pagos | 2025-12-17 | Q1,406.00 | Q1,500 | 1,406.00 | 3 | Vendido | Cliente al día | **P2** |
| 19 | 104 B | B | Rogerio Dagoberto Escobar Fajardo / Carmen Odila Escobar de  | Efren Sanchez | 4.Plan de pagos | 2025-07-27 | Q2,000.00 | Q1,500 | 1,272.22 | 4 | Vendido | Cliente al día | **P2** |
| 20 | 109 B | B | Carmen Odilia Escobar de León | Efren Sanchez | 4.Plan de pagos | 2026-01-05 | Q1,490.00 | Q1,500 | 1,488.00 | 2 | Vendido | Cliente Atrasado | **P2** |
| 21 | 111 B | B | Wendy Judith Cortez Cuque | Pablo Marroquín | 4.Plan de pagos | 2025-09-23 | Q1,463.00 | Q1,500 | 1,463.00 | 6 | Vendido | Cliente al día | **P2** |
| 22 | 112 B | B | Cindy Gabriela Mejicanos de León / José Roberto López | Efren Sanchez | 4.Plan de pagos | 2025-09-02 | Q1,364.71 | Q1,500 | 1,364.71 | 6 | Vendido | Cliente al día | **P2** |
| 23 | 113 B | B | Ruth María Isabel Rodríguez Coronado | Eder Veliz | 4.Plan de pagos | 2025-08-06 | Q1,431.25 | Q1,500 | 1,431.25 | 5 | Vendido | Cliente al día | **P2** |
| 24 | 202 B | B | Diego Francisco Culajay Sic | Eder Veliz | 2.Reservado | 2026-04-28 | Q1,500.00 | Q1,500 | 1,493.33 | 0 | Vendido | Cliente Atrasado | **P1** |
| 25 | 205 B | B | Angel Renato Muñoz de León | Efren Sanchez | 2.Reservado | 2025-07-07 | Q1,272.22 | NULL | — | 0 | Vendido | Cliente al día | **P2** |
| 26 | 208 B | B | Francisca Veronica Rosales Morales | Eder Veliz | 4.Plan de pagos | 2026-01-04 | Q1,482.00 | Q1,500 | 1,482.00 | 3 | Vendido | Cliente al día | **P2** |
| 27 | 209 B | B | Douglas Alexander Crúz Cobar | Efren Sanchez | 4.Plan de pagos | 2025-07-27 | Q1,272.22 | Q1,500 | 1,272.22 | 9 | Vendido | Cliente al día | **P2** |
| 28 | 210 C | C | Karen Elizabeth Barahona Escobar | Rony Ramírez | 2.Reservado | 2026-04-15 | Q1,482.00 | NULL | — | 0 | Vendido | Cliente al día | **AMB** |
| 29 | 211 B | B | Flor del Rocío Guarcas Samayoa | Eder Veliz | 4.Plan de pagos | 2025-08-22 | Q1,364.71 | Q1,500 | 1,364.71 | 6 | Vendido | Cliente al día | **P2** |
| 30 | 212 B | B | Dylan Alexander Ramos Campos | Pablo Marroquín | 4.Plan de pagos | 2025-08-05 | Q1,347.06 | Q1,500 | 1,347.06 | 8 | Vendido | Cliente al día | **P2** |
| 31 | 213 B | B | Blanca Iris García Figueroa de Jocol / Ricardo Ernesto Jocol | Pablo Marroquín | 4.Plan de pagos | 2025-08-17 | Q1,300.00 | Q1,500 | 1,364.71 | 5 | Vendido | Cliente Atrasado | **P2** |
| 32 | 304 B | B | Daniel Alberto Vargas del Cid | Eder Veliz | 4.Plan de pagos | 2025-12-13 | Q1,389.00 | Q1,500 | 1,389.00 | 3 | Vendido | Cliente al día | **P2** |
| 33 | 308 B | B | Luis Javier Aguilar España | Pablo Marroquín | 4.Plan de pagos | 2025-07-06 | Q1,272.22 | Q1,500 | 1,272.22 | 9 | Vendido | Cliente al día | **P2** |
| 34 | 310 B | B | Debora Marie Castillo Ventura | Pablo Marroquín | 4.Plan de pagos | 2026-01-17 | Q1,513.00 | Q1,500 | 1,513.00 | 0 | Vendido | Cliente Atrasado | **P2** |
| 35 | 311 B | B | Lesly Marisol de León Villanueva | Rony Ramírez | 4.Plan de pagos | 2026-01-24 | Q1,500.00 | Q1,500 | 1,513.00 | 0 | Vendido | Cliente Atrasado | **P2** |
| 36 | 312 B | B | Julian Guillermo Ramirez García / Sulma Korina Hernández Agu | Eder Veliz | 4.Plan de pagos | 2025-07-31 | Q1,431.25 | Q1,500 | 1,272.22 | 8 | Vendido | Cliente al día | **P2** |
| 37 | 313 B | B | Sussan Iveth Molina Zuncar | Iván Castillo | 2.Reservado | 2026-04-25 | Q1,500.00 | NULL | — | 0 | Vendido | Superávit de Enganche | **AMB** |
| 38 | 401 B | B | Faviola Antonia Monroy Lima / Edwin Alfredo Rivera | Pablo Marroquín | 4.Plan de pagos | 2026-01-11 | Q1,513.00 | Q1,500 | 1,513.00 | 0 | Vendido | Cliente al día | **P2** |
| 39 | 402 B | B | Rigoberto Gabriel López | Rony Ramírez | 4.Plan de pagos | 2025-11-17 | Q1,450.00 | Q1,500 | 1,289.00 | 6 | Vendido | Cliente Atrasado | **P2** |
| 40 | 403 B | B | Estefan Guadalupe Juárez Girón de Perez | Efren Sanchez | 4.Plan de pagos | 2026-01-08 | Q1,519.00 | Q1,500 | 1,519.00 | 0 | Vendido | Cliente al día | **P2** |
| 41 | 404 B | B | José Luis García Macal | Efren Sanchez | 4.Plan de pagos | 2025-11-30 | Q1,340.00 | Q1,500 | 1,284.00 | 4 | Vendido | Cliente Atrasado | **P2** |
| 42 | 406 B | B | Mario Alexander Gutierrez Pacheco | Rony Ramírez | 4.Plan de pagos | 2026-01-20 | Q1,513.00 | Q1,500 | 1,513.00 | 0 | Vendido | Cliente al día | **P2** |
| 43 | 407 B | B | Mauricio Ricardo Mámol Vásquez | Pablo Marroquín | 4.Plan de pagos | 2025-08-06 | Q2,058.82 | Q1,500 | 1,029.41 | 7 | Vendido | Cliente al día | **P2** |
| 44 | 410 B | B | Luis Fernando Díaz Mijangos / Carolin Magali Rodríguez Zacar | Efren Sanchez | 2.Reservado | 2026-01-05 | Q3,038.00 | NULL | — | 0 | Vendido | Cliente al día | **P2** |
| 45 | 411 B | B | Astrid Angelica Herrera Gil de López / Kevin Alejandro López | Pablo Marroquín | 4.Plan de pagos | 2025-07-20 | Q1,222.22 | Q1,500 | 1,272.22 | 9 | Vendido | Cliente Atrasado | **P2** |
| 46 | 413 B | B | Jazmín Esmeralda Estrada Menendez | Eder Veliz | 4.Plan de pagos | 2026-01-11 | Q1,482.00 | Q1,500 | 1,482.00 | 3 | Vendido | Cliente al día | **P2** |
| 47 | 501 B | B | Hillary Kerstel Ixmucane Xoná Guzmán / Francisca Guzmán Lópe | Pablo Marroquín | 4.Plan de pagos | 2025-07-13 | Q1,272.22 | Q1,500 | 1,272.22 | 9 | Vendido | Cliente al día | **P2** |
| 48 | 502 B | B | Jurgen Alexander Hernández Camposeco | Pablo Marroquín | 4.Plan de pagos | 2025-08-24 | Q1,350.00 | Q1,500 | 1,365.00 | 7 | Vendido | Cliente Atrasado | **P2** |
| 49 | 504 B | B | Israel Armando Marroquín Pérez | Efren Sanchez | 4.Plan de pagos | 2025-08-14 | Q1,347.06 | Q1,500 | 1,347.06 | 8 | Vendido | Cliente al día | **P2** |
| 50 | 506 B | B | Hugo Alexander Méndez Caal | Eder Veliz | 4.Plan de pagos | 2025-09-11 | Q1,450.00 | Q1,500 | 1,450.00 | 7 | Vendido | Cliente Atrasado | **P2** |
| 51 | 507 B | B | David Enrique Aldana Mazariegos | Pedro P. Sarti | 4.Plan de pagos | 2025-02-05 | Q1,100.00 | Q1,500 | 1,062.50 | 14 | Vendido | Cliente al día | **P2** |
| 52 | 511 B | B | Josmin Joaquín Barahona Mora | Pablo Marroquín | 4.Plan de pagos | 2025-08-09 | Q1,347.06 | Q1,500 | 1,347.06 | 8 | Vendido | Cliente al día | **P2** |
| 53 | 512 B | B | Byron Méndez Cal | Eder Veliz | 4.Plan de pagos | 2025-09-07 | Q1,450.00 | Q1,500 | 1,450.00 | 7 | Vendido | Cliente al día | **P2** |
| 54 | 513 B | B | Karen Ivonne Poggio | Pablo Marroquín | 4.Plan de pagos | 2025-09-07 | Q1,450.00 | Q1,500 | 1,450.00 | 6 | Vendido | Cliente Atrasado | **P2** |
| 55 | 601 B | B | Mario Andres Pérez López | Eder Veliz | 4.Plan de pagos | 2025-07-26 | Q1,272.22 | Q1,500 | 1,272.22 | 9 | Vendido | Cliente al día | **P2** |
| 56 | 603 B | B | Jose Miguel Mont Ordoñez | Eder Veliz | 2.Reservado | 2026-01-11 | Q1,482.00 | NULL | — | 0 | Vendido | Cliente al día | **P2** |
| 57 | 605 B | B | Yoselin Siomara Yocute Yocute | Rony Ramírez | 4.Plan de pagos | 2026-01-17 | Q1,482.00 | Q1,500 | 1,482.00 | 3 | Vendido | Cliente al día | **P2** |
| 58 | 606 B | B | Oscar Alexander Velasquez Tiu | Rony Ramírez | 2.Reservado | 2026-01-17 | Q3,026.00 | NULL | — | 0 | Vendido | Cliente al día | **P2** |
| 59 | 607 B | B | Cindy Yessenia Paredes Bolaños | Pablo Marroquín | 4.Plan de pagos | 2026-01-26 | Q1,118.00 | Q1,500 | 1,119.00 | 2 | Vendido | Cliente Atrasado | **P2** |
| 60 | 608 B | B | Belter Anibal Collado López | Efren Sanchez | 4.Plan de pagos | 2025-08-17 | Q1,300.00 | Q1,500 | 1,364.71 | 8 | Vendido | Cliente Atrasado | **P2** |
| 61 | 609 B | B | Emily Daniela Hernández Vásquez / Erik Ariel Alinan Sucup | Efren Sanchez | 4.Plan de pagos | 2025-08-25 | Q1,364.71 | Q1,500 | 1,364.71 | 6 | Vendido | Cliente al día | **P2** |
| 62 | 613 B | B | Valery Anthonella Schulz Rosales | Eder Veliz | 2.Reservado | 2026-01-12 | Q1,482.00 | NULL | — | 0 | Vendido | Cliente al día | **P2** |
| 63 | 101 C | C | Allan Danilo Tejada Alay | Pablo Marroquín | 4.Plan de pagos | 2025-10-05 | Q1,018.00 | Q1,500 | 1,018.00 | 6 | Vendido | Cliente al día | **P2** |
| 64 | 103 C | C | Jazmín Edith Urbina López | Eder Veliz | 4.Plan de pagos | 2025-09-14 | Q963.00 | Q1,500 | 963.00 | 5 | Vendido | Cliente al día | **P2** |
| 65 | 106 C | C | Yuri Blanca Margarita Reyes de Almira | Rony Ramírez | 2.Reservado | 2026-03-16 | Q1,425.00 | NULL | — | 0 | Vendido | Superávit de Enganche | **P2** |
| 66 | 107 C | C | Amelita Natali Aguilar López | Eder Veliz | 4.Plan de pagos | 2025-11-27 | Q1,009.00 | Q1,500 | 1,009.00 | 2 | Vendido | Cliente Atrasado | **P2** |
| 67 | 108 C | C | Julio José Guzmán Tobías | Efren Sanchez | 4.Plan de pagos | 2025-11-07 | Q1,005.00 | Q1,500 | 1,005.00 | 5 | Vendido | Cliente al día | **P2** |
| 68 | 109 C | C | Ericka Alejandra Sagastume Girón de Herrera | Efren Sanchez | 4.Plan de pagos | 2025-12-31 | Q1,620.00 | Q1,500 | 1,620.00 | 0 | Vendido | Cliente al día | **P2** |
| 69 | 110 C | C | Fernando Terre Galdamez | Efren Sanchez | 4.Plan de pagos | 2025-12-17 | Q3,220.00 | Q1,500 | 1,610.00 | 0 | Vendido | Cliente al día | **P2** |
| 70 | 201 C | C | Angie Soleyne Camacho Suarez | Eder Veliz | 4.Plan de pagos | 2025-09-12 | Q1,934.00 | Q1,500 | 967.00 | 2 | Vendido | Cliente al día | **P2** |
| 71 | 202 C | C | Cindy Abigail Ordoñez Chacón | Pablo Marroquín | 4.Plan de pagos | 2025-11-09 | Q1,064.00 | Q1,500 | 1,064.00 | 5 | Vendido | Cliente al día | **P2** |
| 72 | 204 C | C | Shirly Paola Flores Consuegra | Rony Ramírez | 2.Reservado | 2026-02-15 | Q1,760.00 | NULL | — | 0 | Vendido | Cliente al día | **P2** |
| 73 | 207 C | C | Sergio Estuardo Fuentes López | Eder Veliz | 2.Reservado | 2026-02-20 | Q1,300.00 | NULL | — | 0 | Vendido | Cliente al día | **P2** |
| 74 | 208 C | C | Junior Abraham Boror Ramos / Jéssica Marlene Ramos Ajanel | Efren Sanchez | 4.Plan de pagos | 2025-11-29 | Q2,122.00 | Q200 | 1,061.00 | 0 | Vendido | Cliente al día | **P2** |
| 75 | 209 C | C | Karen Patricia Morales Orellana / Erick Francisco Barillas G | Pablo Marroquín | 4.Plan de pagos | 2026-01-25 | Q1,643.00 | Q1,500 | 1,643.00 | 0 | Vendido | Cliente al día | **P2** |
| 76 | 302 C | C | Rosa Alejandra Rodríguez Montufar | Pablo Marroquín | 4.Plan de pagos | 2025-11-16 | Q1,064.00 | Q1,500 | 1,064.00 | 5 | Vendido | Cliente al día | **P2** |
| 77 | 303 C | C | Diego Gabriel Molina Romero | Rony Ramírez | 2.Reservado | 2025-11-02 | Q1,063.64 | NULL | — | 0 | Vendido | Cliente al día | **P2** |
| 78 | 304 C | C | Alex Ricardo Pérez Rodenas | Efren Sanchez | 4.Plan de pagos | 2025-11-08 | Q1,009.00 | Q1,500 | 1,009.00 | 3 | Vendido | Cliente al día | **P2** |
| 79 | 308 C | C | Brandon Azael Espinoza Carillas | Rony Ramírez | 4.Plan de pagos | 2026-01-18 | Q1,725.00 | Q1,500 | 1,725.00 | 0 | Vendido | Cliente al día | **P2** |
| 80 | 309 C | C | Enma Aracely Tista Jiménez | Eder Veliz | 2.Reservado | 2026-04-30 | Q1,500.00 | NULL | — | 0 | Vendido | Superávit de Enganche | **AMB** |
| 81 | 310 C | C | Steven Adolfo Paredes Cabrera / Milca Saraí Barrieos Ixcoy | Efren Sanchez | 4.Plan de pagos | 2025-12-20 | Q1,600.00 | Q1,500 | 1,605.00 | 0 | Vendido | Cliente Atrasado | **P2** |
| 82 | 401 C | C | Yuri Beberlyn Ambrocio Juarez | Eder Veliz | 2.Reservado | 2026-02-15 | Q1,660.00 | NULL | — | 0 | Vendido | Cliente al día | **P2** |
| 83 | 402 C | C | Miguel Estuardo Arevalo Toc | Eder Veliz | 2.Reservado | 2025-09-21 | Q963.00 | NULL | — | 0 | Vendido | Cliente al día | **P2** |
| 84 | 403 C | C | Elsa Mireya Quinteros García Hernández / Oswaldo Robert Karl | Efren Sanchez | 4.Plan de pagos | 2025-11-10 | Q1,000.00 | Q1,500 | 1,005.00 | 4 | Vendido | Cliente Atrasado | **P2** |
| 85 | 406 C | C | Marvin de Jesús Sosa Ramírez / Kimberly Beatriz Sipaque Oran | Efren Sanchez | 4.Plan de pagos | 2026-01-03 | Q1,350.00 | Q1,500 | 1,325.00 | 3 | Vendido | Cliente al día | **P2** |
| 86 | 407 C | C | Ronal Yovanni Donis Martínez | Rony Ramírez | 4.Plan de pagos | 2025-11-01 | Q1,063.64 | Q1,500 | 1,063.64 | 5 | Vendido | Cliente al día | **P2** |
| 87 | 408 C | C | Yohana Elizabeth Arrivillaga Fajardo | Eder Veliz | 4.Plan de pagos | 2025-11-02 | Q1,100.00 | Q1,500 | 1,005.00 | 5 | Vendido | Cliente Atrasado | **P2** |
| 88 | 507 C | C | Juan Daniel Quiñónez Márquez | Rony Ramírez | 4.Plan de pagos | 2025-11-01 | Q1,040.23 | Q1,500 | 1,041.00 | 5 | Vendido | Cliente Atrasado | **P2** |
| 89 | 509 C | C | Otylio Alexander García Orantes | Pablo Marroquín | 4.Plan de pagos | 2025-10-18 | Q1,018.00 | Q1,500 | 1,018.00 | 3 | Vendido | Cliente Atrasado | **P2** |
| 90 | 510 C | C | Erik Francisco Estrada Catalán | Eder Veliz | 4.Plan de pagos | 2025-10-19 | Q1,000.00 | Q1,500 | 967.00 | 4 | Vendido | Cliente al día | **P2** |
| 91 | 511 C | C | Marcos Javier Gatica Paz | Iván Castillo | 2.Reservado | 04/04/2026 | Q2,848.00 | NULL | — | 0 | Vendido | Superávit de Enganche | **P2** |
| 92 | 601 C | C | Sherlyn Andrea Orantes Pérez / Mauricio Alejandro Hernández  | Efren Sanchez | 4.Plan de pagos | 2026-01-30 | Q1,215.00 | Q1,500 | 1,215.00 | 3 | Vendido | Cliente al día | **P2** |
| 93 | 602 C | C | Reyna Elizabeth Pixtun Pixtun | Eder Veliz | 2.Reservado | 2026-02-28 | Q1,853.00 | NULL | — | 0 | Vendido | Cliente al día | **P2** |
| 94 | 607 C | C | Paola Adelina Figueroa Gomez de Escobar / Alan Yoel Escobar  | Antonio Rada | 2.Reservado | 2026-02-24 | Q1,853.00 | NULL | — | 0 | Vendido | Cliente al día | **P2** |
| 95 | 105 D | D | Belia Ester Velásquez Castillo de López | Eder Veliz | 2.Reservado | 2026-04-28 | Q1,500.00 | NULL | — | 0 | Vendido | Superávit de Enganche | **AMB** |
| 96 | 302 D | D | José Manuel Elias Recinos | Eder Veliz | 2.Reservado | 2026-04-19 | Q1,500.00 | NULL | — | 0 | Vendido | Superávit de Enganche | **AMB** |
| 97 | 304 D | D | Welnio Iván Cuellar Portillo | Rony Ramírez | 2.Reservado | 2026-03-22 | Q1,646.00 | NULL | — | 0 | Vendido | Superávit de Enganche | **P2** |
| 98 | 305 D | D | Manuel Bolom Yaxcal | Rony Ramírez | 2.Reservado | 2026-04-12 | Q1,500.00 | NULL | — | 0 | Vendido | Superávit de Enganche | **AMB** |
| 99 | 307 D | D | Maria Guadalupe Estacuy Mendoza de Pichola | Rony Ramírez | 2.Reservado | 2026-03-31 | Q1,500.00 | NULL | — | 0 | Vendido | Superávit de Enganche | **P2** |
| 100 | 401 D | D | Diego Yhorsmani Zuñiga Reynoso / Anderson Raúl Zuñiga Reynos | Iván Castillo | 2.Reservado | 2026-04-25 | Q1,500.00 | NULL | — | 0 | Vendido | Superávit de Enganche | **AMB** |
| 101 | 402 D | D | Nnenna Danie Sandoval Chavez | Rony Ramírez | 2.Reservado | 2026-03-27 | Q1,646.00 | NULL | — | 0 | Vendido | Superávit de Enganche | **P2** |
| 102 | 405 D | D | Josselin Abigail Marleny Rodriguez Gonzalez | Iván Castillo | 2.Reservado | 2026-03-14 | Q1,646.00 | NULL | — | 0 | Vendido | Superávit de Enganche | **P2** |
| 103 | 505 D | D | Andri Sarai Cinto Lopez | Iván Castillo | 2.Reservado | 2026-04-14 | Q1,500.00 | NULL | — | 0 | Vendido | Superávit de Enganche | **AMB** |

## 5.3 Bosque Las Tapias (BLT) — April 2026 Data Rows

**36 units with April 2026 payment | Total: Q77,099.19**

| # | Apto | Torre | Cliente | Vendedor | Estatus | FechaRes | AprPmt (GTQ) | MRes | CPact | CPag | StInm | StCli | Phase |
|---|------|-------|---------|----------|---------|----------|-------------|------|-------|------|-------|-------|-------|
| 1 | 508 B | B | Andrea Sarahí Solórzano Alvarez / Christian André Orozco Gar | Paula Hernandez | 2.Reservado | N/A | Q3,000.00 | NULL | — | 0 | Vendido | Superávit de Enganche | **P2** |
| 2 | 702 B | B | Josué Emanuel Corado Lara / Karen Celeste Morales Juárez | Paula Hernandez | 4.Plan de Pagos | 2026-03-02 | Q1,619.00 | Q3,000 | 1,618.52 | 1 | Vendido | Cliente al día | **P2** |
| 3 | 1007 B | B | Joel Enrique Mayen Anavisca | Pablo Marroquín | 2.Reservado | 2026-04-26 | Q3,000.00 | NULL | — | 0 | Vendido | Superávit de Enganche | **AMB** |
| 4 | 1208 B | B | Abner Josué Pérez Monterroso / Joy Nicole Golla Oliveras | Paula Hernandez | 2.Reservado | 2026-04-30 | Q3,000.00 | NULL | — | 0 | Vendido | Superávit de Enganche | **AMB** |
| 5 | 1307 B | B | José Ariel Miranda Aldana | Pablo Marroquín | 2.Reservado | 2026-03-08 | Q1,623.00 | NULL | — | 0 | Vendido | Superávit de Enganche | **P2** |
| 6 | 101 C | C | Favio Javier Estrada Quiñonez / Candida Eva Daniela Ramirez  | Paula Hernandez | 4.Plan de Pagos | 2025-09-27 | Q2,000.00 | Q3,000 | 1,817.00 | 6 | Vendido | Cliente Atrasado | **P2** |
| 7 | 106 C | C | Natanael de Jesus Gaitan Gomez / Karen Mariles Navas Castro  | José Gutierrez | 4.Plan de Pagos | 2025-07-28 | Q2,115.38 | Q3,000 | 2,115.38 | 6 | Vendido | Cliente al día | **P2** |
| 8 | 107 C | C | Sarai del Rosario Muralles Navas de Garcia / Luis Enrique Ga | José Gutierrez | 4.Plan de Pagos | 2025-07-28 | Q2,192.31 | Q3,000 | 2,192.31 | 8 | Vendido | Cliente Atrasado | **P2** |
| 9 | 302 C | C | Claudia Maria Gatica Ramirez | José Gutierrez | 4.Plan de Pagos | 2026-01-08 | Q2,455.00 | Q3,000 | 2,455.00 | 2 | Vendido | Cliente al día | **P2** |
| 10 | 303 C | C | Luis Armando Chávez Camo | Paula Hernandez | 4.Plan de Pagos | 2025-11-09 | Q2,232.00 | Q3,000 | 2,232.00 | 5 | Vendido | Cliente al día | **P2** |
| 11 | 401 C | C | Carlos Eduardo Celada | Paula Hernandez | 4.Plan de Pagos | 2025-08-01 | Q1,640.00 | Q3,000 | 1,640.00 | 6 | Vendido | Cliente al día | **P2** |
| 12 | 402 C | C | Lina Judith Conde Gomez de León  | Pedro Pablo Sarti | 4.Plan de Pagos | 2025-05-22 | Q2,142.93 | Q3,000 | 2,142.93 | 11 | Vendido | Cliente al día | **P2** |
| 13 | 502 C | C | Byron Omar Yapur Ponce | Paula Hernandez | 2.Reservado | 2025-10-16 | Q2,135.00 | Q3,000 | 2,050.00 | 5 | Vendido | Cliente Atrasado | **P2** |
| 14 | 604 C | C | Lilian Jeanette Paz García de Zapete | Paula Hernandez | 4.Plan de Pagos | 2025-07-26 | Q1,597.00 | Q3,000 | 1,596.15 | 4 | Vendido | Cliente Atrasado | **P2** |
| 15 | 701 C | C | Manolo de Jesús Milian Martínez | Pedro Pablo Sarti | 4.Plan de Pagos | 2025-05-26 | Q2,174.07 | Q5,000 | 2,147.07 | 10 | Vendido | Cliente Atrasado | **P2** |
| 16 | 703 C | C | Pedro Alberto Garcia Guzman | José Gutierrez | 4.Plan de Pagos | 2025-10-18 | Q2,135.00 | Q3,000 | 2,135.00 | 6 | Vendido | Cliente al día | **P2** |
| 17 | 705 C | C | Brian Alexis Velasquez Rodriguez  | José Gutierrez | 4.Plan de Pagos | 2025-07-05 | Q1,615.50 | Q3,000 | 1,615.38 | 9 | Vendido | Cliente al día | **P2** |
| 18 | 706 C | C | Christopher Geovanny Umaña Luna | Paula Hernandez | 4.Plan de Pagos | 2026-01-05 | Q2,455.00 | Q3,000 | 2,455.00 | 3 | Vendido | Cliente al día | **P2** |
| 19 | 708 C | C | Lesbia Fernanda Flores Garcia / Bryan Alexander Suret Valenz | José Gutierrez | 4.Plan de Pagos | 2025-10-27 | Q2,135.00 | Q3,000 | 2,135.00 | 6 | Vendido | Cliente Atrasado | **P2** |
| 20 | 709 C | C | Yury Julio Roberto de Jesus Urrutia Valdez / María de los An | José Gutierrez | 4.Plan de Pagos | 2026-01-10 | Q1,500.00 | Q3,000 | 2,455.00 | 3 | Vendido | Cliente Atrasado | **P2** |
| 21 | 806 C | C | Melany Eulalia López Martínez | Paula Hernandez | 2.Reservado | 2026-02-24 | Q1,500.00 | NULL | — | 0 | Vendido | Cliente al día | **P2** |
| 22 | 808 C | C | Julisa Elizabeth Gonzalez Bac / Derek Alexander Jiménez Naja | Paula Hernandez | 4.Plan de Pagos | 2025-09-07 | Q2,046.00 | Q3,000 | 2,046.00 | 7 | Vendido | Cliente al día | **P2** |
| 23 | 809 C | C | Masielle Dasayeth Monroy Hernandez / Lennin Alejandro Hidalg | José Gutierrez | 4.Plan de Pagos | 2025-06-15 | Q2,000.00 | Q3,000 | 2,000.00 | 10 | Vendido | Cliente al día | **P2** |
| 24 | 902 C | C | Luis Antonio Gómez Lucero / Febe Abigail Franco | Paula Hernandez | 4.Plan de Pagos | 2025-08-11 | Q3,000.00 | Q3,000 | 1,964.00 | 0 | Vendido | Cliente al día | **P2** |
| 25 | 903 C | C | Andreina Maribel Cornel Moraga | José Gutierrez | 4.Plan de Pagos | 2025-08-03 | Q2,000.00 | Q3,000 | 2,000.00 | 8 | Vendido | Cliente al día | **P2** |
| 26 | 905 C | C | Oscar Josue Acabal Cun | José Gutierrez | 4.Plan de Pagos | 2026-02-16 | Q1,734.00 | Q3,000 | 1,734.00 | 2 | Vendido | Cliente al día | **P2** |
| 27 | 906 C | C | William Alexander Fuentes Alvarado / Maria Regina Ramos Sama | José Gutierrez | 4.Plan de Pagos | 2025-07-27 | Q2,000.00 | Q3,000 | 1,923.08 | 9 | Vendido | Cliente al día | **P2** |
| 28 | 907 C | C | Marlon Omar Valdes Pérez / Chelsea María José García Gómez | José Gutierrez | 4.Plan de Pagos | 2025-09-22 | Q2,500.00 | Q3,000 | 1,500.00 | 6 | Vendido | Cliente al día | **P2** |
| 29 | 908 C | C | Jennifer Ivette González Medrano / Augustin Armando Calvillo | Paula Hernandez | 4.Plan de Pagos | 2025-08-19 | Q1,964.00 | Q3,000 | 1,964.00 | 8 | Vendido | Cliente al día | **P2** |
| 30 | 1001 C | C | Dilan Guillermo Hernández López | José Gutierrez | 4.Plan de Pagos | 2025-08-15 | Q1,720.00 | Q3,000 | 1,720.00 | 8 | Vendido | Cliente al día | **P2** |
| 31 | 1004 C | C | Ludis Gonzalez Lopez | Efrén Sanchez | 2.Reservado | 2025-10-15 | Q1,950.00 | Q3,000 | 1,500.00 | 1 | Vendido | Cliente Atrasado | **P2** |
| 32 | 1102 C | C | Zeus Anahel López Ojeda | Paula Hernandez | 4.Plan de Pagos | 2025-11-15 | Q3,000.00 | Q3,000 | 2,232.00 | 0 | Vendido | Cliente al día | **P2** |
| 33 | 1202 C | C | Doneli Abraham Molineros Mijangos | José Gutierrez | 4.Plan de Pagos | 2025-11-15 | Q2,232.00 | Q3,000 | 2,232.00 | 5 | Vendido | Cliente al día | **P2** |
| 34 | 1203 C | C | Dulce Maria Molineros Mijangos | José Gutierrez | 4.Plan de Pagos | 2025-11-15 | Q2,232.00 | Q3,000 | 2,232.00 | 5 | Vendido | Cliente al día | **P2** |
| 35 | 1208 C | C | Luis Fernando Piano Méndez | José Gutierrez | 4.Plan de Pagos | 2025-12-15 | Q2,320.00 | Q3,000 | 2,339.00 | 4 | Vendido | Cliente Atrasado | **P2** |
| 36 | 1303 C | C | Marlon Jeovanny Barillas Morales / Jose David Barillas Moral | Paula Hernandez | 4.Plan de Pagos | 2026-03-01 | Q2,135.00 | Q3,000 | 2,134.78 | 1 | Vendido | Cliente al día | **P2** |

---

## 6. Flags and Anomalies

### FLAG-C1: BLV5 Apto 1212 — Combined Phase 1 + Phase 2 Payment ✓ RESOLVED

| Source | Client | Amount | Type |
|--------|--------|--------|------|
| CIERRE_RESERVAS_ABRIL.xlsx (Row 18) | Erick Orlando Barrios Navas | Q10,000 | Monto de Reserva Pactado (Phase 1) |
| CIERRE_COBROS_ABRIL.xlsx (April col) | Erick Orlando Barrios Navas | Q50,000 | April payment = Phase 1 + Phase 2 combined |

**Resolution:** Q50,000 = Q10,000 (reservation, Phase 1) + Q40,000 (first installment, Phase 2). The COBROS cell records the combined total collected in April for this unit.
- Phase 1 (Q10,000): already inserted via migration 061 as `payment_type='reservation'`. Do not re-insert.
- Phase 2 (Q40,000): insert as `payment_type='down_payment'`, `payment_date='2026-04-30'`.

**ETL Action:** Insert Q40,000 as Phase 2 down_payment. Skip the Q10,000 reservation (already in DB).

### FLAG-C2: BLV5 Apto 1116 — Reservation Amount Correction Required ✓ RESOLVED

| Source | Client | Amount | Type |
|--------|--------|--------|------|
| CIERRE_RESERVAS_ABRIL.xlsx (Row 21) | Ingrid Lissette Robles Villatoro | Q5,000 | Monto de Reserva Pactado — **incorrect** |
| CIERRE_COBROS_ABRIL.xlsx (April col) | Ingrid Lissette Robles Villatoro | Q10,000 | April payment — **correct** |

**Resolution (confirmed by Pati):**
- Apto 1116 desistimiento by Francisco Javier Arriaza Reyes on 2026-04-17.
- New sale on 2026-04-17 to Ingrid Lissette Robles Villatoro. She paid Q10,000 reservation (standard B5 reserva). Only the reservation was paid in April — no Phase 2 installment.
- CIERRE_RESERVAS_ABRIL.xlsx had Q5,000 as Monto de Reserva Pactado — this was incorrect. Q10,000 is the correct amount.
- Migration 061 inserted the reservation payment as Q5,000 — **this must be corrected in DB before COBROS import.**

**Required DB corrections (pre-import migration):**
1. Confirm Francisco Javier Arriaza Reyes' prior sale on Apto 1116 is `status='cancelled'` in DB. If not cancelled by migration 061's preamble, cancel it now.
2. `UPDATE payments SET amount = 10000 WHERE sale_id = '<ingrid_1116_sale_id>' AND payment_type = 'reservation' AND amount = 5000;`

**ETL Action for COBROS import:** No Phase 2 insert for Apto 1116. The Q10,000 is the Phase 1 reservation — it already exists in DB (after the correction above). Do not re-insert.

### FLAG-C3: BNT Apto 210 TC — Re-sell / Date Correction ✓ RESOLVED

**Resolution (confirmed by Pati):**
- Karen Elizabeth Barahona Escobar reserved February 2026, desisted 2026-04-15. Her sale was already `status='cancelled'` in DB.
- New sale to Karol del Rosario Mayen Gutierrez on **2026-05-04** (NOT 2026-04-30 as in CIERRE_RESERVAS). Q1,500 reservation paid May 4.
- Migration 061 had inserted Karol's sale with the wrong date (2026-04-30 from RESERVAS SSOT). Corrected by migration 064.

**DB corrections applied (migration 064):**
1. `sales.sale_date` + `sales.promise_signed_date` → `2026-05-04` for sale `4ce108e3-6b10-4ff5-9bbc-acc07d472c49`
2. `payments.payment_date` → `2026-05-04` for payment `b4d71f9c-9439-4c74-8a30-d8f06b38d513`
3. Commissions recalculated.

**ETL Action for COBROS April import:**
- Karen's Q1,482 in COBROS April: on a cancelled sale — **do not import**.
- Karol's Q1,500 reservation: paid May 4 — **not in April scope**. Will appear in May COBROS import.

### FLAG-C4: BNT Apto 305 — Torre Correction ✓ RESOLVED

**Resolution (confirmed by Pati):** Torre D is correct. Migration 061 inserted the sale with `unit_id` pointing to 305-C in error.

**DB correction applied (migration 064):**
- `sales.unit_id` updated from `019c967f-2fc7-76b1-8229-ce2b8ac60e7b` (305-C) → `019c967f-2fcb-7834-a425-5309f2cf56cb` (305-D) for sale `2923fcb4-1a80-4515-9680-e54cc0189dd2`.
- Commissions recalculated.

**ETL Action for COBROS April import:** Q1,500 in COBROS April = Phase 1 reservation, already in DB on the corrected 305-D sale. Do not re-insert.

### FLAG-C5: BNT Apto 511 TC — Amount Discrepancy (non-blocking, informational)

| Source | Client | Amount |
|--------|--------|--------|
| CIERRE_RESERVAS_ABRIL.xlsx (Row 13) | Marcos Javier Gatica Paz | Q1,500 (Monto de Reserva) |
| CIERRE_COBROS_ABRIL.xlsx | Marcos Javier Gatica Paz | Q2,848 |

The April payment in COBROS (Q2,848) is ~1.9× the agreed reserva (Q1,500). This may represent reserva + partial first installment paid together, OR an irregular payment amount. The Phase 1 reservation (Q1,500) was already inserted in migration 061.
**Action for import:** Insert Q2,848 as `payment_type='down_payment'` in Phase 2. The Q1,500 reservation was already inserted via migration 061. Do not double-insert reservation.
**Verify:** `SELECT * FROM payments WHERE sale_id = '<511TC_sale_id>'`.

### FLAG-C6: BLT Apto 1103 TC — Prior Desistimiento / Phase 1 Confirmed ✓ RESOLVED

**Resolution (confirmed by Pati):**
- Prior client: Oscar Roberto Alejandro Valle Mayorga / Joselyne Jazmin Sicaja Chicas. Desisted. Sale already `cancelled` in DB as of 2026-02-25. No date of desistimiento was recorded.
- New sale: Luis Alfredo Ortiz Ajualip / Paula Hernandez / 2026-04-30. Q3,000 reservation confirmed collected April 30.
- DB state is correct: `sale_id = cf28cad1`, `status = active`, `payment = Q3,000 / 2026-04-30 / reservation`. No action required.
- COBROS file missing this entry = data entry gap on Pati's side. Not a DB issue.

**ETL Action for COBROS April import:** Q3,000 = Phase 1 reservation, already in DB from migration 061. Do not re-insert.

**⚠ FLAG-C6-SUB: Oscar Valle desistimiento date — AUDIT TRAIL INCOMPLETE (non-blocking)**
Sale `019c9689-c7a9-7703-8f73-af7f0a01b171` (Oscar Roberto Alejandro Valle Mayorga / Joselyne Jazmin Sicaja Chicas) is `cancelled` in DB as of `updated_at = 2026-02-25`. No formal desistimiento date was recorded.
**Pati did not receive the necessary information to establish this date. The information is not available from the SSOT.**
This does not affect the April COBROS import — the cancellation predates April. However, the audit trail for this desistimiento is incomplete.
**Escalation required:** Identify source of cancellation (salesperson, management, or legal file) to establish the actual desistimiento date. Once confirmed, record it on the cancelled sale.

### FLAG-C7: BLV5 Apto 502 — Large Unusual Payment ⚠ Review Required

Status: `2.Reserva` | ResDate: 2026-03-03 | Precio: Q0 | Enganche: Q0 | April payment: **Q140,000**
Vendedor: Erwin Cardona | Cliente: Mauricio Adolfo Rodriguez
The precio and enganche fields are Q0, yet a Q140,000 payment appears in April. This is likely a bulk/advance down-payment or a bank disbursement recorded against this entry. The large amount with zero precio is anomalous.
**Action:** Verify with Pati whether this is a Phase 2 down payment, an error, or a bank disbursement (Phase 3).

### FLAG-C8: BLV5 Apto 109 — Very Large Payment (informational)

Apto 109 / Laura Elisa Ovalle González / Antonio Rada / ResDate 2024-06-28 / April payment: **Q1,100,004.00**
Status: 4.Plan de pagos | StCli: Superávit de Enganche | CPag: 18
This appears to be a large lump-sum payoff completing the enganche or early escritura payment. The `Superávit de Enganche` status confirms collections exceed the agreed enganche.
**Action:** Classify as Phase 2 (`down_payment`). Verify no Phase 3 trigger is warranted (check if `deed_signed_date` / `bank_disbursement_date` is set on this sale).

### FLAG-C9: BLV5 Apto 113 — Micro Payment (informational)

Apto 113 / Rodrigo Rodas Pazos / Antonio Rada / April payment: **Q6.24**
CPact: Q470,006.04 | CPag: 1. This Q6.24 appears to be a rounding artifact from a prior irregular payment schedule, not a meaningful payment.
**Action:** Import as Phase 2 with the exact amount. Do not round or discard.

### FLAG-C10: BLV5 — 5 New April Sales in COBROS with Status `2.Reserva` and Precio=0

The following April 2026 new sales (from CIERRE_RESERVAS) appear in COBROS with `Precio de Venta = 0` and `Enganche = 0`. This is normal: COBROS entries for newly added sales are incomplete — price/enganche/cuota fields are populated gradually:

| Apto | Cliente | Vendedor | ResDate | April Pmt |
|------|---------|----------|---------|----------|
| 614 | Ruben Ivan España Marroquín | Erwin Cardona | 2026-04-19 | Q10,000 |
| 919 | Edwin Ernesto Ovalle Barrios | Erwin Cardona | 2026-04-10 | Q10,000 |
| 1001 | Carlos Ramón Chajón Aceituno | Erwin Cardona | 2026-04-17 | Q10,000 |
| 1016 | Diego Alejandro Barreno González | Erwin Cardona | 2026-04-21 | Q10,000 |
| 1116 | Ingrid Lissette Robles Villatoro | Erwin Cardona | 2026-04-17 | Q10,000 ⚠ |
| 1212 | Erick Orlando Barrios Navas | Erwin Cardona | 2026-04-21 | Q50,000 ⚠ |

⚠ = flagged individually above (FLAGS C1, C2). All others: reservation payments already exist in DB from migration 061 (Phase D). Do not double-insert.

### FLAG-C12: 4 Units with No Active Sale — Excluded from Migration 065 ⚠ Investigate

Pre-import DB check (migration 065 pre-check) found 4 COBROS units with no active `sales` record. These cannot receive a Phase 2 payment insert. All 4 have `unit_id` present in the DB but no corresponding non-cancelled sale.

| Project | Unit | Cliente (COBROS) | FechaRes | April Pmt | DB State |
|---------|------|-----------------|----------|-----------|----------|
| Boulevard 5 | 718 | Luis Alexander Valencia Méndez | 2025-11-09 | Q13,500.00 | No sale record at all |
| Benestare | 207-C | Sergio Estuardo Fuentes López | 2026-02-20 | Q1,300.00 | No sale record at all |
| Benestare | 505-A | Katherine Andrea Aceytuno Herrera / Denis Alexander Gabriel | 2026-02-28 | Q2,558.00 | No sale record at all |
| Bosque Las Tapias | 806-C | Melany Eulalia López Martínez | 2026-02-24 | Q1,500.00 | Only a cancelled sale (2025-08-31) — new sale not in DB |

**ETL Action for migration 065:** These 4 rows are **excluded**. Migration inserts 223 rows (not 227).

**Required follow-up:** For each unit, confirm with Pati whether:
1. The sale record was never imported (prior migration gap)
2. The sale was imported under a different unit_id
3. The sale should be created fresh

Once the 4 missing sales are inserted, a follow-up migration must insert the Phase 2 payments for those units.

### FLAG-C11: Vendedor Name Normalization (informational)

COBROS uses abbreviated vendedor names that differ from `salespeople.full_name` in the DB:

| COBROS Name | DB Full Name | DB UUID (expected) |
|-------------|-------------|-------------------|
| Eder Veliz / Eder Daniel V. | Daniel Veliz (Eder Daniel Veliz) | same person |
| Iván Castillo | Ivan Castillo | same person |
| Rony Ramírez | Rony Ramirez | same person (accent variant) |
| Pablo Marroquín | Pablo Marroquin | same person (accent variant) |
| Antonio Rada | Antonio Rada | same |
| Paula Hernandez | Paula Hernandez | same |
| José Gutierrez | Jose Gutierrez | same (offboarded 2026-04-21) |
| Erwin Cardona | Erwin Cardona | same |
| Brenda Búcaro | Brenda Búcaro | same |
| Sofia Paredes | Sofia Paredes | same |
| Laura Molina | Laura Molina | same |
| Diana Alvarez | Diana Alvarez | same |
| Anahí Cisneros | Anahi Cisneros | same |
| José Franco | Jose Franco | same |
| Pedro Pablo Sarti | Pedro P. Sarti | same |
| Efrén Sanchez | Efren Sanchez | same |

**Rule:** Do not match vendedor names from COBROS to `salespeople` for Phase 2 payment insert. The `sale_id` already contains the correct `sales_rep_id`. Sales rep names in COBROS are reference only.

---

## 7. ETL Scope Summary

### In Scope: April 2026 Payments for Import

| Project | Phase 2 rows | AMB/P1 excluded | Missing sale (FLAG-C12) | Effective P2 inserts | Total units |
|---------|-------------|-----------------|------------------------|---------------------|-------------|
| Boulevard 5 | 100 | 6 (AMB) | 1 (unit 718) | **100** (99 P2 + 1212 Q40k) | 106 |
| Benestare (BNT) | 92 | 10 (AMB/P1) | 2 (207-C, 505-A) | **90** | 103 |
| Bosque Las Tapias (BLT) | 34 | 2 (AMB) | 1 (806-C) | **33** | 36 |
| **Total** | **226** | **18** | **4** | **223** | **245** |

> **Migration 065 scope: 223 inserts.** 4 units excluded due to missing sale records (FLAG-C12). Follow-up migration required after missing sales are created.

### Out of Scope

| Item | Reason |
|------|--------|
| SANTA ELISA sheet — all units | Legacy/inactive sheet for Casa Elisa project (near sold-out). No April 2026 column. Not in import scope. |
| All non-canonical sheets (22 sheets) | Legacy, budget, alert, summary — not source data. |
| Phase 1 rows already in DB | Reservation payments inserted via migration 061 (Phase D). Do not re-insert. |
| Rows with STATUS = 1.Disponible | No active sale. |
| Rows with STATUS = Desistimiento | Cancelled. |
| FLAG-C1 BLV5 1212: Phase 1 portion (Q10,000) | Already in DB as reservation from migration 061. Import only the Phase 2 portion (Q40,000). |
| FLAG-C2 BLV5 1116: Q10,000 in COBROS | Phase 1 reservation (correct amount). Do not import as Phase 2. DB correction required first (see FLAG-C2). |
| FLAG-C3 BNT 210 TC: Q1,482 (Karen, cancelled) | Excluded — on a cancelled sale. |
| FLAG-C4 BNT 305: Q1,500 | Phase 1 reservation, already in DB on corrected 305-D sale. Do not re-insert. |
| FLAG-C12: B5 718, BNT 207-C, BNT 505-A, BLT 806-C | No active sale record in DB. Cannot link Phase 2 payment. Excluded from migration 065. Follow-up required. |

---

## 8. Cross-Reference: CIERRE_RESERVAS_ABRIL vs CIERRE_COBROS_ABRIL

April 2026 new sales from CIERRE_RESERVAS_ABRIL.xlsx (21 active records from migration 061):

| Project | Apto | Torre | Cliente (RESERVAS) | Cliente (COBROS) | Phase 1 Amt (RESERVAS) | April Pmt (COBROS) | Status |
|---------|------|-------|-------------------|-----------------|----------------------|-------------------|--------|
| BNT | 210 | C | Karol del Rosario Mayen Gutierrez | Karen Elizabeth Barahona Escobar | Q1,500 | Q1,482 | ✓ FLAG-C3 RESOLVED — re-sell. Karen cancelled. Karol's sale → 2026-05-04. Q1,482 excluded (cancelled sale). |
| BNT | 103 | A | Carlos Francisco Mejia Payes | Carlos Francisco Mejía Payes | Q1,500 | Q1,500 | ✓ |
| BNT | 309 | C | Enma Aracely Tista Jimenez | Enma Aracely Tista Jiménez | Q1,500 | Q1,500 | ✓ |
| BNT | 105 | D | Belia Ester Velasquez Castillo | Belia Ester Velásquez Castillo de López | Q1,500 | Q1,500 | ✓ |
| BNT | 202 | B | Diego Francisco Culajay Sic | Diego Francisco Culajay Sic | Q1,500 | Q1,500 | ✓ Phase 1 exact match |
| BNT | 313 | B | Sussan Iveth Molina Zuncar | Sussan Iveth Molina Zuncar | Q1,500 | Q1,500 | ✓ |
| BNT | 401 | D | Diego Reynoso (stripped) | Diego Yhorsmani Zuñiga Reynoso | Q1,500 | Q1,500 | ✓ Full legal name in COBROS |
| BNT | 302 | D | Jose Manuel Elias Recinos | José Manuel Elias Recinos | Q1,500 | Q1,500 | ✓ |
| BNT | 505 | D | Andri Sarai Cinto Lopez | Andri Sarai Cinto Lopez | Q1,500 | Q1,500 | ✓ |
| BNT | 202 | A | Jorge Mario López Gonzalez | Jorge Mario López Gonzalez | Q1,500 | Q1,500 | ✓ |
| BNT | 305 | D | Manuel Bolom Yaxcal | Manuel Bolom Yaxcal | Q1,500 | Q1,500 | ✓ FLAG-C4 RESOLVED — torre corrected to D in DB (migration 064). Q1,500 = Phase 1, already in DB. |
| BNT | 511 | C | Marcos Javier Gatica Paz | Marcos Javier Gatica Paz | Q1,500 | Q2,848 | ⚠ FLAG-C6 — pmt > reserva |
| BLT | 1103 | C | Luis Alfredo Ortiz Ajualip | NOT FOUND in COBROS | Q3,000 | Q— | ✓ FLAG-C6 RESOLVED — Q3,000 collected April 30, in DB from migration 061. COBROS data entry gap only. |
| BLT | 1208 | B | Abner Josué Pérez Monterroso y Joy Nicole Gol | Abner Josué Pérez Monterroso / Joy Nicole Gol | Q3,000 | Q3,000 | ✓ |
| BLT | 508 | B | Andrea Sarahi Alvarez Solorzano y Christian A | Andrea Sarahí Solórzano Alvarez / Christian A | Q3,000 | Q3,000 | ✓ (ResDate=None in COBROS) |
| BLT | 1007 | B | Joel Enrique Mayen Anavisca | Joel Enrique Mayen Anavisca | Q3,000 | Q3,000 | ✓ (promise_signed_date=NULL) |
| BLV5 | 1016 | — | Diego Alejandro Barreno González | Diego Alejandro Barreno González | Q10,000 | Q10,000 | ✓ |
| BLV5 | 1212 | — | Erick Orlando Barrios Navas | Erick Orlando Barrios Navas | Q10,000 | Q50,000 | ✓ FLAG-C1 RESOLVED — Q10k reserva (Phase 1, in DB) + Q40k Phase 2 installment |
| BLV5 | 614 | — | Ruben Ivan España Marroquín | Ruben Ivan España Marroquín | Q10,000 | Q10,000 | ✓ |
| BLV5 | 1001 | — | Carlos Roberto Sandoval Najera / Carlos Ramón | Carlos Ramón Chajón Aceituno | Q10,000 | Q10,000 | ✓ |
| BLV5 | 1116 | — | Ingrid Lissette Robles Villatoro | Ingrid Lissette Robles Villatoro | Q5,000 | Q10,000 | ⚠ FLAG-C3 — Q10k vs Q5k |
| BLV5 | 919 | — | Edwin Ernesto Ovalle Barrios | Edwin Ernesto Ovalle Barrios | Q10,000 | Q10,000 | ✓ |

---

## 9. Open Questions (Blocking)

| # | Question | Source Flag | Who Resolves | Blocks |
|---|----------|------------|--------------|--------|
> **All blocking questions resolved.**

> **Resolved:**
> - ~~Q: BLV5 Apto 1212 — Q50,000 discrepancy~~ → RESOLVED. Q50,000 = Q10,000 reserva (Phase 1, in DB) + Q40,000 Phase 2 installment.
> - ~~Q: BLV5 Apto 1116 — Q10,000 vs Q5,000~~ → RESOLVED. Q10,000 is correct. Migration 063 corrected DB.
> - ~~Q: BNT Apto 210 TC — client mismatch~~ → RESOLVED. Re-sell. Karen cancelled. Karol's sale/payment corrected to 2026-05-04 (migration 064).
> - ~~Q: BNT Apto 305 — Torre C vs D~~ → RESOLVED. Torre D confirmed. unit_id corrected in DB (migration 064).
> - ~~Q: BLT Apto 1103 TC — Q3,000 collected in April?~~ → RESOLVED. Q3,000 collected April 30, correctly in DB from migration 061. COBROS data entry gap only.

> **Non-blocking open item:**
> - FLAG-C6-SUB: Oscar Valle (BLT 1103-C) desistimiento date — Pati did not receive this information. Source not available. **Escalation required** to establish actual date for audit trail. Does not block COBROS import.

> **Non-blocking questions (proceed with import for unaffected rows):**
> - BLV5 Apto 502 — is the Q140,000 a Phase 2 down payment or Phase 3 bank disbursement? (FLAG-C7)
> - BNT Apto 511 TC — confirm Q2,848 is the correct total collected (reserva Q1,500 + extra Q1,348). Do not double-insert the Q1,500 already in DB. (FLAG-C5)
> - FLAG-C12: B5 718, BNT 207-C, BNT 505-A, BLT 806-C — 4 units excluded from migration 065 due to missing sale records. Pati must confirm whether these sales were ever imported, and if so, under which sale_id. Once resolved, a follow-up migration must insert the 4 Phase 2 payments.

---

## 10. SOP Reference

This file is processed under **SOP: Monthly COBROS Reconciliation** (`docs/SOP-monthly-cobros-reconciliation.md`).
The companion RESERVAS ETL is covered in `docs/SOP-monthly-commission-etl.md`.

**Key related files:**

| File | Purpose |
|------|---------|
| `docs/manifest-CIERRE_RESERVAS_ABRIL.md` | April 2026 new sales manifest (already imported, migration 061) |
| `docs/reconciliation-phase2-plan.md` | Phase 2 reconciliation design doc (March baseline) |
| `scripts/migrations/061_april_2026_sales_import.sql` | Migration that inserted April new sales + Phase 1 payments |
| `public/metadata/commission-rules.json` | Commission rules and phase allocation |
