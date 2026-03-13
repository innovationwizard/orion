-- 027: Add edad column to rv_client_profiles
-- For existing SSOT clients: stores the actual age integer from the source data.
-- For new clients: birth_date is extracted from DPI photo via OCR.
-- PCV uses birth_date (preferred) with edad as fallback.

ALTER TABLE rv_client_profiles
  ADD COLUMN IF NOT EXISTS edad integer CHECK (edad IS NULL OR (edad >= 0 AND edad <= 150));

COMMENT ON COLUMN rv_client_profiles.edad IS 'Age from SSOT source data. Used as fallback when birth_date is not available.';
