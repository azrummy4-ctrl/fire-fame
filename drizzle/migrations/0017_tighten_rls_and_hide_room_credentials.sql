-- Tighten RLS tautology policies and hide tournament room credentials

-- 1) profiles: real WITH CHECK predicate (users can only write their own row; admins keep manage rights)
DROP POLICY "own profile update" ON public.profiles;
CREATE POLICY "own profile update" ON public.profiles
  FOR UPDATE TO authenticated
  USING ((auth.uid() = id) OR public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK ((auth.uid() = id) OR public.has_role(auth.uid(), 'admin'::app_role));

-- 2) participants: rosters/slot grid/leaderboard are for signed-in app users only, no anonymous access
DROP POLICY "participants public read" ON public.participants;
CREATE POLICY "participants public read" ON public.participants
  FOR SELECT TO authenticated USING (true);

-- 3) settings: app config readable by signed-in app users only
DROP POLICY "settings public read" ON public.settings;
CREATE POLICY "settings public read" ON public.settings
  FOR SELECT TO authenticated USING (true);

-- 4) tournaments: room_id/room_password are never exposed through the data API;
--    they are served only by the SECURITY DEFINER get_room_details() RPC (joined players/admins)
--    and written only by the SECURITY DEFINER admin_publish_room() RPC.
REVOKE ALL ON public.tournaments FROM anon, authenticated;
GRANT SELECT (id, name, category, banner_url, mode, map, entry_fee, prize_pool, per_kill, max_players, starts_at, status, rules, prize_split, room_published, results_published, created_at, updated_at, created_by) ON public.tournaments TO anon, authenticated;
GRANT INSERT (created_by, name, category, banner_url, mode, map, entry_fee, prize_pool, per_kill, max_players, starts_at, rules, prize_split) ON public.tournaments TO authenticated;
GRANT UPDATE (name, category, banner_url, mode, map, entry_fee, prize_pool, per_kill, max_players, starts_at, status, rules, prize_split, room_published, results_published, created_by) ON public.tournaments TO authenticated;
GRANT DELETE ON public.tournaments TO authenticated;
