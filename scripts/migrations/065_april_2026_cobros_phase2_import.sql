-- ============================================================================
-- Migration 065: April 2026 COBROS Phase 2 — down_payment import
-- ============================================================================
-- Source: docs/manifest-CIERRE_COBROS_ABRIL.md
-- Date:   2026-05-20
--
-- Inserts April 2026 down_payment installments for all active P2 units across:
--   Boulevard 5 (boulevard-5)     — 100 inserts (99 P2 + Apto 1212 Q40k)
--   Benestare (benestare)          —  90 inserts
--   Bosque Las Tapias (bosque-las-tapias) —  33 inserts
--   TOTAL: 223 inserts
--
-- payment_date = '2026-04-30' (COBROS April column month-end date)
-- payment_type = 'down_payment'
-- notes        = 'CIERRE_COBROS_ABRIL import'
--
-- EXCLUDED from this migration (see manifest FLAGS):
--   FLAG-C1  BLV5 1212 Q10,000 (Phase 1 reservation, in DB) → only Q40,000 inserted
--   FLAG-C2  BLV5 1116 Q10,000 (Phase 1 reservation, corrected by migration 063) → skip
--   FLAG-C3  BNT 210-C Q1,482 (Karen Barahona, cancelled sale) → skip
--   FLAG-C4  BNT 305-D Q1,500 (Phase 1 reservation, in DB after migration 064) → skip
--   FLAG-C6  BLT 1103-C Q3,000 (Phase 1 reservation from migration 061) → skip
--   AMB rows (April 2026 new sales — reservation payments in DB from migration 061)
--   FLAG-C12 4 units with no active sale: B5 718, BNT 207-C, BNT 505-A, BLT 806-C → skip
--
-- Idempotency: WHERE NOT EXISTS guard on (sale_id, payment_date, payment_type).
-- Safe to re-run: no duplicate inserts.
--
-- After insert: triggers re-enabled, calculate_commissions() called for all
-- newly inserted payments via DO block.
-- ============================================================================

ALTER TABLE payments DISABLE TRIGGER auto_calculate_commissions;

-- ============================================================================
-- BOULEVARD 5  (100 inserts)
-- Excludes: AMB rows 614, 919, 1001, 1016, 1116; FLAG-C12 unit 718
-- Notes:    Apto 1212 → Q40,000 (Phase 2 only; Q10,000 Phase 1 already in DB)
--           Apto 502  → Q140,000 (FLAG-C7: large amount, classified as down_payment
--                        pending Pati confirmation; non-blocking)
--           Apto 109  → Q1,100,004 (FLAG-C8: large lump-sum payoff)
--           Apto 113  → Q6.24 (FLAG-C9: rounding artifact, import exact amount)
-- ============================================================================
INSERT INTO payments (id, sale_id, payment_date, amount, payment_type, notes)
SELECT
    gen_random_uuid(),
    s.id,
    '2026-04-30'::date,
    v.amount::numeric,
    'down_payment',
    'CIERRE_COBROS_ABRIL import'
FROM (VALUES
    ('102',  73606.00),
    ('107',   5000.00),
    ('109', 1100004.00),
    ('113',      6.24),
    ('202',   8000.00),
    ('203',  11000.00),
    ('205',   7903.00),
    ('207',  12135.00),
    ('210',   8731.66),
    ('213',   5000.00),
    ('216',  50000.00),
    ('304',   5244.00),
    ('305',   3500.00),
    ('306',  10000.00),
    ('307',  11200.00),
    ('308',   6666.00),
    ('309',   5000.00),
    ('312',   7851.00),
    ('314',   6774.83),
    ('316', 599241.01),
    ('406',   8367.00),
    ('407',   7041.47),
    ('409',   3690.00),
    ('410',   9504.04),
    ('411',  10000.00),
    ('415',  18044.00),
    ('416',   5000.00),
    ('418',  43380.50),
    ('501',   8772.00),
    ('502', 140000.00),
    ('503',   7894.00),
    ('504',   7894.00),
    ('505',   7767.00),
    ('506',    635.00),
    ('507',  16565.30),
    ('510',   4000.00),
    ('511',  25000.00),
    ('513',   2415.00),
    ('517', 620000.00),
    ('519',  10210.00),
    ('602', 1407744.00),
    ('607',    428.00),
    ('611',  20488.00),
    ('612', 158212.50),
    ('613', 581568.60),
    ('618',   6000.00),
    ('619',  10214.00),
    ('705',  58647.00),
    ('706',  18614.70),
    ('707',  11945.00),
    ('708',  15793.00),
    ('709', 1190792.00),
    ('711',  45512.47),
    ('713',   5004.85),
    ('714',  19500.00),
    ('715', 522264.00),
    ('717', 702556.00),
    -- ('718', 13500.00) EXCLUDED FLAG-C12: no active sale record
    ('802',   4100.00),
    ('804',  17800.00),
    ('806', 917534.00),
    ('812', 200000.00),
    ('813',  12238.85),
    ('816', 551216.00),
    ('817',   3000.00),
    ('819',   3200.00),
    ('902',  40000.00),
    ('911',  27094.50),
    ('1010',  25000.00),
    ('1015',   5203.00),
    ('1017',  17800.00),
    ('1020',   8500.00),
    ('1103', 643098.50),
    ('1111',     81.50),
    ('1115',   8025.00),
    ('1201',  17900.00),
    ('1205',   8034.00),
    ('1212',  40000.00),   -- FLAG-C1: Phase 2 only (Q40k); Q10k Phase 1 already in DB
    ('1214',  10000.00),
    ('1215',   4000.00),
    ('1216',  31100.00),
    ('1218',   6950.00),
    ('1305',   5617.00),
    ('1306',   5000.00),
    ('1310',    100.00),
    ('1311',   8192.00),
    ('1315',  32100.00),
    ('1317',   7605.00),
    ('1318',  45000.00),
    ('1406',   1740.00),
    ('1408', 100000.00),
    ('1504',   1000.00),
    ('1505',   6929.00),
    ('1509',  32400.00),
    ('1605',   9165.71),
    ('1609',   9160.68),
    ('1612',   8488.00),
    ('1707',   5050.00),
    ('1708',  20000.00),
    ('1803', 150000.00),
    ('1804',   1940.00)
) AS v(unit_number, amount)
JOIN units u
    ON u.unit_number = v.unit_number
    AND u.project_id = (SELECT id FROM projects WHERE slug = 'boulevard-5')
JOIN sales s
    ON s.unit_id = u.id
    AND s.status <> 'cancelled'
WHERE NOT EXISTS (
    SELECT 1 FROM payments p2
    WHERE p2.sale_id = s.id
      AND p2.payment_date = '2026-04-30'
      AND p2.payment_type = 'down_payment'
);

-- ============================================================================
-- BENESTARE (90 inserts)
-- Excludes: AMB rows 103-A, 202-A, 313-B, 309-C, 105-D, 302-D, 401-D, 505-D
--           P1 row 202-B (Phase 1 reservation in DB from migration 061)
--           FLAG-C3 210-C (Karen Barahona, cancelled sale)
--           FLAG-C4 305-D (Phase 1 reservation in DB after migration 064)
--           FLAG-C12 207-C, 505-A (no active sale record)
-- Notes:    511-C → Q2,848 (FLAG-C5: total collected April; Q1,500 Phase 1 in DB separately)
-- ============================================================================
INSERT INTO payments (id, sale_id, payment_date, amount, payment_type, notes)
SELECT
    gen_random_uuid(),
    s.id,
    '2026-04-30'::date,
    v.amount::numeric,
    'down_payment',
    'CIERRE_COBROS_ABRIL import'
FROM (VALUES
    -- Torre A (13 rows; 505-A excluded FLAG-C12)
    ('201-A',  2340.00),
    ('209-A',  2300.00),
    ('305-A',  2686.00),
    ('404-A',  1800.00),
    ('405-A',  1062.50),
    ('409-A',  1500.00),
    ('501-A',  1462.50),
    ('503-A',  1400.00),
    ('504-A',  1400.00),
    -- ('505-A', 2558.00) EXCLUDED FLAG-C12: no active sale record
    ('506-A',  4182.00),
    ('508-A',  1400.00),
    ('509-A',  2320.00),
    ('607-A',  3600.00),
    -- Torre B (43 rows; 202-B P1 excluded; 313-B AMB excluded)
    ('102-B',  1614.00),
    ('103-B',  1406.00),
    ('104-B',  2000.00),
    ('109-B',  1490.00),
    ('111-B',  1463.00),
    ('112-B',  1364.71),
    ('113-B',  1431.25),
    -- ('202-B', 1500.00) EXCLUDED: Phase 1 reservation already in DB (migration 061)
    ('205-B',  1272.22),
    ('208-B',  1482.00),
    ('209-B',  1272.22),
    ('211-B',  1364.71),
    ('212-B',  1347.06),
    ('213-B',  1300.00),
    ('304-B',  1389.00),
    ('308-B',  1272.22),
    ('310-B',  1513.00),
    ('311-B',  1500.00),
    ('312-B',  1431.25),
    -- ('313-B', 1500.00) EXCLUDED: AMB — Phase 1 reservation in DB (migration 061)
    ('401-B',  1513.00),
    ('402-B',  1450.00),
    ('403-B',  1519.00),
    ('404-B',  1340.00),
    ('406-B',  1513.00),
    ('407-B',  2058.82),
    ('410-B',  3038.00),
    ('411-B',  1222.22),
    ('413-B',  1482.00),
    ('501-B',  1272.22),
    ('502-B',  1350.00),
    ('504-B',  1347.06),
    ('506-B',  1450.00),
    ('507-B',  1100.00),
    ('511-B',  1347.06),
    ('512-B',  1450.00),
    ('513-B',  1450.00),
    ('601-B',  1272.22),
    ('603-B',  1482.00),
    ('605-B',  1482.00),
    ('606-B',  3026.00),
    ('607-B',  1118.00),
    ('608-B',  1300.00),
    ('609-B',  1364.71),
    ('613-B',  1482.00),
    -- Torre C (30 rows; 309-C AMB excluded; 210-C FLAG-C3 excluded; 207-C FLAG-C12 excluded)
    ('101-C',  1018.00),
    ('103-C',   963.00),
    ('106-C',  1425.00),
    ('107-C',  1009.00),
    ('108-C',  1005.00),
    ('109-C',  1620.00),
    ('110-C',  3220.00),
    ('201-C',  1934.00),
    ('202-C',  1064.00),
    ('204-C',  1760.00),
    -- ('207-C', 1300.00) EXCLUDED FLAG-C12: no active sale record
    ('208-C',  2122.00),
    ('209-C',  1643.00),
    ('302-C',  1064.00),
    ('303-C',  1063.64),
    ('304-C',  1009.00),
    ('308-C',  1725.00),
    -- ('309-C', 1500.00) EXCLUDED: AMB — Phase 1 reservation in DB (migration 061)
    ('310-C',  1600.00),
    ('401-C',  1660.00),
    ('402-C',   963.00),
    ('403-C',  1000.00),
    ('406-C',  1350.00),
    ('407-C',  1063.64),
    ('408-C',  1100.00),
    ('507-C',  1040.23),
    ('509-C',  1018.00),
    ('510-C',  1000.00),
    ('511-C',  2848.00),  -- FLAG-C5: Q2,848 total; Q1,500 Phase 1 already in DB separately
    ('601-C',  1215.00),
    ('602-C',  1853.00),
    ('607-C',  1853.00),
    -- Torre D (4 rows; 105-D, 302-D, 401-D, 505-D AMB excluded; 305-D FLAG-C4 excluded)
    ('304-D',  1646.00),
    ('307-D',  1500.00),
    ('402-D',  1646.00),
    ('405-D',  1646.00)
) AS v(unit_number, amount)
JOIN units u
    ON u.unit_number = v.unit_number
    AND u.project_id = (SELECT id FROM projects WHERE slug = 'benestare')
JOIN sales s
    ON s.unit_id = u.id
    AND s.status <> 'cancelled'
WHERE NOT EXISTS (
    SELECT 1 FROM payments p2
    WHERE p2.sale_id = s.id
      AND p2.payment_date = '2026-04-30'
      AND p2.payment_type = 'down_payment'
);

-- ============================================================================
-- BOSQUE LAS TAPIAS (33 inserts)
-- Excludes: AMB rows 1007-B, 1208-B
--           FLAG-C6  1103-C (Phase 1 reservation from migration 061)
--           FLAG-C12 806-C (no active sale record — cancelled sale exists 2025-08-31)
-- ============================================================================
INSERT INTO payments (id, sale_id, payment_date, amount, payment_type, notes)
SELECT
    gen_random_uuid(),
    s.id,
    '2026-04-30'::date,
    v.amount::numeric,
    'down_payment',
    'CIERRE_COBROS_ABRIL import'
FROM (VALUES
    -- Torre B (3 rows; 1007-B and 1208-B AMB excluded)
    ('508-B',  3000.00),
    ('702-B',  1619.00),
    ('1307-B', 1623.00),
    -- Torre C (30 rows; 806-C FLAG-C12 excluded)
    ('101-C',  2000.00),
    ('106-C',  2115.38),
    ('107-C',  2192.31),
    ('302-C',  2455.00),
    ('303-C',  2232.00),
    ('401-C',  1640.00),
    ('402-C',  2142.93),
    ('502-C',  2135.00),
    ('604-C',  1597.00),
    ('701-C',  2174.07),
    ('703-C',  2135.00),
    ('705-C',  1615.50),
    ('706-C',  2455.00),
    ('708-C',  2135.00),
    ('709-C',  1500.00),
    -- ('806-C', 1500.00) EXCLUDED FLAG-C12: only cancelled sale exists; new sale not in DB
    ('808-C',  2046.00),
    ('809-C',  2000.00),
    ('902-C',  3000.00),
    ('903-C',  2000.00),
    ('905-C',  1734.00),
    ('906-C',  2000.00),
    ('907-C',  2500.00),
    ('908-C',  1964.00),
    ('1001-C', 1720.00),
    ('1004-C', 1950.00),
    ('1102-C', 3000.00),
    ('1202-C', 2232.00),
    ('1203-C', 2232.00),
    ('1208-C', 2320.00),
    ('1303-C', 2135.00)
) AS v(unit_number, amount)
JOIN units u
    ON u.unit_number = v.unit_number
    AND u.project_id = (SELECT id FROM projects WHERE slug = 'bosque-las-tapias')
JOIN sales s
    ON s.unit_id = u.id
    AND s.status <> 'cancelled'
WHERE NOT EXISTS (
    SELECT 1 FROM payments p2
    WHERE p2.sale_id = s.id
      AND p2.payment_date = '2026-04-30'
      AND p2.payment_type = 'down_payment'
);

-- ============================================================================
-- Re-enable trigger, recalculate commissions for all inserted payments
-- ============================================================================
ALTER TABLE payments ENABLE TRIGGER auto_calculate_commissions;

-- Calculate commissions for every payment just inserted.
-- calculate_commissions() does DELETE + REINSERT — safe to re-run.
DO $$
DECLARE r RECORD;
BEGIN
    FOR r IN
        SELECT p.id
        FROM payments p
        JOIN sales s ON p.sale_id = s.id
        JOIN units u ON s.unit_id = u.id
        JOIN projects pr ON u.project_id = pr.id
        WHERE p.payment_date = '2026-04-30'
          AND p.payment_type = 'down_payment'
          AND p.notes = 'CIERRE_COBROS_ABRIL import'
          AND pr.slug IN ('boulevard-5', 'benestare', 'bosque-las-tapias')
        ORDER BY p.id
    LOOP
        PERFORM calculate_commissions(r.id);
    END LOOP;
END $$;

-- ============================================================================
-- Post-check (uncomment to verify):
-- ============================================================================
-- SELECT proj.slug, COUNT(*) as inserted
-- FROM payments p
-- JOIN sales s ON p.sale_id = s.id
-- JOIN units u ON s.unit_id = u.id
-- JOIN projects proj ON u.project_id = proj.id
-- WHERE p.payment_date = '2026-04-30'
--   AND p.payment_type = 'down_payment'
--   AND p.notes = 'CIERRE_COBROS_ABRIL import'
--   AND proj.slug IN ('boulevard-5','benestare','bosque-las-tapias')
-- GROUP BY proj.slug
-- ORDER BY proj.slug;
-- Expected: boulevard-5=100, benestare=90, bosque-las-tapias=33
--
-- SELECT COUNT(*) as commission_rows
-- FROM commissions c
-- JOIN payments p ON c.payment_id = p.id
-- WHERE p.payment_date = '2026-04-30'
--   AND p.payment_type = 'down_payment'
--   AND p.notes = 'CIERRE_COBROS_ABRIL import';
-- Expected: 223 * (avg commission rows per payment) — typically 5-7 per payment
