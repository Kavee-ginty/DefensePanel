/**
 * @param {object} props
 * @param {string | null} [props.embedUrl]
 * @param {string} [props.label]
 */
export default function AvatarView({ embedUrl, label }) {
  const hasUrl =
    typeof embedUrl === 'string' && embedUrl.trim() !== ''

  if (!hasUrl) {
    return (
      <div className="relative h-full w-full min-h-0 rounded-xl border border-zinc-800 bg-zinc-950 overflow-hidden flex items-center justify-center">
        <div className="absolute inset-0 animate-pulse bg-zinc-800/60" />
        <p className="relative z-10 text-zinc-400 text-sm">Connecting...</p>
        {label ? (
          <span className="absolute bottom-2 left-2 text-xs text-zinc-500 z-10">
            {label}
          </span>
        ) : null}
      </div>
    )
  }

  return (
    <div className="relative h-full w-full min-h-0 rounded-xl border border-zinc-800 bg-zinc-950 overflow-hidden">
      <iframe
        title={label ? `Beyond Presence: ${label}` : 'Beyond Presence avatar'}
        src={embedUrl.trim()}
        allow="camera; microphone; fullscreen"
        allowFullScreen
        className="w-full h-full border-0 max-w-full"
        style={{ border: 'none' }}
      />
      {label ? (
        <span className="absolute bottom-2 left-2 text-xs text-zinc-300 z-10 pointer-events-none drop-shadow">
          {label}
        </span>
      ) : null}
    </div>
  )
}
