-- Run once in Supabase SQL editor (required for full transcript storage on end-session).

alter table pitch_sessions
  add column if not exists transcript_text text,
  add column if not exists transcript_json jsonb,
  add column if not exists bey_call_id text;
