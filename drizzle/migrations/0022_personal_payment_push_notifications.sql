CREATE OR REPLACE FUNCTION public.notify_completed_deposit_credit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE deposit_name text;
BEGIN
  IF NEW.type <> 'deposit' OR NEW.reference_id IS NULL THEN
    RETURN NEW;
  END IF;
  SELECT t.name INTO deposit_name
  FROM public.deposits d
  LEFT JOIN public.tournaments t ON false
  WHERE d.id = NEW.reference_id AND d.user_id = NEW.user_id AND d.status = 'completed';
  IF NOT FOUND THEN
    RETURN NEW;
  END IF;
  INSERT INTO public.notifications(user_id, title, body, kind)
  VALUES (NEW.user_id, 'Deposit successful', '₹' || NEW.amount::text || ' added to your FireZone wallet.', 'wallet');
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.notify_completed_deposit_credit() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS transactions_notify_deposit_credit ON public.transactions;
CREATE TRIGGER transactions_notify_deposit_credit
AFTER INSERT ON public.transactions
FOR EACH ROW EXECUTE FUNCTION public.notify_completed_deposit_credit();

CREATE OR REPLACE FUNCTION public.notify_failed_deposit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF OLD.status = 'pending' AND NEW.status = 'failed' THEN
    INSERT INTO public.notifications(user_id, title, body, kind)
    VALUES (NEW.user_id, 'Deposit unsuccessful', 'Your payment was not completed. No coins were added.', 'wallet');
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.notify_failed_deposit() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS deposits_notify_failed ON public.deposits;
CREATE TRIGGER deposits_notify_failed
AFTER UPDATE OF status ON public.deposits
FOR EACH ROW EXECUTE FUNCTION public.notify_failed_deposit();

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
  IF _decision = 'completed' THEN
    PERFORM public.wallet_apply(d.user_id, 'deposit', d.amount, d.id, 'Deposit approved');
  ELSIF _decision <> 'failed' THEN
    RAISE EXCEPTION 'Invalid decision';
  END IF;
  UPDATE public.deposits SET status = _decision, updated_at = now() WHERE id = _id RETURNING * INTO d;
  INSERT INTO public.audit_logs(actor_id, action, target, meta)
  VALUES (auth.uid(), 'deposit_' || _decision, _id::text, jsonb_build_object('amount', d.amount));
  RETURN d;
END;
$$;
GRANT EXECUTE ON FUNCTION public.admin_settle_deposit(uuid, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_settle_withdrawal(_id uuid, _decision text, _note text DEFAULT NULL)
RETURNS public.withdrawals
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE w public.withdrawals;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN RAISE EXCEPTION 'Forbidden'; END IF;
  SELECT * INTO w FROM public.withdrawals WHERE id = _id FOR UPDATE;
  IF w.id IS NULL THEN RAISE EXCEPTION 'Withdrawal not found'; END IF;
  IF w.status <> 'pending' THEN RAISE EXCEPTION 'Already settled'; END IF;
  IF _decision = 'completed' THEN
    UPDATE public.withdrawals SET status = 'completed', admin_note = _note, updated_at = now() WHERE id = _id RETURNING * INTO w;
    INSERT INTO public.notifications(user_id, title, body, kind)
    VALUES (w.user_id, 'Withdrawal approved', 'Your withdrawal of ₹' || w.amount::text || ' was approved.', 'withdrawal');
  ELSIF _decision IN ('rejected', 'failed') THEN
    PERFORM public.wallet_apply(w.user_id, 'refund', w.amount, w.id, 'Withdrawal ' || _decision);
    UPDATE public.withdrawals SET status = _decision, admin_note = _note, updated_at = now() WHERE id = _id RETURNING * INTO w;
    INSERT INTO public.notifications(user_id, title, body, kind)
    VALUES (w.user_id, 'Withdrawal ' || _decision, '₹' || w.amount::text || ' was refunded to your wallet.', 'withdrawal');
  ELSE
    RAISE EXCEPTION 'Invalid decision';
  END IF;
  INSERT INTO public.audit_logs(actor_id, action, target, meta)
  VALUES (auth.uid(), 'withdrawal_' || _decision, _id::text, jsonb_build_object('amount', w.amount));
  RETURN w;
END;
$$;
GRANT EXECUTE ON FUNCTION public.admin_settle_withdrawal(uuid, text, text) TO authenticated;