-- 074: Add missing salespeople Javier Soto and Brenda Pérez.
--
-- The OneDrive sync reported "Salesperson not found" for these two names on
-- BLT units 104, 609, 708 and B5 unit 1309. Both are confirmed active sales
-- reps with @puertaabierta.com.gt accounts; they were absent from the table
-- in any spelling.
--
-- full_name uses the accented form, consistent with the rest of the table.
-- The sync matcher normalizes case and diacritics, so unaccented Excel
-- spellings ("Brenda Perez", "Javier soto") resolve to these rows.
--
-- phone is left NULL: not supplied, and no placeholder data is permitted.

INSERT INTO salespeople (full_name, display_name, email, is_active)
VALUES
  ('Javier Soto',  'Javier Soto',  'javier.soto@puertaabierta.com.gt',  true),
  ('Brenda Pérez', 'Brenda Pérez', 'brenda.perez@puertaabierta.com.gt', true)
ON CONFLICT (full_name) DO NOTHING;
