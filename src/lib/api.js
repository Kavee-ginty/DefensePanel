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
 * @param {{sme_system_prompt: string, evaluator_system_prompt: string}} prompts
 */
export async function startSession(prompts) {
  try {
    return await postJson('/api/start-session', prompts)
  } catch (err) {
    console.error('startSession', err)
    toast.error(err?.message || 'Could not start session')
    return null
  }
}

/**
 * @param {{transcript: unknown, sme_agent_id: string, evaluator_agent_id: string, scenario_type: string, duration_seconds: number}} payload
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
