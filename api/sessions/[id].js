import { getSupabaseAdmin, getUserFromRequest, json } from '../lib/supabaseAdmin.js';

const SESSION_COLUMNS =
  'id, user_id, created_at, scenario_type, duration_seconds, filler_word_count, critical_feedback, overall_score';

export default async function handler(req, res) {
  try {
    if (req.method !== 'GET') {
      res.setHeader('Allow', 'GET');
      return json(res, 405, { error: 'Method not allowed' });
    }

    const auth = await getUserFromRequest(req);
    if (auth.error) return json(res, auth.status, { error: auth.error });

    const id = req.query?.id;
    if (!id) return json(res, 400, { error: 'Session id required' });

    const admin = getSupabaseAdmin();
    const { data, error } = await admin
      .from('pitch_sessions')
      .select(SESSION_COLUMNS)
      .eq('id', id)
      .eq('user_id', auth.user.id)
      .maybeSingle();

    if (error) {
      console.error('[sessions/id GET]', error);
      return json(res, 500, { error: error.message });
    }
    if (!data) return json(res, 404, { error: 'Session not found' });

    const { data: recent } = await admin
      .from('pitch_sessions')
      .select('id, overall_score, created_at')
      .eq('user_id', auth.user.id)
      .order('created_at', { ascending: true })
      .limit(10);

    const scoreHistory = (recent ?? []).map((s, i) => ({
      label: `S${i + 1}`,
      score: s.overall_score,
    }));

    return json(res, 200, { session: data, scoreHistory });
  } catch (err) {
    console.error('[sessions/id]', err);
    return json(res, 500, { error: err.message || 'Internal server error' });
  }
}
