CREATE OR REPLACE FUNCTION public.complete_zapupi_deposit(_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE d public.deposits;
BEGIN
  SELECT * INTO d FROM public.deposits WHERE id = _id FOR UPDATE;
  IF d.id IS NULL THEN RAISE EXCEPTION 'Deposit not found'; END IF;
  IF d.provider <> 'zapupi' THEN RAISE EXCEPTION 'Invalid deposit provider'; END IF;
  IF d.status <> 'pending' THEN RETURN d.status; END IF;

  UPDATE public.deposits
  SET status = 'completed', updated_at = now()
  WHERE id = _id;
  PERFORM public.wallet_apply(d.user_id, 'deposit', d.amount, d.id, 'ZapUpi deposit ' || coalesce(d.provider_ref, ''));
  RETURN 'completed';
END;
$$;
REVOKE ALL ON FUNCTION public.complete_zapupi_deposit(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.complete_zapupi_deposit(uuid) TO service_role;