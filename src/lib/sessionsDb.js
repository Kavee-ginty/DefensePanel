import { supabase, isSupabaseConfigured } from './supabaseClient.js';
import { buildInterimScores } from './interimScoring.js';
import {
  buildScoreHistoryFromSessions,
  modeToScenarioType,
} from './sessionUtils.js';

const LIST_LIMIT = 25;

function assertConfigured() {
  if (!isSupabaseConfigured) {
    throw new Error(
      'Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env',
    );
  }
}

function normalizeScenarioType(value, modeId) {
  const valid = ['pitch', 'interview', 'presentation'];
  if (valid.includes(value)) return value;
  if (modeId) return modeToScenarioType(modeId);
  return 'pitch';
}

async function fetchRecentForChart() {
  const { data, error } = await supabase
    .from('pitch_sessions')
    .select('id, overall_score, created_at')
    .order('created_at', { ascending: true })
    .limit(10);

  if (error) throw new Error(error.message);
  return buildScoreHistoryFromSessions(data ?? [], 10);
}

export function chartFromSessions(sessions) {
  return buildScoreHistoryFromSessions(sessions ?? [], 10);
}

export async function listSessions() {
  assertConfigured();

  const { data, error } = await supabase
    .from('pitch_sessions')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(LIST_LIMIT);

  if (error) throw new Error(error.message);
  return { sessions: data ?? [] };
}

export async function getSession(id) {
  assertConfigured();

  const [sessionResult, chart] = await Promise.all([
    supabase
      .from('pitch_sessions')
      .select('*')
      .eq('id', id)
      .maybeSingle(),
    fetchRecentForChart(),
  ]);

  if (sessionResult.error) throw new Error(sessionResult.error.message);
  if (!sessionResult.data) throw new Error('Session not found');

  return { session: sessionResult.data, scoreHistory: chart };
}

export async function updateSessionBookmark(id, bookmarked) {
  assertConfigured();

  const { data, error } = await supabase
    .from('pitch_sessions')
    .update({ bookmarked })
    .eq('id', id)
    .select('*')
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) throw new Error('Session not found');

  return { session: data };
}

export async function insertSession(payload, userId) {
  assertConfigured();

  if (!userId) {
    throw new Error('You must be signed in to save a session.');
  }

  const { mode_id, scenario_type, duration_seconds } = payload;
  if (duration_seconds == null) {
    throw new Error('duration_seconds is required');
  }

  const scenarioType = normalizeScenarioType(scenario_type, mode_id);
  const duration = Math.max(1, Math.round(Number(duration_seconds)));
  const interim = buildInterimScores(scenarioType, duration);

  const row = {
    user_id: userId,
    scenario_type: scenarioType,
    duration_seconds: duration,
    filler_word_count: payload.filler_word_count ?? interim.filler_word_count,
    critical_feedback: payload.critical_feedback ?? interim.critical_feedback,
    overall_score: payload.overall_score ?? interim.overall_score,
  };

  const { data, error } = await supabase
    .from('pitch_sessions')
    .insert(row)
    .select('*')
    .single();

  if (error) throw new Error(error.message);

  return { session: data };
}
