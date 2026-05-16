-- Run ONLY if you already applied the older pitch_sessions schema.
-- Drops extra columns and tightens scenario_type values.

alter table public.pitch_sessions
  drop column if exists mode_id,
  drop column if exists document_name,
  drop column if exists document_summary,
  drop column if exists is_active;

-- Map legacy scenario labels to new enum (adjust if your data differs)
update public.pitch_sessions
set scenario_type = case
  when scenario_type ilike '%interview%' then 'interview'
  when scenario_type ilike '%viva%' or scenario_type ilike '%academic%' then 'presentation'
  else 'pitch'
end
where scenario_type not in ('pitch', 'interview', 'presentation');

alter table public.pitch_sessions
  drop constraint if exists pitch_sessions_scenario_type_check;

alter table public.pitch_sessions
  add constraint pitch_sessions_scenario_type_check
  check (scenario_type in ('pitch', 'interview', 'presentation'));
