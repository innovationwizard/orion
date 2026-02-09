-- Enforce UUID v7 for all primary IDs
-- Uses pgcrypto (available in Supabase) for randomness

create extension if not exists "pgcrypto";

-- UUID v7 generator (timestamp + randomness)
create or replace function uuid_v7()
returns uuid as $$
declare
  ts_ms bigint;
  ts_bytes bytea;
  rnd bytea;
  bytes bytea;
begin
  ts_ms := floor(extract(epoch from clock_timestamp()) * 1000)::bigint;
  ts_bytes := decode(lpad(to_hex(ts_ms), 12, '0'), 'hex'); -- 6 bytes
  rnd := gen_random_bytes(10); -- 10 bytes
  bytes := ts_bytes || rnd; -- 16 bytes

  -- Set version to 7 (byte 6 high nibble)
  bytes := set_byte(bytes, 6, (get_byte(bytes, 6) & 15) | 112);
  -- Set variant to 10 (byte 8 high bits)
  bytes := set_byte(bytes, 8, (get_byte(bytes, 8) & 63) | 128);

  return encode(bytes, 'hex')::uuid;
end;
$$ language plpgsql;

-- Update defaults to UUID v7
alter table projects alter column id set default uuid_v7();
alter table units alter column id set default uuid_v7();
alter table clients alter column id set default uuid_v7();
alter table sales alter column id set default uuid_v7();
alter table payments alter column id set default uuid_v7();
alter table commissions alter column id set default uuid_v7();
alter table commission_rates alter column id set default uuid_v7();
alter table audit_log alter column id set default uuid_v7();

-- Trigger to enforce v7 on inserts without changing existing rows
create or replace function enforce_uuid_v7()
returns trigger as $$
declare
  v bytea;
  version int;
begin
  if new.id is null then
    return new;
  end if;

  v := uuid_send(new.id);
  version := (get_byte(v, 6) >> 4);

  if version != 7 then
    raise exception 'UUID v7 required for %', tg_table_name;
  end if;

  return new;
end;
$$ language plpgsql;

drop trigger if exists enforce_uuid_v7_projects on projects;
create trigger enforce_uuid_v7_projects
before insert on projects
for each row execute function enforce_uuid_v7();

drop trigger if exists enforce_uuid_v7_units on units;
create trigger enforce_uuid_v7_units
before insert on units
for each row execute function enforce_uuid_v7();

drop trigger if exists enforce_uuid_v7_clients on clients;
create trigger enforce_uuid_v7_clients
before insert on clients
for each row execute function enforce_uuid_v7();

drop trigger if exists enforce_uuid_v7_sales on sales;
create trigger enforce_uuid_v7_sales
before insert on sales
for each row execute function enforce_uuid_v7();

drop trigger if exists enforce_uuid_v7_payments on payments;
create trigger enforce_uuid_v7_payments
before insert on payments
for each row execute function enforce_uuid_v7();

drop trigger if exists enforce_uuid_v7_commissions on commissions;
create trigger enforce_uuid_v7_commissions
before insert on commissions
for each row execute function enforce_uuid_v7();

drop trigger if exists enforce_uuid_v7_commission_rates on commission_rates;
create trigger enforce_uuid_v7_commission_rates
before insert on commission_rates
for each row execute function enforce_uuid_v7();

drop trigger if exists enforce_uuid_v7_audit_log on audit_log;
create trigger enforce_uuid_v7_audit_log
before insert on audit_log
for each row execute function enforce_uuid_v7();
