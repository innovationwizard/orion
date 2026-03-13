-- ============================================================================
-- Migration 026: PCV document storage
-- Date: 2026-03-13
-- Purpose: Add columns to track generated PCV (Promesa de Compraventa)
--          documents on reservations. Create 'pcv' Storage bucket.
-- ============================================================================

-- 1. Add PCV metadata columns to reservations
ALTER TABLE reservations
  ADD COLUMN IF NOT EXISTS pcv_url          text,
  ADD COLUMN IF NOT EXISTS pcv_generated_at timestamptz,
  ADD COLUMN IF NOT EXISTS pcv_generated_by uuid REFERENCES auth.users(id);

-- 2. Create 'pcv' Storage bucket (auth-only, like receipts/dpi)
INSERT INTO storage.buckets (id, name, public)
VALUES ('pcv', 'pcv', false)
ON CONFLICT (id) DO NOTHING;

-- 3. Storage policies — authenticated users can upload and read
CREATE POLICY "Authenticated users can upload PCV documents"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'pcv');

CREATE POLICY "Authenticated users can read PCV documents"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'pcv');

-- 4. Allow service_role to manage PCV files (for signed URLs from admin API)
CREATE POLICY "Service role full access to PCV"
  ON storage.objects FOR ALL
  TO service_role
  USING (bucket_id = 'pcv')
  WITH CHECK (bucket_id = 'pcv');
