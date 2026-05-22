-- ============================================================================
-- Migration 062: Fix salesperson_periods — active reps + José Gutiérrez
-- ============================================================================
-- Problem: calculate_commissions() uses MAX(salesperson_periods.end_date) to
-- determine whether a rep's payment should redirect to ahorro_por_retiro.
-- Rony, Daniel, Paula, Erwin had stale closed end_dates (Jan–Feb 2026), causing
-- all their April 2026 ejecutivo commissions to route to ahorro_por_retiro
-- instead of to them directly. José Gutiérrez's MAX end_date was 2026-02-01
-- instead of his confirmed 2026-04-21 contract end.
-- Fix: replace all stale period rows with correct ones, then recalculate
-- all April 2026 commissions.
-- ============================================================================

-- ============================================================================
-- PHASE 1: Fix salesperson_periods
-- ============================================================================

-- Delete all stale period rows for the five affected reps
DELETE FROM salesperson_periods
WHERE salesperson_id IN (
  '8b14b330-7e04-4409-98eb-e3d1d7d0a363',  -- Rony Ramirez
  'c5e33ccb-6c39-45ac-8d4d-ee5cdf598895',  -- Daniel Veliz
  'c87fe26f-3fad-4498-8cea-4563a380d863',  -- Erwin Cardona
  '1718037b-0d7b-4346-8ef2-c7658e25092b',  -- Paula Hernández
  '3d7ff0ed-94bf-4d9a-9259-ea03114e62a2'   -- José Gutiérrez
);

-- Insert correct periods
INSERT INTO salesperson_periods (salesperson_id, start_date, end_date, dates_confirmed, source, notes)
VALUES
  -- Active reps: end_date NULL = ongoing open period
  ('8b14b330-7e04-4409-98eb-e3d1d7d0a363', '2025-10-01', NULL,         true, 'migration_062', 'Ongoing active rep — open period'),
  ('c5e33ccb-6c39-45ac-8d4d-ee5cdf598895', '2025-11-01', NULL,         true, 'migration_062', 'Ongoing active rep — open period'),
  ('c87fe26f-3fad-4498-8cea-4563a380d863', '2025-11-01', NULL,         true, 'migration_062', 'Ongoing active rep — open period'),
  ('1718037b-0d7b-4346-8ef2-c7658e25092b', '2022-11-01', NULL,         true, 'migration_062', 'Ongoing active rep — open period'),
  -- José Gutiérrez: confirmed end date 2026-04-21 (migration 059)
  ('3d7ff0ed-94bf-4d9a-9259-ea03114e62a2', '2025-06-01', '2026-04-21', true, 'migration_062', 'Offboarded 2026-04-21 per migration 059 SSOT');

-- ============================================================================
-- PHASE 2: Recalculate April 2026 commissions
-- ============================================================================
-- calculate_commissions() deletes all existing rows for each payment and
-- reinserts correct ones. April payments are all unpaid (phase 1, brand new).

DO $$
DECLARE
  r record;
  v_count int := 0;
BEGIN
  FOR r IN
    SELECT p.id
    FROM payments p
    JOIN sales s ON p.sale_id = s.id
    WHERE s.status = 'active'
      AND s.sale_date >= '2026-04-01'
      AND s.sale_date <= '2026-04-30'
    ORDER BY p.payment_date, p.id
  LOOP
    PERFORM calculate_commissions(r.id);
    v_count := v_count + 1;
  END LOOP;
  RAISE NOTICE 'Commission recalculation complete: % payments', v_count;
END;
$$;
