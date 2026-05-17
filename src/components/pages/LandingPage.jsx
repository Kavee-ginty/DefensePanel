import { useCallback, useRef } from 'react';
import {
  Briefcase,
  Cpu,
  GraduationCap,
  Mic,
  Sparkles,
  Upload,
  Zap,
} from 'lucide-react';
import MarketingLayout from '../MarketingLayout.jsx';

const FEATURES = [
  {
    icon: Mic,
    title: 'Live AI panelists',
    text: 'Beyond Presence avatars ask sharp follow-ups, interrupt unclear answers, and keep the pressure on — like a real panel.',
  },
  {
    icon: Upload,
    title: 'Document-aware',
    text: 'Upload your deck, thesis, or CV so the simulation is grounded in your actual materials, not generic prompts.',
  },
  {
    icon: Zap,
    title: 'Instant debrief',
    text: 'Scores, filler words, and constructive feedback you can use before the real meeting.',
  },
];

const MODES = [
  {
    icon: Briefcase,
    title: 'Startup Pitch',
    text: 'Upload your deck and defend it against a skeptical investor panel.',
  },
  {
    icon: GraduationCap,
    title: 'Academic Viva',
    text: 'Walk through your thesis with examiner-style follow-ups and scoring.',
  },
  {
    icon: Cpu,
    title: 'Technical Interview',
    text: 'Whiteboard-style depth checks for staff-level and senior IC roles.',
  },
];

export default function LandingPage({ onTry, signedIn = false }) {
  const exploreRef = useRef(null);

  const scrollToModes = useCallback(() => {
    exploreRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  return (
    <MarketingLayout>
      <div className="mx-auto max-w-5xl px-6 py-16 sm:py-20">
        <header className="mb-14 text-center">
          <p className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-300">
            <Sparkles className="h-3.5 w-3.5" aria-hidden />
            AI-powered interview rehearsal
          </p>
          <h1 className="mt-6 text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
            Train under pressure. Perform when it counts.
          </h1>
          <p className="mx-auto mt-5 max-w-3xl text-base leading-relaxed text-zinc-400 sm:text-lg">
            The Defense Panel puts you in a high-stakes interrogation room with
            AI panelists — investors, examiners, and hiring managers — before the
            real panel ever sees your slides. Pick a simulation, upload context,
            and rehearse live: the panel reads your document, simulates the
            interview with real pressure, and leaves you with scores and
            constructive feedback you can act on before the real meeting.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => onTry?.()}
              className="inline-flex w-full items-center justify-center rounded-xl bg-blue-600 px-8 py-3 text-sm font-semibold text-white shadow-[0_0_20px_rgba(37,99,235,0.45)] transition-colors hover:bg-blue-500 sm:w-auto"
            >
              Start a simulation
            </button>
            <button
              type="button"
              onClick={scrollToModes}
              className="inline-flex w-full items-center justify-center rounded-xl border border-zinc-600 bg-transparent px-8 py-3 text-sm font-semibold text-zinc-100 transition-colors hover:border-zinc-500 sm:w-auto"
            >
              Explore modes
            </button>
          </div>
        </header>

        <section className="mb-16">
          <h2 className="sr-only">Features</h2>
          <div className="grid gap-6 sm:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title, text }) => (
              <div
                key={title}
                className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 backdrop-blur-sm"
              >
                <Icon className="mb-4 h-8 w-8 text-blue-500" aria-hidden />
                <h3 className="text-lg font-semibold text-zinc-100">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                  {text}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section
          id="explore-modes"
          ref={exploreRef}
          className="scroll-mt-24"
          aria-labelledby="explore-modes-heading"
        >
          <h2
            id="explore-modes-heading"
            className="mb-6 text-center text-sm font-semibold uppercase tracking-widest text-zinc-500"
          >
            Simulation modes
          </h2>
          <div className="grid gap-6 sm:grid-cols-3">
            {MODES.map(({ icon: Icon, title, text }) => (
              <div
                key={title}
                className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 backdrop-blur-sm"
              >
                <Icon className="mb-4 h-8 w-8 text-blue-500" aria-hidden />
                <h3 className="text-lg font-semibold text-zinc-100">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                  {text}
                </p>
              </div>
            ))}
          </div>
        </section>

        {!signedIn && (
          <footer className="mt-16 rounded-2xl border border-zinc-800 bg-zinc-900/30 p-8 text-center">
            <p className="text-sm text-zinc-400">
              Ready when you are — sign in and start your first session.
            </p>
            <button
              type="button"
              onClick={() => onTry?.()}
              className="mt-4 inline-flex items-center justify-center rounded-xl border border-zinc-600 bg-zinc-950 px-6 py-2.5 text-sm font-semibold text-zinc-100 transition-colors hover:border-zinc-500"
            >
              Try Defense Panel
            </button>
          </footer>
        )}
      </div>
    </MarketingLayout>
  );
}
