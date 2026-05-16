import { useCallback, useEffect, useRef, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { FileText } from 'lucide-react'
import AvatarView from '../components/AvatarView.jsx'
import ArenaControls from '../components/ArenaControls.jsx'
import AgentPromptDrawer from '../components/AgentPromptDrawer.jsx'
import Button from '../components/Button.jsx'
import { useApp } from '../context/AppContext.jsx'
import { endSession } from '../lib/api.js'
import toast from 'react-hot-toast'

export default function SimulationArena() {
  const navigate = useNavigate()
  const {
    agentId,
    agentEmbedUrl,
    agentSystemPrompt,
    agentGreeting,
    agentRoleObjectives,
    agentConversationFlow,
    agentStartingScript,
    scenario,
    transcript,
    setGrades,
  } = useApp()

  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const startedAtRef = useRef(null)
  const [isMuted, setIsMuted] = useState(false)
  const [isVideoOff, setIsVideoOff] = useState(false)
  const [promptOpen, setPromptOpen] = useState(false)

  useEffect(() => {
    startedAtRef.current = Date.now()
    let cancelled = false
    ;(async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        })
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop())
          return
        }
        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          await videoRef.current.play().catch(() => {})
        }
      } catch (err) {
        console.error(err)
        toast.error(
          err?.name === 'NotAllowedError'
            ? 'Camera or microphone permission denied'
            : 'Could not access camera or microphone',
        )
      }
    })()
    return () => {
      cancelled = true
      streamRef.current?.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
  }, [])

  const toggleMute = useCallback(() => {
    const stream = streamRef.current
    if (!stream) return
    const audioTracks = stream.getAudioTracks()
    const next = !isMuted
    audioTracks.forEach((t) => {
      t.enabled = !next
    })
    setIsMuted(next)
  }, [isMuted])

  const toggleVideo = useCallback(() => {
    const stream = streamRef.current
    if (!stream) return
    const videoTracks = stream.getVideoTracks()
    const next = !isVideoOff
    videoTracks.forEach((t) => {
      t.enabled = !next
    })
    setIsVideoOff(next)
  }, [isVideoOff])

  const handleEndSession = useCallback(async () => {
    const durationSeconds = Math.max(
      1,
      Math.round((Date.now() - (startedAtRef.current ?? Date.now())) / 1000),
    )

    const result = await endSession({
      transcript,
      agent_id: agentId,
      scenario_type: scenario,
      duration_seconds: durationSeconds,
    })
    if (result?.grades) {
      setGrades(result.grades)
    }
    streamRef.current?.getTracks().forEach((t) => t.stop())
    navigate('/debrief')
  }, [agentId, navigate, scenario, setGrades, transcript])

  if (!agentId) {
    return <Navigate to="/" replace />
  }

  return (
    <div className="bg-black w-screen h-screen flex flex-col overflow-hidden relative">
      <div className="absolute top-4 right-4 z-30">
        <Button
          variant="ghost"
          onClick={() => setPromptOpen(true)}
          className="bg-zinc-950/90 border-zinc-700 text-zinc-200 text-sm"
        >
          <FileText className="h-4 w-4" />
          View prompt
        </Button>
      </div>

      <AgentPromptDrawer
        open={promptOpen}
        onClose={() => setPromptOpen(false)}
        systemPrompt={agentSystemPrompt}
        greeting={agentGreeting}
        roleObjectives={agentRoleObjectives}
        conversationFlow={agentConversationFlow}
        startingScript={agentStartingScript}
      />

      <div className="flex flex-1 min-h-0 w-full">
        {/* Left: user webcam */}
        <div className="w-1/2 h-full flex items-center justify-center bg-zinc-950 p-4 border-r border-zinc-900 min-h-0">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="max-h-full max-w-full rounded-xl border border-zinc-800 object-cover aspect-video bg-zinc-900"
          />
        </div>
        {/* Right: single agent */}
        <div className="w-1/2 h-full flex flex-col gap-4 p-4 bg-black min-h-0">
          <div className="flex-1 min-h-0 flex flex-col">
            <AvatarView
              embedUrl={agentEmbedUrl}
              label="AI Agent"
            />
          </div>
        </div>
      </div>

      <ArenaControls
        onMute={toggleMute}
        onVideoToggle={toggleVideo}
        onEndSession={handleEndSession}
        isMuted={isMuted}
        isVideoOff={isVideoOff}
      />
    </div>
  )
}
