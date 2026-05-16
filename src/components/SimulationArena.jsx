import { useMemo, useRef, useState } from 'react';
import { getModeConfig } from '../config/modeConfig.js';
import { getBeyEmbedUrl } from '../config/beyEmbeds.js';
import BeyPanelFrame from './BeyPanelFrame.jsx';
import PdfPresentationView from './PdfPresentationView.jsx';
import UserVideo from './UserVideo.jsx';
import ArenaControls from './ArenaControls.jsx';
import EndSessionModal from './EndSessionModal.jsx';

const PERSONA_LABEL = {
  investor: 'Investor',
  cfo: 'CFO',
  professor: 'Professor',
};

function formatDifficulty(raw) {
  if (!raw) return 'Standard';
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

export default function SimulationArena({
  mode,
  documentFile = null,
  agentEmbedUrl = null,
  briefingSetup = null,
  onEndSession,
}) {
  const config = getModeConfig(mode);
  const showDocPreview = Boolean(documentFile);
  const sessionStartedAt = useRef(Date.now());
  const [muted, setMuted] = useState(false);
  const [videoOff, setVideoOff] = useState(false);
  const [showEndModal, setShowEndModal] = useState(false);

  // Slot 0 uses the freshly-generated agent (from /api/start-session); the
  // remaining slots fall back to the static config URLs so the panel still
  // looks fully populated.
  const panels = useMemo(
    () =>
      config.panelists.map((p, index) => {
        const isLiveSlot = index === 0 && Boolean(agentEmbedUrl);
        return {
          label: isLiveSlot ? `${p.label} · Live` : p.label,
          embedUrl: isLiveSlot
            ? agentEmbedUrl
            : (p.beyChatUrl ?? getBeyEmbedUrl(index)),
          isBargeIn: false,
        };
      }),
    [config.panelists, agentEmbedUrl],
  );

  const handleEndConfirm = () => {
    setShowEndModal(false);
    const durationSeconds = Math.max(
      1,
      Math.round((Date.now() - sessionStartedAt.current) / 1000),
    );
    onEndSession?.({
      durationSeconds,
      modeId: mode,
    });
  };

  const rehearsalHint = briefingSetup && (
    <div className="absolute right-3 top-2 z-20 hidden max-w-md rounded-xl border border-cyan-500/35 bg-black/65 px-3 py-2 text-[11px] font-medium leading-snug text-cyan-100/95 shadow-lg backdrop-blur-sm sm:flex sm:flex-wrap sm:items-center sm:gap-x-2 sm:gap-y-1">
      <span className="tabular-nums text-cyan-200">
        Goal {briefingSetup?.sessionMinutes ?? 5} min
      </span>
      <span className="text-zinc-500">·</span>
      <span>{formatDifficulty(briefingSetup?.difficulty)}</span>
      <span className="text-zinc-500">·</span>
      <span>{PERSONA_LABEL[briefingSetup?.panelPersona] ?? 'Investor'} tone</span>
      {briefingSetup?.visionMode && (
        <>
          <span className="text-zinc-500">·</span>
          <span className="text-amber-200">Vision</span>
        </>
      )}
    </div>
  );

  const liveBadge = (
    <div className="absolute bottom-4 left-4 z-10 flex items-center gap-2 rounded-full border border-white/10 bg-black/55 px-3 py-1.5 text-xs font-medium backdrop-blur-sm">
      <span
        className="h-2 w-2 animate-pulse rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]"
        aria-hidden
      />
      Live Recording
    </div>
  );

  const arenaControls = (
    <div className="absolute bottom-4 left-1/2 z-10 -translate-x-1/2">
      <ArenaControls
        muted={muted}
        videoOff={videoOff}
        onToggleMute={() => setMuted((m) => !m)}
        onToggleVideo={() => setVideoOff((v) => !v)}
        onEndDefense={() => setShowEndModal(true)}
      />
    </div>
  );

  const panelColumn = (
    <div className="flex h-full min-h-0 w-full shrink-0 flex-col gap-3 lg:w-[380px]">
      {panels.map((panel, index) => (
        <BeyPanelFrame
          key={panel.label + index}
          embedUrl={panel.embedUrl}
          label={panel.label}
          isBargeIn={panel.isBargeIn}
          fillHeight
        />
      ))}
    </div>
  );

  return (
    <div className="relative overflow-hidden bg-black font-sans text-zinc-50">
      <div className="absolute left-4 top-2 z-10 hidden text-xs font-medium uppercase tracking-wider text-zinc-500 sm:block">
        {config.arenaSubtitle}
      </div>
      {rehearsalHint}

      <div className="mx-auto flex h-[calc(100dvh-4.75rem)] max-h-[calc(100dvh-4.75rem)] max-w-6xl flex-col gap-4 overflow-hidden p-4 pt-2 lg:flex-row lg:gap-6 lg:p-6">
        <div className="relative flex h-full min-h-0 min-w-0 flex-1 flex-col">
          {showDocPreview ? (
            <PdfPresentationView file={documentFile} arena />
          ) : (
            <UserVideo
              muted={muted}
              videoOff={videoOff}
              fill
              className="h-full w-full rounded-xl"
            />
          )}

          {showDocPreview && (
            <div className="pointer-events-none absolute right-3 top-3 z-20 w-[190px] overflow-hidden rounded-xl border border-zinc-700/80 shadow-[0_8px_32px_rgba(0,0,0,0.65)] ring-2 ring-cyan-400/50">
              <div className="pointer-events-auto aspect-video w-full">
                <UserVideo
                  muted={muted}
                  videoOff={videoOff}
                  pipMode
                  className="h-full w-full"
                />
              </div>
              <div className="pointer-events-none absolute bottom-2 left-2 rounded-full border border-white/10 bg-black/60 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-zinc-300 backdrop-blur-sm">
                Presenter
              </div>
            </div>
          )}

          {liveBadge}
          {arenaControls}
        </div>
        {panelColumn}
      </div>

      <EndSessionModal
        open={showEndModal}
        onCancel={() => setShowEndModal(false)}
        onConfirm={handleEndConfirm}
      />
    </div>
  );
}
