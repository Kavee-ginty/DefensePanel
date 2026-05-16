import { Mic, MicOff, PhoneOff, Video, VideoOff } from 'lucide-react';

export default function ArenaControls({
  muted = false,
  videoOff = false,
  onToggleMute,
  onToggleVideo,
  onEndDefense,
}) {
  return (
    <div className="flex items-center gap-2 rounded-full border border-white/10 bg-black/60 px-4 py-2 shadow-xl backdrop-blur-md">
      <button
        type="button"
        onClick={onToggleMute}
        aria-label={muted ? 'Unmute microphone' : 'Mute microphone'}
        className="rounded-full p-2.5 text-zinc-200 transition-colors hover:bg-white/10"
      >
        {muted ? (
          <MicOff className="h-5 w-5" strokeWidth={2} />
        ) : (
          <Mic className="h-5 w-5" strokeWidth={2} />
        )}
      </button>
      <button
        type="button"
        onClick={onToggleVideo}
        aria-label={videoOff ? 'Turn camera on' : 'Turn camera off'}
        className="rounded-full p-2.5 text-zinc-200 transition-colors hover:bg-white/10"
      >
        {videoOff ? (
          <VideoOff className="h-5 w-5" strokeWidth={2} />
        ) : (
          <Video className="h-5 w-5" strokeWidth={2} />
        )}
      </button>
      <button
        type="button"
        onClick={onEndDefense}
        aria-label="End defense session"
        className="rounded-full bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-500"
      >
        <span className="flex items-center gap-2">
          <PhoneOff className="h-4 w-4" strokeWidth={2} aria-hidden />
          End Defense
        </span>
      </button>
    </div>
  );
}
