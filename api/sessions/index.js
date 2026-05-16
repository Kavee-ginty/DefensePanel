import {
  buildInterimScores,
  getSupabaseAdmin,
  getUserFromRequest,
  json,
  normalizeScenarioType,
} from '../lib/supabaseAdmin.js';

export default async function handler(req, res) {
  try {
    const auth = await getUserFromRequest(req);
    if (auth.error) return json(res, auth.status, { error: auth.error });

    const admin = getSupabaseAdmin();
    const userId = auth.user.id;

    if (req.method === 'GET') {
      const { data, error } = await admin
        .from('pitch_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(25);

      if (error) {
        console.error('[sessions GET]', error);
        return json(res, 500, { error: error.message });
      }
      return json(res, 200, { sessions: data ?? [] });
    }

    if (req.method === 'POST') {
      let body = {};
      try {
        body =
          typeof req.body === 'string' ? JSON.parse(req.body) : req.body ?? {};
      } catch {
        return json(res, 400, { error: 'Invalid JSON body' });
      }

      const { mode_id, scenario_type, duration_seconds } = body;

      if (duration_seconds == null) {
        return json(res, 400, {
          error: 'duration_seconds is required',
        });
      }

      const scenarioType = normalizeScenarioType(scenario_type, mode_id);
      const duration = Math.max(1, Math.round(Number(duration_seconds)));
      const interim = buildInterimScores(scenarioType, duration);

      const row = {
        user_id: userId,
        scenario_type: scenarioType,
        duration_seconds: duration,
        filler_word_count: body.filler_word_count ?? interim.filler_word_count,
        critical_feedback: body.critical_feedback ?? interim.critical_feedback,
        overall_score: body.overall_score ?? interim.overall_score,
      };

      const { data, error } = await admin
        .from('pitch_sessions')
        .insert(row)
        .select('*')
        .single();

      if (error) {
        console.error('[sessions POST]', error);
        return json(res, 500, { error: error.message });
      }

      const { data: recent } = await admin
        .from('pitch_sessions')
        .select('id, overall_score, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: true })
        .limit(10);

      const scoreHistory = (recent ?? []).map((s, i) => ({
        label: `S${i + 1}`,
        score: s.overall_score,
      }));

      return json(res, 201, { session: data, scoreHistory });
    }

    res.setHeader('Allow', 'GET, POST');
    return json(res, 405, { error: 'Method not allowed' });
  } catch (err) {
    console.error('[sessions]', err);
    return json(res, 500, { error: err.message || 'Internal server error' });
  }
}
