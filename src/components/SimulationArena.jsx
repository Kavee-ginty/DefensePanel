import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MessageSquare, Play } from 'lucide-react';
import { getModeConfig } from '../config/modeConfig.js';
import { getBeyEmbedUrl } from '../config/beyEmbeds.js';
import BeyPanelFrame from './BeyPanelFrame.jsx';
import BeyAgentCall from './BeyAgentCall.jsx';
import PdfPresentationView from './PdfPresentationView.jsx';
import UserVideo from './UserVideo.jsx';
import ArenaControls from './ArenaControls.jsx';
import EndSessionModal from './EndSessionModal.jsx';

const PERSONA_LABEL = {
  investor: 'Investor',
  cto: 'CTO',
  cfo: 'CFO',
  professor: 'Professor',
  research_critic: 'Research Critic',
  external_examiner: 'External Examiner',
  interviewer: 'Interviewer',
  hiring_manager: 'Hiring Manager',
};

const TIMER_R = 20;
const TIMER_CIRC = 2 * Math.PI * TIMER_R;

function formatDifficulty(raw) {
  if (!raw) return 'Standard';
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

function formatMmSs(totalSeconds) {
  const s = Math.max(0, Math.floor(totalSeconds));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`;
}

const THIRTY_SECOND_AVATAR_PROMPT =
  'SYSTEM TIMER NOTICE: Tell the candidate the interview will end in 30 seconds, ask for a concise final answer, and then wrap up gracefully. Do not end the session yourself.';

const FIVE_SECOND_AVATAR_PROMPT =
  'SYSTEM TIMER NOTICE: Tell the candidate they have only 5 seconds left — ask them to wrap up their final point now. Do not end the session yourself.';

/** If the panel never speaks, start the goal timer anyway (LiveKit path). */
const TIMER_SPEECH_FALLBACK_MS = 120_000;

/** Iframe embed has no speech hook — shorter fallback after session starts. */
const TIMER_IFRAME_FALLBACK_MS = 45_000;

export default function SimulationArena({
  mode,
  documentFile = null,
  agentId = null,
  agentEmbedUrl = null,
  briefingSetup = null,
  onEndSession,
}) {
  const config = getModeConfig(mode);
  const showDocPreview = Boolean(documentFile);
  const sessionStartedAt = useRef(Date.now());
  const defenseStartedAt = useRef(Date.now());
  const beyAgentRef = useRef(null);
  const startFinishTimeoutRef = useRef(null);
  const timerRunningRef = useRef(false);
  const timerEverStartedRef = useRef(false);
  const [started, setStarted] = useState(false);
  const [timerRunning, setTimerRunning] = useState(false);
  const [startTransition, setStartTransition] = useState(false);
  const [muted, setMuted] = useState(false);
  const [videoOff, setVideoOff] = useState(false);
  const [showEndModal, setShowEndModal] = useState(false);
  const [chatText, setChatText] = useState('');
  const [chatSending, setChatSending] = useState(false);
  const [chatError, setChatError] = useState(null);
  const [remainingSeconds, setRemainingSeconds] = useState(() => {
    const mins = briefingSetup?.sessionMinutes ?? 5;
    return Math.max(0, mins * 60);
  });
  const thirtySecondWarningSentRef = useRef(false);
  const fiveSecondWarningSentRef = useRef(false);

  const usesLiveKitPanel = Boolean(agentId);

  const uiTotalSeconds = useMemo(() => {
    const mins = briefingSetup?.sessionMinutes ?? 5;
    return Math.max(1, mins * 60);
  }, [briefingSetup?.sessionMinutes]);

  // Slot 0 uses the freshly-generated agent: LiveKit (headless) when we have
  // agentId; otherwise iframe embed if only URL is available. Remaining slots
  // use static config URLs.
  const panels = useMemo(
    () =>
      config.panelists.map((p, index) => {
        const useHeadlessLiveKit = index === 0 && Boolean(agentId);
        const useAgentIframe =
          index === 0 && Boolean(agentEmbedUrl) && !useHeadlessLiveKit;

        let embedUrl = p.beyChatUrl ?? getBeyEmbedUrl(index);
        if (useAgentIframe) embedUrl = agentEmbedUrl;

        const isLiveSlot = useHeadlessLiveKit || useAgentIframe;

        return {
          label: isLiveSlot ? `${p.label} · Live` : p.label,
          embedUrl,
          isBargeIn: false,
          useHeadlessLiveKit,
        };
      }),
    [config.panelists, agentId, agentEmbedUrl],
  );

  const startInterviewTimer = useCallback(() => {
    if (timerRunningRef.current) return;
    timerRunningRef.current = true;
    timerEverStartedRef.current = true;
    sessionStartedAt.current = Date.now();
    thirtySecondWarningSentRef.current = false;
    fiveSecondWarningSentRef.current = false;
    setRemainingSeconds(uiTotalSeconds);
    setTimerRunning(true);
  }, [uiTotalSeconds]);

  const handleAvatarFirstSpeech = useCallback(() => {
    startInterviewTimer();
  }, [startInterviewTimer]);

  const handleEndConfirm = () => {
    setShowEndModal(false);
    const anchor = timerEverStartedRef.current
      ? sessionStartedAt.current
      : defenseStartedAt.current;
    const durationSeconds = Math.max(
      1,
      Math.round((Date.now() - anchor) / 1000),
    );
    onEndSession?.({
      durationSeconds,
      modeId: mode,
    });
  };

  const handleStartDefense = () => {
    if (started || startTransition) return;
    setStartTransition(true);
    if (startFinishTimeoutRef.current) {
      window.clearTimeout(startFinishTimeoutRef.current);
    }
    startFinishTimeoutRef.current = window.setTimeout(() => {
      defenseStartedAt.current = Date.now();
      timerRunningRef.current = false;
      timerEverStartedRef.current = false;
      thirtySecondWarningSentRef.current = false;
      fiveSecondWarningSentRef.current = false;
      setTimerRunning(false);
      setRemainingSeconds(uiTotalSeconds);
      setStarted(true);
      setStartTransition(false);
      startFinishTimeoutRef.current = null;
    }, 550);
  };

  useEffect(() => {
    return () => {
      if (startFinishTimeoutRef.current) {
        window.clearTimeout(startFinishTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!started || timerRunning) return undefined;

    const fallbackMs = usesLiveKitPanel
      ? TIMER_SPEECH_FALLBACK_MS
      : TIMER_IFRAME_FALLBACK_MS;
    const id = window.setTimeout(() => {
      startInterviewTimer();
    }, fallbackMs);

    return () => window.clearTimeout(id);
  }, [started, timerRunning, usesLiveKitPanel, startInterviewTimer]);

  useEffect(() => {
    if (!started || !timerRunning) return undefined;

    const tick = () => {
      const elapsedSec = (Date.now() - sessionStartedAt.current) / 1000;
      const rem = Math.max(0, Math.floor(uiTotalSeconds - elapsedSec));
      setRemainingSeconds(rem);

      const api = beyAgentRef.current;
      if (rem > 0 && rem <= 5 && !fiveSecondWarningSentRef.current) {
        fiveSecondWarningSentRef.current = true;
        if (api?.sendMessage) {
          void api.sendMessage(FIVE_SECOND_AVATAR_PROMPT).catch(() => {});
        }
      }

      if (rem > 0 && rem <= 30 && !thirtySecondWarningSentRef.current) {
        thirtySecondWarningSentRef.current = true;
        if (api?.sendMessage) {
          void api.sendMessage(THIRTY_SECOND_AVATAR_PROMPT).catch(() => {});
        }
      }
    };

    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [started, timerRunning, uiTotalSeconds]);

  const handleSendChat = useCallback(
    async (e) => {
      e?.preventDefault();
      const msg = chatText.trim();
      if (!msg || chatSending) return;
      setChatSending(true);
      setChatError(null);
      try {
        const api = beyAgentRef.current;
        if (!api?.sendMessage) {
          throw new Error('Panelist chat is not available');
        }
        await api.sendMessage(msg);
        setChatText('');
      } catch (err) {
        setChatError(err?.message || 'Could not send message');
      } finally {
        setChatSending(false);
      }
    },
    [chatText, chatSending],
  );

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

  const timerWaiting = started && !timerRunning;
  const timerRingProgress = timerWaiting
    ? 1
    : started && remainingSeconds > 0
      ? remainingSeconds / uiTotalSeconds
      : started
        ? 0
        : 1;
  const dashOffset = TIMER_CIRC * (1 - timerRingProgress);
  const timerUrgent =
    timerRunning && remainingSeconds > 0 && remainingSeconds <= 30;
  const timerFinalSeconds =
    timerRunning && remainingSeconds > 0 && remainingSeconds <= 5;
  const timerExpired = timerRunning && remainingSeconds <= 0;

  const liveAndTimer = started && (
    <div
      className={[
        'absolute left-3 top-2 z-10 flex items-center gap-3 rounded-2xl border px-3 py-2.5 backdrop-blur-sm sm:left-4 sm:top-3',
        timerWaiting
          ? 'border-cyan-500/35 bg-cyan-950/40'
          : timerUrgent || timerFinalSeconds
            ? 'border-red-500/50 bg-red-950/50'
            : timerExpired
              ? 'border-amber-500/40 bg-amber-950/70'
              : 'border-white/10 bg-black/55',
      ].join(' ')}
      role="timer"
      aria-live="polite"
      aria-label={
        timerWaiting
          ? 'Waiting for panelist to begin'
          : remainingSeconds <= 0
            ? 'Interview goal time reached'
            : `Time remaining: ${formatMmSs(remainingSeconds)}`
      }
    >
      <div className="relative h-11 w-11 shrink-0">
        <svg
          className="h-11 w-11 -rotate-90"
          viewBox="0 0 44 44"
          aria-hidden
        >
          <circle
            cx="22"
            cy="22"
            r={TIMER_R}
            fill="none"
            className="stroke-white/10"
            strokeWidth="3"
          />
          <circle
            cx="22"
            cy="22"
            r={TIMER_R}
            fill="none"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={TIMER_CIRC}
            strokeDashoffset={dashOffset}
            className={[
              'transition-[stroke-dashoffset] duration-1000 ease-linear',
              timerWaiting
                ? 'stroke-cyan-400/60'
                : timerExpired
                  ? 'stroke-amber-400/80'
                  : timerUrgent || timerFinalSeconds
                    ? 'stroke-red-500'
                    : 'stroke-cyan-400',
            ].join(' ')}
          />
        </svg>
      </div>
      <div className="flex min-w-0 flex-col">
        {timerWaiting ? (
          <span className="text-xs font-medium text-cyan-100">
            Waiting for panelist…
          </span>
        ) : remainingSeconds <= 0 ? (
          <span className="text-xs font-medium text-amber-100">
            Time reached — wrap up when ready
          </span>
        ) : (
          <span
            className={[
              'font-mono text-lg font-semibold tabular-nums leading-none',
              timerUrgent || timerFinalSeconds ? 'text-red-200' : 'text-zinc-100',
            ].join(' ')}
          >
            {formatMmSs(remainingSeconds)}
          </span>
        )}
        <span
          className={[
            'mt-1 text-[10px] font-medium uppercase tracking-wider',
            timerWaiting
              ? 'text-cyan-400/80'
              : timerUrgent || timerFinalSeconds
                ? 'text-red-400/90'
                : 'text-zinc-500',
          ].join(' ')}
        >
          {timerWaiting
            ? 'Timer paused'
            : remainingSeconds <= 0
              ? 'Goal time'
              : timerFinalSeconds
                ? 'Wrap up'
                : 'Remaining'}
        </span>
      </div>
    </div>
  );

  const arenaControls = started && (
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
      <div className="flex min-h-0 flex-1 flex-col gap-3">
        {panels.map((panel, index) =>
          panel.useHeadlessLiveKit ? (
            <BeyAgentCall
              ref={beyAgentRef}
              key="bey-livekit-slot"
              agentId={agentId}
              started={started}
              muted={muted}
              label={panel.label}
              fillHeight
              onAvatarFirstSpeech={handleAvatarFirstSpeech}
            />
          ) : (
            <BeyPanelFrame
              key={panel.label + index}
              embedUrl={panel.embedUrl}
              label={panel.label}
              isBargeIn={panel.isBargeIn}
              fillHeight
            />
          ),
        )}
      </div>

      {started && agentId && (
        <form
          onSubmit={handleSendChat}
          className="shrink-0 rounded-xl border border-white/10 bg-zinc-950/80 p-2.5 shadow-lg backdrop-blur-sm"
        >
          <div className="flex gap-2">
            <input
              type="text"
              value={chatText}
              onChange={(ev) => {
                setChatText(ev.target.value);
                if (chatError) setChatError(null);
              }}
              placeholder="Send message to avatar..."
              disabled={chatSending}
              autoComplete="off"
              className="min-w-0 flex-1 rounded-lg border border-zinc-700/80 bg-black/50 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-cyan-500/50 focus:outline-none focus:ring-1 focus:ring-cyan-500/40 disabled:opacity-50"
              aria-label="Message to avatar"
            />
            <button
              type="submit"
              disabled={!chatText.trim() || chatSending}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-cyan-500/35 bg-cyan-500/15 px-3 py-2 text-sm font-semibold text-cyan-50 transition-colors hover:bg-cyan-500/25 disabled:pointer-events-none disabled:opacity-40"
            >
              <MessageSquare className="h-4 w-4" strokeWidth={2} aria-hidden />
              Chat
            </button>
          </div>
          {chatError && (
            <p className="mt-2 text-xs text-red-300" role="alert">
              {chatError}
            </p>
          )}
        </form>
      )}
    </div>
  );

  return (
    <div className="relative overflow-hidden bg-black font-sans text-zinc-50">
      <div className="absolute left-4 top-2 z-10 hidden text-xs font-medium uppercase tracking-wider text-zinc-500 sm:block">
        {config.arenaSubtitle}
      </div>
      {rehearsalHint}

      <div className="relative mx-auto flex h-[calc(100dvh-4.75rem)] max-h-[calc(100dvh-4.75rem)] max-w-6xl flex-col gap-4 overflow-hidden p-4 pt-2 lg:flex-row lg:gap-6 lg:p-6">
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

          {liveAndTimer}
          {arenaControls}
        </div>
        {panelColumn}

        {!started && (
          <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-black/80 px-6 backdrop-blur-sm">
            <button
              type="button"
              onClick={handleStartDefense}
              disabled={startTransition}
              className={[
                'z-50 flex items-center gap-2 rounded-full border border-cyan-500/40 bg-cyan-500/20 px-8 py-3 text-base font-semibold text-cyan-50 shadow-[0_0_24px_rgba(34,211,238,0.25)] transition-all duration-500 ease-out hover:bg-cyan-500/30 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-black disabled:opacity-90',
                startTransition
                  ? 'translate-y-[min(38dvh,22rem)] scale-[0.92] opacity-70'
                  : 'translate-y-0 scale-100 opacity-100',
              ].join(' ')}
            >
              <Play className="h-5 w-5 shrink-0" strokeWidth={2} aria-hidden />
              Start Defense
            </button>
          </div>
        )}
      </div>

      <EndSessionModal
        open={showEndModal}
        onCancel={() => setShowEndModal(false)}
        onConfirm={handleEndConfirm}
      />
    </div>
  );
}
