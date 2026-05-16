/* global process */
const BEY_API = 'https://api.bey.dev/v1'

/**
 * Normalize Beyond Presence "create call" JSON into connection fields.
 * @param {unknown} payload
 */
function extractCallCredentials(payload) {
  if (!payload || typeof payload !== 'object') {
    return { call_id: null, livekit_url: null, livekit_token: null }
  }
  const root = /** @type {Record<string, unknown>} */ (payload)
  const nested =
    root.data && typeof root.data === 'object'
      ? /** @type {Record<string, unknown>} */ (root.data)
      : root

  const call_id =
    (typeof nested.id === 'string' && nested.id) ||
    (typeof nested.call_id === 'string' && nested.call_id) ||
    null

  const livekit =
    nested.livekit && typeof nested.livekit === 'object'
      ? /** @type {Record<string, unknown>} */ (nested.livekit)
      : null

  const livekit_url =
    (typeof nested.livekit_url === 'string' && nested.livekit_url) ||
    (livekit && typeof livekit.url === 'string' && livekit.url) ||
    (typeof nested.url === 'string' && nested.url) ||
    null

  const livekit_token =
    (typeof nested.livekit_token === 'string' && nested.livekit_token) ||
    (livekit && typeof livekit.token === 'string' && livekit.token) ||
    (typeof nested.token === 'string' && nested.token) ||
    (typeof nested.access_token === 'string' && nested.access_token) ||
    null

  return { call_id, livekit_url, livekit_token }
}

/**
 * Vercel Serverless — POST /api/start-call
 *
 * Proxies Beyond Presence POST /v1/calls so the browser never sees the API key.
 *
 * Body: { agent_id: string, tags?: Record<string, string> }
 * Returns: { success, call_id, livekit_url, livekit_token }
 *
 * @param {import('@vercel/node').VercelRequest} req
 * @param {import('@vercel/node').VercelResponse} res
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' })
  }

  try {
    const apiKey = process.env.BEYOND_PRESENCE_API_KEY
    if (!apiKey?.trim()) {
      return res.status(500).json({
        success: false,
        error: 'Missing BEYOND_PRESENCE_API_KEY',
      })
    }

    let body = {}
    try {
      body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body ?? {}
    } catch {
      return res.status(400).json({ success: false, error: 'Invalid JSON body' })
    }

    const agentId =
      typeof body.agent_id === 'string' ? body.agent_id.trim() : ''
    if (!agentId) {
      return res.status(400).json({ success: false, error: 'agent_id is required' })
    }

    const requestBody = {
      agent_id: agentId,
      ...(body.tags &&
      typeof body.tags === 'object' &&
      !Array.isArray(body.tags)
        ? { tags: body.tags }
        : {}),
    }

    const response = await fetch(`${BEY_API}/calls`, {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    })

    const payload = await response.json().catch(() => null)
    if (!response.ok) {
      const extra =
        payload && typeof payload === 'object'
          ? JSON.stringify(payload)
          : String(payload ?? '')
      console.error('[start-call] Beyond Presence failed', response.status, extra)
      const errPayload =
        payload && typeof payload === 'object'
          ? /** @type {{ error?: { message?: string } }; message?: string }} */ (
              payload
            )
          : null
      const messageFromApi =
        (typeof errPayload?.error?.message === 'string' &&
          errPayload.error.message) ||
        (typeof errPayload?.message === 'string' && errPayload.message) ||
        null

      return res.status(response.status >= 400 ? response.status : 500).json({
        success: false,
        error:
          messageFromApi || `Beyond Presence call failed (${response.status})`,
      })
    }

    const { call_id, livekit_url, livekit_token } = extractCallCredentials(payload)
    if (!livekit_url || !livekit_token) {
      console.error('[start-call] Unexpected response shape', payload)
      return res.status(502).json({
        success: false,
        error: 'Beyond Presence response missing LiveKit credentials',
      })
    }

    return res.status(200).json({
      success: true,
      call_id,
      livekit_url,
      livekit_token,
    })
  } catch (err) {
    console.error('start-call failed', err)
    return res.status(500).json({
      success: false,
      error: err?.message || 'Could not start call',
    })
  }
}
