import {
  Briefcase,
  GraduationCap,
  Laptop,
  Mic,
  Sparkles,
  Upload,
  Zap,
} from 'lucide-react';
import MarketingLayout from './MarketingLayout.jsx';

const DEFAULT_MODES = [
  {
    id: 'startup',
    title: 'Startup Pitch',
    description: 'VC-style defense of traction, revenue, and architecture.',
    icon: Briefcase,
  },
  {
    id: 'academic',
    title: 'Academic Viva',
    description: 'Rigorous questioning on methodology and claims.',
    icon: GraduationCap,
  },
  {
    id: 'interview',
    title: 'Technical Interview',
    description: 'Deep dive on resume claims and live problem solving.',
    icon: Laptop,
  },
];

const FEATURES = [
  {
    icon: Mic,
    title: 'Live AI panelists',
    text: 'Beyond Presence avatars interrupt and probe weak claims in real time.',
  },
  {
    icon: Upload,
    title: 'Document-aware',
    text: 'Upload your deck, thesis, or CV so questions target your actual content.',
  },
  {
    icon: Zap,
    title: 'Instant debrief',
    text: 'Scores, filler words, and critical feedback after every session.',
  },
];

const STEPS = [
  { n: '01', label: 'Choose a mode', detail: 'Pitch, viva, or interview' },
  { n: '02', label: 'Upload context', detail: 'PDF deck, paper, or CV' },
  { n: '03', label: 'Enter the arena', detail: 'Defend live against the panel' },
];

const iconMap = {
  startup: Briefcase,
  academic: GraduationCap,
  interview: Laptop,
};

export default function ModeSelection({
  modes = DEFAULT_MODES,
  selectedId = null,
  onSelect,
  onContinue,
  disabled = false,
}) {
  return (
    <MarketingLayout>
      <div className="mx-auto max-w-5xl px-6 pb-20 pt-4 sm:pt-8">
        <section className="mb-16 text-center">
          <p className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-300">
            <Sparkles className="h-3.5 w-3.5" aria-hidden />
            AI-powered defense rehearsal
          </p>
          <h1 className="mt-6 text-4xl font-bold tracking-tight sm:text-5xl">
            Train under pressure.
            <br />
            <span className="text-zinc-400">Perform when it counts.</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-zinc-400">
            The Defense Panel puts you in a high-stakes interrogation room with
            AI investors, examiners, and hiring managers — before the real panel
            ever sees your slides.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => {
                document
                  .getElementById('sim-modes')
                  ?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-[0_0_20px_rgba(37,99,235,0.45)] transition-colors hover:bg-blue-500"
            >
              Start a simulation
            </button>
            <a
              href="#sim-modes"
              className="rounded-xl border border-zinc-700 px-6 py-3 text-sm font-medium text-zinc-300 transition-colors hover:border-zinc-500 hover:text-white"
            >
              Explore modes
            </a>
          </div>
        </section>

        <section className="mb-16 grid gap-4 sm:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, text }) => (
            <div
              key={title}
              className="rounded-xl border border-zinc-800/80 bg-zinc-900/50 p-5 backdrop-blur-sm"
            >
              <Icon className="mb-3 h-6 w-6 text-cyan-400" aria-hidden />
              <h2 className="text-sm font-semibold text-zinc-100">{title}</h2>
              <p className="mt-1 text-xs leading-relaxed text-zinc-500">{text}</p>
            </div>
          ))}
        </section>

        <section className="mb-16 rounded-2xl border border-zinc-800/80 bg-zinc-900/50 p-6 sm:p-8">
          <h2 className="text-center text-sm font-semibold uppercase tracking-widest text-zinc-500">
            How it works
          </h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-3">
            {STEPS.map((step) => (
              <div key={step.n} className="text-center">
                <span className="text-2xl font-bold text-blue-500/80">{step.n}</span>
                <p className="mt-2 font-medium text-zinc-200">{step.label}</p>
                <p className="mt-1 text-xs text-zinc-500">{step.detail}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="sim-modes">
          <header className="mb-8 text-center">
            <h2 className="text-2xl font-bold tracking-tight">
              Choose your simulation
            </h2>
            <p className="mx-auto mt-2 max-w-lg text-sm text-zinc-400">
              Select a mode, upload your document, then enter the live arena with
              AI panelists.
            </p>
          </header>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {modes.map((mode) => {
              const Icon =
                typeof mode.icon === 'function'
                  ? mode.icon
                  : iconMap[mode.id] ?? Briefcase;
              const isSelected = selectedId === mode.id;
              return (
                <button
                  key={mode.id}
                  type="button"
                  disabled={disabled}
                  onClick={() => onSelect?.(mode.id)}
                  aria-pressed={isSelected}
                  className={[
                    'group relative rounded-xl border bg-zinc-900/50 p-6 text-left backdrop-blur-md transition-all duration-200',
                    'hover:border-zinc-500 hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500',
                    isSelected
                      ? 'border-blue-500 ring-1 ring-blue-500/50 shadow-[0_0_20px_rgba(59,130,246,0.25)]'
                      : 'border-zinc-800',
                    disabled ? 'pointer-events-none opacity-50' : '',
                  ].join(' ')}
                >
                  {isSelected && (
                    <span className="absolute right-3 top-3 rounded-full bg-blue-500/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-blue-300">
                      Selected
                    </span>
                  )}
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-zinc-900/80 text-zinc-300 transition-transform group-hover:scale-105">
                    <Icon className="h-5 w-5" strokeWidth={2} aria-hidden />
                  </div>
                  <h3 className="text-lg font-semibold tracking-tight">
                    {mode.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                    {mode.description}
                  </p>
                </button>
              );
            })}
          </div>

          {onContinue && (
            <div className="mt-10 flex justify-center">
              <button
                type="button"
                disabled={!selectedId || disabled}
                onClick={() => onContinue(selectedId)}
                className="min-w-[220px] rounded-xl bg-blue-600 px-8 py-3 text-sm font-semibold text-white shadow-[0_0_15px_rgba(37,99,235,0.5)] transition-all hover:bg-blue-500 disabled:pointer-events-none disabled:opacity-40"
              >
                Continue to briefing
              </button>
            </div>
          )}
        </section>
      </div>
    </MarketingLayout>
  );
}

export { DEFAULT_MODES };
