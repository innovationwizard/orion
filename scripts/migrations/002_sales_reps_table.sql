-- ============================================================================
-- Migration: Sales Reps Table
-- ============================================================================
-- Replaces free-text sales_rep_id with a proper sales_reps lookup table.
-- Benefits: referential integrity, centralized names, cleaner commission logic.
--
-- Run in Supabase SQL Editor. Execute in order.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Step 1: Create sales_reps table
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.sales_reps (
  id text PRIMARY KEY,
  name text NOT NULL,
  contract_start_date date,
  contract_end_date date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  row_version integer NOT NULL DEFAULT 1
);

COMMENT ON TABLE public.sales_reps IS 'Sales representatives. Replaces free-text sales_rep_id.';
COMMENT ON COLUMN public.sales_reps.contract_start_date IS 'Start of sales rep contract. Empty if not yet known.';
COMMENT ON COLUMN public.sales_reps.contract_end_date IS 'End of sales rep contract. If commission payment_date > contract_end_date, commission goes to ahorro_por_retiro instead.';

-- ----------------------------------------------------------------------------
-- Step 2: Seed known values (commission-rules + special cases)
-- ----------------------------------------------------------------------------

INSERT INTO public.sales_reps (id, name) VALUES
  ('walk_in', 'Puerta Abierta'),
  ('unknown', 'Unknown / Directo'),
  ('05', 'Sales Rep 05'),
  ('06', 'Sales Rep 06'),
  ('35', 'Sales Rep 35'),
  ('GV1', 'Sales Rep GV1')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  updated_at = now();

-- ----------------------------------------------------------------------------
-- Step 3: Backfill legacy values from sales (any distinct sales_rep_id not yet in sales_reps)
-- ----------------------------------------------------------------------------

INSERT INTO public.sales_reps (id, name)
SELECT DISTINCT s.sales_rep_id, COALESCE(s.sales_rep_id, 'Unknown')
FROM sales s
WHERE s.sales_rep_id IS NOT NULL
  AND s.sales_rep_id <> ''
  AND NOT EXISTS (SELECT 1 FROM sales_reps sr WHERE sr.id = s.sales_rep_id)
ON CONFLICT (id) DO NOTHING;

-- ----------------------------------------------------------------------------
-- Step 4: Normalize sales data before adding FK
-- ----------------------------------------------------------------------------

-- Map NULL/empty to walk_in
UPDATE sales
SET sales_rep_id = 'walk_in'
WHERE sales_rep_id IS NULL OR sales_rep_id = '';

-- Map 'Unknown' (ETL) to 'unknown' for consistency
UPDATE sales
SET sales_rep_id = 'unknown'
WHERE sales_rep_id = 'Unknown';

-- Ensure NOT NULL for FK
ALTER TABLE sales
  ALTER COLUMN sales_rep_id SET NOT NULL;

-- ----------------------------------------------------------------------------
-- Step 5: Add foreign key
-- ----------------------------------------------------------------------------

ALTER TABLE sales
  ADD CONSTRAINT sales_sales_rep_id_fkey
  FOREIGN KEY (sales_rep_id) REFERENCES sales_reps(id);

COMMENT ON COLUMN sales.sales_rep_id IS 'References sales_reps.id. Use walk_in for Puerta Abierta, unknown for Unknown/Directo.';

-- ----------------------------------------------------------------------------
-- Step 6: Add ahorro_por_retiro to commission_rates (special)
-- ----------------------------------------------------------------------------
-- When commission would go to a sales rep but payment_date > sales_rep.contract_end_date,
-- redirect to ahorro_por_retiro instead. Rate used is the sales rep's rate.

INSERT INTO public.commission_rates (recipient_id, recipient_name, recipient_type, rate, description, always_paid, active)
SELECT 'ahorro_por_retiro', 'Ahorro por Retiro', 'special', 0, 'Redirects sales rep commission when payment_date > sales_rep.contract_end_date', false, true
WHERE NOT EXISTS (SELECT 1 FROM commission_rates WHERE recipient_id = 'ahorro_por_retiro');

-- ----------------------------------------------------------------------------
-- Step 7: Update calculate_commissions — redirect to ahorro_por_retiro when payment after contract end
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.calculate_commissions(p_payment_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO 'public', 'extensions'
AS $function$
declare
  v_payment record;
  v_sale record;
  v_sales_rep record;
  v_phase int;
  v_phase_percentage numeric;
  v_rate record;
  v_redirect_to_ahorro boolean := false;
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

  -- 2) Sales rep (if present and not walk_in / unknown), or ahorro_por_retiro when payment after contract end
  if v_sale.sales_rep_id is not null
     and v_sale.sales_rep_id <> ''
     and v_sale.sales_rep_id <> 'walk_in'
     and v_sale.sales_rep_id <> 'unknown' then
    select * into v_sales_rep from sales_reps where id = v_sale.sales_rep_id;
    if found and v_sales_rep.contract_end_date is not null
       and v_payment.payment_date > v_sales_rep.contract_end_date then
      v_redirect_to_ahorro := true;
    end if;

    select * into v_rate
    from commission_rates
    where recipient_id = v_sale.sales_rep_id
      and recipient_type = 'sales_rep'
      and active = true;

    if found then
      if v_redirect_to_ahorro then
        insert into commissions
          (payment_id, sale_id, recipient_id, recipient_name, phase, rate, base_amount, commission_amount, paid, status)
        values
          (p_payment_id, v_sale.id, 'ahorro_por_retiro', 'Ahorro por Retiro', v_phase, v_rate.rate,
           v_payment.amount, v_payment.amount * v_rate.rate * v_phase_percentage, false, 'pending');
      else
        insert into commissions
          (payment_id, sale_id, recipient_id, recipient_name, phase, rate, base_amount, commission_amount, paid, status)
        values
          (p_payment_id, v_sale.id, v_rate.recipient_id, v_rate.recipient_name, v_phase, v_rate.rate,
           v_payment.amount, v_payment.amount * v_rate.rate * v_phase_percentage, false, 'pending');
      end if;
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

  -- 4) Special always_paid (e.g., ahorro) — exclude ahorro_por_retiro
  for v_rate in
    select * from commission_rates
    where recipient_type = 'special'
      and always_paid = true
      and active = true
      and recipient_id not in ('referral','walk_in','ahorro_por_retiro')
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
  'Calculates commissions. Reimbursements excluded. Sales rep commission redirects to ahorro_por_retiro when payment_date > contract_end_date.';
