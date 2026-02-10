-- ============================================================================
-- Fix: Treat sales_rep_id = 'unknown' as walk-in (Puerta Abierta)
-- Run in Supabase SQL Editor. Then run backfill-commissions.sql again.
-- ============================================================================
-- The DB currently pays walk_in only when sales_rep_id IS NULL, '', or 'walk_in'.
-- When sales_rep_id = 'unknown' it tried sales_rep (no rate) and paid nothing.
-- This updates calculate_commissions so 'unknown' is treated as walk-in.
-- ============================================================================

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
