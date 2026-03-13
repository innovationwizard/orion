-- 028: Add profession text column to rv_client_profiles
-- Used in PCV (Promesa de Compraventa) for "profesión u oficio".
-- Stores the actual profession string (e.g., "Ingeniero", "Comerciante").
-- Backfill from occupation_type for existing SSOT profiles.

ALTER TABLE rv_client_profiles
  ADD COLUMN IF NOT EXISTS profession text;

COMMENT ON COLUMN rv_client_profiles.profession IS
  'Profession or trade for legal documents (PCV). Examples: Ingeniero, Comerciante, Empleado(a).';

-- Backfill profession from occupation_type for profiles that have it
UPDATE rv_client_profiles
SET profession = CASE occupation_type
  WHEN 'formal' THEN 'Empleado(a)'
  WHEN 'informal' THEN 'Empleado(a)'
  WHEN 'independiente' THEN 'Profesional Independiente'
  WHEN 'empresario' THEN 'Empresario(a)'
END
WHERE occupation_type IS NOT NULL
  AND profession IS NULL;
