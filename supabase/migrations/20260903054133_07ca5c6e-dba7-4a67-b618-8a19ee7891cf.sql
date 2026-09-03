insert into public.tournaments (name, category, banner_url, mode, map, entry_fee, prize_pool, per_kill, max_players, starts_at, status, rules, prize_split) values
('BR Full Map Tournament','BR FULL MAP','br-full-map','Squad','Bermuda',30,2000,8,48, now() + interval '4 hours','upcoming',
 array['Every player must record their POV / screen recording.','Emulator, hack or teaming results in a permanent ban.','Join the room 10 minutes before the match starts.'],
 '[{"place":"1st","amount":1000},{"place":"2nd","amount":600},{"place":"3rd","amount":400}]'::jsonb),
('Clash Squad 4v4','CLASH SQUAD','clash-squad','Squad','Bermuda Remastered',20,800,0,8, now() + interval '1 day','upcoming',
 array['Best of 7 rounds.','No character skills except allowed list.','Screen recording mandatory.'],
 '[{"place":"Winner","amount":800}]'::jsonb),
('Lone Wolf 1v1','LONE WOLF','lone-wolf','Solo','Iron Cage',10,300,0,2, now() + interval '6 hours','upcoming',
 array['1v1 best of 3.','No gloo wall stacking abuse.'],
 '[{"place":"Winner","amount":300}]'::jsonb),
('Solo Survival Cup','SOLO','solo-survival','Solo','Purgatory',25,1500,10,48, now() + interval '2 days','upcoming',
 array['Solo only, no teaming.','Late join is not allowed.'],
 '[{"place":"1st","amount":700},{"place":"2nd","amount":500},{"place":"3rd","amount":300}]'::jsonb);