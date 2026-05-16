import toast from 'react-hot-toast'

async function postJson(path, body) {
  const res = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(text || `Request failed: ${res.status}`)
  }
  return res.json()
}

/**
 * @param {File} file - PDF file to process
 */
export async function processDocument(file) {
  try {
    const formData = new FormData()
    formData.append('pdf', file)

    const res = await fetch('/api/process-document', {
      method: 'POST',
      body: formData,
    })

    if (!res.ok) {
      const text = await res.text().catch(() => '')
      throw new Error(text || `Request failed: ${res.status}`)
    }

    return res.json()
  } catch (err) {
    console.error('processDocument', err)
    toast.error(err?.message || 'Document processing failed')
    return null
  }
}

/**
 * Create a Beyond Presence agent. Pass the PDF so the backend can attempt a knowledge upload.
 * @param {{
 *   system_prompt: string,
 *   greeting: string,
 *   name?: string,
 * }} agentConfig
 * @param {File} [pdf] - original PDF for optional knowledge upload
 */
export async function startSession(agentConfig, pdf) {
  try {
    const formData = new FormData()
    formData.append('system_prompt', agentConfig.system_prompt)
    formData.append('greeting', agentConfig.greeting)
    if (agentConfig.name) {
      formData.append('name', agentConfig.name)
    }
    if (pdf instanceof File) {
      formData.append('pdf', pdf)
    }

    const res = await fetch('/api/start-session', {
      method: 'POST',
      body: formData,
    })
    if (!res.ok) {
      const text = await res.text().catch(() => '')
      throw new Error(text || `Request failed: ${res.status}`)
    }
    return res.json()
  } catch (err) {
    console.error('startSession', err)
    toast.error(err?.message || 'Could not start session')
    return null
  }
}

/**
 * @param {{transcript: unknown, agent_id: string, scenario_type: string, duration_seconds: number}} payload
 */
export async function endSession(payload) {
  try {
    return await postJson('/api/end-session', payload)
  } catch (err) {
    console.error('endSession', err)
    toast.error(err?.message || 'Could not end session')
    return null
  }
}
