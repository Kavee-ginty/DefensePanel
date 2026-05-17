import { LogOut, Shield } from 'lucide-react';

const MARKETING_LINKS = [
  { id: 'home', label: 'Home' },
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'about', label: 'About' },
  { id: 'contact', label: 'Contact' },
  { id: 'pricing', label: 'Pricing' },
  { id: 'history', label: 'History' },
];

export default function TopNav({
  activePage = 'home',
  userLabel = null,
  onNavigate,
  onSignOut,
  inSimulation = false,
}) {
  return (
    <header className="no-print fixed inset-x-0 top-0 z-50 border-b border-zinc-800/80 bg-zinc-950/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-4 sm:px-6">
        <button
          type="button"
          onClick={() => onNavigate?.('home')}
          className="flex items-center gap-2 text-lg font-bold tracking-tight text-zinc-50 transition-colors hover:text-white sm:text-xl"
        >
          <Shield className="h-5 w-5 text-blue-500" aria-hidden />
          Defense Panel
        </button>

        <nav className="flex flex-1 flex-wrap items-center gap-1 sm:gap-2" aria-label="Main">
          {MARKETING_LINKS.map((link) => (
            <button
              key={link.id}
              type="button"
              onClick={() => onNavigate?.(link.id)}
              className={[
                'rounded-lg px-3.5 py-2 text-sm font-medium transition-colors sm:text-base',
                activePage === link.id && !inSimulation
                  ? 'bg-zinc-800/90 text-white ring-1 ring-zinc-700'
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
              className="flex items-center gap-1.5 rounded-lg border border-zinc-800/80 px-3 py-2 text-xs font-medium text-zinc-400 transition-colors hover:border-zinc-600 hover:text-zinc-200"
            >
              <LogOut className="h-3.5 w-3.5" aria-hidden />
              Sign out
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
