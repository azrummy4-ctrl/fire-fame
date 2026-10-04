GRANT UPDATE ON public.settings TO authenticated;

CREATE OR REPLACE FUNCTION public.validate_payment_withdrawal_limits()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  minimum numeric;
  maximum numeric;
BEGIN
  IF NEW.key <> 'payments' THEN
    RETURN NEW;
  END IF;
  IF jsonb_typeof(NEW.value->'min_withdrawal') <> 'number'
     OR jsonb_typeof(NEW.value->'max_withdrawal') <> 'number' THEN
    RAISE EXCEPTION 'Withdrawal limits must be numbers';
  END IF;
  minimum := (NEW.value->>'min_withdrawal')::numeric;
  maximum := (NEW.value->>'max_withdrawal')::numeric;
  IF minimum < 1 OR minimum > maximum OR minimum <> trunc(minimum) THEN
    RAISE EXCEPTION 'Minimum withdrawal must be a whole amount between 1 and maximum withdrawal';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_payment_withdrawal_limits
BEFORE UPDATE ON public.settings
FOR EACH ROW EXECUTE FUNCTION public.validate_payment_withdrawal_limits();