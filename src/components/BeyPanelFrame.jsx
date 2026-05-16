export default function BeyPanelFrame({
  embedUrl,
  label = null,
  isBargeIn = false,
  className = '',
}) {
  const borderAccent = isBargeIn
    ? 'ring-2 ring-red-500 shadow-[0_0_28px_rgba(239,68,68,0.5)]'
    : 'ring-2 ring-cyan-400/70 shadow-[0_0_22px_rgba(34,211,238,0.35)]';

  return (
    <div
      className={[
        'w-full overflow-hidden rounded-xl bg-zinc-900/80 transition-shadow duration-200',
        borderAccent,
        className,
      ].join(' ')}
    >
      <div className="relative aspect-video w-full">
        <iframe
          src={embedUrl}
          title={label || 'AI panelist'}
          className="h-full w-full border-0"
          allow="camera; microphone; fullscreen"
          allowFullScreen
        />

        {label && (
          <div className="pointer-events-none absolute bottom-3 left-3 rounded-full border border-white/10 bg-black/55 px-3 py-1 text-xs font-medium text-zinc-100 backdrop-blur-sm">
            {label}
          </div>
        )}
      </div>
    </div>
  );
}
