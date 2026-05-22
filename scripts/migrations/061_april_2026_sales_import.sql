-- ============================================================================
-- Migration 061: April 2026 Sales Import (CIERRE_RESERVAS_ABRIL.xlsx SSOT)
-- ============================================================================
-- Source:  Comisiones4Abril/CIERRE_RESERVAS_ABRIL.xlsx
-- Scope:   22 sales (rows 2–22 + row 25); 10 prior active sales cancelled in preamble (desistimientos)
-- Sheet:   Abril (2 sheets total; Seguimiento skipped — already in migration 057)
-- Ref:     docs/manifest-CIERRE_RESERVAS_ABRIL.md
--
-- Projects:
--   Benestare (BNT)         12 sales  — project_id 019c7d10-8f5a-74c7-b3df-c2151ad8a376
--   Bosque Las Tapias (BLT)  4 sales  — project_id 019c7d10-8ee5-7999-9881-2cd5ad038aa9
--   Boulevard 5 (BLV5)       6 sales  — project_id 019c7d10-8e01-720f-942f-cac0017d83a8
--
-- Asesores (UUIDs confirmed — migration 055 active-12 + migration 057):
--   Rony Ramirez    8b14b330-7e04-4409-98eb-e3d1d7d0a363
--   Daniel Veliz    c5e33ccb-6c39-45ac-8d4d-ee5cdf598895  ← same UUID as migration 057
--   Ivan Castillo   eca06792-5219-4549-9922-274324e9f53b
--   Paula Hernandez 1718037b-0d7b-4346-8ef2-c7658e25092b
--   Erwin Cardona   c87fe26f-3fad-4498-8cea-4563a380d863
--   Jose Gutierrez  3d7ff0ed-94bf-4d9a-9259-ea03114e62a2  (end_date 2026-04-21 inclusive)
--   Pablo Marroquin 58770544-eb03-4887-b622-278806707cb1
--
-- NOTES:
--   • Row 24 (partial data, anomalous price GTQ 2,528,200) EXCLUDED — see FLAG-A1 in manifest
--   • Row 25 (BLT 1007-B, Pablo Marroquin): promise_signed_date = NULL ("No se firmo promesa")
--     Phase 1 commission deferred; fires automatically when promise is signed via UPDATE
--   • FLAG-A4: [Lead Meta] prefixes stripped from two client names; sales.lead_source_id set
--   • price_without_tax values copied directly from SSOT "Precio sin impuestos" column
--   • Daniel Veliz UUID matches migration 057; verify against DB if unexpected behaviour occurs:
--       SELECT id, full_name, is_active FROM salespeople WHERE full_name ILIKE '%veliz%';
--   • unit_id values are hardcoded UUIDs retrieved from production DB pre-check (2026-05-19).
--     units table has no tower_id column; units link directly to projects via project_id.
--     Tower disambiguation is encoded in unit_number suffix (e.g. '210-C' = Torre C).
--
-- Preamble: 10 units have prior active sales (desistimientos confirmed by Pati's SSOT).
--   Prior active sales are cancelled before inserts. Triggers disabled during preamble to
--   prevent auto_recalc_commissions_on_sale_update from modifying historical commission records.
-- ============================================================================

-- ============================================================================
-- PREAMBLE: Disable commission recalc trigger, then cancel 10 prior active sales
-- ============================================================================
-- Disabling auto_recalc prevents calculate_commissions() from firing on historical
-- sale records when we set their status = 'cancelled'. Historical commissions are
-- left intact (amounts may already have been disbursed).

ALTER TABLE sales DISABLE TRIGGER auto_recalc_commissions_on_sale_update;
ALTER TABLE payments DISABLE TRIGGER auto_calculate_commissions;

-- Cancel prior active sales on units being re-sold in April 2026
-- (desistimientos — confirmed by Pati's SSOT CIERRE_RESERVAS_ABRIL.xlsx)
UPDATE sales
SET status = 'cancelled', updated_at = NOW()
WHERE id IN (
  '019c9692-cf84-7937-81ca-8447b18de85f',  -- BLV5 1001  (Zonia Hernández, 2023-04-11)
  '019c9692-e422-7f38-9de7-b10083700126',  -- BLV5 1016  (Sergio Bolaños, 2023-04-16)
  '019c9692-fef7-7177-b6e5-442f381c905f',  -- BLV5 1116  (Francisco Arriaza, 2024-02-15)
  '019c9693-1080-70d6-a750-d5dde17fc996',  -- BLV5 1212  (Sergio Bolaños, 2023-07-16)
  '019c9681-3098-7c22-9d57-3e00a39f4c6f',  -- BNT 202-B  (Carlos Alvizures/Katherine Turcios, 2024-10-31)
  '019c9681-8d79-7e5f-b6a0-7ee9bb1529c9',  -- BNT 210-C  (Karen Barahona, 2026-02-15)
  '019c9681-94a0-73c8-9b5f-4aae7469bc40',  -- BNT 309-C  (Julio Jeronimo, 2025-11-16)
  '019c9681-4aa6-7bcd-9205-82a12a78a077',  -- BNT 313-B  (Suarlim/Angel Barrientos, 2025-07-30)
  '019c9692-7ae5-7c5b-994b-f653a3e0a394',  -- BLV5 614   (Thalía Carredano, 2025-08-08)
  '019c9692-cd02-7cb1-86bb-0752350d32d8'   -- BLV5 919   (Ana Rangel, 2023-03-31)
);

-- ============================================================================
-- PHASE 0: Schema change — add lead_source_id FK to sales table
-- ============================================================================

ALTER TABLE sales ADD COLUMN IF NOT EXISTS lead_source_id uuid REFERENCES lead_sources(id);

-- ============================================================================
-- PHASE A: Insert clients (22 new clients)
-- ============================================================================

-- BNT clients (rows 2–13)
INSERT INTO clients (id, full_name) VALUES ('e57ae4f8-f470-47b5-ad3e-e214cc8caf4f', 'Karol del Rosario Mayen Gutierrez');
INSERT INTO clients (id, full_name) VALUES ('1fa5f574-bb34-4003-92e1-7e0e9201eaf5', 'Carlos Francisco Mejia Payes');
INSERT INTO clients (id, full_name) VALUES ('1ea3a681-41f6-4d52-b671-6dc363f17ee1', 'Enma Aracely Tista Jimenez');
-- Belia Ester Velasquez Castillo already exists in clients table; skip INSERT, use existing UUID in Phase B
-- INSERT INTO clients (id, full_name) VALUES ('8b6986fd-68f2-4582-bd30-d70eb2e0054a', 'Belia Ester Velasquez Castillo');
INSERT INTO clients (id, full_name) VALUES ('5407ec7a-400e-448b-9fbe-2e1ba3ee2f95', 'Diego Francisco Culajay Sic');
INSERT INTO clients (id, full_name) VALUES ('106ae923-6598-473f-977f-bdf09f2812ff', 'Sussan Iveth Molina Zuncar');
INSERT INTO clients (id, full_name) VALUES ('fdf864b1-c6e6-462b-bca4-bd1cf9fbc3ea', 'Diego Reynoso');                      -- FLAG-A4: [Lead Meta] prefix stripped
INSERT INTO clients (id, full_name) VALUES ('e174b9f2-2241-4824-9df5-54f6ddaad3af', 'Jose Manuel Elias Recinos');
INSERT INTO clients (id, full_name) VALUES ('87f8a48e-c65a-4eb3-88fa-17377391b9ce', 'Andri Sarai Cinto Lopez');
INSERT INTO clients (id, full_name) VALUES ('be8292f1-e823-41d3-95eb-05401caada77', 'Jorge Mario López Gonzalez');
INSERT INTO clients (id, full_name) VALUES ('7e87bad2-cbc4-47a2-b0c2-0a9407587354', 'Manuel Bolom Yaxcal');
INSERT INTO clients (id, full_name) VALUES ('69142a14-ea26-424b-b312-6f0fb9c575da', 'Marcos Javier Gatica Paz');

-- BLT clients (rows 14–16, 25)
INSERT INTO clients (id, full_name) VALUES ('4de80f05-7990-48f8-a1bb-1d08dfbbf53e', 'Luis Alfredo Ortiz Ajualip');
INSERT INTO clients (id, full_name) VALUES ('5006312a-6a7f-43f8-bade-2a787112a22b', 'Abner Josué Pérez Monterroso y Joy Nicole Golla Oliveras');
INSERT INTO clients (id, full_name) VALUES ('31406a44-8a92-4397-aeee-cc829ce66686', 'Andrea Sarahi Alvarez Solorzano y Christian André Orozco García');
INSERT INTO clients (id, full_name) VALUES ('6ba21734-3635-42d3-9a81-5844377caed7', 'Joel Enrique Mayen Anavisca');          -- FLAG-A4: [Lead Meta BLT] prefix stripped; row 25

-- BLV5 clients (rows 17–22)
INSERT INTO clients (id, full_name) VALUES ('a5b83422-d3c5-47be-868e-7c788ddeae37', 'Diego Alejandro Barreno González');
INSERT INTO clients (id, full_name) VALUES ('16670e63-6c73-43c7-9c12-fdee17fbaae9', 'Erick Orlando Barrios Navas');
INSERT INTO clients (id, full_name) VALUES ('1ee34f60-4583-48ac-8539-c771dc0bce92', 'Ruben Ivan España Marroquín');
INSERT INTO clients (id, full_name) VALUES ('d3910f6b-8960-4e7e-9b7d-2745ba9762b8', 'Carlos Roberto Sandoval Najera / Carlos Ramón Chajón Aceituno');
INSERT INTO clients (id, full_name) VALUES ('3ba5238a-b705-43df-b1de-6679264dd1ec', 'Ingrid Lissette Robles Villatoro');
INSERT INTO clients (id, full_name) VALUES ('c7525a0b-7535-44b1-a8a8-0cd2fade891f', 'Edwin Ernesto Ovalle Barrios');

-- ============================================================================
-- PHASE B: Insert active sales (22 records)
-- ============================================================================
-- Columns: id, project_id, unit_id, client_id, sales_rep_id,
--          sale_date, price_with_tax, price_without_tax,
--          down_payment_amount, financed_amount, status,
--          promise_signed_date, ejecutivo_rate,
--          referral_applies, referral_name, lead_source_id
--
-- unit_id values are hardcoded UUIDs from production DB (pre-check 2026-05-19).
-- units.unit_number format: '{number}-{tower_letter}' for multi-tower projects (BNT/BLT).
-- BLV5 uses plain numbers (single-tower project).

-- ── BNT rows (project_id 019c7d10-8f5a-74c7-b3df-c2151ad8a376) ──────────────

-- Row 2 | BNT 210-C | Karol del Rosario Mayen Gutierrez | Rony Ramirez | 2026-04-30
INSERT INTO sales (id, project_id, unit_id, client_id, sales_rep_id, sale_date, price_with_tax, price_without_tax, down_payment_amount, financed_amount, status, promise_signed_date, ejecutivo_rate, referral_applies, referral_name, lead_source_id)
VALUES (
  '4ce108e3-6b10-4ff5-9bbc-acc07d472c49',
  '019c7d10-8f5a-74c7-b3df-c2151ad8a376',
  '019c967f-2fc7-7e42-81da-0bb4a7f8a71b',  -- unit_number '210-C'
  'e57ae4f8-f470-47b5-ad3e-e214cc8caf4f',
  '8b14b330-7e04-4409-98eb-e3d1d7d0a363',
  '2026-04-30', 533000, 487648.6734, 37400, 495600, 'active', '2026-04-30', 0.01, false, NULL, NULL
);

-- Row 3 | BNT 103-A | Carlos Francisco Mejia Payes | Rony Ramirez | 2026-04-30
INSERT INTO sales (id, project_id, unit_id, client_id, sales_rep_id, sale_date, price_with_tax, price_without_tax, down_payment_amount, financed_amount, status, promise_signed_date, ejecutivo_rate, referral_applies, referral_name, lead_source_id)
VALUES (
  '76705d36-3d2c-4881-a10d-708ba4dfefc4',
  '019c7d10-8f5a-74c7-b3df-c2151ad8a376',
  '019c967f-2fbe-70a9-a1bd-c4032a759b27',  -- unit_number '103-A'
  '1fa5f574-bb34-4003-92e1-7e0e9201eaf5',
  '8b14b330-7e04-4409-98eb-e3d1d7d0a363',
  '2026-04-30', 533000, 487648.6734, 26700, 506300, 'active', '2026-04-30', 0.01, false, NULL, NULL
);

-- Row 4 | BNT 309-C | Enma Aracely Tista Jimenez | Daniel Veliz | 2026-04-30
INSERT INTO sales (id, project_id, unit_id, client_id, sales_rep_id, sale_date, price_with_tax, price_without_tax, down_payment_amount, financed_amount, status, promise_signed_date, ejecutivo_rate, referral_applies, referral_name, lead_source_id)
VALUES (
  '15c95eb2-646a-43bf-8bf9-e4f117d05d12',
  '019c7d10-8f5a-74c7-b3df-c2151ad8a376',
  '019c967f-2fc7-74ad-80e1-0d72c484c296',  -- unit_number '309-C'
  '1ea3a681-41f6-4d52-b671-6dc363f17ee1',
  'c5e33ccb-6c39-45ac-8d4d-ee5cdf598895',
  '2026-04-30', 533000, 487648.6734, 37400, 495600, 'active', '2026-04-30', 0.01, false, NULL, NULL
);

-- Row 5 | BNT 105-D | Belia Ester Velasquez Castillo | Daniel Veliz | 2026-04-28
INSERT INTO sales (id, project_id, unit_id, client_id, sales_rep_id, sale_date, price_with_tax, price_without_tax, down_payment_amount, financed_amount, status, promise_signed_date, ejecutivo_rate, referral_applies, referral_name, lead_source_id)
VALUES (
  '89dd84a7-bbc8-4015-8bd2-32f063e75ee3',
  '019c7d10-8f5a-74c7-b3df-c2151ad8a376',
  '019c967f-2fca-7778-84bf-07bc8471b3e3',  -- unit_number '105-D'
  '019c7da8-bfc5-71ba-b81f-388f50fcf8da',  -- Belia Ester Velasquez Castillo (existing client)
  'c5e33ccb-6c39-45ac-8d4d-ee5cdf598895',
  '2026-04-28', 537300, 491582.7996, 37700, 499600, 'active', '2026-04-28', 0.01, false, NULL, NULL
);

-- Row 6 | BNT 202-B | Diego Francisco Culajay Sic | Daniel Veliz | 2026-04-28
INSERT INTO sales (id, project_id, unit_id, client_id, sales_rep_id, sale_date, price_with_tax, price_without_tax, down_payment_amount, financed_amount, status, promise_signed_date, ejecutivo_rate, referral_applies, referral_name, lead_source_id)
VALUES (
  'f7ea12a1-65b0-40ab-889a-9a12ba3631a5',
  '019c7d10-8f5a-74c7-b3df-c2151ad8a376',
  '019c967f-2fc2-7a42-80a8-6be82c05cbd2',  -- unit_number '202-B'
  '5407ec7a-400e-448b-9fbe-2e1ba3ee2f95',
  'c5e33ccb-6c39-45ac-8d4d-ee5cdf598895',
  '2026-04-28', 533700, 488289.1125, 26700, 507000, 'active', '2026-04-28', 0.01, false, NULL, NULL
);

-- Row 7 | BNT 313-B | Sussan Iveth Molina Zuncar | Ivan Castillo | 2026-04-25 | ESCALATION 0.0125 (5th sale)
INSERT INTO sales (id, project_id, unit_id, client_id, sales_rep_id, sale_date, price_with_tax, price_without_tax, down_payment_amount, financed_amount, status, promise_signed_date, ejecutivo_rate, referral_applies, referral_name, lead_source_id)
VALUES (
  '99a117db-d36e-44aa-9305-ed7c1ce6e39b',
  '019c7d10-8f5a-74c7-b3df-c2151ad8a376',
  '019c967f-2fc3-7261-aaa5-7bf6cf249af0',  -- unit_number '313-B'
  '106ae923-6598-473f-977f-bdf09f2812ff',
  'eca06792-5219-4549-9922-274324e9f53b',
  '2026-04-25', 533700, 488289.1125, 26700, 507000, 'active', '2026-04-25', 0.0125, false, NULL, NULL
);

-- Row 8 | BNT 401-D | Diego Reynoso [Lead Meta] | Ivan Castillo | 2026-04-25
INSERT INTO sales (id, project_id, unit_id, client_id, sales_rep_id, sale_date, price_with_tax, price_without_tax, down_payment_amount, financed_amount, status, promise_signed_date, ejecutivo_rate, referral_applies, referral_name, lead_source_id)
VALUES (
  '9d359f82-33e8-4e4e-9bd0-ccac6d42cd5e',
  '019c7d10-8f5a-74c7-b3df-c2151ad8a376',
  '019c967f-2fcb-709b-b85a-cbe94c2a6c37',  -- unit_number '401-D'
  'fdf864b1-c6e6-462b-bca4-bd1cf9fbc3ea',
  'eca06792-5219-4549-9922-274324e9f53b',
  '2026-04-25', 537300, 491582.7996, 37700, 499600, 'active', '2026-04-25', 0.01, false, NULL,
  (SELECT id FROM lead_sources WHERE name = 'Meta')   -- FLAG-A4
);

-- Row 9 | BNT 302-D | Jose Manuel Elias Recinos | Daniel Veliz | 2026-04-19
INSERT INTO sales (id, project_id, unit_id, client_id, sales_rep_id, sale_date, price_with_tax, price_without_tax, down_payment_amount, financed_amount, status, promise_signed_date, ejecutivo_rate, referral_applies, referral_name, lead_source_id)
VALUES (
  'df6bd4df-1a3b-475b-b905-e3ad33cd9a15',
  '019c7d10-8f5a-74c7-b3df-c2151ad8a376',
  '019c967f-2fca-70aa-a856-6e8dfb873f2a',  -- unit_number '302-D'
  'e174b9f2-2241-4824-9df5-54f6ddaad3af',
  'c5e33ccb-6c39-45ac-8d4d-ee5cdf598895',
  '2026-04-19', 537300, 491582.7996, 37700, 499600, 'active', '2026-04-19', 0.01, false, NULL, NULL
);

-- Row 10 | BNT 505-D | Andri Sarai Cinto Lopez | Ivan Castillo | 2026-04-14
INSERT INTO sales (id, project_id, unit_id, client_id, sales_rep_id, sale_date, price_with_tax, price_without_tax, down_payment_amount, financed_amount, status, promise_signed_date, ejecutivo_rate, referral_applies, referral_name, lead_source_id)
VALUES (
  '06cfff0d-ec66-4206-86f8-3dd47bf62f3b',
  '019c7d10-8f5a-74c7-b3df-c2151ad8a376',
  '019c967f-2fcb-7772-9a2b-a8593351905c',  -- unit_number '505-D'
  '87f8a48e-c65a-4eb3-88fa-17377391b9ce',
  'eca06792-5219-4549-9922-274324e9f53b',
  '2026-04-14', 537300, 491582.7996, 37700, 499600, 'active', '2026-04-14', 0.01, false, NULL, NULL
);

-- Row 11 | BNT 202-A | Jorge Mario López Gonzalez | Ivan Castillo | 2026-04-12
INSERT INTO sales (id, project_id, unit_id, client_id, sales_rep_id, sale_date, price_with_tax, price_without_tax, down_payment_amount, financed_amount, status, promise_signed_date, ejecutivo_rate, referral_applies, referral_name, lead_source_id)
VALUES (
  '481a321c-801d-4931-8965-434be9ab1989',
  '019c7d10-8f5a-74c7-b3df-c2151ad8a376',
  '019c967f-2fbf-713b-bc78-9b44d2141d05',  -- unit_number '202-A'
  'be8292f1-e823-41d3-95eb-05401caada77',
  'eca06792-5219-4549-9922-274324e9f53b',
  '2026-04-12', 533000, 487648.6734, 26700, 506300, 'active', '2026-04-12', 0.01, false, NULL, NULL
);

-- Row 12 | BNT 305-C | Manuel Bolom Yaxcal | Rony Ramirez | 2026-04-12
INSERT INTO sales (id, project_id, unit_id, client_id, sales_rep_id, sale_date, price_with_tax, price_without_tax, down_payment_amount, financed_amount, status, promise_signed_date, ejecutivo_rate, referral_applies, referral_name, lead_source_id)
VALUES (
  '2923fcb4-1a80-4515-9680-e54cc0189dd2',
  '019c7d10-8f5a-74c7-b3df-c2151ad8a376',
  '019c967f-2fc7-76b1-8229-ce2b8ac60e7b',  -- unit_number '305-C'
  '7e87bad2-cbc4-47a2-b0c2-0a9407587354',
  '8b14b330-7e04-4409-98eb-e3d1d7d0a363',
  '2026-04-12', 533400, 488014.64, 37700, 495700, 'active', '2026-04-12', 0.01, false, NULL, NULL
);

-- Row 13 | BNT 511-C | Marcos Javier Gatica Paz | Ivan Castillo | 2026-04-04
INSERT INTO sales (id, project_id, unit_id, client_id, sales_rep_id, sale_date, price_with_tax, price_without_tax, down_payment_amount, financed_amount, status, promise_signed_date, ejecutivo_rate, referral_applies, referral_name, lead_source_id)
VALUES (
  'ba1169b7-05d0-452e-8040-311311dfdc3e',
  '019c7d10-8f5a-74c7-b3df-c2151ad8a376',
  '019c967f-2fc9-77df-94ff-dd92f5db37c2',  -- unit_number '511-C'
  '69142a14-ea26-424b-b312-6f0fb9c575da',
  'eca06792-5219-4549-9922-274324e9f53b',
  '2026-04-04', 386900, 353979.8719, 27112, 359788, 'active', '2026-04-04', 0.01, false, NULL, NULL
);

-- ── BLT rows (project_id 019c7d10-8ee5-7999-9881-2cd5ad038aa9) ──────────────

-- Row 14 | BLT 1103-C | Luis Alfredo Ortiz Ajualip | Paula Hernandez | 2026-04-30
INSERT INTO sales (id, project_id, unit_id, client_id, sales_rep_id, sale_date, price_with_tax, price_without_tax, down_payment_amount, financed_amount, status, promise_signed_date, ejecutivo_rate, referral_applies, referral_name, lead_source_id)
VALUES (
  'cf28cad1-4691-4e6e-bb6a-4011146ea649',
  '019c7d10-8ee5-7999-9881-2cd5ad038aa9',
  '019c9689-89ab-70e4-9ba1-0a50cf50a1fc',  -- unit_number '1103-C'
  '4de80f05-7990-48f8-a1bb-1d08dfbbf53e',
  '1718037b-0d7b-4346-8ef2-c7658e25092b',
  '2026-04-30', 744000, 680695.3339, 52100, 691900, 'active', '2026-04-30', 0.01, false, NULL, NULL
);

-- Row 15 | BLT 1208-B | Abner Josué Pérez Monterroso y Joy Nicole Golla Oliveras | Paula Hernandez | 2026-04-30
INSERT INTO sales (id, project_id, unit_id, client_id, sales_rep_id, sale_date, price_with_tax, price_without_tax, down_payment_amount, financed_amount, status, promise_signed_date, ejecutivo_rate, referral_applies, referral_name, lead_source_id)
VALUES (
  '8f914ee1-c458-4091-b597-589cce503b52',
  '019c7d10-8ee5-7999-9881-2cd5ad038aa9',
  '019c9689-89a8-7191-ad3d-1c472fab3bdf',  -- unit_number '1208-B'
  '5006312a-6a7f-43f8-bade-2a787112a22b',
  '1718037b-0d7b-4346-8ef2-c7658e25092b',
  '2026-04-30', 668000, 611161.9396, 46800, 621200, 'active', '2026-04-30', 0.01, false, NULL, NULL
);

-- Row 16 | BLT 508-B | Andrea Sarahi Alvarez Solorzano y Christian André Orozco García | Paula Hernandez | 2026-04-19
INSERT INTO sales (id, project_id, unit_id, client_id, sales_rep_id, sale_date, price_with_tax, price_without_tax, down_payment_amount, financed_amount, status, promise_signed_date, ejecutivo_rate, referral_applies, referral_name, lead_source_id)
VALUES (
  '83af9959-2e26-4af0-95ff-b2f5cb7c5f35',
  '019c7d10-8ee5-7999-9881-2cd5ad038aa9',
  '019c9689-89a6-7b7b-83fe-a8da803cae63',  -- unit_number '508-B'
  '31406a44-8a92-4397-aeee-cc829ce66686',
  '1718037b-0d7b-4346-8ef2-c7658e25092b',
  '2026-04-19', 668000, 611161.9396, 46760, 621240, 'active', '2026-04-19', 0.01, false, NULL, NULL
);

-- ── BLV5 rows (project_id 019c7d10-8e01-720f-942f-cac0017d83a8) ─────────────

-- Row 17 | BLV5 1016 | Diego Alejandro Barreno González | Jose Gutierrez | 2026-04-21
-- FLAG-A3: sale_date = end_date (2026-04-21) — inclusive; commission pays to José Gutiérrez
INSERT INTO sales (id, project_id, unit_id, client_id, sales_rep_id, sale_date, price_with_tax, price_without_tax, down_payment_amount, financed_amount, status, promise_signed_date, ejecutivo_rate, referral_applies, referral_name, lead_source_id)
VALUES (
  '1803cb61-e183-47c7-9658-673d4def2fd4',
  '019c7d10-8e01-720f-942f-cac0017d83a8',
  '019c968f-a047-71c6-a85f-7247675d7e28',  -- unit_number '1016'
  'a5b83422-d3c5-47be-868e-7c788ddeae37',
  '3d7ff0ed-94bf-4d9a-9259-ea03114e62a2',
  '2026-04-21', 970000, 887465.69, 97000, 873000, 'active', '2026-04-21', 0.01, false, NULL, NULL
);

-- Row 18 | BLV5 1212 | Erick Orlando Barrios Navas | Erwin Cardona | 2026-04-20
INSERT INTO sales (id, project_id, unit_id, client_id, sales_rep_id, sale_date, price_with_tax, price_without_tax, down_payment_amount, financed_amount, status, promise_signed_date, ejecutivo_rate, referral_applies, referral_name, lead_source_id)
VALUES (
  'a64eacdd-433a-4274-896d-52cebd9c150f',
  '019c7d10-8e01-720f-942f-cac0017d83a8',
  '019c968f-a048-77d2-a3e0-90c0d5f77cd5',  -- unit_number '1212'
  '16670e63-6c73-43c7-9c12-fdee17fbaae9',
  'c87fe26f-3fad-4498-8cea-4563a380d863',
  '2026-04-20', 895000, 818847.21, 300000, 595000, 'active', '2026-04-20', 0.01, false, NULL, NULL
);

-- Row 19 | BLV5 614 | Ruben Ivan España Marroquín | Jose Gutierrez | 2026-04-19
-- FLAG-A3: sale_date 2026-04-19 < end_date 2026-04-21 — commission pays to José Gutiérrez
INSERT INTO sales (id, project_id, unit_id, client_id, sales_rep_id, sale_date, price_with_tax, price_without_tax, down_payment_amount, financed_amount, status, promise_signed_date, ejecutivo_rate, referral_applies, referral_name, lead_source_id)
VALUES (
  '7615f8af-c2ca-4400-bab9-81303ed70724',
  '019c7d10-8e01-720f-942f-cac0017d83a8',
  '019c968f-a044-7fa9-b0da-f1c3b083d44d',  -- unit_number '614'
  '1ee34f60-4583-48ac-8539-c771dc0bce92',
  '3d7ff0ed-94bf-4d9a-9259-ea03114e62a2',
  '2026-04-19', 1615100, 1477676.12, 161510, 1453590, 'active', '2026-04-19', 0.01, false, NULL, NULL
);

-- Row 20 | BLV5 1001 | Carlos Roberto Sandoval Najera / Carlos Ramón Chajón Aceituno | Erwin Cardona | 2026-04-17
INSERT INTO sales (id, project_id, unit_id, client_id, sales_rep_id, sale_date, price_with_tax, price_without_tax, down_payment_amount, financed_amount, status, promise_signed_date, ejecutivo_rate, referral_applies, referral_name, lead_source_id)
VALUES (
  '8fee2609-6f2d-40b1-8531-f47e9c1a893e',
  '019c7d10-8e01-720f-942f-cac0017d83a8',
  '019c968f-a046-7f77-a289-a6af83246e98',  -- unit_number '1001'
  'd3910f6b-8960-4e7e-9b7d-2745ba9762b8',
  'c87fe26f-3fad-4498-8cea-4563a380d863',
  '2026-04-17', 1355600, 1240256.18, 67800, 1287800, 'active', '2026-04-17', 0.01, false, NULL, NULL
);

-- Row 21 | BLV5 1116 | Ingrid Lissette Robles Villatoro | Erwin Cardona | 2026-04-17
INSERT INTO sales (id, project_id, unit_id, client_id, sales_rep_id, sale_date, price_with_tax, price_without_tax, down_payment_amount, financed_amount, status, promise_signed_date, ejecutivo_rate, referral_applies, referral_name, lead_source_id)
VALUES (
  '0737b81b-b63d-4956-b071-5654a2bdb03a',
  '019c7d10-8e01-720f-942f-cac0017d83a8',
  '019c968f-a048-73d4-9ea7-fd964fccf69a',  -- unit_number '1116'
  '3ba5238a-b705-43df-b1de-6679264dd1ec',
  'c87fe26f-3fad-4498-8cea-4563a380d863',
  '2026-04-17', 1055000, 965233.30, 52800, 1002200, 'active', '2026-04-17', 0.01, false, NULL, NULL
);

-- Row 22 | BLV5 919 | Edwin Ernesto Ovalle Barrios | Erwin Cardona | 2026-04-10
INSERT INTO sales (id, project_id, unit_id, client_id, sales_rep_id, sale_date, price_with_tax, price_without_tax, down_payment_amount, financed_amount, status, promise_signed_date, ejecutivo_rate, referral_applies, referral_name, lead_source_id)
VALUES (
  'ae05f8f3-9528-4e14-8127-29b19c7591fd',
  '019c7d10-8e01-720f-942f-cac0017d83a8',
  '019c968f-a046-701a-b445-b54fcf583136',  -- unit_number '919'
  'c7525a0b-7535-44b1-a8a8-0cd2fade891f',
  'c87fe26f-3fad-4498-8cea-4563a380d863',
  '2026-04-10', 1177700, 1077493.14, 58900, 1118800, 'active', '2026-04-10', 0.01, false, NULL, NULL
);

-- ── BLT row 25 — promise_signed_date = NULL ──────────────────────────────────

-- Row 25 | BLT 1007-B | Joel Enrique Mayen Anavisca [Lead Meta BLT] | Pablo Marroquin | 2026-04-26
-- FLAG-A2: "No se firmo promesa" — import with promise_signed_date = NULL
--   Unit is locked in cotizador; Phase 1 commission deferred.
--   When promise is signed, run:
--     UPDATE sales SET promise_signed_date = '[actual_date]'
--     WHERE id = 'b93d7d8a-dc5a-42fe-9811-59ef125d3202';
--   The auto_recalc_commissions_on_sale_update trigger fires automatically.
-- FLAG-A4: [Lead Meta BLT] prefix stripped; lead_source_id = Meta
INSERT INTO sales (id, project_id, unit_id, client_id, sales_rep_id, sale_date, price_with_tax, price_without_tax, down_payment_amount, financed_amount, status, promise_signed_date, ejecutivo_rate, referral_applies, referral_name, lead_source_id)
VALUES (
  'b93d7d8a-dc5a-42fe-9811-59ef125d3202',
  '019c7d10-8ee5-7999-9881-2cd5ad038aa9',
  '019c9689-89a7-7367-9999-9c88a1ba4d9b',  -- unit_number '1007-B'
  '6ba21734-3635-42d3-9a81-5844377caed7',
  '58770544-eb03-4887-b622-278806707cb1',
  '2026-04-26', 678000, 620311.07, 47500, 630500, 'active', NULL, 0.01, false, NULL,
  (SELECT id FROM lead_sources WHERE name = 'Meta')   -- FLAG-A4
);

-- ============================================================================
-- PHASE C: Desistimientos from Abril sheet — NONE
-- ============================================================================
-- No cancelled/desistimiento records from the Abril sheet itself.
-- The 10 prior active sales cancelled in the preamble are historical re-sells
-- (buyers withdrew on earlier purchases; new buyers confirmed by SSOT).
-- Seguimiento sheet desistimientos (William Danilo Davila Coro, Marlon Pixtun)
-- were already imported as cancelled in migration 057. Do not re-import.

-- ============================================================================
-- PHASE D: Insert reservation payments (22 records, one per sale)
-- ============================================================================
-- BNT: GTQ 1,500 | BLT: GTQ 3,000 | BLV5: GTQ 5,000–10,000 (row 21 = 5,000)

INSERT INTO payments (id, sale_id, payment_date, amount, payment_type, notes)
VALUES ('b4d71f9c-9439-4c74-8a30-d8f06b38d513', '4ce108e3-6b10-4ff5-9bbc-acc07d472c49', '2026-04-30',  1500, 'reservation', 'CIERRE_ABRIL import');  -- row 2  BNT 210-C
INSERT INTO payments (id, sale_id, payment_date, amount, payment_type, notes)
VALUES ('fa53ef30-3459-443b-a52c-8f38735ee18a', '76705d36-3d2c-4881-a10d-708ba4dfefc4', '2026-04-30',  1500, 'reservation', 'CIERRE_ABRIL import');  -- row 3  BNT 103-A
INSERT INTO payments (id, sale_id, payment_date, amount, payment_type, notes)
VALUES ('e4f4ec0b-0e69-4655-a8f9-1f7548001a4f', '15c95eb2-646a-43bf-8bf9-e4f117d05d12', '2026-04-30',  1500, 'reservation', 'CIERRE_ABRIL import');  -- row 4  BNT 309-C
INSERT INTO payments (id, sale_id, payment_date, amount, payment_type, notes)
VALUES ('d4e90ac7-6c26-47b1-bb78-fd2c8418b964', '89dd84a7-bbc8-4015-8bd2-32f063e75ee3', '2026-04-28',  1500, 'reservation', 'CIERRE_ABRIL import');  -- row 5  BNT 105-D
INSERT INTO payments (id, sale_id, payment_date, amount, payment_type, notes)
VALUES ('6559f109-93d3-41ee-9591-a721e708d076', 'f7ea12a1-65b0-40ab-889a-9a12ba3631a5', '2026-04-28',  1500, 'reservation', 'CIERRE_ABRIL import');  -- row 6  BNT 202-B
INSERT INTO payments (id, sale_id, payment_date, amount, payment_type, notes)
VALUES ('adbae8df-779d-4737-b0cb-27a79ef1c582', '99a117db-d36e-44aa-9305-ed7c1ce6e39b', '2026-04-25',  1500, 'reservation', 'CIERRE_ABRIL import');  -- row 7  BNT 313-B
INSERT INTO payments (id, sale_id, payment_date, amount, payment_type, notes)
VALUES ('56d3412b-f959-4a03-9d27-e3f79cdb4b27', '9d359f82-33e8-4e4e-9bd0-ccac6d42cd5e', '2026-04-25',  1500, 'reservation', 'CIERRE_ABRIL import');  -- row 8  BNT 401-D
INSERT INTO payments (id, sale_id, payment_date, amount, payment_type, notes)
VALUES ('4ef3fae3-06aa-46ed-8e4a-20df64e97fb2', 'df6bd4df-1a3b-475b-b905-e3ad33cd9a15', '2026-04-19',  1500, 'reservation', 'CIERRE_ABRIL import');  -- row 9  BNT 302-D
INSERT INTO payments (id, sale_id, payment_date, amount, payment_type, notes)
VALUES ('04b15a89-f153-40e9-884d-3ddafcdc8c54', '06cfff0d-ec66-4206-86f8-3dd47bf62f3b', '2026-04-14',  1500, 'reservation', 'CIERRE_ABRIL import');  -- row 10 BNT 505-D
INSERT INTO payments (id, sale_id, payment_date, amount, payment_type, notes)
VALUES ('bcf85569-fa26-4c6b-8964-b78c03628ec7', '481a321c-801d-4931-8965-434be9ab1989', '2026-04-12',  1500, 'reservation', 'CIERRE_ABRIL import');  -- row 11 BNT 202-A
INSERT INTO payments (id, sale_id, payment_date, amount, payment_type, notes)
VALUES ('f2a0c07a-070d-485a-9bd6-aaf5f9f9ec56', '2923fcb4-1a80-4515-9680-e54cc0189dd2', '2026-04-12',  1500, 'reservation', 'CIERRE_ABRIL import');  -- row 12 BNT 305-C
INSERT INTO payments (id, sale_id, payment_date, amount, payment_type, notes)
VALUES ('bf88fd54-a47e-4999-a6df-8b011dd17902', 'ba1169b7-05d0-452e-8040-311311dfdc3e', '2026-04-04',  1500, 'reservation', 'CIERRE_ABRIL import');  -- row 13 BNT 511-C
INSERT INTO payments (id, sale_id, payment_date, amount, payment_type, notes)
VALUES ('844a4542-e8fd-4004-b317-30c2efe90b5d', 'cf28cad1-4691-4e6e-bb6a-4011146ea649', '2026-04-30',  3000, 'reservation', 'CIERRE_ABRIL import');  -- row 14 BLT 1103-C
INSERT INTO payments (id, sale_id, payment_date, amount, payment_type, notes)
VALUES ('75083f06-fb64-4086-887f-3d10f875097c', '8f914ee1-c458-4091-b597-589cce503b52', '2026-04-30',  3000, 'reservation', 'CIERRE_ABRIL import');  -- row 15 BLT 1208-B
INSERT INTO payments (id, sale_id, payment_date, amount, payment_type, notes)
VALUES ('54706934-5452-43ea-9ee3-9d6f121bf95b', '83af9959-2e26-4af0-95ff-b2f5cb7c5f35', '2026-04-19',  3000, 'reservation', 'CIERRE_ABRIL import');  -- row 16 BLT 508-B
INSERT INTO payments (id, sale_id, payment_date, amount, payment_type, notes)
VALUES ('611581e8-256e-4720-983a-3380095a6a0f', '1803cb61-e183-47c7-9658-673d4def2fd4', '2026-04-21', 10000, 'reservation', 'CIERRE_ABRIL import');  -- row 17 BLV5 1016
INSERT INTO payments (id, sale_id, payment_date, amount, payment_type, notes)
VALUES ('f0749242-e449-439f-826e-305c31e472f9', 'a64eacdd-433a-4274-896d-52cebd9c150f', '2026-04-20', 10000, 'reservation', 'CIERRE_ABRIL import');  -- row 18 BLV5 1212
INSERT INTO payments (id, sale_id, payment_date, amount, payment_type, notes)
VALUES ('8ad629a2-7e68-4c68-8502-bf832f2ce004', '7615f8af-c2ca-4400-bab9-81303ed70724', '2026-04-19', 10000, 'reservation', 'CIERRE_ABRIL import');  -- row 19 BLV5 614
INSERT INTO payments (id, sale_id, payment_date, amount, payment_type, notes)
VALUES ('92346b5c-ee97-4da3-9e29-371b46bdc8de', '8fee2609-6f2d-40b1-8531-f47e9c1a893e', '2026-04-17', 10000, 'reservation', 'CIERRE_ABRIL import');  -- row 20 BLV5 1001
INSERT INTO payments (id, sale_id, payment_date, amount, payment_type, notes)
VALUES ('75fc4c15-1bc4-43c8-b995-66034aafa0cf', '0737b81b-b63d-4956-b071-5654a2bdb03a', '2026-04-17',  5000, 'reservation', 'CIERRE_ABRIL import');  -- row 21 BLV5 1116 (5,000 per SSOT)
INSERT INTO payments (id, sale_id, payment_date, amount, payment_type, notes)
VALUES ('fce2ade6-2d0e-4d75-b92b-7c051832535f', 'ae05f8f3-9528-4e14-8127-29b19c7591fd', '2026-04-10', 10000, 'reservation', 'CIERRE_ABRIL import');  -- row 22 BLV5 919
INSERT INTO payments (id, sale_id, payment_date, amount, payment_type, notes)
VALUES ('f73d79a8-399c-48a7-97b2-ed56566668b5', 'b93d7d8a-dc5a-42fe-9811-59ef125d3202', '2026-04-26',  3000, 'reservation', 'CIERRE_ABRIL import');  -- row 25 BLT 1007-B (no promise)

-- ============================================================================
-- PHASE E: Re-enable triggers and calculate commissions in date order
-- ============================================================================
-- Note: Row 25 (promise_signed_date = NULL) is included in the date range but
-- calculate_commissions() generates no Phase 1 commissions for it.
-- Phase 1 fires only when promise_signed_date is set on the sale record
-- (auto_recalc_commissions_on_sale_update trigger handles this automatically).

ALTER TABLE payments ENABLE TRIGGER auto_calculate_commissions;
ALTER TABLE sales ENABLE TRIGGER auto_recalc_commissions_on_sale_update;

DO $$
DECLARE
  r record;
  v_count int := 0;
BEGIN
  FOR r IN
    SELECT p.id
    FROM payments p
    JOIN sales s ON p.sale_id = s.id
    WHERE s.status = 'active'
      AND s.sale_date >= '2026-04-01'
      AND s.sale_date <= '2026-04-30'
      AND p.notes = 'CIERRE_ABRIL import'
    ORDER BY p.payment_date, p.id
  LOOP
    PERFORM calculate_commissions(r.id);
    v_count := v_count + 1;
  END LOOP;
  RAISE NOTICE 'Commission calculation complete: % payments processed', v_count;
END;
$$;

-- ============================================================================
-- PHASE F: Validation queries (run manually after execution)
-- ============================================================================

-- -- 1. Verify April sale count (filters on sale_date, so preamble cancellations not counted)
-- SELECT status, COUNT(*)
-- FROM sales WHERE sale_date BETWEEN '2026-04-01' AND '2026-04-30'
-- GROUP BY status;
-- -- Expected: active = 22

-- -- 2. Verify April payment count
-- SELECT COUNT(*) FROM payments WHERE notes = 'CIERRE_ABRIL import';
-- -- Expected: 22

-- -- 3. Verify preamble cancellations applied
-- SELECT COUNT(*) FROM sales WHERE id IN (
--   '019c9692-cf84-7937-81ca-8447b18de85f','019c9692-e422-7f38-9de7-b10083700126',
--   '019c9692-fef7-7177-b6e5-442f381c905f','019c9693-1080-70d6-a750-d5dde17fc996',
--   '019c9681-3098-7c22-9d57-3e00a39f4c6f','019c9681-8d79-7e5f-b6a0-7ee9bb1529c9',
--   '019c9681-94a0-73c8-9b5f-4aae7469bc40','019c9681-4aa6-7bcd-9205-82a12a78a077',
--   '019c9692-7ae5-7c5b-994b-f653a3e0a394','019c9692-cd02-7cb1-86bb-0752350d32d8'
-- ) AND status = 'cancelled';
-- -- Expected: 10

-- -- 4. Verify commissions generated (21 sales with promise × 6+ recipients; row 25 = 0)
-- SELECT recipient_name, COUNT(*), ROUND(SUM(commission_amount)::numeric, 2) AS total
-- FROM commissions c
-- JOIN payments p ON c.payment_id = p.id
-- WHERE p.notes = 'CIERRE_ABRIL import'
-- GROUP BY recipient_name
-- ORDER BY total DESC;

-- -- 5. Verify row 25 (BLT 1007-B) generated NO commissions (promise not signed)
-- SELECT COUNT(*) FROM commissions c
-- JOIN payments p ON c.payment_id = p.id
-- WHERE p.id = 'f73d79a8-399c-48a7-97b2-ed56566668b5';
-- -- Expected: 0

-- -- 6. Spot-check Ivan Castillo escalation (row 7 = 0.0125, others = 0.01)
-- SELECT u.unit_number, s.ejecutivo_rate,
--        ROUND((s.price_without_tax * s.ejecutivo_rate)::numeric, 2) AS expected_ejecutivo_commission
-- FROM sales s
-- JOIN units u ON s.unit_id = u.id
-- WHERE s.sales_rep_id = 'eca06792-5219-4549-9922-274324e9f53b'
--   AND s.sale_date BETWEEN '2026-04-01' AND '2026-04-30'
-- ORDER BY s.sale_date;
-- -- Expected: 5 rows (4 at 0.01, 1 at 0.0125 for unit 313-B)

-- -- 7. Confirm lead_source_id set on two sales (rows 8 and 25)
-- SELECT u.unit_number, ls.name AS lead_source
-- FROM sales s
-- JOIN units u ON s.unit_id = u.id
-- LEFT JOIN lead_sources ls ON s.lead_source_id = ls.id
-- WHERE s.sale_date BETWEEN '2026-04-01' AND '2026-04-30'
--   AND s.lead_source_id IS NOT NULL;
-- -- Expected: 2 rows — BNT 401-D (Diego Reynoso) and BLT 1007-B (Joel Mayen Anavisca), both = 'Meta'
