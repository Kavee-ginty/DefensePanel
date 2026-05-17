import { Mail, MapPin, MessageSquare } from 'lucide-react';
import MarketingLayout from '../MarketingLayout.jsx';

export default function ContactPage() {
  return (
    <MarketingLayout>
      <div className="mx-auto max-w-5xl px-6 py-16 sm:py-20">
        <header className="mb-12 max-w-2xl">
          <p className="text-xs font-medium uppercase tracking-widest text-blue-400">
            Contact
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            Talk to the team
          </h1>
          <p className="mt-4 text-base text-zinc-400">
            Questions about enterprise pilots, university licenses, or press?
            Reach out — we respond within one business day during the beta.
          </p>
        </header>

        <div className="grid gap-10 lg:grid-cols-2">
          <div className="space-y-6">
            <div className="flex gap-4 rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">
              <Mail className="h-5 w-5 shrink-0 text-blue-500" aria-hidden />
              <div>
                <p className="text-sm font-medium text-zinc-200">Email</p>
                <p className="mt-1 text-sm text-zinc-400">kaveeshaginodh1@gmail.com</p>
              </div>
            </div>
            <div className="flex gap-4 rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">
              <MapPin className="h-5 w-5 shrink-0 text-blue-500" aria-hidden />
              <div>
                <p className="text-sm font-medium text-zinc-200">HQ</p>
                <p className="mt-1 text-sm text-zinc-400">
                  34, Anandarama Road, Molpe, Moratuwa
                </p>
              </div>
            </div>
            <div className="flex gap-4 rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">
              <MessageSquare className="h-5 w-5 shrink-0 text-blue-500" aria-hidden />
              <div>
                <p className="text-sm font-medium text-zinc-200">Support</p>
                <p className="mt-1 text-sm text-zinc-400">
                  In-app session history and debrief exports for Pro users.
                </p>
              </div>
            </div>
          </div>

          <form
            className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 backdrop-blur-sm"
            onSubmit={(e) => e.preventDefault()}
          >
            <h2 className="mb-4 text-lg font-semibold text-zinc-100">
              Send a message
            </h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="contact-name" className="mb-1 block text-xs text-zinc-500">
                  Name
                </label>
                <input
                  id="contact-name"
                  type="text"
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-950/80 px-4 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  placeholder="Your name"
                />
              </div>
              <div>
                <label htmlFor="contact-email" className="mb-1 block text-xs text-zinc-500">
                  Email
                </label>
                <input
                  id="contact-email"
                  type="email"
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-950/80 px-4 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  placeholder="you@company.com"
                />
              </div>
              <div>
                <label htmlFor="contact-message" className="mb-1 block text-xs text-zinc-500">
                  Message
                </label>
                <textarea
                  id="contact-message"
                  rows={4}
                  className="w-full resize-none rounded-xl border border-zinc-800 bg-zinc-950/80 px-4 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  placeholder="How can we help?"
                />
              </div>
              <button
                type="submit"
                className="w-full rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white shadow-[0_0_15px_rgba(37,99,235,0.4)] transition-colors hover:bg-blue-500"
              >
                Send message
              </button>
              <p className="text-center text-xs text-zinc-600">
                Demo form — messages are not sent in this MVP build.
              </p>
            </div>
          </form>
        </div>
      </div>
    </MarketingLayout>
  );
}
