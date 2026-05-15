# Manifest: CIERRE_MARZO_RESERVAS.xlsx

**File:** `ComisionesMarzo/CIERRE_MARZO_RESERVAS.xlsx`
**Generated:** 2026-05-05
**Sheets:** 27 total

---

## Sheet Index

1. [RESUMEN GENERAL](#resumen_general) — 24 non-empty rows, 28 cols
2. [SANTA ELISA](#santa_elisa) — 107 non-empty rows, 65 cols
3. [SANTA ELISA PPTO](#santa_elisa_ppto) — 79 non-empty rows, 42 cols
4. [BOULEVARD 5](#boulevard_5) — 370 non-empty rows, 88 cols
5. [B5 PPTO](#b5_ppto) — 308 non-empty rows, 63 cols
6. [RESUMEN B5](#resumen_b5) — 12 non-empty rows, 34 cols
7. [B5 Alerta](#b5_alerta) — 271 non-empty rows, 21 cols
8. [BENES](#benes) — 133 non-empty rows, 64 cols
9. [BOULEVARD 5 orig.](#boulevard_5_orig) — 315 non-empty rows, 55 cols
10. [BENESTARE ](#benestare_) — 237 non-empty rows, 85 cols
11. [BENESTARE PPTO](#benestare_ppto) — 117 non-empty rows, 66 cols
12. [BL-TAPIAS](#bl-tapias) — 160 non-empty rows, 47 cols
13. [BL PPTO](#bl_ppto) — 124 non-empty rows, 91 cols
14. [Atrasados B5](#atrasados_b5) — 84 non-empty rows, 22 cols
15. [BENESTARE 2.0](#benestare_20) — 353 non-empty rows, 82 cols
16. [Hoja2](#hoja2) — 0 non-empty rows, 1 cols
17. [BNT PPTO 2.0](#bnt_ppto_20) — 286 non-empty rows, 95 cols
18. [RESUMEN BNT 2.0](#resumen_bnt_20) — 10 non-empty rows, 19 cols
19. [ALERTA BNT 2.0](#alerta_bnt_20) — 283 non-empty rows, 18 cols
20. [Atrasados Benestare](#atrasados_benestare) — 74 non-empty rows, 18 cols
21. [BL-TAPIAS 2.0](#bl-tapias_20) — 272 non-empty rows, 53 cols
22. [BL PPTO 2.0](#bl_ppto_20) — 241 non-empty rows, 94 cols
23. [RESUMEN BLT](#resumen_blt) — 12 non-empty rows, 34 cols
24. [ALERTA INDECAS 2.0](#alerta_indecas_20) — 239 non-empty rows, 14 cols
25. [Atrasados BLT](#atrasados_blt) — 28 non-empty rows, 14 cols
26. [Hoja1](#hoja1) — 0 non-empty rows, 1 cols
27. [PEND. BTARE](#pend_btare) — 66 non-empty rows, 13 cols

---
## 1. RESUMEN GENERAL

**Purpose:** Cross-project monthly and cumulative collections summary (all 4 projects). Used by Patty as executive overview of cash flow vs. budget per project.
**Non-empty rows:** 24 | **Max columns:** 28

### Column Headers (Row 7)

- **B**: Proyecto
- **C**: PPTO del mes
- **D**: Cobro del mes
- **E**: % de cobro del mes
- **F**: Ppto Acumulado
- **G**: Cobros Acumulados
- **H**: % de cobros acumulado
- **I**: Total cobros pendientes
- **K**: Efectivo acum. que se debió recibir
- **L**: Cobros por Efectuar (Casos Especiales / F&F)
- **M**: Cobros Netos Acumulados
- **O**: Cobros realizados
- **P**: Cobros Adicionales
- **R**: Saldo Conciliado
- **S**: Cobros por Efectuar (Clientes en Mora)
- **T**: Diferencia
- **V**: Cobros (Desistimientos)
- **W**: Devoluciones (Desistimientos)
- **Y**: (Faltante) / Sobrante en Flujo de Caja

### DB Mapping

| Column | DB Target |
|--------|-----------|
| Proyecto | `projects.name` |
| PPTO del mes | budget reference (external) |
| Cobro del mes | `SUM(payments.amount) WHERE payment_date IN current month` |
| % de cobro del mes | computed |
| Ppto Acumulado | budget reference (external) |
| Cobros Acumulados | `SUM(payments.amount)` to date |
| Total cobros pendientes | `SUM(sales.down_payment) - SUM(payments.amount)` |
| Cobros Netos Acumulados | net after F&F exclusions |
| Saldo Conciliado | reconciled balance |
| Cobros (Desistimientos) | `SUM(payments.amount) WHERE reservation_status='DESISTED'` |
| Devoluciones (Desistimientos) | refunds on desisted reservations |
| (Faltante)/Sobrante | net cash flow variance |

### All Data Rows

| Row | Data |
|-----|------|
| R2 | DESARROLLOS INMOBILIARIOS |
| R3 | RESUMEN DE COBROS POR PROYECTOS |
| R5 | Al mes de : | 2025-08-31 |
| R6 | ( + ) | ( - ) | ( + ) A | ( - ) B | ( = ) C | ( + ) D | ( - ) E | ( C ) - (D-E) | ( + ) | ( - ) |
| R7 | Proyecto | PPTO del mes | Cobro del mes | % de cobro del mes | Ppto Acumulado | Cobros Acumulados | % de cobros acumulado | Total cobros pendientes | Efectivo acum. que se debió recibir | Cobros por Efectuar (Casos Especiales / F&F) | Cobros Netos Acumulados | Cobros realizados | Cobros Adicionales | Saldo Conciliado | Cobros por Efectuar (Clientes en Mora) | Diferencia | Cobros (Desistimientos) | Devoluciones (Desistimientos) | (Faltante) / Sobrante en Flujo de Caja |
| R8 | Casa Elisa | 0 | 0 | 0 | 10097247.43 | 10097247.43 | 1 | 0 |
| R9 | Gran Jaguar | 2928753.3100000005 | 3054066.428 | 1.0427871878359052 | 23304293.15 | 35146561.10399999 | 1.5081582126424629 | -11842267.953999989 | 32232422.831838816 | 2013453.1788 | 30218969.653038815 | 35758699.10400001 | 6913200.084766199 | 1373470.633805003 | 1373464.593805001 | 6.040000002132729 | 1150323.1400000001 | 177175.45 | -400322.9438050029 |
| R10 | Chinautla | 105339.09000000001 | 101165.69000000002 | 0.9603812791623699 | 957782.2699999999 | 1509301.090000001 | 1.5758290138321325 | -551518.8200000011 | #NUM! | 0 | #NUM! | 841408.68 | #NUM! | #NUM! | #NUM! | #NUM! | 100416.23000000001 | #NUM! |
| R11 | Bosque Las T. | 50185.15 | 42771.38 | 0.8522716381240266 | 86544.37 | 553502.89 | 6.395596732635526 | -466958.52 | 159826.59 | 0 | 159826.59 | 553502.89 | 395176.30000000005 | 1500.000000000029 | 1507 | -6.999999999970896 | 47068.92 | 45568.91999999997 |
| R12 | 3084277.5500000003 | 3198003.4979999997 | 1.0368727995961322 | 34445867.22 | 47306612.51399999 | 1.3733610540811925 | -12860745.293999989 | #NUM! | 2013453.1788 | #NUM! | 37153610.67400001 | #NUM! | #NUM! | #NUM! | #NUM! | 1297808.29 | 177175.45 | #NUM! |
| R13 | -13855721.132799989 |
| R14 | Proyecto | Total Apartamentos | Cliente al día | Cliente atrasado | Disponible | Enganche completado | Superávit de Enganche | F&F |
| R15 | Casa Elisa | 75 | 0 | 11 | 1 | 17 | 46 | 0 |
| R16 | Gran Jaguar | 298 | 41 | 65 | 8 | 72 | 88 | 24 |
| R17 | Chinautla | 80 | 36 | 17 | 16 | 0 | 0 | 0 |
| R18 | Bosque Las T. | 116 | 53 | 4 | 60 | 0 | 0 | 0 |
| R19 | 569 | 130 | 97 | 85 | 89 | 134 | 24 |
| R22 | % de las cantidades |
| R23 | Proyecto | Total Apartamentos | Cliente al día | Cliente atrasado | Cliente Disponible | Enganche completado | Superávit de Enganche | F&F |
| R24 | Casa Elisa | 1 | 0 | 0.14666666666666667 | 0.013333333333333334 | 0.22666666666666666 | 0.6133333333333333 | 0 |
| R25 | Gran Jaguar | 1 | 0.13758389261744966 | 0.2181208053691275 | 0.026845637583892617 | 0.24161073825503357 | 0.2953020134228188 | 0.08053691275167785 |
| R26 | Chinautla | 1 | 0.45 | 0.2125 | 0.2 | 0 | 0 | 0 |
| R27 | Bosque Las T. | 1 | 0.45689655172413796 | 0.034482758620689655 | 0.5172413793103449 | 0 | 0 | 0 |
| R28 | 1 | 0.2611201110853969 | 0.15294255766412096 | 0.1893550875568927 | 0.11706935123042506 | 0.22715883668903802 | 0.020134228187919462 |

---
## 2. SANTA ELISA

**Purpose:** Santa Elisa (Casa Elisa) reservation and installment-collection master sheet. One row per unit. Active reservations rows 5–79, Desistimientos rows 85–100, Devolutions rows 103–107, totals row 108.
**Non-empty rows:** 107 | **Max columns:** 65

### Column Headers (Row 4)

- **B**: Apto
- **C**: Vendedor
- **D**: Cliente
- **E**: Reservado
- **F**: Tipo
- **G**: Cotizador
- **H**: Precio de Venta 
- **I**: Diferencia Cotizador vs PV
- **J**: Enganche
- **K**: Estatus
- **L**: 2022-06-30
- **M**: 2022-07-31
- **N**: 2022-08-31
- **O**: 2022-09-30
- **P**: 2022-10-31
- **Q**: 2022-11-30
- **R**: 2022-12-31
- **S**: 2023-01-31
- **T**: 2023-02-28
- **U**: 2023-03-31
- **V**: 2023-04-30
- **W**: 2023-05-31
- **X**: 2023-06-30
- **Y**: 2023-07-31
- **Z**: 2023-08-31
- **AA**: 2023-09-30
- **AB**: 2023-10-31
- **AC**: 2023-11-30
- **AD**: 2023-12-31
- **AE**: 2024-01-31
- **AF**: 2024-02-29
- **AG**: 2024-03-31
- **AH**: 2024-04-30
- **AI**: 2024-05-31
- **AJ**: 2024-06-30
- **AK**: 2024-07-31
- **AL**: 2024-08-31
- **AM**: 2024-09-30
- **AN**: 2024-10-31
- **AO**: 2024-11-30
- **AP**: 2024-12-31
- **AQ**: 2025-01-31
- **AR**: 2025-02-28
- **AS**: 2025-03-31
- **AT**: 2025-04-30
- **AU**: 2025-05-31
- **AV**: 2025-06-30
- **AW**: 2025-07-31
- **AX**: TOTAL COBROS Y RESERVAS
- **AY**: % Cobro
- **AZ**: SALDO PENDIENTE ENGANCHE
- **BA**: % Pendiente
- **BB**: Monto a Financiar por Banco
- **BC**: % a Financiar
- **BD**: Proyección de Cobros (S/ Modelo Financiero)
- **BE**: Variación modelo Finan. vs cobro real
- **BF**: Status inmueble
- **BG**: ESTATUS CLIENTE
- **BH**: Cuotas Pactadas
- **BI**: Cuotas Pagadas
- **BJ**: Cuotas Atrasadas

### DB Mapping

| Column Header | DB Target |
|---------------|-----------|
| Apto | `rv_units.unit_number` / `sales.unit_number` |
| Vendedor | `salespeople.name` |
| Cliente | `rv_clients.full_name` |
| Reservado | `reservations.created_at` |
| Tipo | `rv_units.unit_type` |
| Cotizador | reference price (not stored separately) |
| Precio de Venta | `sales.sale_price` |
| Diferencia Cotizador vs PV | computed: cotizador - sale_price |
| Enganche | `sales.down_payment` |
| Estatus | `rv_units.status` (rv_unit_status enum) |
| date columns (2022-06 … 2025-07) | `payments.payment_date` + `payments.amount` |
| TOTAL COBROS Y RESERVAS | `SUM(payments.amount)` |
| % Cobro | computed: collected / down_payment |
| SALDO PENDIENTE ENGANCHE | computed: down_payment - collected |
| Status inmueble | `rv_units.status` |
| ESTATUS CLIENTE | computed payment-status label |
| Cuotas Pactadas | `sales.cuotas_enganche` |
| Cuotas Pagadas | `COUNT(payments)` phase 2 |
| Cuotas Atrasadas | computed: expected_paid - actual_paid |

### Active Reservation Rows (R5–R79)

| Row | Unit | Type | Tower | Salesperson | Client | Date | Status | Price (GTQ) | Enganche (GTQ) |
|-----|------|------|-------|-------------|--------|------|--------|-------------|----------------|
| R5 | 101 | B1 | — | Noemi M. | Thelma Suyapa Aguilera Sanchez de Roca | 2022-08-24 | 4.PLAN DE PAGOS | 806000 | 80600 |
| R6 | 102 | B3 | — | Noemi M. | Cristina Estefanía Villagrán Marroquin | 2023-01-08 | 4.PLAN DE PAGOS | 814000 | 81400 |
| R7 | 103 | A4 | — | Paula H. | Chelsy Amarilis Orellana De León | 2022-11-30 | 4.PLAN DE PAGOS | 1265000 | 63300 |
| R8 | 104 | A2 | — | Eder Daniel V. | 	Ada Marcela Moscoso Lopez / Mostello | 2024-11-18 | 4.PLAN DE PAGOS | 1100200 | 55100 |
| R9 | 105 | C1 | — | Ricardo O. | Juan Pablo Matheu Morales | 2023-02-15 | 4.PLAN DE PAGOS | 639700 | 64000 |
| R10 | 201 | C2 | — | Paula H. | 	Hernan Benito Guerra Bardales | 2025-02-13 | 2.RESERVADO | 650000 | 650000 |
| R11 | 202 | A5 | — | Paula H. | Ángel Roberto Sic García/ANGEL EDUARDO SIC MORALES | 2024-04-16 | 4.PLAN DE PAGOS | 805400 | 100000 |
| R12 | 203 | A6 | — | Francisco S. | Ana Cristina Velásquez de Gómez | 2022-06-28 | 4.PLAN DE PAGOS | 840000 | 84000 |
| R13 | 204 | B2 | — | Paula H. | Alfonso Javier Miranda Ramon | 2024-03-25 | 4.PLAN DE PAGOS | 742700 | 37100 |
| R14 | 205 | B2 | — | Paula H. | Elfego Adonias Apen Son y Dany Alexis Gómez Ajuchán | 2023-08-14 | 4.PLAN DE PAGOS | 718200 | 73320 |
| R15 | 206 | A3 | — | Efren Sanchez | José Pablo Arana López | 2024-12-10 | 2.RESERVADO | 948800 | 47500 |
| R16 | 207 | A1 | — | Paula H. | Edwin Oswaldo Saenz Marroquin y Leslie Gabriela Senz | 2024-02-25 | 4.PLAN DE PAGOS | 769700 | 38500 |
| R17 | 208 | C2 | — |  |  |  | 1.DISPONIBLE | 650000 | 65000 |
| R18 | 301 | C2 | — | Noemi M. | Héctor Enrique Zacarias Illescas | 2023-03-11 | 4.PLAN DE PAGOS | 572700 | 58000 |
| R19 | 302 | A1 | — | Eder Veliz | Guilmar Renato Najarro Díaz | 2025-04-16 | 2. RESERVADO | 698000 | 200000 |
| R20 | 303 | A3 | — | Paula H. | Sofia Maricela Ozaeta Góngora de Vásquez y Samuel Alejandro Vásquez Maldonado | 2024-10-07 | 4.PLAN DE PAGOS | 960966 | 48066 |
| R21 | 304 | B2 | — | Ricardo O. | Luis Alfonso Ramirez Rivas | 2023-02-06 | 4.PLAN DE PAGOS | 655000 | 130000 |
| R22 | 305 | B2 | — | Ricardo O. | Carol Analí Ovalle Valladares | 2023-01-31 | 4.PLAN DE PAGOS | 655000 | 100000 |
| R23 | 306 | A3 | — | Antonio R | Lucy Rivas y Jefferson Daniel Mejía Jocol | 2024-12-06 | 4.PLAN DE PAGOS | 948800 | 47500 |
| R24 | 307 | A1 | — | Eder V. | Narda Guisela Guerrero Reyna | 2024-12-09 | 4.PLAN DE PAGOS | 810000 | 40500 |
| R25 | 308 | C2 | — | Paula H. | Rudy Antonio Hernández Ramos | 2024-12-27 | 4.PLAN DE PAGOS | 650000 | 34000 |
| R26 | 401 | C2 | — | Noemi M. | Héctor René Guzmán Morán | 2022-11-15 | 4.PLAN DE PAGOS | 547800 | 54780 |
| R27 | 402 | A1 | — | Paula H. | Luis Fernando Cifuentes Echeverria | 2023-07-18 | 4.PLAN DE PAGOS | 703900 | 70390 |
| R28 | 403 | A3 | — | Paula H. | José Carlos Sanchez Jimenez | 2025-04-14 | 2. RESERVADO | 948800 | 48242 |
| R29 | 404 | B2 | — | Ricardo O. | Nancy Andrea Ovalle Valladares | 2023-02-06 | 4.PLAN DE PAGOS | 655000 | 65500 |
| R30 | 405 | B2 | — | Noemi M. | Lester Eduardo Velasquez Dubon. | 2023-01-30 | 4.PLAN DE PAGOS | 655000 | 414500 |
| R31 | 406 | A3 | — | Paula H. | Gerson Merari Tubac Tepaz | 2024-11-29 | 4.PLAN DE PAGOS | 964442 | 49500 |
| R32 | 407 | A1 | — | Noemi M. | Desireé Castro Rodríguez | 2023-01-19 | 4.PLAN DE PAGOS | 680000 | 68000 |
| R33 | 408 | C2 | — | Lilian G. | Luis Mariano Calderón Ponce/JOSE VICENTE CALDERON | 2022-11-22 | 4.PLAN DE PAGOS | 547800 | 54780 |
| R34 | 501 | C2 | — | Noemi M. | Nery Gamaliel Santos Moscoso | 2022-09-16 | 4.PLAN DE PAGOS | 547000 | 54700 |
| R35 | 502 | A1 | — | Noemi M. | Carlos Jeffry López Esquivel | 2023-01-23 | 4.PLAN DE PAGOS | 688000 | 68800 |
| R36 | 503 | A3 | — | Paula H. | Enrique Virgilio Reyes | 2024-02-19 | 4.PLAN DE PAGOS | 989600 | 49500 |
| R37 | 504 | B2 | — | Lilian G. | Sindy Julissa Girón López | 2022-10-06 | 4.PLAN DE PAGOS | 665000 | 66500 |
| R38 | 505 | B2 | — | Eder V. | Narda Guisela Guerrero Reyna | 2024-11-18 | 4.PLAN DE PAGOS | 815000 | 40500 |
| R39 | 506 | A3 | — | Paula H. | Ingrid Karina De León López | 2024-06-18 | 4.PLAN DE PAGOS | 980170.9 | 47500 |
| R40 | 507 | A1 | — | Noemi M. | William Joselito de León Nimatuj | 2023-01-13 | 4.PLAN DE PAGOS | 690000 | 69000 |
| R41 | 508 | C2 | — | Paula H. | Rudy Antonio Hernandez Ramos | 2024-12-27 | 4.PLAN DE PAGOS | 660000 | 34000 |
| R42 | 601 | C2 | — | Francisco S. | Maria del Carmen Corado Morales | 2022-09-23 | 4.PLAN DE PAGOS | 498000 | 49800 |
| R43 | 602 | A1 | — | Francisco S. | Lucy Abigail Mendoza Fuentes | 2022-11-15 | 4.PLAN DE PAGOS | 698000 | 69800 |
| R44 | 603 | A3 | — | Francisco S. | Werny Jose Ortiz Alegria | 2024-11-18 | 4.PLAN DE PAGOS | 961882.4 | 80682.4 |
| R45 | 604 | B2 | — | Paula H. | Carlos Ovaldo Godinez y  Godinez | 2024-01-31 | 4.PLAN DE PAGOS | 747264 | 747264 |
| R46 | 605 | B2 | — | Antonio R | Lauriano Figueroa Del Cid | 2024-12-21 | 4.PLAN DE PAGOS | 665000 | 40900 |
| R47 | 606 | A3 | — | Paula H. | Irasema Dilian Magaña Muñoz | 2024-08-17 | 4.PLAN DE PAGOS | 989600 | 49400 |
| R48 | 607 | A1 | — | Noemi M. | Alex André Cruz Caal | 2022-10-25 | 4.PLAN DE PAGOS | 690000 | 676200 |
| R49 | 608 | C2 | — | Noemi M. | Kateryn Gabriela Quinon Reyes de Marroquin | 2022-08-28 | 4.PLAN DE PAGOS | 498000 | 49800 |
| R50 | 701 | C2 | — | Noemi M. | Rony Hanley Chalí Ramos | 2022-08-29 | 4.PLAN DE PAGOS | 498000 | 250000 |
| R51 | 702 | A1 | — | Noemi M. | Julio César Chávez Mancio | 2022-10-27 | 4.PLAN DE PAGOS | 698000 | 69800 |
| R52 | 703 | A3 | — | Paula H. | Irving Elías López Salguero | 2024-05-06 | 4.PLAN DE PAGOS | 896715.83 | 896715.83 |
| R53 | 704 | B2 | — | Lilian G. | Carlos Benjamín Salazar Batres | 2022-06-30 | 4.PLAN DE PAGOS | 665000 | 66500 |
| R54 | 705 | B2 | — | Lilian G. | Mario Giovanni Paz Ponti | 2022-07-08 | 4.PLAN DE PAGOS | 665000 | 66500 |
| R55 | 706 | A3 | — | Paula H. | Marlon Estuardo Cardona y Adriana Sofía Gutierrez | 2024-03-16 | 4.PLAN DE PAGOS | 900000 | 900000 |
| R56 | 707 | A1 | — | Noemi M. | Silvia Elizabeth Guevara Lucas | 2022-09-26 | 4.PLAN DE PAGOS | 697720 | 76720 |
| R57 | 708 | C2 | — | Noemi M. | Juan José Marroquín Rivera | 2022-08-28 | 4.PLAN DE PAGOS | 498000 | 49800 |
| R58 | 801 | C2 | — | Francisco S. | Nancy Maricela Velasquez Aguilar | 2022-06-27 | 4.PLAN DE PAGOS | 498000 | 49800 |
| R59 | 802 | A1 | — | Paula H. | Raúl Arturo De León Juarez | 2023-07-29 | 4.PLAN DE PAGOS | 789500 | 78950 |
| R60 | 803 | A3 | — | Paula H. | Rocio Celeste Archila Alfaro / Brian Javier Centeno Archila | 2024-12-04 | 4.PLAN DE PAGOS | 1004617.1 | 50317.1 |
| R61 | 804 | B2 | — | Paula H. | Pablo Javier Herrera Cabrera | 2024-02-26 | 4.PLAN DE PAGOS | 778400 | 38900 |
| R62 | 805 | B2 | — | Noemi M. | Ingrid Lorena Sajmolo Ruiz | 2023-04-01 | 4.PLAN DE PAGOS | 753900 | 75400 |
| R63 | 806 | A3 | — | Paula H. | Wilson Ariel Salvador Tomas | 2023-12-07 | 4.PLAN DE PAGOS | 990800 | 51600 |
| R64 | 807 | A1 | — | Antonio R | Walter Rolando Alvarado García y Ana Leticia Santos Calmo | 2025-01-15 | 4.PLAN DE PAGOS | 850000 | 250000 |
| R65 | 808 | C2 | — | Francisco S. | Mainor Alfredo Carias Culajay | 2022-07-29 | 4.PLAN DE PAGOS | 498000 | 49800 |
| R66 | 901 | C2 | — | Noemi M. | Misraim Antonio Osuna López | 2022-08-10 | 4.PLAN DE PAGOS | 498000 | 49800 |
| R67 | 902 | A1 | — | Paula H. | Danilo Otoniel Gomez Guzman | 2023-11-24 | 4.PLAN DE PAGOS | 788400 | 39500 |
| R68 | 903 | A3 | — | Paula H. | Rosybel Alheli Suchini | 2024-01-30 | 4.PLAN DE PAGOS | 1033420 | 200020 |
| R69 | 904 | B2 | — | Paula H. | Mario Domingo | 2024-05-22 | 4.PLAN DE PAGOS | 770000 | 770000 |
| R70 | 905 | B2 | — | Noemi M. | Xiomara Cristina Barrios Castellanos | 2023-03-07 | 4.PLAN DE PAGOS | 753900 | 75400 |
| R71 | 906 | A3 | — | Paula H. | Byron Victoriano Mazariegos Mejía | 2023-08-28 | 4.PLAN DE PAGOS | 1011600 | 101160 |
| R72 | 907 | A1 | — | Lilian G. | María Del Rocio Pinto Gómez de Liaño | 2022-11-25 | 4.PLAN DE PAGOS | 678182.1 | 678182.1 |
| R73 | 908 | C2 | — | Paula H. | Isaias Gabriele Barrios Orozco | 2025-04-13 | 2.RESERVADO | 498000 | 49800 |
| R74 | 1001 | C2 | — | Francisco S. | Jose Julio Grave Cos | 2022-07-18 | 4.PLAN DE PAGOS | 498000 | 49800 |
| R75 | 1002 | A1 | — | Noemi M. | Josue Othoniel Andrade de la Cruz | 2023-03-12 | 4.PLAN DE PAGOS | 788400 | 78900 |
| R76 | 1003 | A7 | — | Paula H. | Wendy Azucena Aguilar Chávez | 2024-11-30 | 4.PLAN DE PAGOS | 498000 | 63000 |
| R77 | L1 |  | — | Paula H. | Helbert Emmanuel Blanco Argueta | 2025-03-07 | 2.RESERVADO | 255060 | 25506 |
| R78 | L2 |  | — | Paula H. | Helbert Emmanuel Blanco Argueta | 2025-03-07 | 2.RESERVADO | 318960 | 31896 |
| R79 | L3 |  | — | Eder Veliz | Jorge Antonio Sanchez Sipaque | 2025-04-14 | 2.RESERVADO | 457740 | 92000 |

### Desistimientos Section (R84–R100)

| Row | Unit | Type | Tower | Salesperson | Client | Date | Status | Price (GTQ) | Enganche (GTQ) |
|-----|------|------|-------|-------------|--------|------|--------|-------------|----------------|
| R84 | **DESISTIMIENTOS HEADER** | | | | | | | |  |
| R85 | 302 | A1 | — | Noemi M. | Elizabeth Ramírez Rodríguez | 2022-10-12 | 4.PLAN DE PAGOS | 698000 | 166000 |
| R86 | 308 |  | — | Noemí Menendez | Oscar Sincal |  |  |  |  |
| R87 | 604 | B2 | — | Paula H. | Geovanni Chain | 2024-01-31 | 4.PLAN DE PAGOS |  | 66500 |
| R88 | 508 | C2 | — | Paula H. | Andrea Maria Calderon | 2024-05-26 | 4.PLAN DE PAGOS |  | 54780 |
| R89 | 606 | A3 | — | Paula H. | Wilby Miguel Batz  | 2024-04-02 | 4.PLAN DE PAGOS |  | 49400 |
| R90 | 605 | B2 | — | Noemi M. | Bruno Antonio Zeissig Pineda | 2022-08-05 | 4.PLAN DE PAGOS |  | 66500 |
| R91 | 508 | C2 | — | Paula H. | Ingrid Marisol Palacios Argueta / Jose Luis Enrique Rezzio Armas | 2024-05-26 | 4.PLAN DE PAGOS |  | 33000 |
| R92 | 908 | C2 | — | Francisco S. | Marta Eugenia Gálvez Alburez de Marroquín | 2022-08-30 | 4.PLAN DE PAGOS |  | 49800 |
| R93 | 307 | A1 | — | Noemi M. | Kimberly Mariel Lemus López | 2023-02-01 | 4.PLAN DE PAGOS |  | 68000 |
| R94 | 807 | A1 | — | Paula H. | Lourdes Lorena Reyes Fajardo y Glenda Marissela Cueva Serrano | 2024-08-10 | 4.PLAN DE PAGOS |  | 40645 |
| R95 | 403 | A3 | — | Efren Sanchez | Cristian David Pérez Maldonado | 2024-12-09 | 2.RESERVADO | 948800 | 48242 |
| R96 | 807 | A1 | — | Andrea G. | Eri Giovani Ibarra López | 2024-12-09 | 2.RESERVADO | 850000 | 85000 |
| R97 | 904 | B2 | — | Paula H. | Jose Adolfo Aguilar | 2024-05-22 | 4.PLAN DE PAGOS |  | 37700 |
| R98 | 1003 | A7 | — | Paula H. | Wendy Azucena Aguilar Chavez | 2024-12-23 | 1.DISPONIBLE | 498000 | 63000 |
| R99 | 1001 | C2 | — | Francisco S. | Jose Julio Grave Cos | 2022-07-18 | 4.PLAN DE PAGOS | 1132000 | 113200 |
| R100 | L3 |  | — | Eder Veliz | Rosibel Suchini Morales | 2025-02-21 | 2.RESERVADO | 457740 | 45774 |

### Devoluciones / Totals (R101–R108)

- R101: TOTAL COBROS DE DESESTIMIENTOS | 0 | 0 | 27673.91 | 13973.91304347826 | 50391.91304347826 | 20095.91304347826 | 17393.91304347826 | 21392.09304347826 | 29093.91304347826 | 20892.09 | 23618 | 12765.82 | 25341.91 | 21792.09 | 11942.91 | 7592.91 | 7592.91 | 7592.91 | 14611.36 | 7592.91 | 7592.91 | 12519 | 20466.34 | 23638.25 | 23392.98 | 9919 | 5000 | 0 | 0 | 2500 | 10000 | 0 | 5000 | 461379.86826086964
- R102: Devolución de aportaciones
- R103: 508 | Paula H. | Ingrid Marisol Palacios Argueta / Jose Luis Enrique Rezzio Armas | 11000 | 11000
- R104: 605 | Noemi M. | Bruno Antonio Zeissig Pineda | 67830 | 67830
- R105: 908 | Francisco S. | Marta Eugenia Gálvez Alburez de Marroquín | 37942.86 | 37942.86
- R106: 103 | Lilian G. | Juan Luis Pinto Gomez De Liaño | 2022-11-30 | A4 | 1265000 | 126500 | 4.PLAN DE PAGOS | 0 | 0 | 0 | 0 | 0 | 5000 | 0 | 6300 | 6300 | 12600 | 0 | 0 | 12600 | 0 | 0 | 18900 | 0 | 0 | 0 | 25200 | 0 | 0 | 18900 | 0 | 12600 | 0 | 0 | 8100 | 126500
- R107: TOTAL DE DEVOLUCIONES DE APORTACIONES | 0 | 0 | 0 | 0 | 0 | 5000 | 0 | 6300 | 6300 | 12600 | 0 | 0 | 12600 | 0 | 0 | 18900 | 0 | 0 | 0 | 25200 | 0 | 0 | 18900 | 11000 | 12600 | 0 | 0 | 0 | 113872.86 | 0 | 0 | 0 | 243272.86
- R108: TOTAL DE COBRO GENERAL | 15000 | 23326.54 | 62514.95 | 239828.95304347825 | 437000.78304347827 | 67926.51304347826 | 743701.0430434783 | 94312.69304347826 | 186395.78304347824 | 199288.37999999998 | 128027.34 | 124886.4 | 108120.95 | 150796.84 | 136578.95 | 107926.41 | 153693.41 | 110779.90000000001 | 157541.78999999998 | 102240.83 | 195624.62000000002 | 143810.25 | 207873.16999999998 | 1219629.9 | 331019.48 | 1040226.1 | 247643.52000000002 | 234338.83 | 294822.18 | 385665.9 | 15870255.048260871

---
## 3. SANTA ELISA PPTO

**Purpose:** Santa Elisa budgeted installment schedule (presupuesto) per unit per month. Monthly planned enganche installments for cash-flow forecasting.
**Non-empty rows:** 79 | **Max columns:** 42

### Column Headers (Row 4)

- **A**: Apto
- **B**: jun.22
- **C**: jul.22
- **D**: ago.22
- **E**: sep.22
- **F**: oct.22
- **G**: nov.22
- **H**: dic.22
- **I**: ene.23
- **J**: feb.23
- **K**: mar.23
- **L**: abr.23
- **M**: may.23
- **N**: jun.23
- **O**: jul.23
- **P**: ago.23
- **Q**: sep.23
- **R**: oct.23
- **S**: nov.23
- **T**: dic.23
- **U**: ene.24
- **V**: feb.24
- **W**: mar.24
- **X**: abr.24
- **Y**: may.24
- **Z**: jun.24
- **AA**: jul.24
- **AB**: ago.24
- **AC**: sep.24
- **AD**: oct.24
- **AE**: nov.24
- **AF**: dic.24
- **AG**: ene.25
- **AH**: feb.25
- **AI**: mar.25
- **AJ**: abr.25
- **AK**: may.25
- **AL**: jun.25
- **AM**: jul.25
- **AN**: TOTAL
- **AO**: PENDIENTE
- **AP**: COBRADO

### DB Mapping

| Column | DB Target |
|--------|-----------|
| Apto | `rv_units.unit_number` |
| Monthly date columns | budgeted `payments.amount` per month (presupuesto, not actuals) |
| TOTAL | `SUM(budgeted installments)` = `sales.down_payment` |
| PENDIENTE | `sales.down_payment - SUM(payments.amount)` |
| COBRADO | `SUM(payments.amount)` |

### All Data Rows (unit + key values only — full monthly grid omitted for brevity, see raw JSON)

| Row | Unit | Notes |
|-----|------|-------|
| R5 | 101 | 27 non-zero monthly values |
| R6 | 102 | 22 non-zero monthly values |
| R7 | 103 | 9 non-zero monthly values |
| R8 | 104 | 5 non-zero monthly values |
| R9 | 105 | 21 non-zero monthly values |
| R10 | 201 | 5 non-zero monthly values |
| R11 | 202 | 11 non-zero monthly values |
| R12 | 203 | 27 non-zero monthly values |
| R13 | 204 | 12 non-zero monthly values |
| R14 | 205 | 16 non-zero monthly values |
| R15 | 206 | 6 non-zero monthly values |
| R16 | 207 | 13 non-zero monthly values |
| R17 | 208 | 2 non-zero monthly values |
| R18 | 301 | 20 non-zero monthly values |
| R19 | 302 | 26 non-zero monthly values |
| R20 | 303 | 6 non-zero monthly values |
| R21 | 304 | 21 non-zero monthly values |
| R22 | 305 | 22 non-zero monthly values |
| R23 | 306 | 5 non-zero monthly values |
| R24 | 307 | 6 non-zero monthly values |
| R25 | 308 | 5 non-zero monthly values |
| R26 | 401 | 24 non-zero monthly values |
| R27 | 402 | 16 non-zero monthly values |
| R28 | 403 | 2 non-zero monthly values |
| R29 | 404 | 21 non-zero monthly values |
| R30 | 405 | 22 non-zero monthly values |
| R31 | 406 | 5 non-zero monthly values |
| R32 | 407 | 22 non-zero monthly values |
| R33 | 408 | 24 non-zero monthly values |
| R34 | 501 | 26 non-zero monthly values |
| R35 | 502 | 22 non-zero monthly values |
| R36 | 503 | 13 non-zero monthly values |
| R37 | 504 | 27 non-zero monthly values |
| R38 | 505 | 6 non-zero monthly values |
| R39 | 506 | 9 non-zero monthly values |
| R40 | 507 | 22 non-zero monthly values |
| R41 | 508 | 5 non-zero monthly values |
| R42 | 601 | 27 non-zero monthly values |
| R43 | 602 | 24 non-zero monthly values |
| R44 | 603 | 6 non-zero monthly values |
| R45 | 604 | 8 non-zero monthly values |
| R46 | 605 | 5 non-zero monthly values |
| R47 | 606 | 7 non-zero monthly values |
| R48 | 607 | 5 non-zero monthly values |
| R49 | 608 | 26 non-zero monthly values |
| R50 | 701 | 27 non-zero monthly values |
| R51 | 702 | 25 non-zero monthly values |
| R52 | 703 | 3 non-zero monthly values |
| R53 | 704 | 29 non-zero monthly values |
| R54 | 705 | 28 non-zero monthly values |
| R55 | 706 | 12 non-zero monthly values |
| R56 | 707 | 26 non-zero monthly values |
| R57 | 708 | 26 non-zero monthly values |
| R58 | 801 | 27 non-zero monthly values |
| R59 | 802 | 17 non-zero monthly values |
| R60 | 803 | 6 non-zero monthly values |
| R61 | 804 | 13 non-zero monthly values |
| R62 | 805 | 20 non-zero monthly values |
| R63 | 806 | 15 non-zero monthly values |
| R64 | 807 | 5 non-zero monthly values |
| R65 | 808 | 27 non-zero monthly values |
| R66 | 901 | 27 non-zero monthly values |
| R67 | 902 | 16 non-zero monthly values |
| R68 | 903 | 8 non-zero monthly values |
| R69 | 904 | 10 non-zero monthly values |
| R70 | 905 | 20 non-zero monthly values |
| R71 | 906 | 15 non-zero monthly values |
| R72 | 907 | 3 non-zero monthly values |
| R73 | 908 | 2 non-zero monthly values |
| R74 | 1001 | 27 non-zero monthly values |
| R75 | 1002 | 20 non-zero monthly values |
| R76 | 1003 | 6 non-zero monthly values |
| R77 | L1 | 2 non-zero monthly values |
| R78 | L2 | 2 non-zero monthly values |
| R79 | L3 | 2 non-zero monthly values |
| R80 |  | 36 non-zero monthly values |
| R81 |  | 37 non-zero monthly values |

---

## 4. BOULEVARD 5

**Purpose:** Boulevard 5 (Gran Jaguar) reservation and installment-collection master sheet. One row per unit. Active reservations rows 7+, Desistimientos section lower. Company: INMOBILIARIA EL GRAN JAGUAR, S.A. Date: 2026-03-31.
**Non-empty rows:** 370 | **Max columns:** 88

### Column Headers (Row 6)

- **B**: Apto.
- **C**: Tipo.
- **D**: Notas
- **E**: Vendedor
- **F**: Cliente
- **G**: Fecha Reserva
- **H**: Estatus
- **I**: Precio de Venta
- **J**: Enganche
- **K**: 2023-03-31
- **L**: 2023-04-30
- **M**: 2023-05-31
- **N**: 2023-06-30
- **O**: 2023-07-31
- **P**: 2023-08-31
- **Q**: 2023-09-30
- **R**: 2023-10-31
- **S**: 2023-11-30
- **T**: 2023-12-31
- **U**: 2024-01-31
- **V**: 2024-02-29
- **W**: 2024-03-31
- **X**: 2024-04-30
- **Y**: 2024-05-31
- **Z**: 2024-06-30
- **AA**: 2024-07-31
- **AB**: 2024-08-31
- **AC**: 2024-09-30
- **AD**: 2024-10-31
- **AE**: 2024-11-30
- **AF**: 2024-12-31
- **AG**: 2025-01-31
- **AH**: 2025-02-28
- **AI**: 2025-03-31
- **AJ**: 2025-04-30
- **AK**: 2025-05-31
- **AL**: 2025-06-30
- **AM**: 2025-07-31
- **AN**: 2025-08-31
- **AO**: 2025-09-30
- **AP**: 2025-10-31
- **AQ**: 2025-11-30
- **AR**: 2025-12-31
- **AS**: 2026-01-31
- **AT**: 2026-02-28
- **AU**: 2026-03-31
- **AV**: TOTAL ENGANCHES Y RESERVAS
- **AW**: % COBROS
- **AX**: SALDO PENDIENTE ENGANCHE
- **AY**: % PENDIENTE COBRO
- **AZ**: SALDO A FINANCIAR POR EL BANCO
- **BA**: % A FINANCIAR
- **BB**: Proyección de Cobros (S/ Modelo Financiero)
- **BC**: Status inmueble
- **BD**: ESTATUS CLIENTE
- **BE**: Cuotas Pactadas
- **BF**: Cuota de Enganche
- **BG**: Total cuotas pactadas
- **BH**: Monto de Reserva Pactado
- **BI**: Monto de Cuota Pactada
- **BJ**: Cuotas Pagadas
- **BK**: Cantidad de cuotas que deben estar pagadas por el cliente
- **BL**: Monto que debe estar cancelado a la fecha
- **BM**: Monto pagado de cuotas a la fecha
- **BN**: Enganche + Cuotas Extraordinarias Pagadas
- **BO**: Diferencia
- **BP**: Cobro adicional a lo pactado
- **BQ**: Cobro no realizado según lo pactado
- **BR**: Cuotas
- **BS**: Caso Especial / F&F
- **BT**: Observaciones

### DB Mapping

| Column | DB Target |
|--------|-----------|
| Apto. | `rv_units.unit_number` |
| Tipo. | `rv_units.unit_type` |
| Notas | `reservations.notes` |
| Vendedor | `salespeople.name` |
| Cliente | `rv_clients.full_name` |
| Fecha Reserva | `reservations.created_at` |
| Estatus | `rv_units.status` (rv_unit_status enum) |
| Precio de Venta | `sales.sale_price` |
| Enganche | `sales.down_payment` |
| Date columns (2023-03 … 2026-03) | `payments.payment_date` + `payments.amount` |
| TOTAL ENGANCHES Y RESERVAS | `SUM(payments.amount)` |
| SALDO PENDIENTE ENGANCHE | `sales.down_payment - SUM(payments.amount)` |
| SALDO A FINANCIAR POR EL BANCO | `sales.sale_price - sales.down_payment` |
| Status inmueble | `rv_units.status` |
| ESTATUS CLIENTE | computed payment-status label |
| Cuotas Pactadas | `sales.cuotas_enganche` |
| Monto de Reserva Pactado | `reservations.reserva_amount` |
| Monto de Cuota Pactada | computed installment |
| Cuotas Pagadas | `COUNT(payments)` phase 2 |
| Caso Especial / F&F | `rv_clients.is_ff` |
| Observaciones | `reservations.notes` |

### Active Reservation Rows (R7–R370)

| Row | Unit | Type | Notes | Salesperson | Client | Date | Status | Price (GTQ) | Enganche (GTQ) |
|-----|------|------|-------|-------------|--------|------|--------|-------------|----------------|
| R7 | 101 | A7.1 |  | Jose Franco | Karla Michelle Abril Valencia De Galicia / Diana Michelle Galicia Abril | 2023-03-27 | 4.Plan de pagos | 644800 | 64500 |
| R8 | 102 | B4.1 |  | Erwin Cardona | Irma Leticia Villatoro Bucaro | 2025-12-21 | 4.Plan de pagos | 1154100 | 230820 |
| R9 | 103 | E1.1 | F&F | Ronaldo | International Coffee Industry, S.A. | 2024-01-09 | 4.Plan de pagos | 1533200 | 153320 |
| R10 | 104 | A4.1 | ENGANCHE COMPLETADO SEGÚN PPTO | Antonio Rada | Jonathan José Morales Salazar | 2023-08-02 | 4.Plan de pagos | 727800 | 145600 |
| R11 | 105 | B7.1 |  |  |  |  | 1.Disponible | 1192700 | 83500 |
| R12 | 106 | B2.1 |  | Erwin Cardona | Claudia Ruth Marianella Paiz Herrera de Alvarez | 2025-12-22 | 4.Plan de pagos | 1348900 | 94423 |
| R13 | 107 | B6.1 |  | Erwin Cardona | Eder Omar Vásquez Chávez | 2026-03-10 | 2.Reserva | 0 | 0 |
| R14 | 108 | B1.1 |  | Jose Gutierrez | Amiagro, S.A. | 2026-03-25 | 2.Reserva | 0 | 0 |
| R15 | 109 | E2.1 | ENGANCHE COMPLETADO SEGÚN PPTO | Antonio Rada | Laura Elisa Ovalle González | 2024-06-28 | 4.Plan de pagos | 1486576 | 148676 |
| R16 | 110 | A2.1 | SUPERÁVIT SEGÚN PPTO | Antonio Rada | Karla Suzel Ruiz Sanchinelli de Alonzo / Pablo Rubén Alonzo de la Roca | 2023-06-11 | 4.Plan de pagos | 680900 | 68100 |
| R17 | 111 | A6.1 |  | Jose Franco | Jonathan José Morales Salazar / Ingrid Liseth Barillas López | 2023-03-27 | 4.Plan de pagos | 696700 | 69700 |
| R18 | 112 | A3.1 |  | Brenda Búcaro | Herbert Osiel Ramos Alfaro / Paula María Vásquez Cifuentes | 2023-03-21 | 4.Plan de pagos | 698900 | 69900 |
| R19 | 113 | C3.1 | ENGANCHE CANCELADO | Antonio Rada | Rodrigo Rodas Pazos | 2024-11-20 | 4.Plan de pagos | 1286306.04 | 480006.04 |
| R20 | 114 | C2.1 | F&F | Antonio Rada | Mauricio Arimany Monzón | 2023-03-27 | 4.Plan de pagos | 993625.74668 | 99425.75 |
| R21 | 201 | B7 |  | Jose Gutierrez | Ludwin José Leonel Calderón Ortiz | 2026-03-23 | 2.Reserva | 0 | 0 |
| R22 | 202 | B2 |  | Antonio Rada | Bella Rosana Chaveque González | 2025-03-20 | 4.Plan de pagos | 1321630.18875795 | 132230.19 |
| R23 | 203 | B6 |  | Erwin Cardona | Edlen Isaí Reyes Matus | 2026-03-19 | 2.Reserva | 0 | 0 |
| R24 | 204 | B1 | SUPERÁVIT SEGÚN PPTO | Antonio Rada | Paulette Leslie Wauthion Jimenez | 2024-10-31 | 4.Plan de pagos | 1015795 | 101595 |
| R25 | 205 | D7 |  | Sofia Paredes | Javier Adolfo Hernández León | 2025-02-18 | 4.Plan de pagos | 1364055.82322122 | 136455.82 |
| R26 | 206 | A9 |  |  |  |  | 1.Disponible | 1009200 | 70600 |
| R27 | 207 | C9 |  | Erwin Cardona | Fernando Rafael Soto Barrios | 2026-02-10 | 2.Reserva | 1509100 | 105600 |
| R28 | 208 | C8 |  | Erwin Cardona | Carlos Augusto Aguilar | 2026-03-05 | 2.Reserva | 0 | 0 |
| R29 | 209 | B4 | ENGANCHE CANCELADO | Antonio Rada | Igor Alejandro Salazar Zamora | 2025-06-30 | 4.Plan de pagos | 1315404.18 | 200104.18 |
| R30 | 210 | B3 |  | Laura Molina | Carlos Alejandro de León Samayoa | 2025-07-21 | 4.Plan de pagos | 1110148.31 | 111048.31 |
| R31 | 211 | E1 |  | Jose Gutierrez | Nery Aroldo Castañeda Cerna / Sara Beatriz Castro Tabalan de Castañeda | 2026-03-03 | 2.Reserva | 1615400 | 113100 |
| R32 | 212 | A4 | ENGANCHE COMPLETADO SEGÚN PPTO | Antonio Rada | Julio Eduardo Farnés Búcaro | 2023-11-14 | 4.Plan de pagos | 714937.5 | 71537.5 |
| R33 | 213 | A8 |  | Sofia Paredes | Carlos Humberto Rivera Carrillo  | 2025-02-07 | 4.Plan de pagos | 806418.743353334 | 80718.74 |
| R34 | 214 | A1 | ENGANCHE COMPLETADO SEGÚN PPTO | Antonio Rada | Jorge Daniel Baca Chiroy | 2023-11-29 | 4.Plan de pagos | 720472.5 | 72072.5 |
| R35 | 215 | C4 | SUPERÁVIT SEGÚN PPTO | Antonio Rada | Lidia Elizabeth Pocasangre Rac | 2024-03-02 | 4.Plan de pagos | 965900 | 96600 |
| R36 | 216 | C1 | ENGANCHE CANCELADO | Antonio Rada | Narvesters Gabriell Moreno Cedeño | 2024-03-09 | 4.Plan de pagos | 980700 | 98100 |
| R37 | 301 | C3 | ENGANCHE COMPLETADO SEGÚN PPTO | Antonio Rada | Jonathan Kiril Thomas Menkos Zeissig | 2024-07-21 | 4.Plan de pagos | 1273000 | 127300 |
| R38 | 302 | C2 |  | Anahí Cisneros | José Ignacio Ramírez Soto | 2025-08-29 | 4.Plan de pagos | 1455829.5 | 101929.9 |
| R39 | 303 | A6 |  | Antonio Rada | Pedro Antonio Gomar Chávez | 2025-11-27 | 2.Reserva | 946500 | 66300 |
| R40 | 304 | A3 |  | Antonio Rada | Ricardo Alberto Vásquez Monterroso | 2025-03-03 | 4.Plan de pagos | 833815.201016653 | 83415.2 |
| R41 | 305 | B7 |  | Antonio Rada | Josue Alejandro Arias Perez | 2025-04-01 | 4.Plan de pagos | 1112465.60916772 | 111265.61 |
| R42 | 306 | B2 |  | Anahí Cisneros | Ricardo José Ruiz Álvarez | 2026-01-11 | 4.Plan de pagos | 1106500 | 78000 |
| R43 | 307 | B6 |  | Jose Gutierrez | Selvin Antonio Rodriguez Parada | 2026-03-25 | 2.Reserva |  |  |
| R44 | 308 | B1 |  | Antonio Rada | Ricardo Alberto Vásquez Monterroso | 2025-03-03 | 4.Plan de pagos | 1032728.18978229 | 103328.19 |
| R45 | 309 | D7 |  | Antonio Rada | Leonel Bernardo Molina Gramajo | 2024-08-12 | 4.Plan de pagos | 1341690 | 135090 |
| R46 | 310 | A9 |  | Erwin Cardona | Fernando Javier Rosales Gramajo | 2025-12-09 | 2.Reserva | 1009200 | 70600 |
| R47 | 311 | C9 | ENGANCHE CANCELADO | Diana Alvarez | Miguel Angel Teletor Riz | 2024-09-27 | 4.Plan de pagos | 1391040 | 139140 |
| R48 | 312 | C8 |  | Antonio Rada | Freddy Alejandro Chinchilla Culajay | 2024-12-24 | 4.Plan de pagos | 1414462.31631225 | 141462.32 |
| R49 | 313 | B4 | ENGANCHE COMPLETADO SEGÚN PPTO | Antonio Rada | Leslly Franzoli Cortez Avila | 2024-05-07 | 4.Plan de pagos | 1087400 | 108800 |
| R50 | 314 | B3 |  | Laura Molina | Arcely Abigail Contreras Zuñiga | 2025-08-11 | 4.Plan de pagos | 1110148.31 | 77748.31 |
| R51 | 315 | E1 |  | Sofia Paredes | Lilian America Roldan Ochoa / Jocelyn Michelle Roldan | 2025-04-05 | 4.Plan de pagos | 1543626.97235174 | 154426.97 |
| R52 | 316 | A4 | SUPERÁVIT SEGÚN PPTO | Antonio Rada | Allan Omar Alvarado Vásquez | 2023-10-29 | 4.Plan de pagos | 708396.44 | 70896.44 |
| R53 | 317 | A8 | SUPERÁVIT SEGÚN PPTO | Antonio Rada | Antonio Meneses Hernández | 2023-11-28 | 4.Plan de pagos | 721087.5 | 72187.5 |
| R54 | 318 | A1 | ENGANCHE COMPLETADO SEGÚN PPTO | Antonio Rada | José Reynaldo Linares | 2023-11-12 | 4.Plan de pagos | 720472.5 | 72072.5 |
| R55 | 319 | C4 | SUPERÁVIT SEGÚN PPTO | Antonio Rada | Aarón Fabrizio Tello Mérida | 2024-02-18 | 4.Plan de pagos | 965900 | 96600 |
| R56 | 320 | C1 | ENGANCHE COMPLETADO SEGÚN PPTO | Antonio Rada | Santiago Taracena Puga | 2023-08-12 | 4.Plan de pagos | 980700 | 98100 |
| R57 | 401 | C3 | SUPERÁVIT SEGÚN PPTO | Antonio Rada | Sara Verónica Ortíz De León | 2024-01-29 | 4.Plan de pagos | 1153800 | 115400 |
| R58 | 402 | C2 | ENGANCHE COMPLETADO SEGÚN PPTO | Antonio Rada | Guillermo Vinicio Cotto Mux | 2023-12-03 | 4.Plan de pagos | 1151071.45 | 115171.45 |
| R59 | 403 | A6 |  |  |  |  | 1.Disponible | 699700 | 70000 |
| R60 | 404 | A3 | SUPERÁVIT SEGÚN PPTO | Brenda Búcaro | Gerson Andre Villatoro Urizar | 2023-10-31 | 4.Plan de pagos | 721100 | 72200 |
| R61 | 405 | B7 |  | Anahí Cisneros | Mario Saul Aragón Zepeda | 2025-12-04 | 4.Plan de pagos | 1115500 | 78400 |
| R62 | 406 | B2 |  | Antonio Rada | Andrea Joanna Hidalgo Mendizábal  | 2025-05-23 | 4.Plan de pagos | 1104447.58 | 110447.58 |
| R63 | 407 | B6 |  | Laura Molina | Alberto Antonio Arrecis Rosales | 2025-08-14 | 4.Plan de pagos | 1130414.71 | 80414.71 |
| R64 | 408 | B1 | PLAN DE PAGOS ESPECIAL | Antonio Rada | María Gabriela Chang Quan De Garcia | 2025-06-13 | 4.Plan de pagos | 883300 | 88400 |
| R65 | 409 | D7 | SUPERÁVIT SEGÚN PPTO | Antonio Rada | Rafael Leonidas Tabíc Borja | 2024-08-08 | 4.Plan de pagos | 1341690 | 134190 |
| R66 | 410 | A9 |  | Anahí Cisneros | Josue Ernesto Herrera Aguilar | 2025-07-11 | 4.Plan de pagos | 1194844.34 | 119544.43 |
| R67 | 411 | C9 |  | Anahí Cisneros | Sonia Elizabeth Gómez Méndez de García | 2025-12-13 | 4.Plan de pagos | 1370300 | 95921 |
| R68 | 412 | C8 |  | Anahí Cisneros | Silvia Rose Mary Monzón Paniagua | 2025-11-10 | 4.Plan de pagos | 1116400 | 78148 |
| R69 | 413 | B4 |  | Sofia Paredes | Cindy Carolina Toscano Mérida | 2025-01-31 | 4.Plan de pagos | 1063054.43589791 | 106354.43 |
| R70 | 414 | B3 | INCREMENTO DE ENGANCHE | Antonio Rada | Carolina Rivas Lé Sage De Alonzo | 2024-05-27 | 4.Plan de pagos | 887400 | 88800 |
| R71 | 415 | E1 |  | Anahí Cisneros | Kevin Mario Andrés Leal Morales / Flor de María Herrera Reyes de Gil | 2025-06-10 | 4.Plan de pagos | 1543626.97235174 | 231526.97 |
| R72 | 416 | A4 |  | Sofia Paredes | Carlos Humberto Rivera Carrillo  | 2025-02-07 | 4.Plan de pagos | 798331.19 | 79931.18 |
| R73 | 417 | A8 | ENGANCHE COMPLETADO SEGÚN PPTO | Antonio Rada | Miguel Angel Flores Linares | 2023-11-19 | 4.Plan de pagos | 721087.5 | 72187.5 |
| R74 | 418 | A1 |  | Antonio Rada | Antonio Vicente Tzep Tahay  | 2025-05-08 | 4.Plan de pagos | 750472.5 | 75072.5 |
| R75 | 419 | C4 | ENGANCHE COMPLETADO SEGÚN PPTO | Antonio Rada | Andrea Elizabeth Ortíz Pérez | 2023-11-01 | 4.Plan de pagos | 965900 | 96600 |
| R76 | 420 | C1 | ENGANCHE COMPLETADO SEGÚN PPTO | Antonio Rada | Rodriga Virginia Figueroa Pérez | 2024-07-17 | 4.Plan de pagos | 1166800 | 116700 |
| R77 | 501 | E9 |  | Sofia Paredes | Erick Guillermo Ruano Gatica | 2025-01-24 | 4.Plan de pagos | 1502549.44216114 | 150349.44 |
| R78 | 502 | E10 |  | Erwin Cardona | Mauricio Adolfo Rodriguez | 2026-03-03 | 2.Reserva | 0 | 0 |
| R79 | 503 | B4 |  | Antonio Rada | David Eduardo Orellana Rivera | 2025-05-21 | 4.Plan de pagos | 1047132 | 104732 |
| R80 | 504 | B3 |  | Antonio Rada | Jaquelyn Andrea España Siliezar | 2025-05-11 | 4.Plan de pagos | 1047132 | 104732 |
| R81 | 505 | D9 | SUPERÁVIT SEGÚN PPTO | Antonio Rada | Nancy Eugenia Cisneros Sánchez de Dávila | 2024-07-30 | 4.Plan de pagos | 1399667 | 139967 |
| R82 | 506 | D8 |  | Antonio Rada | Carlos Eduardo Miranda Morales / Nancy Patricia Medina Marín | 2024-10-15 | 4.Plan de pagos | 1379595 | 138595 |
| R83 | 507 | A12 | SUPERÁVIT SEGÚN PPTO | Antonio Rada | Osmin Otoniel Oliva Córdova | 2023-08-17 | 4.Plan de pagos | 722900 | 72300 |
| R84 | 508 | C6 | SUPERÁVIT SEGÚN PPTO | Antonio Rada | Evelyn Aída Samayoa San José / Liza María Samayoa San José | 2024-04-12 | 4.Plan de pagos | 1183693 | 118393 |
| R85 | 509 | C5 | SUPERÁVIT SEGÚN PPTO | Antonio Rada | Anabella Alburez Aja | 2024-06-30 | 4.Plan de pagos | 1181561.5 | 118161.5 |
| R86 | 510 | C6 |  | Antonio Rada | Francis Ayleen Funes Castellanos | 2024-03-01 | 4.Plan de pagos | 1183693 | 118393 |
| R87 | 511 | C5 | SUPERÁVIT SEGÚN PPTO | Antonio Rada | Hugo Leonel Roca Morales / Karen Andrea Guerra Lobos de Roca | 2024-06-27 | 4.Plan de pagos | 1181561.5 | 118161.5 |
| R88 | 512 | A8 | ENGANCHE COMPLETADO SEGÚN PPTO | Antonio Rada | Oscar Antonio González Hurtarte | 2023-07-18 | 4.Plan de pagos | 703500 | 70400 |
| R89 | 513 | A2 | SUPERÁVIT SEGÚN PPTO | Antonio Rada | María Fernanda Cabrera Valdez | 2023-07-16 | 4.Plan de pagos | 687500 | 68800 |
| R90 | 514 | E5 |  | Antonio Rada | Danya Maribel Callejas Hernandez De Herrera | 2025-03-25 | 4.Plan de pagos | 1535078.40525802 | 153578.41 |
| R91 | 515 | A5 | ENGANCHE COMPLETADO SEGÚN PPTO | Jose Franco | Ingrid Vanessa Granados Barnéond | 2023-03-27 | 4.Plan de pagos | 611949.496797804 | 61249.5 |
| R92 | 516 | B4 | SUPERÁVIT SEGÚN PPTO | Diana Alvarez | José Javier Sarceño Alfaro / Maria Rosana Rivera Gallardo | 2024-09-22 | 4.Plan de pagos | 1036610 | 103710 |
| R93 | 517 | B3 | SUPERÁVIT SEGÚN PPTO | Antonio Rada | Jorge Estuardo Díaz Durán Baldetti | 2024-05-13 | 4.Plan de pagos | 871162.12 | 87162.12 |
| R94 | 518 | E9 | SUPERÁVIT SEGÚN PPTO | Diana Alvarez | Karla Denisse Ariana Méndez Contreras | 2024-10-29 | 4.Plan de pagos | 1502549.44 | 150549.44 |
| R95 | 519 | E10 |  | Anahí Cisneros | Neftalí Hemanuel de León Recinos | 2025-08-29 | 4.Plan de pagos | 1600400 | 112100 |
| R96 | 601 | E9 | SUPERÁVIT SEGÚN PPTO | Diana Alvarez | Cedric Amilcar Rivera Fajardo | 2024-10-15 | 4.Plan de pagos | 1477912.8 | 147912.8 |
| R97 | 602 | E10 | ENGANCHE COMPLETADO SEGÚN PPTO | Anahí Cisneros | Wendy Lorena Caal García de Castellanos | 2025-08-27 | 4.Plan de pagos | 1610400 | 112800 |
| R98 | 603 | B4 | SUPERÁVIT SEGÚN PPTO | Antonio Rada | Mario José Márquez Rivera / Iveth Beltetón Castellanos de Márquez | 2024-04-02 | 4.Plan de pagos | 901400 | 90200 |
| R99 | 604 | B3 | SUPERÁVIT SEGÚN PPTO | Antonio Rada | Juan Sebastián Gaitán Serrano | 2024-04-29 | 4.Plan de pagos | 887400 | 88800 |
| R100 | 605 | D9 | ENGANCHE COMPLETADO SEGÚN PPTO | Antonio Rada | Mirna María Rosas Guerra | 2024-09-18 | 4.Plan de pagos | 1373505 | 137405 |
| R101 | 606 | D8 | SUPERÁVIT SEGÚN PPTO | Antonio Rada | Mar Frandi Solly Gramajo Hernández de Calderón | 2024-08-29 | 4.Plan de pagos | 1379595 | 137995 |
| R102 | 607 | A12 |  | Antonio Rada | Antony Williams Sajché Torres / Madelyn Kristina Sajché Torres | 2025-04-22 | 4.Plan de pagos | 771274 | 77174 |
| R103 | 608 | C6 | PLAN DE PAGOS ESPECIAL | Antonio Rada | Alfonso Videche Rodriguez | 2024-02-02 | 4.Plan de pagos | 1183693 | 118393 |
| R104 | 609 | C5 | SUPERÁVIT SEGÚN PPTO | Antonio Rada | Luis Augusto Franco López | 2024-05-22 | 4.Plan de pagos | 1181561.5 | 118161.5 |
| R105 | 610 | C6 | ENGANCHE COMPLETADO SEGÚN PPTO | Antonio Rada | Andrea Nathalia Molina Méndez de Velásquez | 2024-02-29 | 4.Plan de pagos | 1183693 | 118393 |
| R106 | 611 | C5 |  | Antonio Rada | Kenny Estuardo Garay Carías | 2025-06-27 | 4.Plan de pagos | 1381446.69875631 | 276346.7 |
| R107 | 612 | A8 |  | Antonio Rada | Yonatan Morgan Acajabón | 2025-09-06 | 4.Plan de pagos | 946600 | 66300 |
| R108 | 613 | A2 | SUPERÁVIT SEGÚN PPTO | Antonio Rada | Sergio Oswaldo Velásquez Moreno | 2023-07-19 | 4.Plan de pagos | 687500 | 68800 |
| R109 | 614 | E5 | SUPERÁVIT SEGÚN PPTO | Anahí Cisneros | Thalía  Raquel Carredano Tovar | 2025-08-08 | 4.Plan de pagos | 1586247.04 | 111037.29 |
| R110 | 615 | A5 | F&F | Antonio Rada | Maria De Los Angeles España Cordon | 2023-04-24 | 4.Plan de pagos | 611950.009005 | 61250.01 |
| R111 | 616 | B4 | SUPERÁVIT SEGÚN PPTO | Antonio Rada | Edwin Estuardo Acevedo Salguero | 2024-03-08 | 4.Plan de pagos | 901400 | 90200 |
| R112 | 617 | B3 | FALLECIMIENTO -  | Antonio Rada | Hans Christian Beeck Cazali | 2024-05-07 | 4.Plan de pagos | 887400 | 88800 |
| R113 | 618 | E9 |  | Antonio Rada | Sergio Adolfo García Velásquez | 2025-04-25 | 4.Plan de pagos | 1502549.44216114 | 150349.44 |
| R114 | 619 | E10 |  | Sofia Paredes | José Estuardo Ordoñez Cancinos | 2025-03-08 | 4.Plan de pagos | 1529194.3266091 | 152994.33 |
| R115 | 701 | E9 |  | Antonio Rada | Luis Francisco Villatoro Quiroa | 2023-03-21 | 4.Plan de pagos | 1320300 | 132100 |
| R116 | 702 | E10 |  | Antonio Rada | Wilson Humberto Félix Reyna | 2023-04-14 | 4.Plan de pagos | 1343800 | 134400 |
| R117 | 703 | B4 | Plan de pagos especiales | Antonio Rada | Daniel Augusto Sántos Aragón | 2024-03-07 | 4.Plan de pagos | 901400 | 90200 |
| R118 | 704 | B3 |  | Antonio Rada | Dania Dulcidia Gutierrez Villeda de Mejía | 2024-04-15 | 4.Plan de pagos | 887400 | 88800 |
| R119 | 705 | D9 |  | Antonio Rada | Ingrid Lisbeth Dubón García de Díaz | 2025-02-11 | 4.Plan de pagos | 1396401.17573617 | 139701.18 |
| R120 | 706 | D8 |  | Antonio Rada | Edison Gabriel Ramirez López | 2025-03-12 | 4.Plan de pagos | 1402592.69535949 | 140292.7 |
| R121 | 707 | A12 |  | Sofia Paredes | Cristhian Paul Escobar Maldonado  | 2025-04-04 | 4.Plan de pagos | 789045 | 78945 |
| R122 | 708 | C6 | Plan de pagos especiales | Antonio Rada | Alfonso Videche Rodriguez | 2024-01-30 | 4.Plan de pagos | 1183693 | 118393 |
| R123 | 709 | C5 |  | Anahí Cisneros | Manuel Lizandro Ramírez Barrios | 2023-10-03 | 4.Plan de pagos | 1362800 | 96000 |
| R124 | 710 | C6 |  | Brenda Búcaro | Carlos Raúl Yon Gonzáles (Congelado estrategia comercial) | 2023-09-04 | 4.Plan de pagos | 1185640.42442039 | 118564.042442039 |
| R125 | 711 | C5 | Plan de pagos especiales | Diana Alvarez | Samuel David Chávez Pérez | 2025-04-23 | 4.Plan de pagos | 1204212.47 | 120512.47 |
| R126 | 712 | A8 |  | Antonio Rada | Edgar Augusto Sepúlveda Barrera / Zoila Isabel Márquez Soza de Sepúlveda | 2023-06-08 | 4.Plan de pagos | 703500 | 70400 |
| R127 | 713 | A2 | Plan de pagos especiales | Antonio Rada |  Luis Alejandro Pérez Ibañez | 2023-06-10 | 4.Plan de pagos | 687500 | 68800 |
| R128 | 714 | E5 |  | Antonio Rada | José Carlos Samayoa San José | 2024-04-11 | 4.Plan de pagos | 1438008 | 143808 |
| R129 | 715 | A5 |  | Brenda Búcaro | Cynthia Marisel Coronado Monterroso | 2023-03-10 | 4.Plan de pagos | 617600 | 62000 |
| R130 | 716 | B4 |  | Antonio Rada | Lisvet  Maricela Sancé Alvarez De Girón | 2024-01-15 | 4.Plan de pagos | 901400 | 90200 |
| R131 | 717 | B3 |  | Antonio Rada | Jorge Estuardo Díaz Durán Baldetti | 2024-04-30 | 4.Plan de pagos | 887400 | 88800 |
| R132 | 718 | E9 |  | Mario Rodriguez | Julio Fernando Flores Interiano | 2025-09-02 | 4.Plan de pagos | 1667800 | 116800 |
| R133 | 719 | E10 | (congelado estrategia comercial) / Mario Flores | Junta Directiva | Flortiz, S.A. | 2026-01-14 | 4.Plan de pagos | 1456400 | 1362326.78 |
| R134 | 801 | C4 |  | Antonio Rada | Pablo José Juárez Pereira | 2023-07-25 | 4.Plan de pagos | 1152000 | 115200 |
| R135 | 802 | C1 |  | Brenda Búcaro | Carmen Julia Soto Baechli de Hicks | 2023-06-10 | 4.Plan de pagos | 1166800 | 116700 |
| R136 | 803 | A8 |  | Brenda Búcaro | Mauricio Antonio León Tres | 2023-03-22 | 4.Plan de pagos | 660700 | 66100 |
| R137 | 804 | A1 |  | Brenda Búcaro | Victor Hugo Cáceres Morales | 2023-06-13 | 4.Plan de pagos | 702900 | 70300 |
| R138 | 805 | B5 | ENGANCHE CANCELADO | Antonio Rada | Celia Julissa Flores Dávila de González | 2024-05-08 | 4.Plan de pagos | 941800 | 94200 |
| R139 | 806 | B8 |  | Antonio Rada | Rodolfo Morales Muñoz | 2024-09-12 | 4.Plan de pagos | 1084565 | 108465 |
| R140 | 807 | B4 |  | Antonio Rada | Eswin Raúl Morales López | 2023-11-30 | 4.Plan de pagos | 901400 | 90200 |
| R141 | 808 | B3 |  | Antonio Rada | Gualberto Alonso Salazar Trejos | 2024-03-05 | 4.Plan de pagos | 887400 | 88800 |
| R142 | 809 | E1 |  | Antonio Rada | Mildred Marítza Monterroso Montenegro de Santizo | 2024-03-02 | 4.Plan de pagos | 1390400 | 139100 |
| R143 | 810 | A4 |  | Brenda Búcaro | Sebastián Aristondo Barillas / Wendy Sucelly Barrillas Alvarez | 2023-06-22 | 4.Plan de pagos | 697500 | 70000 |
| R144 | 811 | B7 | ENGANCHE CANCELADO | Antonio Rada | Rosa Gilda Tuchan Valle de González | 2024-07-12 | 4.Plan de pagos | 864446.02 | 864446.02 |
| R145 | 812 | B2 | ENGANCHE CANCELADO | Antonio Rada | Juan Pablo González Tuchán | 2024-07-30 | 4.Plan de pagos | 941467.1 | 94167.1 |
| R146 | 813 | B6 |  | Antonio Rada | Industrias Danico, S.A. /  Pedro José Cordón Folgar} | 2024-05-14 | 4.Plan de pagos | 895332.85 | 89632.85 |
| R147 | 814 | B1 |  | Antonio Rada | Enma Suselly López Muy | 2023-11-20 | 4.Plan de pagos | 883300 | 88400 |
| R148 | 815 | E2 |  | Antonio Rada | Leonora Elizabeth Cordón Arrivillaga | 2024-02-20 | 4.Plan de pagos | 1463600 | 146400 |
| R149 | 816 | A2 |  | Brenda Búcaro | Coasa, S.A. | 2023-03-31 | 4.Plan de pagos | 651600 | 65200 |
| R150 | 817 | A6 |  | Brenda Búcaro |  Juan Antonio Escobedo del Cid | 2023-04-11 | 4.Plan de pagos | 657132.3 | 65732.3 |
| R151 | 818 | A3 |  | Brenda Búcaro | Astrid Pamela Chew Chávez de Letona / Roger Amílcar Letona Cardona | 2023-07-18 | 4.Plan de pagos | 703500 | 70400 |
| R152 | 819 | C3 |  | Brenda Búcaro | Edvin Eduardo Sajquim Sajquim / Edvin Waldemar Sajquim Estacuy | 2023-05-29 | 4.Plan de pagos | 967700 | 96800 |
| R153 | 820 | C2 |  | Antonio Rada | María Eugenia Ortíz Uck | 2024-01-13 | 4.Plan de pagos | 990132.5 | 99132.5 |
| R154 | 901 | C4 |  | Antonio Rada | Mónica Arimany Monzón de Estrada | 2023-03-27 | 4.Plan de pagos | 1087062.84218 | 108762.84 |
| R155 | 902 | C1 | ENGANCHE CANCELADO | Antonio Rada | Waldir Edenilson Contreras Pedroza | 2024-01-15 | 4.Plan de pagos | 1195970 | 119670 |
| R156 | 903 | A8 |  | Jose Franco | Vivian Arely Carranza León de Acevedo | 2023-05-19 | 4.Plan de pagos | 703500 | 70400 |
| R157 | 904 | A1 |  | Jose Franco | Juan José Silva Pacheco / Dania Rocío Hernández León | 2023-05-16 | 4.Plan de pagos | 696469.08 | 69669.08 |
| R158 | 905 | B5 |  | Antonio Rada | Roberto Andres Hernandez Benavides | 2024-06-30 | 4.Plan de pagos | 941800 | 94200 |
| R159 | 906 | B8 |  | Erwin Cardona | Juan Carlos del Cid Ramirez | 2026-01-26 | 2.Reserva | 1102644.58 | 110344.58 |
| R160 | 907 | B4 | Plan de pagos especiales, paga en agosto | Brenda Búcaro | Stephanie Pamela Herrera Escobar | 2023-08-31 | 4.Plan de pagos | 901400 | 90200 |
| R161 | 908 | B3 |  | Antonio Rada | Jorge Pablo González Ordóñez | 2024-01-25 | 4.Plan de pagos | 887400 | 88800 |
| R162 | 909 | E8 |  | Brenda Búcaro | Alba Lucila Martínez Tobar | 2023-07-11 | 4.Plan de pagos | 1382700 | 138300 |
| R163 | 910 | A10 |  |  |  |  | 1.Disponible | 1208800 | 84600 |
| R164 | 911 | C10 |  | Brenda Búcaro | Mario Alberto Maldonado Recinos | 2023-09-16 | 4.Plan de pagos | 1052367.5 | 105267.5 |
| R165 | 912 | C7 |  | Ronaldo | Iurix, S.A | 2024-01-09 | 4.Plan de pagos | 973800 | 97380 |
| R166 | 913 | B6 |  | Antonio Rada | Wender Josué Bailon Campos | 2024-04-22 | 4.Plan de pagos | 903600 | 90400 |
| R167 | 914 | B1 |  | Antonio Rada | Rebecca González Ordoñez de Alvarez | 2024-01-29 | 4.Plan de pagos | 883300 | 88400 |
| R168 | 915 | E2 |  | Brenda Búcaro | Marcela Alejandra Castro Marcía | 2023-09-28 | 4.Plan de pagos | 1309197.44 | 130997.44 |
| R169 | 916 | A2 |  | Brenda Búcaro | José Fernando Cordón Almengor | 2023-05-03 | 4.Plan de pagos | 687500 | 68800 |
| R170 | 917 | A6 |  | Brenda Búcaro | Jessica María Ramirez Girard | 2023-05-22 | 4.Plan de pagos | 699700 | 70000 |
| R171 | 918 | A3 |  | Antonio Rada | Astrid Maricel de León Ramírez | 2023-07-21 | 4.Plan de pagos | 703500 | 70400 |
| R172 | 919 | C3 |  | Brenda Búcaro | Ana Lucrecia Rangel Aquino | 2023-03-31 | 4.Plan de pagos | 921600 | 92200 |
| R173 | 920 | C2 |  | Ronaldo | Iurix, S.A | 2024-01-09 | 4.Plan de pagos | 929000 | 92900 |
| R174 | 1001 | C4 |  | Antonio Rada |  Zonia Beariz Hernández Herrera | 2023-04-11 | 4.Plan de pagos | 1097100 | 109800 |
| R175 | 1002 | C1 |  | Antonio Rada | Evelin Yadira Orellana Ordoñez | 2023-03-23 | 4.Plan de pagos | 1111200 | 216000 |
| R176 | 1003 | A8 |  | Antonio Rada | Eduar Reginaldo Colíndres Estrada | 2023-05-26 | 4.Plan de pagos | 703500 | 70400 |
| R177 | 1004 | A1 |  | Jose Franco |  Jorge Silva Sagastume | 2023-05-16 | 4.Plan de pagos | 696469.08 | 69669.08 |
| R178 | 1005 | B5 |  | Brenda Búcaro | Bárbara Elizabeth Ixmucané Zapeta Albanés | 2023-07-06 | 4.Plan de pagos | 941800 | 94200 |
| R179 | 1006 | B8 |  | Antonio Rada | Diana Marisol Donis Cú | 2024-02-21 | 4.Plan de pagos | 943100 | 94400 |
| R180 | 1007 | B4 |  | Brenda Búcaro | Marcela Alejandra Castro Marcía | 2023-09-04 | 4.Plan de pagos | 901400 | 90200 |
| R181 | 1008 | B3 |  | Antonio Rada | Jorge Roberto Arimany Comas | 2024-04-19 | 4.Plan de pagos | 845100 | 84510 |
| R182 | 1009 | E8 |  | Sofia Paredes | Augusto Alejandro Salazar Alecio / Yosseline Yanira Moscoso Hidalgo de Salazar | 2024-11-06 | 4.Plan de pagos | 1515084.48 | 152084.48 |
| R183 | 1010 | A10 |  | Antonio Rada | Allan Donaldo Lapop Cárdenas | 2023-08-27 | 4.Plan de pagos | 848900 | 84900 |
| R184 | 1011 | C10 |  | Brenda Búcaro | Sebastian Gutiérrez Ruiz | 2023-03-31 | 4.Plan de pagos | 1131525 | 113225 |
| R185 | 1012 | C7 |  | Ronaldo | Iurix, S.A. | 2024-01-09 | 4.Plan de pagos | 973800 | 97380 |
| R186 | 1013 | B6 |  | Brenda Búcaro | Byron Nehemías Ortega Ruiz | 2023-09-12 | 4.Plan de pagos | 903600 | 90400 |
| R187 | 1014 | B1 |  | Antonio Rada | Jorge Antonio Reyes Ochoa | 2023-06-11 | 4.Plan de pagos | 883300 | 88400 |
| R188 | 1015 | E2 |  | Antonio Rada | Pedro Luis Artero Bran | 2023-04-19 | 4.Plan de pagos | 1333600 | 133400 |
| R189 | 1016 | A2 | Plan de pagos especiales | Brenda Búcaro | Sergio Enrique Bolaños López | 2023-04-16 | 4.Plan de pagos | 651600 | 65200 |
| R190 | 1017 | A6 | Plan de pagos especiales | Brenda Búcaro | Irene Alejandra Reyes Guzmán | 2023-04-16 | 4.Plan de pagos | 663200 | 66400 |
| R191 | 1018 | A3 | ENGANCHE CANCELADO | Antonio Rada | Corporación FB, S.A. / Julio Alfonso Aldana Recinos | 2023-08-03 | 4.Plan de pagos | 690627.17 | 69127.17 |
| R192 | 1019 | C3 |  | Mario Rodriguez | Gloria Fernanda Moran Guevara | 2025-08-25 | 4.Plan de pagos | 1391500 | 97500 |
| R193 | 1020 | C2 |  | Erwin Cardona | Bernerd Alexandro Godínez López | 2025-11-24 | 4.Plan de pagos | 1420800 | 99456 |
| R194 | 1101 | D10 |  | Antonio Rada | Maria Fernanda Contreras López | 2024-03-23 | 4.Plan de pagos | 1176700 | 117700 |
| R195 | 1102 | D11 |  | Antonio Rada | Luis Alberto López Velásquez | 2023-03-31 | 4.Plan de pagos | 1152100 | 115300 |
| R196 | 1103 | B4 |  | Antonio Rada | Samuel Hiram Salazar Say | 2023-05-25 | 4.Plan de pagos | 901400 | 180300 |
| R197 | 1104 | B3 |  | Antonio Rada | Denisse Hortencia Alarcón Díaz | 2024-02-21 | 4.Plan de pagos | 887400 | 88800 |
| R198 | 1105 | A6 |  | Brenda Búcaro | Luis Pedro Escobedo del Cid | 2023-03-27 | 4.Plan de pagos | 657892.7 | 65892.7 |
| R199 | 1106 | A4 |  | Antonio Rada | Emerson Emanuel Menendez Rodas | 2023-04-27 | 4.Plan de pagos | 661100 | 66200 |
| R200 | 1107 | A12 |  | Ronaldo | International Coffee Industry, S.A. | 2024-01-09 | 4.Plan de pagos | 685200 | 68520 |
| R201 | 1108 | C6 | Plan de pagos especiales | Brenda Búcaro | Denis Orlando Coto Zelaya | 2023-03-28 | 4.Plan de pagos | 1100438.98 | 110138.98 |
| R202 | 1109 | C5 |  | Antonio Rada | Fausto Norberth Méndez Melgar / Guerda Dagmara Zuñiga España de Méndez | 2023-12-03 | 4.Plan de pagos | 1182285.73 | 118285.73 |
| R203 | 1110 | C6 |  | Antonio Rada | Juan Carlos Lantzendorffer Haas | 2023-08-05 | 4.Plan de pagos | 1166200 | 116700 |
| R204 | 1111 | C5 |  | Antonio Rada | Erika Ruth Castro Juarez | 2024-02-07 | 4.Plan de pagos | 1193202.5 | 119402.5 |
| R205 | 1112 | A8 |  | Antonio Rada | Grupo Sak y Sak, S.A. | 2023-06-06 | 4.Plan de pagos | 690627.17 | 690627.17 |
| R206 | 1113 | A2 |  | Jose Franco | Marcas & Secretos, S.A. | 2023-04-05 | 4.Plan de pagos | 645639 | 64639 |
| R207 | 1114 | A11 |  | Antonio Rada | Clara Hilda María Falla Bianchi de Cruz-Gomar | 2024-05-28 | 4.Plan de pagos | 801793.67 | 77986.52 |
| R208 | 1115 | B4 |  | Antonio Rada | Eddy Francisco Mac-Intosh López | 2025-04-08 | 4.Plan de pagos | 1142630.20477101 | 114330.2 |
| R209 | 1116 | B3 | Plan de pagos especiales | Antonio Rada | Francisco Javier Arriaza Reyes | 2024-02-15 | 4.Plan de pagos | 887400 | 88800 |
| R210 | 1117 | D10 |  | Antonio Rada | Jerson Leonel Chavez Martínez | 2023-12-14 | 4.Plan de pagos | 1165934.22 | 116634.22 |
| R211 | 1118 | D11 |  | Antonio Rada | José Raúl Velasco Ferrigno | 2024-06-20 | 4.Plan de pagos | 1181000 | 118100 |
| R212 | 1201 | D4 |  | Antonio Rada | Rogelio Alejandro Ochoa Hernández | 2024-06-18 | 4.Plan de pagos | 1253700 | 125400 |
| R213 | 1202 | D1 |  | Antonio Rada | Edwin Steven Quiroa Sitamul | 2024-02-28 | 4.Plan de pagos | 1265500 | 126600 |
| R214 | 1203 | B4 |  | Antonio Rada | Allan Vinicio Velásquez León | 2023-08-27 | 4.Plan de pagos | 901400 | 90200 |
| R215 | 1204 | B3 |  | Antonio Rada | Josselin Alejandra Turcios Orantes | 2024-02-14 | 4.Plan de pagos | 887400 | 88800 |
| R216 | 1205 | A6 |  | Antonio Rada | Andrea Nicole Mansilla Fuentes | 2023-03-25 | 4.Plan de pagos | 663200 | 66400 |
| R217 | 1206 | A4 |  | Jose Franco | Juan José Silva Pacheco | 2023-05-16 | 4.Plan de pagos | 691118.49 | 69118.49 |
| R218 | 1207 | A12 |  | Jose Franco | David Arimany Monzón | 2023-03-27 | 4.Plan de pagos | 678932 | 67932 |
| R219 | 1208 | C6 |  | Antonio Rada | JMX Inversiones Sociedad Anonima | 2023-04-15 | 4.Plan de pagos | 1110600 | 111100 |
| R220 | 1209 | C5 |  | Antonio Rada | Gilda Elena Siekavizza Castillo / Jose Pablo Pineda Bran | 2023-03-28 | 4.Plan de pagos | 1108600 | 110900 |
| R221 | 1210 | C6 |  | Antonio Rada | JMX Inversiones Sociedad Anonima | 2023-04-15 | 4.Plan de pagos | 1110600 | 111100 |
| R222 | 1211 | C5 |  | Antonio Rada | Jorge Daniel Baca Chiroy | 2023-11-28 | 4.Plan de pagos | 1193202.5 | 119402.5 |
| R223 | 1212 | A8 | Plan de pagos especiales | Brenda Búcaro | Sergio Enrique Bolaños López | 2023-07-16 | 4.Plan de pagos | 666800 | 66700 |
| R224 | 1213 | A2 |  | Jose Franco | Marcas & Secretos, S.A. | 2023-04-05 | 4.Plan de pagos | 645639 | 64639 |
| R225 | 1214 | A11 |  | Jose Franco | Manuel Armando Fletes Ordoñez | 2023-06-05 | 4.Plan de pagos | 786200 | 78700 |
| R226 | 1215 | B4 |  | Antonio Rada | José Javier Hernández Juárez | 2023-04-11 | 4.Plan de pagos | 858400 | 85900 |
| R227 | 1216 | B3 |  | Anahí Cisneros | Alan Richard Gonzalez Choc | 2025-07-18 | 4.Plan de pagos | 1039156.15 | 1039156.15 |
| R228 | 1217 | D4 |  | Antonio Rada | Irene Noemy Santisteban Chigüil | 2024-04-09 | 4.Plan de pagos | 1253700 | 125400 |
| R229 | 1218 | D1 |  | Diana Alvarez | Héctor Ricardo Echeverría Méndez | 2024-11-18 | 4.Plan de pagos | 1350925.53 | 135092.55 |
| R230 | 1301 | D4 |  | Antonio Rada | Raúl Eliazar Lemus Garza | 2024-06-13 | 4.Plan de pagos | 1253700 | 125400 |
| R231 | 1302 | D1 |  | Antonio Rada | Rodolfo Godoy Lémus | 2024-11-13 | 4.Plan de pagos | 1350925.53 | 135125.53 |
| R232 | 1303 | B4 |  | Antonio Rada | Ricardo Fernando Linares Pérez | 2023-08-06 | 4.Plan de pagos | 901400 | 90200 |
| R233 | 1304 | B3 |  | Antonio Rada | Shirley Hilene Recinos | 2023-10-24 | 4.Plan de pagos | 879281.06 | 87981.06 |
| R234 | 1305 | A6 |  | Antonio Rada | José Salvador Franco Rosales | 2025-05-02 | 4.Plan de pagos | 773200 | 77400 |
| R235 | 1306 | A4 |  | Brenda Búcaro |  Barbara Elizabeth Barrientos Valenzuela | 2023-05-08 | 4.Plan de pagos | 697500 | 69800 |
| R236 | 1307 | A12 |  | Jose Franco | Fernando José Franco Jímenez | 2023-03-31 | 4.Plan de pagos | 678932 | 67932 |
| R237 | 1308 | C6 |  | Antonio Rada | Gerson Alexander Urias Marquez | 2023-10-31 | 4.Plan de pagos | 1183693 | 118393 |
| R238 | 1309 | C5 |  |  |  |  | 1.Disponible | 1603000 | 112300 |
| R239 | 1310 | C6 |  | Jose Franco |  Raúl Cabrera Galindo | 2023-03-27 | 4.Plan de pagos | 1110600 | 111100 |
| R240 | 1311 | C5 |  | Antonio Rada | Luis Gabriel Garrido Blanco | 2023-10-03 | 4.Plan de pagos | 1022010 | 102201 |
| R241 | 1312 | A8 |  | Brenda Búcaro | Arturo Alfredo Monzón López | 2023-04-18 | 4.Plan de pagos | 666800 | 66700 |
| R242 | 1313 | A2 |  | Jose Franco | Marcas & Secretos, S.A. | 2023-04-05 | 4.Plan de pagos | 645639 | 64639 |
| R243 | 1314 | A11 |  | Brenda Búcaro | Sidney Alexander Osorio Montufar | 2023-03-20 | 4.Plan de pagos | 715600 | 71600 |
| R244 | 1315 | B4 |  | Anahí Cisneros | Alan Richard Gonzalez Choc | 2025-07-18 | 4.Plan de pagos | 1072274.01 | 1072274.01 |
| R245 | 1316 | B3 |  | Antonio Rada | Juan Ernesto Vossberg Ordoñez / Sumilab | 2023-11-02 | 4.Plan de pagos | 879281.06 | 87981.06 |
| R246 | 1317 | D4 |  | Antonio Rada | Marcos David Boror Alpírez | 2024-08-21 | 4.Plan de pagos | 1316385 | 131685 |
| R247 | 1318 | D1 |  | Erwin Cardona | Jose Alejandro Abalony Rojas | 2025-12-02 | 2.Reserva | 1509600 | 105700 |
| R248 | 1401 | D12 |  | Brenda Búcaro | Fernando García Coronado | 2023-08-20 | 4.Plan de pagos | 1172500 | 117300 |
| R249 | 1402 | D13 |  | Antonio Rada | Marlen Fabiola Izaguirre Navas | 2024-10-07 | 4.Plan de pagos | 1252020 | 125220 |
| R250 | 1403 | B6 |  | Antonio Rada | María Mercedes Lizarralde Mc Allister de Irving | 2023-03-27 | 4.Plan de pagos | 852627.54462 | 85327.54 |
| R251 | 1404 | B1 |  | Jose Franco | Diego Eduardo Román Hazard | 2023-03-27 | 4.Plan de pagos | 849571 | 169971 |
| R252 | 1405 | E2 | ENGANCHE CANCELADO | Antonio Rada | Víctor Leonel Orozco López /  | 2023-04-18 | 4.Plan de pagos | 1301000 | 130100 |
| R253 | 1406 | A2 |  | Jose Franco |  Jonatan Hans Donis Montenegro | 2023-03-27 | 4.Plan de pagos | 651600 | 65200 |
| R254 | 1407 | B5 |  | Ronaldo | José Herrera Pérez | 2024-02-14 | 4.Plan de pagos | 1074100 | 107410 |
| R255 | 1408 | B8 |  | Erwin Cardona | Yahayra Sujey Lemus Contreras de Mayén | 2026-01-25 | 2.Reserva | 1434900 | 100400 |
| R256 | 1409 | B4 |  | Ronaldo | International Coffee Industry, S.A. | 2024-01-09 | 4.Plan de pagos | 858400 | 85840 |
| R257 | 1410 | B3 | Plan de pagos especiales | Antonio Rada | Selvin Ramiro Gámez Perez | 2024-02-05 | 4.Plan de pagos | 887400 | 88800 |
| R258 | 1411 | E8 |  | Antonio Rada | Julio Cesar Morales Díaz | 2023-06-19 | 4.Plan de pagos | 1382700 | 138300 |
| R259 | 1412 | A4 |  | Brenda Búcaro | Javier Andrés Soto Coronado | 2023-04-28 | 4.Plan de pagos | 661100 | 66200 |
| R260 | 1501 | D3 |  | Erwin Cardona | Corporacion G&G Sociedad Anonima | 2025-11-26 | 4.Plan de pagos | 1580900 | 158090 |
| R261 | 1502 | D2 |  | Sofia Paredes | Edgar Benjamín Ramírez Masaya Y Leslie María Ivonne Pivaral Gudiel | 2024-10-13 | 4.Plan de pagos | 1333525.22645793 | 131660 |
| R262 | 1503 | B6 |  | Brenda Búcaro | Emilia Aracely Larrazabal Melgar de Urbain | 2023-03-31 | 4.Plan de pagos | 852627.54462 | 85227.54 |
| R263 | 1504 | B1 |  | Jose Franco | Berta Eugenia Morales López de Letona | 2023-05-22 | 4.Plan de pagos | 883300 | 88400 |
| R264 | 1505 | D7 |  | Antonio Rada | Daniel Alvarez Alvarez | 2024-07-18 | 4.Plan de pagos | 1277800 | 127800 |
| R265 | 1506 | A9 |  |  |  |  | 1.Disponible | 1225600 | 85800 |
| R266 | 1507 | C9 |  | Jose Franco | Gabriel Arimany Monzón | 2023-03-28 | 4.Plan de pagos | 1141461 | 114161 |
| R267 | 1508 | C8 |  | Jose Franco | María Carolina Arimany Comas | 2023-03-28 | 4.Plan de pagos | 1141560 | 114160 |
| R268 | 1509 | B4 |  | Anahí Cisneros | Alan Richard Gonzalez Choc | 2025-07-18 | 4.Plan de pagos | 1082554.07 | 1082554.07 |
| R269 | 1510 | B3 |  | Brenda Búcaro | José Paúl Centeno Valdés | 2023-06-08 | 4.Plan de pagos | 887400 | 88800 |
| R270 | 1511 | E8 |  | Antonio Rada | Luis Fernando Velásquez León / Cristian Eduardo Velásquez León | 2023-08-17 | 4.Plan de pagos | 1382700 | 138300 |
| R271 | 1512 | A10 |  |  |  |  | 1.Disponible | 1215700 | 85100 |
| R272 | 1601 | D3 |  | Brenda Búcaro | Fernando García Coronado | 2023-08-24 | 4.Plan de pagos | 1255283.9 | 125583.9 |
| R273 | 1602 | D2 |  | Ronaldo | International Coffee Industry, S.A. | 2024-01-09 | 4.Plan de pagos | 1265500 | 126550 |
| R274 | 1603 | B6 |  | Antonio Rada | Inmobiliaria Quince Sociedad Anonima | 2023-03-28 | 4.Plan de pagos | 863130.61 | 156030.61 |
| R275 | 1604 | B1 |  | Antonio Rada | Oliver Lenin García Godoy | 2023-05-16 | 4.Plan de pagos | 894100 | 89500 |
| R276 | 1605 | D7 |  | Antonio Rada | Edgar Rolando Muy Pineda | 2024-10-22 | 4.Plan de pagos | 1393455 | 139355 |
| R277 | 1606 | A9 |  |  |  |  | 1.Disponible | 1235500 | 86500 |
| R278 | 1607 | C9 |  |  | Inmobiliaria Quince Sociedad Anonima | 2024-10-03 | 2.Reserva | 1164200 | 102510 |
| R279 | 1608 | C8 |  | Jose Franco | María Carolina Arimany Comas | 2023-03-28 | 4.Plan de pagos | 1153648 | 115448 |
| R280 | 1609 | B4 |  | Antonio Rada | Christian Josué Colindres Sandoval | 2023-03-25 | 4.Plan de pagos | 860950.584005 | 86150.58 |
| R281 | 1610 | B3 |  | Antonio Rada | Grupo Sak y Sak, S.A. | 2023-05-31 | 4.Plan de pagos | 890081.34 | 890081.34 |
| R282 | 1611 | E8 |  | Anahi Cisneros | Luis Alexander Valencia Méndez | 2025-11-09 | 2.Reserva | 1487500 | 104200 |
| R283 | 1612 | A10 |  | Erwin Cardona | Allan Rodrigo Godínez Padilla | 2026-02-10 | 2.Reserva | 1218600 | 85300 |
| R284 | 1701 | E6 |  | Brenda Búcaro | Ramiro José Muñoz Jordán / Emilia Larrazabal | 2023-03-29 | 4.Plan de pagos | 1389570 | 139070 |
| R285 | 1702 | A3 |  | Brenda Búcaro | David Alejandro Donis López | 2023-04-15 | 4.Plan de pagos | 666800 | 66700 |
| R286 | 1703 | D5 |  | Antonio Rada | Rolando Antonio Pineda Juárez | 2025-04-12 | 4.Plan de pagos | 1450000 | 145000 |
| R287 | 1704 | A5 |  | Brenda Búcaro | Javier Andres Soto Coronado | 2023-03-10 | 4.Plan de pagos | 617600 | 62000 |
| R288 | 1705 | D6 |  | Antonio Rada | Maxi Alexander Méndez Morán | 2025-04-02 | 4.Plan de pagos | 1446043.24 | 144643.24 |
| R289 | 1706 | B4 |  | Jose Franco | David Arimany Monzón / María Isabel Roca Trujillo de García | 2023-03-24 | 4.Plan de pagos | 860951 | 87051 |
| R290 | 1707 | B5 |  | Ronaldo Ogaldez | Miguel Eduardo Yon Moll | 2025-03-05 | 4.Plan de pagos | 908000 | 90800 |
| R291 | 1708 | E4 |  | Anahí Cisneros | Carlos Antonio Aguilar Velásquez | 2025-10-27 | 4.Plan de pagos | 1762700 | 123389 |
| R292 | 1801 | E7 |  | Jose Franco | Luis Arimany Monzón | 2023-03-27 | 4.Plan de pagos | 1391452 | 139152 |
| R293 | 1802 | A10 |  | Antonio Rada | Fredy René Velásquez Quevedo | 2023-05-18 | 4.Plan de pagos | 848900 | 84900 |
| R294 | 1803 | D5 |  | Anahi Cisneros | Rivabella, S.A. / Marcos Ramón Vásquez Solís | 2025-11-15 | 4.Plan de pagos | 1651500 | 495500 |
| R295 | 1804 | A5 |  | Brenda Búcaro | Juan Pablo Monterroso Arroyo | 2023-03-10 | 4.Plan de pagos | 617600 | 62000 |
| R296 | 1805 | D6 |  | Anahí Cisneros | Sergio Rafael Marroquin Sáenz / Marta Pamelha Herrera Mendizabal de Marroquin | 2025-12-04 | 4.Plan de pagos | 1681900 | 118000 |
| R297 | 1806 | B4 |  | Antonio Rada | Business View Sociedad Anonima | 2023-03-29 | 4.Plan de pagos | 860950.584005 | 86150.58 |
| R298 | 1807 | C11 |  | Jose Franco | Yuly Marisol Rodríguez Ordoñez de Arimany | 2023-03-27 | 4.Plan de pagos | 1131156 | 113156 |
| R299 | 1808 | E3 |  | Antonio Rada | Mónica Cecilia Rodríguez Villalta | 2023-09-30 | 4.Plan de pagos | 1417808.51 | 141808.51 |
| R300 | 1901 | A11 |  | Ronaldo | International Coffee Industry, S.A. | 2023-03-27 | 4.Plan de pagos | 745200 | 74520 |
| R301 | 1902 | D5 |  | Ronaldo | International Coffee Industry, S.A. | 2024-01-09 | 4.Plan de pagos | 1289910 | 128970 |
| R302 | 1903 | D6 |  | Ronaldo | International Coffee Industry, S.A. | 2024-01-09 | 4.Plan de pagos | 1294100 | 129410 |
| R303 | 1904 | D5 |  | Ronaldo | International Coffee Industry, S.A. | 2024-01-09 | 4.Plan de pagos | 1289700 | 128970 |
| R304 | 1905 | D8 |  | Ronaldo | International Coffee Industry, S.A. | 2024-01-09 | 4.Plan de pagos | 1331700 | 133170 |
| R318 | Desistimiento |  |  |  |  |  |  |  |  |
| R319 | APTO | MODELO |  | VENDEDOR | CLIENTE | FECHA | TIPO DE PLAN | P. VENTA | ENGANCHE |
| R320 | 416 | A4 |  |  | Evelyn Andrea Sagastume Dubon |  | 1.Disponible | 726855.428686374 | 72685.5428686374 |
| R321 | 707 | A12 |  | Antonio Rada | Pablo Josue Alvarez Sanchez | 2023-08-15 | 4.Plan de pagos | 722900 | 72300 |
| R322 | 711 | C5 |  | Antonio Rada | Marcela Alejandra Castillo Melgar | 2023-11-09 | 4.Plan de pagos | 1181561.5 | 118161.5 |
| R323 | 1009 | E8 |  |  | Cristian Arturo Sanchez Lopez | 2023-01-04 | Desistimiento | 1515084.48 | 152084.48 |
| R324 | 1315 | B4 |  |  | Hilda Maria Perez Escobedo |  | 1.Disponible | 1072218.69827634 | 107221.86982763401 |
| R325 | 1501 | D3 |  | Antonio Rada | Carmen Gabriela Contreras Alfaro | 2023-07-28 | 4.Plan de pagos | 1231200 | 123200 |
| R326 | 1020 | C2 |  | Diana Alvarez | Jose Mauricio Duarte Carranza | 2024-11-30 | 4.Plan de pagos | 1259997.38 | 125997.37 |
| R327 | 1114 | A11 |  | Antonio Rada | Fernando Antonio Reyes De León | 2023-05-19 | 4.Plan de pagos | 748092.41 | 74892.41 |
| R328 | 1114 | A11 |  | Antonio Rada | Monica Elizabeth Estrada Cordon De Franco | 2024-05-28 | 4.Plan de pagos | 748092.41 | 74892.41 |
| R329 | 1410 | B3 |  | Brenda Búcaro | Luis Fernando Gutierrez Perez | 2023-03-27 | 4.Plan de pagos | 845100 | 84600 |
| R330 | 607 | A12 |  | Antonio Rada | Billy Hasse Orellana Serrano / Madelyn Kristina Sajche Torres y Antony Williams Sajche Torres | 2023-08-14 | 4.Plan de pagos | 722900 | 72300 |
| R331 | 418 | A1 | RESERVADO | Antonio Rada | Alejandra Madelleine Rosales Garcia | 2023-11-10 | 4.Plan de pagos | 720472.5 | 72072.5 |
| R332 | 503 | B4 |  | Antonio Rada | Rubidia Ines Gonzalez Anzueto | 2024-09-30 | 4.Plan de pagos | 1036610 | 103710 |
| R333 | 504 | B3 | RESERVADO | Antonio Rada | Luis Josue Cordon Miranda | 2024-05-08 | 4.Plan de pagos | 887400 | 88800 |
| R334 | 602 | E10 |  | Antonio Rada | Luis Fernando Santos Castillo | 2024-11-14 | 2. Reserva | 1529194.3266091 | 152919.43266091 |
| R335 | 1305 | A6 |  | Antonio Rada | Franklin Rene Santisteban Rriola | 2023-03-23 | 4.Plan de pagos | 663200 | 66400 |
| R336 | 315 | E1 | RESERVADO | Sofia Paredes | Lilian America Roldan Ochoa | 2025-04-05 | 2. Reserva / Prom. F. | 1543626.97235174 | 154426.97 |
| R337 | 405 | B7 | DESISTIDO | Antonio Rada | Leslie Carolina Gil Morales | 2025-03-15 | 2. Reserva | 1112465.60916772 | 111265.61 |
| R338 | 1020 | C2 | ATRASADO | Antonio Rada | Rolando Edwin Villatoro Hernandez | 2025-02-26 | 2. Reserva | 1259997.38 | 125997.37 |
| R339 | 1318 | D1 | DESISTIDO | Antonio Rada | Héctor Felipe Alfaro Mancilla | 2024-11-20 | 4.Plan de pagos | 1350925.53 | 135125.53 |
| R340 | 1019 | C3 | DESISTIDO | Antonio Rada | Marta Haydee Hurtarte Ruano De Sánchez | 2023-03-31 | 4.Plan de pagos | 913168.92462 | 154568.92 |
| R341 | 1020 | C2 |  | Antonio Rada | Rolando Edwin Villatoro Hernandez | 2025-02-26 | 2. Reserva | 1259997.38 | 125997.37 |
| R342 | 614 | E5 | Plan de pagos especiales | Diana Alvarez | Marco Vinicio Vasque | 2024-10-15 | 4.Plan de pagos | 1509908.4 | 151908.4 |
| R343 | 1501 | D3 |  | Antonio Rada | Paulo Roberto Lopez Velasquez | 2025-04-02 | 2. Reserva | 1450747.8 | 145147.8 |
| R344 | 1607 | C9 |  | Brenda Búcaro | Edvin Carlos Cifuentes Salguero - Inmobiliaria Quince | 2023-05-31 | 4.Plan de pagos | 1164200 | 102510 |
| R345 | 602 | E10 |  | Anahí Cisneros | Judith Fabiola Arevalo Valdez de Franco | 2025-06-07 | 2. Reserva | 1529194.3266091 | 152894.33 |
| R346 | 612 | A8 | Plan de pagos especiales | Antonio Rada | Diego Jose Ortiz Cordero | 2024-01-19 | 4.Plan de pagos | 703500 | 70400 |
| R347 | 1611 | E8 |  | Brenda Búcaro | Marvin Osiel Fuentes Fuentes | 2023-07-07 | 4.Plan de pagos | 1437500 | 143800 |
| R348 | 906 | B8 |  | Antonio Rada | Jose Juan Barrientos Juarez | 2024-12-19 | 4.Plan de pagos | 1102644.57804107 | 110344.58 |
| R349 | 207 | C9 |  | Anahí Cisneros | Herman Antonio Ovalle Escamilla | 2025-10-26 | 2. Reserva | 1509100 | 105600 |
| R350 | 1408 | B8 |  | Erwin Cardona | GUILLERMO ALFREDO SAENZ DE TEJADA VILLEDA | 2026-01-05 | 2.Reserva | 1434900 | 100400 |
| R351 | 105 | B7.1 |  | Erwin Cardona | Nery Adolfo Ortíz Alvarez | 2025-12-09 | 2.Reserva | 1192700 | 83500 |
| R352 | 906 | B8 |  | Erwin Cardona | Nery Adolfo Ortíz Alvarez | 2025-12-09 | 2.Reserva | 1102644.58 | 110344.58 |
| R353 | 403 | A6 |  | Antonio Rada | Denis Estuardo Mazariegos Fuentes | 2023-08-20 | 4.Plan de pagos | 699700 | 70000 |
| R354 | 914 | B1 |  | Antonio Rada | Raul Estuardo Gomez Aroche | 2023-07-15 | 2.Reserva | 883300 | 88400 |
| R355 | 1502 | D2 |  | Sofia Paredes | Pablo Gustavo Galdamez Grajeda | 2023-06-13 | 2.Reserva | 1333525.22645793 | 131660 |
| R356 | 1509 | B4 |  | Antonio Rada | Lilian Zahyra García Rosales | 2023-03-25 | 4.Plan de pagos | 850547.01 | 85147.01 |
| R357 | 307 | B6 |  | Erwin Cardona | Héctor Salvador Júarez Hernández / Angee Brizel Canelas Diaz | 2025-12-08 | 4.Plan de pagos | 1055600 | 73892 |
| R358 | 502 | E10 |  | Laura Molina | Rudy Baldemar Villeda Vanegas / Marcia Corina Hernandez Ruiz de Villeda | 2025-06-24 | 4.Plan de pagos | 1590362.1 | 238562.1 |
| R364 | DESISTIMIENTOS UBICADOS Y NO RASTREADOS POR 180 GRADOS |  |  |  |  |  |  |  |  |
| R365 | APTO | MODELO |  | Vendedor | CLIENTE | FECHA | FECHA DEP. | P. VENTA | REC. NO. |
| R366 | 503 |  |  | Antonio Rada | Rubidia Inés González | 2024-09-30 | 2024-09-30 | 1036610 | 2375 |
| R367 | 504 |  |  | Antonio Rada | Luis Cordón | 2024-05-08 | 2024-05-08 | 887400 | 1590 |
| R368 | 607 |  |  | Antonio Rada | Billy Orellana Serrano | 2023-08-14 | 2023-08-14 | 722900 | 379 |
| R369 | 914 |  |  | Alejandra Calderón | Raúl Gomez | 2023-07-15 | 2023-07-15 | 883300 | 289 |
| R370 | 1305 |  |  | Antonio Rada | Franklin Santiesteban | 2023-06-01 | 2023-04-15 | 663200 | 24, 52 y 84 |

---
## 5. B5 PPTO

**Purpose:** Boulevard 5 budgeted installment schedule (presupuesto) per unit. Monthly planned enganche amounts for cash-flow forecasting. 298 units.
**Non-empty rows:** 308 | **Max columns:** 63

### Column Headers (Row 1)

- **A**: Apto
- **B**: Estatus
- **C**: 2023-03-31
- **D**: 2023-04-30
- **E**: 2023-05-31
- **F**: 2023-06-30
- **G**: 2023-07-31
- **H**: 2023-08-31
- **I**: 2023-09-30
- **J**: 2023-10-31
- **K**: 2023-11-30
- **L**: 2023-12-31
- **M**: 2024-01-31
- **N**: 2024-02-29
- **O**: 2024-03-31
- **P**: 2024-04-30
- **Q**: 2024-05-31
- **R**: 2024-06-30
- **S**: 2024-07-31
- **T**: 2024-08-31
- **U**: 2024-09-30
- **V**: 2024-10-31
- **W**: 2024-11-30
- **X**: 2024-12-31
- **Y**: 2025-01-31
- **Z**: 2025-02-28
- **AA**: 2025-03-31
- **AB**: 2025-04-30
- **AC**: 2025-05-31
- **AD**: 2025-06-30
- **AE**: 2025-07-31
- **AF**: 2025-08-31
- **AG**: 2025-09-30
- **AH**: 2025-10-31
- **AI**: 2025-11-30
- **AJ**: 2025-12-31
- **AK**: 2026-01-31
- **AL**: 2026-02-28
- **AM**: 2026-03-31
- **AN**: 2026-04-30
- **AO**: 2026-05-31
- **AP**: 2026-06-30
- **AQ**: 2026-07-31
- **AR**: 2026-08-31
- **AS**: 2026-09-30
- **AT**: 2026-10-31
- **AU**: 2026-11-30
- **AV**: 2026-12-31
- **AW**: 2027-01-31
- **AX**: 2027-02-28
- **AY**: 2027-03-31
- **AZ**: 2027-04-30
- **BA**: 2027-05-31
- **BB**: 2027-06-30
- **BC**: TOTAL
- **BD**: a
- **BE**: b
- **BF**: c
- **BG**: Cant. Cuotas
- **BH**: Valor Cuotas
- **BI**: Appto.
- **BJ**: Mes
- **BK**: Acumulado

### DB Mapping

| Column | DB Target |
|--------|-----------|
| Apto | `rv_units.unit_number` |
| Estatus | `rv_units.status` |
| Monthly date columns | budgeted payment amounts (presupuesto) → compare vs `payments.amount` |
| TOTAL | `sales.down_payment` (total enganche budgeted) |
| Cant. Cuotas | `sales.cuotas_enganche` |
| Valor Cuotas | computed: down_payment / cuotas_enganche |

### Data Rows (unit + status + non-zero count)

| Row | Unit | Status | Non-zero monthly values |
|-----|------|--------|------------------------|
| R2 | 101 | 4.Plan de pagos | 42 |
| R3 | 102 | 4.Plan de pagos | 15 |
| R4 | 103 | 4.Plan de pagos | 35 |
| R5 | 104 | 4.Plan de pagos | 32 |
| R6 | 105 | 1.Disponible | 2 |
| R7 | 106 | 4.Plan de pagos | 15 |
| R8 | 107 | 2.Reserva | 2 |
| R9 | 108 | 2.Reserva | 2 |
| R10 | 109 | 4.Plan de pagos | 26 |
| R11 | 110 | 4.Plan de pagos | 33 |
| R12 | 111 | 4.Plan de pagos | 42 |
| R13 | 112 | 4.Plan de pagos | 42 |
| R14 | 113 | 4.Plan de pagos | 9 |
| R15 | 114 | 4.Plan de pagos | 42 |
| R16 | 201 | 2.Reserva | 2 |
| R17 | 202 | 4.Plan de pagos | 22 |
| R18 | 203 | 2.Reserva | 2 |
| R19 | 204 | 4.Plan de pagos | 27 |
| R20 | 205 | 4.Plan de pagos | 24 |
| R21 | 206 | 1.Disponible | 2 |
| R22 | 207 | 2.Reserva | 2 |
| R23 | 208 | 2.Reserva | 2 |
| R24 | 209 | 4.Plan de pagos | 9 |
| R25 | 210 | 4.Plan de pagos | 20 |
| R26 | 211 | 2.Reserva | 2 |
| R27 | 212 | 4.Plan de pagos | 29 |
| R28 | 213 | 4.Plan de pagos | 24 |
| R29 | 214 | 4.Plan de pagos | 29 |
| R30 | 215 | 4.Plan de pagos | 25 |
| R31 | 216 | 4.Plan de pagos | 25 |
| R32 | 301 | 4.Plan de pagos | 24 |
| R33 | 302 | 4.Plan de pagos | 19 |
| R34 | 303 | 2.Reserva | 2 |
| R35 | 304 | 4.Plan de pagos | 22 |
| R36 | 305 | 4.Plan de pagos | 22 |
| R37 | 306 | 4.Plan de pagos | 14 |
| R38 | 307 | 2.Reserva | 2 |
| R39 | 308 | 4.Plan de pagos | 22 |
| R40 | 309 | 4.Plan de pagos | 23 |
| R41 | 310 | 2.Reserva | 2 |
| R42 | 311 | 4.Plan de pagos | 8 |
| R43 | 312 | 4.Plan de pagos | 25 |
| R44 | 313 | 4.Plan de pagos | 26 |
| R45 | 314 | 4.Plan de pagos | 19 |
| R46 | 315 | 4.Plan de pagos | 22 |
| R47 | 316 | 4.Plan de pagos | 30 |
| R48 | 317 | 4.Plan de pagos | 29 |
| R49 | 318 | 4.Plan de pagos | 29 |
| R50 | 319 | 4.Plan de pagos | 26 |
| R51 | 320 | 4.Plan de pagos | 32 |
| R52 | 401 | 4.Plan de pagos | 27 |
| R53 | 402 | 4.Plan de pagos | 28 |
| R54 | 403 | 1.Disponible | 2 |
| R55 | 404 | 4.Plan de pagos | 30 |
| R56 | 405 | 4.Plan de pagos | 15 |
| R57 | 406 | 4.Plan de pagos | 21 |
| R58 | 407 | 4.Plan de pagos | 19 |
| R59 | 408 | 4.Plan de pagos | 20 |
| R60 | 409 | 4.Plan de pagos | 23 |
| R61 | 410 | 4.Plan de pagos | 20 |
| R62 | 411 | 4.Plan de pagos | 15 |
| R63 | 412 | 4.Plan de pagos | 9 |
| R64 | 413 | 4.Plan de pagos | 24 |
| R65 | 414 | 4.Plan de pagos | 26 |
| R66 | 415 | 4.Plan de pagos | 21 |
| R67 | 416 | 4.Plan de pagos | 24 |
| R68 | 417 | 4.Plan de pagos | 29 |
| R69 | 418 | 4.Plan de pagos | 21 |
| R70 | 419 | 4.Plan de pagos | 29 |
| R71 | 420 | 4.Plan de pagos | 24 |
| R72 | 501 | 4.Plan de pagos | 24 |
| R73 | 502 | 2.Reserva | 2 |
| R74 | 503 | 4.Plan de pagos | 21 |
| R75 | 504 | 4.Plan de pagos | 21 |
| R76 | 505 | 4.Plan de pagos | 24 |
| R77 | 506 | 4.Plan de pagos | 21 |
| R78 | 507 | 4.Plan de pagos | 32 |
| R79 | 508 | 4.Plan de pagos | 24 |
| R80 | 509 | 4.Plan de pagos | 25 |
| R81 | 510 | 4.Plan de pagos | 25 |
| R82 | 511 | 4.Plan de pagos | 26 |
| R83 | 512 | 4.Plan de pagos | 33 |
| R84 | 513 | 4.Plan de pagos | 33 |
| R85 | 514 | 4.Plan de pagos | 23 |
| R86 | 515 | 4.Plan de pagos | 42 |
| R87 | 516 | 4.Plan de pagos | 22 |
| R88 | 517 | 4.Plan de pagos | 26 |
| R89 | 518 | 4.Plan de pagos | 27 |
| R90 | 519 | 4.Plan de pagos | 19 |
| R91 | 601 | 4.Plan de pagos | 21 |
| R92 | 602 | 4.Plan de pagos | 9 |
| R93 | 603 | 4.Plan de pagos | 24 |
| R94 | 604 | 4.Plan de pagos | 24 |
| R95 | 605 | 4.Plan de pagos | 22 |
| R96 | 606 | 4.Plan de pagos | 23 |
| R97 | 607 | 4.Plan de pagos | 22 |
| R98 | 608 | 4.Plan de pagos | 13 |
| R99 | 609 | 4.Plan de pagos | 26 |
| R100 | 610 | 4.Plan de pagos | 26 |
| R101 | 611 | 4.Plan de pagos | 22 |
| R102 | 612 | 4.Plan de pagos | 18 |
| R103 | 613 | 4.Plan de pagos | 33 |
| R104 | 614 | 4.Plan de pagos | 9 |
| R105 | 615 | 4.Plan de pagos | 36 |
| R106 | 616 | 4.Plan de pagos | 25 |
| R107 | 617 | 4.Plan de pagos | 26 |
| R108 | 618 | 4.Plan de pagos | 22 |
| R109 | 619 | 4.Plan de pagos | 23 |
| R110 | 701 | 4.Plan de pagos | 42 |
| R111 | 702 | 4.Plan de pagos | 36 |
| R112 | 703 | 4.Plan de pagos | 25 |
| R113 | 704 | 4.Plan de pagos | 24 |
| R114 | 705 | 4.Plan de pagos | 23 |
| R115 | 706 | 4.Plan de pagos | 22 |
| R116 | 707 | 4.Plan de pagos | 22 |
| R117 | 708 | 4.Plan de pagos | 13 |
| R118 | 709 | 4.Plan de pagos | 2 |
| R119 | 710 | 4.Plan de pagos | 2 |
| R120 | 711 | 4.Plan de pagos | 25 |
| R121 | 712 | 4.Plan de pagos | 34 |
| R122 | 713 | 4.Plan de pagos | 34 |
| R123 | 714 | 4.Plan de pagos | 24 |
| R124 | 715 | 4.Plan de pagos | 42 |
| R125 | 716 | 4.Plan de pagos | 27 |
| R126 | 717 | 4.Plan de pagos | 27 |
| R127 | 718 | 4.Plan de pagos | 2 |
| R128 | 719 | 4.Plan de pagos | 2 |
| R129 | 801 | 4.Plan de pagos | 33 |
| R130 | 802 | 4.Plan de pagos | 34 |
| R131 | 803 | 4.Plan de pagos | 42 |
| R132 | 804 | 4.Plan de pagos | 34 |
| R133 | 805 | 4.Plan de pagos | 26 |
| R134 | 806 | 4.Plan de pagos | 22 |
| R135 | 807 | 4.Plan de pagos | 29 |
| R136 | 808 | 4.Plan de pagos | 25 |
| R137 | 809 | 4.Plan de pagos | 25 |
| R138 | 810 | 4.Plan de pagos | 34 |
| R139 | 811 | 4.Plan de pagos | 8 |
| R140 | 812 | 4.Plan de pagos | 8 |
| R141 | 813 | 4.Plan de pagos | 20 |
| R142 | 814 | 4.Plan de pagos | 29 |
| R143 | 815 | 4.Plan de pagos | 26 |
| R144 | 816 | 4.Plan de pagos | 42 |
| R145 | 817 | 4.Plan de pagos | 41 |
| R146 | 818 | 4.Plan de pagos | 33 |
| R147 | 819 | 4.Plan de pagos | 35 |
| R148 | 820 | 4.Plan de pagos | 27 |
| R149 | 901 | 4.Plan de pagos | 42 |
| R150 | 902 | 4.Plan de pagos | 27 |
| R151 | 903 | 4.Plan de pagos | 35 |
| R152 | 904 | 4.Plan de pagos | 35 |
| R153 | 905 | 4.Plan de pagos | 26 |
| R154 | 906 | 2.Reserva | 2 |
| R155 | 907 | 4.Plan de pagos | 11 |
| R156 | 908 | 4.Plan de pagos | 27 |
| R157 | 909 | 4.Plan de pagos | 33 |
| R158 | 910 | 1.Disponible | 2 |
| R159 | 911 | 4.Plan de pagos | 31 |
| R160 | 912 | 4.Plan de pagos | 28 |
| R161 | 913 | 4.Plan de pagos | 24 |
| R162 | 914 | 4.Plan de pagos | 27 |
| R163 | 915 | 4.Plan de pagos | 31 |
| R164 | 916 | 4.Plan de pagos | 35 |
| R165 | 917 | 4.Plan de pagos | 35 |
| R166 | 918 | 4.Plan de pagos | 33 |
| R167 | 919 | 4.Plan de pagos | 42 |
| R168 | 920 | 4.Plan de pagos | 28 |
| R169 | 1001 | 4.Plan de pagos | 36 |
| R170 | 1002 | 4.Plan de pagos | 42 |
| R171 | 1003 | 4.Plan de pagos | 35 |
| R172 | 1004 | 4.Plan de pagos | 35 |
| R173 | 1005 | 4.Plan de pagos | 34 |
| R174 | 1006 | 4.Plan de pagos | 26 |
| R175 | 1007 | 4.Plan de pagos | 31 |
| R176 | 1008 | 4.Plan de pagos | 24 |
| R177 | 1009 | 4.Plan de pagos | 26 |
| R178 | 1010 | 4.Plan de pagos | 32 |
| R179 | 1011 | 4.Plan de pagos | 42 |
| R180 | 1012 | 4.Plan de pagos | 28 |
| R181 | 1013 | 4.Plan de pagos | 31 |
| R182 | 1014 | 4.Plan de pagos | 34 |
| R183 | 1015 | 4.Plan de pagos | 37 |
| R184 | 1016 | 4.Plan de pagos | 36 |
| R185 | 1017 | 4.Plan de pagos | 36 |
| R186 | 1018 | 4.Plan de pagos | 7 |
| R187 | 1019 | 4.Plan de pagos | 19 |
| R188 | 1020 | 4.Plan de pagos | 2 |
| R189 | 1101 | 4.Plan de pagos | 25 |
| R190 | 1102 | 4.Plan de pagos | 41 |
| R191 | 1103 | 4.Plan de pagos | 35 |
| R192 | 1104 | 4.Plan de pagos | 26 |
| R193 | 1105 | 4.Plan de pagos | 42 |
| R194 | 1106 | 4.Plan de pagos | 36 |
| R195 | 1107 | 4.Plan de pagos | 32 |
| R196 | 1108 | 4.Plan de pagos | 42 |
| R197 | 1109 | 4.Plan de pagos | 28 |
| R198 | 1110 | 4.Plan de pagos | 35 |
| R199 | 1111 | 4.Plan de pagos | 26 |
| R200 | 1112 | 4.Plan de pagos | 34 |
| R201 | 1113 | 4.Plan de pagos | 36 |
| R202 | 1114 | 4.Plan de pagos | 26 |
| R203 | 1115 | 4.Plan de pagos | 22 |
| R204 | 1116 | 4.Plan de pagos | 26 |
| R205 | 1117 | 4.Plan de pagos | 28 |
| R206 | 1118 | 4.Plan de pagos | 25 |
| R207 | 1201 | 4.Plan de pagos | 25 |
| R208 | 1202 | 4.Plan de pagos | 26 |
| R209 | 1203 | 4.Plan de pagos | 32 |
| R210 | 1204 | 4.Plan de pagos | 26 |
| R211 | 1205 | 4.Plan de pagos | 42 |
| R212 | 1206 | 4.Plan de pagos | 35 |
| R213 | 1207 | 4.Plan de pagos | 42 |
| R214 | 1208 | 4.Plan de pagos | 36 |
| R215 | 1209 | 4.Plan de pagos | 42 |
| R216 | 1210 | 4.Plan de pagos | 36 |
| R217 | 1211 | 4.Plan de pagos | 29 |
| R218 | 1212 | 4.Plan de pagos | 36 |
| R219 | 1213 | 4.Plan de pagos | 36 |
| R220 | 1214 | 4.Plan de pagos | 34 |
| R221 | 1215 | 4.Plan de pagos | 36 |
| R222 | 1216 | 4.Plan de pagos | 20 |
| R223 | 1217 | 4.Plan de pagos | 24 |
| R224 | 1218 | 4.Plan de pagos | 26 |
| R225 | 1301 | 4.Plan de pagos | 25 |
| R226 | 1302 | 4.Plan de pagos | 26 |
| R227 | 1303 | 4.Plan de pagos | 32 |
| R228 | 1304 | 4.Plan de pagos | 30 |
| R229 | 1305 | 4.Plan de pagos | 20 |
| R230 | 1306 | 4.Plan de pagos | 35 |
| R231 | 1307 | 4.Plan de pagos | 10 |
| R232 | 1308 | 4.Plan de pagos | 30 |
| R233 | 1309 | 1.Disponible | 2 |
| R234 | 1310 | 4.Plan de pagos | 42 |
| R235 | 1311 | 4.Plan de pagos | 30 |
| R236 | 1312 | 4.Plan de pagos | 36 |
| R237 | 1313 | 4.Plan de pagos | 36 |
| R238 | 1314 | 4.Plan de pagos | 42 |
| R239 | 1315 | 4.Plan de pagos | 20 |
| R240 | 1316 | 4.Plan de pagos | 29 |
| R241 | 1317 | 4.Plan de pagos | 23 |
| R242 | 1318 | 2.Reserva | 2 |
| R243 | 1401 | 4.Plan de pagos | 29 |
| R244 | 1402 | 4.Plan de pagos | 22 |
| R245 | 1403 | 4.Plan de pagos | 42 |
| R246 | 1404 | 4.Plan de pagos | 42 |
| R247 | 1405 | 4.Plan de pagos | 36 |
| R248 | 1406 | 4.Plan de pagos | 42 |
| R249 | 1407 | 4.Plan de pagos | 32 |
| R250 | 1408 | 2.Reserva | 2 |
| R251 | 1409 | 4.Plan de pagos | 32 |
| R252 | 1410 | 4.Plan de pagos | 26 |
| R253 | 1411 | 4.Plan de pagos | 34 |
| R254 | 1412 | 4.Plan de pagos | 41 |
| R255 | 1501 | 4.Plan de pagos | 16 |
| R256 | 1502 | 4.Plan de pagos | 21 |
| R257 | 1503 | 4.Plan de pagos | 42 |
| R258 | 1504 | 4.Plan de pagos | 35 |
| R259 | 1505 | 4.Plan de pagos | 24 |
| R260 | 1506 | 1.Disponible | 2 |
| R261 | 1507 | 4.Plan de pagos | 42 |
| R262 | 1508 | 4.Plan de pagos | 42 |
| R263 | 1509 | 4.Plan de pagos | 20 |
| R264 | 1510 | 4.Plan de pagos | 34 |
| R265 | 1511 | 4.Plan de pagos | 32 |
| R266 | 1512 | 1.Disponible | 2 |
| R267 | 1601 | 4.Plan de pagos | 32 |
| R268 | 1602 | 4.Plan de pagos | 2 |
| R269 | 1603 | 4.Plan de pagos | 37 |
| R270 | 1604 | 4.Plan de pagos | 35 |
| R271 | 1605 | 4.Plan de pagos | 23 |
| R272 | 1606 | 1.Disponible | 2 |
| R273 | 1607 | 2.Reserva | 26 |
| R274 | 1608 | 4.Plan de pagos | 42 |
| R275 | 1609 | 4.Plan de pagos | 42 |
| R276 | 1610 | 4.Plan de pagos | 34 |
| R277 | 1611 | 2.Reserva | 16 |
| R278 | 1612 | 2.Reserva | 2 |
| R279 | 1701 | 4.Plan de pagos | 42 |
| R280 | 1702 | 4.Plan de pagos | 36 |
| R281 | 1703 | 4.Plan de pagos | 22 |
| R282 | 1704 | 4.Plan de pagos | 42 |
| R283 | 1705 | 4.Plan de pagos | 10 |
| R284 | 1706 | 4.Plan de pagos | 42 |
| R285 | 1707 | 4.Plan de pagos | 24 |
| R286 | 1708 | 4.Plan de pagos | 17 |
| R287 | 1801 | 4.Plan de pagos | 42 |
| R288 | 1802 | 4.Plan de pagos | 35 |
| R289 | 1803 | 4.Plan de pagos | 2 |
| R290 | 1804 | 4.Plan de pagos | 42 |
| R291 | 1805 | 4.Plan de pagos | 2 |
| R292 | 1806 | 4.Plan de pagos | 42 |
| R293 | 1807 | 4.Plan de pagos | 42 |
| R294 | 1808 | 4.Plan de pagos | 31 |
| R295 | 1901 | 4.Plan de pagos | 42 |
| R296 | 1902 | 4.Plan de pagos | 35 |
| R297 | 1903 | 4.Plan de pagos | 35 |
| R298 | 1904 | 4.Plan de pagos | 35 |
| R299 | 1905 | 4.Plan de pagos | 35 |
| R301 | Estimación a recibir |  | 42 |
| R302 | Estimación a recibir Mayo 2025 |  | 0 |
| R303 | Estimación flujo acumulado |  | 55 |
| R305 | Total de Cuotas F&F y Casos Especiales |  | 37 |
| R307 | F&F (Que NO pagan Cuotas) |  | 37 |
| R308 | F&F (Que SÍ pagan Cuotas) |  | 37 |
| R309 | Diferencia |  | 0 |
| R311 | Flujo Neto (sin F&F y Casos Esp) |  | 42 |
| R313 | Acumulado sin F&F |  | 52 |

---

## 6. RESUMEN B5

**Purpose:** Boulevard 5 summary dashboard. Monthly and cumulative collection metrics, reconciliation, desistimiento totals, unit-status breakdown. Company: INMOBILIARIA EL GRAN JAGUAR. Data as of 2026-03-31.
**Non-empty rows:** 12 | **Max columns:** 34

### DB Mapping

| Column Group | DB Target |
|-------------|-----------|
| Cobro esperado / efectuado mensual | budget vs `SUM(payments.amount)` for current month |
| Cobro esperado / efectuado acumulado | budget vs `SUM(payments.amount)` to date |
| Cobros Netos Acumulados | net after F&F exclusions |
| Saldo Conciliado | reconciled balance |
| Cobros Desistimientos | `SUM(payments.amount)` where `reservation_status=DESISTED` |
| ESTATUS counts | `COUNT(rv_units)` grouped by status |

### All Data Rows

- **R2**: INMOBILIARIA EL GRAN JAGUAR, S.A.
- **R3**: BOULEVARD 5
- **R4**: RESUMEN DE COBROS 
- **R5**: Datos al: | 2026-03-31
- **R6**: ( + ) A | ( - ) B | ( = ) C | ( + ) D | ( - ) E | ( C ) - (D-E) | ( + ) | ( - )
- **R7**: Resumen | Mensual | Acumulado | Efectivo acum. que se debió recibir | Cobros por Efectuar (Casos Especiales / F&F) | Cobros Netos Acumulados | Cobros realizados | Cobros Adicionales | Saldo Conciliado | Cobros por Efectuar (Clientes en Mora) | Diferencia | Cobros (Desistimientos) | Devoluciones (Desistimientos) | (Faltante) / Sobrante en Flujo de Caja
- **R8**: Cobro 
esperado | Cobro  
efectuado | Diferencia | % 
de cobro  | % 
de cobro pendiente | Cobro
esperado | Cobro 
efectuado | Diferencia | % 
de cobro  | % 
de cobro pendiente | Efectivo acum. que se debió recibir | Cobros por Efectuar (Casos Especiales / F&F) | Cobros Netos Acumulados | Cobros realizados | Cobros Adicionales | Saldo Conciliado | Cobros por Efectuar (Clientes en Mora) | Diferencia | Cobros (Desistimientos) | Devoluciones (Desistimientos) | (Faltante) / Sobrante en Flujo de Caja | Total adeudado | Diferencia | % 
pendientede cobro 
- **R9**: COBROS | 561068 | 1800116.996 | 1239048.996 | ▲ | 3.2083758047152933 | 2.2083758047152933 | 28234648.579999983 | 33125865.323999986 | 4891216.744000003 | ▲ | 1.1732345536421762 | 0.17323455364217624 | 1984632.2369688998 | 0 | 1984632.2369688998 | 1796269.2600000005 | 165009.51303109998 | 353372.4899999993 | 353372.49000000005 | -7.566995918750763e-10 | 85059.18 | -268313.3099999993 | 32587327.589999996 | -538537.7339999899 | ▲ | -0.016525986444044887
- **R10**: #REF!
- **R11**: Resumen | Total Apartamentos | Cliente al día | Cliente atrasado | #NUM! | Disponible | Enganche completado | Superávit de Enganche | Pendiente Plan de Pagos | F&F
- **R12**: ESTATUS | 298 | 41 | 89 | 8 | 72 | 88 | 0 | 0
- **R13**: 1 | 0.13758389261744966 | 0.2986577181208054 | 0.026845637583892617 | 0.24161073825503357 | 0.2953020134228188 | 0 | 0 | 0

---

## 7. B5 Alerta

**Purpose:** Boulevard 5 alert/pivot table. Client payment status summary with expected vs actual collections by status bucket (Cliente al día, Cliente Atrasado, Enganche Completado, Disponible, Superávit). Project: GRAN JAGUAR.
**Non-empty rows:** 271 | **Max columns:** 21

### Column Headers (Row 6)

- **C**: ESTATUS CLIENTE
- **D**: Apto.
- **E**: Cliente
- **F**: Cobro esperado mensual
- **G**: Cobro efectuado mensual
- **H**: Cobro esperado acumulado
- **I**: Cobro efectuado acumulado
- **J**: Total adeudado
- **K**: Cuenta de TOTAL
- **L**: Diferencia del mes
- **M**: Diferencia acumulado
- **N**: Diferencia Total adeudado

### DB Mapping

| Column | DB Target |
|--------|-----------|
| ESTATUS CLIENTE | computed from payment compliance |
| Apto. | `rv_units.unit_number` |
| Cliente | `rv_clients.full_name` |
| Cobro esperado mensual | budgeted from `enganche_schedule` |
| Cobro efectuado mensual | `SUM(payments.amount)` current month |
| Cobro esperado acumulado | `SUM(budgeted to date)` |
| Cobro efectuado acumulado | `SUM(payments.amount)` to date |
| Total adeudado | `sales.down_payment` remaining |
| Cuenta de TOTAL | `COUNT(units)` in bucket |
| Diferencia del mes | expected_month - actual_month |
| Diferencia acumulado | expected_accum - actual_accum |

### Summary Rows (R7–R12)

| Row | Status Bucket | Expected Monthly | Actual Monthly | Expected Accum | Actual Accum | Total Owed | Count |
|-----|---------------|-----------------|----------------|----------------|-------------|------------|-------|
| R7 | Cliente al día | 245642 | 465225.22 | 2823738.3000000003 | 3090303.19 | 4167918.8900000006 | 37 |
| R8 | Cliente Atrasado | 260709 | 308490 | 9846098.73 | 9060911.99 | 11229043.530000001 | 65 |
| R9 | Enganche Completado | 28685 | 94259.22 | 7608654.32 | 7802142.32 | 7802142.32 | 69 |
| R10 | Disponible | 0 |  | 0 | 0 | 678400 | 8 |
| R11 | Superávit de Enganche | 26032 | 932142.556 | 7956157.230000001 | 13172507.824000001 | 8709822.85 | 87 |
| R12 | Total general | 561068 | 1800116.996 | 28234648.57999999 | 33125865.32399999 | 32587327.589999996 | 266 |

---
## 8. BENES

**Purpose:** Benestare (older version) reservation and installment-collection sheet. Towers A and B. Company: BENESTARE / CHINAUTLA. Report date: 31 de Julio 2025. Includes desistimientos section at bottom.
**Non-empty rows:** 133 | **Max columns:** 64

### Column Headers (Row 6)

- **B**: Apto
- **C**: Torre
- **D**: Tipo
- **E**: Vendedor
- **F**: Cliente
- **G**: Reservado
- **H**: Estatus
- **I**: Precio de Venta
- **J**: Enganche
- **K**: 2023-03-31
- **L**: 2023-04-30
- **M**: 2023-05-31
- **N**: 2023-06-30
- **O**: 2023-07-31
- **P**: 2023-08-31
- **Q**: 2023-09-30
- **R**: 2023-10-31
- **S**: 2023-11-30
- **T**: 2023-12-31
- **U**: 2024-01-31
- **V**: 2024-02-29
- **W**: 2024-03-31
- **X**: 2024-04-30
- **Y**: 2024-05-31
- **Z**: 2024-06-30
- **AA**: 2024-07-31
- **AB**: 2024-08-31
- **AC**: 2024-09-30
- **AD**: 2024-10-31
- **AE**: 2024-11-30
- **AF**: 2024-12-31
- **AG**: 2025-01-31
- **AH**: 2025-02-28
- **AI**: 2025-03-31
- **AJ**: 2025-04-30
- **AK**: 2025-05-31
- **AL**: 2025-06-30
- **AM**: 2025-07-01
- **AN**: TOTAL COBROS Y RESERVAS
- **AO**: % Cobro
- **AP**: SALDO PENDIENTE ENGANCHE
- **AQ**: % Pendiente
- **AR**: Monto a Financiar por Banco
- **AS**: % a Financiar
- **AT**: Proyección de Cobros (S/ Modelo Financiero)
- **AU**: Status inmueble
- **AV**: ESTATUS CLIENTE
- **AW**: Cuotas Pactadas
- **AX**: Cuota de Enganche
- **AY**: Total cuotas pactadas
- **AZ**: Monto de Reserva Pactado
- **BA**: Monto de Cuota Pactada
- **BB**: Cuotas Pagadas
- **BC**: Cantidad de cuotas que deben estar pagadas
- **BD**: Monto que debe estar cancelado a la fecha
- **BE**: Monto pagado de cuotas a la fecha
- **BF**: Enganche + Cuotas Extraordinarias Pagadas
- **BG**: Diferencia
- **BH**: Cobro adicional a lo pactado
- **BI**: Cobro no realizado según lo pactado
- **BJ**: Cuotas
- **BK**: Caso Especial / F&F
- **BL**: Observaciones

### DB Mapping

| Column | DB Target |
|--------|-----------|
| Apto | `rv_units.unit_number` |
| Torre | `towers.name` |
| Tipo | `rv_units.unit_type` |
| Vendedor | `salespeople.name` |
| Cliente | `rv_clients.full_name` |
| Reservado | `reservations.created_at` |
| Estatus | `rv_units.status` |
| Precio de Venta | `sales.sale_price` |
| Enganche | `sales.down_payment` |
| Date columns (2023-03 … 2025-07) | `payments.payment_date` + `payments.amount` |
| TOTAL COBROS Y RESERVAS | `SUM(payments.amount)` |
| Cuotas Pactadas | `sales.cuotas_enganche` |
| Monto de Reserva Pactado | `reservations.reserva_amount` |
| Cuotas Pagadas | `COUNT(payments)` phase 2 |
| Caso Especial / F&F | `rv_clients.is_ff` |

### Active Reservation Rows (R7–R86)

| Row | Ref | Unit | Tower | Type | Salesperson | Client | Date | Status | Price (GTQ) | Enganche (GTQ) |
|-----|-----|------|-------|------|-------------|--------|------|--------|-------------|----------------|
| R7 | B-101 | 101 | A | B | Luis Esteban | Wendy Azucena Barrientos Salazar | 2024-03-23 | 4.Plan de pagos | 477700 | 24000 |
| R8 | B-102 | 102 | A | B | Luis Esteban | Orfa Sarai Santos Morales | 2024-06-10 | 4.Plan de pagos | 477700 | 23900 |
| R9 | B-103 | 109 | A | C | Pedro Sarti | María Angela Rodríguez | 2025-01-04 | 4.Plan de pagos | 477700 | 24000 |
| R10 |  | 104 | TB | C | José Gutierrez | CARLOS ALFONSO CASTRO MARTINEZ | 2025-07-20 | 1.Disponible | 497900 | 49800 |
| R11 | B-105 | 104 | A | B | Abigail Garcia | Astrid Marleny Pineda Gonzalez | 2023-11-28 | 4.Plan de pagos | 494900 | 23900 |
| R12 | B-106 | 106 | B | B | Karina Fuentes | Loida Sarai Morales Garcia | 2024-03-03 | 4.Plan de pagos | 477700 | 47800 |
| R13 | B-107 | 105 | A | A | Abigail Garcia | Juan Carlos Carrillo Hernandez | 2023-10-02 | 4.Plan de pagos | 384700 | 38500 |
| R14 | B-108 | 110 | A | B |  |  |  | 1.Disponible | 477700 | 95600 |
| R15 | B-109 | 108 | A | B | Alejandra Calderón | Heidi Lisseth Morataya Flores | 2023-10-03 | 4.Plan de pagos | 494900 | 49490 |
| R16 | B-110 | 103 | A | C | Abigail Garcia | Helen Lorena Monroy Jauregui | 2024-02-26 | 4.Plan de pagos | 477700 | 24000 |
| R17 |  | 111 | TB | C |  |  |  | 1.Disponible | 477000 | 24000 |
| R18 |  | 112 | TB | B |  |  |  | 1.Disponible | 477700 | 24000 |
| R19 |  | 113 | TB | B |  |  |  | 1.Disponible | 477700 | 24000 |
| R20 | B-201 | 201 | A | B | Luis Esteban | Andrea Celeste Aparicio Juarez | 2024-04-07 | 4.Plan de pagos | 477700 | 24000 |
| R21 | B-202 | 210 | A | B | Efren Sanchez | Carlos Humberto Joel Alvizures Carmona / Katherine Areli Turcios Alvarez | 2024-10-04 | 4.Plan de pagos | 477700 | 23900 |
| R22 | B-203 | 202 | A | C | Karina Fuentes | Byron Juventino López Mayen | 2023-11-27 | 4.Plan de pagos | 497900 | 49800 |
| R23 | B-204 | 203 | A | C | Abigail Garcia | Jesica Paola Noj Ramirez | 2024-07-06 | 4.Plan de pagos | 477000 | 24000 |
| R24 | B-205 | 204 | A | B | Abigail Garcia | Gerber Eliezer Perez Alonzo | 2024-07-06 | 4.Plan de pagos | 477700 | 24000 |
| R25 | B-206 | 206 | B | B | Abigail Garcia | Cristina Elizabeth Musin Hernandez | 2024-05-18 | 4.Plan de pagos | 477700 | 24000 |
| R26 | B-207 | 205 | A | A | Abigail Garcia | Saulo Josue Escobar Pérez | 2023-11-09 | 4.Plan de pagos | 384700 | 38500 |
| R27 | B-208 | 207 | A | B | Abigail Garcia | Monica Aide Espital Balan | 2023-10-25 | 4.Plan de pagos | 494900 | 49500 |
| R28 |  | 209 | TB | B |  | Se volvío a vender | 2025-07-13 | 1.Disponible |  | 24000 |
| R29 | B-210 | 209 | A | C | Antonio Rada | Joyce Sharon Cruz Arguello | 2024-10-14 | 4.Plan de pagos | 477000 | 23900 |
| R30 |  | 211 | TB | C |  |  |  | 1.Disponible | 507200 | 50720 |
| R31 |  | 212 | TB | B |  |  |  | 1.Disponible | 507200 | 50720 |
| R32 |  | 213 | TB | B | Abigail Garcia | Edgar Giovanni Palomo Robles | 2024-03-21 | 4.Plan de pagos | 477700 | 24000 |
| R33 | B-301 | 301 | A | B | Eder Veliz | Erick Alejandro Martinez Morales | 2025-05-30 | 4.Plan de pagos | 477700 | 23900 |
| R34 | B-303 | 302 | A | C | Eder Veliz | Victor Manuel Mijangos Castillo | 2025-05-26 | 4.Plan de pagos | 477000 | 23900 |
| R35 | B-303 | 303 | A | C | Antonio Rada | Xiomara Edith García Solís De Morales | 2024-12-09 | 4.Plan de pagos | 477000 | 23900 |
| R36 |  | 305 | B | B | Efren Sanchez | Angel Renato Muñoz de León  | 2025-07-15 | 2.Reservado | 487700 | 24400 |
| R37 | B-306 | 304 | A | B | Efren Sanchez | Saul Esteban Mayen Santos | 2024-09-30 | 4.Plan de pagos | 477700 | 23900 |
| R38 |  | 306 | TB | A | Efren Sanchez | Mayra Judith Barrera Zavala | 2025-04-20 | 4.Plan de pagos | 964442 | 48242 |
| R39 |  | 305 | A | A | SIN DATOS | Andrea Yohana Cabrera Velasquez | 2025-06-06 | 2.Reservado | 394300 | 39430 |
| R40 |  | 308 | TB | B | Pablo Marroquín | Luis Javier Aguilar España | 2025-07-06 | 4.Plan de pagos | 487700 | 24400 |
| R41 |  | 309 | A | B | SIN DATOS | Rosita Elvira Clara Pineda | 2025-06-25 | 1.Disponible | 507200 | 50720 |
| R42 |  | 306 | A | B | SIN DATOS | Andrea Nohemi Rivas Sanchez  | 2025-06-22 | 1.Disponible | 507200 | 50720 |
| R43 | B-310 | 308 | A | C | Abigail Garcia | Eddy Daniel Roque Arellanos | 2024-04-08 | 4.Plan de pagos | 477000 | 24000 |
| R44 | B-311 | 311 | B | C | Antonio Rada | Pedro David Pérez Barrios | 2024-05-15 | 4.Plan de pagos | 477000 | 23900 |
| R45 |  | 312 | TB | B |  |  |  | 1.Disponible | 507200 | 50720 |
| R46 |  | 313 | TB | B | SIN DATOS | Suarlim Eli Barrientos Pazos | 2025-07-31 | 2.Reservado | 507200 | 50720 |
| R47 | B-401 | 401 | A | B | Karina Fuentes | Lourdes Ofelia Baires | 2023-12-02 | 4.Plan de pagos | 494900 | 49500 |
| R48 | B-402 | 409 | A | B | Efren Sanchez | Rudy Ronaldo Peña Larios | 2025-03-31 | 4.Plan de pagos | 477700 | 23900 |
| R49 | B-403 | 402 | A | C | Efren Sanchez | Hector Samuel Tum Lancerio Y Ingrid Fabiola Gonzalez Godinez | 2024-11-29 | 4.Plan de pagos | 477000 | 23900 |
| R50 | B-404 | 403 | A | C | Luis Esteban | Luis Fernando Tique Santos | 2024-05-14 | 4.Plan de pagos | 477000 | 23900 |
| R51 |  | 405 | A | A | Efren Sanchez | Sara Esmeralda López Hernández | 2025-06-30 | Reservado | 369600 | 18500 |
| R52 | B-406 | POR ASIGNAR |  | B | Antonio Rada | Marvin Leonel Alexander Larias Guzman | 2024-08-07 | 4.Plan de pagos | 477700 | 23900 |
| R53 |  | 407 | TB | A |  |  |  | 1.Disponible | 394300 | 39430 |
| R54 | B-408 | 407 | A | B | Eder Veliz | Alan Emanuel Tunches Huertas | 2025-05-10 | Reservado | 47700 | 50720 |
| R55 |  | 409 | TB | B | Eder Veliz | Kevin Fernando de la Cruz Toc | 2025-07-03 | Reservado | 477700 | 23900 |
| R56 | B-410 | 510 | A | C | Antonio Rada | Oscar Daniel Larias Guzman | 2024-08-07 | 4.Plan de pagos | 477000 | 23900 |
| R57 |  | 411 | TB | C |  | Astrid Angelica Herrera Gil / Kevin Alejandro López Toc | 2025-07-20 | Reservado | 507200 | 50720 |
| R58 |  | 412 | TB | B | Andrea Gonzalez | Nercy Jannyn Pérez Alonzo | 2024-07-31 | 4.Plan de pagos | 477700 | 24000 |
| R59 | B-413 | 410 | A | B | Abigail Garcia | Carla Yanira Castillo | 2024-03-17 | 4.Plan de pagos | 477700 | 24000 |
| R60 |  | 502 | A | B |  | Ronald Alberto Pineda Monroy | 2025-06-28 | 1.Disponible | 507200 | 50720 |
| R61 |  | 501 | TB | B | Pablo Marroquín | Hillary Kerstel Ixmucane Xona Guzmán / Francisca Guzmán López de Xoná | 2025-07-13 | 1.Disponible | 487700 | 24400 |
| R62 | B-503 | 502 | A | C | Karina Fuentes | Oscar Oswaldo Ramos Gil | 2023-12-10 | 4.Plan de pagos | 497900 | 49800 |
| R63 |  | 503 | A | A | Pablo Marroquín | Helen Mishel Rodas López de Morales  Michael Alexander Morales Rodríguez | 2025-06-27 | 4.Plan de pagos | 477000 | 23900 |
| R64 |  | 504 | A | B | Pablo Marroquín | Diego Estuardo Salguero Salvatierra | 2025-06-28 | 1.Disponible | 477700 | 23900 |
| R65 | B-507 | 505 | A | A | Pedro Sarti | David Enrique Aldana Mazariegos | 2025-02-05 | 4.Plan de pagos | 369600 | 18500 |
| R66 |  | 507 | A | A | Eder Veliz | Edwin Alexander Amado Toc / Jennifer Alexa Castañeda Alvarez | 2025-06-28 | 4.Plan de pagos | 477000 | 23900 |
| R67 |  | 508 | A | A | Eder Veliz | Sebastian Angel Milian Guas | 2025-06-28 | 1.Disponible | 477000 | 23900 |
| R68 |  | 508 | TB | B | Eder Veliz | Jorge Mario Santizo Lacayo | 2025-07-12 | 1.Disponible | 487700 | 24400 |
| R69 |  | 510 | TB | C |  |  |  | 1.Disponible | 507200 | 50720 |
| R70 |  | 511 | TB | C |  |  |  | 1.Disponible | 507200 | 50720 |
| R71 |  | 512 | TB | B |  |  |  | 1.Disponible | 507200 | 50720 |
| R72 |  | 513 | TB | B |  |  |  | 1.Disponible | 477000 | 24000 |
| R73 |  | 601 | TB | B |  | Mario Andres Perez Lopez | 2025-07-26 | Reservado | 477700 | 24000 |
| R74 | B-602 | 601 | A | B | Luis Esteban | Santos Sebastian Pastor Velasquez | 2024-04-25 | 4.Plan de pagos | 477700 | 23900 |
| R75 | B-603 | 602 | A | C | Abigail Garcia | David Obdulio Perez Monzon | 2023-11-27 | 4.Plan de pagos | 497900 | 49800 |
| R76 |  | 604 | A | B | SIN DATOS | Juan Eduardo Lopez Suran | 2025-06-29 | Reservado | 477700 | 24000 |
| R77 |  | 605 | TB | B |  |  |  | 1.Disponible | 477700 | 23900 |
| R78 | B-606 | 606 | TB | B | Abigail Garcia | Andrea Isabel Tezen Cabrera | 2024-05-30 | 4.Plan de pagos | 477700 | 24000 |
| R79 |  | 606 | A | A |  | Ilse Mariela Rosales Diaz | 2025-06-30 | Reservado | 477700 |  |
| R80 | B-607 | 607 | A | A | Abigail Garcia | Luis Fernando Moreno Pozuelos | 2024-05-07 | 4.Plan de pagos | 369600 | 18500 |
| R81 |  | 608 | TB | B |  |  |  | 1.Disponible | 477700 | 23900 |
| R82 |  | 609 | TB | B |  |  |  | 1.Disponible | 507200 | 50720 |
| R83 | B-610 | 608 | A | C | Abigail Garcia | Jaquelyn Michel Chumil Castillo | 2024-04-28 | 4.Plan de pagos | 477000 | 24000 |
| R84 |  | 611 | TB | C |  |  |  | 1.Disponible | 507200 | 50720 |
| R85 | B-612 | 610 | A | B | Abigail Garcia | Walter Adolfo Max Toc Crux | 2024-02-27 | 4.Plan de pagos | 477700 | 24000 |
| R86 | B-613 | 613 | B | B | Abigail Garcia | Erik Estuardo Carrera Cruz | 2024-02-18 | 4.Plan de pagos | 477700 | 24000 |

### Desistimientos Section (R97–R142)

| Row | Unit | Tower | Type | Salesperson | Client | Date | Type | Price (GTQ) |
|-----|------|-------|------|-------------|--------|------|------|-------------|
| R97 | **Desistimiento header** | | | | | | | |
| R98 | APTO | MODELO | TORRE | VENDOR | CLIENTE | FECHA | TIPO | P. VENTA |
| R99 | 105 | TB | B | Abigail Garcia | Belia Ester Velasquez Castillo | 2023-11-28 | 4.Plan de pagos | 477700 |
| R100 | 108 | TB | B | Karina Fuentes | Indira Marisela Lopez Gomez | 2024-08-13 | 4.Plan de pagos | 494900 |
| R101 | 111 | TB | C | Efren Sanchez | María Reneé Yela Ochoa | 2025-02-26 | 2.Reservado | 477000 |
| R102 | 112 | TB | B | Abigail Garcia | Edgar Giovanni Palomo Robles | 2024-03-21 | 4.Plan de pagos | 477700 |
| R103 | 113 | TB | B | Abigail Garcia | Keneth David Palomo Lopez | 2024-03-21 | 4.Plan de pagos | 477700 |
| R104 | 212 | TB | B | Antonio Rada | Reina Elizabet Sandoval Perez | 2024-09-04 | 2.Reservado | 507200 |
| R105 | 501 | TB | B | Efren Sanchez | Carlos Humberto Joel Alvizures Carmona | 2024-08-30 | 2.Reservado | 507200 |
| R106 | 209 | TB | B |  | Maria Cecilia Reyna Barrera | 2024-05-18 |  | 477700 |
| R107 | 104 | TB | C | Karina Fuentes | Brayan Eduardo Sosa Canto | 2023-10-31 | 4.Plan de pagos | 497900 |
| R108 | 510 | B | C | Eder Veliz | Baudilio Santos Galicia | 2025-05-06 | Reservado | 507200 |
| R109 | 601 | TB | B |  |  |  | 1.Disponible | 477700 |
| R110 | 605 | B | B | Luis Esteban | Christhofer Steven Guevara | 2024-05-30 | 4.Plan de pagos | 477700 |
| R111 | 608 | B | B | Luis Esteban | Gerson Augusto Estrada Oliva | 2024-07-04 | 4.Plan de pagos | 477700 |
| R112 | 604 | TB | C | Abigail Garcia | Pedro Alejandro Tezen Cabrera | 2024-02-17 | 4.Plan de pagos | 477700 |
| R113 | 405 | TB | B | Efren Sanchez | Amanda Aracely Castillo Guzman | 2024-11-30 | Reservado | 477000 |
| R114 | 209 | TB | B |  | Laura Sofia Caballeros González | 2025-07-13 | 1.Disponible | 477700 |
| R115 | 108 | TB | B | Karina Fuentes | Soluciones A Su Alcance | 2024-12-23 | 4.Plan de pagos | 477700 |
| R126 | APTO | MODELO | TORRE | VENDOR | CLIENTE | FECHA | FECHA DEP. | P. VENTA |
| R127 | 101 |  |  | Karina Fuentes | Domingo Ajpop Chij | 2023-11-20 | 2023-11-20 | 494900 |
| R128 | 102 |  |  | Abigail García |  Jacqueline Stefany Luna Lopez | 2023-12-10 | 2023-12-10 | 494900 |
| R129 | 102 |  |  | Abigail García | Alejandro Eleazar Orozco Sique | 2024-05-05 | 2024-05-05 | 477700 |
| R130 | 103 |  |  | Abigail García | Carlos Enrique Sandoval Escobar | 2024-02-01 | 2024-02-01 | 477000 |
| R131 | 106 |  |  | Karina Fuentes | Junior Alexes ammanuel Coronado Barrios | 2023-11-19 | 2023-11-20 | 494900 |
| R132 | 108 |  |  | Efren Sanchez | Berenice Gomez y Gary Yoc | 2024-08-13 | 2024-08-13 | 477700 |
| R133 | 111 |  |  | Abigail García | Edgar Giovanni Palomo Robles | 2024-03-21 | 2024-03-21 | 477000 |
| R134 | 209 |  |  | Abigail García | Maria Cecilia Reyna Barrera | 2024-05-18 | 2024-05-18 | 477700 |
| R135 | 303 |  |  | Karina Fuentes | Jefte Alexander Gomez Rodas | 2023-12-16 | No ingreso el deposito | 497900 |
| R136 | 308 |  |  | Alejandra Calderon | Helen Ixen  | 2023-08-06 | 2023-08-06 | 494800 |
| R137 | 403 |  |  | Karina Fuentes | Anibal Poitan | 2024-02-21 | 2024-02-21 | 477000 |
| R138 | 403 |  |  | Antonio Rada | Ana Cristina Velasquez | 2024-05-22 | 2024-05-22 | 477000 |
| R139 | 404 |  |  | Abigail García | Harvey Daniel Martinez Palencia  | 2023-12-23 | 2023-12-23 | 497900 |
| R140 | 501 |  |  | Efren Sanchez | Hansel Adriel Juarez Chian  | 2024-08-30 | 2024-08-30 | 477000 |
| R141 | 601 |  |  | Abigail García | Carla Yanira Castillo | 2024-03-17 | 2024-03-17 | 477700 |
| R142 | 604 | TB | C | Abigail Garcia | Pedro Alejandro Tezen Cabrera | 2024-02-17 | 4.Plan de pagos | 477700 |

---
## 9. BOULEVARD 5 orig.

**Purpose:** Boulevard 5 original version (before 2.0 redesign). Report date: 31 de Marzo 2025. Company: EL GRAN JAGUAR, S.A. Simpler column layout vs current B5 sheet. Used as historical reference.
**Non-empty rows:** 315 | **Max columns:** 55

### Column Headers (Row 6)

- **B**: Apto
- **C**: Vendedor
- **D**: Cliente
- **E**: Reservado
- **F**: Tipo
- **G**: Estatus
- **H**: Precio de Venta
- **I**: Enganche
- **J**: 2023-03-31
- **K**: 2023-04-30
- **L**: 2023-05-31
- **M**: 2023-06-30
- **N**: 2023-07-31
- **O**: 2023-08-31
- **P**: 2023-09-30
- **Q**: 2023-10-31
- **R**: 2023-11-30
- **S**: 2023-12-31
- **T**: 2024-01-31
- **U**: 2024-02-29
- **V**: 2024-03-31
- **W**: 2024-04-30
- **X**: 2024-05-31
- **Y**: 2024-06-30
- **Z**: 2024-07-31
- **AA**: 2024-08-31
- **AB**: 2024-09-30
- **AC**: 2024-10-31
- **AD**: 2024-11-30
- **AE**: 2024-12-31
- **AF**: 2025-01-31
- **AG**: 2025-02-28
- **AH**: 2025-03-31
- **AI**: 2025-04-30
- **AJ**: TOTAL COBROS Y RESERVAS
- **AK**: % Cobro
- **AL**: SALDO PENDIENTE ENGANCHE
- **AM**: % Pendiente
- **AN**: Monto a Financiar por Banco
- **AO**: % a Financiar
- **AP**: Proyección de Cobros (S/ Modelo Financiero)
- **AQ**: Proyección de pagos clientes
- **AR**: Status inmueble
- **AS**: ESTATUS CLIENTE
- **AT**: Cuotas Pactadas
- **AU**: Cuota de Enganche
- **AV**: Total cuotas pactadas
- **AW**: Monto de Cuota Pactada
- **AX**: Cuotas Pagadas
- **AY**: Cantidad de cuotas que deben estar pagadas por el cliente
- **BA**: COMENTARIOS

### DB Mapping

Same as BOULEVARD 5 (Sheet 4) — this is the historical version with data through 2025-03-31.

| Column | DB Target |
|--------|-----------|
| Apto | `rv_units.unit_number` |
| Vendedor | `salespeople.name` |
| Cliente | `rv_clients.full_name` |
| Reservado | `reservations.created_at` |
| Tipo | `rv_units.unit_type` |
| Estatus | `rv_units.status` |
| Precio de Venta | `sales.sale_price` |
| Enganche | `sales.down_payment` |
| Date columns (2023-03 … 2025-03) | `payments.payment_date` + `payments.amount` |
| COMENTARIOS | `reservations.notes` |

### Data Rows (R7–R315)

| Row | Unit | Type | Salesperson | Client | Date | Status | Price (GTQ) | Enganche (GTQ) |
|-----|------|------|-------------|--------|------|--------|-------------|----------------|
| R7 | 101 | A7.1 | Jose Franco | Karla Michelle Abril Valencia De Galicia | 2023-03-27 | 4.Plan de pagos | 644800 | 64500 |
| R8 | 102 | B4.1 |  |  |  | 1.Disponible | 1228914.97824087 | 122891.497824087 |
| R9 | 103 | E1.1 | Ronaldo | International Coffee Industry, S.A | 2024-01-09 | 4.Plan de pagos | 1533200 | 153320 |
| R10 | 104 | A4.1 | Antonio Rada | Jonathan José Morales Salazar | 2023-08-02 | 4.Plan de pagos | 727800 | 145600 |
| R11 | 105 | B7.1 |  |  |  | 1.Disponible | 1184603.42113372 | 118460.34211337201 |
| R12 | 106 | B2.1 |  |  |  | 1.Disponible | 1382310.13107619 | 138231.013107619 |
| R13 | 107 | B6.1 |  |  |  | 1.Disponible | 1131172.33512325 | 113117.23351232501 |
| R14 | 108 | B1.1 |  |  |  | 1.Disponible | 1315199.75171074 | 131519.975171074 |
| R15 | 109 | E2.1 | Antonio Rada | Laura Elisa Ovalle Gonzalez | 2024-06-28 | 4.Plan de pagos | 1486576 | 148676 |
| R16 | 110 | A2.1 | Antonio Rada | Karla Suzel Ruiz Sanchinelli De Alonzo | 2023-06-11 | 4.Plan de pagos | 680900 | 68100 |
| R17 | 111 | A6.1 | Jose Franco | Jonathan José Morales Salazar / Ingrid Liseth Barillas López | 2023-03-27 | 4.Plan de pagos | 696700 | 69700 |
| R18 | 112 | A3.1 | Brenda Búcaro | Herbert Osiel Ramos Alfaro / Paula María Vásquez Cifuentes | 2023-03-21 | 4.Plan de pagos | 698900 | 69900 |
| R19 | 113 | C3.1 | Antonio Rada | Rodrigo Rodas Pazos | 2024-11-20 | 4.Plan de pagos | 1286306.04 | 480006.04 |
| R20 | 114 | C2.1 | Antonio Rada | Mauricio Arimany Monzon | 2023-03-27 | 4.Plan de pagos | 993625.74668 | 99425.75 |
| R21 | 201 | B7 |  |  |  | 1.Disponible | 1329931.29840072 | 132993.129840072 |
| R22 | 202 | B2 | Antonio Rada | Bella Rosana Chaveque Gonzalez | 2025-03-20 | 2. Reserva | 1321630.18875795 | 132230.19 |
| R23 | 203 | B6 |  |  |  | 1.Disponible | 1273928.03757136 | 127392.80375713599 |
| R24 | 204 | B1 | Antonio Rada | Paulette Leslie Wauthion Jimenez | 2024-10-31 | 4.Plan de pagos | 1015795 | 101595 |
| R25 | 205 | D7 | Sofia Paredes | Javier Adolfo Hernandez Leon | 2025-02-18 | 2. Reserva | 1364055.82322122 | 136455.82 |
| R26 | 206 | A9 |  |  |  | 1.Disponible | 1021234.48252095 | 102123.44825209501 |
| R27 | 207 | C9 |  |  |  | 1.Disponible | 1414228.48223781 | 141422.848223781 |
| R28 | 208 | C8 |  |  |  | 1.Disponible | 1414462.31631225 | 141446.231631225 |
| R29 | 209 | B4 |  |  |  | 1.Disponible | 1282411.13112424 | 128241.11311242402 |
| R30 | 210 | B3 |  |  |  | 1.Disponible | 1037521.78830839 | 103752.178830839 |
| R31 | 211 | E1 |  |  |  | 1.Disponible | 1543626.97235174 | 154362.697235174 |
| R32 | 212 | A4 | Antonio Rada | Julio Eduardo Farnes Bucaro | 2023-11-14 | 4.Plan de pagos | 714937.5 | 71537.5 |
| R33 | 213 | A8 | Sofia Paredes | Carlos Humberto Rivera Carrillo  | 2025-02-07 | 2. Reserva | 806418.743353334 | 80718.74 |
| R34 | 214 | A1 | Antonio Rada | Jorge Daniel Baca Chiroy | 2023-11-29 | 4.Plan de pagos | 720472.5 | 72072.5 |
| R35 | 215 | C4 | Antonio Rada | Lidia Elizabeth Pocasangre Rac | 2024-03-02 | 4.Plan de pagos | 965900 | 96600 |
| R36 | 216 | C1 | Antonio Rada | Narvesters Gabriell Moreno Cedeño | 2024-03-09 | 4.Plan de pagos | 980700 | 98100 |
| R37 | 301 | C3 | Antonio Rada | Jonathan Kiril Thomas Menkos | 2024-07-21 | 4.Plan de pagos | 1273000 | 127300 |
| R38 | 302 | C2 |  |  |  | 1.Disponible | 1373424.43624732 | 137342.443624732 |
| R39 | 303 | A6 | Antonio Rada | Clara Hilda Maria Falla Bianchi De Cruz-Gomar | 2025-02-05 | 4.Plan de pagos | 934918.446451997 | 93491.84464519972 |
| R40 | 304 | A3 | Antonio Rada | Ricardo Alberto Vásquez Monterroso | 2025-03-03 | 2. Reserva | 833815.201016653 | 83415.2 |
| R41 | 305 | B7 | Antonio Rada | Josue Alejandro Arias Perez | 2025-04-01 | 2. Reserva | 1112465.60916772 | 111246.560916772 |
| R42 | 306 | B2 |  |  |  | 1.Disponible | 1104047.58248773 | 110404.75824877301 |
| R43 | 307 | B6 |  |  |  | 1.Disponible | 1056462.34833836 | 105646.234833836 |
| R44 | 308 | B1 | Antonio Rada | Ricardo Alberto Vásquez Monterroso | 2025-03-03 | 2. Reserva | 1032728.18978229 | 103328.19 |
| R45 | 309 | D7 | Antonio Rada | Leonel Bernardo Molina Gramajo | 2024-08-12 | 4.Plan de pagos | 1341690 | 135090 |
| R46 | 310 | A9 |  |  |  | 1.Disponible | 1021234.48252095 | 102123.44825209501 |
| R47 | 311 | C9 | Diana Alvarez | Miguel Angel Teletor Riz | 2024-09-27 | 4.Plan de pagos | 1391040 | 139140 |
| R48 | 312 | C8 | Antonio Rada | Freddy Alejandro Chinchilla Culajay | 2024-12-24 | 4.Plan de pagos | 1414462.31631225 | 141462.32 |
| R49 | 313 | B4 | Antonio Rada | Leslly Franzoli Cortez Avila | 2024-05-07 | 4.Plan de pagos | 1087400 | 108800 |
| R50 | 314 | B3 |  |  |  | 1.Disponible | 1037521.78830839 | 103752.178830839 |
| R51 | 315 | E1 | Sofia Paredes | Lilian America Roldan Ochoa | 2025-04-05 | 2. Reserva | 1543626.97235174 | 154362.697235174 |
| R52 | 316 | A4 | Antonio Rada | Allan Omar Alvarado Vásquez | 2023-10-29 | 4.Plan de pagos | 708396.44 | 70896.44 |
| R53 | 317 | A8 | Antonio Rada | Antonio Meneses Hernandez | 2023-11-28 | 4.Plan de pagos | 721087.5 | 72187.5 |
| R54 | 318 | A1 | Antonio Rada | Jose Reynaldo Linares | 2023-11-12 | 4.Plan de pagos | 720472.5 | 72072.5 |
| R55 | 319 | C4 | Antonio Rada | Aaron Fabrizio Tello Merida | 2024-02-18 | 4.Plan de pagos | 965900 | 96600 |
| R56 | 320 | C1 | Antonio Rada | Santiago Taracena Puga | 2023-08-12 | 4.Plan de pagos | 980700 | 98100 |
| R57 | 401 | C3 | Antonio Rada | Sara Veronica Ortíz De León | 2024-01-29 | 4.Plan de pagos | 1153800 | 115400 |
| R58 | 402 | C2 | Antonio Rada | Guillermo Vinicio Cotto Mux | 2023-12-03 | 4.Plan de pagos | 1151071.45 | 115171.45 |
| R59 | 403 | A6 | Antonio Rada | Denis Estuardo Mazariegos Fuentes | 2023-08-20 | 4.Plan de pagos | 699700 | 70000 |
| R60 | 404 | A3 | Brenda Búcaro | Gerson Andre Villatoro Urizar | 2023-10-31 | 4.Plan de pagos | 721100 | 72200 |
| R61 | 405 | B7 | Antonio Rada | Leslie Carolina Gil Morales | 2025-03-15 | 2. Reserva | 1112465.60916772 | 111265.61 |
| R62 | 406 | B2 |  |  |  | 1.Disponible | 1104047.58248773 | 110404.75824877301 |
| R63 | 407 | B6 |  |  |  | 1.Disponible | 1056462.34833836 | 105646.234833836 |
| R64 | 408 | B1 | Antonio Rada | Maria Gabriela Chang Quan De Garcia | 2024-02-13 | 4.Plan de pagos | 883300 | 88400 |
| R65 | 409 | D7 | Antonio Rada | Rafael Leonidas Tabic Borja | 2024-08-08 | 4.Plan de pagos | 1341690 | 134190 |
| R66 | 410 | A9 |  |  |  | 1.Disponible | 1021234.48252095 | 102123.44825209501 |
| R67 | 411 | C9 |  |  |  | 1.Disponible | 1414228.48223781 | 141422.848223781 |
| R68 | 412 | C8 |  |  |  | 1.Disponible | 1414462.31631225 | 141446.231631225 |
| R69 | 413 | B4 | Sofia Paredes | Cindy Carolina Toscano Merida | 2025-01-31 | 4.Plan de pagos | 1063054.43589791 | 106354.43 |
| R70 | 414 | B3 | Antonio Rada | Carolina Rivas Le Sage De Alonzo | 2024-05-27 | 4.Plan de pagos | 887400 | 88800 |
| R71 | 415 | E1 |  |  |  | 1.Disponible | 1543626.97235174 | 154362.697235174 |
| R72 | 416 | A4 | Sofia Paredes | Carlos Humberto Rivera Carrillo  | 2025-02-07 | 2. Reserva | 798331.19 | 79931.18 |
| R73 | 417 | A8 | Antonio Rada | Miguel Angel Flores Linares | 2023-11-19 | 4.Plan de pagos | 721087.5 | 72187.5 |
| R74 | 418 | A1 | Antonio Rada | Alejandra Madelleine Rosales Garcia | 2023-11-10 | 4.Plan de pagos | 720472.5 | 72072.5 |
| R75 | 419 | C4 | Antonio Rada | Andrea Elizabeth Ortiz Perez | 2023-11-01 | 4.Plan de pagos | 965900 | 96600 |
| R76 | 420 | C1 | Antonio Rada | Rodriga Virginia Figueroa Perez | 2024-07-17 | 4.Plan de pagos | 1166800 | 116700 |
| R77 | 501 | E9 | Sofia Paredes | Erick Guillermo Ruano Garcia | 2025-01-24 | 4.Plan de pagos | 1502549.44216114 | 150349.44 |
| R78 | 502 | E10 |  |  |  | 1.Disponible | 1529194.3266091 | 152919.43266091 |
| R79 | 503 | B4 | Antonio Rada | Rubidia Ines Gonzalez Anzueto | 2024-09-30 | 4.Plan de pagos | 1036610 | 103710 |
| R80 | 504 | B3 | Antonio Rada | Luis Josue Cordon Miranda | 2024-05-08 | 4.Plan de pagos | 887400 | 88800 |
| R81 | 505 | D9 | Antonio Rada | Nancy Eugenia Cisneros Sanchez De Davila | 2024-07-30 | 4.Plan de pagos | 1399667 | 139967 |
| R82 | 506 | D8 | Antonio Rada | Carlos Eduardo Miranda Y Nancy Patricia Medina | 2024-05-10 | 4.Plan de pagos | 1379595 | 138595 |
| R83 | 507 | A12 | Antonio Rada | Osmin Otoniel Oliva Córdova | 2023-08-17 | 4.Plan de pagos | 722900 | 72300 |
| R84 | 508 | C6 | Antonio Rada | Evelyn Aida Samayoa San Jose | 2024-04-12 | 4.Plan de pagos | 1183693 | 118393 |
| R85 | 509 | C5 | Antonio Rada | Anabella Alburez Aja | 2024-06-30 | 4.Plan de pagos | 1181561.5 | 118161.5 |
| R86 | 510 | C6 | Antonio Rada | Francis Ayleen Funes Castellanos | 2024-03-01 | 4.Plan de pagos | 1183693 | 118393 |
| R87 | 511 | C5 | Antonio Rada | Hugo Leonel Roca Morales | 2024-06-27 | 4.Plan de pagos | 1181561.5 | 118161.5 |
| R88 | 512 | A8 | Antonio Rada | Oscar Antonio Gonzalez Hurtarte | 2023-07-18 | 4.Plan de pagos | 703500 | 70400 |
| R89 | 513 | A2 | Antonio Rada | Maria Fernanda Cabrera Valdez | 2023-07-16 | 4.Plan de pagos | 687500 | 68800 |
| R90 | 514 | E5 | Antonio Rada | Danya Maribel Callejas Hernandez De Herrera | 2025-03-25 | 2. Reserva | 1535078.40525802 | 153507.840525802 |
| R91 | 515 | A5 | Jose Franco | Ingrid Vanessa Granados Barneond | 2023-03-27 | 4.Plan de pagos | 611949.496797804 | 61249.5 |
| R92 | 516 | B4 | Diana Alvarez | José Javier Sarceño Alfaro Y María Rosana Rivera Gallardo | 2024-09-22 | 4.Plan de pagos | 1036610 | 103710 |
| R93 | 517 | B3 | Antonio Rada | Jorge Estuardo Diaz Duran Baldetti | 2024-05-13 | 4.Plan de pagos | 871162.12 | 87162.12 |
| R94 | 518 | E9 | Diana Alvarez | Karla Denisse Ariana Méndez Contreras | 2024-10-29 | 4.Plan de pagos | 1502549.44 | 150549.44 |
| R95 | 519 | E10 |  |  |  | 1.Disponible | 1529194.3266091 | 152919.43266091 |
| R96 | 601 | E9 | Diana Alvarez | Cedric Amilcar Rivera Fajardo | 2024-10-15 | 4.Plan de pagos | 1477912.8 | 147912.8 |
| R97 | 602 | E10 | Antonio Rada | Luis Fernando Santos Castillo | 2024-11-14 | 2. Reserva | 1529194.3266091 | 152919.43266091 |
| R98 | 603 | B4 | Antonio Rada | Mario José Márquez Rivera / Belteton Castellanos Iveth | 2024-04-02 | 4.Plan de pagos | 901400 | 90200 |
| R99 | 604 | B3 | Antonio Rada | Juan Sebastian Gaitán Serrano | 2024-04-29 | 4.Plan de pagos | 887400 | 88800 |
| R100 | 605 | D9 | Antonio Rada | Mirna Maria Rosas Guerra | 2024-09-18 | 4.Plan de pagos | 1373505 | 137405 |
| R101 | 606 | D8 | Antonio Rada | Mar Frandi Solly Gramajo Hernandez De Calderon | 2024-08-29 | 4.Plan de pagos | 1379595 | 137995 |
| R102 | 607 | A12 | Antonio Rada | Billy Hasse Orellana Serrano | 2023-08-14 | 4.Plan de pagos | 722900 | 72300 |
| R103 | 608 | C6 | Antonio Rada | Alfonso Videche Rodriguez | 2024-02-02 | 4.Plan de pagos | 1183693 | 118393 |
| R104 | 609 | C5 | Antonio Rada | Luis Augusto Franco Lopez | 2024-05-22 | 4.Plan de pagos | 1181561.5 | 118161.5 |
| R105 | 610 | C6 | Antonio Rada | Andrea Nathalia Molina Mendez De Velasqeuz | 2024-02-29 | 4.Plan de pagos | 1183693 | 118393 |
| R106 | 611 | C5 | Antonio Rada | Kenny Estuardo Garay Carias | 2025-02-27 | 2. Reserva | 1381446.69875631 | 138144.669875631 |
| R107 | 612 | A8 | Antonio Rada | Diego Jose Ortiz Cordero | 2023-07-19 | 4.Plan de pagos | 703500 | 70400 |
| R108 | 613 | A2 | Antonio Rada | Sergio Oswaldo Velasquez Moreno | 2023-07-19 | 4.Plan de pagos | 687500 | 68800 |
| R109 | 614 | E5 | Diana Alvarez | Marco Vinicio Vasque | 2024-10-15 | 4.Plan de pagos | 1509908.4 | 151908.4 |
| R110 | 615 | A5 | Antonio Rada | Maria De Los Angeles España Cordon | 2023-04-24 | 4.Plan de pagos | 611950.009005 | 61250.01 |
| R111 | 616 | B4 | Antonio Rada | Edwin Estuardo Acevedo Salguero | 2024-03-08 | 4.Plan de pagos | 901400 | 90200 |
| R112 | 617 | B3 | Antonio Rada | Hans Christian Beeck Cazali | 2024-05-07 | 4.Plan de pagos | 887400 | 88800 |
| R113 | 618 | E9 |  |  |  | 1.Disponible | 1502549.44216114 | 150254.944216114 |
| R114 | 619 | E10 | Sofia Paredes | José Estuardo Ordoñez Cancinos | 2025-03-08 | 2. Reserva | 1529194.3266091 | 152919.43266091 |
| R115 | 701 | E9 | Antonio Rada | Luis Francisco Villatoro Quiroa | 2023-03-21 | 4.Plan de pagos | 1320300 | 132100 |
| R116 | 702 | E10 | Antonio Rada | Wilson Humberto Felix Reyna | 2023-04-14 | 4.Plan de pagos | 1343800 | 134400 |
| R117 | 703 | B4 | Antonio Rada | Daniel Augusto Santos Aragon | 2024-03-07 | 4.Plan de pagos | 901400 | 90200 |
| R118 | 704 | B3 | Antonio Rada | Dania Dulcidia Gutierrez Villeda | 2024-04-15 | 4.Plan de pagos | 887400 | 88800 |
| R119 | 705 | D9 | Antonio Rada | Ingrid Lisbeth Dubón García De Diaz | 2025-02-11 | 2. Reserva | 1396401.17573617 | 139701.18 |
| R120 | 706 | D8 | Antonio Rada | Edison Gabriel Ramirez Lopez | 2025-03-12 | 2. Reserva | 1402592.69535949 | 140292.7 |
| R121 | 707 | A12 | Antonio Rada | Christian Escobar | 2025-04-04 | 2. Reserva | 789045 | 72300 |
| R122 | 708 | C6 | Antonio Rada | Alfonso Videche Rrodriguez | 2024-01-30 | 4.Plan de pagos | 1183693 | 118393 |
| R123 | 709 | C5 |  |  |  | 1.Disponible | 1381446.69875631 | 138144.669875631 |
| R124 | 710 | C6 |  |  |  | 1.Disponible | 1185640.42442039 | 118564.042442039 |
| R125 | 711 | C5 | Diana Alvarez | Samuel David Chavez | 2024-11-30 | 4.Plan de pagos | 1181561.5 | 118161.5 |
| R126 | 712 | A8 | Antonio Rada | Edgar Augusto Sepúlveda Barrera | 2023-06-08 | 4.Plan de pagos | 703500 | 70400 |
| R127 | 713 | A2 | Antonio Rada |  Luis Alejandro Pérez Ibañez | 2023-06-10 | 4.Plan de pagos | 687500 | 68800 |
| R128 | 714 | E5 | Antonio Rada | Jose Carlos Samayoa San Jose | 2024-04-11 | 4.Plan de pagos | 1438008 | 143808 |
| R129 | 715 | A5 | Brenda Búcaro | Cynthia Marisel Coronado Monterroso | 2023-03-10 | 4.Plan de pagos | 617600 | 62000 |
| R130 | 716 | B4 | Antonio Rada | Lisvet  Maricelasance Alvarez De Giron | 2024-01-15 | 4.Plan de pagos | 901400 | 90200 |
| R131 | 717 | B3 | Antonio Rada | Jorge Estuardo Díaz Durán Baldetti | 2024-04-30 | 4.Plan de pagos | 887400 | 88800 |
| R132 | 718 | E9 |  |  |  | 1.Disponible | 1502549.44216114 | 150254.944216114 |
| R133 | 719 | E10 |  |  |  | 1.Disponible | 1456375.54915152 | 145637.554915152 |
| R134 | 801 | C4 | Antonio Rada | Pablo Jose Juarez Pereira | 2023-07-25 | 4.Plan de pagos | 1152000 | 115200 |
| R135 | 802 | C1 | Brenda Búcaro | Carmen Julia Soto Baechli De Hicks | 2023-06-10 | 4.Plan de pagos | 1166800 | 116700 |
| R136 | 803 | A8 | Brenda Búcaro | Mauricio Antonio Leon Tres | 2023-03-22 | 4.Plan de pagos | 660700 | 66100 |
| R137 | 804 | A1 | Brenda Búcaro | Victor Hugo Caceres Morales | 2023-06-13 | 4.Plan de pagos | 702900 | 70300 |
| R138 | 805 | B5 | Antonio Rada | Celia Julissa Flores Dávila De Gonzalez | 2024-05-08 | 4.Plan de pagos | 941800 | 94200 |
| R139 | 806 | B8 | Antonio Rada | Rodolfo Morales Muñoz | 2024-09-12 | 4.Plan de pagos | 1084565 | 108465 |
| R140 | 807 | B4 | Antonio Rada | Eswin Raul Morales Lopez | 2023-11-30 | 4.Plan de pagos | 901400 | 90200 |
| R141 | 808 | B3 | Antonio Rada | Gualberto Alonso Salazar Trejo | 2024-03-05 | 4.Plan de pagos | 887400 | 88800 |
| R142 | 809 | E1 | Antonio Rada | Mildred Maritza Monterroso Montenegro De Santizo | 2024-03-02 | 4.Plan de pagos | 1390400 | 139100 |
| R143 | 810 | A4 | Brenda Búcaro | Sebastián Aristondo Barillas | 2023-06-22 | 4.Plan de pagos | 697500 | 70000 |
| R144 | 811 | B7 | Antonio Rada | Rosa Gilda Tuchan Valle De Gonzalez | 2024-07-12 | 4.Plan de pagos | 864446.02 | 864446.02 |
| R145 | 812 | B2 | Antonio Rada | Juan Pablo Gonzalez Tuchan | 2024-07-30 | 4.Plan de pagos | 941467.1 | 94167.1 |
| R146 | 813 | B6 | Antonio Rada | Iindustrias Danico, S.A. | 2024-05-14 | 4.Plan de pagos | 895332.85 | 89632.85 |
| R147 | 814 | B1 | Antonio Rada | Enma Suselly Lopez Muy | 2023-11-20 | 4.Plan de pagos | 883300 | 88400 |
| R148 | 815 | E2 | Antonio Rada | Leonora Elizabeth Cordon Arrivillaga | 2024-02-20 | 4.Plan de pagos | 1463600 | 146400 |
| R149 | 816 | A2 | Brenda Búcaro | Coasa, S.A. | 2023-03-31 | 4.Plan de pagos | 651600 | 65200 |
| R150 | 817 | A6 | Brenda Búcaro |  Juan Antonio Escobedo Del Cid | 2023-04-11 | 4.Plan de pagos | 657132.3 | 65732.3 |
| R151 | 818 | A3 | Brenda Búcaro | Astrid Pamela Chew Chávez De Letona | 2023-07-18 | 4.Plan de pagos | 703500 | 70400 |
| R152 | 819 | C3 | Brenda Búcaro | Edvin Eduardo Sajquim Sajquim | 2023-05-29 | 4.Plan de pagos | 967700 | 96800 |
| R153 | 820 | C2 | Antonio Rada | Maria Eugenia Ortiz Uck | 2024-01-13 | 4.Plan de pagos | 990132.5 | 99132.5 |
| R154 | 901 | C4 | Antonio Rada |  Monica Arimany Monzon | 2023-03-27 | 4.Plan de pagos | 1087062.84218 | 108762.84 |
| R155 | 902 | C1 | Antonio Rada | Waldir Edenilson Contreras Pedroza | 2024-01-15 | 4.Plan de pagos | 1195970 | 119670 |
| R156 | 903 | A8 | Jose Franco | Vivian Arely Carranza León De Acevedo | 2023-05-19 | 4.Plan de pagos | 703500 | 70400 |
| R157 | 904 | A1 | Jose Franco | Juan José Silva Pacheco | 2023-05-16 | 4.Plan de pagos | 696469.08 | 69669.08 |
| R158 | 905 | B5 | Antonio Rada | Roberto Andres Hernandez Benavides | 2024-06-30 | 4.Plan de pagos | 941800 | 94200 |
| R159 | 906 | B8 | Antonio Rada | Jose Juan Barrientos Juarez | 2024-12-19 | 4.Plan de pagos | 1102644.57804107 | 110344.58 |
| R160 | 907 | B4 | Brenda Búcaro | Stephanie Herrera | 2023-08-31 | 4.Plan de pagos | 901400 | 90200 |
| R161 | 908 | B3 | Antonio Rada | Jorge Pablo Gonzalez Oordoñez | 2024-01-25 | 4.Plan de pagos | 887400 | 88800 |
| R162 | 909 | E8 | Brenda Búcaro | Alba Lucila Martinez Tobar | 2023-07-11 | 4.Plan de pagos | 1382700 | 138300 |
| R163 | 910 | A10 |  |  |  | 1.Disponible | 982583.641688128 | 98258.36416881281 |
| R164 | 911 | C10 | Brenda Búcaro | Mario Alberto Maldonado Recinos | 2023-09-16 | 4.Plan de pagos | 1052367.5 | 105267.5 |
| R165 | 912 | C7 | Ronaldo |  Iurix,S.A | 2024-01-09 | 4.Plan de pagos | 973800 | 97380 |
| R166 | 913 | B6 | Antonio Rada | Wender Josue Bailon Campos | 2024-04-22 | 4.Plan de pagos | 903600 | 90400 |
| R167 | 914 | B1 | Antonio Rada | Rebecca Gonzalez Ordoñez | 2024-01-29 | 4.Plan de pagos | 883300 | 88400 |
| R168 | 915 | E2 | Brenda Búcaro | Marcela Alejandra Castro Marcía | 2023-08-28 | 4.Plan de pagos | 1309197.44 | 130997.44 |
| R169 | 916 | A2 | Brenda Búcaro | José Fernando Cordón Almengor | 2023-05-03 | 4.Plan de pagos | 687500 | 68800 |
| R170 | 917 | A6 | Brenda Búcaro | Jessica María Ramirez Girard | 2023-05-22 | 4.Plan de pagos | 699700 | 70000 |
| R171 | 918 | A3 | Antonio Rada | Astrid Maricel De León Ramírez | 2023-06-21 | 4.Plan de pagos | 703500 | 70400 |
| R172 | 919 | C3 | Brenda Búcaro | Ana Lucrecia Rangel Aquino | 2023-03-31 | 4.Plan de pagos | 921600 | 92200 |
| R173 | 920 | C2 | Ronaldo | Iurix, S.A | 2024-01-09 | 4.Plan de pagos | 929000 | 92900 |
| R174 | 1001 | C4 | Antonio Rada |  Zonia Beariz Hernandez Herrera | 2023-04-11 | 4.Plan de pagos | 1097100 | 109800 |
| R175 | 1002 | C1 | Antonio Rada | Evelin Yadira Orellana Ordoñez | 2023-03-23 | 4.Plan de pagos | 1111200 | 216000 |
| R176 | 1003 | A8 | Antonio Rada | Eduar Reginaldo Colindres Estrada | 2023-04-26 | 4.Plan de pagos | 703500 | 70400 |
| R177 | 1004 | A1 | Jose Franco |  Jorge Silva Sagastume | 2023-05-16 | 4.Plan de pagos | 696469.08 | 69669.08 |
| R178 | 1005 | B5 | Brenda Búcaro | Barbara Elizabeth Ixmucane Zapeta Albanés | 2023-07-06 | 4.Plan de pagos | 941800 | 94200 |
| R179 | 1006 | B8 | Antonio Rada | Diana Marisol Donis Cú | 2024-02-21 | 4.Plan de pagos | 943100 | 94400 |
| R180 | 1007 | B4 | Brenda Búcaro | Marcela Alejandra Castro Marcía | 2023-09-04 | 4.Plan de pagos | 901400 | 90200 |
| R181 | 1008 | B3 | Antonio Rada | Jorge Roberto Arimany Comas | 2024-04-19 | 4.Plan de pagos | 845100 | 84510 |
| R182 | 1009 | E8 | Diana Alvarez | Augusto Alejandro Salazar Alecio Y Yosseline Yanira Moscoso Hidalgo  | 2024-11-06 | 4.Plan de pagos | 1515084.48 | 152084.48 |
| R183 | 1010 | A10 | Antonio Rada | Allan Donaldo Lapop Cárdemas | 2023-08-27 | 4.Plan de pagos | 848900 | 84900 |
| R184 | 1011 | C10 | Brenda Búcaro | Sebastian Gutierrez Ruiz | 2023-03-31 | 4.Plan de pagos | 1131525 | 113225 |
| R185 | 1012 | C7 | Ronaldo | Iurix, S.A | 2024-01-09 | 4.Plan de pagos | 973800 | 97380 |
| R186 | 1013 | B6 | Brenda Búcaro | Byron Nehemías Ortega Ruiz | 2023-09-12 | 4.Plan de pagos | 903600 | 90400 |
| R187 | 1014 | B1 | Antonio Rada | Jorge Antonio Reyes Ochoa | 2023-06-11 | 4.Plan de pagos | 883300 | 88400 |
| R188 | 1015 | E2 | Antonio Rada | Pedro Luis Artero Bran | 2023-04-19 | 4.Plan de pagos | 1333600 | 133360 |
| R189 | 1016 | A2 | Brenda Búcaro | Sergio Enrique Bolaños López | 2023-04-16 | 4.Plan de pagos | 651600 | 65200 |
| R190 | 1017 | A6 | Brenda Búcaro | Irene Alejandra Reyes Guzmán | 2023-04-16 | 4.Plan de pagos | 663200 | 66400 |
| R191 | 1018 | A3 | Antonio Rada | Corporacion Fb Sociedad Anonima | 2023-08-03 | 4.Plan de pagos | 690627.17 | 69127.17 |
| R192 | 1019 | C3 | Antonio Rada | Marta Haydee Hurtarte Ruano De Sánchez | 2023-03-31 | 4.Plan de pagos | 913168.92462 | 154568.92 |
| R193 | 1020 | C2 | Antonio Rada | Rolando Edwin Villatoro Hernandez | 2025-02-26 | 2. Reserva | 1259997.38 | 125997.37 |
| R194 | 1101 | D10 | Antonio Rada | Maria Fernanda Contreras Lopez | 2024-03-23 | 4.Plan de pagos | 1176700 | 117700 |
| R195 | 1102 | D11 | Antonio Rada | Luis Alberto Lopez Velasquez | 2023-03-31 | 4.Plan de pagos | 1152100 | 115300 |
| R196 | 1103 | B4 | Antonio Rada |  Samuel Hiram Salazar Say | 2023-04-25 | 4.Plan de pagos | 901400 | 180300 |
| R197 | 1104 | B3 | Antonio Rada | Denisse Hortencia Alarcon Diaz | 2024-02-21 | 4.Plan de pagos | 887400 | 88800 |
| R198 | 1105 | A6 | Brenda Búcaro |  Luis Pedro Escobedo Del Cid | 2023-03-27 | 4.Plan de pagos | 657892.7 | 65892.7 |
| R199 | 1106 | A4 | Antonio Rada | Emerson Emanuel Menendez Rodas | 2023-04-27 | 4.Plan de pagos | 661100 | 66200 |
| R200 | 1107 | A12 | Ronaldo | International Coffee Industry, S.A | 2024-01-09 | 4.Plan de pagos | 685200 | 68520 |
| R201 | 1108 | C6 | Brenda Búcaro | Denis Orlando Coto Zelaya | 2023-03-28 | 4.Plan de pagos | 1100438.98 | 110138.98 |
| R202 | 1109 | C5 | Antonio Rada | Fausto Norberth Mendez Melgar | 2023-12-03 | 4.Plan de pagos | 1182285.73 | 118285.73 |
| R203 | 1110 | C6 | Antonio Rada | Juan Carlos Lantzendorffer Haas | 2023-06-05 | 4.Plan de pagos | 1166200 | 116700 |
| R204 | 1111 | C5 | Antonio Rada | Erika Ruth Castro Juarez | 2024-02-07 | 4.Plan de pagos | 1193202.5 | 119402.5 |
| R205 | 1112 | A8 | Antonio Rada | Grupo Sak Y Sak, S.A. | 2023-06-06 | 4.Plan de pagos | 690627.17 | 690627.17 |
| R206 | 1113 | A2 | Jose Franco | Marcas & Secretos, S.A. | 2023-04-05 | 4.Plan de pagos | 645639 | 64639 |
| R207 | 1114 | A11 | Antonio Rada | Clara Hilda Maria Falla Bianchi De Cruz-Gomar | 2024-05-28 | 4.Plan de pagos | 801793.67 | 77986.52 |
| R208 | 1115 | B4 |  |  |  | 1.Disponible | 1142630.20477101 | 114263.020477101 |
| R209 | 1116 | B3 | Antonio Rada | Francisco Javier Arriaza Reyes | 2024-02-15 | 4.Plan de pagos | 887400 | 88800 |
| R210 | 1117 | D10 | Antonio Rada | Jerson Leonel Chavez Martinez | 2023-12-14 | 4.Plan de pagos | 1165934.22 | 116634.22 |
| R211 | 1118 | D11 | Antonio Rada | Jose Raul Velasco Ferregno | 2024-06-20 | 4.Plan de pagos | 1181000 | 118100 |
| R212 | 1201 | D4 | Antonio Rada | Rogelio Alejandro Ochoa Hernandez | 2024-06-18 | 4.Plan de pagos | 1253700 | 125400 |
| R213 | 1202 | D1 | Antonio Rada | Edwin Steven Quiroa Sitamul | 2024-02-28 | 4.Plan de pagos | 1265500 | 126600 |
| R214 | 1203 | B4 | Antonio Rada | Allan Vinicio Velásquez León | 2023-08-27 | 4.Plan de pagos | 901400 | 90200 |
| R215 | 1204 | B3 | Antonio Rada | Josselin Alejandra Turcios Orantes | 2024-02-14 | 4.Plan de pagos | 887400 | 88800 |
| R216 | 1205 | A6 | Antonio Rada | Andrea Nicole Mansilla Fuentes | 2023-03-25 | 4.Plan de pagos | 663200 | 66400 |
| R217 | 1206 | A4 | Jose Franco | Juan José Silva Pacheco | 2023-05-16 | 4.Plan de pagos | 691118.49 | 69118.49 |
| R218 | 1207 | A12 | Jose Franco |  David Arimany Monzón | 2023-03-27 | 4.Plan de pagos | 678932 | 67932 |
| R219 | 1208 | C6 | Antonio Rada | Jmx Inversiones Sociedad Anonima | 2023-04-15 | 4.Plan de pagos | 1110600 | 111100 |
| R220 | 1209 | C5 | Antonio Rada | Gilda Elena Siekavizza Castillo / Jose Pablo Pineda Bran | 2023-03-28 | 4.Plan de pagos | 1108600 | 110900 |
| R221 | 1210 | C6 | Antonio Rada | Jmx Inversiones Sociedad Anonima | 2023-04-15 | 4.Plan de pagos | 1110600 | 111100 |
| R222 | 1211 | C5 | Antonio Rada | Jorge Daniel Baca Chiroy | 2023-11-28 | 4.Plan de pagos | 1193202.5 | 119402.5 |
| R223 | 1212 | A8 | Brenda Búcaro | Sergio Enrique Bolaños López | 2023-04-16 | 4.Plan de pagos | 666800 | 66700 |
| R224 | 1213 | A2 | Jose Franco | Marcas & Secretos, S.A. | 2023-04-05 | 4.Plan de pagos | 645639 | 64639 |
| R225 | 1214 | A11 | Jose Franco | Manuel Armando Fletes Ordoñez | 2023-06-05 | 4.Plan de pagos | 786200 | 78700 |
| R226 | 1215 | B4 | Antonio Rada |  Jose Javier Hernandez Juarez | 2023-04-11 | 4.Plan de pagos | 858400 | 85900 |
| R227 | 1216 | B3 |  |  |  | 1.Disponible | 1126261.81955992 | 112626.18195599201 |
| R228 | 1217 | D4 | Antonio Rada | Irene Noemy Santisteban Chiguil | 2024-04-09 | 4.Plan de pagos | 1253700 | 125400 |
| R229 | 1218 | D1 | Diana Alvarez | Hector Ricardo Echeverria  Mendez | 2024-11-18 | 2. Reserva | 1350925.53 | 135092.55 |
| R230 | 1301 | D4 | Antonio Rada | Raul Eliazzar Lemus Garza | 2024-06-13 | 4.Plan de pagos | 1253700 | 125400 |
| R231 | 1302 | D1 | Antonio Rada | Rodolfo Godoy Lemus | 2024-11-13 | 4.Plan de pagos | 1350925.53 | 135125.53 |
| R232 | 1303 | B4 | Antonio Rada | Ricardo Fernando Linares Perez | 2023-08-06 | 4.Plan de pagos | 901400 | 90200 |
| R233 | 1304 | B3 | Antonio Rada | Shirley Hilene Recinos | 2023-10-24 | 4.Plan de pagos | 879281.06 | 87981.06 |
| R234 | 1305 | A6 | Antonio Rada | Franklin Rene Santisteban Rriola | 2023-03-23 | 4.Plan de pagos | 663200 | 66400 |
| R235 | 1306 | A4 | Brenda Búcaro |  Barbara Elizabeth Barrientos Valenzuela | 2023-05-08 | 4.Plan de pagos | 697500 | 69800 |
| R236 | 1307 | A12 | Jose Franco | Fernando José Franco Jiménez | 2023-03-31 | 4.Plan de pagos | 678932 | 67932 |
| R237 | 1308 | C6 | Antonio Rada | Gerson Alexander Urias Marquez | 2023-10-31 | 4.Plan de pagos | 1183693 | 118393 |
| R238 | 1309 | C5 |  |  |  | 1.Disponible | 1422277.63566536 | 142227.76356653598 |
| R239 | 1310 | C6 | Jose Franco |  Raúl Cabrera Galindo | 2023-03-27 | 4.Plan de pagos | 1166200 | 111100 |
| R240 | 1311 | C5 | Antonio Rada | Luis Gabriel Garrido Blanco | 2023-10-03 | 4.Plan de pagos | 1022010 | 102201 |
| R241 | 1312 | A8 | Brenda Búcaro | Arturo Alfredo Monzón López | 2023-04-18 | 4.Plan de pagos | 703500 | 66700 |
| R242 | 1313 | A2 | Jose Franco | Marcas & Secretos, S.A. | 2023-04-05 | 4.Plan de pagos | 645649 | 64639 |
| R243 | 1314 | A11 | Brenda Búcaro | Sidney Alexander Osorio Montufar | 2023-03-20 | 4.Plan de pagos | 715600 | 71600 |
| R244 | 1315 | B4 |  |  |  | 1.Disponible | 1072218.69827634 | 107221.86982763401 |
| R245 | 1316 | B3 | Antonio Rada | Juan Ernesto Vossberg Ordoñez / Sumilab | 2023-11-02 | 4.Plan de pagos | 879281.06 | 87981.06 |
| R246 | 1317 | D4 | Antonio Rada | Marcos David Boror Alpirez | 2024-08-21 | 4.Plan de pagos | 1316385 | 131685 |
| R247 | 1318 | D1 | Antonio Rada | Héctor Felipe Alfaro Mancilla | 2024-11-20 | 4.Plan de pagos | 1350925.53 | 135125.53 |
| R248 | 1401 | D12 | Brenda Búcaro | Fernando García Coronado | 2023-08-20 | 4.Plan de pagos | 1172500 | 117300 |
| R249 | 1402 | D13 | Antonio Rada | Marlen Fabiola Izaguirre Navas | 2024-10-07 | 4.Plan de pagos | 1252020 | 125202 |
| R250 | 1403 | B6 | Antonio Rada | Maria Mercedes Lizarralde Mc Allister | 2023-03-27 | 4.Plan de pagos | 852627.54462 | 85327.54 |
| R251 | 1404 | B1 | Jose Franco | Diego Eduardo Roman Hazard | 2023-03-27 | 4.Plan de pagos | 849571 | 169971 |
| R252 | 1405 | E2 | Antonio Rada | Victor Leonel Orozco Lopez | 2023-04-18 | 4.Plan de pagos | 1301000 | 130100 |
| R253 | 1406 | A2 | Jose Franco |  Jonatan Hans Donis Montenegro | 2023-03-27 | 4.Plan de pagos | 651600 | 65200 |
| R254 | 1407 | B5 | Ronaldo | José Herrera Pérez | 2024-02-14 | 4.Plan de pagos | 1074100 | 107410 |
| R255 | 1408 | B8 |  |  |  | 1.Disponible | 1331589.48698949 | 133158.948698949 |
| R256 | 1409 | B4 | Ronaldo | International Coffee Industry, S.A | 2024-01-09 | 4.Plan de pagos | 858400 | 85840 |
| R257 | 1410 | B3 | Antonio Rada | Selvin Ramiro Gamez Perez | 2024-02-05 | 4.Plan de pagos | 887400 | 88800 |
| R258 | 1411 | E8 | Antonio Rada | Julio Cesar Morales Díaz | 2023-06-19 | 4.Plan de pagos | 1382700 | 138300 |
| R259 | 1412 | A4 | Brenda Búcaro | Javier Andrés Soto Coronado | 2023-04-28 | 4.Plan de pagos | 661100 | 66200 |
| R260 | 1501 | D3 | Antonio Rada | Paulo Roberto Lopez Velasquez | 2025-04-02 | 2. Reserva | 1450747.8 | 123200 |
| R261 | 1502 | D2 | Sofia Paredes | Edgar Benjamín Ramírez Masaya Y Leslie María Ivonne Pivaral Gudiel | 2024-10-13 | 4.Plan de pagos | 1333525.22645793 | 131660 |
| R262 | 1503 | B6 | Brenda Búcaro | Emilia Aracely Larrazabal Melgar | 2023-03-31 | 4.Plan de pagos | 852627.54462 | 85227.54 |
| R263 | 1504 | B1 | Jose Franco | Berta Eugenia Morales López | 2023-05-22 | 4.Plan de pagos | 883300 | 88800 |
| R264 | 1505 | D7 | Antonio Rada | Daniel Alvarez Alvarez | 2024-07-18 | 4.Plan de pagos | 1277800 | 127800 |
| R265 | 1506 | A9 |  |  |  | 1.Disponible | 996326.324410679 | 99632.63244106791 |
| R266 | 1507 | C9 | Jose Franco | Gabriel Arimany Monzón | 2023-03-28 | 4.Plan de pagos | 1141461.03338 | 114161 |
| R267 | 1508 | C8 | Jose Franco | María Carolina Arimany Comas | 2023-03-28 | 4.Plan de pagos | 1141560 | 114160 |
| R268 | 1509 | B4 |  |  |  | 1.Disponible | 1082159.69644988 | 108215.96964498801 |
| R269 | 1510 | B3 | Brenda Búcaro | José Paúl Centeno Valdés | 2023-06-08 | 4.Plan de pagos | 887400 | 88800 |
| R270 | 1511 | E8 | Antonio Rada | Luis Fernando Velasquez León | 2023-08-17 | 4.Plan de pagos | 1382700 | 138300 |
| R271 | 1512 | A10 |  |  |  | 1.Disponible | 949356.175544085 | 94935.6175544085 |
| R272 | 1601 | D3 | Brenda Búcaro | Fernando García Coronado | 2023-08-24 | 4.Plan de pagos | 1255283.9 | 125583.9 |
| R273 | 1602 | D2 | Ronaldo | International Coffee Industry, S.A | 2024-01-09 | 4.Plan de pagos | 1297200 | 129720 |
| R274 | 1603 | B6 | Antonio Rada | Inmobiliaria Quince Sociedad Anonima | 2023-03-28 | 4.Plan de pagos | 863130.61 | 156030.61 |
| R275 | 1604 | B1 | Antonio Rada | Oliver Lenin Garcia Godoy | 2023-05-16 | 4.Plan de pagos | 894100 | 89500 |
| R276 | 1605 | D7 | Antonio Rada | Edgar Ronaldo Muy Pineda | 2024-08-22 | 4.Plan de pagos | 1393455 | 139355 |
| R277 | 1606 | A9 |  |  |  | 1.Disponible | 996326.324410679 | 99632.63244106791 |
| R278 | 1607 | C9 | Brenda Búcaro | Edvin Carlos Cifuentes Salguero | 2023-05-31 | 4.Plan de pagos | 1164200 | 116500 |
| R279 | 1608 | C8 | Jose Franco | María Carolina Arimany Comas | 2023-03-28 | 4.Plan de pagos | 1153648 | 115448 |
| R280 | 1609 | B4 | Antonio Rada | Christian Josue Colindres Sandoval | 2023-03-25 | 4.Plan de pagos | 860950.584005 | 86150.58 |
| R281 | 1610 | B3 | Antonio Rada | Grupo Sak Y Saksociedad Anonima | 2023-05-31 | 4.Plan de pagos | 890081.34 | 890081.34 |
| R282 | 1611 | E8 | Brenda Búcaro | Marvin Osiel Fuentes Fuentes | 2023-07-07 | 4.Plan de pagos | 1437500 | 143800 |
| R283 | 1612 | A10 |  |  |  | 1.Disponible | 982583.641688128 | 98258.36416881281 |
| R284 | 1701 | E6 | Brenda Búcaro |  Ramiro José Muñoz Jordán | 2023-03-29 | 4.Plan de pagos | 1389570 | 139070 |
| R285 | 1702 | A3 | Brenda Búcaro | David Alejandro Donis Lopez | 2023-04-15 | 4.Plan de pagos | 666800 | 66700 |
| R286 | 1703 | D5 |  |  |  | 1.Disponible | 1411239.47276448 | 141123.947276448 |
| R287 | 1704 | A5 | Brenda Búcaro | Javier Andres Soto Coronado | 2023-03-10 | 4.Plan de pagos | 617600 | 62000 |
| R288 | 1705 | D6 | Antonio Rada | Maxi Alexander Mendez Moran | 2025-04-02 | 2. Reserva | 1446043.24 | 144604.324 |
| R289 | 1706 | B4 | Jose Franco |  David Arimany Monzón | 2023-03-24 | 4.Plan de pagos | 860951 | 87051 |
| R290 | 1707 | B5 |  | Miguel Eduardo Yon Moll | 2025-03-05 | 2. Reserva | 908000 | 90800 |
| R291 | 1708 | E4 |  |  |  | 1.Disponible | 1538042.11998452 | 153804.211998452 |
| R292 | 1801 | E7 | Jose Franco | Luis Arimany Monzón | 2023-03-27 | 4.Plan de pagos | 1391452 | 139152 |
| R293 | 1802 | A10 | Antonio Rada | Fredy Rene Velasquez Quevedo | 2023-05-18 | 4.Plan de pagos | 848900 | 84900 |
| R294 | 1803 | D5 |  |  |  | 1.Disponible | 1411239.47276448 | 141123.947276448 |
| R295 | 1804 | A5 | Brenda Búcaro | Juan Pablo Monterroso Arroyo | 2023-03-10 | 4.Plan de pagos | 617600 | 62000 |
| R296 | 1805 | D6 |  |  |  | 1.Disponible | 1416043.23798947 | 141604.323798947 |
| R297 | 1806 | B4 | Antonio Rada | Business View Sociedad Anonima | 2023-03-29 | 4.Plan de pagos | 860950.584005 | 86150.58 |
| R298 | 1807 | C11 | Jose Franco |  Yuly Marisol Rodríguez Ordoñez De Arimany | 2023-03-27 | 4.Plan de pagos | 1131156 | 113156 |
| R299 | 1808 | E3 | Antonio Rada | Monica Cecilia Rodriguez Villalta | 2023-09-30 | 4.Plan de pagos | 1417808.51 | 141808.51 |
| R300 | 1901 | A11 | Brenda Búcaro | Luis Pedro Escobedo De Cid | 2023-03-27 | 4.Plan de pagos | 738382 | 73882 |
| R301 | 1902 | D5 | Ronaldo | International Coffe Industry, S.A | 2024-01-09 | 4.Plan de pagos | 1322000 | 132200 |
| R302 | 1903 | D6 | Ronaldo | International Coffe Industry, S.A | 2024-01-09 | 4.Plan de pagos | 1326500 | 132650 |
| R303 | 1904 | D5 | Ronaldo | International Coffe Industry, S.A | 2024-01-09 | 4.Plan de pagos | 1322000 | 132200 |
| R304 | 1905 | D8 | Ronaldo | International Coffe Industry, S.A | 2024-01-09 | 4.Plan de pagos | 1365000 | 136500 |
| R308 | Desistimiento |  |  |  |  |  |  |  |
| R310 | 416 | A4 |  | Evelyn Andrea Sagastume Dubon |  | 1.Disponible | 726855.428686374 | 72685.5428686374 |
| R311 | 707 | A12 | Antonio Rada | Pablo Josue Alvarez Sanchez | 2023-08-15 | 4.Plan de pagos | 722900 | 72300 |
| R312 | 711 | C5 | Antonio Rada | Marcela Alejandra Castillo Melgar | 2023-11-09 | 4.Plan de pagos | 1181561.5 | 118161.5 |
| R313 | 1009 | E8 |  | Cristian Arturo Sanchez Lopez | 2023-01-04 | Desistimiento | 1515084.48 | 152084.48 |
| R314 | 1315 | B4 |  | Hilda Maria Perez Escobedo |  | 1.Disponible | 1072218.69827634 | 107221.86982763401 |
| R315 | 1501 | D3 | Antonio Rada | Carmen Gabriela Contreras Alfaro | 2023-07-28 | 4.Plan de pagos | 1231200 | 123200 |
| R316 | 1020 | C2 | Diana Alvarez | Jose Mauricio Duarte Carranza | 2024-11-30 | 4.Plan de pagos | 1259997.38 | 125997.37 |
| R317 | 1114 | A11 | Antonio Rada | Fernando Antonio Reyes De León | 2023-05-19 | 4.Plan de pagos | 748092.41 | 74892.41 |
| R318 | 1114 | A11 | Antonio Rada | Monica Elizabeth Estrada Cordon De Franco | 2024-05-28 | 4.Plan de pagos | 748092.41 | 74892.41 |
| R319 | 1410 | B3 | BRENDA BUCARO | Luis Fernando Gutierrez Perez | 2023-03-27 | 4.Plan de pagos | 845100 | 84600 |

---

## 10. BENESTARE (with-space sheet name)

**Purpose:** Benestare intermediate version — maps old unit IDs (e.g. B-101) to new unit format (e.g. 101-A). Cross-reference table for unit renumbering between BENES and BENESTARE 2.0. Towers A and B.
**Non-empty rows:** 237 | **Max columns:** 85

### Column Headers (Row 7)

- **A**: A partir de Ago-25
- **B**: *
- **F**: Apto
- **G**: Torre
- **H**: Tipo
- **I**: Vendedor
- **J**: Cliente
- **K**: Reservado
- **L**: Estatus
- **M**: Precio de Venta
- **N**: Enganche
- **O**: 2023-03-31
- **P**: 2023-04-30
- **Q**: 2023-05-31
- **R**: 2023-06-30
- **S**: 2023-07-31
- **T**: 2023-08-31
- **U**: 2023-09-30
- **V**: 2023-10-31
- **W**: 2023-11-30
- **X**: 2023-12-31
- **Y**: 2024-01-31
- **Z**: 2024-02-29
- **AA**: 2024-03-31
- **AB**: 2024-04-30
- **AC**: 2024-05-31
- **AD**: 2024-06-30
- **AE**: 2024-07-31
- **AF**: 2024-08-31
- **AG**: 2024-09-30
- **AH**: 2024-10-31
- **AI**: 2024-11-30
- **AJ**: 2024-12-31
- **AK**: 2025-01-31
- **AL**: 2025-02-28
- **AM**: 2025-03-31
- **AN**: 2025-04-30
- **AO**: 2025-05-31
- **AP**: 2025-06-30
- **AQ**: 2025-07-31
- **AR**: 2025-08-31
- **AS**: 2025-09-30
- **AT**: 2025-10-31
- **AU**: 2025-11-30
- **AV**: 2025-12-31
- **AW**: 2026-01-31
- **AX**: TOTAL COBROS Y RESERVAS
- **AY**: % Cobro
- **AZ**: SALDO PENDIENTE ENGANCHE
- **BA**: % Pendiente
- **BB**: Monto a Financiar por Banco
- **BC**: % a Financiar
- **BD**: Proyección de Cobros (S/ Modelo Financiero)
- **BE**: Status inmueble
- **BF**: ESTATUS CLIENTE
- **BG**: Cuotas Pactadas
- **BH**: Cuota de Enganche
- **BI**: Total cuotas pactadas
- **BJ**: Monto de Reserva Pactado
- **BK**: Monto de Cuota Pactada
- **BL**: Cuotas Pagadas
- **BM**: Cantidad de cuotas que deben estar pagadas
- **BN**: Monto que debe estar cancelado a la fecha
- **BO**: Monto pagado de cuotas a la fecha
- **BP**: Enganche + Cuotas Extraordinarias Pagadas
- **BQ**: Diferencia
- **BR**: Cobro adicional a lo pactado
- **BS**: Cobro no realizado según lo pactado
- **BT**: Cuotas
- **BU**: Caso Especial / F&F
- **BV**: Observaciones

### DB Mapping

| Column | DB Target |
|--------|-----------|
| Col A (A partir de Ago-25) | new unit_number format (e.g. 101-A) — `rv_units.unit_number` |
| Col B (*) | old reference ID (e.g. B-101) — legacy cross-reference |
| Apto (col F) | `rv_units.unit_number` (numeric) |
| Torre | `towers.name` |
| Tipo | `rv_units.unit_type` |
| Vendedor | `salespeople.name` |
| Cliente | `rv_clients.full_name` |
| Reservado | `reservations.created_at` |
| Estatus | `rv_units.status` |
| Precio de Venta | `sales.sale_price` |
| Enganche | `sales.down_payment` |
| Date columns | `payments.payment_date` + `payments.amount` |

### Data Rows (R8–R238, key fields)

| Row | New ID | Old ID | Unit# | Tower | Type | Salesperson | Client | Date | Status | Price (GTQ) | Enganche (GTQ) |
|-----|--------|--------|-------|-------|------|-------------|--------|------|--------|-------------|----------------|
| R8 | 101-B | B-101 | 101 | A | B | Luis Esteban | Wendy Azucena Barrientos Salazar | 2024-03-23 | 4.Plan de pagos | 477700 | 24000 |
| R9 | 102-B | B-102 | 102 | A | B | Luis Esteban | Orfa Sarai Santos Morales | 2024-06-10 | 4.Plan de pagos | 477700 | 23900 |
| R10 | 110-B | B-110 | 103 | A | C | Abigail Garcia | Helen Lorena Monroy Jauregui | 2024-02-26 | 4.Plan de pagos | 477700 | 24000 |
| R11 | 105-B | B-105 | 104 | A | B | Abigail Garcia | Astrid Marleny Pineda Gonzalez | 2023-11-28 | 4.Plan de pagos | 494900 | 23900 |
| R12 | 107-B | B-105 | 105 | A | A | Abigail Garcia | Juan Carlos Carrillo Hernandez | 2023-10-02 | 4.Plan de pagos | 384700 | 38500 |
| R13 | 108-B |  | 108 | B | B | Eder Veliz | Esvin Luciano Quino Suret | 2025-08-21 | 4.Plan de pagos | 492700 | 24700 |
| R14 | 109-B | B-107 | 108 | A | B | Alejandra Calderón | Heidi Lisseth Morataya Flores | 2023-10-03 | 4.Plan de pagos | 494900 | 49490 |
| R15 | 103-B | B-109 | 109 | A | C | Pedro Sarti | María Angela Rodríguez Folgar | 2025-01-04 | 4.Plan de pagos | 477700 | 24000 |
| R16 | 112-B |  | 112 | B | B | Efren Sanchez | LINDA ROS MONTERROSO CIFUENTES | 2025-08-05 | 2.Reservado | 487000 | 24400 |
| R17 | 113-B |  | 113 | B | B | Eder Veliz | Ruth María Isabel Rodríguez Coronado | 2025-08-06 | 4.Plan de pagos | 487000 | 24400 |
| R18 | 201-B | B-108 | 201 | A | B | Luis Esteban | Andrea Celeste Aparicio Juarez | 2024-04-07 | 4.Plan de pagos | 477700 | 24000 |
| R19 | 203-B | B-201 | 202 | A | C | Karina Fuentes | Byron Juventino López Mayen | 2023-11-27 | 4.Plan de pagos | 497900 | 49800 |
| R20 | 204-B | B-203 | 203 | A | C | Abigail Garcia | Jesica Paola Noj Ramirez | 2024-07-06 | 4.Plan de pagos | 477000 | 24000 |
| R21 | 205-B | B-204 | 204 | A | B | Abigail Garcia | Gerber Eliezer Perez Alonzo | 2024-07-06 | 4.Plan de pagos | 477700 | 24000 |
| R22 | 207-B | B-205 | 205 | A | A | Abigail Garcia | Saulo Josue Escobar Pérez | 2023-11-09 | 4.Plan de pagos | 384700 | 38500 |
| R23 | 208-B | B-207 | 207 | A | B | Abigail Garcia | Monica Aide Espital Balan | 2023-10-25 | 4.Plan de pagos | 494900 | 49500 |
| R24 | 210-B | B-208 | 209 | A | C | Antonio Rada | Joyce Sharon Cruz Arguello | 2024-10-14 | 4.Plan de pagos | 477000 | 23900 |
| R25 | 202-B | B-210 | 210 | A | B | Efren Sanchez | Carlos Humberto Joel Alvizures Carmona / Katherine Areli Turcios Alvarez | 2024-10-04 | 4.Plan de pagos | 477700 | 23900 |
| R26 | 211-B |  | 211 | B |  | Eder Veliz | Flor del Rocio Guarcas Samayoa | 2025-08-22 | 4.Plan de pagos | 492000 | 24700 |
| R27 | 212-B |  | 212 | B | B | Pablo Marroquin | DYLAN ALEXANDER RAMOS CAMPOS | 2025-08-05 | 4.Plan de pagos | 487700 | 24400 |
| R28 | 213-B |  | 213 | B | B | Pablo Marroquin | Blanca Iris Garcia Figueroa de Jocol / Ricardo Ernesto Jocol Molina | 2025-08-17 | 4.Plan de pagos | 492700 | 24700 |
| R29 | 301-B | B-210 | 301 | A | B | Eder Veliz | Erick Alejandro Martinez Morales | 2025-05-30 | 4.Plan de pagos | 477700 | 23900 |
| R30 | 303-B | B-202 | 302 | A | C | Eder Veliz | Victor Manuel Mijangos Castillo | 2025-05-26 | 4.Plan de pagos | 477000 | 23900 |
| R31 | 302-B | B-202 | 302 | B | B | Eder Veliz | Melany Ninneth Flores & Erick Daniel Ramirez | 2025-08-03 | 4.Plan de pagos | 487700 | 24400 |
| R32 | 304-B | B-301 | 303 | A | C | Antonio Rada | Xiomara Edith García Solís De Morales | 2024-12-09 | 4.Plan de pagos | 477000 | 23900 |
| R33 | 306-B | B-303 | 304 | A | B | Efren Sanchez | Saul Esteban Mayen Santos | 2024-09-30 | 4.Plan de pagos | 477700 | 23900 |
| R34 | 305-B |  | 305 | B |  | Efren Sánchez | Dulce Rocio Medrano Barrera | 2025-07-07 | 4.Plan de pagos | 487700 | 23900 |
| R35 | 306-B |  | 306 | B |  | Eder Veliz | Sara Fernanda Enriquez Lemus | 2025-08-30 | 4.Plan de pagos | 492700 | 24700 |
| R36 | 309-B |  | 309 | B |  | Eder Veliz | Sara Fernanda Enriquez Lemus | 2025-08-30 | 4.Plan de pagos | 492700 | 24700 |
| R37 | 305-A | B-303 | 305 | A | A | Eder Veliz | Andrea Yohana Cabrera Velasquez | 2025-06-05 | 2.Reservado | 369600 | 18500 |
| R38 | 310-B |  | 308 | A | C | Abigail Garcia | Eddy Daniel Roque Arellanos | 2024-04-08 | 4.Plan de pagos | 477000 | 24000 |
| R39 | 309-A |  | 309 | A | B | Efren Sanchéz | Rosita Elvira Clara Pineda | 2025-06-25 | 2.Reservado | 477700 | 23900 |
| R40 | 401-B | B-310 | 401 | A | B | Karina Fuentes | Lourdes Ofelia Baires | 2023-12-02 | 4.Plan de pagos | 494900 | 49500 |
| R41 | 404-B |  | 403 | A | C | Luis Esteban | Luis Fernando Tique Santos | 2024-05-14 | 4.Plan de pagos | 477000 | 23900 |
| R42 |  |  | 403 | B | C | Efren Sanchez | ESTEFAN GUADALUPE JUÁREZ GIRÓN DE PEREZ | 2026-01-08 | 2.Reservado | 492000 | 24600 |
| R43 | 405-A | B-401 | 405 | A | A | Efren Sanchez | Sara Esmeralda López Hernández | 2025-06-30 | 4.Plan de pagos | 369600 | 18500 |
| R44 | 404-B |  | 404 | B | B | Efren Sanchez | Amanda Aracely Castillo Guzman | 2024-11-30 | 4.Plan de pagos | 477000 | 100000 |
| R45 | 408-B | B-403 | 407 | A | B | Eder Veliz | Alan Emanuel Tunches Huertas | 2025-05-10 | 4.Plan de pagos | 477700 | 23900 |
| R46 | 407-B |  | 407 | B | A | Pablo Marroquin | Mauricio Ricardo Mármol Vásquez | 2025-08-06 | 4.Plan de pagos | 379600 | 20000 |
| R47 | 402-B | B-404 | 409 | A | B | Efren Sanchez | Rudy Ronaldo Peña Larios | 2025-03-31 | 4.Plan de pagos | 477700 | 23900 |
| R48 | 413-B |  | 410 | A | B | Abigail Garcia | Carla Yanira Castillo | 2024-03-17 | 4.Plan de pagos | 477700 | 24000 |
| R49 | 412-B |  | 412 | B |  | Eder Veliz | Edgar Manfredo Hernández Cabrera | 2025-08-21 | 4.Plan de pagos | 492700 | 24700 |
| R50 | 503-C | B-402 | 502 | A | C | Karina Fuentes | Oscar Oswaldo Ramos Gil | 2023-12-10 | 4.Plan de pagos | 497900 | 49800 |
| R51 | 502-B |  | 502 | B |  | Pablo Marroquin | JURGEN ALEXANDER HERNANDEZ CAMPOSECO | 2025-08-24 | 4.Plan de pagos | 492700 | 24700 |
| R52 | 503-A | B-413 | 503 | A | A | Pablo Marroquín | Michael Alexander Morales Rodríguez / Helen Mishel Rodas López de Morales   | 2025-06-27 | 4.Plan de pagos | 477000 | 23900 |
| R53 | 504-A |  | 504 | A | B | Pablo Marroquín | Diego Estuardo Salguero Salvatierra | 2025-06-28 | 4.Plan de pagos | 477700 | 23900 |
| R54 | 505-B |  | 505 | B | C | Efren Sanchez | YENIFER ESTEFANIA SANTOS GONZÁLEZ / JUAN EDUARDO FLORES BARRERA | 2025-08-09 | 2.Reservado | 487000 | 24400 |
| R55 | 504-B |  | 504 | B | C | Efren Sanchez | ISRAEL ARMANDO MARROQUIN PEREZ | 2025-08-14 | 4.Plan de pagos | 487000 | 24400 |
| R56 | 507-B | B-503 | 505 | A | A | Pedro Sarti | David Enrique Aldana Mazariegos | 2025-02-05 | 4.Plan de pagos | 369600 | 18500 |
| R57 | 507-A |  | 507 | A | A | Eder Veliz | Edwin Alexander Amado Toc / Jennifer Alexa Castañeda Alvarez | 2025-06-28 | 4.Plan de pagos | 477000 | 23900 |
| R58 | 508-A |  | 508 | A | A | Eder Veliz | Sebastian Angel Milian Guas | 2025-06-28 | 4.Plan de pagos | 477000 | 23900 |
| R59 | 410-B | B-507 | 510 | A | C | Antonio Rada | Oscar Daniel Larias Guzman | 2024-08-07 | 4.Plan de pagos | 477000 | 23900 |
| R60 | 510-B | B-507 | 510 | A | C | Efren Sanchez | Angel Gabriel Coc Gomez | 2025-08-10 | 2.Reservado | 487000 | 24000 |
| R61 | 511-B |  | 511 | B | C | Pablo Marroquin | JOSMIN JOAQUIN BARAHONA MORA | 2025-08-09 | 4.Plan de pagos | 487000 | 24000 |
| R62 | 602-B |  | 601 | A | B | Luis Esteban | Santos Sebastian Pastor Velasquez | 2024-04-25 | 4.Plan de pagos | 477700 | 23900 |
| R63 | 603-B |  | 602 | A | C | Abigail Garcia | David Obdulio Perez Monzon | 2023-11-27 | 4.Plan de pagos | 497900 | 49800 |
| R64 | 604-A | B-410 | 604 | A | A | Paula Hernández | Juan Eduardo Lopez Suran | 2025-06-29 | 4.Plan de pagos | 477700 | 24000 |
| R65 |  |  | 605 | B | B | Rony Ramirez | Yoselin Siomara Yocute Yocute | 2026-01-17 | 2.Reservado | 492700 | 24700 |
| R66 | 606-A | B-602 | 606 | A | A | Eder Veliz | Ilse Mariela Rosales Diaz | 2025-06-29 | 4.Plan de pagos | 477700 | 23900 |
| R67 | 607-B | B-603 | 607 | A | A | Abigail Garcia | Luis Fernando Moreno Pozuelos | 2024-05-07 | 4.Plan de pagos | 369600 | 18500 |
| R68 | 610-B |  | 608 | A | C | Abigail Garcia | Jaquelyn Michel Chumil Castillo | 2024-04-28 | 4.Plan de pagos | 477000 | 24000 |
| R69 | 609-B |  | 609 | B |  | Efren Sanchez | Emily Daniela Hernandez Vasquez | 2025-08-25 | 4.Plan de pagos | 492700 | 24700 |
| R70 | 608-B |  | 608 | B | B | Efren Sanchez | Belter Anibal Collado Lopez  | 2025-08-17 | 4.Plan de pagos | 492700 | 24700 |
| R71 | 612-B |  | 610 | A | B | Abigail Garcia | Walter Adolfo Max Toc Crux | 2024-02-27 | 4.Plan de pagos | 477700 | 24000 |
| R72 | 611-B |  | 611 | B | C | Pablo Marroquin | MARLENY ARACELY JOCOL GARCIA / LUIS ALBERTO GRAJEDA LÓPEZ | 2025-08-09 | 4.Plan de pagos | 487000 | 24000 |
| R73 | 104-B | B-610 | 104 | B | C | Efren Sánchez | Rogerio Dagoberto Escobar Fajardo / Carmen Odila Escobar de León | 2025-07-27 | 4.Plan de pagos | 487000 | 24400 |
| R74 | 106-B | B-612 | 106 | A | B | Abigail Garcia | Loida Sarai Morales Garcia | 2024-03-03 | 4.Plan de pagos | 477700 | 47800 |
| R75 | 206-B | B-106 | 206 | A | B | Abigail Garcia | Cristina Elizabeth Musin Hernandez | 2024-05-18 | 4.Plan de pagos | 477700 | 24000 |
| R76 | 209-B | B-206 | 209 | B | B | Efren Sanchez | Douglas Alexander Crúz Cobar | 2025-07-30 | 4.Plan de pagos | 477000 | 23900 |
| R77 | 305-B | B-311 | 305 | B | B | Efren Sanchez | Angel Renato Muñoz de León  / Cesar Renato Muñoz de León | 2025-07-07 | 4.Plan de pagos | 487700 | 24400 |
| R78 | 308-B | B-613 | 308 | B | B | Pablo Marroquin | Luis Javier Aguilar España | 2025-07-06 | 4.Plan de pagos | 487700 | 24400 |
| R79 | 311-B |  | 311 | A | C | Antonio Rada | Pedro David Pérez Barrios | 2024-05-15 | 4.Plan de pagos | 477000 | 23900 |
| R80 | 312-B |  | 312 | B | B | Eder Veliz | Julian Guillermo Ramirez Garcia-Sulma Korina Hernandez Aguilar | 2025-07-31 | 4.Plan de pagos | 487700 | 24400 |
| R81 | 409-B |  | 409 | B | B | Eder Veliz | Kevin Fernando de la Cruz Toc | 2025-07-03 | 4.Plan de pagos | 477700 | 23900 |
| R82 | 411-B |  | 411 | B | C | Pablo Marroquin | Astrid Angelica Herrera Gil / Kevin Alejandro López Toc | 2025-07-20 | 4.Plan de pagos | 487000 | 24400 |
| R83 | 501-A | B-408 | 501 | B | A | Efren Sanchez | Ronald Alberto Pineda Monroy | 2025-06-28 | 4.Plan de pagos | 477700 | 23900 |
| R84 | 501-B |  | 501 | B | B | Pablo Marroquin | Hillary Kerstel Ixmucane Xona Guzmán / Francisca Guzmán López de Xoná | 2025-07-13 | 4.Plan de pagos | 487700 | 24400 |
| R85 | 508-B |  | 508 | B | B | Eder Veliz | Jorge Mario Santizo Lacayo | 2025-07-12 | 4.Plan de pagos | 487700 | 24400 |
| R86 | 601-B |  | 601 | B | B | Eder Veliz | Mario Andres Perez Lopez | 2025-07-26 | 4.Plan de pagos | 487700 | 24400 |
| R87 | 604-B |  | 604 | B | B | Efren Sánchez | Caterin Fidelina Calderón | 2025-07-05 | 4.Plan de pagos | 487000 | 23900 |
| R88 | 606-B |  | 606 | B | B | Abigail Garcia | Andrea Isabel Tezen Cabrera | 2024-05-30 | 4.Plan de pagos | 477700 | 24000 |
| R89 | 613-B |  | 613 | B | B | Abigail Garcia | Erik Estuardo Carrera Cruz | 2024-02-18 | 4.Plan de pagos | 477700 | 24000 |
| R90 | 306-A |  | 306 | TB | A | Eder Veliz | Andrea Noemi Rivas Sanchez | 2025-06-22 | 4.Plan de pagos | 477700 | 23900 |
| R91 | 313-B |  | 313 | B | B | Pablo Marroquin | Suarlim Eli Barrientos Pazos / Angel Eli Barrientos Castro | 2025-07-30 | 4.Plan de pagos | 487700 | 24400 |
| R92 | 406-B | B-406 |  |  |  | Antonio Rada | Marvin Leonel Alexander Larias Guzman | 2024-08-07 | 4.Plan de pagos | 477700 | 23900 |
| R93 | 502-C |  |  |  |  | Pablo Marroquin | Christian Isaias Patzan Mancilla / Nancy Johanna Mancilla R | 2025-09-15 | 4.Plan de pagos | 497000 | 24700 |
| R94 | 509-B |  |  |  |  | Pablo Marroquin | Diego Jose Ortiz Cordero | 2025-09-01 | 4.Plan de pagos | 492700 | 24700 |
| R95 | 112-B |  | 112 | B | B | Efren Sanchez | Cindy Gabriela Mejicanos De León | 2025-09-01 | 4.Plan de pagos | 492700 | 24700 |
| R96 | 512-B |  | 512 | B | B | Eder Veliz | Byron Méndez Cal | 2025-09-07 | 4.Plan de pagos | 492700 | 24700 |
| R97 | 513-B |  |  |  |  | Pablo Marroquin | Karen Ivonne Poggio | 2025-09-07 | 4.Plan de pagos | 492700 | 24700 |
| R98 | 201-C |  |  |  |  | Eder Veliz | Angie Soleyne Camacho Suarez | 2025-09-12 | 4.Plan de pagos | 492700 | 24700 |
| R99 | 302-C |  |  |  |  | Pablo Marroquin | Edgar Mariano Pineda Osorio | 2025-09-13 | 4.Plan de pagos | 492000 | 24600 |
| R100 | 401-C |  |  |  |  | Eder Veliz | Hellen del Rosario López Chon | 2025-09-23 | 4.Plan de pagos | 492700 | 24700 |
| R101 | 111-B |  |  |  |  | Pablo Marroquin | Wendy Judith Cortez Cuque | 2025-09-23 | 4.Plan de pagos | 487000 | 24000 |
| R102 | 601-C |  | 601 | C | B | Efren Sanchez | EDNA GIZZEL GUZMAN PEREZ / JOSUE HABRAAM QUIM GUITZ | 2025-09-24 | 4.Plan de pagos | 492700 | 24700 |
| R103 | 301-C |  | 301 | C | B | Eder Veliz | Rony Francisco Rojas Lopez | 2026-01-11 | 4.Plan de pagos | 492700 | 24700 |
| R104 | 103-C |  | 103 | C | C | Eder Veliz | Jazmin Edith Urbina Lopez | 2025-09-14 | 4.Plan de pagos | 492000 | 24600 |
| R105 | 504-C |  |  |  |  | Efren Sanchez | Luis Humberto Recinos Hernández | 2025-09-21 | 4.Plan de pagos | 492700 | 24700 |
| R106 | 101-C |  | 101 | C | B | Pablo Marroquin | Allan Danilo Tejada Alay | 2025-10-05 | 2.Reservado | 497700 | 24900 |
| R107 | 409-C |  |  |  |  | Eder Veliz | Reina Marivel Muñoz Samayoa | 2025-10-19 | 2.Reservado | 492000 | 24600 |
| R108 | 501-C |  |  |  |  | Eder Veliz | Gerson Ranferi Porras Galindo | 2025-10-12 | 2.Reservado | 492700 | 24700 |
| R109 | 510-C |  |  |  |  | Eder Veliz | Erik Francisco Estrada Catalán | 2025-10-19 | 2.Reservado | 492700 | 24700 |
| R110 | 602-C |  | 602 | C | C | Pablo Marroquin | Ailyn Mishell Pereira Méndez / Gilberto Gabriel Marroquin Morales | 2025-09-20 | 4.Plan de pagos | 492000 | 24600 |
| R111 | 603-C |  |  |  |  | Efren Sanchez | JOSUE HABRAAM QUIM GUITZ | 2025-10-15 | 2.Reservado | 497000 | 24900 |
| R112 | 610-C |  | 610 | C |  |  | Julio Humberto Soto Higueros | 2025-10-26 | 2.Reservado | 497000 | 24900 |
| R113 | 503-C |  | 503 | C | C |  | Abner Manolo Barrios Herrera | 2025-10-26 | 2.Reservado | 497000 | 24900 |
| R114 | 509-C |  |  |  |  | Pablo Marroquin | Otylio Alexander Garcia Orantes | 2025-10-18 | 2.Reservado | 497000 | 24900 |
| R115 | 608-C |  | 608 | C | C | Pablo Marroquin | Yully Aydaly Soto Higueros | 2025-10-26 | 2.Reservado | 497000 | 24900 |
| R116 | 609-C |  |  |  |  |  | Natalie Elizabeth Pacheco Menendez | 2025-10-30 | 2.Reservado | 492700 | 24600 |
| R117 | 506-B |  | 506 | B | B |  | Hugo Alexander Méndez Caal | 2025-09-11 | 2.Reservado | 492700 | 24700 |
| R118 | 404-C |  | 404 | C |  |  | SANDRA LIZETH SUNUC VELÁSQUEZ | 2025-10-28 | 2.Reservado | 492700 | 24700 |
| R119 | 508-C |  | 508 | C | C |  | Carlos Daniel Morales Palma | 2025-10-21 | 2.Reservado | 492000 | 24600 |
| R120 | 104-C |  |  |  |  |  | Oscar Josue Robledo Sagastume  | 2025-10-26 | 2.Reservado | 492700 | 24700 |
| R121 | 310-C |  | 310 | C | B | Efren Sanchez | Steven Adolfo Paredes Cabrera/Milca Sarai Barrieos Ixcoy | 2025-10-20 | 2.Reservado | 492700 | 24700 |
| R122 | 108-TC-MC |  | 108 | C | C | Efren Sanchez | JULIO JOSÉ GUZMAN TOBÍAS / NO TIENE NOMBRE LA COTIZACION | 2025-11-07 | 2.Reservado | 492000 | 24600 |
| R123 | 202-C |  |  |  |  |  | CINDY ABIGAIL ORDOÑEZ CHACON | 2025-11-09 | 2.Reservado | 497000 | 24900 |
| R124 | 209-C |  |  |  |  |  | GERBER JONATHAN ORTIZ AJAU | 2025-10-26 | 3. Vendido Sin Res. | 497000 | 24900 |
| R125 | 303-C |  | 303 | C | C |  | DIEGO GABRIEL MOLINA ROMERO | 2025-10-26 | 2.Reservado | 497000 | 24900 |
| R126 | 304-TC-MB |  | 304 | C | B | Efren Sanchez | Alex Ricardo Pérez Rodenas | 2025-11-08 | 2.Reservado | 492700 | 24700 |
| R127 | 403-TC-MC |  | 403 | C | C | Efren Sanchez | ELSA MIREYA QUINTEROS GARCIA/OSWALDO ROBERT KARL HERNANDEZ | 2025-11-10 | 2.Reservado | 492000 | 24600 |
| R128 | 407-TC-MB |  | 407 | C | B | Rony Ramirez | RONAL YOVANNI DONIS MARTINEZ | 2025-10-26 | 3. Vendido Sin Res. | 497700 | 24900 |
| R129 | 408-TC-MC |  | 408 | C | C | Daniel Veliz | YOHANA ELIZABETH ARRIVILLAGA FAJARDO | 2025-11-02 | 2.Reservado | 492000 | 24600 |
| R130 | 607-C |  |  |  |  |  | MANUEL EDGARDO VENTURA SAGASTUME | 2025-10-26 | 3. Vendido Sin Res. | 492700 | 24700 |
| R131 | 507-TC-MB |  | 507 | C | B | Rony Ramirez | JUAN DANIEL QUIÑONEZ MARQUEZ | 2025-11-01 | 3. Vendido Sin Res. | 487700 | 24400 |
| R132 | 607-A |  | 402 | B | B | Rony Ramirez | Rigoberto Gabriel Lopez | 2025-11-17 | 2.Reservado | 492700 | *** |
| R133 | 208-C |  | 208 | C |  | Efren Sanchez | Junior Abraham Boror Ramos/Jéssica Marlene Ramos Ajanel | 2025-11-29 | 2.Reservado | 492000 | 24600 |
| R134 | 107-C |  | 107 | C |  | Daniel Veliz | Amelita Natali Aguilar Lopez | 2025-11-27 | 2.Reservado | 492700 | 24700 |
| R135 |  |  | 310 | B | C | Pablo Marroquín | Debora Marie Castillo Ventura | 2026-01-17 | 2.Reservado | 497000 | 24900 |
| R136 | 209-TA MB |  | 209 | A |  | Daniel Veliz | Byron Amilcar Argueta Orrego & Sheila Roxana Ajcuc Hernandez | 2025-11-22 | 2.Reservado | 492700 | 24700 |
| R137 | 603-TB-MC |  | 603 | B | C | Efren Sanchez | Heidy Adriana Morales Regalado | 21/41/2025 | 2.Reservado | 492000 | 24600 |
| R138 | 608-TA-MC |  | 608 | A | C | Pablo Marroquín | José Armando Retana Interiano | 2025-11-20 | 2.Reservado | 497000 | 24900 |
| R139 | 309-TC-MC |  | 309 | C | C | Daniel Veliz | Julio Cesar Jeronimo Cajero | 2025-11-16 | 2.Reservado | 492000 | 24600 |
| R140 | 201-TA-MB |  | 201 | A | B | Pablo Marroquín | Silvia Dinora Pérez Ruano | 2025-11-16 | 2.Reservado | 497700 | 24900 |
| R141 | 302-TC MC |  | 302 | C | C | Pablo Marroquín | Rosa Alejandra Rodriguez Montufar | 2025-11-16 | 2.Reservado | 497000 | 24900 |
| R142 | 509-TA-MB |  | 509 | A | B | Daniel Veliz | Cintia Noemy Diaz DIaz | 2025-11-16 | 2.Reservado | 492700 | 24700 |
| R143 | 102-TC-MC |  | 102 | C | C | Efren Sanchez | Katherine Andrea Enriquez Estrada/Luis Carlos Rodriguez Arias | 2025-11-15 | 2.Reservado | 492000 | 24600 |
| R144 |  |  | 308 | C | C | Rony Ramirez | Brandon Azael Espinoza Carillas | 2026-01-18 | 2.Reservado | 492000 | 24600 |
| R145 | 307-TC-MB |  | 307 | C | B | Efren Sanchez | Wendy Guadalupe Bran Cedillo | 2025-11-14 | 2.Reservado | 492700 | 24700 |
| R146 |  |  | 402 | C | C | Eder Veliz | Miguel Estuardo Arevalo Toc | 2025-09-21 | 4.Plan de pagos | 492000 |  |
| R147 |  |  | 405 | B | B | Efren Sanchez | Victoria Nohemí García Macal | 2025-12-15 | 2.Reservado | 492000 | 24600 |
| R148 |  |  | 306 | B | B | Efren Sanchez | Oscar Ernesto Morales Calel | 2025-12-16 | 2.Reservado | 492000 | 24600 |
| R149 |  |  | 303 | B | C | Daniel Veliz | Del Carmen Jaqueline Samantha Canel Cumatz | 2025-12-08 | 2.Reservado | 492000 | 24600 |
| R150 |  |  | 103 | B | C | Pablo Marroquin | Lynsy Asaneth Alarcon Reyes de Cordon | 2025-12-17 | 2.Reservado | 492000 | 24600 |
| R151 |  |  | 105 | B | B | Pablo Marroquín | Perla Rocio Domingo Barrios | 2025-12-22 | 2.Reservado | 492000 | 24600 |
| R152 |  |  | 106 | B | B | Pablo Marroquín | Telma Estela Barrios Vicente | 2025-12-22 | 2.Reservado | 492000 | 24600 |
| R153 |  |  | 602 | B | B | Efren Sanchez | Mario René Ruiz Poncio | 2025-12-16 | 2.Reservado | 492000 | 24600 |
| R154 |  |  | 109 | C | C | Efren Sanchez | Ericka Alejandra Sagastume Girón de Herrera | 2025-12-31 | 2.Reservado | 492000 | 24600 |
| R155 |  |  | 406 | C | A | Efren Sanchez | Marvin de Jesus Sosa Ramirez / Kimberly Beatriz Sipaque Orantes | 2026-01-03 | 2.Reservado | 492000 | 24600 |
| R156 |  |  | 410 | B | C | Efren Sanchez | Luis Fernando Díaz Mijangos/Carolin Magali Rodríguez Zacarias | 2026-01-05 | 2.Reservado | 492000 | 24600 |
| R157 |  |  | 210 | B | C | Rony Ramirez | Jackelin Naomy Alvarado Pelico | 2026-01-11 | 2.Reservado | 492000 | 24600 |
| R158 |  |  | 208 | B | B | Eder Veliz | Francisca Veronica Rosales Morales | 2026-01-04 | 2.Reservado | 492000 | 24600 |
| R159 |  |  | 613 | B | B | Eder Veliz | Valery Anthonella Schulz Rosales | 2026-01-12 | 2.Reservado | 492000 | 24600 |
| R160 |  |  | 401 | B | B | Pablo Marroquín | Faviola Antonia Monroy Lima / Edwin Alfredo Rivera | 2026-01-11 | 2.Reservado | 492000 | 24600 |
| R161 |  |  | 101 | B | B | Eder Veliz | Karen Arabella Kuri López & Rodrigo Daniel Castillo Morales | 2026-01-17 | 2.Reservado | 492000 | 24600 |
| R162 |  |  | 413 | B | B | Eder Veliz | Jazmín Esmeralda Estrada Men | 2026-01-11 | 2.Reservado | 492000 | 24600 |
| R163 |  |  | 503 | B | C | Rony Ramirez | Amy Andrea Vasquez Hernandez | 2026-01-06 | 2.Reservado | 492000 | 24600 |
| R164 |  |  | 311 | B | C | Rony Ramirez | Lesly Marisol De Leon Villanueva | 2026-01-24 | 2.Reservado | 492000 | 24600 |
| R165 |  |  | 209 | C | C | Pablo Marroquín | Karen Patricia Morales Orellana / Erick Francisco Barillas Galindo | 2026-01-25 | 2.Reservado | 492000 | 24600 |
| R166 |  |  | 607 | B | A | Pablo Marroquín | Cindy Yessenia Paredes Bolaños | 2026-01-26 | 2.Reservado | 492000 | 24600 |
| R167 |  |  | 203 | B | C | Pablo Marroquín | Norma Estela Guzman Yoque | 2026-01-25 | 2.Reservado | 492000 | 24600 |
| R168 |  |  | 406 | B | B | Rony Ramirez | Mario Alexander Gutierrez Pacheco | 2026-01-20 | 2.Reservado | 492000 | 24600 |
| R169 |  |  | 612 | B | B | Efren Sanchez | Mauricio Alejandro Hernández Castro / Sherlyn Andrea Orantes Pérez | 2026-01-30 | 2.Reservado | 492000 | 24600 |
| R170 |  |  | 606 | B | B | Rony Ramirez | Oscar Alexander Velasquez Tiu | 2026-01-17 | 2.Reservado | 492000 | 24600 |
| R171 |  |  | 408 | B | B | Rony Ramirez | Oscar Misael De Jesus Santos Borrayo | 2026-01-19 | 2.Reservado | 492000 | 24600 |
| R172 |  |  | 206 | B | B | Efren Sanchez | Jorge Pablo Pérez De León | 2026-01-04 | 2.Reservado | 492000 | 24600 |
| R173 |  |  | 110 | C | B | Efren Sanchez | Fernando Terre Galdamez | 2026-01-31 | 2.Reservado | 492000 | 24600 |
| R174 |  |  | 304 | B | C | Daniel Veliz | Daniel Alberto Vargas Del Cid | 2025-12-13 | 2.Reservado | 492000 | 24600 |
| R175 | 203-C |  | 203 | C |  | Daniel Veliz | FRANCISCO ALBERTO GARCIA PALENCIA | 2025-11-30 | 2.Reservado | 492000 | 24600 |
| R176 | 404-C |  | 404 | B |  | Efren Sanchez | José Luis García Macal | 2025-11-30 | 2,Reservado | 492000 | 24600 |
| R187 |  |  | Desistimiento |  |  |  |  |  |  |  |  |
| R188 |  |  | APTO | MODELO | TORRE | VENDOR | CLIENTE | FECHA | TIPO | P. VENTA | REC. NO. |
| R189 |  |  | 105 | TB | B | Abigail Garcia | Belia Ester Velasquez Castillo | 2023-11-28 | 4.Plan de pagos | 477700 | 23900 |
| R190 |  |  | 108 | TB | B | Karina Fuentes | Indira Marisela Lopez Gomez | 2024-08-13 | 4.Plan de pagos | 494900 | 49500 |
| R191 |  |  | 111 | TB | C | Efren Sanchez | María Reneé Yela Ochoa | 2025-02-26 | 2.Reservado | 477000 | 24000 |
| R192 |  |  | 112 | TB | B | Abigail Garcia | Edgar Giovanni Palomo Robles | 2024-03-21 | 4.Plan de pagos | 477700 | 24000 |
| R193 |  |  | 113 | TB | B | Abigail Garcia | Keneth David Palomo Lopez | 2024-03-21 | 4.Plan de pagos | 477700 | 24000 |
| R194 |  |  | 212 | TB | B | Antonio Rada | Reina Elizabet Sandoval Perez | 2024-09-04 | 2.Reservado | 507200 | 50720 |
| R195 |  |  | 501 | TB | B | Efren Sanchez | Carlos Humberto Joel Alvizures Carmona | 2024-08-30 | 2.Reservado | 507200 | 50720 |
| R196 |  |  | 209 | TB | B |  | Maria Cecilia Reyna Barrera | 2024-05-18 |  | 477700 | 24000 |
| R197 |  |  | 104 | TB | C | Karina Fuentes | Brayan Eduardo Sosa Canto | 2023-10-31 | 4.Plan de pagos | 497900 | 49800 |
| R198 |  |  | 510 | B | C | Eder Veliz | Baudilio Santos Galicia | 2025-05-06 | Reservado | 507200 | 50720 |
| R199 |  |  | 601 | TB | B |  |  |  | 1.Disponible | 477700 | 33439 |
| R200 |  |  | 605 | B | B | Luis Esteban | Christhofer Steven Guevara | 2024-05-30 | 4.Plan de pagos | 477700 | 23900 |
| R201 |  |  | 608 | B | B | Luis Esteban | Gerson Augusto Estrada Oliva | 2024-07-04 | 4.Plan de pagos | 477700 | 23900 |
| R202 |  |  | 604 | TB | C | Abigail Garcia | Pedro Alejandro Tezen Cabrera | 2024-02-17 | 4.Plan de pagos | 477700 | 24000 |
| R203 |  |  | 209 | TB | B |  | Laura Sofia Caballeros González | 2025-07-13 | 1.Disponible | 477700 | 24000 |
| R204 |  |  | 108 | TB | B | Karina Fuentes | Soluciones A Su Alcance | 2024-12-23 | 4.Plan de pagos | 477700 | 95600 |
| R205 |  |  | 412 | TB | B | Andrea Gonzalez | Nercy Jannyn Pérez Alonzo | 2024-07-31 | 4.Plan de pagos | 477700 | 24000 |
| R206 |  | B-403 | 402 | A | C | Efren Sanchez | Hector Samuel Tum Lancerio Y Ingrid Fabiola Gonzalez Godinez | 2024-11-29 | 4.Plan de pagos | 477000 | 23900 |
| R207 |  |  | 213 | TB | B | Abigail Garcia | Edgar Giovanni Palomo Robles | 2024-03-21 | 4.Plan de pagos | 477700 | 24000 |
| R208 | 111-B |  | 111 | B | C | Pablo Marroquin | IRENE MAGALY GARCIA CORONADO | 2025-08-06 | 2.Reservado | 487000 | 24000 |
| R209 | 603-B |  | 602 | A | C | Abigail Garcia | David Obdulio Perez Monzon | 2023-11-27 | 4.Plan de pagos | 497900 | 49800 |
| R210 | 310-C |  |  |  |  |  | Wendy Yohana Pacheco Morales / Nuevo Steven Adolfo Paredes Cabrera/Milca Sarai Barrieos Ixcoy | 2025-10-20 | 2.Reservado | 492700 | 24700 |
| R211 | 301-C |  |  |  |  | Eder Veliz | Roger Jose Castañeda Pineda & Sthephanie Dessire Chacon Mejia | 2025-09-13 | 4.Plan de pagos | 492700 | 24700 |
| R212 | 403-B |  | 403 | B |  | Pablo Marroquin | HANS ANTONI STRAUBE IZZEPI | 2025-08-24 | 4.Plan de pagos | 492000 | 24600 |
| R213 | 310-C |  | 310 | B |  | Pablo Marroquin | Luvia Waleska Revolorio Morales | 2025-11-23 | 2.Reservado | 497000 | 24900 |
| R214 | 605-B | B-410 | 605 | B | B | Paula Hernández | Héctor Emmanuel Olivares López   | 2025-08-17 | 4.Plan de pagos | 492700 | 24700 |
| R215 | 308-TC-MC |  | 308 | C | C | Rony Ramirez | Kevin Adilson Suret Suret | 2025-11-14 | 2.Reservado | 492000 | 24600 |
| R216 |  |  | 612 | B | B | Pablo Marroqin | Linda Esmeralda Molina Najarro / Diego Mauricio Hernández Alveño | 2026-01-16 | 2.Reservado | 492000 | 24600 |
| R227 |  |  | DESISTIMIENTOS UBICADOS Y NO RASTREADOS POR 180 GRADOS |  |  |  |  |  |  |  |  |
| R228 |  |  | APTO | MODELO | TORRE | VENDOR | CLIENTE | FECHA | FECHA DEP. | P. VENTA | REC. NO. |
| R229 |  |  | 101 |  |  | Karina Fuentes | Domingo Ajpop Chij | 2023-11-20 | 2023-11-20 | 494900 | 22 |
| R230 |  |  | 102 |  |  | Abigail García |  Jacqueline Stefany Luna Lopez | 2023-12-10 | 2023-12-10 | 494900 | 32 |
| R231 |  |  | 102 |  |  | Abigail García | Alejandro Eleazar Orozco Sique | 2024-05-05 | 2024-05-05 | 477700 | 118 |
| R232 |  |  | 103 |  |  | Abigail García | Carlos Enrique Sandoval Escobar | 2024-02-01 | 2024-02-01 | 477000 | 53 |
| R233 |  |  | 106 |  |  | Karina Fuentes | Junior Alexes ammanuel Coronado Barrios | 2023-11-19 | 2023-11-20 | 494900 | 23 |
| R234 |  |  | 108 |  |  | Efren Sanchez | Berenice Gomez y Gary Yoc | 2024-08-13 | 2024-08-13 | 477700 | 221 |
| R235 |  |  | 111 |  |  | Abigail García | Edgar Giovanni Palomo Robles | 2024-03-21 | 2024-03-21 | 477000 | 78 |
| R236 |  |  | 209 |  |  | Abigail García | Maria Cecilia Reyna Barrera | 2024-05-18 | 2024-05-18 | 477700 | 133 |
| R237 |  |  | 303 |  |  | Karina Fuentes | Jefte Alexander Gomez Rodas | 2023-12-16 | No ingreso el deposito | 497900 | 36 |
| R238 |  |  | 308 |  |  | Alejandra Calderon | Helen Ixen  | 2023-08-06 | 2023-08-06 | 494800 | 4 |
| R239 |  |  | 403 |  |  | Karina Fuentes | Anibal Poitan | 2024-02-21 | 2024-02-21 | 477000 | 63 |
| R240 |  |  | 403 |  |  | Antonio Rada | Ana Cristina Velasquez | 2024-05-22 | 2024-05-22 | 477000 | 140 |
| R241 |  |  | 404 |  |  | Abigail García | Harvey Daniel Martinez Palencia  | 2023-12-23 | 2023-12-23 | 497900 | 38 |
| R242 |  |  | 501 |  |  | Efren Sanchez | Hansel Adriel Juarez Chian  | 2024-08-30 | 2024-08-30 | 477000 | 236 |
| R243 |  |  | 601 |  |  | Abigail García | Carla Yanira Castillo | 2024-03-17 | 2024-03-17 | 477700 | 75 |
| R244 |  |  | 604 | TB | C | Abigail Garcia | Pedro Alejandro Tezen Cabrera | 2024-02-17 | 4.Plan de pagos | 477700 | 24000 |

---
## 11. BENESTARE PPTO

**Purpose:** Benestare budgeted installment schedule (presupuesto) per unit per tower. Monthly planned enganche amounts 2023–2027.
**Non-empty rows:** 117 | **Max columns:** 66

### Column Headers (Row 1)

- **A**: Apto
- **B**: Torre
- **C–BJ**: Monthly date columns 2023-03-31 through 2027-12-31
- **BK**: TOTAL
- **BL**: a (helper column)
- **BM**: Acumulado
- **BN**: Estatus

### DB Mapping

| Column | DB Target |
|--------|-----------|
| Apto | `rv_units.unit_number` |
| Torre | `towers.name` |
| Monthly dates | budgeted `payments.amount` per month |
| TOTAL | `sales.down_payment` |
| Estatus | `rv_units.status` |

### Data Rows (unit + tower)

| Row | Unit | Tower | Non-zero monthly values |
|-----|------|-------|------------------------|
| R2 | 101 | A | 28 |
| R3 | 102 | A | 24 |
| R4 | 103 | A | 29 |
| R5 | 104 | A | 20 |
| R6 | 105 | A | 28 |
| R7 | 108 | A | 26 |
| R8 | 109 | A | 19 |
| R9 | 201 | A | 29 |
| R10 | 202 | A | 29 |
| R11 | 203 | A | 23 |
| R12 | 204 | A | 23 |
| R13 | 205 | A | 29 |
| R14 | 207 | A | 29 |
| R15 | 210 | A | 22 |
| R16 | 301 | A | 21 |
| R17 | 302 | A | 21 |
| R18 | 303 | A | 20 |
| R19 | 304 | A | 22 |
| R20 | 305 | A | 22 |
| R21 | 306 | A | 6 |
| R22 | 307 | A | 2 |
| R23 | 308 | A | 27 |
| R24 | 309 | A | 22 |
| R25 | 310 | A | 2 |
| R26 | 311 | A | 2 |
| R27 | 312 | A | 2 |
| R28 | 313 | A | 2 |
| R29 | 401 | A | 29 |
| R30 | 402 | A | 19 |
| R31 | 403 | A | 26 |
| R32 | 405 | A | 22 |
| R33 | 406 | A | 2 |
| R34 | 407 | A | 18 |
| R35 | 409 | A | 22 |
| R36 | 410 | A | 28 |
| R37 | 501 | A | 22 |
| R38 | 502 | A | 29 |
| R39 | 503 | A | 21 |
| R40 | 504 | A | 20 |
| R41 | 505 | A | 20 |
| R42 | 507 | A | 21 |
| R43 | 508 | A | 22 |
| R44 | 510 | A | 23 |
| R45 | 601 | A | 26 |
| R46 | 602 | A | 29 |
| R47 | 603 | A | 2 |
| R48 | 604 | A | 25 |
| R49 | 605 | A | 2 |
| R50 | 606 | A | 25 |
| R51 | 607 | A | 25 |
| R52 | 608 | A | 27 |
| R53 | 610 | A | 29 |
| R54 | 104 | B | 20 |
| R55 | 106 | B | 27 |
| R56 | 206 | B | 21 |
| R57 | 213 | B | 21 |
| R58 | 305 | B | 20 |
| R59 | 306 | B | 3 |
| R60 | 308 | B | 23 |
| R61 | 311 | B | 13 |
| R62 | 312 | B | 20 |
| R63 | 313 | B | 20 |
| R64 | 405 | B | 15 |
| R65 | 409 | B | 18 |
| R66 | 411 | B | 20 |
| R67 | 501 | B | 20 |
| R68 | 508 | B | 20 |
| R69 | 601 | B | 20 |
| R70 | 604 | B | 20 |
| R71 | 606 | B | 21 |
| R72 | 613 | B | 0 |
| R75 | 502-C | C | 0 |
| R76 | 509-B | B | 0 |
| R77 | 112-B | B | 0 |
| R78 | 512-B | B | 0 |
| R79 | 513-B | B | 0 |
| R80 | 201-C | C | 0 |
| R81 | 302-C | C | 0 |
| R82 | 401-C | C | 0 |
| R83 | 111-B | B | 0 |
| R84 | 601-C | C | 0 |
| R85 | 301-C | C | 0 |
| R86 | 103-C | C | 0 |
| R87 | 504-C | C | 0 |
| R88 | 101-C | C | 0 |
| R89 | #REF! | #REF! | 0 |
| R90 | 409-C | C | 0 |
| R91 | 501-C | C | 0 |
| R92 | 510-C | C | 0 |
| R93 | 602-C | C | 0 |
| R94 | 603-C | C | 0 |
| R95 | 610-C | C | 0 |
| R96 | 503-C | C | 0 |
| R97 | 509-C | C | 0 |
| R98 | 608-C | C | 0 |
| R99 | 609-C | C | 0 |
| R100 | 506-B | B | 0 |
| R101 | 404-C | C | 0 |
| R102 | 303-C | C | 24 |
| R103 | 408-TC-MC | C | 25 |
| R104 | 108-TC-MC | C | 25 |
| R105 | 403-TC-MC | C | 25 |
| R106 | 304-TC-MB | B | 25 |
| R107 | 202-C | C | 24 |
| R108 | 209-C | C | 23 |
| R109 | 607-C | C | 24 |
| R110 | 407-TC-MB | B | 24 |
| R111 | 404-C | C | 0 |
| R118 | 106 | TB | 27 |
| R119 | 107 | TB | 27 |

---

## 12. BL-TAPIAS

**Purpose:** Bosque Las Tapias (original version) reservation and installment-collection sheet. Tower C. Company: INVERSIONES DE CASTILLA, S.A. Date: 2026-02-09. Includes desistimientos section.
**Non-empty rows:** 160 | **Max columns:** 47

### Column Headers (Row 6)

- **B**: Apto
- **C**: Tipo / Modelo
- **D**: Torre
- **E**: Vendedor
- **F**: Cliente
- **G**: Fecha Reserva
- **H**: Estatus
- **I**: Precio de Venta
- **J**: Enganche
- **K**: 2025-03-31
- **L**: 2025-04-30
- **M**: 2025-05-31
- **N**: 2025-06-30
- **O**: 2025-07-31
- **P**: 2025-08-31
- **Q**: 2025-09-30
- **R**: 2025-10-31
- **S**: 2025-11-30
- **T**: 2025-12-31
- **U**: 2026-01-31
- **V**: 2026-02-28
- **W**: TOTAL COBROS Y RESERVAS
- **X**: % Cobro
- **Y**: SALDO PENDIENTE ENGANCHE
- **Z**: % Pendiente
- **AA**: Monto a Financiar por Banco
- **AB**: % a Financiar
- **AC**: Proyección de Cobros (S/ Modelo Financiero)
- **AD**: Status inmueble
- **AE**: Status Cliente
- **AF**: Cuotas Pactadas
- **AG**: Cuota de Enganche
- **AH**: Total cuotas pactadas
- **AI**: Monto de Reserva Pactado
- **AJ**: Monto de Cuota Pactada
- **AK**: Cuotas Pagadas
- **AL**: Cantidad de cuotas que deben estar pagadas
- **AM**: Monto que debe estar cancelado a la fecha
- **AN**: Monto pagado de cuotas a la fecha
- **AO**: Enganche + Cuotas Extraordinarias Pagadas
- **AP**: Diferencia
- **AQ**: Cobro adicional a lo pactado
- **AR**: Cobro no realizado según lo pactado
- **AS**: Cuotas
- **AT**: Caso Especial / F&F
- **AU**: Observaciones

### DB Mapping

| Column | DB Target |
|--------|-----------|
| Apto | `rv_units.unit_number` |
| Tipo / Modelo | `rv_units.unit_type` |
| Torre | `towers.name` |
| Vendedor | `salespeople.name` |
| Cliente | `rv_clients.full_name` |
| Fecha Reserva | `reservations.created_at` |
| Estatus | `rv_units.status` |
| Precio de Venta | `sales.sale_price` |
| Enganche | `sales.down_payment` |
| Date columns (2025-03 … 2026-02) | `payments.payment_date` + `payments.amount` |
| TOTAL COBROS Y RESERVAS | `SUM(payments.amount)` |
| Cuotas Pactadas | `sales.cuotas_enganche` |
| Monto de Reserva Pactado | `reservations.reserva_amount` |
| Cuotas Pagadas | `COUNT(payments)` phase 2 |
| Caso Especial / F&F | `rv_clients.is_ff` |
| Observaciones | `reservations.notes` |

### Active Reservation Rows (R7–R124)

| Row | Unit | Type | Tower | Salesperson | Client | Date | Status | Price (GTQ) | Enganche (GTQ) |
|-----|------|------|-------|-------------|--------|------|--------|-------------|----------------|
| R7 | 101 | A PLUS | C |  | Favio Javier Estrada Quiñonez y Candida Eva Daniela Ramirez Lopez | 2025-06-15 | 4. Plan de Pagos | 665200 | 46600 |
| R8 | 102 | C PLUS | C |  |  |  | 1.Disponible | 995500 | 69685 |
| R9 | 103 | C PLUS | C |  |  |  | 1.Disponible | 995500 | 69685 |
| R10 | 104 | A PLUS | C | José Gutierrez | CARLOS ALFONSO CASTRO MARTINEZ | 2025-07-18 | 4. Plan de Pagos | 655200 | 45864.00000000001 |
| R11 | 105 | A PLUS | C |  |  |  | 1.Disponible | 655200 | 46000 |
| R12 | 106 | B PLUS | C |  | NATANAEL DE JESUS GAITAN GOMEZ | 2025-07-28 | 4. Plan de Pagos | 847700 | 59339.00000000001 |
| R13 | 107 | C PLUS | C | José Gutierrez | SARAI DEL ROSARIO MURALLES NAVAS DE GARCIA / LUIS ENRIQUE GARCIA TEBELAN | 2025-07-28 | 4. Plan de Pagos | 995700 | 69699 |
| R14 | 108 | C PLUS | C |  |  |  | 1.Disponible | 995700 | 69699 |
| R15 | 109 | B PLUS | C |  |  |  | 1.Disponible | 847700 | 59339.00000000001 |
| R16 | 201 | A  | C |  |  |  | 1.Disponible | 622000 | 43540.00000000001 |
| R17 | 202 | C  | C | Paula Hernandez | MARIO RENATO GUALIN REYES | 2025-12-30 | 1.Disponible | 817300 | 57211.00000000001 |
| R18 | 203 | C  | C |  |  |  | 1.Disponible | 817300 | 57211.00000000001 |
| R19 | 204 | A  | C |  |  |  | 1.Disponible | 622000 | 43540.00000000001 |
| R20 | 205 | A  | C |  |  |  | 1.Disponible | 622000 | 43540.00000000001 |
| R21 | 206 | B  | C |  |  |  | 1.Disponible | 794400 | 55608.00000000001 |
| R22 | 207 | C  | C |  |  |  | 1.Disponible | 817300 | 57211.00000000001 |
| R23 | 208 | C  | C |  |  |  | 1.Disponible | 817300 | 57211.00000000001 |
| R24 | 209 | B  | C |  |  |  | 1.Disponible | 794400 | 55608.00000000001 |
| R25 | 301 | A  | C |  |  |  | 1.Disponible | 622000 | 43540.00000000001 |
| R26 | 302 | C  | C | José Gutierrez | Claudia Maria Gatica Ramirez | 2026-01-08 | 2.Reservado | 817300 | 57211.00000000001 |
| R27 | 303 | C  | C | Paula Hernandez | Luis Armando Chávez Camo | 2025-11-09 | 2.Reservado | 744000 | 52100 |
| R28 | 304 | A  | C |  |  |  | 1.Disponible | 622000 | 43540.00000000001 |
| R29 | 305 | A  | C |  |  |  | 1.Disponible | 622000 | 43540.00000000001 |
| R30 | 306 | B  | C |  |  |  | 1.Disponible | 794400 | 55608.00000000001 |
| R31 | 307 | C  | C |  |  |  | 1.Disponible | 926600 | 64862.00000000001 |
| R32 | 308 | C  | C |  |  |  | 1.Disponible | 926600 | 64862.00000000001 |
| R33 | 309 | B  | C |  |  |  | 1.Disponible | 794400 | 55608.00000000001 |
| R34 | 401 | A  | C |  | CARLOS EDUARDO CELADA | 2025-08-01 | 4. Plan de Pagos | 622000 | 43540.00000000001 |
| R35 | 402 | C  | C | Pedro Pablo Sarti | Lina Judith Conde Gomez de León  | 2025-05-26 | 4. Plan de Pagos | 898802 | 60002 |
| R36 | 403 | C  | C |  |  |  | 1.Disponible | 926600 | 64862.00000000001 |
| R37 | 404 | A  | C |  |  |  | 1.Disponible | 622000 | 43540.00000000001 |
| R38 | 405 | C | C |  |  |  | 1.Disponible | 622000 | 43540.00000000001 |
| R39 | 406 | B  | C |  |  |  | 1.Disponible | 794400 | 55608.00000000001 |
| R40 | 407 | C  | C |  |  |  | 1.Disponible | 926600 | 64862.00000000001 |
| R41 | 408 | C  | C |  |  |  | 1.Disponible | 926600 | 64862.00000000001 |
| R42 | 409 | B  | C |  |  |  | 1.Disponible | 794400 | 55608.00000000001 |
| R43 | 501 | A  | C | Efrén Sanchez | Kenneth David Cetino y Angie Nohelia Recinos Villacorta | 2025-05-17 | 4. Plan de Pagos | 603340 | 60340 |
| R44 | 502 | C  | C |  | Byron Omar Yapur Ponce | 2025-10-16 | 2.Reservado | 744000 | 52100 |
| R45 | 503 | C  | C |  | ALBERT FRANCESCOLI DE JESUS ORTIZ PINEDA/ANA GABRIELA MORALES CHAJON | 2025-10-12 | 2.Reservado | 744000 | 52100 |
| R46 | 504 | A  | C | Paula Hernandez | Zoila Josabeth Lantan López  y Jose Andres Pich Cuxulic | 2025-07-18 | 4. Plan de Pagos | 622000 | 43540.00000000001 |
| R47 | 505 | A  | C |  |  |  | 1.Disponible | 622000 | 44000 |
| R48 | 506 | B  | C | Antonio Rada | Shirley Hilene Recinos | 2025-05-17 | 4. Plan de Pagos | 770568 | 50968 |
| R49 | 507 | C  | C |  |  |  | 1.Disponible | 926600 | 64862.00000000001 |
| R50 | 508 | C  | C |  |  |  | 1.Disponible | 926600 | 64862.00000000001 |
| R51 | 509 | B  | C |  |  |  | 1.Disponible | 794400 | 55608.00000000001 |
| R52 | 601 | A  | C | Paula Hernandez | Claudia Anaí Franco Díaz | 2025-09-08 | 4. Plan de Pagos | 636400 | 44600 |
| R53 | 602 | C  | C |  | JULIO ERNESTO GARCIA ARCHILA / BLANCA ESTELA GONZALEZ CEDILLO | 2025-10-12 | 2.Reservado | 744000 | 52100 |
| R54 | 603 | C  | C |  |  |  | 2.Reservado | 744000 | 52100 |
| R55 | 604 | A  | C |  | LILIAN JEANETTE PAZ GARCÍA | 2025-07-26 | 4. Plan de Pagos | 636400 | 44548.00000000001 |
| R56 | 605 | A  | C |  | JOSUE ROBERTO FAJARDO CHIGUIL Y EMILLY JAZMIN VASQUEZ MORALES | 2025-08-03 | 4. Plan de Pagos | 636400 | 44548.00000000001 |
| R57 | 606 | B  | C |  |  |  | 1.Disponible | 813000 | 56910.00000000001 |
| R58 | 607 | C  | C |  |  |  | 1.Disponible | 945900 | 66213 |
| R59 | 608 | C  | C | Paula Hernandez | Jefersón Michael Sandoval Orozco y Helen Susana Cano Ruballo | 2025-12-22 | 1.Disponible | 945900 | 66213 |
| R60 | 609 | B  | C |  |  |  | 1.Disponible | 813000 | 56910.00000000001 |
| R61 | 701 | A  | C | Pedro Pablo Sarti | Manolo de Jesús Milian Martínez | 2025-04-25 | 4. Plan de Pagos | 636400 | 63700 |
| R63 | 703 | C  | C |  | Pedro Alberto Garcia Guzman | 2025-10-18 | 2.Reservado | 744000 | 52100 |
| R64 | 704 | A  | C | José Gutierrez | MARVIN ESTUARDO PINEDA RODRIGUEZ | 2025-07-05 | 4. Plan de Pagos | 636400 | 44548 |
| R65 | 705 | A  | C | José Gutierrez | BRIAN ALEXIS VELASQUEZ RODRIGUEZ | 2025-07-18 | 4. Plan de Pagos | 636400 | 44548.00000000001 |
| R66 | 706 | B  | C | Paula Hernandez | Christopher Geovanny Umaña Luna | 2026-01-05 | 2.Reservado | 813000 | 56910.00000000001 |
| R67 | 707 | C  | C | José Gutierrez | Juan Antonio Tortola  Oliva | 2026-01-27 | 2.Reservado | 945900 | 66213 |
| R68 | 708 | C  | C |  | LESBIA FERNANDA FLORES GARCIA-BRYAN ALEXANDER SURET VALENZUELA | 2025-10-27 | 2.Reservado | 744000 | 52100 |
| R69 | 709 | B  | C | José Gutierrez | Yury Julio Roberto de Jesus Urrutia Valdez / María de los Angeles de León Manrique | 2026-01-10 | 2.Reservado | 813000 | 57000 |
| R70 | 801 | A  | C |  |  |  | 1.Disponible | 636400 | 44548.00000000001 |
| R71 | 802 | C  | C |  |  |  | 1.Disponible | 744000 | 52100 |
| R72 | 803 | C  | C |  | LEVI BENJAMIN GUTIERREZ SATEY | 2025-09-27 | 4. Plan de Pagos | 744000 | 53000 |
| R73 | 804 | A  | C | Paula Hernandez | Diego Herrera y Angela Gabriela Lara | 2025-06-27 | 4. Plan de Pagos | 636400 | 44600 |
| R74 | 805 | A  | C | José Gutierrez | Edwin Gonzálo Aguilón Velásquez | 2025-07-18 | 4. Plan de Pagos | 636400 | 44548.00000000001 |
| R75 | 806 | B  | C |  |  |  | 1.Disponible | 744000 | 52100 |
| R76 | 807 | C  | C |  | Luciana Concepcion Cruz Alvarado | 2025-10-12 | 2.Reservado | 744000 | 52100 |
| R77 | 808 | C  | C | Paula Hernandez | Julisa Elizabeth Gonzalez Bac, Derek Alexander Jiménez Najarro y Fredy Leonel Gonzalez | 2025-09-07 | 4. Plan de Pagos | 744000 | 52100 |
| R78 | 809 | B  | C |  | MASIELLE DASAYETH MONROY HERNÁNDEZ y LENIN ALEJANDRO HIDALGO COLINDRES | 2025-06-15 | 4. Plan de Pagos | 813000 | 56910.00000000001 |
| R79 | 901 | A  | C |  |  |  | 1.Disponible | 636400 | 44548.00000000001 |
| R80 | 902 | C  | C |  | LUIS ANTONIO GÓMEZ LUCERO Y FEBE ABIGAIL ARANA FRANCO | 2025-08-11 | 4. Plan de Pagos | 945900 | 66213 |
| R81 | 903 | C  | C |  | ANDREINA MARIBEL CORNEL MORAGA | 2025-08-03 | 4. Plan de Pagos | 945900 | 66213 |
| R82 | 904 | A  | C |  |  |  | 1.Disponible | 617038 | 43308 |
| R83 | 905 | A  | C | José Gutierrez | Oscar Josue Acabal Cun | 2026-02-16 | 2.Reservado | 0 | 0 |
| R84 | 906 | B  | C |  | William Alexander Fuentes Alvarado | 2025-07-27 | 4. Plan de Pagos | 813000 | 56910.00000000001 |
| R85 | 907 | C  | C | José Gutierrez | Marlon Omar Valdes Pérez-Chelsea María José García Gómez | 2025-09-21 | 4. Plan de Pagos | 744000 | 53000 |
| R86 | 908 | C  | C |  | JENNIFER IVETTE GONZALEZ MEDRANO Y AGUSTIN ARMANDO CALVILLO CALDERON | 2025-08-19 | 4. Plan de Pagos | 945900 | 66213 |
| R87 | 909 | B  | C | Paula Hernandez | Ingrid Lissette Colíndres López | 2025-05-17 | 4. Plan de Pagos | 813000 | 57000 |
| R88 | 1001 | A  | C |  | Dilan Guillermo Hernandez López | 2025-08-18 | 4. Plan de Pagos | 744000 | 52100 |
| R89 | 1002 | C  | C |  | ANDREA ELIZABETH RODAS CABRERA / ROBERTO ISAAC MORALES REYES | 2025-10-16 | 2.Reservado | 744000 | 52100 |
| R90 | 1003 | C  | C | José Gutierrez | Heidy Joseline Hernández Mayorga / Edwin Esteban Ortega Montufar | 2026-02-01 | 2.Reservado | 744000 | 52100 |
| R91 | 1004 | A  | C |  | Ludis Gonzalez Lopez | 2025-10-15 | 2.Reservado | 655200 | 45900 |
| R92 | 1005 | A  | C |  |  |  | 1.Disponible | 678800 | 47516.00000000001 |
| R93 | 1006 | B  | C |  |  |  | 1.Disponible | 825400 | 57778.00000000001 |
| R94 | 1007 | C  | C | José Gutierrez | Juliana Daniela Ortiz | 2025-11-24 | 2.Reservado | 744000 | 52100 |
| R95 | 1008 | C  | C |  |  |  | 1.Disponible | 958800 | 67116 |
| R96 | 1009 | B  | C | Paula Hernandez | DULCE MARÍA RUIZ ALVARADO | 2025-12-20 | 1.Disponible | 825400 | 57778.00000000001 |
| R97 | 1101 | A  | C |  |  |  | 1.Disponible | 678800 | 47516.00000000001 |
| R98 | 1102 | C  | C | Paula Hernandez | Zeus Anahel López Ojeda | 2025-11-15 | 2.Reservado | 744000 | 52100 |
| R99 | 1103 | C  | C |  |  |  | 1.Disponible | 958800 | 67116 |
| R100 | 1104 | A  | C |  |  |  | 1.Disponible | 678800 | 47516.00000000001 |
| R101 | 1105 | A  | C |  |  |  | 1.Disponible | 678800 | 47516.00000000001 |
| R102 | 1106 | B  | C |  |  |  | 1.Disponible | 825400 | 57778.00000000001 |
| R103 | 1107 | C  | C |  |  |  | 1.Disponible | 958800 | 67116 |
| R104 | 1108 | C  | C | Paula Hernandez | Daniel Rafael Bonilla Pérez y Yohany Danissa Leonardo Bocanegra | 2025-11-24 | 2.Reservado | 744000 | 52100 |
| R105 | 1109 | B  | C |  |  |  | 1.Disponible | 825400 | 57778.00000000001 |
| R106 | 1201 | A  | C | Paula Hernandez | Lesly Cristina Molina González | 2026-01-12 | 1.Disponible | 678800 | 47516.00000000001 |
| R107 | 1202 | C  | C | José Gutierrez | Doneli Abraham Molineros Mijangos | 2025-11-15 | 2.Reservado | 744000 | 52100 |
| R108 | 1203 | C  | C | José Gutierrez | Dulce Maria Molineros Mijangos | 2025-11-15 | 2.Reservado | 744000 | 52100 |
| R109 | 1204 | A  | C |  |  |  | 1.Disponible | 678800 | 47516.00000000001 |
| R110 | 1205 | A  | C |  |  |  | 1.Disponible | 678800 | 47516.00000000001 |
| R111 | 1206 | B  | C |  |  |  | 1.Disponible | 825400 | 57778.00000000001 |
| R112 | 1207 | C  | C |  |  |  | 1.Disponible | 958800 | 67116 |
| R113 | 1208 | C  | C | José Gutierrez | LUIS FERNANDO PIANO MENDEZ | 2025-12-15 | 2.Reservado | 958800 | 67116 |
| R114 | 1209 | B  | C | Paula Hernandez | JUAN PABLO ÁLVAREZ PÉREZ | 2025-12-20 | 1.Disponible | 825400 | 57778.00000000001 |
| R115 | 1301 | A  | C |  |  |  | 1.Disponible | 678800 | 47516.00000000001 |
| R116 | 1302 | C  | C | Gloria Cante | Iwin Estuardo Acevedo Salgue | 2025-11-30 | 1.Disponible | 744000 | 52100 |
| R117 | 1303 | C  | C |  |  |  | 1.Disponible | 958800 | 67116 |
| R118 | 1304 | A  | C |  |  |  | 1.Disponible | 678800 | 47516.00000000001 |
| R119 | 1305 | A  | C |  |  |  | 1.Disponible | 678800 | 47516.00000000001 |
| R120 | 1306 | B  | C |  |  |  | 1.Disponible | 825400 | 57778.00000000001 |
| R121 | 1307 | C  | C |  |  |  | 1.Disponible | 958800 | 67116 |
| R122 | 1308 | C  | C |  |  |  | 1.Disponible | 958800 | 67116 |
| R123 | 1309 | B  | C |  |  |  | 1.Disponible | 825400 | 57778.00000000001 |

### Desistimientos Section (R134–R151)

| Row | Unit | Type | Tower | Salesperson | Client | Date | Status | Price (GTQ) | Enganche (GTQ) |
|-----|------|------|-------|-------------|--------|------|--------|-------------|----------------|
| R134 | APTO | MODELO | TORRE | VENDEDOR | CLIENTE | FECHA | TIPO DE PLAN | P. VENTA | ENGANCHE |
| R135 | 704 | A  | C | Paula Hernández | Erick Gómez | 2025-05-17 | 2.Reservado | 636400 | 44600 |
| R136 | 904 | A  | C | Efrén Sanchez |  Guideon Juda Fernandez Cruz | 2025-05-25 | 2.Reservado | 617038 | 43308 |
| R137 | 405 | A  | C |  | Melany Analexy Higueros Gamarro | 2025-12-02 | 2.Reservado | 622000 | 43540.00000000001 |
| R138 | 709 | B  | C | Paula Hernandez |  |  | 1.Disponible | 813000 | 57000 |
| R139 | 802 | C  | C |  | Carlos Humberto Hernandez Barillas | 2025-08-28 | 4. Plan de Pagos | 744000 | 52100 |
| R140 |  |  |  | José Gutierrez | Ana Lucia Higueros Amaya/Erick Geovany Recinos Mejía | 2025-11-29 | 2.Reservado | 744000 | 52100 |
| R141 | 505 | A  | C |  | Lester Canahui / Brena Aguilar | 2025-06-15 | 4. Plan de Pagos | 622000 | 44000 |
| R142 | 1103 | C  | C |  | Oscar Roberto Alejandro Valle Mayorga / Joselyne Jazmin Sicaja Chicas | 09/15/20205 | 1.Disponible | 958800 | 67116 |
| R143 | 105 | A PLUS | C |  | BRANDON OSWALDO PONCE PÉREZ Y KATERINE ANDREA LUCIA MARTÍNEZ MEJÍA | 2025-06-27 | 4. Plan de Pagos | 655200 | 46000 |
| R144 | 603 | C  | C | José Gutierrez | Jeennifer Paola Martinez Cruz de Fajardo | 2025-11-16 | 2.Reservado | 744000 | 52100 |
| R145 | 905 | A  | C | José Gutierrez | Julio Cesar Calderon Mus | 2025-06-27 | 4. Plan de Pagos | 636400 | 44548.00000000001 |
| R146 | 405 | C | C | José Gutierrez | MARIA CRISTINA ESTRADA DONIS/DANIELA MARIBEL CORONADO ESTRADA | 2025-12-27 | 2.Reservado | 622000 | 43540.00000000001 |
| R147 | 702 | C  | C | José Gutierrez | DEREK JAFETTE PINEDA SAMAYOA/ KATHERINE GUISELE SAZO ROCHE | 2025-09-02 | 4. Plan de Pagos | 744000 | 52100 |
| R148 | 1204 | A  | C | José Gutierrez | LUISA MAYARI RAMIREZ BRAN | 2025-07-15 | 4. Plan de Pagos | 678800 | 47516.00000000001 |
| R149 | 904 | A  | C | Paula Hernandez | Alvaro Victor Hernández Mus | 2025-06-27 | 4. Plan de Pagos | 617038 | 43308 |
| R150 | 1003 | C  | C | José Gutierrez | Alison Samara Vasquez Ortiz | 2025-10-16 | 2.Reservado | 744000 | 52100 |
| R151 | 806 | B  | C | Paula Hernandez | Irma sofia Caneo Tocay |  | 2.Reservado | 744000 | 52100 |

---
## 13. BL PPTO

**Purpose:** Bosque Las Tapias budgeted installment schedule (presupuesto). Monthly planned amounts 2023–2029 per unit. Includes summary columns (PRECIO VTA, TOTAL ENG., P.I., P. PLAZO, CUOTA MES, DIF.).
**Non-empty rows:** 124 | **Max columns:** 91

### Column Headers (Row 1)

- **A**: Apto
- **B**: Estatus
- **C–CP**: Monthly dates 2023-03-01 through 2029-12-01
- **CQ**: TOTAL
- **CR**: PRECIO VTA (sale price)
- **CS**: TOTAL ENG. (total enganche)
- **CT**: P.I. (initial payment / reserva)
- **CU**: P. PLAZO (installment amount)
- **CV**: CUOTA MES (monthly quota)
- **CW**: DIF. (difference)

### DB Mapping

| Column | DB Target |
|--------|-----------|
| Apto | `rv_units.unit_number` |
| Estatus | `rv_units.status` |
| Monthly dates | budgeted `payments.amount` per month |
| PRECIO VTA | `sales.sale_price` |
| TOTAL ENG. | `sales.down_payment` |
| P.I. | `reservations.reserva_amount` |
| P. PLAZO | computed installment plan total |
| CUOTA MES | computed: enganche / cuotas_enganche |
| DIF. | computed: budgeted - actual |

### Data Rows (unit + status)

| Row | Unit | Status | Non-zero monthly values |
|-----|------|--------|------------------------|
| R2 | 101 | 4. Plan de Pagos | 35 |
| R3 | 102 | 1.Disponible | 31 |
| R4 | 103 | 1.Disponible | 31 |
| R5 | 104 | 4. Plan de Pagos | 34 |
| R6 | 105 | 1.Disponible | 35 |
| R7 | 106 | 4. Plan de Pagos | 31 |
| R8 | 107 | 4. Plan de Pagos | 31 |
| R9 | 108 | 1.Disponible | 31 |
| R10 | 109 | 1.Disponible | 31 |
| R11 | 201 | 1.Disponible | 31 |
| R12 | 202 | 1.Disponible | 31 |
| R13 | 203 | 1.Disponible | 31 |
| R14 | 204 | 1.Disponible | 31 |
| R15 | 205 | 1.Disponible | 31 |
| R16 | 206 | 1.Disponible | 31 |
| R17 | 207 | 1.Disponible | 31 |
| R18 | 208 | 1.Disponible | 31 |
| R19 | 209 | 1.Disponible | 31 |
| R20 | 301 | 1.Disponible | 31 |
| R21 | 302 | 2.Reservado | 31 |
| R22 | 303 | 2.Reservado | 32 |
| R23 | 304 | 1.Disponible | 31 |
| R24 | 305 | 1.Disponible | 31 |
| R25 | 306 | 1.Disponible | 32 |
| R26 | 307 | 1.Disponible | 31 |
| R27 | 308 | 1.Disponible | 31 |
| R28 | 309 | 1.Disponible | 32 |
| R29 | 401 | 4. Plan de Pagos | 31 |
| R30 | 402 | 4. Plan de Pagos | 36 |
| R31 | 403 | 1.Disponible | 31 |
| R32 | 404 | 1.Disponible | 31 |
| R33 | 405 | 1.Disponible | 6 |
| R34 | 406 | 1.Disponible | 31 |
| R35 | 407 | 1.Disponible | 31 |
| R36 | 408 | 1.Disponible | 31 |
| R37 | 409 | 1.Disponible | 31 |
| R38 | 501 | 4. Plan de Pagos | 36 |
| R39 | 502 | 2.Reservado | 32 |
| R40 | 503 | 2.Reservado | 32 |
| R41 | 504 | 4. Plan de Pagos | 34 |
| R42 | 505 | 1.Disponible | 6 |
| R43 | 506 | 4. Plan de Pagos | 36 |
| R44 | 507 | 1.Disponible | 31 |
| R45 | 508 | 1.Disponible | 31 |
| R46 | 509 | 1.Disponible | 31 |
| R47 | 601 | 4. Plan de Pagos | 32 |
| R48 | 602 | 2.Reservado | 32 |
| R49 | 603 | 2.Reservado | 6 |
| R50 | 604 | 4. Plan de Pagos | 31 |
| R51 | 605 | 4. Plan de Pagos | 31 |
| R52 | 606 | 1.Disponible | 31 |
| R53 | 607 | 1.Disponible | 31 |
| R54 | 608 | 1.Disponible | 31 |
| R55 | 609 | 1.Disponible | 31 |
| R56 | 701 | 4. Plan de Pagos | 35 |
| R57 | 702 | 4. Plan de Pagos | 32 |
| R58 | 703 | 2.Reservado | 32 |
| R59 | 704 | 4. Plan de Pagos | 34 |
| R60 | 705 | 4. Plan de Pagos | 34 |
| R61 | 706 | 2.Reservado | 31 |
| R62 | 707 | 2.Reservado | 31 |
| R63 | 708 | 2.Reservado | 32 |
| R64 | 709 | 2.Reservado | 36 |
| R65 | 801 | 1.Disponible | 31 |
| R66 | 802 | 1.Disponible | 6 |
| R67 | 803 | 4. Plan de Pagos | 32 |
| R68 | 804 | 4. Plan de Pagos | 32 |
| R69 | 805 | 4. Plan de Pagos | 38 |
| R70 | 806 | 1.Disponible | 32 |
| R71 | 807 | 2.Reservado | 32 |
| R72 | 808 | 4. Plan de Pagos | 32 |
| R73 | 809 | 4. Plan de Pagos | 31 |
| R74 | 901 | 1.Disponible | 31 |
| R75 | 902 | 4. Plan de Pagos | 31 |
| R76 | 903 | 4. Plan de Pagos | 31 |
| R77 | 904 | 1.Disponible | 6 |
| R78 | 905 | 2.Reservado | 4 |
| R79 | 906 | 4. Plan de Pagos | 31 |
| R80 | 907 | 4. Plan de Pagos | 32 |
| R81 | 908 | 4. Plan de Pagos | 31 |
| R82 | 909 | 4. Plan de Pagos | 36 |
| R83 | 1001 | 4. Plan de Pagos | 33 |
| R84 | 1002 | 2.Reservado | 32 |
| R85 | 1003 | 2.Reservado | 6 |
| R86 | 1004 | 2.Reservado | 33 |
| R87 | 1005 | 1.Disponible | 32 |
| R88 | 1006 | 1.Disponible | 31 |
| R89 | 1007 | 2.Reservado | 32 |
| R90 | 1008 | 1.Disponible | 31 |
| R91 | 1009 | 1.Disponible | 31 |
| R92 | 1101 | 1.Disponible | 32 |
| R93 | 1102 | 2.Reservado | 8 |
| R94 | 1103 | 1.Disponible | 6 |
| R95 | 1104 | 1.Disponible | 32 |
| R96 | 1105 | 1.Disponible | 32 |
| R97 | 1106 | 1.Disponible | 31 |
| R98 | 1107 | 1.Disponible | 31 |
| R99 | 1108 | 2.Reservado | 32 |
| R100 | 1109 | 1.Disponible | 31 |
| R101 | 1201 | 1.Disponible | 32 |
| R102 | 1202 | 2.Reservado | 32 |
| R103 | 1203 | 2.Reservado | 32 |
| R104 | 1204 | 1.Disponible | 34 |
| R105 | 1205 | 1.Disponible | 32 |
| R106 | 1206 | 1.Disponible | 31 |
| R107 | 1207 | 1.Disponible | 31 |
| R108 | 1208 | 2.Reservado | 31 |
| R109 | 1209 | 1.Disponible | 31 |
| R110 | 1301 | 1.Disponible | 32 |
| R111 | 1302 | 1.Disponible | 32 |
| R112 | 1303 | 1.Disponible | 31 |
| R113 | 1304 | 1.Disponible | 32 |
| R114 | 1305 | 1.Disponible | 32 |
| R115 | 1306 | 1.Disponible | 31 |
| R116 | 1307 | 1.Disponible | 31 |
| R117 | 1308 | 1.Disponible | 31 |
| R118 | 1309 | 1.Disponible | 31 |

---

## 14. Atrasados B5

**Purpose:** Boulevard 5 delinquent clients pivot. Lists each late-paying client with expected vs actual monthly and cumulative collection amounts. Project: GRAN JAGUAR.
**Non-empty rows:** 84 | **Max columns:** 22

### Column Headers (Row 6)

- **C**: ESTATUS CLIENTE
- **D**: Apto.
- **E**: Cliente
- **F**: Cobro esperado mensual
- **G**: Cobro efectuado mensual
- **H**: Cobro esperado acumulado
- **I**: Cobro efectuado acumulado
- **J**: Total adeudado
- **K**: Cuenta de TOTAL
- **M**: Diferencia del mes
- **N**: Diferencia acumulado
- **O**: Diferencia Total adeudado

### DB Mapping

| Column | DB Target |
|--------|-----------|
| Apto. | `rv_units.unit_number` |
| Cliente | `rv_clients.full_name` |
| Cobro esperado mensual | budgeted from `enganche_schedule` |
| Cobro efectuado mensual | `SUM(payments.amount)` current month |
| Cobro esperado acumulado | `SUM(budgeted_installments)` to date |
| Cobro efectuado acumulado | `SUM(payments.amount)` to date |
| Total adeudado | `sales.down_payment` remaining |
| Diferencia del mes | expected_month - actual_month |
| Diferencia acumulado | expected_accum - actual_accum |
| Diferencia Total adeudado | remaining - accum_paid |

### All Data Rows (Atrasados only)

| Row | Unit | Client | Exp Monthly | Act Monthly | Exp Accum | Act Accum | Total Owed | Diff Monthly | Diff Accum |
|-----|------|--------|-------------|-------------|-----------|-----------|------------|-------------|------------|
| R7 | 101 | Karla Michelle Abril Valencia De Galicia / Diana Michelle Galicia Abril | 0 | 1720 | 64500 | 64530 | 64500 | -1720 | -30 |
| R8 | 102 | Irma Leticia Villatoro Bucaro | 36803 | 36803 | 120409 | 83606 | 230820 | 0 | 36803 |
| R9 | 111 | Jonathan José Morales Salazar / Ingrid Liseth Barillas López | 0 |  | 69700 | 69700 | 69700 | 0 | 0 |
| R10 | 112 | Herbert Osiel Ramos Alfaro / Paula María Vásquez Cifuentes | 0 |  | 69900 | 69900 | 69900 | 0 | 0 |
| R11 | 113 | Rodrigo Rodas Pazos | 0 |  | 480006.24 | 480000 | 480006.04 | 0 | 6.239999999990687 |
| R12 | 302 | José Ignacio Ramírez Soto | 9200 |  | 74400 | 56000 | 101929.9 | 9200 | 18400 |
| R13 | 305 | Josue Alejandro Arias Perez | 3500 | 7000 | 81500 | 68000 | 111265.61 | -3500 | 13500 |
| R14 | 312 | Freddy Alejandro Chinchilla Culajay | 7851 | 7851 | 117914 | 117914 | 141462.32 | 0 | 0 |
| R15 | 315 | Lilian America Roldan Ochoa / Jocelyn Michelle Roldan | 11110 |  | 132210 | 109024 | 154426.97 | 11110 | 23186 |
| R16 | 405 | Mario Saul Aragón Zepeda | 11400 | 11400 | 44200 | 32800 | 78400 | 0 | 11400 |
| R17 | 406 | Andrea Joanna Hidalgo Mendizábal  | 8371 | 8367 | 93710 | 93670 | 110447.58 | 4 | 40 |
| R18 | 418 | Antonio Vicente Tzep Tahay  | 5423 |  | 64230 | 31692 | 75072.5 | 5423 | 32538 |
| R19 | 419 | Andrea Elizabeth Ortíz Pérez | 0 | 6 | 96600 | 96600 | 96600 | -6 | 0 |
| R20 | 502 | Mauricio Adolfo Rodriguez | 0 | 10000 | 0 | 10000 | 0 | -10000 | -10000 |
| R21 | 503 | David Eduardo Orellana Rivera | 7894 |  | 88940 | 81046 | 104732 | 7894 | 7894 |
| R22 | 506 | Carlos Eduardo Miranda Morales / Nancy Patricia Medina Marín | 0 |  | 138595 | 137960 | 138595 | 0 | 635 |
| R23 | 510 | Francis Ayleen Funes Castellanos | 0 |  | 118393 | 114393.00000000001 | 118393 | 0 | 3999.9999999999854 |
| R24 | 612 | Yonatan Morgan Acajabón | 6300 | 6300 | 47800 | 41500 | 66300 | 0 | 6300 |
| R25 | 617 | Hans Christian Beeck Cazali | 0 |  | 88800 | 64800 | 88800 | 0 | 24000 |
| R26 | 618 | Sergio Adolfo García Velásquez | 6000 | 6000 | 114368 | 124368 | 150349.44 | 0 | -10000 |
| R27 | 619 | José Estuardo Ordoñez Cancinos | 10214 | 10214 | 132568 | 122354 | 152994.33 | 0 | 10214 |
| R28 | 706 | Edison Gabriel Ramirez López | 9307 | 18608 | 121684 | 121678 | 140292.7 | -9301 | 6 |
| R29 | 707 | Cristhian Paul Escobar Maldonado  | 5303 | 7000 | 68333 | 67000 | 78945 | -1697 | 1333 |
| R30 | 708 | Alfonso Videche Rodriguez | 0 | 19000 | 118393 | 103600 | 118393 | -19000 | 14793 |
| R31 | 711 | Samuel David Chávez Pérez | 3782 |  | 105384 | 75000 | 120512.47 | 3782 | 30384 |
| R32 | 715 | Cynthia Marisel Coronado Monterroso | 0 | 3200 | 62000 | 62000 | 62000 | -3200 | 0 |
| R33 | 718 | Julio Fernando Flores Interiano | 0 |  | 0 | 10000 | 116800 | 0 | -10000 |
| R34 | 804 | Victor Hugo Cáceres Morales | 0 |  | 70300 | 59000 | 70300 | 0 | 11300 |
| R35 | 805 | Celia Julissa Flores Dávila de González | 0 |  | 94200 | 91650.05 | 94200 | 0 | 2549.949999999997 |
| R36 | 813 | Industrias Danico, S.A. /  Pedro José Cordón Folgar} | 0 |  | 89632.85 | 77394 | 89632.85 | 0 | 12238.850000000006 |
| R37 | 817 |  Juan Antonio Escobedo del Cid | 0 | 1500 | 65732.3 | 57000 | 65732.3 | -1500 | 8732.300000000003 |
| R38 | 919 | Ana Lucrecia Rangel Aquino | 0 |  | 92200 | 77485 | 92200 | 0 | 14715 |
| R39 | 1001 |  Zonia Beariz Hernández Herrera | 0 |  | 109800 | 99054 | 109800 | 0 | 10746 |
| R40 | 1002 | Evelin Yadira Orellana Ordoñez | 0 | 6000 | 216000 | 216000 | 216000 | -6000 | 0 |
| R41 | 1011 | Sebastian Gutiérrez Ruiz | 0 |  | 113225 | 88485 | 113225 | 0 | 24740 |
| R42 | 1016 | Sergio Enrique Bolaños López | 0 |  | 65200 | 51591 | 65200 | 0 | 13609 |
| R43 | 1017 | Irene Alejandra Reyes Guzmán | 0 | 1650 | 66400 | 48600 | 66400 | -1650 | 17800 |
| R44 | 1019 | Gloria Fernanda Moran Guevara | 8750 | 12000 | 71250 | 59400 | 97500 | -3250 | 11850 |
| R45 | 1102 | Luis Alberto López Velásquez | 0 |  | 115300 | 115310 | 115300 | 0 | -10 |
| R46 | 1108 | Denis Orlando Coto Zelaya | 0 |  | 110138.98 | 110138.98000000001 | 110138.98 | 0 | 0 |
| R47 | 1111 | Erika Ruth Castro Juarez | 0 |  | 119402.5 | 119321 | 119402.5 | 0 | 81.5 |
| R48 | 1112 | Grupo Sak y Sak, S.A. | 0 |  | 690627.1699999999 | 667836.72 | 690627.17 | 0 | 22790.449999999953 |
| R49 | 1116 | Francisco Javier Arriaza Reyes | 0 |  | 88800 | 66018 | 88800 | 0 | 22782 |
| R50 | 1201 | Rogelio Alejandro Ochoa Hernández | 0 | 6500 | 125400 | 107500 | 125400 | -6500 | 17900 |
| R51 | 1205 | Andrea Nicole Mansilla Fuentes | 0 |  | 66400 | 58366 | 66400 | 0 | 8034 |
| R52 | 1209 | Gilda Elena Siekavizza Castillo / Jose Pablo Pineda Bran | 0 |  | 110900 | 110900 | 110900 | 0 | 0 |
| R53 | 1212 | Sergio Enrique Bolaños López | 0 |  | 66700 | 47424 | 66700 | 0 | 19276 |
| R54 | 1216 | Alan Richard Gonzalez Choc | 31100 | 31100 | 768378.0800000001 | 766725.0800000001 | 1039156.15 | 0 | 1653 |
| R55 | 1218 | Héctor Ricardo Echeverría Méndez | 6950 | 6950 | 121200 | 114250 | 135092.55 | 0 | 6950 |
| R56 | 1302 | Rodolfo Godoy Lémus | 6951 | 6951 | 121216 | 121215 | 135125.53 | 0 | 1 |
| R57 | 1310 |  Raúl Cabrera Galindo | 0 |  | 111100 | 111000 | 111100 | 0 | 100 |
| R58 | 1314 | Sidney Alexander Osorio Montufar | 0 |  | 71600 | 71600 | 71600 | 0 | 0 |
| R59 | 1315 | Alan Richard Gonzalez Choc | 32100 | 32100 | 792937.01 | 760836.99 | 1072274.01 | 0 | 32100.02000000002 |
| R60 | 1316 | Juan Ernesto Vossberg Ordoñez / Sumilab | 0 |  | 87981.06 | 84356 | 87981.06 | 0 | 3625.0599999999977 |
| R61 | 1404 | Diego Eduardo Román Hazard | 0 |  | 169971 | 140200 | 169971 | 0 | 29771 |
| R62 | 1406 |  Jonatan Hans Donis Montenegro | 0 | 1690 | 65200 | 63460 | 65200 | -1690 | 1740 |
| R63 | 1412 | Javier Andrés Soto Coronado | 0 | 4200 | 66200 | 66200 | 66200 | -4200 | 0 |
| R64 | 1504 | Berta Eugenia Morales López de Letona | 0 | 1000 | 88800 | 39000 | 88400 | -1000 | 49800 |
| R65 | 1509 | Alan Richard Gonzalez Choc | 32400 | 32400 | 800477.04 | 768077.04 | 1082554.07 | 0 | 32400 |
| R66 | 1607 | Inmobiliaria Quince Sociedad Anonima | 0 |  | 132510 | 0 | 102510 | 0 | 132510 |
| R67 | 1609 | Christian Josué Colindres Sandoval | 0 |  | 86150.58 | 76990 | 86150.58 | 0 | 9160.580000000002 |
| R68 | 1610 | Grupo Sak y Sak, S.A. | 0 |  | 890081.34 | 831183.13 | 890081.34 | 0 | 58898.20999999996 |
| R69 | 1704 | Javier Andres Soto Coronado | 0 | 3200 | 62000 | 62000 | 62000 | -3200 | 0 |
| R70 | 1804 | Juan Pablo Monterroso Arroyo | 0 | 3200 | 62000 | 60060 | 62000 | -3200 | 1940 |
| R71 | 1806 | Business View Sociedad Anonima | 0 | 4580 | 86150.58 | 86150 | 86150.58 | -4580 | 0.5800000000017462 |

---
## 15. BENESTARE 2.0

**Purpose:** Benestare current/canonical version (2.0). Towers A and B. Company: INVERSIONES INMOBILIARIAS CHINAUTLA, S.A. Uses new unit numbering format (e.g. 101-A, 102-B). Includes desistimientos section. Data through 2026-03-31.
**Non-empty rows:** 353 | **Max columns:** 82

### Column Headers (Row 6)

- **B**: Apto
- **C**: Tipo / Modelo
- **D**: Torre
- **E**: Vendedor
- **F**: Cliente
- **G**: Fecha Reserva
- **H**: Estatus
- **I**: Precio de Venta
- **J**: Enganche
- **K**: 2023-03-31
- **L**: 2023-04-30
- **M**: 2023-05-31
- **N**: 2023-06-30
- **O**: 2023-07-31
- **P**: 2023-08-31
- **Q**: 2023-09-30
- **R**: 2023-10-31
- **S**: 2023-11-30
- **T**: 2023-12-31
- **U**: 2024-01-31
- **V**: 2024-02-29
- **W**: 2024-03-31
- **X**: 2024-04-30
- **Y**: 2024-05-31
- **Z**: 2024-06-30
- **AA**: 2024-07-31
- **AB**: 2024-08-31
- **AC**: 2024-09-30
- **AD**: 2024-10-31
- **AE**: 2024-11-30
- **AF**: 2024-12-31
- **AG**: 2025-01-31
- **AH**: 2025-02-28
- **AI**: 2025-03-31
- **AJ**: 2025-04-30
- **AK**: 2025-05-31
- **AL**: 2025-06-30
- **AM**: 2025-07-31
- **AN**: 2025-08-31
- **AO**: 2025-09-30
- **AP**: 2025-10-31
- **AQ**: 2025-11-30
- **AR**: 2025-12-31
- **AS**: 2026-01-31
- **AT**: 2026-02-28
- **AU**: 2026-03-31
- **AV**: TOTAL COBROS Y RESERVAS
- **AW**: % Cobro
- **AX**: SALDO PENDIENTE ENGANCHE
- **AY**: % Pendiente
- **AZ**: Monto a Financiar por Banco
- **BA**: % a Financiar
- **BB**: Proyección de Cobros (S/ Modelo Financiero)
- **BC**: Status inmueble
- **BD**: Status Cliente
- **BE**: Cuotas Pactadas
- **BF**: Cuota de Enganche
- **BG**: Total cuotas pactadas
- **BH**: Monto de Reserva Pactado
- **BI**: Monto de Cuota Pactada
- **BJ**: Cuotas Pagadas
- **BK**: Cantidad de cuotas que deben estar pagadas
- **BL**: Monto que debe estar cancelado a la fecha
- **BM**: Monto pagado de cuotas a la fecha
- **BN**: Enganche + Cuotas Extraordinarias Pagadas
- **BO**: Diferencia
- **BP**: Cobro adicional a lo pactado
- **BQ**: Cobro no realizado según lo pactado
- **BR**: Cuotas
- **BS**: Caso Especial / F&F
- **BT**: Observaciones
- **BU**: DIF MONTO QUE DEBE ESTAR CANCELADO-INGRESO REAL
- **BV**: Enganche II
- **BW**: CUOTAS PENDIENTES
- **BX**: Cuota mes
- **BY**: Acumulado

### DB Mapping

| Column | DB Target |
|--------|-----------|
| Apto | `rv_units.unit_number` (new format e.g. '101 A') |
| Tipo / Modelo | `rv_units.unit_type` |
| Torre | `towers.name` |
| Vendedor | `salespeople.name` |
| Cliente | `rv_clients.full_name` |
| Fecha Reserva | `reservations.created_at` |
| Estatus | `rv_units.status` |
| Precio de Venta | `sales.sale_price` |
| Enganche | `sales.down_payment` |
| Date columns (2023-03 … 2026-03) | `payments.payment_date` + `payments.amount` |
| TOTAL COBROS Y RESERVAS | `SUM(payments.amount)` |
| Cuotas Pactadas | `sales.cuotas_enganche` |
| Monto de Reserva Pactado | `reservations.reserva_amount` |
| Cuotas Pagadas | `COUNT(payments)` phase 2 |
| Caso Especial / F&F | `rv_clients.is_ff` |
| DIF MONTO QUE DEBE ESTAR CANCELADO-INGRESO REAL | computed: expected_paid - actual_paid |
| Cuota mes | computed monthly installment |
| Acumulado | running total |

### Active Reservation Rows (R7–R290)

| Row | Unit ID | Type | Tower | Salesperson | Client | Date | Status | Price (GTQ) | Enganche (GTQ) |
|-----|---------|------|-------|-------------|--------|------|--------|-------------|----------------|
| R7 | 101 A | B | A | Luis Esteban | Wendy Azucena Barrientos Salazar de Vargas | 2024-03-23 | 4.Plan de pagos | 477700 | 24000.06 |
| R8 | 102 A | C | A | Pedro P. Sarti | María Angela Rodríguez Folgar | 2025-01-04 | 4.Plan de pagos | 477000 | 24000 |
| R9 | 103 A | C | A |  |  |  | 1.Disponible | 477000 | 23850 |
| R10 | 104 A | B | A | Efren Sanchez | Astrid Marleny Pineda González | 2024-11-30 | 4.Plan de pagos | 477700 | 23900 |
| R11 | 105 A | A | A |  |  |  | 1.Disponible | 386900 | 19345 |
| R12 | 106 A | B | A | Abigail Garcia | Loida Sarai Morales García de Navas | 2024-03-03 | 4.Plan de pagos | 477700 | 47800 |
| R13 | 107 A | C | A | Abigail Garcia | Helen Lorena Monroy Jauregui | 2024-02-26 | 4.Plan de pagos | 477700 | 24000 |
| R14 | 108 A | C | A | Alejandra Calderón | Heidi Lisseth Morataya Flores | 2023-10-03 | 4.Plan de pagos | 494900 | 49500 |
| R15 | 109 A | B | A | Luis Esteban | Orfa Sarai Santos Morales | 2024-06-10 | 4.Plan de pagos | 477700 | 23900 |
| R16 | 201 A | B | A | Pablo Marroquín | Silvia Dinora Pérez Ruano | 2025-11-16 | 4.Plan de pagos | 497700 | 24900 |
| R17 | 202 A | C | A |  |  |  | 1.Disponible | 477000 | 23850 |
| R18 | 203 A | C | A | Efren Sanchez | Lisbeth Hortencia Osuna Sis | 2026-02-19 | 4.Plan de pagos | 523700 | 26200 |
| R19 | 204 A | B | A | Eder Veliz | Rosa Elena Rojas Cano | 2026-03-12 | 2.Reservado | 0 | 0 |
| R20 | 205 A | A | A | Abigail Garcia | Saulo Josue Escobar Pérez | 2023-11-09 | 4.Plan de pagos | 384700 | 38500 |
| R21 | 206 A | B | A | Abigail Garcia | Cristina Elizabeth Musin Hernandez / Kelly Omar de Jesús Chacón Vasquez | 2024-05-18 | 4.Plan de pagos | 477700 | 24000 |
| R22 | 207 A | C | A | Abigail Garcia | Monica Aide Espital Balan / Miguel Angel Antonio Jiménez Lucas | 2023-10-25 | 4.Plan de pagos | 494900 | 49490 |
| R23 | 208 A | C | A | Antonio Rada | Joyce Sharon Cruz Arguello | 2024-10-07 | 4.Plan de pagos | 477000 | 23900 |
| R24 | 209 A | B | A | Eder Veliz | Byron Amilcar Argueta Orrego / Sheila Roxana Ajcúc Hernández | 2025-11-22 | 4.Plan de pagos | 492700 | 24700 |
| R25 | 301 A | B | A | Eder Veliz | Erick Alejandro Martínez Morales | 2025-05-30 | 4.Plan de pagos | 477700 | 23900 |
| R26 | 302 A | C | A | Karina Fuentes | Byron Juventino López Mayén | 2023-11-27 | 4.Plan de pagos | 497900 | 49800 |
| R27 | 303 A | C | A | Antonio Rada | Xiomara Edith García Solís de Morales / Jorge Estuardo Mejía Chona | 2024-12-09 | 4.Plan de pagos | 477000 | 23900 |
| R28 | 304 A | B | A | Efren Sanchez | Saúl Esteban Mayén Santos | 2024-10-31 | 4.Plan de pagos | 477700 | 23900 |
| R29 | 305 A | A | A | Iván Castillo | Ana Natalia Bardales García | 2026-03-28 | 2.Reservado |  |  |
| R30 | 306 A | B | A | Eder Veliz | Andrea Noemi Rivas Sánchez | 2025-06-22 | 4.Plan de pagos | 477700 | 23900 |
| R31 | 307 A | C | A | Abigail Garcia | Eddy Daniel Roque Arellanos | 2024-04-08 | 4.Plan de pagos | 477000 | 24000 |
| R32 | 308 A | C | A | Antonio Rada | Pedro David Pérez Barrios | 2024-05-15 | 4.Plan de pagos | 477000 | 23900 |
| R33 | 309 A | B | A | Efren Sanchez | Rosita Elvira Clara Pineda | 2025-06-25 | 2.Reservado | 477700 | 23885 |
| R34 | 401 A | B | A | Karina Fuentes | Lourdez Ofelia Baires / Lester Gerardo Trujillo Sazo | 2023-12-02 | 4.Plan de pagos | 494900 | 49500 |
| R35 | 402 A | C | A | Eder Veliz | Ana Paola García Reyes | 2026-03-29 | 2.Reservado | 477000 | 23850 |
| R36 | 403 A | C | A | Luis Esteban | Luis Fernando Tique Santos / Gabriela Zucelly Gonzáles de León | 2024-05-14 | 4.Plan de pagos | 477000 | 23900 |
| R37 | 404 A | B | A | Efren Sanchez | Amanda Aracely Castillo Guzmán | 2024-11-30 | 4.Plan de pagos | 477700 | 100000 |
| R38 | 405 A | A | A | Pablo Marroquín | Sara Esmeralda López Hernández | 2025-06-30 | 4.Plan de pagos | 369600 | 18500 |
| R39 | 406 A | B | A | Eder Veliz | Ana Paola García Reyes | 2026-03-30 | 2.Reservado | 0 | 0 |
| R40 | 407 A | C | A | Antonio Rada | Marvin Leonel Alexander Larias Guzmán | 2024-08-07 | 4.Plan de pagos | 477700 | 23900 |
| R41 | 408 A | C | A | Antonio Rada | Oscar Daniel Larias Guzmán | 2024-08-07 | 4.Plan de pagos | 477000 | 23900 |
| R42 | 409 A | B | A | Efren Sanchez | Rudy Ronaldo Peña Larios | 2025-03-31 | 4.Plan de pagos | 477700 | 23900 |
| R43 | 501 A | B | A | Efren Sanchez | Ronald Alberto Pineda Monroy | 2025-06-28 | 4.Plan de pagos | 477700 | 23900 |
| R44 | 502 A | C | A | Karina Fuentes | Oscar Oswaldo Ramos Gil | 2023-12-10 | 4.Plan de pagos | 497900 | 49800 |
| R45 | 503 A | C | A | Pablo Marroquín | Michael Alexander Morales Rodríguez / Helen Mishel Rodas López de Morales | 2025-06-27 | 4.Plan de pagos | 477000 | 23900 |
| R46 | 504 A | B | A | Pablo Marroquín | Diego Estuardo Salguero Salvatierra / Iveth Esmeralda Pereira Pérez | 2025-06-28 | 4.Plan de pagos | 477700 | 23900 |
| R47 | 505 A | A | A | Eder Veliz | Katherine Andrea Aceytuno Herrera / Denis Alexander Gabriel Sicaja | 2026-02-28 | 4.Plan de pagos | 386900 | 19400 |
| R48 | 506 A | B | A | Eder Veliz | Cintia Noemy Díaz Díaz / Alan Emanuel Tunche Huertas | 2025-05-10 | 4.Plan de pagos | 477700 | 23900 |
| R49 | 507 A | C | A | Eder Veliz | Edwin Alexander Amado Toc / Jennifer Alexa Castañeda Alvarez | 2025-06-28 | 4.Plan de pagos | 477000 | 23900 |
| R50 | 508 A | C | A | Eder Veliz | Sebastian Angel Milian Guas | 2025-06-28 | 4.Plan de pagos | 477000 | 23900 |
| R51 | 509 A | B | A | Eder Veliz | Cintia Noemy Diaz Diaz | 2025-11-16 | 4.Plan de pagos | 492700 | 24700 |
| R52 | 601 A | B | A | Luis Esteban | Santos Sebastián Pastor Velásquez | 2024-04-25 | 4.Plan de pagos | 477700 | 23900 |
| R53 | 602 A | C | A | Abigail Garcia | David Obdulio Pérez Monzón | 2023-11-27 | 4.Plan de pagos | 497900 | 49800 |
| R54 | 603 A | C | A | Abigail Garcia | Andrea Isabel Tezen Cabrera / Leyla Mariela Cabrera Gonzales | 2024-05-30 | 4.Plan de pagos | 477700 | 24000 |
| R55 | 604 A | B | A |  |  |  | 1.Disponible | 477700 | 23885 |
| R56 | 605 A | A | A | Abigail Garcia | Luis Fernando Moreno Pozuelos | 2024-05-07 | 4.Plan de pagos | 369600 | 18500 |
| R57 | 606 A | B | A | Eder Veliz | Ilse Mariela Rosales Díaz | 2025-06-29 | 4.Plan de pagos | 477700 | 23900 |
| R58 | 607 A | C | A | Rony Ramírez | Ever Benedicto Tipol Yoj | 2026-03-30 | 2.Reservado | 0 | 0 |
| R59 | 608 A | C | A | Pablo Marroquín | José Armando Retana Interiano | 2025-11-20 | 4.Plan de pagos | 497000 | 24900 |
| R60 | 609 A | B | A | Abigail Garcia | Erik Estuardo Carrera Cruz | 2024-02-18 | 4.Plan de pagos | 477700 | 24000 |
| R61 | 101 B | B | B | Eder Veliz | Karen Arabella Kuri López / Rodrigo Daniel Castillo Morales | 2026-01-17 | 2.Reservado | 477700 | 24000.06 |
| R62 | 102 B | B | B | Efren Sanchez | Miguel Anibal Navarro Orozco | 2026-02-04 | 2.Reservado | 477700 | 23900 |
| R63 | 103 B | C | B | Pablo Marroquín | Linsy Asaneth Alarcón Reyes de Cordón | 2025-12-17 | 4.Plan de pagos | 507000 | 25400 |
| R64 | 104 B | C | B | Efren Sanchez | Rogerio Dagoberto Escobar Fajardo / Carmen Odila Escobar de León | 2025-07-27 | 4.Plan de pagos | 487000 | 24400 |
| R65 | 105 B | B | B | Pablo Marroquín | Perla Rocio Domingo Barrios | 2025-12-22 | 4.Plan de pagos | 507700 | 25400 |
| R66 | 106 B | B | B | Pablo Marroquín | Telma Estela Barrios Vicente | 2025-12-22 | 4.Plan de pagos | 507700 | 25400 |
| R67 | 107 B | A | B |  |  |  | 1.Disponible | 384700 | 38500 |
| R68 | 108 B | B | B | Eder Veliz | 	Esvin Luciano Quino Suret | 2025-08-21 | 4.Plan de pagos | 492700 | 24700 |
| R69 | 109 B | B | B | Efren Sanchez | Carmen Odilia Escobar de León | 2026-01-05 | 4.Plan de pagos | 505000 | 25300 |
| R70 | 110 B | C | B | Eder Veliz | Maria Ysabel Velásquez Fernandez de Chocón | 2026-02-22 | 2.Reservado | 477700 | 24000 |
| R71 | 111 B | C | B | Pablo Marroquín | Wendy Judith Cortez Cuque | 2025-09-23 | 4.Plan de pagos | 497000 | 24900 |
| R72 | 112 B | B | B | Efren Sanchez | Cindy Gabriela Mejicanos de León / José Roberto López | 2025-09-02 | 4.Plan de pagos | 492700 | 24700 |
| R73 | 113 B | B | B | Eder Veliz | Ruth María Isabel Rodríguez Coronado | 2025-08-06 | 4.Plan de pagos | 487700 | 24400 |
| R74 | 201 B | B | B | Luis Esteban | Andrea Celeste Aparicio Juárez | 2024-04-07 | 4.Plan de pagos | 477700 | 24000 |
| R75 | 202 B | B | B | Efren Sanchez | Carlos Humberto Joel Alvizures Carmona / Katherine Areli Turcios Alvarez | 2024-10-31 | 4.Plan de pagos | 477700 | 23900 |
| R76 | 203 B | C | B | Pablo Marroquín | Norma Estela Guzman Yoque | 2026-01-25 | 4.Plan de pagos | 513000 | 25700 |
| R77 | 204 B | C | B | Efren Sanchez | Horacio Ismael Gómez Mutaz | 2026-02-07 | 2.Reservado | 477000 | 24000 |
| R78 | 205 B | B | B | Efren Sanchez | Angel Renato Muñoz de León | 2025-07-07 | 2.Reservado | 477700 | 24000 |
| R79 | 206 B | B | B | Efren Sanchez | Jorge Pablo Pérez de León | 2026-01-04 | 2.Reservado | 477700 | 24000 |
| R80 | 207 B | A | B |  |  |  | 1.Disponible |  |  |
| R81 | 208 B | B | B | Eder Veliz | Francisca Veronica Rosales Morales | 2026-01-04 | 4.Plan de pagos | 502700 | 25200 |
| R82 | 209 B | B | B | Efren Sanchez | Douglas Alexander Crúz Cobar | 2025-07-27 | 4.Plan de pagos | 487700 | 24400 |
| R83 | 210 B | C | B | Rony Ramírez | Jackelin Noemy Alvarado Pelico | 2026-01-11 | 2.Reservado | 513000 | 25650 |
| R84 | 211 B | C | B | Eder Veliz | Flor del Rocío Guarcas Samayoa | 2025-08-22 | 4.Plan de pagos | 492000 | 24700 |
| R85 | 212 B | B | B | Pablo Marroquín | Dylan Alexander Ramos Campos | 2025-08-05 | 4.Plan de pagos | 487700 | 24400 |
| R86 | 213 B | B | B | Pablo Marroquín | Blanca Iris García Figueroa de Jocol / Ricardo Ernesto Jocol Molina | 2025-08-17 | 4.Plan de pagos | 492700 | 24700 |
| R87 | 301 B | B | B | Eder Veliz | Rony Francisco Rojas Lopez | 2026-01-11 | 2.Reservado | 513700 | 25685 |
| R88 | 302 B | B | B | Rony Ramírez | Flory Cristina Escalante Ramos | 2026-03-21 | 2.Reservado | 0 | 0 |
| R89 | 303 B | C | B | Eder Veliz | Del Carmen Jaqueline Samantha Canel Cumatz | 2025-12-08 | 4.Plan de pagos | 502000 | 25100 |
| R90 | 304 B | C | B | Eder Veliz | Daniel Alberto Vargas del Cid | 2025-12-13 | 4.Plan de pagos | 502000 | 25100 |
| R91 | 305 B | B | B | Eder Veliz | Dulce Rocío Medrano Barrera | 2025-08-30 | 4.Plan de pagos | 485700 | 24400 |
| R92 | 306 B | B | B | Eder Veliz | Sara Fernanda Enrique Lemus | 2025-08-30 | 4.Plan de pagos | 485700 | 24400 |
| R93 | 307 B | A | B |  |  |  | 1.Disponible | 386900 | 19345 |
| R94 | 308 B | B | B | Pablo Marroquín | Luis Javier Aguilar España | 2025-07-06 | 4.Plan de pagos | 487700 | 24400 |
| R95 | 309 B | B | B | Eder Veliz | Sara Fernanda Enrique Lemus | 2025-08-30 | 4.Plan de pagos | 485700 | 24400 |
| R96 | 310 B | C | B | Pablo Marroquín | Debora Marie Castillo Ventura | 2026-01-17 | 4.Plan de pagos | 513000 | 25700 |
| R97 | 311 B | C | B | Rony Ramírez | Lesly Marisol de León Villanueva | 2026-01-24 | 4.Plan de pagos | 513000 | 25700 |
| R98 | 312 B | B | B | Eder Veliz | Julian Guillermo Ramirez García / Sulma Korina Hernández Aguilar | 2025-07-31 | 4.Plan de pagos | 487700 | 24400 |
| R99 | 313 B | B | B | Pablo Marroquín | Suarlim Elí Barrientos Pazos / Angel Elí Barrientos Castro | 2025-07-30 | 4.Plan de pagos | 487700 | 24400 |
| R100 | 401 B | B | B | Pablo Marroquín | Faviola Antonia Monroy Lima / Edwin Alfredo Rivera | 2026-01-11 | 4.Plan de pagos | 513700 | 25700 |
| R101 | 402 B | B | B | Rony Ramírez | Rigoberto Gabriel López | 2025-11-17 | 4.Plan de pagos | 492700 | 24700 |
| R102 | 403 B | C | B | Efren Sanchez | Estefan Guadalupe Juárez Girón de Perez | 2026-01-08 | 4.Plan de pagos | 515000 | 25800 |
| R103 | 404 B | C | B | Efren Sanchez | José Luis García Macal | 2025-11-30 | 4.Plan de pagos | 492000 | 24600 |
| R104 | 405 B | B | B | Efren Sanchez | Victoria Nohemí García Macal | 2025-12-15 | 2.Reservado | 503700 | 25185 |
| R105 | 406 B | B | B | Rony Ramírez | Mario Alexander Gutierrez Pacheco | 2026-01-20 | 4.Plan de pagos | 513700 | 25700 |
| R106 | 407 B | A | B | Pablo Marroquín | Mauricio Ricardo Mámol Vásquez | 2025-08-06 | 4.Plan de pagos | 379600 | 19000 |
| R107 | 408 B | B | B | Rony Ramírez | Oscar Misael de Jesús Santos Borrayo / Jessenia Beatriz Santos Borrayo | 2026-01-19 | 4.Plan de pagos | 502700 | 25200 |
| R108 | 409 B | B | B | Eder Veliz | Kevin Fernando de la Cruz Toc | 2025-07-03 | 4.Plan de pagos | 477700 | 23900 |
| R109 | 410 B | C | B | Efren Sanchez | Luis Fernando Díaz Mijangos / Carolin Magali Rodríguez Zacarias | 2026-01-05 | 2.Reservado | 477000 | 23900 |
| R110 | 411 B | C | B | Pablo Marroquín | Astrid Angelica Herrera Gil de López / Kevin Alejandro López Toc | 2025-07-20 | 4.Plan de pagos | 487000 | 24400 |
| R111 | 412 B | B | B | Eder Veliz | Edgar Manfredo Hernández Cabrera | 2025-08-21 | 4.Plan de pagos | 492700 | 24700 |
| R112 | 413 B | B | B | Eder Veliz | Jazmín Esmeralda Estrada Menendez | 2026-01-11 | 4.Plan de pagos | 503700 | 25200 |
| R113 | 501 B | B | B | Pablo Marroquín | Hillary Kerstel Ixmucane Xoná Guzmán / Francisca Guzmán López de Xoná | 2025-07-13 | 4.Plan de pagos | 487700 | 24385 |
| R114 | 502 B | B | B | Pablo Marroquín | Jurgen Alexander Hernández Camposeco | 2025-08-24 | 4.Plan de pagos | 492700 | 24700 |
| R115 | 503 B | C | B | Rony Ramírez | Amy Andrea Vasquez Hernandez | 2026-01-06 | 2.Reservado | 497900 | 49800 |
| R116 | 504 B | C | B | Efren Sanchez | Israel Armando Marroquín Pérez | 2025-08-14 | 4.Plan de pagos | 487000 | 24400 |
| R117 | 505 B | B | B | Pablo Marroquín | Yenifer Estefania Santos Gonzáles / Juan Eduardo Flores Barrera | 2025-08-09 | 4.Plan de pagos | 487700 | 24700 |
| R118 | 506 B | B | B | Eder Veliz | Hugo Alexander Méndez Caal | 2025-09-11 | 4.Plan de pagos | 492700 | 24700 |
| R119 | 507 B | A | B | Pedro P. Sarti | David Enrique Aldana Mazariegos | 2025-02-05 | 4.Plan de pagos | 369600 | 18500 |
| R120 | 508 B | B | B | Eder Veliz | Jorge Mario Santizo Lacayo | 2025-07-12 | 4.Plan de pagos | 487700 | 24400 |
| R121 | 509 B | B | B | Pablo Marroquín | Diego José Ortíz Cordero | 2025-09-01 | 4.Plan de pagos | 492700 | 24700 |
| R122 | 510 B | C | B | Efren Sanchez | Angel Gabriel Coc Gómez | 2025-08-10 | 4.Plan de pagos | 487000 | 24400 |
| R123 | 511 B | C | B | Pablo Marroquín | Josmin Joaquín Barahona Mora | 2025-08-09 | 4.Plan de pagos | 487000 | 24400 |
| R124 | 512 B | B | B | Eder Veliz | Byron Méndez Cal | 2025-09-07 | 4.Plan de pagos | 492700 | 24700 |
| R125 | 513 B | B | B | Pablo Marroquín | Karen Ivonne Poggio | 2025-09-07 | 4.Plan de pagos | 492700 | 24700 |
| R126 | 601 B | B | B | Eder Veliz | Mario Andres Pérez López | 2025-07-26 | 4.Plan de pagos | 487700 | 24400 |
| R127 | 602 B | B | B | Efren Sanchez | Mario René Ruiz Poncio | 2025-12-16 | 4.Plan de pagos | 502700 | 25200 |
| R128 | 603 B | C | B | Eder Veliz | Jose Miguel Mont Ordoñez | 2026-01-11 | 2.Reservado | 513000 | 25650 |
| R129 | 604 B | C | B | Efren Sanchez | Caterin Fidelina Calderón de Ortiz | 2025-07-05 | 4.Plan de pagos | 487000 | 24400 |
| R130 | 605 B | B | B | Rony Ramírez | Yoselin Siomara Yocute Yocute | 2026-01-17 | 4.Plan de pagos | 503700 | 25200 |
| R131 | 606 B | B | B | Rony Ramírez | Oscar Alexander Velasquez Tiu | 2026-01-17 | 2.Reservado | 477700 | 24000 |
| R132 | 607 B | A | B | Pablo Marroquín | Cindy Yessenia Paredes Bolaños | 2026-01-26 | 4.Plan de pagos | 386900 | 19400 |
| R133 | 608 B | B | B | Efren Sanchez | Belter Anibal Collado López | 2025-08-17 | 4.Plan de pagos | 492700 | 24700 |
| R134 | 609 B | B | B | Efren Sanchez | Emily Daniela Hernández Vásquez / Erik Ariel Alinan Sucup | 2025-08-25 | 4.Plan de pagos | 492700 | 24700 |
| R135 | 610 B | C | B | Abigail Garcia | Jaquelyn Michel Chumil Castillo / Jonnathan José Gonzalez | 2024-04-28 | 4.Plan de pagos | 477000 | 24000 |
| R136 | 611 B | C | B | Pablo Marroquín | Marleny Aracely Jocol García de Grajeda / Luis Alberto Grajeda López | 2025-08-09 | 4.Plan de pagos | 487000 | 24400 |
| R137 | 612 B | B | B | Pablo Marroquín | Linda Esmeralda Molina Najarro / Diego Mauricio Hernández Alveño | 2026-01-16 | 4.Plan de pagos | 513700 | 25700 |
| R138 | 613 B | B | B | Eder Veliz | Valery Anthonella Schulz Rosales | 2026-01-12 | 2.Reservado | 513700 | 25685 |
| R139 | 101 C | B | C | Pablo Marroquín | Allan Danilo Tejada Alay | 2025-10-05 | 4.Plan de pagos | 497700 | 24900 |
| R140 | 102 C | C | C | Efren Sanchez | Luis Carlos Rodriguez Arias / Katherine Andrea Enriquez Estrada | 2025-11-15 | 4.Plan de pagos | 492000 | 24600 |
| R141 | 103 C | C | C | Eder Veliz | Jazmín Edith Urbina López | 2025-09-14 | 4.Plan de pagos | 492000 | 24600 |
| R142 | 104 C | B | C | Efren Sanchez | Oscar Josue Robledo Sagastume | 2025-10-26 | 4.Plan de pagos | 492700 | 24700 |
| R143 | 105 C | A | C |  |  |  | 1.Disponible | 386900 | 19345 |
| R144 | 106 C | A | C | Rony Ramírez | Yuri Blanca Margarita Reyes de Almira | 2026-03-16 | 2.Reservado | 0 | 0 |
| R145 | 107 C | B | C | Eder Veliz | Amelita Natali Aguilar López | 2025-11-27 | 4.Plan de pagos | 492700 | 24700 |
| R146 | 108 C | C | C | Efren Sanchez | Julio José Guzmán Tobías | 2025-11-07 | 4.Plan de pagos | 492000 | 24600 |
| R147 | 109 C | C | C | Efren Sanchez | Ericka Alejandra Sagastume Girón de Herrera | 2025-12-31 | 4.Plan de pagos | 507000 | 35500 |
| R148 | 110 C | B | C | Efren Sanchez | Fernando Terre Galdamez | 2025-12-17 | 4.Plan de pagos | 503700 | 35300 |
| R149 | 111 C | A | C | Eder Veliz | Selvin Andino Castillo Diéguez | 2026-02-28 | 2.Reservado | 386900 | 19345 |
| R150 | 201 C | B | C | Eder Veliz | Angie Soleyne Camacho Suarez | 2025-09-12 | 4.Plan de pagos | 492700 | 24700 |
| R151 | 202 C | C | C | Pablo Marroquín | Cindy Abigail Ordoñez Chacón | 2025-11-09 | 4.Plan de pagos | 497000 | 24900 |
| R152 | 203 C | C | C | Eder Veliz | Francisco Alberto García Palencia / Wendy Yajaira Morales Pedroza | 2025-11-30 | 2.Reservado | 492000 | 24600 |
| R153 | 204 C | B | C | Rony Ramírez | Shirly Paola Flores Consuegra | 2026-02-15 | 2.Reservado | 513700 | 25685 |
| R154 | 205 C | A | C |  |  |  | 1.Disponible | 386900 | 19345 |
| R155 | 206 C | A | C |  |  |  | 1.Disponible | 386900 | 19345 |
| R156 | 207 C | B | C | Eder Veliz | Sergio Estuardo Fuentes López | 2026-02-20 | 2.Reservado | 513700 | 25685 |
| R157 | 208 C | C | C | Efren Sanchez | Junior Abraham Boror Ramos / Jéssica Marlene Ramos Ajanel | 2025-11-29 | 4.Plan de pagos | 492000 | 24600 |
| R158 | 209 C | C | C | Pablo Marroquín | Karen Patricia Morales Orellana / Erick Francisco Barillas Galindo | 2026-01-25 | 4.Plan de pagos | 513000 | 36000 |
| R159 | 210 C | B | C | Rony Ramírez | Karen Elizabeth Barahona Escobar | 2026-02-15 | 2.Reservado | 513700 | 25685 |
| R160 | 211 C | A | C |  |  |  | 1.Disponible | 386900 | 19345 |
| R161 | 301 C | B | C |  |  |  | 1.Disponible | 492700 | 24635 |
| R162 | 302 C | C | C | Pablo Marroquín | Rosa Alejandra Rodríguez Montufar | 2025-11-16 | 4.Plan de pagos | 497000 | 24900 |
| R163 | 303 C | C | C | Rony Ramírez | Diego Gabriel Molina Romero | 2025-11-02 | 2.Reservado | 492000 | 24600 |
| R164 | 304 C | B | C | Efren Sanchez | Alex Ricardo Pérez Rodenas | 2025-11-08 | 4.Plan de pagos | 492700 | 24700 |
| R165 | 305 C | A | C |  |  |  | 1.Disponible | 386900 | 19345 |
| R166 | 306 C | A | C |  |  |  | 1.Disponible | 386900 | 19345 |
| R167 | 307 C | B | C | Efren Sanchez | Wendy Guadalupe Bran Cedillo | 2025-11-14 | 4.Plan de pagos | 492700 | 24700 |
| R168 | 308 C | C | C | Rony Ramírez | Brandon Azael Espinoza Carillas | 2026-01-18 | 4.Plan de pagos | 513000 | 36000 |
| R169 | 309 C | C | C | Eder Veliz | Julio Cesar Jeronimo Cajero | 2025-11-16 | 2.Reservado | 492000 | 24600 |
| R170 | 310 C | B | C | Efren Sanchez | Steven Adolfo Paredes Cabrera / Milca Saraí Barrieos Ixcoy | 2025-12-20 | 4.Plan de pagos | 502700 | 35200 |
| R171 | 311 C | A | C |  |  |  | 1.Disponible | 386900 | 19345 |
| R172 | 401 C | B | C | Eder Veliz | Yuri Beberlyn Ambrocio Juarez | 2026-02-15 | 2.Reservado | 513700 | 25685 |
| R173 | 402 C | C | C | Eder Veliz | Miguel Estuardo Arevalo Toc | 2025-09-21 | 2.Reservado | 492000 | 24600 |
| R174 | 403 C | C | C | Efren Sanchez | Elsa Mireya Quinteros García Hernández / Oswaldo Robert Karl Hernández | 2025-11-10 | 4.Plan de pagos | 492000 | 24600 |
| R175 | 404 C | B | C | Efren Sanchez | Sandra Lizeth Sunuc Velásquez | 2025-10-28 | 4.Plan de pagos | 492700 | 24700 |
| R176 | 405 C | A | C |  |  |  | 1.Disponible | 386900 | 19345 |
| R177 | 406 C | A | C | Efren Sanchez | Marvin de Jesús Sosa Ramírez / Kimberly Beatriz Sipaque Orantes | 2026-01-03 | 4.Plan de pagos | 399000 | 28000 |
| R178 | 407 C | B | C | Rony Ramírez | Ronal Yovanni Donis Martínez | 2025-11-01 | 4.Plan de pagos | 497700 | 24900 |
| R179 | 408 C | C | C | Eder Veliz | Yohana Elizabeth Arrivillaga Fajardo | 2025-11-02 | 4.Plan de pagos | 492000 | 24600 |
| R180 | 409 C | C | C | Eder Veliz | Reina Marivel Muñoz Samayoa | 2025-10-19 | 2.Reservado | 492000 | 24600 |
| R181 | 410 C | B | C |  |  |  | 1.Disponible | 492700 | 24635 |
| R182 | 411 C | A | C | Rony Ramírez | Julian Díaz Sanchez | 2026-02-07 | 2.Reservado | 386900 | 19345 |
| R183 | 501 C | B | C | Eder Veliz | Gerson Ranferi Porras Galindo | 2025-10-12 | 4.Plan de pagos | 492700 | 24700 |
| R184 | 502 C | C | C | Pablo Marroquín | Christian Isaias Patzán Mancilla / Nancy Johanna Mancilla Ramírez de Ortega | 2025-09-15 | 4.Plan de pagos | 497000 | 24900 |
| R185 | 503 C | C | C | Pablo Marroquín | Abner Manolo Barrios Herrera | 2025-10-26 | 4.Plan de pagos | 497000 | 24900 |
| R186 | 504 C | B | C | Rony Ramírez | Reyner Abdiel Francisco Franco López | 2026-02-28 | 2.Reservado | 513700 | 25685 |
| R187 | 505 C | A | C |  |  |  | 1.Disponible | 386900 | 19345 |
| R188 | 506 C | A | C |  |  |  | 1.Disponible | 386900 | 19345 |
| R189 | 507 C | B | C | Rony Ramírez | Juan Daniel Quiñónez Márquez | 2025-11-01 | 4.Plan de pagos | 487700 | 24400 |
| R190 | 508 C | C | C | Efren Sanchez | Carlos Daniel Morales Palma | 2025-10-21 | 4.Plan de pagos | 492000 | 24600 |
| R191 | 509 C | C | C | Pablo Marroquín | Otylio Alexander García Orantes | 2025-10-18 | 4.Plan de pagos | 497000 | 24900 |
| R192 | 510 C | B | C | Eder Veliz | Erik Francisco Estrada Catalán | 2025-10-19 | 4.Plan de pagos | 492700 | 24700 |
| R193 | 511 C | A | C |  |  |  | 1.Disponible | 386900 | 19345 |
| R194 | 601 C | B | C | Efren Sanchez | Sherlyn Andrea Orantes Pérez / Mauricio Alejandro Hernández Castro | 2026-01-30 | 4.Plan de pagos | 515000 | 25800 |
| R195 | 602 C | C | C | Eder Veliz | Reyna Elizabeth Pixtun Pixtun | 2026-02-28 | 2.Reservado | 492000 | 24600 |
| R196 | 603 C | C | C | Efren Sanchez | Christian Alexander Vanderberg | 2026-02-23 | 2.Reservado | 497000 | 24900 |
| R197 | 604 C | B | C | Rony Ramírez | Javier Alberto Zepeda Aguirre | 2026-02-24 | 2.Reservado | 513700 | 25685 |
| R198 | 605 C | A | C |  |  |  | 1.Disponible | 386900 | 19345 |
| R199 | 606 C | A | C |  |  |  | 1.Disponible | 386900 | 19345 |
| R200 | 607 C | B | C | Antonio Rada | Paola Adelina Figueroa Gomez de Escobar / Alan Yoel Escobar Figueroa | 2026-02-24 | 2.Reservado | 513700 | 25685 |
| R201 | 608 C | C | C | Pablo Marroquín | Yully Aydaly Soto Higueros | 2025-10-26 | 4.Plan de pagos | 497000 | 24900 |
| R202 | 609 C | C | C | Eder Veliz | Natalie Elizabeth Pacheco Menéndez de Gonzáles | 2025-10-30 | 4.Plan de pagos | 492000 | 24600 |
| R203 | 610 C | B | C | Pablo Marroquín | Julio Humberto Soto Higueros | 2025-10-26 | 4.Plan de pagos | 497700 | 24900 |
| R204 | 611 C | A | C | Efren Sanchez | Diego Alejandro Sandoval Méndez | 2026-02-27 | 2.Reservado | 0 | 0 |
| R205 | 101 D | C | D |  |  |  | 1.Disponible | 517300 | 25865 |
| R206 | 102 D | C | D |  |  |  | 1.Disponible | 517300 | 25865 |
| R207 | 103 D | A | D |  |  |  | 1.Disponible | 386900 | 19345 |
| R208 | 104 D | B | D |  |  |  | 1.Disponible | 518000 | 25900 |
| R209 | 105 D | C | D |  |  |  | 1.Disponible | 517300 | 25865 |
| R210 | 106 D | C | D |  |  |  | 1.Disponible | 517300 | 25865 |
| R211 | 107 D | B | D |  |  |  | 1.Disponible | 518000 | 25900 |
| R212 | 201 D | C | D |  |  |  | 1.Disponible | 517300 | 25865 |
| R213 | 202 D | C | D |  |  |  | 1.Disponible | 517300 | 25865 |
| R214 | 203 D | A | D |  |  |  | 1.Disponible | 386900 | 19345 |
| R215 | 204 D | B | D |  |  |  | 1.Disponible | 518000 | 25900 |
| R216 | 205 D | C | D |  |  |  | 1.Disponible | 517300 | 25865 |
| R217 | 206 D | C | D |  |  |  | 1.Disponible | 517300 | 25865 |
| R218 | 207 D | B | D |  |  |  | 1.Disponible | 518000 | 25900 |
| R219 | 301 D | C | D |  |  |  | 1.Disponible | 517300 | 25865 |
| R220 | 302 D | C | D |  |  |  | 1.Disponible | 517300 | 25865 |
| R221 | 303 D | A | D |  |  |  | 1.Disponible | 386900 | 19345 |
| R222 | 304 D | B | D | Rony Ramírez | Welnio Iván Cuellar Portillo | 2026-03-22 | 2.Reservado | 0 | 0 |
| R223 | 305 D | C | D |  |  |  | 1.Disponible | 517300 | 25865 |
| R224 | 306 D | C | D |  |  |  | 1.Disponible | 517300 | 25865 |
| R225 | 307 D | B | D |  |  |  | 1.Disponible | 518000 | 25900 |
| R226 | 401 D | C | D |  |  |  | 1.Disponible | 517300 | 25865 |
| R227 | 402 D | C | D | Rony Ramírez | Nnenna Danie Sandoval Chavez | 2026-03-27 | 2.Reservado |  |  |
| R228 | 403 D | A | D |  |  |  | 1.Disponible | 386900 | 19345 |
| R229 | 404 D | B | D | Eder Veliz | Pedro Orlando José Carias Leiva | 2026-03-08 | 2.Reservado | 0 | 0 |
| R230 | 405 D | C | D | Iván Castillo | Josselin Abigail Marleny Rodriguez Gonzalez | 2026-03-14 | 2.Reservado | 0 | 0 |
| R231 | 406 D | C | D |  |  |  | 1.Disponible | 517300 | 25865 |
| R232 | 407 D | B | D |  |  |  | 1.Disponible | 518000 | 25900 |
| R233 | 501 D | C | D |  |  |  | 1.Disponible | 517300 | 25865 |
| R234 | 502 D | C | D |  |  |  | 1.Disponible | 517300 | 25865 |
| R235 | 503 D | A | D |  |  |  | 1.Disponible | 386900 | 19345 |
| R236 | 504 D | B | D |  |  |  | 1.Disponible | 518000 | 25900 |
| R237 | 505 D | C | D |  |  |  | 1.Disponible | 517300 | 25865 |
| R238 | 506 D | C | D |  |  |  | 1.Disponible | 517300 | 25865 |
| R239 | 507 D | B | D |  |  |  | 1.Disponible | 518000 | 25900 |
| R240 | 601 D | C | D |  |  |  | 1.Disponible | 517300 | 25865 |
| R241 | 602 D | C | D |  |  |  | 1.Disponible | 517300 | 25865 |
| R242 | 603 D | A | D |  |  |  | 1.Disponible | 386900 | 19345 |
| R243 | 604 D | B | D |  |  |  | 1.Disponible | 518000 | 25900 |
| R244 | 605 D | C | D | Rony Ramírez | Elkin Daniery Oscal | 2026-03-09 | 2.Reservado |  |  |
| R245 | 606 D | C | D |  |  |  | 1.Disponible | 517300 | 25865 |
| R246 | 607 D | B | D |  |  |  | 1.Disponible | 518000 | 25900 |
| R247 | 101 E | B | E |  |  |  | 1.Disponible | 518000 | 25900 |
| R248 | 102 E | C | E |  |  |  | 1.Disponible | 517300 | 25865 |
| R249 | 103 E | C | E |  |  |  | 1.Disponible | 517300 | 25865 |
| R250 | 104 E | B | E |  |  |  | 1.Disponible | 518000 | 25900 |
| R251 | 105 E | A | E |  |  |  | 1.Disponible | 386900 | 19345 |
| R252 | 106 E | C | E |  |  |  | 1.Disponible | 517300 | 25865 |
| R253 | 107 E | C | E |  |  |  | 1.Disponible | 517300 | 25865 |
| R254 | 201 E | B | E |  |  |  | 1.Disponible | 518000 | 25900 |
| R255 | 202 E | C | E |  |  |  | 1.Disponible | 517300 | 25865 |
| R256 | 203 E | C | E |  |  |  | 1.Disponible | 517300 | 25865 |
| R257 | 204 E | B | E |  |  |  | 1.Disponible | 518000 | 25900 |
| R258 | 205 E | A | E |  |  |  | 1.Disponible | 386900 | 19345 |
| R259 | 206 E | C | E |  |  |  | 1.Disponible | 517300 | 25865 |
| R260 | 207 E | C | E |  |  |  | 1.Disponible | 517300 | 25865 |
| R261 | 301 E | B | E |  |  |  | 1.Disponible | 518000 | 25900 |
| R262 | 302 E | C | E |  |  |  | 1.Disponible | 517300 | 25865 |
| R263 | 303 E | C | E |  |  |  | 1.Disponible | 517300 | 25865 |
| R264 | 304 E | B | E |  |  |  | 1.Disponible | 518000 | 25900 |
| R265 | 305 E | A | E |  |  |  | 1.Disponible | 386900 | 19345 |
| R266 | 306 E | C | E |  |  |  | 1.Disponible | 517300 | 25865 |
| R267 | 307 E | C | E |  |  |  | 1.Disponible | 517300 | 25865 |
| R268 | 401 E | B | E |  |  |  | 1.Disponible | 518000 | 25900 |
| R269 | 402 E | C | E |  |  |  | 1.Disponible | 517300 | 25865 |
| R270 | 403 E | C | E |  |  |  | 1.Disponible | 517300 | 25865 |
| R271 | 501 E | B | E |  |  |  | 1.Disponible | 518000 | 25900 |
| R272 | 502 E | C | E |  |  |  | 1.Disponible | 517300 | 25865 |
| R273 | 503 E | C | E |  |  |  | 1.Disponible | 517300 | 25865 |
| R274 | 504 E | B | E |  |  |  | 1.Disponible | 518000 | 25900 |
| R275 | 505 E | A | E |  |  |  | 1.Disponible | 386900 | 19345 |
| R276 | 506 E | C | E |  |  |  | 1.Disponible | 517300 | 25865 |
| R277 | 507 E | C | E |  |  |  | 1.Disponible | 517300 | 25865 |
| R278 | 601 E | B | E |  |  |  | 1.Disponible | 518000 | 25900 |
| R279 | 602 E | C | E |  |  |  | 1.Disponible | 517300 | 25865 |
| R280 | 603 E | C | E |  |  |  | 1.Disponible | 517300 | 25865 |
| R281 | 604 E | B | E |  |  |  | 1.Disponible | 518000 | 25900 |
| R282 | 605 E | A | E |  |  |  | 1.Disponible | 386900 | 19345 |
| R283 | 606 E | C | E |  |  |  | 1.Disponible | 517300 | 25865 |
| R284 | 607 E | C | E |  |  |  | 1.Disponible | 517300 | 25865 |

---

## 16. Hoja2

**Purpose:** Empty sheet. No data.
**Non-empty rows:** 0 | **Max columns:** 1

No content.

---
## 17. BNT PPTO 2.0

**Purpose:** Benestare 2.0 budgeted installment schedule. Three columns for unit identity (Apto, Torre, Estatus) then monthly dates 2023-03-01 through 2029-12-01, then summary columns.
**Non-empty rows:** 286 | **Max columns:** 95

### Column Headers (Row 1)

- **A**: Apto
- **B**: Torre
- **C**: Estatus
- **D–CG**: Monthly dates 2023-03-01 through 2029-12-01
- **CH**: TOTAL
- **CI**: PRECIO VTA
- **CJ**: TOTAL ENG.
- **CK**: P.I.
- **CL**: P. PLAZO
- **CM**: CUOTA MES
- **CN**: DIF.
- **CO**: Appto.
- **CP**: Mes
- **CQ**: Acumulado

### DB Mapping

| Column | DB Target |
|--------|-----------|
| Apto | `rv_units.unit_number` |
| Torre | `towers.name` |
| Estatus | `rv_units.status` |
| Monthly dates | budgeted `payments.amount` |
| PRECIO VTA | `sales.sale_price` |
| TOTAL ENG. | `sales.down_payment` |
| P.I. | `reservations.reserva_amount` |
| CUOTA MES | computed installment |
| DIF. | variance from actual |

### Data Rows (unit + tower + status)

| Row | Unit | Tower | Status | Non-zero monthly values |
|-----|------|-------|--------|------------------------|
| R2 | 101 A | A | 4.Plan de pagos | 32 |
| R3 | 102 A | A | 4.Plan de pagos | 22 |
| R4 | 103 | A | #N/A | 7 |
| R5 | 104 A | A | 4.Plan de pagos | 23 |
| R6 | 105 A | A | 1.Disponible | 7 |
| R7 | 106 A | A | 4.Plan de pagos | 31 |
| R8 | 107 A | A | 4.Plan de pagos | 32 |
| R9 | 108 A | A | 4.Plan de pagos | 29 |
| R10 | 109 A | A | 4.Plan de pagos | 28 |
| R11 | 201 A | A | 4.Plan de pagos | 21 |
| R12 | 202 | A | #N/A | 7 |
| R13 | 203 A | A | 4.Plan de pagos | 7 |
| R14 | 204 | A | #N/A | 7 |
| R15 | 205 A | A | 4.Plan de pagos | 32 |
| R16 | 206 A | A | 4.Plan de pagos | 29 |
| R17 | 207 A | A | 4.Plan de pagos | 32 |
| R18 | 208 A | A | 4.Plan de pagos | 24 |
| R19 | 209 A | A | 4.Plan de pagos | 21 |
| R20 | 301 A | A | 4.Plan de pagos | 26 |
| R21 | 302 A | A | 4.Plan de pagos | 32 |
| R22 | 303 A | A | 4.Plan de pagos | 23 |
| R23 | 304 A | A | 4.Plan de pagos | 25 |
| R24 | 305 A | A | 2.Reservado | 5 |
| R25 | 306 A | A | 4.Plan de pagos | 11 |
| R26 | 307 A | A | 4.Plan de pagos | 30 |
| R27 | 308 A | A | 4.Plan de pagos | 28 |
| R28 | 309 A | A | 2.Reservado | 7 |
| R29 | 401 A | A | 4.Plan de pagos | 31 |
| R30 | 402 | A | #N/A | 7 |
| R31 | 403 A | A | 4.Plan de pagos | 29 |
| R32 | 404 A | A | 4.Plan de pagos | 23 |
| R33 | 405 A | A | 4.Plan de pagos | 27 |
| R34 | 406 A | A | 2.Reservado | 5 |
| R35 | 407 A | A | 4.Plan de pagos | 26 |
| R36 | 408 A | A | 4.Plan de pagos | 26 |
| R37 | 409 A | A | 4.Plan de pagos | 26 |
| R38 | 501 A | A | 4.Plan de pagos | 27 |
| R39 | 502 A | A | 4.Plan de pagos | 31 |
| R40 | 503 A | A | 4.Plan de pagos | 27 |
| R41 | 504 A | A | 4.Plan de pagos | 27 |
| R42 | 505 | A | #N/A | 7 |
| R43 | 506 A | A | 4.Plan de pagos | 23 |
| R44 | 507 A | A | 4.Plan de pagos | 27 |
| R45 | 508 A | A | 4.Plan de pagos | 27 |
| R46 | 509 A | A | 4.Plan de pagos | 21 |
| R47 | 601 A | A | 4.Plan de pagos | 30 |
| R48 | 602 A | A | 4.Plan de pagos | 32 |
| R49 | 603 A | A | 4.Plan de pagos | 29 |
| R50 | 604 A | A | 1.Disponible | 7 |
| R51 | 605 A | A | 4.Plan de pagos | 29 |
| R52 | 606 A | A | 4.Plan de pagos | 27 |
| R53 | 607 A | A | 2.Reservado | 5 |
| R54 | 608 A | A | 4.Plan de pagos | 7 |
| R55 | 609 A | A | 4.Plan de pagos | 32 |
| R56 | 101 B | B | 2.Reservado | 7 |
| R57 | 102 B | B | 2.Reservado | 7 |
| R58 | 103 B | B | 4.Plan de pagos | 7 |
| R59 | 104 B | B | 4.Plan de pagos | 29 |
| R60 | 105 B | B | 4.Plan de pagos | 28 |
| R61 | 106 B | B | 4.Plan de pagos | 28 |
| R62 | 107 B | B | 1.Disponible | 7 |
| R63 | 108 B | B | 4.Plan de pagos | 28 |
| R64 | 109 B | B | 4.Plan de pagos | 27 |
| R65 | 110 B | B | 2.Reservado | 7 |
| R66 | 111 B | B | 4.Plan de pagos | 27 |
| R67 | 112 B | B | 4.Plan de pagos | 28 |
| R68 | 113 B | B | 4.Plan de pagos | 27 |
| R69 | 201 B | B | 4.Plan de pagos | 32 |
| R70 | 202 B | B | 4.Plan de pagos | 25 |
| R71 | 203 B | B | 4.Plan de pagos | 27 |
| R72 | 204 B | B | 2.Reservado | 7 |
| R73 | 205 B | B | 2.Reservado | 7 |
| R74 | 206 B | B | 2.Reservado | 7 |
| R75 | 207 | B | #N/A | 7 |
| R76 | 208 B | B | 4.Plan de pagos | 27 |
| R77 | 209 B | B | 4.Plan de pagos | 29 |
| R78 | 210 | B | #N/A | 7 |
| R79 | 211 B | B | 4.Plan de pagos | 28 |
| R80 | 212 B | B | 4.Plan de pagos | 28 |
| R81 | 213 B | B | 4.Plan de pagos | 28 |
| R82 | 301 | B | #N/A | 7 |
| R83 | 302 B | B | 2.Reservado | 5 |
| R84 | 303 B | B | 4.Plan de pagos | 7 |
| R85 | 304 B | B | 4.Plan de pagos | 28 |
| R86 | 305 B | B | 4.Plan de pagos | 28 |
| R87 | 306 B | B | 4.Plan de pagos | 28 |
| R88 | 307 | B | #N/A | 7 |
| R89 | 308 B | B | 4.Plan de pagos | 29 |
| R90 | 309 B | B | 4.Plan de pagos | 28 |
| R91 | 310 B | B | 4.Plan de pagos | 7 |
| R92 | 311 B | B | 4.Plan de pagos | 27 |
| R93 | 312 B | B | 4.Plan de pagos | 29 |
| R94 | 313 B | B | 4.Plan de pagos | 29 |
| R95 | 401 B | B | 4.Plan de pagos | 7 |
| R96 | 402 B | B | 4.Plan de pagos | 29 |
| R97 | 403 B | B | 4.Plan de pagos | 7 |
| R98 | 404 B | B | 4.Plan de pagos | 7 |
| R99 | 405 | B | #N/A | 7 |
| R100 | 406 B | B | 4.Plan de pagos | 27 |
| R101 | 407 B | B | 4.Plan de pagos | 28 |
| R102 | 408 B | B | 4.Plan de pagos | 7 |
| R103 | 409 B | B | 4.Plan de pagos | 27 |
| R104 | 410 B | B | 2.Reservado | 7 |
| R105 | 411 B | B | 4.Plan de pagos | 29 |
| R106 | 412 B | B | 4.Plan de pagos | 28 |
| R107 | 413 B | B | 4.Plan de pagos | 27 |
| R108 | 501 B | B | 4.Plan de pagos | 29 |
| R109 | 502 B | B | 4.Plan de pagos | 28 |
| R110 | 503 B | B | 2.Reservado | 7 |
| R111 | 504 B | B | 4.Plan de pagos | 28 |
| R112 | 505 B | B | 4.Plan de pagos | 28 |
| R113 | 506 B | B | 4.Plan de pagos | 27 |
| R114 | 507 B | B | 4.Plan de pagos | 27 |
| R115 | 508 B | B | 4.Plan de pagos | 29 |
| R116 | 509 B | B | 4.Plan de pagos | 27 |
| R117 | 510 B | B | 4.Plan de pagos | 28 |
| R118 | 511 B | B | 4.Plan de pagos | 28 |
| R119 | 512 B | B | 4.Plan de pagos | 27 |
| R120 | 513 B | B | 4.Plan de pagos | 27 |
| R121 | 601 B | B | 4.Plan de pagos | 29 |
| R122 | 602 B | B | 4.Plan de pagos | 28 |
| R123 | 603 B | B | 2.Reservado | 7 |
| R124 | 604 B | B | 4.Plan de pagos | 29 |
| R125 | 605 B | B | 4.Plan de pagos | 27 |
| R126 | 606 B | B | 2.Reservado | 7 |
| R127 | 607 B | B | 4.Plan de pagos | 27 |
| R128 | 608 B | B | 4.Plan de pagos | 28 |
| R129 | 609 B | B | 4.Plan de pagos | 28 |
| R130 | 610 B | B | 4.Plan de pagos | 30 |
| R131 | 611 B | B | 4.Plan de pagos | 28 |
| R132 | 612 B | B | 4.Plan de pagos | 27 |
| R133 | 613 | B | #N/A | 7 |
| R134 | 101 C | C | 4.Plan de pagos | 34 |
| R135 | 102 C | C | 4.Plan de pagos | 34 |
| R136 | 103 C | C | 4.Plan de pagos | 35 |
| R137 | 104 C | C | 4.Plan de pagos | 34 |
| R138 | 105 C | C | 1.Disponible | 7 |
| R139 | 106 C | C | 2.Reservado | 5 |
| R140 | 107 C | C | 4.Plan de pagos | 34 |
| R141 | 108 C | C | 4.Plan de pagos | 34 |
| R142 | 109 C | C | 4.Plan de pagos | 7 |
| R143 | 110 | C | #N/A | 7 |
| R144 | 111 C | C | 2.Reservado | 7 |
| R145 | 201 C | C | 4.Plan de pagos | 35 |
| R146 | 202 C | C | 4.Plan de pagos | 33 |
| R147 | 203 C | C | 2.Reservado | 7 |
| R148 | 204 C | C | 2.Reservado | 7 |
| R149 | 205 | C | #N/A | 7 |
| R150 | 206 | C | #N/A | 7 |
| R151 | 207 | C | #N/A | 7 |
| R152 | 208 C | C | 4.Plan de pagos | 34 |
| R153 | 209 C | C | 4.Plan de pagos | 7 |
| R154 | 210 | C | #N/A | 7 |
| R155 | 211 | C | #N/A | 7 |
| R156 | 301 | C | #N/A | 7 |
| R157 | 302 C | C | 4.Plan de pagos | 33 |
| R158 | 303 C | C | 2.Reservado | 7 |
| R159 | 304 C | C | 4.Plan de pagos | 34 |
| R160 | 305 C | C | 1.Disponible | 7 |
| R161 | 306 C | C | 1.Disponible | 7 |
| R162 | 307 C | C | 4.Plan de pagos | 34 |
| R163 | 308 C | C | 4.Plan de pagos | 31 |
| R164 | 309 C | C | 2.Reservado | 7 |
| R165 | 310 C | C | 4.Plan de pagos | 7 |
| R166 | 311 C | C | 1.Disponible | 7 |
| R167 | 401 C | C | 2.Reservado | 7 |
| R168 | 402 | C | #N/A | 7 |
| R169 | 403 C | C | 4.Plan de pagos | 34 |
| R170 | 404 C | C | 4.Plan de pagos | 34 |
| R171 | 405 | C | #N/A | 7 |
| R172 | 406 C | C | 4.Plan de pagos | 31 |
| R173 | 407 C | C | 4.Plan de pagos | 33 |
| R174 | 408 C | C | 4.Plan de pagos | 34 |
| R175 | 409 | C | #N/A | 7 |
| R176 | 410 | C | #N/A | 7 |
| R177 | 411 | C | #N/A | 7 |
| R178 | 501 C | C | 4.Plan de pagos | 35 |
| R179 | 502 C | C | 4.Plan de pagos | 35 |
| R180 | 503 C | C | 4.Plan de pagos | 34 |
| R181 | 504 C | C | 2.Reservado | 7 |
| R182 | 505 | C | #N/A | 7 |
| R183 | 506 | C | #N/A | 7 |
| R184 | 507 C | C | 4.Plan de pagos | 33 |
| R185 | 508 C | C | 4.Plan de pagos | 34 |
| R186 | 509 C | C | 4.Plan de pagos | 34 |
| R187 | 510 C | C | 4.Plan de pagos | 35 |
| R188 | 511 | C | #N/A | 7 |
| R189 | 601 C | C | 4.Plan de pagos | 7 |
| R190 | 602 C | C | 2.Reservado | 7 |
| R191 | 603 C | C | 2.Reservado | 7 |
| R192 | 604 C | C | 2.Reservado | 7 |
| R193 | 605 C | C | 1.Disponible | 7 |
| R194 | 606 | C | #N/A | 7 |
| R195 | 607 C | C | 2.Reservado | 7 |
| R196 | 608 C | C | 4.Plan de pagos | 34 |
| R197 | 609 C | C | 4.Plan de pagos | 35 |
| R198 | 610 C | C | 4.Plan de pagos | 34 |
| R199 | 611 | C | #N/A | 7 |
| R200 | 101 D | D | 1.Disponible | 7 |
| R201 | 102 D | D | 1.Disponible | 7 |
| R202 | 103 D | D | 1.Disponible | 7 |
| R203 | 104 D | D | 1.Disponible | 7 |
| R204 | 105 D | D | 1.Disponible | 7 |
| R205 | 106 D | D | 1.Disponible | 7 |
| R206 | 107 D | D | 1.Disponible | 7 |
| R207 | 201 D | D | 1.Disponible | 7 |
| R208 | 202 | D | #N/A | 7 |
| R209 | 203 D | D | 1.Disponible | 7 |
| R210 | 204 D | D | 1.Disponible | 7 |
| R211 | 205 | D | #N/A | 7 |
| R212 | 206 | D | #N/A | 7 |
| R213 | 207 | D | #N/A | 7 |
| R214 | 301 | D | #N/A | 7 |
| R215 | 302 D | D | 1.Disponible | 7 |
| R216 | 303 D | D | 1.Disponible | 7 |
| R217 | 304 D | D | 2.Reservado | 5 |
| R218 | 305 D | D | 1.Disponible | 7 |
| R219 | 306 D | D | 1.Disponible | 7 |
| R220 | 307 | D | #N/A | 7 |
| R221 | 401 D | D | 1.Disponible | 7 |
| R222 | 402 | D | #N/A | 7 |
| R223 | 403 D | D | 1.Disponible | 7 |
| R224 | 404 D | D | 2.Reservado | 5 |
| R225 | 405 | D | #N/A | 7 |
| R226 | 406 D | D | 1.Disponible | 7 |
| R227 | 407 | D | #N/A | 7 |
| R228 | 501 D | D | 1.Disponible | 7 |
| R229 | 502 | D | #N/A | 7 |
| R230 | 503 D | D | 1.Disponible | 7 |
| R231 | 504 D | D | 1.Disponible | 7 |
| R232 | 505 | D | #N/A | 7 |
| R233 | 506 | D | #N/A | 7 |
| R234 | 507 | D | #N/A | 7 |
| R235 | 601 D | D | 1.Disponible | 7 |
| R236 | 602 D | D | 1.Disponible | 7 |
| R237 | 603 D | D | 1.Disponible | 7 |
| R238 | 604 D | D | 1.Disponible | 7 |
| R239 | 605 D | D | 2.Reservado | 5 |
| R240 | 606 | D | #N/A | 7 |
| R241 | 607 D | D | 1.Disponible | 7 |
| R242 | 101 E | E | 1.Disponible | 7 |
| R243 | 102 E | E | 1.Disponible | 7 |
| R244 | 103 E | E | 1.Disponible | 7 |
| R245 | 104 E | E | 1.Disponible | 7 |
| R246 | 105 E | E | 1.Disponible | 7 |
| R247 | 106 E | E | 1.Disponible | 7 |
| R248 | 107 E | E | 1.Disponible | 7 |
| R249 | 201 E | E | 1.Disponible | 7 |
| R250 | 202 | E | #N/A | 7 |
| R251 | 203 E | E | 1.Disponible | 7 |
| R252 | 204 E | E | 1.Disponible | 7 |
| R253 | 205 | E | #N/A | 7 |
| R254 | 206 | E | #N/A | 7 |
| R255 | 207 | E | #N/A | 7 |
| R256 | 301 | E | #N/A | 7 |
| R257 | 302 E | E | 1.Disponible | 7 |
| R258 | 303 E | E | 1.Disponible | 7 |
| R259 | 304 E | E | 1.Disponible | 7 |
| R260 | 305 E | E | 1.Disponible | 7 |
| R261 | 306 E | E | 1.Disponible | 7 |
| R262 | 307 | E | #N/A | 7 |
| R263 | 401 E | E | 1.Disponible | 7 |
| R264 | 402 | E | #N/A | 7 |
| R265 | 403 E | E | 1.Disponible | 7 |
| R266 | 501 E | E | 1.Disponible | 7 |
| R267 | 502 E | E | 1.Disponible | 7 |
| R268 | 503 E | E | 1.Disponible | 7 |
| R269 | 504 E | E | 1.Disponible | 7 |
| R270 | 505 E | E | 1.Disponible | 7 |
| R271 | 506 E | E | 1.Disponible | 7 |
| R272 | 507 E | E | 1.Disponible | 7 |
| R273 | 601 E | E | 1.Disponible | 7 |
| R274 | 602 E | E | 1.Disponible | 7 |
| R275 | 603 E | E | 1.Disponible | 7 |
| R276 | 604 E | E | 1.Disponible | 7 |
| R277 | 605 E | E | 1.Disponible | 7 |
| R278 | 606 E | E | 1.Disponible | 7 |
| R279 | 607 E | E | 1.Disponible | 7 |

---

## 18. RESUMEN BNT 2.0

**Purpose:** Benestare 2.0 summary dashboard. Company: INVERSIONES INMOBILIARIAS CHINAUTLA, S.A. Data as of 2026-03-31.
**Non-empty rows:** 10 | **Max columns:** 19

### DB Mapping

| Metric | DB Target |
|--------|-----------|
| Cobro esperado / efectuado mensual | budget vs `SUM(payments.amount)` current month |
| Cobro esperado / efectuado acumulado | budget vs `SUM(payments.amount)` to date |
| Total adeudado | `SUM(sales.down_payment - collected)` |
| ESTATUS counts | `COUNT(rv_units)` by status |

### All Data Rows

- **R2**: INVERSIONES INMOBILIARIAS CHINAUTLA, S.A.
- **R3**: BENESTARE
- **R4**: RESUMEN DE COBROS 
- **R5**: Datos al: | 2026-03-31
- **R7**: Resumen | Mensual | Acumulado
- **R8**: Cobro 
esperado | Cobro  
efectuado | Diferencia | % 
de cobro  | % 
de cobro pendiente | Cobro
esperado | Cobro 
efectuado | Diferencia | % 
de cobro  | % 
de cobro pendiente | Total adeudado | Diferencia | % 
 pendiente de cobro 
- **R9**: COBROS | 118781.00000000001 | 187820.21000000005 | 69039.21000000004 | ▲ | 1.5812310891472545 | 0.5812310891472544 | 1832458.4200000002 | 1796269.2600000002 | -36189.159999999916 | ▼ | 0.9802510334722903 | -0.01974896652770976 | 4340230.12 | 2543960.86 | ▼ | 0.5861350181128183
- **R11**: Resumen | Total Apartamentos | Cliente al día | Cliente atrasado | #NUM! | Disponible | Enganche completado | Superávit de Enganche | Pendiente Plan de Pagos | F&F
- **R12**: ESTATUS | 278 | 85 | 69 | 97 | 6 | 21 | 0 | 0 | 0
- **R13**: 1 | 0.3057553956834532 | 0.24820143884892087 | 0.3489208633093525 | 0.02158273381294964 | 0.07553956834532374 | 0 | 0 | 0

---

## 19. ALERTA BNT 2.0

**Purpose:** Benestare 2.0 alert/pivot table. Client payment status summary by bucket (Cliente al día, Cliente Atrasado, Disponible, Enganche Completado, Superávit). Project: BENESTARE.
**Non-empty rows:** 283 | **Max columns:** 18

### Column Headers (Row 6)

- **C**: Status Cliente
- **D**: Apto
- **E**: Cliente
- **F**: Cobro esperado mensual
- **G**: Cobro efectuado mensual
- **H**: Cobro esperado acumulado
- **I**: Cobro efectuado acumulado
- **J**: Total adeudado
- **K**: Número de Aptos
- **L**: Diferencia del mes
- **M**: % (difference %)
- **N**: Diferencia acumulado
- **O**: % (diff % accum)
- **P**: Diferencia Total adeudado

### Summary Rows (R7–R12)

| Row | Status Bucket | Exp Monthly | Act Monthly | Exp Accum | Act Accum | Total Owed | Count |
|-----|---------------|-------------|-------------|-----------|-----------|------------|-------|
| R7 | Cliente al día | 54586.17 | 100938.00000000001 | 486863.08 | 641171.23 | 2081540.06 | 85 |
| R8 | Cliente Atrasado | 64194.829999999994 | 40317.48 | 882884.29 | 630496.74 | 1768600 | 69 |
| R9 | Disponible | 0 |  | 0 | 0 |  | 97 |
| R10 | Enganche Completado | 0 | 24700 | 169921.04999999996 | 197299.99999999997 | 197300 | 6 |
| R11 | Superávit de Enganche | 0 | 21864.73 | 292790 | 327301.29000000004 | 292790.06 | 21 |
| R12 | Total general | 118781.00000000001 | 187820.21000000002 | 1832458.42 | 1796269.2600000005 | 4340230.12 | 278 |

---
## 20. Atrasados Benestare

**Purpose:** Benestare delinquent clients pivot. Lists each late-paying Benestare client with expected vs actual collections. Project: BENESTARE.
**Non-empty rows:** 74 | **Max columns:** 18

### Column Headers (Row 6)

- **C**: Apto
- **D**: Cliente
- **E**: Cobro esperado mensual
- **F**: Cobro efectuado mensual
- **G**: Cobro esperado acumulado
- **H**: Cobro efectuado acumulado
- **I**: Total adeudado
- **J**: Número de Aptos
- **L**: Diferencia del mes
- **M**: %
- **N**: Diferencia acumulado
- **O**: %
- **P**: Diferencia Total adeudado

### DB Mapping

| Column | DB Target |
|--------|-----------|
| Apto | `rv_units.unit_number` |
| Cliente | `rv_clients.full_name` |
| Cobro esperado mensual | budgeted from `enganche_schedule` |
| Cobro efectuado mensual | `SUM(payments.amount)` current month |
| Cobro esperado acumulado | cumulative budget to date |
| Cobro efectuado acumulado | `SUM(payments.amount)` to date |
| Total adeudado | `sales.down_payment` remaining |
| Diferencia del mes | variance month |
| Diferencia acumulado | variance cumulative |
| Diferencia Total adeudado | remaining owed |

### All Delinquent Client Rows (R7–R73)

| Row | Unit | Client | Exp Monthly | Act Monthly | Exp Accum | Act Accum | Total Owed | Diff Month | Diff Accum | Diff Total |
|-----|------|--------|-------------|-------------|-----------|-----------|------------|------------|------------|------------|
| R7 | 105 B | Perla Rocio Domingo Barrios | 1406 | 1500 | 5718 | 4501 | 25400 | -4218 | 20899 | 25399 |
| R8 | 108 B | 	Esvin Luciano Quino Suret | 1365 |  | 11055 | 7226 | 24700 | -11055 | 17474 | 24699 |
| R9 | 109 B | Carmen Odilia Escobar de León | 1488 | 1490 | 4476 | 2990 | 25300 | -2986 | 22310 | 25299 |
| R10 | 201 B | Andrea Celeste Aparicio Juárez | 0 |  | 24000.000000000007 | 24010 | 24000 | -24000.000000000007 | -10 | 23999 |
| R11 | 203 B | Norma Estela Guzman Yoque | 1513 |  | 4526 | 1500 | 25700 | -4526 | 24200 | 25699 |
| R12 | 104 A | Astrid Marleny Pineda González | 0 |  | 23900.000000000007 | 18900 | 23900 | -23900.000000000007 | 5000 | 23899 |
| R13 | 107 A | Helen Lorena Monroy Jauregui | 0 |  | 24000.000000000007 | 20863.070000000007 | 24000 | -24000.000000000007 | 3136.929999999993 | 23999 |
| R14 | 109 A | Orfa Sarai Santos Morales | 0 |  | 23899.999999999996 | 21411.04 | 23900 | -23899.999999999996 | 2488.959999999999 | 23899 |
| R15 | 205 A | Saulo Josue Escobar Pérez | 0 |  | 38499.99999999999 | 38469.96000000001 | 38500 | -38499.99999999999 | 30.039999999993597 | 38499 |
| R16 | 206 A | Cristina Elizabeth Musin Hernandez / Kelly Omar de Jesús Chacón Vasquez | 0 |  | 23999.999999999993 | 22815.779999999995 | 24000 | -23999.999999999993 | 1184.2200000000048 | 23999 |
| R17 | 209 A | Byron Amilcar Argueta Orrego / Sheila Roxana Ajcúc Hernández | 2320 | 2320 | 10780 | 8460 | 24700 | -8460 | 16240 | 24699 |
| R18 | 301 A | Erick Alejandro Martínez Morales | 1493.33 |  | 16433.3 | 8970 | 23900 | -16433.3 | 14930 | 23899 |
| R19 | 304 A | Saúl Esteban Mayén Santos | 0 |  | 23900.000000000004 | 21000 | 23900 | -23900.000000000004 | 2900 | 23899 |
| R20 | 403 A | Luis Fernando Tique Santos / Gabriela Zucelly Gonzáles de León | 0 |  | 23900.000000000007 | 14470 | 23900 | -23900.000000000007 | 9430 | 23899 |
| R21 | 404 A | Amanda Aracely Castillo Guzmán | 0 | 1800 | 100000 | 27500 | 100000 | -98200 | 72500 | 99999 |
| R22 | 407 A | Marvin Leonel Alexander Larias Guzmán | 0 |  | 23900 | 22437.5 | 23900 | -23900 | 1462.5 | 23899 |
| R23 | 504 A | Diego Estuardo Salguero Salvatierra / Iveth Esmeralda Pereira Pérez | 1400 | 1400 | 14100 | 12700 | 23900 | -12700 | 11200 | 23899 |
| R24 | 506 A | Cintia Noemy Díaz Díaz / Alan Emanuel Tunche Huertas | 1866.67 | 1867 | 20166.699999999997 | 17851 | 23900 | -18299.699999999997 | 6049 | 23899 |
| R25 | 507 A | Edwin Alexander Amado Toc / Jennifer Alexa Castañeda Alvarez | 1400 |  | 14100 | 1500 | 23900 | -14100 | 22400 | 23899 |
| R26 | 601 A | Santos Sebastián Pastor Velásquez | 0 |  | 23900 | 23900 | 23900 | -23900 | 0 | 23899 |
| R27 | 603 A | Andrea Isabel Tezen Cabrera / Leyla Mariela Cabrera Gonzales | 0 |  | 23999.999999999993 | 22815.77999999999 | 24000 | -23999.999999999993 | 1184.2200000000084 | 23999 |
| R28 | 605 A | Luis Fernando Moreno Pozuelos | 0 |  | 18500 | 15815.839999999997 | 18500 | -18500 | 2684.1600000000035 | 18499 |
| R29 | 606 A | Ilse Mariela Rosales Díaz | 1400 |  | 14100 | 7100 | 23900 | -14100 | 16800 | 23899 |
| R30 | 609 A | Erik Estuardo Carrera Cruz | 0 |  | 24000.000000000007 | 20863.550000000007 | 24000 | -24000.000000000007 | 3136.4499999999935 | 23999 |
| R31 | 106 B | Telma Estela Barrios Vicente | 1406 | 1500 | 5718 | 4500 | 25400 | -4218 | 20900 | 25399 |
| R32 | 202 B | Carlos Humberto Joel Alvizures Carmona / Katherine Areli Turcios Alvarez | 0 |  | 23900.000000000004 | 5973.32 | 23900 | -23900.000000000004 | 17926.68 | 23899 |
| R33 | 213 B | Blanca Iris García Figueroa de Jocol / Ricardo Ernesto Jocol Molina | 1364.71 |  | 11052.969999999998 | 6941.1900000000005 | 24700 | -11052.969999999998 | 17758.809999999998 | 24699 |
| R34 | 305 B | Dulce Rocío Medrano Barrera | 1347 |  | 10929 | 4194.12 | 24400 | -10929 | 20205.88 | 24399 |
| R35 | 306 B | Sara Fernanda Enrique Lemus | 1347 | 1500 | 10929 | 10500 | 24400 | -9429 | 13900 | 24399 |
| R36 | 310 B | Debora Marie Castillo Ventura | 0 | 1513 | 0 | 3013 | 25700 | 1513 | 22687 | 25699 |
| R37 | 311 B | Lesly Marisol de León Villanueva | 1513 | 1500 | 4526 | 4500 | 25700 | -3026 | 21200 | 25699 |
| R38 | 312 B | Julian Guillermo Ramirez García / Sulma Korina Hernández Aguilar | 1272.22 | 1431.25 | 11677.76 | 11518.75 | 24400 | -10246.51 | 12881.25 | 24399 |
| R39 | 313 B | Suarlim Elí Barrientos Pazos / Angel Elí Barrientos Castro | 1272.22 |  | 11677.76 | 10405.54 | 24400 | -11677.76 | 13994.46 | 24399 |
| R40 | 402 B | Rigoberto Gabriel López | 1450 | 1450 | 4400 | 4400 |  | -2950 | -4400 | -1 |
| R41 | 404 B | José Luis García Macal | 0 | 1340 | 0 | 5539.53 | 24600 | 1340 | 19060.47 | 24599 |
| R42 | 409 B | Kevin Fernando de la Cruz Toc | 1400 |  | 12700 | 9900 | 23900 | -12700 | 14000 | 23899 |
| R43 | 412 B | Edgar Manfredo Hernández Cabrera | 1365 |  | 11055 | 5595 | 24700 | -11055 | 19105 | 24699 |
| R44 | 502 B | Jurgen Alexander Hernández Camposeco | 1365 | 1350 | 11055 | 9615 | 24700 | -9705 | 15085 | 24699 |
| R45 | 505 B | Yenifer Estefania Santos Gonzáles / Juan Eduardo Flores Barrera | 1364.71 | 1400 | 11052.969999999998 | 9400 | 24700 | -9652.969999999998 | 15300 | 24699 |
| R46 | 506 B | Hugo Alexander Méndez Caal | 1450 | 1450 | 10200 | 8700 | 24700 | -8750 | 16000 | 24699 |
| R47 | 508 B | Jorge Mario Santizo Lacayo | 1272.22 |  | 11677.76 | 4046 | 24400 | -11677.76 | 20354 | 24399 |
| R48 | 509 B | Diego José Ortíz Cordero | 1450 |  | 10200 | 1500 | 24700 | -10200 | 23200 | 24699 |
| R49 | 510 B | Angel Gabriel Coc Gómez | 1347.06 |  | 10929.419999999998 | 1500 | 24400 | -10929.419999999998 | 22900 | 24399 |
| R50 | 513 B | Karen Ivonne Poggio | 1450 | 1450 | 10200 | 8750 | 24700 | -8750 | 15950 | 24699 |
| R51 | 602 B | Mario René Ruiz Poncio | 1395 |  | 5685 | 4500 | 25200 | -5685 | 20700 | 25199 |
| R52 | 604 B | Caterin Fidelina Calderón de Ortiz | 1272.22 |  | 11677.76 | 2700 | 24400 | -11677.76 | 21700 | 24399 |
| R53 | 607 B | Cindy Yessenia Paredes Bolaños | 1118 |  | 3736 | 2618 | 19400 | -3736 | 16782 | 19399 |
| R54 | 608 B | Belter Anibal Collado López | 1364.71 | 1300 | 11052.969999999998 | 10600 | 24700 | -9752.969999999998 | 14100 | 24699 |
| R55 | 611 B | Marleny Aracely Jocol García de Grajeda / Luis Alberto Grajeda López | 1347.06 |  | 10929.419999999998 | 5543.0599999999995 | 24400 | -10929.419999999998 | 18856.940000000002 | 24399 |
| R56 | 612 B | Linda Esmeralda Molina Najarro / Diego Mauricio Hernández Alveño | 1513 | 3026 | 4526 | 4526 | 25700 | -1500 | 21174 | 25699 |
| R57 | 102 C | Luis Carlos Rodriguez Arias / Katherine Andrea Enriquez Estrada | 1005 |  | 5520 | 2500 | 24600 | -5520 | 22100 | 24599 |
| R58 | 104 C | Oscar Josue Robledo Sagastume | 1008.7 |  | 6543.499999999999 | 2508.7 | 24700 | -6543.499999999999 | 22191.3 | 24699 |
| R59 | 107 C | Amelita Natali Aguilar López | 1009 | 2018 | 5536 | 4527 | 24700 | -3518 | 20173 | 24699 |
| R60 | 201 C | Angie Soleyne Camacho Suarez | 967 |  | 7302 | 6344 | 24700 | -7302 | 18356 | 24699 |
| R61 | 208 C | Junior Abraham Boror Ramos / Jéssica Marlene Ramos Ajanel | 1061 | 1061 | 4444 | 3383 | 24600 | -3383 | 21217 | 24599 |
| R62 | 307 C | Wendy Guadalupe Bran Cedillo | 1009 |  | 5536 | 3509.09 | 24700 | -5536 | 21190.91 | 24699 |
| R63 | 310 C | Steven Adolfo Paredes Cabrera / Milca Saraí Barrieos Ixcoy | 0 | 1600 | 0 | 6300 | 35200 | 1600 | 28900 | 35199 |
| R64 | 403 C | Elsa Mireya Quinteros García Hernández / Oswaldo Robert Karl Hernández | 1005 | 1000 | 6525 | 4500 | 24600 | -5525 | 20100 | 24599 |
| R65 | 404 C | Sandra Lizeth Sunuc Velásquez | 1009 |  | 7554 | 2509 | 24700 | -7554 | 22191 | 24699 |
| R66 | 408 C | Yohana Elizabeth Arrivillaga Fajardo | 1005 |  | 5520 | 3610 | 24600 | -5520 | 20990 | 24599 |
| R67 | 501 C | Gerson Ranferi Porras Galindo | 967 |  | 6335 | 4401 | 24700 |  |  |  |
| R68 | 502 C | Christian Isaias Patzán Mancilla / Nancy Johanna Mancilla Ramírez de Ortega | 975 | 975 | 7350 | 5405 | 24900 |  |  |  |
| R69 | 503 C | Abner Manolo Barrios Herrera | 1018 |  | 6590 | 4554 | 24900 |  |  |  |
| R70 | 507 C | Juan Daniel Quiñónez Márquez | 1041 | 1040.23 | 5664 | 5660.92 | 24400 |  |  |  |
| R71 | 509 C | Otylio Alexander García Orantes | 1018 |  | 6590 | 5572 | 24900 |  |  |  |
| R72 | 608 C | Yully Aydaly Soto Higueros | 1018 |  | 6590 | 5572 | 24900 |  |  |  |
| R73 | 609 C | Natalie Elizabeth Pacheco Menéndez de Gonzáles | 963 |  | 5352 | 300 | 24600 |  |  |  |

---

## 21. BL-TAPIAS 2.0

**Purpose:** Bosque Las Tapias current/canonical version (2.0). Towers B and C. Company: INVERSIONES DE CASTILLA, S.A. Data through 2026-03-31. Includes Towers B (new) and C (existing). Desistimientos section at bottom.
**Non-empty rows:** 272 | **Max columns:** 53

### Column Headers (Row 6)

- **B**: Apto
- **C**: Tipo / Modelo
- **D**: Torre
- **E**: Vendedor
- **F**: Cliente
- **G**: Fecha Reserva
- **H**: Estatus
- **I**: Precio de Venta
- **J**: Enganche
- **K**: 2025-03-31
- **L**: 2025-04-30
- **M**: 2025-05-31
- **N**: 2025-06-30
- **O**: 2025-07-31
- **P**: 2025-08-31
- **Q**: 2025-09-30
- **R**: 2025-10-31
- **S**: 2025-11-30
- **T**: 2025-12-31
- **U**: 2026-01-31
- **V**: 2026-02-28
- **W**: 2026-03-31
- **X**: TOTAL COBROS Y RESERVAS
- **Y**: % Cobro
- **Z**: SALDO PENDIENTE ENGANCHE
- **AA**: % Pendiente
- **AB**: Monto a Financiar por Banco
- **AC**: % a Financiar
- **AD**: Proyección de Cobros (S/ Modelo Financiero)
- **AE**: Status inmueble
- **AF**: Status Cliente
- **AG**: Cuotas Pactadas
- **AH**: Cuota de Enganche
- **AI**: Total cuotas pactadas
- **AJ**: Monto de Reserva Pactado
- **AK**: Monto de Cuota Pactada
- **AL**: Cuotas Pagadas
- **AM**: Cantidad de cuotas que deben estar pagadas
- **AN**: Monto que debe estar cancelado a la fecha
- **AO**: Monto pagado de cuotas a la fecha
- **AP**: Enganche + Cuotas Extraordinarias Pagadas
- **AQ**: Diferencia
- **AR**: Cobro adicional a lo pactado
- **AS**: Cobro no realizado según lo pactado
- **AT**: Cuotas
- **AU**: Caso Especial / F&F
- **AV**: Observaciones
- **AW**: DIF MONTO QUE DEBE ESTAR CANCELADO-INGRESO REAL
- **AX**: CUOTAS PENDIENTES
- **AY**: Cuota mes
- **AZ**: Acumulado
- **BA**: Enganche II

### DB Mapping

| Column | DB Target |
|--------|-----------|
| Apto | `rv_units.unit_number` |
| Tipo / Modelo | `rv_units.unit_type` |
| Torre | `towers.name` |
| Vendedor | `salespeople.name` |
| Cliente | `rv_clients.full_name` |
| Fecha Reserva | `reservations.created_at` |
| Estatus | `rv_units.status` |
| Precio de Venta | `sales.sale_price` |
| Enganche | `sales.down_payment` |
| Date columns (2025-03 … 2026-03) | `payments.payment_date` + `payments.amount` |
| TOTAL COBROS Y RESERVAS | `SUM(payments.amount)` |
| Cuotas Pactadas | `sales.cuotas_enganche` |
| Monto de Reserva Pactado | `reservations.reserva_amount` |
| Cuotas Pagadas | `COUNT(payments)` phase 2 |
| Caso Especial / F&F | `rv_clients.is_ff` |
| DIF MONTO QUE DEBE ESTAR CANCELADO-INGRESO REAL | computed: expected_paid - actual_paid |

### Data Rows (R7–R234)

| Row | Unit | Type | Tower | Salesperson | Client | Date | Status | Price (GTQ) | Enganche (GTQ) |
|-----|------|------|-------|-------------|--------|------|--------|-------------|----------------|
| R7 | 101 B | B | B |  |  |  | 1.Disponible | 668000 |  |
| R8 | 102 B | C | B |  |  |  | 1.Disponible | 668000 |  |
| R9 | 103 B | C | B |  |  |  | 1.Disponible | 668000 |  |
| R10 | 104 B | B | B |  |  |  | 1.Disponible | 668000 |  |
| R11 | 105 B | A | B |  |  |  | 1.Disponible | 581100 |  |
| R12 | 106 B | B | B |  |  |  | 1.Disponible | 668000 |  |
| R13 | 107 B | C | B |  |  |  | 1.Disponible | 668000 |  |
| R14 | 108 B | C | B |  |  |  | 1.Disponible | 668000 |  |
| R15 | 109 B | B | B |  |  |  | 1.Disponible | 668000 |  |
| R16 | 201 B | B | B |  |  |  | 1.Disponible | 668000 |  |
| R17 | 202 B | C  | B |  |  |  | 1.Disponible | 668000 |  |
| R18 | 203 B | C  | B |  |  |  | 1.Disponible | 668000 |  |
| R19 | 204 B | B | B |  |  |  | 1.Disponible | 668000 |  |
| R20 | 205 B | A  | B |  |  |  | 1.Disponible | 581100 |  |
| R21 | 206 B | B  | B |  |  |  | 1.Disponible | 668000 |  |
| R22 | 207 B | C  | B |  |  |  | 1.Disponible | 668000 |  |
| R23 | 208 B | C  | B |  |  |  | 1.Disponible | 668000 |  |
| R24 | 209 B | B  | B |  |  |  | 1.Disponible | 668000 |  |
| R25 | 301 B | B | B |  |  |  | 1.Disponible | 668000 |  |
| R26 | 302 B | C  | B |  |  |  | 1.Disponible | 668000 |  |
| R27 | 303 B | C  | B |  |  |  | 1.Disponible | 668000 |  |
| R28 | 304 B | B | B |  |  |  | 1.Disponible | 668000 |  |
| R29 | 305 B | A  | B |  |  |  | 1.Disponible | 581100 |  |
| R30 | 306 B | B  | B |  |  |  | 1.Disponible | 668000 |  |
| R31 | 307 B | C  | B |  |  |  | 1.Disponible | 668000 |  |
| R32 | 308 B | C  | B |  |  |  | 1.Disponible | 668000 |  |
| R33 | 309 B | B  | B |  |  |  | 1.Disponible | 668000 |  |
| R34 | 401 B | B | B |  |  |  | 1.Disponible | 668000 |  |
| R35 | 402 B | C  | B |  |  |  | 1.Disponible | 668000 |  |
| R36 | 403 B | C  | B |  |  |  | 1.Disponible | 668000 |  |
| R37 | 404 B | B | B |  |  |  | 1.Disponible | 668000 |  |
| R38 | 405 B | A  | B |  |  |  | 1.Disponible | 581100 |  |
| R39 | 406 B | B  | B |  |  |  | 1.Disponible | 668000 |  |
| R40 | 407 B | C  | B |  |  |  | 1.Disponible | 668000 |  |
| R41 | 408 B | C  | B |  |  |  | 1.Disponible | 668000 |  |
| R42 | 409 B | B  | B |  |  |  | 1.Disponible | 668000 |  |
| R43 | 501 B | B | B |  |  |  | 1.Disponible | 668000 |  |
| R44 | 502 B | C  | B |  |  |  | 1.Disponible | 668000 |  |
| R45 | 503 B | C  | B |  |  |  | 1.Disponible | 668000 |  |
| R46 | 504 B | B | B |  |  |  | 1.Disponible | 668000 |  |
| R47 | 505 B | A  | B |  |  |  | 1.Disponible | 581100 |  |
| R48 | 506 B | B  | B |  |  |  | 1.Disponible | 668000 |  |
| R49 | 507 B | C  | B |  |  |  | 1.Disponible | 668000 |  |
| R50 | 508 B | C  | B |  |  |  | 1.Disponible | 668000 |  |
| R51 | 509 B | B  | B |  |  |  | 1.Disponible | 668000 |  |
| R52 | 601 B | B | B |  |  |  | 1.Disponible | 668000 |  |
| R53 | 602 B | C  | B |  |  |  | 1.Disponible | 668000 |  |
| R54 | 603 B | C  | B |  |  |  | 1.Disponible | 668000 |  |
| R55 | 604 B | B | B |  |  |  | 1.Disponible | 668000 |  |
| R56 | 605 B | A  | B |  |  |  | 1.Disponible | 581100 |  |
| R57 | 606 B | B  | B |  |  |  | 1.Disponible | 668000 |  |
| R58 | 607 B | C  | B |  |  |  | 1.Disponible | 668000 |  |
| R59 | 608 B | C  | B |  |  |  | 1.Disponible | 668000 |  |
| R60 | 609 B | B  | B |  |  |  | 1.Disponible | 668000 |  |
| R61 | 701 B | B | B |  |  |  | 1.Disponible | 668000 |  |
| R62 | 702 B | C  | B | Paula Hernandez | Josué Emanuel Corado Lara / Karen Celeste Morales Júarez | 2026-03-02 | 2.Reservado | 668000 |  |
| R63 | 703 B | C  | B |  |  |  | 1.Disponible | 668000 |  |
| R64 | 704 B | B | B |  |  |  | 1.Disponible | 668000 |  |
| R65 | 705 B | A  | B |  |  |  | 1.Disponible | 581100 |  |
| R66 | 706 B | B  | B |  |  |  | 1.Disponible | 668000 |  |
| R67 | 707 B | C  | B |  |  |  | 1.Disponible | 668000 |  |
| R68 | 708 B | C  | B |  |  |  | 1.Disponible | 668000 |  |
| R69 | 709 B | B  | B |  |  |  | 1.Disponible | 668000 |  |
| R70 | 801 B | B | B |  |  |  | 1.Disponible | 668000 |  |
| R71 | 802 B | C  | B |  |  |  | 1.Disponible | 668000 |  |
| R72 | 803 B | C  | B |  |  |  | 1.Disponible | 668000 |  |
| R73 | 804 B | B | B |  |  |  | 1.Disponible | 668000 |  |
| R74 | 805 B | A  | B |  |  |  | 1.Disponible | 581100 |  |
| R75 | 806 B | B  | B |  |  |  | 1.Disponible | 668000 |  |
| R76 | 807 B | C  | B |  |  |  | 1.Disponible | 668000 |  |
| R77 | 808 B | C  | B |  |  |  | 1.Disponible | 668000 |  |
| R78 | 809 B | B  | B |  |  |  | 1.Disponible | 668000 |  |
| R79 | 901 B | B | B |  |  |  | 1.Disponible | 668000 |  |
| R80 | 902 B | C  | B |  |  |  | 1.Disponible | 668000 |  |
| R81 | 903 B | C  | B |  |  |  | 1.Disponible | 668000 |  |
| R82 | 904 B | B | B |  |  |  | 1.Disponible | 668000 |  |
| R83 | 905 B | A  | B |  |  |  | 1.Disponible | 581100 |  |
| R84 | 906 B | B  | B |  |  |  | 1.Disponible | 668000 |  |
| R85 | 907 B | C  | B |  |  |  | 1.Disponible | 668000 |  |
| R86 | 908 B | C  | B |  |  |  | 1.Disponible | 668000 |  |
| R87 | 909 B | B  | B |  |  |  | 1.Disponible | 668000 |  |
| R88 | 1001 B | B | B |  |  |  | 1.Disponible | 668000 |  |
| R89 | 1002 B | C  | B |  |  |  | 1.Disponible | 668000 |  |
| R90 | 1003 B | C  | B |  |  |  | 1.Disponible | 668000 |  |
| R91 | 1004 B | B | B |  |  |  | 1.Disponible | 668000 |  |
| R92 | 1005 B | A  | B |  |  |  | 1.Disponible | 581100 |  |
| R93 | 1006 B | B  | B |  |  |  | 1.Disponible | 668000 |  |
| R94 | 1007 B | C  | B |  |  |  | 1.Disponible | 668000 |  |
| R95 | 1008 B | C  | B |  |  |  | 1.Disponible | 668000 |  |
| R96 | 1009 B | B  | B |  |  |  | 1.Disponible | 668000 |  |
| R97 | 1101 B | B | B |  |  |  | 1.Disponible | 668000 |  |
| R98 | 1102 B | C  | B |  |  |  | 1.Disponible | 668000 |  |
| R99 | 1103 B | C  | B |  |  |  | 1.Disponible | 668000 |  |
| R100 | 1104 B | B | B |  |  |  | 1.Disponible | 668000 |  |
| R101 | 1105 B | A  | B |  |  |  | 1.Disponible | 581100 |  |
| R102 | 1106 B | B  | B |  |  |  | 1.Disponible | 668000 |  |
| R103 | 1107 B | C  | B |  |  |  | 1.Disponible | 668000 |  |
| R104 | 1108 B | C  | B |  |  |  | 1.Disponible | 668000 |  |
| R105 | 1109 B | B  | B |  |  |  | 1.Disponible | 668000 |  |
| R106 | 1201 B | B | B |  |  |  | 1.Disponible | 668000 |  |
| R107 | 1202 B | C  | B |  |  |  | 1.Disponible | 668000 |  |
| R108 | 1203 B | C  | B |  |  |  | 1.Disponible | 668000 |  |
| R109 | 1204 B | B | B |  |  |  | 1.Disponible | 668000 |  |
| R110 | 1205 B | A  | B |  |  |  | 1.Disponible | 581100 |  |
| R111 | 1206 B | B  | B |  |  |  | 1.Disponible | 668000 |  |
| R112 | 1207 B | C  | B |  |  |  | 1.Disponible | 668000 |  |
| R113 | 1208 B | C  | B |  |  |  | 1.Disponible | 668000 |  |
| R114 | 1209 B | B  | B |  |  |  | 1.Disponible | 668000 |  |
| R115 | 1301 B | B | B |  |  |  | 1.Disponible | 668000 |  |
| R116 | 1302 B | C  | B |  |  |  | 1.Disponible | 668000 |  |
| R117 | 1303 B | C  | B |  |  |  | 1.Disponible | 668000 |  |
| R118 | 1304 B | B | B |  |  |  | 1.Disponible | 668000 |  |
| R119 | 1305 B | A  | B | José Gutierrez | Evelin Yanira Ramos Regalado | 2026-02-16 | 2.Reservado | 581100 |  |
| R120 | 1306 B | B  | B |  |  |  | 1.Disponible | 668000 |  |
| R121 | 1307 B | C  | B | Pablo Marroquín | José Ariel Miranda Aldana | 2026-03-08 | 2.Reservado | 668000 |  |
| R122 | 1308 B | C  | B |  |  |  | 1.Disponible | 668000 |  |
| R123 | 1309 B | B  | B |  |  |  | 1.Disponible | 668000 |  |
| R124 | 101 C | A PLUS | C | Paula Hernandez | Favio Javier Estrada Quiñonez y Candida Eva Daniela Ramirez Lopez | 2025-09-27 | 4.Plan de Pagos | 665200 | 46600 |
| R125 | 102 C | C PLUS | C |  |  |  | 1.Disponible | 995500 | 69685 |
| R126 | 103 C | C PLUS | C |  |  |  | 1.Disponible | 995500 | 69685 |
| R127 | 104 C | A PLUS | C | José Gutierrez | Carlos Alfonso Castro Martinez | 2025-07-18 | 4.Plan de Pagos | 655200 | 46000 |
| R128 | 105 C | A PLUS | C |  |  |  | 1.Disponible | 655200 | 46000 |
| R129 | 106 C | B PLUS | C | José Gutierrez | Natanael de Jesus Gaitan Gomez / Karen Mariles Navas Castro de Muralles | 2025-07-28 | 4.Plan de Pagos | 814900 | 58000 |
| R130 | 107 C | C PLUS | C | José Gutierrez | Sarai del Rosario Muralles Navas de Garcia / Luis Enrique Garcia Tebelan | 2025-07-28 | 4.Plan de Pagos | 853600 | 60000 |
| R131 | 108 C | C PLUS | C |  |  |  | 1.Disponible | 995700 | 69699 |
| R132 | 109 C | B PLUS | C |  |  |  | 1.Disponible | 847700 | 59339.00000000001 |
| R133 | 201 C | A  | C |  |  |  | 1.Disponible | 622000 | 43540.00000000001 |
| R134 | 202 C | C  | C |  |  |  | 1.Disponible | 817300 | 57211.00000000001 |
| R135 | 203 C | C  | C |  |  |  | 1.Disponible | 817300 | 57211.00000000001 |
| R136 | 204 C | A  | C |  |  |  | 1.Disponible | 622000 | 43540.00000000001 |
| R137 | 205 C | A  | C |  |  |  | 1.Disponible | 622000 | 43540.00000000001 |
| R138 | 206 C | B  | C |  |  |  | 1.Disponible | 794400 | 55608.00000000001 |
| R139 | 207 C | C  | C |  |  |  | 1.Disponible | 817300 | 57211.00000000001 |
| R140 | 208 C | C  | C |  |  |  | 1.Disponible | 817300 | 57211.00000000001 |
| R141 | 209 C | B  | C |  |  |  | 1.Disponible | 794400 | 55608.00000000001 |
| R142 | 301 C | A  | C |  |  |  | 1.Disponible | 622000 | 43540.00000000001 |
| R143 | 302 C | C  | C | José Gutierrez | Claudia Maria Gatica Ramirez | 2026-01-08 | 4.Plan de Pagos | 744000 | 52100 |
| R144 | 303 C | C  | C | Paula Hernandez | Luis Armando Chávez Camo | 2025-11-09 | 4.Plan de Pagos | 744000 | 52100 |
| R145 | 304 C | A  | C |  |  |  | 1.Disponible | 622000 | 43540.00000000001 |
| R146 | 305 C | A  | C |  |  |  | 1.Disponible | 622000 | 43540.00000000001 |
| R147 | 306 C | B  | C |  |  |  | 1.Disponible | 794400 | 55608.00000000001 |
| R148 | 307 C | C  | C |  |  |  | 1.Disponible | 926600 | 64862.00000000001 |
| R149 | 308 C | C  | C |  |  |  | 1.Disponible | 926600 | 64862.00000000001 |
| R150 | 309 C | B  | C |  |  |  | 1.Disponible | 794400 | 55608.00000000001 |
| R151 | 401 C | A  | C | Paula Hernandez | Carlos Eduardo Celada | 2025-08-01 | 4.Plan de Pagos | 622000 | 44000 |
| R152 | 402 C | C  | C | Pedro Pablo Sarti | Lina Judith Conde Gomez de León  | 2025-05-22 | 4.Plan de Pagos | 898802 | 60002 |
| R153 | 403 C | C  | C |  |  |  | 1.Disponible | 926600 | 64862.00000000001 |
| R154 | 404 C | A  | C |  |  |  | 1.Disponible | 622000 | 43540.00000000001 |
| R155 | 405 C | A | C |  |  |  | 1.Disponible | 622000 | 43540.00000000001 |
| R156 | 406 C | B  | C |  |  |  | 1.Disponible | 794400 | 55608.00000000001 |
| R157 | 407 C | C  | C |  |  |  | 1.Disponible | 926600 | 64862.00000000001 |
| R158 | 408 C | C  | C |  |  |  | 1.Disponible | 926600 | 64862.00000000001 |
| R159 | 409 C | B  | C |  |  |  | 1.Disponible | 794400 | 55608.00000000001 |
| R160 | 501 C | A  | C | Efrén Sanchez | Kenneth David Cetino Ortiz / Hazel Suscely Cetino Ortiz | 2025-05-17 | 4.Plan de Pagos | 603340 | 60340 |
| R161 | 502 C | C  | C | Paula Hernandez | Byron Omar Yapur Ponce | 2025-10-16 | 2.Reservado | 744000 | 52100 |
| R162 | 503 C | C  | C | José Gutierrez | Albert Francescoli de Jesús Ortiz Pineda / Ana Gabriela Morale Chajón | 2025-10-13 | 4.Plan de Pagos | 744000 | 52100 |
| R163 | 504 C | A  | C | Paula Hernandez | Zoila Josabeth Lantan López / Jose Andres Pich Cuxulic | 2025-07-06 | 4.Plan de Pagos | 622000 | 44000 |
| R164 | 505 C | A  | C |  |  |  | 1.Disponible | 622000 | 44000 |
| R165 | 506 C | B  | C | Antonio Rada | Shirley Hilene Recinos | 2025-05-19 | 4.Plan de Pagos | 770568 | 53968 |
| R166 | 507 C | C  | C |  |  |  | 1.Disponible | 926600 | 64862.00000000001 |
| R167 | 508 C | C  | C |  |  |  | 1.Disponible | 926600 | 64862.00000000001 |
| R168 | 509 C | B  | C |  |  |  | 1.Disponible | 794400 | 55608.00000000001 |
| R169 | 601 C | A  | C | Paula Hernandez | Claudia Anaí Franco Díaz | 2025-09-08 | 4.Plan de Pagos | 636400 | 44600 |
| R170 | 602 C | C  | C | José Gutierrez | Julio Ernesto Garcia Archila / Blaca Estela Gonzales Cedillo | 2025-10-12 | 4.Plan de Pagos | 744000 | 52100 |
| R171 | 603 C | C  | C |  |  |  | 1.Disponible | 744000 | 52100 |
| R172 | 604 C | A  | C | Paula Hernandez | Lilian Jeanette Paz García de Zapete | 2025-07-26 | 4.Plan de Pagos | 636400 | 44500 |
| R173 | 605 C | A  | C | Paula Hernandez | Josue Roberto Fajardo Chiguil / Emilly Jazmin Vasquez Morales  | 2025-08-03 | 4.Plan de Pagos | 636400 | 45000 |
| R174 | 606 C | B  | C |  |  |  | 1.Disponible | 813000 | 56910.00000000001 |
| R175 | 607 C | C  | C |  |  |  | 1.Disponible | 945900 | 66213 |
| R176 | 608 C | C  | C | Paula Hernandez | Jefersón Michael Sandoval Orozco / Helen Susana Cano Ruballo | 2025-12-22 | 2.Reservado | 945900 | 66213 |
| R177 | 609 C | B  | C |  |  |  | 1.Disponible | 813000 | 56910.00000000001 |
| R178 | 701 C | A  | C | Pedro Pablo Sarti | Manolo de Jesús Milian Martínez | 2025-05-26 | 4.Plan de Pagos | 636400 | 63700 |
| R179 | 702 C | C  | C |  |  |  | 1.Disponible | 744000 | 52100 |
| R180 | 703 C | C  | C | José Gutierrez | Pedro Alberto Garcia Guzman | 2025-10-18 | 4.Plan de Pagos | 744000 | 52100 |
| R181 | 704 C | A  | C | José Gutierrez | Marvin Estuardo Pineda Rodriguez | 2025-07-05 | 4.Plan de Pagos | 636400 | 45000 |
| R182 | 705 C | A  | C | José Gutierrez | Brian Alexis Velasquez Rodriguez  | 2025-07-05 | 4.Plan de Pagos | 636400 | 45000 |
| R183 | 706 C | B  | C | Paula Hernandez | Christopher Geovanny Umaña Luna | 2026-01-05 | 4.Plan de Pagos | 744000 | 52100 |
| R184 | 707 C | C  | C | José Gutierrez | Juan Antonio Tortola  Oliva | 2026-01-27 | 2.Reservado | 945900 | 66213 |
| R185 | 708 C | C  | C | José Gutierrez | Lesbia Fernanda Flores Garcia / Bryan Alexander Suret Valenzuela | 2025-10-27 | 4.Plan de Pagos | 744000 | 52100 |
| R186 | 709 C | B  | C | José Gutierrez | Yury Julio Roberto de Jesus Urrutia Valdez / María de los Angeles de León Manrique | 2026-01-10 | 4.Plan de Pagos | 744000 | 52100 |
| R187 | 801 C | A  | C |  |  |  | 1.Disponible | 636400 | 44548.00000000001 |
| R188 | 802 C | C  | C | Paula Hernandez | María Jose Boche Barillas | 2026-03-03 | 2.Reservado | 744000 | 52100 |
| R189 | 803 C | C  | C | José Gutierrez | Levi Benjamin Gutierrez Satey | 2025-09-28 | 4.Plan de Pagos | 744000 | 53000 |
| R190 | 804 C | A  | C | Paula Hernandez | Diego Antonio Herrera Muñoz / Angela Gabriela Lara | 2025-06-27 | 4.Plan de Pagos | 636400 | 44600 |
| R191 | 805 C | A  | C | José Gutierrez | Edwin Gonzálo Aguilón Velásquez | 2025-07-02 | 4.Plan de Pagos | 636400 | 45000 |
| R192 | 806 C | B  | C | Paula Hernandez | Melany Eulalia López Martínez | 2026-02-24 | 2.Reservado | 744000 | 52100 |
| R193 | 807 C | C  | C | José Gutierrez | Luciana Concepción Cruz Alvarado / Randall Jeancarlo Padilla Cruz | 2025-10-12 | 4.Plan de Pagos | 744000 | 52100 |
| R194 | 808 C | C  | C | Paula Hernandez | Julisa Elizabeth Gonzalez Bac / Derek Alexander Jiménez Najarro / Fredy Leonel Gonzalez | 2025-09-07 | 4.Plan de Pagos | 744000 | 52100 |
| R195 | 809 C | B  | C | José Gutierrez | Masielle Dasayeth Monroy Hernandez / Lennin Alejandro Hidalgo Colindres | 2025-06-15 | 4.Plan de Pagos | 813000 | 57000 |
| R196 | 901 C | A  | C |  |  |  | 1.Disponible | 636400 | 44548.00000000001 |
| R197 | 902 C | C  | C | Paula Hernandez | Luis Antonio Gómez Lucero / Febe Abigail Franco | 2025-08-11 | 4.Plan de Pagos | 744000 | 52100 |
| R198 | 903 C | C  | C | José Gutierrez | Andreina Maribel Cornel Moraga | 2025-08-03 | 4.Plan de Pagos | 744000 | 53000 |
| R199 | 904 C | A  | C |  |  |  | 1.Disponible | 636400 | 45000 |
| R200 | 905 C | A  | C | José Gutierrez | Oscar Josue Acabal Cun | 2026-02-16 | 4.Plan de Pagos | 636000 | 44600 |
| R201 | 906 C | B  | C | José Gutierrez | William Alexander Fuentes Alvarado / Maria Regina Ramos Samayoa | 2025-07-27 | 4.Plan de Pagos | 744000 | 53000 |
| R202 | 907 C | C  | C | José Gutierrez | Marlon Omar Valdes Pérez / Chelsea María José García Gómez | 2025-09-22 | 4.Plan de Pagos | 744000 | 53000 |
| R203 | 908 C | C  | C | Paula Hernandez | Jennifer Ivette González Medrano / Augustin Armando Calvillo Calderón | 2025-08-19 | 4.Plan de Pagos | 744000 | 52100 |
| R204 | 909 C | B  | C | Paula Hernandez | Ingrid Lissette Colíndres López | 2025-05-17 | 4.Plan de Pagos | 813000 | 57000 |
| R205 | 1001 C | A  | C | José Gutierrez | Dilan Guillermo Hernandez López | 2025-08-15 | 4.Plan de Pagos | 646000 | 45000 |
| R206 | 1002 C | C  | C | José Gutierrez | Andrea Elizabeth Rodas Cabrera / Roberto Isaac Morales Reyes | 2025-10-16 | 2.Reservado | 744000 | 52100 |
| R207 | 1003 C | C  | C | José Gutierrez | Heidy Joseline Hernández Mayorga / Edwin Esteban Ortega Montufar | 2026-02-01 | 2.Reservado | 744000 | 52100 |
| R208 | 1004 C | A  | C | Efrén Sanchez | Ludis Gonzalez Lopez | 2025-10-15 | 2.Reservado | 655200 | 45900 |
| R209 | 1005 C | A  | C |  |  |  | 1.Disponible | 678800 | 47516.00000000001 |
| R210 | 1006 C | B  | C |  |  |  | 1.Disponible | 825400 | 57778.00000000001 |
| R211 | 1007 C | C  | C | José Gutierrez | Juliana Daniela Ortiz | 2025-11-24 | 2.Reservado | 744000 | 52100 |
| R212 | 1008 C | C  | C |  |  |  | 1.Disponible | 958800 | 67116 |
| R213 | 1009 C | B  | C |  |  |  | 1.Disponible | 825400 | 57778.00000000001 |
| R214 | 1101 C | A  | C |  |  |  | 1.Disponible | 678800 | 47516.00000000001 |
| R215 | 1102 C | C  | C | Paula Hernandez | Zeus Anahel López Ojeda | 2025-11-15 | 4.Plan de Pagos | 744000 | 52100 |
| R216 | 1103 C | C  | C |  |  |  | 1.Disponible | 958800 | 67116 |
| R217 | 1104 C | A  | C |  |  |  | 1.Disponible | 678800 | 47516.00000000001 |
| R218 | 1105 C | A  | C |  |  |  | 1.Disponible | 678800 | 47516.00000000001 |
| R219 | 1106 C | B  | C |  |  |  | 1.Disponible | 825400 | 57778.00000000001 |
| R220 | 1107 C | C  | C |  |  |  | 1.Disponible | 958800 | 67116 |
| R221 | 1108 C | C  | C | Paula Hernandez | Daniel Rafael Bonilla Pérez / Yohany Danissa Leonardo Bocanegra | 2025-11-24 | 4.Plan de Pagos | 744000 | 52100 |
| R222 | 1109 C | B  | C |  |  |  | 1.Disponible | 825400 | 57778.00000000001 |
| R223 | 1201 C | A  | C | Paula Hernandez | Lesly Cristina Molina González | 2026-01-12 | 2.Reservado | 678800 | 47516.00000000001 |
| R224 | 1202 C | C  | C | José Gutierrez | Doneli Abraham Molineros Mijangos | 2025-11-15 | 4.Plan de Pagos | 744000 | 52100 |
| R225 | 1203 C | C  | C | José Gutierrez | Dulce Maria Molineros Mijangos | 2025-11-15 | 4.Plan de Pagos | 744000 | 52100 |
| R226 | 1204 C | A  | C |  |  |  | 1.Disponible | 678800 | 48000 |
| R227 | 1205 C | A  | C |  |  |  | 1.Disponible | 678800 | 47516.00000000001 |
| R228 | 1206 C | B  | C |  |  |  | 1.Disponible | 825400 | 57778.00000000001 |
| R229 | 1207 C | C  | C | Anahí Cisneros | Marlon Samuel Pixtum Martinez | 2026-03-22 | 2.Reservado | 0 | 0 |
| R230 | 1208 C | C  | C | José Gutierrez | Luis Fernando Piano Méndez | 2025-12-15 | 4.Plan de Pagos | 744000 | 52100 |
| R231 | 1209 C | B  | C | Paula Hernandez | Juan Pablo Álvarez Pérez | 2025-12-20 | 4.Plan de Pagos | 744000 | 52100 |
| R232 | 1301 C | A  | C |  |  |  | 1.Disponible | 678800 | 47516.00000000001 |
| R233 | 1302 C | C  | C | Gloria Cante | Edwin Estuardo Acevedo Salguero | 2025-11-30 | 2.Reservado | 744000 | 52100 |
| R234 | 1303 C | C  | C | Paula Hernandez | Marlon Jeovanny Barillas Morales / Jose David Barillas Morales | 2026-03-01 | 2.Reservado | 958800 | 67116 |

---
## 22. BL PPTO 2.0

**Purpose:** Bosque Las Tapias 2.0 budgeted installment schedule. Extended date range 2023-03-01 through 2029-12-01. Summary columns include PRECIO VTA, TOTAL ENG., P.I., P. PLAZO, CUOTA MES, DIF., Cuota mes, Acumulado.
**Non-empty rows:** 241 | **Max columns:** 94

### Column Headers (Row 1)

- **A**: Apto
- **B**: Estatus
- **C–CP**: Monthly dates 2023-03-01 through 2029-12-01
- **CQ**: TOTAL
- **CR**: PRECIO VTA
- **CS**: TOTAL ENG.
- **CT**: P.I.
- **CU**: P. PLAZO
- **CV**: CUOTA MES
- **CW**: DIF.
- **CX**: Appto.
- **CY**: Mes
- **CZ**: Acumulado

### DB Mapping

| Column | DB Target |
|--------|-----------|
| Apto | `rv_units.unit_number` |
| Estatus | `rv_units.status` |
| Monthly dates | budgeted `payments.amount` |
| PRECIO VTA | `sales.sale_price` |
| TOTAL ENG. | `sales.down_payment` |
| P.I. | `reservations.reserva_amount` |
| CUOTA MES | computed installment |
| DIF. | variance |

### Data Rows (unit + status)

| Row | Unit | Status | Non-zero monthly values |
|-----|------|--------|------------------------|
| R2 | 101 B | 1.Disponible | 6 |
| R3 | 102 B | 1.Disponible | 6 |
| R4 | 103 B | 1.Disponible | 6 |
| R5 | 104 B | 1.Disponible | 6 |
| R6 | 105 B | 1.Disponible | 6 |
| R7 | 106 B | 1.Disponible | 6 |
| R8 | 107 B | 1.Disponible | 6 |
| R9 | 108 B | 1.Disponible | 6 |
| R10 | 109 B | 1.Disponible | 6 |
| R11 | 201 B | 1.Disponible | 6 |
| R12 | 202 B | 1.Disponible | 6 |
| R13 | 203 B | 1.Disponible | 6 |
| R14 | 204 B | 1.Disponible | 6 |
| R15 | 205 B | 1.Disponible | 6 |
| R16 | 206 B | 1.Disponible | 6 |
| R17 | 207 B | 1.Disponible | 6 |
| R18 | 208 B | 1.Disponible | 6 |
| R19 | 209 B | 1.Disponible | 6 |
| R20 | 301 B | 1.Disponible | 6 |
| R21 | 302 B | 1.Disponible | 6 |
| R22 | 303 B | 1.Disponible | 6 |
| R23 | 304 B | 1.Disponible | 6 |
| R24 | 305 B | 1.Disponible | 6 |
| R25 | 306 B | 1.Disponible | 6 |
| R26 | 307 B | 1.Disponible | 6 |
| R27 | 308 B | 1.Disponible | 6 |
| R28 | 309 B | 1.Disponible | 6 |
| R29 | 401 B | 1.Disponible | 6 |
| R30 | 402 B | 1.Disponible | 6 |
| R31 | 403 B | 1.Disponible | 6 |
| R32 | 404 B | 1.Disponible | 6 |
| R33 | 405 B | 1.Disponible | 6 |
| R34 | 406 B | 1.Disponible | 6 |
| R35 | 407 B | 1.Disponible | 6 |
| R36 | 408 B | 1.Disponible | 6 |
| R37 | 409 B | 1.Disponible | 6 |
| R38 | 501 B | 1.Disponible | 6 |
| R39 | 502 B | 1.Disponible | 6 |
| R40 | 503 B | 1.Disponible | 6 |
| R41 | 504 B | 1.Disponible | 6 |
| R42 | 505 B | 1.Disponible | 6 |
| R43 | 506 B | 1.Disponible | 6 |
| R44 | 507 B | 1.Disponible | 6 |
| R45 | 508 B | 1.Disponible | 6 |
| R46 | 509 B | 1.Disponible | 6 |
| R47 | 601 B | 1.Disponible | 6 |
| R48 | 602 B | 1.Disponible | 6 |
| R49 | 603 B | 1.Disponible | 6 |
| R50 | 604 B | 1.Disponible | 6 |
| R51 | 605 B | 1.Disponible | 6 |
| R52 | 606 B | 1.Disponible | 6 |
| R53 | 607 B | 1.Disponible | 6 |
| R54 | 608 B | 1.Disponible | 6 |
| R55 | 609 B | 1.Disponible | 6 |
| R56 | 701 B | 1.Disponible | 6 |
| R57 | 702 B | 2.Reservado | 6 |
| R58 | 703 B | 1.Disponible | 6 |
| R59 | 704 B | 1.Disponible | 6 |
| R60 | 705 B | 1.Disponible | 6 |
| R61 | 706 B | 1.Disponible | 6 |
| R62 | 707 B | 1.Disponible | 6 |
| R63 | 708 B | 1.Disponible | 6 |
| R64 | 709 B | 1.Disponible | 6 |
| R65 | 801 B | 1.Disponible | 6 |
| R66 | 802 B | 1.Disponible | 6 |
| R67 | 803 B | 1.Disponible | 6 |
| R68 | 804 B | 1.Disponible | 6 |
| R69 | 805 B | 1.Disponible | 6 |
| R70 | 806 B | 1.Disponible | 6 |
| R71 | 807 B | 1.Disponible | 6 |
| R72 | 808 B | 1.Disponible | 6 |
| R73 | 809 B | 1.Disponible | 6 |
| R74 | 901 B | 1.Disponible | 6 |
| R75 | 902 B | 1.Disponible | 6 |
| R76 | 903 B | 1.Disponible | 6 |
| R77 | 904 B | 1.Disponible | 6 |
| R78 | 905 B | 1.Disponible | 6 |
| R79 | 906 B | 1.Disponible | 6 |
| R80 | 907 B | 1.Disponible | 6 |
| R81 | 908 B | 1.Disponible | 6 |
| R82 | 909 B | 1.Disponible | 6 |
| R83 | 1001 B | 1.Disponible | 6 |
| R84 | 1002 B | 1.Disponible | 6 |
| R85 | 1003 B | 1.Disponible | 6 |
| R86 | 1004 B | 1.Disponible | 6 |
| R87 | 1005 B | 1.Disponible | 6 |
| R88 | 1006 B | 1.Disponible | 6 |
| R89 | 1007 B | 1.Disponible | 6 |
| R90 | 1008 B | 1.Disponible | 6 |
| R91 | 1009 B | 1.Disponible | 6 |
| R92 | 1101 B | 1.Disponible | 6 |
| R93 | 1102 B | 1.Disponible | 6 |
| R94 | 1103 B | 1.Disponible | 6 |
| R95 | 1104 B | 1.Disponible | 6 |
| R96 | 1105 B | 1.Disponible | 6 |
| R97 | 1106 B | 1.Disponible | 6 |
| R98 | 1107 B | 1.Disponible | 6 |
| R99 | 1108 B | 1.Disponible | 6 |
| R100 | 1109 B | 1.Disponible | 6 |
| R101 | 1201 B | 1.Disponible | 6 |
| R102 | 1202 B | 1.Disponible | 6 |
| R103 | 1203 B | 1.Disponible | 6 |
| R104 | 1204 B | 1.Disponible | 6 |
| R105 | 1205 B | 1.Disponible | 6 |
| R106 | 1206 B | 1.Disponible | 6 |
| R107 | 1207 B | 1.Disponible | 6 |
| R108 | 1208 B | 1.Disponible | 6 |
| R109 | 1209 B | 1.Disponible | 6 |
| R110 | 1301 B | 1.Disponible | 6 |
| R111 | 1302 B | 1.Disponible | 6 |
| R112 | 1303 B | 1.Disponible | 6 |
| R113 | 1304 B | 1.Disponible | 6 |
| R114 | 1305 B | 2.Reservado | 6 |
| R115 | 1306 B | 1.Disponible | 6 |
| R116 | 1307 B | 2.Reservado | 6 |
| R117 | 1308 B | 1.Disponible | 6 |
| R118 | 1309 B | 1.Disponible | 6 |
| R119 | 101 C | 4.Plan de Pagos | 35 |
| R120 | 102 C | 1.Disponible | 7 |
| R121 | 103 C | 1.Disponible | 7 |
| R122 | 104 C | 4.Plan de Pagos | 37 |
| R123 | 105 C | 1.Disponible | 7 |
| R124 | 106 C | 4.Plan de Pagos | 37 |
| R125 | 107 C | 4.Plan de Pagos | 37 |
| R126 | 108 C | 1.Disponible | 7 |
| R127 | 109 C | 1.Disponible | 7 |
| R128 | 201 C | 1.Disponible | 7 |
| R129 | 202 C | 1.Disponible | 7 |
| R130 | 203 C | 1.Disponible | 7 |
| R131 | 204 C | 1.Disponible | 7 |
| R132 | 205 C | 1.Disponible | 7 |
| R133 | 206 C | 1.Disponible | 7 |
| R134 | 207 C | 1.Disponible | 7 |
| R135 | 208 C | 1.Disponible | 7 |
| R136 | 209 C | 1.Disponible | 7 |
| R137 | 301 C | 1.Disponible | 7 |
| R138 | 302 C | 4.Plan de Pagos | 31 |
| R139 | 303 C | 4.Plan de Pagos | 33 |
| R140 | 304 C | 1.Disponible | 7 |
| R141 | 305 C | 1.Disponible | 7 |
| R142 | 306 C | 1.Disponible | 7 |
| R143 | 307 C | 1.Disponible | 7 |
| R144 | 308 C | 1.Disponible | 7 |
| R145 | 309 C | 1.Disponible | 7 |
| R146 | 401 C | 4.Plan de Pagos | 36 |
| R147 | 402 C | 4.Plan de Pagos | 39 |
| R148 | 403 C | 1.Disponible | 7 |
| R149 | 404 C | 1.Disponible | 7 |
| R150 | 405 C | 1.Disponible | 7 |
| R151 | 406 C | 1.Disponible | 7 |
| R152 | 407 C | 1.Disponible | 7 |
| R153 | 408 C | 1.Disponible | 7 |
| R154 | 409 C | 1.Disponible | 7 |
| R155 | 501 C | 4.Plan de Pagos | 39 |
| R156 | 502 C | 2.Reservado | 33 |
| R157 | 503 C | 4.Plan de Pagos | 34 |
| R158 | 504 C | 4.Plan de Pagos | 37 |
| R159 | 505 C | 1.Disponible | 7 |
| R160 | 506 C | 4.Plan de Pagos | 39 |
| R161 | 507 C | 1.Disponible | 7 |
| R162 | 508 C | 1.Disponible | 7 |
| R163 | 509 C | 1.Disponible | 7 |
| R164 | 601 C | 4.Plan de Pagos | 35 |
| R165 | 602 C | 4.Plan de Pagos | 34 |
| R166 | 603 C | 1.Disponible | 7 |
| R167 | 604 C | 4.Plan de Pagos | 37 |
| R168 | 605 C | 4.Plan de Pagos | 36 |
| R169 | 606 C | 1.Disponible | 7 |
| R170 | 607 C | 1.Disponible | 7 |
| R171 | 608 C | 2.Reservado | 32 |
| R172 | 609 C | 1.Disponible | 7 |
| R173 | 701 C | 4.Plan de Pagos | 38 |
| R174 | 702 C | 1.Disponible | 7 |
| R175 | 703 C | 4.Plan de Pagos | 34 |
| R176 | 704 C | 4.Plan de Pagos | 37 |
| R177 | 705 C | 4.Plan de Pagos | 37 |
| R178 | 706 C | 4.Plan de Pagos | 31 |
| R179 | 707 C | 2.Reservado | 32 |
| R180 | 708 C | 4.Plan de Pagos | 34 |
| R181 | 709 C | 4.Plan de Pagos | 31 |
| R182 | 801 C | 1.Disponible | 7 |
| R183 | 802 C | 2.Reservado | 7 |
| R184 | 803 C | 4.Plan de Pagos | 33 |
| R185 | 804 C | 4.Plan de Pagos | 38 |
| R186 | 805 C | 4.Plan de Pagos | 37 |
| R187 | 806 C | 2.Reservado | 7 |
| R188 | 807 C | 4.Plan de Pagos | 34 |
| R189 | 808 C | 4.Plan de Pagos | 35 |
| R190 | 809 C | 4.Plan de Pagos | 38 |
| R191 | 901 C | 1.Disponible | 7 |
| R192 | 902 C | 4.Plan de Pagos | 36 |
| R193 | 903 C | 4.Plan de Pagos | 36 |
| R194 | 904 C | 1.Disponible | 7 |
| R195 | 905 C | 4.Plan de Pagos | 35 |
| R196 | 906 C | 4.Plan de Pagos | 37 |
| R197 | 907 C | 4.Plan de Pagos | 33 |
| R198 | 908 C | 4.Plan de Pagos | 36 |
| R199 | 909 C | 4.Plan de Pagos | 39 |
| R200 | 1001 C | 4.Plan de Pagos | 36 |
| R201 | 1002 C | 2.Reservado | 34 |
| R202 | 1003 C | 2.Reservado | 33 |
| R203 | 1004 C | 2.Reservado | 36 |
| R204 | 1005 C | 1.Disponible | 7 |
| R205 | 1006 C | 1.Disponible | 7 |
| R206 | 1007 C | 2.Reservado | 33 |
| R207 | 1008 C | 1.Disponible | 7 |
| R208 | 1009 C | 1.Disponible | 7 |
| R209 | 1101 C | 1.Disponible | 7 |
| R210 | 1102 C | 4.Plan de Pagos | 33 |
| R211 | 1103 C | 1.Disponible | 7 |
| R212 | 1104 C | 1.Disponible | 7 |
| R213 | 1105 C | 1.Disponible | 7 |
| R214 | 1106 C | 1.Disponible | 7 |
| R215 | 1107 C | 1.Disponible | 7 |
| R216 | 1108 C | 4.Plan de Pagos | 33 |
| R217 | 1109 C | 1.Disponible | 7 |
| R218 | 1201 C | 2.Reservado | 33 |
| R219 | 1202 C | 4.Plan de Pagos | 33 |
| R220 | 1203 C | 4.Plan de Pagos | 33 |
| R221 | 1204 C | 1.Disponible | 7 |
| R222 | 1205 C | 1.Disponible | 7 |
| R223 | 1206 C | 1.Disponible | 7 |
| R224 | 1207 C | 2.Reservado | 5 |
| R225 | 1208 C | 4.Plan de Pagos | 30 |
| R226 | 1209 C | 4.Plan de Pagos | 32 |
| R227 | 1301 C | 1.Disponible | 7 |
| R228 | 1302 C | 2.Reservado | 33 |
| R229 | 1303 C | 2.Reservado | 32 |
| R230 | 1304 C | 1.Disponible | 7 |
| R231 | 1305 C | 1.Disponible | 7 |
| R232 | 1306 C | 1.Disponible | 7 |
| R233 | 1307 C | 1.Disponible | 7 |
| R234 | 1308 C | 1.Disponible | 7 |
| R235 | 1309 C | 1.Disponible | 7 |

---

## 23. RESUMEN BLT

**Purpose:** Bosque Las Tapias summary dashboard. Company: INVERSIONES DE CASTILLA, S.A. Data as of 2026-03-31. Monthly and cumulative metrics, reconciliation, desistimiento totals, unit-status breakdown.
**Non-empty rows:** 12 | **Max columns:** 34

### DB Mapping

| Metric | DB Target |
|--------|-----------|
| Cobro esperado / efectuado mensual | budget vs `SUM(payments.amount)` current month |
| Cobro esperado / efectuado acumulado | budget vs `SUM(payments.amount)` to date |
| Total adeudado | `SUM(down_payment - collected)` |
| ESTATUS counts | `COUNT(rv_units)` by status |

### All Data Rows

- **R2**: INVERSIONES DE CASTILLA, S.A.
- **R3**: BOSQUE LAS TAPIAS
- **R4**: RESUMEN DE COBROS 
- **R5**: Datos al: | 2026-03-31
- **R6**: ( + ) A | ( - ) B | ( = ) C | ( + ) D | ( - ) E | ( C ) - (D-E) | ( + ) | ( - )
- **R7**: Resumen | Mensual | Acumulado | Efectivo acum. que se debió recibir | Cobros por Efectuar (Casos Especiales / F&F) | Cobros Netos Acumulados | Cobros realizados | Cobros Adicionales | Saldo Conciliado | Cobros por Efectuar (Clientes en Mora) | Diferencia | Cobros (Desistimientos) | Devoluciones (Desistimientos) | (Faltante) / Sobrante en Flujo de Caja
- **R8**: Cobro 
esperado | Cobro  
efectuado | Diferencia | % 
de cobro  | % 
de cobro pendiente | Cobro
esperado | Cobro 
efectuado | Diferencia | % 
de cobro  | % 
de cobro pendiente | Efectivo acum. que se debió recibir | Cobros por Efectuar (Casos Especiales / F&F) | Cobros Netos Acumulados | Cobros realizados | Cobros Adicionales | Saldo Conciliado | Cobros por Efectuar (Clientes en Mora) | Diferencia | Cobros (Desistimientos) | Devoluciones (Desistimientos) | (Faltante) / Sobrante en Flujo de Caja | Total adeudado | Diferencia | % 
pendiente de cobro 
- **R9**: COBROS | 81723.87 | 100002.83 | 18278.960000000006 | ▲ | 1.2236673324452207 | 0.2236673324452208 | 617167.9400000001 | 710573.01 | 93405.06999999995 | ▲ | 1.1513446566910133 | 0.15134465669101338 | 1984632.2369688998 | 0 | 1984632.2369688998 | 1796269.2600000005 | 165009.51303109998 | 353372.4899999993 | 353372.49000000005 | -7.566995918750763e-10 | 85059.18 | -268313.3099999993 | 2816768 | -2106194.99 | ▼ | -0.747734634162274
- **R10**: #REF!
- **R11**: Resumen | Total Apartamentos | Cliente al día | Cliente atrasado | #NUM! | Disponible | Enganche completado | Superávit de Enganche | Pendiente Plan de Pagos | F&F
- **R12**: ESTATUS | 234 | 32 | 23 | 175 | 0 | 4 | 0 | 0 | 0
- **R13**: 1 | 0.13675213675213677 | 0.09829059829059829 | 0.7478632478632479 | 0 | 0.017094017094017096 | 0 | 0 | 0

---

## 24. ALERTA INDECAS 2.0

**Purpose:** Bosque Las Tapias 2.0 alert/pivot table (INDECAS = INVERSIONES DE CASTILLA). Client payment status summary by bucket. Project: BOSQUE LAS TAPIAS.
**Non-empty rows:** 239 | **Max columns:** 14

### Column Headers (Row 6)

- **C**: Status Cliente
- **D**: Apto
- **E**: Cliente
- **F**: Cobro esperado mensual
- **G**: Cobro efectuado mensual
- **H**: Cobro esperado acumulado
- **I**: Cobro efectuado acumulado
- **J**: Total adeudado
- **K**: # de Aptos
- **L**: Diferencia del mes
- **M**: Diferencia acumulado
- **N**: Diferencia total adeudado

### Summary Rows (R7–R11)

| Row | Status Bucket | Exp Monthly | Act Monthly | Exp Accum | Act Accum | Total Owed | Count |
|-----|---------------|-------------|-------------|-----------|-----------|------------|-------|
| R7 | Cliente al día | 53834.36 | 69329.86 | 386443.03 | 473595.66000000003 | 1615399 | 32 |
| R8 | Cliente Atrasado | 27889.510000000002 | 20415.97 | 230724.91 | 223720.35 | 1201369 | 23 |
| R9 | Disponible | 0 | 0 | 0 | 0 |  | 175 |
| R10 | Superávit de Enganche | 0 | 10257 | 0 | 13257 | 0 | 4 |
| R11 | Total general | 81723.87000000001 | 100002.83000000002 | 617167.9400000001 | 710573.0100000001 | 2816768 | 234 |

---
## 25. Atrasados BLT

**Purpose:** Bosque Las Tapias delinquent clients pivot. Lists each late-paying BLT client with expected vs actual collections. Project: BOSQUE LAS TAPIAS.
**Non-empty rows:** 28 | **Max columns:** 14

### Column Headers (Row 6)

- **C**: Apto
- **D**: Cliente
- **E**: Cobro esperado mensual
- **F**: Cobro efectuado mensual
- **G**: Cobro esperado acumulado
- **H**: Cobro efectuado acumulado
- **I**: Total adeudado
- **J**: # de Aptos
- **L**: Diferencia del mes
- **M**: Diferencia acumulado
- **N**: Diferencia total adeudado

### DB Mapping

| Column | DB Target |
|--------|-----------|
| Apto | `rv_units.unit_number` |
| Cliente | `rv_clients.full_name` |
| Cobro esperado mensual | budgeted installment |
| Cobro efectuado mensual | `SUM(payments.amount)` current month |
| Cobro esperado acumulado | cumulative budget |
| Cobro efectuado acumulado | `SUM(payments.amount)` to date |
| Total adeudado | `sales.down_payment` remaining |
| Diferencia del mes | expected_month - actual_month |
| Diferencia acumulado | expected_accum - actual_accum |
| Diferencia total adeudado | remaining - paid |

### All Delinquent Client Rows

| Row | Unit | Client | Exp Monthly | Act Monthly | Exp Accum | Act Accum | Total Owed | Diff Month | Diff Accum | Diff Total |
|-----|------|--------|-------------|-------------|-----------|-----------|------------|------------|------------|------------|
| R7 | 101 C | Favio Javier Estrada Quiñonez y Candida Eva Daniela Ramirez Lopez | 1817 | 2000 | 13902 | 13000 | 46600 | 183 | -902 | -33600 |
| R8 | 104 C | Carlos Alfonso Castro Martinez | 1653.85 | 1653.85 | 16230.800000000003 | 9615.4 | 46000 | 0 | -6615.400000000003 | -36384.6 |
| R9 | 107 C | Sarai del Rosario Muralles Navas de Garcia / Luis Enrique Garcia Tebelan | 2192.31 | 2192.31 | 20538.48 | 18346.17 | 60000 | 0 | -2192.3100000000013 | -41653.83 |
| R10 | 501 C | Kenneth David Cetino Ortiz / Hazel Suscely Cetino Ortiz | 2047.86 | 0 | 23478.600000000002 | 19381.12 | 60340 | -2047.86 | -4097.480000000003 | -40958.880000000005 |
| R11 | 502 C | Byron Omar Yapur Ponce | 0 | 1000 | 0 | 5000 | 52100 | 1000 | 5000 | -47100 |
| R12 | 503 C | Albert Francescoli de Jesús Ortiz Pineda / Ana Gabriela Morale Chajón | 2135 | 0 | 13675 | 9405 | 52100 | -2135 | -4270 | -42695 |
| R13 | 604 C | Lilian Jeanette Paz García de Zapete | 1596.15 | 0 | 15769.199999999997 | 14179 | 44500 | -1596.15 | -1590.199999999997 | -30321 |
| R14 | 608 C | Jefersón Michael Sandoval Orozco / Helen Susana Cano Ruballo | 0 | 0 | 0 | 4500 | 66213 | 0 | 4500 | -61713 |
| R15 | 701 C | Manolo de Jesús Milian Martínez | 2174.07 | 2174.07 | 28914.769999999997 | 24566.629999999997 | 63700 | 0 | -4348.139999999999 | -39133.37 |
| R16 | 708 C | Lesbia Fernanda Flores Garcia / Bryan Alexander Suret Valenzuela | 2135 | 2135 | 10870 | 10870 | 52100 | 0 | 0 | -41230 |
| R17 | 709 C | Yury Julio Roberto de Jesus Urrutia Valdez / María de los Angeles de León Manrique | 1500 | 1500 | 6000 | 6000 | 52100 | 0 | 0 | -46100 |
| R18 | 803 C | Levi Benjamin Gutierrez Satey | 0 | 0 | 0 | 4500 | 53000 | 0 | 4500 | -48500 |
| R19 | 804 C | Diego Antonio Herrera Muñoz / Angela Gabriela Lara | 1540.74 | 1540.74 | 16860.87 | 15320.13 | 44600 | 0 | -1540.7399999999998 | -29279.870000000003 |
| R20 | 805 C | Edwin Gonzálo Aguilón Velásquez | 1615.38 | 0 | 15923.040000000005 | 11076.900000000001 | 45000 | -1615.38 | -4846.140000000003 | -33923.1 |
| R21 | 807 C | Luciana Concepción Cruz Alvarado / Randall Jeancarlo Padilla Cruz | 2135 | 0 | 13675 | 9600 | 52100 | -2135 | -4075 | -42500 |
| R22 | 909 C | Ingrid Lissette Colíndres López | 1500 | 0 | 16500 | 16500 | 57000 | -1500 | 0 | -40500 |
| R23 | 1002 C | Andrea Elizabeth Rodas Cabrera / Roberto Isaac Morales Reyes | 2135 | 0 | 13675 | 3000 | 52100 | -2135 | -10675 | -49100 |
| R24 | 1003 C | Heidy Joseline Hernández Mayorga / Edwin Esteban Ortega Montufar | 0 | 0 | 0 | 3000 | 52100 | 0 | 3000 | -49100 |
| R25 | 1004 C | Ludis Gonzalez Lopez | 1712.15 | 3900 | 4712.15 | 6900 | 45900 | 2187.85 | 2187.8500000000004 | -39000 |
| R26 | 1007 C | Juliana Daniela Ortiz | 0 | 0 | 0 | 3000 | 52100 | 0 | 3000 | -49100 |
| R27 | 1201 C | Lesly Cristina Molina González | 0 | 0 | 0 | 3000 | 47516.00000000001 | 0 | 3000 | -44516.00000000001 |
| R28 | 1208 C | Luis Fernando Piano Méndez | 0 | 2320 | 0 | 9960 | 52100 | 2320 | 9960 | -42140 |
| R29 | 1302 C | Edwin Estuardo Acevedo Salguero | 0 | 0 | 0 | 3000 | 52100 | 0 | 3000 | -49100 |
| R30 | Total general |  | 27889.510000000002 | 20415.97 | 230724.91 | 223720.35 | 1201369 | -7473.540000000001 | -7004.559999999998 | -977648.65 |

---

## 26. Hoja1

**Purpose:** Empty sheet. No data.
**Non-empty rows:** 0 | **Max columns:** 1

No content.

---

## 27. PEND. BTARE

**Purpose:** Benestare pending payment plan setup. Lists units that need installment plan configuration — cuota de enganche, total cuotas pactadas, monto de reserva pactado, cuota mensual. Includes both Tower A and Tower B units, with review annotations.
**Non-empty rows:** 66 | **Max columns:** 13

### Column Headers (Row 1)

- **A**: Apto
- **B**: Torre
- **C**: Reservado
- **D**: Cuota de Enganche
- **E**: Total cuotas pactadas
- **F**: Monto de Reserva Pactado
- **G**: Cuota

### DB Mapping

| Column | DB Target |
|--------|-----------|
| Apto | `rv_units.unit_number` |
| Torre | `towers.name` |
| Reservado | `reservations.created_at` |
| Cuota de Enganche | `sales.cuotas_enganche` (first installment paid) |
| Total cuotas pactadas | `sales.cuotas_enganche` |
| Monto de Reserva Pactado | `reservations.reserva_amount` |
| Cuota | computed: (down_payment - reserva_amount) / cuotas_enganche |

### All Data Rows

| Row | Unit | Tower | Reservado | Cuota Eng. | Total Cuotas | Monto Reserva | Cuota | Notes |
|-----|------|-------|-----------|-----------|--------------|---------------|-------|-------|
| R2 | 101 | A | 2024-03-23 | 1 | 23 | 1500 | 1022.73 |  |
| R3 | 102 | A | 2024-06-10 | 1 | 19 | 1500 | 1244.44 |  |
| R4 | 103 | A | 2024-02-26 | 1 | 23 | 500 | 1045.45 |  |
| R5 | 104 | A | 2023-11-28 | 1 | 14 | 300 | 1815.38 |  |
| R6 | 105 | A | 2023-10-02 | 1 | 22 | 1000 | 1784.29 |  |
| R7 | 108 | A | 2023-10-03 | 1 | 20 | 3230 | 2434.74 |  |
| R8 | 109 | A | 2025-01-04 | 1 | 13 | 1500 | 1875 |  |
| R9 | 201 | A | 2024-04-07 | 1 | 23 | 1000 | 1045.45 |  |
| R10 | 202 | A | 2023-11-27 | 1 | 23 | 500 | 2240.91 |  |
| R11 | 203 | A | 2024-07-06 | 1 | 17 | 1500 | 1323.53 |  |
| R12 | 204 | A | 2024-07-06 | 1 | 17 | 1500 | 1323.53 |  |
| R13 | 205 | A | 2023-11-09 | 1 | 23 | 1000 | 1704.55 |  |
| R14 | 207 | A | 2023-10-25 | 1 | 23 | 500 | 2374.5 |  |
| R15 | 209 | A | 2024-10-14 | 1 | 15 | 500 | 1671.43 |  |
| R16 | 210 | A | 2024-10-04 | 1 | 16 | 1500 | 1493.33 |  |
| R17 | 301 | A | 2025-05-30 | 1 | 16 | 1500 | 1493.38 |  |
| R18 | 302 | A | 2025-05-26 | 1 | 17 | 1500 | 1400 |  |
| R19 | 303 | A | 2024-12-09 | 1 | 14 | 1500 | 1723.08 |  |
| R20 | 304 | A | 2024-09-30 | 1 | 16 | 1500 | 1493.33 |  |
| R21 | 305 | A | 2025-06-06 | 0 | 0 | 1500 | 2 |  |
| R22 | 306 | A | 2025-06-22 | 0 | 0 | 3000 | 0 |  |
| R23 | 308 | A | 2024-04-08 | 1 | 21 | 1500 | 1125 |  |
| R24 | 309 | A | 2025-06-25 | 0 | 0 | 3000 | 0 |  |
| R25 | 401 | A | 2023-12-02 | 1 | 23 | 500 | 2333.33 |  |
| R26 | 402 | A |  | 1 | 14 | 500 | 1800 |  |
| R27 | 403 | A | 2024-05-14 | 1 | 20 | 1500 | 1178.95 |  |
| R28 | 405 | A | 2025-06-30 | 1 | 17 | 1500 | 1062.5 |  |
| R29 | 407 | A | 2025-05-10 | 1 | 13 | 1500 | 1866.67 |  |
| R30 | 409 | A | 2025-03-31 | 1 | 16 | 1500 | 1493.33 |  |
| R31 | 410 | A | 2024-03-17 | 1 | 22 | 1000 | 1095.24 |  |
| R32 | 502 | A | 2023-12-10 | 1 | 23 | 1000 | 2323.81 |  |
| R33 | 503 | A | 2025-06-27 | 1 | 17 | 1500 | 1400 |  |
| R34 | 504 | A | 2025-06-28 | 1 | 17 | 1500 | 1400 |  |
| R35 | 505 | A | 2025-02-05 | 1 | 17 | 1500 | 1062.5 |  |
| R36 | 507 | A | 2025-06-28 | 1 | 17 | 1500 | 1400 |  |
| R37 | 508 | A | 2025-06-28 | 1 | 17 | 1500 | 1400 |  |
| R38 | 510 | A | 2024-08-07 | 1 | 17 | 500 | 1462.5 |  |
| R39 | 601 | A | 2024-04-25 | 1 | 21 | 1500 | 1229.5 |  |
| R40 | 602 | A | 2023-11-27 | 1 | 23 | 500 | 2436.84 |  |
| R41 | 604 | A | 2025-06-29 | 1 | 17 | 1500 | 1400 |  |
| R42 | 606 | A | 2025-06-30 | 1 | 17 | 1500 | 1400 |  |
| R43 | 607 | A | 2024-05-07 | 1 | 20 | 1500 | 894.74 |  |
| R44 | 608 | A | 2024-04-28 | 1 | 21 | 1500 | 1125 |  |
| R45 | 610 | A | 2024-02-27 | 1 | 23 | 1000 | 1045.45 |  |
| R46 | 104 | B | 2025-07-20 | 0 | 0 |  |  | REVISAR |
| R47 | 106 | B | 2024-03-03 | 1 | 22 | 1000 | 2228.57 |  |
| R48 | 206 | B | 2024-05-18 | 1 | 20 | 1500 | 1184.21 |  |
| R49 | 213 | TB | 2024-03-21 | 1 | 20 | 1000 | 1210.53 |  |
| R50 | 305 | B | 2025-07-15 | 1 | 19 | 1500 | 1272.22 | REVISAR |
| R51 | 306 | TB | 2025-04-20 | 0 | 1 | 5000 | 43242 |  |
| R52 | 308 | B | 2025-07-06 | 1 | 19 | 1500 | 1272.22 |  |
| R53 | 311 | B | 2024-05-15 | 1 | 12 | 1500 | 1178.95 |  |
| R54 | 312 | B | 2025-07-31 | 0 | 0 | 3000 | 0 | NO TIENE PLAN DE PAGOS |
| R55 | 313 | TB | 2025-07-31 | 0 | 0 |  | 0 | NO TIENE PLAN DE PAGOS |
| R56 | 405 | B | 2024-11-30 | 1 | 14 |  |  | REVISAR |
| R57 | 409 | B | 2025-07-03 | 1 | 17 | 1500 | 1400 |  |
| R58 | 411 | B | 2025-07-20 | 0 | 0 |  | 0 | NO TIENE PLAN DE PAGOS |
| R59 | 501 | B | 2025-06-28 | 0 | 0 |  | 0 | REASIGNADO EN EL MES DE JUNIO DE LA TORRE B-408 |
| R60 | 501 | B | 2025-07-13 | 1 | 19 | 1500 | 1272.22 | VENTA NUEVA DE JULIO  |
| R61 | 508 | B | 2025-07-12 | 1 | 19 | 1500 | 1272.22 |  |
| R62 | 601 | B | 2025-07-26 | 0 | 0 |  | 0 | NO TIENE PLAN DE PAGOS |
| R63 | 604 | B | 2025-07-05 |  |  |  |  |  |
| R64 | 606 | B | 2024-05-30 | 1 | 20 | 1500 | 1184.21 |  |
| R65 | 613 | B | 2024-02-18 | 1 | 23 | 1000 | 1045.45 |  |
| R66 | POR ASIGNAR |  | 2024-08-07 | 1 | 17 | 500 | 1462.5 |  |

---

## Cross-Reference: Column Header → DB Field

| Excel Column | DB Table | DB Column | Notes |
|-------------|----------|-----------|-------|
| Apto / Apto. | `rv_units` | `unit_number` | text, e.g. '101', '101-A', '101 A' |
| Torre | `towers` | `name` | e.g. 'A', 'B', 'C', 'Principal' |
| Tipo / Tipo / Modelo | `rv_units` | `unit_type` | e.g. 'A', 'B', 'C', 'A PLUS' |
| Vendedor | `salespeople` | `name` | FK to salespeople.id |
| Cliente | `rv_clients` | `full_name` | may contain multiple buyers separated by '/' |
| Reservado / Fecha Reserva | `reservations` | `created_at` | date of reservation |
| Estatus (unit) | `rv_units` | `status` | rv_unit_status enum |
| ESTATUS CLIENTE | computed | — | payment compliance label |
| Precio de Venta | `sales` | `sale_price` | GTQ (or USD for SE) |
| Cotizador | `rv_units` | `price` | quoted price before negotiation |
| Enganche | `sales` | `down_payment` | |
| Monthly date columns | `payments` | `payment_date` + `amount` | one column per month |
| TOTAL COBROS Y RESERVAS | computed | `SUM(payments.amount)` | |
| % Cobro | computed | `collected / down_payment` | |
| SALDO PENDIENTE ENGANCHE | computed | `down_payment - collected` | |
| Monto a Financiar por Banco | computed | `sale_price - down_payment` | |
| Cuotas Pactadas | `sales` | `cuotas_enganche` | |
| Cuota de Enganche | computed | `down_payment / cuotas_enganche` | |
| Monto de Reserva Pactado | `reservations` | `reserva_amount` | |
| Cuotas Pagadas | computed | `COUNT(payments)` in phase 2 | |
| Cuotas Atrasadas | computed | `expected_paid - actual_paid` | |
| Caso Especial / F&F | `rv_clients` | `is_ff` / notes | friends & family flag |
| Observaciones | `reservations` | `notes` | free text |
| Status inmueble | `rv_units` | `status` | same as Estatus |
| Cobro adicional a lo pactado | computed | payments beyond schedule | |
| Cobro no realizado según lo pactado | computed | scheduled payments missed | |
| DIF MONTO QUE DEBE ESTAR CANCELADO-INGRESO REAL | computed | expected_paid - actual_paid | |
| Enganche II | computed | secondary enganche reference | |
| CUOTAS PENDIENTES | computed | `cuotas_enganche - cuotas_pagadas` | |
| Cuota mes | computed | monthly installment | |
| Acumulado | computed | running total | |

---

## Sheet Relevance by Commission Phase

**Phase 1 — Reservation deposits (`payment_type = 'reservation'`)**

The reservation deposit is the first monetary entry per unit. The relevant source is the "Reservado" date column + first non-zero month column per row.

| Sheet | Project | Status |
|-------|---------|--------|
| 2 — SANTA ELISA | CE | **Canonical** |
| 4 — BOULEVARD 5 | B5 | **Canonical** |
| 15 — BENESTARE 2.0 | BEN | **Canonical** |
| 21 — BL-TAPIAS 2.0 | BLT | **Canonical** |
| 8 — BENES | BEN | Superseded by Sheet 15 |
| 9 — BOULEVARD 5 orig. | B5 | Superseded by Sheet 4 (cuts off 2025-03) |
| 10 — BENESTARE (space) | BEN | Superseded by Sheet 15 |
| 12 — BL-TAPIAS | BLT | Superseded by Sheet 21 (Tower C only, incomplete) |

---

**Phase 2 — Enganche installments (`payment_type = 'down_payment'`)**

Same four canonical sheets — the monthly date columns (2022-06-30 … last month) contain the installment amounts per unit per month.

| Sheet | Project | Status |
|-------|---------|--------|
| 2 — SANTA ELISA | CE | **Canonical** |
| 4 — BOULEVARD 5 | B5 | **Canonical** |
| 15 — BENESTARE 2.0 | BEN | **Canonical** |
| 21 — BL-TAPIAS 2.0 | BLT | **Canonical** |

The PPTO sheets (3, 5, 11, 13, 17, 22) and Alert/Atrasados sheets (6, 7, 14, 18, 19, 20, 23, 24, 25) are derived/summary views — not sources of payment amounts.

---

**Phase 3 — Bank credit disbursement (`payment_type = 'credit'`)**

Not present in this file. The `BB` column ("Monto a Financiar por Banco") shows the expected credit amount per unit, but no actual disbursement payments are tracked anywhere in CIERRE_MARZO_RESERVAS.xlsx. Phase 3 has no source sheet here.

---

**Summary: canonical source sheets for payment audit**

| Phase | DB type | Source sheets |
|-------|---------|--------------|
| 1 | `reservation` | 2, 4, 15, 21 |
| 2 | `down_payment` | 2, 4, 15, 21 |
| 3 | `credit` | none — not in this file |
