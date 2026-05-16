import { supabase, isSupabaseConfigured } from './supabaseClient.js';
import { buildInterimScores } from './interimScoring.js';
import {
  buildScoreHistoryFromSessions,
  modeToScenarioType,
} from './sessionUtils.js';

export const SESSION_COLUMNS = [
  'id',
  'user_id',
  'created_at',
  'scenario_type',
  'mode_id',
  'difficulty',
  'panel_persona',
  'custom_persona',
  'custom_scenario',
  'practice_goal',
  'custom_practice_goal',
  'session_flow',
  'custom_session_flow',
  'duration_seconds',
  'filler_word_count',
  'critical_feedback',
  'overall_score',
  'clarity_score',
  'confidence_score',
  'evidence_score',
  'structure_score',
  'technical_depth_score',
  'objection_handling_score',
  'strengths',
  'weaknesses',
  'missed_opportunities',
  'bookmarked',
].join(', ');

const LIST_LIMIT = 50;

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

function setupFromPayload(payload) {
  if (!payload?.session_setup && !payload?.sessionSetup) return null;
  return payload.session_setup ?? payload.sessionSetup ?? null;
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
    .select(SESSION_COLUMNS)
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
      .select(SESSION_COLUMNS)
      .eq('id', id)
      .maybeSingle(),
    fetchRecentForChart(),
  ]);

  if (sessionResult.error) throw new Error(sessionResult.error.message);
  if (!sessionResult.data) throw new Error('Session not found');

  return { session: sessionResult.data, scoreHistory: chart };
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
  const setup = setupFromPayload(payload);
  const interim = buildInterimScores(scenarioType, duration, setup);

  const row = {
    user_id: userId,
    scenario_type: scenarioType,
    mode_id: mode_id ?? payload.mode_id ?? null,
    difficulty: setup?.difficulty ?? null,
    panel_persona: setup?.panelPersona ?? null,
    custom_persona: setup?.customPersona?.trim()
      ? setup.customPersona.trim()
      : null,
    custom_scenario: setup?.customScenario?.trim()
      ? setup.customScenario.trim()
      : null,
    practice_goal: setup?.practiceGoal ?? null,
    custom_practice_goal: setup?.customPracticeGoal?.trim()
      ? setup.customPracticeGoal.trim()
      : null,
    session_flow: setup?.sessionFlow ?? null,
    custom_session_flow: setup?.customSessionFlow?.trim()
      ? setup.customSessionFlow.trim()
      : null,
    duration_seconds: duration,
    filler_word_count: payload.filler_word_count ?? interim.filler_word_count,
    critical_feedback: payload.critical_feedback ?? interim.critical_feedback,
    overall_score: payload.overall_score ?? interim.overall_score,
    clarity_score: payload.clarity_score ?? interim.clarity_score,
    confidence_score: payload.confidence_score ?? interim.confidence_score,
    evidence_score: payload.evidence_score ?? interim.evidence_score,
    structure_score: payload.structure_score ?? interim.structure_score,
    technical_depth_score:
      payload.technical_depth_score ?? interim.technical_depth_score,
    objection_handling_score:
      payload.objection_handling_score ?? interim.objection_handling_score,
    strengths: payload.strengths ?? interim.strengths,
    weaknesses: payload.weaknesses ?? interim.weaknesses,
    missed_opportunities:
      payload.missed_opportunities ?? interim.missed_opportunities,
    bookmarked: payload.bookmarked ?? false,
  };

  const { data, error } = await supabase
    .from('pitch_sessions')
    .insert(row)
    .select(SESSION_COLUMNS)
    .single();

  if (error) throw new Error(error.message);

  return { session: data };
}

export async function updateSessionBookmark(id, bookmarked, userId) {
  assertConfigured();
  if (!userId) throw new Error('You must be signed in.');

  const { data, error } = await supabase
    .from('pitch_sessions')
    .update({ bookmarked: !!bookmarked })
    .eq('id', id)
    .eq('user_id', userId)
    .select(SESSION_COLUMNS)
    .single();

  if (error) throw new Error(error.message);
  return { session: data };
}
