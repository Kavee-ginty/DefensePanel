import { getSupabaseAdmin, getUserFromRequest, json } from '../lib/supabaseAdmin.js';

export default async function handler(req, res) {
  try {
    if (req.method !== 'GET' && req.method !== 'PATCH') {
      res.setHeader('Allow', 'GET, PATCH');
      return json(res, 405, { error: 'Method not allowed' });
    }

    const auth = await getUserFromRequest(req);
    if (auth.error) return json(res, auth.status, { error: auth.error });

    const id = req.query?.id;
    if (!id) return json(res, 400, { error: 'Session id required' });

    const admin = getSupabaseAdmin();

    if (req.method === 'PATCH') {
      let body = {};
      try {
        body =
          typeof req.body === 'string' ? JSON.parse(req.body) : req.body ?? {};
      } catch {
        return json(res, 400, { error: 'Invalid JSON body' });
      }

      if (typeof body.bookmarked !== 'boolean') {
        return json(res, 400, {
          error: 'Body must include bookmarked: boolean',
        });
      }

      const { data, error } = await admin
        .from('pitch_sessions')
        .update({ bookmarked: body.bookmarked })
        .eq('id', id)
        .eq('user_id', auth.user.id)
        .select('*')
        .maybeSingle();

      if (error) {
        console.error('[sessions/id PATCH]', error);
        return json(res, 500, { error: error.message });
      }
      if (!data) return json(res, 404, { error: 'Session not found' });

      return json(res, 200, { session: data });
    }

    const { data, error } = await admin
      .from('pitch_sessions')
      .select('*')
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
