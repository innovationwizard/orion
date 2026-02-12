-- ============================================================================
-- Migration: Devoluciones / Reimbursement Support
-- ============================================================================
-- Purpose: Add 'reimbursement' to payment_type enum for "Devolución de aportaciones"
--          (board-approved refunds to desisted clients). Reimbursements are stored
--          as negative amounts on cancelled sales.
--
-- Industry practices applied:
--   - Explicit transaction type (reimbursement) + signed amount: clear semantics,
--     SUM(amount) produces correct net cash flow without extra logic
--   - Refunds/reimbursements excluded from commission calculation (standard)
--   - Constraint to enforce only reimbursements can be negative (data integrity)
--
-- Run in Supabase SQL Editor. Execute in order.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Step 0: Pre-flight checks (run first, verify before proceeding)
-- ----------------------------------------------------------------------------

-- 0a. Confirm no existing negative amounts or reimbursements (required for optional CHECK)
SELECT id, sale_id, amount, payment_type
FROM payments
WHERE amount < 0 OR payment_type::text = 'reimbursement';
-- Expected: 0 rows. If any rows exist, either fix data first or skip the CHECK constraint.

-- 0b. Inspect current payment_type enum values
SELECT enum_range(NULL::payment_type) AS payment_type_values;

-- ----------------------------------------------------------------------------
-- Step 1: Add 'reimbursement' to payment_type enum
-- ----------------------------------------------------------------------------

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'payment_type' AND e.enumlabel = 'reimbursement'
  ) THEN
    ALTER TYPE payment_type ADD VALUE 'reimbursement';
  END IF;
END
$$;

-- ----------------------------------------------------------------------------
-- Step 2 (Optional): Add CHECK constraint — only reimbursements can have negative amount
-- ----------------------------------------------------------------------------
-- Skip this if Step 0a returned any rows. Run 0a again after data cleanup.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'payments_amount_sign_check'
  ) THEN
    ALTER TABLE payments
    ADD CONSTRAINT payments_amount_sign_check
    CHECK (
      (payment_type = 'reimbursement' AND amount < 0)
      OR (payment_type != 'reimbursement' AND amount >= 0)
    );
  END IF;
END
$$;

COMMENT ON CONSTRAINT payments_amount_sign_check ON payments IS
  'Only reimbursement payments may have negative amount. All other types must be >= 0.';

-- ----------------------------------------------------------------------------
-- Step 3: Update calculate_commissions to exclude reimbursements
-- ----------------------------------------------------------------------------
-- Reimbursements must NOT generate commissions. The trigger fires on all payments;
-- we add an early return when payment_type = 'reimbursement'.

CREATE OR REPLACE FUNCTION public.calculate_commissions(p_payment_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO 'public', 'extensions'
AS $function$
declare
  v_payment record;
  v_sale record;
  v_phase int;
  v_phase_percentage numeric;
  v_rate record;
begin
  select * into v_payment from payments where id = p_payment_id;
  if not found then
    raise exception 'Payment not found: %', p_payment_id;
  end if;

  -- Reimbursements (devoluciones): do not calculate commissions; remove unpaid only (never charge back paid)
  if v_payment.payment_type = 'reimbursement' then
    delete from commissions where payment_id = p_payment_id and paid = false;
    return;
  end if;

  select * into v_sale from sales where id = v_payment.sale_id;
  if not found then
    raise exception 'Sale not found for payment: %', p_payment_id;
  end if;

  -- Phase rules (strict)
  if v_payment.payment_type = 'reservation' then
    v_phase := 1;
  elsif v_sale.deed_signed_date is not null
        and v_payment.payment_date >= v_sale.deed_signed_date then
    v_phase := 3;
  else
    v_phase := 2;
  end if;

  select percentage into v_phase_percentage
  from commission_phases
  where phase = v_phase;

  if not found then
    raise exception 'Phase % configuration not found', v_phase;
  end if;

  -- Clean existing commissions for this payment
  delete from commissions where payment_id = p_payment_id;

  -- 1) Management (always_paid)
  for v_rate in
    select * from commission_rates
    where recipient_type = 'management'
      and always_paid = true
      and active = true
  loop
    insert into commissions
      (payment_id, sale_id, recipient_id, recipient_name, phase, rate, base_amount, commission_amount, paid, status)
    values
      (p_payment_id, v_sale.id, v_rate.recipient_id, v_rate.recipient_name, v_phase, v_rate.rate,
       v_payment.amount, v_payment.amount * v_rate.rate * v_phase_percentage, false, 'pending');
  end loop;

  -- 2) Sales rep (if present and not walk_in / unknown)
  if v_sale.sales_rep_id is not null
     and v_sale.sales_rep_id <> ''
     and v_sale.sales_rep_id <> 'walk_in'
     and v_sale.sales_rep_id <> 'unknown' then
    select * into v_rate
    from commission_rates
    where recipient_id = v_sale.sales_rep_id
      and recipient_type = 'sales_rep'
      and active = true;

    if found then
      insert into commissions
        (payment_id, sale_id, recipient_id, recipient_name, phase, rate, base_amount, commission_amount, paid, status)
      values
        (p_payment_id, v_sale.id, v_rate.recipient_id, v_rate.recipient_name, v_phase, v_rate.rate,
         v_payment.amount, v_payment.amount * v_rate.rate * v_phase_percentage, false, 'pending');
    end if;
  else
    -- Walk-in (including sales_rep_id NULL, '', 'walk_in', 'unknown')
    select * into v_rate
    from commission_rates
    where recipient_id = 'walk_in'
      and recipient_type = 'special'
      and active = true;

    if found then
      insert into commissions
        (payment_id, sale_id, recipient_id, recipient_name, phase, rate, base_amount, commission_amount, paid, status)
      values
        (p_payment_id, v_sale.id, v_rate.recipient_id, v_rate.recipient_name, v_phase, v_rate.rate,
         v_payment.amount, v_payment.amount * v_rate.rate * v_phase_percentage, false, 'pending');
    end if;
  end if;

  -- 3) Referral (if applicable)
  if v_sale.referral_applies = true then
    select * into v_rate
    from commission_rates
    where recipient_id = 'referral'
      and recipient_type = 'special'
      and active = true;

    if found then
      insert into commissions
        (payment_id, sale_id, recipient_id, recipient_name, phase, rate, base_amount, commission_amount, paid, status)
      values
        (p_payment_id, v_sale.id, 'referral',
         'Referral Bonus: ' || coalesce(v_sale.referral_name, 'Unknown'),
         v_phase, v_rate.rate,
         v_payment.amount, v_payment.amount * v_rate.rate * v_phase_percentage, false, 'pending');
    end if;
  end if;

  -- 4) Special always_paid (e.g., ahorro)
  for v_rate in
    select * from commission_rates
    where recipient_type = 'special'
      and always_paid = true
      and active = true
      and recipient_id not in ('referral','walk_in')
  loop
    insert into commissions
      (payment_id, sale_id, recipient_id, recipient_name, phase, rate, base_amount, commission_amount, paid, status)
    values
      (p_payment_id, v_sale.id, v_rate.recipient_id, v_rate.recipient_name, v_phase, v_rate.rate,
       v_payment.amount, v_payment.amount * v_rate.rate * v_phase_percentage, false, 'pending');
  end loop;
end;
$function$;

COMMENT ON FUNCTION public.calculate_commissions(uuid) IS
  'Calculates and inserts commissions for a payment. Reimbursements are excluded (early return).';

-- ----------------------------------------------------------------------------
-- Step 4: Verify trigger exists (no change needed — it calls calculate_commissions)
-- ----------------------------------------------------------------------------

-- Run to confirm:
-- SELECT tgname, pg_get_triggerdef(oid, true) FROM pg_trigger t
-- JOIN pg_class c ON t.tgrelid = c.oid
-- WHERE c.relname = 'payments' AND tgname = 'auto_calculate_commissions';

-- ----------------------------------------------------------------------------
-- Step 5: Post-migration verification
-- ----------------------------------------------------------------------------

-- Confirm new enum value
SELECT enum_range(NULL::payment_type) AS payment_type_values;
-- Should include 'reimbursement'.

-- Confirm reimbursements would be excluded from commissions (manual test after ETL loads data)
-- SELECT p.payment_type, p.amount, p.payment_date, c.full_name, u.unit_number
-- FROM payments p
-- JOIN sales s ON s.id = p.sale_id
-- JOIN clients c ON c.id = s.client_id
-- JOIN units u ON u.id = s.unit_id
-- WHERE p.payment_type = 'reimbursement'
-- ORDER BY u.unit_number, p.payment_date;
