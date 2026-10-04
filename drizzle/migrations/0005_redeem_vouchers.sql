ALTER TABLE public.withdrawals ADD COLUMN IF NOT EXISTS method text NOT NULL DEFAULT 'upi';

CREATE OR REPLACE FUNCTION public.request_redeem(_amount numeric, _method text, _upi text DEFAULT NULL)
RETURNS public.withdrawals LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
declare w public.withdrawals; s jsonb; bal numeric; st text; dest text;
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
  select balance into bal from public.wallets where user_id = auth.uid() for update;
  if bal < _amount then raise exception 'Insufficient balance'; end if;
  insert into public.withdrawals(user_id, amount, upi_id, method) values (auth.uid(), _amount, dest, _method) returning * into w;
  perform public.wallet_apply(auth.uid(), 'withdrawal', -_amount, w.id, 'Redeem: ' || dest);
  return w;
end; $$;

REVOKE ALL ON FUNCTION public.request_redeem(numeric, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.request_redeem(numeric, text, text) TO authenticated;

UPDATE public.settings SET value = jsonb_set(value, '{min_withdrawal}', '30'::jsonb) WHERE key = 'payments' AND (value->>'min_withdrawal')::numeric > 30;