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

/** @param {unknown} s */
function preview50(s) {
  const str = typeof s === 'string' ? s : String(s ?? '')
  return str.slice(0, 50)
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

async function createAgent({
  avatar_id,
  agentName,
  system_prompt,
  conversation_flow,
  starting_script,
  greeting,
  max_session_length,
}) {
  const beyondPresenceBody = {
    avatar_id,
    name: agentName,
    system_prompt,
    conversational_flow: conversation_flow,
    starting_script,
    greeting,
    max_session_length_minutes: max_session_length,
  }

  console.log('Creating agent with:', {
    system_prompt: preview50(system_prompt),
    conversational_flow: preview50(conversation_flow),
    starting_script: preview50(starting_script),
    greeting: preview50(greeting),
    max_session_length,
  })

  console.log('=== BEYOND PRESENCE REQUEST BODY ===')
  console.log(JSON.stringify(beyondPresenceBody, null, 2))

  const response = await fetch(BEYOND_AGENTS_URL, {
    method: 'POST',
    headers: {
      'x-api-key': process.env.BEYOND_PRESENCE_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(beyondPresenceBody),
  })

  console.log('=== BEYOND PRESENCE RAW RESPONSE ===')
  const rawText = await response.text()
  console.log(rawText)
  let beyondResponse
  try {
    beyondResponse = JSON.parse(rawText)
  } catch {
    beyondResponse = null
  }
  console.log(
    'Beyond Presence response:',
    JSON.stringify(beyondResponse, null, 2),
  )

  if (!response.ok) {
    console.error('Beyond Presence agent creation failed', beyondResponse)
    const extra =
      beyondResponse && typeof beyondResponse === 'object'
        ? JSON.stringify(beyondResponse)
        : String(beyondResponse ?? '')
    throw new Error(
      beyondResponse?.error?.message ||
        beyondResponse?.message ||
        (extra !== '{}' && extra !== 'null'
          ? `Beyond Presence ${response.status}: ${extra}`
          : `Beyond Presence failed with ${response.status}`),
    )
  }

  return beyondResponse
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
    /** Same as formData.get('...') || '' */
    let system_prompt = ''
    let greeting = ''
    let conversation_flow = ''
    let starting_script = ''
    let agentName = 'defense-panel-' + Date.now()
    let max_session_length = 5

    if (contentType.includes('multipart/form-data')) {
      const { fields } = await parseForm(req)
      system_prompt = getField(fields, 'system_prompt') || ''
      greeting = getField(fields, 'greeting') || ''
      conversation_flow = getField(fields, 'conversation_flow') || ''
      starting_script = getField(fields, 'starting_script') || ''
      agentName =
        getField(fields, 'name') || 'defense-panel-' + Date.now()
      max_session_length = parseInt(
        getField(fields, 'max_session_length') || '5',
        10,
      )
      if (!Number.isFinite(max_session_length)) {
        max_session_length = 5
      }
    } else {
      throw new Error('Expected multipart form data for /api/start-session')
    }

    console.log('=== INCOMING FORMDATA ===')
    console.log('system_prompt length:', (system_prompt || '').length)
    console.log('conversation_flow:', conversation_flow)
    console.log('starting_script:', starting_script)
    console.log('greeting:', greeting)
    console.log('max_session_length:', max_session_length)

    if (!system_prompt || !String(system_prompt).trim()) {
      throw new Error('system_prompt is required')
    }

    const avatar_id = process.env.BEY_AVATAR_ID
    if (!avatar_id) {
      throw new Error(
        'Missing BEY_AVATAR_ID. Beyond Presence requires avatar_id when creating agents.',
      )
    }

    const mergedSystemPrompt = [
      `[ROLE & OBJECTIVE]\n${String(system_prompt).trim()}`,
      conversation_flow
        ? `[CONVERSATIONAL FLOW]\n${conversation_flow}`
        : '',
    ]
      .filter(Boolean)
      .join('\n\n')

    const agentData = await createAgent({
      avatar_id,
      agentName,
      system_prompt: mergedSystemPrompt,
      conversation_flow,
      starting_script,
      greeting: starting_script || greeting,
      max_session_length,
    })

    logAgentKeys('agent', agentData)

    const agent_id = agentData?.id
    if (!agent_id) {
      throw new Error('Beyond Presence response missing agent id')
    }

    const chatOrigin = (process.env.BEY_CHAT_EMBED_ORIGIN || 'https://bey.chat')
      .replace(/\/$/, '')
    const agent_embed_url = `${chatOrigin}/${agent_id}`
    const agent_name =
      agentData?.name != null && agentData?.name !== ''
        ? agentData.name
        : agentName

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
