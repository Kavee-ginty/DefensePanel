import { Mic, MicOff, Video, VideoOff, PhoneOff } from 'lucide-react'

export default function ArenaControls({
  onMute,
  onVideoToggle,
  onEndSession,
  isMuted,
  isVideoOff,
}) {
  const confirmEnd = () => {
    if (
      typeof window !== 'undefined' &&
      window.confirm(
        'End session? This will finalize your score and leave the arena.',
      )
    ) {
      onEndSession?.()
    }
  }

  return (
    <div className="fixed bottom-8 left-1/2 z-50 -translate-x-1/2 bg-zinc-900/80 backdrop-blur-md border border-zinc-800 rounded-full px-6 py-3 flex gap-4 items-center shadow-lg">
      <button
        type="button"
        onClick={onMute}
        className={`rounded-full p-3 transition-colors ${
          isMuted ? 'bg-red-600 text-white' : 'bg-zinc-800 text-zinc-200 hover:bg-zinc-700'
        }`}
        title={isMuted ? 'Unmute' : 'Mute'}
        aria-pressed={isMuted}
      >
        {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
      </button>
      <button
        type="button"
        onClick={onVideoToggle}
        className={`rounded-full p-3 transition-colors ${
          isVideoOff
            ? 'bg-red-600 text-white'
            : 'bg-zinc-800 text-zinc-200 hover:bg-zinc-700'
        }`}
        title={isVideoOff ? 'Enable camera' : 'Disable camera'}
        aria-pressed={isVideoOff}
      >
        {isVideoOff ? (
          <VideoOff className="h-5 w-5" />
        ) : (
          <Video className="h-5 w-5" />
        )}
      </button>
      <button
        type="button"
        onClick={confirmEnd}
        className="rounded-full bg-red-600 text-white p-3 hover:bg-red-500 transition-colors"
        title="End session"
      >
        <PhoneOff className="h-5 w-5" />
      </button>
    </div>
  )
}
