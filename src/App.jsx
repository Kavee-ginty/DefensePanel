import { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from './context/AuthContext.jsx';
import { getModeConfig } from './config/modeConfig.js';
import {
  chartFromSessions,
  fetchSessions,
  setSessionBookmark,
} from './lib/sessionsApi.js';
import { buildInterimScores } from './lib/interimScoring.js';
import {
  modeToScenarioType,
  sessionToDebriefProps,
} from './lib/sessionUtils.js';
import { endSession as endSessionApi } from './lib/sessionApi.js';
import AppShell from './components/AppShell.jsx';
import AuthPage from './components/AuthPage.jsx';
import ModeSelection from './components/ModeSelection.jsx';

const ContextUpload = lazy(() => import('./components/ContextUpload.jsx'));
const SimulationArena = lazy(() => import('./components/SimulationArena.jsx'));
const DebriefDashboard = lazy(
  () => import('./components/DebriefDashboard.jsx'),
);
const AboutPage = lazy(() => import('./components/pages/AboutPage.jsx'));
const ContactPage = lazy(() => import('./components/pages/ContactPage.jsx'));
const PricingPage = lazy(() => import('./components/pages/PricingPage.jsx'));
const HistoryPage = lazy(
  () => import('./components/pages/HistoryPage.jsx'),
);
const DashboardPage = lazy(
  () => import('./components/pages/DashboardPage.jsx'),
);

const DEFAULT_BRIEFING_SETUP = {
  difficulty: 'standard',
  sessionMinutes: 5,
  panelPersona: 'investor',
  practiceGoals: [],
  visionMode: false,
};

const CACHE_TTL_MS = 30_000;

function RouteFallback() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center text-zinc-400">
      <Loader2 className="h-8 w-8 animate-spin" aria-hidden />
      <span className="sr-only">Loading</span>
    </div>
  );
}

export default function App() {
  const { session, user, loading, signOut } = useAuth();
  const [page, setPage] = useState('home');
  const [inSimulation, setInSimulation] = useState(false);
  const [view, setView] = useState('lobby');
  const [mode, setMode] = useState(null);
  const [file, setFile] = useState(null);
  const [agentSession, setAgentSession] = useState(null);
  const [activeSession, setActiveSession] = useState(null);
  const [scoreHistory, setScoreHistory] = useState([]);
  const [debriefFromHistory, setDebriefFromHistory] = useState(false);
  const [debriefSaving, setDebriefSaving] = useState(false);
  const [sessionError, setSessionError] = useState(null);
  const [sessionsCache, setSessionsCache] = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [sessionsError, setSessionsError] = useState(null);
  const [sessionsCacheFetchedAt, setSessionsCacheFetchedAt] = useState(0);
  const [briefingSetup, setBriefingSetup] = useState(DEFAULT_BRIEFING_SETUP);
  const [bookmarkUpdatingSessionId, setBookmarkUpdatingSessionId] =
    useState(null);

  const accessToken = session?.access_token ?? null;
  const userId = user?.id ?? null;

  const userLabel =
    user?.user_metadata?.username ||
    user?.email?.split('@')[0] ||
    null;

  const showDevNav = import.meta.env.DEV;

  const loadSessions = useCallback(
    async (background = false) => {
      if (!accessToken) return;
      if (!background) setSessionsLoading(true);
      setSessionsError(null);
      try {
        const { sessions: rows } = await fetchSessions(accessToken);
        setSessionsCache(rows ?? []);
        setSessionsCacheFetchedAt(Date.now());
      } catch (err) {
        console.error('[App] loadSessions', err);
        if (!background) {
          setSessionsError(err.message || 'Could not load sessions.');
        }
      } finally {
        if (!background) setSessionsLoading(false);
      }
    },
    [accessToken],
  );

  const patchSessionBookmark = useCallback(
    async (sessionId, bookmarked) => {
      if (!accessToken || !sessionId) return;
      setBookmarkUpdatingSessionId(sessionId);
      try {
        const { session: updated } = await setSessionBookmark(
          sessionId,
          bookmarked,
          accessToken,
        );
        setSessionsCache((prev) =>
          prev.map((s) => (s.id === updated.id ? updated : s)),
        );
        setActiveSession((prev) =>
          prev?.id === updated.id ? { ...prev, ...updated } : prev,
        );
        setSessionsCacheFetchedAt(Date.now());
      } catch (err) {
        console.error('[App] patchSessionBookmark', err);
        toast.error(err.message || 'Could not update bookmark');
      } finally {
        setBookmarkUpdatingSessionId(null);
      }
    },
    [accessToken],
  );

  useEffect(() => {
    if (!session && inSimulation) {
      setInSimulation(false);
      setPage('home');
    }
  }, [session, inSimulation]);

  useEffect(() => {
    if (view === 'briefing' && !mode) setView('lobby');
    if (view === 'arena' && (!mode || !file)) {
      setView(mode ? 'briefing' : 'lobby');
    }
  }, [view, mode, file]);

  useEffect(() => {
    if ((!['history', 'dashboard'].includes(page)) || !accessToken) return;
    const age = Date.now() - sessionsCacheFetchedAt;
    const hasFreshCache =
      sessionsCache.length > 0 && age < CACHE_TTL_MS;
    loadSessions(hasFreshCache);
  }, [page, accessToken]);

  const goLobby = () => {
    setView('lobby');
    setMode(null);
    setFile(null);
    setAgentSession(null);
    setActiveSession(null);
    setDebriefFromHistory(false);
    setDebriefSaving(false);
    setSessionError(null);
    setBriefingSetup(DEFAULT_BRIEFING_SETUP);
  };

  const handleAgentReady = useCallback((next) => {
    setAgentSession(next);
  }, []);

  const navigateMarketing = (nextPage) => {
    setInSimulation(false);
    setPage(nextPage);
    if (nextPage !== 'history') {
      setDebriefFromHistory(false);
    }
  };

  const startSimulation = () => {
    setInSimulation(true);
    setPage('home');
    setView(mode ? 'briefing' : 'lobby');
    setDebriefFromHistory(false);
  };

  const navigateSim = (next) => {
    if (next === 'briefing' && !mode) return;
    if (next === 'arena' && (!mode || !file)) return;
    setInSimulation(true);
    setView(next);
  };

  const openSessionDebrief = useCallback((row, allSessions) => {
    if (!row) return;
    const list = allSessions ?? sessionsCache;
    setSessionError(null);
    setActiveSession(row);
    setScoreHistory(chartFromSessions(list));
    setDebriefFromHistory(true);
    setDebriefSaving(false);
    setInSimulation(true);
    setView('debrief');
  }, [sessionsCache]);

  const handleEndSession = useCallback(
    async ({ durationSeconds, modeId }) => {
      const goDebrief = () => {
        setInSimulation(true);
        setView('debrief');
      };

      const scenarioType = modeToScenarioType(modeId);
      const interim = buildInterimScores(scenarioType, durationSeconds);
      const placeholder = {
        scenario_type: scenarioType,
        duration_seconds: durationSeconds,
        filler_word_count: interim.filler_word_count,
        critical_feedback: interim.critical_feedback,
        overall_score: interim.overall_score,
        created_at: new Date().toISOString(),
      };

      const projected = [placeholder, ...sessionsCache];
      setActiveSession(placeholder);
      setScoreHistory(chartFromSessions(projected));
      setDebriefFromHistory(false);
      setSessionError(null);
      setFile(null);
      goDebrief();

      if (!accessToken || !userId) return;

      setDebriefSaving(true);
      try {
        const { session: saved, agent_deleted } = await endSessionApi(
          {
            agent_id: agentSession?.agentId ?? null,
            scenario_type: scenarioType,
            mode_id: modeId,
            duration_seconds: durationSeconds,
          },
          accessToken,
        );

        if (!saved) {
          throw new Error('end-session did not return a saved row');
        }

        setActiveSession(saved);
        const nextCache = [
          saved,
          ...sessionsCache.filter((s) => s.id !== saved.id),
        ];
        setSessionsCache(nextCache);
        setScoreHistory(chartFromSessions(nextCache));
        setSessionsCacheFetchedAt(Date.now());
        if (agent_deleted) {
          setAgentSession(null);
        }
      } catch (err) {
        console.error('[App] handleEndSession', err);
        setSessionError(err.message);
        toast.error(
          `Grading failed: ${err.message}. Showing local debrief only.`,
          { duration: 5000 },
        );
      } finally {
        setDebriefSaving(false);
      }
    },
    [accessToken, userId, sessionsCache, agentSession],
  );

  const handleDebriefReturn = () => {
    goLobby();
  };

  const handleDebriefGoHistory = useCallback(() => {
    setActiveSession(null);
    setDebriefFromHistory(false);
    setDebriefSaving(false);
    setSessionError(null);
    setFile(null);
    setInSimulation(false);
    setPage('history');
    setView('lobby');
    if (accessToken) {
      void loadSessions(false);
    }
  }, [accessToken, loadSessions]);

  const debriefProps = sessionToDebriefProps(activeSession);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 text-zinc-400">
        <Loader2 className="h-8 w-8 animate-spin" aria-hidden />
        <span className="sr-only">Loading</span>
      </div>
    );
  }

  if (!session) {
    return <AuthPage />;
  }

  const body = (() => {
    if (inSimulation) {
      switch (view) {
        case 'lobby':
          return (
            <ModeSelection
              selectedId={mode}
              onSelect={setMode}
              onContinue={() => navigateSim('briefing')}
            />
          );
        case 'briefing':
          return (
            <ContextUpload
              mode={mode}
              file={file}
              briefingSetup={briefingSetup}
              onBriefingSetupChange={setBriefingSetup}
              onFileChange={setFile}
              onBack={goLobby}
              onAgentReady={handleAgentReady}
              onInitialize={() => navigateSim('arena')}
            />
          );
        case 'arena':
          return (
            <SimulationArena
              mode={mode}
              documentFile={file}
              agentId={agentSession?.agentId ?? null}
              agentEmbedUrl={agentSession?.agentEmbedUrl ?? null}
              briefingSetup={briefingSetup}
              onEndSession={handleEndSession}
            />
          );
        case 'debrief':
          return (
            <>
              {sessionError && (
                <div className="mx-auto max-w-6xl px-4 pt-4">
                  <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-center text-sm text-amber-200">
                    {sessionError} — showing local debrief only.
                  </p>
                </div>
              )}
              <DebriefDashboard
                {...debriefProps}
                isLoading={debriefSaving}
                scenario={
                  debriefProps.scenario ??
                  (mode ? getModeConfig(mode).title : undefined)
                }
                scoreHistory={
                  scoreHistory.length > 0
                    ? scoreHistory
                    : activeSession
                      ? [{ label: 'S1', score: activeSession.overall_score }]
                      : []
                }
                sessionRecord={activeSession}
                allSessions={sessionsCache}
                patchSessionBookmark={patchSessionBookmark}
                bookmarkUpdatingSessionId={bookmarkUpdatingSessionId}
                onReturn={handleDebriefReturn}
                onGoHistory={handleDebriefGoHistory}
              />
            </>
          );
        default:
          return null;
      }
    }

    switch (page) {
      case 'home':
        return (
          <ModeSelection
            selectedId={mode}
            onSelect={setMode}
            onContinue={() => {
              setInSimulation(true);
              navigateSim('briefing');
            }}
          />
        );
      case 'about':
        return <AboutPage />;
      case 'contact':
        return <ContactPage />;
      case 'pricing':
        return <PricingPage onStartSimulation={startSimulation} />;
      case 'dashboard':
        return (
          <DashboardPage
            sessions={sessionsCache}
            loading={sessionsLoading}
            error={sessionsError}
            onRetry={() => loadSessions(false)}
            onGoHistory={() => navigateMarketing('history')}
          />
        );
      case 'history':
        return (
          <HistoryPage
            sessions={sessionsCache}
            loading={sessionsLoading}
            error={sessionsError}
            onRetry={() => loadSessions(false)}
            patchSessionBookmark={patchSessionBookmark}
            bookmarkUpdatingSessionId={bookmarkUpdatingSessionId}
            onOpenSession={(row) =>
              openSessionDebrief(row, sessionsCache)
            }
          />
        );
      default:
        return (
          <ModeSelection
            selectedId={mode}
            onSelect={setMode}
            onContinue={() => {
              setInSimulation(true);
              navigateSim('briefing');
            }}
          />
        );
    }
  })();

  const activePage = inSimulation ? null : page;

  return (
    <AppShell
      activePage={activePage ?? 'home'}
      userLabel={userLabel}
      onNavigate={navigateMarketing}
      onSignOut={signOut}
      inSimulation={inSimulation}
      simView={view}
      onSimNavigate={navigateSim}
      showDevNav={showDevNav}
    >
      <Suspense fallback={<RouteFallback />}>{body}</Suspense>
    </AppShell>
  );
}
