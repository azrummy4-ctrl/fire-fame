CREATE OR REPLACE FUNCTION public.credit_deposit_promo_bonus()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _bonus numeric;
BEGIN
  IF OLD.status <> 'pending' OR NEW.status <> 'completed' THEN RETURN NEW; END IF;
  _bonus := CASE NEW.amount WHEN 50 THEN 5 WHEN 100 THEN 11 WHEN 200 THEN 22 WHEN 300 THEN 33 ELSE 0 END;
  IF _bonus > 0 THEN
    PERFORM public.wallet_apply(NEW.user_id, 'deposit_bonus', _bonus, NEW.id, 'Deposit bonus for Rs ' || NEW.amount);
  END IF;
  RETURN NEW;
END; $$;
REVOKE ALL ON FUNCTION public.credit_deposit_promo_bonus() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER deposits_promo_bonus AFTER UPDATE OF status ON public.deposits
FOR EACH ROW EXECUTE FUNCTION public.credit_deposit_promo_bonus();