import { Briefcase, Cpu, GraduationCap, Target, Users } from 'lucide-react';
import MarketingLayout from '../MarketingLayout.jsx';

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

const VALUES = [
  {
    icon: Target,
    title: 'Pressure-tested delivery',
    text: 'Simulate real investor, examiner, and hiring panels before the stakes are real.',
  },
  {
    icon: Cpu,
    title: 'AI-native interrogation',
    text: 'Live avatars and analysis challenge weak claims the moment you make them.',
  },
  {
    icon: Users,
    title: 'Built for builders',
    text: 'Founders, researchers, and engineers rehearse high-stakes defense in one place.',
  },
];

export default function LandingPage({ onTry }) {
  return (
    <MarketingLayout>
      <div className="mx-auto max-w-5xl px-6 py-16 sm:py-20">
        <header className="mb-14 text-center">
          <p className="text-xs font-medium uppercase tracking-widest text-blue-400">
            The Defense Panel
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            Rehearse your pitch, viva, or technical defense
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base text-zinc-400">
            Upload context, face an AI panel in real time, and get a scored debrief
            so you walk into the real room prepared.
          </p>
          <button
            type="button"
            onClick={() => onTry?.()}
            className="mt-8 inline-flex items-center justify-center rounded-xl bg-blue-600 px-8 py-3 text-sm font-semibold text-white shadow-[0_0_15px_rgba(37,99,235,0.4)] transition-colors hover:bg-blue-500"
          >
            Try Defense Panel
          </button>
        </header>

        <section className="mb-16">
          <h2 className="mb-6 text-center text-sm font-semibold uppercase tracking-widest text-zinc-500">
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
                <p className="mt-2 text-sm leading-relaxed text-zinc-400">{text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-16">
          <h2 className="mb-6 text-center text-sm font-semibold uppercase tracking-widest text-zinc-500">
            Why use it
          </h2>
          <ul className="mx-auto max-w-2xl space-y-4 text-left text-sm text-zinc-300">
            {VALUES.map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex gap-3">
                <Icon className="mt-0.5 h-5 w-5 shrink-0 text-blue-500" aria-hidden />
                <span>
                  <span className="font-medium text-zinc-100">{title}. </span>
                  {text}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <footer className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-8 text-center">
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
      </div>
    </MarketingLayout>
  );
}
