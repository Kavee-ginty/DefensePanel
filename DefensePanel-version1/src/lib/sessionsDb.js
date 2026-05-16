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

/**
 * Current signed-in user id for defense-in-depth filtering (never rely on RLS alone).
 * @returns {Promise<string>}
 */
async function requireAuthUserId() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user?.id) {
    throw new Error('Not signed in');
  }
  return user.id;
}

function normalizeScenarioType(value, modeId) {
  const valid = ['pitch', 'interview', 'presentation'];
  if (valid.includes(value)) return value;
  if (modeId) return modeToScenarioType(modeId);
  return 'pitch';
}

/**
 * @param {string} userId
 */
async function fetchRecentForChart(userId) {
  const { data, error } = await supabase
    .from('pitch_sessions')
    .select('id, overall_score, created_at')
    .eq('user_id', userId)
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

  const userId = await requireAuthUserId();

  const { data, error } = await supabase
    .from('pitch_sessions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(LIST_LIMIT);

  if (error) throw new Error(error.message);
  return { sessions: data ?? [] };
}

export async function getSession(id) {
  assertConfigured();

  const userId = await requireAuthUserId();

  const [sessionResult, chart] = await Promise.all([
    supabase
      .from('pitch_sessions')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .maybeSingle(),
    fetchRecentForChart(userId),
  ]);

  if (sessionResult.error) throw new Error(sessionResult.error.message);
  if (!sessionResult.data) throw new Error('Session not found');

  return { session: sessionResult.data, scoreHistory: chart };
}

export async function updateSessionBookmark(id, bookmarked) {
  assertConfigured();

  const userId = await requireAuthUserId();

  const { data, error } = await supabase
    .from('pitch_sessions')
    .update({ bookmarked })
    .eq('id', id)
    .eq('user_id', userId)
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

  const authUserId = await requireAuthUserId();
  if (authUserId !== userId) {
    throw new Error('Cannot save a session for another account.');
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
