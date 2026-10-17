CREATE TABLE public.milestone_spins (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 user_id uuid NOT NULL,
 milestone integer NOT NULL CHECK (milestone IN (5,10,15,20)),
 amount numeric NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(user_id, milestone),
 CHECK ((milestone = 5 AND amount IN (1,2)) OR (milestone = 10 AND amount = 3) OR (milestone = 15 AND amount = 5) OR (milestone = 20 AND amount = 8))
);
GRANT SELECT ON public.milestone_spins TO authenticated;
GRANT ALL ON public.milestone_spins TO service_role;
ALTER TABLE public.milestone_spins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read own milestone spins" ON public.milestone_spins FOR SELECT TO authenticated USING (auth.uid() = user_id);
COMMENT ON TABLE public.milestone_claims IS 'DEPRECATED: legacy auto rewards; replaced by milestone_spins. Existing rewards remain unchanged.';
REVOKE INSERT ON public.milestone_claims FROM authenticated;
CREATE OR REPLACE FUNCTION public.claim_milestone_spin(_milestone integer) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
 _uid uuid := auth.uid();
 _played integer;
 _status text;
 _claim public.milestone_spins%ROWTYPE;
 _amount numeric;
BEGIN
 IF _uid IS NULL THEN RAISE EXCEPTION 'Sign in required'; END IF;
 IF _milestone NOT IN (5,10,15,20) OR _milestone IS NULL THEN RAISE EXCEPTION 'Invalid milestone'; END IF;
 SELECT status INTO _status FROM public.profiles WHERE id = _uid FOR UPDATE;
 IF _status IS DISTINCT FROM 'active' THEN RAISE EXCEPTION 'Account not active'; END IF;
 SELECT * INTO _claim FROM public.milestone_spins WHERE user_id = _uid AND milestone = _milestone;
 IF FOUND THEN RETURN jsonb_build_object('amount', _claim.amount, 'milestone', _claim.milestone, 'alreadyClaimed', true); END IF;
 SELECT count(DISTINCT p.tournament_id) INTO _played FROM public.participants p JOIN public.tournaments t ON t.id = p.tournament_id WHERE p.user_id = _uid AND t.results_published = true;
 IF _played < _milestone THEN RAISE EXCEPTION 'Milestone not complete'; END IF;
 _amount := CASE _milestone WHEN 5 THEN 1 + floor(random()*2)::integer WHEN 10 THEN 3 WHEN 15 THEN 5 WHEN 20 THEN 8 END;
 INSERT INTO public.milestone_spins(user_id,milestone,amount) VALUES (_uid,_milestone,_amount) RETURNING * INTO _claim;
 PERFORM public.wallet_apply(_uid,'milestone_reward',_amount,_claim.id,'Milestone spin: ' || _milestone || ' matches');
 INSERT INTO public.notifications(user_id,title,body,kind) VALUES (_uid,'Milestone spin reward!','You won Rs ' || _amount || ' for ' || _milestone || ' completed matches.','reward');
 RETURN jsonb_build_object('amount',_amount,'milestone',_milestone,'alreadyClaimed',false);
END;
$$;
REVOKE ALL ON FUNCTION public.claim_milestone_spin(integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.claim_milestone_spin(integer) TO authenticated;