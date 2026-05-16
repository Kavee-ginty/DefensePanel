import { useCallback, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import Dropzone from '../components/Dropzone.jsx'
import Button from '../components/Button.jsx'
import { useApp } from '../context/AppContext.jsx'
import { processDocument, startSession } from '../lib/api.js'

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

export default function ContextUpload() {
  const navigate = useNavigate()
  const {
    setSmePrompt,
    setEvaluatorPrompt,
    setSmeAgentId,
    setEvaluatorAgentId,
    setSessionId,
    scenario,
  } = useApp()
  const [busy, setBusy] = useState(false)
  const [loadingMessage, setLoadingMessage] = useState('')

  const onFileAccepted = useCallback(
    async (file) => {
      setBusy(true)
      try {
        setLoadingMessage('> GPT-4o is reading your document...')
        const [docResult] = await Promise.all([processDocument(file), sleep(1500)])
        if (!docResult?.success || !docResult.prompts) {
          return
        }

        setLoadingMessage('> Identifying your weakest arguments...')
        await sleep(1500)

        const { sme_system_prompt, evaluator_system_prompt } =
          docResult.prompts
        setSmePrompt(sme_system_prompt)
        setEvaluatorPrompt(evaluator_system_prompt)

        const promptsPayload = {
          sme_system_prompt,
          evaluator_system_prompt,
        }

        setLoadingMessage('> Initializing the panel members...')
        const [sessionResult] = await Promise.all([
          startSession(promptsPayload),
          sleep(1500),
        ])
        if (!sessionResult?.success) {
          return
        }

        setSmeAgentId(sessionResult.sme_agent_id ?? null)
        setEvaluatorAgentId(sessionResult.evaluator_agent_id ?? null)
        setSessionId(
          typeof crypto !== 'undefined' && crypto.randomUUID
            ? crypto.randomUUID()
            : `session-${Date.now()}`,
        )

        setLoadingMessage('> The panel is ready. Good luck.')
        await sleep(1500)

        navigate('/arena')
      } finally {
        setBusy(false)
        setLoadingMessage('')
      }
    },
    [
      navigate,
      setEvaluatorAgentId,
      setEvaluatorPrompt,
      setSessionId,
      setSmeAgentId,
      setSmePrompt,
    ],
  )

  if (!scenario) {
    return <Navigate to="/" replace />
  }

  return (
    <div className="min-h-screen bg-black text-zinc-100 relative">
      <div className="absolute top-6 left-6 z-20">
        <Button variant="ghost" onClick={() => navigate('/')}>
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
      </div>

      <div className="max-w-xl mx-auto px-6 pt-24 pb-16">
        <h1 className="text-2xl font-bold text-zinc-50 mb-2">Briefing room</h1>
        <p className="text-zinc-400 mb-6">
          {scenario
            ? `Mode: ${scenario} — upload a PDF to initialize the panel.`
            : 'Select a mode from the lobby first.'}
        </p>
        <Dropzone onFileAccepted={onFileAccepted} loading={busy} />
      </div>

      {busy ? (
        <div className="fixed inset-0 z-30 bg-black/85 flex items-center justify-center">
          <p className="text-zinc-200 font-mono text-lg tracking-tight">
            {loadingMessage}
          </p>
        </div>
      ) : null}
    </div>
  )
}
