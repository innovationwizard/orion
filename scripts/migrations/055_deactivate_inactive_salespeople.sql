-- Migration 055: Deactivate inactive salespeople
-- Context: 43 rows have is_active = true but only 12 are currently active.
-- The remaining 31 include ETL duplicates, organizational entities, and former salespeople.
-- Active list confirmed by sales manager (2026-04-20).

-- 1. Deactivate all salespeople NOT in the active-12 list (by UUID)
UPDATE salespeople
SET is_active = false, updated_at = now()
WHERE id NOT IN (
  '32622ef2-d725-45a3-a4a4-94763c29fd87',  -- Anahí Cisneros
  '77eae195-6ed2-4a94-b848-6cb1dc022708',  -- Antonio Rada
  'd5895fe3-62c8-4815-af0b-086feafead42',  -- Eder Veliz
  '32747c11-3482-414f-bac5-52d8fa7c2a4c',  -- Efrén Sánchez
  'c87fe26f-3fad-4498-8cea-4563a380d863',  -- Erwin Cardona
  'eca06792-5219-4549-9922-274324e9f53b',  -- Ivan Castillo
  'e60af875-839e-40b4-a646-e0484a6d4423',  -- Job Alexander Jiménez Villatoro
  '3d7ff0ed-94bf-4d9a-9259-ea03114e62a2',  -- José Gutierrez
  '7aad4ead-19b1-4c94-b0d5-968bf7bf07bc',  -- Keilly Pinto
  '58770544-eb03-4887-b622-278806707cb1',  -- Pablo Marroquín
  '1718037b-0d7b-4346-8ef2-c7658e25092b',  -- Paula Hernández
  '8b14b330-7e04-4409-98eb-e3d1d7d0a363'   -- Rony Ramirez
)
AND is_active = true;

-- 2. End-date active project assignments for deactivated salespeople
UPDATE salesperson_project_assignments
SET end_date = CURRENT_DATE, updated_at = now()
WHERE salesperson_id IN (
  SELECT id FROM salespeople WHERE is_active = false
)
AND end_date IS NULL;

-- 3. Prevent future accent-insensitive duplicate names
CREATE OR REPLACE FUNCTION prevent_duplicate_salesperson()
RETURNS trigger AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM salespeople
    WHERE unaccent(lower(full_name)) = unaccent(lower(NEW.full_name))
    AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
  ) THEN
    RAISE EXCEPTION 'Duplicate salesperson (accent-insensitive): %', NEW.full_name;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_salespeople_no_duplicates
  BEFORE INSERT OR UPDATE OF full_name ON salespeople
  FOR EACH ROW EXECUTE FUNCTION prevent_duplicate_salesperson();
