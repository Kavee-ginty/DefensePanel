/* global process */
import OpenAI from 'openai'
import { createClient } from '@supabase/supabase-js'

function normalizeTranscript(transcript) {
  if (Array.isArray(transcript)) {
    return transcript
      .map((entry) =>
        typeof entry === 'string' ? entry : JSON.stringify(entry, null, 2),
      )
      .join('\n')
  }
  return String(transcript || '')
}

function deleteAgent(agentId) {
  if (!agentId) return
  void fetch(`https://api.bey.dev/v1/agents/${agentId}`, {
    method: 'DELETE',
    headers: {
      'x-api-key': process.env.BEYOND_PRESENCE_API_KEY,
    },
  }).catch((err) => console.error('Beyond Presence delete failed', err))
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
      sme_agent_id,
      evaluator_agent_id,
      scenario_type,
      duration_seconds,
    } = typeof req.body === 'string' ? JSON.parse(req.body) : req.body

    const transcriptText = normalizeTranscript(transcript)

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })

    const prompt = `Grade this presentation transcript. Output ONLY a valid JSON object with these exact keys:
filler_word_count (number — count um uh like basically you know),
pacing_score (number 1-10),
clarity_score (number 1-10),
top_3_improvements (array of 3 specific strings referencing what was actually said),
overall_score (number 0-100),
critical_feedback (string — 2-3 sentences of direct specific feedback referencing the transcript)
Transcript: ${transcriptText}`

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      response_format: { type: 'json_object' },
      messages: [{ role: 'user', content: prompt }],
    })

    const raw = completion.choices?.[0]?.message?.content
    const grades = JSON.parse(raw)

    deleteAgent(sme_agent_id)
    deleteAgent(evaluator_agent_id)

    const supabase = createClient(
      process.env.VITE_SUPABASE_URL,
      process.env.VITE_SUPABASE_ANON_KEY,
    )

    const { error } = await supabase.from('pitch_sessions').insert({
      user_id: 'demo-user-1',
      scenario_type,
      document_summary: transcriptText.slice(0, 500),
      duration_seconds,
      filler_word_count: grades.filler_word_count,
      critical_feedback: grades.critical_feedback,
      overall_score: grades.overall_score,
      is_active: true,
    })

    if (error) {
      throw new Error(error.message)
    }

    return res.status(200).json({ success: true, grades })
  } catch (err) {
    console.error('end-session failed', err)
    return res.status(500).json({
      success: false,
      error: err?.message || 'Could not end session',
    })
  }
}
