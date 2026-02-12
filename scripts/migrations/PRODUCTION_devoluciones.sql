-- ============================================================================
-- PRODUCTION: Devoluciones (Reimbursement) Migration
-- ============================================================================
-- Run in Supabase SQL Editor.
-- Pre-requisite: Run pre_check.sql first; ensure 0 rows for negative amounts.
-- ============================================================================

-- 1. Add enum value (idempotent)
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

-- 2. Optional: CHECK constraint (skip if pre_check returned rows)
-- ALTER TABLE payments ADD CONSTRAINT payments_amount_sign_check
-- CHECK (
--   (payment_type = 'reimbursement' AND amount < 0)
--   OR (payment_type != 'reimbursement' AND amount >= 0)
-- );

-- 3. Exclude reimbursements from commission calculation
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
  if not found then raise exception 'Payment not found: %', p_payment_id; end if;

  if v_payment.payment_type = 'reimbursement' then
    delete from commissions where payment_id = p_payment_id and paid = false;
    return;
  end if;

  select * into v_sale from sales where id = v_payment.sale_id;
  if not found then raise exception 'Sale not found for payment: %', p_payment_id; end if;

  if v_payment.payment_type = 'reservation' then
    v_phase := 1;
  elsif v_sale.deed_signed_date is not null and v_payment.payment_date >= v_sale.deed_signed_date then
    v_phase := 3;
  else
    v_phase := 2;
  end if;

  select percentage into v_phase_percentage from commission_phases where phase = v_phase;
  if not found then raise exception 'Phase % configuration not found', v_phase; end if;

  delete from commissions where payment_id = p_payment_id;

  for v_rate in select * from commission_rates where recipient_type = 'management' and always_paid = true and active = true loop
    insert into commissions (payment_id, sale_id, recipient_id, recipient_name, phase, rate, base_amount, commission_amount, paid, status)
    values (p_payment_id, v_sale.id, v_rate.recipient_id, v_rate.recipient_name, v_phase, v_rate.rate,
      v_payment.amount, v_payment.amount * v_rate.rate * v_phase_percentage, false, 'pending');
  end loop;

  if v_sale.sales_rep_id is not null and v_sale.sales_rep_id <> '' and v_sale.sales_rep_id <> 'walk_in' and v_sale.sales_rep_id <> 'unknown' then
    select * into v_rate from commission_rates where recipient_id = v_sale.sales_rep_id and recipient_type = 'sales_rep' and active = true;
    if found then
      insert into commissions (payment_id, sale_id, recipient_id, recipient_name, phase, rate, base_amount, commission_amount, paid, status)
      values (p_payment_id, v_sale.id, v_rate.recipient_id, v_rate.recipient_name, v_phase, v_rate.rate,
        v_payment.amount, v_payment.amount * v_rate.rate * v_phase_percentage, false, 'pending');
    end if;
  else
    select * into v_rate from commission_rates where recipient_id = 'walk_in' and recipient_type = 'special' and active = true;
    if found then
      insert into commissions (payment_id, sale_id, recipient_id, recipient_name, phase, rate, base_amount, commission_amount, paid, status)
      values (p_payment_id, v_sale.id, v_rate.recipient_id, v_rate.recipient_name, v_phase, v_rate.rate,
        v_payment.amount, v_payment.amount * v_rate.rate * v_phase_percentage, false, 'pending');
    end if;
  end if;

  if v_sale.referral_applies = true then
    select * into v_rate from commission_rates where recipient_id = 'referral' and recipient_type = 'special' and active = true;
    if found then
      insert into commissions (payment_id, sale_id, recipient_id, recipient_name, phase, rate, base_amount, commission_amount, paid, status)
      values (p_payment_id, v_sale.id, 'referral', 'Referral Bonus: ' || coalesce(v_sale.referral_name, 'Unknown'),
        v_phase, v_rate.rate, v_payment.amount, v_payment.amount * v_rate.rate * v_phase_percentage, false, 'pending');
    end if;
  end if;

  for v_rate in select * from commission_rates where recipient_type = 'special' and always_paid = true and active = true and recipient_id not in ('referral','walk_in') loop
    insert into commissions (payment_id, sale_id, recipient_id, recipient_name, phase, rate, base_amount, commission_amount, paid, status)
    values (p_payment_id, v_sale.id, v_rate.recipient_id, v_rate.recipient_name, v_phase, v_rate.rate,
      v_payment.amount, v_payment.amount * v_rate.rate * v_phase_percentage, false, 'pending');
  end loop;
end;
$function$;
