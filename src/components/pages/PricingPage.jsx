import { useState } from 'react';
import { Check } from 'lucide-react';
import toast from 'react-hot-toast';
import MarketingLayout from '../MarketingLayout.jsx';
import { useAuth } from '../../context/AuthContext.jsx';

const RAW_VITE_DODO = (import.meta.env.VITE_DODO_API_URL || '').trim();

function isLoopbackAbsoluteUrl(base) {
  if (!base || !/^https?:\/\//i.test(base)) return false;
  try {
    const h = new URL(base).hostname;
    return h === 'localhost' || h === '127.0.0.1' || h === '[::1]';
  } catch {
    return false;
  }
}

const STRIP_LOCALHOST_DODO =
  import.meta.env.PROD && isLoopbackAbsoluteUrl(RAW_VITE_DODO);
const EFFECTIVE_DODO_BASE = STRIP_LOCALHOST_DODO ? '' : RAW_VITE_DODO;
const CHECKOUT_URL = EFFECTIVE_DODO_BASE
  ? `${EFFECTIVE_DODO_BASE.replace(/\/$/, '')}/api/create-checkout`
  : '/api/create-checkout';

const TIERS = [
  {
    name: 'Starter',
    price: 'Free',
    period: 'during beta',
    description: 'Perfect for solo founders rehearsing a pitch.',
    features: [
      '3 sessions per month',
      'Startup Pitch mode',
      'Basic debrief scores',
      'PDF upload',
    ],
    cta: 'Start free',
    highlighted: false,
  },
  {
    name: 'Pro',
    price: '$29',
    period: '/ month',
    description: 'For serious candidates and repeat defenders.',
    features: [
      'Unlimited sessions',
      'All simulation modes',
      'Full session history',
      'Filler-word analytics',
      'Priority avatar slots',
    ],
    cta: 'Upgrade to Pro',
    highlighted: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    description: 'Universities, accelerators, and hiring teams.',
    features: [
      'SSO & team workspaces',
      'Custom panel personas',
      'API & LMS integrations',
      'Dedicated success manager',
      'SLA & on-prem options',
    ],
    cta: 'Contact sales',
    highlighted: false,
  },
];

export default function PricingPage({ onStartSimulation }) {
  const { user } = useAuth();
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  async function handleProCheckout(userEmail) {
    const email = typeof userEmail === 'string' ? userEmail.trim() : '';
    if (!email) {
      toast.error('Could not read your email. Try signing in again.');
      return;
    }

    setCheckoutLoading(true);
    try {
      // #region agent log
      fetch('http://127.0.0.1:7742/ingest/2bd9f6ad-4e83-4685-9ef2-80979e0b09d5', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Debug-Session-Id': 'b5b729',
        },
        body: JSON.stringify({
          sessionId: 'b5b729',
          runId: 'post-fix',
          hypothesisId: 'H1,H3,H5',
          location: 'PricingPage.jsx:handleProCheckout:beforeFetch',
          message: 'checkout fetch start',
          data: {
            checkoutUrl: CHECKOUT_URL,
            checkoutUrlLength: CHECKOUT_URL.length,
            viteDodoSet: Boolean(import.meta.env.VITE_DODO_API_URL),
            stripLocalhostInProd: STRIP_LOCALHOST_DODO,
            origin:
              typeof window !== 'undefined' ? window.location?.origin : null,
            isAbsolute:
              typeof CHECKOUT_URL === 'string' && /^https?:\/\//i.test(CHECKOUT_URL),
          },
          timestamp: Date.now(),
        }),
      }).catch(() => {});
      // #endregion

      const res = await fetch(CHECKOUT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userEmail: email }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.checkout_url) {
        const msg =
          typeof data.error === 'string'
            ? data.error
            : data.error?.message || 'Checkout failed';
        throw new Error(msg);
      }
      window.location.href = data.checkout_url;
    } catch (err) {
      // #region agent log
      fetch('http://127.0.0.1:7742/ingest/2bd9f6ad-4e83-4685-9ef2-80979e0b09d5', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Debug-Session-Id': 'b5b729',
        },
        body: JSON.stringify({
          sessionId: 'b5b729',
          runId: 'checkout-debug',
          hypothesisId: 'H2,H3,H4',
          location: 'PricingPage.jsx:handleProCheckout:catch',
          message: 'checkout error',
          runId: 'post-fix',
          data: {
            name: err?.name,
            message: err?.message,
            checkoutUrl: CHECKOUT_URL,
          },
          timestamp: Date.now(),
        }),
      }).catch(() => {});
      // #endregion
      console.error('[PricingPage] checkout', err);
      toast.error(err?.message || 'Could not start checkout');
    } finally {
      setCheckoutLoading(false);
    }
  }

  return (
    <MarketingLayout>
      <div className="mx-auto max-w-5xl px-6 py-16 sm:py-20">
        <header className="mb-14 text-center">
          <p className="text-xs font-medium uppercase tracking-widest text-blue-400">
            Pricing
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            Plans for every stage of defense
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base text-zinc-400">
            Start rehearsing for free. Upgrade when you need unlimited runs,
            history, and deeper analytics.
          </p>
        </header>

        <div className="grid gap-6 md:grid-cols-3">
          {TIERS.map((tier) => (
            <div
              key={tier.name}
              className={[
                'flex flex-col rounded-2xl border p-6 backdrop-blur-sm',
                tier.highlighted
                  ? 'border-blue-500/50 bg-zinc-900/60 shadow-[0_0_40px_rgba(37,99,235,0.15)]'
                  : 'border-zinc-800 bg-zinc-900/40',
              ].join(' ')}
            >
              <h2 className="text-lg font-semibold text-zinc-100">{tier.name}</h2>
              <p className="mt-1 text-sm text-zinc-500">{tier.description}</p>
              <p className="mt-6">
                <span className="text-3xl font-bold text-zinc-50">{tier.price}</span>
                {tier.period && (
                  <span className="text-sm text-zinc-500">{tier.period}</span>
                )}
              </p>
              <ul className="mt-6 flex-1 space-y-3">
                {tier.features.map((f) => (
                  <li key={f} className="flex gap-2 text-sm text-zinc-300">
                    <Check className="h-4 w-4 shrink-0 text-blue-500" aria-hidden />
                    {f}
                  </li>
                ))}
              </ul>
              <button
                type="button"
                disabled={tier.name === 'Pro' && checkoutLoading}
                onClick={() => {
                  if (tier.name === 'Pro') {
                    void handleProCheckout(user?.email);
                  } else {
                    onStartSimulation?.();
                  }
                }}
                className={[
                  'mt-8 w-full rounded-xl py-3 text-sm font-semibold transition-colors',
                  tier.highlighted
                    ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)] hover:bg-blue-500'
                    : 'border border-zinc-700 bg-zinc-950 text-zinc-200 hover:border-zinc-500',
                  tier.name === 'Pro' && checkoutLoading ? 'opacity-70' : '',
                ].join(' ')}
              >
                {tier.cta}
              </button>
            </div>
          ))}
        </div>
      </div>
    </MarketingLayout>
  );
}
