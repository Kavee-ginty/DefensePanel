-- Run in Supabase SQL Editor (Dashboard → SQL → New query)
-- If you already created the old table, run pitch_sessions_migration.sql instead.

create table if not exists public.pitch_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  scenario_type text not null check (
    scenario_type in ('pitch', 'interview', 'presentation')
  ),
  mode_id text,
  difficulty text,
  panel_persona text,
  custom_persona text,
  custom_scenario text,
  practice_goal text,
  custom_practice_goal text,
  session_flow text,
  custom_session_flow text,
  duration_seconds integer not null check (duration_seconds >= 0),
  filler_word_count integer not null default 0 check (filler_word_count >= 0),
  critical_feedback text not null,
  overall_score integer not null check (
    overall_score >= 0 and overall_score <= 100
  ),
  clarity_score integer check (
    clarity_score is null or (clarity_score >= 0 and clarity_score <= 100)
  ),
  confidence_score integer check (
    confidence_score is null
      or (confidence_score >= 0 and confidence_score <= 100)
  ),
  evidence_score integer check (
    evidence_score is null or (evidence_score >= 0 and evidence_score <= 100)
  ),
  structure_score integer check (
    structure_score is null or (structure_score >= 0 and structure_score <= 100)
  ),
  technical_depth_score integer check (
    technical_depth_score is null
      or (technical_depth_score >= 0 and technical_depth_score <= 100)
  ),
  objection_handling_score integer check (
    objection_handling_score is null
      or (objection_handling_score >= 0 and objection_handling_score <= 100)
  ),
  strengths text,
  weaknesses text,
  missed_opportunities text,
  bookmarked boolean not null default false
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
