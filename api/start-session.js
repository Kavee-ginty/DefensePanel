/* global process */
import { readFile } from 'node:fs/promises'
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
 * Best-effort PDF upload as agent "knowledge" if the platform exposes an endpoint.
 * @param {string} agentId
 * @param {{ filepath: string, originalFilename?: string | null, mimetype?: string | null }} file
 */
async function tryUploadAgentKnowledge(agentId, file) {
  if (!file?.filepath || !agentId) {
    return { ok: false, skipped: true }
  }

  const customUrl = process.env.BEY_KNOWLEDGE_UPLOAD_URL
  const candidateUrls = customUrl
    ? [
        customUrl
          .replaceAll('{agent_id}', agentId)
          .replaceAll('{agentId}', agentId),
      ]
    : [
        `https://api.bey.dev/v1/agents/${agentId}/knowledge_files`,
        `https://api.bey.dev/v1/agents/${agentId}/knowledge`,
      ]

  let lastStatus = 0
  for (const url of candidateUrls) {
    try {
      const buffer = await readFile(file.filepath)
      const formData = new FormData()
      const blob = new Blob([buffer], {
        type: file.mimetype || 'application/pdf',
      })
      const filename = file.originalFilename || 'document.pdf'
      formData.append('file', blob, filename)

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'x-api-key': process.env.BEYOND_PRESENCE_API_KEY,
        },
        body: formData,
      })
      lastStatus = res.status
      if (res.ok) {
        return { ok: true, url }
      }
    } catch (err) {
      console.warn('[start-session] knowledge upload attempt failed', url, err)
    }
  }

  return {
    ok: false,
    lastStatus,
    message: 'Knowledge file upload not available or failed (using prompt context only)',
  }
}

/**
 * Chat embed URLs: https://bey.chat/{agent_id}
 * Override with BEY_CHAT_EMBED_ORIGIN (no trailing slash), e.g. https://bey.chat
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
    /** @type {import('formidable').File | undefined} */
    let pdfFile

    if (contentType.includes('multipart/form-data')) {
      const { fields, files } = await parseForm(req)
      system_prompt = getField(fields, 'system_prompt')
      greeting = getField(fields, 'greeting')
      const nameField = getField(fields, 'name')
      if (nameField) name = nameField
      pdfFile =
        (Array.isArray(files.pdf) ? files.pdf[0] : files.pdf) || undefined
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

    const agent = await createAgent({
      avatar_id,
      name,
      system_prompt: String(system_prompt).trim(),
      greeting,
    })

    logAgentKeys('agent', agent)

    const agent_id = agent?.id
    if (!agent_id) {
      throw new Error('Beyond Presence response missing agent id')
    }

    const knowledgeResult = await tryUploadAgentKnowledge(agent_id, pdfFile)
    let knowledge_upload_warning = null
    if (pdfFile && !knowledgeResult.ok && !knowledgeResult.skipped) {
      knowledge_upload_warning = knowledgeResult.message
      console.warn('[start-session]', knowledge_upload_warning)
    }

    const chatOrigin = (process.env.BEY_CHAT_EMBED_ORIGIN || 'https://bey.chat')
      .replace(/\/$/, '')
    const agent_embed_url = `${chatOrigin}/${agent_id}`

    return res.status(200).json({
      success: true,
      agent_id,
      agent_embed_url,
      ...(knowledge_upload_warning
        ? { knowledge_upload_warning }
        : {}),
    })
  } catch (err) {
    console.error('start-session failed', err)
    return res.status(500).json({
      success: false,
      error: err?.message || 'Could not start session',
    })
  }
}
