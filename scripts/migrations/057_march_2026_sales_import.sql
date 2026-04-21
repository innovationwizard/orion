-- ============================================================================
-- Migration 057: March 2026 Sales Import (CIERRE_MARZO.xlsx SSOT)
-- ============================================================================
-- Source: docs/CIERRE_MARZO.xlsx
-- 25 active sales + 2 desistimientos (cancelled)
-- Each active sale gets: client + sale + reservation payment
-- Commission trigger fires automatically on payment INSERT
--
-- Pre-requisite (executed manually during deploy):
--   4 prior sales on resold units cancelled:
--   UPDATE sales SET status = 'cancelled', updated_at = NOW()
--   WHERE status = 'active' AND unit_id IN (
--     '019c967f-2fc1-742f-8417-c2d26272b1b3',  -- 607-A (BNT, was Rigoberto Lopez 2025-11-17)
--     '019c967f-2fc2-751d-a35e-7a1af12c50cb',  -- 302-B (BNT, was Melany Flores 2025-08-03)
--     '019c968f-a042-7c59-9819-90c7209ee316',  -- 307 (BLV5, was Héctor Júarez 2025-12-08)
--     '019c968f-a043-7576-8504-ecfb25980f16'   -- 502 (BLV5, was Rudy Villeda 2025-06-24)
--   );
-- ============================================================================

-- Disable commission trigger during bulk insert (recalc at end in order)
ALTER TABLE payments DISABLE TRIGGER auto_calculate_commissions;

-- ============================================================================
-- PHASE A: Insert clients
-- ============================================================================

INSERT INTO clients (id, full_name) VALUES ('f82163b4-2680-481b-a7bb-29250002bb53', 'Maria Guadalupe Estacuy Mendoza');
INSERT INTO clients (id, full_name) VALUES ('ede8e9d8-1b49-48dc-a366-fe3ad4776e50', 'Ever Benedicto Tipol Yoj');
INSERT INTO clients (id, full_name) VALUES ('7030876c-5f3e-44b4-82be-716a228fc75d', 'Ana Paola Garcia Reyes 406');
INSERT INTO clients (id, full_name) VALUES ('e702dee9-c47a-4388-a4a3-d64cd266b63c', 'Ana Paola Garcia Reyes 402');
INSERT INTO clients (id, full_name) VALUES ('f6da3662-143f-4265-a5f8-081bc74bc1a4', 'Ana Natalia Bardales García');
INSERT INTO clients (id, full_name) VALUES ('8fedbffd-e5cb-4839-86bd-cc6884e984ad', 'Selvin Antonio Rodrigues Parada');
INSERT INTO clients (id, full_name) VALUES ('fb4eb4ef-31a4-4e67-bf0e-9a2bce360eec', 'Mirna Violeta Rodriguez Gonzalez/Amiagro, S.A.');
INSERT INTO clients (id, full_name) VALUES ('aaacc2f0-f3b2-41f9-91a0-094bb0f1d3cd', 'Nnenna Danie Sandoval Chavez');
INSERT INTO clients (id, full_name) VALUES ('cde5a0df-4751-4bf0-bed8-5781e86c29fd', 'Ludwin Jose Leonel Calderon Ortiz');
INSERT INTO clients (id, full_name) VALUES ('2d903c5f-86a2-4f84-975a-882121e94eef', 'Welnio Ivan Cueller Portillo');
INSERT INTO clients (id, full_name) VALUES ('4036436b-5fe6-4835-8240-497f4b4c608a', 'Flory Cristina Escalante Ramos');
INSERT INTO clients (id, full_name) VALUES ('d958d695-07c5-4a7c-be4d-ebfb27d9c65c', 'Edlen Isaí Reyes Matus - Gladys Adelina Reyes Matus');
INSERT INTO clients (id, full_name) VALUES ('766f1290-a3f3-4b4d-9fc3-e5c235b20fce', 'Yuri Blanca Margarita Reyes De Almira');
INSERT INTO clients (id, full_name) VALUES ('da21b77e-7603-4bf0-a0d6-548f7f548fe7', 'Josselin Rodriguez');
INSERT INTO clients (id, full_name) VALUES ('3cebead2-8004-4b6b-a435-04334660c978', 'Rosa Elena Rojas Cano');
INSERT INTO clients (id, full_name) VALUES ('8eed271d-0b94-44b5-9b46-1a036a2ea1dd', 'Eder Omar Vásquez Chávez');
INSERT INTO clients (id, full_name) VALUES ('6746ec2c-9d9a-4824-b73b-35907fe68748', 'Elkin Daniery Oscal');
INSERT INTO clients (id, full_name) VALUES ('b8875ed6-7e38-4d55-acc9-899cb5289390', 'Pedro Orlando Jose Carias Leiva');
INSERT INTO clients (id, full_name) VALUES ('110d6304-a4ed-45fb-98b7-b2c15991137c', 'José Ariel Miranda Aldana');
INSERT INTO clients (id, full_name) VALUES ('285b3413-b2a6-4749-84ce-2370f9372774', 'Carlos Augusto Aguilar');
INSERT INTO clients (id, full_name) VALUES ('fbe0e452-9bda-4b3c-9e7f-02ad43939e26', 'Nery Aroldo Castañeda Cerna/Sara Beatriz Castro Tebalán de Castañeda');
INSERT INTO clients (id, full_name) VALUES ('13d015f3-225d-4cca-96ad-2ff55b5c7223', 'Mauricio Adolfo Rodríguez');
INSERT INTO clients (id, full_name) VALUES ('62b5f90f-463e-40d9-8561-29829fb1eb10', 'Maria Jose Boche Barillas');
INSERT INTO clients (id, full_name) VALUES ('207702bb-89b0-4725-9c83-20abb0bd08b9', 'Josué Emanuel Corado Lara y Karen Celeste Morales Júarez');
INSERT INTO clients (id, full_name) VALUES ('0f8b4cf7-2ced-41c8-b8da-42781651a5c7', 'Marlon Jeovanny Barillas Morales y Jose David Barillas Morales');
INSERT INTO clients (id, full_name) VALUES ('4bf6c690-0f38-4c28-a400-90167cc7ad45', 'William Danilo Davila Coro');
INSERT INTO clients (id, full_name) VALUES ('aad0ea75-4675-4c03-a5c1-6e95bfbb44f3', 'Marlon Samuel  Pixtun Martínez y Mariela Yamileth Hernández Chávez');

-- ============================================================================
-- PHASE B: Insert active sales (25)
-- ============================================================================

INSERT INTO sales (id, project_id, unit_id, client_id, sales_rep_id, sale_date, price_with_tax, price_without_tax, down_payment_amount, financed_amount, status, promise_signed_date, ejecutivo_rate, referral_applies, referral_name)
VALUES ('6877c1ec-54d0-4ead-ab07-012b4619b01b', '019c7d10-8f5a-74c7-b3df-c2151ad8a376', '019c967f-2fcb-78c7-a65f-59f1cf8bea05', 'f82163b4-2680-481b-a7bb-29250002bb53', '8b14b330-7e04-4409-98eb-e3d1d7d0a363', '2026-03-31', 538000, 492223.2388, 37700, 500300, 'active', '2026-03-31', 0.0125, false, NULL);
INSERT INTO sales (id, project_id, unit_id, client_id, sales_rep_id, sale_date, price_with_tax, price_without_tax, down_payment_amount, financed_amount, status, promise_signed_date, ejecutivo_rate, referral_applies, referral_name)
VALUES ('22248b6a-70ec-4ac9-8241-c9b37fb353a9', '019c7d10-8f5a-74c7-b3df-c2151ad8a376', '019c967f-2fc1-742f-8417-c2d26272b1b3', 'ede8e9d8-1b49-48dc-a366-fe3ad4776e50', '8b14b330-7e04-4409-98eb-e3d1d7d0a363', '2026-03-30', 533000, 487648.6734, 26700, 506300, 'active', '2026-03-30', 0.0125, false, NULL);
INSERT INTO sales (id, project_id, unit_id, client_id, sales_rep_id, sale_date, price_with_tax, price_without_tax, down_payment_amount, financed_amount, status, promise_signed_date, ejecutivo_rate, referral_applies, referral_name)
VALUES ('83ba25ae-7300-42ea-80d7-416f898d6843', '019c7d10-8f5a-74c7-b3df-c2151ad8a376', '019c967f-2fc0-76fa-9017-51ac0636f69f', '7030876c-5f3e-44b4-82be-716a228fc75d', 'c5e33ccb-6c39-45ac-8d4d-ee5cdf598895', '2026-03-30', 533700, 488289.1125, 26700, 507000, 'active', '2026-03-30', 0.01, false, NULL);
INSERT INTO sales (id, project_id, unit_id, client_id, sales_rep_id, sale_date, price_with_tax, price_without_tax, down_payment_amount, financed_amount, status, promise_signed_date, ejecutivo_rate, referral_applies, referral_name)
VALUES ('4d47106f-4ae7-439a-ab89-4fb11f9fc260', '019c7d10-8f5a-74c7-b3df-c2151ad8a376', '019c967f-2fc0-7e5f-9719-c188c3c212ba', 'e702dee9-c47a-4388-a4a3-d64cd266b63c', 'c5e33ccb-6c39-45ac-8d4d-ee5cdf598895', '2026-03-29', 533700, 488289.1125, 26700, 507000, 'active', '2026-03-29', 0.01, false, NULL);
INSERT INTO sales (id, project_id, unit_id, client_id, sales_rep_id, sale_date, price_with_tax, price_without_tax, down_payment_amount, financed_amount, status, promise_signed_date, ejecutivo_rate, referral_applies, referral_name)
VALUES ('5fd53acb-0113-4296-9c13-c5dbb600b07c', '019c7d10-8f5a-74c7-b3df-c2151ad8a376', '019c967f-2fc0-7509-9af2-20fd9b688b90', 'f6da3662-143f-4265-a5f8-081bc74bc1a4', 'eca06792-5219-4549-9922-274324e9f53b', '2026-03-28', 386900, 353979.8719, 20300, 366600, 'active', '2026-03-28', 0.01, false, NULL);
INSERT INTO sales (id, project_id, unit_id, client_id, sales_rep_id, sale_date, price_with_tax, price_without_tax, down_payment_amount, financed_amount, status, promise_signed_date, ejecutivo_rate, referral_applies, referral_name)
VALUES ('ce12134b-e6ce-4842-a02b-d887ddd70d79', '019c7d10-8e01-720f-942f-cac0017d83a8', '019c968f-a042-7c59-9819-90c7209ee316', '8fedbffd-e5cb-4839-86bd-cc6884e984ad', '3d7ff0ed-94bf-4d9a-9259-ea03114e62a2', '2026-03-25', 1095600, 1002378.7740, 54800, 1040800, 'active', '2026-03-25', 0.01, false, NULL);
INSERT INTO sales (id, project_id, unit_id, client_id, sales_rep_id, sale_date, price_with_tax, price_without_tax, down_payment_amount, financed_amount, status, promise_signed_date, ejecutivo_rate, referral_applies, referral_name)
VALUES ('0b07c2fd-24bb-44a5-8821-c7a8df4f8fbb', '019c7d10-8e01-720f-942f-cac0017d83a8', '019c968f-a041-7fe0-886f-a523c73f87c8', 'fb4eb4ef-31a4-4e67-bf0e-9a2bce360eec', '3d7ff0ed-94bf-4d9a-9259-ea03114e62a2', '2026-03-27', 1329300, 1216193.9616, 1329300, 0, 'active', '2026-03-27', 0.01, false, NULL);
INSERT INTO sales (id, project_id, unit_id, client_id, sales_rep_id, sale_date, price_with_tax, price_without_tax, down_payment_amount, financed_amount, status, promise_signed_date, ejecutivo_rate, referral_applies, referral_name)
VALUES ('361da7ea-ae98-4269-9757-85a8af56db9d', '019c7d10-8f5a-74c7-b3df-c2151ad8a376', '019c967f-2fcb-72a3-a443-7bf0c41946c2', 'aaacc2f0-f3b2-41f9-91a0-094bb0f1d3cd', '8b14b330-7e04-4409-98eb-e3d1d7d0a363', '2026-03-27', 537300, 491582.7996, 37700, 499600, 'active', '2026-03-27', 0.01, false, NULL);
INSERT INTO sales (id, project_id, unit_id, client_id, sales_rep_id, sale_date, price_with_tax, price_without_tax, down_payment_amount, financed_amount, status, promise_signed_date, ejecutivo_rate, referral_applies, referral_name)
VALUES ('6a9d0dc4-2246-4d28-9dac-c36a70a96267', '019c7d10-8e01-720f-942f-cac0017d83a8', '019c968f-a041-7f1c-8c7e-1f5d49f0bd2f', 'cde5a0df-4751-4bf0-bed8-5781e86c29fd', '3d7ff0ed-94bf-4d9a-9259-ea03114e62a2', '2026-03-23', 1305000, 1193961.5737, 65250, 1239750, 'active', '2026-03-23', 0.01, false, NULL);
INSERT INTO sales (id, project_id, unit_id, client_id, sales_rep_id, sale_date, price_with_tax, price_without_tax, down_payment_amount, financed_amount, status, promise_signed_date, ejecutivo_rate, referral_applies, referral_name)
VALUES ('01599984-ccd4-4d33-83c8-6ad89e1752ba', '019c7d10-8f5a-74c7-b3df-c2151ad8a376', '019c967f-2fcb-7c26-82be-02c950fbda9e', '2d903c5f-86a2-4f84-975a-882121e94eef', '8b14b330-7e04-4409-98eb-e3d1d7d0a363', '2026-03-22', 538000, 492223.2388, 37700, 500300, 'active', '2026-03-22', 0.01, false, NULL);
INSERT INTO sales (id, project_id, unit_id, client_id, sales_rep_id, sale_date, price_with_tax, price_without_tax, down_payment_amount, financed_amount, status, promise_signed_date, ejecutivo_rate, referral_applies, referral_name)
VALUES ('a894a6d4-1e2b-4b1f-ad88-d3f2f445b781', '019c7d10-8f5a-74c7-b3df-c2151ad8a376', '019c967f-2fc2-751d-a35e-7a1af12c50cb', '4036436b-5fe6-4835-8240-497f4b4c608a', '8b14b330-7e04-4409-98eb-e3d1d7d0a363', '2026-03-21', 533700, 488289.1125, 37400, 496300, 'active', '2026-03-21', 0.01, false, NULL);
INSERT INTO sales (id, project_id, unit_id, client_id, sales_rep_id, sale_date, price_with_tax, price_without_tax, down_payment_amount, financed_amount, status, promise_signed_date, ejecutivo_rate, referral_applies, referral_name)
VALUES ('8efdea5a-7a46-478b-afd0-9392cab5bcec', '019c7d10-8e01-720f-942f-cac0017d83a8', '019c968f-a041-7c0e-81df-25bc23d4a1aa', 'd958d695-07c5-4a7c-be4d-ebfb27d9c65c', 'c87fe26f-3fad-4498-8cea-4563a380d863', '2026-03-19', 1300000, 1189387.0082, 65000, 1235000, 'active', '2026-03-19', 0.01, false, NULL);
INSERT INTO sales (id, project_id, unit_id, client_id, sales_rep_id, sale_date, price_with_tax, price_without_tax, down_payment_amount, financed_amount, status, promise_signed_date, ejecutivo_rate, referral_applies, referral_name)
VALUES ('e29d304a-35c6-4767-b56a-b86e09897957', '019c7d10-8f5a-74c7-b3df-c2151ad8a376', '019c967f-2fc6-7321-ba82-4bce419a4d81', '766f1290-a3f3-4b4d-9fc3-e5c235b20fce', '8b14b330-7e04-4409-98eb-e3d1d7d0a363', '2026-03-16', 386900, 353979.8719, 27100, 359800, 'active', '2026-03-16', 0.01, false, NULL);
INSERT INTO sales (id, project_id, unit_id, client_id, sales_rep_id, sale_date, price_with_tax, price_without_tax, down_payment_amount, financed_amount, status, promise_signed_date, ejecutivo_rate, referral_applies, referral_name)
VALUES ('d3128c58-dc44-40f4-8f90-d464ceb49e5e', '019c7d10-8f5a-74c7-b3df-c2151ad8a376', '019c967f-2fcb-754e-a76c-e937093084c9', 'da21b77e-7603-4bf0-a0d6-548f7f548fe7', 'eca06792-5219-4549-9922-274324e9f53b', '2026-03-14', 537300, 491582.7996, 37300, 500000, 'active', '2026-03-14', 0.01, false, NULL);
INSERT INTO sales (id, project_id, unit_id, client_id, sales_rep_id, sale_date, price_with_tax, price_without_tax, down_payment_amount, financed_amount, status, promise_signed_date, ejecutivo_rate, referral_applies, referral_name)
VALUES ('a2a0d9e9-41e3-449b-bfe1-71fa54a026c1', '019c7d10-8f5a-74c7-b3df-c2151ad8a376', '019c967f-2fbf-7903-a421-d7f733afdd5a', '3cebead2-8004-4b6b-a435-04334660c978', 'c5e33ccb-6c39-45ac-8d4d-ee5cdf598895', '2026-03-12', 537300, 491582.7996, 26900, 510400, 'active', '2026-03-12', 0.01, false, NULL);
INSERT INTO sales (id, project_id, unit_id, client_id, sales_rep_id, sale_date, price_with_tax, price_without_tax, down_payment_amount, financed_amount, status, promise_signed_date, ejecutivo_rate, referral_applies, referral_name)
VALUES ('17d34a23-9c64-4f28-9fa1-9884abce589f', '019c7d10-8e01-720f-942f-cac0017d83a8', '019c968f-a041-75ce-b199-50696234ae3f', '8eed271d-0b94-44b5-9b46-1a036a2ea1dd', 'c87fe26f-3fad-4498-8cea-4563a380d863', '2026-03-10', 1150000, 1052150.0457, 80500, 1069500, 'active', '2026-03-10', 0.01, false, NULL);
INSERT INTO sales (id, project_id, unit_id, client_id, sales_rep_id, sale_date, price_with_tax, price_without_tax, down_payment_amount, financed_amount, status, promise_signed_date, ejecutivo_rate, referral_applies, referral_name)
VALUES ('352f4e7e-248e-486c-8af9-3be1631908b7', '019c7d10-8f5a-74c7-b3df-c2151ad8a376', '019c967f-2fcb-787c-a17b-061b894fbbb5', '6746ec2c-9d9a-4824-b73b-35907fe68748', 'eca06792-5219-4549-9922-274324e9f53b', '2026-03-08', 537700, 491948.7649, 37700, 500000, 'active', '2026-03-08', 0.01, false, NULL);
INSERT INTO sales (id, project_id, unit_id, client_id, sales_rep_id, sale_date, price_with_tax, price_without_tax, down_payment_amount, financed_amount, status, promise_signed_date, ejecutivo_rate, referral_applies, referral_name)
VALUES ('d74498bb-94ed-445a-bf57-bacd31606d68', '019c7d10-8f5a-74c7-b3df-c2151ad8a376', '019c967f-2fcb-7549-a695-d655d9dc2b9d', 'b8875ed6-7e38-4d55-acc9-899cb5289390', 'c5e33ccb-6c39-45ac-8d4d-ee5cdf598895', '2026-03-08', 537300, 491582.7996, 37700, 499600, 'active', '2026-03-08', 0.01, false, NULL);
INSERT INTO sales (id, project_id, unit_id, client_id, sales_rep_id, sale_date, price_with_tax, price_without_tax, down_payment_amount, financed_amount, status, promise_signed_date, ejecutivo_rate, referral_applies, referral_name)
VALUES ('ffbd318c-8fe9-4901-9c26-46276e5b9a20', '019c7d10-8ee5-7999-9881-2cd5ad038aa9', '019c9689-89a8-7062-aa55-84df8a1e3745', '110d6304-a4ed-45fb-98b7-b2c15991137c', '58770544-eb03-4887-b622-278806707cb1', '2026-03-08', 668000, 611161.9396, 46800, 621200, 'active', '2026-03-08', 0.01, false, NULL);
INSERT INTO sales (id, project_id, unit_id, client_id, sales_rep_id, sale_date, price_with_tax, price_without_tax, down_payment_amount, financed_amount, status, promise_signed_date, ejecutivo_rate, referral_applies, referral_name)
VALUES ('6d30751b-d8c5-4ee0-8942-b8d389a231ad', '019c7d10-8e01-720f-942f-cac0017d83a8', '019c968f-a041-7934-954a-9ebf7d32dcca', '285b3413-b2a6-4749-84ce-2370f9372774', 'c87fe26f-3fad-4498-8cea-4563a380d863', '2026-03-05', 1391400, 1273010.0640, 69600, 1321800, 'active', '2026-03-05', 0.01, false, NULL);
INSERT INTO sales (id, project_id, unit_id, client_id, sales_rep_id, sale_date, price_with_tax, price_without_tax, down_payment_amount, financed_amount, status, promise_signed_date, ejecutivo_rate, referral_applies, referral_name)
VALUES ('d43193d0-a84f-4c31-ba46-42d619710fbd', '019c7d10-8e01-720f-942f-cac0017d83a8', '019c968f-a042-728b-a436-1ed6bbd5fe1a', 'fbe0e452-9bda-4b3c-9e7f-02ad43939e26', '3d7ff0ed-94bf-4d9a-9259-ea03114e62a2', '2026-03-03', 1655400, 1514547.1180, 82800, 1572600, 'active', '2026-03-03', 0.01, false, NULL);
INSERT INTO sales (id, project_id, unit_id, client_id, sales_rep_id, sale_date, price_with_tax, price_without_tax, down_payment_amount, financed_amount, status, promise_signed_date, ejecutivo_rate, referral_applies, referral_name)
VALUES ('448a171c-a29a-4226-b8ba-6fed78e90fba', '019c7d10-8e01-720f-942f-cac0017d83a8', '019c968f-a043-7576-8504-ecfb25980f16', '13d015f3-225d-4cca-96ad-2ff55b5c7223', 'c87fe26f-3fad-4498-8cea-4563a380d863', '2026-03-03', 1635400, 1496248.8564, 350000, 1285400, 'active', '2026-03-03', 0.01, false, NULL);
INSERT INTO sales (id, project_id, unit_id, client_id, sales_rep_id, sale_date, price_with_tax, price_without_tax, down_payment_amount, financed_amount, status, promise_signed_date, ejecutivo_rate, referral_applies, referral_name)
VALUES ('9f7be669-c232-4562-bbf0-89886bc8ceb9', '019c7d10-8ee5-7999-9881-2cd5ad038aa9', '019c9689-89ab-7d0c-827b-f01435e98aee', '62b5f90f-463e-40d9-8561-29829fb1eb10', '1718037b-0d7b-4346-8ef2-c7658e25092b', '2026-03-03', 744000, 680695.3339, 52100, 691900, 'active', '2026-03-03', 0.01, true, 'BLT 1303 MARLON BARRILLAS(TIO)');
INSERT INTO sales (id, project_id, unit_id, client_id, sales_rep_id, sale_date, price_with_tax, price_without_tax, down_payment_amount, financed_amount, status, promise_signed_date, ejecutivo_rate, referral_applies, referral_name)
VALUES ('7a50579e-3a3a-4f48-948f-eb51252ae408', '019c7d10-8ee5-7999-9881-2cd5ad038aa9', '019c9689-89a6-7bef-aed5-c7423c1833b0', '207702bb-89b0-4725-9c83-20abb0bd08b9', '1718037b-0d7b-4346-8ef2-c7658e25092b', '2026-03-02', 668000, 611161.9396, 46760, 621240, 'active', '2026-03-02', 0.01, false, NULL);
INSERT INTO sales (id, project_id, unit_id, client_id, sales_rep_id, sale_date, price_with_tax, price_without_tax, down_payment_amount, financed_amount, status, promise_signed_date, ejecutivo_rate, referral_applies, referral_name)
VALUES ('9f7b3f11-24d9-49b9-bc8a-23c378e2b0c9', '019c7d10-8ee5-7999-9881-2cd5ad038aa9', '019c9689-89ac-76da-903e-23c10c25cf3f', '0f8b4cf7-2ced-41c8-b8da-42781651a5c7', '1718037b-0d7b-4346-8ef2-c7658e25092b', '2026-03-01', 744000, 680695.3339, 52100, 691900, 'active', '2026-03-01', 0.01, false, NULL);

-- ============================================================================
-- PHASE C: Insert cancelled sales — desistimientos (2)
-- ============================================================================

-- Desistimiento: William Danilo Davila Coro
INSERT INTO sales (id, project_id, unit_id, client_id, sales_rep_id, sale_date, price_with_tax, price_without_tax, down_payment_amount, financed_amount, status)
VALUES ('526471a0-2a4e-4b7c-b618-5f3eea602479', '019c7d10-8e01-720f-942f-cac0017d83a8', '019c968f-a04a-7b33-a1bd-4f0a26cdde23', '4bf6c690-0f38-4c28-a400-90167cc7ad45', '3d7ff0ed-94bf-4d9a-9259-ea03114e62a2', '2026-03-28', 1255700, 1148856.3586, 300000, 955700, 'cancelled');
-- Desistimiento: Marlon Samuel  Pixtun Martínez y Mariela
INSERT INTO sales (id, project_id, unit_id, client_id, sales_rep_id, sale_date, price_with_tax, price_without_tax, down_payment_amount, financed_amount, status)
VALUES ('ee9dfb2a-b456-4422-9a98-487d79b90b6c', '019c7d10-8ee5-7999-9881-2cd5ad038aa9', '019c9689-89ac-76e6-806f-a62116c1f577', 'aad0ea75-4675-4c03-a5c1-6e95bfbb44f3', '32622ef2-d725-45a3-a4a4-94763c29fd87', '2026-03-22', 744000, 680695.3339, 52100, 691900, 'cancelled');

-- ============================================================================
-- PHASE D: Insert reservation payments (active sales only)
-- ============================================================================

INSERT INTO payments (id, sale_id, payment_date, amount, payment_type, notes)
VALUES ('f8b6d974-4f80-481c-a296-58eba1df8c1b', '6877c1ec-54d0-4ead-ab07-012b4619b01b', '2026-03-31', 1500, 'reservation', 'CIERRE_MARZO import');
INSERT INTO payments (id, sale_id, payment_date, amount, payment_type, notes)
VALUES ('20ac5859-4fc0-4d1b-9c4c-1b9703ebfe37', '22248b6a-70ec-4ac9-8241-c9b37fb353a9', '2026-03-30', 1500, 'reservation', 'CIERRE_MARZO import');
INSERT INTO payments (id, sale_id, payment_date, amount, payment_type, notes)
VALUES ('8509ee37-fccb-4998-b1cb-019d681af5dd', '83ba25ae-7300-42ea-80d7-416f898d6843', '2026-03-30', 1500, 'reservation', 'CIERRE_MARZO import');
INSERT INTO payments (id, sale_id, payment_date, amount, payment_type, notes)
VALUES ('b5eb066a-bab8-4b47-9301-d1a34fa89ab0', '4d47106f-4ae7-439a-ab89-4fb11f9fc260', '2026-03-29', 1500, 'reservation', 'CIERRE_MARZO import');
INSERT INTO payments (id, sale_id, payment_date, amount, payment_type, notes)
VALUES ('a18a8fca-6656-4717-8e5e-b44bd78a63bc', '5fd53acb-0113-4296-9c13-c5dbb600b07c', '2026-03-28', 1500, 'reservation', 'CIERRE_MARZO import');
INSERT INTO payments (id, sale_id, payment_date, amount, payment_type, notes)
VALUES ('80794f44-d575-4c5c-9b9d-10d304a12a10', 'ce12134b-e6ce-4842-a02b-d887ddd70d79', '2026-03-25', 10000, 'reservation', 'CIERRE_MARZO import');
INSERT INTO payments (id, sale_id, payment_date, amount, payment_type, notes)
VALUES ('afb3a79e-8029-4a62-8c0b-70f3429c7011', '0b07c2fd-24bb-44a5-8821-c7a8df4f8fbb', '2026-03-27', 10000, 'reservation', 'CIERRE_MARZO import');
INSERT INTO payments (id, sale_id, payment_date, amount, payment_type, notes)
VALUES ('6a25a76a-0c7d-4083-aba0-2a1ffca0a286', '361da7ea-ae98-4269-9757-85a8af56db9d', '2026-03-27', 1500, 'reservation', 'CIERRE_MARZO import');
INSERT INTO payments (id, sale_id, payment_date, amount, payment_type, notes)
VALUES ('d008bbf7-4b1d-4959-90d7-547683699674', '6a9d0dc4-2246-4d28-9dac-c36a70a96267', '2026-03-23', 10000, 'reservation', 'CIERRE_MARZO import');
INSERT INTO payments (id, sale_id, payment_date, amount, payment_type, notes)
VALUES ('ba8c915d-da5c-451e-84ad-798a9ae6b7b5', '01599984-ccd4-4d33-83c8-6ad89e1752ba', '2026-03-22', 1500, 'reservation', 'CIERRE_MARZO import');
INSERT INTO payments (id, sale_id, payment_date, amount, payment_type, notes)
VALUES ('488e5e82-5ac7-452d-9423-cffab71c7461', 'a894a6d4-1e2b-4b1f-ad88-d3f2f445b781', '2026-03-21', 1500, 'reservation', 'CIERRE_MARZO import');
INSERT INTO payments (id, sale_id, payment_date, amount, payment_type, notes)
VALUES ('afcc25e1-1d63-40c7-a93b-d3bb25c893bc', '8efdea5a-7a46-478b-afd0-9392cab5bcec', '2026-03-19', 10000, 'reservation', 'CIERRE_MARZO import');
INSERT INTO payments (id, sale_id, payment_date, amount, payment_type, notes)
VALUES ('9f665670-e40f-4b32-bd6d-231e0861a443', 'e29d304a-35c6-4767-b56a-b86e09897957', '2026-03-16', 1500, 'reservation', 'CIERRE_MARZO import');
INSERT INTO payments (id, sale_id, payment_date, amount, payment_type, notes)
VALUES ('ccd27d31-ae76-4b3f-9f77-9aa58c6cf444', 'd3128c58-dc44-40f4-8f90-d464ceb49e5e', '2026-03-14', 1500, 'reservation', 'CIERRE_MARZO import');
INSERT INTO payments (id, sale_id, payment_date, amount, payment_type, notes)
VALUES ('925febe9-fdeb-4652-a863-7a5d88308fd8', 'a2a0d9e9-41e3-449b-bfe1-71fa54a026c1', '2026-03-12', 1500, 'reservation', 'CIERRE_MARZO import');
INSERT INTO payments (id, sale_id, payment_date, amount, payment_type, notes)
VALUES ('9b43294a-efa4-4e79-b979-7991ed22f774', '17d34a23-9c64-4f28-9fa1-9884abce589f', '2026-03-10', 10000, 'reservation', 'CIERRE_MARZO import');
INSERT INTO payments (id, sale_id, payment_date, amount, payment_type, notes)
VALUES ('661c0d44-0413-4a2f-bee2-2170cabec82f', '352f4e7e-248e-486c-8af9-3be1631908b7', '2026-03-08', 1500, 'reservation', 'CIERRE_MARZO import');
INSERT INTO payments (id, sale_id, payment_date, amount, payment_type, notes)
VALUES ('027ad52f-08f0-4130-beea-94a823b1c4b2', 'd74498bb-94ed-445a-bf57-bacd31606d68', '2026-03-08', 1500, 'reservation', 'CIERRE_MARZO import');
INSERT INTO payments (id, sale_id, payment_date, amount, payment_type, notes)
VALUES ('8fc6bc10-1f4c-4678-9042-139a5d9ea0da', 'ffbd318c-8fe9-4901-9c26-46276e5b9a20', '2026-03-08', 3000, 'reservation', 'CIERRE_MARZO import');
INSERT INTO payments (id, sale_id, payment_date, amount, payment_type, notes)
VALUES ('134b88bf-63cd-4fed-a0ae-b608cecc54f5', '6d30751b-d8c5-4ee0-8942-b8d389a231ad', '2026-03-05', 10000, 'reservation', 'CIERRE_MARZO import');
INSERT INTO payments (id, sale_id, payment_date, amount, payment_type, notes)
VALUES ('b227548b-2e9e-457e-a316-16320ba067a6', 'd43193d0-a84f-4c31-ba46-42d619710fbd', '2026-03-03', 10000, 'reservation', 'CIERRE_MARZO import');
INSERT INTO payments (id, sale_id, payment_date, amount, payment_type, notes)
VALUES ('88b432df-a617-4ef3-a2e4-6a3d0f679275', '448a171c-a29a-4226-b8ba-6fed78e90fba', '2026-03-03', 10000, 'reservation', 'CIERRE_MARZO import');
INSERT INTO payments (id, sale_id, payment_date, amount, payment_type, notes)
VALUES ('189ef0c1-33ed-45ec-9d36-ea801090b7bc', '9f7be669-c232-4562-bbf0-89886bc8ceb9', '2026-03-03', 3000, 'reservation', 'CIERRE_MARZO import');
INSERT INTO payments (id, sale_id, payment_date, amount, payment_type, notes)
VALUES ('b5b01554-3219-46a9-8824-4a0f47b60f3b', '7a50579e-3a3a-4f48-948f-eb51252ae408', '2026-03-02', 3000, 'reservation', 'CIERRE_MARZO import');
INSERT INTO payments (id, sale_id, payment_date, amount, payment_type, notes)
VALUES ('11102cd2-6008-4b4e-a610-41e848117905', '9f7b3f11-24d9-49b9-bc8a-23c378e2b0c9', '2026-03-01', 3000, 'reservation', 'CIERRE_MARZO import');

-- ============================================================================
-- PHASE E: Re-enable trigger and calculate commissions in date order
-- ============================================================================

ALTER TABLE payments ENABLE TRIGGER auto_calculate_commissions;

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
      AND s.sale_date >= '2026-03-01'
      AND s.sale_date <= '2026-03-31'
    ORDER BY p.payment_date, p.id
  LOOP
    PERFORM calculate_commissions(r.id);
    v_count := v_count + 1;
  END LOOP;
  RAISE NOTICE 'Commission calculation complete: % payments', v_count;
END;
$$;


-- ============================================================================
-- PHASE F: Validation queries (run manually after deployment)
-- ============================================================================

-- -- 1. Verify March sales count
-- SELECT COUNT(*), status FROM sales WHERE sale_date >= '2026-03-01' AND sale_date <= '2026-03-31' GROUP BY status;
-- -- Expected: active=25, cancelled=2

-- -- 2. Verify March payments count
-- SELECT COUNT(*) FROM payments p JOIN sales s ON p.sale_id = s.id WHERE s.sale_date >= '2026-03-01' AND s.sale_date <= '2026-03-31';
-- -- Expected: 25

-- -- 3. Verify March commissions generated
-- SELECT recipient_name, COUNT(*), ROUND(SUM(commission_amount)::numeric, 2) as total
-- FROM commissions c
-- JOIN payments p ON c.payment_id = p.id
-- WHERE p.payment_date >= '2026-03-01' AND p.payment_date <= '2026-03-31'
-- GROUP BY recipient_name ORDER BY total DESC;

-- -- 4. Verify Otto Herrera March total
-- SELECT ROUND(SUM(commission_amount)::numeric, 2) as otto_march_total
-- FROM commissions c
-- JOIN payments p ON c.payment_id = p.id
-- WHERE p.payment_date >= '2026-03-01' AND p.payment_date <= '2026-03-31'
--   AND c.recipient_id = 'otto_herrera';
