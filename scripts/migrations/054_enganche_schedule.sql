-- Migration 054: Add enganche_schedule to reservations
-- Purpose: Persist custom (non-uniform) enganche installment schedules.
-- When NULL, PCV/carta de pago compute uniform cuotas from enganche_pct + cuotas_enganche.
-- When set, documents use the exact amounts stored here.

ALTER TABLE reservations
ADD COLUMN enganche_schedule jsonb DEFAULT NULL;

COMMENT ON COLUMN reservations.enganche_schedule IS
  'Custom enganche installment schedule. Array of {"cuota": N, "amount": N}.
   NULL = uniform distribution (computed from enganche_pct and cuotas_enganche).
   When set, PCV and carta de pago use this schedule instead of computing uniform cuotas.';
