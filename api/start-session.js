/* global process */
import { formidable } from 'formidable'

const BEYOND_AGENTS_URL = 'https://api.bey.dev/v1/agents'

const DEV_LOGGING =
  (process.env.VERCEL_ENV && process.env.VERCEL_ENV !== 'production') ||
  process.env.NODE_ENV !== 'production'

/** @param {string} label @param {unknown} agent */
function logAgentKeys(label, agent) {
  if (!DEV_LOGGING) return
  if (agent && typeof agent === 'object') {
    console.log(`[start-session] ${label} Bey agent keys:`, Object.keys(agent))
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
}

function parseForm(req) {
  const form = formidable({
    maxFiles: 1,
    maxFileSize: 10 * 1024 * 1024,
  })

  return new Promise((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) reject(err)
      else resolve({ fields, files })
    })
  })
}

/** @param {import('formidable').Fields} fields */
function getField(fields, name) {
  const v = fields[name]
  if (Array.isArray(v)) return v[0]?.toString() ?? ''
  return v?.toString() ?? ''
}

async function createAgent({ avatar_id, name, system_prompt, greeting }) {
  const body = { avatar_id, name, system_prompt }
  if (greeting && String(greeting).trim()) {
    body.greeting = String(greeting).trim()
  }

  const response = await fetch(BEYOND_AGENTS_URL, {
    method: 'POST',
    headers: {
      'x-api-key': process.env.BEYOND_PRESENCE_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  const payload = await response.json().catch(() => null)
  if (!response.ok) {
    console.error('Beyond Presence agent creation failed', payload)
    const extra =
      payload && typeof payload === 'object'
        ? JSON.stringify(payload)
        : String(payload ?? '')
    throw new Error(
      payload?.error?.message ||
        payload?.message ||
        (extra !== '{}' && extra !== 'null'
          ? `Beyond Presence ${response.status}: ${extra}`
          : `Beyond Presence failed with ${response.status}`),
    )
  }

  return payload
}

/**
 * @param {import('@vercel/node').VercelRequest} req
 * @param {import('@vercel/node').VercelResponse} res
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' })
  }

  try {
    const contentType = req.headers['content-type'] || ''
    let system_prompt = ''
    let greeting = ''
    let name = `agent-${Date.now()}`

    if (contentType.includes('multipart/form-data')) {
      const { fields } = await parseForm(req)
      system_prompt = getField(fields, 'system_prompt')
      greeting = getField(fields, 'greeting')
      const nameField = getField(fields, 'name')
      if (nameField) name = nameField
    } else {
      throw new Error('Expected multipart form data for /api/start-session')
    }

    if (!system_prompt || !String(system_prompt).trim()) {
      throw new Error('system_prompt is required')
    }

    const avatar_id = process.env.BEY_AVATAR_ID
    if (!avatar_id) {
      throw new Error(
        'Missing BEY_AVATAR_ID. Beyond Presence requires avatar_id when creating agents.',
      )
    }

    const agentData = await createAgent({
      avatar_id,
      name,
      system_prompt: String(system_prompt).trim(),
      greeting,
    })

    logAgentKeys('agent', agentData)

    const agent_id = agentData?.id
    if (!agent_id) {
      throw new Error('Beyond Presence response missing agent id')
    }

    const agent_embed_url = `https://bey.chat/embed/${agentData.id}`
    const agent_name =
      agentData?.name != null && agentData?.name !== ''
        ? agentData.name
        : name

    return res.status(200).json({
      success: true,
      agent_id,
      agent_embed_url,
      agent_name,
    })
  } catch (err) {
    console.error('start-session failed', err)
    return res.status(500).json({
      success: false,
      error: err?.message || 'Could not start session',
    })
  }
}
