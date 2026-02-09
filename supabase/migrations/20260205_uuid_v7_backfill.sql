-- Backfill existing UUIDs to UUIDv7
-- WARNING: Run during maintenance window and take a backup first.
-- Uses pgcrypto for randomness.

begin;

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

-- Disable FK checks + audit triggers for the session
set local session_replication_role = replica;

-- Build mapping tables
create temporary table _map_projects (old_id uuid primary key, new_id uuid not null);
insert into _map_projects (old_id, new_id)
select id, uuid_v7() from projects;

create temporary table _map_units (old_id uuid primary key, new_id uuid not null);
insert into _map_units (old_id, new_id)
select id, uuid_v7() from units;

create temporary table _map_clients (old_id uuid primary key, new_id uuid not null);
insert into _map_clients (old_id, new_id)
select id, uuid_v7() from clients;

create temporary table _map_sales (old_id uuid primary key, new_id uuid not null);
insert into _map_sales (old_id, new_id)
select id, uuid_v7() from sales;

create temporary table _map_payments (old_id uuid primary key, new_id uuid not null);
insert into _map_payments (old_id, new_id)
select id, uuid_v7() from payments;

create temporary table _map_commissions (old_id uuid primary key, new_id uuid not null);
insert into _map_commissions (old_id, new_id)
select id, uuid_v7() from commissions;

create temporary table _map_commission_rates (old_id uuid primary key, new_id uuid not null);
insert into _map_commission_rates (old_id, new_id)
select id, uuid_v7() from commission_rates;

create temporary table _map_audit_log (old_id uuid primary key, new_id uuid not null);
insert into _map_audit_log (old_id, new_id)
select id, uuid_v7() from audit_log;

-- Update foreign keys
update units u
set project_id = m.new_id
from _map_projects m
where u.project_id = m.old_id;

update sales s
set project_id = mp.new_id
from _map_projects mp
where s.project_id = mp.old_id;

update sales s
set unit_id = mu.new_id
from _map_units mu
where s.unit_id = mu.old_id;

update sales s
set client_id = mc.new_id
from _map_clients mc
where s.client_id = mc.old_id;

update payments p
set sale_id = ms.new_id
from _map_sales ms
where p.sale_id = ms.old_id;

update commissions c
set sale_id = ms.new_id
from _map_sales ms
where c.sale_id = ms.old_id;

update commissions c
set payment_id = mp.new_id
from _map_payments mp
where c.payment_id = mp.old_id;

-- Update audit_log.record_id by table
update audit_log a
set record_id = m.new_id
from _map_projects m
where a.table_name = 'projects' and a.record_id = m.old_id;

update audit_log a
set record_id = m.new_id
from _map_units m
where a.table_name = 'units' and a.record_id = m.old_id;

update audit_log a
set record_id = m.new_id
from _map_clients m
where a.table_name = 'clients' and a.record_id = m.old_id;

update audit_log a
set record_id = m.new_id
from _map_sales m
where a.table_name = 'sales' and a.record_id = m.old_id;

update audit_log a
set record_id = m.new_id
from _map_payments m
where a.table_name = 'payments' and a.record_id = m.old_id;

update audit_log a
set record_id = m.new_id
from _map_commissions m
where a.table_name = 'commissions' and a.record_id = m.old_id;

update audit_log a
set record_id = m.new_id
from _map_commission_rates m
where a.table_name = 'commission_rates' and a.record_id = m.old_id;

-- Update primary keys
update projects p set id = m.new_id from _map_projects m where p.id = m.old_id;
update units u set id = m.new_id from _map_units m where u.id = m.old_id;
update clients c set id = m.new_id from _map_clients m where c.id = m.old_id;
update sales s set id = m.new_id from _map_sales m where s.id = m.old_id;
update payments p set id = m.new_id from _map_payments m where p.id = m.old_id;
update commissions c set id = m.new_id from _map_commissions m where c.id = m.old_id;
update commission_rates c set id = m.new_id from _map_commission_rates m where c.id = m.old_id;
update audit_log a set id = m.new_id from _map_audit_log m where a.id = m.old_id;

commit;
