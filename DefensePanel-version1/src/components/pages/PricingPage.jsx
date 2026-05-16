import { Check } from 'lucide-react';
import MarketingLayout from '../MarketingLayout.jsx';

const PLAN = {
  name: 'Monthly Pro',
  trialBadge: '1st month free',
  price: '$29',
  period: '/ month after trial',
  description:
    'Get full access to Defense Panel with a free first month, then continue monthly.',
  features: [
    'First month free - no charge',
    'Unlimited simulation sessions',
    'All defense and startup pitch modes',
    'Full session history and replay',
    'Advanced analytics and filler-word tracking',
    'Priority avatar and panel slots',
  ],
  cta: 'Start free month',
};

export default function PricingPage({ onStartSimulation }) {
  return (
    <MarketingLayout>
      <div className="mx-auto max-w-5xl px-6 py-16 sm:py-20">
        <header className="mb-14 text-center">
          <p className="text-xs font-medium uppercase tracking-widest text-blue-400">
            Pricing
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            One simple monthly plan
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base text-zinc-400">
            Start with your first month free, then continue at a flat monthly
            rate with full features.
          </p>
        </header>

        <div className="mx-auto max-w-xl">
          <div className="flex flex-col rounded-2xl border border-blue-500/50 bg-zinc-900/60 p-8 backdrop-blur-sm shadow-[0_0_40px_rgba(37,99,235,0.15)]">
            <div className="flex items-start justify-between gap-4">
              <h2 className="text-xl font-semibold text-zinc-100">{PLAN.name}</h2>
              <span className="rounded-full border border-blue-400/50 bg-blue-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-blue-300">
                {PLAN.trialBadge}
              </span>
            </div>
            <p className="mt-2 text-sm text-zinc-400">{PLAN.description}</p>
            <p className="mt-6">
              <span className="text-4xl font-bold text-zinc-50">{PLAN.price}</span>
              <span className="text-sm text-zinc-500"> {PLAN.period}</span>
            </p>
            <ul className="mt-6 flex-1 space-y-3">
              {PLAN.features.map((feature) => (
                <li key={feature} className="flex gap-2 text-sm text-zinc-300">
                  <Check className="h-4 w-4 shrink-0 text-blue-500" aria-hidden />
                  {feature}
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={() => onStartSimulation?.()}
              className="mt-8 w-full rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white shadow-[0_0_15px_rgba(37,99,235,0.4)] transition-colors hover:bg-blue-500"
            >
              {PLAN.cta}
            </button>
          </div>
        </div>
      </div>
    </MarketingLayout>
  );
}
