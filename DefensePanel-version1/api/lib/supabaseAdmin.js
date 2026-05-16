import { createClient } from '@supabase/supabase-js';

const MODE_TO_SCENARIO = {
  startup: 'pitch',
  interview: 'interview',
  academic: 'presentation',
};

export function modeToScenarioType(modeId) {
  return MODE_TO_SCENARIO[modeId] ?? modeId ?? 'pitch';
}

function getEnv(name, fallback) {
  return process.env[name] || fallback || '';
}

export function getSupabaseAdmin() {
  const url = getEnv('SUPABASE_URL', process.env.VITE_SUPABASE_URL);
  const serviceKey = getEnv('SUPABASE_SERVICE_ROLE_KEY', '');
  if (!url || !serviceKey) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  }
  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function getUserFromRequest(req) {
  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return { error: 'Missing Authorization header', status: 401 };
  }
  const token = authHeader.slice(7);
  const url = getEnv('SUPABASE_URL', process.env.VITE_SUPABASE_URL);
  const anonKey =
    getEnv('SUPABASE_ANON_KEY', process.env.VITE_SUPABASE_ANON_KEY) || '';
  if (!url || !anonKey) {
    return { error: 'Server auth not configured', status: 500 };
  }
  const authClient = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await authClient.auth.getUser(token);
  if (error || !data?.user) {
    return { error: 'Invalid or expired token', status: 401 };
  }
  return { user: data.user };
}

export function json(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
}

const VALID_SCENARIOS = new Set(['pitch', 'interview', 'presentation']);

export function normalizeScenarioType(value, modeId) {
  if (VALID_SCENARIOS.has(value)) return value;
  if (modeId) return modeToScenarioType(modeId);
  return 'pitch';
}

/** Interim MVP scoring until OpenAI transcript analysis is wired. */
export function buildInterimScores(scenarioType, durationSeconds) {
  const base = 58 + Math.min(35, Math.floor(durationSeconds / 12));
  const bump = { pitch: 4, presentation: 2, interview: 6 }[scenarioType] ?? 0;
  const overall_score = Math.min(100, Math.max(40, base + bump));
  const filler_word_count = Math.max(
    2,
    Math.round(durationSeconds / 28) +
      (scenarioType === 'presentation' ? 3 : 0),
  );
  const feedbackByScenario = {
    pitch:
      'Strong narrative flow, but tighten unit economics when pressed on CAC and churn. Name one comparable and a concrete payback period next time.',
    presentation:
      'Methodology was clear; defend sample size and limitations with more confidence. Prepare a sharper ablation or significance answer.',
    interview:
      'Good depth on stack choices; slow down during system design and state trade-offs earlier. Verbalize your thinking before diving into code.',
  };
  const critical_feedback =
    feedbackByScenario[scenarioType] ??
    'Solid session. Focus on shorter answers under pressure and anticipate follow-up challenges.';
  return { overall_score, filler_word_count, critical_feedback };
}
