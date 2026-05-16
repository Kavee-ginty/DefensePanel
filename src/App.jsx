import { useMemo, useState } from 'react';
import { Sparkles } from 'lucide-react';
import ModeSelection from './components/ModeSelection.jsx';
import ContextUpload from './components/ContextUpload.jsx';
import AvatarView from './components/AvatarView.jsx';
import DebriefDashboard from './components/DebriefDashboard.jsx';

const VIEWS = [
  { id: 'lobby', label: 'Lobby' },
  { id: 'briefing', label: 'Briefing' },
  { id: 'arena', label: 'Arena' },
  { id: 'debrief', label: 'Debrief' },
];

export default function App() {
  const [view, setView] = useState('lobby');
  const [mode, setMode] = useState(null);
  const [file, setFile] = useState(null);
  const [bargeFlash, setBargeFlash] = useState(0);
  const [sustainedBarge, setSustainedBarge] = useState(false);

  const panelLabel = useMemo(() => {
    if (!mode) return 'Panel stream';
    const map = { startup: 'Panelist (Core)', academic: 'Examiner', interview: 'Staff+ / HM' };
    return map[mode] ?? 'Panel stream';
  }, [mode]);

  const body = (() => {
    switch (view) {
      case 'lobby':
        return (
          <ModeSelection
            selectedId={mode}
            onSelect={(id) => setMode(id)}
          />
        );
      case 'briefing':
        return (
          <ContextUpload
            file={file}
            onFileChange={setFile}
            isLoading={false}
            onInitialize={() => setView('arena')}
          />
        );
      case 'arena':
        return (
          <div className="min-h-screen bg-zinc-950 p-4 font-sans text-zinc-50 sm:p-8">
            <div className="mx-auto flex max-w-6xl flex-col gap-4 lg:flex-row">
              <div className="flex-1">
                <div className="mb-2 text-xs font-medium uppercase tracking-wider text-zinc-500">
                  Your feed (placeholder)
                </div>
                <div className="aspect-video w-full overflow-hidden rounded-xl border border-cyan-400/40 bg-zinc-900 ring-2 ring-cyan-400/50" />
              </div>
              <div className="lg:w-[340px]">
                <div className="mb-2 text-xs font-medium uppercase tracking-wider text-zinc-500">
                  Beyond Presence
                </div>
                <AvatarView
                  connect={false}
                  label={panelLabel}
                  isBargeIn={sustainedBarge}
                  bargeInKey={bargeFlash}
                />
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs font-medium text-red-200 hover:bg-red-500/20"
                    onClick={() => setBargeFlash((k) => k + 1)}
                  >
                    Flash barge-in (demo)
                  </button>
                  <button
                    type="button"
                    className={`rounded-lg border px-3 py-2 text-xs font-medium ${
                      sustainedBarge
                        ? 'border-red-500 bg-red-500/20 text-red-100'
                        : 'border-zinc-700 bg-zinc-900 text-zinc-200'
                    }`}
                    onClick={() => setSustainedBarge((v) => !v)}
                  >
                    Toggle sustained barge
                  </button>
                  <button
                    type="button"
                    className="rounded-lg border border-zinc-700 px-3 py-2 text-xs text-zinc-300 hover:bg-zinc-900"
                    onClick={() => setView('debrief')}
                  >
                    End defense (demo)
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      case 'debrief':
        return (
          <DebriefDashboard
            onReturn={() => {
              setView('lobby');
              setMode(null);
              setFile(null);
            }}
          />
        );
      default:
        return null;
    }
  })();

  return (
    <div className="relative min-h-screen pb-20">
      {body}

      <div className="fixed bottom-4 left-4 right-4 z-50 flex flex-wrap items-center justify-center gap-2 rounded-xl border border-zinc-800 bg-zinc-950/90 px-3 py-2 text-xs text-zinc-300 shadow-lg backdrop-blur-md sm:left-auto sm:right-4 sm:w-auto">
        <span className="hidden sm:inline text-zinc-500">Preview</span>
        {VIEWS.map((v) => (
          <button
            key={v.id}
            type="button"
            onClick={() => setView(v.id)}
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
    </div>
  );
}
