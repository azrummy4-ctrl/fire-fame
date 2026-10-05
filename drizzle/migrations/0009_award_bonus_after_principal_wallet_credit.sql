CREATE OR REPLACE FUNCTION public.credit_deposit_promo_bonus()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  -- Kept for backwards-compatible deployed triggers. The bonus is now awarded
  -- only after the matching principal has actually been credited to the wallet.
  RETURN NEW;
END; $$;
CREATE OR REPLACE FUNCTION public.credit_deposit_bonus_after_principal()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _bonus numeric;
BEGIN
  IF NEW.type <> 'deposit' OR NEW.reference_id IS NULL THEN RETURN NEW; END IF;
  SELECT CASE d.amount WHEN 50 THEN 5 WHEN 100 THEN 11 WHEN 200 THEN 22 WHEN 300 THEN 33 ELSE 0 END
  INTO _bonus FROM public.deposits d
  WHERE d.id = NEW.reference_id AND d.user_id = NEW.user_id AND d.amount = NEW.amount;
  IF coalesce(_bonus, 0) = 0 THEN RETURN NEW; END IF;
  IF EXISTS (SELECT 1 FROM public.transactions t WHERE t.user_id = NEW.user_id AND t.type = 'deposit_bonus' AND t.reference_id = NEW.reference_id) THEN RETURN NEW; END IF;
  PERFORM public.wallet_apply(NEW.user_id, 'deposit_bonus', _bonus, NEW.reference_id, 'Deposit bonus for Rs ' || NEW.amount);
  RETURN NEW;
END; $$;
REVOKE ALL ON FUNCTION public.credit_deposit_bonus_after_principal() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER transactions_deposit_promo_bonus AFTER INSERT ON public.transactions
FOR EACH ROW EXECUTE FUNCTION public.credit_deposit_bonus_after_principal();