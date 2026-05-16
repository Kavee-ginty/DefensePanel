import * as sessionsDb from './sessionsDb.js';

export const { chartFromSessions } = sessionsDb;

/** Use Vercel /api in production; direct Supabase + RLS in local dev. */
function useApiRoutes() {
  if (import.meta.env.PROD) return true;
  return import.meta.env.VITE_USE_API_SESSIONS === 'true';
}

async function request(path, accessToken, options = {}) {
  const res = await fetch(path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
      ...options.headers,
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return data;
}

export function fetchSessions(accessToken) {
  if (!useApiRoutes()) {
    return sessionsDb.listSessions();
  }
  return request('/api/sessions', accessToken, { method: 'GET' });
}

export function fetchSession(id, accessToken) {
  if (!useApiRoutes()) {
    return sessionsDb.getSession(id);
  }
  return request(`/api/sessions/${id}`, accessToken, { method: 'GET' });
}

export async function setSessionBookmark(sessionId, bookmarked, accessToken) {
  if (!sessionId) throw new Error('Session id required');
  if (!accessToken) throw new Error('Not signed in');
  if (!useApiRoutes()) {
    return sessionsDb.updateSessionBookmark(sessionId, bookmarked);
  }
  return request(`/api/sessions/${sessionId}`, accessToken, {
    method: 'PATCH',
    body: JSON.stringify({ bookmarked }),
  });
}

export async function createSession(payload, accessToken, userId) {
  if (!useApiRoutes()) {
    const { session } = await sessionsDb.insertSession(payload, userId);
    return { session, scoreHistory: [] };
  }
  return request('/api/sessions', accessToken, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
