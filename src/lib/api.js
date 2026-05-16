import toast from 'react-hot-toast'

export async function processDocument(file) {
  try {
    const formData = new FormData()
    formData.append('pdf', file)
    const res = await fetch('/api/process-document', {
      method: 'POST',
      body: formData,
    })
    const data = await res.json()
    if (!data.success)
      throw new Error(data.error || 'Document processing failed')
    return data
  } catch (err) {
    toast.error('Could not analyze document. Try a smaller PDF.')
    console.error('processDocument error:', err)
    return null
  }
}

export async function startSession(payload) {
  try {
    const formData = new FormData()
    formData.append('system_prompt', payload.system_prompt)
    formData.append('greeting', payload.greeting || '')
    formData.append('name', 'defense-panel-' + Date.now())
    const res = await fetch('/api/start-session', {
      method: 'POST',
      body: formData,
    })
    const data = await res.json()
    if (!data.success)
      throw new Error(data.error || 'Session start failed')
    return data
  } catch (err) {
    toast.error('Could not initialize panel. Check API keys.')
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
    const data = await res.json()
    if (!data.success)
      throw new Error(data.error || 'Session end failed')
    return data
  } catch (err) {
    toast.error('Could not save session results.')
    console.error('endSession error:', err)
    return null
  }
}
