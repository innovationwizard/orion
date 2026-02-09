begin;

do $$
declare
  func record;
  target_search_path text;
begin
  for func in
    select
      n.nspname as schema_name,
      p.proname as function_name,
      pg_get_function_identity_arguments(p.oid) as args
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where (n.nspname = 'public' and p.proname in (
      'uuid_v7',
      'enforce_uuid_v7',
      'audit_trigger_func',
      'bump_row_version',
      'sync_commission_status',
      'enforce_commission_phase_total',
      'calculate_commissions',
      'trigger_calculate_commissions'
    ))
    or (n.nspname = 'history' and p.proname = 'log_row_history')
  loop
    if func.schema_name = 'history' then
      target_search_path := 'history, public, extensions';
    else
      target_search_path := 'public, extensions';
    end if;

    execute format(
      'alter function %I.%I(%s) set search_path = %s',
      func.schema_name,
      func.function_name,
      func.args,
      target_search_path
    );
  end loop;
end $$;

commit;
