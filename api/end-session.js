/* global process */
import OpenAI from 'openai'
import { createClient } from '@supabase/supabase-js'

const BEY_API = 'https://api.bey.dev/v1'

function normalizeClientTranscript(transcript) {
  if (Array.isArray(transcript)) {
    return transcript
      .map((entry) =>
        typeof entry === 'string' ? entry : JSON.stringify(entry, null, 2),
      )
      .join('\n')
  }
  return String(transcript || '')
}

/** @param {string | null | undefined} agentId */
async function findLatestCallForAgent(agentId) {
  const apiKey = process.env.BEYOND_PRESENCE_API_KEY
  if (!apiKey?.trim() || !agentId?.trim()) {
    return null
  }

  const maxPages = 10
  let cursor = null

  for (let page = 0; page < maxPages; page += 1) {
    const url = new URL(`${BEY_API}/calls`)
    url.searchParams.set('limit', '50')
    if (cursor) url.searchParams.set('cursor', cursor)

    const res = await fetch(url.toString(), {
      headers: { 'x-api-key': apiKey },
    })

    if (!res.ok) {
      const t = await res.text().catch(() => '')
      console.warn('[end-session] list calls failed', res.status, t)
      break
    }

    const payload = await res.json().catch(() => null)
    const data = Array.isArray(payload?.data) ? payload.data : []

    const forAgent = data.filter((c) => c?.agent_id === agentId)
    if (forAgent.length > 0) {
      forAgent.sort(
        (a, b) =>
          new Date(b.started_at).getTime() - new Date(a.started_at).getTime(),
      )
      return forAgent[0]
    }

    if (!payload?.has_more || !payload?.next_cursor) {
      break
    }
    cursor = payload.next_cursor
  }

  return null
}

/** @param {string} callId */
async function fetchCallMessages(callId) {
  const apiKey = process.env.BEYOND_PRESENCE_API_KEY
  if (!apiKey?.trim() || !callId) {
    return []
  }

  const res = await fetch(`${BEY_API}/calls/${callId}/messages`, {
    headers: { 'x-api-key': apiKey },
  })

  if (!res.ok) {
    const t = await res.text().catch(() => '')
    console.warn('[end-session] list messages failed', res.status, t)
    return []
  }

  const data = await res.json().catch(() => [])
  return Array.isArray(data) ? data : []
}

/**
 * @param {unknown} transcript from client
 * @returns {{ transcript_text: string, transcript_json: unknown | null, bey_call_id: string | null }}
 */
async function resolveTranscript(agentId, transcript) {
  const clientText = normalizeClientTranscript(transcript)
  let transcriptJson = null
  if (Array.isArray(transcript)) {
    transcriptJson = transcript
  }

  try {
    const call = await findLatestCallForAgent(agentId)
    if (!call?.id) {
      return {
        transcript_text: clientText,
        transcript_json: transcriptJson,
        bey_call_id: null,
      }
    }

    const messages = await fetchCallMessages(call.id)
    if (!messages.length) {
      return {
        transcript_text: clientText,
        transcript_json: transcriptJson,
        bey_call_id: call.id,
      }
    }

    const lines = messages.map((m) => `${m.sender}: ${m.message}`).join('\n')

    return {
      transcript_text: lines.trim() || clientText,
      transcript_json: messages,
      bey_call_id: call.id,
    }
  } catch (err) {
    console.warn('[end-session] Beyond transcript fetch failed', err)
    return {
      transcript_text: clientText,
      transcript_json: transcriptJson,
      bey_call_id: null,
    }
  }
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
 * Vercel Serverless — POST /api/end-session
 * @param {import('@vercel/node').VercelRequest} req
 * @param {import('@vercel/node').VercelResponse} res
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' })
  }

  try {
    const {
      transcript,
      agent_id,
      scenario_type,
      duration_seconds,
    } = typeof req.body === 'string' ? JSON.parse(req.body) : req.body

    const {
      transcript_text: mergedTranscriptText,
      transcript_json,
      bey_call_id,
    } = await resolveTranscript(agent_id, transcript)

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })

    const gradePayload =
      mergedTranscriptText.trim() ||
      '(No transcript text captured — infer limited feedback.)'

    const prompt = `Grade this presentation transcript. Output ONLY a valid JSON object with these exact keys:
filler_word_count (number — count um uh like basically you know),
pacing_score (number 1-10),
clarity_score (number 1-10),
top_3_improvements (array of 3 specific strings referencing what was actually said),
overall_score (number 0-100),
critical_feedback (string — 2-3 sentences of direct specific feedback referencing the transcript)
Transcript: ${gradePayload}`

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      response_format: { type: 'json_object' },
      messages: [{ role: 'user', content: prompt }],
    })

    const raw = completion.choices?.[0]?.message?.content
    const grades = JSON.parse(raw)

    const supabase = createClient(
      process.env.VITE_SUPABASE_URL,
      process.env.VITE_SUPABASE_ANON_KEY,
    )

    const summarySlice = mergedTranscriptText.slice(0, 500)

    const { error } = await supabase.from('pitch_sessions').insert({
      user_id: 'demo-user-1',
      scenario_type,
      document_summary: summarySlice,
      duration_seconds,
      filler_word_count: grades.filler_word_count,
      critical_feedback: grades.critical_feedback,
      overall_score: grades.overall_score,
      is_active: true,
      transcript_text: mergedTranscriptText || null,
      transcript_json: transcript_json ?? null,
      bey_call_id: bey_call_id ?? null,
    })

    if (error) {
      console.error('[end-session] Supabase insert failed', error)
      await deleteAgentAwait(agent_id)
      throw new Error(error.message)
    }

    const { deleted, status } = await deleteAgentAwait(agent_id)

    return res.status(200).json({
      success: true,
      grades,
      agent_deleted: deleted,
      ...(typeof status === 'number' ? { agent_delete_status: status } : {}),
      ...(bey_call_id ? { bey_call_id } : {}),
    })
  } catch (err) {
    console.error('end-session failed', err)
    return res.status(500).json({
      success: false,
      error: err?.message || 'Could not end session',
    })
  }
}
