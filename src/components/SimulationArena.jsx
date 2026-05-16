import { useMemo, useRef, useState } from 'react';
import { getModeConfig } from '../config/modeConfig.js';
import { getBeyEmbedUrl } from '../config/beyEmbeds.js';
import BeyPanelFrame from './BeyPanelFrame.jsx';
import PdfPresentationView from './PdfPresentationView.jsx';
import UserVideo from './UserVideo.jsx';
import ArenaControls from './ArenaControls.jsx';
import EndSessionModal from './EndSessionModal.jsx';

export default function SimulationArena({
  mode,
  documentFile = null,
  onEndSession,
}) {
  const config = getModeConfig(mode);
  const isPitchMode = mode === 'startup';
  const sessionStartedAt = useRef(Date.now());
  const [muted, setMuted] = useState(false);
  const [videoOff, setVideoOff] = useState(false);
  const [showEndModal, setShowEndModal] = useState(false);

  const panels = useMemo(
    () =>
      config.panelists.map((p, index) => ({
        label: p.label,
        embedUrl: p.beyChatUrl ?? getBeyEmbedUrl(index),
        isBargeIn: false,
      })),
    [config.panelists],
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

      <div className="mx-auto flex h-[calc(100dvh-5rem)] max-h-[calc(100dvh-5rem)] max-w-7xl flex-col gap-4 overflow-hidden p-4 pt-2 lg:flex-row lg:gap-6 lg:p-6">
        <div className="relative flex h-full min-h-0 min-w-0 flex-1 flex-col">
          {isPitchMode ? (
            <PdfPresentationView file={documentFile} arena />
          ) : (
            <UserVideo
              muted={muted}
              videoOff={videoOff}
              fill
              className="h-full w-full rounded-xl"
            />
          )}

          {isPitchMode && (
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
