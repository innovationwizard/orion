-- ============================================================================
-- Migration: Deduplicate sales_reps
-- ============================================================================
-- Consolidates duplicate sales reps (accent variants, abbreviated→full names).
-- Safe: updates sales first, then deletes orphaned sales_reps.
--
-- Rules applied:
--   1. Keep accented forms (Anahí, Sánchez, Marroquín, Hernández)
--   2. Prefer full name when available (Ronaldo → Ronaldo Ogaldez, etc.)
--   3. ** (no vendedor) → unknown
--   4. Junta Directiva: keep as-is
--
-- Run in Supabase SQL Editor. Review the mapping below before executing.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Pre-check: See what would be updated (run first, optional)
-- ----------------------------------------------------------------------------
-- WITH mapping (variant_id, canonical_id) AS (
--   VALUES ('Anahi Cisneros', 'Anahí Cisneros'), ('Efren Sanchez', 'Efren Sánchez'),
--     ('Efren Sanchéz', 'Efren Sánchez'), ('Efrén Sanchez', 'Efren Sánchez'),
--     ('Pablo Marroqin', 'Pablo Marroquín'), ('Pablo Marroquin', 'Pablo Marroquín'),
--     ('Paula Hernandez', 'Paula Hernández'), ('Antonio R', 'Antonio Rada'),
--     ('Eder Daniel V.', 'Eder Veliz'), ('Eder V.', 'Eder Veliz'),
--     ('Paula H.', 'Paula Hernández'), ('Ronaldo', 'Ronaldo Ogaldez'),
--     ('Pedro Sarti', 'Pedro Pablo Sarti'), ('**', 'unknown')
-- )
-- SELECT s.sales_rep_id AS from_id, m.canonical_id AS to_id, COUNT(*) AS sales_count
-- FROM sales s JOIN mapping m ON s.sales_rep_id = m.variant_id
-- GROUP BY s.sales_rep_id, m.canonical_id
-- ORDER BY sales_count DESC;

-- ----------------------------------------------------------------------------
-- Step 1: Update sales to point to canonical sales_rep_id
-- ----------------------------------------------------------------------------

WITH mapping (variant_id, canonical_id) AS (
  VALUES
    -- Accent variants (keep accented)
    ('Anahi Cisneros', 'Anahí Cisneros'),
    ('Efren Sanchez', 'Efren Sánchez'),
    ('Efren Sanchéz', 'Efren Sánchez'),
    ('Efrén Sanchez', 'Efren Sánchez'),
    ('Pablo Marroqin', 'Pablo Marroquín'),
    ('Pablo Marroquin', 'Pablo Marroquín'),
    ('Paula Hernandez', 'Paula Hernández'),
    -- Abbreviated → full name
    ('Antonio R', 'Antonio Rada'),
    ('Eder Daniel V.', 'Eder Veliz'),
    ('Eder V.', 'Eder Veliz'),
    ('Paula H.', 'Paula Hernández'),
    ('Ronaldo', 'Ronaldo Ogaldez'),
    ('Pedro Sarti', 'Pedro Pablo Sarti'),
    -- Special: no vendedor
    ('**', 'unknown')
)
UPDATE sales s
SET sales_rep_id = m.canonical_id
FROM mapping m
WHERE s.sales_rep_id = m.variant_id
  AND s.sales_rep_id <> m.canonical_id;

-- ----------------------------------------------------------------------------
-- Step 3: Delete orphaned sales_reps (no longer referenced by sales)
-- ----------------------------------------------------------------------------

DELETE FROM sales_reps
WHERE id IN (
  'Anahi Cisneros',
  'Efren Sanchez',
  'Efren Sanchéz',
  'Efrén Sanchez',
  'Pablo Marroqin',
  'Pablo Marroquin',
  'Paula Hernandez',
  'Antonio R',
  'Eder Daniel V.',
  'Eder V.',
  'Paula H.',
  'Ronaldo',
  'Pedro Sarti',
  '**'
)
AND id NOT IN (SELECT sales_rep_id FROM sales);

-- ----------------------------------------------------------------------------
-- Verification (run after migration)
-- ----------------------------------------------------------------------------
-- SELECT id, name FROM sales_reps ORDER BY name;
-- Should show no duplicates. Check sales still reference valid ids:
-- SELECT sales_rep_id, COUNT(*) FROM sales GROUP BY sales_rep_id
--   EXCEPT SELECT id, 0 FROM sales_reps;
