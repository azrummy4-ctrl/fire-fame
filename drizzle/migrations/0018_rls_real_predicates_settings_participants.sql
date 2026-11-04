-- settings: only the payments config key is readable by app users (real allowlist predicate)
DROP POLICY "settings public read" ON public.settings;
CREATE POLICY "settings public read" ON public.settings
  FOR SELECT TO authenticated
  USING (key = 'payments');

-- participants: real predicate — own rows, admins, tournament hosts/managers,
-- rosters of tournaments started in the last 24h (slot booking/leaderboard view),
-- and prize winners (kept for the all-time earnings leaderboard). Older rosters fade out.
DROP POLICY "participants public read" ON public.participants;
CREATE POLICY "participants public read" ON public.participants
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR public.has_role(auth.uid(), 'admin'::app_role)
    OR public.can_manage_tournament(tournament_id)
    OR EXISTS (
      SELECT 1 FROM public.tournaments t
      WHERE t.id = tournament_id AND t.starts_at > now() - interval '24 hours'
    )
    OR prize_amount > 0
  );
