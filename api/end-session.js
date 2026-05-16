/* global process */
import OpenAI from 'openai'
import {
  getSupabaseAdmin,
  getUserFromRequest,
  normalizeScenarioType,
} from './lib/supabaseAdmin.js'

const BEY_API = 'https://api.bey.dev/v1'

const MAX_TRANSCRIPT_CHARS = 120_000
const BEY_FETCH_RETRIES = 5
const BEY_FETCH_DELAY_MS = 1200

/**
 * @param {number} ms
 */
function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

/**
 * @param {string | null | undefined} agentId
 * @returns {Promise<{ deleted: boolean, status?: number }>}
 */
async function deleteAgentAwait(agentId) {
  if (!agentId?.trim()) {
    return { deleted: false }
  }
  const apiKey = process.env.BEYOND_PRESENCE_API_KEY
  if (!apiKey?.trim()) {
    return { deleted: false }
  }

  try {
    const res = await fetch(`${BEY_API}/agents/${agentId}`, {
      method: 'DELETE',
      headers: { 'x-api-key': apiKey },
    })
    if (!res.ok) {
      const t = await res.text().catch(() => '')
      console.warn('[end-session] agent delete failed', res.status, t)
    }
    return { deleted: res.ok, status: res.status }
  } catch (err) {
    console.error('[end-session] Beyond Presence delete failed', err)
    return { deleted: false }
  }
}

/**
 * @param {string} apiKey
 * @param {string | null} cursor
 * @returns {Promise<{ data: Array<Record<string, unknown>>; has_more?: boolean; next_cursor?: string | null }>}
 */
async function listCallsPage(apiKey, cursor) {
  const qs = new URLSearchParams({ limit: '50' })
  if (cursor) qs.set('cursor', cursor)

  const res = await fetch(`${BEY_API}/calls?${qs}`, {
    headers: { 'x-api-key': apiKey },
  })
  const text = await res.text()
  let json = {}
  try {
    json = text ? JSON.parse(text) : {}
  } catch {
    throw new Error(
      `Beyond list calls: invalid JSON (${res.status}): ${text.slice(0, 200)}`,
    )
  }
  if (!res.ok) {
    const msg =
      json?.detail?.[0]?.msg ||
      json?.message ||
      text ||
      `HTTP ${res.status}`
    throw new Error(`Beyond list calls failed: ${msg}`)
  }
  return {
    data: Array.isArray(json.data) ? json.data : [],
    has_more: Boolean(json.has_more),
    next_cursor: json.next_cursor ?? null,
  }
}

/**
 * @param {Array<Record<string, unknown>>} calls
 * @param {string} agentId
 */
function pickLatestCallForAgent(calls, agentId) {
  const target = String(agentId).trim()
  const mine = calls.filter((c) => String(c?.agent_id ?? '') === target)
  if (!mine.length) return null

  mine.sort((a, b) => {
    const tb = new Date(
      String(b?.ended_at || b?.started_at || 0),
    ).getTime()
    const ta = new Date(
      String(a?.ended_at || a?.started_at || 0),
    ).getTime()
    return tb - ta
  })

  const ended = mine.find((c) => c?.ended_at != null && c.ended_at !== '')
  return ended ?? mine[0]
}

/**
 * @param {string} apiKey
 * @param {string} callId
 * @returns {Promise<Array<{ message: string; sent_at: string; sender: string }>>}
 */
async function fetchCallMessages(apiKey, callId) {
  const res = await fetch(`${BEY_API}/calls/${encodeURIComponent(callId)}/messages`, {
    headers: { 'x-api-key': apiKey },
  })
  const text = await res.text()
  let json = []
  try {
    json = text ? JSON.parse(text) : []
  } catch {
    throw new Error(
      `Beyond call messages: invalid JSON (${res.status}): ${text.slice(0, 200)}`,
    )
  }
  if (!res.ok) {
    const obj = Array.isArray(json) ? {} : json
    const msg =
      obj?.detail?.[0]?.msg ||
      obj?.message ||
      text ||
      `HTTP ${res.status}`
    throw new Error(`Beyond call messages failed: ${msg}`)
  }
  return Array.isArray(json) ? json : []
}

/**
 * @param {Array<{ message: string; sent_at: string; sender: string }>} messages
 * @returns {string}
 */
function formatTranscriptFromMessages(messages) {
  const sorted = [...messages].sort(
    (a, b) =>
      new Date(String(a.sent_at || 0)).getTime() -
      new Date(String(b.sent_at || 0)).getTime(),
  )
  const lines = []
  for (const m of sorted) {
    const role =
      m.sender === 'user' ? 'User' : m.sender === 'ai' ? 'AI' : String(m.sender || '?')
    const text = String(m.message ?? '').trim()
    if (!text) continue
    lines.push(`${role}: ${text}`)
  }
  return lines.join('\n')
}

/**
 * @param {string} raw
 */
function isPlaceholderTranscript(raw) {
  const t = String(raw ?? '').trim()
  if (!t) return true
  if (/^no transcript provided\b/i.test(t)) return true
  if (t.toLowerCase() === 'no transcript provided for this session.') return true
  return false
}

/**
 * @param {string} apiKey
 * @param {string} agentId
 * @returns {Promise<{ transcript: string; callId: string; messageCount: number }>}
 */
async function fetchBeyondTranscriptForAgent(apiKey, agentId) {
  let lastErr = /** @type {Error | null} */ (null)

  for (let attempt = 0; attempt < BEY_FETCH_RETRIES; attempt++) {
    try {
      const allCalls = []
      let cursor = null
      for (let page = 0; page < 12; page++) {
        const { data, has_more, next_cursor } = await listCallsPage(apiKey, cursor)
        allCalls.push(...data)
        if (!has_more || !next_cursor) break
        cursor = next_cursor
      }

      const call = pickLatestCallForAgent(allCalls, agentId)
      if (!call?.id) {
        lastErr = new Error('No Beyond Presence call found for this agent yet.')
        await sleep(BEY_FETCH_DELAY_MS)
        continue
      }

      const callId = String(call.id)
      const msgs = await fetchCallMessages(apiKey, callId)
      const transcript = formatTranscriptFromMessages(msgs)

      if (!transcript.trim()) {
        lastErr = new Error(
          'Beyond Presence returned a call but no messages yet — transcripts may still be processing.',
        )
        await sleep(BEY_FETCH_DELAY_MS)
        continue
      }

      return {
        transcript: transcript.slice(0, MAX_TRANSCRIPT_CHARS),
        callId,
        messageCount: msgs.length,
      }
    } catch (err) {
      lastErr = err instanceof Error ? err : new Error(String(err))
      console.warn('[end-session] Beyond transcript attempt failed', lastErr.message)
      await sleep(BEY_FETCH_DELAY_MS)
    }
  }

  throw lastErr || new Error('Could not retrieve Beyond Presence transcript.')
}

/**
 * @param {unknown} n
 * @param {number} lo
 * @param {number} hi
 */
function clampScore(n, lo, hi) {
  const x = Math.round(Number(n))
  if (Number.isNaN(x)) return lo
  return Math.max(lo, Math.min(hi, x))
}

/**
 * @param {import('@supabase/supabase-js').SupabaseClient} admin
 * @param {Record<string, unknown>} baseRow user_id, scenario_type, duration_seconds, filler_word_count, critical_feedback, overall_score; optional transcript_* fields
 * @param {Record<string, unknown>} grades
 */
async function insertPitchSession(admin, baseRow, grades) {
  /** @param {Record<string, unknown>} row */
  const withoutTranscriptMeta = (row) => {
    const {
      transcript_text: _t,
      bey_call_id: _b,
      transcript_source: _s,
      transcript_message_count: _m,
      ...rest
    } = row
    return rest
  }

  /** @param {Record<string, unknown>} row */
  const baseMinimal = (row) => ({
    user_id: row.user_id,
    scenario_type: row.scenario_type,
    duration_seconds: row.duration_seconds,
    filler_word_count: row.filler_word_count,
    critical_feedback: row.critical_feedback,
    overall_score: row.overall_score,
  })

  const enrichScores = (row) => ({
    ...row,
    clarity_score: clampScore(grades.clarity_score ?? grades.clarity, 0, 100),
    confidence_score: clampScore(grades.confidence_score ?? grades.confidence, 0, 100),
    evidence_score: clampScore(grades.evidence_score ?? grades.evidence, 0, 100),
    structure_score: clampScore(grades.structure_score ?? grades.structure, 0, 100),
    technical_depth_score: clampScore(
      grades.technical_depth_score ?? grades.technical_depth,
      0,
      100,
    ),
    objection_handling_score: clampScore(
      grades.objection_handling_score ?? grades.objection_handling,
      0,
      100,
    ),
    strengths:
      typeof grades.strengths === 'string' && grades.strengths.trim()
        ? grades.strengths.trim()
        : null,
    weaknesses:
      typeof grades.weaknesses === 'string' && grades.weaknesses.trim()
        ? grades.weaknesses.trim()
        : null,
    missed_opportunities:
      typeof grades.missed_opportunities === 'string' &&
      grades.missed_opportunities.trim()
        ? grades.missed_opportunities.trim()
        : null,
    next_steps:
      typeof grades.next_steps === 'string' && grades.next_steps.trim()
        ? grades.next_steps.trim()
        : null,
  })

  const attempts = [
    enrichScores({ ...baseRow }),
    enrichScores(withoutTranscriptMeta({ ...baseRow })),
    enrichScores(baseMinimal({ ...baseRow })),
    baseMinimal({ ...baseRow }),
  ]

  /** @param {string} msg */
  const isMissingColumn = (msg) =>
    /column .* does not exist/i.test(msg) ||
    /Could not find the .* column/i.test(msg)

  let lastError = null
  for (let i = 0; i < attempts.length; i++) {
    const payload = attempts[i]
    const { data, error } = await admin
      .from('pitch_sessions')
      .insert(payload)
      .select('*')
      .single()

    if (!error && data) {
      if (i > 0) {
        console.warn(
          `[end-session] Insert succeeded using fallback tier ${i}. Run supabase/pitch_sessions_extended.sql and supabase/pitch_sessions_transcript.sql for full debrief columns.`,
        )
      }
      return { session: data, error: null }
    }
    lastError = error
    const msg = String(error?.message || '')
    if (!isMissingColumn(msg)) {
      return { session: null, error }
    }
  }

  return { session: null, error: lastError }
}

/**
 * Vercel Serverless — POST /api/end-session
 *
 * Requires `Authorization: Bearer <supabase_access_token>` so the inserted
 * row is attributed to the real signed-in user (and shows up in History).
 *
 * Body: { transcript_text?, agent_id?, agent_id_2?, scenario_type, duration_seconds, mode_id? }
 * Returns: { success, grades, session, agent_deleted, transcript_meta? }
 *
 * @param {import('@vercel/node').VercelRequest} req
 * @param {import('@vercel/node').VercelResponse} res
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' })
  }

  try {
    const auth = await getUserFromRequest(req)
    if (auth.error) {
      return res.status(auth.status).json({ success: false, error: auth.error })
    }

    let body = {}
    try {
      body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body ?? {}
    } catch {
      return res
        .status(400)
        .json({ success: false, error: 'Invalid JSON body' })
    }

    const {
      transcript_text,
      agent_id,
      agent_id_2,
      scenario_type,
      mode_id,
      duration_seconds,
    } = body

    const scenarioType = normalizeScenarioType(scenario_type, mode_id)
    const duration = Math.max(1, Math.round(Number(duration_seconds) || 0))

    const transcriptTextRaw =
      typeof transcript_text === 'string' ? transcript_text : ''
    const beyKey = process.env.BEYOND_PRESENCE_API_KEY?.trim()

    /** @type {{ source: string; bey_call_id?: string; message_count?: number }} */
    let transcriptMeta = { source: 'client' }
    let mergedTranscriptText = transcriptTextRaw.trim()

    if (isPlaceholderTranscript(mergedTranscriptText) && agent_id?.trim() && beyKey) {
      const fetched = await fetchBeyondTranscriptForAgent(beyKey, String(agent_id))
      mergedTranscriptText = fetched.transcript
      transcriptMeta = {
        source: 'beyond',
        bey_call_id: fetched.callId,
        message_count: fetched.messageCount,
      }
    } else if (isPlaceholderTranscript(mergedTranscriptText) && agent_id?.trim() && !beyKey) {
      return res.status(500).json({
        success: false,
        error:
          'Cannot load Beyond Presence transcript: BEYOND_PRESENCE_API_KEY is not set on the server.',
      })
    }

    if (!mergedTranscriptText.trim()) {
      mergedTranscriptText =
        'No transcript provided for this session. Grade conservatively based on duration and scenario only.'
      transcriptMeta = { source: 'none' }
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      temperature: 0.2,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content:
            'You are a professional presentation coach grading a defense panel session. Output valid JSON only. No markdown, no backticks.',
        },
        {
          role: 'user',
          content: `Grade this presentation session. Output ONLY a valid JSON object with exactly these keys:

"filler_word_count": a number. Count every instance in the USER lines of: um, uh, like, basically, you know, sort of, kind of, right, so yeah.

"overall_score": a number from 0 to 100.

"critical_feedback": a string of exactly 2 to 3 sentences. Be direct and specific. Reference exact things said in the transcript when available.

"clarity_score": integer 0-100 — how clear and structured the USER answers were.

"confidence_score": integer 0-100 — presence and decisiveness under pressure.

"evidence_score": integer 0-100 — use of specifics, metrics, and document-backed claims.

"structure_score": integer 0-100 — logical flow and answering the question asked.

"technical_depth_score": integer 0-100 — depth of technical explanation when relevant.

"objection_handling_score": integer 0-100 — handling pushback and follow-ups.

"strengths": a string with 3 to 5 bullet lines. Each line starts with "- ". Reference specific USER statements when possible.

"weaknesses": a string with 3 to 5 bullet lines starting with "- ".

"missed_opportunities": a string with 2 to 4 bullet lines starting with "- ".

"next_steps": a string with 3 bullet lines starting with "- " with concrete practice tasks.

"top_3_improvements": an array of exactly 3 strings. Each must reference something specific from the USER lines if any exist; otherwise note the limitation briefly.

Transcript (User / AI lines, chronological):
${mergedTranscriptText}`,
        },
      ],
    })

    const raw = completion.choices?.[0]?.message?.content
    const grades = JSON.parse(raw)

    const admin = getSupabaseAdmin()

    const baseRow = {
      user_id: auth.user.id,
      scenario_type: scenarioType,
      duration_seconds: duration,
      filler_word_count: clampScore(grades.filler_word_count, 0, 10_000),
      critical_feedback:
        typeof grades.critical_feedback === 'string' && grades.critical_feedback.trim()
          ? grades.critical_feedback.trim()
          : 'Session completed.',
      overall_score: clampScore(grades.overall_score, 0, 100),
    }

    const rowWithMeta = {
      ...baseRow,
      ...(transcriptMeta.source === 'beyond' && transcriptMeta.bey_call_id
        ? {
            transcript_text: mergedTranscriptText.slice(0, MAX_TRANSCRIPT_CHARS),
            bey_call_id: transcriptMeta.bey_call_id,
            transcript_source: 'beyond',
            transcript_message_count: transcriptMeta.message_count ?? null,
          }
        : {}),
    }

    const { session, error } = await insertPitchSession(admin, rowWithMeta, grades)

    if (error || !session) {
      console.error('[end-session] Supabase insert failed', error)
      await deleteAgentAwait(agent_id)
      await deleteAgentAwait(agent_id_2)
      throw new Error(error?.message || 'Could not save session')
    }

    const { deleted, status } = await deleteAgentAwait(agent_id)
    const { deleted: deleted2, status: status2 } =
      await deleteAgentAwait(agent_id_2)

    return res.status(200).json({
      success: true,
      grades,
      session,
      agent_deleted: deleted,
      agent_deleted_2: deleted2,
      transcript_meta: {
        ...transcriptMeta,
        transcript_chars: mergedTranscriptText.length,
      },
      ...(typeof status === 'number' ? { agent_delete_status: status } : {}),
      ...(typeof status2 === 'number'
        ? { agent_delete_status_2: status2 }
        : {}),
    })
  } catch (err) {
    console.error('end-session failed', err)
    return res.status(500).json({
      success: false,
      error: err?.message || 'Could not end session',
    })
  }
}
