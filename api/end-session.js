/* global process */
import OpenAI from 'openai'
import { createClient } from '@supabase/supabase-js'

const BEY_API = 'https://api.bey.dev/v1'

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
      transcript_text,
      agent_id,
      scenario_type,
      duration_seconds,
    } = typeof req.body === 'string' ? JSON.parse(req.body) : req.body

    const transcriptTextRaw =
      typeof transcript_text === 'string' ? transcript_text : ''
    const mergedTranscriptText =
      transcriptTextRaw.trim() !== ''
        ? transcriptTextRaw
        : 'No transcript provided for this session.'

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

"filler_word_count": a number. Count every instance of: um, uh, like, basically, you know, sort of, kind of, right, so yeah.

"pacing_score": a number from 1 to 10. 1 is extremely rushed, 10 is perfectly paced.

"clarity_score": a number from 1 to 10. 1 is completely unclear, 10 is crystal clear.

"overall_score": a number from 0 to 100.

"top_3_improvements": an array of exactly 3 strings. Each string must reference something specific that was actually said in the transcript. No generic advice.

"critical_feedback": a string of exactly 2 to 3 sentences. Be direct and specific. Reference exact things said in the transcript. No generic encouragement.

Transcript to grade:
${mergedTranscriptText}`,
        },
      ],
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
      transcript_json: null,
      bey_call_id: null,
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
    })
  } catch (err) {
    console.error('end-session failed', err)
    return res.status(500).json({
      success: false,
      error: err?.message || 'Could not end session',
    })
  }
}
