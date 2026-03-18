-- Migration 039: Fix orphaned sales linked to "Unknown" salesperson
-- Context: 30 active sales from ETL had empty asesor → defaulted to placeholder "Unknown" (cd0006ee).
-- Cross-referenced against loans_ssot master databases (Feb 2026) + SSOT Reporte de Ventas.
-- All 30 sales have zero payments and zero commission rows. Zero financial impact.
-- ejecutivo_rate left NULL — CFO will confirm during upcoming session.

-- ============================================================
-- PART 1: Re-attribute 25 active sales to correct salespeople
-- ============================================================

-- BLT: José (Jose Gutierrez) — 13 units
UPDATE sales SET sales_rep_id = '3d7ff0ed-94bf-4d9a-9259-ea03114e62a2'
WHERE sales_rep_id = 'cd0006ee-5013-4881-be2f-c843f76fd607'
  AND status = 'active'
  AND id IN (
    SELECT s.id FROM sales s
    JOIN units u ON s.unit_id = u.id
    JOIN projects p ON s.project_id = p.id
    WHERE p.name = 'Bosque Las Tapias'
      AND u.unit_number IN ('809','106','906','903','1001','803','807','503','602','1004','1002','703','708')
      AND s.sales_rep_id = 'cd0006ee-5013-4881-be2f-c843f76fd607'
  );

-- BLT: Paula (Hernandez) — 6 units
UPDATE sales SET sales_rep_id = '1718037b-0d7b-4346-8ef2-c7658e25092b'
WHERE sales_rep_id = 'cd0006ee-5013-4881-be2f-c843f76fd607'
  AND status = 'active'
  AND id IN (
    SELECT s.id FROM sales s
    JOIN units u ON s.unit_id = u.id
    JOIN projects p ON s.project_id = p.id
    WHERE p.name = 'Bosque Las Tapias'
      AND u.unit_number IN ('604','401','605','902','908','502')
      AND s.sales_rep_id = 'cd0006ee-5013-4881-be2f-c843f76fd607'
  );

-- BEN: Eder (Veliz) — 1 unit (506-B-B)
UPDATE sales SET sales_rep_id = 'd5895fe3-62c8-4815-af0b-086feafead42'
WHERE sales_rep_id = 'cd0006ee-5013-4881-be2f-c843f76fd607'
  AND status = 'active'
  AND id IN (
    SELECT s.id FROM sales s
    JOIN units u ON s.unit_id = u.id
    WHERE u.unit_number = '506-B-B'
      AND s.sales_rep_id = 'cd0006ee-5013-4881-be2f-c843f76fd607'
  );

-- BEN: Rony (Ramirez) — 2 units (508-C-C, 303-C-C)
UPDATE sales SET sales_rep_id = '8b14b330-7e04-4409-98eb-e3d1d7d0a363'
WHERE sales_rep_id = 'cd0006ee-5013-4881-be2f-c843f76fd607'
  AND status = 'active'
  AND id IN (
    SELECT s.id FROM sales s
    JOIN units u ON s.unit_id = u.id
    WHERE u.unit_number IN ('508-C-C','303-C-C')
      AND s.sales_rep_id = 'cd0006ee-5013-4881-be2f-c843f76fd607'
  );

-- BEN: Pablo (Marroquin) — 1 unit (503-C-C)
UPDATE sales SET sales_rep_id = '58770544-eb03-4887-b622-278806707cb1'
WHERE sales_rep_id = 'cd0006ee-5013-4881-be2f-c843f76fd607'
  AND status = 'active'
  AND id IN (
    SELECT s.id FROM sales s
    JOIN units u ON s.unit_id = u.id
    WHERE u.unit_number = '503-C-C'
      AND s.sales_rep_id = 'cd0006ee-5013-4881-be2f-c843f76fd607'
  );

-- BEN: Ivan (Castillo) — 1 unit (607-C)
UPDATE sales SET sales_rep_id = 'eca06792-5219-4549-9922-274324e9f53b'
WHERE sales_rep_id = 'cd0006ee-5013-4881-be2f-c843f76fd607'
  AND status = 'active'
  AND id IN (
    SELECT s.id FROM sales s
    JOIN units u ON s.unit_id = u.id
    WHERE u.unit_number = '607-C'
      AND s.sales_rep_id = 'cd0006ee-5013-4881-be2f-c843f76fd607'
  );

-- B5: Junta (Directiva) — 1 unit (1607)
UPDATE sales SET sales_rep_id = '5fef7873-9b44-420f-aa6f-2e8212978962'
WHERE sales_rep_id = 'cd0006ee-5013-4881-be2f-c843f76fd607'
  AND status = 'active'
  AND id IN (
    SELECT s.id FROM sales s
    JOIN units u ON s.unit_id = u.id
    WHERE u.unit_number = '1607'
      AND s.sales_rep_id = 'cd0006ee-5013-4881-be2f-c843f76fd607'
  );

-- ============================================================
-- PART 2: Cancel 5 desisted BLT sales
-- Master DB (Feb 2026) shows these units currently available.
-- No re-sale records exist in prod DB.
-- ============================================================

UPDATE sales SET status = 'cancelled'
WHERE sales_rep_id = 'cd0006ee-5013-4881-be2f-c843f76fd607'
  AND status = 'active'
  AND id IN (
    SELECT s.id FROM sales s
    JOIN units u ON s.unit_id = u.id
    JOIN projects p ON s.project_id = p.id
    WHERE p.name = 'Bosque Las Tapias'
      AND u.unit_number IN ('101','105','505','802','1003')
      AND s.sales_rep_id = 'cd0006ee-5013-4881-be2f-c843f76fd607'
  );

-- ============================================================
-- PART 3: Deactivate "Unknown" salesperson
-- ============================================================

UPDATE salespeople SET is_active = false
WHERE id = 'cd0006ee-5013-4881-be2f-c843f76fd607';
