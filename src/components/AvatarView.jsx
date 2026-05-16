/**
 * Beyond Presence embed — set VITE_BEYOND_AGENT_EMBED_BASE in .env if your dashboard
 * uses a different host (trailing slash optional).
 */
function buildEmbedUrl(agentId) {
  const base =
    import.meta.env.VITE_BEYOND_AGENT_EMBED_BASE?.replace(/\/$/, '') ||
    'https://app.bey.dev/embed'
  const sep = base.includes('?') ? '&' : '?'
  return `${base}${sep}id=${encodeURIComponent(agentId)}`
}

export default function AvatarView({ agentId, label }) {
  if (!agentId) {
    return (
      <div className="aspect-video rounded-xl border border-zinc-800 bg-zinc-950 overflow-hidden relative flex items-center justify-center">
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
    <div className="aspect-video rounded-xl border border-zinc-800 bg-zinc-950 overflow-hidden relative">
      <iframe
        title="Beyond Presence avatar"
        src={buildEmbedUrl(agentId)}
        className="absolute inset-0 h-full w-full border-0"
        allow="camera; microphone; display-capture; autoplay"
      />
      {label ? (
        <span className="absolute bottom-2 left-2 text-xs text-zinc-300 z-10 pointer-events-none drop-shadow">
          {label}
        </span>
      ) : null}
    </div>
  )
}
