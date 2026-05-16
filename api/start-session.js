/* global process */
const BEYOND_AGENTS_URL = 'https://api.bey.dev/v1/agents'

async function createAgent({ name, system_prompt }) {
  const response = await fetch(BEYOND_AGENTS_URL, {
    method: 'POST',
    headers: {
      'x-api-key': process.env.BEYOND_PRESENCE_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name, system_prompt }),
  })

  const payload = await response.json().catch(() => null)
  if (!response.ok) {
    console.error('Beyond Presence agent creation failed', payload)
    throw new Error(
      payload?.error?.message ||
        payload?.message ||
        `Beyond Presence failed with ${response.status}`,
    )
  }

  return payload
}

/**
 * Vercel Serverless — POST /api/start-session
 * @param {import('@vercel/node').VercelRequest} req
 * @param {import('@vercel/node').VercelResponse} res
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' })
  }

  try {
    const { sme_system_prompt, evaluator_system_prompt } =
      typeof req.body === 'string' ? JSON.parse(req.body) : req.body

    if (!sme_system_prompt || !evaluator_system_prompt) {
      throw new Error('Both SME and evaluator prompts are required')
    }

    const now = Date.now()
    const [sme, evaluator] = await Promise.all([
      createAgent({
        name: `sme-${now}`,
        system_prompt: sme_system_prompt,
      }),
      createAgent({
        name: `evaluator-${now}`,
        system_prompt: evaluator_system_prompt,
      }),
    ])

    return res.status(200).json({
      success: true,
      sme_agent_id: sme.id,
      evaluator_agent_id: evaluator.id,
    })
  } catch (err) {
    console.error('start-session failed', err)
    return res.status(500).json({
      success: false,
      error: err?.message || 'Could not start session',
    })
  }
}
