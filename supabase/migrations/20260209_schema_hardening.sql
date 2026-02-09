begin;

create schema if not exists history;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'payment_method') then
    create type payment_method as enum ('cash', 'bank_transfer', 'card', 'check', 'deposit');
  end if;
  if not exists (select 1 from pg_type where typname = 'commission_status') then
    create type commission_status as enum ('pending', 'paid', 'void');
  end if;
  if not exists (select 1 from pg_type where typname = 'user_role') then
    create type user_role as enum ('master', 'gerencia', 'financiero', 'contabilidad', 'ventas', 'inventario');
  end if;
end $$;

create table if not exists history.row_history (
  id uuid primary key default uuid_v7(),
  table_name text not null,
  record_id uuid not null,
  action text not null,
  old_data jsonb,
  new_data jsonb,
  changed_by text,
  changed_at timestamp with time zone not null default now()
);

create or replace function history.log_row_history()
returns trigger as $$
declare
  actor text;
begin
  actor := coalesce(
    auth.uid()::text,
    current_setting('request.jwt.claim.sub', true),
    current_setting('request.jwt.claim.email', true),
    current_user
  );

  insert into history.row_history (table_name, record_id, action, old_data, new_data, changed_by)
  values (
    tg_table_name,
    old.id,
    tg_op,
    to_jsonb(old),
    case when tg_op = 'UPDATE' then to_jsonb(new) else null end,
    actor
  );

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$ language plpgsql security definer;

create or replace function bump_row_version()
returns trigger as $$
begin
  new.row_version := old.row_version + 1;
  return new;
end;
$$ language plpgsql;

create or replace function sync_commission_status()
returns trigger as $$
begin
  if new.status is null then
    new.status := case when coalesce(new.paid, false) then 'paid' else 'pending' end;
  end if;

  if new.status = 'paid' then
    new.paid := true;
  else
    new.paid := false;
  end if;

  return new;
end;
$$ language plpgsql;

create or replace function enforce_commission_phase_total()
returns trigger as $$
declare
  total numeric(19, 4);
begin
  select coalesce(sum(percentage), 0) into total
  from commission_phases
  where phase in (1, 2, 3);

  if total <> 1.0000 then
    raise exception 'commission_phases percentages must sum to 1.0000 for phases 1-3 (current: %)', total;
  end if;

  return null;
end;
$$ language plpgsql;

alter table payments
  alter column amount type numeric(19, 4) using amount::numeric(19, 4),
  alter column payment_method type payment_method using payment_method::payment_method;

alter table commission_phases
  alter column percentage type numeric(19, 4) using percentage::numeric(19, 4);

alter table commission_rates
  alter column rate type numeric(19, 4) using rate::numeric(19, 4);

alter table commissions
  alter column rate type numeric(19, 4) using rate::numeric(19, 4),
  alter column base_amount type numeric(19, 4) using base_amount::numeric(19, 4),
  alter column commission_amount type numeric(19, 4) using commission_amount::numeric(19, 4);

alter table sales
  alter column price_with_tax type numeric(19, 4) using price_with_tax::numeric(19, 4),
  alter column price_without_tax type numeric(19, 4) using price_without_tax::numeric(19, 4),
  alter column down_payment_amount type numeric(19, 4) using down_payment_amount::numeric(19, 4),
  alter column financed_amount type numeric(19, 4) using financed_amount::numeric(19, 4);

alter table units
  alter column price_with_tax type numeric(19, 4) using price_with_tax::numeric(19, 4),
  alter column price_without_tax type numeric(19, 4) using price_without_tax::numeric(19, 4),
  alter column down_payment_amount type numeric(19, 4) using down_payment_amount::numeric(19, 4);

alter table commissions
  add column if not exists status commission_status not null default 'pending';

alter table projects add column if not exists row_version integer not null default 1;
alter table units add column if not exists row_version integer not null default 1;
alter table clients add column if not exists row_version integer not null default 1;
alter table sales add column if not exists row_version integer not null default 1;
alter table payments add column if not exists row_version integer not null default 1;
alter table commissions add column if not exists row_version integer not null default 1;
alter table commission_rates add column if not exists row_version integer not null default 1;
alter table commission_phases add column if not exists row_version integer not null default 1;
alter table audit_log add column if not exists row_version integer not null default 1;

alter table commission_rates
  add constraint commission_rates_rate_cap check (rate >= 0 and rate <= 0.0500);

alter table commissions
  add constraint commissions_rate_cap check (rate >= 0 and rate <= 0.0500);

alter table commission_phases
  add constraint commission_phases_percentage_range check (percentage >= 0 and percentage <= 1.0000);

alter table sales
  add constraint sales_payment_balance check (down_payment_amount + financed_amount = price_with_tax);

drop trigger if exists commission_phases_total_enforce on commission_phases;
create constraint trigger commission_phases_total_enforce
after insert or update or delete on commission_phases
deferrable initially deferred
for each row execute function enforce_commission_phase_total();

drop trigger if exists commissions_sync_status on commissions;
create trigger commissions_sync_status
before insert or update on commissions
for each row execute function sync_commission_status();

drop trigger if exists projects_row_version on projects;
create trigger projects_row_version
before update on projects
for each row execute function bump_row_version();

drop trigger if exists units_row_version on units;
create trigger units_row_version
before update on units
for each row execute function bump_row_version();

drop trigger if exists clients_row_version on clients;
create trigger clients_row_version
before update on clients
for each row execute function bump_row_version();

drop trigger if exists sales_row_version on sales;
create trigger sales_row_version
before update on sales
for each row execute function bump_row_version();

drop trigger if exists payments_row_version on payments;
create trigger payments_row_version
before update on payments
for each row execute function bump_row_version();

drop trigger if exists commissions_row_version on commissions;
create trigger commissions_row_version
before update on commissions
for each row execute function bump_row_version();

drop trigger if exists commission_rates_row_version on commission_rates;
create trigger commission_rates_row_version
before update on commission_rates
for each row execute function bump_row_version();

drop trigger if exists commission_phases_row_version on commission_phases;
create trigger commission_phases_row_version
before update on commission_phases
for each row execute function bump_row_version();

drop trigger if exists audit_log_row_version on audit_log;
create trigger audit_log_row_version
before update on audit_log
for each row execute function bump_row_version();

drop trigger if exists projects_history on projects;
create trigger projects_history
before update or delete on projects
for each row execute function history.log_row_history();

drop trigger if exists units_history on units;
create trigger units_history
before update or delete on units
for each row execute function history.log_row_history();

drop trigger if exists clients_history on clients;
create trigger clients_history
before update or delete on clients
for each row execute function history.log_row_history();

drop trigger if exists sales_history on sales;
create trigger sales_history
before update or delete on sales
for each row execute function history.log_row_history();

drop trigger if exists payments_history on payments;
create trigger payments_history
before update or delete on payments
for each row execute function history.log_row_history();

drop trigger if exists commissions_history on commissions;
create trigger commissions_history
before update or delete on commissions
for each row execute function history.log_row_history();

drop trigger if exists commission_rates_history on commission_rates;
create trigger commission_rates_history
before update or delete on commission_rates
for each row execute function history.log_row_history();

commit;
