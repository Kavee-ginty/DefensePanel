import { Cpu, Target, Users } from 'lucide-react';
import MarketingLayout from '../MarketingLayout.jsx';

const VALUES = [
  {
    icon: Target,
    title: 'Pressure-tested delivery',
    text: 'Simulate real investor, examiner, and hiring panels before the stakes are real.',
  },
  {
    icon: Cpu,
    title: 'AI-native interrogation',
    text: 'Beyond Presence avatars and live analysis challenge weak claims the moment you make them.',
  },
  {
    icon: Users,
    title: 'Built for builders',
    text: 'Founders, researchers, and engineers use one platform to rehearse high-stakes defense.',
  },
];

export default function AboutPage() {
  return (
    <MarketingLayout>
      <div className="mx-auto max-w-5xl px-6 py-16 sm:py-20">
        <header className="mb-14 max-w-2xl">
          <p className="text-xs font-medium uppercase tracking-widest text-blue-400">
            About us
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            The interrogation room for your next big moment
          </h1>
          <p className="mt-4 text-base leading-relaxed text-zinc-400">
            The Defense Panel is a high-fidelity rehearsal environment where you
            defend slides, papers, and resumes against AI panelists that interrupt,
            probe, and score your performance — so you walk into the real room
            prepared.
          </p>
        </header>

        <div className="mb-16 grid gap-6 sm:grid-cols-3">
          {VALUES.map(({ icon: Icon, title, text }) => (
            <div
              key={title}
              className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 backdrop-blur-sm"
            >
              <Icon className="mb-4 h-8 w-8 text-blue-500" aria-hidden />
              <h2 className="text-lg font-semibold text-zinc-100">{title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-zinc-400">{text}</p>
            </div>
          ))}
        </div>

        <section className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-8">
          <h2 className="text-xl font-semibold text-zinc-100">Our mission</h2>
          <p className="mt-3 text-sm leading-relaxed text-zinc-400">
            Public speaking under scrutiny is a skill, not a talent. We combine
            WebRTC presence, document-aware context, and adversarial AI questioning
            to turn nervous monologues into crisp, defensible narratives. Whether
            you are pitching a seed round, defending a thesis, or whiteboarding for
            a staff role, The Defense Panel gives you a safe place to fail fast and
            improve measurably session over session.
          </p>
          <p className="mt-4 text-sm leading-relaxed text-zinc-500">
            Stack: React, Vercel serverless APIs, Supabase, Beyond Presence
            avatars, and real-time session analytics — designed for hackathon speed
            and production scale.
          </p>
        </section>
      </div>
    </MarketingLayout>
  );
}
