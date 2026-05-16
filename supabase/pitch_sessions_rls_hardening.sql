-- Defense-in-depth: ensure Row Level Security isolates pitch_sessions per auth user.
-- Run once in Supabase SQL Editor if History/Dashboard showed rows from other accounts.

alter table public.pitch_sessions enable row level security;

drop policy if exists "Users can read own sessions" on public.pitch_sessions;
create policy "Users can read own sessions"
  on public.pitch_sessions
  for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own sessions" on public.pitch_sessions;
create policy "Users can insert own sessions"
  on public.pitch_sessions
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users update own pitch sessions" on public.pitch_sessions;
create policy "Users update own pitch sessions"
  on public.pitch_sessions
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Optional: allow users to delete only their own rows (only needed if app adds DELETE)
drop policy if exists "Users delete own pitch sessions" on public.pitch_sessions;
create policy "Users delete own pitch sessions"
  on public.pitch_sessions
  for delete
  using (auth.uid() = user_id);
