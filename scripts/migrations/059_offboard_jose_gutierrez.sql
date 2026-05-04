-- Migration 059: Offboard José Gutiérrez (quit 2026-04-21)
-- Salesperson UUID: 3d7ff0ed-94bf-4d9a-9259-ea03114e62a2
-- Auth user UUID:   3dd17a5c-9ed7-4fd2-9987-753cb788e261

-- 1. Deactivate salesperson
UPDATE salespeople
SET is_active = false, updated_at = now()
WHERE id = '3d7ff0ed-94bf-4d9a-9259-ea03114e62a2';

-- 2. End all active project assignments
UPDATE salesperson_project_assignments
SET end_date = '2026-04-21', updated_at = now()
WHERE salesperson_id = '3d7ff0ed-94bf-4d9a-9259-ea03114e62a2'
  AND end_date IS NULL;

-- 3. End salesperson period (commission system → redirects future payments to ahorro por retiro)
UPDATE salesperson_periods
SET end_date = '2026-04-21'
WHERE salesperson_id = '3d7ff0ed-94bf-4d9a-9259-ea03114e62a2'
  AND end_date IS NULL;

-- 4. Ban auth user (permanent — revokes all sessions immediately)
UPDATE auth.users
SET banned_until = '2099-12-31T23:59:59Z',
    updated_at = now()
WHERE id = '3dd17a5c-9ed7-4fd2-9987-753cb788e261';
