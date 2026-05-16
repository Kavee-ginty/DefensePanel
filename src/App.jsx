import { useEffect, useState } from 'react';
import { Loader2, Sparkles } from 'lucide-react';
import { useAuth } from './context/AuthContext.jsx';
import { getModeConfig } from './config/modeConfig.js';
import AuthPage from './components/AuthPage.jsx';
import ModeSelection from './components/ModeSelection.jsx';
import ContextUpload from './components/ContextUpload.jsx';
import SimulationArena from './components/SimulationArena.jsx';
import DebriefDashboard from './components/DebriefDashboard.jsx';

const VIEWS = [
  { id: 'lobby', label: 'Lobby' },
  { id: 'briefing', label: 'Briefing' },
  { id: 'arena', label: 'Arena' },
  { id: 'debrief', label: 'Debrief' },
];

export default function App() {
  const { session, user, loading, signOut } = useAuth();
  const [view, setView] = useState('lobby');
  const [mode, setMode] = useState(null);
  const [file, setFile] = useState(null);

  const userLabel =
    user?.user_metadata?.username ||
    user?.email?.split('@')[0] ||
    null;

  useEffect(() => {
    if (!session && view !== 'lobby') {
      setView('lobby');
      setMode(null);
      setFile(null);
    }
  }, [session, view]);

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

  const navigate = (next) => {
    if (next === 'briefing' && !mode) return;
    if (next === 'arena' && (!mode || !file)) return;
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
    switch (view) {
      case 'lobby':
        return (
          <ModeSelection
            selectedId={mode}
            onSelect={setMode}
            onContinue={() => navigate('briefing')}
            onSignOut={signOut}
            userLabel={userLabel}
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
            onInitialize={() => navigate('arena')}
          />
        );
      case 'arena':
        return (
          <SimulationArena
            mode={mode}
            documentFile={file}
            livekitPanels={[]}
            onEndSession={() => navigate('debrief')}
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
  })();

  const showDevNav = import.meta.env.DEV;

  return (
    <div className={showDevNav ? 'relative min-h-screen pb-20' : 'relative min-h-screen'}>
      {body}

      {showDevNav && (
        <div className="fixed bottom-4 left-4 right-4 z-50 flex flex-wrap items-center justify-center gap-2 rounded-xl border border-zinc-800 bg-zinc-950/90 px-3 py-2 text-xs text-zinc-300 shadow-lg backdrop-blur-md sm:left-auto sm:right-4 sm:w-auto">
          <span className="hidden sm:inline text-zinc-500">Preview</span>
          {VIEWS.map((v) => (
            <button
              key={v.id}
              type="button"
              onClick={() => navigate(v.id)}
              className={`rounded-lg px-2 py-1 font-medium transition-colors ${
                view === v.id
                  ? 'bg-zinc-800 text-white'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              {v.label}
            </button>
          ))}
          <Sparkles className="ml-1 h-3.5 w-3.5 text-zinc-500" aria-hidden />
        </div>
      )}
    </div>
  );
}
