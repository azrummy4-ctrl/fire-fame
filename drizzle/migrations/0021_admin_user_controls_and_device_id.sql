ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS device_id text;

CREATE OR REPLACE FUNCTION public.prevent_self_profile_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status
     AND auth.uid() IS NOT NULL
     AND NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'Only an admin can change account status';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_status_change_guard ON public.profiles;
CREATE TRIGGER profiles_status_change_guard
BEFORE UPDATE OF status ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.prevent_self_profile_status_change();

CREATE OR REPLACE FUNCTION public.admin_list_users(_search text DEFAULT '', _status text DEFAULT 'all', _page integer DEFAULT 1)
RETURNS TABLE(user_id uuid, ign text, email text, device_id text, referral_code text, created_at timestamptz, balance numeric, status text, total_count bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT matched.uid, matched.user_ign, matched.user_email, matched.android_device_id,
         matched.referral, matched.registered_at, matched.coins, matched.account_status,
         count(*) OVER () AS total_count
  FROM (
    SELECT p.id AS uid,
           coalesce(p.ign, '') AS user_ign,
           coalesce(u.email, '') AS user_email,
           p.device_id AS android_device_id,
           p.referral_code AS referral,
           u.created_at AS registered_at,
           coalesce(w.balance, 0)::numeric AS coins,
           p.status AS account_status
    FROM public.profiles AS p
    JOIN auth.users AS u ON u.id = p.id
    LEFT JOIN public.wallets AS w ON w.user_id = p.id
    WHERE public.has_role(auth.uid(), 'admin'::public.app_role)
      AND (_status = 'all' OR (_status = 'blocked' AND p.status <> 'active'))
      AND (coalesce(trim(_search), '') = '' OR
           strpos(lower(coalesce(p.ign, '') || ' ' || coalesce(u.email, '')), lower(trim(_search))) > 0)
  ) AS matched
  ORDER BY matched.registered_at DESC
  LIMIT 50
  OFFSET (least(greatest(coalesce(_page, 1), 1), 100000) - 1) * 50;
$$;

CREATE OR REPLACE FUNCTION public.admin_get_user_detail(_user_id uuid)
RETURNS TABLE(user_id uuid, ign text, email text, device_id text, referral_code text, created_at timestamptz, balance numeric, status text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT p.id, coalesce(p.ign, ''), coalesce(u.email, ''), p.device_id,
         p.referral_code, u.created_at, coalesce(w.balance, 0)::numeric, p.status
  FROM public.profiles AS p
  JOIN auth.users AS u ON u.id = p.id
  LEFT JOIN public.wallets AS w ON w.user_id = p.id
  WHERE p.id = _user_id
    AND public.has_role(auth.uid(), 'admin'::public.app_role)
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.admin_set_user_status(_user_id uuid, _status text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;
  IF _user_id = auth.uid() THEN
    RAISE EXCEPTION 'You cannot block your own admin account';
  END IF;
  IF _status NOT IN ('active', 'banned', 'suspended') THEN
    RAISE EXCEPTION 'Invalid account status';
  END IF;
  UPDATE public.profiles SET status = _status, updated_at = now() WHERE id = _user_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'User not found'; END IF;
  INSERT INTO public.audit_logs(actor_id, action, target, meta)
  VALUES (auth.uid(), 'user_status_' || _status, _user_id::text, jsonb_build_object('status', _status));
  RETURN _status;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_adjust_coins(_user_id uuid, _amount numeric, _note text DEFAULT '')
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE current_balance numeric;
DECLARE new_balance numeric;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;
  IF _amount IS NULL OR _amount = 0 THEN
    RAISE EXCEPTION 'Enter a non-zero coin amount';
  END IF;
  SELECT balance INTO current_balance FROM public.wallets WHERE user_id = _user_id FOR UPDATE;
  IF current_balance IS NULL THEN RAISE EXCEPTION 'Wallet not found'; END IF;
  IF current_balance + _amount < 0 THEN RAISE EXCEPTION 'Coins cannot go below zero'; END IF;
  new_balance := public.wallet_apply(
    _user_id,
    'admin_adjustment',
    _amount,
    NULL,
    left('Admin adjustment: ' || coalesce(_note, ''), 250)
  );
  INSERT INTO public.audit_logs(actor_id, action, target, meta)
  VALUES (auth.uid(), 'admin_coin_adjustment', _user_id::text,
          jsonb_build_object('amount', _amount, 'balance_after', new_balance, 'note', left(coalesce(_note, ''), 250)));
  RETURN new_balance;
END;
$$;

REVOKE ALL ON FUNCTION public.prevent_self_profile_status_change() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.admin_list_users(text, text, integer) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_get_user_detail(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_set_user_status(uuid, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_adjust_coins(uuid, numeric, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_list_users(text, text, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_get_user_detail(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_user_status(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_adjust_coins(uuid, numeric, text) TO authenticated;