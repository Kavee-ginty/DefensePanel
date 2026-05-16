import {
  Briefcase,
  GraduationCap,
  Laptop,
  LogOut,
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
  onContinue,
  onSignOut,
  userLabel = null,
  disabled = false,
}) {
  return (
    <div className="min-h-screen bg-zinc-950 font-sans text-zinc-50">
      <div className="mx-auto flex min-h-screen max-w-4xl flex-col justify-center px-6 py-16">
        {(userLabel || onSignOut) && (
          <div className="mb-6 flex items-center justify-between">
            {userLabel ? (
              <p className="text-sm text-zinc-400">
                Signed in as{' '}
                <span className="font-medium text-zinc-200">{userLabel}</span>
              </p>
            ) : (
              <span />
            )}
            {onSignOut && (
              <button
                type="button"
                onClick={onSignOut}
                className="flex items-center gap-2 rounded-lg border border-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-400 transition-colors hover:border-zinc-600 hover:text-zinc-200"
              >
                <LogOut className="h-3.5 w-3.5" aria-hidden />
                Sign out
              </button>
            )}
          </div>
        )}

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
                  'group relative rounded-xl border bg-zinc-900/40 p-6 text-left backdrop-blur-md transition-all duration-200',
                  'hover:border-zinc-500 hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950',
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

        {onContinue && (
          <div className="mt-10 flex justify-center">
            <button
              type="button"
              disabled={!selectedId || disabled}
              onClick={() => onContinue(selectedId)}
              className="min-w-[200px] rounded-xl bg-blue-600 px-8 py-3 text-sm font-semibold text-white shadow-[0_0_15px_rgba(37,99,235,0.5)] transition-all duration-150 hover:scale-[1.02] hover:bg-blue-500 disabled:pointer-events-none disabled:opacity-40"
            >
              Continue
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export { DEFAULT_MODES };

