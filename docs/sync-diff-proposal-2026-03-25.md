# Sync Diff Proposal — Reservas vs Production DB

**Generated:** 2026-03-25
**Script:** `scripts/sync_reservations.py`

## Summary

| Metric | Count |
|---|---|
| Excel records (deduplicated) | 558 |
| DB active reservations (CONFIRMED/PENDING_REVIEW) | 572 |
| Matched (no differences) | 516 |
| Matched (with differences) | 14 |
| **New records** (auto-inserted) | **28** |
| Lead source enrichments | 355 |
| DB-only (not in Excel) | 42 |

## New Records (Auto-Inserted)

| # | Project | Tower | Unit | Client | Asesor | Fecha | Enganche | Medio |
|---|---------|-------|------|--------|--------|-------|----------|-------|
| 1 | Boulevard 5 | Principal | 1008 | Jorge Arimany | Antonio Rada | 2024-04-19 | Q88,740.00 | Referido |
| 2 | Boulevard 5 | Principal | 203 | Edlen Isaí Reyes Matus / Gladys Adelina Reyes Matus | Erwin Cardona | 2026-03-19 | Q65,000.00 | lead |
| 3 | Boulevard 5 | Principal | 303 | Pedro Antoinio Gomar Chavez | Erwin Cardona | 2025-11-27 | Q66,255.00 | Evento |
| 4 | Boulevard 5 | Principal | 310 | Fernando Javier Rosales Gramajo | Erwin Cardona | 2025-12-07 | Q333,036.00 | Lead cita wine Party |
| 5 | Boulevard 5 | Principal | 403 | Denis Estuardo Mazariegos Fuentes | Antonio Rada | - | Q69,970.00 | - |
| 6 | Boulevard 5 | Principal | 710 | Carlos Yon | Junta Directiva | - | Q118,564.04 | - |
| 7 | Benestare | Torre A | 204 | Rosa Elena Rojas Cano | Eder Veliz | 2026-03-12 | Q26,900.00 | Meta |
| 8 | Benestare | Torre A | 305 | Andrea Yohana Cabrera Velasquez | Eder Veliz | 2025-06-05 | Q18,500.00 | WhatsApp |
| 9 | Benestare | Torre B | 313 | Suarlin Eli Barrientos Pazos | Pablo Marroquin | 2025-07-30 | Q24,400.00 | Perfilan Facebook |
| 10 | Benestare | Torre C | 106 | Yuri Blanca Reyes | Rony Ramirez | 2026-03-16 | Q27,100.00 | Meta |
| 11 | Benestare | Torre D | 304 | Welnio Ivan Cuellas Portillo | Rony Ramirez | 2026-03-22 | - | Meta |
| 12 | Benestare | Torre D | 404 | Pedro Orlando Carias | Eder Veliz | 2026-03-08 | Q37,700.00 | Meta |
| 13 | Benestare | Torre D | 405 | Josseline Abigail Rodriguez Gonzales / Pablo Mejia | Ivan Castillo | 2026-03-14 | Q37,700.00 | Meta |
| 14 | Bosque Las Tapias | Torre B | 1305 | Evelin Yanira Ramos Regalado | Jose Gutierrez | 2026-02-16 | Q40,700.00 | - |
| 15 | Bosque Las Tapias | Torre C | 1009 | Dulce María Ruíz Alvarado | Paula Hernandez | 2025-12-20 | Q52,100.00 | Referido |
| 16 | Bosque Las Tapias | Torre C | 105 | Katerine Andrea Lucia Martínez Mejía | Jose Gutierrez | 2025-06-30 | Q45,864.00 | Perfilan |
| 17 | Bosque Las Tapias | Torre C | 1103 | Oscar Roberto Alejandro Valle Mayorga / Joselyne Jazmin Sicaja Chicas | Jose Gutierrez | 2025-12-09 | Q52,100.00 | Visita Inedita |
| 18 | Bosque Las Tapias | Torre C | 1107 | Ana Lucia Higueros Amaya / Erick Geovany Recinos Mejía | Jose Gutierrez | 2025-11-29 | Q52,100.00 | Evento Black week |
| 19 | Bosque Las Tapias | Torre C | 1204 | Luisa Mayari Ramirez Bran | Jose Gutierrez | 2025-07-14 | Q48,000.00 | Perfilan |
| 20 | Bosque Las Tapias | Torre C | 1207 | Marlon Pixtum y Mariela Hernández | Anahi Cisneros | 2026-03-22 | - | - |
| 21 | Bosque Las Tapias | Torre C | 1302 | Edwin Estuardo Acevedo Salguero | Gloria Cante | 2025-11-30 | Q52,100.00 | Referido |
| 22 | Bosque Las Tapias | Torre C | 202 | Mario Renato Gualín Reyes | Paula Hernandez | 2025-12-30 | Q52,100.00 | Facebook |
| 23 | Bosque Las Tapias | Torre C | 204 | Darwin Amilcar Rolando Corzantes Morales | Jose Gutierrez | 2025-09-15 | Q43,600.00 | Inbox |
| 24 | Bosque Las Tapias | Torre C | 405 | Maria Cristina Estrada Donis / Daniela Maribel Coronado Estrada | Jose Gutierrez | 2025-12-27 | Q44,600.00 | - |
| 25 | Bosque Las Tapias | Torre C | 505 | Lester Ariel Canahui Gomez | Jose Gutierrez | 2025-06-30 | Q43,540.00 | Perfilan |
| 26 | Bosque Las Tapias | Torre C | 603 | Hector Gabriel Fajardo Martinez / Jeennifer Paola Martinez Cruz de Fajardo | Jose Gutierrez | 2025-11-16 | Q52,100.00 | leds |
| 27 | Bosque Las Tapias | Torre C | 702 | Katherine Guisele Sazo Roche | Jose Gutierrez | 2025-09-02 | Q52,100.00 | Perfilan |
| 28 | Bosque Las Tapias | Torre C | 904 | Alvaro Victor Hernandez Mus | Paula Hernandez | 2025-06-28 | Q44,548.00 | Perfilan |

## Differences Found (Proposal for Review)

These records exist in both Excel and DB but have field-level differences.

### 1. Boulevard 5 — Principal — Unit 107
DB Reservation ID: `d45257a1-f61a-4ea3-b50b-472bac0d6d14`

| Field | Excel | DB |
|-------|-------|----|
| Enganche | Q80,500.00 | Q10,000.00 |

### 2. Boulevard 5 — Principal — Unit 208
DB Reservation ID: `0e98c8a1-3d21-4e87-a2ef-73c828fbd422`

| Field | Excel | DB |
|-------|-------|----|
| Cliente | Carlos Augusto Garcia | Carlos Garcia |
| Enganche | Q69,600.00 | Q10,000.00 |

### 3. Boulevard 5 — Principal — Unit 307
DB Reservation ID: `fc778de8-4ef9-4aef-b3e2-884189254ccd`

| Field | Excel | DB |
|-------|-------|----|
| Cliente | Hector Salvador Juárez Hernández / Angee Brizel Canelas Díaz | Hector Salvador Juárez Hernández - Angee Brizel Canelas Díaz |

### 4. Benestare — Torre B — Unit 202
DB Reservation ID: `8378d9b9-e146-4fcc-b3ee-f40d8452304c`

| Field | Excel | DB |
|-------|-------|----|
| Fecha | 2025-09-30 | 2024-09-30 |

### 5. Benestare — Torre B — Unit 302
DB Reservation ID: `d2a613c9-6889-433f-a679-fd32e084eb2c`

| Field | Excel | DB |
|-------|-------|----|
| Enganche | Q37,400.00 | Q1,500.00 |

### 6. Benestare — Torre D — Unit 605
DB Reservation ID: `3c8da07e-43bc-4d2a-9ba5-d4dddd07fcc3`

| Field | Excel | DB |
|-------|-------|----|
| Enganche | Q37,700.00 | Q1,000.00 |

### 7. Bosque Las Tapias — Torre C — Unit 101
DB Reservation ID: `42e5ecdd-017e-4dad-8ca9-5185f6053449`

| Field | Excel | DB |
|-------|-------|----|
| Cliente | Favio Javier Estrada Quiñonez / Candida Eva Daniela Ramirez López | Favio Javier Estrada Quiñonez - Candida Eva Daniela Ramirez López |

### 8. Bosque Las Tapias — Torre C — Unit 106
DB Reservation ID: `873baef6-ce7a-4923-aa3a-223bd0ed6c15`

| Field | Excel | DB |
|-------|-------|----|
| Cliente | Sarai del Rosario Muralles Navas de Garcia / Luis Enrique Garcia Tabelan | Sarai del Rosario Muralles Navas de Garcia - Luis Enrique Garcia Tabelan |

### 9. Bosque Las Tapias — Torre C — Unit 1303
DB Reservation ID: `d4ac5aee-e85f-499c-ad2a-d4df504c89f2`

| Field | Excel | DB |
|-------|-------|----|
| Enganche | Q52,100.00 | Q5,000.00 |

### 10. Bosque Las Tapias — Torre C — Unit 501
DB Reservation ID: `913202d0-2d1e-48b6-a959-4391f16d174c`

| Field | Excel | DB |
|-------|-------|----|
| Cliente | Kenneth David Cetino Ortiz / Hazel Suscely Cetino Ortiz | Kenneth David Cetino Ortiz - Hazel Suscely Cetino Ortiz |

### 11. Bosque Las Tapias — Torre C — Unit 802
DB Reservation ID: `f95983d3-4eb4-47ec-9128-204a7001bce8`

| Field | Excel | DB |
|-------|-------|----|
| Cliente | MariaJosé Boche Barillas | Maria José Boche Barillas |
| Enganche | Q52,100.00 | Q5,000.00 |

### 12. Bosque Las Tapias — Torre C — Unit 809
DB Reservation ID: `a1d8ca47-094d-4493-ba43-99a3e5e36e4e`

| Field | Excel | DB |
|-------|-------|----|
| Cliente | Masielle Dasayeth Monroy Hernandez / Lenin Alejandro Hidalgo Colindres | Masielle Dasayeth Monroy Hernandez - Lenin Alejandro Hidalgo Colindres |

### 13. Bosque Las Tapias — Torre C — Unit 902
DB Reservation ID: `8351b7ea-953b-4598-892b-5f2c588dbb64`

| Field | Excel | DB |
|-------|-------|----|
| Cliente | Febe Abigail Arana Franco / Luis Antonio Gómez Lucero | Febe Abigail Arana Franco - Luis Antonio Gómez Lucero |

### 14. Bosque Las Tapias — Torre C — Unit 905
DB Reservation ID: `92bda4ec-1d00-4dd8-8286-f5bf8f454ac3`

| Field | Excel | DB |
|-------|-------|----|
| Cliente | Oscar Josue Acabal Cun | Oscar Josue Acabal Cum |

## Lead Source Enrichments

DB records with NULL `lead_source` that can be populated from Excel `Medio`.

```sql
-- Proposed UPDATE statements for lead_source enrichment
UPDATE reservations SET lead_source = 'FB Lead' WHERE id = 'b0a9d3ca-d3db-4dc9-b884-479c95e6ccfa'; -- Boulevard 5 Principal Unit 1009
UPDATE reservations SET lead_source = 'Perfilan' WHERE id = 'bb8a56b0-37e1-4326-bbfd-338df831d837'; -- Boulevard 5 Principal Unit 1019
UPDATE reservations SET lead_source = 'Referido' WHERE id = 'dab878ce-0b0d-451d-b7cd-83e4fd4d153d'; -- Boulevard 5 Principal Unit 102
UPDATE reservations SET lead_source = 'Leds' WHERE id = '0ca0284c-f60c-4e87-bd32-166677bb0ff2'; -- Boulevard 5 Principal Unit 1020
UPDATE reservations SET lead_source = 'Facebook' WHERE id = '407d5b67-3f09-445c-b747-a63abf848f84'; -- Boulevard 5 Principal Unit 105
UPDATE reservations SET lead_source = 'Lead' WHERE id = '877b3d7e-f156-4c46-81f0-7567699011f4'; -- Boulevard 5 Principal Unit 106
UPDATE reservations SET lead_source = 'PBX' WHERE id = 'fbffe33e-b247-4a81-b0d8-e050c459509a'; -- Boulevard 5 Principal Unit 109
UPDATE reservations SET lead_source = 'FB Lead' WHERE id = '93383621-a162-41a9-a3ba-0f375304aab2'; -- Boulevard 5 Principal Unit 1101
UPDATE reservations SET lead_source = 'Facebook' WHERE id = '833b347e-fc1a-4789-94ef-e03bbfed481d'; -- Boulevard 5 Principal Unit 1114
UPDATE reservations SET lead_source = 'WhatsApp' WHERE id = '2e591371-834f-43bc-a571-3327930fb760'; -- Boulevard 5 Principal Unit 1115
UPDATE reservations SET lead_source = 'PBX' WHERE id = '6297d9f7-1860-43c0-8e27-da07e7512764'; -- Boulevard 5 Principal Unit 1118
UPDATE reservations SET lead_source = 'Pagina Web' WHERE id = '6a1b18f2-6251-4662-a4a4-4ca3592a6e89'; -- Boulevard 5 Principal Unit 113
UPDATE reservations SET lead_source = 'Pagina Web' WHERE id = 'd0d6c13a-f0d5-4147-9e57-d392331d3515'; -- Boulevard 5 Principal Unit 1201
UPDATE reservations SET lead_source = 'Pipedrive 2023' WHERE id = '5d392025-d3cc-4018-9d50-756516fc874c'; -- Boulevard 5 Principal Unit 1216
UPDATE reservations SET lead_source = 'Chatbot' WHERE id = '2e868530-3f95-442a-b4a2-4605c436b777'; -- Boulevard 5 Principal Unit 1217
UPDATE reservations SET lead_source = 'Referido' WHERE id = '6b2fdb11-b30c-4edd-afa9-c3ea63a08e30'; -- Boulevard 5 Principal Unit 1218
UPDATE reservations SET lead_source = 'Pagina Web' WHERE id = '4250f71a-8d6f-45d6-85c9-52003502e8f9'; -- Boulevard 5 Principal Unit 1301
UPDATE reservations SET lead_source = 'Pagina Web' WHERE id = '99742320-7af6-4732-8605-2f0b12879e53'; -- Boulevard 5 Principal Unit 1302
UPDATE reservations SET lead_source = 'FB lead Pipedrive' WHERE id = '9b1689ba-e144-42af-ad4d-eb3a1760ddd0'; -- Boulevard 5 Principal Unit 1305
UPDATE reservations SET lead_source = 'Pipedrive 2023' WHERE id = '121a64ef-a3ff-4b9a-9fcd-c62f2ee4c6e7'; -- Boulevard 5 Principal Unit 1315
UPDATE reservations SET lead_source = 'Pagina Web' WHERE id = 'cb58fe82-9975-4f40-bd12-b05bca92dc83'; -- Boulevard 5 Principal Unit 1317
UPDATE reservations SET lead_source = 'Lead PBX' WHERE id = '8195a749-baaa-457c-b970-1e4c6d91d354'; -- Boulevard 5 Principal Unit 1318
UPDATE reservations SET lead_source = 'FB Lead' WHERE id = '234aa363-8d88-4606-834d-7eca51665fb1'; -- Boulevard 5 Principal Unit 1402
UPDATE reservations SET lead_source = 'Referido' WHERE id = '64c86111-4b6d-4f14-b68f-7ee66399fe14'; -- Boulevard 5 Principal Unit 1408
UPDATE reservations SET lead_source = 'leds' WHERE id = '7019ce64-25d7-4787-847e-bdf0651af3bc'; -- Boulevard 5 Principal Unit 1501
UPDATE reservations SET lead_source = 'PBX' WHERE id = '54f7a4df-17c7-466c-b115-76a07f700e29'; -- Boulevard 5 Principal Unit 1502
UPDATE reservations SET lead_source = 'Facebook' WHERE id = '0bcdb4a3-142c-479d-8ec4-ca2cffbc2423'; -- Boulevard 5 Principal Unit 1505
UPDATE reservations SET lead_source = 'Pipedrive 2023' WHERE id = 'd9a0f0e8-485a-4dff-8ad8-07618b8491e9'; -- Boulevard 5 Principal Unit 1509
UPDATE reservations SET lead_source = 'Valla' WHERE id = '84131aa5-3f09-4720-9ec6-eb6a50ba990e'; -- Boulevard 5 Principal Unit 1605
UPDATE reservations SET lead_source = 'Junta Directiva' WHERE id = '3f7bc29e-a978-4df9-a13c-ff8ff07a6d3d'; -- Boulevard 5 Principal Unit 1607
UPDATE reservations SET lead_source = 'Lead' WHERE id = 'f8eaad23-5140-448c-9c9a-80713b664563'; -- Boulevard 5 Principal Unit 1612
UPDATE reservations SET lead_source = 'Facebook' WHERE id = '5172513c-669b-4099-a21f-2ea810eacc05'; -- Boulevard 5 Principal Unit 1703
UPDATE reservations SET lead_source = 'Facebook' WHERE id = 'b15dc4ec-d6a7-4a88-a45b-6befc4f571c7'; -- Boulevard 5 Principal Unit 1705
UPDATE reservations SET lead_source = 'Referido' WHERE id = 'ccf323c0-c5bc-4b80-958d-3b86fbb87557'; -- Boulevard 5 Principal Unit 1707
UPDATE reservations SET lead_source = 'Web Forms' WHERE id = 'b1d2cb35-a67b-4f3b-bc30-219a65675407'; -- Boulevard 5 Principal Unit 1708
UPDATE reservations SET lead_source = 'Meta' WHERE id = 'a647dd8f-339e-47ba-b99b-265af88dbfff'; -- Boulevard 5 Principal Unit 1803
UPDATE reservations SET lead_source = 'Meta' WHERE id = '7ebf8a26-091f-4fe5-ae08-4bf36dc832b4'; -- Boulevard 5 Principal Unit 1805
UPDATE reservations SET lead_source = 'Valla' WHERE id = 'bcacaf23-14d7-491c-ac80-cdc03bae40f4'; -- Boulevard 5 Principal Unit 202
UPDATE reservations SET lead_source = 'Referido' WHERE id = 'e4f7f51f-8f10-4cce-b175-123b668c62f8'; -- Boulevard 5 Principal Unit 204
UPDATE reservations SET lead_source = 'Pagina Web' WHERE id = 'cfb2c107-0342-42b9-a7dd-24ea435130d0'; -- Boulevard 5 Principal Unit 205
UPDATE reservations SET lead_source = 'Lead' WHERE id = '485fe3fd-0089-4db4-a75e-09a4679fb7ed'; -- Boulevard 5 Principal Unit 207
UPDATE reservations SET lead_source = 'lead' WHERE id = '0e98c8a1-3d21-4e87-a2ef-73c828fbd422'; -- Boulevard 5 Principal Unit 208
UPDATE reservations SET lead_source = 'Señaletica' WHERE id = '92ae0967-dce8-4fa7-92ac-2a6ae6145061'; -- Boulevard 5 Principal Unit 209
UPDATE reservations SET lead_source = 'Perfilan FB' WHERE id = 'd0f1c831-0b1d-44f9-abbc-ce7ac13e2286'; -- Boulevard 5 Principal Unit 210
UPDATE reservations SET lead_source = 'lead' WHERE id = '6a2f380a-f47f-4d2d-86f0-fd3e9c3466fd'; -- Boulevard 5 Principal Unit 211
UPDATE reservations SET lead_source = 'FB Lead' WHERE id = 'd741dd0b-21b8-4d4e-8ad9-3bad12696b34'; -- Boulevard 5 Principal Unit 213
UPDATE reservations SET lead_source = 'Mentor' WHERE id = '9ace14fe-961c-4efb-8e50-8ad21041076e'; -- Boulevard 5 Principal Unit 215
UPDATE reservations SET lead_source = 'PBX' WHERE id = 'b5d0d6f8-3e15-40cd-93c3-f8a88fdd140b'; -- Boulevard 5 Principal Unit 216
UPDATE reservations SET lead_source = 'WhatsApp' WHERE id = 'ee0ca2cb-736f-4e60-959f-1da924c91180'; -- Boulevard 5 Principal Unit 301
UPDATE reservations SET lead_source = 'PBX' WHERE id = '3a78834b-d84b-475e-adc3-885e81128a81'; -- Boulevard 5 Principal Unit 302
UPDATE reservations SET lead_source = 'WhatsApp' WHERE id = 'b21afe15-d97d-471b-a7d1-bb1db3cfce62'; -- Boulevard 5 Principal Unit 304
UPDATE reservations SET lead_source = 'Facebook' WHERE id = '41525179-5539-4b4c-9219-4cc0b8effbd9'; -- Boulevard 5 Principal Unit 305
UPDATE reservations SET lead_source = 'Meta' WHERE id = '66455911-a04b-45b7-aa56-9e98a64dbcb5'; -- Boulevard 5 Principal Unit 306
UPDATE reservations SET lead_source = 'Whatsapp/META' WHERE id = 'fc778de8-4ef9-4aef-b3e2-884189254ccd'; -- Boulevard 5 Principal Unit 307
UPDATE reservations SET lead_source = 'WhatsApp' WHERE id = '39892b84-0b6f-4722-b08f-b3d4ba9d2701'; -- Boulevard 5 Principal Unit 308
UPDATE reservations SET lead_source = 'Facebook' WHERE id = '4879d428-1f20-4669-8554-dc685bd335d6'; -- Boulevard 5 Principal Unit 309
UPDATE reservations SET lead_source = 'Fb lead' WHERE id = '078a5e1f-67bb-4024-a423-637d7c5d8e23'; -- Boulevard 5 Principal Unit 311
UPDATE reservations SET lead_source = 'Pagina Web' WHERE id = 'fcb6725d-dc6c-45f9-afb7-9ddfe380d756'; -- Boulevard 5 Principal Unit 312
UPDATE reservations SET lead_source = 'Chatbot' WHERE id = 'ecc4ddb6-29f8-428b-b328-0fe9f52a7301'; -- Boulevard 5 Principal Unit 313
UPDATE reservations SET lead_source = 'Referido de cliente Apto. 210' WHERE id = '03e805d3-dbd0-4167-87bc-c0b572cb8b7c'; -- Boulevard 5 Principal Unit 314
UPDATE reservations SET lead_source = 'PBX' WHERE id = '0fd9cad0-9ae4-49c0-8f79-ad02ed49c907'; -- Boulevard 5 Principal Unit 315
UPDATE reservations SET lead_source = 'Meta' WHERE id = '11c91c85-f44e-4f3a-8259-06e617298ff6'; -- Boulevard 5 Principal Unit 405
UPDATE reservations SET lead_source = 'WhatsApp Perfilan' WHERE id = '4636f52a-1c40-4f3c-a1d6-5d59b889573d'; -- Boulevard 5 Principal Unit 406
UPDATE reservations SET lead_source = 'Perfilan' WHERE id = '0ee5e065-4f0c-41e2-bb6f-f5596b9a9c67'; -- Boulevard 5 Principal Unit 407
UPDATE reservations SET lead_source = 'Facebook' WHERE id = 'b6e584e3-afb7-46c2-8498-4a7dd79711be'; -- Boulevard 5 Principal Unit 409
UPDATE reservations SET lead_source = 'Perfilan FB' WHERE id = 'd7dbed0c-3d15-4143-ad31-046aa4b7c25f'; -- Boulevard 5 Principal Unit 410
UPDATE reservations SET lead_source = 'Meta' WHERE id = 'e2035736-1299-4300-ab81-815667333e8f'; -- Boulevard 5 Principal Unit 412
UPDATE reservations SET lead_source = 'Facebook' WHERE id = '357e5ed0-767d-462f-9d25-79ab0427e359'; -- Boulevard 5 Principal Unit 413
UPDATE reservations SET lead_source = 'PBX' WHERE id = '79efbd7f-ad10-403e-bc42-0256ba0abf3f'; -- Boulevard 5 Principal Unit 414
UPDATE reservations SET lead_source = 'WhatsApp/ Perfinal' WHERE id = 'ea959520-e3eb-4aa4-b1c8-abc0637b1fa3'; -- Boulevard 5 Principal Unit 415
UPDATE reservations SET lead_source = 'FB Lead' WHERE id = 'e9df55f6-b302-4c92-a1e3-49d36807ac96'; -- Boulevard 5 Principal Unit 416
UPDATE reservations SET lead_source = 'FB lead Pipedrive' WHERE id = 'ebb4fc7b-9eee-4701-b9dc-465c506dfed3'; -- Boulevard 5 Principal Unit 418
UPDATE reservations SET lead_source = 'Facebook' WHERE id = '765b7ba8-06cb-4bbc-bb82-a4a525f38391'; -- Boulevard 5 Principal Unit 420
UPDATE reservations SET lead_source = 'Facebook' WHERE id = '8f250d51-438b-4dff-8aaa-324745d3536b'; -- Boulevard 5 Principal Unit 501
UPDATE reservations SET lead_source = 'lead' WHERE id = 'fadd819a-f4e4-451b-85d4-362c4f5766c1'; -- Boulevard 5 Principal Unit 502
UPDATE reservations SET lead_source = 'WhatsApp Pipedrive' WHERE id = 'dcac217c-ac0d-438c-9bc7-ad2ec07706ac'; -- Boulevard 5 Principal Unit 503
UPDATE reservations SET lead_source = 'Referido de un amigo' WHERE id = '57a3ec0c-2136-405e-bc31-39740256200d'; -- Boulevard 5 Principal Unit 504
UPDATE reservations SET lead_source = 'WhatsApp' WHERE id = 'f25aa679-2958-4dfd-bef2-ccb2caf92ca2'; -- Boulevard 5 Principal Unit 505
UPDATE reservations SET lead_source = 'PBX' WHERE id = 'd1ae8824-730e-48e4-a584-7437270cc3de'; -- Boulevard 5 Principal Unit 506
UPDATE reservations SET lead_source = 'Pagina Web' WHERE id = '4bb58ffb-37fc-42b2-9939-f47705277e4d'; -- Boulevard 5 Principal Unit 508
UPDATE reservations SET lead_source = 'Whatsapp' WHERE id = 'c7c60ec0-cff1-4996-aec9-91641ff61777'; -- Boulevard 5 Principal Unit 509
UPDATE reservations SET lead_source = 'FB Lead' WHERE id = 'd2ae6b25-ed76-4302-9c5e-0b67bc5b42a0'; -- Boulevard 5 Principal Unit 510
UPDATE reservations SET lead_source = 'Fb Lead' WHERE id = 'e61b27cc-551b-47b8-a17b-c069aac5b170'; -- Boulevard 5 Principal Unit 511
UPDATE reservations SET lead_source = 'Facebook' WHERE id = '3f88774a-7651-4045-9cee-cfebd4781896'; -- Boulevard 5 Principal Unit 514
UPDATE reservations SET lead_source = 'Feria' WHERE id = '83869227-c4b6-4480-92d6-70e858e316a5'; -- Boulevard 5 Principal Unit 516
UPDATE reservations SET lead_source = 'Referido' WHERE id = '5867052f-53f2-4df8-9236-e1daa86f5991'; -- Boulevard 5 Principal Unit 517
UPDATE reservations SET lead_source = 'valla' WHERE id = '42a46888-d3d3-4f15-952e-b375b8f2dd94'; -- Boulevard 5 Principal Unit 518
UPDATE reservations SET lead_source = 'Perfilan' WHERE id = '6d2b6fa8-e0f6-46a1-842d-4f904768cd55'; -- Boulevard 5 Principal Unit 519
UPDATE reservations SET lead_source = 'FB Lead' WHERE id = '352f3d21-6e4d-493a-af24-7ec56b7fc789'; -- Boulevard 5 Principal Unit 601
UPDATE reservations SET lead_source = 'Perfilan' WHERE id = '04f9e4fc-9373-4b3a-993e-37c0c567ddb5'; -- Boulevard 5 Principal Unit 602
UPDATE reservations SET lead_source = 'Pagina Web' WHERE id = '9709d295-cdac-4dda-ac30-4d06c04f37e5'; -- Boulevard 5 Principal Unit 603
UPDATE reservations SET lead_source = 'Chatbot' WHERE id = '0070593e-27e3-4e99-a047-6c6500236adc'; -- Boulevard 5 Principal Unit 604
UPDATE reservations SET lead_source = 'WhatsApp' WHERE id = '9431b96c-0199-416f-9c2f-6b52d10c0449'; -- Boulevard 5 Principal Unit 605
UPDATE reservations SET lead_source = 'Valla' WHERE id = '0f43415a-1253-4f94-8bf5-c06350cc3b09'; -- Boulevard 5 Principal Unit 606
UPDATE reservations SET lead_source = 'Valla' WHERE id = 'b9a6b5a3-80bb-4dc4-9345-ae6db246b7ae'; -- Boulevard 5 Principal Unit 607
UPDATE reservations SET lead_source = 'Pagina Web' WHERE id = 'f46b6ede-f8aa-4c67-965c-ca4f6e2e2caa'; -- Boulevard 5 Principal Unit 609
UPDATE reservations SET lead_source = 'Referido' WHERE id = '84cc7259-783f-41b2-ba8f-8d6e81f5a1cc'; -- Boulevard 5 Principal Unit 611
UPDATE reservations SET lead_source = 'Perfilan' WHERE id = 'f4ae69db-d906-4908-84ea-3b6e6e8bc374'; -- Boulevard 5 Principal Unit 612
UPDATE reservations SET lead_source = 'Perfilan' WHERE id = '90f2ad12-cd5c-4f81-82be-4a6c635e0c2e'; -- Boulevard 5 Principal Unit 614
UPDATE reservations SET lead_source = 'Referido' WHERE id = '09b2a74f-409d-467d-8d31-504dbf1b73c4'; -- Boulevard 5 Principal Unit 616
UPDATE reservations SET lead_source = 'Referido' WHERE id = '4f51f8b9-fd73-4d42-b49d-e31b51075aeb'; -- Boulevard 5 Principal Unit 617
UPDATE reservations SET lead_source = 'PBX' WHERE id = 'd04b0412-2380-4c2a-a6b9-5030e57cbbcd'; -- Boulevard 5 Principal Unit 618
UPDATE reservations SET lead_source = 'Pagina Web' WHERE id = 'f16f1851-7d38-49e7-90a0-886baacfe95b'; -- Boulevard 5 Principal Unit 619
UPDATE reservations SET lead_source = 'FB Lead' WHERE id = 'b2be712b-e285-4836-a3e5-1259388e4ced'; -- Boulevard 5 Principal Unit 703
UPDATE reservations SET lead_source = 'Pagina Web' WHERE id = '6aa44aaa-acce-4233-b5c8-52e34792575f'; -- Boulevard 5 Principal Unit 704
UPDATE reservations SET lead_source = 'Valla' WHERE id = 'fc1bdf84-63d3-4a69-bf2d-e03967786fa9'; -- Boulevard 5 Principal Unit 705
UPDATE reservations SET lead_source = 'Pagina Web' WHERE id = 'ff3e94c8-42bc-45d8-93f2-bdd7185e8f60'; -- Boulevard 5 Principal Unit 706
UPDATE reservations SET lead_source = 'Facebook' WHERE id = '9d63212e-044c-40c4-91f9-a0309cb5d0fe'; -- Boulevard 5 Principal Unit 707
UPDATE reservations SET lead_source = 'Valla Publicitaria' WHERE id = '86edfddc-5be1-4918-8ff4-310a0cbfdc8a'; -- Boulevard 5 Principal Unit 709
UPDATE reservations SET lead_source = 'FB Lead' WHERE id = 'c914c830-9432-447f-b730-d1dd8196fbd5'; -- Boulevard 5 Principal Unit 711
UPDATE reservations SET lead_source = 'Pagina Web' WHERE id = '6f782a23-9435-48d0-bd3b-d6572934d62e'; -- Boulevard 5 Principal Unit 714
UPDATE reservations SET lead_source = 'Referido' WHERE id = '1ee334a6-45b3-4b62-acbe-08215c705e56'; -- Boulevard 5 Principal Unit 717
UPDATE reservations SET lead_source = 'Meta' WHERE id = 'd3373656-0bbd-4f98-b159-0e252fa37782'; -- Boulevard 5 Principal Unit 718
UPDATE reservations SET lead_source = 'Referido' WHERE id = 'ab3eeb28-dd79-4474-b220-3466f1ee935e'; -- Boulevard 5 Principal Unit 805
UPDATE reservations SET lead_source = 'Valla' WHERE id = 'b9be1813-e4a0-4553-8915-c395313084ca'; -- Boulevard 5 Principal Unit 806
UPDATE reservations SET lead_source = 'Página Web' WHERE id = 'a5dd1374-6c25-4162-85c5-5ea7d496f686'; -- Boulevard 5 Principal Unit 808
UPDATE reservations SET lead_source = 'FB Lead' WHERE id = 'd2e44476-6193-43c3-8c98-3f1d2aabb0e8'; -- Boulevard 5 Principal Unit 809
UPDATE reservations SET lead_source = 'Referido' WHERE id = '1413de1a-4d00-4ff3-8350-9a9f505dcdcc'; -- Boulevard 5 Principal Unit 811
UPDATE reservations SET lead_source = 'Referido' WHERE id = '3bd37f2c-0f39-45cb-a068-b471ea6d06d8'; -- Boulevard 5 Principal Unit 812
UPDATE reservations SET lead_source = 'Pagina Web' WHERE id = '39ac1eb4-0986-439a-b290-67784d3d57d4'; -- Boulevard 5 Principal Unit 813
UPDATE reservations SET lead_source = 'Fb Lead' WHERE id = '89c10ed9-8176-447d-bbdc-3846799a6292'; -- Boulevard 5 Principal Unit 905
UPDATE reservations SET lead_source = 'Lead' WHERE id = '8d8cc7c0-3e36-49fe-9437-853e4446df79'; -- Boulevard 5 Principal Unit 906
UPDATE reservations SET lead_source = 'Chatbot' WHERE id = 'e1c3c2d4-ff41-413c-92ab-d203dc4548ee'; -- Boulevard 5 Principal Unit 913
UPDATE reservations SET lead_source = 'Facebook' WHERE id = 'eefe005c-be6b-4a3f-b5d6-c1872b5735c5'; -- Benestare Torre A Unit 201
UPDATE reservations SET lead_source = 'Facebook' WHERE id = '70c228dc-5ad7-48d4-8465-2a23bb72dd0d'; -- Benestare Torre A Unit 203
UPDATE reservations SET lead_source = 'PD' WHERE id = '24028222-214a-4330-bcfb-55dc94fd1f82'; -- Benestare Torre A Unit 209
UPDATE reservations SET lead_source = 'PD' WHERE id = '4fe29c5d-9893-412d-a081-92533eb073df'; -- Benestare Torre A Unit 302
UPDATE reservations SET lead_source = 'Instagram' WHERE id = '8d947f67-cec7-41e8-9b57-5bfa5da9b8c9'; -- Benestare Torre A Unit 306
UPDATE reservations SET lead_source = 'Perfilan/ FB' WHERE id = '5aecb938-0b5e-45b8-8c62-39929aa2f98b'; -- Benestare Torre A Unit 309
UPDATE reservations SET lead_source = 'Perfilan/ FB' WHERE id = '86d58dcb-d821-4c00-a96f-f077b8a056a4'; -- Benestare Torre A Unit 405
UPDATE reservations SET lead_source = 'Perfilan/ FB' WHERE id = 'abf125f0-4b4e-4e65-93c7-ca73208833e2'; -- Benestare Torre A Unit 501
UPDATE reservations SET lead_source = 'Señaletica' WHERE id = 'cf64b52d-35f6-4214-9b70-413df763abb4'; -- Benestare Torre A Unit 503
UPDATE reservations SET lead_source = 'Señaletica' WHERE id = '594755f6-e6ae-4997-a931-7760d55d3e12'; -- Benestare Torre A Unit 504
UPDATE reservations SET lead_source = 'Wati' WHERE id = '7e4c6d38-3081-41a9-895f-358c9ec2fe3e'; -- Benestare Torre A Unit 505
UPDATE reservations SET lead_source = 'Perfilan/ FB' WHERE id = 'c2ea2bcd-043d-4025-934a-abc9774d5424'; -- Benestare Torre A Unit 507
UPDATE reservations SET lead_source = 'Perfilan/ FB' WHERE id = 'cc2519de-e0aa-403f-bf71-0b1ab8f94982'; -- Benestare Torre A Unit 508
UPDATE reservations SET lead_source = 'Referido' WHERE id = 'a2f22086-e923-43c2-8be0-210a4ab6424d'; -- Benestare Torre A Unit 509
UPDATE reservations SET lead_source = 'Referido de Cliente' WHERE id = '5bf38ce9-c9f1-4bc8-9629-9c9880ba9d6c'; -- Benestare Torre A Unit 604
UPDATE reservations SET lead_source = 'Perfilan/ FB' WHERE id = '32a8bb71-3922-4889-a76e-feefdec69b60'; -- Benestare Torre A Unit 606
UPDATE reservations SET lead_source = 'WhatsApp' WHERE id = 'd74dd5e3-3225-4bc0-a155-dadb180ec2a4'; -- Benestare Torre A Unit 608
UPDATE reservations SET lead_source = 'PD' WHERE id = '27de8e9a-9247-4d58-8d44-c929ac0b0be5'; -- Benestare Torre B Unit 101
UPDATE reservations SET lead_source = 'Facebook' WHERE id = '869d9952-74aa-4421-9676-7bd6ea090138'; -- Benestare Torre B Unit 102
UPDATE reservations SET lead_source = 'Señaletica' WHERE id = 'c8e33fc9-659f-4c1d-ae1b-599e9ed5b0c1'; -- Benestare Torre B Unit 103
UPDATE reservations SET lead_source = 'Perfilan Facebook' WHERE id = '354af457-09e8-4027-9da9-644a50067725'; -- Benestare Torre B Unit 104
UPDATE reservations SET lead_source = 'Visita' WHERE id = '2fd4e9c4-5700-42e1-9bcc-c23803259cb8'; -- Benestare Torre B Unit 105
UPDATE reservations SET lead_source = 'Visita' WHERE id = '51e3bd49-dae3-432a-98b1-339c0f9e6c43'; -- Benestare Torre B Unit 106
UPDATE reservations SET lead_source = 'Perfilan Facebook' WHERE id = 'bcd8d919-4b3e-4170-a4d3-45c4c4ce8271'; -- Benestare Torre B Unit 108
UPDATE reservations SET lead_source = 'Facebook' WHERE id = '280262b5-558d-4bd8-bdd4-7304f12ff584'; -- Benestare Torre B Unit 109
UPDATE reservations SET lead_source = 'PD' WHERE id = 'bb4f806f-5055-4ae8-8900-c008719c3e64'; -- Benestare Torre B Unit 110
UPDATE reservations SET lead_source = 'Señaletica' WHERE id = '0ed10ee0-3ea5-4d8d-8363-0cad5688fff3'; -- Benestare Torre B Unit 111
UPDATE reservations SET lead_source = 'Perfilan' WHERE id = '7f8159f1-aeb1-459d-8004-a0e079781a80'; -- Benestare Torre B Unit 112
UPDATE reservations SET lead_source = 'Perfilan Facebook' WHERE id = 'd927cca8-2d15-4b0e-a271-8f3feefe2c70'; -- Benestare Torre B Unit 113
UPDATE reservations SET lead_source = 'Facebook' WHERE id = '8378d9b9-e146-4fcc-b3ee-f40d8452304c'; -- Benestare Torre B Unit 202
UPDATE reservations SET lead_source = 'Meta' WHERE id = 'd5a4bf07-edf7-42b1-a949-4e3a40c4d591'; -- Benestare Torre B Unit 203
UPDATE reservations SET lead_source = 'Facebook' WHERE id = 'eb442cdb-7edd-44dc-9cf4-c3d8ce065312'; -- Benestare Torre B Unit 204
UPDATE reservations SET lead_source = 'Facebook' WHERE id = 'f38dcf22-8ecd-4769-b016-757a6322f095'; -- Benestare Torre B Unit 206
UPDATE reservations SET lead_source = 'PD' WHERE id = '3a093dce-75a2-4faa-8094-28a13387809d'; -- Benestare Torre B Unit 208
UPDATE reservations SET lead_source = 'Perfilan Facebook' WHERE id = 'c2ff7520-1442-4bf8-b5ce-77bfbef47401'; -- Benestare Torre B Unit 209
UPDATE reservations SET lead_source = 'Meta' WHERE id = '6be2c6c3-1d06-4da6-b328-dfd3b33bea35'; -- Benestare Torre B Unit 210
UPDATE reservations SET lead_source = 'Perfilan Facebook' WHERE id = '93ec5890-b387-43d6-89d1-8c67f77af827'; -- Benestare Torre B Unit 211
UPDATE reservations SET lead_source = 'Perfilan Facebook' WHERE id = '86d0ec63-ca76-43c5-8867-a04f51529925'; -- Benestare Torre B Unit 212
UPDATE reservations SET lead_source = 'Perfilan Facebook' WHERE id = '0527cabd-7f5f-444c-b6e4-5db56ccf526a'; -- Benestare Torre B Unit 213
UPDATE reservations SET lead_source = 'PD' WHERE id = 'd00b84b6-1c19-4395-b789-a05bb2f04500'; -- Benestare Torre B Unit 301
UPDATE reservations SET lead_source = 'Meta' WHERE id = 'd2a613c9-6889-433f-a679-fd32e084eb2c'; -- Benestare Torre B Unit 302
UPDATE reservations SET lead_source = 'PD' WHERE id = 'f20ea721-3ec4-49b0-bc05-94994d2e4785'; -- Benestare Torre B Unit 303
UPDATE reservations SET lead_source = 'PD' WHERE id = '61920321-3979-473f-9cf3-7ea4b9860d26'; -- Benestare Torre B Unit 304
UPDATE reservations SET lead_source = 'Perfilan Facebook' WHERE id = 'a5279fcc-62a5-46a2-b10f-08c488fa1c23'; -- Benestare Torre B Unit 305
UPDATE reservations SET lead_source = 'Meta' WHERE id = '9ba33225-3c91-4926-9c8b-acfa4c991670'; -- Benestare Torre B Unit 306
UPDATE reservations SET lead_source = 'WhatsApp' WHERE id = 'eebeda3e-7745-4f77-988b-ae548126b3a6'; -- Benestare Torre B Unit 308
UPDATE reservations SET lead_source = 'Perfilan Facebook' WHERE id = '361c05de-bd73-43e1-a20c-5be65d51766e'; -- Benestare Torre B Unit 309
UPDATE reservations SET lead_source = 'PD' WHERE id = 'b13ef691-364c-40e2-be86-25919126a79e'; -- Benestare Torre B Unit 310
UPDATE reservations SET lead_source = 'Wati' WHERE id = '5454175c-fb1a-4281-984e-e9ad9fa0307c'; -- Benestare Torre B Unit 311
UPDATE reservations SET lead_source = 'Perfilan Facebook' WHERE id = 'ef2827b5-0e3d-423f-a759-2d99ba082a1e'; -- Benestare Torre B Unit 312
UPDATE reservations SET lead_source = 'Señaletica' WHERE id = '696edfac-dee5-4d22-bb73-66688b26b422'; -- Benestare Torre B Unit 401
UPDATE reservations SET lead_source = 'lead Meta' WHERE id = 'd1884114-85b1-47e5-b00f-30887b22b949'; -- Benestare Torre B Unit 403
UPDATE reservations SET lead_source = 'Facebook' WHERE id = '38b3acd1-05ea-4ec1-bde8-0272b4869a0c'; -- Benestare Torre B Unit 404
UPDATE reservations SET lead_source = 'Referido' WHERE id = '758eec2b-c03e-4e31-b978-77ec5c8cd214'; -- Benestare Torre B Unit 405
UPDATE reservations SET lead_source = 'Meta' WHERE id = '633941fa-741b-461c-948c-4ffff35a9094'; -- Benestare Torre B Unit 406
UPDATE reservations SET lead_source = 'Perfilan Facebook' WHERE id = 'e53f1ddb-8c5d-461b-9f65-386a1fb8a140'; -- Benestare Torre B Unit 407
UPDATE reservations SET lead_source = 'Meta' WHERE id = '345ec41d-8515-498b-a173-37eaa21cfaa8'; -- Benestare Torre B Unit 408
UPDATE reservations SET lead_source = 'Referido de cliente' WHERE id = '647bbb21-b8b8-452e-8ac2-fb45fb8886d1'; -- Benestare Torre B Unit 409
UPDATE reservations SET lead_source = 'Facebook' WHERE id = '19508f78-f7ce-4d2e-b189-044691bcdbd8'; -- Benestare Torre B Unit 410
UPDATE reservations SET lead_source = 'Perfilan Facebook' WHERE id = '75bd26f0-6b08-42d3-8dda-a3babfbaba67'; -- Benestare Torre B Unit 411
UPDATE reservations SET lead_source = 'Perfilan Facebook' WHERE id = 'a30d80e2-b846-4710-ab67-a28fbfe3870b'; -- Benestare Torre B Unit 412
UPDATE reservations SET lead_source = 'PD' WHERE id = 'dff0bab2-c10c-41eb-9157-e84697decb71'; -- Benestare Torre B Unit 413
UPDATE reservations SET lead_source = 'Perfilan Facebook' WHERE id = '6b6648c3-399e-4f3c-8bf6-0977764ff223'; -- Benestare Torre B Unit 501
UPDATE reservations SET lead_source = 'Perfilan Facebook' WHERE id = 'd9bfbc73-c646-4589-803b-478499143ea8'; -- Benestare Torre B Unit 502
UPDATE reservations SET lead_source = 'Meta' WHERE id = 'b72627ca-522c-4c1e-ba7f-71787cb6ac33'; -- Benestare Torre B Unit 503
UPDATE reservations SET lead_source = 'Perfilan Facebook' WHERE id = '82beddd1-8841-49db-8b03-304f2036ea13'; -- Benestare Torre B Unit 504
UPDATE reservations SET lead_source = 'Perfilan Facebook' WHERE id = 'd3dbacae-7f98-4ce8-b22d-b69963930f12'; -- Benestare Torre B Unit 505
UPDATE reservations SET lead_source = 'Señaletica' WHERE id = 'e2007051-4d50-4997-a167-aa61fa111d53'; -- Benestare Torre B Unit 506
UPDATE reservations SET lead_source = 'Perfilan Facebook' WHERE id = 'f041943d-0485-44bf-babe-05f66b3f9b4a'; -- Benestare Torre B Unit 508
UPDATE reservations SET lead_source = 'Referido' WHERE id = 'ed8c214b-b796-4b72-b7d1-b98bba28b9a8'; -- Benestare Torre B Unit 509
UPDATE reservations SET lead_source = 'Perfilan Facebook' WHERE id = '258b7cbd-28b3-4a87-a600-918737853d4c'; -- Benestare Torre B Unit 510
UPDATE reservations SET lead_source = 'Perfilan Facebook' WHERE id = '2f48e71b-b8a6-485f-a509-a5f0fca2daff'; -- Benestare Torre B Unit 511
UPDATE reservations SET lead_source = 'Señaletica' WHERE id = '61dd5991-f0e8-416a-a6d2-316d9fc4a86c'; -- Benestare Torre B Unit 512
UPDATE reservations SET lead_source = 'Perfilan' WHERE id = 'f3d6cfef-a66f-4029-a3cb-94f1385aebf4'; -- Benestare Torre B Unit 513
UPDATE reservations SET lead_source = 'Facebook' WHERE id = 'f0adeb45-940f-4327-838b-0c0155e5099d'; -- Benestare Torre B Unit 601
UPDATE reservations SET lead_source = 'Facebook' WHERE id = 'c741f18f-f303-4326-a474-f24af8288640'; -- Benestare Torre B Unit 602
UPDATE reservations SET lead_source = 'PD' WHERE id = 'b48ddf6e-f884-499c-8f39-b8362badc2c6'; -- Benestare Torre B Unit 603
UPDATE reservations SET lead_source = 'Meta' WHERE id = 'cce78717-a0c7-4dd4-a60d-23808d4536db'; -- Benestare Torre B Unit 604
UPDATE reservations SET lead_source = 'PD' WHERE id = '6bbbfe94-b534-44bc-9f8d-5c2e5d781ce5'; -- Benestare Torre B Unit 605
UPDATE reservations SET lead_source = 'PD' WHERE id = '688a4175-921a-444c-bf35-c8666b55ac0b'; -- Benestare Torre B Unit 606
UPDATE reservations SET lead_source = 'Meta' WHERE id = '76f4c01d-3149-42ad-88f0-92ec32802195'; -- Benestare Torre B Unit 607
UPDATE reservations SET lead_source = 'Perfilan Facebook' WHERE id = '0e923b53-34d3-4ab1-b4db-1dfa1739d8c5'; -- Benestare Torre B Unit 608
UPDATE reservations SET lead_source = 'Perfilan Facebook' WHERE id = '01c53955-c97f-4e01-b131-9ce126aedf5f'; -- Benestare Torre B Unit 609
UPDATE reservations SET lead_source = 'Perfilan Facebook' WHERE id = '9f92d387-5117-4110-93bf-04fe319b7335'; -- Benestare Torre B Unit 611
UPDATE reservations SET lead_source = 'PD' WHERE id = '54fe2f83-093e-41c5-98f3-50d98294a12d'; -- Benestare Torre B Unit 612
UPDATE reservations SET lead_source = 'PD' WHERE id = 'abd9d4d2-31eb-4cf1-a177-ba9a432f3ee1'; -- Benestare Torre B Unit 613
UPDATE reservations SET lead_source = 'Perfilan' WHERE id = 'c58728fc-01b7-4ced-8237-386ae6d44b66'; -- Benestare Torre C Unit 101
UPDATE reservations SET lead_source = 'Facebook' WHERE id = '4b031725-a46c-4df8-b257-ac5443ac7b92'; -- Benestare Torre C Unit 102
UPDATE reservations SET lead_source = 'Señaletica' WHERE id = '832b6efd-31a4-4045-bc33-58875da82daa'; -- Benestare Torre C Unit 103
UPDATE reservations SET lead_source = 'Meta' WHERE id = '88fb116f-ab0a-4830-8c23-34c9bca4b691'; -- Benestare Torre C Unit 104
UPDATE reservations SET lead_source = 'Señaletica' WHERE id = '2a5e8be5-93a7-4ae2-9190-09a708c1736d'; -- Benestare Torre C Unit 107
UPDATE reservations SET lead_source = 'Visita Inedita' WHERE id = '68becf2e-5b2a-43b6-977c-aa07cf546cc3'; -- Benestare Torre C Unit 108
UPDATE reservations SET lead_source = 'Facebook' WHERE id = '0fd18211-8b70-4fde-9bb7-a609e21d290a'; -- Benestare Torre C Unit 109
UPDATE reservations SET lead_source = 'Facebook' WHERE id = 'e00bc980-d733-4fbe-9d9a-2e27f7038ab8'; -- Benestare Torre C Unit 110
UPDATE reservations SET lead_source = 'meta' WHERE id = 'b7e77d34-f932-4c1d-9fc7-dd1a0ed06997'; -- Benestare Torre C Unit 111
UPDATE reservations SET lead_source = 'Perfilan' WHERE id = 'eec8b281-348d-47cf-89c1-1d6d884b3321'; -- Benestare Torre C Unit 201
UPDATE reservations SET lead_source = 'Facebook' WHERE id = 'e19fce10-a092-4b91-ba42-c96cc4460b4c'; -- Benestare Torre C Unit 202
UPDATE reservations SET lead_source = 'Referido' WHERE id = '950a19fe-b17d-4093-8eec-aeae2e5f60aa'; -- Benestare Torre C Unit 203
UPDATE reservations SET lead_source = 'Meta' WHERE id = '0a76ef5b-404a-4d12-94f5-5fb19e04815a'; -- Benestare Torre C Unit 204
UPDATE reservations SET lead_source = 'Cartera de Clientes' WHERE id = '56a91255-5bcd-4e5b-ae4f-24094a34566a'; -- Benestare Torre C Unit 207
UPDATE reservations SET lead_source = 'Facebook' WHERE id = '90b284f3-ce5a-4372-bb38-524acd33f64a'; -- Benestare Torre C Unit 208
UPDATE reservations SET lead_source = 'Meta' WHERE id = '7043c08b-817e-4c08-97bf-2804430fb9c3'; -- Benestare Torre C Unit 209
UPDATE reservations SET lead_source = 'Señaletica' WHERE id = '66bd9b84-cb8c-4f4f-b2da-849e0756dcf6'; -- Benestare Torre C Unit 210
UPDATE reservations SET lead_source = 'Perfilan' WHERE id = '4cb28eae-69f6-4ee5-b524-c250e476e6b9'; -- Benestare Torre C Unit 301
UPDATE reservations SET lead_source = 'Facebook' WHERE id = 'e0a156b2-be52-4d90-9ebc-7e51537c0f39'; -- Benestare Torre C Unit 302
UPDATE reservations SET lead_source = 'Meta PD' WHERE id = '14513964-c790-4ab9-8eac-1f59f621fdca'; -- Benestare Torre C Unit 303
UPDATE reservations SET lead_source = 'Facebook' WHERE id = '585a7bb9-e0d9-43b1-b2dd-6ff26b957826'; -- Benestare Torre C Unit 304
UPDATE reservations SET lead_source = 'Facebook' WHERE id = 'f020e83d-e8b1-4c35-96c6-0a59d4a11c3b'; -- Benestare Torre C Unit 307
UPDATE reservations SET lead_source = 'Meta' WHERE id = 'c20dc737-1e72-454d-987e-84b6c57b0a56'; -- Benestare Torre C Unit 308
UPDATE reservations SET lead_source = 'Visita Inedita' WHERE id = '99636778-40e9-44a8-b80e-8594e986bc36'; -- Benestare Torre C Unit 309
UPDATE reservations SET lead_source = 'Facebook' WHERE id = '3c284096-9cac-42e3-957f-74cf69581af8'; -- Benestare Torre C Unit 310
UPDATE reservations SET lead_source = 'PD' WHERE id = '9f4e6272-7d0d-4f67-8eba-37472f84f505'; -- Benestare Torre C Unit 401
UPDATE reservations SET lead_source = 'Pipedrive' WHERE id = '01289dc5-107c-426f-b302-7f1596d72121'; -- Benestare Torre C Unit 402
UPDATE reservations SET lead_source = 'Facebook' WHERE id = '6f00584d-303b-46ff-8c76-04dbb1f9b9ac'; -- Benestare Torre C Unit 403
UPDATE reservations SET lead_source = 'Facebook' WHERE id = '591edb83-38ba-4e7d-9872-584cfbd527df'; -- Benestare Torre C Unit 404
UPDATE reservations SET lead_source = 'Facebook' WHERE id = 'd0fbd4d2-f6de-4ecb-9022-89fcdf719c4b'; -- Benestare Torre C Unit 406
UPDATE reservations SET lead_source = 'Meta' WHERE id = 'f032eb0f-a9db-48de-b872-5f885e206a2c'; -- Benestare Torre C Unit 407
UPDATE reservations SET lead_source = 'Meta' WHERE id = '9e17c8a1-9588-4032-b7d0-20a21dcec543'; -- Benestare Torre C Unit 408
UPDATE reservations SET lead_source = 'Pipedrive' WHERE id = '5ef15565-aa77-4e41-b2c9-32143cdca911'; -- Benestare Torre C Unit 409
UPDATE reservations SET lead_source = 'Wati' WHERE id = '8815517b-6d19-4588-b937-47850633e5b3'; -- Benestare Torre C Unit 411
UPDATE reservations SET lead_source = 'Pipedrive' WHERE id = 'ef12feb2-030f-465f-a081-25a5e7069fa6'; -- Benestare Torre C Unit 501
UPDATE reservations SET lead_source = 'Facebook' WHERE id = 'd61a1364-70e5-473e-b4bc-50a8687e0f43'; -- Benestare Torre C Unit 502
UPDATE reservations SET lead_source = 'Perfilan' WHERE id = '28ec0f58-398e-4aef-8ded-3426238a534d'; -- Benestare Torre C Unit 503
UPDATE reservations SET lead_source = 'Meta' WHERE id = '51c4f10a-4b2e-442e-89c7-4407cbaafbd3'; -- Benestare Torre C Unit 507
UPDATE reservations SET lead_source = 'Pipedrive' WHERE id = '75278ad7-9c1a-43af-8dc4-d57604b6988c'; -- Benestare Torre C Unit 508
UPDATE reservations SET lead_source = 'Inedita' WHERE id = 'e1b38865-eacf-4219-9a5f-7fcd26282b8b'; -- Benestare Torre C Unit 509
UPDATE reservations SET lead_source = 'Inedita' WHERE id = 'c00c431e-fbe7-4c2e-8f18-310e973c2b98'; -- Benestare Torre C Unit 510
UPDATE reservations SET lead_source = 'Facebook' WHERE id = '8be47fa2-e2cd-4a7d-910f-92f4e8af8a77'; -- Benestare Torre C Unit 601
UPDATE reservations SET lead_source = 'Meta' WHERE id = '6eaf8ec7-3b44-4708-9415-5435dd74215a'; -- Benestare Torre C Unit 603
UPDATE reservations SET lead_source = 'PD' WHERE id = '71135a48-7724-4e17-9750-da6a905bb3e3'; -- Benestare Torre C Unit 607
UPDATE reservations SET lead_source = 'Perfilan' WHERE id = '84b6234a-c498-420f-b7e0-c08e73276380'; -- Benestare Torre C Unit 608
UPDATE reservations SET lead_source = 'antigua cartera' WHERE id = '85ec4343-cd97-4626-824c-47b4c6842168'; -- Benestare Torre C Unit 609
UPDATE reservations SET lead_source = 'Referido' WHERE id = 'd1ba1888-9d7d-46ed-93a7-aeb5ba66d99c'; -- Benestare Torre C Unit 610
UPDATE reservations SET lead_source = 'Wati' WHERE id = '2f7f94a3-67ac-4684-9f36-ae0d4fcd30c6'; -- Benestare Torre C Unit 611
UPDATE reservations SET lead_source = 'Meta' WHERE id = '3c8da07e-43bc-4d2a-9ba5-d4dddd07fcc3'; -- Benestare Torre D Unit 605
UPDATE reservations SET lead_source = 'Perfilan' WHERE id = '8835fe7c-5593-40d1-bca0-0a7cc4335dc8'; -- Bosque Las Tapias Torre C Unit 1001
UPDATE reservations SET lead_source = 'Visita inedita' WHERE id = '9e6a1c24-24cc-417c-83e9-ece5339524ec'; -- Bosque Las Tapias Torre C Unit 1002
UPDATE reservations SET lead_source = 'PD meta' WHERE id = '9a281638-d3d8-4486-b19e-93202f15cbcb'; -- Bosque Las Tapias Torre C Unit 1004
UPDATE reservations SET lead_source = 'Leds' WHERE id = '311ff345-2009-4045-b5d1-fd835f16fa24'; -- Bosque Las Tapias Torre C Unit 1007
UPDATE reservations SET lead_source = 'Visita Inedita' WHERE id = '42e5ecdd-017e-4dad-8ca9-5185f6053449'; -- Bosque Las Tapias Torre C Unit 101
UPDATE reservations SET lead_source = 'Perfilan' WHERE id = 'e13f80f6-a4d9-4668-81cf-a9fb25e51880'; -- Bosque Las Tapias Torre C Unit 104
UPDATE reservations SET lead_source = 'Facebook' WHERE id = '873baef6-ce7a-4923-aa3a-223bd0ed6c15'; -- Bosque Las Tapias Torre C Unit 106
UPDATE reservations SET lead_source = 'Referido Apto. 106' WHERE id = '23f8d8ad-f2a1-48d8-81b1-586702511ac2'; -- Bosque Las Tapias Torre C Unit 107
UPDATE reservations SET lead_source = 'Leds PBX' WHERE id = 'b2de0e3b-30b2-42c2-af28-d95503f66302'; -- Bosque Las Tapias Torre C Unit 1108
UPDATE reservations SET lead_source = 'Inedita' WHERE id = '82058fac-be3a-4cde-a51b-c7bf1e8a6b86'; -- Bosque Las Tapias Torre C Unit 1208
UPDATE reservations SET lead_source = 'leads' WHERE id = 'cd0f1801-fe14-4927-8848-f9e34a37c277'; -- Bosque Las Tapias Torre C Unit 1209
UPDATE reservations SET lead_source = 'Web' WHERE id = 'd4ac5aee-e85f-499c-ad2a-d4df504c89f2'; -- Bosque Las Tapias Torre C Unit 1303
UPDATE reservations SET lead_source = 'Wati' WHERE id = '1fc5c0d9-f90b-40ab-9856-1e8fd8db058c'; -- Bosque Las Tapias Torre C Unit 201
UPDATE reservations SET lead_source = 'Meta' WHERE id = 'd0c3e5bd-1167-41ca-bc4e-0a6d27a5e89c'; -- Bosque Las Tapias Torre C Unit 302
UPDATE reservations SET lead_source = 'Facebook' WHERE id = 'b57623b0-6fe3-426b-a682-f6ca44a33b4a'; -- Bosque Las Tapias Torre C Unit 303
UPDATE reservations SET lead_source = 'Señaletica' WHERE id = 'cc7ea247-ee43-42d0-8fd8-e573047d8834'; -- Bosque Las Tapias Torre C Unit 401
UPDATE reservations SET lead_source = 'Valla' WHERE id = '85ee0e7a-ae36-402e-a319-98da7180675c'; -- Bosque Las Tapias Torre C Unit 402
UPDATE reservations SET lead_source = 'Valla Publicitaria' WHERE id = '913202d0-2d1e-48b6-a959-4391f16d174c'; -- Bosque Las Tapias Torre C Unit 501
UPDATE reservations SET lead_source = 'Pipedrive' WHERE id = 'a4e367a8-af8f-4e94-a67e-7d9bcfbbbf13'; -- Bosque Las Tapias Torre C Unit 502
UPDATE reservations SET lead_source = 'Visita Sorpresa' WHERE id = 'c2220feb-b032-414e-bb77-15e27594e67b'; -- Bosque Las Tapias Torre C Unit 503
UPDATE reservations SET lead_source = 'Perfilan' WHERE id = 'f19ca549-f3f1-4a6d-8c3e-22b51f4959b5'; -- Bosque Las Tapias Torre C Unit 504
UPDATE reservations SET lead_source = 'Prospeccion' WHERE id = '18964f5c-fe12-4379-b681-6d32e4ac16f6'; -- Bosque Las Tapias Torre C Unit 506
UPDATE reservations SET lead_source = 'Activacion Metronorte' WHERE id = '0c0cceb2-e2ac-43c3-9851-b47d11dbe6e7'; -- Bosque Las Tapias Torre C Unit 601
UPDATE reservations SET lead_source = 'Marketplace' WHERE id = '538ef114-bbe5-4f02-a1d6-c8dfdcb79438'; -- Bosque Las Tapias Torre C Unit 602
UPDATE reservations SET lead_source = 'Perfilan Facebook' WHERE id = 'c38d2a2d-4d3e-4251-8a29-bc9857c3c01c'; -- Bosque Las Tapias Torre C Unit 604
UPDATE reservations SET lead_source = 'Perfilan' WHERE id = '3b90f185-986f-4209-890f-fca9824d3307'; -- Bosque Las Tapias Torre C Unit 605
UPDATE reservations SET lead_source = 'Facebook' WHERE id = '80b608bf-9623-4085-b7a7-b33f9c2f59eb'; -- Bosque Las Tapias Torre C Unit 608
UPDATE reservations SET lead_source = 'Valla' WHERE id = '434f4d36-8949-4d6f-8fc5-3c29810b2525'; -- Bosque Las Tapias Torre C Unit 701
UPDATE reservations SET lead_source = 'Leads cartera' WHERE id = '12068846-ed37-4725-b6a4-62c2e749c548'; -- Bosque Las Tapias Torre C Unit 703
UPDATE reservations SET lead_source = 'Referido' WHERE id = '509a3700-8f3c-480d-b9fb-b628e1c4e066'; -- Bosque Las Tapias Torre C Unit 704
UPDATE reservations SET lead_source = 'Referido de proyecto' WHERE id = 'e318e258-c0cb-4f17-9deb-afd6921a8453'; -- Bosque Las Tapias Torre C Unit 705
UPDATE reservations SET lead_source = 'Facebook' WHERE id = '4c21d825-c227-4adc-9335-894f6789b03c'; -- Bosque Las Tapias Torre C Unit 706
UPDATE reservations SET lead_source = 'Wati' WHERE id = 'b24f5404-6a52-4776-9470-3790b9724cfe'; -- Bosque Las Tapias Torre C Unit 707
UPDATE reservations SET lead_source = 'Pipedrive' WHERE id = '7fdf079d-9951-416a-a28e-7fa81d106ae8'; -- Bosque Las Tapias Torre C Unit 708
UPDATE reservations SET lead_source = 'Leads' WHERE id = 'e2c02cc5-5ae1-4f88-88a4-e64682a7e21a'; -- Bosque Las Tapias Torre C Unit 709
UPDATE reservations SET lead_source = 'Perfilan' WHERE id = 'ee07c874-6520-4453-9c30-65741009f7dc'; -- Bosque Las Tapias Torre C Unit 803
UPDATE reservations SET lead_source = 'Perfilan' WHERE id = '19432b02-e500-4893-9895-a51c73867748'; -- Bosque Las Tapias Torre C Unit 804
UPDATE reservations SET lead_source = 'Señaletica' WHERE id = 'c86aaa25-2d2e-4f65-86aa-f18be9c0f3e3'; -- Bosque Las Tapias Torre C Unit 805
UPDATE reservations SET lead_source = 'Meta' WHERE id = '4423d21d-346b-45cb-960d-e6fb8cf997e1'; -- Bosque Las Tapias Torre C Unit 806
UPDATE reservations SET lead_source = 'Visita inedita' WHERE id = 'a44a51b5-3697-4e62-98a3-c083cad4d773'; -- Bosque Las Tapias Torre C Unit 807
UPDATE reservations SET lead_source = 'Visita Inedita' WHERE id = 'ba7bc479-0f3b-49af-bb85-cbf82c4c57a2'; -- Bosque Las Tapias Torre C Unit 808
UPDATE reservations SET lead_source = 'Vallas' WHERE id = 'a1d8ca47-094d-4493-ba43-99a3e5e36e4e'; -- Bosque Las Tapias Torre C Unit 809
UPDATE reservations SET lead_source = 'Perfilan' WHERE id = '8351b7ea-953b-4598-892b-5f2c588dbb64'; -- Bosque Las Tapias Torre C Unit 902
UPDATE reservations SET lead_source = 'Referido Apto. 906' WHERE id = '58c8238a-fa9b-4863-b7be-27bbb0982027'; -- Bosque Las Tapias Torre C Unit 903
UPDATE reservations SET lead_source = 'Perfilan Facebook' WHERE id = '8b27b00a-e895-4c6d-b69a-0202bdef84b7'; -- Bosque Las Tapias Torre C Unit 906
UPDATE reservations SET lead_source = 'Facebook' WHERE id = '0247ed62-7c75-4389-89dd-0103cccd1d36'; -- Bosque Las Tapias Torre C Unit 907
UPDATE reservations SET lead_source = 'Perfilan' WHERE id = 'fd7dc5e5-c58d-4b52-9e09-e736fc247fec'; -- Bosque Las Tapias Torre C Unit 908
UPDATE reservations SET lead_source = 'Pipedrive' WHERE id = 'cb430105-5b78-4803-84a8-a690dd654750'; -- Bosque Las Tapias Torre C Unit 909
UPDATE reservations SET lead_source = 'Página Web' WHERE id = 'e732c433-57ad-46d4-a333-a94aa081c493'; -- Casa Elisa Principal Unit 1002
UPDATE reservations SET lead_source = 'WhatsApp' WHERE id = 'eeb333e7-9141-4011-aa8d-cae97884bf04'; -- Casa Elisa Principal Unit 1003
UPDATE reservations SET lead_source = 'Página Web' WHERE id = '39772cf6-2dad-4c1a-9e6a-3f5d4de08237'; -- Casa Elisa Principal Unit 102
UPDATE reservations SET lead_source = 'Pagina Web' WHERE id = '8ef43037-2b22-4c2a-a44a-b6288779c403'; -- Casa Elisa Principal Unit 103
UPDATE reservations SET lead_source = 'Facebook' WHERE id = '9cfa1368-eb97-4d68-bff8-f51b4b47fac6'; -- Casa Elisa Principal Unit 104
UPDATE reservations SET lead_source = 'Valla' WHERE id = 'ac9aad09-790f-41dd-af02-8528300e7f22'; -- Casa Elisa Principal Unit 201
UPDATE reservations SET lead_source = 'Valla' WHERE id = 'ea511b8e-3a07-4523-8181-dfbf1fdec2f9'; -- Casa Elisa Principal Unit 202
UPDATE reservations SET lead_source = 'FB Lead' WHERE id = '15137838-ed51-4905-ac27-8d0d71ece460'; -- Casa Elisa Principal Unit 204
UPDATE reservations SET lead_source = 'lead de Facebook' WHERE id = 'ccdf55ee-b975-485a-b8d1-bacd867c7824'; -- Casa Elisa Principal Unit 205
UPDATE reservations SET lead_source = 'FB Lead' WHERE id = 'cea553ae-0cb8-4944-bf35-19ccbfc1321e'; -- Casa Elisa Principal Unit 206
UPDATE reservations SET lead_source = 'Valla' WHERE id = '4aa53277-ac29-463c-bec0-01c4908512b2'; -- Casa Elisa Principal Unit 207
UPDATE reservations SET lead_source = 'Prospección' WHERE id = '3fbf774b-2d11-48e9-a3f0-1fbb538a01ac'; -- Casa Elisa Principal Unit 208
UPDATE reservations SET lead_source = 'Página Web' WHERE id = '82ff16ee-c462-4955-9d71-a995805f31e1'; -- Casa Elisa Principal Unit 301
UPDATE reservations SET lead_source = 'Facebook' WHERE id = 'd38e12a8-c48b-4134-b559-ee88034ef701'; -- Casa Elisa Principal Unit 302
UPDATE reservations SET lead_source = 'WhatsApp' WHERE id = 'c119d667-975d-47e9-a9cb-8dc566729384'; -- Casa Elisa Principal Unit 303
UPDATE reservations SET lead_source = 'Referido' WHERE id = '1b1db142-f936-4c23-80c5-d50251b3b374'; -- Casa Elisa Principal Unit 304
UPDATE reservations SET lead_source = 'Página Web' WHERE id = '4e596c09-60c1-469d-8919-9709c0f2d742'; -- Casa Elisa Principal Unit 305
UPDATE reservations SET lead_source = 'pipedrive' WHERE id = '4fbd8c63-1ad1-4b47-881a-20731749ce9f'; -- Casa Elisa Principal Unit 306
UPDATE reservations SET lead_source = 'Pagina Web' WHERE id = '9a3a71eb-ad46-4347-80bd-cd892db630bb'; -- Casa Elisa Principal Unit 307
UPDATE reservations SET lead_source = 'Referido' WHERE id = '2f9972cc-5079-4c9c-9899-f0902752b17a'; -- Casa Elisa Principal Unit 308
UPDATE reservations SET lead_source = 'expocasa' WHERE id = 'bcac6d75-d4e9-46c3-b6ae-6f9579cb77f6'; -- Casa Elisa Principal Unit 402
UPDATE reservations SET lead_source = 'Referido' WHERE id = 'c839185f-2068-4296-813e-4e752589bec4'; -- Casa Elisa Principal Unit 404
UPDATE reservations SET lead_source = 'Feria de la Vivienda' WHERE id = '1bbbb4b0-ed6c-4e05-832a-7f93e8178b41'; -- Casa Elisa Principal Unit 405
UPDATE reservations SET lead_source = 'WhatsApp' WHERE id = 'eca40104-97ce-4474-a3cb-1935a851ab35'; -- Casa Elisa Principal Unit 406
UPDATE reservations SET lead_source = 'Referido' WHERE id = '86433baf-d3ed-482a-a40f-ce53aa46e013'; -- Casa Elisa Principal Unit 407
UPDATE reservations SET lead_source = 'Página Web' WHERE id = '49bed9a6-0df9-40bd-92e9-bc238f188d1c'; -- Casa Elisa Principal Unit 502
UPDATE reservations SET lead_source = 'Valla' WHERE id = '537e2e31-754f-4ae9-9ae3-fe91b4b8011b'; -- Casa Elisa Principal Unit 503
UPDATE reservations SET lead_source = 'Facebook' WHERE id = '3b38763a-16f3-43db-96a7-7504c86ac503'; -- Casa Elisa Principal Unit 504
UPDATE reservations SET lead_source = 'Facebook' WHERE id = '04959ace-b258-4da0-8b57-c04c0ad74ead'; -- Casa Elisa Principal Unit 505
UPDATE reservations SET lead_source = 'PBX' WHERE id = '9e9a1338-a183-4d34-9839-9d9a9f2658db'; -- Casa Elisa Principal Unit 506
UPDATE reservations SET lead_source = 'Página Web' WHERE id = '9ce1f935-5683-4bee-a794-215f8cfe167b'; -- Casa Elisa Principal Unit 507
UPDATE reservations SET lead_source = 'Referido' WHERE id = '78b39e2e-2400-4a68-9cde-174a434a7e39'; -- Casa Elisa Principal Unit 508
UPDATE reservations SET lead_source = 'Valla' WHERE id = '8f47afd5-000b-4b9a-b707-987051d3053b'; -- Casa Elisa Principal Unit 604
UPDATE reservations SET lead_source = 'FB Lead' WHERE id = '79eebf5c-7bfc-4645-a590-6ffae3e6e4fc'; -- Casa Elisa Principal Unit 605
UPDATE reservations SET lead_source = 'Referido' WHERE id = 'be2b4afd-a378-4599-8cd8-8cb7413378ea'; -- Casa Elisa Principal Unit 606
UPDATE reservations SET lead_source = 'FB Lead' WHERE id = '65fa4c30-fffa-4822-b088-5b05ffd43be9'; -- Casa Elisa Principal Unit 703
UPDATE reservations SET lead_source = 'Referido' WHERE id = '1beda7ad-aa5d-4705-9894-8110bba4f361'; -- Casa Elisa Principal Unit 706
UPDATE reservations SET lead_source = '(BTL) Manta y rotulo' WHERE id = '07fbcaf2-5d59-49c4-b383-53fa42b8083f'; -- Casa Elisa Principal Unit 802
UPDATE reservations SET lead_source = 'FB Lead' WHERE id = '455b40b7-51cb-489a-99c6-ed7d3bdb089e'; -- Casa Elisa Principal Unit 803
UPDATE reservations SET lead_source = 'Valla' WHERE id = '9ea837c3-8ae2-41c3-ad89-e20d3f126ad5'; -- Casa Elisa Principal Unit 804
UPDATE reservations SET lead_source = 'Página Web' WHERE id = '8e2f98a9-95c3-4bb9-a722-be09c0df8ccd'; -- Casa Elisa Principal Unit 805
UPDATE reservations SET lead_source = 'CRM' WHERE id = '3fb2f5f9-48af-4afa-8db9-1bb0a3c26943'; -- Casa Elisa Principal Unit 806
UPDATE reservations SET lead_source = 'Pagina Web' WHERE id = '192f95e4-6926-408e-928f-e2204a123c98'; -- Casa Elisa Principal Unit 807
UPDATE reservations SET lead_source = 'CRM' WHERE id = 'eda2cc01-f577-49b9-9b44-bef45f1954a9'; -- Casa Elisa Principal Unit 902
UPDATE reservations SET lead_source = 'FB Lead' WHERE id = '4887be09-c5aa-429d-9371-c1c619b77695'; -- Casa Elisa Principal Unit 903
UPDATE reservations SET lead_source = 'CRM' WHERE id = '5e4df006-a04c-4688-840f-2ecb9f2078c6'; -- Casa Elisa Principal Unit 904
UPDATE reservations SET lead_source = 'FB Leads' WHERE id = '50bec72e-18c3-4f38-8364-1302b8b2c52b'; -- Casa Elisa Principal Unit 905
UPDATE reservations SET lead_source = 'Whastapp' WHERE id = '41906a91-747c-4620-a2d7-6774a72652db'; -- Casa Elisa Principal Unit 906
UPDATE reservations SET lead_source = 'Facebook' WHERE id = 'ea4de856-da18-48fe-a182-22fda6bd508d'; -- Casa Elisa Principal Unit 908
```

## DB-Only Records (Not in Latest Excel)

These active reservations exist in DB but have no matching row in the latest Ventas tabs.
This is expected for app-created reservations or data from months not covered.

| Project | Tower | Unit | Client | Asesor | Date | Status |
|---------|-------|------|--------|--------|------|--------|
| Benestare | Torre A | 101 | Wendy Azucena Barrientos Salazar | Luis Esteban | 2026-02-26 | CONFIRMED |
| Benestare | Torre A | 102 | Maria Angela Rodríguez | Pedro Pablo Sarti | 2025-11-14 | CONFIRMED |
| Benestare | Torre A | 104 | Astrid Marleny Pineda Gonzalez | Efrén Sánchez | 2026-02-27 | CONFIRMED |
| Benestare | Torre A | 106 | Loida Sarai Morales Garcia | Abigail García | 2025-11-14 | CONFIRMED |
| Benestare | Torre A | 107 | Helen Lorena Monroy Jauregui | Abigail García | 2026-02-28 | CONFIRMED |
| Benestare | Torre A | 108 | Heidi Lisseth Morataya Flores | Alejandra Calderón | 2026-02-06 | CONFIRMED |
| Benestare | Torre A | 109 | Orfa Sarai Santos Morales | Luis Esteban | 2026-02-26 | CONFIRMED |
| Benestare | Torre A | 206 | Cristina Elizabeth Musin / Kelly Omar de Jesus Chacon Vasquez | Abigail García | 2024-05-18 | CONFIRMED |
| Benestare | Torre A | 207 | Monica Aide Espital Balan / Miguel Angel Antonio Jimenez Lucas | Abigail García | 2026-02-28 | CONFIRMED |
| Benestare | Torre A | 208 | Joyce Sharon Cruz Arguello | Antonio Rada | 2025-11-14 | CONFIRMED |
| Benestare | Torre A | 301 | Erick Alejandro Martinez Morales | Eder Veliz | 2025-11-14 | CONFIRMED |
| Benestare | Torre A | 303 | Xiomara Edith Garcia Solis / Jorge Estuardo Mejia Chona | Antonio Rada | 2026-02-28 | CONFIRMED |
| Benestare | Torre A | 304 | Saúl Esteban Mayen Santos | Efrén Sánchez | 2025-11-14 | CONFIRMED |
| Benestare | Torre A | 307 | Eddy Daniel Roque Arellanos | Abigail García | 2026-02-28 | CONFIRMED |
| Benestare | Torre A | 308 | Pedro David Pérez Barrios | Antonio Rada | 2025-11-14 | CONFIRMED |
| Benestare | Torre A | 401 | Lourdez Ofelia Baires | Karina Fuentes | 2025-11-14 | CONFIRMED |
| Benestare | Torre A | 403 | Luis Fernando Tique Santos | Luis Esteban | 2026-02-16 | CONFIRMED |
| Benestare | Torre A | 404 | Amanda Aracely Castillo Guzman | Efrén Sánchez | 2025-11-14 | CONFIRMED |
| Benestare | Torre A | 407 | Marvin Leonel Alexander Larias Guzman | Andrea Gonzalez | 2025-11-14 | CONFIRMED |
| Benestare | Torre A | 408 | Oscar Daniel Larias Guzmán | Antonio Rada | 2026-02-22 | CONFIRMED |
| Benestare | Torre A | 409 | Rudy Ronaldo Peña Larios | Efrén Sánchez | 2025-11-14 | CONFIRMED |
| Benestare | Torre A | 502 | Oscar Oswaldo Ramos Gil | Karina Fuentes | 2025-11-14 | CONFIRMED |
| Benestare | Torre A | 506 | Alan Emanuel Tunches Huertas / Cintia Noemi Diaz Diaz | Eder Veliz | 2025-05-10 | CONFIRMED |
| Benestare | Torre A | 601 | Santos Sebastian Pastor Velasquez | Luis Esteban | 2025-11-14 | CONFIRMED |
| Benestare | Torre A | 602 | David Obdulio Perez Monzon | Abigail García | 2026-02-23 | CONFIRMED |
| Benestare | Torre A | 603 | ANDREA ISABEL TEZEN CABRERA | Abigail García | 2025-11-14 | CONFIRMED |
| Benestare | Torre A | 605 | Luis Fernando Moreno Pozuelos | Abigail García | 2024-05-15 | CONFIRMED |
| Benestare | Torre A | 609 | Erick Estuardo Carrera Cruz | Abigail García | 2025-11-14 | CONFIRMED |
| Benestare | Torre B | 201 | Andrea Celeste Aparicio Juarez | Luis Esteban | 2024-04-07 | CONFIRMED |
| Benestare | Torre B | 205 | Angel Renato Muñoz de Leon | Efrén Sánchez | 2025-07-07 | CONFIRMED |
| Benestare | Torre B | 507 | David Enrique Aldana Mazariegos | Pedro Pablo Sarti | 2025-02-05 | CONFIRMED |
| Benestare | Torre B | 610 | Jaquelyn Michel Chumil Castillo | Abigail García | 2024-04-24 | CONFIRMED |
| Benestare | Torre C | 410 | Carla Yanira Castillo | Abigail García | 2025-11-14 | CONFIRMED |
| Benestare | Torre C | 604 | Javier Alberto Zepeda Aguirre | Rony Ramirez | 2026-02-25 | CONFIRMED |
| Benestare | Torre D | 602 | Pedro Orlando Carias | Eder Veliz | 2026-03-08 | CONFIRMED |
| Casa Elisa | Principal | 101 | Thelma Suyapa | Noemí Menendez | 2025-09-01 | CONFIRMED |
| Casa Elisa | Principal | 408 | José Calderon | Forma Capital | 2025-09-01 | CONFIRMED |
| Casa Elisa | Principal | 603 | Werny Ortiz | Paula Hernández | 2025-09-01 | CONFIRMED |
| Casa Elisa | Principal | 907 | Rocio Pinto | Forma Capital | 2025-09-01 | CONFIRMED |
| Casa Elisa | Principal | L-1 | Helbert Emmanuel Blanco Argueta | Paula Hernández | 2025-09-01 | CONFIRMED |
| Casa Elisa | Principal | L-2 | Helbert Emmanuel Blanco Argueta | Paula Hernández | 2025-09-01 | CONFIRMED |
| Casa Elisa | Principal | L-3 | Jorge Antonio Sipaque Quiñonez | Eder Veliz | 2025-09-01 | CONFIRMED |

---

## Note: Santa Elena (2026-03-26)

Santa Elena (SE) is not covered by this sync proposal. SE is the 5th project, added to the system after this sync was designed and executed. SE data was loaded directly via **migration 049** (`scripts/migrations/049_santa_elena_seed.sql`) from `Reservas/Santa Elena/Disponibilidad.xlsx` and `Reservas/Santa Elena/ReporteSANTAELENA.xlsx`.

SE data loaded: 11 units (Casa 1–11), 5 clients, 5 reservations (4 CONFIRMED + 1 DESISTED), 1 new salesperson (Luccia Calvo), cotizador config (USD), 1 lead source ('Valla'). See `docs/plan-sync-reservations-2026-03-25.md` status update for details.
