import heroBackdrop from '../../pexels-mark-neal-201020-7806499.jpg';

export default function MarketingLayout({ children, className = '' }) {
  return (
    <div
      className={[
        'relative min-h-screen overflow-hidden bg-black font-sans text-zinc-50',
        className,
      ].join(' ')}
    >
      <div
        className="pointer-events-none absolute inset-0 bg-cover bg-[center_bottom] bg-no-repeat"
        style={{ backgroundImage: `url(${heroBackdrop})` }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/82 via-black/68 to-black/88"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:48px_48px]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -left-32 top-0 h-[420px] w-[420px] rounded-full bg-blue-600/12 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-24 bottom-0 h-[360px] w-[360px] rounded-full bg-cyan-500/10 blur-3xl"
        aria-hidden
      />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
