-- Run in Supabase SQL Editor (Dashboard → SQL → New query)
-- If you already created the old table, run pitch_sessions_migration.sql instead.

create table if not exists public.pitch_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  scenario_type text not null check (
    scenario_type in ('pitch', 'interview', 'presentation')
  ),
  duration_seconds integer not null check (duration_seconds >= 0),
  filler_word_count integer not null default 0 check (filler_word_count >= 0),
  critical_feedback text not null,
  overall_score integer not null check (
    overall_score >= 0 and overall_score <= 100
  )
);

create index if not exists pitch_sessions_user_created_idx
  on public.pitch_sessions (user_id, created_at desc);

alter table public.pitch_sessions enable row level security;

create policy "Users can read own sessions"
  on public.pitch_sessions
  for select
  using (auth.uid() = user_id);

create policy "Users can insert own sessions"
  on public.pitch_sessions
  for insert
  with check (auth.uid() = user_id);
