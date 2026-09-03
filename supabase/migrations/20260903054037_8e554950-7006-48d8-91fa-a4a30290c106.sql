create type public.app_role as enum ('admin','user');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  ff_uid text,
  ign text,
  phone text,
  status text not null default 'active' check (status in ('active','banned','suspended')),
  referral_code text unique,
  referred_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create policy "own profile read" on public.profiles for select to authenticated using (auth.uid() = id or public.has_role(auth.uid(),'admin'));
create policy "own profile insert" on public.profiles for insert to authenticated with check (auth.uid() = id);
create policy "own profile update" on public.profiles for update to authenticated using (auth.uid() = id or public.has_role(auth.uid(),'admin')) with check (true);
create policy "roles read" on public.user_roles for select to authenticated using (auth.uid() = user_id or public.has_role(auth.uid(),'admin'));

create table public.wallets (
  user_id uuid primary key references auth.users(id) on delete cascade,
  balance numeric(12,2) not null default 0 check (balance >= 0),
  locked numeric(12,2) not null default 0 check (locked >= 0),
  updated_at timestamptz not null default now()
);
grant select on public.wallets to authenticated;
grant all on public.wallets to service_role;
alter table public.wallets enable row level security;
create policy "own wallet read" on public.wallets for select to authenticated using (auth.uid() = user_id or public.has_role(auth.uid(),'admin'));

create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in ('deposit','entry_fee','prize','referral_reward','withdrawal','refund','admin_adjustment')),
  amount numeric(12,2) not null,
  balance_after numeric(12,2) not null,
  reference_id uuid,
  note text,
  created_at timestamptz not null default now()
);
create index transactions_user_idx on public.transactions(user_id, created_at desc);
grant select on public.transactions to authenticated;
grant all on public.transactions to service_role;
alter table public.transactions enable row level security;
create policy "own tx read" on public.transactions for select to authenticated using (auth.uid() = user_id or public.has_role(auth.uid(),'admin'));

create table public.tournaments (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null default 'BR FULL MAP',
  banner_url text,
  mode text not null default 'Squad' check (mode in ('Solo','Duo','Squad')),
  map text not null default 'Bermuda',
  entry_fee numeric(10,2) not null default 0 check (entry_fee >= 0),
  prize_pool numeric(10,2) not null default 0,
  per_kill numeric(10,2) not null default 0,
  max_players int not null default 48 check (max_players > 0),
  starts_at timestamptz not null,
  status text not null default 'upcoming' check (status in ('upcoming','live','completed','cancelled')),
  rules text[] not null default '{}',
  prize_split jsonb not null default '[]',
  room_id text,
  room_password text,
  room_published boolean not null default false,
  results_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.tournaments to anon, authenticated;
grant insert, update, delete on public.tournaments to authenticated;
grant all on public.tournaments to service_role;
alter table public.tournaments enable row level security;
create policy "tournaments public read" on public.tournaments for select to anon, authenticated using (true);
create policy "admins manage tournaments" on public.tournaments for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

create table public.participants (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.tournaments(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  ff_uid text not null,
  ign text not null,
  paid_amount numeric(10,2) not null default 0,
  kills int not null default 0,
  placement int,
  placement_points int not null default 0,
  bonus_points int not null default 0,
  total_points int not null default 0,
  prize_amount numeric(10,2) not null default 0,
  joined_at timestamptz not null default now(),
  unique (tournament_id, user_id)
);
create index participants_t_idx on public.participants(tournament_id);
grant select on public.participants to anon, authenticated;
grant update, delete on public.participants to authenticated;
grant all on public.participants to service_role;
alter table public.participants enable row level security;
create policy "participants public read" on public.participants for select to anon, authenticated using (true);
create policy "admins manage participants" on public.participants for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

create table public.deposits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  amount numeric(10,2) not null check (amount > 0),
  provider text not null default 'manual_upi',
  provider_ref text unique,
  status text not null default 'pending' check (status in ('pending','completed','failed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.deposits to authenticated;
grant all on public.deposits to service_role;
alter table public.deposits enable row level security;
create policy "own deposits read" on public.deposits for select to authenticated using (auth.uid() = user_id or public.has_role(auth.uid(),'admin'));

create table public.withdrawals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  amount numeric(10,2) not null check (amount > 0),
  upi_id text not null,
  status text not null default 'pending' check (status in ('pending','completed','rejected','failed')),
  admin_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.withdrawals to authenticated;
grant all on public.withdrawals to service_role;
alter table public.withdrawals enable row level security;
create policy "own withdrawals read" on public.withdrawals for select to authenticated using (auth.uid() = user_id or public.has_role(auth.uid(),'admin'));

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  title text not null,
  body text not null,
  kind text not null default 'info',
  read boolean not null default false,
  created_at timestamptz not null default now()
);
create index notifications_user_idx on public.notifications(user_id, created_at desc);
grant select, update on public.notifications to authenticated;
grant all on public.notifications to service_role;
alter table public.notifications enable row level security;
create policy "own notifications read" on public.notifications for select to authenticated using (user_id is null or auth.uid() = user_id);
create policy "own notifications update" on public.notifications for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid,
  action text not null,
  target text,
  meta jsonb not null default '{}',
  created_at timestamptz not null default now()
);
grant select on public.audit_logs to authenticated;
grant all on public.audit_logs to service_role;
alter table public.audit_logs enable row level security;
create policy "admins read audit" on public.audit_logs for select to authenticated using (public.has_role(auth.uid(),'admin'));

create table public.settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);
grant select on public.settings to anon, authenticated;
grant all on public.settings to service_role;
alter table public.settings enable row level security;
create policy "settings public read" on public.settings for select to anon, authenticated using (true);
create policy "admins write settings" on public.settings for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
insert into public.settings(key, value) values
  ('payments', '{"enabled": true, "min_withdrawal": 100, "max_withdrawal": 10000, "upi_payee": "firezone@upi"}'::jsonb);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles(id, ff_uid, ign, phone, referral_code)
  values (
    new.id,
    new.raw_user_meta_data->>'ff_uid',
    coalesce(new.raw_user_meta_data->>'ign', split_part(new.email,'@',1)),
    new.raw_user_meta_data->>'phone',
    upper(substr(replace(new.id::text,'-',''),1,8))
  ) on conflict (id) do nothing;
  insert into public.wallets(user_id) values (new.id) on conflict (user_id) do nothing;
  insert into public.user_roles(user_id, role) values (new.id, 'user') on conflict do nothing;
  return new;
end; $$;

create trigger on_auth_user_created after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.wallet_apply(_user_id uuid, _type text, _amount numeric, _ref uuid, _note text)
returns numeric language plpgsql security definer set search_path = public as $$
declare _bal numeric;
begin
  update public.wallets set balance = balance + _amount, updated_at = now()
  where user_id = _user_id returning balance into _bal;
  if _bal is null then raise exception 'Wallet not found'; end if;
  insert into public.transactions(user_id, type, amount, balance_after, reference_id, note)
  values (_user_id, _type, _amount, _bal, _ref, _note);
  return _bal;
end; $$;
revoke all on function public.wallet_apply(uuid,text,numeric,uuid,text) from public, anon, authenticated;

create or replace function public.join_tournament(_tournament_id uuid)
returns public.participants language plpgsql security definer set search_path = public as $$
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
  if t.entry_fee > 0 then
    if (select balance from public.wallets where user_id = auth.uid()) < t.entry_fee then
      raise exception 'Insufficient wallet balance';
    end if;
    perform public.wallet_apply(auth.uid(), 'entry_fee', -t.entry_fee, t.id, 'Entry fee: ' || t.name);
  end if;
  insert into public.participants(tournament_id, user_id, ff_uid, ign, paid_amount)
  values (t.id, auth.uid(), p.ff_uid, p.ign, t.entry_fee) returning * into row;
  insert into public.notifications(user_id, title, body, kind)
  values (auth.uid(), 'Tournament joined', 'You joined ' || t.name || '. Room details will be published before the match.', 'joined');
  return row;
end; $$;
grant execute on function public.join_tournament(uuid) to authenticated;

create or replace function public.request_withdrawal(_amount numeric, _upi text)
returns public.withdrawals language plpgsql security definer set search_path = public as $$
declare w public.withdrawals; s jsonb; bal numeric; st text;
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;
  select value into s from public.settings where key = 'payments';
  if not coalesce((s->>'enabled')::boolean, false) then raise exception 'Payouts are disabled in your region'; end if;
  select status into st from public.profiles where id = auth.uid();
  if st <> 'active' then raise exception 'Account is % - payouts blocked', st; end if;
  if _amount < (s->>'min_withdrawal')::numeric then raise exception 'Minimum withdrawal is %', s->>'min_withdrawal'; end if;
  if _amount > (s->>'max_withdrawal')::numeric then raise exception 'Maximum withdrawal is %', s->>'max_withdrawal'; end if;
  if coalesce(_upi,'') !~ '^[a-zA-Z0-9._-]{2,}@[a-zA-Z]{2,}$' then raise exception 'Enter a valid UPI ID'; end if;
  if exists (select 1 from public.withdrawals where user_id = auth.uid() and status = 'pending') then
    raise exception 'You already have a pending withdrawal';
  end if;
  select balance into bal from public.wallets where user_id = auth.uid();
  if bal < _amount then raise exception 'Insufficient balance'; end if;
  insert into public.withdrawals(user_id, amount, upi_id) values (auth.uid(), _amount, _upi) returning * into w;
  perform public.wallet_apply(auth.uid(), 'withdrawal', -_amount, w.id, 'Withdrawal request to ' || _upi);
  return w;
end; $$;
grant execute on function public.request_withdrawal(numeric, text) to authenticated;

create or replace function public.admin_settle_withdrawal(_id uuid, _decision text, _note text default null)
returns public.withdrawals language plpgsql security definer set search_path = public as $$
declare w public.withdrawals;
begin
  if not public.has_role(auth.uid(),'admin') then raise exception 'Forbidden'; end if;
  select * into w from public.withdrawals where id = _id for update;
  if w.id is null then raise exception 'Withdrawal not found'; end if;
  if w.status <> 'pending' then raise exception 'Already settled'; end if;
  if _decision = 'completed' then
    update public.withdrawals set status='completed', admin_note=_note, updated_at=now() where id=_id returning * into w;
    insert into public.notifications(user_id,title,body,kind) values (w.user_id,'Withdrawal approved','Rs '||w.amount||' sent to '||w.upi_id,'withdrawal');
  elsif _decision in ('rejected','failed') then
    perform public.wallet_apply(w.user_id, 'refund', w.amount, w.id, 'Withdrawal ' || _decision);
    update public.withdrawals set status=_decision, admin_note=_note, updated_at=now() where id=_id returning * into w;
    insert into public.notifications(user_id,title,body,kind) values (w.user_id,'Withdrawal '||_decision,'Rs '||w.amount||' refunded to your wallet','withdrawal');
  else raise exception 'Invalid decision'; end if;
  insert into public.audit_logs(actor_id,action,target,meta) values (auth.uid(),'withdrawal_'||_decision,_id::text, jsonb_build_object('amount',w.amount));
  return w;
end; $$;
grant execute on function public.admin_settle_withdrawal(uuid, text, text) to authenticated;

create or replace function public.admin_publish_room(_tournament_id uuid, _room_id text, _room_password text)
returns public.tournaments language plpgsql security definer set search_path = public as $$
declare t public.tournaments;
begin
  if not public.has_role(auth.uid(),'admin') then raise exception 'Forbidden'; end if;
  if coalesce(_room_id,'') = '' or coalesce(_room_password,'') = '' then raise exception 'Room ID and password required'; end if;
  update public.tournaments set room_id=_room_id, room_password=_room_password, room_published=true, status='live', updated_at=now()
  where id=_tournament_id returning * into t;
  if t.id is null then raise exception 'Tournament not found'; end if;
  insert into public.notifications(user_id,title,body,kind)
  select user_id, 'Room ID released', 'Room details for ' || t.name || ' are now available.', 'room'
  from public.participants where tournament_id = t.id;
  insert into public.audit_logs(actor_id,action,target) values (auth.uid(),'publish_room',t.id::text);
  return t;
end; $$;
grant execute on function public.admin_publish_room(uuid, text, text) to authenticated;

create or replace function public.get_room_details(_tournament_id uuid)
returns table(room_id text, room_password text) language plpgsql security definer set search_path = public as $$
begin
  return query
  select t.room_id, t.room_password from public.tournaments t
  where t.id = _tournament_id and t.room_published
    and (public.has_role(auth.uid(),'admin')
      or exists (select 1 from public.participants p where p.tournament_id = t.id and p.user_id = auth.uid()));
end; $$;
grant execute on function public.get_room_details(uuid) to authenticated;

create or replace function public.admin_publish_results(_tournament_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare t public.tournaments; r record;
begin
  if not public.has_role(auth.uid(),'admin') then raise exception 'Forbidden'; end if;
  select * into t from public.tournaments where id=_tournament_id for update;
  if t.id is null then raise exception 'Tournament not found'; end if;
  if t.results_published then raise exception 'Results already published'; end if;
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
end; $$;
grant execute on function public.admin_publish_results(uuid) to authenticated;

create or replace function public.admin_settle_deposit(_id uuid, _decision text)
returns public.deposits language plpgsql security definer set search_path = public as $$
declare d public.deposits;
begin
  if not public.has_role(auth.uid(),'admin') then raise exception 'Forbidden'; end if;
  select * into d from public.deposits where id=_id for update;
  if d.id is null then raise exception 'Deposit not found'; end if;
  if d.status <> 'pending' then raise exception 'Already settled'; end if;
  if _decision = 'completed' then
    perform public.wallet_apply(d.user_id, 'deposit', d.amount, d.id, 'Deposit approved');
    insert into public.notifications(user_id,title,body,kind) values (d.user_id,'Money added','Rs '||d.amount||' added to your wallet','wallet');
  elsif _decision <> 'failed' then raise exception 'Invalid decision'; end if;
  update public.deposits set status=_decision, updated_at=now() where id=_id returning * into d;
  insert into public.audit_logs(actor_id,action,target,meta) values (auth.uid(),'deposit_'||_decision,_id::text, jsonb_build_object('amount',d.amount));
  return d;
end; $$;
grant execute on function public.admin_settle_deposit(uuid, text) to authenticated;

create or replace function public.create_deposit(_amount numeric, _provider_ref text)
returns public.deposits language plpgsql security definer set search_path = public as $$
declare d public.deposits;
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;
  if _amount < 10 or _amount > 10000 then raise exception 'Amount must be between 10 and 10000'; end if;
  if coalesce(_provider_ref,'') = '' then raise exception 'Payment reference required'; end if;
  if exists (select 1 from public.deposits where provider_ref = _provider_ref) then raise exception 'This payment reference was already submitted'; end if;
  insert into public.deposits(user_id, amount, provider_ref) values (auth.uid(), _amount, _provider_ref) returning * into d;
  return d;
end; $$;
grant execute on function public.create_deposit(numeric, text) to authenticated;