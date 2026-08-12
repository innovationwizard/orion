-- ============================================================================
-- Migration 070: Link commission_gerencia_assignments to salespeople
-- ============================================================================
-- The metas engine (/api/hud/ventas → objetivos) counts asesoresActivos from
-- open salesperson_project_assignments. Active GC/Supervisor role-holders
-- (Antonio Rada, Job Jiménez) hold assignments on every project and inflated
-- the metas (BEN 35 vs 25 real). recipient_id here is a slug with no DB link
-- to salespeople — add the optional FK and backfill the two current holders.
--
-- salesperson_id stays NULL for historical recipients that don't exist in
-- salespeople (ronaldo_ogaldez, alek_hernandez).
-- ============================================================================

ALTER TABLE public.commission_gerencia_assignments
  ADD COLUMN IF NOT EXISTS salesperson_id uuid REFERENCES public.salespeople(id);

COMMENT ON COLUMN public.commission_gerencia_assignments.salesperson_id IS
  'Optional link to salespeople for role-holders who also exist as salespeople. Lets the metas engine exclude active management from asesoresActivos. NULL for historical recipients not present in salespeople.';

-- Antonio Rada (GC desde 2026-03-16; supervisor 2025-07-07→2026-03-15)
UPDATE public.commission_gerencia_assignments
SET salesperson_id = '77eae195-6ed2-4a94-b848-6cb1dc022708'
WHERE recipient_id = 'antonio_rada';

-- Job Alexander Jiménez Villatoro (Supervisor desde 2026-03-16)
UPDATE public.commission_gerencia_assignments
SET salesperson_id = 'e60af875-839e-40b4-a646-e0484a6d4423'
WHERE recipient_id = 'job_jimenez';

-- Verification (run manually):
-- SELECT recipient_id, recipient_name, role, start_date, end_date, salesperson_id
-- FROM commission_gerencia_assignments ORDER BY start_date;
-- Expected: all antonio_rada + job_jimenez rows linked; ronaldo/alek NULL.
