-- Tournaments read: real predicate (no anon, old completed >24h hidden except rows the user joined).
drop policy if exists "tournaments public read" on public.tournaments;

create policy "tournaments read visible or joined"
on public.tournaments
for select
to authenticated
using (
  status <> 'completed'
  or starts_at > now() - interval '24 hours'
  or exists (
    select 1 from public.participants p
    where p.tournament_id = tournaments.id
      and p.user_id = auth.uid()
  )
);