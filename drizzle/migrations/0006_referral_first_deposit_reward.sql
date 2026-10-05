create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare _ref uuid;
begin
  select id into _ref from public.profiles
   where referral_code = upper(trim(coalesce(new.raw_user_meta_data->>'ref_code','')))
     and id <> new.id limit 1;
  insert into public.profiles(id, ff_uid, ign, phone, referral_code, referred_by)
  values (
    new.id,
    new.raw_user_meta_data->>'ff_uid',
    coalesce(new.raw_user_meta_data->>'ign', split_part(new.email,'@',1)),
    new.raw_user_meta_data->>'phone',
    upper(substr(replace(new.id::text,'-',''),1,8)),
    _ref
  ) on conflict (id) do nothing;
  insert into public.wallets(user_id) values (new.id) on conflict (user_id) do nothing;
  insert into public.user_roles(user_id, role) values (new.id, 'user') on conflict do nothing;
  return new;
end; $$;

-- Users cannot change who referred them after signup
create or replace function public.lock_referred_by()
returns trigger language plpgsql set search_path = public as $$
begin
  new.referred_by := old.referred_by;
  return new;
end; $$;
drop trigger if exists profiles_lock_referred_by on public.profiles;
create trigger profiles_lock_referred_by before update on public.profiles
for each row execute function public.lock_referred_by();

-- Reward referrer once, on the referred user's first completed deposit
create or replace function public.reward_referrer_on_first_deposit()
returns trigger language plpgsql security definer set search_path = public as $$
declare _referrer uuid;
begin
  if new.status <> 'completed' or old.status = 'completed' then return new; end if;
  if exists (select 1 from public.deposits where user_id = new.user_id and status = 'completed' and id <> new.id) then
    return new;
  end if;
  select referred_by into _referrer from public.profiles where id = new.user_id;
  if _referrer is null or _referrer = new.user_id then return new; end if;
  if exists (select 1 from public.transactions where user_id = _referrer and type = 'referral_reward' and reference_id = new.user_id) then
    return new;
  end if;
  perform public.wallet_apply(_referrer, 'referral_reward', 1, new.user_id, 'Referral: friend ka pehla deposit');
  return new;
end; $$;
revoke all on function public.reward_referrer_on_first_deposit() from public, anon, authenticated;
drop trigger if exists deposits_referral_reward on public.deposits;
create trigger deposits_referral_reward after update of status on public.deposits
for each row execute function public.reward_referrer_on_first_deposit();