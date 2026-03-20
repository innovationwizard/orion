-- ============================================================
-- Migration 040: Ventas Ownership RLS Policies
--
-- Replaces broad SELECT policies on reservation-related tables
-- with ownership-scoped policies. Ventas users see only their
-- own reservations, clients, and extractions. Non-ventas roles
-- see all rows (unchanged behavior).
--
-- Tables affected: reservations, rv_clients, reservation_clients,
--                  receipt_extractions
--
-- Defense-in-depth: API routes already filter by salesperson_id,
-- but these policies prevent data leakage if a new route omits
-- the filter or if the browser client queries Supabase directly.
-- ============================================================

-- Helper function: extract role from JWT app_metadata
-- (reusable across policies, avoids repetition)
CREATE OR REPLACE FUNCTION public.jwt_role()
RETURNS text
LANGUAGE sql STABLE
AS $$
  SELECT coalesce(
    current_setting('request.jwt.claims', true)::jsonb
      -> 'app_metadata' ->> 'role',
    ''
  );
$$;

-- ============================================================
-- 1. reservations
-- ============================================================

-- Drop the old broad SELECT policy
DROP POLICY IF EXISTS "Authenticated users read reservations" ON reservations;

-- New: ventas see only own reservations, all other roles see all
CREATE POLICY "Role-scoped read reservations"
  ON reservations FOR SELECT
  TO authenticated
  USING (
    CASE
      WHEN public.jwt_role() = 'ventas'
      THEN salesperson_id IN (
        SELECT id FROM salespeople WHERE user_id = auth.uid()
      )
      ELSE true
    END
  );

-- ============================================================
-- 2. rv_clients
-- ============================================================

-- Drop the old broad SELECT policy
DROP POLICY IF EXISTS "Authenticated users read rv_clients" ON rv_clients;

-- New: ventas see only clients linked to their own reservations
CREATE POLICY "Role-scoped read rv_clients"
  ON rv_clients FOR SELECT
  TO authenticated
  USING (
    CASE
      WHEN public.jwt_role() = 'ventas'
      THEN id IN (
        SELECT rc.client_id
        FROM reservation_clients rc
        JOIN reservations r ON r.id = rc.reservation_id
        WHERE r.salesperson_id IN (
          SELECT sp.id FROM salespeople sp WHERE sp.user_id = auth.uid()
        )
      )
      ELSE true
    END
  );

-- ============================================================
-- 3. reservation_clients
-- ============================================================

-- Drop the old broad SELECT policy
DROP POLICY IF EXISTS "Authenticated users read reservation_clients" ON reservation_clients;

-- New: ventas see only junction rows for their own reservations
CREATE POLICY "Role-scoped read reservation_clients"
  ON reservation_clients FOR SELECT
  TO authenticated
  USING (
    CASE
      WHEN public.jwt_role() = 'ventas'
      THEN reservation_id IN (
        SELECT id FROM reservations
        WHERE salesperson_id IN (
          SELECT sp.id FROM salespeople sp WHERE sp.user_id = auth.uid()
        )
      )
      ELSE true
    END
  );

-- ============================================================
-- 4. receipt_extractions
-- ============================================================

-- Drop the old broad SELECT policy
DROP POLICY IF EXISTS "Authenticated users read extractions" ON receipt_extractions;

-- New: ventas see only extractions for their own reservations
CREATE POLICY "Role-scoped read receipt_extractions"
  ON receipt_extractions FOR SELECT
  TO authenticated
  USING (
    CASE
      WHEN public.jwt_role() = 'ventas'
      THEN reservation_id IN (
        SELECT id FROM reservations
        WHERE salesperson_id IN (
          SELECT sp.id FROM salespeople sp WHERE sp.user_id = auth.uid()
        )
      )
      ELSE true
    END
  );

-- ============================================================
-- Also tighten INSERT policies: require authentication
-- (was "WITH CHECK (true)" = anyone including anonymous)
-- ============================================================

DROP POLICY IF EXISTS "Anyone can insert reservations" ON reservations;
CREATE POLICY "Authenticated users insert reservations"
  ON reservations FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can insert reservation_clients" ON reservation_clients;
CREATE POLICY "Authenticated users insert reservation_clients"
  ON reservation_clients FOR INSERT
  TO authenticated
  WITH CHECK (true);
