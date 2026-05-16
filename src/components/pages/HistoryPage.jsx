import { Clock, Loader2 } from 'lucide-react';
import MarketingLayout from '../MarketingLayout.jsx';
import {
  formatDuration,
  formatScenarioLabel,
} from '../../lib/sessionUtils.js';

function formatDate(iso) {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

function scoreColor(score) {
  if (score >= 80) return 'text-green-400 border-green-500/30 bg-green-500/10';
  if (score >= 70) return 'text-amber-400 border-amber-500/30 bg-amber-500/10';
  return 'text-red-300 border-red-500/30 bg-red-500/10';
}

export default function HistoryPage({
  sessions = [],
  loading = false,
  error = null,
  onRetry,
  onOpenSession,
}) {
  return (
    <MarketingLayout>
      <div className="mx-auto max-w-5xl px-6 py-16 sm:py-20">
        <header className="mb-10 max-w-2xl">
          <p className="text-xs font-medium uppercase tracking-widest text-blue-400">
            History
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            Previous sessions
          </h1>
          <p className="mt-4 text-base text-zinc-400">
            Tap a session to open its full debrief — scores, feedback, and your
            progress chart.
          </p>
        </header>

        {loading && sessions.length === 0 && (
          <div className="flex items-center justify-center gap-2 py-16 text-zinc-400">
            <Loader2 className="h-6 w-6 animate-spin" aria-hidden />
            <span className="text-sm">Loading sessions…</span>
          </div>
        )}

        {error && !loading && sessions.length === 0 && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="mt-3 block text-xs font-medium text-blue-400 hover:text-blue-300"
              >
                Try again
              </button>
            )}
            <p className="mt-2 text-xs text-zinc-500">
              {import.meta.env.PROD
                ? 'Production uses /api routes. Set SUPABASE_URL, SUPABASE_ANON_KEY, and SUPABASE_SERVICE_ROLE_KEY on Vercel, then redeploy.'
                : 'Ensure pitch_sessions exists (run supabase/pitch_sessions.sql) and you are signed in. Local dev reads Supabase directly; set VITE_USE_API_SESSIONS=true only if you also run vercel dev.'}
            </p>
          </div>
        )}

        {!loading && !error && sessions.length === 0 && (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-6 py-12 text-center">
            <p className="text-sm font-medium text-zinc-300">No sessions yet</p>
            <p className="mt-2 text-xs text-zinc-500">
              Complete a simulation and end the session to see it here.
            </p>
          </div>
        )}

        {sessions.length > 0 && (
          <ul className="space-y-3">
            {loading && (
              <li className="flex justify-center py-2 text-xs text-zinc-500">
                <Loader2 className="mr-2 h-3 w-3 animate-spin" aria-hidden />
                Refreshing…
              </li>
            )}
            {sessions.map((session) => (
              <li key={session.id ?? session.created_at}>
                <button
                  type="button"
                  onClick={() => onOpenSession?.(session)}
                  className="flex w-full items-center gap-4 rounded-xl border border-zinc-800 bg-zinc-900/40 px-5 py-4 text-left backdrop-blur-sm transition-colors hover:border-zinc-600 hover:bg-zinc-900/70"
                >
                  <span
                    className={[
                      'flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border text-lg font-bold',
                      scoreColor(session.overall_score),
                    ].join(' ')}
                  >
                    {session.overall_score}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-zinc-100">
                      {formatScenarioLabel(session.scenario_type)}
                    </p>
                    <p className="mt-0.5 flex flex-wrap items-center gap-3 text-xs text-zinc-500">
                      <span>{formatDate(session.created_at)}</span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" aria-hidden />
                        {formatDuration(session.duration_seconds)}
                      </span>
                      <span>{session.filler_word_count} filler words</span>
                    </p>
                  </div>
                  <span className="text-xs font-medium text-blue-400">
                    View debrief
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </MarketingLayout>
  );
}
