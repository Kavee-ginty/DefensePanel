/* global process */
import { formidable } from 'formidable'
import {
  composeAgentSystemPrompt,
  parseBriefingSetup,
} from './_lib/briefingPrompt.js'

const BEYOND_AGENTS_URL = 'https://api.bey.dev/v1/agents'

const DEV_LOGGING =
  (process.env.VERCEL_ENV && process.env.VERCEL_ENV !== 'production') ||
  process.env.NODE_ENV !== 'production'

/** @param {unknown} value */
function preview50(value) {
  const s = String(value ?? '')
  return s.length <= 50 ? s : `${s.slice(0, 50)}…`
}

/**
 * Beyond-facing merged role block + optional conversational flow (essentials.md).
 * @param {string} systemPrompt
 * @param {string} conversationFlow
 */
function mergeEssentialsRoleAndFlow(systemPrompt, conversationFlow) {
  const role = String(systemPrompt || '').trim()
  const flow = String(conversationFlow || '').trim()
  let out = `[ROLE & OBJECTIVE]\n${role}`
  if (flow) out += `\n\n[CONVERSATIONAL FLOW]\n${flow}`
  return out
}

/**
 * @param {string} rawMaxSessionLength
 * @param {ReturnType<typeof parseBriefingSetup>} briefingSetup
 */
function resolveMaxSessionMinutes(rawMaxSessionLength, briefingSetup) {
  const raw = String(rawMaxSessionLength ?? '').trim()
  if (raw) {
    const n = Number.parseInt(raw, 10)
    return Number.isFinite(n) && n > 0 ? n : 5
  }
  if (briefingSetup?.sessionMinutes != null) return briefingSetup.sessionMinutes
  return 5
}

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

/**
 * @param {Record<string, unknown>} body
 * @returns {Promise<unknown>}
 */
async function createAgentRequest(body) {
  if (DEV_LOGGING) {
    console.log(
      '[start-session] Beyond request body:',
      JSON.stringify(body, null, 2),
    )
  }

  const response = await fetch(BEYOND_AGENTS_URL, {
    method: 'POST',
    headers: {
      'x-api-key': process.env.BEYOND_PRESENCE_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  const rawText = await response.text()

  if (DEV_LOGGING) {
    const clipped =
      rawText.length > 4000 ? `${rawText.slice(0, 4000)}…` : rawText
    console.log(
      `[start-session] Beyond response status=${response.status} bytes=${rawText.length}`,
      clipped,
    )
  }

  /** @type {unknown} */
  let payload = null
  const trimmed = rawText.trim()
  if (trimmed) {
    try {
      payload = JSON.parse(trimmed)
    } catch {
      payload = { _nonJsonBody: true, raw: trimmed }
    }
  }

  if (!response.ok) {
    console.error(
      'Beyond Presence agent creation failed',
      payload ?? rawText ?? '(empty)',
    )

    let message = `Beyond Presence failed with ${response.status}`
    if (payload && typeof payload === 'object' && '_nonJsonBody' in payload) {
      const raw = /** @type {{ raw?: string }} */ (payload).raw
      if (raw) message = `Beyond Presence ${response.status}: ${raw}`
    } else if (payload && typeof payload === 'object') {
      const p = /** @type {{ error?: { message?: string }; message?: string }} */ (
        payload
      )
      message =
        p?.error?.message ||
        p?.message ||
        JSON.stringify(payload)
    } else if (typeof payload === 'string') {
      message = payload
    }

    const err = new Error(message)
    Object.assign(err, { status: response.status })
    throw err
  }

  if (DEV_LOGGING && payload && typeof payload === 'object') {
    console.log('[start-session] Beyond parsed keys:', Object.keys(payload))
  }

  return payload
}

/**
 * @param {{
 *   avatar_id: string
 *   name: string
 *   system_prompt: string
 *   greeting: string
 *   conversational_flow?: string
 *   starting_script?: string
 *   max_session_length_minutes?: number
 * }} opts
 */
async function createAgent(opts) {
  const {
    avatar_id,
    name,
    system_prompt,
    greeting,
    conversational_flow,
    starting_script,
    max_session_length_minutes,
  } = opts

  const baseBody = {
    avatar_id,
    name,
    system_prompt: String(system_prompt).trim(),
  }

  const cf = String(conversational_flow ?? '').trim()
  if (cf) baseBody.conversational_flow = cf

  const ss = String(starting_script ?? '').trim()
  if (ss) baseBody.starting_script = ss

  const greet = String(greeting ?? '').trim()
  if (greet) baseBody.greeting = greet

  if (
    typeof max_session_length_minutes === 'number' &&
    max_session_length_minutes > 0
  ) {
    try {
      return await createAgentRequest({
        ...baseBody,
        max_session_length_minutes,
      })
    } catch (err) {
      const status =
        err && typeof err === 'object' && 'status' in err
          ? /** @type {{ status: number }} */ (err).status
          : undefined
      if (status === 422) {
        console.warn(
          '[start-session] Retrying agent create without max_session_length_minutes (422)',
        )
        return await createAgentRequest(baseBody)
      }
      throw err
    }
  }

  return await createAgentRequest(baseBody)
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
    let name = `defense-panel-${Date.now()}`
    let briefingSetupRaw = ''
    let role_objectives = ''
    let conversation_flow_structure = ''
    let conversation_flow_field = ''
    let starting_script = ''
    let max_session_length_raw = ''

    if (contentType.includes('multipart/form-data')) {
      const { fields } = await parseForm(req)
      system_prompt = getField(fields, 'system_prompt')
      greeting = getField(fields, 'greeting')
      const nameField = getField(fields, 'name')
      if (nameField) name = nameField
      briefingSetupRaw = getField(fields, 'briefing_setup')
      role_objectives = getField(fields, 'role_objectives')
      conversation_flow_field = getField(fields, 'conversation_flow')
      conversation_flow_structure = getField(
        fields,
        'conversation_flow_structure',
      )
      starting_script = getField(fields, 'starting_script')
      max_session_length_raw = getField(fields, 'max_session_length')
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

    const briefingSetup = parseBriefingSetup(briefingSetupRaw)

    const flowForBeyond =
      String(conversation_flow_field || '').trim() ||
      String(conversation_flow_structure || '').trim()

    const mergedRoleFlow = mergeEssentialsRoleAndFlow(system_prompt, flowForBeyond)

    const finalSystemPrompt = composeAgentSystemPrompt({
      systemPrompt: mergedRoleFlow,
      roleObjectives: role_objectives,
      conversationFlowStructure: '',
      startingScript: '',
      briefingSetup,
    })

    const maxSession = resolveMaxSessionMinutes(
      max_session_length_raw,
      briefingSetup,
    )

    const greetingBeyond =
      String(starting_script || '').trim() ||
      String(greeting || '').trim()

    if (DEV_LOGGING) {
      console.log('[start-session] Incoming multipart summaries:', {
        system_prompt_len: String(system_prompt).trim().length,
        system_prompt_preview: preview50(system_prompt),
        greeting_len: String(greeting).trim().length,
        greeting_preview: preview50(greeting),
        conversation_flow_len: flowForBeyond.length,
        conversation_flow_preview: preview50(flowForBeyond),
        starting_script_len: String(starting_script).trim().length,
        starting_script_preview: preview50(starting_script),
        role_objectives_len: String(role_objectives).trim().length,
        role_objectives_preview: preview50(role_objectives),
        name,
        max_session_length_raw: max_session_length_raw || '(empty)',
        max_session_resolved_minutes: maxSession,
        briefing_setup_present: Boolean(String(briefingSetupRaw).trim()),
      })
      console.log(
        '[start-session] Composed system_prompt preview:',
        preview50(finalSystemPrompt),
        `(total ${finalSystemPrompt.length} chars)`,
      )
    }

    const agentData = await createAgent({
      avatar_id,
      name,
      system_prompt: finalSystemPrompt,
      greeting: greetingBeyond,
      conversational_flow: flowForBeyond,
      starting_script,
      max_session_length_minutes: maxSession,
    })

    logAgentKeys('agent', agentData)

    const agentRecord =
      agentData && typeof agentData === 'object' ? agentData : null
    const agent_id =
      agentRecord &&
      typeof agentRecord.id === 'string' &&
      agentRecord.id.trim()
        ? agentRecord.id.trim()
        : null

    if (!agent_id) {
      throw new Error('Beyond Presence response missing agent id')
    }

    const chatOrigin = (process.env.BEY_CHAT_EMBED_ORIGIN || 'https://bey.chat')
      .replace(/\/$/, '')
    const agent_embed_url = `${chatOrigin}/${agent_id}`
    const agent_name =
      agentRecord &&
      typeof agentRecord.name === 'string' &&
      agentRecord.name.trim() !== ''
        ? agentRecord.name.trim()
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
