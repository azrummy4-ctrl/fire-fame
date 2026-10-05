-- Track withdrawable winnings separately from deposited cash
ALTER TABLE public.wallets ADD COLUMN winnings numeric NOT NULL DEFAULT 0;

-- Backfill: winnings = total prize credits minus withdrawals already made
UPDATE public.wallets w SET winnings = GREATEST(0, COALESCE((
  SELECT SUM(CASE WHEN t.type = 'prize' THEN t.amount WHEN t.type = 'withdrawal' THEN t.amount ELSE 0 END)
  FROM public.transactions t WHERE t.user_id = w.user_id
), 0));

-- Keep winnings in sync with every wallet transaction
CREATE OR REPLACE FUNCTION public.track_winnings() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
begin
  if NEW.type = 'prize' then
    update public.wallets set winnings = winnings + NEW.amount, updated_at = now() where user_id = NEW.user_id;
  elsif NEW.type = 'withdrawal' then
    update public.wallets set winnings = GREATEST(0, winnings + NEW.amount), updated_at = now() where user_id = NEW.user_id;
  end if;
  return NEW;
end;
$$;
REVOKE ALL ON FUNCTION public.track_winnings() FROM public, anon, authenticated;

CREATE TRIGGER transactions_track_winnings
AFTER INSERT ON public.transactions
FOR EACH ROW EXECUTE FUNCTION public.track_winnings();

-- Withdrawals can only come from winnings, never from deposited cash
CREATE OR REPLACE FUNCTION public.request_redeem(_amount numeric, _method text, _upi text DEFAULT NULL::text)
RETURNS withdrawals
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
declare w public.withdrawals; s jsonb; bal numeric; win numeric; st text; dest text;
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;
  if _amount not in (30,50,100,150,200,500) then raise exception 'Invalid voucher amount'; end if;
  if _method not in ('upi','google_play') then raise exception 'Invalid method'; end if;
  select value into s from public.settings where key = 'payments';
  if not coalesce((s->>'enabled')::boolean, false) then raise exception 'Payouts are disabled in your region'; end if;
  select status into st from public.profiles where id = auth.uid();
  if st <> 'active' then raise exception 'Account is % - payouts blocked', st; end if;
  if _amount < coalesce((s->>'min_withdrawal')::numeric,0) then raise exception 'Minimum withdrawal is %', s->>'min_withdrawal'; end if;
  if _method = 'upi' then
    if coalesce(_upi,'') !~ '^[a-zA-Z0-9._-]{2,}@[a-zA-Z]{2,}$' then raise exception 'Enter a valid UPI ID'; end if;
    dest := _upi;
  else
    dest := 'Google Play Redeem Code';
  end if;
  if exists (select 1 from public.withdrawals where user_id = auth.uid() and status = 'pending') then
    raise exception 'You already have a pending withdrawal';
  end if;
  select balance, winnings into bal, win from public.wallets where user_id = auth.uid() for update;
  if bal < _amount then raise exception 'Insufficient balance'; end if;
  if win < _amount then raise exception 'Sirf winning cash withdraw ho sakta hai. Aapki winnings: Rs %', win; end if;
  insert into public.withdrawals(user_id, amount, upi_id, method) values (auth.uid(), _amount, dest, _method) returning * into w;
  perform public.wallet_apply(auth.uid(), 'withdrawal', -_amount, w.id, 'Redeem: ' || dest);
  return w;
end;
$$;