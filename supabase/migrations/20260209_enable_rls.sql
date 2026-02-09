begin;

alter table public.projects enable row level security;
alter table public.units enable row level security;
alter table public.clients enable row level security;
alter table public.payments enable row level security;
alter table public.commissions enable row level security;
alter table public.sales enable row level security;
alter table public.commission_phases enable row level security;
alter table public.commission_rates enable row level security;
alter table public.audit_log enable row level security;

drop policy if exists "authenticated_all" on public.projects;
create policy "authenticated_all" on public.projects
  for all
  to authenticated
  using ((select auth.uid()) is not null)
  with check ((select auth.uid()) is not null);

drop policy if exists "authenticated_all" on public.units;
create policy "authenticated_all" on public.units
  for all
  to authenticated
  using ((select auth.uid()) is not null)
  with check ((select auth.uid()) is not null);

drop policy if exists "authenticated_all" on public.clients;
create policy "authenticated_all" on public.clients
  for all
  to authenticated
  using ((select auth.uid()) is not null)
  with check ((select auth.uid()) is not null);

drop policy if exists "authenticated_all" on public.payments;
create policy "authenticated_all" on public.payments
  for all
  to authenticated
  using ((select auth.uid()) is not null)
  with check ((select auth.uid()) is not null);

drop policy if exists "authenticated_all" on public.commissions;
create policy "authenticated_all" on public.commissions
  for all
  to authenticated
  using ((select auth.uid()) is not null)
  with check ((select auth.uid()) is not null);

drop policy if exists "authenticated_all" on public.sales;
create policy "authenticated_all" on public.sales
  for all
  to authenticated
  using ((select auth.uid()) is not null)
  with check ((select auth.uid()) is not null);

drop policy if exists "authenticated_all" on public.commission_phases;
create policy "authenticated_all" on public.commission_phases
  for all
  to authenticated
  using ((select auth.uid()) is not null)
  with check ((select auth.uid()) is not null);

drop policy if exists "authenticated_all" on public.commission_rates;
create policy "authenticated_all" on public.commission_rates
  for all
  to authenticated
  using ((select auth.uid()) is not null)
  with check ((select auth.uid()) is not null);

drop policy if exists "authenticated_all" on public.audit_log;
create policy "authenticated_all" on public.audit_log
  for all
  to authenticated
  using ((select auth.uid()) is not null)
  with check ((select auth.uid()) is not null);

commit;
