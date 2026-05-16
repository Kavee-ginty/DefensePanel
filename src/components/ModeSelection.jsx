import {
  Briefcase,
  GraduationCap,
  Laptop,
} from 'lucide-react';

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

const iconMap = {
  startup: Briefcase,
  academic: GraduationCap,
  interview: Laptop,
};

export default function ModeSelection({
  modes = DEFAULT_MODES,
  selectedId = null,
  onSelect,
  disabled = false,
}) {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 font-sans">
      <div className="mx-auto flex min-h-screen max-w-4xl flex-col justify-center px-6 py-16">
        <header className="mb-12 text-center">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            The Defense Panel
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-base text-zinc-400">
            Select a simulation mode. You will upload context next, then enter
            the live arena.
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
                  'group rounded-xl border bg-zinc-900/40 p-6 text-left backdrop-blur-md transition-all duration-200',
                  'hover:border-zinc-500 hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950',
                  isSelected
                    ? 'border-blue-500 ring-1 ring-blue-500/50 shadow-[0_0_20px_rgba(59,130,246,0.25)]'
                    : 'border-zinc-800',
                  disabled ? 'pointer-events-none opacity-50' : '',
                ].join(' ')}
              >
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-zinc-900/80 text-zinc-300 transition-transform duration-150 group-hover:scale-105">
                  <Icon className="h-5 w-5" strokeWidth={2} aria-hidden />
                </div>
                <h2 className="text-lg font-semibold tracking-tight">
                  {mode.title}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                  {mode.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export { DEFAULT_MODES };
