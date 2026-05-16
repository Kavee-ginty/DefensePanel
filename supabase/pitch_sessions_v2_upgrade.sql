-- Run in Supabase SQL Editor after pitch_sessions exists.
-- Adds pre-session setup, category scores, categorized feedback, bookmarks, and mode_id.

alter table public.pitch_sessions
  add column if not exists mode_id text,
  add column if not exists difficulty text,
  add column if not exists panel_persona text,
  add column if not exists custom_persona text,
  add column if not exists custom_scenario text,
  add column if not exists practice_goal text,
  add column if not exists custom_practice_goal text,
  add column if not exists session_flow text,
  add column if not exists custom_session_flow text,
  add column if not exists clarity_score integer check (
    clarity_score is null or (clarity_score >= 0 and clarity_score <= 100)
  ),
  add column if not exists confidence_score integer check (
    confidence_score is null or (
      confidence_score >= 0 and confidence_score <= 100
    )
  ),
  add column if not exists evidence_score integer check (
    evidence_score is null or (evidence_score >= 0 and evidence_score <= 100)
  ),
  add column if not exists structure_score integer check (
    structure_score is null or (structure_score >= 0 and structure_score <= 100)
  ),
  add column if not exists technical_depth_score integer check (
    technical_depth_score is null or (
      technical_depth_score >= 0 and technical_depth_score <= 100
    )
  ),
  add column if not exists objection_handling_score integer check (
    objection_handling_score is null or (
      objection_handling_score >= 0 and objection_handling_score <= 100
    )
  ),
  add column if not exists strengths text,
  add column if not exists weaknesses text,
  add column if not exists missed_opportunities text,
  add column if not exists bookmarked boolean not null default false;

create index if not exists pitch_sessions_user_bookmarked_idx
  on public.pitch_sessions (user_id, bookmarked)
  where bookmarked = true;
