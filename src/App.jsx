import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useAuth } from './context/AuthContext.jsx';
import { getModeConfig } from './config/modeConfig.js';
import AppShell from './components/AppShell.jsx';
import AuthPage from './components/AuthPage.jsx';
import ModeSelection from './components/ModeSelection.jsx';
import ContextUpload from './components/ContextUpload.jsx';
import SimulationArena from './components/SimulationArena.jsx';
import DebriefDashboard from './components/DebriefDashboard.jsx';
import AboutPage from './components/pages/AboutPage.jsx';
import ContactPage from './components/pages/ContactPage.jsx';
import PricingPage from './components/pages/PricingPage.jsx';
import HistoryPage from './components/pages/HistoryPage.jsx';

export default function App() {
  const { session, user, loading, signOut } = useAuth();
  const [page, setPage] = useState('home');
  const [inSimulation, setInSimulation] = useState(false);
  const [view, setView] = useState('lobby');
  const [mode, setMode] = useState(null);
  const [file, setFile] = useState(null);

  const userLabel =
    user?.user_metadata?.username ||
    user?.email?.split('@')[0] ||
    null;

  const showDevNav = import.meta.env.DEV;

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

  const goLobby = () => {
    setView('lobby');
    setMode(null);
    setFile(null);
  };

  const navigateMarketing = (nextPage) => {
    setInSimulation(false);
    setPage(nextPage);
  };

  const startSimulation = () => {
    setInSimulation(true);
    setPage('home');
    setView(mode ? 'briefing' : 'lobby');
  };

  const navigateSim = (next) => {
    if (next === 'briefing' && !mode) return;
    if (next === 'arena' && (!mode || !file)) return;
    setInSimulation(true);
    setView(next);
  };

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
              onFileChange={setFile}
              onBack={goLobby}
              isLoading={false}
              onInitialize={() => navigateSim('arena')}
            />
          );
        case 'arena':
          return (
            <SimulationArena
              mode={mode}
              documentFile={file}
              onEndSession={() => navigateSim('debrief')}
            />
          );
        case 'debrief':
          return (
            <DebriefDashboard
              scenario={mode ? getModeConfig(mode).title : undefined}
              onReturn={goLobby}
            />
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
      case 'history':
        return <HistoryPage />;
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
      {body}
    </AppShell>
  );
}
