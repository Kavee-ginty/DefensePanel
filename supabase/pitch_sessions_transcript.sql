-- Run in Supabase SQL Editor after pitch_sessions.sql (and ideally pitch_sessions_extended.sql).
-- Stores Beyond Presence transcript metadata for each saved session row.

alter table public.pitch_sessions add column if not exists transcript_text text;

alter table public.pitch_sessions add column if not exists bey_call_id text;

alter table public.pitch_sessions add column if not exists transcript_source text
  check (
    transcript_source is null
    or transcript_source in ('beyond', 'client', 'none')
  );

alter table public.pitch_sessions add column if not exists transcript_message_count integer
  check (transcript_message_count is null or transcript_message_count >= 0);

comment on column public.pitch_sessions.transcript_text is 'Optional full transcript text used for grading (may be large; consider retention policy).';
comment on column public.pitch_sessions.bey_call_id is 'Beyond Presence call id when transcript_source is beyond.';
comment on column public.pitch_sessions.transcript_source is 'Where grading text came from: beyond API, client-provided, or none.';
