-- ============================================================================
-- Migration: Allow negative amounts for reimbursement payments
-- ============================================================================
-- payments_amount_check (amount >= 0) blocks devolución/reimbursement refunds.
-- Drop it and ensure payments_amount_sign_check: only reimbursement may be negative.
-- ============================================================================

-- 1. Drop the restrictive constraint if it exists
ALTER TABLE public.payments
  DROP CONSTRAINT IF EXISTS payments_amount_check;

-- 2. Add the correct constraint (idempotent) — only reimbursement may have amount < 0
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.payments'::regclass
      AND conname = 'payments_amount_sign_check'
  ) THEN
    ALTER TABLE public.payments
    ADD CONSTRAINT payments_amount_sign_check
    CHECK (
      (payment_type = 'reimbursement' AND amount < 0)
      OR (payment_type != 'reimbursement' AND amount >= 0)
    );
  END IF;
END
$$;

COMMENT ON CONSTRAINT payments_amount_sign_check ON public.payments IS
  'Only reimbursement payments may have negative amount. All other types must be >= 0.';
