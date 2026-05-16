import { useMemo, useState } from 'react';
import { getModeConfig } from '../config/modeConfig.js';
import AvatarView from './AvatarView.jsx';
import UserVideo from './UserVideo.jsx';
import ArenaControls from './ArenaControls.jsx';
import EndSessionModal from './EndSessionModal.jsx';

export default function SimulationArena({
  mode,
  documentFile = null,
  livekitPanels = [],
  onEndSession,
}) {
  const config = getModeConfig(mode);
  const [muted, setMuted] = useState(false);
  const [videoOff, setVideoOff] = useState(false);
  const [showEndModal, setShowEndModal] = useState(false);

  const panels = useMemo(() => {
    const defaults = config.panelists.map((p) => ({
      url: '',
      token: '',
      label: p.label,
      isBargeIn: false,
      bargeInKey: 0,
    }));
    if (!livekitPanels?.length) return defaults;
    return defaults.map((d, i) => ({
      ...d,
      ...(livekitPanels[i] || {}),
      label: livekitPanels[i]?.label ?? d.label,
    }));
  }, [config.panelists, livekitPanels]);

  const documentName = documentFile?.name ?? null;

  return (
    <div className="relative min-h-screen bg-black font-sans text-zinc-50">
      <div className="absolute left-4 top-4 z-10 hidden text-xs font-medium uppercase tracking-wider text-zinc-500 sm:block">
        {config.arenaSubtitle}
      </div>

      <div className="mx-auto flex min-h-screen max-w-7xl flex-col gap-4 p-4 pt-12 lg:flex-row lg:gap-6 lg:p-6 lg:pt-14">
        <div className="relative min-w-0 flex-1">
          <UserVideo
            muted={muted}
            videoOff={videoOff}
            documentName={documentName}
          />

          <div className="absolute bottom-4 left-4 flex items-center gap-2 rounded-full border border-white/10 bg-black/55 px-3 py-1.5 text-xs font-medium backdrop-blur-sm">
            <span
              className="h-2 w-2 animate-pulse rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]"
              aria-hidden
            />
            Live Recording
          </div>

          <div className="absolute bottom-4 left-1/2 z-10 -translate-x-1/2">
            <ArenaControls
              muted={muted}
              videoOff={videoOff}
              onToggleMute={() => setMuted((m) => !m)}
              onToggleVideo={() => setVideoOff((v) => !v)}
              onEndDefense={() => setShowEndModal(true)}
            />
          </div>
        </div>

        <div className="flex w-full shrink-0 flex-col gap-4 lg:w-[340px]">
          {panels.map((panel, index) => (
            <AvatarView
              key={panel.label + index}
              livekitUrl={panel.url}
              livekitToken={panel.token}
              connect={Boolean(panel.url && panel.token)}
              label={panel.label}
              isBargeIn={panel.isBargeIn}
              bargeInKey={panel.bargeInKey}
            />
          ))}
        </div>
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

