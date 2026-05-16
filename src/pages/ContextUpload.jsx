import { useCallback, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import Dropzone from '../components/Dropzone.jsx'
import Button from '../components/Button.jsx'
import { useApp } from '../context/AppContext.jsx'
import { processDocument, startSession } from '../lib/api.js'
import toast from 'react-hot-toast'

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

export default function ContextUpload() {
  const navigate = useNavigate()
  const {
    setAgentSystemPrompt,
    setAgentGreeting,
    setAgentRoleObjectives,
    setAgentConversationFlow,
    setAgentStartingScript,
    setAgentId,
    setAgentEmbedUrl,
    setAgentName,
    setSessionId,
    setDocumentSummary,
    setSmePrompt,
    setGreeting,
    setRoleObjectives,
    setConversationFlow,
    setStartingScript,
    scenario,
  } = useApp()
  const [busy, setBusy] = useState(false)
  const [loadingMessage, setLoadingMessage] = useState('')

  const onFileAccepted = useCallback(
    async (file) => {
      setBusy(true)
      try {
        setLoadingMessage('> Reading your document...')
        const [docResult] = await Promise.all([
          processDocument(file),
          sleep(1500),
        ])
        if (!docResult?.success || !docResult.prompts) {
          return
        }

        setLoadingMessage('> GPT-4o identifying weak arguments and key claims...')
        await sleep(1500)

        setLoadingMessage('> Generating panel member personas...')
        await sleep(1500)

        const {
          role_objectives,
          conversation_flow_structure,
          starting_script,
          system_prompt,
          greeting,
          document_summary,
        } = docResult.prompts

        setSmePrompt(system_prompt ?? null)
        setGreeting(greeting ?? null)
        setRoleObjectives(role_objectives ?? null)
        setConversationFlow(conversation_flow_structure ?? null)
        setStartingScript(starting_script ?? null)
        setDocumentSummary(document_summary ?? null)
        setAgentSystemPrompt(system_prompt ?? null)
        setAgentGreeting(greeting ?? null)
        setAgentRoleObjectives(role_objectives ?? null)
        setAgentConversationFlow(conversation_flow_structure ?? null)
        setAgentStartingScript(starting_script ?? null)

        setLoadingMessage('> Initializing your defense panel...')
        const [sessionResult] = await Promise.all([
          startSession({
            system_prompt: system_prompt ?? '',
            greeting: greeting ?? '',
          }),
          sleep(1500),
        ])

        if (!sessionResult?.success) {
          return
        }

        setAgentId(sessionResult.agent_id ?? null)
        setAgentEmbedUrl(sessionResult.agent_embed_url ?? null)
        setAgentName(sessionResult.agent_name ?? null)
        setSessionId(
          typeof crypto !== 'undefined' && crypto.randomUUID
            ? crypto.randomUUID()
            : `session-${Date.now()}`,
        )

        toast.success('Panel initialized')
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
      setAgentConversationFlow,
      setAgentEmbedUrl,
      setAgentGreeting,
      setAgentId,
      setAgentName,
      setAgentRoleObjectives,
      setAgentStartingScript,
      setAgentSystemPrompt,
      setConversationFlow,
      setDocumentSummary,
      setGreeting,
      setRoleObjectives,
      setSessionId,
      setSmePrompt,
      setStartingScript,
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
            ? `Mode: ${scenario} — upload a PDF to initialize your agent.`
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
