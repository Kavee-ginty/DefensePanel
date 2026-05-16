import toast from 'react-hot-toast'

/** Shown when Vite cannot proxy /api (usually nothing listening on DEV_API_ORIGIN / port 3000). */
const DOCUMENT_API_UNAVAILABLE_TOAST =
  'Document API is not running. In another terminal run `npm run dev:api` (port 3000), keep `npm run dev` running, then retry.'

function isLikelyNetworkError(err) {
  if (!err) return false
  if (err instanceof TypeError) return true
  const msg = String(err.message || err)
  return /failed to fetch|networkerror|load failed|econnrefused/i.test(msg)
}

async function readJsonResponse(res) {
  const text = await res.text()
  const trimmed = text?.trim()
  if (!trimmed) return null
  try {
    return JSON.parse(trimmed)
  } catch {
    return null
  }
}

export async function processDocument(file) {
  try {
    const formData = new FormData()
    formData.append('pdf', file)
    const res = await fetch('/api/process-document', {
      method: 'POST',
      body: formData,
    })

    const data = await readJsonResponse(res)

    if (!data) {
      toast.error(DOCUMENT_API_UNAVAILABLE_TOAST)
      console.error(
        'processDocument: empty or non-JSON response (check dev API / proxy)',
        res.status,
      )
      return null
    }

    if (!data.success) {
      const msg = data.error || 'Document processing failed'
      toast.error(msg)
      return null
    }

    return data
  } catch (err) {
    if (isLikelyNetworkError(err)) {
      toast.error(DOCUMENT_API_UNAVAILABLE_TOAST)
    } else {
      toast.error(err?.message || 'Document processing failed.')
    }
    console.error('processDocument error:', err)
    return null
  }
}

export async function startSession(payload) {
  try {
    const formData = new FormData()
    formData.append('system_prompt', payload.system_prompt)
    formData.append('greeting', payload.greeting || '')
    formData.append('conversation_flow', payload.conversation_flow || '')
    formData.append('starting_script', payload.starting_script || '')
    formData.append('max_session_length', payload.max_session_length || '5')
    formData.append('name', 'defense-panel-' + Date.now())

    console.log('=== SENDING TO START-SESSION ===')
    for (const [key, value] of formData.entries()) {
      console.log(key, ':', typeof value === 'string' ? value.slice(0, 80) : value)
    }

    const res = await fetch('/api/start-session', {
      method: 'POST',
      body: formData,
    })
    const data = await readJsonResponse(res)
    if (!data) {
      toast.error(DOCUMENT_API_UNAVAILABLE_TOAST.replace('Document API', 'Panel API'))
      return null
    }
    if (!data.success)
      throw new Error(data.error || 'Session start failed')
    return data
  } catch (err) {
    if (isLikelyNetworkError(err)) {
      toast.error(
        'Cannot reach panel API. Run `npm run dev:api` on port 3000 or check your network.',
      )
    } else {
      toast.error(err?.message || 'Could not initialize panel. Check API keys.')
    }
    console.error('startSession error:', err)
    return null
  }
}

export async function endSession(payload) {
  try {
    const res = await fetch('/api/end-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const data = await readJsonResponse(res)
    if (!data) {
      toast.error(
        'Could not reach session API. Run `npm run dev:api` on port 3000 if developing locally.',
      )
      return null
    }
    if (!data.success)
      throw new Error(data.error || 'Session end failed')
    return data
  } catch (err) {
    if (isLikelyNetworkError(err)) {
      toast.error(
        'Cannot reach session API. Run `npm run dev:api` on port 3000 if developing locally.',
      )
    } else {
      toast.error(err?.message || 'Could not save session results.')
    }
    console.error('endSession error:', err)
    return null
  }
}
