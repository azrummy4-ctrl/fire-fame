CREATE TABLE public.milestone_claims (
  id uuid not null default gen_random_uuid(),
  user_id uuid not null,
  milestone integer not null,
  amount numeric not null default 0,
  created_at timestamptz not null default now(),
  unique (user_id, milestone)
);

GRANT SELECT, INSERT ON public.milestone_claims TO authenticated;
GRANT ALL ON public.milestone_claims TO service_role;

ALTER TABLE public.milestone_claims ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own milestone claims read"
  ON public.milestone_claims FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "own milestone claims insert"
  ON public.milestone_claims FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
