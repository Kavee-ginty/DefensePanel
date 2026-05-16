-- Run in Supabase SQL Editor after pitch_sessions.sql / pitch_sessions_migration.sql.
-- Adds optional columns used by Dashboard, History, and Debrief. Safe if columns already exist.
-- Idempotent-ish: skips existing columns via IF NOT EXISTS (run once between releases).

alter table public.pitch_sessions add column if not exists difficulty text;
alter table public.pitch_sessions add column if not exists session_minutes integer
  check (session_minutes is null or session_minutes > 0);
alter table public.pitch_sessions add column if not exists panel_persona text;
alter table public.pitch_sessions add column if not exists practice_goals jsonb
  default '[]'::jsonb;
alter table public.pitch_sessions add column if not exists vision_mode boolean
  default false;

alter table public.pitch_sessions add column if not exists strengths text;
alter table public.pitch_sessions add column if not exists weaknesses text;
alter table public.pitch_sessions add column if not exists missed_opportunities text;
alter table public.pitch_sessions add column if not exists next_steps text;

alter table public.pitch_sessions add column if not exists clarity_score integer;
alter table public.pitch_sessions add column if not exists confidence_score integer;
alter table public.pitch_sessions add column if not exists evidence_score integer;
alter table public.pitch_sessions add column if not exists structure_score integer;
alter table public.pitch_sessions add column if not exists technical_depth_score integer;
alter table public.pitch_sessions add column if not exists objection_handling_score integer;

alter table public.pitch_sessions add column if not exists bookmarked boolean
  default false;

-- Optional constraints (only enforced when scores are populated)
alter table public.pitch_sessions
  drop constraint if exists pitch_sessions_clarity_score_range;
alter table public.pitch_sessions
  add constraint pitch_sessions_clarity_score_range check (
    clarity_score is null or (clarity_score >= 0 and clarity_score <= 100)
  );

alter table public.pitch_sessions
  drop constraint if exists pitch_sessions_confidence_score_range;
alter table public.pitch_sessions
  add constraint pitch_sessions_confidence_score_range check (
    confidence_score is null or (confidence_score >= 0 and confidence_score <= 100)
  );

alter table public.pitch_sessions
  drop constraint if exists pitch_sessions_evidence_score_range;
alter table public.pitch_sessions
  add constraint pitch_sessions_evidence_score_range check (
    evidence_score is null or (evidence_score >= 0 and evidence_score <= 100)
  );

alter table public.pitch_sessions
  drop constraint if exists pitch_sessions_structure_score_range;
alter table public.pitch_sessions
  add constraint pitch_sessions_structure_score_range check (
    structure_score is null or (structure_score >= 0 and structure_score <= 100)
  );

alter table public.pitch_sessions
  drop constraint if exists pitch_sessions_technical_depth_score_range;
alter table public.pitch_sessions
  add constraint pitch_sessions_technical_depth_score_range check (
    technical_depth_score is null
    or (technical_depth_score >= 0 and technical_depth_score <= 100)
  );

alter table public.pitch_sessions
  drop constraint if exists pitch_sessions_objection_handling_score_range;
alter table public.pitch_sessions
  add constraint pitch_sessions_objection_handling_score_range check (
    objection_handling_score is null
    or (objection_handling_score >= 0 and objection_handling_score <= 100)
  );

-- Optional row updates for signed-in testers (bookmark column + future API PATCH)
drop policy if exists "Users update own pitch sessions" on public.pitch_sessions;
create policy "Users update own pitch sessions"
  on public.pitch_sessions
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

comment on column public.pitch_sessions.strengths is 'Plain text bullets or sentences.';
comment on column public.pitch_sessions.practice_goals is 'JSON array of goal ids/objects.';

/*
-- SAMPLE: enrich your newest row — replace UUID with auth.users.id
update public.pitch_sessions p set
  difficulty = 'standard',
  session_minutes = 10,
  panel_persona = 'investor',
  practice_goals = '[{"id":"filler_words","label":"Reduce filler words"}]'::jsonb,
  vision_mode = false,
  strengths = '- Narrative cohesion.\n- Clear ask.',
  weaknesses = '- Light on KPI proof.',
  missed_opportunities = '- Margin question left hanging.',
  next_steps = '- Add appendix with cohort retention.',
  clarity_score = 84,
  confidence_score = 80,
  evidence_score = 72,
  structure_score = 78,
  technical_depth_score = 76,
  objection_handling_score = 71,
  bookmarked = true
from (
  select id from public.pitch_sessions
  where user_id = 'YOUR_USER_UUID'::uuid
  order by created_at desc
  limit 1
) newest
where p.id = newest.id;

insert into public.pitch_sessions (
  user_id,
  scenario_type,
  duration_seconds,
  filler_word_count,
  critical_feedback,
  overall_score,
  difficulty,
  session_minutes,
  panel_persona,
  practice_goals,
  vision_mode,
  strengths,
  weaknesses,
  missed_opportunities,
  next_steps,
  clarity_score,
  confidence_score,
  evidence_score,
  structure_score,
  technical_depth_score,
  objection_handling_score,
  bookmarked
) values (
  'YOUR_USER_UUID'::uuid,
  'pitch',
  360,
  6,
  'Strong pacing; quantify retention better next time.',
  81,
  'brutal',
  5,
  'cfo',
  '["technical_depth","objections"]'::jsonb,
  false,
  '- Disciplined timeboxing.',
  '- Metrics thinner under CFO pressure.',
  '- Missed preempting churn spike concern.',
  '- Add reconciliation tables for finance deep dive.',
  82,
  79,
  77,
  83,
  74,
  73,
  false
);
*/
