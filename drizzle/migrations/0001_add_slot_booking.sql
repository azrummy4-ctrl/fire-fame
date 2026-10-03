ALTER TABLE public.participants ADD COLUMN IF NOT EXISTS slot_number integer;

CREATE UNIQUE INDEX IF NOT EXISTS participants_tournament_slot_unique
  ON public.participants (tournament_id, slot_number)
  WHERE slot_number IS NOT NULL;

CREATE OR REPLACE FUNCTION public.join_tournament(_tournament_id uuid, _slot integer DEFAULT NULL)
 RETURNS participants
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare t public.tournaments; p public.profiles; cnt int; row public.participants;
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;
  select * into p from public.profiles where id = auth.uid();
  if p.status <> 'active' then raise exception 'Account is % - cannot join', p.status; end if;
  if coalesce(p.ff_uid,'') = '' or coalesce(p.ign,'') = '' then
    raise exception 'Add your Free Fire UID and in-game name in Profile first';
  end if;
  select * into t from public.tournaments where id = _tournament_id for update;
  if t.id is null then raise exception 'Tournament not found'; end if;
  if t.status <> 'upcoming' then raise exception 'Registration closed'; end if;
  if exists (select 1 from public.participants where tournament_id = t.id and user_id = auth.uid()) then
    raise exception 'You already joined this tournament';
  end if;
  select count(*) into cnt from public.participants where tournament_id = t.id;
  if cnt >= t.max_players then raise exception 'Tournament is full'; end if;
  if _slot is not null then
    if _slot < 1 or _slot > t.max_players then raise exception 'Invalid slot number'; end if;
    if exists (select 1 from public.participants where tournament_id = t.id and slot_number = _slot) then
      raise exception 'Slot % is already booked', _slot;
    end if;
  end if;
  if t.entry_fee > 0 then
    if (select balance from public.wallets where user_id = auth.uid()) < t.entry_fee then
      raise exception 'Insufficient wallet balance';
    end if;
    perform public.wallet_apply(auth.uid(), 'entry_fee', -t.entry_fee, t.id, 'Entry fee: ' || t.name);
  end if;
  insert into public.participants(tournament_id, user_id, ff_uid, ign, paid_amount, slot_number)
  values (t.id, auth.uid(), p.ff_uid, p.ign, t.entry_fee, _slot) returning * into row;
  insert into public.notifications(user_id, title, body, kind)
  values (auth.uid(), 'Tournament joined', 'You joined ' || t.name || '. Room details will be published before the match.', 'joined');
  return row;
end; $function$