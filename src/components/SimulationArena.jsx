import { useMemo, useState } from 'react';
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

  const panelColumn = (
    <div className="flex w-full shrink-0 flex-col gap-4 lg:w-[340px]">
      {panels.map((panel, index) => (
        <BeyPanelFrame
          key={panel.label + index}
          embedUrl={panel.embedUrl}
          label={panel.label}
          isBargeIn={panel.isBargeIn}
        />
      ))}
    </div>
  );

  const liveBadge = (
    <div className="absolute bottom-4 left-4 flex items-center gap-2 rounded-full border border-white/10 bg-black/55 px-3 py-1.5 text-xs font-medium backdrop-blur-sm">
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

  return (
    <div className="relative min-h-screen bg-black font-sans text-zinc-50">
      <div className="absolute left-4 top-4 z-10 hidden text-xs font-medium uppercase tracking-wider text-zinc-500 sm:block">
        {config.arenaSubtitle}
      </div>

      <div className="mx-auto flex min-h-screen max-w-7xl flex-col gap-4 p-4 pt-12 lg:flex-row lg:gap-6 lg:p-6 lg:pt-14">
        {isPitchMode ? (
          <>
            <div className="relative min-w-0 flex-1">
              <PdfPresentationView file={documentFile} className="h-full" />

              <div className="absolute right-3 top-3 z-20 w-[min(100%,240px)] overflow-hidden rounded-xl border border-zinc-700/80 shadow-[0_8px_32px_rgba(0,0,0,0.65)] ring-2 ring-cyan-400/50 sm:right-4 sm:top-4 sm:w-[280px]">
                <UserVideo muted={muted} videoOff={videoOff} className="aspect-video" />
                <div className="absolute bottom-2 left-2 rounded-full border border-white/10 bg-black/60 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-zinc-300 backdrop-blur-sm">
                  Presenter
                </div>
              </div>

              {liveBadge}
              {arenaControls}
            </div>
            {panelColumn}
          </>
        ) : (
          <>
            <div className="relative min-w-0 flex-1">
              <UserVideo
                muted={muted}
                videoOff={videoOff}
                documentName={documentFile?.name ?? null}
              />
              {liveBadge}
              {arenaControls}
            </div>
            {panelColumn}
          </>
        )}
      </div>

      <EndSessionModal
        open={showEndModal}
        onCancel={() => setShowEndModal(false)}
        onConfirm={() => {
          setShowEndModal(false);
          onEndSession?.();
        }}
      />
    </div>
  );
}
