CREATE OR REPLACE FUNCTION public.admin_settle_deposit(_id uuid, _decision text)
RETURNS public.deposits
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE d public.deposits;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN RAISE EXCEPTION 'Forbidden'; END IF;
  SELECT * INTO d FROM public.deposits WHERE id = _id FOR UPDATE;
  IF d.id IS NULL THEN RAISE EXCEPTION 'Deposit not found'; END IF;
  IF d.status <> 'pending' THEN RAISE EXCEPTION 'Already settled'; END IF;
  IF _decision NOT IN ('completed', 'failed') THEN RAISE EXCEPTION 'Invalid decision'; END IF;

  UPDATE public.deposits SET status = _decision, updated_at = now() WHERE id = _id RETURNING * INTO d;
  IF _decision = 'completed' THEN
    PERFORM public.wallet_apply(d.user_id, 'deposit', d.amount, d.id, 'Deposit approved');
  END IF;

  INSERT INTO public.audit_logs(actor_id, action, target, meta)
  VALUES (auth.uid(), 'deposit_' || _decision, _id::text, jsonb_build_object('amount', d.amount));
  RETURN d;
END;
$$;
GRANT EXECUTE ON FUNCTION public.admin_settle_deposit(uuid, text) TO authenticated;