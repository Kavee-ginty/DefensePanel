import Footer from './Footer.jsx';
import TopNav from './TopNav.jsx';

export default function AppShell({
  children,
  activePage = 'home',
  userLabel = null,
  onNavigate,
  onSignOut,
  inSimulation = false,
  contentClassName = '',
  hideFooter = false,
}) {
  const navOffset = 'pt-[4.75rem]';

  return (
    <div className="flex min-h-screen flex-col bg-zinc-950">
      <TopNav
        activePage={activePage}
        userLabel={userLabel}
        onNavigate={onNavigate}
        onSignOut={onSignOut}
        inSimulation={inSimulation}
      />
      <main
        className={['flex-1', navOffset, contentClassName]
          .filter(Boolean)
          .join(' ')}
      >
        {children}
      </main>
      {!hideFooter && <Footer />}
    </div>
  );
}
