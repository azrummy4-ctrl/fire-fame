-- Avoid RLS recursion (tournaments <-> participants): use a SECURITY DEFINER helper.
create or replace function public.is_tournament_participant(_tournament_id uuid, _user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.participants p
    where p.tournament_id = _tournament_id
      and p.user_id = _user_id
  )
$$;

revoke all on function public.is_tournament_participant(uuid, uuid) from anon;
grant execute on function public.is_tournament_participant(uuid, uuid) to authenticated;

drop policy if exists "tournaments read visible or joined" on public.tournaments;

create policy "tournaments read visible or joined"
on public.tournaments
for select
to authenticated
using (
  status <> 'completed'
  or starts_at > now() - interval '24 hours'
  or public.is_tournament_participant(tournaments.id, auth.uid())
);