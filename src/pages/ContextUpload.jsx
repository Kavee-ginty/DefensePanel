import { useCallback, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import Dropzone from '../components/Dropzone.jsx'
import Button from '../components/Button.jsx'
import { useApp } from '../context/AppContext.jsx'
import { processDocument, startSession } from '../lib/api.js'
import toast from 'react-hot-toast'

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const DURATION_OPTIONS = [
  { value: 3, label: '3 min' },
  { value: 5, label: '5 min' },
  { value: 10, label: '10 min' },
  { value: 15, label: '15 min' },
]

const textareaClass =
  'bg-zinc-800 border border-zinc-700 rounded-lg p-3 text-zinc-300 text-sm w-full resize-none min-h-[12rem] focus:ring-2 focus:ring-blue-500 focus:outline-none'

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
    setSessionDuration,
    scenario,
  } = useApp()

  const [file, setFile] = useState(null)
  const [selectedDuration, setSelectedDuration] = useState(5)
  const [stage, setStage] = useState('upload')
  const [loadingMessage, setLoadingMessage] = useState('')
  const [previewPrompts, setPreviewPrompts] = useState(null)
  const [editedSystemPrompt, setEditedSystemPrompt] = useState('')
  const [editedConvFlow, setEditedConvFlow] = useState('')
  const [editedStartingScript, setEditedStartingScript] = useState('')

  const savePromptsToContext = useCallback(
    (prompts) => {
      const {
        role_objectives,
        conversation_flow_structure,
        starting_script,
        system_prompt,
        greeting,
        document_summary,
      } = prompts

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
    },
    [
      setAgentConversationFlow,
      setAgentGreeting,
      setAgentRoleObjectives,
      setAgentStartingScript,
      setAgentSystemPrompt,
      setConversationFlow,
      setDocumentSummary,
      setGreeting,
      setRoleObjectives,
      setSmePrompt,
      setStartingScript,
    ],
  )

  const onFileAccepted = useCallback(async (accepted) => {
    setFile(accepted)
  }, [])

  const onAnalyzeDocument = useCallback(async () => {
    if (!file) return

    setStage('loading')
    setLoadingMessage('> Reading your document...')
    try {
      const [docResult] = await Promise.all([processDocument(file), sleep(1500)])
      if (!docResult?.success || !docResult.prompts) {
        setStage('upload')
        return
      }

      setLoadingMessage('> GPT-4o identifying weak arguments...')
      await sleep(1500)

      setLoadingMessage('> Generating panel member persona...')
      await sleep(1500)

      setLoadingMessage('> Preparing your preview...')
      await sleep(1500)

      savePromptsToContext(docResult.prompts)
      const p = docResult.prompts
      setEditedSystemPrompt(p.system_prompt || '')
      setEditedConvFlow(p.conversation_flow_structure || '')
      setEditedStartingScript(p.starting_script || '')
      setPreviewPrompts(p)
      setStage('preview')
    } catch {
      setStage('upload')
    } finally {
      setLoadingMessage('')
    }
  }, [file, savePromptsToContext])

  const onBackFromPreview = useCallback(() => {
    setPreviewPrompts(null)
    setStage('upload')
  }, [])

  const onInitializePanel = useCallback(async () => {
    if (!previewPrompts) return

    setStage('creating')
    setSessionDuration(selectedDuration * 60)

    try {
      setLoadingMessage('> Initializing your defense panel...')
      await sleep(1500)
      setLoadingMessage('> The panel is ready. Good luck.')
      await sleep(1500)

      console.log('=== PROMPTS BEING PASSED TO startSession ===')
      console.log('system_prompt:', editedSystemPrompt?.slice(0, 80))
      console.log('conversation_flow:', editedConvFlow?.slice(0, 80))
      console.log('starting_script:', editedStartingScript?.slice(0, 80))
      console.log('greeting:', previewPrompts?.greeting?.slice(0, 80))

      const sessionResult = await startSession({
        system_prompt: editedSystemPrompt,
        greeting: previewPrompts.greeting ?? '',
        conversation_flow: editedConvFlow,
        starting_script: editedStartingScript,
        max_session_length: selectedDuration,
      })

      if (!sessionResult?.success) {
        setStage('preview')
        return
      }

      setAgentSystemPrompt(editedSystemPrompt)
      setAgentConversationFlow(editedConvFlow)
      setAgentStartingScript(editedStartingScript)
      setSmePrompt(editedSystemPrompt)
      setConversationFlow(editedConvFlow)
      setStartingScript(editedStartingScript)

      setAgentId(sessionResult.agent_id ?? null)
      setAgentEmbedUrl(sessionResult.agent_embed_url ?? null)
      setAgentName(sessionResult.agent_name ?? null)
      setSessionId(
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : `session-${Date.now()}`,
      )

      toast.success('Panel initialized')
      navigate('/arena')
    } catch {
      setStage('preview')
      toast.error('Could not initialize panel. Check API keys.')
    } finally {
      setLoadingMessage('')
    }
  }, [
    editedConvFlow,
    editedStartingScript,
    editedSystemPrompt,
    navigate,
    previewPrompts,
    selectedDuration,
    setAgentConversationFlow,
    setAgentEmbedUrl,
    setAgentId,
    setAgentName,
    setAgentStartingScript,
    setAgentSystemPrompt,
    setConversationFlow,
    setSessionDuration,
    setSessionId,
    setSmePrompt,
    setStartingScript,
  ])

  if (!scenario) {
    return <Navigate to="/" replace />
  }

  const overlayActive = stage === 'loading' || stage === 'creating'
  const dropzoneBusy = overlayActive

  return (
    <div className="min-h-screen bg-black text-zinc-100 relative">
      {stage === 'upload' ? (
        <div className="absolute top-6 left-6 z-20">
          <Button variant="ghost" onClick={() => navigate('/')}>
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </div>
      ) : null}

      {stage === 'upload' ? (
        <div className="max-w-xl mx-auto px-6 pt-24 pb-16">
          <h1 className="text-2xl font-bold text-zinc-50 mb-2">Briefing room</h1>
          <p className="text-zinc-400 mb-6">
            {scenario
              ? `Mode: ${scenario} — upload a PDF to initialize your agent.`
              : 'Select a mode from the lobby first.'}
          </p>
          <Dropzone onFileAccepted={onFileAccepted} loading={dropzoneBusy} />

          <div className="mt-6">
            <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">
              Session Duration
            </p>
            <div className="grid grid-cols-4 gap-2">
              {DURATION_OPTIONS.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setSelectedDuration(value)}
                  className={
                    selectedDuration === value
                      ? 'border border-blue-500 rounded-lg px-4 py-3 cursor-pointer text-blue-400 text-sm font-medium text-center bg-blue-500/10 transition-all duration-150'
                      : 'border border-zinc-700 rounded-lg px-4 py-3 cursor-pointer text-zinc-400 text-sm font-medium text-center hover:border-zinc-500 transition-all duration-150'
                  }
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6">
            <Button
              variant="primary"
              className="w-full"
              onClick={() => void onAnalyzeDocument()}
              disabled={!file || overlayActive}
            >
              Analyze Document
            </Button>
          </div>
        </div>
      ) : null}

      {stage === 'preview' && previewPrompts ? (
        <div className="min-h-screen bg-zinc-950 px-8 py-12 text-zinc-100">
          <header>
            <h1 className="text-2xl font-bold text-zinc-50">
              Review Your Panel Configuration
            </h1>
            <p className="text-sm text-zinc-400 mt-1">
              Edit the prompts below before initializing your panel.
            </p>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
            <div className="bg-zinc-900/40 border border-white/5 rounded-xl p-5 backdrop-blur-sm">
              <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">
                Role & Objective
              </p>
              <textarea
                value={editedSystemPrompt}
                onChange={(e) => setEditedSystemPrompt(e.target.value)}
                rows={8}
                className={textareaClass}
              />
            </div>
            <div className="bg-zinc-900/40 border border-white/5 rounded-xl p-5 backdrop-blur-sm">
              <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">
                Conversational Flow & Structure
              </p>
              <textarea
                value={editedConvFlow}
                onChange={(e) => setEditedConvFlow(e.target.value)}
                rows={8}
                className={textareaClass}
              />
            </div>
            <div className="bg-zinc-900/40 border border-white/5 rounded-xl p-5 backdrop-blur-sm">
              <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">
                Agent&apos;s Starting Script
              </p>
              <textarea
                value={editedStartingScript}
                onChange={(e) => setEditedStartingScript(e.target.value)}
                rows={8}
                className={textareaClass}
              />
            </div>
          </div>

          <div className="flex justify-between items-center mt-8">
            <Button variant="ghost" onClick={onBackFromPreview}>
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <Button variant="primary" onClick={() => void onInitializePanel()}>
              Initialize Panel
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : null}

      {overlayActive ? (
        <div className="fixed inset-0 z-30 bg-black/85 flex items-center justify-center">
          <p className="text-zinc-200 font-mono text-lg tracking-tight">
            {loadingMessage}
          </p>
        </div>
      ) : null}
    </div>
  )
}
