import TopNav from './TopNav.jsx';

export default function AppShell({
  children,
  activePage = 'home',
  userLabel = null,
  onNavigate,
  onSignOut,
  inSimulation = false,
  simView = null,
  onSimNavigate,
  showDevNav = false,
  contentClassName = '',
}) {
  const navOffset = showDevNav ? 'pt-[8.25rem]' : 'pt-[4.75rem]';

  return (
    <div className="min-h-screen bg-zinc-950">
      <TopNav
        activePage={activePage}
        userLabel={userLabel}
        onNavigate={onNavigate}
        onSignOut={onSignOut}
        inSimulation={inSimulation}
        simView={simView}
        onSimNavigate={onSimNavigate}
        showDevNav={showDevNav}
      />
      <main className={[navOffset, contentClassName].filter(Boolean).join(' ')}>
        {children}
      </main>
    </div>
  );
}
