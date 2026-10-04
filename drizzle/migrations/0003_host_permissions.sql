ALTER TABLE public.tournaments ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id);

CREATE OR REPLACE FUNCTION public.can_manage_tournament(_tid uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  select public.has_role(auth.uid(),'admin')
    or (public.has_role(auth.uid(),'host') and exists (select 1 from public.tournaments where id=_tid and created_by=auth.uid()))
$$;

CREATE POLICY "hosts insert tournaments" ON public.tournaments FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(),'host') AND created_by = auth.uid());
CREATE POLICY "hosts update own tournaments" ON public.tournaments FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'host') AND created_by = auth.uid())
  WITH CHECK (public.has_role(auth.uid(),'host') AND created_by = auth.uid());
CREATE POLICY "hosts update own participants" ON public.participants FOR UPDATE TO authenticated
  USING (public.can_manage_tournament(tournament_id)) WITH CHECK (public.can_manage_tournament(tournament_id));

CREATE OR REPLACE FUNCTION public.admin_set_host(_user_id uuid, _enable boolean)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
begin
  if not public.has_role(auth.uid(),'admin') then raise exception 'Forbidden'; end if;
  if _enable then
    insert into public.user_roles(user_id, role) values (_user_id,'host') on conflict do nothing;
  else
    delete from public.user_roles where user_id=_user_id and role='host';
  end if;
  insert into public.audit_logs(actor_id,action,target) values (auth.uid(), case when _enable then 'grant_host' else 'revoke_host' end, _user_id::text);
end; $$;

CREATE OR REPLACE FUNCTION public.admin_publish_room(_tournament_id uuid, _room_id text, _room_password text)
 RETURNS tournaments LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $function$
declare t public.tournaments;
begin
  if not public.can_manage_tournament(_tournament_id) then raise exception 'Forbidden'; end if;
  if coalesce(_room_id,'') = '' or coalesce(_room_password,'') = '' then raise exception 'Room ID and password required'; end if;
  update public.tournaments set room_id=_room_id, room_password=_room_password, room_published=true, status='live', updated_at=now()
  where id=_tournament_id returning * into t;
  if t.id is null then raise exception 'Tournament not found'; end if;
  insert into public.notifications(user_id,title,body,kind)
  select user_id, 'Room ID released', 'Room details for ' || t.name || ' are now available.', 'room'
  from public.participants where tournament_id = t.id;
  insert into public.audit_logs(actor_id,action,target) values (auth.uid(),'publish_room',t.id::text);
  return t;
end; $function$;

CREATE OR REPLACE FUNCTION public.admin_publish_results(_tournament_id uuid)
 RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $function$
declare t public.tournaments; r record; total numeric;
begin
  if not public.can_manage_tournament(_tournament_id) then raise exception 'Forbidden'; end if;
  select * into t from public.tournaments where id=_tournament_id for update;
  if t.id is null then raise exception 'Tournament not found'; end if;
  if t.results_published then raise exception 'Results already published'; end if;
  if not public.has_role(auth.uid(),'admin') then
    select coalesce(sum(prize_amount),0) into total from public.participants where tournament_id=t.id;
    if total > t.prize_pool + (t.per_kill * (select coalesce(sum(kills),0) from public.participants where tournament_id=t.id)) then
      raise exception 'Total prize exceeds prize pool + kill rewards';
    end if;
  end if;
  update public.participants set total_points = kills + placement_points + bonus_points where tournament_id = t.id;
  for r in select * from public.participants where tournament_id = t.id and prize_amount > 0 loop
    perform public.wallet_apply(r.user_id, 'prize', r.prize_amount, t.id, 'Prize: ' || t.name);
    insert into public.notifications(user_id,title,body,kind)
    values (r.user_id,'Prize credited','Rs '||r.prize_amount||' credited for '||t.name,'prize');
  end loop;
  update public.tournaments set results_published = true, status='completed', updated_at=now() where id=t.id;
  insert into public.notifications(user_id,title,body,kind)
  select user_id,'Result published','Results for '||t.name||' are live. Check the leaderboard.','result'
  from public.participants where tournament_id=t.id;
  insert into public.audit_logs(actor_id,action,target) values (auth.uid(),'publish_results',t.id::text);
end; $function$;