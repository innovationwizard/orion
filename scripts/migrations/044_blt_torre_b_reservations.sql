-- ============================================================================
-- Migration 044: BLT Torre B — Load 2 confirmed reservations
-- ============================================================================
-- Source: ReporteBosqueLasTapias.csv (authoritative log from sales manager)
-- As of 2026-03-23, only 2 Torre B reservations are logged in the CSV.
-- A 3rd was verbally reported but not yet logged — will be loaded separately
-- once it appears in the authoritative source.
--
-- Reservation 1: Unit 702  — Josue Emanuel Coronado Lara / Karen Celeste
--                             Morales Júarez (co-buyers), Paula Hernández
-- Reservation 2: Unit 1307 — José Ariel Miranda Aldana, Pablo Marroquín
--
-- Project: Bosque Las Tapias (019c7d10-8ee5-7999-9881-2cd5ad038aa9)
-- Tower: Torre B
-- ============================================================================

-- Step 1: Insert clients into rv_clients
-- (ON CONFLICT not possible — no unique constraint on full_name in rv_clients)

INSERT INTO rv_clients (full_name)
VALUES ('Josue Emanuel Coronado Lara');

INSERT INTO rv_clients (full_name)
VALUES ('Karen Celeste Morales Júarez');

INSERT INTO rv_clients (full_name)
VALUES ('José Ariel Miranda Aldana');


-- Step 2: Insert reservations (CONFIRMED — these are confirmed sales per the log)

-- Reservation for unit 702 (Torre B, floor 7)
INSERT INTO reservations (
  unit_id, salesperson_id, status, deposit_amount, deposit_date,
  lead_source, is_resale, created_at, reviewed_at
) VALUES (
  '6f568538-94c2-45fd-95a3-75f0f88a526a',
  '1718037b-0d7b-4346-8ef2-c7658e25092b',
  'CONFIRMED'::rv_reservation_status,
  46700.00,
  '2026-03-02',
  'Inedita',
  false,
  '2026-03-02',
  '2026-03-02'
);

-- Reservation for unit 1307 (Torre B, floor 13)
INSERT INTO reservations (
  unit_id, salesperson_id, status, deposit_amount, deposit_date,
  lead_source, is_resale, created_at, reviewed_at
) VALUES (
  'bdc58d5e-e830-4f10-8eb3-266c0e74b39e',
  '58770544-eb03-4887-b622-278806707cb1',
  'CONFIRMED'::rv_reservation_status,
  46800.00,
  '2026-03-08',
  'Meta',
  false,
  '2026-03-08',
  '2026-03-08'
);


-- Step 3: Link clients to reservations via reservation_clients

-- Unit 702: primary buyer (Josue Emanuel Coronado Lara)
INSERT INTO reservation_clients (reservation_id, client_id, is_primary, role, document_order, signs_pcv)
VALUES (
  (SELECT id FROM reservations WHERE unit_id = '6f568538-94c2-45fd-95a3-75f0f88a526a'
     AND status = 'CONFIRMED' LIMIT 1),
  (SELECT id FROM rv_clients WHERE full_name = 'Josue Emanuel Coronado Lara' LIMIT 1),
  true,
  'PROMITENTE_COMPRADOR'::rv_buyer_role,
  1,
  true
);

-- Unit 702: co-buyer (Karen Celeste Morales Júarez)
INSERT INTO reservation_clients (reservation_id, client_id, is_primary, role, document_order, signs_pcv)
VALUES (
  (SELECT id FROM reservations WHERE unit_id = '6f568538-94c2-45fd-95a3-75f0f88a526a'
     AND status = 'CONFIRMED' LIMIT 1),
  (SELECT id FROM rv_clients WHERE full_name = 'Karen Celeste Morales Júarez' LIMIT 1),
  false,
  'CO_COMPRADOR'::rv_buyer_role,
  2,
  true
);

-- Unit 1307: primary buyer (José Ariel Miranda Aldana)
INSERT INTO reservation_clients (reservation_id, client_id, is_primary, role, document_order, signs_pcv)
VALUES (
  (SELECT id FROM reservations WHERE unit_id = 'bdc58d5e-e830-4f10-8eb3-266c0e74b39e'
     AND status = 'CONFIRMED' LIMIT 1),
  (SELECT id FROM rv_clients WHERE full_name = 'José Ariel Miranda Aldana' LIMIT 1),
  true,
  'PROMITENTE_COMPRADOR'::rv_buyer_role,
  1,
  true
);


-- Step 4: Update unit status to RESERVED
UPDATE rv_units SET status = 'RESERVED'::rv_unit_status, status_changed_at = now(), updated_at = now()
WHERE id = '6f568538-94c2-45fd-95a3-75f0f88a526a';

UPDATE rv_units SET status = 'RESERVED'::rv_unit_status, status_changed_at = now(), updated_at = now()
WHERE id = 'bdc58d5e-e830-4f10-8eb3-266c0e74b39e';


-- Step 5: Append to unit_status_log (audit trail)
INSERT INTO unit_status_log (unit_id, old_status, new_status, changed_by, reservation_id, reason, created_at)
VALUES (
  '6f568538-94c2-45fd-95a3-75f0f88a526a',
  'AVAILABLE'::rv_unit_status,
  'RESERVED'::rv_unit_status,
  'system:manual-load',
  (SELECT id FROM reservations WHERE unit_id = '6f568538-94c2-45fd-95a3-75f0f88a526a'
     AND status = 'CONFIRMED' LIMIT 1),
  'Manual load from ReporteBosqueLasTapias.csv (2 of 3 Torre B sales)',
  '2026-03-02'
);

INSERT INTO unit_status_log (unit_id, old_status, new_status, changed_by, reservation_id, reason, created_at)
VALUES (
  'bdc58d5e-e830-4f10-8eb3-266c0e74b39e',
  'AVAILABLE'::rv_unit_status,
  'RESERVED'::rv_unit_status,
  'system:manual-load',
  (SELECT id FROM reservations WHERE unit_id = 'bdc58d5e-e830-4f10-8eb3-266c0e74b39e'
     AND status = 'CONFIRMED' LIMIT 1),
  'Manual load from ReporteBosqueLasTapias.csv (2 of 3 Torre B sales)',
  '2026-03-08'
);
