import { LogOut, Shield } from 'lucide-react';

const MARKETING_LINKS = [
  { id: 'home', label: 'Home' },
  { id: 'about', label: 'About' },
  { id: 'contact', label: 'Contact' },
  { id: 'pricing', label: 'Pricing' },
  { id: 'history', label: 'History' },
];

const DEV_VIEWS = [
  { id: 'lobby', label: 'Lobby' },
  { id: 'briefing', label: 'Briefing' },
  { id: 'arena', label: 'Arena' },
  { id: 'debrief', label: 'Debrief' },
];

export default function TopNav({
  activePage = 'home',
  userLabel = null,
  onNavigate,
  onSignOut,
  inSimulation = false,
  simView = null,
  onSimNavigate,
  showDevNav = false,
}) {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-zinc-800/80 bg-zinc-950/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 py-3 sm:px-6">
        <button
          type="button"
          onClick={() => onNavigate?.('home')}
          className="flex items-center gap-2 text-sm font-semibold tracking-tight text-zinc-50 transition-colors hover:text-white"
        >
          <Shield className="h-4 w-4 text-blue-500" aria-hidden />
          The Defense Panel
        </button>

        <nav className="flex flex-1 flex-wrap items-center gap-1 sm:gap-2" aria-label="Main">
          {MARKETING_LINKS.map((link) => (
            <button
              key={link.id}
              type="button"
              onClick={() => onNavigate?.(link.id)}
              className={[
                'rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors sm:text-sm',
                activePage === link.id && !inSimulation
                  ? 'bg-zinc-800 text-white'
                  : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100',
              ].join(' ')}
            >
              {link.label}
            </button>
          ))}
        </nav>

        <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
          {userLabel && (
            <span className="hidden text-xs text-zinc-500 sm:inline">
              {userLabel}
            </span>
          )}
          {onSignOut && (
            <button
              type="button"
              onClick={onSignOut}
              className="flex items-center gap-1.5 rounded-lg border border-zinc-800 px-2.5 py-1.5 text-xs font-medium text-zinc-400 transition-colors hover:border-zinc-600 hover:text-zinc-200"
            >
              <LogOut className="h-3.5 w-3.5" aria-hidden />
              Sign out
            </button>
          )}
        </div>
      </div>

      {showDevNav && (
        <div className="border-t border-zinc-800/60 bg-zinc-950/95 px-4 py-2">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-2">
            <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-600">
              Dev preview
            </span>
            {DEV_VIEWS.map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => onSimNavigate?.(v.id)}
                className={[
                  'rounded-md px-2 py-0.5 text-[11px] font-medium transition-colors',
                  inSimulation && simView === v.id
                    ? 'bg-zinc-800 text-white'
                    : 'text-zinc-500 hover:text-zinc-200',
                ].join(' ')}
              >
                {v.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
